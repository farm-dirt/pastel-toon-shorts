#!/usr/bin/env node
// Final render: steps the SAME preview page frame by frame -> MP4 with the mixed audio.
// usage: node render.js PROJECT_DIR [--from SEC --to SEC] [--workers N] [--out file.mp4]
// Needs: playwright (preinstalled) + ffmpeg. No other installs.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const args = process.argv.slice(2);
const P = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const data = fs.readFileSync(path.join(P, 'preview', 'data.js'), 'utf8');
const proj = JSON.parse(data.replace(/^window\.PROJECT = /, '').replace(/;\s*$/, ''));
const FPS = proj.fps || 30, DUR = proj.timing.dur;
const NF = Math.round(DUR * FPS);
const f0 = Math.round(+opt('--from', 0) * FPS), f1 = Math.min(NF, Math.round(+opt('--to', DUR) * FPS));
const workers = Math.max(1, Math.min(+opt('--workers', os.cpus().length), 4));
const partial = f0 > 0 || f1 < NF;
const outFile = path.resolve(opt('--out', path.join(P, 'final', `${proj.slug || 'short'}.mp4`)));
const tmp = path.join(P, 'project-files', 'render-tmp'); fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(path.dirname(outFile), { recursive: true });

async function worker(k, a, b, browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.join(P, 'preview', 'index.html') + '?render=1');
  await page.evaluate(() => window.READY);
  const seg = path.join(tmp, `seg_${String(k).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', String(FPS), '-r', String(FPS), seg],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const BATCH = 6;
  for (let f = a; f < b; f += BATCH) {
    const ts = []; for (let j = f; j < Math.min(b, f + BATCH); j++) ts.push(j / FPS);
    const urls = await page.evaluate((ts) => ts.map((t) => window.renderAt(t, 'image/png')), ts);
    for (const u of urls) {
      const buf = Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (k === 0) process.stdout.write(`\r  worker0 ${Math.round((f - a) / (b - a) * 100)}%   `);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  await page.close();
  return seg;
}

(async () => {
  const t0 = Date.now();
  console.log(`render ${f1 - f0} frames (${(f0 / FPS).toFixed(2)}–${(f1 / FPS).toFixed(2)} s) with ${workers} workers`);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  const per = Math.ceil((f1 - f0) / workers), jobs = [];
  for (let k = 0; k < workers; k++) {
    const a = f0 + k * per, b = Math.min(f1, a + per);
    if (a < b) jobs.push(worker(k, a, b, browser));
  }
  const segs = await Promise.all(jobs);
  await browser.close();
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const video = path.join(tmp, 'video.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
  const mix = path.join(P, 'audio', 'mix.wav');
  const a = ['-v', 'error', '-y', '-i', video];
  if (fs.existsSync(mix)) a.push('-ss', String(f0 / FPS), '-t', String((f1 - f0) / FPS), '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
  a.push('-c:v', 'copy', '-t', String((f1 - f0) / FPS), '-movflags', '+faststart', outFile);
  execFileSync('ffmpeg', a);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\ndone ${outFile}  (${((Date.now() - t0) / 1000).toFixed(1)} s${partial ? ', partial clip' : ''})`);
})().catch((e) => { console.error(e); process.exit(1); });
