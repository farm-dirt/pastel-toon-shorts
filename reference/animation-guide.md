# Animation guide — acting, timing, camera, scene file

## How the reference moves (and how we adapt it for Shorts)
- Physical comedy carries the story: anticipation → action → hold → reaction (double-take).
- Mostly static, side-on staging; slow push-ins on reactions; few camera tricks.
- TV pacing ≈ one shot per 4.4 s. **Shorts: one shot per 1.5-3 s**, the first cut within 2 s.
- Held poses are funny: duck the music on the gag (`music.stops`, max 0.4 s, never dead silence), hold the shocked face ~0.5 s while something still moves (blink, sweat drop, eyes).

## Acting recipes (use these keys)
| Beat | Recipe |
|---|---|
| Double-take | neutral look → 0.15 s later `face:'shock'`, `hop:25`, `squash:1.08`, arms up, `ease:'back'` + `exclaim` fx + `boing` sfx |
| Realisation | slow push-in (zoom +0.2 over 1.5 s) + `look` toward object + `sparkle` |
| Smug reply | `face:'smug'`, hands on hips, switch with `ease:'snap'` exactly on the word |
| Panic | `worried` + `sweat` fx + small `shake` |
| Defeat | `sleepy`/`worried`, `squash:0.92`, `headTilt:0.2`, arms hanging, `slide_down`/`wahwah` |
| Entrance | walk in from off-screen (x −150 → target) with `walk:true`; feet never slide (phase follows distance) |
| Reacting to the narration | the narrator is the ONLY voice: never add `speaks`. Show a reaction instead (face change + `exclaim`/`question` fx + a sound), or an on-screen text pop-up |

Motion rules (the twitch lesson from the earlier `short-v1` skill): no fast wiggles. Head sway and
breathing are slow sines built into the engine; never add per-word nods. Everything is a pure
function of time (no hidden state), so scenes can be previewed and rendered in any order.

## Built-in life (automatic, no keys needed; research Nov 2026, see the animation report)
Every actor now gets these for free. Turn them off per actor with `"life": false` (or project-wide `"life": false`).
- **Weight:** a big keyed change of `armL`/`armR`/`headTilt`/`lean` gets a small wind-up before it (auto
  anticipation, ~8 %) and overshoots ~13 % then settles after it. Small or `snap` moves are left alone (no twitch).
- **Squash & stretch:** characters stretch while a `hop` rises/falls and squash on landing; area is preserved.
  Every landing also gets a dust puff (`"dust": false` on the actor to skip it) and the contact shadow shrinks mid-air.
- **Follow-through:** the body leans into fast slides, arms trail jumps, hair tufts/buns swing with the motion.
- **Blinks:** close 2 / hold 1 / open 4 frames on a hashed schedule (some double blinks), plus a forced blink
  on every expression change (it hides the face swap) and on facing/view changes.
- **Eye darts:** small 3-frame saccades every ~1-2 s on top of `look`; the head follows the look a beat later
  (`"darts": false` to keep the eyes still, e.g. a fixed stare).
- **Smears:** an actor moving faster than ~1400 px/s leaves two faint ghosts (`"smear": false` to skip).
- **Moving hold:** a shot with 0-1 camera keys slowly pushes in 2.5 % over the shot (`"drift": false` or a number).

## Takes (reactions) — use these for every big reaction
`{"t": 2.05, "take": "shock"}` = anticipation (squash + squint, 5 frames before t) → accent at t (stretch, eye pop,
small hop) → springy settle, and the face switches to `shock`. Any face name works (`happy`, `angry`, `worried`…);
`"take": "double"` adds a double-take head shake (give it a `face` too). Key the take 3-6 frames AFTER the narration
word that triggers it (they hear it, then react); for a comic punchline put a squint on the word before.
Hold the settled reaction 0.8-1.5 s before the next change.

