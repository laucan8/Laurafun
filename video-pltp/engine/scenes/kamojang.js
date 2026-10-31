// kamojang.js — sumur bersejarah KMJ-3 dengan semburan uap; PLTP modern di latar.
import { THREE, C, V, baseScene, mat, basic, box, rbox, cyl, sphere, clamp, lerp, easeOut, smooth, prog, cueOf, CamPath, Plume, rng, glowSprite } from '../core/kit.js';
import { powerhouse, coolingTower } from './plantkit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [8, 16, 10] });
  const isl = rbox(14, 0.6, 9, 0.3, mat('#C2E0AE', { r: 0.95 })); isl.position.set(0, -0.3, -1); scene.add(isl);
  // sumur tua
  const rust = mat('#B5653A', { r: 0.7, m: 0.4 }), steel = mat('#8E9AAB', { r: 0.5, m: 0.5 });
  const plinth = rbox(2.2, 0.3, 2.2, 0.08, mat('#E3E7EC')); plinth.position.set(0, 0.15, 0.5); scene.add(plinth);
  const pipe = cyl(0.22, 0.22, 1.6, rust, 24, 0, 1.1, 0.5); scene.add(pipe);
  const valve = cyl(0.32, 0.32, 0.18, steel, 24, 0, 1.0, 0.5); scene.add(valve);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 24), mat('#E63946')); wheel.position.set(0.42, 1.0, 0.5); wheel.rotation.y = Math.PI / 2; scene.add(wheel);
  const elbow = cyl(0.2, 0.2, 0.9, rust, 20); elbow.rotation.z = Math.PI / 2; elbow.position.set(0.45, 1.75, 0.5); scene.add(elbow);
  const nozzle = cyl(0.16, 0.24, 0.5, rust, 20, 0.9, 2.0, 0.5); scene.add(nozzle);
  // pagar monumen
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; scene.add(cyl(0.035, 0.035, 0.6, mat('#F4F6F9'), 8, Math.cos(a) * 1.5, 0.3, 0.5 + Math.sin(a) * 1.5)); }
  const railR = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.025, 6, 64), mat('#F4F6F9')); railR.rotation.x = Math.PI / 2; railR.position.set(0, 0.55, 0.5); scene.add(railR);
  // jet uap kuat
  const jet = new Plume(34, { rise: 6.5, spread: 1.6, size0: 0.25, size1: 2.6, life: 2.6, opacity: 0.75, drift: [0.35, 0, 0], seed: 3 }); jet.group.position.set(0.9, 2.25, 0.5); scene.add(jet.group);
  // PLTP modern di belakang
  const ph = powerhouse({ w: 2.6, h: 1.4, d: 1.6 }); ph.group.position.set(-4.0, 0, -3.6); scene.add(ph.group);
  const ct = coolingTower({ fans: 3 }); ct.group.position.set(3.8, 0, -3.8); scene.add(ct.group);
  const pls = ct.stacks.map((s, i) => { const p = new Plume(10, { rise: 2.6, spread: 0.7, size0: 0.4, size1: 1.6, life: 3.4, opacity: 0.5, seed: 10 + i }); p.group.position.copy(s).add(ct.group.position); scene.add(p.group); return p; });
  const r = rng(5); for (let i = 0; i < 26; i++) { const x = -6.5 + r() * 13, z = -5 + r() * 2; const h = 0.6 + r() * 0.8; const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, h, 7), mat(r() > 0.5 ? '#9CCB8A' : '#7FB98A', { flat: true })); c.position.set(x, h / 2, z); c.castShadow = true; scene.add(c); }
  const anchors = { kmj3: { p: V(0, 1.8, 0.5), dx: -150, dy: -90 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [5.5, 3.5, 9.0], l: [0, 2.0, 0], fov: 34 }, { t: cu('kmj3', 10), p: [-3.5, 2.6, 6.5], l: [0.3, 1.8, 0.5], fov: 34 }, { t: cu('y1983', 18), p: [-2.5, 4.5, 11.5], l: [-0.5, 1.4, -1.5], fov: 34 }, { t: entry.dur, p: [3.5, 5.0, 12.5], l: [0, 1.6, -1.5], fov: 34 }]);
  return { scene, camera, anchors, update(t) { path.apply(camera, t, 0.04); jet.update(t, 0.6 + 0.4 * smooth(prog(t, cu('kmj3', 10), 1))); pls.forEach((p) => p.update(t)); ct.fans.forEach((f, i) => (f.rotation.y = t * 6 + i)); } };
}
