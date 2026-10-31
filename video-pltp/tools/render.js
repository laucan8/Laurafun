// render.js — render produksi: antrean chunk frame -> PNG -> ffmpeg (x264) per chunk. Bisa dilanjutkan (skip chunk selesai).
// node render.js <outdir> [workers=4] [chunkFrames=1200] [onlyChunks=comma]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'); const path = require('path');
const [outdir, W = '4', CF = '1200', ONLY = ''] = process.argv.slice(2);
const workers = parseInt(W), chunkFrames = parseInt(CF);
fs.mkdirSync(outdir, { recursive: true });
const TL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'engine', 'timeline.json')));
const total = TL.frames, fps = TL.fps;
const chunks = []; for (let a = 0, k = 0; a < total; a += chunkFrames, k++) chunks.push({ k, a, b: Math.min(total, a + chunkFrames) });
const only = ONLY ? new Set(ONLY.split(',').map(Number)) : null;
const queue = chunks.filter((c) => (!only || only.has(c.k)) && !fs.existsSync(path.join(outdir, `c${String(c.k).padStart(3, '0')}.done`)));
const log = (...a) => { const s = `[${new Date().toISOString().slice(11, 19)}] ` + a.join(' '); console.log(s); fs.appendFileSync(path.join(outdir, 'render.log'), s + '\n'); };
log(`total=${total} frames, chunks=${chunks.length}, todo=${queue.length}, workers=${workers}`);
async function worker(id) {
  let browser = null, page = null;
  const boot = async () => { if (browser) await browser.close().catch(() => {}); browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); page.on('pageerror', (e) => log(`w${id} PAGEERROR ${e.message}`)); await page.goto(`http://127.0.0.1:${process.env.PORT || 8800}/index.html`); await page.waitForFunction('window.ready===true', null, { timeout: 180000 }); };
  await boot();
  while (queue.length) {
    const c = queue.shift(); const name = `c${String(c.k).padStart(3, '0')}`; const mp4 = path.join(outdir, name + '.mp4');
    const t0 = Date.now(); let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-x264-params', 'keyint=60:min-keyint=60:scenecut=0', '-r', String(fps), mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
        const done = new Promise((res, rej) => ff.on('close', (code) => (code === 0 ? res() : rej(new Error('ffmpeg ' + code)))));
        for (let f = c.a; f < c.b; f++) {
          await page.evaluate((t) => window.renderAt(t), f / fps);
          const buf = await page.screenshot({ type: 'png' });
          if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
          if ((f - c.a) % 300 === 299) log(`w${id} ${name} ${f - c.a + 1}/${c.b - c.a} ${((Date.now() - t0) / (f - c.a + 1)).toFixed(0)}ms/f`);
        }
        ff.stdin.end(); await done; ok = true;
      } catch (e) { log(`w${id} ${name} ERROR ${e.message} — reboot & retry`); await boot(); }
    }
    if (ok) { fs.writeFileSync(path.join(outdir, name + '.done'), String(Date.now() - t0)); log(`w${id} ${name} DONE frames ${c.a}-${c.b} in ${((Date.now() - t0) / 1000).toFixed(0)}s (${((Date.now() - t0) / (c.b - c.a)).toFixed(0)} ms/f) — sisa antrean ${queue.length}`); }
    else log(`w${id} ${name} FAILED`);
  }
  await browser.close();
}
(async () => { await Promise.all(Array.from({ length: workers }, (_, i) => worker(i))); log('ALL DONE'); })();