## Easing
`inout` (default), `out`, `in`, `back` (overshoot), `snap` (instant), `linear`, **`spring`** (lands, overshoots
~12 %, settles: camera pushes, pops), **`backinout`** (gentle wind-up + overshoot for a whole move).

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

## Impact & emphasis kit (scene `fx`)
- `{"type":"punch","t":T,"amp":0.15}` zoom punch: snaps in and springs back (the camera, so it hits everything).
- `{"type":"shake","t":T,"amp":45,"dur":0.4}` trauma shake: smooth noise on x/y/roll, fades as (1-age)². 40-60 for big hits.
- `{"type":"hitstop","t":T,"dur":0.15,"who":"bramble"}` characters freeze for dur (2-8 frames) while camera/fx run; `who` jitters.
- `{"type":"impactframe","t":T}` 1-2 inverted frames on the hit. Max 1-2 per short; never more than 3 flashes a second.
- `{"type":"focuslines","t":T,"dur":0.6,"x":540,"y":900}` anime emphasis lines around a point (realisations, reveals).
- Particles (seeded, free to render): `dust` (ground puff), `debris` (chunks with gravity), `confetti` — `x`,`y`,`size`,`dur`,`n`,`color`.
A big hit = `hitstop` + `impactframe` + `shake` + `debris`/`dust` + a sound, all at the same t.

## Story tone (project key, set once per short)
- `"tone": "light" | "mystery" | "dark"` in project.json grades the whole video. A scene may override it
  with its own `"tone"` (e.g. one warm `light` flashback inside a `dark` short).
  - `light` (default): the normal pastel cartoon. Funny, silly or harmless legends.
  - `mystery`: slightly muted and cool, stronger vignette. Creepy-but-not-sad legends, survival rules.
  - `dark`: muted, dusky purple world, heavy dark vignette, characters dimmed a little so they sit in
    the same light. Death, ghosts, grief, curses, tragedies.
  The grade hits the background hardest; faces stay readable. Scene `mood` tints still stack on top.

## Mood & atmosphere (scene keys)
- `"mood": "dark" | "night" | "cold" | "warm" | "danger" | "eerie"` multiplies a tint over the shot, eased in over
  `moodIn` s (default 0.6). Horror beat: palette drop (`dark`) → slow push-in → sound → partial reveal → hard-cut reveal.
- `"ambient": "fireflies" | "motes"` floating lights/dust drifting through the whole shot.
- Project `"twos": true` animates characters on twos (TV-cartoon cadence; camera stays smooth). A/B it before using.

## FX (`fx` list, scene-local `t`)
`exclaim`, `question`, `sweat`, `sparkle`, `impact`, `puff`, `speedlines`, `hearts`, `zzz` (world x,y,size,dur)
· `shake` {amp, dur} · `flash` {dur}.

## Scene file — `project-files/project.json`
```json
{
  "id": "slug", "slug": "slug", "title": "Title", "fps": 30, "voice": "voice.mp3", "captionY": 400,
  "music": {"on": true, "bpm": 112, "key": 0, "stops": [[8.82, 9.2]]},
  "mix": {"music": 0.08, "musicPause": 0.14, "sfx": 0.35},
  "sfx": [{"t": 2.02, "name": "boing"}, {"t": 3.2, "name": "whoosh", "gain": 0.8}],
  "captions": [{"s": 0.36, "e": 1.48, "text": "toby found one"}, {"s": 1.48, "e": 2.47, "text": "shiny *coin*"}],
  "scenes": [{
    "id": "s1", "start": 0, "end": 3.2, "location": "park", "transition": "cut",
    "desc": "Wide park. Toby strolls in, spots a coin, double-take.",
    "camera": [{"t": 0, "x": 540, "y": 860, "zoom": 1}, {"t": 2.4, "x": 560, "y": 940, "zoom": 1.3, "ease": "back"}],
    "actors": [{"who": "toby", "h": 820, "keys": [
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
