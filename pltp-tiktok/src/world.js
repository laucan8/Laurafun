// Core world: palette, helpers, sky/lights, terrain tiles (droppable), nature,
// deterministic particles, animated flow tubes, clouds.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const COL = {
  navy: 0x142a47, cyan: 0x19b8e6, red: 0xe23b3b, orange: 0xff5a1f, white: 0xffffff,
  steel: 0xdfe5ea, steelDark: 0x5b6573, roof: 0x5d7a94, concrete: 0xc9cfd4,
  grass: [0x8cc152, 0x7db54a, 0x9dcb5e, 0xa8d46f, 0x76ad44, 0x93c75a],
  tan: [0xd8c48f, 0xcdb67c, 0xe0cf9c], forest: 0x4f8f3a, border: 0x5f8f3d,
};

export function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
export const easeIn = (t) => { t = clamp(t); return t * t * t; };
export const backOut = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

const matCache = new Map();
export function M(color, o = {}) {
  const key = color + '|' + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...o }));
  return matCache.get(key);
}
// unique (animatable) material
export function MU(color, o = {}) { return new THREE.MeshLambertMaterial({ color, flatShading: true, ...o }); }

export function add(parent, geo, mat, p = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p.x || 0, p.y || 0, p.z || 0);
  if (p.rx) m.rotation.x = p.rx; if (p.ry) m.rotation.y = p.ry; if (p.rz) m.rotation.z = p.rz;
  if (p.s) m.scale.setScalar(p.s);
  if (p.sx || p.sy || p.sz) m.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
  m.castShadow = p.cast !== false; m.receiveShadow = p.recv !== false;
  parent.add(m);
  return m;
}

// geometry with baked vertex color (for merging into one draw call)
export function cgeo(geo, color, mat4) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (mat4) g.applyMatrix4(mat4);
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
export function merge(list) { const g = mergeGeometries(list, false); g.computeVertexNormals(); return g; }
export const VC = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
export const T = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
  return m;
};
export const TS = (x, y, z, sx, sy, sz, ry = 0) => {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
  return m;
};

