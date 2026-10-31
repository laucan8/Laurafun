// Parallel chunked renderer: node tools/render.js <workers> [chunkFrames]
const { chromium } = require('playwright'); const start = require('./server');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const B = path.join(__dirname, '..', 'build'); const CH = path.join(B, 'chunks');
const TL = JSON.parse(fs.readFileSync(path.join(B, 'timeline.json')));
const FPS = 30, N = Math.ceil(TL.duration * FPS), CF = +(process.argv[3] || 600), NW = +(process.argv[2] || 4);
let chunks = []; for (let s = 0, i = 0; s < N; s += CF, i++) chunks.push({ i, s, e: Math.min(N, s + CF) });
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
const log = (...a) => { const l = new Date().toISOString().slice(11, 19) + ' ' + a.join(' '); console.log(l); fs.appendFileSync(path.join(B, 'render.log'), l + '\n'); };
function claim() { for (const c of chunks) { if (ONLY && !ONLY.includes(c.i)) continue; const f = path.join(CH, `c_${String(c.i).padStart(4, '0')}.mp4`); if (fs.existsSync(f)) continue; try { fs.mkdirSync(f + '.lock'); return { ...c, f }; } catch (e) { } } return null; }
async function worker(w, port) {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  pg.on('pageerror', e => log('W' + w, 'PAGEERR', e.message));
  await pg.goto(`http://localhost:${port}/src/index.html`); await pg.waitForFunction('window.ready', null, { timeout: 120000 });
  let c;
  while ((c = claim())) {
    const tmp = c.f.replace('.mp4', '.tmp.mp4'); const t0 = Date.now();
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-g', '60', '-threads', '2', '-movflags', '+faststart', tmp]);
    ff.stderr.on('data', d => log('W' + w, 'FF', String(d).trim()));
    const done = new Promise(r => ff.on('close', r));
    for (let f = c.s; f < c.e; f++) {
      const d = await pg.evaluate(async t => { await renderAt(t); return grab(0.92); }, f / FPS);
      const buf = Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); const code = await done;
    if (code === 0) { fs.renameSync(tmp, c.f); fs.rmdirSync(c.f + '.lock'); const dt = (Date.now() - t0) / 1000; const doneN = fs.readdirSync(CH).filter(x => /^c_\d+\.mp4$/.test(x)).length; log(`W${w} chunk ${c.i} frames ${c.s}-${c.e} in ${dt.toFixed(0)}s (${((c.e - c.s) / dt).toFixed(2)} fps) | done ${doneN}/${chunks.length}`); }
    else { log('W' + w, 'chunk', c.i, 'FAILED code', code); try { fs.rmdirSync(c.f + '.lock'); } catch (e) { } }
  }
  await b.close();
}
(async () => {
  if (!process.env.NOCLEAN) for (const f of fs.readdirSync(CH)) if (f.endsWith('.lock')) fs.rmdirSync(path.join(CH, f));
  const port = +(process.env.PORT || 9300); await start(port);
  log(`START frames=${N} chunks=${chunks.length} workers=${NW}`);
  await Promise.all(Array.from({ length: NW }, (_, w) => worker(w, port).catch(e => log('W' + w, 'CRASH', e.stack))));
  const doneN = fs.readdirSync(CH).filter(x => /^c_\d+\.mp4$/.test(x)).length;
  log(doneN === chunks.length ? 'ALL_DONE' : `INCOMPLETE ${doneN}/${chunks.length}`); process.exit(0);
})();
