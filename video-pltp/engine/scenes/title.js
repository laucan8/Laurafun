// title.js — kartu judul: balok tanah mini melayang dengan inti magma berpendar & uap.
import { THREE, C, V, baseScene, mat, basic, box, rbox, clamp, easeOut, easeInOut, smooth, Plume, glowSprite, rng, sphere, CamPath } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [6, 14, 10], groundY: -3.2, shadowOpacity: 0.1 });
  const g = new THREE.Group(); scene.add(g);
  const layers = [[0.35, '#C2E0AE'], [0.5, '#D8BE93'], [0.9, '#EAD9B6'], [0.45, '#C9B9E8'], [1.0, '#F4BE88'], [0.8, '#C9AA8B']];
  let y = 0; const W = 6.4, Dp = 3.6;
  for (const [h, col] of layers) { const b = rbox(W, h, Dp, 0.05, mat(col, { r: 0.85 })); b.position.y = y - h / 2; g.add(b); y -= h + 0.03; }
  const core = sphere(0.9, basic('#FFD27A'), 0, y + 0.25, 0, 32); core.scale.set(1.6, 0.6, 1); g.add(core);
  const glow = glowSprite('#FF8A3D', 6, 0.8); glow.position.set(0, y + 0.2, 0.4); g.add(glow);
  // fasilitas mini + uap
  const plumes = [];
  for (let i = 0; i < 3; i++) { const x = -1.8 + i * 1.8; const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.7, 24), mat('#F4F6F9')); t.position.set(x, 0.35, -0.6); t.castShadow = true; g.add(t); const pl = new Plume(10, { rise: 2.4, spread: 0.6, size0: 0.3, size1: 1.4, life: 3.2, opacity: 0.55, seed: 50 + i }); pl.group.position.set(x, 0.7, -0.6); g.add(pl.group); plumes.push(pl); }
  const sep = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 20), mat('#ffffff')); sep.position.set(2.4, 0.55, 0.6); sep.castShadow = true; g.add(sep);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.1, 20), mat(C.hot)); band.position.set(2.4, 0.9, 0.6); g.add(band);
  // bara naik
  const r = rng(77); const embers = []; for (let i = 0; i < 40; i++) { const s = sphere(0.03 + r() * 0.04, basic(i % 2 ? '#FF9A4D' : '#FFD166'), 0, 0, 0, 8); scene.add(s); embers.push({ s, x: (r() - 0.5) * 9, z: (r() - 0.5) * 5, o: r(), sp: 0.15 + r() * 0.2 }); }
  g.position.y = -0.6;
  const path = new CamPath([{ t: 0, p: [0, 3.8, 15.5], l: [0, -1.0, 0], fov: 34 }, { t: entry.dur, p: [2.5, 3.2, 13.0], l: [0, -1.2, 0], fov: 34 }]);
  return {
    scene, camera, anchors: {},
    update(t) {
      path.apply(camera, t); g.rotation.y = -0.5 + t * 0.06; g.position.y = -1.4 + Math.sin(t * 0.8) * 0.08;
      plumes.forEach((p) => p.update(t)); glow.material.opacity = 0.7 + 0.15 * Math.sin(t * 3);
      for (const e of embers) { const a = (e.o + t * e.sp) % 1; e.s.position.set(e.x + Math.sin(a * 6 + e.o * 9) * 0.3, -3 + a * 7, e.z); e.s.material.opacity = Math.sin(a * Math.PI); e.s.material.transparent = true; }
    },
  };
}
