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
(Creature card 20-30 s or Story 40-55 s), audience fit (teen/adult tone, not a kids' moral lesson)**. Flag your top 2.
Facts must be true — search the web for anything factual before pitching it; note when the legend has regional versions.
**What wins in this niche (research, Nov 2026):** creature Shorts break out even on tiny channels when they open on
one creature with one weird, instantly readable trait (manananggal, aswang, tiyanak, kapre, tikbalang,
sigbin, batibat rank above moral-lesson alamat). Mix in at least 4 creature ideas per list, plus a
few funny/twisted legends. Every idea must fit the channel series name (see "Series identity").
Wait for the user to pick. Do not proceed on your own.

### Phase 4 — Script + voice-over (ONE checkpoint)  ⛔
Script and voice-over are combined into a single step so the user only waits once.
Write the script with the template in `content-playbook.md`: hook (0-2 s), setup, escalation,
twist/payoff, button ending, optional CTA. Per section: narration, est. duration
(~2.6 words/s), visuals, character actions, transition. Target 30-55 s (≈ 80-140 words) for a Story,
20-30 s (≈ 50-75 words) for a Creature card.
**Retention rules (check every script before sending):**
- **Write the ending first**, then build backwards. One character, one goal, one problem.
- **Hook = first spoken line + first image together**: start in the middle of the strangest moment
  (never "Long ago in a village…", never a greeting). Add a 2-4 word on-screen hook text for 0-2 s.
- **Link beats with "but" / "therefore", never "and then"** (avoids boring chronology).
- **Re-hook every ~8-10 s**: a new question, reveal or reversal ("But that wasn't the scary part.").
- **Show, don't narrate**: the narrator sets up, the picture delivers the joke or scare. Never narrate an
  emotion the face already shows. Mark at least 2 moments where the picture says something the narration doesn't.
- **1-3 short in-character lines** (1-5 words each, e.g. a gasp, "HEHEHE", "Ay, susmaryosep!") so the cast
  feel alive and the short isn't a pure read-aloud. Give them to the user to record/generate as separate clips
  with a different voice, or as labelled speakers in ElevenLabs.
- **No "like and subscribe" outro.** End on the twist or a line that loops into the first line; the
  last 0.3 s cuts straight back so the replay feels seamless. The call to action is a silent
  mid-video subscribe button instead (`project.cta`, Phase 6 step 3) — it never touches the ending.
- **Tone for teens/adults** (witty or spooky, "folklore explained"), not a children's moral lesson —
  this is who the channel is for, and it keeps the content honestly "not made for kids".
**Voice-over tips to include (ElevenLabs v3):** pick an expressive voice, stability "Natural" or
"Creative", use audio tags like [whispers] [laughs] [gasps] sparingly, "…" for a pause, CAPS for one
stressed word. Suggest (once, not every time) that the user's own voice or a clone of it stands out
from the wave of identical AI-narrated folklore Shorts.
Save it right away as `script/script.md` (full) and `script/script.txt` (narration only, exactly
as it will be spoken). Then send ONE message containing: the script, the narration-only text in a
code block ready to copy, and short voice-over instructions (ElevenLabs or their own voice,
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
   - Something visibly changes at least every 1.5 s (pose, face, camera move, prop, fx) — no dead stretch.
   - No actor keeps the same `face` for a whole scene longer than ~2.5 s; each beat gets a reaction.
   - Hold key poses/reactions ~0.3 s longer than feels natural; never snap a strong expression straight back to neutral.
   - Every camera move or angle must have a reason (reveal, emphasis, chaos) — say it in the scene `desc`.
   - **Colour script**: characters keep their colours; shift the location light/tint per story beat
     (warmer for safe/funny, darker or cooler for danger, a flash of red for the scare). Plan it in one line before building.
   - **Sound for every visible action** (step, grab, blink-pop, landing). A silence beat (`music.stops`) right before the punchline/scare.
   - Use one or two of the cast (Toby/Nan/Bramble/Pip) as recurring witnesses or reactors in each legend, so viewers
     recognise the same faces across the series.
2. **Captions**: start from `timing.captions`, fix names/casing, wrap 1-2 key words per
   sentence in `*stars*` (yellow highlight). Put the edited list in `project.json` as `"captions"`.
3. **SFX & music** cues in `project.json` (`python3 ~/pts/tools/audio.py --list` shows SFX names).
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
swiping fast stop at frame 0? (2) Any stretch > 1.5 s where nothing changes? (3) Any shot that only
illustrates the narration literally with no extra joke/feeling? (4) Same face held too long?
(5) Does the end cut cleanly back into the start? Fix what fails, then publish.

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
- **Concept first** (one idea each, matching the hook, never giving away the twist). Good pair:
  A = the "impossible" image of the story (the creature/transformation/weird object, made huge),
  B = the strongest emotion (a character's big exaggerated reaction + the key object next to them).
- **Compose it fresh** with the same engine so it stays on-model: 1-2 characters max, posed and
  framed bigger than in the video (face ≈ 25-35 % of the frame height), extreme expression, the key
  prop large and readable, a simple bold background (the location's hue, optionally a soft radial
  burst or vignette, no clutter), strong contrast, no captions. New poses, props, angles and
  arrangements that never appear in the video are encouraged.
- **How:** make a temp copy of the project (`/tmp/thumb_A/project-files/` with project.json,
  timing.json, custom.js) whose `scenes` is ONE new scene (start 0, the thumbnail layout) and
  `captions: []`; run build_preview on it and render `renderAt(0.5,'image/png')` at 1080×1920 with
  the same Playwright method as the production-guide spot check. Add any thumbnail-only props
  (burst, big arrow, glow) to that temp custom.js, never to the video's.
- Before showing, scale each to ~200 px wide and LOOK: the idea must read in under a second. Add a short title on top with ffmpeg `drawtext` using
`assets/Poppins-Bold.ttf`: 2-5 words, ALL CAPS, big (≈120-150 px), white with a thick dark outline,
one key word in yellow, placed in the top third so it never covers a face. The words must make
someone curious, not repeat the full title. Save as `final/thumbnail_A.png` and `thumbnail_B.png`,
LOOK at both yourself, then send them with SendUserFile together with the preview link and ask:
"Which thumbnail, A or B? (or tell me what to change)". Approving the preview + picking a
thumbnail happen in the same reply.
Revisions: change only the scenes named; rebuild → lint → republish. For a quick moving check of
one scene you may also render just that range: `node ~/pts/tools/render.js DIR --from 4.9 --to 7.3 --out /tmp/clip.mp4`.

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
Re-render the chosen thumbnail design (from its own thumbnail scene, in case characters or props
changed during revisions) and save it as
`final/<slug>_thumbnail.png`; also save a 1280×720 version `final/<slug>_thumbnail_16x9.png`
(same art, title kept inside the frame) for places that need a wide image.
Deliver: send the MP4 AND the thumbnail(s) with SendUserFile; tell the user in one line how to use
it (YouTube app → when uploading the Short, tap the thumbnail/cover → add from gallery); if a folder on their computer is connected, copy the
whole project there (final MP4 at `<folder>/<slug>/final/<slug>.mp4`, double-click to play).
**Upload text (send with the MP4, ready to copy):**
- **Title hook:** 3 options, each ≤ 60 characters (ideally ≤ 45 so it isn't cut off on phones).
  Each must make people curious (a question, a surprising claim, or a "wait, what?" fact) without
  giving away the twist, and must match the video's hook so it doesn't feel like clickbait.
  Mark your pick and say why in one line.
- **Description hook:** the first 1-2 lines are the hook (they show before "more"), then 2-3
  short lines of extra context or a fun fact that's true (checked on the web, mention a source or
  "versions differ by region" when relevant), then a comment question that invites an answer
  (e.g. "What's your province's version of this creature?" or "Which country are you watching from?"),
  then 3-5 hashtags (always include #shorts, plus topic tags like #philippines #folklore). Only the
  first 3 hashtags show above the title.
- **Title** follows the channel series template (see "Series identity") so viewers recognise the series.
- **Upload settings to tell the user:** Audience = answer honestly; this series is written for
  teens/adults, so normally "No, it's not made for kids" (YouTube can change it, and Made for Kids turns
  off comments and personalised ads). Altered/synthetic content = No (fully animated). Use only the
  synthesized music (licensed tracks take a share of Shorts revenue).
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
One line of notes + offer the next idea. Update nothing in this skill unless the user asks.

## Series identity (set once, then reuse)
The first time this section is used, propose 2-3 series names and title templates (e.g. "Pinoy
Creature Files: ___", "Philippine Legends: ___ 😱") and let the user pick; then keep the same name,
title template, intro hook-text style and thumbnail look for every short. Recognisable series grow
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