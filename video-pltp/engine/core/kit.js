// kit.js — utilitas 3D bersama untuk semua adegan (tema terang, deterministik terhadap waktu)
import * as THREE from '../lib/three.module.min.js';
export { THREE };

export const C = {
  bg1: '#F8FAFD', bg2: '#E3E9F1', navy: '#14213D', ink: '#24324A', sub: '#5B6B82',
  hot: '#FF6B35', magma: '#E8462E', amber: '#F4A100', gold: '#FFD166', water: '#2E86DE', sky: '#7CC4FF',
  steam: '#F2F8FF', green: '#2A9D8F', mint: '#7DD3B0', coal: '#4A4E69', coalDark: '#2B2D42', lav: '#B9A7E8',
  peach: '#F6C28B', soil: '#E8D6B0', rock: '#D6C2A1', rock2: '#C4AE8C', basement: '#A99179', grass: '#CBE4BE',
  metal: '#DCE2EA', metal2: '#AEB8C6', white: '#FFFFFF', red: '#E63946', blue: '#3A86FF', purple: '#8E6CEF',
};

// ---------- matematika & easing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeBack = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const prog = (t, t0, d = 1) => clamp((t - t0) / d);
export const pulse = (t, f = 1) => 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * f);
export function rng(seed = 1) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// value noise 2D deterministik
const _perm = (() => { const r = rng(1337); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p.concat(p); })();
const _g = (i, j) => (_perm[(_perm[i & 255] + j) & 255] / 255) * 2 - 1;
export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = _g(xi, yi), b = _g(xi + 1, yi), c = _g(xi, yi + 1), d = _g(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise2(x * f, y * f); a *= 0.5; f *= 2; } return s; };

// ---------- material ----------
const _matCache = new Map();
export function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.r ?? 0.62, metalness: o.m ?? 0.04, transparent: o.opacity !== undefined && o.opacity < 1, opacity: o.opacity ?? 1, emissive: new THREE.Color(o.em ?? '#000000'), emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, flatShading: o.flat ?? false, depthWrite: o.depthWrite ?? true });
}
export function glass(color = '#ffffff', opacity = 0.25, o = {}) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.15, metalness: 0.0, transparent: true, opacity, depthWrite: false, side: o.side ?? THREE.DoubleSide });
}
export function basic(color, o = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: o.opacity !== undefined && o.opacity < 1 || !!o.transparent, opacity: o.opacity ?? 1, depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
}
export function setOpacity(obj, a) {
  obj.traverse((m) => { if (m.material) { const mats = Array.isArray(m.material) ? m.material : [m.material]; for (const mm of mats) { if (mm.userData.baseOpacity === undefined) mm.userData.baseOpacity = mm.opacity; mm.opacity = mm.userData.baseOpacity * a; mm.transparent = mm.transparent || a < 1; } m.visible = a > 0.002; } });
}

