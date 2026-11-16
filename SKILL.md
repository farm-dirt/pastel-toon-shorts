---
name: "pastel-toon-shorts"
description: "Personal 2D animation studio for vertical YouTube Shorts in a pastel cartoon style (original cast). Use when the user wants to make, script, preview or render an animated Short in this style."
---

# pastel-toon-shorts — script → voice-over → browser preview → final MP4

A reusable production workflow. The art direction was analysed once from a 2D TV-cartoon
reference (flat cel look, thick dark outlines, big heads + thin limbs, one pastel hue per
location, physical-comedy acting) and is stored in `reference/`. **Never copy the reference
show's characters or assets** — always use the original cast in `reference/characters.md`
(or new original characters built with the same rig).

## 0. Setup (silent, every time)
1. Get the engine: `git clone --depth 1 https://github.com/farm-dirt/pastel-toon-shorts ~/pts`
   (if the folder exists: `git -C ~/pts pull`). If GitHub is unreachable, ask the user to attach a
   zip of the repo and unzip it to `~/pts`. (A copy also lives in the user's
   Downloads/stickman-video/pastel-toon-shorts folder when their computer is linked.)
2. Check tools, never assume: `node -v`, `ffmpeg -version`, `python3 -c "import numpy"`,
   `node -e "require('playwright')"` (use `NODE_PATH=$(npm root -g)` if it's a global install).
   Nothing else is needed. If something is missing, explain in one plain sentence what it is and
   why it's needed, and ask before installing (official sources only).
3. Read `~/pts/reference/style-guide.md`, `animation-guide.md`, `characters.md` before planning
   scenes; `production-guide.md` before audio/render steps; `content-playbook.md` for ideas and scripts.

The user is a beginner: simple words, define terms, say WHY, push back honestly on weak ideas,
warn before anything that deletes/overwrites. Keep each checkpoint message short.

## The workflow — phases in order, never skip a ⛔ checkpoint

### Phase 1 — Start (automatic, no question)
Do NOT ask "What would you like to create?". Always assume **"I want a new script"** and go
straight to Phase 2. Only exception: if the user's message already includes a script they wrote,
use it and go to Phase 4 (review/tighten it, keep their voice).

### Phase 2 — Category (automatic, no question)
Do NOT list categories or ask. The category is always **Local culture & legends of the
Philippines** (Filipino folklore, myths, creatures, traditions, local history). Say in one line
"Category: Philippine culture & legends" and go straight to Phase 3. Only use another category
if the user names one in their message.

### Phase 3 — 10 ideas  ⛔
For the Philippine culture & legends category: 10 original ideas (avoid repeating topics the user
already made shorts about), each with **title, 1-2 line description, the hook
(first 2 seconds), storytelling potential (★1-5 + why), why it animates well, format
(Creature card 20-30 s or Story 50-65 s), audience fit (teen/adult tone, not a kids' moral lesson), mystery shape**
(for Stories: the looks-wrong or impossible opening, who doubts it, and the reversal, a few words each; see
"Mystery formula" in Phase 4). Flag your top 2, preferring ideas with a clear mystery shape.
Facts must be true — search the web for anything factual before pitching it; note when the legend has regional versions.
**What wins in this niche (research, Nov 2026):** creature Shorts break out even on tiny channels when they open on
one creature with one weird, instantly readable trait (manananggal, aswang, tiyanak, kapre, tikbalang,
sigbin, batibat rank above moral-lesson alamat). Mix in at least 4 creature ideas per list, plus a
few funny/twisted legends. Every idea must fit the channel series name (see "Series identity").
Wait for the user to pick. Do not proceed on your own.

### Phase 4 — Script + voice-over (ONE checkpoint)  ⛔
Script and voice-over are combined into a single step so the user only waits once.
Write the script with the template in `content-playbook.md`: hook (0-2 s), setup, escalation,
twist/payoff, button ending (no spoken CTA, see below). Per section: narration, est. duration
(~2.6 words/s), visuals, character actions, transition. Target 50-65 s (≈ 130-170 words) for a Story,
20-30 s (≈ 50-75 words) for a Creature card. The user's model script (Bal-Bal, 16 Nov 2026) is ~180 words: if
a script runs past ~65 s, say so and offer 2-3 optional cuts; never cut the user's lines silently.
**Mystery formula for Stories (from two viral reference Shorts, user request 15 Nov 2026).** Write every
Story as a mystery the viewer solves along with the narrator. The template sections above still apply;
this is how to fill them:
1. **Looks-wrong hook (0-3 s):** open on the main character doing something that looks foolish or wrong,
   or on a claim that sounds impossible ("He hangs a stingray tail by every window." / "This baby has never
   cried. Not once."). The viewer's "why?" is the hook.
2. **Rewind (3-8 s):** one plain scene-setting sentence with time + place ("It's three in the morning at
   Lola's wake in Palawan."). "See, …" or "It all started when…" are optional.
3. **Stakes:** what can be won or lost, big and simple, said by ~10 s.
4. **Doubter:** someone thinks the hero is crazy or wrong (neighbours, elders, family, a rival). Say it as
   narration ("His cousins laugh.") plus a picture reaction, and you MAY add ONE short quoted taunt (≤ 8 words)
   that the narrator reads in his own voice ("She's dead. Where's she going?"). Then turn it with a
   counter-line ("But the old folks aren't laughing.").
5. **Low point:** the normal way seems to win at first; the hero looks dumb.
6. **Clue shown with everyday things:** reveal the secret in steps the viewer can picture: a coin, a
   finger's width, a grain of salt, a cup of rice, a heartbeat. No textbook words; the viewer should
   almost guess it before the narrator says it.
7. **Reversal + hard stop:** the doubter's side fails in the most visual way possible, or the hero is
   proven right; end on that image or a one-line consequence, then cut (still loop-friendly, see below).
Every few lines, open the next question with a turn line ("Then the dry season comes, and something
weird happens." / "Meanwhile…" / "So what does he do?"). Creature cards (20-30 s) keep their simpler
shape: one weird trait → what it does → the one way to survive it.
**Retention rules (check every script before sending):**
- **Write the ending first**, then build backwards. One character, one goal, one problem.
- **Hook = first spoken line + first image together**: start in the middle of the strangest moment
  (never "Long ago in a village…", never a greeting). Add a 2-4 word on-screen hook text for 0-2 s.
- **Show the strange thing, don't promise it (lesson from the Kumakatok short, Nov 2026: 79 % average
  view duration but only 52 % stayed, so the story worked and the opening lost half the viewers).** The first
  line is at most 6 words (under 2 s) and names or shows the impossible thing itself ("This corpse has no
  fingerprints."), not a setup that only promises something scary later ("Three knocks
  after midnight…"). The hook text asks a SECOND question and never repeats the narration (narration
  "This corpse has no fingerprints." + text "WHERE'S LOLA?").
- **Link beats with "but" / "therefore", never "and then"** (avoids boring chronology).
- **Re-hook every ~8-10 s**: a new question, reveal or reversal ("But the old folks aren't laughing." /
  "Watch the guests.").
- **Present tense (user rule, 15 Nov 2026)**: tell the main action as if it is happening right now ("He
  hangs a stingray tail by every window." / "The baby stops crying."). Why: it feels live, like watching it
  happen, not hearing a history lesson. Background can stay in past tense ("Lolas used to warn…"), but
  never switch tense in the middle of a scene.
- **Show, don't narrate**: the narrator sets up, the picture delivers the joke or scare. Never narrate an
  emotion the face already shows. Mark at least 2 moments where the picture says something the narration doesn't.
- **Narration only — one voice.** The narrator is the ONLY voice in the short: no in-character
  recordings, no second speaker, no separate clips (user rule). The only exception is the one short quoted
  taunt the narrator reads himself (see Doubter). Keep the cast
  alive with the picture instead: faces, gasps drawn as reactions, sound effects, and on-screen text
  (e.g. a big "HEHEHE" or "!!" pop-up). Write what a character would say as narration
  ("Pip spots something in the sky."). Never use `speaks` on actors.
- **No "like and subscribe" outro.** End on the twist or a line that loops into the first line; the
  last 0.3 s cuts straight back so the replay feels seamless. The call to action is a silent
  mid-video subscribe button instead (`project.cta`, Phase 6 step 3) — it never touches the ending.
- **Tone for teens/adults** (witty or spooky, "folklore explained"), not a children's moral lesson —
  this is who the channel is for, and it keeps the content honestly "not made for kids".
- **Mystery check (Stories):** point to the looks-wrong hook, the doubter, the everyday-thing clue and
  the reversal. If one is missing, fix it or say in the script message why this story doesn't need it.
**Narration style: write like the user's model script (Bal-Bal, 16 Nov 2026; full text in
`content-playbook.md` → "Model script").** Read it before writing any Story. The moves to copy:
- **One beat per line.** Each line in `script.txt` is one breath; the voice pauses at every line break.
- **Mix one plain full sentence with fragments.** Explain the creature once, in everyday words, with its
  name and what it does ("…the Bal-Bal, a creature that steals corpses and leaves something else in
  their place."). Then let fragments carry it ("A banana trunk.").
- **Triplets** for the creepy detail and for the clue ("Same face. Same hands. Almost perfect." /
  "No ridges. No lines. No fingerprint.").
- **Echo** an early phrase at the reveal so the viewer connects it ("Almost perfect." → "Almost too perfect.").
- **Talk to the viewer once** with a short command that makes them a detective ("Watch the guests.").
- **Slow-motion cascade at the low point:** 3-4 tiny lines that stretch the scary second ("Toby blinks." /
  "Just for a moment." / "And falls asleep.").
- **The clue is an action anyone could do,** in one sentence with three steps ("…takes a candle, rubs soot
  onto her thumb, and presses it against a sheet of paper."), then "He lifts it." / "Nothing."
- **Split the reveal over a "…" line break with the key word last** ("Because whatever is lying inside that
  coffin…" / "isn't Lola."), then end on a quiet last image split the same way that hints the threat is still
  out there ("And outside the house…" / "Someone is still yawning.").
- Starting lines with "And", "So" or "Because" is fine (it pushes the story on); still never "and then".
**Voice + settings to suggest every time (the user is on FREE ElevenLabs):**
- **Voice:** the channel's narrator is **Jon – Catalyst**; keep the same voice on every short so viewers
  recognise the series. Only suggest another voice if the user asks (then: a calm, clear storyteller voice
  with a low, steady tone, not a hyped "YouTube" voice).
- **Settings (free model sliders):** Speed ≈ 0.90 (slightly slower) · Stability ≈ 40-45 % (expressive but
  not random) · Similarity ≈ 75 % (stays sounding like Jon) · Style Exaggeration 0-10 % (higher adds odd
  accents/crackles) · Speaker Boost on if shown. Give these as a small table with a one-line "why" each.
- **No audio tags** ([whispers], [laughs]…): free voices may read them aloud. Get emotion from the
  writing only: "…" for a pause or slow-down, CAPS on at most one stressed word per line, short sentences.
  Avoid sounds the voice mispronounces ("Hmp", "Ugh", "Pssst").
- Keep the narration short enough to regenerate 2-3 times on free credits; tell the user they can
  regenerate just one bad sentence and upload both files (you splice it in).
- If 2-3 tries still sound flat, nudge Stability down 5 %; if lines sound weird or random, nudge it up 5 %.
- Mention once (not every time) that their own voice or a clone stands out from the many
  identical AI-narrated folklore Shorts.
Save it right away as `script/script.md` (full) and `script/script.txt` (narration only, exactly
as it will be spoken). Then send ONE message containing: the script, the narration-only text in a
code block ready to copy (no tags in it), and the voice + settings above (ElevenLabs or their own voice,
MP3/WAV, read the narration exactly, small pauses between sentences). End with:
"Record it and upload the file, or tell me what to change in the script."
Do NOT ask for separate script approval: uploading the voice-over counts as approving the script.
If they send changes instead, revise, re-save both files, and resend the same combined message.
If the user changed any words while recording, update `script/script.txt` to match what they said.

### Phase 5 — Process the voice-over (starts as soon as the upload arrives)
Never build animation before the voice-over arrives. When it arrives, go straight on without asking:
```bash
python3 ~/pts/tools/new_project.py ~/shorts <slug> "<Title>"     # standard folders
cp <upload> ~/shorts/<slug>/voice-over/voice.<ext>                # set "voice" in project.json
python3 ~/pts/tools/timing.py ~/shorts/<slug>/voice-over/voice.<ext> ~/shorts/<slug>/project-files/timing.json --script ~/shorts/<slug>/script/script.txt
```
Report in 3-4 lines: duration, number of sentences matched to pauses, any sentence whose length
looks off (≥ 40 % different from the word-count estimate = misread/skipped line → tell user).
The voice-over is the master clock: scene cuts go on real pauses (`timing.sentences`, `pauses`).

### Phase 6 — Build the animation
1. **Shot plan** (`project-files/project.json`, schema in `animation-guide.md`): one scene per
   phrase/sentence, cut on pauses, 1.5-3 s per shot, angle variety rules, a location per story
   beat. Every gag/emphasis keyed to the word time (`timing.words`) minus 0.08 s.
   **Directing rules (from the user's animation-direction brief):**
   - **Frame 0 is the hook**: the creature/strangest moment is already on screen at t = 0 — no fade-in,
     no empty establishing shot, no logo. Hook text (2-4 words, big) shows 0-2 s.
     Frame 0 must show the wrong/impossible image itself (the fake body, the creature's weird trait
     mid-action), not a door, a house or a calm place where something will happen later. Something
     moves or changes within the first 0.5 s (a twitch, a reveal, a camera push).
   - **YouTube Shorts safe zone (user rule, Nov 2026).** The Shorts app draws its buttons and text
     ON TOP of the video, so anything important there is hidden. In the final 1080×1920 picture
     (screen position after the camera, not world coordinates), keep every face, the key
     creature/prop/clue, hook text and the CTA inside the **safe box x 48-888, y 180-1500**. No-go
     areas: the **right 192 px** (x > 888: like, dislike, comment, share, remix buttons), the
     **bottom 420 px** (y > 1500: title, channel name, Subscribe, audio), the **top 180 px** (y < 180:
     search and menu icons). Treat y 1250-1500 as a caution strip (long titles grow into it): no faces
     or reveal objects there. Only scenery, ground, feet and blurred foreground may run into the
     no-go areas. If a character stands at the right edge of the shot or an object sits on the
     ground, move it, zoom in or tilt the camera until it lands inside the box.
   - Something visibly changes at least every 1.5 s (pose, face, camera move, prop, fx) — no dead stretch.
   - No actor keeps the same `face` for a whole scene longer than ~2.5 s; each beat gets a reaction.
   - Hold key poses/reactions ~0.3 s longer than feels natural; never snap a strong expression straight back to neutral.
   - Every camera move or angle must have a reason (reveal, emphasis, chaos) — say it in the scene `desc`.
   - **Colour script**: characters keep their colours; shift the location light/tint per story beat
     (warmer for safe/funny, darker or cooler for danger, a flash of red for the scare). Plan it in one line before building.
   - **Sound for every visible action** (step, grab, blink-pop, landing). A tension beat (`music.stops`) right before the punchline/scare:
     **never dead air** (user rule, Nov 2026: the Kumakatok short had 0.5 s of total silence at 37 s, right before
     the payoff, and it sounded like the video froze). The engine now ducks the music to 12 % instead of zero,
     caps a stop at 0.4 s and keeps quiet room tone under the whole mix. Still put a sound under the beat
     (`heartbeat`, a creak, `night_ambience` at gain 0.3) and keep something moving on screen (blink, eyes,
     slow camera push). `qa.py` fails any silence longer than 0.15 s.
   - Use one or two of the cast (Toby/Nan/Bramble/Pip) as recurring witnesses or reactors in each legend, so viewers
     recognise the same faces across the series.
2. **Captions**: start from `timing.captions`, fix names/casing, wrap 1-2 key words per
   sentence in `*stars*` (yellow highlight). Put the edited list in `project.json` as `"captions"`.
3. **SFX & music** cues in `project.json` (`python3 ~/pts/tools/audio.py --list` shows SFX names).
   **Recorded sounds & music (user's library, copied from paper-diorama-shorts 14 Nov 2026)** live in
   `~/pts/assets/sfx/` and `~/pts/assets/music/` (used by file name; `audio.py --list` shows them).
   Music: `"music": {"track": NAME, "start": S, "stops": [[a, b]]}` (short tracks loop; same ducking).
   Tracks: `calm_ambient`, `celtic_harp` (sad/tender), `medieval_ambient` (old villages, royalty),
   `dark_mystery_piano`, `cinematic_tension`, `epic_action`, `dark_fantasy_synth`, `dark_ambient`,
   `horror_atmosphere` (aswang/creature legends), `greek_folk`. No `track` = the cartoon synth bed
   (still best for light comedy). Recorded SFX: `impact_hit`, `low_hit`, `deep_boom`, `suspense_sting`,
   `riser`, `whoosh_cinematic`, `magic_sparkle`, `sparkle_whoosh`, `bell`, `falling_whistle`, `pop`
   (recorded; synth is `pop_synth`), `thunder`, `rocks`, `water_splash`, `door_creak`,
   `footsteps_gravel`, `monster_growl`, `heartbeat`, `sword_clash`, paper sounds, and quiet ambiences
   (`wind_howl`, `fire_crackle`, `night_ambience`, `horror_drone`: `gain` 0.3-0.5 + `dur` + fades).
   Cue options: `{"t", "name", "gain", "dur", "fadeIn", "fadeOut"}`.
   **Never use `wind`** (same file the user banned on the paper channel, 14 Nov 2026: a low rumble; use `wind_howl`).
   **Never use `dark_click`** (user rule, Nov 2026): it is a 9.5 s low rumble that drones under several scenes; the user
   disliked it. **Always give recorded SFX a `dur` + `fadeOut`** (about 0.8-1.6 s): many files are long recordings
   (`magic_sparkle` 20 s, `bell` 5.3 s, `suspense_sting` 4.9 s, `impact_hit` 3 s) and otherwise keep playing under the next scenes.
   Check a file's length with `ffprobe` before using a sound you haven't used before. Cartoon synth sounds (`boing`,
   `bonk`, `wahwah`, `tada`…) still work and suit gags. If `--list` shows no recorded sounds, `git -C ~/pts pull`.
   **Subscribe CTA (every short):** `"cta": {"s": S, "e": S + 2.6, "tap": 0.95, "text": "More <series name>"}`
   with S at about 45-60 % of the video, over a calm beat (never in the first 3 s, the payoff, or the last 3 s).
   The engine draws it silently above the bottom YouTube UI (y 1440): it pops in, a cartoon hand taps it,
   it turns into SUBSCRIBED. Add sfx `pop` at S + 0.02 and `ding` at S + tap + 0.1.
4. Build & check:
```bash
python3 ~/pts/tools/audio.py ~/shorts/<slug>          # mix.wav + mix.mp3 (levels: production-guide)
python3 ~/pts/tools/build_preview.py ~/shorts/<slug>  # preview/ = the REAL animation
NODE_PATH=$(npm root -g) node ~/pts/tools/lint.js ~/shorts/<slug>   # must say OK
```
Fix every lint line (move camera / actors), rebuild, re-lint. Then render 3-5 stills at key
moments (see production-guide "spot check") and LOOK at them yourself before showing the user.
Always include t = 0.0 in the stills. **Audience-eye review** before the preview: (1) Would a stranger
swiping fast stop at frame 0? Does the t = 0 still alone, with the sound off, show something impossible
or wrong? (2) Any stretch > 1.5 s where nothing changes? (3) Any shot that only
illustrates the narration literally with no extra joke/feeling? (4) Same face held too long?
(5) Does the end cut cleanly back into the start? (6) Would the YouTube buttons or title cover a
face, the reveal or any text in any still (check against the safe box x 48-888, y 180-1500)?
Fix what fails, then publish.

### Phase 7 — Browser preview  ⛔ approval required
Copy the preview folder into the working directory (the publisher only attaches files from there),
then publish it with the Artifact tool's publish-from-files: `index.html` (= preview/index.html, the full
document), characters.js, backgrounds.js, engine.js, data.js, custom.js (if any), audio/mix.mp3,
assets/Poppins-Bold.ttf (same paths). **Right after the FIRST publish**, read the declaration and
declare `{"db": {}, "user": {}}` on it — that is what lets the preview's buttons save to the page.
Republish the SAME artifact (slug + base_version) on every revision, so the link never changes. Also copy
the preview folder to the user's computer if a folder is connected (opening `index.html` works offline).
Tell the user: press ▶ (it loops like a Short), ⛶ Full screen (or double-click / F), "Play this scene"
to loop one scene, type change requests in the boxes, then press **Send notes to Claude** or
**✓ Approve** and just type **"check"** in the chat. A page cannot message the chat by itself, so never
promise that the buttons process on their own.
**When the user says "check"** (or "done", "sent"): read `feedback/latest` with the artifact db read tool
(db_get on the preview's slug) and act on its `text`: kind `notes` → do the revisions; kind `approve` →
Phase 8 (with the thumbnail they named, or ask A/B in the same reply). If it is missing or older than
their last message, the page fell back to copying — ask them to paste the text instead.
**Thumbnail (made at the same time, so no extra waiting):** design 2 NEW thumbnail images.
NEVER use a frame captured from the video — each thumbnail is its own composition made to sell
this short at phone size:
- A = the "impossible" image (the creature/transformation/weird object, huge);
  B = the strongest emotion (a character's big reaction + the key object). Never give away the twist.
- Compose with the engine so it stays on-model: write a one-scene JSON (`location`, `camera`
  zoomed in 1.2-1.5, 1-2 actors with `h` ~1000 and an extreme pose/face, key prop large; simple bold
  background, no clutter) and save it as `project-files/thumb_A.json` / `thumb_B.json`. Thumbnail-only
  props (burst, big arrow, glow) go in a `thumb_custom.js` next to those JSONs, never in the video's
  custom.js. Then run
  `python3 ~/pts/tools/thumb.py ~/shorts/<slug> --thumb project-files/thumb_A.json --title "2-5 WORDS" --hl KEYWORD --out final/thumbnail_A.png`
  (renders at 1080×1920 with no captions/CTA, then adds the title: Poppins Bold, ALL CAPS, white with a
  thick dark outline, the --hl word in yellow, top third). The project's own files are never touched.
- Thumbnails follow the same safe box: main subject inside x 48-888, nothing important below y 1500
  (the Shorts shelf and feed draw the title over the bottom).
- Scale each to ~200 px wide and LOOK: the idea must read in under a second; the title (top third,
  never over a face) must make someone curious, not repeat the full title.
Ask together with the preview link: "Which thumbnail, A or B? (or tell me what to change)".
Send both thumbnails with SendUserFile together with the preview link. Approving the preview +
picking a thumbnail happen in the same reply.
Revisions: change only the scenes named; rebuild → lint → republish. For a quick moving check of
one scene you may also render just that range: `node ~/pts/tools/render.js DIR --from 4.9 --to 7.3 --out /tmp/<slug>-scene<N>-haeXclips.mp4`.
**Every MP4 sent to the user carries the channel tag `-haeXclips` (user rule)**: finals, test clips, re-renders.

### Phase 8 — Final render (only after explicit approval)
```bash
NODE_PATH=$(npm root -g) node ~/pts/tools/render.js ~/shorts/<slug>   # → final/<slug>.mp4
```
1080×1920, 30 fps, H.264 yuv420p, AAC 192k, -14 LUFS. ~1.6 s of render per second of video on 2 CPUs.

### Phase 9 — QA, then deliver
```bash
python3 ~/pts/tools/qa.py ~/shorts/<slug> ~/shorts/<slug>/final/<slug>.mp4
```
All lines must PASS. Open `scenes/contact_sheet.jpg` and check: same character designs in
every shot, captions readable and not on faces, nothing cut off, no empty/odd frames. Fix → re-render → re-QA.
Re-render the chosen thumbnail from its JSON with thumb.py (in case anything changed) as
`final/<slug>_thumbnail.png`, plus a 1280×720 version `final/<slug>_thumbnail_16x9.png` (same art,
title kept inside the frame) for places that need a wide image.
**Name the final video `<slug>-haeXclips.mp4` (user rule, every short):** once QA passes, run
`mv ~/shorts/<slug>/final/<slug>.mp4 ~/shorts/<slug>/final/<slug>-haeXclips.mp4`. That is the file you
send and copy. (If you re-render later, the engine writes `<slug>.mp4` again: re-QA it, then rename again.)
Deliver: send `final/<slug>-haeXclips.mp4` AND the thumbnail(s) with SendUserFile; tell the user in one line how to use
it (YouTube app → when uploading the Short, tap the thumbnail/cover → add from gallery); if a folder on their computer is connected, copy the
whole project there (final MP4 at `<folder>/<slug>/final/<slug>-haeXclips.mp4`, double-click to play).
**Upload text (send with the MP4, ready to copy):**
- **Title = a hook (the most important upload text).** On Shorts the title's job is to stop the
  scroll, not to label the video. Rules:
  1. Lead with the hook: the strangest, scariest or funniest idea in the first 3-5 words. Never start
     with the series name, "The Legend of…", "The Story of…", a greeting or the date.
  2. ≤ 45 characters total (60 hard max) so nothing important is cut off on phones. Put the one word a
     viewer would search (the creature's name, "Filipino folklore") in the first 40 characters when it
     doesn't spoil the twist.
  3. Write 5 options using at least 3 of these proven patterns:
     Warning ("Never Catch THIS Firefly at Night") · Wrong assumption ("That Glow Isn't a Firefly…") ·
     Second person ("If Your Tree Smells Like Smoke, RUN") · Impossible fact ("His Cigar NEVER Burns Out") ·
     Mini-story ("He Caught the Wrong Firefly 😳") · Precise question ("Why Do Lolas Avoid Balete Trees?").
  4. Title, thumbnail text and the video's first line make the SAME promise from 3 angles with
     DIFFERENT words. Never reveal the twist or punchline.
  5. At most one word in CAPS, at most one emoji (at the end), "…" allowed for a cliffhanger; no "!!!".
     Curiosity is fine, a broken promise is not (YouTube treats misleading titles as a policy problem).
  6. Score every option /10 on: stops the scroll · clear in 1 second · makes you need the answer ·
     honest to the video. Show the scores in a small table, mark your pick, say why in one line.
- **Description hook:** the first 1-2 lines are the hook (they show before "more"), then 2-3
  short lines of extra context or a fun fact that's true (checked on the web, mention a source or
  "versions differ by region" when relevant), then the local-version question (see Comment driver),
  then 3-5 hashtags (always include #shorts, plus topic tags like #philippines #folklore). Only the
  first 3 hashtags show above the title.
- **Series name** goes at the END of the title (" | Pinoy Creature Files") only if the total stays ≤ 60,
  otherwise in the first line of the description — never in front of the hook.
- **Comment driver (every short; user rule, 14 Nov 2026):** write one **"your version" question**
  asking viewers how this creature or legend is told in their province or family ("What did your lola
  call this in your province?", "In your province, what keeps the Tiktik away?"). Specific to this
  short's creature, answerable by everyone, under 15 words. Use it as the description's comment
  question AND as a **pinned comment** the user posts right after upload (its own code block,
  labelled "Pinned comment"). Never put it in the narration: the ending stays the twist or loop.
  Never bait comments with a deliberate mistake. Remind in one line: reply to the first comments
  within the first hour.
- **Upload settings to tell the user:** Audience = answer honestly; this series is written for
  teens/adults, so normally "No, it's not made for kids" (YouTube can change it, and Made for Kids turns
  off comments and personalised ads). Altered/synthetic content = No (fully animated). Music and SFX: only the
  engine's synth or the user's own library in assets/, never commercial songs (licensed tracks take a share
  of Shorts revenue). If YouTube ever flags a track, tell the user which one and swap it.
- **Cross-post:** suggest also uploading to Facebook Reels (Facebook monetization is open in the Philippines;
  TikTok's Creator Rewards is not).
Put each title and the full description in its own code block so the user can copy it in one tap.
Also save them to `final/<slug>_upload.txt`.
**Growth notes (one or two lines, only when useful):**
- After every 8-10 finished Shorts, offer to stitch them into one 8-10 min long-form compilation
  (long-form pays far better than Shorts, especially for PH viewers: Shorts earn ~$0.02 per 1,000 PH
  views vs ~$0.33 US). From 1 Feb 2027 Shorts ad revenue needs 10M Shorts views per 90 days, so
  long-form watch hours matter.
- At the start of a new short, ask once: "How did the last one do? Tell me its 'Stayed to watch' %
  (YouTube Studio → the Short → Analytics)." Compare it against their own earlier Shorts, not a
  universal target, and adjust the next hook.
  How to read the stats the user shares: **low "Stayed to watch" + high average view duration = hook
  problem** (fix frame 0, the first line and the hook text; keep the story shape). **High stayed + low
  duration = story problem** (more re-hooks, a shorter middle, an earlier payoff). Low on both means the
  topic and the hook are both weak. Stats from the first 1-2 days are early, so recheck after 2-3 days
  before drawing firm conclusions. If it has 0 comments, give the pinned "your version" comment to post right away.
One line of notes + offer the next idea. Update nothing in this skill unless the user asks.

## Series identity (set once, then reuse)
The first time this section is used, propose 2-3 series names (e.g. "Pinoy Creature Files") and let
the user pick; then keep the same name, title end-tag (" | Pinoy Creature Files" — the hook always comes
first, see the title rules in Phase 9), intro hook-text style and thumbnail look for every short. Recognisable series grow
faster than one-off videos.

## Avoid "inauthentic / mass-produced" content (YouTube policy, July 2025)
YouTube can demonetize a whole channel for Shorts that only differ on the surface. So every short must
have its own story shape, new scenes, new props/locations and a fresh ending — never reuse a previous
short's scene list with names swapped. Vary formats (Creature card, Story, "Myth vs fact").

## Hard rules
1. Phases in order; never skip ⛔ approvals; never animate before the voice-over; never final-render before preview approval.
2. Original characters only (cast + rig in `characters.js`); add new ones as new CAST entries following `characters.md`.
3. Preview and final come from the same `drawFrame` engine — never "fake" the preview with stills.
4. Background music/SFX must never compete with the voice (levels in production-guide).
5. Automate: the user should never need to type terminal commands.
6. No new installs without asking. Keep it simple, buildable, testable.
7. **Engine changes must reach GitHub in the same session.** Every new short downloads the engine fresh
   from GitHub, so a change made only in this session's copy is lost next time. After any engine change:
   commit as farm-dirt, attach the repo with add_repo (access: push), push, then verify with a fresh
   `git clone --depth 1`. Edits to this SKILL.md go through propose_skills.