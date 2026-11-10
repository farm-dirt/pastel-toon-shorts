#!/usr/bin/env python3
"""Create the standard project folder. usage: python3 new_project.py PARENT_DIR slug "Title"."""
import json, os, sys

DIRS = ['script', 'voice-over', 'characters', 'assets', 'scenes', 'audio', 'preview', 'final', 'project-files']


def main():
    parent, slug, title = sys.argv[1], sys.argv[2], sys.argv[3]
    P = os.path.join(parent, slug)
    for d in DIRS:
        os.makedirs(os.path.join(P, d), exist_ok=True)
    pj = os.path.join(P, 'project-files', 'project.json')
    if not os.path.exists(pj):
        json.dump({'id': slug, 'slug': slug, 'title': title, 'fps': 30, 'voice': 'voice.mp3',
                   'captionY': 400, 'music': {'on': True, 'bpm': 112, 'key': 0, 'stops': []},
                   'mix': {'music': 0.08, 'musicPause': 0.14, 'sfx': 0.35},
                   'sfx': [], 'scenes': []}, open(pj, 'w'), indent=2)
    with open(os.path.join(P, 'README.txt'), 'w') as f:
        f.write(f"""{title}
final/        <- the finished MP4 is here (double-click to play)
preview/      <- open index.html in a browser to watch the animated preview
script/       script.md (approved script)
voice-over/   your uploaded narration
characters/   model sheet used for this video
scenes/       one still per scene + contact sheet (QA)
audio/        mix.wav (voice + music + sound effects)
project-files/ project.json (scene plan), timing.json (voice analysis)
""")
    print(P)


if __name__ == '__main__':
    main()
