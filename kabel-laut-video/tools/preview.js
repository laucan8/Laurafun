// usage: node tools/preview.js 12.5 30 61 ...   -> build/preview/f_<t>.jpg ; with SHEET=name makes contact sheet
const { chromium } = require('playwright'); const start = require('./server'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
(async () => {
  const port = 8200 + Math.floor(Math.random() * 500); await start(port);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('console', m => { const s = m.text(); if (!/GPU stall|GL Driver/.test(s)) console.log('C:', s); }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto(`http://localhost:${port}/src/index.html`); await pg.waitForFunction('window.ready', null, { timeout: 60000 });
  const out = []; const ts = process.argv.slice(2).map(Number);
  for (const t of ts) {
    const t0 = Date.now(); await pg.evaluate(t => renderAt(t), t); const d = await pg.evaluate(() => grab(0.9));
    const f = path.join(__dirname, '..', 'build', 'preview', `f_${t.toFixed(2)}.jpg`); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); out.push(f);
    console.log('t', t, 'ms', Date.now() - t0);
  }
  await b.close();
  if (process.env.SHEET && out.length > 1) {
    const cols = Math.min(3, out.length); const args = []; out.forEach(f => args.push('-i', f));
    const filt = out.map((_, i) => `[${i}:v]scale=640:360[v${i}]`).join(';') + ';' + out.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${out.length}:layout=` + out.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|') + '[o]';
    execFileSync('ffmpeg', ['-y', '-v', 'error', ...args, '-filter_complex', out.length > 1 ? filt : '', '-map', '[o]', path.join(__dirname, '..', 'build', 'preview', process.env.SHEET + '.jpg')]);
    console.log('sheet', process.env.SHEET);
  }
  process.exit(0);
})();
