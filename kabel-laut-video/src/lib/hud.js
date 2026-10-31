// 2D HUD layer (1920x1080) — explainer UI in the style of the reference (light theme, navy chips)
import { clamp, ap, easeOut, easeOutBack, inv, lerp } from './util.js';

export const C = {
  navy: '#13243b', navy2: '#1d3352', ink: '#0f1d30', cyan: '#12b5e5', cyanD: '#0b8fc0', red: '#e8473c', redD: '#c8323a',
  orange: '#ff7a2f', yellow: '#ffc233', green: '#3fbf6f', white: '#ffffff', paper: '#f6f8fb', gray: '#6b7a8c', mute: '#a9bdd1',
};
export const F = {
  cond: (w, s) => `${w} ${s}px "Barlow Condensed"`,
  sans: (w, s) => `${w} ${s}px "Inter"`,
  mono: (w, s) => `${w} ${s}px "JetBrains Mono"`,
};

export function rr(h, x, y, w, ht, r) {
  h.beginPath(); h.moveTo(x + r, y); h.arcTo(x + w, y, x + w, y + ht, r); h.arcTo(x + w, y + ht, x, y + ht, r);
  h.arcTo(x, y + ht, x, y, r); h.arcTo(x, y, x + w, y, r); h.closePath();
}
const NOSHADOW = new URLSearchParams(location.search).get('noshadow');
function shadow(h, on, blur = 18, oy = 6, a = 0.18) {
  if (NOSHADOW) return;
  if (on) { h.shadowColor = `rgba(15,29,48,${a})`; h.shadowBlur = blur; h.shadowOffsetY = oy; }
  else { h.shadowColor = 'transparent'; h.shadowBlur = 0; h.shadowOffsetY = 0; }
}
export function text(h, s, x, y, font, color, align = 'left', ls = 0, base = 'alphabetic') {
  h.font = font; h.fillStyle = color; h.textAlign = align; h.textBaseline = base; h.letterSpacing = ls + 'px'; h.fillText(s, x, y); h.letterSpacing = '0px';
}
export function measure(h, s, font, ls = 0) { h.font = font; h.letterSpacing = ls + 'px'; const w = h.measureText(s).width; h.letterSpacing = '0px'; return w; }
export function wrap(h, s, font, maxW) {
  h.font = font; const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (h.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

// ---------- header bar ----------
export function header(h, o) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  h.save(); h.globalAlpha = a;
  const X = 36, Y = 28, W = 1848, H = 112;
  shadow(h, true, 22, 6, 0.22); h.fillStyle = C.navy; rr(h, X, Y, W, H, 16); h.fill(); shadow(h, false);
  // left block
  text(h, o.date || '', X + 30, Y + 42, F.mono(500, 24), C.mute, 'left', 5);
  const big = o.big || '';
  const isClock = /^[\d\-T+:·.]+$/.test(big.replace(/\s/g, ''));
  text(h, big, X + 28, Y + 98, isClock ? F.mono(700, 54) : F.cond(700, 60), C.white, 'left', isClock ? 2 : 2);
  h.fillStyle = 'rgba(255,255,255,0.12)'; h.fillRect(X + 380, Y + 14, 2, H - 28);
  // route
  const r = o.route || {}; const x0 = X + 440, x1 = X + W - 50, ly = Y + 46;
  const state = r.state || 'active';
  const ca = r.a ?? 0.32, cb = r.b ?? 0.68;
  const xa = lerp(x0, x1, ca), xb = lerp(x0, x1, cb);
  h.lineCap = 'round';
  h.strokeStyle = '#3a5470'; h.lineWidth = 4;
  h.beginPath(); h.moveTo(x0, ly); h.lineTo(xa, ly); h.moveTo(xb, ly); h.lineTo(x1, ly); h.stroke();
  // link between chips
  const prog = r.prog ?? 1;
  if (state === 'active') {
    h.strokeStyle = C.cyan; h.lineWidth = 6; h.beginPath(); h.moveTo(xa, ly); h.lineTo(lerp(xa, xb, prog), ly); h.stroke();
    // moving pulses
    const tt = o.time || 0;
    for (let k = 0; k < 3; k++) { const u = ((tt * 0.45 + k / 3) % 1); const px = lerp(xa, xb, u); h.fillStyle = 'rgba(255,255,255,0.85)'; h.beginPath(); h.arc(px, ly, 3.2, 0, 7); h.fill(); }
  } else if (state === 'offline') {
    h.fillStyle = '#7f93a8'; for (let x = xa + 14; x < xb - 10; x += 26) h.fillRect(x, ly - 4, 16, 8);
  } else if (state === 'warn') {
    const g = h.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, C.yellow); g.addColorStop(1, C.orange);
    h.strokeStyle = g; h.lineWidth = 7; h.beginPath(); h.moveTo(xa, ly); h.lineTo(xb, ly); h.stroke();
  } else if (state === 'cut') {
    const mid = (xa + xb) / 2; h.strokeStyle = C.red; h.lineWidth = 6;
    h.beginPath(); h.moveTo(xa, ly); h.lineTo(mid - 22, ly); h.moveTo(mid + 22, ly); h.lineTo(xb, ly); h.stroke();
    h.lineWidth = 5; h.beginPath(); h.moveTo(mid - 10, ly - 12); h.lineTo(mid + 10, ly + 12); h.moveTo(mid + 10, ly - 12); h.lineTo(mid - 10, ly + 12); h.stroke();
  }
  for (const xx of [x0, x1]) { h.fillStyle = C.navy; h.strokeStyle = '#e8eef5'; h.lineWidth = 4; h.beginPath(); h.arc(xx, ly, 10, 0, 7); h.fill(); h.stroke(); }
  text(h, r.left || 'JAKARTA', x0 - 10, Y + 98, F.cond(500, 32), '#dfe8f1', 'left', 2);
  text(h, r.right || 'DUNIA', x1 + 10, Y + 98, F.cond(500, 32), '#dfe8f1', 'right', 2);
  chip(h, xa, ly, r.chipA || 'INDONESIA', C.white, C.navy);
  chip(h, xb, ly, r.chipB || 'SINGAPURA', state === 'cut' ? '#8a96a3' : C.red, C.white);
  h.restore();
}
function chip(h, cx, cy, s, bg, fg) {
  const w = measure(h, s, F.cond(600, 31), 1) + 36, ht = 46;
  h.fillStyle = bg; rr(h, cx - w / 2, cy - ht / 2, w, ht, ht / 2); h.fill();
  text(h, s, cx, cy + 11, F.cond(600, 31), fg, 'center', 1);
}
export function badge(h, a = 1, s = '● ILUSTRASI REKONSTRUKSI') {
  if (a <= 0) return; h.save(); h.globalAlpha = a;
  const w = measure(h, s, F.cond(600, 26), 3) + 34; const x = 1884 - w, y = 154;
  shadow(h, true, 10, 3, 0.12); h.fillStyle = 'rgba(255,255,255,0.96)'; rr(h, x, y, w, 44, 8); h.fill(); shadow(h, false);
  text(h, s, x + 17, y + 31, F.cond(600, 26), C.navy, 'left', 3);
  h.restore();
}

