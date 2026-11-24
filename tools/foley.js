#!/usr/bin/env node
// Automatic foley: reads the shot plan and lists a sound for every visible action, timed to the frame.
// usage: node foley.js PROJECT_DIR            -> prints JSON cues on stdout (audio.py calls this itself)
//        node foley.js PROJECT_DIR --report   -> a readable list
// Every cue is {t, name, gain, pan, pitch, auto:true}. Sounds come from tools/sfxlib.py (all synthesized here,
// no downloads). It hears what the engine draws: footsteps on each foot plant (from the same walk phase the
// legs use), hop + landing, takes (eye-pop), big arm moves (cloth), turns (swish), fx, transitions, camera pushes.
// Pan follows the actor's position on SCREEN (after the camera), so a step on the left sounds on the left.
// Turn off per project with "foley": false; per actor "foley": false; tune with "mix": {"foley": 0.55}.
const fs = require('fs'), path = require('path'), vm = require('vm');
const P = path.resolve(process.argv[2]);
const ROOT = path.dirname(__dirname);
const ctx = { console, Math, JSON }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['characters.js', 'backgrounds.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'engine', f), 'utf8'), ctx, { filename: f });
const PT = ctx.PT;
const proj = JSON.parse(fs.readFileSync(path.join(P, 'project-files', 'project.json'), 'utf8'));
const tim = JSON.parse(fs.readFileSync(path.join(P, 'project-files', 'timing.json'), 'utf8'));
proj.timing = tim;
PT.setFlow(proj.flow);
const W = 1080, cues = [];
const small = { nan: true, pip: true };
let seedN = 1;
function add(t, name, gain, pan, extra) {
  if (t < 0 || t > tim.dur - 0.05) return;
  const pitch = ((Math.sin(++seedN * 12.9898) * 43758.5453) % 1) * 1.2;   // ±0.6 semitone: no two hits identical
  cues.push(Object.assign({ t: +t.toFixed(3), name, gain: +gain.toFixed(2), pan: +Math.max(-0.7, Math.min(0.7, pan || 0)).toFixed(2), pitch: +pitch.toFixed(2), auto: true }, extra || {}));
}
const scenes = proj.scenes;
// scene times may not be tiled yet (build_preview tiles them); do the same here
scenes[0].start = 0; scenes[scenes.length - 1].end = tim.dur;
function screenPan(sc, lt, wx) { const cam = PT.cameraAt(sc, lt, proj); return ((W / 2 + (wx - cam.x) * cam.zoom) - W / 2) / (W / 2); }

for (const sc of scenes) {
  const dur = sc.end - sc.start;
  if (proj.foley === false || sc.foley === false) continue;
  // ---- actors ----
  for (const a of sc.actors || []) {
    if (a.foley === false) continue;
    const keys = PT.prepKeys(a), tiny = !!small[a.who];
    const S = (t) => PT.sampleKeys(keys, t, Object.assign({ x: 540, h: 820 }, a));
    // footsteps: one per foot plant, using the exact walk phase the legs are drawn with
    const xs = (keys[0] && keys[0].x) ?? a.x ?? 540;
    let prevPh = null;
    for (let lt = 0; lt < dur; lt += 1 / 240) {
      const s = S(lt);
      if (!s.walk || s.visible === false) { prevPh = null; continue; }
      const ph = Math.abs(s.x - xs) / ((s.h || 820) * 0.075);
      const vx = (S(lt + 1 / 60).x - S(lt - 1 / 60).x) * 30;
      const stride = Math.min(1, Math.abs(vx) / ((s.h || 820) * 0.28));
      if (prevPh !== null && Math.floor((ph - Math.PI / 2) / Math.PI) !== Math.floor((prevPh - Math.PI / 2) / Math.PI) && stride > 0.12)   // heel strike = leg furthest forward
        add(sc.start + lt, tiny ? 'step_tiny' : 'step_soft', 0.42 + 0.3 * stride, screenPan(sc, lt, s.x));
      prevPh = ph;
    }
    // hops + landings
    let ph = 0, pk = null;
    for (const k of keys) {
      if ('hop' in k) {
        if (k.hop > 8 && ph <= 1 && !k.take) add(sc.start + (pk ? pk.t : k.t - 0.2), 'hop_up', 0.5, screenPan(sc, k.t, S(k.t).x));
        if (ph > 8 && k.hop <= 1) add(sc.start + k.t - 0.01, tiny ? 'land_tiny' : 'land', 0.7, screenPan(sc, k.t, S(k.t).x));
        ph = k.hop;
      }
      pk = k;
    }
    // takes, big arm moves, turns
    let prev = {};
    keys.forEach((k, i) => {
      const x = S(k.t).x, pan = screenPan(sc, k.t, x);
      if (k.take) add(sc.start + k.t, k.take === 'double' ? 'take_double' : 'take_pop', 0.75, pan);
      for (const ch of ['armL', 'armR']) {
        if (!(ch in k) || !(ch in prev) || k.take) continue;
        const d = Math.abs(k[ch][0] - prev[ch][0]);
        if (d > 0.8 && k.t - (prev[ch + 't'] ?? 0) >= 0.15) { add(sc.start + Math.max(0, prev[ch + 't'] ?? k.t - 0.25), 'cloth', 0.45, pan); break; }
      }
      if (i > 0 && (('facing' in k && k.facing !== prev.facing && prev.facing !== undefined) || ('view' in k && k.view !== prev.view && prev.view !== undefined)))
        add(sc.start + k.t - 0.04, 'swish_small', 0.35, pan);
      for (const p in k) if (p !== 't') { prev[p] = k[p]; prev[p + 't'] = k.t; }
    });
  }
  // ---- fx ----
  for (const f of sc.fx || []) {
    const pan = f.x !== undefined ? screenPan(sc, f.t, f.x) : 0, T = sc.start + f.t;
    const map = { exclaim: ['pop_in', 0.5], question: ['boop_q', 0.5], sparkle: ['twinkle', 0.5], hearts: ['twinkle', 0.4],
      puff: ['poof', 0.6], dust: ['poof', 0.45], impact: ['impact_soft', 0.8], debris: ['clatter', 0.6], confetti: ['twinkle', 0.5],
      speedlines: ['swish', 0.55], punch: ['swish', 0.45] };
    if (map[f.type]) add(T, map[f.type][0], map[f.type][1], pan, { fx: 1 });
    if (f.type === 'focuslines') add(T - 0.55, 'reveal_swell', 0.6, 0, { fx: 1 });
    // only a real hit gets a thump: strong (amp >= 25) and short (<= 0.8 s). Handheld wobble (many small
    // repeated shakes, e.g. POV shots) and long trembles stay silent.
    if (f.type === 'shake' && (f.amp ?? 45) >= 25 && (f.dur ?? 0.5) <= 0.8 && !(sc.fx || []).some((g) => (g.type === 'impact' || g.type === 'debris') && Math.abs(g.t - f.t) < 0.1))
      add(T, 'impact_soft', 0.5 * Math.min(1.4, (f.amp || 45) / 45), 0, { fx: 1 });
  }
  // ---- transitions ----
  const tmap = { whip: 'whip_air', pop: 'pop_in', iris: 'iris_bloop', wipe: 'swish' };
  if (sc.transition && tmap[sc.transition] && sc !== scenes[0]) add(sc.start - (sc.transition === 'whip' ? 0.08 : 0.02), tmap[sc.transition], 0.55, 0, { fx: 1 });
  // ---- camera: a big springy push gets a soft air swish ----
  const cam = sc.camera || [];
  for (let i = 1; i < cam.length; i++) {
    const dz = Math.abs((cam[i].zoom ?? 1) - (cam[i - 1].zoom ?? 1)), D = cam[i].t - cam[i - 1].t;
    if (dz > 0.2 && D < 1.2 && ['spring', 'back', 'backinout', 'out'].includes(cam[i].ease)) add(sc.start + cam[i - 1].t, 'swish', 0.3, 0, { fx: 1 });
  }
}
// fx/transition/camera sounds don't double up on the story's own cues (a hand-placed cue within 0.12 s wins);
// body foley (steps, takes, cloth, landings) always plays: it is the character, the story cue is the moment
const manual = (proj.sfx || []).map((c) => c.t);
const out = cues.filter((c) => !c.fx || !manual.some((m) => Math.abs(m - c.t) < 0.12)).map((c) => { delete c.fx; return c; }).sort((a, b) => a.t - b.t);
if (process.argv.includes('--report')) {
  for (const c of out) console.log(`${c.t.toFixed(2).padStart(6)} s  ${c.name.padEnd(13)} gain ${c.gain}  pan ${c.pan}`);
  console.log(`${out.length} automatic sounds`);
} else process.stdout.write(JSON.stringify(out));