// ---------- tekstur kanvas ----------
export function gradientTexture(c1 = C.bg1, c2 = C.bg2, vertical = true) {
  const cv = document.createElement('canvas'); cv.width = vertical ? 4 : 512; cv.height = vertical ? 512 : 4;
  const g = cv.getContext('2d'); const gr = vertical ? g.createLinearGradient(0, 0, 0, 512) : g.createLinearGradient(0, 0, 512, 0);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _soft;
export function softTexture() {
  if (_soft) return _soft;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _soft = new THREE.CanvasTexture(cv); _soft.colorSpace = THREE.SRGBColorSpace; return _soft;
}
let _radial;
export function radialFade() {
  if (_radial) return _radial;
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512); _radial = new THREE.CanvasTexture(cv); return _radial;
}
export const FONT = { head: '"PJS", "Plus Jakarta Sans", Inter, sans-serif', body: 'Inter, sans-serif', mono: '"JBM", monospace' };
// teks pada kanvas -> tekstur (untuk objek 3D: papan, kertas, label panggung)
export function textCanvas(lines, o = {}) {
  const w = o.w ?? 1024, h = o.h ?? 512; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; if (o.radius) { roundRect(g, 0, 0, w, h, o.radius); g.fill(); } else g.fillRect(0, 0, w, h); }
  if (o.draw) o.draw(g, w, h);
  let y = o.y ?? 80;
  for (const L of (Array.isArray(lines) ? lines : [lines])) {
    const ln = typeof L === 'string' ? { text: L } : L;
    g.font = `${ln.weight ?? 800} ${ln.size ?? 64}px ${ln.font ?? FONT.head}`; g.fillStyle = ln.color ?? C.navy; g.textAlign = ln.align ?? o.align ?? 'left'; g.textBaseline = 'alphabetic';
    const x = ln.x ?? (g.textAlign === 'center' ? w / 2 : (o.x ?? 60));
    if (ln.wrap) { for (const part of wrap(g, ln.text, ln.wrap)) { g.fillText(part, x, y); y += (ln.size ?? 64) * (ln.lh ?? 1.2); } }
    else { g.fillText(ln.text, x, y); y += (ln.size ?? 64) * (ln.lh ?? 1.25); }
    if (ln.gap) y += ln.gap;
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function wrap(g, text, maxW) { const words = text.split(' '); const out = []; let cur = ''; for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test; } if (cur) out.push(cur); return out; }
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function textPlane(lines, o = {}) {
  const tex = textCanvas(lines, o); const wu = o.width ?? 4; const hu = wu * (o.h ?? 512) / (o.w ?? 1024);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wu, hu), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: o.depthWrite ?? false, side: THREE.DoubleSide }));
  return m;
}

// ---------- panggung (studio putih tanpa batas) ----------
export function makeStage(scene, o = {}) {
  scene.background = gradientTexture(o.bg1 ?? C.bg1, o.bg2 ?? C.bg2);
  const hemi = new THREE.HemisphereLight(0xffffff, new THREE.Color(o.groundTint ?? '#dfe6ef'), o.hemi ?? 2.5); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, o.sun ?? 2.5);
  const lp = o.lightPos ?? [14, 26, 12]; dir.position.set(...lp);
  dir.castShadow = o.shadow !== false; const s = o.shadowSize ?? 22;
  dir.shadow.mapSize.set(o.shadowRes ?? 2048, o.shadowRes ?? 2048); Object.assign(dir.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 120 });
  dir.shadow.bias = -0.0004; dir.shadow.normalBias = 0.02; dir.shadow.radius = 4;
  if (o.target) dir.target.position.set(...o.target); scene.add(dir); scene.add(dir.target);
  const fill = new THREE.DirectionalLight(0xdbe8ff, o.fill ?? 0.8); fill.position.set(-12, 8, -6); scene.add(fill);
  let ground = null;
  if (o.ground !== false) {
    const R = o.groundSize ?? 80;
    const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.groundColor ?? '#F3F6FA'), map: null, alphaMap: radialFade(), transparent: true, depthWrite: false, toneMapped: false });
    ground = new THREE.Mesh(new THREE.PlaneGeometry(R, R), gm); ground.rotation.x = -Math.PI / 2; ground.position.y = (o.groundY ?? 0) - 0.002; ground.renderOrder = -2; scene.add(ground);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(R, R), new THREE.ShadowMaterial({ opacity: o.shadowOpacity ?? 0.16, color: new THREE.Color('#1d2b44') }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = o.groundY ?? 0; sh.receiveShadow = true; sh.renderOrder = -1; scene.add(sh);
  }
  return { hemi, dir, fill, ground };
}
export function shadowAll(obj, cast = true, receive = true) { obj.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } }); return obj; }

