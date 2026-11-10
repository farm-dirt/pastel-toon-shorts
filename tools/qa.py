#!/usr/bin/env python3
"""Final QA for a rendered short. usage: python3 qa.py PROJECT_DIR VIDEO.mp4
Checks export settings, sync length, loudness, black/frozen frames, and writes
scenes/contact_sheet.jpg (one still from the middle of every scene) to eyeball
character consistency, text readability and safe zones.
"""
import json, os, re, subprocess, sys


def run(a):
    return subprocess.run(a, capture_output=True, text=True)


def main():
    P, V = sys.argv[1], sys.argv[2]
    data = open(os.path.join(P, 'preview', 'data.js')).read()
    proj = json.loads(re.sub(r'^window\.PROJECT = ', '', data).rstrip().rstrip(';'))
    dur = proj['timing']['dur']; fps = proj.get('fps', 30)
    pr = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', V]).stdout)
    vs = next(s for s in pr['streams'] if s['codec_type'] == 'video')
    aus = [s for s in pr['streams'] if s['codec_type'] == 'audio']
    nb = int(run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', V]).stdout.strip())
    fr = vs['r_frame_rate'].split('/'); vfps = int(fr[0]) / int(fr[1])
    fdur = float(pr['format']['duration'])
    res = []
    def chk(name, ok, info): res.append((ok, name, info))
    chk('resolution 1080x1920', vs['width'] == 1080 and vs['height'] == 1920, f"{vs['width']}x{vs['height']}")
    chk(f'frame rate {fps}', abs(vfps - fps) < 0.01, f'{vfps:.2f}')
    chk('frame count matches voice', abs(nb - round(dur * fps)) <= 1, f'{nb} vs {round(dur * fps)}')
    chk('duration matches voice (±0.1 s)', abs(fdur - dur) <= 0.1, f'{fdur:.2f} vs {dur:.2f}')
    chk('H.264 + yuv420p (plays everywhere)', vs['codec_name'] == 'h264' and vs.get('pix_fmt') == 'yuv420p', f"{vs['codec_name']} {vs.get('pix_fmt')}")
    chk('audio track present (AAC)', bool(aus) and aus[0]['codec_name'] == 'aac', aus[0]['codec_name'] if aus else 'none')
    if aus:
        o = run(['ffmpeg', '-hide_banner', '-i', V, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
        I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1]); tp = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)[-1])
        chk('loudness about -14 LUFS', -15.5 <= I <= -12.5, f'{I:.1f} LUFS')
        chk('true peak <= -1 dBFS', tp <= -0.9, f'{tp:.1f} dBFS')
    o = run(['ffmpeg', '-hide_banner', '-i', V, '-vf', 'blackdetect=d=0.1:pix_th=0.05', '-an', '-f', 'null', '-']).stderr
    chk('no black frames', 'black_start' not in o, 'ok' if 'black_start' not in o else 'black frames found')
    o = run(['ffmpeg', '-hide_banner', '-i', V, '-vf', 'freezedetect=n=0.0005:d=1.5', '-an', '-f', 'null', '-']).stderr
    fz = re.findall(r'freeze_start: ([\d.]+)', o)
    chk('no frozen stretches > 1.5 s', not fz, 'ok' if not fz else 'frozen at ' + ', '.join(fz))
    # contact sheet
    os.makedirs(os.path.join(P, 'scenes'), exist_ok=True)
    mids = [(s['start'] + s['end']) / 2 for s in proj['scenes']]
    tiles = []
    for i, m in enumerate(mids):
        p = os.path.join(P, 'scenes', f'scene_{i + 1:02d}.jpg')
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{m:.3f}', '-i', V, '-frames:v', '1', '-q:v', '3', p]); tiles.append(p)
    cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols
    inp = sum([['-i', t] for t in tiles], [])
    layout = '|'.join(f'{(i % cols) * 270}_{(i // cols) * 480}' for i in range(len(tiles)))
    fc = ''.join(f'[{i}:v]scale=270:480[s{i}];' for i in range(len(tiles))) + ''.join(f'[s{i}]' for i in range(len(tiles))) + \
        f'xstack=inputs={len(tiles)}:layout={layout}:fill=black'
    if len(tiles) > 1:
        run(['ffmpeg', '-v', 'error', '-y', *inp, '-filter_complex', fc, os.path.join(P, 'scenes', 'contact_sheet.jpg')])
    bad = [r for r in res if not r[0]]
    for ok, n, info in res:
        print(('PASS ' if ok else 'FAIL ') + f'{n:38s} {info}')
    print('contact sheet:', os.path.join(P, 'scenes', 'contact_sheet.jpg'))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
