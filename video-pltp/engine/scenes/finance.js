// finance.js — "DNA" biaya: kumulatif 30 th (tanpa diskonto) PLTU vs PLTP per MW (data DEA 2024, ilustrasi).
import { THREE, C, V, baseScene, mat, basic, rbox, box, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, textPlane, curve, dashed, glowSprite } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [6, 18, 12] });
  // asumsi (USD 2022/MW): PLTU SC capex 1,6 jt; tahunan = O&M tetap 47k + VOM 1,4×7000 + BBM 36×7000 ≈ 0,309 jt
  //                       PLTP besar capex 4,4+0,32 jt; tahunan = 110k + 0,27×7008 ≈ 0,112 jt
  const U = { capex: 1.6, yr: 0.3088 }, G = { capex: 4.72, yr: 0.1119 };
  const Y = 30, sx = 0.42, sy = 0.62; const x0 = -Y * sx / 2;
  const base = rbox(Y * sx + 1.4, 0.3, 4.2, 0.12, mat('#FFFFFF')); base.position.set(0, -0.15, 0); scene.add(base);
  const mkBars = (S, z, col, capCol) => { const g = new THREE.Group(); scene.add(g); const capB = rbox(0.36, S.capex * sy, 0.9, 0.05, mat(capCol, { r: 0.4 })); capB.position.set(x0, S.capex * sy / 2, z); g.add(capB); const yrs = []; for (let i = 1; i <= Y; i++) { const b = box(0.34, S.yr * sy, 0.9, mat(col, { r: 0.5 })); b.position.set(x0 + i * sx, 0, z); g.add(b); yrs.push(b); } return { g, capB, yrs }; };
  const bu = mkBars(U, -0.9, '#6B7080', '#4A4E69'), bg = mkBars(G, 0.9, '#FFC2A3', C.hot);
  // garis kumulatif
  const cum = (S) => Array.from({ length: Y + 1 }, (_, i) => V(x0 + i * sx, (S.capex + S.yr * i) * sy * 0.5 + 0.2, 0));
  const lineU = new THREE.Mesh(new THREE.TubeGeometry(curve(cum(U), false, 0), 200, 0.05, 8), basic('#4A4E69')); lineU.position.z = -2.0; scene.add(lineU);
  const lineG = new THREE.Mesh(new THREE.TubeGeometry(curve(cum(G), false, 0), 200, 0.05, 8), basic(C.hot)); lineG.position.z = -2.0; scene.add(lineG);
  const yx = (G.capex - U.capex) / (U.yr - G.yr); const cross = sphere(0.14, basic('#FFD166'), x0 + yx * sx, (U.capex + U.yr * yx) * sy * 0.5 + 0.2, -2.0); scene.add(cross); const cg = glowSprite('#FFD166', 1.2, 0.8); cg.position.copy(cross.position); scene.add(cg);
  const ct = textPlane([{ text: `titik silang ≈ tahun ke-${Math.round(yx)}`, size: 66, color: C.navy, weight: 800, align: 'center' }, { text: '(biaya kumulatif tanpa diskonto, ilustrasi)', size: 44, color: C.sub, weight: 600, align: 'center' }], { width: 4.2, w: 1024, h: 260, y: 100 }); ct.position.set(cross.position.x, cross.position.y + 1.1, -2.0); scene.add(ct);
  const tl = (txt, col, x, y, z) => { const p = textPlane([{ text: txt, size: 76, color: col, weight: 800 }], { width: 4.0, w: 1024, h: 180, y: 120, x: 10 }); p.position.set(x, y, z); scene.add(p); return p; };
  const lu = tl('PLTU: murah di depan', C.coal, x0 + Y * sx + 1.6, (U.capex + U.yr * Y) * sy * 0.5 + 0.2, -2.0), lg = tl('PLTP: murah di belakang', C.hot, x0 + Y * sx + 1.6, (G.capex + G.yr * Y) * sy * 0.5 + 0.2, -2.0);
  const ax = textPlane([{ text: 'tahun 0 → 30', size: 60, color: C.sub, weight: 700, align: 'center' }], { width: 3, w: 1024, h: 160, y: 110 }); ax.position.set(0, 0.02, 2.4); ax.rotation.x = -Math.PI / 2; scene.add(ax);
  const cu = (n, f) => cueOf(entry, n, f); const cU = cu('pltu', 3), cG = cu('pltp', 12);
  const path = new CamPath([{ t: 0, p: [-2, 7.0, 21.0], l: [1.4, 1.6, -0.5], fov: 34 }, { t: cG, p: [3.5, 6.0, 19.5], l: [1.8, 1.6, -0.5], fov: 34 }, { t: entry.dur, p: [2.5, 8.0, 21.5], l: [2.0, 1.8, -0.8], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.03);
    const grow = (B, S, at) => { const kc = easeOut(prog(t, at, 0.6)); B.capB.scale.set(1, Math.max(0.001, kc), 1); B.capB.position.y = S.capex * sy * kc / 2; B.yrs.forEach((b, i) => { const k = easeOut(prog(t, at + 0.6 + i * 0.12, 0.3)); const spike = (S === U && (i === 11 || i === 22)) ? 1.8 : 1; b.scale.set(1, Math.max(0.001, k * spike), 1); b.position.y = S.yr * sy * k * spike / 2; b.visible = k > 0.01; if (spike > 1) b.material.color.set(Math.sin(t * 8) > 0 ? '#E63946' : '#6B7080'); }); return clamp((t - at - 0.6) / (Y * 0.12)); };
    const pu = grow(bu, U, cU), pg = grow(bg, G, cG);
    lineU.geometry.setDrawRange(0, Math.floor(lineU.geometry.index.count * pu / 3) * 3); lineG.geometry.setDrawRange(0, Math.floor(lineG.geometry.index.count * pg / 3) * 3);
    const kx = smooth(prog(t, cG + 0.6 + yx * 0.12, 0.5)); cross.visible = cg.visible = kx > 0.01; ct.material.opacity = kx; cg.material.opacity = 0.8 * kx; lu.material.opacity = smooth(pu * 1.5 - 0.5); lg.material.opacity = smooth(pg * 1.5 - 0.5); } };
}
