#!/usr/bin/env python3
"""Render a designed thumbnail (NOT a video frame) with the real engine, then add the title.

usage: python3 thumb.py PROJECT_DIR --thumb project-files/thumb_A.json --title "2-5 WORDS" --hl KEYWORD
                        [--out final/thumbnail_A.png] [--t 1.5] [--wide]

thumb_A.json = ONE scene object, same schema as a project scene ("location", "camera", "actors",
"props", "fx"). Its times are scene-local; it is rendered over 0-2 s and captured at --t (default
1.5 s, after the shot's settle-in). No captions, no CTA.
Custom props/backgrounds: the project's project-files/custom.js is loaded as usual. Thumbnail-only
props go in a file next to the JSON called thumb_custom.js:
    window.CUSTOM_THUMB = { props: { burst(ctx, size, state, t) { ... } }, bg: { ... } };
It is merged over custom.js for the thumbnail only; the video's files are never touched.

Title: Poppins Bold, ALL CAPS, white with a thick dark outline, the --hl word in yellow, top third.
--wide also writes a 1280x720 copy (<out>_16x9.png): the same art, centred on a blurred fill, with
the title inside the frame.
Needs: node + playwright (same as render.js), Pillow.
"""
import json, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(ROOT, 'engine')
FONT = os.path.join(ENGINE, 'assets', 'Poppins-Bold.ttf')
INK = (34, 24, 48)
YELLOW = (255, 214, 64)

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Cap;src:url(Poppins-Bold.ttf)}@font-face{font-family:Poppins;src:url(Poppins-Bold.ttf)}
body{margin:0}</style></head><body><canvas id="cv" width="1080" height="1920"></canvas>
<script src="characters.js"></script><script src="backgrounds.js"></script><script src="engine.js"></script>
<script src="custom.js" onerror="void 0"></script><script src="thumb_custom.js" onerror="void 0"></script>
<script src="data.js"></script><script>
const P = window.PROJECT, C = window.CUSTOM || {}, T = window.CUSTOM_THUMB || {};
P.custom = { props: Object.assign({}, C.props || {}, T.props || {}), bg: Object.assign({}, C.bg || {}, T.bg || {}) };
const ctx = document.getElementById('cv').getContext('2d');
window.READY = Promise.all([document.fonts.load('80px Cap'), document.fonts.load('80px Poppins')]).catch(() => {}).then(() => true);
window.renderAt = (t) => { PT.renderFrame(ctx, P, t); return { png: document.getElementById('cv').toDataURL('image/png'), heads: (PT._heads || []).map((h) => ({ who: h.who, top: h.top, bottom: h.bottom })) }; };
</script></body></html>"""

NODE = r"""
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [dir, t, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + dir + '/index.html'); await p.evaluate(() => window.READY);
  const r = await p.evaluate((t) => window.renderAt(t), +t);
  fs.writeFileSync(out, Buffer.from(r.png.split(',')[1], 'base64')); fs.writeFileSync(out + '.json', JSON.stringify(r.heads)); await b.close();
  if (errs.length) { console.error('page errors: ' + errs.join(' | ')); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });
