# Recorded sound effects (user's own library, copied from paper-diorama-shorts)

Any WAV/MP3/FLAC/OGG here is usable in `project.json` by its file name:
`{"t": 3.2, "name": "paper_rip", "gain": 1.0, "dur": 1.5, "fadeIn": 0.2, "fadeOut": 0.5}`.
A recorded file with the same name as a synth sound replaces it; the synth stays as `<name>_synth`.
All files: leading silence trimmed, mono 48 kHz, long ambiences cut to 60 s. Check with `python3 tools/audio.py --list`.

- Paper: `paper_rip` (big rip), `paper_tear` (short tear), `paper_rustle` (movement, hands), `page_flip` (scene/time change)
- Hits & stings: `impact_hit`, `impact_boom`, `low_hit`, `deep_boom`, `trailer_boom`, `suspense_sting`, `riser`
- Whooshes: `whoosh_cinematic`, `sparkle_whoosh`
- Magic: `magic_sparkle`, `bell`
- Comedy / UI: `falling_whistle`, `pop`
- Action: `sword_clash`, `rocks`, `water_splash`, `thunder`, `door_creak`, `footsteps_gravel`
- Creatures/body: `monster_growl`, `heartbeat`
- Ambience (quiet `gain` 0.3-0.5, use `dur` + fades): `wind_howl` (wind), `fire_crackle`, `night_ambience`, `horror_drone`

**Removed (user rule, Nov 2026):** `wind` and `dark_click` were deleted: both were low rumbles that droned under scenes.
`audio.py` and `lint.js` refuse those names, and `audio.py` stops on any unknown sound name instead of skipping it.

## Sources and licences (fill in)

These files came from the user's own downloads. Where each file came from and its licence were not
recorded when they were added. Fill in the table the next time you have the source pages open, so you
can show you are allowed to use a file if a video is ever claimed. Keep only files whose licence allows
use in monetised videos.

| File | Source (site / author / link) | Licence |
| --- | --- | --- |
| (each file) | not recorded | not recorded |
