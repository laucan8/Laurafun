// plantkit.js — komponen PLTP & penampang geologi yang dipakai ulang (plant, duel, types3, sorik, dll.)
import { THREE, C, V, mat, glass, basic, box, cyl, sphere, rbox, tube, curve, polyCurve, Flow, Plume, vessel, pipeMesh, fbm, rng, shadowAll, lerp, clamp, glowSprite } from '../core/kit.js';

export const BLOCK = { x0: -9, x1: 9, z0: -5, z1: 3, depth: 9 };
const PX = 2048 / 18, PY = 1024 / 9;
const sx = (x) => (x + 9) * PX, sy = (y) => -y * PY;
export const capTop = (x) => -2.25 - 0.95 * Math.pow((x + 0.5) / 9, 2) * 1.6;
export const capBot = (x) => capTop(x) - 1.0;

// tekstur penampang (sisi depan balok)
export function sectionTexture(o = {}) {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const g = cv.getContext('2d');
  const fillBand = (topFn, botFn, color) => { g.beginPath(); for (let px = 0; px <= 2048; px += 8) { const x = px / PX - 9; g.lineTo(px, sy(topFn(x))); } for (let px = 2048; px >= 0; px -= 8) { const x = px / PX - 9; g.lineTo(px, sy(botFn(x))); } g.closePath(); g.fillStyle = color; g.fill(); };
  fillBand(() => 0, () => -9, '#C9AA8B');
  fillBand(() => 0, () => -0.45, '#D8BE93');
  fillBand(() => -0.45, (x) => capTop(x), '#EAD9B6');
  fillBand((x) => capTop(x), (x) => capBot(x), o.capColor ?? '#C9B9E8');
  fillBand((x) => capBot(x), (x) => -6.9 + 0.25 * Math.sin(x * 0.5), '#F4BE88');
  // tekstur bintik (fbm)
  const id = g.getImageData(0, 0, 2048, 1024); const d = id.data;
  for (let py = 0; py < 1024; py += 1) for (let px = 0; px < 2048; px += 1) { const n = fbm(px * 0.012, py * 0.012, 3) * 14 + (((px * 7 + py * 13) % 17) - 8) * 0.6; const k = (py * 2048 + px) * 4; d[k] = clamp(d[k] + n, 0, 255); d[k + 1] = clamp(d[k + 1] + n, 0, 255); d[k + 2] = clamp(d[k + 2] + n * 0.8, 0, 255); }
  g.putImageData(id, 0, 0);
  // garis perlapisan
  g.strokeStyle = 'rgba(120,90,60,0.18)'; g.lineWidth = 2;
  for (let k = 0; k < 7; k++) { g.beginPath(); for (let px = 0; px <= 2048; px += 16) { const x = px / PX - 9; const y = -0.7 - k * 0.22 + 0.05 * Math.sin(x * 1.3 + k); if (y > capTop(x)) g.lineTo(px, sy(y)); } g.stroke(); }
  // arsir lempung
  g.strokeStyle = 'rgba(110,80,170,0.25)'; g.lineWidth = 2;
  for (let k = 1; k < 5; k++) { g.beginPath(); for (let px = 0; px <= 2048; px += 12) { const x = px / PX - 9; g.lineTo(px, sy(lerp(capTop(x), capBot(x), k / 5))); } g.stroke(); }
  // rekahan reservoir
  const r = rng(5); g.strokeStyle = 'rgba(170,95,45,0.55)'; g.lineWidth = 3;
  for (let i = 0; i < 70; i++) { let x = -8.6 + r() * 17.2; let y = capBot(x) - 0.2 - r() * 3.2; if (y < -6.7) continue; g.beginPath(); g.moveTo(sx(x), sy(y)); for (let s = 0; s < 3; s++) { x += (r() - 0.5) * 0.9; y += (r() - 0.6) * 0.7; g.lineTo(sx(x), sy(Math.max(-6.8, Math.min(capBot(x) - 0.1, y)))); } g.stroke(); }
  // sumber panas (intrusi magma)
  const mx = sx(o.magmaX ?? 0.2), my = sy(-9.1); const gr = g.createRadialGradient(mx, my, 10, mx, my, 520); gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(0.18, 'rgba(255,170,70,1)'); gr.addColorStop(0.42, 'rgba(255,110,50,0.75)'); gr.addColorStop(1, 'rgba(255,110,50,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
  // isoterm
  g.setLineDash([14, 12]); g.lineWidth = 3; g.font = '700 30px Inter'; g.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [T, base, amp] of [[100, -1.6, 0.5], [200, -3.6, 0.9], [300, -6.2, 1.2]]) { g.strokeStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); for (let px = 0; px <= 2048; px += 10) { const x = px / PX - 9; g.lineTo(px, sy(base + amp * Math.exp(-Math.pow((x - 0.2) / 6, 2)))); } g.stroke(); g.fillText(`${T} °C`, sx(7.6), sy(base + amp * Math.exp(-Math.pow((7.6 - 0.2) / 6, 2))) - 10); }
  g.setLineDash([]);
  // patahan
  g.strokeStyle = 'rgba(80,60,40,0.55)'; g.lineWidth = 5; g.setLineDash([22, 10]);
  for (const [a, b] of [[-6.3, -4.6], [7.4, 5.9]]) { g.beginPath(); g.moveTo(sx(a), 0); g.lineTo(sx(b), 1024); g.stroke(); }
  g.setLineDash([]);
  // skala kedalaman
  g.fillStyle = 'rgba(20,33,61,0.85)'; g.font = '800 30px "PJS", Inter'; g.textAlign = 'left';
  for (let km = 0; km <= 3; km++) { const y = sy(-km * 3); g.fillRect(0, y - 2, 46, 5); g.fillText(`${km} km`, 56, Math.min(1010, Math.max(32, y + 11))); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// overlay kubah lempung (anomali resistivitas rendah) — untuk efek sorot
export function capGlowTexture() {
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const g = cv.getContext('2d');
  g.beginPath(); for (let px = 0; px <= 2048; px += 8) { const x = px / PX - 9; g.lineTo(px, sy(capTop(x) + 0.12)); } for (let px = 2048; px >= 0; px -= 8) { const x = px / PX - 9; g.lineTo(px, sy(capBot(x) - 0.12)); } g.closePath();
  const gr = g.createLinearGradient(0, 200, 0, 520); gr.addColorStop(0, 'rgba(70,90,255,0.9)'); gr.addColorStop(1, 'rgba(160,80,255,0.9)'); g.fillStyle = gr; g.fill();
  g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function terrainBlock(o = {}) {
  const g = new THREE.Group(); const B = BLOCK; const W = B.x1 - B.x0, Dp = B.z1 - B.z0;
  const sec = sectionTexture(o);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, B.depth), new THREE.MeshStandardMaterial({ map: sec, roughness: 0.9 })); front.position.set(0, -B.depth / 2, B.z1); front.receiveShadow = true; g.add(front);
  const sideTex = (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 1024; const c = cv.getContext('2d'); const bands = [[0, 0.45, '#D8BE93'], [0.45, 2.6, '#EAD9B6'], [2.6, 3.6, '#C9B9E8'], [3.6, 6.9, '#F4BE88'], [6.9, 9, '#C9AA8B']]; for (const [a, b, col] of bands) { c.fillStyle = col; c.fillRect(0, a * PY, 512, (b - a) * PY); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sm = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.95 });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(Dp, B.depth), sm); left.rotation.y = -Math.PI / 2; left.position.set(B.x0, -B.depth / 2, (B.z0 + B.z1) / 2); g.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(Dp, B.depth), sm); right.rotation.y = Math.PI / 2; right.position.set(B.x1, -B.depth / 2, (B.z0 + B.z1) / 2); g.add(right);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, B.depth), sm); back.rotation.y = Math.PI; back.position.set(0, -B.depth / 2, B.z0); g.add(back);
  // permukaan atas berbukit ringan di belakang
  const tg = new THREE.PlaneGeometry(W, Dp, 120, 50); tg.rotateX(-Math.PI / 2); const pa = tg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) + (B.z0 + B.z1) / 2; const wx = Math.min(1, (x - B.x0) / 1.2, (B.x1 - x) / 1.2), wz = Math.min(1, (z - B.z0) / 1.0); const back = clamp((-z - 2.6) / 2.4); const hill = (0.9 + fbm(x * 0.25, z * 0.3, 3)) * 1.25 * back; pa.setY(i, Math.max(0, hill) * Math.max(0, wx) * Math.max(0, wz)); pa.setZ(i, z); }
  tg.computeVertexNormals(); const top = new THREE.Mesh(tg, mat('#C2E0AE', { r: 0.95 })); top.receiveShadow = true; top.castShadow = true; g.add(top);
  // pohon low-poly
  const r = rng(21); const trees = new THREE.Group(); g.add(trees);
  for (let i = 0; i < 46; i++) { const x = B.x0 + 0.6 + r() * (W - 1.2), z = B.z0 + 0.4 + r() * 2.6; if (Math.abs(x - 6.6) < 2.2 && z > -3.6) continue; const h = 0.5 + r() * 0.6; const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22 + r() * 0.12, h, 7), mat(r() > 0.5 ? '#9CCB8A' : '#7FB98A', { flat: true })); const yb = (0.9 + fbm(x * 0.25, z * 0.3, 3)) * 1.25 * clamp((-z - 2.6) / 2.4); cone.position.set(x, Math.max(0, yb) + h / 2, z); cone.castShadow = true; trees.add(cone); }
  // garis tepi tipis (rapi)
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, B.depth, Dp)), new THREE.LineBasicMaterial({ color: '#b8a58a', transparent: true, opacity: 0.6 })); edge.position.set(0, -B.depth / 2, (B.z0 + B.z1) / 2); g.add(edge);
  return { group: g, front };
}

