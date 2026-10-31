// types3.js — tiga tipe PLTP: uap kering, flash, biner (ORC) — diorama mini berdampingan.
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, smooth, prog, cueOf, CamPath, Flow, curve, polyCurve, tube, Plume, vessel, setOpacity } from '../core/kit.js';
import { wellhead } from './plantkit.js';

export function miniTurbine(color = '#F2F4F7') { const g = new THREE.Group(); const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.9, 28), mat(color, { m: 0.3, r: 0.3 })); tb.rotation.z = Math.PI / 2; tb.position.y = 0.55; g.add(tb); const gen = cyl(0.3, 0.3, 0.7, mat('#2E86DE', { r: 0.35 }), 24); gen.rotation.z = Math.PI / 2; gen.position.set(0.85, 0.55, 0); g.add(gen); g.add(box(1.9, 0.15, 0.6, mat('#C9D1DB'), 0.4, 0.08, 0)); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; }
export function heatEx() { const g = new THREE.Group(); const b = cyl(0.32, 0.32, 1.4, mat('#E8EEF5', { m: 0.3, r: 0.35 }), 28); b.rotation.z = Math.PI / 2; b.position.y = 0.5; g.add(b); for (const x of [-0.5, 0, 0.5]) { const r = cyl(0.34, 0.34, 0.06, mat(C.green), 28); r.rotation.z = Math.PI / 2; r.position.set(x, 0.5, 0); g.add(r); } g.add(box(1.3, 0.12, 0.4, mat('#C9D1DB'), 0, 0.06, 0)); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; }
export function airCooler() { const g = new THREE.Group(); g.add(box(1.4, 0.5, 0.8, mat('#F1F4F8'), 0, 0.6, 0)); for (const x of [-0.35, 0.35]) { const r = cyl(0.3, 0.3, 0.1, mat('#5B6B82'), 20); r.position.set(x, 0.9, 0); g.add(r); } for (const [x, z] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) g.add(box(0.06, 0.4, 0.06, mat('#9aa6b5'), x, 0.2, z)); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [8, 18, 12] });
  const cu = (n, f) => cueOf(entry, n, f);
  const mkSlab = (x) => { const g = new THREE.Group(); g.position.x = x; scene.add(g); const s = rbox(5.0, 0.6, 3.6, 0.16, mat('#FFFFFF', { r: 0.6 })); s.position.y = -0.3; g.add(s); const grass = rbox(4.9, 0.08, 3.5, 0.1, mat('#C2E0AE', { r: 0.9 })); grass.position.y = 0.02; g.add(grass); return g; };
  const xs = [-5.8, 0, 5.8]; const P = xs.map(mkSlab);
  const flows = []; const G = new THREE.Color();
  // 1) Uap kering
  { const g = P[0]; const wh = wellhead(); wh.position.set(-1.6, 0.06, 0.6); g.add(wh); const tb = miniTurbine(); tb.position.set(0.4, 0.06, -0.5); g.add(tb);
    const c = polyCurve([[-1.6, 1.0, 0.6], [-1.6, 1.3, 0.6], [-1.6, 1.3, -0.5], [-0.2, 1.3, -0.5], [-0.2, 0.6, -0.5]]); g.add(tube(c, 0.1, glass('#fff', 0.4))); const f = new Flow(c, 26, { speed: 0.25, size: 0.07, color: '#ffffff', glow: 0.6, seed: 1 }); g.add(f.mesh); flows.push(f);
    const pl = new Plume(8, { rise: 1.2, spread: 0.4, size0: 0.2, size1: 0.7, life: 2.6, opacity: 0.5, seed: 1 }); pl.group.position.set(1.9, 0.9, -0.5); g.add(pl.group); flows.push({ update: (t) => pl.update(t) }); }
  // 2) Flash
  { const g = P[1]; const wh = wellhead(); wh.position.set(-1.8, 0.06, 0.8); g.add(wh); const sep = vessel(0.32, 1.3, '#F7F9FB', { band: C.hot, legH: 0.3 }); sep.position.set(-0.4, 0.3, 0.3); g.add(sep); const tb = miniTurbine(); tb.position.set(0.9, 0.06, -0.8); g.add(tb);
    const c1 = polyCurve([[-1.8, 1.0, 0.8], [-1.8, 1.2, 0.8], [-0.75, 1.2, 0.8], [-0.75, 1.2, 0.3], [-0.68, 1.2, 0.3]]); g.add(tube(c1, 0.1, glass('#fff', 0.4))); const f1 = new Flow(c1, 18, { speed: 0.3, size: 0.06, colorFn: (u, c, i) => c.set(i % 2 ? '#fff' : '#FF9A5A'), color: '#fff', seed: 2 }); g.add(f1.mesh); flows.push(f1);
    const c2 = polyCurve([[-0.4, 1.95, 0.3], [-0.4, 2.2, 0.3], [-0.4, 2.2, -0.8], [0.6, 2.2, -0.8], [0.6, 0.6, -0.8]]); g.add(tube(c2, 0.1, glass('#fff', 0.4))); const f2 = new Flow(c2, 22, { speed: 0.3, size: 0.06, color: '#fff', glow: 0.6, seed: 3 }); g.add(f2.mesh); flows.push(f2);
    const c3 = polyCurve([[-0.1, 0.45, 0.3], [1.8, 0.2, 0.3], [1.8, 0.2, 1.3], [1.8, -0.1, 1.3]]); g.add(tube(c3, 0.08, glass('#fff', 0.4))); const f3 = new Flow(c3, 16, { speed: 0.3, size: 0.055, color: C.water, glow: 0.3, seed: 4 }); g.add(f3.mesh); flows.push(f3); }
  // 3) Biner
  { const g = P[2]; const wh = wellhead(); wh.position.set(-1.9, 0.06, 0.9); g.add(wh); const hx = heatEx(); hx.position.set(-0.6, 0.06, 0.2); g.add(hx); const tb = miniTurbine(); tb.position.set(0.7, 0.06, -0.9); g.add(tb); const ac = airCooler(); ac.position.set(1.6, 0.06, 0.6); g.add(ac);
    const cGeo = polyCurve([[-1.9, 1.0, 0.9], [-1.9, 1.15, 0.9], [-1.3, 1.15, 0.9], [-1.3, 0.55, 0.2], [0.1, 0.55, 0.2], [0.1, 0.3, 1.3], [-1.0, 0.3, 1.5], [-1.0, -0.1, 1.5]]);
    g.add(tube(cGeo, 0.08, glass('#fff', 0.4))); const fg = new Flow(cGeo, 30, { speed: 0.2, size: 0.06, colorFn: (u, c) => c.set('#FF7A33').lerp(new THREE.Color(C.water), smooth((u - 0.45) * 2.5)), color: '#fff', seed: 5 }); g.add(fg.mesh); flows.push(fg);
    const cOrc = polyCurve([[-0.2, 0.9, 0.2], [-0.2, 1.4, 0.2], [0.3, 1.4, -0.9], [0.3, 0.6, -0.9], [0.25, 0.6, -0.9], [1.9, 0.6, -0.9], [1.9, 1.15, -0.1], [1.6, 1.15, 0.6], [1.6, 0.35, 0.6], [0.6, 0.35, 0.6], [0.0, 0.35, 0.2], [-0.2, 0.9, 0.2]]);
    g.add(tube(cOrc, 0.07, glass('#BDF2D8', 0.45))); const fo = new Flow(cOrc, 40, { speed: 0.14, size: 0.06, color: C.green, glow: 0.5, seed: 6 }); g.add(fo.mesh); flows.push(fo); }
  const labels = [cu('dry', 3), cu('flash', 14), cu('binary', 22)];
  const path = new CamPath([{ t: 0, p: [0, 7.5, 16], l: [0, 0.6, 0], fov: 34 }, { t: labels[0], p: [-4.5, 4.5, 9.5], l: [-5.6, 0.7, 0], fov: 34 }, { t: labels[1] - 1, p: [-3.5, 4.8, 9.8], l: [-5.2, 0.7, 0], fov: 34 }, { t: labels[1] + 1, p: [1.0, 4.5, 9.5], l: [0, 0.8, 0], fov: 34 }, { t: labels[2], p: [3.0, 4.5, 9.5], l: [3.8, 0.8, 0], fov: 34 }, { t: cu('orc', 28) + 2, p: [7.5, 4.0, 8.0], l: [5.8, 0.8, 0], fov: 34 }, { t: entry.dur, p: [1.0, 7.2, 16.5], l: [0, 0.4, 0], fov: 34 }]);
  return {
    scene, camera, anchors: {},
    update(t) { path.apply(camera, t, 0.04); flows.forEach((f) => f.update(t)); let cur = -1; labels.forEach((at, i) => { if (t >= at) cur = i; });
      P.forEach((g, i) => { const on = cur === i || cur === -1 || t > entry.dur - 3; const y = on && cur === i ? 0.25 * easeOut(prog(t, labels[i], 0.6)) : 0; g.position.y = lerp(g.position.y, y, 1); }); },
  };
}
