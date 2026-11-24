# Production guide — tech stack, audio, render, export, QA

## Why this stack (explain in plain words if asked)
- **One drawing engine** (`engine/*.js`, plain Canvas 2D) draws any moment `t` of the video.
- The **browser preview** plays that engine live with the audio → what you approve is exactly what renders.
- **render.js** opens the same page in the pre-installed headless Chromium (Playwright), asks for
  every frame at 30 fps, and pipes PNGs into **FFmpeg** → H.264 MP4. Frames are split across CPU workers.
- **Python + numpy** analyse the voice and synthesise music/SFX (no downloads, no copyright issues).
- Not used: Remotion (large install, own Chrome download; only worth it if the user wants a
  timeline editor), Whisper (model download is blocked; pause-based timing works without it).

## Voice-over → timing
`timing.py` finds pauses (≥ 0.18 s at −30 dB vs speech), maps each sentence to the real pauses
(the K−1 longest inner pauses for K sentences), spreads words by syllables and snaps them to energy
dips (±0.1 s), and writes a 30 fps loudness envelope for mouths. Abbreviations like "Mr." do not
end sentences. If the user's read has fewer clear pauses than sentences, it falls back to
syllable-proportional breaks — check the report and adjust captions by ear in the preview.

## Audio levels (user preference — the voice must always be clearly heard)
- Music bed: **8 % of the voice level while speaking** (−22 dB), 14 % in pauses ≥ 0.6 s, fades out at the end.
- SFX: peak at 35 % of the voice peak (`gain` per cue to adjust).
- Final: one linear gain to **−14 LUFS**, limiter → true peak ≤ −1 dBFS. Stereo 48 kHz, AAC 192k.
- Music "stops" (`music.stops`) duck the bed to 12 % for a gag/tension beat (never to zero), at most
  0.4 s (longer is capped), and fade back in over 0.15 s. Put something under it (`heartbeat`, a creak,
  `night_ambience` at low gain) and keep something moving on screen.
- Room tone (2 % of the voice level, `mix.roomTone`) runs under the whole mix, so no moment is ever
  digital silence. Dead air sounds like the video froze on a phone (Kumakatok short, Nov 2026: 0.5 s of
  total silence at 37 s, right before the payoff). `qa.py` fails any silence longer than 0.15 s.
- Available SFX: `python3 tools/audio.py --list`.
- **Custom sounds per short:** put WAV files in `<project>/assets/sfx/` (design them with numpy: a wail, a
  metallic ping, a creak). `audio.py` loads them for that short only, by file name; a name that clashes with
  the library is refused. Check each one by its waveform/spectrum and length before using it.

## Preview page
The preview loops at the end (like a Short), has a ⛶ Full screen button (double-click / F also work;
tap the video to play/pause in full screen), and its **Send notes to Claude** / **✓ Approve** buttons
save `{kind, text, title, at}` to the published page's db at `feedback/latest` (declare
`{db:{}, user:{}}` once after the first publish). Opened from disk or without db they fall back to
copying the text to the clipboard. The user then types "check" and Claude reads that document.

## Render & export
- Default: 1080×1920, 30 fps, H.264 High, CRF 16 medium, yuv420p, GOP 30, `+faststart`, AAC 192k.
- 30 fps is right for this style (flat cartoon, smooth camera). Use 24 fps only if the user wants
  a choppier "on twos" TV feel — ask first.
- Speed: ≈ 2.2 s render per 1 s of video on 2 CPUs (a 45 s short ≈ 100 s); smears and particles add a little on fast shots.
- Partial render for a moving check: `--from S --to S --out file.mp4`.