// ---------- geometri bantu ----------
export function box(w, h, d, material, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
export function cyl(rt, rb, h, material, seg = 32, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
export function sphere(r, material, x = 0, y = 0, z = 0, seg = 24) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.66 | 0)), material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
export function rbox(w, h, d, r, material) {
  // kotak membulat sederhana via ExtrudeGeometry
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: Math.min(r, d) * 0.4, bevelSize: Math.min(r, d) * 0.4, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -d / 2); const m = new THREE.Mesh(g, material); m.castShadow = m.receiveShadow = true; return m;
}
export function curve(points, closed = false, tension = 0.5) { return new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : V(...p))), closed, 'catmullrom', tension); }
export function polyCurve(points) { // garis patah dengan sudut membulat (untuk pipa industri)
  const P = points.map((p) => (p.isVector3 ? p : V(...p))); const path = new THREE.CurvePath();
  const r = 0.35;
  let prev = P[0].clone();
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    if (!c) { path.add(new THREE.LineCurve3(prev, b.clone())); break; }
    const d1 = b.clone().sub(a).normalize(), d2 = c.clone().sub(b).normalize();
    const rr = Math.min(r, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().addScaledVector(d1, -rr), p2 = b.clone().addScaledVector(d2, rr);
    path.add(new THREE.LineCurve3(prev, p1)); path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2)); prev = p2;
  }
  return path;
}
export function tube(c, radius, material, seg = 120, radial = 14) { const m = new THREE.Mesh(new THREE.TubeGeometry(c, seg, radius, radial, false), material); m.castShadow = true; m.receiveShadow = true; return m; }
export function arrow(from, to, color, r = 0.06, head = 0.22) {
  const g = new THREE.Group(); const dir = to.clone().sub(from); const L = dir.length(); const m = basic(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(0.001, L - head), 12), m); shaft.position.y = (L - head) / 2; g.add(shaft);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, head, 16), m); cone.position.y = L - head / 2; g.add(cone);
  g.position.copy(from); g.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return g;
}
export function flatArrow(len, w, color, o = {}) { // panah pipih untuk diagram (di bidang XY)
  const s = new THREE.Shape(); const hw = w / 2, hl = Math.min(len * 0.35, w * 1.6);
  s.moveTo(0, -hw); s.lineTo(len - hl, -hw); s.lineTo(len - hl, -hw * 2); s.lineTo(len, 0); s.lineTo(len - hl, hw * 2); s.lineTo(len - hl, hw); s.lineTo(0, hw); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: o.depth ?? 0.04, bevelEnabled: false }); return new THREE.Mesh(g, o.material ?? basic(color, { opacity: o.opacity ?? 1 }));
}

