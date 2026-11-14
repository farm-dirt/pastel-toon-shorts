# Recorded sound effects (user's own library, copied from paper-diorama-shorts)

Any WAV/MP3/FLAC/OGG here is usable in `project.json` by its file name:
`{"t": 3.2, "name": "paper_rip", "gain": 1.0, "dur": 1.5, "fadeIn": 0.2, "fadeOut": 0.5}`.
A recorded file with the same name as a synth sound replaces it; the synth stays as `<name>_synth`.
All files: leading silence trimmed, mono 48 kHz, long ambiences cut to 60 s. Check with `python3 tools/audio.py --list`.

- Paper: `paper_rip` (big rip), `paper_tear` (short tear), `paper_rustle` (movement, hands), `page_flip` (scene/time change)
- Hits & stings: `impact_hit`, `impact_boom`, `low_hit`, `deep_boom`, `trailer_boom`, `suspense_sting`, `dark_click`, `riser`
- Whooshes: `whoosh_cinematic`, `sparkle_whoosh`
- Magic: `magic_sparkle`, `bell`
- Comedy / UI: `falling_whistle`, `pop`
- Action: `sword_clash`, `rocks`, `water_splash`, `thunder`, `door_creak`, `footsteps_gravel`
- Creatures/body: `monster_growl`, `heartbeat`
- Ambience (quiet `gain` 0.3-0.5, use `dur` + fades): `wind` (soft), `wind_howl` (strong), `fire_crackle`, `night_ambience`, `horror_drone`
