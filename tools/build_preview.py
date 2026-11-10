#!/usr/bin/env python3
"""Assemble PROJECT_DIR/preview/ : a self-contained page that plays the REAL animation.

usage: python3 build_preview.py PROJECT_DIR
Copies the engine, writes preview/data.js (project + timing merged), copies audio/mix.mp3.
The same folder is what render.js loads (with ?render=1), so preview == final.
Works opened straight from disk (file://) and when published as an Artifact.
"""
import json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(ROOT, 'engine')


def main():
    P = sys.argv[1]
    pf = os.path.join(P, 'project-files')
    proj = json.load(open(os.path.join(pf, 'project.json')))
    tim = json.load(open(os.path.join(pf, 'timing.json')))
    out = os.path.join(P, 'preview'); os.makedirs(os.path.join(out, 'assets'), exist_ok=True)
    os.makedirs(os.path.join(out, 'audio'), exist_ok=True)
    for f in ['characters.js', 'backgrounds.js', 'engine.js']:
        shutil.copy(os.path.join(ENGINE, f), out)
    body = open(os.path.join(ENGINE, 'preview.html'), encoding='utf-8').read().replace('__TITLE__', proj.get('title', 'Preview'))
    # artifact.html = page body only (the Artifact publisher adds the document skeleton)
    open(os.path.join(out, 'artifact.html'), 'w', encoding='utf-8').write(body)
    # index.html = full document for opening from disk and for render.js
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>body{margin:0}</style></head><body>\n' + body + '\n</body></html>\n')
    shutil.copy(os.path.join(ENGINE, 'assets', 'Poppins-Bold.ttf'), os.path.join(out, 'assets'))
    custom = os.path.join(pf, 'custom.js')
    if os.path.exists(custom):
        shutil.copy(custom, out)
    elif os.path.exists(os.path.join(out, 'custom.js')):
        os.remove(os.path.join(out, 'custom.js'))
    mp3 = os.path.join(P, 'audio', 'mix.mp3')
    if os.path.exists(mp3):
        shutil.copy(mp3, os.path.join(out, 'audio', 'mix.mp3'))
        proj['audio'] = 'audio/mix.mp3'
    # timing: keep what the engine/preview needs
    proj['timing'] = {k: tim[k] for k in ['dur', 'envFps', 'env', 'speech', 'pauses', 'sentences'] if k in tim}
    if 'captions' not in proj and 'captions' in tim:
        proj['captions'] = tim['captions']
    # sanity: scenes must tile the whole voice-over with no gaps
    sc = proj['scenes']; dur = tim['dur']
    sc[0]['start'] = 0.0; sc[-1]['end'] = round(dur, 4)
    for a, b in zip(sc, sc[1:]):
        if abs(a['end'] - b['start']) > 1e-3:
            print(f"!! gap/overlap between {a.get('id')} ({a['end']}) and {b.get('id')} ({b['start']}) — fixing to {b['start']}")
            a['end'] = b['start']
    with open(os.path.join(out, 'data.js'), 'w') as f:
        f.write('window.PROJECT = ' + json.dumps(proj, separators=(',', ':')) + ';\n')
    print('preview ready:', os.path.join(out, 'index.html'), f'({len(sc)} scenes, {dur:.2f}s)')


if __name__ == '__main__':
    main()