// ---------- partikel mengalir sepanjang kurva (deterministik) ----------
export class Flow {
  constructor(c, n, o = {}) {
    this.c = c; this.n = n; this.speed = o.speed ?? 0.15; this.size = o.size ?? 0.08; this.jitter = o.jitter ?? 0; this.colorFn = o.colorFn; this.sizeFn = o.sizeFn;
    const geo = o.geo ?? new THREE.SphereGeometry(1, 10, 8);
    const m = o.material ?? new THREE.MeshStandardMaterial({ color: new THREE.Color(o.color ?? C.hot), roughness: 0.35, emissive: new THREE.Color(o.color ?? C.hot), emissiveIntensity: o.glow ?? 0.35, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity });
    this.mesh = new THREE.InstancedMesh(geo, m, n); this.mesh.castShadow = false; this.mesh.frustumCulled = false;
    if (this.colorFn) this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const r = rng(o.seed ?? 7); this.off = Array.from({ length: n }, () => r()); this.jv = Array.from({ length: n }, () => V(r() - 0.5, r() - 0.5, r() - 0.5));
    this._m = new THREE.Matrix4(); this._p = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._c = new THREE.Color();
    this.visibleFrac = 1;
  }
  update(t, frac = 1) {
    const n = this.n; let k = 0;
    for (let i = 0; i < n; i++) {
      let u = (this.off[i] + t * this.speed + i / n) % 1; if (u < 0) u += 1;
      if (u > frac) { this._s.set(0, 0, 0); } else { const s = this.sizeFn ? this.sizeFn(u, i) : this.size; this._s.set(s, s, s); }
      this.c.getPointAt(u, this._p);
      if (this.jitter) this._p.addScaledVector(this.jv[i], this.jitter);
      this._m.compose(this._p, this._q, this._s); this.mesh.setMatrixAt(i, this._m);
      if (this.colorFn) { this.colorFn(u, this._c, i); this.mesh.setColorAt(i, this._c); }
      k++;
    }
    this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// ---------- kepulan uap (sprite lembut, deterministik) ----------
export class Plume {
  constructor(n, o = {}) {
    this.n = n; this.o = Object.assign({ rise: 3.5, spread: 1.2, size0: 0.5, size1: 2.2, life: 3.2, color: '#ffffff', opacity: 0.55, drift: [0.4, 0, 0.1] }, o);
    this.group = new THREE.Group(); const r = rng(o.seed ?? 3); this.items = [];
    for (let i = 0; i < n; i++) {
      const sm = new THREE.SpriteMaterial({ map: softTexture(), color: new THREE.Color(this.o.color), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const sp = new THREE.Sprite(sm); this.group.add(sp); this.items.push({ sp, off: r(), dx: r() - 0.5, dz: r() - 0.5, rs: 0.7 + r() * 0.6 });
    }
  }
  update(t, intensity = 1) {
    const o = this.o;
    for (const it of this.items) {
      const a = ((t / o.life) + it.off) % 1; const e = easeOut(a);
      it.sp.position.set(it.dx * o.spread * e + o.drift[0] * a * o.rise, e * o.rise * it.rs, it.dz * o.spread * e + o.drift[2] * a * o.rise);
      const s = lerp(o.size0, o.size1, e) * it.rs; it.sp.scale.set(s, s, s);
      it.sp.material.opacity = o.opacity * intensity * Math.sin(Math.PI * Math.min(1, a * 1.15)) * (1 - a * 0.4);
    }
  }
}

// ---------- jalur kamera (Hermite / Catmull-Rom berbasis waktu) ----------
export class CamPath {
  constructor(keys) { this.k = keys.map((k) => ({ t: k.t, p: V(...k.p), l: V(...k.l), fov: k.fov })); }
  _h(i, j, s, prop) {
    const k = this.k; const a = k[i][prop], b = k[j][prop];
    const pa = k[Math.max(0, i - 1)][prop], pb = k[Math.min(k.length - 1, j + 1)][prop];
    const dt = k[j].t - k[i].t || 1;
    const m0 = i === 0 ? V(0, 0, 0) : b.clone().sub(pa).multiplyScalar(dt / ((k[j].t - k[Math.max(0, i - 1)].t) || 1));
    const m1 = j === k.length - 1 ? V(0, 0, 0) : k[Math.min(k.length - 1, j + 1)][prop].clone().sub(a).multiplyScalar(dt / ((k[Math.min(k.length - 1, j + 1)].t - k[i].t) || 1));
    const s2 = s * s, s3 = s2 * s; const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return a.clone().multiplyScalar(h00).addScaledVector(m0, h10).addScaledVector(b, h01).addScaledVector(m1, h11);
  }
  at(t) {
    const k = this.k; if (t <= k[0].t) return { p: k[0].p.clone(), l: k[0].l.clone(), fov: k[0].fov };
    if (t >= k[k.length - 1].t) { const e = k[k.length - 1]; return { p: e.p.clone(), l: e.l.clone(), fov: e.fov }; }
    let i = 0; while (i < k.length - 2 && t > k[i + 1].t) i++;
    const s = (t - k[i].t) / (k[i + 1].t - k[i].t);
    const fov = k[i].fov !== undefined && k[i + 1].fov !== undefined ? lerp(k[i].fov, k[i + 1].fov, smooth(s)) : k[i].fov;
    return { p: this._h(i, i + 1, s, 'p'), l: this._h(i, i + 1, s, 'l'), fov };
  }
  apply(cam, t, drift = 0) {
    const r = this.at(t); cam.position.copy(r.p); if (drift) { cam.position.x += Math.sin(t * 0.21) * drift; cam.position.y += Math.sin(t * 0.17 + 1) * drift * 0.5; }
    if (r.fov) { cam.fov = r.fov; cam.updateProjectionMatrix(); } cam.lookAt(r.l); return r;
  }
}
// waktu cue (detik lokal) dengan fallback
export function cueOf(entry, name, fallback = 0) { const c = entry.cues || {}; return c[name] !== undefined ? c[name] : fallback; }

// ---------- objek umum ----------
export function glowSprite(color, size = 1, opacity = 0.8) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.scale.set(size, size, size); return s; }
export function ring(r, w, color, o = {}) { const m = new THREE.Mesh(new THREE.RingGeometry(r - w / 2, r + w / 2, 64), basic(color, { opacity: o.opacity ?? 1, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; }
export function line(points, color, o = {}) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map((p) => (p.isVector3 ? p : V(...p))));
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: o.opacity ?? 1, toneMapped: false }));
}
export function dashed(points, color, o = {}) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map((p) => (p.isVector3 ? p : V(...p)))), new THREE.LineDashedMaterial({ color: new THREE.Color(color), dashSize: o.dash ?? 0.2, gapSize: o.gap ?? 0.12, transparent: true, opacity: o.opacity ?? 1, toneMapped: false }));
  l.computeLineDistances(); return l;
}
// grid lantai halus
export function floorGrid(size = 40, div = 40, color = '#cfd8e3', opacity = 0.5) { const g = new THREE.GridHelper(size, div, color, color); g.material.transparent = true; g.material.opacity = opacity; g.material.depthWrite = false; return g; }

