// hydrogen.js — elektroliser hidrogen hijau bertenaga PLTP (Kamojang).
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, smooth, prog, cueOf, CamPath, Flow, curve, polyCurve, tube, textPlane, Plume, rng } from '../core/kit.js';
import { coolingTower } from './plantkit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [8, 18, 12] });
  camera.setViewOffset(1920, 1080, -200, 0, 1920, 1080);
  const slab = rbox(13, 0.5, 6, 0.2, mat('#FFFFFF', { r: 0.6 })); slab.position.y = -0.25; scene.add(slab);
  // mini PLTP
  const ct = coolingTower({ fans: 2 }); ct.group.scale.setScalar(0.8); ct.group.position.set(-5.0, 0, -0.8); scene.add(ct.group);
  const pls = ct.stacks.map((s, i) => { const p = new Plume(8, { rise: 2.0, spread: 0.5, size0: 0.3, size1: 1.2, life: 3, opacity: 0.5, seed: i + 3 }); p.group.position.copy(s).multiplyScalar(0.8).add(ct.group.position); scene.add(p.group); return p; });
  const ptxt = textPlane([{ text: 'PLTP', size: 110, color: C.hot, weight: 800, align: 'center' }], { width: 1.4, w: 512, h: 180, y: 135 }); ptxt.position.set(-5.0, 2.6, -0.8); scene.add(ptxt);
  // elektroliser: tumpukan sel transparan
  const stack = new THREE.Group(); stack.position.set(0, 0, 0); scene.add(stack);
  const frame = rbox(3.2, 0.25, 1.6, 0.06, mat('#9AA6B5')); frame.position.y = 0.12; stack.add(frame);
  const cells = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.8, 1.4), glass('#dff3ff', 0.35)); c.position.set(-1.25 + i * 0.5, 1.2, 0); stack.add(c); const plate = box(0.06, 1.9, 1.5, mat(i % 2 ? '#2E86DE' : '#E63946', { m: 0.4 }), -1.25 + i * 0.5 - 0.24, 1.2, 0); stack.add(plate); cells.push(c); }
  const membrane = box(0.03, 1.8, 1.4, mat('#F4A100', { opacity: 0.7 }), 0, 1.2, 0);
  // gelembung H2 (putih) & O2 (merah muda)
  const r = rng(4); const bub = []; const bg = new THREE.SphereGeometry(1, 10, 8);
  for (let i = 0; i < 80; i++) { const h2 = i % 3 !== 0; const m = new THREE.Mesh(bg, h2 ? mat('#ffffff', { em: '#ffffff', ei: 0.3 }) : mat('#FF9AA2', { em: '#FF9AA2', ei: 0.2 })); const cell = i % 6; scene.add(m); bub.push({ m, x: -1.25 + cell * 0.5 + (r() - 0.5) * 0.25, z: (r() - 0.5) * 1.1, o: r(), s: 0.04 + r() * 0.04, sp: 0.35 + r() * 0.3 }); }
  // tangki
  const tH = cyl(0.8, 0.8, 2.6, mat('#F4F6F9', { r: 0.3, m: 0.2 }), 32); tH.position.set(4.2, 1.5, -0.4); scene.add(tH); const capH = sphere(0.8, mat('#F4F6F9', { r: 0.3 }), 4.2, 2.8, -0.4); capH.scale.y = 0.5; scene.add(capH);
  const h2t = textPlane([{ text: 'H₂', size: 160, color: C.water, weight: 800, align: 'center' }], { width: 1.2, w: 512, h: 256, y: 190 }); h2t.position.set(4.2, 1.6, 0.42); scene.add(h2t);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 1, 32, 1, true), basic('#7CC4FF', { opacity: 0.55, side: THREE.DoubleSide })); fill.geometry.translate(0, 0.5, 0); fill.position.set(4.2, 0.2, -0.4); scene.add(fill);
  const tO = cyl(0.45, 0.45, 1.6, mat('#FCEFF0'), 28); tO.position.set(2.8, 1.0, 1.6); scene.add(tO); const o2t = textPlane([{ text: 'O₂', size: 150, color: C.red, weight: 800, align: 'center' }], { width: 0.8, w: 512, h: 256, y: 190 }); o2t.position.set(2.8, 1.1, 2.07); scene.add(o2t);
  // input: listrik & air kondensat
  const cE = curve([V(-4.4, 1.6, -0.8), V(-3.2, 2.6, 0.2), V(-1.8, 2.4, 0.4), V(-1.4, 1.9, 0.4)]); scene.add(tube(cE, 0.04, mat('#14213D')));
  const fE = new Flow(cE, 16, { speed: 0.5, size: 0.06, color: C.gold, glow: 1, seed: 1 }); scene.add(fE.mesh);
  const cW = polyCurve([[-4.2, 0.3, 0.6], [-2.2, 0.3, 0.6], [-1.6, 0.6, 0.6]]); scene.add(tube(cW, 0.07, glass('#fff', 0.4))); const fW = new Flow(cW, 16, { speed: 0.3, size: 0.06, color: C.water, glow: 0.3, seed: 2 }); scene.add(fW.mesh);
  const cH = polyCurve([[0, 2.2, 0], [0, 2.8, 0], [4.2, 2.8, 0], [4.2, 3.1, -0.4]]); scene.add(tube(cH, 0.07, glass('#fff', 0.4))); const fH = new Flow(cH, 20, { speed: 0.3, size: 0.06, color: '#ffffff', glow: 0.6, seed: 3 }); scene.add(fH.mesh);
  const anchors = { stack: { p: V(0, 2.3, 0.7), dx: 120, dy: -120 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [-3.0, 6.5, 15.0], l: [-0.6, 1.2, 0], fov: 34 }, { t: cu('ely', 8), p: [1.5, 4.5, 11.0], l: [0.4, 1.3, 0], fov: 34 }, { t: entry.dur, p: [-1.0, 6.0, 15.5], l: [0.3, 1.3, 0], fov: 34 }]);
  return { scene, camera, anchors, update(t) { path.apply(camera, t, 0.04); pls.forEach((p) => p.update(t)); ct.fans.forEach((f) => (f.rotation.y = t * 5)); const kE = smooth(prog(t, cu('inputs', 4), 0.8)); fE.mesh.visible = fW.mesh.visible = kE > 0.05; fE.update(t); fW.update(t); fH.update(t);
    const kB = smooth(prog(t, cu('ely', 7), 1)); for (const b of bub) { const a = (b.o + t * b.sp) % 1; b.m.position.set(b.x + Math.sin(a * 9 + b.o * 6) * 0.03, 0.4 + a * 1.6, b.z); b.m.scale.setScalar(b.s * kB * (0.6 + a)); b.m.visible = kB > 0.02; }
    const kf = 0.3 + 0.6 * smooth(prog(t, cu('ton', 12), 6)); fill.scale.set(1, 2.6 * kf, 1); } };
}
