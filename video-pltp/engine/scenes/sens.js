// sens.js — sensitivitas: WACC 7/10/12% & harga karbon titik impas (perhitungan anuitas, data DEA 2024).
import { THREE, C, V, baseScene, mat, basic, rbox, box, sphere, clamp, lerp, easeOut, easeInOut, easeBack, smooth, prog, cueOf, CamPath, textPlane, curve, dashed, glowSprite } from '../core/kit.js';

const crf = (r, n) => r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
const lcoeG = (r) => (4.72e6 * crf(r, 30) + 110e3) / 7008 + 0.27; // US$/MWh
const lcoeU = (r, coal = 70, co2 = 0) => (1.6e6 * crf(r, 30) + 47e3) / 7000 + 1.4 + (3.6 / 0.37) * (3.7 * coal / 70) + co2 * 0.935;
const lab = (txt, col, w = 2.0, size = 80) => textPlane([{ text: txt, size, color: col, weight: 800, align: 'center' }], { width: w, w: 1024, h: 200, y: 140 });

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [6, 18, 12] });
  const cu = (n, f) => cueOf(entry, n, f);
  // panel kiri: WACC
  const left = new THREE.Group(); left.position.set(-5.2, 0, 0); scene.add(left);
  const plat = rbox(6.4, 0.3, 3, 0.12, mat('#FFFFFF')); plat.position.y = -0.15; left.add(plat);
  const S = 0.045; const rates = [0.07, 0.10, 0.12]; const bars = [];
  rates.forEach((r, i) => { const x = -2.0 + i * 2.0; [['PLTP', lcoeG(r), C.hot, -0.38], ['PLTU', lcoeU(r), '#4A4E69', 0.38]].forEach(([nm, v, col, dx]) => { const b = rbox(0.62, 1, 0.62, 0.06, mat(col, { r: 0.45 })); b.geometry.translate(0, 0.5, 0); b.position.set(x + dx, 0, 0); left.add(b); const l = lab(String(Math.round(v)), col, 1.0, 100); l.position.set(x + dx, v * S + 0.35, 0.35); left.add(l); bars.push({ b, l, v, at: cu('wacc', 5) + i * 0.3 }); }); const rl = lab(`WACC ${Math.round(r * 100)}%`, C.ink, 1.8, 72); rl.position.set(x, -0.15, 1.52); left.add(rl); });
  const lgd = textPlane([{ text: '■ PLTP   ■ PLTU', size: 64, color: C.sub, weight: 700, align: 'center' }], { width: 3, w: 1024, h: 160, y: 110 }); lgd.position.set(0, 5.4, 0); left.add(lgd);
  const c130 = rbox(0.62, 1, 0.62, 0.06, mat('#2B2D42')); c130.geometry.translate(0, 0.5, 0); c130.position.set(2.9, 0, -0.9); left.add(c130); const v130 = lcoeU(0.10, 130); const l130 = lab(`${Math.round(v130)} @ US$130/t`, '#2B2D42', 2.6, 70); l130.position.set(2.9, v130 * S + 0.35, -0.9); left.add(l130);
  // panel kanan: grafik harga karbon
  const right = new THREE.Group(); right.position.set(3.2, 0, 0); scene.add(right);
  const back = rbox(7.2, 5.4, 0.2, 0.15, mat('#FFFFFF')); back.position.set(0, 2.9, -0.2); right.add(back);
  const X = (c) => -3.0 + c / 60 * 6.0, Yv = (v) => 0.6 + (v - 50) / 80 * 4.6;
  for (const v of [60, 80, 100, 120]) { const g = dashed([V(X(0), Yv(v), 0), V(X(60), Yv(v), 0)], '#C9D3DF', { dash: 0.12, gap: 0.1 }); right.add(g); const tl = lab(String(v), C.sub, 0.7, 64); tl.position.set(X(0) - 0.45, Yv(v), 0); right.add(tl); }
  for (const c of [0, 20, 40, 60]) { const tl = lab(`$${c}`, C.sub, 0.8, 64); tl.position.set(X(c), 0.25, 0); right.add(tl); }
  const ax = lab('harga karbon (US$/tCO₂) →', C.ink, 3.6, 60); ax.position.set(0.6, -0.15, 0.3); right.add(ax);
  const ay = lab('LCOE US$/MWh', C.ink, 2.4, 60); ay.position.set(X(0) + 0.6, 5.35, 0); right.add(ay);
  const ptsU = [], ptsG = []; for (let c = 0; c <= 60; c += 2) { ptsU.push(V(X(c), Yv(lcoeU(0.10, 70, c)), 0.05)); ptsG.push(V(X(c), Yv(lcoeG(0.10) + c * 0.038), 0.05)); }
  const lineU = new THREE.Mesh(new THREE.TubeGeometry(curve(ptsU, false, 0), 120, 0.05, 8), basic('#4A4E69')); right.add(lineU);
  const lineG = new THREE.Mesh(new THREE.TubeGeometry(curve(ptsG, false, 0), 120, 0.05, 8), basic(C.hot)); right.add(lineG);
  const be = (lcoeG(0.10) - lcoeU(0.10)) / (0.935 - 0.038); const dot = sphere(0.13, basic('#FFD166'), X(be), Yv(lcoeG(0.10) + be * 0.038), 0.1); right.add(dot); const dg = glowSprite('#FFD166', 1.1, 0.8); dg.position.copy(dot.position); right.add(dg);
  const bt = lab(`impas ≈ US$${Math.round(be)}/tCO₂`, C.navy, 3.2, 70); bt.position.set(X(be) + 0.6, dot.position.y + 0.7, 0.1); right.add(bt);
  const tU = lab('PLTU', '#4A4E69', 1.2, 80), tG = lab('PLTP', C.hot, 1.2, 80); tU.position.set(X(60) + 0.4, Yv(lcoeU(0.10, 70, 60)), 0.1); tG.position.set(X(60) + 0.4, Yv(lcoeG(0.10) + 60 * 0.038) - 0.35, 0.1); right.add(tU); right.add(tG);
  const path = new CamPath([{ t: 0, p: [-4.5, 5.0, 13.5], l: [-4.8, 2.2, 0], fov: 34 }, { t: cu('carbon', 14) - 0.5, p: [-3.5, 4.5, 13.5], l: [-4.2, 2.2, 0], fov: 34 }, { t: cu('carbon', 14) + 1.5, p: [3.2, 3.8, 13.0], l: [3.0, 2.8, 0], fov: 34 }, { t: cu('coal130', 22), p: [3.0, 3.8, 13.0], l: [3.0, 2.8, 0], fov: 34 }, { t: cu('coal130', 22) + 2, p: [-2.5, 4.5, 11.0], l: [-3.0, 2.4, 0], fov: 34 }, { t: entry.dur, p: [0, 5.5, 17.5], l: [-0.8, 2.4, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.03);
    bars.forEach((o) => { const k = easeOut(prog(t, o.at, 0.9)); o.b.scale.set(1, Math.max(0.001, o.v * S * k), 1); o.l.material.opacity = k; o.l.position.y = o.v * S * k + 0.35; });
    const k130 = easeOut(prog(t, cu('coal130', 22), 1)); c130.scale.set(1, Math.max(0.001, v130 * S * k130), 1); c130.visible = k130 > 0.01; l130.material.opacity = k130; l130.position.y = v130 * S * k130 + 0.35;
    const kc = easeInOut(prog(t, cu('carbon', 14), 2.2)); lineU.geometry.setDrawRange(0, Math.floor(lineU.geometry.index.count * kc / 3) * 3); lineG.geometry.setDrawRange(0, Math.floor(lineG.geometry.index.count * kc / 3) * 3);
    const kb = easeBack(prog(t, cu('carbon', 14) + 1.4, 0.5)); dot.scale.setScalar(Math.max(0.001, kb)); dg.material.opacity = 0.8 * clamp(kb); bt.material.opacity = clamp(kb); tU.material.opacity = tG.material.opacity = kc; } };
}
