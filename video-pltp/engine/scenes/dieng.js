// dieng.js — lembah Dieng 1979: gas CO₂ tak terlihat merayap turun dari Kawah Sinila ke permukiman.
import { THREE, C, V, baseScene, mat, basic, box, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, rng, fbm, softTexture, glowSprite, Plume, gradientTexture } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [-8, 12, 6], hemi: 1.9, sun: 1.6, bg1: '#E9E6F2', bg2: '#D6D9E6', groundColor: '#DCDDE8' });
  // medan: bukit kawah di kiri-belakang, lembah di kanan-depan
  const N = 140; const geo = new THREE.PlaneGeometry(22, 16, N, N); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position;
  const hFn = (x, z) => { const crater = 3.2 * Math.exp(-((x + 5) ** 2 + (z + 3) ** 2) / 14) - 1.4 * Math.exp(-((x + 5) ** 2 + (z + 3) ** 2) / 1.2); const valley = -0.8 * Math.exp(-((x - 3.5) ** 2 / 10 + (z - 2) ** 2 / 6)); const ridge = 1.6 * Math.exp(-((z + 6.5) ** 2) / 4); return crater + valley + ridge + fbm(x * 0.25, z * 0.25, 3) * 0.6; };
  for (let i = 0; i < pa.count; i++) pa.setY(i, hFn(pa.getX(i), pa.getZ(i)));
  geo.computeVertexNormals(); const terr = new THREE.Mesh(geo, mat('#B9D3A6', { r: 0.95, flat: true })); terr.receiveShadow = true; terr.castShadow = true; scene.add(terr);
  const craterLake = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), basic('#C9C08A')); craterLake.rotation.x = -Math.PI / 2; craterLake.position.set(-5, hFn(-5, -3) + 0.05, -3); scene.add(craterLake);
  const vent = new Plume(10, { rise: 1.6, spread: 0.8, size0: 0.3, size1: 1.2, life: 3.4, color: '#e8e8ef', opacity: 0.45, seed: 2 }); vent.group.position.set(-5, hFn(-5, -3) + 0.1, -3); scene.add(vent.group);
  // rumah-rumah
  const r = rng(7); const houses = new THREE.Group(); scene.add(houses);
  for (let i = 0; i < 26; i++) { const x = 1.5 + r() * 5, z = 0.2 + r() * 4; const y = hFn(x, z); const g = new THREE.Group(); g.add(box(0.5, 0.36, 0.45, mat('#F4F1EA'), 0, 0.18, 0)); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 4), mat(r() > 0.5 ? '#C0675A' : '#9E5B4E')); roof.position.y = 0.5; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof); g.position.set(x, y, z); g.rotation.y = r() * 3; houses.add(g); }
  // gas CO2: sprite rendah mengikuti jalur lereng
  const gas = []; const path0 = [V(-5, 0, -3), V(-3.5, 0, -1.8), V(-1.5, 0, -0.4), V(0.8, 0, 0.8), V(2.8, 0, 1.8), V(4.2, 0, 2.4)];
  const gpath = new THREE.CatmullRomCurve3(path0);
  for (let i = 0; i < 90; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: '#8C93B5', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); scene.add(s); gas.push({ s, o: r(), dx: (r() - 0.5) * 2.2, dz: (r() - 0.5) * 2.2, sz: 1.2 + r() * 1.4 }); }
  const cu = (n, f) => cueOf(entry, n, f); const cGas = cu('gas', 10);
  camera.setViewOffset(1920, 1080, -300, 0, 1920, 1080);
  const cam = new CamPath([{ t: 0, p: [9, 9.5, 17], l: [-1.0, 0.5, -0.5], fov: 34 }, { t: cGas, p: [3.0, 7.0, 15.0], l: [-1.5, 0.6, -0.5], fov: 34 }, { t: cu('toll', 16), p: [10.0, 5.5, 12.5], l: [2.5, 0.2, 1.5], fov: 34 }, { t: entry.dur, p: [12.0, 8.0, 16.5], l: [1.0, 0.4, 0.5], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { cam.apply(camera, t, 0.03); vent.update(t, 0.6 + 0.4 * smooth(prog(t, cGas - 2, 1)));
    const kg = smooth(prog(t, cGas, 1.5)); const fill = clamp((t - cGas) / 9);
    for (const g of gas) { const u = Math.min(fill, (g.o + (t - cGas) * 0.05) % 1); const p = gpath.getPointAt(clamp(u)); const x = p.x + g.dx * (0.3 + u), z = p.z + g.dz * (0.3 + u); g.s.position.set(x, hFn(x, z) + 0.35, z); g.s.scale.set(g.sz * (0.6 + u), g.sz * 0.45 * (0.6 + u), 1); g.s.material.opacity = 0.38 * kg * (u < fill ? 1 : 0); }
    const dim = 1 - 0.25 * smooth(prog(t, cu('toll', 16), 1.5)); houses.children.forEach((h) => { h.children[0].material.color.setScalar(dim); }); } };
}
