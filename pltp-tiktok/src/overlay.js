// DOM overlay engine (reference style): HUD, pinned callouts, two-tone tags,
// info cards, big title panels, karaoke captions, source chip, cloud wipe.
// Everything is a pure function of time t -> styles (deterministic rendering).
import * as THREE from 'three';
import { clamp, smooth, easeOut, backOut, lerp } from './world.js';

const W = 1080, H = 1920;

export class Overlay {
  constructor(root, camera) {
    this.root = root; this.camera = camera;
    this.pool = new Map(); this.used = new Set();
    this.v = new THREE.Vector3();
    root.innerHTML = `
      <div id="hud"><div class="hud-l"><div class="hud-lab"></div><div class="hud-val"></div></div>
        <div class="hud-r"><div class="trk"><div class="trk-line"></div><div class="trk-fill"></div><div class="trk-dot a"></div><div class="trk-dot b"></div><div class="pills"></div></div>
        <div class="trk-labels"><span class="ta"></span><span class="tb"></span></div></div></div>
      <div id="ill"><b></b>ILUSTRASI DISEDERHANAKAN</div>
      <div id="layer"></div>
      <div id="cap"></div>
      <div id="src"></div>
      <div id="wipe"><div id="flash"></div></div>
      <div id="endw"></div>`;
    this.hudEl = root.querySelector('#hud');
    this.hudLab = root.querySelector('.hud-lab'); this.hudVal = root.querySelector('.hud-val');
    this.trkFill = root.querySelector('.trk-fill'); this.pills = root.querySelector('.pills');
    this.ta = root.querySelector('.ta'); this.tb = root.querySelector('.tb');
    this.ill = root.querySelector('#ill');
    this.layer = root.querySelector('#layer');
    this.cap = root.querySelector('#cap'); this.src = root.querySelector('#src');
    this.wipe = root.querySelector('#wipe'); this.flash = root.querySelector('#flash');
    this.endw = root.querySelector('#endw');
    this.blobs = [];
    const bl = [[120, 300, 900], [900, 420, 1000], [500, 900, 1300], [80, 1400, 1000], [980, 1500, 1100], [540, 1750, 1000], [300, 650, 800], [800, 1150, 900]];
    for (const [x, y, s] of bl) { const d = document.createElement('div'); d.className = 'blob'; this.wipe.appendChild(d); this.blobs.push({ d, x, y, s }); }
    this.capCache = new Map();
    this.last = {};
  }
  begin(t) { this.t = t; this.used.clear(); }
  end() { for (const [id, e] of this.pool) if (!this.used.has(id)) { if (e.style.display !== 'none') e.style.display = 'none'; } }
  el(id, cls, html) {
    let e = this.pool.get(id);
    if (!e) { e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; this.layer.appendChild(e); this.pool.set(id, e); e._html = html; }
    else if (html != null && e._html !== html) { e.innerHTML = html; e._html = html; }
    this.used.add(id); if (e.style.display === 'none') e.style.display = '';
    return e;
  }
  project(p) {
    this.v.copy(p).project(this.camera);
    return { x: (this.v.x * 0.5 + 0.5) * W, y: (-this.v.y * 0.5 + 0.5) * H, ok: this.v.z < 1 && this.v.z > -1 };
  }
  set(e, k, v) { if (e['_' + k] !== v) { e.style[k] = v; e['_' + k] = v; } }

  // ---------- HUD ----------
  hud(o) {
    const a = o.show == null ? 1 : o.show;
    this.set(this.hudEl, 'opacity', a.toFixed(3));
    this.set(this.hudEl, 'transform', `translateY(${(-(1 - easeOut(a)) * 40).toFixed(1)}px)`);
    this.set(this.ill, 'opacity', (o.ill == null ? a : o.ill).toFixed(3));
    if (this.last.lab !== o.lab) { this.hudLab.textContent = o.lab; this.last.lab = o.lab; }
    if (this.last.val !== o.val) { this.hudVal.textContent = o.val; this.last.val = o.val; { const L = String(o.val).length; this.hudVal.style.fontSize = (L <= 5 ? 84 : L <= 7 ? 66 : L <= 9 ? 54 : 46) + 'px'; this.hudVal.style.marginTop = (L <= 5 ? 8 : L <= 7 ? 16 : 22) + 'px'; } }
    if (this.last.ta !== o.a) { this.ta.textContent = o.a; this.last.ta = o.a; }
    if (this.last.tb !== o.b) { this.tb.textContent = o.b; this.last.tb = o.b; }
    this.set(this.trkFill, 'width', (clamp(o.fill || 0) * 100).toFixed(2) + '%');
    const key = JSON.stringify((o.pills || []).map((p) => [p.t, p.c]));
    if (this.last.pk !== key) {
      this.pills.innerHTML = (o.pills || []).map((p) => `<div class="pill ${p.c}">${p.t}</div>`).join('');
      this.last.pk = key;
    }
    [...this.pills.children].forEach((d, i) => { const p = o.pills[i]; this.set(d, 'left', (clamp(p.x) * 100).toFixed(2) + '%'); this.set(d, 'opacity', (p.a == null ? 1 : p.a).toFixed(3)); });
  }