"""


def opt(a, name, default=None):
    return a[a.index(name) + 1] if name in a else default


def wrap(draw, text, font, maxw):
    lines, cur = [], ''
    for w in text.split():
        trial = (cur + ' ' + w).strip()
        if cur and draw.textlength(trial, font=font) > maxw:
            lines.append(cur); cur = w
        else:
            cur = trial
    if cur: lines.append(cur)
    return lines


def draw_title(img, title, hl, top, maxw, size):
    """Centred ALL-CAPS title, white with a thick dark outline, the hl word in yellow."""
    d = ImageDraw.Draw(img)
    title = title.upper(); hl = (hl or '').upper().strip('.,!?…')
    while True:
        f = ImageFont.truetype(FONT, size)
        lines = wrap(d, title, f, maxw)
        if (len(lines) <= 3 and all(d.textlength(l, font=f) <= maxw for l in lines)) or size <= 48:
            break
        size -= 6
    stroke = max(6, size // 9); y = top
    for ln in lines:
        x = (img.width - d.textlength(ln, font=f)) / 2
        for w in ln.split():
            col = YELLOW if hl and w.strip('.,!?…') == hl else (255, 255, 255)
            d.text((x, y), w, font=f, fill=col, stroke_width=stroke, stroke_fill=INK)
            x += d.textlength(w + ' ', font=f)
        y += int(size * 1.12)
    return y


def main():
    a = sys.argv[1:]
    if not a or '--thumb' not in a:
        sys.exit(__doc__)
    P = os.path.abspath(a[0])
    tj = opt(a, '--thumb'); tj = tj if os.path.isabs(tj) else os.path.join(P, tj)
    out = opt(a, '--out', 'final/thumbnail.png'); out = out if os.path.isabs(out) else os.path.join(P, out)
    t = float(opt(a, '--t', 1.5))
    sc = json.load(open(tj))
    if isinstance(sc, dict) and 'scenes' in sc:  # a whole project file was passed: use its first scene
        sc = sc['scenes'][0]
    sc = dict(sc, start=0, end=2.0, transition='cut')
    proj = json.load(open(os.path.join(P, 'project-files', 'project.json')))
    data = {'id': proj.get('id', 'thumb'), 'title': proj.get('title', ''), 'fps': 30, 'scenes': [sc],
            'captions': [], 'showCaptions': False, 'timing': {'dur': 2.0, 'envFps': 30, 'env': [], 'speech': [], 'pauses': []}}
    work = tempfile.mkdtemp(prefix='thumb-')
    try:
        for f in ['characters.js', 'backgrounds.js', 'engine.js']:
            shutil.copy(os.path.join(ENGINE, f), work)
        shutil.copy(FONT, work)
        cj = os.path.join(P, 'project-files', 'custom.js')
        if os.path.exists(cj): shutil.copy(cj, work)
        tc = os.path.join(os.path.dirname(tj), 'thumb_custom.js')
        if os.path.exists(tc): shutil.copy(tc, work)
        open(os.path.join(work, 'data.js'), 'w').write('window.PROJECT = ' + json.dumps(data) + ';\n')
        open(os.path.join(work, 'index.html'), 'w').write(PAGE)
        js = os.path.join(work, 'shot.js'); open(js, 'w').write(NODE)
        raw = os.path.join(work, 'raw.png')
        env = dict(os.environ)
        try:
            env['NODE_PATH'] = subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()
        except OSError:
            pass
        r = subprocess.run(['node', js, work, str(t), raw], env=env, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit('!! thumbnail render failed: ' + (r.stderr or r.stdout).strip()[:800])
        art = Image.open(raw).convert('RGB')
        heads = json.load(open(raw + '.json'))
    finally:
        shutil.rmtree(work, ignore_errors=True)
    title = opt(a, '--title', ''); hl = opt(a, '--hl', '')
    img = art.copy()
    if title:
        bottom = draw_title(img, title, hl, top=230, maxw=960, size=150)
        for h in heads:
            if h['top'] < bottom and h['bottom'] > 230:
                print(f"!! the title (y 230-{bottom}) covers {h['who']}'s face (y {h['top']:.0f}-{h['bottom']:.0f}): "
                      "lower the camera y or zoom out so the face sits below the title")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out)
    print(out)
    if '--wide' in a:
        W, H = 1280, 720
        bg = art.resize((W, int(art.height * W / art.width)))
        top = (bg.height - H) // 2
        bg = bg.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(28))
        fg = art.resize((int(art.width * H / art.height), H))
        wide = bg.copy(); wide.paste(fg, ((W - fg.width) // 2, 0))
        if title:
            draw_title(wide, title, hl, top=40, maxw=1180, size=96)
        wout = os.path.splitext(out)[0] + '_16x9.png'
        wide.save(wout)
        print(wout)


if __name__ == '__main__':
    main()