// ---------- captions with per-word highlight ----------
export function chunkLine(line) {
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  for (const w of line.words) {
    cur.push(w);
    const chars = cur.map(x => x[2]).join(' ').length;
    const punct = /[,.?!:;]$/.test(w[2]);
    if (cur.length >= 6 || chars > 30 || (punct && cur.length >= 2)) flush();
  }
  flush();
  // merge single trailing word into previous
  for (let i = chunks.length - 1; i > 0; i--) if (chunks[i].length === 1 && chunks[i - 1].length < 6) { chunks[i - 1].push(...chunks[i]); chunks.splice(i, 1); }
  return chunks;
}
export function caption(h, line, chunks, t) {
  if (!line || t < line.start - 0.05 || t > line.end + 0.35) return;
  let ci = 0; for (let i = 0; i < chunks.length; i++) if (t >= chunks[i][0][0] - 0.02) ci = i;
  const ch = chunks[ci];
  // display text uses original punctuation from line.text where possible
  const toks = ch.map(w => w[2]);
  const font = F.sans(600, 50); h.font = font;
  const gap = 18; const ws = toks.map(s => h.measureText(s).width);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
  const W = total + 72, H = 88, X = 960 - W / 2, Y = 892;
  const pa = ap(t, ch[0][0] - 0.08, 0.12);
  h.save(); h.globalAlpha = 1;
  shadow(h, true, 20, 6, 0.25); h.fillStyle = C.navy; rr(h, X, Y, W, H, 16); h.fill(); shadow(h, false);
  h.fillStyle = 'rgba(255,255,255,0.10)'; h.fillRect(X + 16, Y, W - 32, 2);
  let x = X + 36;
  for (let i = 0; i < toks.length; i++) {
    const w = ch[i]; const active = t >= w[0] - 0.03 && (i === toks.length - 1 ? t <= line.end + 0.35 : t < ch[i + 1][0] - 0.03);
    if (active) { h.fillStyle = C.white; rr(h, x - 9, Y + 14, ws[i] + 18, H - 28, 8); h.fill(); }
    const spoken = t >= w[0] - 0.03;
    text(h, toks[i], x, Y + 61, font, active ? C.navy : (spoken ? C.white : 'rgba(255,255,255,0.62)'));
    x += ws[i] + gap;
  }
  h.restore();
}

