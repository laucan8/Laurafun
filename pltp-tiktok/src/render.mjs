// Deterministic frame renderer: headless Chromium (Playwright) -> JPEG frames -> ffmpeg.
// Usage:
//   node src/render.mjs --stills 0,6.5,14            -> build/stills/*.jpg
//   node src/render.mjs --video --workers 3          -> out/pltp_noaudio.mp4
//   node src/render.mjs --video --from 30 --to 40 --out build/test.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.jpg': 'image/jpeg', '.png': 'image/png' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, resp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { resp.writeHead(404); resp.end(); return; }
      resp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(resp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(port) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--disable-gpu-compositing'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1${arg('q', '')}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  page._cdp = await page.context().newCDPSession(page);
  return { browser, page };
}

async function shot(page, t) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  const r = await page._cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
}

async function stills(port) {
  const ts = arg('stills').split(',').map(Number);
  const dir = path.join(ROOT, arg('dir', 'build/stills'));
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage(port);
  for (const t of ts) {
    // warm-up a few frames before (for particles/state continuity it's stateless, but lets shaders compile)
    const t0 = Date.now();
    const buf = await shot(page, t);
    const f = path.join(dir, `t_${t.toFixed(2).padStart(7, '0')}.jpg`);
    fs.writeFileSync(f, buf);
    console.log('still', t, f, (Date.now() - t0) + 'ms');
  }
  await browser.close();
}

function encoder(out, fps) {
  return spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
}

async function worker(port, f0, f1, fps, out, id) {
  const { browser, page } = await openPage(port);
  const ff = encoder(out, fps);
  const tStart = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await shot(page, f / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) {
      const el = (Date.now() - tStart) / 1000, done = f - f0 + 1;
      console.log(`[w${id}] frame ${f}/${f1} ${(el / done).toFixed(2)}s/f eta ${((f1 - f) * el / done / 60).toFixed(1)}min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
}

async function video(port) {
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/timeline.json'), 'utf8'));
  const fps = tl.fps;
  const from = parseFloat(arg('from', '0')), to = parseFloat(arg('to', String(tl.duration)));
  const out = path.join(ROOT, arg('out', 'out/pltp_noaudio.mp4'));
  const nW = parseInt(arg('workers', '3'));
  const F0 = arg('f0') ? parseInt(arg('f0')) : Math.round(from * fps), F1 = arg('f1') ? parseInt(arg('f1')) : Math.round(to * fps);
  const per = Math.ceil((F1 - F0) / nW);
  const CD = arg('chunkdir', 'build/chunks');
  fs.mkdirSync(path.join(ROOT, CD), { recursive: true });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const parts = [];
  const jobs = [];
  for (let i = 0; i < nW; i++) {
    const a = F0 + i * per, b = Math.min(F1, a + per);
    if (a >= b) break;
    const p = path.join(ROOT, `${CD}/c${String(i).padStart(2, '0')}.mp4`);
    parts.push(p); jobs.push(worker(port, a, b, fps, p, i));
  }
  await Promise.all(jobs);
  const list = path.join(ROOT, `${CD}/list.txt`);
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  await new Promise((r) => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
  console.log('video ->', out);
}

const srv = await serve();
const port = srv.address().port;
try {
  if (has('stills')) await stills(port);
  else if (has('video')) await video(port);
} finally { srv.close(); }