  // ---------- callout pinned to 3D point ----------
  callout(id, o) {
    const a = clamp(o.a);
    if (a <= 0.001) return;
    const s = this.project(o.p);
    if (!s.ok) return;
    const parts = o.parts || [{ t: o.text, c: o.style || 'white' }];
    const html = `<div class="co-line"></div><div class="co-dot"></div><div class="co-lab">${parts.map((p) => `<div class="p ${p.c} ${o.size || ''}">${p.t}</div>`).join('')}</div>`;
    const e = this.el('co_' + id, 'co', html);
    const len = o.len == null ? 150 : o.len;
    const dot = e.children[1], line = e.children[0], lab = e.children[2];
    let x = s.x, y = s.y;
    this.set(e, 'transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`);
    const a1 = smooth(a / 0.3), a2 = smooth((a - 0.15) / 0.45), a3 = smooth((a - 0.45) / 0.55);
    this.set(dot, 'transform', `scale(${a1.toFixed(3)})`);
    const up = o.down ? -1 : 1;
    const L = len * a2;
    this.set(line, 'height', L.toFixed(1) + 'px');
    this.set(line, 'bottom', up > 0 ? '0px' : (-L).toFixed(1) + 'px');
    this.set(line, 'display', len < 2 ? 'none' : '');
    // label: keep inside safe area
    const w = lab._w || (lab._w = lab.offsetWidth || 300);
    let dx = o.dx || 0;
    const half = w / 2;
    const maxR = (y - len) > 860 ? W - 130 : W - 24;
    if (x + dx + half > maxR) dx = maxR - half - x;
    if (x + dx - half < 24) dx = 24 + half - x;
    const ly = up > 0 ? -len : len + 50;
    this.set(lab, 'transform', `translate(calc(-50% + ${dx.toFixed(1)}px), ${(ly + (1 - a3) * 14 * up).toFixed(1)}px)`);
    this.set(lab, 'clipPath', `inset(0 ${((1 - a3) * 100).toFixed(1)}% 0 0)`);
    this.set(lab, 'opacity', a3 > 0 ? '1' : '0');
  }

  // ---------- screen tag ----------
  tag(id, o) {
    const a = clamp(o.a); if (a <= 0.001) return;
    const html = o.parts.map((p) => `<div class="p ${p.c} ${o.size || ''}">${p.t}</div>`).join('');
    const e = this.el('tg_' + id, 'tag', html);
    const s = lerp(0.85, 1, backOut(a));
    this.set(e, 'left', o.x + 'px'); this.set(e, 'top', o.y + 'px');
    this.set(e, 'transform', `translate(-50%,-50%) scale(${s.toFixed(3)})`);
    this.set(e, 'opacity', smooth(a / 0.6).toFixed(3));
    this.set(e, 'clipPath', `inset(0 ${((1 - smooth(a)) * 100).toFixed(1)}% 0 0)`);
  }

  // ---------- big title panel ----------
  big(id, o) {
    const a = clamp(o.a); if (a <= 0.001) return;
    const html = `<div class="s">${o.small}</div><div class="b ${o.bc ? 'bc' : ''}">${o.big}</div>`;
    const e = this.el('bg_' + id, 'big', html);
    this.set(e, 'top', (o.y || 470) + 'px');
    this.set(e, 'opacity', smooth(a / 0.5).toFixed(3));
    this.set(e, 'transform', `translateY(${((1 - easeOut(a)) * 50).toFixed(1)}px) scale(${lerp(0.94, 1, easeOut(a)).toFixed(3)})`);
    if (o.update) o.update(e, a);
  }

  // ---------- info card ----------
  card(id, o) {
    const a = clamp(o.a); if (a <= 0.001) return;
    const e = this.el('cd_' + id, 'card', o.html);
    this.set(e, 'top', (o.y || 452) + 'px');
    this.set(e, 'opacity', smooth(a / 0.5).toFixed(3));
    this.set(e, 'transform', `translateY(${((1 - easeOut(a)) * 70).toFixed(1)}px)`);
    if (o.update) o.update(e, o.k == null ? a : o.k, this.t);
  }

  cta(id, o) {
    const a = clamp(o.a); if (a <= 0.001) return;
    const e = this.el('ct_' + id, 'cta', o.html);
    this.set(e, 'top', o.y + 'px');
    this.set(e, 'opacity', smooth(a / 0.5).toFixed(3));
    this.set(e, 'transform', `translateX(-50%) scale(${lerp(0.85, 1, backOut(a)).toFixed(3)})`);
  }

  // ---------- captions (karaoke) ----------
  chunks(scene) {
    if (this.capCache.has(scene.id)) return this.capCache.get(scene.id);
    const out = []; let cur = [];
    const flush = () => { if (cur.length) out.push(cur); cur = []; };
    scene.tokens.forEach((tk, i) => {
      const len = cur.reduce((s, x) => s + x.d.length + 1, 0);
      if (cur.length && (len + tk.d.length > 21 || cur.length >= 4)) flush();
      cur.push(tk);
      if (/[.?!,:]$/.test(tk.d) && cur.length >= 1) {
        const nextLen = (scene.tokens[i + 1] || { d: '' }).d.length;
        if (/[.?!:]$/.test(tk.d) || len + tk.d.length + nextLen > 14) flush();
      }
    });
    flush();
    this.capCache.set(scene.id, out);
    return out;
  }
  captions(scene, t, show = 1) {
    const ch = scene ? this.chunks(scene) : [];
    let idx = -1;
    for (let i = 0; i < ch.length; i++) {
      const s = ch[i][0].t0 - 0.06;
      const e = i + 1 < ch.length ? ch[i + 1][0].t0 - 0.06 : ch[i][ch[i].length - 1].t1 + 0.35;
      if (t >= s && t < e) { idx = i; break; }
    }
    if (idx < 0 || show <= 0) { this.set(this.cap, 'display', 'none'); return; }
    this.set(this.cap, 'display', '');
    const c = ch[idx];
    let on = 0;
    for (let i = 0; i < c.length; i++) if (t >= c[i].t0 - 0.04) on = i;
    const key = scene.id + ':' + idx + ':' + on;
    if (this.last.cap !== key) {
      this.cap.innerHTML = c.map((tk, i) => `<span class="${i === on ? 'on' : ''}">${tk.d.replace(/[,]$/, ',')}</span>`).join(' ');
      this.last.cap = key;
    }
    const age = t - (c[0].t0 - 0.06);
    const s = lerp(0.92, 1, backOut(clamp(age / 0.16)));
    this.set(this.cap, 'transform', `translateX(-50%) scale(${s.toFixed(3)})`);
    this.set(this.cap, 'opacity', show.toFixed(3));
  }

  source(text, a) {
    if (!text || a <= 0.001) { this.set(this.src, 'display', 'none'); return; }
    this.set(this.src, 'display', '');
    if (this.last.src !== text) { this.src.innerHTML = `<b>SUMBER</b>${text}`; this.last.src = text; }
    this.set(this.src, 'opacity', clamp(a).toFixed(3));
  }

  clouds(k) {
    k = clamp(k);
    this.set(this.wipe, 'display', k > 0.001 ? '' : 'none');
    if (k <= 0.001) return;
    this.blobs.forEach((b, i) => {
      const s = b.s * (0.2 + 1.6 * smooth(k * 1.2 - i * 0.03));
      this.set(b.d, 'width', s.toFixed(0) + 'px'); this.set(b.d, 'height', (s * 0.72).toFixed(0) + 'px');
      this.set(b.d, 'left', b.x + 'px'); this.set(b.d, 'top', b.y + 'px');
      this.set(b.d, 'opacity', smooth(k * 1.6).toFixed(3));
    });
    this.set(this.flash, 'opacity', smooth((k - 0.45) / 0.55).toFixed(3));
  }
  flashWhite(k) { // for start fade-in
    if (k <= 0.001) return;
    this.set(this.wipe, 'display', '');
    this.blobs.forEach((b) => this.set(b.d, 'opacity', '0'));
    this.set(this.flash, 'opacity', clamp(k).toFixed(3));
  }
  endCard(html, a) {
    if (a <= 0.001) { this.set(this.endw, 'display', 'none'); return; }
    this.set(this.endw, 'display', '');
    if (this.last.end !== html) { this.endw.innerHTML = html; this.last.end = html; }
    this.set(this.endw, 'opacity', smooth(a).toFixed(3));
  }
}
