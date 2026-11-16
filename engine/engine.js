// pastel-toon-shorts — scene engine.  PT.renderFrame(ctx, project, t)
// 100% deterministic: the picture at time t depends only on (project, t).
// That is what lets the browser preview and the final MP4 render be identical,
// and lets the renderer split frames across parallel workers.
(function (G) {
  const PT = G.PT;
  const { W, H, GROUND } = PT;

  // ---------- easing ----------
  const EASE = {
    linear: (x) => x,
    inout: (x) => x * x * (3 - 2 * x),
    in: (x) => x * x * x,
    out: (x) => 1 - Math.pow(1 - x, 3),
    back: (x) => { const c = 1.9; x -= 1; return 1 + (c + 1) * x * x * x + c * x * x; }, // overshoot
    snap: (x) => (x < 1 ? 0 : 1),
    // damped spring: lands, overshoots ~12 % and settles (weight without state)
    spring: (x) => (1 - Math.exp(-6 * x) * Math.cos(9 * x)) / (1 - Math.exp(-6) * Math.cos(9)),
    // gentle anticipate + overshoot (~6 % each way): a wind-up before and a settle after
    backinout: (x) => { const c = 1.2 * 1.525; return x < 0.5 ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2 : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; },
  };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

  // Interpolate a list of keyframes [{t, ...props, ease}] at time t (seconds, scene-local).
  // Numbers and number-arrays glide; strings/bools switch at the key time.
  function sampleKeys(keys, t, base) {
    const out = Object.assign({}, base || {});
    if (!keys || !keys.length) return out;
    // carry forward discrete values
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    for (let k = 0; k <= i; k++) for (const p in keys[k]) if (p !== 't' && p !== 'ease') out[p] = keys[k][p];
    if (t < keys[0].t) { for (const p in keys[0]) if (p !== 't' && p !== 'ease') out[p] = keys[0][p]; return out; }
    const a = keys[i], b = keys[i + 1];
    if (!b || t <= a.t) return out;
    const e = EASE[b.ease || 'inout'] || EASE.inout;
    const u = e(clamp01((t - a.t) / Math.max(1e-6, b.t - a.t)));
    for (const p in b) {
      if (p === 't' || p === 'ease') continue;
      const va = p in out ? out[p] : b[p], vb = b[p];
      if (typeof vb === 'number' && typeof va === 'number') out[p] = lerp(va, vb, u);
      else if (Array.isArray(vb) && Array.isArray(va)) out[p] = vb.map((v, j) => (typeof v === 'number' ? lerp(va[j] ?? v, v, u) : v));
      // discrete values switch at b.t (already handled by carry-forward once t >= b.t)
    }
    return out;
  }

  // ---------- voice envelope (drives mouth flaps) ----------
  function envAt(project, t) {
    const env = project.timing && project.timing.env; if (!env) return 0;
    const fps = project.timing.envFps || 30;
    const f = t * fps, i = Math.floor(f), u = f - i;
    return lerp(env[i] || 0, env[i + 1] || 0, u);
  }

  // ---------- camera ----------
  function cameraAt(scene, lt, project) {
    const cam = sampleKeys(scene.camera, lt, { x: 540, y: 960, zoom: 1, roll: 0 });
    // settle-in: tiny 6% push that eases out in the first 0.25 s of every shot (adds life to cuts)
    if (scene.settle !== false) cam.zoom *= 1 + 0.06 * Math.pow(1 - clamp01(lt / 0.25), 2);
    // moving hold: a shot with no camera move slowly pushes in (2.5 % over the shot) so it never sits dead
    const sdur = (scene.end - scene.start) || 1;
    if ((!scene.camera || scene.camera.length <= 1) && scene.drift !== false && project.drift !== false)
      cam.zoom *= 1 + (scene.drift || 0.025) * EASE.inout(clamp01(lt / sdur));
    for (const fx of scene.fx || []) {
      const d = lt - fx.t; if (d < 0) continue;
      if (fx.type === 'shake') {          // trauma shake: amount = (1 - age)^2, smooth noise on x, y and roll
        const dur = fx.dur || 0.4; if (d >= dur) continue;
        const a = fx.amp || 45, tr = Math.pow(1 - d / dur, 2), f = d * 24;
        cam.x += a * tr * noise1(f, 1); cam.y += a * 0.75 * tr * noise1(f, 2); cam.roll = (cam.roll || 0) + 2.5 * tr * noise1(f, 3);
      } else if (fx.type === 'punch' && d < 0.7) {   // zoom punch: snap in, spring back
        cam.zoom *= 1 + (fx.amp || 0.15) * Math.exp(-10 * d) * Math.cos(25 * d);
      }
    }
    return cam;
  }
  function applyCamera(ctx, cam) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.rotate((cam.roll || 0) * Math.PI / 180);
    ctx.translate(-cam.x, -cam.y);
  }

  // ---------- motion helpers (all pure functions of time) ----------
  // smooth value noise in [-1, 1] (for shake / drift), deterministic per seed
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 17.13), hash(i + 1 + seed * 17.13), u) * 2 - 1;
  }
  // lid closure for one blink that started tau seconds ago (close 2f, hold 1f, open 4f at 30 fps; long = 3/2/5)
  function blinkShape(tau, long) {
    const c = long ? 0.1 : 0.067, h = long ? 0.067 : 0.033, o = long ? 0.167 : 0.133;
    if (tau < 0 || tau > c + h + o) return 0;
    if (tau < c) return tau / c;
    if (tau < c + h) return 1;
    return 1 - EASE.out((tau - c - h) / o);
  }
  // keys with "take" also set the face (take: "shock" = full take into the shock face)
  const PREP = new WeakMap();
  function prepKeys(actor) {
    const ks = actor.keys || [];
    if (PREP.has(ks)) return PREP.get(ks);
    const out = ks.map((k) => (k.take && k.take !== 'double' && !('face' in k) ? Object.assign({}, k, { face: k.take }) : k));
    PREP.set(ks, out);
    return out;
  }
  const BIG = { armL: 0.5, armR: 0.5, headTilt: 0.12, lean: 0.1 };
  const num = (v) => (Array.isArray(v) ? v[0] : v);
  // overshoot-and-settle after a big keyed change, plus a small wind-up before it (auto anticipation)
  function weight(keys, lt, ch) {
    let add = 0, prev;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]; if (!(ch in k)) continue;
      if (prev !== undefined) {
        const delta = num(k[ch]) - num(prev.v), D = k.t - prev.t;
        if (Math.abs(delta) > BIG[ch] && D >= 0.2 && k.ease !== 'snap') {
          const tau = lt - k.t;
          if (tau >= 0 && tau < 0.9) add += delta * 0.13 * Math.exp(-6 * tau) * Math.sin(13 * tau);   // follow-through
          const u = (lt - prev.t) / D;
          if (u > 0 && u < 0.28 && k.ease !== 'spring' && k.ease !== 'back' && k.ease !== 'backinout')
            add -= delta * 0.08 * Math.sin(Math.PI * u / 0.28);                                       // anticipation
        }
      }
      prev = { t: k.t, v: k[ch] };
    }
    return add;
  }
  // hop height + horizontal position of an actor at any scene-local time
  const posAt = (actor, keys, t) => { const s = sampleKeys(keys, t, actor); return [s.x ?? 540, s.hop || 0]; };
  // times (scene-local) when this actor lands from a hop
  function landings(keys) {
    const out = []; let ph = 0;
    for (const k of keys) { if ('hop' in k) { if (ph > 8 && k.hop <= 1) out.push(k.t); ph = k.hop; } }
    return out;
  }

  // ---------- actors ----------
  function actorPose(project, scene, actor, lt, gt, idx) {
    const seed = idx * 7.31 + (actor.who.length * 3.1);
    const keys = prepKeys(actor);
    const st = sampleKeys(keys, lt, Object.assign({ x: 540, y: GROUND + 60, h: 820 }, actor));
    const pose = {};
    for (const k of ['facing', 'view', 'lean', 'headTilt', 'look', 'face', 'squash', 'armL', 'armR', 'hop', 'legSpread']) if (k in st) pose[k] = st[k];
    const lively = actor.life !== false && project.life !== false;
    // ---- weight: anticipation + overshoot on big keyed moves ----
    if (lively) {
      for (const ch of ['headTilt', 'lean']) { const w = weight(keys, lt, ch); if (w) pose[ch] = (pose[ch] || 0) + w; }
      for (const ch of ['armL', 'armR']) {
        const w = weight(keys, lt, ch);
        if (w) { const a = pose[ch] || [0.25, 0.15]; pose[ch] = [a[0] + w, a[1] + w * 0.35]; }
      }
    }
    // ---- velocities (central differences of the pure keyed motion) ----
    const dt = 1 / 30, [x0, h0] = posAt(actor, keys, lt - dt), [x1, h1] = posAt(actor, keys, lt + dt);
    const vx = (x1 - x0) / (2 * dt), vy = (h1 - h0) / (2 * dt);
    // walking: leg phase from distance travelled (feet never skate)
    if (st.walk) {
      const xs = (keys[0] && keys[0].x) ?? st.x;
      pose.walk = Math.abs(st.x - xs) / (st.h * 0.075);
      pose.hop = (pose.hop || 0) + Math.abs(Math.sin(pose.walk)) * st.h * 0.012;
      pose.facing = pose.facing ?? (st.x >= xs ? 1 : -1);
      if (!pose.view) pose.view = 'side';
    }
    if (lively) {
      // ---- squash & stretch from the hop (stretch while flying, squash on landing) ----
      const stretch = 1 + Math.min(0.14, Math.abs(vy) / (st.h * 4));
      let sq = (pose.squash || 1) * stretch;
      for (const tl of landings(keys)) {
        const tau = lt - tl;
        if (tau >= 0 && tau < 0.45) sq *= 1 - 0.13 * Math.exp(-9 * tau) * Math.cos(14 * tau);
      }
      pose.squash = sq;
      // ---- drag / follow-through: body leans into horizontal moves, arms trail vertical ones ----
      const fac = pose.facing ?? 1;
      if (!st.walk) pose.lean = (pose.lean || 0) + Math.max(-0.12, Math.min(0.12, vx / 9000)) * fac;
      const armDrag = Math.max(-0.4, Math.min(0.4, -vy / 2600));
      if (armDrag) for (const ch of ['armL', 'armR']) { const a = pose[ch] || [0.25, 0.15]; pose[ch] = [a[0] + armDrag, a[1]]; }
      pose.drag = Math.max(-0.5, Math.min(0.5, -vx / 2600 * fac - vy / 3200));
    }
    // ---- reaction takes: wind-up squint -> accent pop -> settle ----
    for (const k of keys) {
      if (!k.take || !lively) continue;
      const d = lt - k.t;
      if (d > -0.17 && d < 0) {                         // anticipation: squash down, squint, dip the head
        const a = Math.sin((d + 0.17) / 0.17 * Math.PI / 2);
        pose.squash = (pose.squash || 1) * (1 - 0.07 * a);
        pose.squint = Math.max(pose.squint || 0, 0.45 * a);
        pose.headTilt = (pose.headTilt || 0) + 0.06 * a;
      } else if (d >= 0 && d < 0.7) {                   // accent + springy settle
        const e = Math.exp(-6 * d) * Math.cos(12 * d);
        pose.squash = (pose.squash || 1) * (1 + 0.11 * e);
        pose.hop = (pose.hop || 0) + Math.max(0, e) * st.h * 0.025;
        pose.eyeScale = (pose.eyeScale || 1) * (1 + 0.18 * Math.max(0, e));
        if (k.take === 'double' && d < 0.25) pose.headTilt = (pose.headTilt || 0) + 0.13 * Math.sin(d * 50);
      }
    }
    // ---- idle life: slow breathing + slow head drift (no fast sines -> no twitch) ----
    pose.squash = (pose.squash || 1) * (1 + 0.012 * Math.sin(gt * 2.1 + seed));
    pose.headTilt = (pose.headTilt || 0) + 0.035 * Math.sin(gt * 1.3 + seed);
    // ---- blinks: forced on expression/facing changes (hides the swap), hashed idle blinks, some doubles ----
    let blink = 0;
    if (lively) {
      let pf = keys[0] && keys[0].face, pfa = keys[0] && keys[0].facing, pv = keys[0] && keys[0].view;
      for (let i = 1; i < keys.length; i++) {
        const k = keys[i];
        if ('face' in k && k.face !== pf) { if (!k.take) blink = Math.max(blink, blinkShape(lt - (k.t - 0.1), true)); pf = k.face; }
        if (('facing' in k && k.facing !== pfa) || ('view' in k && k.view !== pv)) { blink = Math.max(blink, blinkShape(lt - (k.t - 0.03), false)); pfa = k.facing ?? pfa; pv = k.view ?? pv; }
      }
      const L = 3.2 + hash(seed) * 1.6, n = Math.floor(gt / L);
      for (const m of [n - 1, n]) {
        const tb = m * L + (0.15 + 0.7 * hash(seed + m * 1.37)) * L;
        blink = Math.max(blink, blinkShape(gt - tb, false));
        if (hash(seed * 3 + m) < 0.15) blink = Math.max(blink, blinkShape(gt - tb - 0.3, false));
      }
    } else {
      const period = 2.5 + hash(seed) * 2, ph = (gt + hash(seed + 1) * period) % period;
      blink = ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0;
    }
    pose.blink = blink;
    // ---- eye darts: quick 3-frame saccades between a few fixation points; the head follows a beat later ----
    if (lively && actor.darts !== false) {
      const Ld = 1.0 + hash(seed + 5) * 0.9, n = Math.floor(gt / Ld), u = EASE.out(clamp01((gt - n * Ld) / 0.1));
      const tgt = (m) => [(hash(seed + m * 2.71) - 0.5) * 0.45, (hash(seed + m * 5.19) - 0.5) * 0.18];
      const a = tgt(n - 1), b = tgt(n), look = pose.look || [0, 0];
      pose.look = [look[0] + lerp(a[0], b[0], u), look[1] + lerp(a[1], b[1], u)];
      const lag = sampleKeys(keys, lt - 0.1, actor).look;                 // eyes lead, head follows
      if (lag) pose.headTilt += 0.05 * (lag[0] || 0) * (pose.facing ?? 1);
    }
    // talking: mouth follows the voice envelope while this actor speaks (not used: narrator-only rule)
    const spk = (actor.speaks || []).some(([a, b]) => lt >= a && lt <= b);
    if (spk) {
      pose.talk = clamp01(envAt(project, gt) * 1.4);
      if (!st.face || st.face === 'neutral' || st.face === 'happy') pose.face = 'talk';
      pose.headTilt += 0.03 * pose.talk;
    }
    return { st, pose, vx, vy };
  }

  // ---------- props ----------
  const PROPS = {
    coin(ctx, s) { PT.ellipse(ctx, 0, 0, s * 0.5, s * 0.5); PT.fillStroke(ctx, '#ffcf4a', s * 0.06); PT.ellipse(ctx, 0, 0, s * 0.33, s * 0.33); ctx.lineWidth = s * 0.04; ctx.stroke(); },
    box(ctx, s) { ctx.beginPath(); ctx.rect(-s / 2, -s * 0.8, s, s * 0.8); PT.fillStroke(ctx, '#d9a86c', s * 0.035); ctx.beginPath(); ctx.moveTo(-s / 2, -s * 0.55); ctx.lineTo(s / 2, -s * 0.55); ctx.stroke(); },
    sign(ctx, s, p) {
      ctx.beginPath(); ctx.rect(-s * 0.04, -s * 1.1, s * 0.08, s * 1.1); PT.fillStroke(ctx, '#b98a5a', s * 0.03);
      ctx.beginPath(); ctx.rect(-s * 0.6, -s * 1.3, s * 1.2, s * 0.5); PT.fillStroke(ctx, '#fff6dc', s * 0.03);
      ctx.fillStyle = PT.INK; ctx.font = `${Math.round(s * 0.2)}px Cap, Poppins, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.text || '', 0, -s * 1.05);
    },
    bulb(ctx, s) { PT.ellipse(ctx, 0, -s * 0.2, s * 0.35, s * 0.38); PT.fillStroke(ctx, '#fff1a0', s * 0.05); ctx.beginPath(); ctx.rect(-s * 0.15, s * 0.12, s * 0.3, s * 0.18); PT.fillStroke(ctx, '#b9b9c9', s * 0.05); },
    heart(ctx, s) { ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.3, -s * 0.6, 0, -s * 0.25); ctx.bezierCurveTo(s * 0.3, -s * 0.6, s * 0.7, -s * 0.1, 0, s * 0.35); PT.fillStroke(ctx, '#ff7a8a', s * 0.05); },
    phone(ctx, s) { ctx.beginPath(); ctx.roundRect(-s * 0.25, -s * 0.45, s * 0.5, s * 0.9, s * 0.07); PT.fillStroke(ctx, '#3a3f5c', s * 0.04); ctx.beginPath(); ctx.rect(-s * 0.19, -s * 0.37, s * 0.38, s * 0.68); ctx.fillStyle = '#9fe0f0'; ctx.fill(); },
    chest(ctx, s) { ctx.beginPath(); ctx.rect(-s / 2, -s * 0.55, s, s * 0.55); PT.fillStroke(ctx, '#b06d3c', s * 0.035); ctx.beginPath(); ctx.moveTo(-s / 2, -s * 0.55); ctx.quadraticCurveTo(0, -s * 0.95, s / 2, -s * 0.55); PT.fillStroke(ctx, '#c9824a', s * 0.035); ctx.beginPath(); ctx.rect(-s * 0.08, -s * 0.5, s * 0.16, s * 0.18); PT.fillStroke(ctx, '#ffcf4a', s * 0.03); },
    cup(ctx, s) { ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.6); ctx.lineTo(s * 0.3, -s * 0.6); ctx.lineTo(s * 0.22, 0); ctx.lineTo(-s * 0.22, 0); ctx.closePath(); PT.fillStroke(ctx, '#ffffff', s * 0.04); ctx.beginPath(); ctx.arc(s * 0.33, -s * 0.35, s * 0.13, -1.4, 1.4); ctx.lineWidth = s * 0.05; ctx.stroke(); },
  };

  // ---------- FX (drawn in world space unless screen:true) ----------
  function drawFX(ctx, fx, d) {
    const p = clamp01(d / (fx.dur || 0.5));
    const s = fx.size || 120;
    ctx.save(); ctx.translate(fx.x || 540, fx.y || 900);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = PT.INK;
    if (fx.type === 'exclaim' || fx.type === 'question') {
      const k = EASE.back(clamp01(p * 3));
      ctx.scale(k, k); ctx.font = `${s}px Cap, Poppins, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = s * 0.12; ctx.strokeText(fx.type === 'exclaim' ? '!' : '?', 0, 0);
      ctx.fillStyle = fx.type === 'exclaim' ? '#ff6b5a' : '#5ab0ff'; ctx.fillText(fx.type === 'exclaim' ? '!' : '?', 0, 0);
    } else if (fx.type === 'sweat') {
      ctx.translate(0, p * s * 0.6); ctx.globalAlpha = 1 - p * 0.6;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.quadraticCurveTo(s * 0.2, 0, 0, s * 0.12); ctx.quadraticCurveTo(-s * 0.2, 0, 0, -s * 0.3);
      ctx.fillStyle = '#9fdcff'; ctx.fill(); ctx.lineWidth = s * 0.04; ctx.stroke();
    } else if (fx.type === 'sparkle') {
      for (let i = 0; i < 5; i++) {
        const a = i * 1.257 + 0.3, r = s * (0.3 + p * 0.7), k = Math.sin(Math.min(1, p * 1.2) * Math.PI) * s * 0.18;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        ctx.beginPath(); ctx.moveTo(x, y - k); ctx.lineTo(x + k * 0.3, y); ctx.lineTo(x, y + k); ctx.lineTo(x - k * 0.3, y); ctx.closePath();
        ctx.fillStyle = '#fff3a0'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      }
    } else if (fx.type === 'impact') {
      const k = EASE.out(clamp01(p * 2.5)); ctx.globalAlpha = 1 - clamp01((p - 0.5) * 2);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = (i % 2 ? 0.45 : 1) * s * k; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fillStyle = '#fff1a0'; ctx.fill(); ctx.lineWidth = s * 0.05; ctx.stroke();
    } else if (fx.type === 'puff') {
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 4; i++) { const x = (i - 1.5) * s * 0.35 * (1 + p), y = -p * s * 0.3; PT.ellipse(ctx, x, y, s * 0.2 * (1 + p), s * 0.16 * (1 + p)); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    } else if (fx.type === 'speedlines') {
      ctx.globalAlpha = 0.8 * Math.sin(p * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff';
      for (let i = 0; i < 9; i++) { const y = (i - 4) * s * 0.25, off = ((i * 53) % 90); ctx.beginPath(); ctx.moveTo(-s * 2 - off, y); ctx.lineTo(-s * 0.6 - off, y); ctx.stroke(); }
    } else if (fx.type === 'hearts') {
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate((i - 1) * s * 0.5, -p * s * (1 + i * 0.3)); ctx.globalAlpha = 1 - p; PROPS.heart(ctx, s * 0.5); ctx.restore(); }
    } else if (fx.type === 'dust' || fx.type === 'debris' || fx.type === 'confetti') {
      drawParticles(ctx, fx, d, s);
    } else if (fx.type === 'zzz') {
      ctx.font = `${s * 0.5}px Cap, Poppins, sans-serif`; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 8;
      for (let i = 0; i < 3; i++) { const q = (p * 1.5 + i / 3) % 1; ctx.globalAlpha = 1 - q; ctx.strokeText('z', q * s * 0.6, -q * s * 1.2); ctx.fillText('z', q * s * 0.6, -q * s * 1.2); }
    }
    ctx.restore();
  }

  // ---------- seeded particles: every particle is a pure function of (fx, i, age) ----------
  const CONFETTI = ['#ff6b5a', '#ffd23f', '#5ab0ff', '#7bd389', '#c08cff'];
  function drawParticles(ctx, fx, d, s) {
    const seed = fx.seed ?? Math.round((fx.t || 0) * 997), dur = fx.dur || 0.6, p = clamp01(d / dur);
    const n = fx.n || (fx.type === 'confetti' ? 40 : fx.type === 'debris' ? 12 : 10);
    for (let i = 0; i < n; i++) {
      const r1 = hash(seed + i * 1.17), r2 = hash(seed + i * 2.31), r3 = hash(seed + i * 3.77);
      ctx.save();
      if (fx.type === 'dust') {            // ground puff: sideways burst with drag, grows and fades
        const dir = (i % 2 ? 1 : -1), v = s * (2.2 + 2.8 * r1), k = 5;
        const x = dir * v / k * (1 - Math.exp(-k * d)), y = -s * (0.15 + 0.5 * r2) * (1 - Math.exp(-3 * d));
        const r = s * (0.1 + 0.14 * r3) * (1 + 1.6 * p);
        ctx.globalAlpha = 0.85 * (1 - p); PT.ellipse(ctx, x, y, r, r * 0.8); PT.fillStroke(ctx, fx.color || '#f1e9dc', 3);
      } else if (fx.type === 'debris') {   // chunks thrown up, gravity pulls them down, spinning
        const a = -Math.PI / 2 + (r1 - 0.5) * 2.2, v = s * (6 + 6 * r2), g = s * 22;
        const x = Math.cos(a) * v * d, y = Math.sin(a) * v * d + 0.5 * g * d * d, q = s * (0.07 + 0.08 * r3);
        ctx.globalAlpha = 1 - Math.max(0, p - 0.6) / 0.4; ctx.translate(x, y); ctx.rotate(d * (8 + 10 * r3) * (i % 2 ? 1 : -1));
        ctx.beginPath(); ctx.rect(-q, -q, q * 2, q * 1.6); PT.fillStroke(ctx, fx.color || '#a97c50', 3);
      } else {                             // confetti: burst up, then flutter down with a sway
        const a = -Math.PI / 2 + (r1 - 0.5) * 3.2, v = s * (9 + 7 * r2), k = 2.2;
        const x = Math.cos(a) * v / k * (1 - Math.exp(-k * d)) + Math.sin(d * 6 + i) * s * 0.15;
        const y = Math.sin(a) * v / k * (1 - Math.exp(-k * d)) + s * 2.2 * d * d;
        ctx.globalAlpha = 1 - Math.max(0, p - 0.7) / 0.3; ctx.translate(x, y); ctx.rotate(d * 9 * (r3 - 0.5));
        ctx.fillStyle = CONFETTI[i % CONFETTI.length]; ctx.beginPath(); ctx.rect(-s * 0.11, -s * 0.055, s * 0.22, s * 0.11);
        ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PT.INK; ctx.stroke();
      }
      ctx.restore();
    }
  }
  // ambient floating motes / fireflies for a whole scene (scene.ambient = 'motes' | 'fireflies')
  function drawAmbient(ctx, kind, gt) {
    const n = kind === 'fireflies' ? 18 : 26;
    for (let i = 0; i < n; i++) {
      const r1 = hash(i * 1.7 + 3), r2 = hash(i * 2.9 + 7), r3 = hash(i * 4.3 + 11);
      const x = ((r1 * W + gt * (12 + 20 * r2) * (i % 2 ? 1 : -1)) % W + W) % W;
      const y = 300 + r2 * 1300 + Math.sin(gt * (0.6 + r3) + i) * 40;
      const tw = kind === 'fireflies' ? 0.35 + 0.65 * Math.max(0, Math.sin(gt * (1.5 + r3 * 2) + i * 2)) : 0.35;
      ctx.save(); ctx.globalAlpha = tw;
      if (kind === 'fireflies') { ctx.fillStyle = 'rgba(255,240,140,0.35)'; PT.ellipse(ctx, x, y, 18, 18); ctx.fill(); ctx.fillStyle = '#fff6b0'; PT.ellipse(ctx, x, y, 6, 6); ctx.fill(); }
      else { ctx.fillStyle = '#ffffff'; PT.ellipse(ctx, x, y, 3 + 3 * r3, 3 + 3 * r3); ctx.fill(); }
      ctx.restore();
    }
  }
  // mood tints (multiply), eased in over the first moodIn seconds of the scene
  const MOODS = { dark: ['#7d78a8', 0.6], night: ['#6f7fb8', 0.5], cold: ['#a9c4e6', 0.45], warm: ['#ffcf9e', 0.35], danger: ['#e0767a', 0.45], eerie: ['#8fb39a', 0.45] };

  // ---------- one scene into ctx ----------
  function drawScene(ctx, project, scene, gt) {
    const lt = gt - scene.start;
    ctx.save();
    const cam = cameraAt(scene, lt, project);
    applyCamera(ctx, cam);
    PT.drawBG(ctx, scene.location, gt);
    if (project.custom && project.custom.bg && project.custom.bg[scene.location]) project.custom.bg[scene.location](ctx, gt, lt);
    if (scene.ambient) drawAmbient(ctx, scene.ambient, gt);
    // layers sorted by y so nearer things draw on top
    const items = [], held = [], handsOf = {};
    // hitstop: actors freeze for fx.dur while camera + fx keep running; the struck actor (fx.who) jitters
    let freeze = 0; const jit = {};
    for (const fx of scene.fx || []) {
      if (fx.type !== 'hitstop') continue;
      const d = lt - fx.t, dur = fx.dur || 0.15; if (d < 0) continue;
      freeze += Math.min(d, dur);
      if (fx.who && d < dur) jit[fx.who] = (fx.amp || 14) * (1 - d / dur) * (Math.floor(d * 30) % 2 ? 1 : -1);
    }
    const q = (t) => (project.twos ? Math.floor(t * 15 + 1e-6) / 15 : t);   // optional "on twos" for characters
    (scene.actors || []).forEach((a, i) => {
      const ltA = q(lt - freeze), gtA = q(gt - freeze);
      const r = actorPose(project, scene, a, ltA, gtA, i);
      if (jit[a.who]) r.st = Object.assign({}, r.st, { x: r.st.x + jit[a.who] });
      r.ghosts = [];
      if (Math.abs(r.vx) > 1400 && a.smear !== false && project.smear !== false)   // smear: two ghosts trail a fast move
        for (const back of [0.033, 0.066]) r.ghosts.push(actorPose(project, scene, a, ltA - back, gtA - back, i));
      items.push({ y: r.st.y, kind: 'actor', a, r, ltA });
    });
    (scene.props || []).forEach((p) => {
      const st = sampleKeys(p.keys, lt, p);
      if (st.hold) held.push({ p, st }); else items.push({ y: st.y ?? GROUND, kind: 'prop', p, st });
    });
    items.sort((A, B) => (A.z ?? A.y) - (B.z ?? B.y));
    for (const it of items) {
      if (it.kind === 'actor') {
        const { st, pose } = it.r;
        if (st.visible === false) continue;
        const relH = st.h * PT.CAST[it.a.who].rel;
        PT.shadow(ctx, st.x, st.y, relH * 0.16 / (1 + (pose.hop || 0) / (relH * 0.25)));   // contact shadow shrinks as they rise
        it.r.ghosts.forEach((g, gi) => { ctx.save(); ctx.globalAlpha = gi ? 0.13 : 0.26; PT.drawCharacter(ctx, it.a.who, g.st.x, g.st.y, g.st.h, g.pose); ctx.restore(); });
        const r = PT.drawCharacter(ctx, it.a.who, st.x, st.y, st.h, pose);
        if (it.a.dust !== false) for (const tl of landings(prepKeys(it.a))) {   // automatic dust puff on every landing
          const d = it.ltA - tl; if (d >= 0 && d < 0.5) drawFX(ctx, { type: 'dust', t: tl, dur: 0.5, x: st.x, y: st.y, size: relH * 0.12, seed: Math.round(tl * 131) }, d);
        }
        handsOf[it.a.who] = r.hands;
        if (r.headBox) PT._heads.push({ who: it.a.who, top: r.headBox[0], bottom: r.headBox[1], x: r.headBox[2] });
      } else {
        const st = it.st; if (st.visible === false) continue;
        const fn = PROPS[it.p.type] || (project.custom && project.custom.props && project.custom.props[it.p.type]);
        if (!fn) continue;
        ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.rot || 0); ctx.scale(st.scale || 1, st.scale || 1);
        fn(ctx, st.size || 100, st, lt); ctx.restore();
      }
    }
    // held props: drawn on top, glued to the actor's hand ("hold": "toby.R")
    for (const { p, st } of held) {
      if (st.visible === false) continue;
      const [who, hand] = String(st.hold).split('.');
      const hp = handsOf[who] && handsOf[who][hand || 'R']; if (!hp) continue;
      const fn = PROPS[p.type] || (project.custom && project.custom.props && project.custom.props[p.type]); if (!fn) continue;
      const m = ctx.getTransform(), zoom = Math.hypot(m.a, m.b);
      ctx.save(); ctx.setTransform(zoom, 0, 0, zoom, hp[0], hp[1]);
      ctx.translate(st.dx || 0, st.dy ?? -(st.size || 100) * 0.15); ctx.rotate(st.rot || 0); ctx.scale(st.scale || 1, st.scale || 1);
      fn(ctx, st.size || 100, st, lt); ctx.restore();
    }
    for (const fx of scene.fx || []) {
      if (fx.type === 'shake' || fx.type === 'flash' || fx.screen) continue;
      const d = lt - fx.t; if (d >= 0 && d <= (fx.dur || 0.5)) drawFX(ctx, fx, d);
    }
    ctx.restore();
    // screen-space fx
    // mood tint (multiply) eased in over moodIn seconds
    const mood = MOODS[scene.mood];
    if (mood) {
      const a = mood[1] * EASE.inout(clamp01(lt / (scene.moodIn ?? 0.6)));
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a; ctx.fillStyle = mood[0]; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    for (const fx of scene.fx || []) {
      const d = lt - fx.t, dur = fx.dur || 0.18;
      if (d < 0) continue;
      if (fx.type === 'flash' && d < dur) { ctx.fillStyle = `rgba(255,248,232,${0.85 * (1 - d / dur)})`; ctx.fillRect(0, 0, W, H); }
      else if (fx.type === 'impactframe' && d < (fx.dur || 0.067)) {   // 1-2 frame inverted frame on a big hit
        ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff4e0'; ctx.fillRect(0, 0, W, H); ctx.restore();
      } else if (fx.type === 'focuslines' && d < (fx.dur || 0.6)) {   // anime emphasis lines, re-drawn on twos
        const fdur = fx.dur || 0.6, k = Math.sin(Math.PI * clamp01(d / fdur)), sd = Math.floor(d * 15);
        const cx = fx.x ?? W / 2, cy = fx.y ?? H * 0.45, rin = fx.r || 430;
        ctx.save(); ctx.globalAlpha = 0.85 * k; ctx.fillStyle = fx.color || '#ffffff';
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * Math.PI * 2 + hash(sd * 31 + i) * 0.08, w = 0.006 + 0.012 * hash(sd * 7 + i * 3), r0 = rin * (1 + 0.35 * hash(sd + i * 5));
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a - w) * 2200, cy + Math.sin(a - w) * 2200); ctx.lineTo(cx + Math.cos(a + w) * 2200, cy + Math.sin(a + w) * 2200);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }
    // gentle vignette (keeps eyes centred)
    if (!drawScene._vig) {
      const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
      const v = c.getContext('2d'), g = v.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, H * 0.75);
      g.addColorStop(0, 'rgba(60,40,40,0)'); g.addColorStop(1, 'rgba(60,40,40,0.16)'); v.fillStyle = g; v.fillRect(0, 0, W, H);
      drawScene._vig = c;
    }
    ctx.drawImage(drawScene._vig, 0, 0);
  }

  // ---------- transitions ----------
  let OFF = null;
  function offscreen() {
    if (!OFF) OFF = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
    return OFF;
  }
  const TRANS = {
    whip(ctx, drawA, drawB, u) { // fast pan: old slides out left, new slides in from right
      const e = EASE.inout(u);
      ctx.save(); ctx.translate(-W * e, 0); drawA(ctx); ctx.restore();
      ctx.save(); ctx.translate(W * (1 - e), 0); drawB(ctx); ctx.restore();
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.55; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 26; i++) ctx.fillRect(0, (i * 197) % H, W, 5 + (i % 3) * 4);
      ctx.globalAlpha = 1;
    },
    iris(ctx, drawA, drawB, u) { // classic cartoon circle wipe: close on old, open on new
      if (u < 0.5) { drawA(ctx); const r = (1 - EASE.in(u * 2)) * H * 0.62; maskCircle(ctx, r); }
      else { drawB(ctx); const r = EASE.out((u - 0.5) * 2) * H * 0.62; maskCircle(ctx, r); }
    },
    pop(ctx, drawA, drawB, u) { // new scene punches in from 112% with a flash
      const k = 1 + 0.12 * (1 - EASE.out(u));
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2); drawB(ctx); ctx.restore();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - u)})`; ctx.fillRect(0, 0, W, H);
    },
    wipe(ctx, drawA, drawB, u) {
      drawA(ctx); const x = W * EASE.inout(u);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, x, H); ctx.clip(); drawB(ctx); ctx.restore();
      ctx.fillStyle = PT.INK; ctx.fillRect(x - 6, 0, 12, H);
    },
  };
  function maskCircle(ctx, r) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H * 0.45, Math.max(0, r), 0, Math.PI * 2, true);
    ctx.fillStyle = PT.INK; ctx.fill('evenodd'); ctx.restore();
  }

  // ---------- captions (top band, approved) ----------
  function drawCaption(ctx, project, t) {
    const caps = project.captions || []; if (project.showCaptions === false) return;
    const c = caps.find((c) => t >= c.s && t < c.e); if (!c) return;
    const y = project.captionY || 400;
    const age = t - c.s, k = 1;
    // words wrapped in *stars* are highlighted
    const words = c.text.split(/\s+/).filter(Boolean);
    let size = 92; ctx.font = `${size}px Cap, Poppins, sans-serif`;
    const plain = words.map((w) => w.replace(/\*/g, '')).join(' ');
    while (ctx.measureText(plain).width > 940 && size > 50) { size -= 4; ctx.font = `${size}px Cap, Poppins, sans-serif`; }
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(k, k);
    ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const space = ctx.measureText(' ').width;
    const widths = words.map((w) => ctx.measureText(w.replace(/\*/g, '')).width);
    let x = -(widths.reduce((a, b) => a + b, 0) + space * (words.length - 1)) / 2;
    words.forEach((w, i) => {
      const hl = /\*/.test(w), txt = w.replace(/\*/g, '');
      // each word pops in 0.06 s after the previous one (easeOutBack)
      const kw = EASE.back(clamp01((age - i * 0.06) / 0.14));
      if (kw > 0.01) {
        ctx.save(); ctx.translate(x + widths[i] / 2, 0); ctx.scale(kw, kw);
        ctx.lineWidth = size * 0.22; ctx.strokeStyle = PT.INK; ctx.strokeText(txt, -widths[i] / 2, 0);
        ctx.fillStyle = hl ? '#ffd23f' : '#ffffff'; ctx.fillText(txt, -widths[i] / 2, 0);
        ctx.restore();
      }
      x += widths[i] + space;
    });
    ctx.restore();
  }


  // ---------- silent subscribe CTA (project.cta = {s, e, tap, text}) ----------
  // A mid-video button that pops in, gets tapped by a cartoon hand and turns into SUBSCRIBED.
  // Never at the end: the ending must stay a clean loop back to frame 0.
  function drawCTA(ctx, c, t) {
    const lt = t - c.s, dur = c.e - c.s; if (lt < 0 || lt > dur) return;
    const k = lt < 0.25 ? EASE.back(clamp01(lt / 0.25)) : lt > dur - 0.2 ? 1 - clamp01((lt - (dur - 0.2)) / 0.2) : 1;
    const tap = c.tap ?? 0.9, done = lt >= tap, press = Math.abs(lt - tap) < 0.08 ? 0.92 : 1;
    const y = c.y || 1440, label = c.text || 'Subscribe for more';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, y); ctx.scale(k * press, k * press);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.font = '44px Cap, Poppins, sans-serif'; ctx.lineWidth = 12; ctx.strokeStyle = PT.INK; ctx.strokeText(label, 0, -105);
    ctx.fillStyle = '#ffffff'; ctx.fillText(label, 0, -105);
    const w = 470, h = 116;
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = done ? '#8a8a96' : '#e53935'; ctx.fill(); ctx.lineWidth = 9; ctx.stroke();
    ctx.font = '58px Cap, Poppins, sans-serif'; ctx.fillStyle = '#ffffff';
    ctx.fillText(done ? 'SUBSCRIBED' : 'SUBSCRIBE', done ? 0 : 30, 4);
    if (!done) { ctx.beginPath(); ctx.moveTo(-205, -24); ctx.lineTo(-163, 0); ctx.lineTo(-205, 24); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.restore();
    if (lt > 0.3 && lt < dur - 0.2) { // cartoon mitten hand taps the button
      const a = clamp01((lt - 0.3) / (tap - 0.3)), b = clamp01((lt - tap - 0.35) / 0.4);
      const hx = lt < tap ? 820 - 300 * EASE.back(a) : 520 + 300 * b;
      const hy = y + 120 - (lt < tap ? 70 * a : 70 * (1 - b));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      PT.limb(ctx, [[hx + 120, hy + 220], [hx + 10, hy + 30]], '#e9b33b', 30, 6);
      PT.ellipse(ctx, hx, hy, 38, 38); PT.fillStroke(ctx, '#f7d3b2', 6);
      PT.ellipse(ctx, hx - 22, hy - 40, 13, 28, -0.4); PT.fillStroke(ctx, '#f7d3b2', 5);
      ctx.restore();
    }
  }

  // ---------- public: one full frame ----------
  function sceneAt(project, t) {
    const S = project.scenes; let i = S.findIndex((s) => t >= s.start && t < s.end);
    if (i < 0) i = t < S[0].start ? 0 : S.length - 1;
    return i;
  }
  function renderFrame(ctx, project, t) {
    PT._heads = [];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const S = project.scenes, i = sceneAt(project, t), sc = S[i];
    const tr = sc.transition && sc.transition !== 'cut' && i > 0 ? sc.transition : null;
    const td = sc.transitionDur || (tr === 'iris' ? 0.5 : 0.3);
    if (tr && t - sc.start < td && TRANS[tr]) {
      const u = clamp01((t - sc.start) / td), prev = S[i - 1];
      const drawA = (c) => drawScene(c, project, prev, Math.min(t, prev.end - 1e-3));
      const drawB = (c) => drawScene(c, project, sc, t);
      TRANS[tr](ctx, drawA, drawB, u);
    } else drawScene(ctx, project, sc, t);
    drawCaption(ctx, project, t);
    if (project.cta) drawCTA(ctx, project.cta, t);
    ctx.restore();
  }

  // ---------- lint: find caption/face overlaps and faces cut off by the frame ----------
  const SAFE = { left: 48, right: 888, top: 180, caution: 1250, bottom: 1500 };
  const BANNED_SFX = ['wind', 'dark_click'];
  function lint(ctx, project, step) {
    step = step || 0.1; const issues = [], y = project.captionY || 400, dur = project.timing.dur;
    for (let t = 0; t < dur; t += step) {
      renderFrame(ctx, project, t);
      const cap = (project.captions || []).some((c) => t >= c.s && t < c.e) && project.showCaptions !== false;
      const sc = project.scenes[sceneAt(project, t)];
      for (const h of PT._heads) {
        if (h.x < -50 || h.x > W + 50 || h.bottom < 0 || h.top > H) continue; // fully off-screen (entering/leaving): fine
        if (cap && h.top < y + 70 && h.bottom > y - 70) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'caption covers face' });
        else if (h.top < 0 && h.bottom > 0) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'head cut off at top' });
        // YouTube Shorts safe box (SKILL.md): faces inside x 48-888, y 180-1500; y 1250-1500 is a caution strip
        const hw = (h.bottom - h.top) * 0.4;
        if (h.x + hw > SAFE.right) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'face under the YouTube buttons (right edge, x > 888)' });
        else if (h.x - hw < SAFE.left) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'face too close to the left edge (x < 48)' });
        if (h.top < SAFE.top && h.bottom > 0) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'face under the YouTube search bar (y < 180)' });
        if (h.bottom > SAFE.bottom && h.top < H) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'face inside bottom YouTube UI zone (y > 1500)' });
        else if (h.bottom > SAFE.caution && h.top < H) issues.push({ scene: sc.id, t: +t.toFixed(2), who: h.who, problem: 'face in the caution strip (y 1250-1500, long titles cover it)' });
      }
    }
    // project-level checks (no time range)
    const proj = (problem) => issues.push({ scene: '-', t: 0, who: 'project', problem });
    const c = project.cta;
    if (!c) proj('no subscribe CTA: add "cta": {"s", "e", "tap", "text"} at 45-60 % of the video');
    else {
      if (c.s < 3 || c.e > dur - 3) proj('CTA must not be in the first or last 3 s');
      if (c.s < 0.4 * dur || c.s > 0.65 * dur) proj(`CTA starts at ${c.s} s; put it at 45-60 % of ${dur.toFixed(1)} s`);
    }
    for (const cue of project.sfx || []) if (BANNED_SFX.includes(cue.name)) proj(`banned sound "${cue.name}" at ${cue.t} s (user rule): remove it`);
    // "no dead frames" (warning only): a keyed change (actor key, fx, camera key or cut) at least every 1.5 s
    for (const sc of project.scenes) {
      const ev = [0, sc.end - sc.start];
      for (const a of sc.actors || []) for (const k of a.keys || []) ev.push(k.t);
      for (const f of sc.fx || []) ev.push(f.t);
      for (const k of sc.camera || []) ev.push(k.t);
      ev.sort((a, b) => a - b);
      for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > 1.5) {
        issues.push({ scene: sc.id, t: +(sc.start + ev[i - 1]).toFixed(2), who: 'scene', problem: `nothing keyed for ${(ev[i] - ev[i - 1]).toFixed(1)} s (add a reaction, fx or camera key)`, warn: true });
        break;
      }
    }
    // merge consecutive samples
    const out = [];
    for (const i of issues) {
      const l = out[out.length - 1];
      if (l && l.scene === i.scene && l.who === i.who && l.problem === i.problem && i.t - l.to <= step * 1.5) l.to = i.t;
      else out.push({ scene: i.scene, who: i.who, problem: i.problem, from: i.t, to: i.t, warn: !!i.warn });
    }
    return out;
  }

  Object.assign(PT, { lint, EASE, sampleKeys, renderFrame, sceneAt, PROPS, drawFX, envAt });
})(typeof window !== 'undefined' ? window : globalThis);
