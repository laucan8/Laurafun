// still.js — render frame tertentu ke PNG untuk QA.  node still.js <outdir> <spec...>
// spec: detik absolut (mis. 12.5) atau "sid@lokal" (mis. s10@6.2). Opsi env: SCALE=0.5
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const [out, ...specs] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const logs = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); p.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8800}/index.html${process.env.URLQ || ''}`); await p.waitForFunction('window.ready===true', null, { timeout: 120000 });
  for (const s of specs) {
    const t = s.includes('@') ? await p.evaluate(([id, l]) => window.sceneT(id, l), [s.split('@')[0], parseFloat(s.split('@')[1])]) : parseFloat(s);
    const t0 = Date.now(); await p.evaluate((tt) => window.renderAt(tt), t);
    const f = path.join(out, s.replace('@', '_') + '.png'); const el = await p.$('#stage'); await el.screenshot({ path: f, scale: 'css' });
    console.log('ok', s, 't=' + t.toFixed(2), (Date.now() - t0) + 'ms', f);
  }
  if (logs.length) console.log(logs.slice(0, 30).join('\n'));
  await b.close();
})();