export function sourcePill(h, srcs, a = 1) {
  if (!srcs || !srcs.length || a <= 0) return;
  h.save(); h.globalAlpha = a;
  let s = srcs.join('  ·  '); let size = 19; let w;
  while ((w = measure(h, s, F.mono(500, size), 0.5)) > 1500 && size > 13) size--;
  const lab = 'SUMBER'; const lw = measure(h, lab, F.mono(700, size), 2) + 26;
  const X = 36, Y = 1006, H = 42, W = w + lw + 34;
  shadow(h, true, 10, 3, 0.12); h.fillStyle = 'rgba(255,255,255,0.94)'; rr(h, X, Y, W, H, 8); h.fill(); shadow(h, false);
  h.fillStyle = C.navy; rr(h, X, Y, lw, H, 8); h.fill(); h.fillRect(X + lw - 8, Y, 8, H);
  text(h, lab, X + 13, Y + 28, F.mono(700, size), C.white, 'left', 2);
  text(h, s, X + lw + 16, Y + 28, F.mono(500, size), C.navy, 'left', 0.5);
  h.restore();
}

export function chapterCard(h, chapter, lt) {
  if (!chapter) return;
  const a = ap(lt, 0.25, 0.5), b = 1 - ap(lt, 3.6, 0.5);
  const p = Math.min(a, b); if (p <= 0) return;
  const [num, title] = chapter.includes('·') ? chapter.split('·').map(s => s.trim()) : ['', chapter];
  h.save();
  const X = 36, Y = 216; const tw = measure(h, title, F.cond(700, 92), 2) + 70;
  const w = tw * easeOut(p);
  h.beginPath(); h.rect(X, Y - 10, w + 10, 200); h.clip();
  shadow(h, true, 24, 8, 0.2);
  h.fillStyle = C.white; rr(h, X, Y + 52, tw, 116, 12); h.fill(); shadow(h, false);
  h.fillStyle = C.cyan; h.fillRect(X, Y + 52, 10, 116);
  if (num) { h.fillStyle = C.navy; rr(h, X, Y, measure(h, num, F.mono(700, 26), 4) + 36, 46, 8); h.fill(); text(h, num, X + 18, Y + 32, F.mono(700, 26), C.white, 'left', 4); }
  text(h, title, X + 38, Y + 142, F.cond(700, 92), C.navy, 'left', 2);
  h.restore();
}

