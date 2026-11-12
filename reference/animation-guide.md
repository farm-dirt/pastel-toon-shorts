# Animation guide — acting, timing, camera, scene file

## How the reference moves (and how we adapt it for Shorts)
- Physical comedy carries the story: anticipation → action → hold → reaction (double-take).
- Mostly static, side-on staging; slow push-ins on reactions; few camera tricks.
- TV pacing ≈ one shot per 4.4 s. **Shorts: one shot per 1.5-3 s**, the first cut within 2 s.
- Silence/held poses are funny: freeze the music on the gag (`music.stops`), hold the shocked face ~0.5 s.

## Acting recipes (use these keys)
| Beat | Recipe |
|---|---|
| Double-take | neutral look → 0.15 s later `face:'shock'`, `hop:25`, `squash:1.08`, arms up, `ease:'back'` + `exclaim` fx + `boing` sfx |
| Realisation | slow push-in (zoom +0.2 over 1.5 s) + `look` toward object + `sparkle` |
| Smug reply | `face:'smug'`, hands on hips, switch with `ease:'snap'` exactly on the word |
| Panic | `worried` + `sweat` fx + small `shake` |
| Defeat | `sleepy`/`worried`, `squash:0.92`, `headTilt:0.2`, arms hanging, `slide_down`/`wahwah` |
| Entrance | walk in from off-screen (x −150 → target) with `walk:true`; feet never slide (phase follows distance) |
| Talking | add `speaks:[[from,to]]` (scene-local s) — mouth follows the real voice |

Motion rules (the twitch lesson from the earlier `short-v1` skill): no fast wiggles. Head sway and
breathing are slow sines built into the engine; never add per-word nods. Everything is a pure
function of time (no hidden state), so scenes can be previewed and rendered in any order.

## Camera
Keys `{t, x, y, zoom, roll, ease}` in scene-local seconds; (x,y) = world point at frame centre.
Every shot gets an automatic 6 % settle-in over 0.25 s. Variety rules:
- Never two similar framings back to back. Mix: wide (zoom 1), medium (1.3-1.5), close-up (1.7-2.0), push-in, Dutch tilt (`roll` ±6°) on chaos.
- **Lint must pass**: in close-ups, frame the face below the caption band (keep head top > y 520 on screen). If lint flags a scene, lower the camera `y` (smaller y = subject lower on screen) or reduce zoom/hop.
- Use `shake` fx for impacts, `flash` for punchlines (max 2 per video).

## Transitions (scene `transition`)
`cut` (default; most cuts should be cuts) · `whip` 0.3 s fast pan, for "meanwhile/he ran" · `pop`
0.3 s punch-in + flash, for arriving somewhere · `iris` 0.5 s circle close/open, for the ending beat or time skip · `wipe`.
Max ~1 non-cut transition per 3 scenes.

## FX (`fx` list, scene-local `t`)
`exclaim`, `question`, `sweat`, `sparkle`, `impact`, `puff`, `speedlines`, `hearts`, `zzz` (world x,y,size,dur)
· `shake` {amp, dur} · `flash` {dur}.

## Scene file — `project-files/project.json`
```json
{
  "id": "slug", "slug": "slug", "title": "Title", "fps": 30, "voice": "voice.mp3", "captionY": 400,
  "music": {"on": true, "bpm": 112, "key": 0, "stops": [[8.82, 9.6]]},
  "mix": {"music": 0.08, "musicPause": 0.14, "sfx": 0.35},
  "sfx": [{"t": 2.02, "name": "boing"}, {"t": 3.2, "name": "whoosh", "gain": 0.8}],
  "captions": [{"s": 0.36, "e": 1.48, "text": "toby found one"}, {"s": 1.48, "e": 2.47, "text": "shiny *coin*"}],
  "scenes": [{
    "id": "s1", "start": 0, "end": 3.2, "location": "park", "transition": "cut",
    "desc": "Wide park. Toby strolls in, spots a coin, double-take.",
    "camera": [{"t": 0, "x": 540, "y": 860, "zoom": 1}, {"t": 2.4, "x": 560, "y": 940, "zoom": 1.3, "ease": "back"}],
    "actors": [{"who": "toby", "h": 820, "speaks": [[0.4, 2.9]], "keys": [
      {"t": 0, "x": 120, "y": 1560, "walk": true, "face": "happy"},
      {"t": 1.5, "x": 470, "walk": true},
      {"t": 1.6, "walk": false, "view": "front", "look": [0.4, 0.6]},
      {"t": 2.05, "face": "shock", "hop": 25, "squash": 1.08, "armL": [2.3, 0.3], "armR": [2.3, 0.3], "ease": "back"},
      {"t": 2.4, "hop": 0, "squash": 1}]}],
    "props": [{"type": "coin", "x": 700, "y": 1540, "size": 70},
              {"type": "cup", "hold": "toby.R", "size": 80, "dy": -10}],
    "fx": [{"type": "exclaim", "t": 2.05, "dur": 0.9, "x": 620, "y": 700, "size": 180}]
  }]
}
```
Notes: scene times are absolute seconds and must tile 0 → voice duration (build_preview fixes
tiny gaps and warns). Inside a scene every `t` is scene-local. Numbers glide between keys with
`ease` (inout default, out, in, back = overshoot, snap = instant, linear); text values (face,
view) switch at their key. `visible:false` hides an actor/prop. Props: coin, box, sign (`text`),
bulb, heart, phone, chest, cup — or custom ones in `custom.js`:
`window.CUSTOM = { props: { shovel(ctx, size, state, t) { /* draw at 0,0 */ } } }`.
`hold: "who.L|R"` glues a prop to a hand (drawn on top). Sizes are world px.

Top-level `"cta": {"s", "e", "tap", "text", "y"}` = the silent subscribe button (screen space, drawn after
captions): pops in at `s`, a hand taps it `tap` s later and it reads SUBSCRIBED, gone at `e`. Default
text "Subscribe for more", y 1440 (above the bottom YouTube UI). Place it mid-video, never at the end.