// pipa industri berisolasi: tabung + flens
export function pipeMesh(c, r, color = C.metal, o = {}) {
  const g = new THREE.Group(); const m = o.material ?? mat(color, { r: 0.35, m: 0.25 });
  g.add(tube(c, r, m, o.seg ?? 160, 16));
  if (o.flanges) { const L = c.getLength(); const n = Math.max(2, Math.floor(L / (o.flangeEvery ?? 2.5))); for (let i = 1; i < n; i++) { const p = c.getPointAt(i / n), tng = c.getTangentAt(i / n); const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, r * 0.5, 18), mat(C.metal2, { r: 0.4, m: 0.3 })); f.position.copy(p); f.quaternion.setFromUnitVectors(V(0, 1, 0), tng); f.castShadow = true; g.add(f); } }
  if (o.supports) { const L = c.getLength(); const n = Math.max(2, Math.floor(L / (o.supportEvery ?? 2))); for (let i = 1; i < n; i++) { const p = c.getPointAt(i / n); if (p.y < r * 2.2) continue; const h = p.y - r - (o.groundY ?? 0); if (h <= 0.05) continue; const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.08), mat('#9aa6b5')); s.position.set(p.x, (o.groundY ?? 0) + h / 2, p.z); s.castShadow = true; g.add(s); } }
  return g;
}
// bejana tegak (separator, tangki) dengan tutup kubah
export function vessel(r, h, color = '#F4F6F9', o = {}) {
  const g = new THREE.Group(); const m = o.material ?? mat(color, { r: 0.3, m: 0.15 });
  const body = cyl(r, r, h, m, 40); body.position.y = h / 2; g.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), m); top.scale.y = 0.55; top.position.y = h; top.castShadow = true; g.add(top);
  if (o.legs !== false) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const l = box(0.1, o.legH ?? 0.5, 0.1, mat('#8d99a8'), Math.cos(a) * r * 0.8, -(o.legH ?? 0.5) / 2, Math.sin(a) * r * 0.8); g.add(l); }
  if (o.band) { const b = cyl(r * 1.01, r * 1.01, 0.12, mat(o.band, { r: 0.4 }), 40); b.position.y = h * 0.82; g.add(b); }
  return g;
}

// proyeksi titik 3D -> piksel layar
export function project(v, cam, W = 1920, H = 1080) { const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, behind: p.z > 1 || p.z < -1 }; }

// gelombang sinus sebagai garis (untuk 50 Hz, seismograf)
export function waveLine(n, fn, color, o = {}) {
  const pts = new Float32Array(n * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: o.opacity ?? 1, toneMapped: false, linewidth: 2 }));
  l.userData.update = (t) => { for (let i = 0; i < n; i++) { const [x, y, z] = fn(i / (n - 1), t); pts[i * 3] = x; pts[i * 3 + 1] = y; pts[i * 3 + 2] = z; } g.attributes.position.needsUpdate = true; g.computeBoundingSphere(); };
  return l;
}

// membuat Scene + kamera standar
export function baseScene(o = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(o.fov ?? 32, 1920 / 1080, o.near ?? 0.1, o.far ?? 400);
  const stage = makeStage(scene, o); return { scene, camera, stage };
}
// helper: tampil/sembunyi dengan skala "pop"
export function popScale(obj, t, t0, d = 0.6, base = 1) { const e = easeBack(prog(t, t0, d)); const s = Math.max(0.0001, e * base); obj.scale.setScalar(s); obj.visible = e > 0.001; return e; }