## Spot check before showing the preview (Claude looks, not the user)
```bash
NODE_PATH=$(npm root -g) node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://DIR/preview/index.html?render=1');await p.evaluate(()=>window.READY);const fs=require('fs');for(const t of [T1,T2,T3]){const u=await p.evaluate(t=>renderAt(t,'image/jpeg',0.8),t);fs.writeFileSync('/tmp/f'+t+'.jpg',Buffer.from(u.split(',')[1],'base64'))}await b.close()})()"
```
Tile them with ffmpeg `hstack` and Read the image. Look for: floating props, odd arm poses,
characters off their marks, faces near captions, empty frames.

## Project folder (created by `new_project.py`)
```
<slug>/
  script/        script.md, script.txt
  voice-over/    voice.mp3 (or .wav)
  characters/    model sheet PNG used
  assets/        extra images (rare — everything is drawn by code)
  scenes/        scene_XX.jpg stills + contact_sheet.jpg (from qa.py)
  audio/         mix.wav (final), mix.mp3 (preview)
  preview/       index.html (open offline) + artifact.html (published)
  final/         <slug>.mp4   ← the deliverable
  project-files/ project.json, timing.json, custom.js
  README.txt
```
Copy to the user's connected folder at the end (and the preview folder at Phase 7).

## QA (`qa.py`) — must all PASS
resolution, fps, frame count = round(dur×30), duration = voice ±0.1 s, H.264/yuv420p, AAC present,
−14 LUFS ±1.5, true peak ≤ −1 dBFS, no black frames, no frozen stretch > 1.5 s; plus eyeball
`scenes/contact_sheet.jpg` (consistency, readability, safe zones).


## Sound layers (Nov 2026 upgrade) — every short has five layers, quietest first
1. **Room tone** (automatic): never digital silence.
2. **Ambience** (automatic, `tools/sfxlib.py`): a quiet world under each scene by location — `night` = crickets
   + air, `park`/`street` = sparse birds + air, `shop`/`kitchen` = room air + soft clock, night scenes with mood
   dark/eerie/danger (or tone dark) = `eerie` (sparse far crickets + thin airy whistle). Two different takes
   left/right = wide stereo. Crossfades 0.25 s at cuts. Never a low drone (user rule).
   `snow` = winter outdoors (airy wind swells + faint snow hiss, no insects/birds: use it for any winter/snow scene,
   crickets in a snowy night sound fake). Custom location ids have no default bed: set `ambience` on those scenes.
   Scene `"ambience": "night"|"day"|"indoor"|"eerie"|"snow"|false`; project `"ambience": false`; level `mix.ambience` (0.07).
3. **Foley** (automatic, `tools/foley.js`): a sound for every visible action, frame-timed from the same motion
   the engine draws — footsteps on each heel strike (`step_soft`, lighter `step_tiny` for Nan/Pip), `hop_up` +
   `land`, `take_pop`/`take_double` on takes, `cloth` on big arm moves, `swish_small` on turns, plus fx
   (exclaim→`pop_in`, question→`boop_q`, sparkle/hearts/confetti→`twinkle`, puff/dust→`poof`, impact→`impact_soft`,
   debris→`clatter`, focuslines→`reveal_swell` that peaks on the reveal, speedlines/punch→`swish`), transitions
   (whip→`whip_air`, pop→`pop_in`, iris→`iris_bloop`, wipe→`swish`) and big springy camera pushes. Each hit gets
   a tiny random pitch (no machine-gun repeats) and is **panned to where it is on screen**. fx/transition foley
   steps aside when a hand-placed cue is within 0.12 s; body foley always plays.
   Check with `node tools/foley.js DIR --report`. Off: project/scene/actor `"foley": false`. Level `mix.foley` (0.55).
4. **Story accents** (hand-placed `sfx` cues): the scare, the reveal, the creature, the clue — plus 2-4 custom
   sounds made for this short. These carry the story; foley carries the body.
5. **Music** (unchanged levels, ducks under the voice).
The mix is now **stereo** (voice and music centred). Cue options: `pan` (-1..1) and `pitch` (semitones) work on
hand-placed cues too. All foley/ambience sounds are usable by name in `sfx` cues (`audio.py --list`).
