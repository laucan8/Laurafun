// nextgen.js — EGS (Fervo: sumur horizontal + rekahan buatan) & closed-loop (Eavor: radiator bawah tanah).
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, Flow, curve, polyCurve, tube, textPlane, rng } from '../core/kit.js';
import { wellhead } from './plantkit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 16, lightPos: [8, 22, 14], groundY: -8.2 });
  // dua balok penampang
  const mkBlock = (x) => { const g = new THREE.Group(); g.position.x = x; scene.add(g); const layers = [[0, -0.5, '#C2E0AE'], [-0.5, -2.5, '#EAD9B6'], [-2.5, -5.0, '#D9BFA0'], [-5.0, -8.0, '#E9A27A']]; for (const [a, b, col] of layers) { const bx = rbox(7.6, a - b, 3.0, 0.04, mat(col, { r: 0.9 })); bx.position.y = (a + b) / 2; g.add(bx); } return g; };
  const L = mkBlock(-4.4), R = mkBlock(4.4);
  const ZF = 1.56;
  const glassM = glass('#ffffff', 0.45);
  // EGS
  const inj = polyCurve([[-6.2, 0.4, ZF], [-6.2, -5.6, ZF], [-1.6, -6.4, ZF]]), prod = polyCurve([[-1.6, -5.4, ZF], [-5.4, -4.7, ZF], [-5.4, 0.4, ZF]]);
  L.parent.add(tube(inj, 0.1, glassM, 160, 10)); scene.add(tube(prod, 0.1, glassM, 160, 10));
  const wh1 = wellhead(); wh1.position.set(-6.2, 0, ZF - 0.1); scene.add(wh1); const wh2 = wellhead(); wh2.position.set(-5.4, 0, ZF - 0.1); scene.add(wh2);
  const r = rng(9); const fr = new THREE.Group(); scene.add(fr);
  for (let i = 0; i < 9; i++) { const x = -5.0 + i * 0.45; const p = new THREE.Mesh(new THREE.CircleGeometry(0.55 + r() * 0.2, 24), basic('#FFD166', { opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); p.position.set(x, -5.55 - (x + 5) * 0.05, ZF); p.rotation.y = Math.PI / 2; p.scale.set(1, 1.6, 1); fr.add(p); }
  const fInj = new Flow(inj, 50, { speed: 0.13, size: 0.07, color: C.water, glow: 0.3, seed: 1 }); scene.add(fInj.mesh);
  const cross = curve([V(-4.8, -6.1, ZF), V(-4.6, -5.6, ZF), V(-4.5, -5.1, ZF)]);
  const fCross = []; for (let i = 0; i < 7; i++) { const x = -4.8 + i * 0.5; const c = curve([V(x, -6.15 - i * 0.02, ZF), V(x + 0.05, -5.6, ZF), V(x + 0.1, -5.05 + i * 0.02, ZF)]); const f = new Flow(c, 5, { speed: 0.35, size: 0.06, colorFn: (u, cc) => cc.set(C.water).lerp(new THREE.Color('#FF7A33'), u), color: '#fff', seed: 10 + i }); scene.add(f.mesh); fCross.push(f); }
  const fProd = new Flow(prod, 50, { speed: 0.13, size: 0.07, color: '#FF7A33', glow: 0.4, seed: 2 }); scene.add(fProd.mesh);
  // Eavor loop: dua sumur vertikal dihubungkan banyak lateral (radiator tertutup)
  const loopG = new THREE.Group(); scene.add(loopG); const flowsE = [];
  for (let k = 0; k < 4; k++) { const zz = ZF; const y = -5.4 - k * 0.45; const c = polyCurve([[2.0, 0.4, ZF], [2.0, y + 0.4, ZF], [2.4, y, zz], [6.4, y, zz], [6.8, y + 0.4, ZF], [6.8, 0.4, ZF]]); loopG.add(tube(c, 0.07, glass('#BDF2D8', 0.5), 160, 8)); const f = new Flow(c, 40, { speed: 0.07, size: 0.065, colorFn: (u, cc) => cc.set(C.green).lerp(new THREE.Color('#FF7A33'), smooth((u - 0.3) * 2.2)), color: '#fff', seed: 20 + k }); scene.add(f.mesh); flowsE.push(f); }
  const top = polyCurve([[2.0, 0.6, ZF], [2.0, 1.2, ZF], [6.8, 1.2, ZF], [6.8, 0.6, ZF]]); scene.add(tube(top, 0.08, glass('#BDF2D8', 0.5))); const pp = box(1.2, 0.8, 0.8, mat('#F4F6F9'), 4.4, 0.4, ZF - 0.4); scene.add(pp);
  const tl = (txt, x, col) => { const p = textPlane([{ text: txt, size: 84, color: col, weight: 800, align: 'center' }], { width: 4.2, w: 1024, h: 200, y: 140 }); p.position.set(x, 2.3, ZF); scene.add(p); return p; };
  tl('EGS — Fervo, Utah', -4.4, C.hot); tl('Closed-loop — Eavor, Jerman', 4.4, C.green);
  const dep = textPlane([{ text: '± 4,5 km', size: 80, color: C.navy, weight: 800, align: 'center' }], { width: 1.8, w: 512, h: 180, y: 125 }); dep.position.set(7.6, -3.2, ZF); scene.add(dep);
  const anchors = { fervo: { p: V(-3.5, -5.6, ZF), dx: 80, dy: -160 }, eavor: { p: V(4.4, -6.7, ZF), dx: -80, dy: -170 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [0, 3.0, 24], l: [0, -3.0, 0], fov: 34 }, { t: cu('fervo', 3), p: [-4.5, -0.5, 17.5], l: [-4.2, -3.8, 0], fov: 34 }, { t: cu('eavor', 17), p: [4.5, -0.5, 17.5], l: [4.4, -3.8, 0], fov: 34 }, { t: cu('dry', 30), p: [0, 3.5, 24], l: [0, -3.0, 0], fov: 34 }, { t: entry.dur, p: [-1.5, 4.0, 24.5], l: [0, -3.2, 0], fov: 34 }]);
  return { scene, camera, anchors, update(t) { path.apply(camera, t, 0.04); const kF = smooth(prog(t, cu('fervo', 3), 1)); fInj.update(t); fProd.update(t); fCross.forEach((f) => f.update(t)); fr.children.forEach((p, i) => { p.material.opacity = 0.55 * kF * (0.6 + 0.4 * Math.sin(t * 3 + i)); p.scale.set(1, 1.6 * Math.max(0.001, easeOut(prog(t, cu('fervo', 3) + i * 0.15, 0.6))), 1); });
    const kE = smooth(prog(t, cu('eavor', 17), 1)); flowsE.forEach((f) => { f.mesh.visible = kE > 0.05; f.update(t); }); } };
}
