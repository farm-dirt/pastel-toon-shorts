// pastel-toon-shorts — character rig (Canvas 2D, deterministic)
// drawCharacter(ctx, charId, x, y, heightPx, pose)
//   x,y = point between the feet (ground contact). heightPx = full standing height.
// Style rules: thick even INK outline, flat fills, big head, thin limbs, dot pupils in big whites.
(function (G) {
  const INK = '#2b1d1a';

  // ---------- ORIGINAL CAST ----------
  const CAST = {
    toby: { // lead: tall, lanky, lightbulb head, orange tuft
      name: 'Toby Tuft', rel: 1.0,
      head: 0.30, headW: 0.74, headTop: 1.0, headBot: 0.80, headSq: 2.3,
      leg: 0.37, shoulder: 0.17, hip: 0.14, limb: 0.024, ear: 0.20,
      skin: '#f7d3b2', blush: '#f2a48c', hair: { type: 'tuft', color: '#f08a3c' },
      nose: { type: 'round', size: 0.17 },
      top: { type: 'sweater', color: '#e9b33b', trim: '#ffffff' },
      bottom: '#3d8c88', shoe: '#5a3a2a',
    },
    nan: { // tiny round granny, bun, round glasses, bell cardigan
      name: 'Nan Marigold', rel: 0.62,
      head: 0.37, headW: 0.98, headTop: 0.95, headBot: 1.0, headSq: 2.0,
      leg: 0.20, shoulder: 0.20, hip: 0.36, limb: 0.034, ear: 0.17,
      skin: '#f3c9a8', blush: '#ee9a86', hair: { type: 'bun', color: '#d9d6e6' },
      nose: { type: 'button', size: 0.12 }, glasses: '#9a5a3a',
      top: { type: 'cardigan', color: '#8fc06a', trim: '#f4e7c2' },
      bottom: '#c55a5a', shoe: '#6b3f62', skirt: true,
    },
    bramble: { // big boxy shopkeeper, flat-top, moustache, apron
      name: 'Mr. Bramble', rel: 0.96,
      head: 0.29, headW: 1.0, headTop: 0.88, headBot: 1.12, headSq: 3.6,
      leg: 0.29, shoulder: 0.36, hip: 0.28, limb: 0.034, ear: 0.15,
      skin: '#e3a882', blush: '#d98370', hair: { type: 'flattop', color: '#4a3226' },
      nose: { type: 'bulb', size: 0.20 }, moustache: '#4a3226',
      top: { type: 'apron', color: '#6aa6d8', trim: '#f6f1e4' },
      bottom: '#4b4f6b', shoe: '#2f2a2a',
    },
    pip: { // small kid, huge round head, cap, freckles
      name: 'Pip', rel: 0.55,
      head: 0.43, headW: 1.05, headTop: 1.0, headBot: 0.95, headSq: 2.2,
      leg: 0.24, shoulder: 0.15, hip: 0.16, limb: 0.034, ear: 0.17,
      skin: '#c98d62', blush: '#b8684e', hair: { type: 'cap', color: '#e2504a', tuft: '#2d2320' },
      nose: { type: 'button', size: 0.10 }, freckles: true,
      top: { type: 'tee', color: '#7a6fd1', trim: '#ffd65c' },
      bottom: '#e7d9b8', shoe: '#e2504a',
    },
  };

  // ---------- EXPRESSIONS ----------
  const FACES = {
    neutral: { brow: 'flat', mouth: 'line', eye: 1.0 },
    happy: { brow: 'up', mouth: 'smile', eye: 1.0 },
    grin: { brow: 'up', mouth: 'grin', eye: 0.9 },
    shock: { brow: 'high', mouth: 'O', eye: 1.25, pupil: 0.7 },
    angry: { brow: 'angry', mouth: 'frown', eye: 0.85 },
    worried: { brow: 'worried', mouth: 'wobble', eye: 1.05 },
    smug: { brow: 'smug', mouth: 'smirk', eye: 0.7, lid: 0.45 },
    talk: { brow: 'up', mouth: 'talk', eye: 1.0 },
    sleepy: { brow: 'flat', mouth: 'line', eye: 1.0, lid: 0.7 },
  };

  const DEF_POSE = {
    facing: 1, view: 'front', lean: 0, headTilt: 0, look: [0, 0], blink: 0,
    face: 'neutral', talk: 0, squash: 1,
    armL: [0.25, 0.15], armR: [0.25, 0.15], // [shoulder, elbow] radians, + = outward / forward
    walk: null, // walk phase in radians, null = standing
    legSpread: 0.06, hop: 0,
  };

  function lerp(a, b, t) { return a + (b - a) * t; }

  function headPath(ctx, w, h, top, bot, n) {
    ctx.beginPath();
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * h / 2;
      const k = lerp(top, bot, (y / h) + 0.5);
      const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w / 2 * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function fillStroke(ctx, fill, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  }

  function limb(ctx, pts, color, w, lw) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = INK; ctx.lineWidth = w + lw * 2; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }

  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2);
  }

  function drawCharacter(ctx, id, x, y, heightPx, poseIn) {
    const C = CAST[id]; if (!C) throw new Error('unknown character ' + id);
    const P = Object.assign({}, DEF_POSE, poseIn || {});
    const F = Object.assign({}, FACES[P.face] || FACES.neutral);
    const H = heightPx * C.rel;
    const lw = Math.max(2.5, heightPx * 0.0105);
    const side = P.view === 'side';
    const headH = C.head * H, headW = headH * C.headW;
    const legLen = C.leg * H;
    const torsoH = H - headH * 0.9 - legLen;
    const limbW = C.limb * H;

    const hands = {}; let headBox = null;
    ctx.save();
    ctx.translate(x, y - P.hop);
    ctx.scale(P.facing < 0 ? -1 : 1, 1);
    // squash & stretch around the feet
    ctx.scale(1 / Math.sqrt(P.squash), P.squash);

    // ---- legs ----
    const hipY = -legLen, hipX = C.hip * H * 0.28;
    const walk = P.walk;
    const legs = side ? [-1, 1] : [-1, 1];
    for (const sgn of legs) {
      let ang, knee;
      if (walk !== null && walk !== undefined) {
        const ph = walk + (sgn > 0 ? 0 : Math.PI);
        ang = 0.42 * Math.sin(ph);
        knee = Math.max(0, -Math.cos(ph)) * 0.55;
      } else { ang = sgn * P.legSpread * (side ? 0.3 : 1); knee = 0; }
      const hx = side ? sgn * hipX * 0.25 : sgn * hipX;
      const L1 = legLen * 0.52, L2 = legLen * 0.5;
      const kx = hx + Math.sin(ang) * L1, ky = hipY + Math.cos(ang) * L1;
      const a2 = ang - knee;
      const fx = kx + Math.sin(a2) * L2, fy = Math.min(-limbW * 0.3, ky + Math.cos(a2) * L2);
      limb(ctx, [[hx, hipY], [kx, ky], [fx, fy]], C.bottom, limbW, lw);
      // shoe
      const fdir = side ? 1 : sgn;
      ellipse(ctx, fx + fdir * limbW * 1.1, fy + limbW * 0.15, limbW * 1.9, limbW * 0.95, 0);
      fillStroke(ctx, C.shoe, lw);
    }

    // ---- body lean ----
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(P.lean);
    const shY = -torsoH;
    const sw = C.shoulder * H * (side ? 0.62 : 1), hw = C.hip * H * (side ? 0.7 : 1);

    const armPts = (sgn, arm) => {
      const sx = side ? sgn * sw * 0.15 : sgn * sw * 0.5;
      const L1 = Math.min(torsoH * 0.62, H * 0.2), L2 = Math.min(torsoH * 0.58, H * 0.19);
      const a1 = arm[0], a2 = arm[0] + arm[1];
      const dx = side ? 1 : sgn;
      const ex = sx + dx * Math.sin(a1) * L1, ey = shY + limbW * 0.6 + Math.cos(a1) * L1;
      const hx = ex + dx * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
      return [[sx, shY + limbW * 0.6], [ex, ey], [hx, hy]];
    };
    const sleeve = C.top.type === 'apron' ? '#f3efe6' : C.top.color;
    const drawArm = (sgn, arm) => {
      const p = armPts(sgn, arm);
      // record the hand position in CANVAS pixels so props can be held
      const m = ctx.getTransform(), hp = m.transformPoint(new DOMPoint(p[2][0], p[2][1]));
      // in side view sgn=+1 is the near arm (armR); in front view sgn=-1 is screen-left (armL)
      hands[sgn < 0 ? 'L' : 'R'] = [hp.x, hp.y];
      limb(ctx, p, sleeve, limbW, lw);
      ellipse(ctx, p[2][0], p[2][1], limbW * 1.05, limbW * 1.05, 0);
      fillStroke(ctx, C.skin, lw);
    };
    // far arm (side view) behind torso
    if (side) drawArm(-1, P.armL);

    // ---- torso ----
    ctx.beginPath();
    if (C.skirt) {
      ctx.moveTo(-sw / 2, shY + 4);
      ctx.quadraticCurveTo(-sw * 0.62, shY - torsoH * 0.02, -sw * 0.55, shY + torsoH * 0.2);
      ctx.quadraticCurveTo(-hw * 0.55, -torsoH * 0.15, -hw / 2, legLen * 0.15);
      ctx.lineTo(hw / 2, legLen * 0.15);
      ctx.quadraticCurveTo(hw * 0.55, -torsoH * 0.15, sw * 0.55, shY + torsoH * 0.2);
      ctx.quadraticCurveTo(sw * 0.62, shY - torsoH * 0.02, sw / 2, shY + 4);
    } else {
      const r = Math.min(sw, torsoH) * 0.28;
      ctx.moveTo(-sw / 2 + r, shY);
      ctx.lineTo(sw / 2 - r, shY);
      ctx.quadraticCurveTo(sw / 2, shY, sw / 2, shY + r);
      ctx.lineTo(hw / 2, -2);
      ctx.quadraticCurveTo(hw / 2, 6, hw / 2 - r * 0.6, 6);
      ctx.lineTo(-hw / 2 + r * 0.6, 6);
      ctx.quadraticCurveTo(-hw / 2, 6, -hw / 2, -2);
      ctx.lineTo(-sw / 2, shY + r);
      ctx.quadraticCurveTo(-sw / 2, shY, -sw / 2 + r, shY);
    }
    ctx.closePath();
    const torsoFill = C.top.type === 'apron' ? '#f3efe6' : C.top.color;
    fillStroke(ctx, torsoFill, lw);
    // clothing details
    ctx.lineWidth = lw * 0.8; ctx.strokeStyle = INK;
    if (C.top.type === 'sweater') { // white collar points + ribbed hem
      const cx = side ? sw * 0.15 : 0;
      ctx.beginPath(); ctx.moveTo(cx - sw * 0.18, shY + 2); ctx.lineTo(cx, shY + torsoH * 0.2); ctx.lineTo(cx + sw * 0.18, shY + 2);
      ctx.closePath(); ctx.fillStyle = C.top.trim; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hw / 2 + 2, -torsoH * 0.1); ctx.lineTo(hw / 2 - 2, -torsoH * 0.1); ctx.stroke();
    } else if (C.top.type === 'cardigan') {
      ctx.beginPath(); ctx.moveTo(0, shY + 3); ctx.lineTo(0, legLen * 0.12); ctx.stroke();
      ctx.fillStyle = C.top.trim;
      for (let i = 0; i < 3; i++) { ellipse(ctx, side ? sw * 0.2 : 0, shY + torsoH * (0.25 + i * 0.22), lw * 1.3, lw * 1.3); ctx.fill(); ctx.stroke(); }
    } else if (C.top.type === 'apron') {
      ctx.beginPath();
      const ax = side ? sw * 0.1 : 0;
      ctx.rect(ax - sw * 0.3, shY + torsoH * 0.18, sw * 0.6, torsoH * 0.86);
      ctx.fillStyle = C.top.color; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(ax - sw * 0.14, shY + torsoH * 0.45, sw * 0.28, torsoH * 0.18); ctx.stroke();
    } else if (C.top.type === 'tee') {
      ctx.fillStyle = C.top.trim;
      ctx.beginPath(); ctx.rect(-hw / 2 + 1, shY + torsoH * 0.45, hw - 2, torsoH * 0.14); ctx.fill(); ctx.stroke();
    }

    // ---- neck + head ----
    limb(ctx, [[side ? sw * 0.05 : 0, shY + 2], [side ? sw * 0.05 : 0, shY - headH * 0.12]], C.skin, limbW * 1.25, lw);
    ctx.save();
    const neckY = shY - headH * 0.06;
    ctx.translate(side ? sw * 0.05 : 0, neckY);
    ctx.rotate(P.headTilt);
    const hcY = -headH * 0.47;
    ctx.translate(0, hcY);
    { const m = ctx.getTransform(); const tp = m.transformPoint(new DOMPoint(0, -headH * 0.62)); const bp = m.transformPoint(new DOMPoint(0, headH * 0.5)); headBox = [tp.y, bp.y, m.transformPoint(new DOMPoint(0, 0)).x]; }
    drawHead(ctx, C, F, P, headW, headH, lw, side);
    ctx.restore();

    if (side) drawArm(1, P.armR); else { drawArm(-1, P.armL); drawArm(1, P.armR); }
    ctx.restore(); // lean
    ctx.restore();
    return { hands, headBox };
  }

  function drawHead(ctx, C, F, P, w, h, lw, side) {
    const fwd = side ? w * 0.2 : 0;
    // ears (behind head)
    const er = C.ear * h;
    const earSides = side ? [-1] : [-1, 1];
    for (const s of earSides) {
      const ex = side ? -w * 0.18 : s * w * 0.5 * lerp(C.headTop, C.headBot, 0.55);
      ellipse(ctx, ex, h * 0.04, er * 0.62, er, s * 0.15);
      fillStroke(ctx, C.skin, lw);
      ctx.beginPath(); ctx.arc(ex + (side ? 0 : s * er * 0.08), h * 0.05, er * 0.38, -1.2, 1.2); ctx.lineWidth = lw * 0.7; ctx.stroke();
    }
    // back hair (bun)
    const hr = C.hair;
    if (hr.type === 'bun') {
      ellipse(ctx, side ? -w * 0.3 : 0, -h * 0.55, h * 0.2, h * 0.17); fillStroke(ctx, hr.color, lw);
    }
    // skull
    headPath(ctx, w, h, C.headTop, C.headBot, C.headSq);
    fillStroke(ctx, C.skin, lw);

    // hair on top
    ctx.save();
    if (hr.type === 'tuft') {
      ctx.beginPath();
      const t = -h * 0.5, bx = side ? -w * 0.05 : 0;
      ctx.moveTo(bx - w * 0.36, t + h * 0.12);
      ctx.quadraticCurveTo(bx - w * 0.3, t - h * 0.12, bx - w * 0.12, t - h * 0.04);
      ctx.quadraticCurveTo(bx - w * 0.06, t - h * 0.3, bx + w * 0.08, t - h * 0.08);
      ctx.quadraticCurveTo(bx + w * 0.26, t - h * 0.26, bx + w * 0.22, t - h * 0.0);
      ctx.quadraticCurveTo(bx + w * 0.42, t - h * 0.06, bx + w * 0.36, t + h * 0.13);
      ctx.quadraticCurveTo(bx, t + h * 0.03, bx - w * 0.36, t + h * 0.12);
      ctx.closePath(); fillStroke(ctx, hr.color, lw);
    } else if (hr.type === 'bun') {
      ctx.beginPath();
      const t = -h * 0.5;
      ctx.moveTo(-w * 0.47, -h * 0.05);
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        const r = w * 0.5 * 1.02;
        ctx.quadraticCurveTo(Math.cos(a - 0.26) * r * 1.12, t * 0.72 + Math.sin(a - 0.26) * h * 0.32 * 1.12 + h * 0.08,
          Math.cos(a) * r, t * 0.72 + Math.sin(a) * h * 0.32 + h * 0.08);
      }
      ctx.quadraticCurveTo(w * 0.1, -h * 0.28, -w * 0.47, -h * 0.05);
      fillStroke(ctx, hr.color, lw);
    } else if (hr.type === 'flattop') {
      ctx.beginPath();
      ctx.moveTo(-w * 0.47, -h * 0.12);
      ctx.lineTo(-w * 0.46, -h * 0.44); ctx.quadraticCurveTo(-w * 0.45, -h * 0.56, -w * 0.3, -h * 0.56); ctx.lineTo(w * 0.3, -h * 0.56); ctx.quadraticCurveTo(w * 0.45, -h * 0.56, w * 0.46, -h * 0.44); ctx.lineTo(w * 0.47, -h * 0.12);
      ctx.quadraticCurveTo(w * 0.35, -h * 0.3, 0, -h * 0.3); ctx.quadraticCurveTo(-w * 0.35, -h * 0.3, -w * 0.47, -h * 0.12);
      ctx.closePath(); fillStroke(ctx, hr.color, lw);
    } else if (hr.type === 'cap') {
      // tufts
      ctx.beginPath(); ctx.moveTo(-w * 0.45, -h * 0.12); ctx.lineTo(-w * 0.55, -h * 0.02); ctx.lineTo(-w * 0.42, -h * 0.04); ctx.closePath();
      fillStroke(ctx, hr.tuft, lw);
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -h * 0.14);
      ctx.bezierCurveTo(-w * 0.5, -h * 0.62, w * 0.5, -h * 0.62, w * 0.48, -h * 0.14);
      ctx.closePath(); fillStroke(ctx, hr.color, lw);
      // brim
      const bd = side ? 1 : 0.6;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, -h * 0.17); ctx.quadraticCurveTo(w * (0.45 + bd * 0.25), -h * 0.24, w * (0.5 + bd * 0.3), -h * 0.1);
      ctx.quadraticCurveTo(w * 0.4, -h * 0.08, w * 0.05, -h * 0.13); ctx.closePath();
      fillStroke(ctx, hr.color, lw);
      ellipse(ctx, 0, -h * 0.47, w * 0.05, w * 0.03); fillStroke(ctx, hr.color, lw * 0.8);
    }
    ctx.restore();

    // ---- face ---- (side view: clip features to the skull so nothing floats outside)
    ctx.save();
    if (side) { headPath(ctx, w, h, C.headTop, C.headBot, C.headSq); ctx.clip(); }
    const eyeY = -h * 0.04 + (C.hair.type === 'cap' ? h * 0.03 : 0);
    const eyeR = h * 0.12 * F.eye;
    const gap = eyeR * 0.95;
    const lx = P.look[0], ly = P.look[1];
    const eyes = side ? [w * 0.2] : [-gap, gap]; // profile = ONE eye
    eyes.forEach((ex, i) => {
      const sc = side ? 1.08 : 1;
      const rx = eyeR * 0.82 * sc, ry = eyeR * 1.05 * sc;
      ellipse(ctx, ex, eyeY, rx, ry); fillStroke(ctx, '#ffffff', lw * 0.9);
      // pupil
      const pr = Math.max(lw * 0.9, eyeR * 0.2 * (F.pupil || 1));
      const px = ex + (side ? rx * 0.35 : 0) + lx * rx * 0.5, py = eyeY + ly * ry * 0.5;
      const lid = Math.max(F.lid || 0, P.blink);
      if (lid < 0.92) { ellipse(ctx, px, py + ry * lid * 0.3, pr, pr); ctx.fillStyle = INK; ctx.fill(); }
      if (lid > 0.02) { // eyelid
        ctx.save(); ellipse(ctx, ex, eyeY, rx, ry); ctx.clip();
        ctx.fillStyle = C.skin; ctx.fillRect(ex - rx - 2, eyeY - ry - 2, rx * 2 + 4, ry * 2 * lid + 2);
        ctx.beginPath(); ctx.moveTo(ex - rx, eyeY - ry + ry * 2 * lid); ctx.lineTo(ex + rx, eyeY - ry + ry * 2 * lid);
        ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
        ellipse(ctx, ex, eyeY, rx, ry); ctx.lineWidth = lw * 0.9; ctx.stroke();
      }
    });
    // glasses
    if (C.glasses) {
      ctx.lineWidth = lw * 1.1; ctx.strokeStyle = C.glasses;
      eyes.forEach((ex) => { ellipse(ctx, ex, eyeY, eyeR * 1.2, eyeR * 1.2); ctx.stroke(); });
      ctx.beginPath();
      if (side) { ctx.moveTo(eyes[0] - eyeR * 1.2, eyeY); ctx.lineTo(-w * 0.2, eyeY + h * 0.02); }
      else { ctx.moveTo(eyes[0] + eyeR * 1.2, eyeY); ctx.lineTo(eyes[1] - eyeR * 1.2, eyeY); }
      ctx.stroke();
      ctx.strokeStyle = INK;
    }
    ctx.restore(); ctx.save();
    if (side) { ctx.beginPath(); ctx.rect(-w, -h * 2, w * 3, h * 3); ctx.clip(); }
    // brows
    ctx.lineCap = 'round'; ctx.lineWidth = lw * 1.5; ctx.strokeStyle = INK;
    const by = eyeY - eyeR * 1.35;
    eyes.forEach((ex, i) => {
      const s = side ? -1 : (i === 0 ? -1 : 1); // side: front of face is +x, treat as inner end
      let a = 0, dy = 0;
      if (F.brow === 'up') dy = -eyeR * 0.15;
      if (F.brow === 'high') dy = -eyeR * 0.5;
      if (F.brow === 'angry') { a = 0.45 * s; dy = eyeR * 0.15; }
      if (F.brow === 'worried') { a = -0.4 * s; dy = -eyeR * 0.1; }
      if (F.brow === 'smug') { const up = side || i === 1; a = up ? -0.25 : 0.1; dy = up ? -eyeR * 0.3 : 0; }
      const bw = eyeR * 0.7;
      ctx.beginPath();
      ctx.moveTo(ex - bw * Math.cos(a), by + dy + bw * Math.sin(a) * (side ? 1 : 1));
      ctx.lineTo(ex + bw * Math.cos(a), by + dy - bw * Math.sin(a));
      ctx.stroke();
    });
    ctx.restore(); ctx.save();
    if (side) { headPath(ctx, w, h, C.headTop, C.headBot, C.headSq); ctx.clip(); }
    // cheeks/moustache/mouth are clipped in side view; nose drawn after so it can stick out
    const nx = side ? w * 0.5 * lerp(C.headTop, C.headBot, 0.62) : 0, ny = eyeY + h * 0.15;
    const ns = C.nose.size * h;
    // cheeks
    ctx.globalAlpha = 0.45; ctx.fillStyle = C.blush;
    (side ? [w * 0.12] : [-w * 0.3, w * 0.3]).forEach((cx) => { ellipse(ctx, cx, ny + h * 0.04, h * 0.07, h * 0.04); ctx.fill(); });
    ctx.globalAlpha = 1;
    if (C.freckles) {
      ctx.fillStyle = '#7a4a32';
      (side ? [w * 0.12] : [-w * 0.3, w * 0.3]).forEach((cx) => {
        for (let k = 0; k < 3; k++) { ellipse(ctx, cx - h * 0.04 + k * h * 0.04, ny + h * 0.01 + (k % 2) * h * 0.02, lw * 0.5, lw * 0.5); ctx.fill(); }
      });
    }
    // moustache
    if (C.moustache) {
      ctx.beginPath();
      const mx = side ? w * 0.3 : 0, my = ny + ns * 0.55;
      ctx.moveTo(mx - w * 0.22, my + h * 0.04);
      ctx.quadraticCurveTo(mx - w * 0.12, my - h * 0.05, mx, my);
      ctx.quadraticCurveTo(mx + w * 0.12, my - h * 0.05, mx + w * 0.22, my + h * 0.04);
      ctx.quadraticCurveTo(mx, my + h * 0.06, mx - w * 0.22, my + h * 0.04);
      fillStroke(ctx, C.moustache, lw);
    }
    // mouth
    const mx = side ? w * 0.26 : 0, my = ny + h * (C.moustache ? 0.2 : 0.16);
    const mw = w * 0.18;
    ctx.lineWidth = lw * 1.1; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    let m = F.mouth;
    const open = m === 'talk' ? P.talk : 0;
    if (m === 'talk' && open < 0.15) m = 'smile';
    ctx.beginPath();
    if (m === 'line') { ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke(); }
    else if (m === 'smile') { ctx.moveTo(mx - mw, my - h * 0.02); ctx.quadraticCurveTo(mx, my + h * 0.07, mx + mw, my - h * 0.02); ctx.stroke(); }
    else if (m === 'frown') { ctx.moveTo(mx - mw * 0.8, my + h * 0.03); ctx.quadraticCurveTo(mx, my - h * 0.04, mx + mw * 0.8, my + h * 0.03); ctx.stroke(); }
    else if (m === 'smirk') { ctx.moveTo(mx - mw * 0.6, my + h * 0.01); ctx.quadraticCurveTo(mx + mw * 0.3, my + h * 0.03, mx + mw, my - h * 0.04); ctx.stroke(); }
    else if (m === 'wobble') { ctx.moveTo(mx - mw, my); for (let i = 1; i <= 4; i++) ctx.lineTo(mx - mw + i * mw / 2, my + (i % 2 ? -1 : 1) * h * 0.015); ctx.stroke(); }
    else if (m === 'O') { ellipse(ctx, mx, my + h * 0.03, mw * 0.45, h * 0.07); fillStroke(ctx, '#5b2430', lw); }
    else if (m === 'grin') {
      ctx.moveTo(mx - mw * 1.2, my - h * 0.03); ctx.quadraticCurveTo(mx, my + h * 0.12, mx + mw * 1.2, my - h * 0.03); ctx.closePath();
      fillStroke(ctx, '#ffffff', lw);
      ctx.beginPath(); ctx.moveTo(mx - mw * 1.1, my - h * 0.01); ctx.lineTo(mx + mw * 1.1, my - h * 0.01); ctx.lineWidth = lw * 0.7; ctx.stroke();
    } else if (m === 'talk') {
      const oh = h * (0.03 + 0.08 * open);
      ctx.moveTo(mx - mw * 0.8, my - h * 0.01); ctx.quadraticCurveTo(mx, my + oh * 1.6, mx + mw * 0.8, my - h * 0.01); ctx.closePath();
      fillStroke(ctx, '#5b2430', lw);
    }
    ctx.restore();
    // nose last (sticks out of profile)
    if (C.nose.type === 'bulb') { ellipse(ctx, nx, ny, ns * 0.75, ns * 0.6); fillStroke(ctx, C.blush, lw); }
    else if (C.nose.type === 'round') { ellipse(ctx, nx, ny, ns * 0.55, ns * 0.5); fillStroke(ctx, C.skin, lw); }
    else { ellipse(ctx, nx, ny, ns * 0.5, ns * 0.42); fillStroke(ctx, C.blush, lw * 0.9); }
  }

  G.PT = G.PT || {};
  Object.assign(G.PT, { INK, CAST, FACES, drawCharacter, ellipse, fillStroke, limb });
})(typeof window !== 'undefined' ? window : globalThis);