// ---------- 3D-anchored label with leader line ----------
// p: label box center {x,y}; anchor: {x,y} or null; opts: {style, tag, tagColor, size, alpha, sub}
export function label(h, p, anchor, s, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01 || !p) return;
  const size = o.size || 40; const font = F.cond(600, size);
  const style = o.style || 'white';
  h.save(); h.globalAlpha = clamp(a);
  const sc = 0.85 + 0.15 * easeOutBack(clamp(a));
  const tw = measure(h, s, font, 2); const tagW = o.tag ? measure(h, o.tag, font, 2) + 36 : 0;
  const W = tw + 40 + tagW, H = size * 1.55;
  p = { x: clamp(p.x, W / 2 + 24, 1896 - W / 2), y: clamp(p.y, 250, 840) };
  if (anchor) {
    const ly = p.y + H / 2 * sc; const ah = Math.min(1, a * 1.4);
    const ex = lerp(p.x, anchor.x, ah), ey = lerp(ly, anchor.y, ah);
    h.strokeStyle = o.lineColor || C.navy; h.lineWidth = 3;
    h.beginPath(); h.moveTo(p.x, ly); h.lineTo(ex, ey); h.stroke();
    if (ah >= 0.99) { h.fillStyle = C.white; h.strokeStyle = o.lineColor || C.navy; h.lineWidth = 3.5; h.beginPath(); h.arc(anchor.x, anchor.y, 8, 0, 7); h.fill(); h.stroke(); }
  }
  h.translate(p.x, p.y); h.scale(sc, sc);
  shadow(h, true, 14, 4, 0.18);
  h.fillStyle = style === 'navy' ? C.navy : style === 'red' ? C.red : style === 'cyan' ? C.cyan : C.white;
  rr(h, -W / 2, -H / 2, W, H, 8); h.fill(); shadow(h, false);
  if (o.tag) { h.fillStyle = o.tagColor || C.cyan; h.save(); rr(h, -W / 2, -H / 2, W, H, 8); h.clip(); h.fillRect(W / 2 - tagW, -H / 2, tagW, H); h.restore(); }
  const fg = style === 'white' ? C.navy : C.white;
  text(h, s, -W / 2 + 20, size * 0.36, font, fg, 'left', 2);
  if (o.tag) text(h, o.tag, W / 2 - tagW + 18, size * 0.36, font, o.tagFg || C.navy, 'left', 2);
  if (o.sub) text(h, o.sub, 0, H / 2 + 30, F.mono(500, 20), C.navy, 'center', 1);
  h.restore();
}
// small map pin label (city)
export function pin(h, p, s, a = 1, o = {}) {
  if (!p || a <= 0.01) return;
  h.save(); h.globalAlpha = clamp(a);
  const font = F.cond(600, o.size || 28);
  h.fillStyle = o.dot || C.navy; h.strokeStyle = C.white; h.lineWidth = 3; h.beginPath(); h.arc(p.x, p.y, o.r || 7, 0, 7); h.fill(); h.stroke();
  const w = measure(h, s, font, 1.5) + 20; const dx = o.left ? -w - 14 : 14; const dy = o.dy ?? -14;
  shadow(h, true, 8, 2, 0.15); h.fillStyle = o.bg || 'rgba(255,255,255,0.95)'; rr(h, p.x + dx, p.y + dy - 22, w, 36, 6); h.fill(); shadow(h, false);
  text(h, s, p.x + dx + 10, p.y + dy + 4, font, o.fg || C.navy, 'left', 1.5);
  h.restore();
}
// floating region label (sea names) — italic spaced
export function regionLabel(h, p, s, a = 1, size = 30) {
  if (!p || a <= 0.01) return; h.save(); h.globalAlpha = clamp(a) * 0.9;
  text(h, s, p.x, p.y, `italic 500 ${size}px "Barlow Condensed"`, '#2f6f8f', 'center', 6); h.restore();
}