// ---------- canvas textures ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function labelTex(text, { bg = '#142a47', fg = '#ffffff', w = 512, h = 160, font = '700 96px BarlowC', r = 18, border } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; roundRect(g, 0, 0, w, h, r); g.fill();
    if (border) { g.strokeStyle = border; g.lineWidth = 8; roundRect(g, 4, 4, w - 8, h - 8, r); g.stroke(); }
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}
export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ---------- sky ----------
export function makeSky(scene) {
  const tex = canvasTex(8, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3f86d6'); gr.addColorStop(0.45, '#7fb2e4'); gr.addColorStop(0.78, '#c5def3'); gr.addColorStop(1, '#e3eef6');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  scene.background = tex;
  scene.fog = new THREE.Fog(0xd3e5f3, 700, 2600);
  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x87a868, 1.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfffaf0, 2.35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(window.SHADOW || 2048, window.SHADOW || 2048);
  const sc = sun.shadow.camera; sc.left = -320; sc.right = 320; sc.top = 320; sc.bottom = -320; sc.near = 10; sc.far = 2400;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.8;
  scene.add(sun); scene.add(sun.target);
  return { hemi, sun, tex };
}
export function aimSun(sun, focus, span = 320) {
  sun.position.set(focus.x - 420, focus.y + 760, focus.z + 380);
  sun.target.position.copy(focus);
  const sc = sun.shadow.camera;
  if (sc.right !== span) { sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.updateProjectionMatrix(); }
}

// ---------- particles ----------
const softTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

export class Particles {
  constructor(o) {
    this.o = Object.assign({ count: 120, life: 3, vel: [0, 30, 0], spread: [4, 6, 4], acc: [0, 0, 0], area: [1, 1, 1],
      size: [6, 26], color: 0xffffff, opacity: 0.85, fadeIn: 0.12, fadeOut: 0.55, seed: 1, t0: -1e9, t1: 1e9, shade: 0.12 }, o);
    const n = this.o.count;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    const r = rng(this.o.seed);
    this.rnd = Array.from({ length: n }, () => [r(), r(), r(), r(), r(), r(), r()]);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(this.o.color) }, uScale: { value: 800 }, uTex: { value: softTex }, uShade: { value: this.o.shade } },
      vertexShader: `attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
        gl_PointSize = min(900.0, aSize*uScale/max(1.0,-mv.z)); vA = aAlpha; }`,
      fragmentShader: `uniform vec3 uColor; uniform sampler2D uTex; uniform float uShade; varying float vA;
        void main(){ vec2 c = gl_PointCoord; float a = texture2D(uTex, c).a * vA; if(a<0.01) discard;
        float sh = 1.0 - uShade*smoothstep(0.0,1.0,c.y); gl_FragColor = vec4(uColor*sh, a); }`,
      transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.origin = new THREE.Vector3().fromArray(this.o.origin || [0, 0, 0]);
    this.intensity = 1;
  }
  update(t, camScale) {
    const o = this.o, n = o.count, L = o.life;
    this.mat.uniforms.uScale.value = camScale;
    for (let i = 0; i < n; i++) {
      const rr = this.rnd[i];
      const phase = (i + rr[6] * 0.9) / n;
      const age = (((t / L + phase) % 1) + 1) % 1 * L;
      const birth = t - age;
      let a = 0;
      if (birth >= o.t0 && birth <= o.t1 && this.intensity > 0.001) {
        const u = age / L;
        a = o.opacity * this.intensity * smooth(u / o.fadeIn) * (1 - smooth((u - (1 - o.fadeOut)) / o.fadeOut));
      }
      const vx = o.vel[0] + (rr[0] - 0.5) * 2 * o.spread[0];
      const vy = o.vel[1] + (rr[1] - 0.5) * 2 * o.spread[1];
      const vz = o.vel[2] + (rr[2] - 0.5) * 2 * o.spread[2];
      const k = i * 3;
      this.pos[k] = this.origin.x + (rr[3] - 0.5) * o.area[0] + vx * age + 0.5 * o.acc[0] * age * age;
      this.pos[k + 1] = this.origin.y + (rr[4] - 0.5) * o.area[1] + vy * age + 0.5 * o.acc[1] * age * age;
      this.pos[k + 2] = this.origin.z + (rr[5] - 0.5) * o.area[2] + vz * age + 0.5 * o.acc[2] * age * age;
      this.size[i] = lerp(o.size[0], o.size[1], Math.sqrt(age / L)) * (0.75 + rr[5] * 0.5);
      this.alpha[i] = a;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.points.visible = this.intensity > 0.001;
  }
}

