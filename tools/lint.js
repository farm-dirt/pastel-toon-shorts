#!/usr/bin/env node
// Layout check before showing the preview: usage node lint.js PROJECT_DIR
// Reports caption/face overlaps, cut-off heads, faces outside the YouTube Shorts safe box (x 48-888, y 180-1500,
// caution strip y 1250-1500), a missing or misplaced subscribe CTA, and banned sounds.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const P = path.resolve(process.argv[2]);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.join(P, 'preview', 'index.html') + '?render=1');
  await p.evaluate(() => window.READY);
  const issues = await p.evaluate(() => window.lintProject(0.1));
  await b.close();
  if (!issues.length) { console.log('lint: OK — faces inside the safe box, no caption overlaps, CTA placed, no banned sounds'); return; }
  for (const i of issues) console.log(i.scene === '-' ? `lint: ${i.problem}` : `lint: ${i.scene}  ${i.from.toFixed(1)}–${i.to.toFixed(1)} s  ${i.who}: ${i.problem}`);
  process.exitCode = 2;
})();
