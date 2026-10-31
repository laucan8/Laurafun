// conspiracy.js — papan investigasi 3D (gabus, polaroid, kliping, benang merah, lampu sorot).
import { THREE, C, V, baseScene, mat, basic, box, rbox, sphere, clamp, lerp, easeOut, easeBack, easeInOut, smooth, prog, cueOf, CamPath, rng, tube, curve, textCanvas, roundRect, FONT, glowSprite } from '../core/kit.js';

function corkTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640; const g = cv.getContext('2d'); g.fillStyle = '#D8B27E'; g.fillRect(0, 0, 1024, 640);
  const r = rng(3); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${120 + r() * 60 | 0},${80 + r() * 40 | 0},${40 + r() * 30 | 0},${0.15 + r() * 0.25})`; g.fillRect(r() * 1024, r() * 640, 1 + r() * 3, 1 + r() * 3); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// ilustrasi kecil untuk polaroid
const ART = {
  pltp(g, w, h) { g.fillStyle = '#DDEFD2'; g.fillRect(0, 0, w, h); g.fillStyle = '#C2E0AE'; g.fillRect(0, h * 0.62, w, h); g.fillStyle = '#F4F6F9'; g.fillRect(w * 0.18, h * 0.42, w * 0.22, h * 0.22); g.fillRect(w * 0.48, h * 0.3, w * 0.12, h * 0.34); g.fillStyle = '#FF6B35'; g.fillRect(w * 0.48, h * 0.36, w * 0.12, h * 0.03); g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w * (0.22 + i * 0.07), h * (0.32 - i * 0.07), w * (0.06 + i * 0.02), 0, 7); g.fill(); } },
  pltu(g, w, h) { g.fillStyle = '#E6E8EC'; g.fillRect(0, 0, w, h); g.fillStyle = '#9097A6'; g.fillRect(w * 0.15, h * 0.45, w * 0.4, h * 0.3); g.fillRect(w * 0.62, h * 0.18, w * 0.1, h * 0.57); g.fillStyle = '#E63946'; g.fillRect(w * 0.62, h * 0.22, w * 0.1, h * 0.03); g.fillStyle = 'rgba(70,74,90,.55)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * (0.7 + i * 0.06), h * (0.13 - i * 0.03), w * (0.06 + i * 0.025), 0, 7); g.fill(); } g.fillStyle = '#2B2D42'; g.fillRect(0, h * 0.75, w, h); },
  volcano(g, w, h) { g.fillStyle = '#FCE8D6'; g.fillRect(0, 0, w, h); g.fillStyle = '#B98F6B'; g.beginPath(); g.moveTo(w * 0.1, h * 0.85); g.lineTo(w * 0.42, h * 0.3); g.lineTo(w * 0.58, h * 0.3); g.lineTo(w * 0.9, h * 0.85); g.fill(); g.fillStyle = '#FF6B35'; g.beginPath(); g.moveTo(w * 0.42, h * 0.3); g.lineTo(w * 0.5, h * 0.5); g.lineTo(w * 0.58, h * 0.3); g.fill(); g.fillStyle = 'rgba(120,120,130,.5)'; g.beginPath(); g.arc(w * 0.5, h * 0.18, w * 0.12, 0, 7); g.fill(); },
  money(g, w, h) { g.fillStyle = '#EAF6EC'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#7DD3B0' : '#2A9D8F'; g.fillRect(w * 0.2 + i * 6, h * (0.62 - i * 0.09), w * 0.55, h * 0.08); } g.fillStyle = '#14213D'; g.font = `800 ${h * 0.22}px ${FONT.head}`; g.fillText('$', w * 0.42, h * 0.32); },
  globe(g, w, h) { g.fillStyle = '#EEF4FA'; g.fillRect(0, 0, w, h); g.fillStyle = '#CFE3F5'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.36, 0, 7); g.fill(); g.fillStyle = '#F7F1E6'; g.beginPath(); g.ellipse(w * 0.45, h * 0.42, w * 0.12, h * 0.1, 0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.58, h * 0.6, w * 0.1, h * 0.07, -0.3, 0, 7); g.fill(); g.fillStyle = '#FF6B35'; g.beginPath(); g.arc(w * 0.6, h * 0.58, h * 0.04, 0, 7); g.fill(); },
  seismo(g, w, h) { g.fillStyle = '#FFFDF6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#E63946'; g.lineWidth = 3; g.beginPath(); const r = rng(9); for (let x = 0; x < w; x += 4) { const amp = Math.exp(-Math.pow((x - w * 0.55) / (w * 0.12), 2)) * h * 0.38 + 3; g.lineTo(x, h / 2 + (r() - 0.5) * 2 * amp); } g.stroke(); },
  rig(g, w, h) { g.fillStyle = '#EEF2F7'; g.fillRect(0, 0, w, h); g.strokeStyle = '#E63946'; g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.35, h * 0.85); g.lineTo(w * 0.5, h * 0.15); g.lineTo(w * 0.65, h * 0.85); g.stroke(); for (let i = 1; i < 5; i++) { const y = h * (0.85 - i * 0.14); const dx = (y - h * 0.15) / (h * 0.7) * w * 0.15; g.beginPath(); g.moveTo(w * 0.5 - dx, y); g.lineTo(w * 0.5 + dx, y); g.stroke(); } g.fillStyle = '#9AA6B5'; g.fillRect(w * 0.2, h * 0.85, w * 0.6, h * 0.06); },
  coal(g, w, h) { g.fillStyle = '#E9E9EC'; g.fillRect(0, 0, w, h); g.fillStyle = '#2B2D42'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(w * (0.25 + (i % 3) * 0.25), h * (0.75 - Math.floor(i / 3) * 0.16), w * 0.12, 0, 7); g.fill(); } },
};
function polaroid(art, caption, o = {}) {
  const tex = textCanvas([{ text: caption, size: 40, color: '#2b2d42', weight: 700, font: FONT.head, align: 'center' }], { w: 512, h: 600, y: 560, bg: '#FFFFFF', draw: (g, w, h) => { g.save(); g.translate(36, 36); ART[art](g, 440, 440); g.restore(); if (o.x) { g.strokeStyle = '#E63946'; g.lineWidth = 18; g.beginPath(); g.moveTo(60, 60); g.lineTo(450, 450); g.moveTo(450, 60); g.lineTo(60, 450); g.stroke(); } } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); m.castShadow = true; return m;
}
function note(text, color = '#FFE680', o = {}) {
  const tex = textCanvas([{ text, size: o.size ?? 86, color: o.ink ?? '#2b2d42', weight: 800, align: 'center', font: FONT.head }], { w: 512, h: 400, y: o.y ?? 235, bg: color });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.33), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); m.castShadow = true; return m;
}
function clipping(head, sub) {
  const tex = textCanvas([{ text: 'HARIAN NUSANTARA', size: 34, color: '#8a7c64', weight: 700, font: FONT.mono }, { text: head, size: 74, color: '#1e1e24', weight: 800, wrap: 900, lh: 1.08, gap: 10 }, { text: sub, size: 34, color: '#555', weight: 400, font: FONT.body, wrap: 900 }], { w: 1024, h: 680, y: 80, x: 56, bg: '#F6F1E4', draw: (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 9; i++) g.fillRect(56, 470 + i * 22, w - 112, 8); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); m.castShadow = true; return m;
}
const pin = (color = '#E63946') => { const g = new THREE.Group(); g.add(sphere(0.09, mat(color, { r: 0.3, m: 0.1 }), 0, 0, 0.12, 14)); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), mat('#cccccc', { m: 0.8 })); n.rotation.x = Math.PI / 2; n.position.z = 0.05; g.add(n); return g; };

export async function create({ entry }) {
  const mode = entry.params.mode;
  const { scene, camera, stage } = baseScene({ ground: false, shadowSize: 10, lightPos: [4, 6, 12], hemi: 1.6, sun: 1.0, bg1: '#F3EFE8', bg2: '#E2DACD' });
  const board = new THREE.Group(); scene.add(board);
  const BW = 12, BH = 7.2;
  const cork = box(BW, BH, 0.3, new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.95 })); cork.receiveShadow = true; board.add(cork);
  const fm = mat('#8C6A48', { r: 0.6 }); for (const [w, h, x, y] of [[BW + 0.5, 0.35, 0, BH / 2 + 0.1], [BW + 0.5, 0.35, 0, -BH / 2 - 0.1], [0.35, BH + 0.5, BW / 2 + 0.1, 0], [0.35, BH + 0.5, -BW / 2 - 0.1, 0]]) board.add(box(w, h, 0.5, fm, x, y, 0.1));
  // lampu sorot
  const spot = new THREE.SpotLight(0xfff1dc, 60, 40, 0.42, 0.6, 1.2); spot.position.set(0, 2, 11); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); scene.add(spot); scene.add(spot.target);
  const items = []; // {obj, at, from}
  const add = (obj, x, y, rot, at, o = {}) => { obj.position.set(x, y, 0.2 + (o.z ?? 0)); obj.rotation.z = rot; board.add(obj); const p = pin(o.pin); p.position.set(x + (o.px ?? 0), y + (o.py ?? 0.75), 0.2 + (o.z ?? 0)); board.add(p); items.push({ obj, p, at, x, y, rot, z: 0.2 + (o.z ?? 0) }); return p; };
  const cu = (n, f) => cueOf(entry, n, f);
  const strings = []; // {a: pin, b: pin, at}
  let pins = {};
  if (mode === 'intro') {
    pins.a = add(polaroid('pltp', 'PLTP'), -4.0, 1.3, 0.06, 0.3);
    pins.b = add(polaroid('pltu', 'PLTU'), -1.4, 1.6, -0.05, 0.5);
    pins.c = add(polaroid('volcano', 'CINCIN API'), -4.4, -1.8, -0.08, 0.7);
    pins.d = add(polaroid('money', '???'), 1.6, -1.6, 0.07, cu('money', 4) + 0.2);
    pins.e = add(note('GEOLOGI?', '#FFE680'), 1.3, 1.6, -0.08, cu('geo', 2), { py: 0.5 });
    pins.f = add(note('UANG?', '#FFC7A8'), -1.3, -1.7, 0.09, cu('money', 4), { py: 0.5 });
    pins.g = add(note('DISENGAJA?', '#FF9F9F', { size: 66 }), 4.2, 0.2, -0.04, cu('whisper', 6), { py: 0.5 });
    const w = cu('whisper', 6) + 0.6; strings.push([pins.a, pins.g, w], [pins.b, pins.g, w + 0.25], [pins.c, pins.f, w + 0.5], [pins.d, pins.g, w + 0.75], [pins.e, pins.a, w + 1.0]);
  } else if (mode === 't1') {
    pins.a = add(clipping('“40% PANAS BUMI DUNIA ADA DI INDONESIA”', 'Klaim yang terus diulang dari tahun ke tahun…'), 1.6, 0.9, -0.03, cu('claim', 0.5), { py: 1.05 });
    pins.b = add(polaroid('globe', 'DUNIA'), -3.6, 1.0, 0.07, 0.4);
    pins.c = add(note('40%??', '#FFE680', { size: 110 }), 3.9, -2.0, 0.1, cu('q', 6), { py: 0.5 });
    pins.d = add(polaroid('volcano', 'INDONESIA'), -1.0, -1.9, -0.06, 0.8);
    strings.push([pins.b, pins.a, cu('claim', 1) + 1.2], [pins.d, pins.c, cu('q', 6) + 0.4], [pins.a, pins.c, cu('q', 6) + 0.7]);
  } else if (mode === 't2') {
    pins.a = add(polaroid('seismo', 'GEMPA?'), 0.6, 1.3, -0.05, cu('claim', 0.5) + 0.3);
    pins.b = add(polaroid('volcano', 'LETUSAN?'), 3.6, -1.2, 0.06, cu('claim', 0.5) + 1.2);
    pins.c = add(polaroid('rig', 'PENGEBORAN'), -3.2, 0.9, 0.05, 0.4);
    pins.d = add(note('VIRAL!', '#FF9F9F', { size: 100 }), -1.0, -1.9, 0.08, cu('q', 6) - 1.5, { py: 0.5 });
    strings.push([pins.c, pins.a, cu('claim', 1) + 2], [pins.c, pins.b, cu('claim', 1) + 2.4], [pins.d, pins.a, cu('q', 6)]);
  } else if (mode === 't3') {
    pins.a = add(polaroid('coal', 'BATU BARA'), -3.8, 1.2, 0.06, 0.4);
    pins.b = add(polaroid('pltp', 'PLTP', { x: true }), 0.8, 1.5, -0.04, cu('claim', 0.5) + 1.0);
    pins.c = add(polaroid('money', 'SIAPA UNTUNG?'), 3.8, -1.3, 0.05, cu('money', 6));
    pins.d = add(note('MAFIA?', '#FF9F9F', { size: 110 }), -0.9, -1.9, -0.08, cu('claim', 0.5) + 2.5, { py: 0.5 });
    strings.push([pins.a, pins.d, cu('claim', 1) + 3], [pins.d, pins.b, cu('claim', 1) + 3.3], [pins.d, pins.c, cu('money', 6) + 0.5], [pins.a, pins.c, cu('money', 6) + 0.8]);
    // bongkah batu bara 3D di rak bawah
    const r = rng(4); for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + r() * 0.15, 0), mat('#2B2D42', { r: 0.5, m: 0.2, flat: true })); c.position.set(-4.6 + i * 0.5, -BH / 2 - 0.15, 0.6 + r() * 0.3); c.rotation.set(r() * 3, r() * 3, r() * 3); c.castShadow = true; board.add(c); }
  }
  // benang merah
  const strMeshes = strings.map(([a, b, at]) => { const pa = a.position.clone(), pb = b.position.clone(); pa.z = pb.z = 0.33; const mid = pa.clone().add(pb).multiplyScalar(0.5); mid.y -= 0.35; mid.z = 0.38; const c = curve([pa, mid, pb]); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.022, 6, false), mat('#D62828', { r: 0.5 })); m.castShadow = true; board.add(m); return { m, at }; });
  // posisi papan relatif kamera: intro -> kiri (bullets kanan); teori -> kanan (kartu teori kiri)
  const side = mode === 'intro' ? -1 : 1;
  board.position.set(0, 0, 0);
  const off = side * 330;
  camera.setViewOffset(1920, 1080, -off, 0, 1920, 1080);
  const path = new CamPath([{ t: 0, p: [side * 1.5, -0.6, 15.5], l: [0, 0, 0], fov: 38 }, { t: entry.dur, p: [-side * 1.2, 0.5, 13.6], l: [0, 0.1, 0], fov: 38 }]);
  return {
    scene, camera, anchors: {},
    update(t) {
      path.apply(camera, t);
      for (const it of items) { const k = easeBack(prog(t, it.at, 0.55)); it.obj.visible = it.p.visible = k > 0.01; it.obj.position.set(it.x + (1 - k) * 0.6, it.y + (1 - k) * 1.5, it.z + (1 - clamp(k)) * 2.5); it.obj.rotation.z = it.rot + (1 - k) * 0.6; it.obj.rotation.x = (1 - clamp(k)) * -0.8; const kp = easeOut(prog(t, it.at + 0.4, 0.25)); it.p.position.z = it.z + (1 - kp) * 1.2; }
      for (const s of strMeshes) { const k = easeInOut(prog(t, s.at, 0.7)); s.m.geometry.setDrawRange(0, Math.floor(s.m.geometry.index.count * k / 3) * 3); s.m.visible = k > 0.01; }
      const sw = Math.sin(t * 0.45); spot.position.set(sw * 4, 2.5 + Math.cos(t * 0.3), 11); spot.target.position.set(sw * 2.2, Math.sin(t * 0.37) * 0.8, 0);
      spot.intensity = 55 + 8 * Math.sin(t * 7.3) * (Math.sin(t * 1.1) > 0.92 ? 1 : 0);
    },
  };
}