// ---------- cards ----------
export function card(h, x, y, w, ht, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  h.save(); h.globalAlpha = clamp(a);
  const dy = (1 - easeOut(clamp(a))) * 30;
  h.translate(0, dy);
  shadow(h, true, 26, 8, 0.2); h.fillStyle = o.bg || C.white; rr(h, x, y, w, ht, 14); h.fill(); shadow(h, false);
  if (o.accent) { h.fillStyle = o.accent; h.save(); rr(h, x, y, w, ht, 14); h.clip(); h.fillRect(x, y, 10, ht); h.restore(); }
  let cy = y + 22;
  if (o.kicker) { text(h, o.kicker, x + 34, cy + 22, F.mono(700, 20), o.kickerColor || C.gray, 'left', 3); cy += 38; }
  if (o.title) {
    const ts = o.titleSize || 64; const lines = wrap(h, o.title, F.cond(700, ts), w - 68 - (o.chip ? 220 : 0));
    for (const l of lines) { text(h, l, x + 32, cy + ts * 0.85, F.cond(700, ts), o.titleColor || C.navy, 'left', 1); cy += ts * 0.98; }
    cy += 8;
  }
  if (o.chip) { const cw = measure(h, o.chip, F.cond(600, 34), 2) + 40; h.fillStyle = o.chipColor || '#6b7a8c'; rr(h, x + w - cw - 28, y + 28, cw, 52, 8); h.fill(); text(h, o.chip, x + w - cw / 2 - 28, y + 66, F.cond(600, 34), C.white, 'center', 2); }
  if (o.body) {
    const bs = o.bodySize || 30; const lines = wrap(h, o.body, F.sans(400, bs), w - 68);
    for (const l of lines) { text(h, l, x + 34, cy + bs, F.sans(400, bs), C.ink, 'left'); cy += bs * 1.32; }
  }
  if (o.draw) o.draw(h, x, cy, w, y + ht - cy);
  h.restore();
}
export function stat(h, x, y, big, small, o = {}) {
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  h.save(); h.globalAlpha = clamp(a);
  const bs = o.size || 110; const bw = measure(h, big, F.cond(700, bs), 1); const sw = measure(h, small, F.cond(600, 30), 3);
  const W = Math.max(bw, sw) + 64, H = bs * 0.9 + 74;
  const X = o.align === 'center' ? x - W / 2 : o.align === 'right' ? x - W : x;
  const dy = (1 - easeOutBack(clamp(a))) * 20;
  shadow(h, true, 22, 6, 0.18); h.fillStyle = o.bg || C.white; rr(h, X, y + dy, W, H, 14); h.fill(); shadow(h, false);
  text(h, big, X + 32, y + dy + bs * 0.86, F.cond(700, bs), o.color || C.navy, 'left', 1);
  text(h, small, X + 34, y + dy + bs * 0.86 + 46, F.cond(600, 30), o.subColor || C.gray, 'left', 3);
  h.restore();
  return { W, H };
}
export function stamp(h, x, y, s, color, p, rot = -0.08, size = 64) {
  if (p <= 0.01) return; h.save(); h.globalAlpha = clamp(p * 1.5);
  const sc = 1 + 1.6 * (1 - easeOut(clamp(p)));
  h.translate(x, y); h.rotate(rot); h.scale(sc, sc);
  const lines = s.split('\n'); const w = Math.max(...lines.map(l => measure(h, l, F.cond(700, size), 4))) + 70; const ht = lines.length * size * 1.05 + 46;
  h.fillStyle = 'rgba(255,255,255,0.92)'; rr(h, -w / 2, -ht / 2, w, ht, 12); h.fill();
  h.strokeStyle = color; h.lineWidth = 7; rr(h, -w / 2, -ht / 2, w, ht, 12); h.stroke();
  h.lineWidth = 2.5; rr(h, -w / 2 + 10, -ht / 2 + 10, w - 20, ht - 20, 8); h.stroke();
  lines.forEach((l, i) => text(h, l, 0, -ht / 2 + 23 + size * 0.86 + i * size * 1.05, F.cond(700, size), color, 'center', 4));
  h.restore();
}
export function flash(h, a, color = '255,255,255') { if (a <= 0.001) return; h.fillStyle = `rgba(${color},${clamp(a)})`; h.fillRect(0, 0, 1920, 1080); }

