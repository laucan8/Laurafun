// ui.js — overlay DOM (tipografi tajam di atas kanvas 3D). Semua animasi = fungsi waktu (deterministik).
import { clamp, easeOut, easeBack, smooth, project, C } from './kit.js';

const TONE = { hot: C.hot, water: C.water, coal: C.coal, green: C.green, amber: C.amber, red: C.red, blue: C.blue, default: C.hot };
const W = 1920, H = 1080;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
export const fmtNum = (v, dec = 0) => { const s = v.toFixed(dec); const [i, d] = s.split('.'); const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return d ? ii + ',' + d : ii; };
const inA = (t, at, d = 0.5) => easeOut(clamp((t - at) / d));
const setA = (e, a, dy = 18, sc = 0.04) => { e.style.opacity = a.toFixed(3); e.style.transform = `translateY(${((1 - a) * dy).toFixed(1)}px) scale(${(1 - sc + sc * a).toFixed(4)})`; e.style.visibility = a <= 0.003 ? 'hidden' : 'visible'; };

export class SceneUI {
  constructor(root, entry, scn) {
    this.entry = entry; this.scn = scn; this.root = el('div', 'layer'); root.appendChild(this.root);
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.svg.setAttribute('class', 'lines'); this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`); this.root.appendChild(this.svg);
    this.items = [];
    const ui = entry.ui || [];
    let leftStack = 0;
    // adegan diorama: callout lama otomatis hilang 4,5 dtk setelah callout berikutnya muncul (anti-tumpuk)
    if (entry.type === 'plant') { const cs = ui.filter((u) => u.k === 'callout').map((u) => [this.cue(u.at), u]).sort((a, b) => a[0] - b[0]); cs.forEach(([t0, u], i) => { const nx = cs.find(([t1]) => t1 > t0 + 0.01); if (nx) u._until = nx[0] + 4.5; }); }
    for (const u of ui) { const f = this['mk_' + u.k]; if (f) this.items.push(f.call(this, u)); else console.warn('ui kind?', u.k); }
  }
  cue(name, fb) { if (typeof name === 'number') return name; const c = this.entry.cues || {}; return c[name] !== undefined ? c[name] : (fb ?? 0.4); }
  update(t, alpha) {
    const dur = this.entry.dur; const out = 1 - smooth(clamp((t - (dur - 0.45)) / 0.4));
    const A = alpha * out; this.root.style.opacity = A.toFixed(3); this.root.style.display = A <= 0.003 ? 'none' : 'block';
    if (A <= 0.003) return;
    for (const it of this.items) it(t);
  }
  dispose() { this.root.remove(); }

  // ---- statistik angka berhitung ----
  mk_stat(u) {
    const tone = TONE[u.tone] || TONE.default; const card = el('div', 'card stat pos-' + (u.pos || 'left'));
    card.style.setProperty('--tone', tone);
    card.innerHTML = `<div class="num"><span class="pre">${u.prefix || ''}</span><span class="v">0</span><span class="suf">${u.suffix || ''}</span></div><div class="lab">${u.label || ''}</div>`;
    this.root.appendChild(card); const v = card.querySelector('.v'); const at = this.cue(u.at);
    const until = u.until ? this.cue(u.until) : 1e9;
    return (t) => { const a = Math.min(inA(t, at, 0.55), 1 - inA(t, until - 0.6, 0.5)); setA(card, a, 26); const k = easeOut(clamp((t - at) / 1.3)); v.textContent = fmtNum(u.value * k, u.dec || 0); };
  }
  mk_chips(u) {
    const wrapE = el('div', 'chips'); this.root.appendChild(wrapE);
    const its = u.items.map(([c, txt]) => { const e = el('div', 'chip', `<span class="tick">✓</span>${txt}`); wrapE.appendChild(e); return [this.cue(c), e]; });
    return (t) => { for (const [at, e] of its) setA(e, easeBack(clamp((t - at) / 0.45)), 20, 0.15); };
  }
  mk_bullets(u) {
    const p = el('div', 'card bullets'); p.innerHTML = `<div class="ttl">${u.title || ''}</div>`; this.root.appendChild(p);
    const its = u.items.map(([c, txt], i) => { const e = el('div', 'bul', `<span class="bn">${i + 1}</span><span>${txt}</span>`); p.appendChild(e); return [this.cue(c), e]; });
    const t0 = Math.max(0.2, Math.min(...its.map((x) => x[0])) - 0.6);
    return (t) => { setA(p, inA(t, t0, 0.5), 24); for (const [at, e] of its) { const a = inA(t, at, 0.45); e.style.opacity = (0.0 + a).toFixed(3); e.style.transform = `translateX(${((1 - a) * 30).toFixed(1)}px)`; } };
  }
  mk_title(u) {
    const b = el('div', 'bigtitle'); const chars = [...u.text].map((ch) => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    b.innerHTML = `<div class="t">${chars}</div><div class="s">${u.sub || ''}</div><div class="bar"></div>`; this.root.appendChild(b);
    const spans = [...b.querySelectorAll('.t span')]; const s = b.querySelector('.s'); const bar = b.querySelector('.bar'); const at = this.cue(u.at);
    return (t) => { spans.forEach((sp, i) => { const a = easeBack(clamp((t - at - i * 0.06) / 0.5)); sp.style.opacity = clamp(a).toFixed(3); sp.style.transform = `translateY(${((1 - a) * 60).toFixed(1)}px) rotateX(${((1 - a) * 70).toFixed(1)}deg)`; });
      const a2 = inA(t, at + 0.9, 0.7); setA(s, a2, 20); bar.style.transform = `scaleX(${easeOut(clamp((t - at - 0.6) / 0.9)).toFixed(3)})`; };
  }
  // ---- callout yang menempel pada objek 3D ----
  mk_callout(u) {
    const tone = TONE[u.tone] || C.navy; const lab = el('div', 'callout'); lab.style.setProperty('--tone', tone);
    lab.innerHTML = `<div class="ct">${u.text}</div>${u.sub ? `<div class="cs">${u.sub}</div>` : ''}`; this.root.appendChild(lab);
    const ns = 'http://www.w3.org/2000/svg';
    const ln = document.createElementNS(ns, 'path'); ln.setAttribute('class', 'cl'); ln.setAttribute('stroke', tone); this.svg.appendChild(ln);
    const dot = document.createElementNS(ns, 'circle'); dot.setAttribute('r', '7'); dot.setAttribute('fill', '#fff'); dot.setAttribute('stroke', tone); dot.setAttribute('stroke-width', '4'); this.svg.appendChild(dot);
    const halo = document.createElementNS(ns, 'circle'); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', tone); halo.setAttribute('stroke-width', '2'); this.svg.appendChild(halo);
    const at = this.cue(u.at);
    return (t) => {
      const a = Math.min(inA(t, at, 0.5), u._until ? 1 - inA(t, u._until, 0.5) : 1); const anc = this.scn.anchors && this.scn.anchors[u.anchor];
      if (!anc || a <= 0.003) { lab.style.opacity = 0; ln.style.opacity = 0; dot.style.opacity = 0; halo.style.opacity = 0; return; }
      const A = typeof anc === 'function' ? anc(t) : anc; const p = project(A.p, this.scn.camera);
      if (p.behind) { lab.style.opacity = 0; ln.style.opacity = 0; dot.style.opacity = 0; halo.style.opacity = 0; return; }
      const dx = A.dx ?? 90, dy = A.dy ?? -90; const w = lab.offsetWidth || 300; const right = dx >= 0;
      let lx = p.x + dx, ly = p.y + dy;
      // jaga label di area aman layar
      if (right && lx + w > 1860) lx = 1860 - w; if (!right && lx - w < 60) lx = 60 + w;
      ly = Math.max(170, Math.min(930, ly));
      lab.style.left = (right ? lx : lx - w) + 'px'; lab.style.top = (ly - 30) + 'px';
      lab.style.opacity = a.toFixed(3); lab.style.transform = `translateY(${((1 - a) * 12).toFixed(1)}px)`;
      const draw = clamp((t - at) / 0.45);
      const ex = lx, ey = ly; const mx = p.x + dx * 0.35, my = ey;
      ln.setAttribute('d', `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${(p.x + (mx - p.x) * 1).toFixed(1)},${(p.y + (my - p.y) * 1).toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`);
      const L = Math.hypot(mx - p.x, my - p.y) + Math.abs(ex - mx); ln.style.strokeDasharray = `${L}`; ln.style.strokeDashoffset = `${(1 - draw) * L}`; ln.style.opacity = '1';
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.style.opacity = '1';
      const ph = ((t - at) % 1.6) / 1.6; halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y); halo.setAttribute('r', (8 + ph * 22).toFixed(1)); halo.style.opacity = ((1 - ph) * 0.8 * a).toFixed(3);
    };
  }
  mk_steps(u) {
    const p = el('div', 'card steps'); this.root.appendChild(p);
    const its = u.items.map(([c, n, ttl, sub]) => { const e = el('div', 'stp', `<div class="sn">${n}</div><div><div class="st">${ttl}</div><div class="ss">${sub}</div></div>`); p.appendChild(e); return [this.cue(c), e]; });
    return (t) => { setA(p, inA(t, Math.max(0.2, its[0][0] - 0.5), 0.5), 24); let cur = -1; its.forEach(([at], i) => { if (t >= at) cur = i; });
      its.forEach(([at, e], i) => { const a = inA(t, at, 0.4); e.style.opacity = (0.28 + 0.72 * a * (i === cur ? 1 : 0.62)).toFixed(3); e.classList.toggle('on', i === cur); e.style.transform = `translateX(${(i === cur ? 10 * a : 0).toFixed(1)}px)`; }); };
  }
  mk_badge(u) { const b = el('div', 'badge', `<span class="spark">✦</span>${u.text}`); this.root.appendChild(b); const at = this.cue(u.at); return (t) => setA(b, easeBack(clamp((t - at) / 0.5)), 24, 0.2); }
  mk_legend(u) { const b = el('div', 'legend', u.text); this.root.appendChild(b); return (t) => setA(b, inA(t, 1.0, 0.6), 10); }
  mk_quote(u) {
    const b = el('div', 'quote', `<div class="qm">“</div><div class="qt">${u.text}</div>${u.sub ? `<div class="qs">${u.sub}</div>` : ''}`); this.root.appendChild(b); const at = this.cue(u.at); const until = u.until ? this.cue(u.until) : 1e9;
    return (t) => setA(b, Math.min(easeBack(clamp((t - at) / 0.6)), 1 - inA(t, until - 0.4, 0.5)), 30, 0.08);
  }
  mk_quote2(u) { const b = el('div', 'quote q2', `<div class="qt">${u.text}</div>`); this.root.appendChild(b); const at = this.cue(u.at); const until = u.until ? this.cue(u.until) : 1e9; return (t) => setA(b, Math.min(easeBack(clamp((t - at) / 0.6)), 1 - inA(t, until - 0.4, 0.5)), 30, 0.08); }
  mk_stepbadge(u) {
    const b = el('div', 'stepbadge'); b.innerHTML = `<div class="sl">LANGKAH</div><div class="sn2">${u.n}<span>/6</span></div><div class="stx">${u.text}</div><div class="dots">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${i < u.n ? 'done' : i === u.n ? 'cur' : ''}"></i>`).join('')}</div>`;
    this.root.appendChild(b); const at = this.cue('step', 0.3); return (t) => setA(b, easeBack(clamp((t - at + 0.25) / 0.55)), -20, 0.1);
  }
  mk_calc(u) {
    const b = el('div', 'card calc'); this.root.appendChild(b); const ls = u.lines.map((s, i) => { const e = el('div', 'cl' + (i === u.lines.length - 1 ? ' res' : ''), s); b.appendChild(e); return e; }); const at = this.cue(u.at);
    return (t) => { setA(b, inA(t, at, 0.45), 20); ls.forEach((e, i) => { const a = inA(t, at + 0.35 + i * 0.55, 0.35); e.style.opacity = a.toFixed(3); e.style.transform = `translateX(${((1 - a) * 16).toFixed(1)}px)`; }); };
  }
  mk_cards3(u) {
    const its = u.items.map(([c, ttl, sub], i) => { const e = el('div', 'card c3', `<div class="c3n">${i + 1}</div><div class="c3t">${ttl}</div><div class="c3s">${sub}</div>`); e.style.left = (330 + i * 630 - 200) + 'px'; this.root.appendChild(e); return [this.cue(c), e]; });
    return (t) => { let cur = -1; its.forEach(([at], i) => { if (t >= at) cur = i; }); its.forEach(([at, e], i) => { const a = inA(t, at, 0.5); setA(e, a, 24); e.classList.toggle('on', i === cur); }); };
  }
  mk_timeline(u) {
    const b = el('div', 'tline'); this.root.appendChild(b); const bar = el('div', 'tbar'); b.appendChild(bar); const fill = el('div', 'tfill'); b.appendChild(fill);
    const its = u.items.map(([c, yr, txt], i) => { const n = el('div', 'tnode', `<div class="tdot"></div><div class="tyr">${yr}</div><div class="ttx">${txt}</div>`); n.style.left = (i * (100 / (u.items.length - 1))) + '%'; b.appendChild(n); return [this.cue(c), n]; });
    return (t) => { setA(b, inA(t, Math.max(0.2, its[0][0] - 0.6), 0.5), 20); let f = 0; its.forEach(([at], i) => { if (t >= at) f = i / (its.length - 1) + (i < its.length - 1 ? clamp((t - at) / 1.2) * 0 : 0); });
      fill.style.width = (100 * f) + '%'; its.forEach(([at, n], i) => { const a = inA(t, at, 0.45); n.style.opacity = (0.3 + 0.7 * a).toFixed(3); n.classList.toggle('on', t >= at); }); };
  }
  mk_stack(u) {
    const total = u.items.reduce((s, x) => s + x[1], 0); const b = el('div', 'card stack'); b.innerHTML = `<div class="ttl">${u.title}</div>`; const col = el('div', 'scol'); b.appendChild(col); this.root.appendChild(b);
    const cols = ['#14213D', '#2E86DE', '#2A9D8F', '#7DD3B0', '#F4A100'];
    const its = u.items.map(([nm, v], i) => { const r = el('div', 'srow'); r.style.setProperty('--c', cols[i % cols.length]); r.style.height = (v / total * 420) + 'px'; r.innerHTML = `<span class="sv">US$${v} jt</span><span class="sn3">${nm}</span>`; col.appendChild(r); return r; });
    const tot = el('div', 'stot', `Total: <b>US$1,17 miliar</b>`); b.appendChild(tot); const at = this.cue(u.at);
    return (t) => { setA(b, inA(t, at - 0.3, 0.5), 20); its.forEach((r, i) => { const a = easeOut(clamp((t - at - i * 0.32) / 0.5)); r.style.transform = `scaleX(${a.toFixed(3)})`; r.style.opacity = a.toFixed(3); }); setA(tot, inA(t, at + its.length * 0.32 + 0.3, 0.4), 10); };
  }
  mk_formula(u) { const b = el('div', 'formula', u.text); this.root.appendChild(b); const at = this.cue(u.at); return (t) => setA(b, inA(t, at, 0.5), -16); }
  mk_procon(u) {
    const its = u.items.map(([c, nm, pro, con], i) => { const e = el('div', 'card pc', `<div class="pcn">${nm}</div><div class="pro">＋ ${pro}</div><div class="con">－ ${con}</div>`); e.style.left = (70 + i * 362) + 'px'; this.root.appendChild(e); return [this.cue(c), e]; });
    return (t) => { let cur = -1; its.forEach(([at], i) => { if (t >= at) cur = i; }); const fin = t >= this.cue('cons', 1e9); its.forEach(([at, e], i) => { const a = inA(t, at, 0.5); setA(e, a, 30); e.classList.toggle('on', i === cur); e.classList.toggle('dim', cur >= 0 && i !== cur && !fin && i < cur); }); };
  }
  // ---- konspirasi & fakta ----
  mk_theory(u) {
    const b = el('div', 'theory'); b.innerHTML = `<div class="tstamp">TEORI KONSPIRASI <b>#${u.n}</b></div><div class="tpaper"><div class="tq">${u.text}</div><div class="tl">— beredar di media sosial</div></div>`; this.root.appendChild(b);
    const st = b.querySelector('.tstamp'), pp = b.querySelector('.tpaper'); const at = this.cue('claim', 0.4);
    return (t) => { const a = easeBack(clamp((t - at + 0.1) / 0.45)); st.style.opacity = clamp(a).toFixed(3); st.style.transform = `rotate(-4deg) scale(${(1.8 - 0.8 * a).toFixed(3)})`;
      const b2 = inA(t, at + 0.5, 0.6); pp.style.opacity = b2.toFixed(3); pp.style.transform = `translateY(${((1 - b2) * 30).toFixed(1)}px) rotate(${(-1.5 + (1 - b2) * 3).toFixed(2)}deg)`; };
  }
  mk_facts(u) {
    const p = el('div', 'card facts'); p.innerHTML = `<div class="fhead"><span class="fico">✓</span>FAKTA CEK</div>`; this.root.appendChild(p);
    const its = u.items.map(([c, txt]) => { const e = el('div', 'fit', `<span class="fdot"></span><span>${txt}</span>`); p.appendChild(e); return [this.cue(c), e]; }); const at0 = this.cue('fc', 0.3);
    return (t) => { setA(p, inA(t, at0, 0.5), 24); for (const [at, e] of its) { const a = inA(t, at, 0.45); e.style.opacity = a.toFixed(3); e.style.transform = `translateX(${((1 - a) * 24).toFixed(1)}px)`; } };
  }
  mk_verdict(u) {
    const pr = this.entry.params || {}; const tone = TONE[pr.tone] || C.amber; const b = el('div', 'verdict'); b.style.setProperty('--tone', tone);
    b.innerHTML = `<div class="vl">STATUS</div><div class="vt">${pr.verdict || ''}</div>${pr.verdict2 ? `<div class="vs">${pr.verdict2}</div>` : ''}`; this.root.appendChild(b); const at = this.cue(u.at);
    return (t) => { const k = clamp((t - at) / 0.32); const a = k < 1 ? easeOut(k) : 1; const sc = 2.2 - 1.2 * easeOut(k); const shake = k >= 1 ? Math.exp(-(t - at - 0.32) * 9) * Math.sin((t - at) * 70) * 6 : 0;
      b.style.opacity = a.toFixed(3); b.style.transform = `translate(${shake.toFixed(1)}px, 0) rotate(-7deg) scale(${sc.toFixed(3)})`; b.style.visibility = a <= 0.003 ? 'hidden' : 'visible'; };
  }
  mk_bumper(u) {
    const pr = this.entry.params || {}; const b = el('div', 'bump'); b.innerHTML = `<div class="bl">${pr.label || ''}</div><div class="bt">${pr.title || ''}</div>`; this.root.appendChild(b);
    const l = b.querySelector('.bl'), tt = b.querySelector('.bt');
    return (t) => { setA(l, inA(t, 0.35, 0.5), 20); const a = easeBack(clamp((t - 0.6) / 0.6)); tt.style.opacity = clamp(a).toFixed(3); tt.style.transform = `translateY(${((1 - a) * 50).toFixed(1)}px)`; tt.style.letterSpacing = `${(-2 + (1 - clamp(a)) * 18).toFixed(1)}px`; };
  }
  mk_endcard(u) {
    const back = el('div', 'endback'); this.root.appendChild(back);
    const b = el('div', 'endcard'); b.innerHTML = `<div class="eh">Terima kasih sudah menonton</div><div class="es">Sumber lengkap & tautan ada di deskripsi</div><div class="ebtn">▶ SUBSCRIBE</div>`; this.root.appendChild(b);
    const rw = el('div', 'rollwrap'); this.root.appendChild(rw); const roll = el('div', 'roll'); const refs = (window.__REFS || []); roll.innerHTML = `<div class="rh">DAFTAR SUMBER</div>` + refs.map((r) => `<div class="ri">${r}</div>`).join(''); rw.appendChild(roll); const at = this.cue(u.at);
    return (t) => { back.style.opacity = inA(t, at - 0.3, 0.9).toFixed(3); setA(b, inA(t, at, 0.7), 30); const a = inA(t, at + 0.5, 0.8); roll.style.opacity = a.toFixed(3); const span = Math.max(1, roll.scrollHeight - 760); const k = clamp((t - at - 1.2) / Math.max(4, this.entry.dur - at - 3)); roll.style.transform = `translateY(${(-k * span).toFixed(1)}px)`; };
  }
}

// ---------- UI global: pil bab, sumber, progres ----------
export class GlobalUI {
  constructor(root, TL) {
    this.TL = TL; this.root = el('div', 'global'); root.appendChild(this.root);
    this.pill = el('div', 'chpill'); this.root.appendChild(this.pill);
    this.src = el('div', 'srcline'); this.root.appendChild(this.src);
    this.src2 = el('div', 'srcline'); this.root.appendChild(this.src2);
    this.prog = el('div', 'progress'); this.root.appendChild(this.prog); this.pfill = el('div', 'pfill'); this.prog.appendChild(this.pfill);
    for (const c of TL.chapters) { if (c.ch === 0) continue; const tk = el('div', 'ptick'); tk.style.left = (c.t / TL.duration * 100) + '%'; this.prog.appendChild(tk); }
    this.fade = el('div', 'fadewhite'); root.appendChild(this.fade);
    this._lastSrc = null;
  }
  update(t, A, B, p) {
    const TL = this.TL; const cur = (B && p > 0.5) ? B : A;
    // pil bab
    const showPill = cur.ch >= 1 && cur.type !== 'chapter';
    const ch = TL.chapters.filter((c) => c.t <= t + 0.01).pop();
    if (ch) this.pill.innerHTML = `<b>${ch.label}</b><span>${ch.title}</span>`;
    const pa = showPill ? 1 : 0; this.pill.style.opacity = pa; this.prog.style.opacity = t > 3 ? 0.9 : 0;
    this.pfill.style.width = (t / TL.duration * 100).toFixed(3) + '%';
    // sumber: crossfade antar adegan
    const sA = (A.srcText || []).join('  ·  '), sB = B ? (B.srcText || []).join('  ·  ') : '';
    const fa = B ? 1 - smooth(clamp(p * 2)) : 1, fb = B ? smooth(clamp(p * 2 - 1)) : 0;
    const localA = t - A.start; const outA = 1 - smooth(clamp((localA - (A.dur - 0.5)) / 0.45)); const inAa = smooth(clamp((localA - 0.2) / 0.5));
    this.src.innerHTML = sA ? `<span class="sl">Sumber</span>${sA}` : ''; this.src.style.opacity = (sA ? fa * Math.min(outA, inAa) : 0).toFixed(3);
    this.src2.innerHTML = sB ? `<span class="sl">Sumber</span>${sB}` : ''; this.src2.style.opacity = (sB ? fb : 0).toFixed(3);
    // fade putih awal & akhir
    const f = Math.max(1 - clamp(t / 0.9), clamp((t - (TL.duration - 1.2)) / 1.1)); this.fade.style.opacity = f.toFixed(3);
  }
}
