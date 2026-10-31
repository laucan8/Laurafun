// Dumps overlay appear-events + cue times to build/events.json (for SFX sync).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${srv.address().port}/src/index.html?render=1`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const out = await page.evaluate(() => window.scanEvents());
fs.writeFileSync(path.join(ROOT, 'build/events.json'), JSON.stringify(out, null, 1));
console.log('events', out.events.length);
await browser.close(); srv.close();