// bar chart (horizontal) — items [{label, value, color, valueLabel}]
export function hbars(h, x, y, w, items, p, o = {}) {
  const max = o.max || Math.max(...items.map(i => i.value)); const rowH = o.rowH || 74;
  items.forEach((it, i) => {
    const q = clamp(p * items.length - i * 0.6);
    const yy = y + i * rowH; const bw = Math.max(4, (w - 260) * (it.value / max) * easeOut(q));
    h.save(); h.globalAlpha = clamp(q * 3);
    text(h, it.label, x, yy + 34, F.cond(600, 32), C.navy, 'left', 1.5);
    h.fillStyle = '#e4ebf2'; rr(h, x + 250, yy + 6, w - 260, 40, 8); h.fill();
    h.fillStyle = it.color || C.cyan; rr(h, x + 250, yy + 6, bw, 40, 8); h.fill();
    text(h, it.valueLabel, x + 260 + bw + 12 > x + w - 160 ? x + 250 + bw - 14 : x + 260 + bw + 12, yy + 37, F.cond(700, 30), x + 260 + bw + 12 > x + w - 160 ? C.white : C.navy, x + 260 + bw + 12 > x + w - 160 ? 'right' : 'left', 1);
    h.restore();
  });
}
// gauge ring
export function gauge(h, cx, cy, r, frac, color, big, small, p) {
  if (p <= 0.01) return; h.save(); h.globalAlpha = clamp(p * 2);
  h.lineWidth = r * 0.22; h.strokeStyle = '#e4ebf2'; h.beginPath(); h.arc(cx, cy, r, 0, 7); h.stroke();
  h.strokeStyle = color; h.lineCap = 'round'; h.beginPath(); h.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac * easeOut(clamp(p))); h.stroke();
  text(h, big, cx, cy + r * 0.22, F.cond(700, r * 0.62), C.navy, 'center', 1);
  text(h, small, cx, cy + r + r * 0.55, F.cond(600, 28), C.navy, 'center', 2);
  h.restore();
}
export function icon(h, kind, x, y, s, color = C.navy) {
  h.save(); h.translate(x, y); h.scale(s / 100, s / 100); h.strokeStyle = color; h.fillStyle = color; h.lineWidth = 8; h.lineCap = 'round'; h.lineJoin = 'round';
  switch (kind) {
    case 'check': h.beginPath(); h.moveTo(-30, 0); h.lineTo(-8, 24); h.lineTo(34, -26); h.stroke(); break;
    case 'cross': h.beginPath(); h.moveTo(-26, -26); h.lineTo(26, 26); h.moveTo(26, -26); h.lineTo(-26, 26); h.stroke(); break;
    case 'warn': h.beginPath(); h.moveTo(0, -36); h.lineTo(38, 30); h.lineTo(-38, 30); h.closePath(); h.stroke(); h.fillRect(-4, -12, 8, 24); h.beginPath(); h.arc(0, 20, 4.5, 0, 7); h.fill(); break;
    case 'q': text(h, '?', 0, 26, F.cond(700, 84), color, 'center'); break;
    case 'cloud': h.beginPath(); h.arc(-18, 6, 20, Math.PI * 0.5, Math.PI * 1.5); h.arc(4, -10, 26, Math.PI, 0); h.arc(28, 8, 18, -Math.PI * 0.5, Math.PI * 0.5); h.closePath(); h.stroke(); break;
    case 'card': rr(h, -38, -26, 76, 52, 8); h.stroke(); h.fillRect(-38, -12, 76, 10); break;
    case 'game': rr(h, -40, -20, 80, 42, 20); h.stroke(); h.beginPath(); h.moveTo(-24, 0); h.lineTo(-8, 0); h.moveTo(-16, -8); h.lineTo(-16, 8); h.stroke(); h.beginPath(); h.arc(18, -4, 4, 0, 7); h.arc(26, 6, 4, 0, 7); h.fill(); break;
    case 'brief': rr(h, -38, -20, 76, 50, 6); h.stroke(); rr(h, -14, -34, 28, 16, 4); h.stroke(); break;
    case 'bolt': h.beginPath(); h.moveTo(8, -40); h.lineTo(-20, 6); h.lineTo(2, 6); h.lineTo(-8, 40); h.lineTo(22, -8); h.lineTo(0, -8); h.closePath(); h.fill(); break;
    case 'clock': h.beginPath(); h.arc(0, 0, 34, 0, 7); h.stroke(); h.beginPath(); h.moveTo(0, -20); h.lineTo(0, 0); h.lineTo(14, 10); h.stroke(); break;
    case 'ship': h.beginPath(); h.moveTo(-40, 6); h.lineTo(40, 6); h.lineTo(28, 26); h.lineTo(-30, 26); h.closePath(); h.fill(); h.fillRect(-14, -14, 30, 20); break;
    case 'doc': rr(h, -28, -36, 56, 72, 6); h.stroke(); for (let i = 0; i < 4; i++) h.fillRect(-16, -20 + i * 14, 32, 5); break;
    case 'satellite': h.fillRect(-10, -10, 20, 20); h.strokeRect(-44, -7, 26, 14); h.strokeRect(18, -7, 26, 14); break;
  }
  h.restore();
}
export { inv, ap };