// kepala sumur "christmas tree"
export function wellhead(o = {}) {
  const g = new THREE.Group(); const m = mat('#E8ECF1', { r: 0.35, m: 0.3 }), red = mat('#E63946', { r: 0.4 }), yel = mat('#F4A100', { r: 0.4 });
  g.add(cyl(0.16, 0.2, 0.18, mat('#9aa6b5'), 20, 0, 0.09, 0));
  for (let i = 0; i < 3; i++) { g.add(cyl(0.11, 0.11, 0.2, m, 20, 0, 0.3 + i * 0.26, 0)); const hw = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20), i === 1 ? yel : red); hw.position.set(0.18, 0.3 + i * 0.26, 0); hw.rotation.y = Math.PI / 2; g.add(hw); }
  const side = cyl(0.07, 0.07, 0.4, m, 14); side.rotation.z = Math.PI / 2; side.position.set(-0.2, 0.7, 0); g.add(side);
  return shadowAll(g);
}
export function pad(w, d) { const p = box(w, 0.08, d, mat('#E3E7EC', { r: 0.9 })); p.position.y = 0.04; return p; }
export function powerhouse(o = {}) {
  const g = new THREE.Group(); const W = o.w ?? 3.0, H = o.h ?? 1.7, D = o.d ?? 1.9;
  const floor = box(W, 0.12, D, mat('#E8ECF1', { r: 0.9 }), 0, 0.06, 0); g.add(floor);
  const frame = mat('#9AA6B5', { r: 0.5, m: 0.3 });
  for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) g.add(box(0.08, H, 0.08, frame, x, H / 2, z));
  const roof = box(W + 0.12, 0.08, D + 0.12, mat('#F4F6F9'), 0, H, 0); roof.material.transparent = true; roof.material.opacity = 0.35; roof.castShadow = false; g.add(roof);
  const gl = glass('#cfe3f5', 0.16); for (const [x, z, ry, w] of [[0, D / 2, 0, W], [0, -D / 2, 0, W], [W / 2, 0, Math.PI / 2, D], [-W / 2, 0, Math.PI / 2, D]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, H), gl); p.position.set(x, H / 2, z); p.rotation.y = ry; g.add(p); }
  // turbin + generator (sumbu x)
  const tgrp = new THREE.Group(); g.add(tgrp);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 1.2, 32), mat('#F2F4F7', { r: 0.3, m: 0.35 })); tb.rotation.z = Math.PI / 2; tb.position.set(-0.55, 0.62, 0); tb.castShadow = true; tgrp.add(tb);
  const gen = cyl(0.36, 0.36, 0.9, mat('#2E86DE', { r: 0.35, m: 0.2 }), 32); gen.rotation.z = Math.PI / 2; gen.position.set(0.65, 0.62, 0); tgrp.add(gen);
  const shaft = cyl(0.06, 0.06, 0.5, mat('#AEB8C6', { m: 0.6, r: 0.3 }), 12); shaft.rotation.z = Math.PI / 2; shaft.position.set(0.05, 0.62, 0); tgrp.add(shaft);
  tgrp.add(box(2.3, 0.2, 0.8, mat('#C9D1DB'), 0.05, 0.2, 0));
  return { group: shadowAll(g), turbine: tb, gen, W, H, D };
}
export function coolingTower(o = {}) {
  const g = new THREE.Group(); const n = o.fans ?? 3; const W = n * 1.0 + 0.3, H = 1.3, D = 1.4;
  const body = rbox(W, H, D, 0.08, mat('#F1F4F8', { r: 0.6 })); body.position.y = H / 2; g.add(body);
  for (let i = 0; i < 9; i++) { const l = box(W * 0.98, 0.03, 0.02, mat('#C9D3DE'), 0, 0.15 + i * 0.12, D / 2 + 0.01); l.castShadow = false; g.add(l); }
  const fans = []; const stacks = [];
  for (let i = 0; i < n; i++) { const x = -W / 2 + 0.65 + i * 1.0; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.45, 32, 1, true), mat('#E3E8EF', { side: THREE.DoubleSide })); st.position.set(x, H + 0.22, 0); st.castShadow = true; g.add(st); stacks.push(V(x, H + 0.45, 0));
    const fan = new THREE.Group(); for (let b = 0; b < 4; b++) { const bl = box(0.7, 0.02, 0.1, mat('#5B6B82'), 0, 0, 0); bl.rotation.y = b * Math.PI / 4; fan.add(bl); } fan.position.set(x, H + 0.3, 0); g.add(fan); fans.push(fan); }
  return { group: shadowAll(g), fans, stacks, W, H, D };
}
export function drillRig(h = 3.6) {
  const g = new THREE.Group(); const m = mat('#E63946', { r: 0.5 }), w = mat('#F4F6F9');
  const base = box(1.4, 0.25, 1.4, mat('#9AA6B5'), 0, 0.12, 0); g.add(base);
  const legs = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
  for (const [x, z] of legs) { const L = new THREE.Vector3(x, 0.25, z), T = new THREE.Vector3(x * 0.25, h, z * 0.25); const len = L.distanceTo(T); const c = cyl(0.035, 0.035, len, m, 8); c.position.copy(L.clone().add(T).multiplyScalar(0.5)); c.quaternion.setFromUnitVectors(V(0, 1, 0), T.clone().sub(L).normalize()); g.add(c); }
  for (let k = 1; k < 6; k++) { const y = 0.25 + k * (h - 0.25) / 6; const s = 1 - (y - 0.25) / (h - 0.25) * 0.75; const r = box(1.0 * s, 0.03, 0.03, w, 0, y, 0.5 * s); g.add(r); const r2 = box(1.0 * s, 0.03, 0.03, w, 0, y, -0.5 * s); g.add(r2); const r3 = box(0.03, 0.03, 1.0 * s, w, 0.5 * s, y, 0); g.add(r3); const r4 = box(0.03, 0.03, 1.0 * s, w, -0.5 * s, y, 0); g.add(r4); }
  g.add(box(0.4, 0.2, 0.4, mat('#F4A100'), 0, h + 0.1, 0));
  const cab = box(0.6, 0.45, 0.5, mat('#F4F6F9'), 0.9, 0.35, 0); g.add(cab);
  return shadowAll(g);
}
export function mtSensor() { const g = new THREE.Group(); const m = mat('#14213D'); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const l = cyl(0.015, 0.015, 0.5, m, 6); l.position.set(Math.cos(a) * 0.12, 0.23, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(l); } g.add(box(0.22, 0.14, 0.16, mat('#F4A100'), 0, 0.48, 0)); const ant = cyl(0.008, 0.008, 0.4, m, 6); ant.position.set(0.06, 0.75, 0); g.add(ant); return shadowAll(g); }
export function fumarole(o = {}) { const g = new THREE.Group(); const crater = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.12, 24), mat('#E9E3B8', { r: 1 })); crater.position.y = 0.06; g.add(crater); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), basic('#C9A14A')); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.125; g.add(hole); const pl = new Plume(14, { rise: 2.2, spread: 0.6, size0: 0.2, size1: 1.1, life: 3, opacity: 0.6, seed: o.seed ?? 9 }); pl.group.position.y = 0.15; g.add(pl.group); return { group: g, plume: pl }; }
export function hotSpring(o = {}) { const g = new THREE.Group(); const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.08, 32), mat('#EDE6CF')); rim.position.y = 0.04; g.add(rim); const w = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), new THREE.MeshStandardMaterial({ color: '#7FD6E3', roughness: 0.1, emissive: '#3BB7C9', emissiveIntensity: 0.25 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.085; g.add(w); const pl = new Plume(10, { rise: 1.2, spread: 0.9, size0: 0.3, size1: 1.0, life: 3.4, opacity: 0.4, seed: o.seed ?? 4 }); pl.group.position.y = 0.1; g.add(pl.group); return { group: g, plume: pl }; }
export function transformerYard() { const g = new THREE.Group(); g.add(box(0.7, 0.55, 0.5, mat('#8E9AAB'), 0, 0.3, 0)); for (let i = 0; i < 3; i++) g.add(cyl(0.04, 0.05, 0.35, mat('#C7663F'), 10, -0.2 + i * 0.2, 0.75, 0)); const py = new THREE.Group(); const m = mat('#AEB8C6', { m: 0.4 }); for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const c = cyl(0.025, 0.025, 2.6, m, 6); c.position.set(x * 0.6, 1.3, z * 0.6); c.rotation.set(-z * 0.18, 0, x * 0.18); py.add(c); } py.add(box(1.3, 0.05, 0.05, m, 0, 2.3, 0)); py.add(box(1.0, 0.05, 0.05, m, 0, 1.9, 0)); py.position.set(-1.0, 0, 0); g.add(py); return shadowAll(g); }
