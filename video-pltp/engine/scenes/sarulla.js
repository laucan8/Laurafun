// sarulla.js — skema siklus kombinasi Sarulla (turbin tekanan balik + unit biner Ormat).
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, smooth, prog, cueOf, CamPath, Flow, polyCurve, tube, Plume, vessel, textPlane, popScale } from '../core/kit.js';
import { wellhead } from './plantkit.js';
import { miniTurbine, heatEx, airCooler } from './types3.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [8, 18, 12] });
  camera.setViewOffset(1920, 1080, 170, 0, 1920, 1080);
  const slab = rbox(11, 0.5, 6, 0.2, mat('#FFFFFF', { r: 0.6 })); slab.position.y = -0.25; scene.add(slab);
  const gr = rbox(10.8, 0.06, 5.8, 0.15, mat('#C2E0AE')); gr.position.y = 0.03; scene.add(gr);
  const wh = wellhead(); wh.position.set(-4.4, 0.06, 1.6); scene.add(wh);
  const sep = vessel(0.42, 1.6, '#F7F9FB', { band: C.hot, legH: 0.35 }); sep.position.set(-2.8, 0.35, 0.6); scene.add(sep);
  const bpt = miniTurbine('#F2F4F7'); bpt.scale.setScalar(1.25); bpt.position.set(-1.2, 0.06, -1.6); scene.add(bpt);
  const hx1 = heatEx(); hx1.position.set(1.6, 0.06, -1.6); scene.add(hx1);
  const hx2 = heatEx(); hx2.position.set(1.6, 0.06, 0.9); scene.add(hx2);
  const orc = miniTurbine('#E7F7EF'); orc.position.set(3.6, 0.06, -0.4); scene.add(orc);
  const ac = airCooler(); ac.scale.setScalar(1.2); ac.position.set(4.0, 0.06, 1.9); scene.add(ac);
  const flows = []; const gl = (c, r = 0.1, col = '#fff', o = 0.4) => { scene.add(tube(c, r, glass(col, o))); };
  const c1 = polyCurve([[-4.4, 1.0, 1.6], [-4.4, 1.25, 1.6], [-3.3, 1.25, 1.6], [-3.3, 1.25, 0.6], [-3.22, 1.25, 0.6]]); gl(c1); flows.push(new Flow(c1, 18, { speed: 0.3, size: 0.06, colorFn: (u, c, i) => c.set(i % 2 ? '#fff' : '#FF9A5A'), color: '#fff', seed: 1 }));
  const c2 = polyCurve([[-2.8, 2.45, 0.6], [-2.8, 2.7, 0.6], [-2.8, 2.7, -1.6], [-1.9, 2.7, -1.6], [-1.9, 0.75, -1.6]]); gl(c2, 0.11); flows.push(new Flow(c2, 24, { speed: 0.3, size: 0.07, color: '#fff', glow: 0.6, seed: 2 }));
  const c3 = polyCurve([[-0.2, 0.69, -1.6], [0.9, 0.69, -1.6]]); gl(c3, 0.11, '#fff'); flows.push(new Flow(c3, 10, { speed: 0.4, size: 0.07, color: '#DFF1FF', glow: 0.5, seed: 3 }));
  const c4 = polyCurve([[-2.4, 0.5, 0.6], [-1.2, 0.3, 0.6], [-1.2, 0.3, 0.9], [0.9, 0.56, 0.9]]); gl(c4, 0.08); flows.push(new Flow(c4, 16, { speed: 0.3, size: 0.06, color: '#FF8A3D', glow: 0.4, seed: 4 }));
  const c5 = polyCurve([[2.3, 0.56, 0.9], [2.6, 0.2, 2.4], [-3.8, 0.2, 2.4], [-3.8, -0.05, 2.4]]); gl(c5, 0.08); flows.push(new Flow(c5, 26, { speed: 0.2, size: 0.055, color: C.water, glow: 0.3, seed: 5 }));
  const cOrc = polyCurve([[1.9, 1.0, -1.6], [1.9, 1.5, -1.6], [3.2, 1.5, -0.4], [3.2, 0.75, -0.4], [5.1, 0.75, -0.4], [5.1, 1.3, 1.9], [4.0, 1.3, 1.9], [2.6, 0.9, 1.4], [1.9, 1.0, 0.9], [1.9, 1.0, -1.6]]);
  gl(cOrc, 0.07, '#BDF2D8', 0.45); flows.push(new Flow(cOrc, 44, { speed: 0.12, size: 0.06, color: C.green, glow: 0.5, seed: 6 }));
  flows.forEach((f) => scene.add(f.mesh));
  const tag = (txt, col, x, y, z, w = 3.2) => { const p = textPlane([{ text: txt, size: 72, color: col, weight: 800, align: 'center' }], { width: w, w: 1024, h: 200, y: 130 }); p.position.set(x, y, z); scene.add(p); return p; };
  const tA = tag('Turbin tekanan balik', C.navy, -1.0, 2.2, -1.6), tB = tag('Unit biner Ormat (ORC)', C.green, 3.3, 2.4, -0.4, 3.6);
  // tiga unit 110 MW
  const units = [0, 1, 2].map((i) => { const b = rbox(1.0, 0.6, 0.7, 0.08, mat(C.hot, { em: C.hot, ei: 0.2 })); b.position.set(-1.4 + i * 1.4, 0.3, -2.9 + 0 * i); scene.add(b); return b; });
  const ut = tag('3 × 110 MW', C.hot, 0, 1.0, -2.9, 2.6);
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [-2.0, 7.5, 15.5], l: [0, 0.6, 0], fov: 34 }, { t: cu('cc', 9), p: [1.5, 6.5, 13.0], l: [0.5, 0.8, -0.2], fov: 34 }, { t: cu('pf', 19), p: [-1.0, 9.5, 17.5], l: [0.3, 0.6, 0], fov: 34 }, { t: entry.dur, p: [-3.0, 9.0, 17.0], l: [0.3, 0.6, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.04); flows.forEach((f) => f.update(t)); const kc = smooth(prog(t, cu('cc', 9), 0.8)); tA.material.opacity = tB.material.opacity = kc;
    units.forEach((u, i) => popScale(u, t, cu('sar', 0.5) + 0.4 + i * 0.25, 0.5)); ut.material.opacity = smooth(prog(t, cu('sar', 0.5) + 1.2, 0.5)) * (1 - smooth(prog(t, cu('cc', 9), 0.6))); units.forEach((u) => { if (t > cu('cc', 9)) { const k = 1 - smooth(prog(t, cu('cc', 9), 0.6)); u.scale.setScalar(Math.max(0.001, k)); u.visible = k > 0.01; } }); } };
}
