// Screenshot a local HTML page's canvas: node shot.js page.html out.png [w h]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [page_, out, w = 2400, h = 2000] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(page_));
  await p.waitForFunction(() => window.DONE === true, null, { timeout: 20000 });
  await p.screenshot({ path: out });
  await b.close();
})();
