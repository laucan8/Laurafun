// turbine.js — turbin uap & generator dalam potongan: sudu berputar, medan magnet, gelombang 50 Hz.
import { THREE, C, V, baseScene, mat, basic, glass, box, cyl, sphere, clamp, lerp, easeOut, smooth, prog, cueOf, CamPath, Flow, curve, waveLine, textPlane } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [6, 16, 12] });
  camera.setViewOffset(1920, 1080, -180, 0, 1920, 1080);
  const axisY = 2.0;
  const base = box(11, 0.5, 3, mat('#DDE3EA', { r: 0.8 }), 0.5, 0.25, 0); scene.add(base);
  // casing turbin (setengah, belakang) + kaca depan
  const casingM = new THREE.MeshStandardMaterial({ color: '#EEF2F6', roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide });
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.75, 4.6, 64, 1, true, 0, Math.PI), casingM); casing.rotation.z = Math.PI / 2; casing.rotation.x = Math.PI / 2; casing.position.set(-2.2, axisY, 0); scene.add(casing);
  const casingG = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.75, 4.6, 64, 1, true, Math.PI, Math.PI), glass('#dcecff', 0.12)); casingG.rotation.copy(casing.rotation); casingG.position.copy(casing.position); scene.add(casingG);
  // rotor dengan tingkat sudu (diameter membesar)
  const rotor = new THREE.Group(); rotor.position.set(-2.2, axisY, 0); scene.add(rotor);
  const shaft = cyl(0.16, 0.16, 9.2, mat('#AEB8C6', { m: 0.7, r: 0.25 }), 20); shaft.rotation.z = Math.PI / 2; shaft.position.x = 2.2; rotor.add(shaft);
  const bladeM = mat('#C9D3DF', { m: 0.6, r: 0.25 }), bladeH = mat(C.hot, { m: 0.3, r: 0.3 });
  for (let s = 0; s < 7; s++) { const x = -2.0 + s * 0.65; const r = 0.75 + s * 0.13; const disk = cyl(0.42, 0.42, 0.12, mat('#9AA6B5', { m: 0.6 }), 24); disk.rotation.z = Math.PI / 2; disk.position.x = x; rotor.add(disk);
    const nb = 20 + s * 2; for (let b = 0; b < nb; b++) { const a = b / nb * Math.PI * 2; const bl = box(0.06, r - 0.4, 0.2, s % 2 ? bladeM : bladeH); bl.position.set(x, Math.cos(a) * (0.4 + (r - 0.4) / 2), Math.sin(a) * (0.4 + (r - 0.4) / 2)); bl.rotation.x = -a; bl.rotation.y = 0.5; bl.castShadow = false; rotor.add(bl); } }
  // aliran uap sepanjang sumbu
  const steamC = curve([V(-6.0, axisY + 2.2, 0), V(-5.2, axisY + 1.2, 0), V(-4.4, axisY + 0.5, 0.3), V(-2.2, axisY + 0.6, 0.6), V(0.2, axisY + 0.9, 0.8), V(1.0, axisY - 1.4, 0.6), V(1.0, 0.6, 0.6)]);
  const steamIn = new Flow(steamC, 90, { speed: 0.22, size: 0.08, color: '#ffffff', glow: 0.6, jitter: 0.35, seed: 3, colorFn: (u, c) => c.set('#ffffff').lerp(new THREE.Color('#BFE3FF'), u) }); scene.add(steamIn.mesh);
  const inPipe = new THREE.Mesh(new THREE.TubeGeometry(curve([V(-6.0, axisY + 2.6, 0), V(-5.2, axisY + 1.4, 0), V(-4.4, axisY + 0.8, 0)]), 30, 0.32, 16), glass('#ffffff', 0.35)); scene.add(inPipe);
  // generator: stator setengah + rotor kumparan
  const genX = 3.6;
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.6, 64, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#2E86DE', roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide })); stator.rotation.set(Math.PI / 2, 0, Math.PI / 2); stator.position.set(genX, axisY, 0); scene.add(stator);
  const statorG = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.6, 64, 1, true, Math.PI, Math.PI), glass('#cfe4ff', 0.12)); statorG.rotation.copy(stator.rotation); statorG.position.copy(stator.position); scene.add(statorG);
  const gRot = new THREE.Group(); gRot.position.set(genX, axisY, 0); scene.add(gRot);
  const core = cyl(0.62, 0.62, 2.2, mat('#5B6B82', { m: 0.5 }), 32); core.rotation.z = Math.PI / 2; gRot.add(core);
  for (let k = 0; k < 4; k++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 10, 40), mat('#C7663F', { m: 0.6, r: 0.3 })); coil.scale.set(1.6, 1, 1); coil.rotation.y = Math.PI / 2; coil.position.x = 0; coil.rotation.x = k * Math.PI / 4; gRot.add(coil); }
  // garis medan magnet
  const field = new THREE.Group(); field.position.set(genX, axisY, 0); scene.add(field);
  for (let i = 0; i < 7; i++) { const r = 1.0 + i * 0.07; const c = new THREE.EllipseCurve(0, 0, r, r * 0.92, 0, Math.PI * 2); const pts = c.getPoints(80).map((p) => V(-1.0 + i * 0.33, p.x, p.y)); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#3A86FF', transparent: true, opacity: 0.5 })); field.add(l); }
  // gelombang 50 Hz
  const wave = waveLine(200, (u, t) => [genX - 1.6 + u * 3.2, axisY + 2.4 + Math.sin(u * Math.PI * 6 - t * 8) * 0.35, 0], C.hot); scene.add(wave);
  const wl = textPlane([{ text: '50 Hz ∿', size: 90, color: C.hot, weight: 800, align: 'center' }], { width: 1.6, w: 512, h: 160, y: 115 }); wl.position.set(genX, axisY + 3.1, 0); scene.add(wl);
  // kabel keluaran
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve([V(genX + 1.3, axisY, 0), V(genX + 2.2, axisY, 0), V(genX + 2.6, axisY + 1.5, 0), V(genX + 3.2, axisY + 2.5, -0.5)]), 40, 0.07, 8), mat('#14213D')); scene.add(cable);
  const sparks = new Flow(curve([V(genX + 1.3, axisY, 0.08), V(genX + 2.2, axisY, 0.08), V(genX + 2.6, axisY + 1.5, 0.08), V(genX + 3.2, axisY + 2.5, -0.42)]), 14, { speed: 0.6, size: 0.06, color: C.gold, glow: 1, seed: 7 }); scene.add(sparks.mesh);
  const anchors = { rotor: { p: V(-2.2, axisY + 1.2, 0.4), dx: 160, dy: -170 }, gen: { p: V(genX, axisY + 1.35, 0.3), dx: 130, dy: -150 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [-5.5, 5.0, 10.5], l: [-2.0, 2.2, 0], fov: 34 }, { t: cu('rpm', 6), p: [-1.0, 3.6, 8.0], l: [-1.6, 2.0, 0], fov: 34 }, { t: cu('gen', 9), p: [6.5, 4.0, 8.5], l: [3.4, 2.2, 0], fov: 34 }, { t: cu('calc', 16), p: [2.0, 6.0, 13.5], l: [0.8, 2.2, 0], fov: 34 }, { t: entry.dur, p: [-1.5, 6.5, 14.0], l: [0.6, 2.2, 0], fov: 34 }]);
  return {
    scene, camera, anchors,
    update(t) { path.apply(camera, t, 0.04); const w = Math.min(1, t / 1.5) * 9.0; rotor.rotation.x = t * w; gRot.rotation.x = t * w; steamIn.update(t); sparks.update(t); wave.userData.update(t);
      const kf = smooth(prog(t, cu('gen', 9), 1)); field.children.forEach((l, i) => (l.material.opacity = 0.55 * kf * (0.6 + 0.4 * Math.sin(t * 4 + i)))); const kh = smooth(prog(t, cu('hz', 12), 0.8)); wave.material.opacity = kh; wl.material.opacity = kh; sparks.mesh.visible = kh > 0.05; },
  };
}
