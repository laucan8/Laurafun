// Shared 3D builders: sky, lights, materials, cables (pulse shader), map, globe, seabed, props
import * as THREE from 'three';
import { mulberry } from './util.js';
import { mergeGroups } from 'three/addons/utils/BufferGeometryUtils.js';

export const PAL = {
  skyTop: '#9fd0ef', skyBot: '#eaf5fb', sea: '#86cde3', seaDeep: '#6dbcd8', shallow: '#bfe8f1',
  g1: '#8fc46a', g2: '#a3cf78', g3: '#b7da8c', g4: '#7fb85e', beige: '#dcc792', beige2: '#e7d6a6', sand: '#efe0b5', side: '#d9c79a',
  navy: '#13243b', cyan: '#12b5e5', red: '#e8473c', orange: '#ff7a2f', yellow: '#ffc233', white: '#ffffff', green: '#3fbf6f',
};
const matCache = new Map();
export function lam(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...o }));
  return matCache.get(key);
}
export function basic(color, o = {}) { return new THREE.MeshBasicMaterial({ color, ...o }); }

export function gradientTex(top, bot, h = 512, mid = null) {
  const c = document.createElement('canvas'); c.width = 4; c.height = h; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); if (mid) g.addColorStop(0.55, mid); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, 4, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function setupScene(o = {}) {
  const scene = new THREE.Scene();
  scene.background = gradientTex(o.top || PAL.skyTop, o.bot || PAL.skyBot, 512, o.mid);
  if (o.fog !== false) scene.fog = new THREE.Fog(o.fogColor || o.bot || PAL.skyBot, o.near ?? 60, o.far ?? 220);
  const hemi = new THREE.HemisphereLight(0xffffff, o.ground || 0xa8c4a0, o.hemi ?? 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, o.sun ?? 1.9); sun.position.set(30, 60, 25); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfefff, 0.5); fill.position.set(-30, 20, -20); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(o.fov || 40, 16 / 9, o.cnear || 0.1, o.cfar || 1000);
  return { scene, camera, sun, hemi };
}

