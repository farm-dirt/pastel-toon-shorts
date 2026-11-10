---
name: pastel-toon-shorts
description: Personal 2D animation studio for vertical YouTube Shorts in a pastel cartoon style (original cast, thick-outline characters, quiet pastel backgrounds). Use when the user wants to make, script, preview or render an animated Short with this style.
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
   zip of the repo and unzip it to `~/pts`.
2. Check tools, never assume: `node -v`, `ffmpeg -version`, `python3 -c "import numpy"`,
   `node -e "require('playwright')"` (use `NODE_PATH=$(npm root -g)` if it's a global install).
   Nothing else is needed. If something is missing, explain in one plain sentence what it is and
   why it's needed, and ask before installing (official sources only).
3. Read `reference/style-guide.md`, `reference/animation-guide.md`, `reference/characters.md`
   before planning scenes; read `reference/production-guide.md` before audio/render steps;
   `reference/content-playbook.md` for ideas and scripts.

The user is a beginner: simple words, define terms, say WHY, push back honestly on weak ideas,
warn before anything that deletes/overwrites. Keep each checkpoint message short.

## The workflow — phases in order, never skip a ⛔ checkpoint

### Phase 1 — Start  ⛔
Ask (AskUserQuestion when available): **"What would you like to create?"**
- *I already have a script* → ask them to paste/upload it → go to Phase 4 (review/tighten it, keep their voice).
- *I want a new script* → Phase 2.

### Phase 2 — Category  ⛔
Use `reference/content-playbook.md`. List 6-8 categories, one line each on why it works for
Shorts + 2D animation (hook strength, curiosity, storytelling, education/entertainment value).
Give your top pick and why. Wait for their choice.

### Phase 3 — 10 ideas  ⛔
For the chosen category: 10 original ideas, each with **title, 1-2 line description, the hook
(first 2 seconds), storytelling potential (★1-5 + why), why it animates well**. Flag your top 2.
Facts must be true — search the web for anything factual before pitching it.
Wait for the user to pick. Do not proceed on your own.

### Phase 4 — Script  ⛔
Write the script with the template in `content-playbook.md`: hook (0-2 s), setup, escalation,
twist/payoff, button ending, optional CTA. Per section: narration, est. duration
(~2.6 words/s), visuals, character actions, transition. Target 30-55 s (≈ 80-140 words).
Present it, revise until approved. Save as `script/script.md` (full) and `script/script.txt`
(narration only, exactly as it will be spoken). Tell the user how to make the voice-over
(e.g. ElevenLabs or their own voice, MP3/WAV, read the narration exactly, small pauses between sentences).

### Phase 5 — Voice-over  ⛔ STOP and wait for the upload
Never build animation before the voice-over arrives. When it arrives:
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
2. **Captions**: start from `timing.captions`, fix names/casing, wrap 1-2 key words per
   sentence in `*stars*` (yellow highlight). Put the edited list in `project.json` as `"captions"`.
3. **SFX & music** cues in `project.json` (`python3 ~/pts/tools/audio.py --list` shows SFX names).
4. Build & check:
```bash
python3 ~/pts/tools/audio.py ~/shorts/<slug>          # mix.wav + mix.mp3 (levels: production-guide)
python3 ~/pts/tools/build_preview.py ~/shorts/<slug>  # preview/ = the REAL animation
NODE_PATH=$(npm root -g) node ~/pts/tools/lint.js ~/shorts/<slug>   # must say OK
```
Fix every lint line (move camera / actors), rebuild, re-lint. Then render 3-5 stills at key
moments (see production-guide "spot check") and LOOK at them yourself before showing the user.

### Phase 7 — Browser preview  ⛔ approval required
Publish `preview/artifact.html` with the Artifact tool, `files` = characters.js, backgrounds.js,
engine.js, data.js, custom.js (if any), audio/mix.mp3, assets/Poppins-Bold.ttf (same paths).
Republish to the SAME file path on every revision (keeps one link). Also copy the preview folder
to the user's computer if a folder is connected (opening `index.html` works offline).
Tell the user: press ▶, use "Play this scene" to loop a scene, type change requests in the
boxes, then "Copy my notes for Claude" and paste them back; "Approve" when happy.
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
Deliver: send the MP4 with SendUserFile; if a folder on their computer is connected, copy the
whole project there (final MP4 at `<folder>/<slug>/final/<slug>.mp4`, double-click to play).
One line of notes + offer the next idea. Update nothing in this skill unless the user asks.

## Hard rules
1. Phases in order; never skip ⛔ approvals; never animate before the voice-over; never final-render before preview approval.
2. Original characters only (cast + rig in `characters.js`); add new ones as new CAST entries following `characters.md`.
3. Preview and final come from the same `drawFrame` engine — never "fake" the preview with stills.
4. Background music/SFX must never compete with the voice (levels in production-guide).
5. Automate: the user should never need to type terminal commands.
6. No new installs without asking. Keep it simple, buildable, testable.