// ---------- flow tubes (animated dashes, progressive reveal) ----------
export class Flow {
  constructor(points, { radius = 1.4, colorA = COL.cyan, colorB = COL.cyan, dash = null, speed = 0.9, seg = 200, closed = false, curve, radial = 8, glow = 0.0 } = {}) {
    this.curve = curve || new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal', 0.5);
    const len = this.curve.getLength();
    this.len = len;
    this.geo = new THREE.TubeGeometry(this.curve, seg, radius, radial, closed);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uProg: { value: 0 }, uStart: { value: 0 }, uA: { value: new THREE.Color(colorA) }, uB: { value: new THREE.Color(colorB) },
        uDash: { value: dash || Math.max(2, len / 14) }, uSpeed: { value: speed }, uOp: { value: 1 }, uGlow: { value: glow },
      },
      vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float uTime,uProg,uStart,uDash,uSpeed,uOp,uGlow; uniform vec3 uA,uB; varying vec2 vUv; varying vec3 vN;
        void main(){ float u=vUv.x; if(u>uProg || u<uStart) discard;
          vec3 col = mix(uA,uB,smoothstep(0.0,1.0,u));
          float d = fract(u*uDash - uTime*uSpeed);
          float band = smoothstep(0.0,0.12,d)*(1.0-smoothstep(0.42,0.6,d));
          float lit = 0.72 + 0.28*clamp(dot(vN, normalize(vec3(0.3,0.8,0.5))),0.0,1.0);
          col = col*lit*(0.82+0.0*band) + band*0.30*(vec3(1.0)-col*0.4);
          float head = smoothstep(uProg-0.03, uProg, u)*step(uProg,0.999);
          col = mix(col, vec3(1.0), head*0.7);
          col += uGlow*0.25;
          gl_FragColor=vec4(col,uOp); }`,
      transparent: true,
    });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.renderOrder = 3;
    this.head = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    this.head.renderOrder = 4;
    this.group = new THREE.Group(); this.group.add(this.mesh); this.group.add(this.head);
  }
  set(t, prog, op = 1) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uProg.value = prog;
    this.mat.uniforms.uOp.value = op;
    this.group.visible = prog > 0.001 && op > 0.001;
    const showHead = prog > 0.002 && prog < 0.995;
    this.head.visible = showHead;
    if (showHead) { this.curve.getPointAt(clamp(prog), this.head.position); this.head.material.opacity = op; }
  }
}

// rounded polyline curve (straight runs + bezier corners), for pipes
export function roundedPath(pts, r = 3) {
  const P = pts.map((p) => new THREE.Vector3(...p));
  const path = new THREE.CurvePath();
  let cur = P[0].clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
    const rr = Math.min(r, d1.length() / 2, d2.length() / 2);
    const p1 = b.clone().sub(d1.normalize().multiplyScalar(rr));
    const p2 = b.clone().add(d2.normalize().multiplyScalar(rr));
    if (cur.distanceTo(p1) > 0.01) path.add(new THREE.LineCurve3(cur.clone(), p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    cur = p2;
  }
  path.add(new THREE.LineCurve3(cur, P[P.length - 1].clone()));
  return path;
}

// ---------- vegetation / buildings (merged, vertex-colored) ----------
export function treeGeo(kind = 0) {
  if (kind === 0) {
    return merge([
      cgeo(new THREE.CylinderGeometry(0.6, 0.8, 4, 5), 0x7a5a3c, T(0, 2, 0)),
      cgeo(new THREE.ConeGeometry(5, 9, 6), 0x3f8a3a, T(0, 7.5, 0)),
      cgeo(new THREE.ConeGeometry(3.8, 7, 6), 0x4b9a40, T(0, 11.5, 0)),
    ]);
  }
  return merge([
    cgeo(new THREE.CylinderGeometry(0.6, 0.8, 4, 5), 0x7a5a3c, T(0, 2, 0)),
    cgeo(new THREE.IcosahedronGeometry(5.2, 0), 0x5aa344, T(0, 8, 0)),
  ]);
}
export function houseGeo(roof = 0xd9653b) {
  const roofG = new THREE.CylinderGeometry(0.01, 6.2, 4, 4, 1); // pyramid-ish
  return merge([
    cgeo(new THREE.BoxGeometry(8, 5, 7), 0xf3eee4, T(0, 2.5, 0)),
    cgeo(roofG, roof, T(0, 7, 0, 0, Math.PI / 4)),
  ]);
}
export function mbaruNiangGeo() { // Manggarai conical house (Poco Leok / Wae Rebo style)
  return merge([
    cgeo(new THREE.CylinderGeometry(7.5, 7.5, 3, 10), 0x8a6a48, T(0, 1.5, 0)),
    cgeo(new THREE.ConeGeometry(9, 22, 10), 0x9b7d55, T(0, 14, 0)),
    cgeo(new THREE.ConeGeometry(1.2, 4, 6), 0x5e4630, T(0, 26, 0)),
  ]);
}
export function towerGeo(h = 34) { // lattice transmission tower (low-poly)
  const parts = [];
  const lean = 0.07;
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    parts.push(cgeo(new THREE.BoxGeometry(0.55, h, 0.55), 0x9aa3ad, T(x * 2.2, h / 2, z * 2.2, z * lean, 0, -x * lean)));
  }
  parts.push(cgeo(new THREE.BoxGeometry(15, 0.7, 0.7), 0x9aa3ad, T(0, h * 0.82, 0)));
  parts.push(cgeo(new THREE.BoxGeometry(10, 0.7, 0.7), 0x9aa3ad, T(0, h * 0.96, 0)));
  for (let k = 1; k < 5; k++) {
    const w = 4.6 - k * 0.55;
    parts.push(cgeo(new THREE.BoxGeometry(w * 2, 0.35, 0.35), 0xa9b1ba, T(0, h * k / 5.5, w * 0.98)));
    parts.push(cgeo(new THREE.BoxGeometry(w * 2, 0.35, 0.35), 0xa9b1ba, T(0, h * k / 5.5, -w * 0.98)));
  }
  return merge(parts);
}

// ---------- terrain tiles (instanced, droppable) ----------
export class Terrain {
  constructor(scene, { exclude = (cx, cz) => false, override = () => null } = {}) {
    this.group = new THREE.Group(); scene.add(this.group);
    const r = rng(7);
    const N = 27, S = 40;
    this.tiles = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const cx = -520 + S * i, cz = -520 + S * j;
      if (exclude(cx, cz)) continue;
      this.tiles.push({ cx, cz, r: r(), r2: r(), ax: new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize() });
    }
    const n = this.tiles.length;
    const topG = new THREE.BoxGeometry(S - 1.2, 3, S - 1.2); topG.translate(0, -1.5, 0);
    const botG = new THREE.BoxGeometry(S, 3, S); botG.translate(0, -2.2, 0);
    this.top = new THREE.InstancedMesh(topG, new THREE.MeshLambertMaterial({ flatShading: true }), n);
    this.bot = new THREE.InstancedMesh(botG, new THREE.MeshLambertMaterial({ color: 0x5c8a3b, flatShading: true }), n);
    this.top.receiveShadow = true; this.bot.receiveShadow = true;
    this.group.add(this.top, this.bot);
    // tile kinds
    const c = new THREE.Color();
    this.tiles.forEach((tl, k) => {
      const d = Math.hypot(tl.cx + 150, tl.cz + 420);
      const roadRow = tl.cz === 160 || tl.cx === -280;
      let kind = 'field';
      if (roadRow) kind = 'road';
      else if (d < 330 || (Math.abs(tl.cx) > 420 && tl.r < 0.6) || (tl.cz < -300 && tl.r < 0.45)) kind = 'forest';
      else if (tl.r < 0.10 || (Math.hypot(tl.cx - 200, tl.cz - 260) < 90) || (Math.hypot(tl.cx + 330, tl.cz - 300) < 70)) kind = 'village';
      else if (tl.r < 0.36) kind = 'paddy';
      const ovk = override(tl.cx, tl.cz); if (ovk) kind = ovk;
      tl.kind = kind;
      let col;
      if (kind === 'forest') col = [0x5e9e43, 0x55963d, 0x67a64a][Math.floor(tl.r2 * 3)];
      else if (kind === 'paddy') col = [0xa9d46e, 0xb4da7a, 0x9fd065][Math.floor(tl.r2 * 3)];
      else if (kind === 'road') col = 0x94c25c;
      else if (kind === 'kawah') col = 0xd8d2ae;
      else if (kind === 'village') col = 0x9cc463;
      else col = tl.r2 < 0.22 ? COL.tan[Math.floor(tl.r * 30) % 3] : COL.grass[Math.floor(tl.r2 * 60) % 6];
      c.setHex(col); this.top.setColorAt(k, c);
    });
    // decorations per tile
    this.decos = [];
    const r2 = rng(11);
    const treeA = { geo: treeGeo(0), items: [] }, treeB = { geo: treeGeo(1), items: [] }, house = { geo: houseGeo(), items: [] }, house2 = { geo: houseGeo(0x5d7a94), items: [] };
    const road = { geo: cgeo(new THREE.BoxGeometry(S, 0.5, 7), 0xe3d6ae), items: [] };
    const roadV = { geo: cgeo(new THREE.BoxGeometry(7, 0.5, S), 0xe3d6ae), items: [] };
    const paddy = { geo: cgeo(new THREE.BoxGeometry(S - 6, 0.3, 1.2), 0x7fb24a), items: [] };
    this.tiles.forEach((tl, k) => {
      if (tl.kind === 'forest') {
        const m = 5 + Math.floor(r2() * 6);
        for (let q = 0; q < m; q++) (r2() < 0.6 ? treeA : treeB).items.push({ k, m: T((r2() - 0.5) * 32, 0, (r2() - 0.5) * 32, 0, r2() * 6, 0, 0.8 + r2() * 0.7) });
      } else if (tl.kind === 'village') {
        const m = 3 + Math.floor(r2() * 4);
        for (let q = 0; q < m; q++) (r2() < 0.75 ? house : house2).items.push({ k, m: T((r2() - 0.5) * 28, 0, (r2() - 0.5) * 28, 0, Math.floor(r2() * 4) * Math.PI / 2 + (r2() - 0.5) * 0.3, 0, 0.8 + r2() * 0.3) });
        if (r2() < 0.7) treeB.items.push({ k, m: T((r2() - 0.5) * 30, 0, (r2() - 0.5) * 30, 0, 0, 0, 0.9) });
      } else if (tl.kind === 'road') {
        if (tl.cz === 160) road.items.push({ k, m: T(0, 0.25, 0) });
        if (tl.cx === -280) roadV.items.push({ k, m: T(0, 0.3, 0) });
        if (r2() < 0.5) treeB.items.push({ k, m: T((r2() - 0.5) * 30, 0, 12 + r2() * 5, 0, 0, 0, 0.8) });
      } else if (tl.kind === 'paddy') {
        for (let q = -2; q <= 2; q++) paddy.items.push({ k, m: T(0, 0.15, q * 7) });
      } else if (r2() < 0.35) {
        for (let q = 0; q < 4; q++) treeB.items.push({ k, m: T(-16 + q * 10, 0, 17, 0, r2(), 0, 0.7 + r2() * 0.3) });
      }
    });
    for (const d of [treeA, treeB, house, house2, road, roadV, paddy]) {
      if (!d.items.length) continue;
      d.inst = new THREE.InstancedMesh(d.geo, VC, d.items.length);
      d.inst.castShadow = d !== road && d !== roadV && d !== paddy; d.inst.receiveShadow = true;
      this.group.add(d.inst); this.decos.push(d);
    }
    this.extra = []; // {obj, cx, cz, base: Vector3, delayBias}
    this.tm = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.sv = new THREE.Vector3();
    this.tileM = new Array(n);
    this.state = null;
    this.setDrop(-10);
  }
  // attach any object so it falls with the ripple (delay from its position)
  attach(obj, bias = 0) { this.extra.push({ obj, base: obj.position.clone(), rot: obj.rotation.clone(), scale: obj.scale.clone(), bias }); }
  tileXform(cx, cz, tl, bias, ax, rr, out) {
    const delay = Math.hypot(cx, cz * 1.25) / 720 * 1.7 + rr * 0.35 + bias;
    const u = clamp((tl - delay) / 1.5);
    const e = Math.pow(u, 2.1);
    return { y: -e * 420, rot: e * 1.1 * (rr < 0.5 ? 1 : -1), s: 1 - smooth((u - 0.72) / 0.28), u };
  }
  setDrop(tl) {
    const key = Math.round(tl * 1000);
    if (this.state === key) return; this.state = key;
    const n = this.tiles.length;
    for (let k = 0; k < n; k++) {
      const t = this.tiles[k];
      const x = this.tileXform(t.cx, t.cz, tl, 0, t.ax, t.r);
      this.q.setFromAxisAngle(t.ax, x.rot);
      this.sv.setScalar(Math.max(0.0001, x.s));
      this.tm.compose(this.v.set(t.cx, x.y, t.cz), this.q, this.sv);
      this.top.setMatrixAt(k, this.tm); this.bot.setMatrixAt(k, this.tm);
      this.tileM[k] = this.tm.clone();
    }
    this.top.instanceMatrix.needsUpdate = true; this.bot.instanceMatrix.needsUpdate = true;
    const tmp = new THREE.Matrix4();
    for (const d of this.decos) {
      d.items.forEach((it, i) => { tmp.multiplyMatrices(this.tileM[it.k], it.m); d.inst.setMatrixAt(i, tmp); });
      d.inst.instanceMatrix.needsUpdate = true;
    }
    for (const e of this.extra) {
      const x = this.tileXform(e.base.x, e.base.z, tl, e.bias, null, 0.5);
      e.obj.position.set(e.base.x, e.base.y + x.y, e.base.z);
      e.obj.rotation.set(e.rot.x + x.rot * 0.3, e.rot.y, e.rot.z + x.rot * 0.2);
      e.obj.scale.copy(e.scale).multiplyScalar(Math.max(0.0001, x.s));
      e.obj.visible = x.s > 0.001;
    }
    this.dropped = tl > 0.05;
  }
}

// ---------- volcano / mountains ----------
export function volcanoGeo(R = 300, H = 230, seed = 3, crater = true) {
  const r = rng(seed);
  const prof = [];
  const steps = 7;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const rad = R * (1 - u) * (1 - 0.18 * Math.sin(u * Math.PI)) + (crater ? R * 0.13 : 2) * u;
    prof.push(new THREE.Vector2(rad, H * Math.pow(u, 0.85)));
  }
  if (crater) { prof.push(new THREE.Vector2(R * 0.09, H * 0.93)); prof.push(new THREE.Vector2(0.01, H * 0.9)); }
  const g = new THREE.LatheGeometry(prof, 15).toNonIndexed();
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const noise = new Map();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const key = `${Math.round(x * 10)}_${Math.round(y * 10)}_${Math.round(z * 10)}`;
    if (!noise.has(key)) noise.set(key, (r() - 0.5));
    const nz = noise.get(key);
    const k = y / H;
    if (y > 2) { p.setX(i, x * (1 + nz * 0.08)); p.setZ(i, z * (1 + nz * 0.08)); p.setY(i, y + nz * H * 0.03); }
  }
  g.computeVertexNormals();
  for (let i = 0; i < p.count; i += 3) {
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 / H;
    if (y < 0.35) c.setHex(0x5f9f45); else if (y < 0.6) c.setHex(0x7aa24c); else if (y < 0.8) c.setHex(0x9a9466); else c.setHex(0xa59a8a);
    c.offsetHSL(0, 0, (r() - 0.5) * 0.04);
    for (let q = 0; q < 3; q++) { cols[(i + q) * 3] = c.r; cols[(i + q) * 3 + 1] = c.g; cols[(i + q) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

// ---------- clouds ----------
export function cloudTex(seed = 1) {
  const r = rng(seed);
  return canvasTex(512, 256, (g, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w * (0.18 + 0.64 * r()), y = h * (0.42 + 0.3 * r() - 0.12 * Math.sin((x / w) * Math.PI));
      const rad = 40 + 70 * r() * Math.sin((x / w) * Math.PI);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  });
}
export function makeCloud(tex, w, h, op = 0.95) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: op, fog: true }));
  s.scale.set(w, h, 1); s.renderOrder = 6;
  return s;
}