// ---------- animated cable / route material ----------
export function cableMat(o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uColor: { value: new THREE.Color(o.color || PAL.cyan) }, uPulse: { value: new THREE.Color(o.pulse || '#ffffff') },
      uProg: { value: 1 }, uOpacity: { value: 1 }, uDens: { value: o.dens ?? 6 }, uSpeed: { value: o.speed ?? 0.35 }, uDash: { value: o.dash ? 1 : 0 }, uPulseAmt: { value: o.pulseAmt ?? 0.8 },
      uHead: { value: o.head ?? 1 },
    }]),
    vertexShader: `varying vec2 vUv; varying vec3 vN;
      #include <fog_pars_vertex>
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime,uProg,uOpacity,uDens,uSpeed,uDash,uPulseAmt,uHead; uniform vec3 uColor,uPulse; varying vec2 vUv; varying vec3 vN;
      #include <fog_pars_fragment>
      void main(){ if(vUv.x>uProg) discard;
        if(uDash>0.5 && fract(vUv.x*uDens*4.)>0.55) discard;
        float p=fract(vUv.x*uDens-uTime*uSpeed); float pulse=smoothstep(0.0,0.08,p)*smoothstep(0.22,0.08,p);
        float head=uHead*smoothstep(uProg-0.02,uProg,vUv.x)*step(uProg,0.999);
        float rim=0.75+0.25*vN.z;
        vec3 c=mix(uColor*rim,uPulse,clamp(pulse*uPulseAmt+head,0.,1.));
        gl_FragColor=vec4(c,uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: (o.opacity ?? 1) < 1 || !!o.transparent, fog: o.fog ?? true, depthWrite: o.depthWrite ?? true,
  });
  m.uniforms.uOpacity.value = o.opacity ?? 1;
  return m;
}
export function tubeFrom(points, radius, mat, seg = null, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const g = new THREE.TubeGeometry(curve, seg || Math.max(16, points.length * 12), radius, radial, false);
  const m = new THREE.Mesh(g, mat); m.userData.curve = curve; return m;
}

// ---------- patchwork farmland texture (tileable) ----------
export function patchTex(seed = 3, size = 1024, cell = 64, pal = null) {
  const r = mulberry(seed); const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const P = pal || [PAL.g1, PAL.g2, PAL.g3, PAL.g4, PAL.beige, PAL.g2, PAL.g1, PAL.beige2, '#9ccb70', '#c9d98e'];
  x.fillStyle = PAL.g2; x.fillRect(0, 0, size, size);
  for (let gy = 0; gy < size; gy += cell) for (let gx = 0; gx < size; gx += cell) {
    // subdivide cell into 1-3 fields
    const split = r() < 0.5; const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n;
      const fx = split ? gx : gx + a * cell, fy = split ? gy + a * cell : gy, fw = split ? cell : cell / n, fh = split ? cell / n : cell;
      x.fillStyle = P[Math.floor(r() * P.length)]; x.fillRect(fx + 1.5, fy + 1.5, fw - 3, fh - 3);
      if (r() < 0.35) { x.globalAlpha = 0.12; x.fillStyle = '#ffffff'; for (let s = 0; s < fw; s += 6) x.fillRect(fx + s, fy + 2, 2, fh - 4); x.globalAlpha = 1; }
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------- SEA map ----------
// projection: x = lon - LON0, z = -(lat - LAT0)
export const LON0 = 115, LAT0 = 3;
export function P(lon, lat, y = 0) { return new THREE.Vector3(lon - LON0, y, -(lat - LAT0)); }
export const CITY = {
  jakarta: [106.85, -6.2], pakis: [107.1, -5.95], anyer: [105.88, -6.06], batam: [104.1, 1.13], singapore: [103.85, 1.3], changi: [103.99, 1.36],
  tuas: [103.64, 1.3], katong: [103.9, 1.3], dumai: [101.45, 1.68], melaka: [102.25, 2.19], medan: [98.67, 3.6], manado: [124.84, 1.49],
  surabaya: [112.75, -7.25], biak: [136.08, -1.18], sarmi: [138.75, -1.86], jayapura: [140.7, -2.53], vanimo: [141.3, -2.68], sorong: [131.25, -0.87],
  makassar: [119.4, -5.15], balikpapan: [116.8, -1.25], pontianak: [109.3, -0.03], bangka: [105.17, -2.06], kupang: [123.6, -10.17], davao: [125.6, 7.07],
  kl: [101.7, 3.14], hengchun: [120.74, 21.9], hongkong: [114.17, 22.3], manila: [120.98, 14.6], guam: [144.75, 13.45], ternate: [127.38, 0.79], johor: [103.76, 1.49],
  palembang: [104.75, -2.98], denpasar: [115.2, -8.65], kotakinabalu: [116.07, 5.98], penang: [100.33, 5.41],
};
export function buildMap(geo, o = {}) {
  const group = new THREE.Group();
  const bb = o.bbox || [90, -14, 148, 25];
  // sea texture with blurred shallows
  const W = 2048, H = Math.round(2048 * (bb[3] - bb[1]) / (bb[2] - bb[0]));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#7cc6df'); g.addColorStop(1, '#8dd2e6'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const toPx = (lon, lat) => [(lon - bb[0]) / (bb[2] - bb[0]) * W, (bb[3] - lat) / (bb[3] - bb[1]) * H];
  const path = (ring) => { ring.forEach((p, i) => { const [px, py] = toPx(p[0], p[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); };
  for (const [blur, col, alpha, grow] of [[26, '#a9def0', 1, 10], [10, '#bfe9f3', 1, 5], [3, '#d4f1f6', 1, 2]]) {
    x.filter = `blur(${blur}px)`; x.globalAlpha = alpha; x.fillStyle = col; x.strokeStyle = col; x.lineWidth = grow * 2; x.lineJoin = 'round';
    x.beginPath(); for (const poly of geo) path(poly.o); x.fill(); x.stroke();
  }
  x.filter = 'none'; x.globalAlpha = 1;
  // subtle wave hatching
  x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 1.2; const rr = mulberry(9);
  for (let i = 0; i < 900; i++) { const px = rr() * W, py = rr() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 10 + rr() * 16, py); x.stroke(); }
  const seaTex = new THREE.CanvasTexture(c); seaTex.colorSpace = THREE.SRGBColorSpace; seaTex.anisotropy = 4;
  const seaW = bb[2] - bb[0], seaH = bb[3] - bb[1];
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(seaW, seaH), new THREE.MeshBasicMaterial({ map: seaTex }));
  sea.rotation.x = -Math.PI / 2; sea.position.set((bb[0] + bb[2]) / 2 - LON0, 0, -((bb[1] + bb[3]) / 2 - LAT0));
  group.add(sea);
  // outer sea extension (fades into fog)
  const fr = new THREE.Shape([new THREE.Vector2(-seaW * 3, -seaH * 3), new THREE.Vector2(seaW * 3, -seaH * 3), new THREE.Vector2(seaW * 3, seaH * 3), new THREE.Vector2(-seaW * 3, seaH * 3)]);
  fr.holes.push(new THREE.Path([new THREE.Vector2(-seaW / 2 + 0.01, -seaH / 2 + 0.01), new THREE.Vector2(-seaW / 2 + 0.01, seaH / 2 - 0.01), new THREE.Vector2(seaW / 2 - 0.01, seaH / 2 - 0.01), new THREE.Vector2(seaW / 2 - 0.01, -seaH / 2 + 0.01)]));
  const ext = new THREE.Mesh(new THREE.ShapeGeometry(fr), new THREE.MeshBasicMaterial({ color: '#80c8e0' }));
  ext.rotation.x = -Math.PI / 2; ext.position.copy(sea.position); ext.position.y = -0.005; group.add(ext);
  // land
  const top = new THREE.MeshLambertMaterial({ map: patchTex(o.seed || 5), flatShading: true });
  top.map.repeat.set(o.fieldScale || 1.6, o.fieldScale || 1.6);
  const side = lam(PAL.side);
  const shapes = [];
  for (const poly of geo) {
    const s = new THREE.Shape(poly.o.map(p => new THREE.Vector2(p[0] - LON0, p[1] - LAT0)));
    for (const hl of poly.h) s.holes.push(new THREE.Path(hl.map(p => new THREE.Vector2(p[0] - LON0, p[1] - LAT0))));
    shapes.push(s);
  }
  const lg = mergeGroups(new THREE.ExtrudeGeometry(shapes, { depth: o.depth || 0.34, bevelEnabled: false, curveSegments: 1 }));
  const land = new THREE.Mesh(lg, [top, side]); land.rotation.x = -Math.PI / 2; land.position.y = -0.22; group.add(land);
  group.userData = { land, sea, top: (o.depth || 0.34) - 0.22 };
  return group;
}
export function landY(map) { return map.userData.top; }

// ---------- globe ----------
export function lonlat3(lon, lat, r) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
export function buildGlobe(dots, R = 10) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 6), new THREE.MeshLambertMaterial({ color: '#d7edf7' }));
  g.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.0-abs(dot(vN,vV)),1.0); float a=smoothstep(0.0,0.9,1.0-f)*0.55; gl_FragColor=vec4(0.62,0.85,1.0,a); }',
  }));
  g.add(halo);
  const dot = new THREE.CircleGeometry(R * 0.0075, 6);
  const im = new THREE.InstancedMesh(dot, new THREE.MeshBasicMaterial({ color: '#ffffff' }), dots.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), z = new THREE.Vector3(0, 0, 1); const col = new THREE.Color(); const r = mulberry(4);
  dots.forEach((d, i) => {
    const p = lonlat3(d[0], d[1], R * 1.002); q.setFromUnitVectors(z, p.clone().normalize()); m.compose(p, q, s); im.setMatrixAt(i, m);
    col.set(r() < 0.5 ? '#5fa77f' : r() < 0.5 ? '#76b98c' : '#4f9673'); im.setColorAt(i, col);
  });
  g.add(im); g.userData = { R, core };
  return g;
}
export function arcPoints(a, b, R, h = 0.25, n = 64) {
  const A = lonlat3(a[0], a[1], 1), Bv = lonlat3(b[0], b[1], 1); const pts = [];
  const ang = A.angleTo(Bv);
  for (let i = 0; i <= n; i++) {
    const u = i / n; const v = new THREE.Vector3().copy(A).multiplyScalar(Math.sin((1 - u) * ang) / Math.sin(ang)).add(Bv.clone().multiplyScalar(Math.sin(u * ang) / Math.sin(ang)));
    v.normalize().multiplyScalar(R * (1.01 + h * Math.sin(Math.PI * u) * ang / Math.PI)); pts.push(v);
  }
  return pts;
}
export function pathOnGlobe(lls, R, lift = 1.012) { return lls.map(p => lonlat3(p[0], p[1], R * lift)); }

// ---------- seabed / underwater ----------
export function buildSeabed(o = {}) {
  const g = new THREE.Group(); const r = mulberry(o.seed || 11);
  const size = o.size || 160;
  const geo = new THREE.PlaneGeometry(size, size, 70, 70); geo.rotateX(-Math.PI / 2);
  const pa = geo.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, Math.sin(x * 0.18) * 0.35 + Math.cos(z * 0.13 + x * 0.05) * 0.5 + (r() - 0.5) * 0.25 + (o.slope ? -z * o.slope : 0)); }
  geo.computeVertexNormals();
  const bed = new THREE.Mesh(geo.toNonIndexed(), lam(o.color || '#e6d6a8')); bed.geometry.computeVertexNormals(); g.add(bed);
  const rockG = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < (o.rocks ?? 40); i++) {
    const m = new THREE.Mesh(rockG, lam(r() < 0.5 ? '#b9b2a0' : '#a8a28f')); const s = 0.3 + r() * 1.3;
    m.scale.set(s * (0.8 + r() * 0.6), s * 0.6, s); m.position.set((r() - 0.5) * size * 0.8, 0, (r() - 0.5) * size * 0.8); m.rotation.set(r(), r() * 6, r());
    if (o.clear && m.position.z > o.clear[0] && m.position.z < o.clear[1]) continue; g.add(m);
  }
  const weedG = new THREE.ConeGeometry(0.18, 1, 4);
  for (let i = 0; i < (o.weeds ?? 60); i++) {
    const m = new THREE.Mesh(weedG, lam(r() < 0.5 ? '#6fb38a' : '#88c39a')); const s = 0.8 + r() * 2.4;
    m.scale.set(1, s, 1); m.position.set((r() - 0.5) * size * 0.8, s * 0.5, (r() - 0.5) * size * 0.8);
    if (o.clear && m.position.z > o.clear[0] && m.position.z < o.clear[1]) continue; g.add(m);
  }
  return g;
}

// ---------- props ----------
export function building(w, h, d, color = '#f3f1ea', roof = '#cfd8e0') {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(color)); b.position.y = h / 2; g.add(b);
  const r = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 0.04 + 0.05, d * 1.02), lam(roof)); r.position.y = h; g.add(r);
  // window bands
  const wm = lam('#9fc6dc');
  for (let y = h * 0.2; y < h * 0.9; y += Math.max(0.5, h / 6)) { const band = new THREE.Mesh(new THREE.BoxGeometry(w * 1.005, Math.min(0.18, h / 14), d * 1.005), wm); band.position.y = y; g.add(band); }
  return g;
}
export function tree(s = 1, color = '#6fae5b') {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.5 * s, 5), lam('#8a6a4a')); t.position.y = 0.25 * s; g.add(t);
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 0), lam(color)); c.position.y = 0.75 * s; g.add(c);
  return g;
}
export function tower(h = 6) {
  const g = new THREE.Group(); const m = lam('#c9d2db');
  for (const [x, z] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 4), m); leg.position.set(x * 0.6, h / 2, z * 0.6); leg.rotation.z = -x * 0.06; leg.rotation.x = z * 0.06; g.add(leg); }
  for (let y = 0.8; y < h; y += 1.0) { const ring = new THREE.Mesh(new THREE.BoxGeometry(0.62 - y * 0.03, 0.05, 0.62 - y * 0.03), m); ring.position.y = y; g.add(ring); }
  const ant = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.08), lam('#ffffff')); ant.position.set(0.25, h - 0.4, 0); g.add(ant);
  const ant2 = ant.clone(); ant2.position.set(-0.25, h - 0.4, 0); g.add(ant2);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), basic(PAL.red)); top.position.y = h + 0.1; g.add(top);
  return g;
}
export function ship(o = {}) {
  const g = new THREE.Group();
  const hullShape = new THREE.Shape(); hullShape.moveTo(-3, 0); hullShape.lineTo(2.6, 0); hullShape.lineTo(3.4, 0.9); hullShape.lineTo(-3.2, 0.9); hullShape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 1.4, bevelEnabled: false }), lam(o.hull || '#ffffff')); hull.position.z = -0.7; g.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.22, 1.44), lam(o.stripe || PAL.orange)); stripe.position.set(0.1, 0.25, 0); g.add(stripe);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.1), lam('#f4f6f8')); deck.position.set(-1.6, 1.45, 0); g.add(deck);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.15), lam('#9fc6dc')); bridge.position.set(-1.55, 2.2, 0); g.add(bridge);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 6), lam(o.funnel || PAL.orange)); funnel.position.set(-2.3, 2.1, 0); g.add(funnel);
  if (o.sheave !== false) { const sh = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.09, 6, 12), lam(PAL.orange)); sh.position.set(3.2, 1.25, 0); g.add(sh); }
  return g;
}
export function dataCenter(w = 2, d = 1.4, h = 0.8) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam('#eef1f4')); b.position.y = h / 2; g.add(b);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, h * 0.12, d * 1.01), basic(PAL.cyan)); strip.position.y = h * 0.62; g.add(strip);
  for (let i = 0; i < 3; i++) { const fan = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.12, d * 0.12, 0.06, 8), lam('#9aa7b4')); fan.position.set(-w * 0.3 + i * w * 0.3, h + 0.03, 0); g.add(fan); }
  return g;
}
// floating canvas-texture card in 3D
export function canvasPlane(wPx, hPx, draw, worldW) {
  const c = document.createElement('canvas'); c.width = wPx; c.height = hPx; const x = c.getContext('2d'); draw(x, wPx, hPx);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldW * hPx / wPx), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
  return m;
}
export function blobShadow(r = 1, a = 0.18) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(20,40,60,${a})`); g.addColorStop(1, 'rgba(20,40,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.01; return m;
}
// particles moving along a curve (instanced spheres)
export function flow(curve, n, size, color) {
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(size, 0), new THREE.MeshBasicMaterial({ color }), n);
  im.userData = { curve, n, off: Array.from({ length: n }, (_, i) => i / n) };
  im.frustumCulled = false;
  return im;
}
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
export function updateFlow(im, t, speed = 0.1, vis = 1, range = [0, 1]) {
  const { curve, n, off } = im.userData;
  for (let i = 0; i < n; i++) {
    const u = (off[i] + t * speed) % 1; const uu = range[0] + (range[1] - range[0]) * u;
    curve.getPointAt(Math.min(0.9999, Math.max(0, uu)), _v);
    const sc = vis * Math.sin(Math.PI * u) ** 0.3; _s.set(sc, sc, sc); _m.compose(_v, _q, _s); im.setMatrixAt(i, _m);
  }
  im.instanceMatrix.needsUpdate = true; im.visible = vis > 0.01;
}
