// duel.js — PLTU vs PLTP berdampingan; blok turbin–generator–kondensor–menara pendingin identik.
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, Flow, curve, polyCurve, tube, textPlane, Plume, rng, glowSprite, vessel, dashed } from '../core/kit.js';
import { wellhead, coolingTower, powerhouse } from './plantkit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 18, lightPos: [6, 22, 14] });
  const stage = rbox(26, 0.5, 9, 0.25, mat('#FFFFFF', { r: 0.6 })); stage.position.y = -0.25; scene.add(stage);
  const leftG = rbox(12.6, 0.06, 8.6, 0.2, mat('#E4E4E8')); leftG.position.set(-6.5, 0.03, 0); scene.add(leftG);
  const rightG = rbox(12.6, 0.06, 8.6, 0.2, mat('#C2E0AE')); rightG.position.set(6.5, 0.03, 0); scene.add(rightG);
  // ---- blok identik (kiri & kanan) ----
  const mkCore = (x) => { const g = new THREE.Group(); g.position.x = x; scene.add(g); const ph = powerhouse({ w: 2.8, h: 1.6, d: 1.8 }); ph.group.position.set(0, 0.06, 0.6); g.add(ph.group); const ct = coolingTower({ fans: 2 }); ct.group.position.set(0, 0.06, -2.4); g.add(ct.group); const cond = vessel(0.32, 0.8, '#E8EEF5', { band: C.water, legH: 0.25 }); cond.position.set(1.8, 0.31, -0.6); g.add(cond);
    const pls = ct.stacks.map((s, i) => { const p = new Plume(9, { rise: 2.6, spread: 0.6, size0: 0.4, size1: 1.5, life: 3.2, opacity: 0.55, seed: 40 + i + x }); p.group.position.copy(s).add(ct.group.position).add(g.position); scene.add(p.group); return p; }); return { g, ph, ct, pls }; };
  const coreL = mkCore(-2.6), coreR = mkCore(2.6);
  const idBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.6, 3.8, 6.4)), new THREE.LineDashedMaterial({ color: C.hot, dashSize: 0.3, gapSize: 0.18, transparent: true, opacity: 0 })); idBox.computeLineDistances(); idBox.position.set(0, 1.9, -0.6); scene.add(idBox);
  const idT = textPlane([{ text: 'IDENTIK', size: 120, color: C.hot, weight: 800, align: 'center' }], { width: 2.6, w: 1024, h: 220, y: 160 }); idT.position.set(0, 4.3, -0.6); scene.add(idT);
  // ---- PLTU (kiri) ----
  const boiler = rbox(2.2, 4.2, 2.0, 0.1, mat('#B9C0CC', { r: 0.6 })); boiler.position.set(-7.2, 2.1, 0.2); scene.add(boiler);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), basic('#FF8A3D')); win.position.set(-7.2, 1.3, 1.22); scene.add(win);
  const fireG = glowSprite('#FF6B35', 2.6, 0.9); fireG.position.set(-7.2, 1.3, 1.4); scene.add(fireG);
  const stackM = cyl(0.35, 0.5, 6.5, mat('#C9CFD8'), 28); stackM.position.set(-9.6, 3.25, -1.6); scene.add(stackM); for (const y of [5.6, 6.1]) { const b = cyl(0.37, 0.37, 0.2, mat('#E63946'), 28); b.position.set(-9.6, y, -1.6); scene.add(b); }
  const smoke = new Plume(18, { rise: 4.0, spread: 1.4, size0: 0.5, size1: 2.6, life: 4.0, color: '#7b8091', opacity: 0.5, drift: [0.6, 0, 0.1], seed: 7 }); smoke.group.position.set(-9.6, 6.6, -1.6); scene.add(smoke.group);
  const pile = new THREE.Group(); scene.add(pile); const r = rng(3); for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 1.3; const h = (1.3 - rad) * 0.9; const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + r() * 0.08, 0), mat('#2B2D42', { flat: true, r: 0.5 })); c.position.set(-10.2 + Math.cos(a) * rad, 0.1 + r() * h, 2.4 + Math.sin(a) * rad * 0.8); c.rotation.set(r() * 3, r() * 3, 0); c.castShadow = true; pile.add(c); }
  const conv = box(4.4, 0.12, 0.5, mat('#5B6B82'), -8.6, 1.4, 1.6); conv.rotation.z = 0.5; scene.add(conv);
  const convC = curve([V(-10.4, 0.5, 1.6), V(-6.8, 2.3, 1.6)]); const coalF = new Flow(convC, 10, { speed: 0.25, size: 0.13, color: '#2B2D42', glow: 0, seed: 1, geo: new THREE.DodecahedronGeometry(1, 0) }); scene.add(coalF.mesh);
  // kereta batu bara
  const train = new THREE.Group(); scene.add(train); for (let i = 0; i < 5; i++) { const w = box(0.9, 0.45, 0.55, mat('#6B7080'), i * 1.0, 0.3, 0); train.add(w); const top = box(0.8, 0.12, 0.45, mat('#2B2D42'), i * 1.0, 0.56, 0); train.add(top); }
  const rail = box(13, 0.04, 0.7, mat('#9AA6B5'), -6.5, 0.06, 3.7); scene.add(rail);
  const pipeL = polyCurve([[-6.1, 3.6, 0.2], [-4.4, 3.6, 0.2], [-4.4, 0.75, 0.6], [-4.0, 0.75, 0.6]]); scene.add(tube(pipeL, 0.12, glass('#fff', 0.4))); const fL = new Flow(pipeL, 20, { speed: 0.3, size: 0.07, color: '#fff', glow: 0.6, seed: 2 }); scene.add(fL.mesh);
  // ---- PLTP (kanan) ----
  const whs = [[7.0, 2.6], [8.2, 2.9], [9.4, 2.4]].map(([x, z]) => { const w = wellhead(); w.position.set(x, 0.06, z); scene.add(w); return w; });
  const sep = vessel(0.45, 2.0, '#F7F9FB', { band: C.hot, legH: 0.35 }); sep.position.set(7.0, 0.35, -0.6); scene.add(sep);
  const pR1 = polyCurve([[9.4, 1.0, 2.4], [9.4, 1.2, 2.4], [7.6, 1.2, 2.4], [7.6, 1.2, -0.6], [7.45, 1.2, -0.6]]); scene.add(tube(pR1, 0.11, glass('#fff', 0.4))); const fR1 = new Flow(pR1, 20, { speed: 0.3, size: 0.07, colorFn: (u, c, i) => c.set(i % 2 ? '#fff' : '#FF9A5A'), color: '#fff', seed: 3 }); scene.add(fR1.mesh);
  const pR2 = polyCurve([[7.0, 2.9, -0.6], [7.0, 3.6, -0.6], [4.4, 3.6, 0.6], [4.4, 0.75, 0.6], [4.0, 0.75, 0.6]]); scene.add(tube(pR2, 0.12, glass('#fff', 0.4))); const fR2 = new Flow(pR2, 20, { speed: 0.3, size: 0.07, color: '#fff', glow: 0.6, seed: 4 }); scene.add(fR2.mesh);
  const lab = (txt, col, x) => { const p = textPlane([{ text: txt, size: 130, color: col, weight: 800, align: 'center' }], { width: 3.0, w: 1024, h: 230, y: 170 }); p.position.set(x, 7.0, 0); scene.add(p); return p; };
  lab('PLTU', C.coal, -7.5); lab('PLTP', C.hot, 7.8);
  const anchors = { boiler: { p: V(-7.2, 3.8, 1.2), dx: -110, dy: -120 }, wells: { p: V(8.2, 1.2, 2.9), dx: 110, dy: -110 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [0, 11.5, 30], l: [0, 2.4, 0], fov: 34 }, { t: cu('pltu', 6), p: [-7.0, 7.0, 19.5], l: [-6.5, 2.6, 0.6], fov: 34 }, { t: cu('pltp', 14), p: [7.5, 7.0, 19.5], l: [6.8, 2.0, 0.6], fov: 34 }, { t: cu('mid', 19), p: [0, 7.5, 20.5], l: [0, 2.0, -0.4], fov: 34 }, { t: cu('ton', 30), p: [-8.5, 5.5, 17.5], l: [-8.5, 1.8, 1.4], fov: 34 }, { t: cu('free', 40), p: [8.0, 6.0, 18.0], l: [7.5, 1.6, 1.0], fov: 34 }, { t: entry.dur, p: [0, 11.0, 29], l: [0, 2.4, 0], fov: 34 }]);
  return { scene, camera, anchors, update(t) { path.apply(camera, t, 0.04);
    [coreL, coreR].forEach((c) => { c.pls.forEach((p) => p.update(t)); c.ct.fans.forEach((f, i) => (f.rotation.y = t * 6 + i)); c.ph.turbine.rotation.x = t * 3; });
    smoke.update(t); fireG.material.opacity = 0.7 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.7); coalF.update(t); fL.update(t); fR1.update(t); fR2.update(t);
    train.position.set(-13 + ((t * 0.9) % 9), 0, 3.7); const kid = smooth(prog(t, cu('mid', 19), 0.8)) * (1 - smooth(prog(t, cu('ton', 30), 0.8))); idBox.material.opacity = kid; idT.material.opacity = kid; } };
}
