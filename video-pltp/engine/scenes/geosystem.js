// geosystem.js — 4 "bahan rahasia" sistem panas bumi pada penampang: panas, air, reservoir, batuan penudung.
import { THREE, C, V, baseScene, mat, basic, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, Flow, curve, Plume, glowSprite, rng, softTexture } from '../core/kit.js';
import { BLOCK, terrainBlock, capTop, capBot, capGlowTexture, hotSpring, fumarole } from './plantkit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 16, lightPos: [10, 22, 16], target: [0, -2, 0], groundY: -BLOCK.depth - 0.01, shadowOpacity: 0.1 });
  const T = terrainBlock({ magmaX: 0.2 }); scene.add(T.group);
  const ZF = BLOCK.z1 + 0.06;
  // gunung api di kanan belakang
  const vol = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 3.2, 3.4, 48), mat('#CDB08E', { r: 0.9 })); vol.position.set(5.5, 1.7, -2.6); vol.castShadow = true; scene.add(vol);
  const vp = new Plume(10, { rise: 2.6, spread: 0.8, size0: 0.4, size1: 1.6, life: 3.4, color: '#c7c9d3', opacity: 0.5, seed: 33 }); vp.group.position.set(5.5, 3.5, -2.6); scene.add(vp.group);
  const hs = hotSpring({ seed: 2 }); hs.group.position.set(-4.0, 0, 1.4); scene.add(hs.group); const fu = fumarole({ seed: 5 }); fu.group.position.set(-1.0, 0, 1.6); scene.add(fu.group);
  // awan & hujan
  const clouds = new THREE.Group(); scene.add(clouds); const r = rng(12);
  for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false })); s.position.set(-7 + (i % 7) * 1.0 + r() * 0.5, 6.4 + r() * 0.6, -1 + Math.floor(i / 7) * 1.6); const sc = 1.8 + r() * 1.2; s.scale.set(sc, sc * 0.7, 1); clouds.add(s); }
  const rainGeo = new THREE.BufferGeometry(); const RN = 160; const rp = new Float32Array(RN * 6); rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#5aa9e6', transparent: true, opacity: 0.7 })); scene.add(rain);
  const rainSeed = Array.from({ length: RN }, () => [-7.5 + r() * 7, -1.5 + r() * 4.2, r()]);
  // aliran air meresap lewat patahan -> reservoir -> konveksi naik
  const down = curve([V(-6.3, 0, ZF), V(-5.9, -1.5, ZF), V(-5.4, -3.2, ZF), V(-4.9, -4.8, ZF), V(-3.8, -6.0, ZF), V(-1.5, -6.6, ZF), V(0.2, -6.4, ZF)]);
  const conv = curve([V(0.2, -6.4, ZF), V(1.4, -5.6, ZF), V(1.0, -4.4, ZF), V(-0.8, -3.9, ZF), V(-2.2, -4.5, ZF), V(-2.0, -5.7, ZF), V(-0.6, -6.6, ZF), V(0.2, -6.4, ZF)], true);
  const up = curve([V(-0.8, -3.9, ZF), V(-2.4, -3.2, ZF), V(-3.6, -2.0, ZF), V(-4.0, -0.6, ZF), V(-4.0, 0.05, ZF)]);
  const colDown = (u, c) => c.set(C.water).lerp(new THREE.Color('#FF7A33'), smooth((u - 0.45) * 2));
  const fDown = new Flow(down, 70, { speed: 0.07, size: 0.08, colorFn: colDown, color: '#fff', glow: 0.3, seed: 1 }); scene.add(fDown.mesh);
  const fConv = new Flow(conv, 50, { speed: 0.06, size: 0.08, color: '#FF8A3D', glow: 0.4, seed: 2 }); scene.add(fConv.mesh);
  const fUp = new Flow(up, 28, { speed: 0.09, size: 0.07, colorFn: (u, c) => c.set('#FF9A5A').lerp(new THREE.Color('#ffffff'), u), color: '#fff', glow: 0.3, seed: 3 }); scene.add(fUp.mesh);
  // sorotan
  const capGlow = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: capGlowTexture(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); capGlow.position.set(0, -4.5, BLOCK.z1 + 0.02); scene.add(capGlow);
  const heatGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: '#FF6B35', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); heatGlow.scale.set(9, 5, 1); heatGlow.position.set(0.2, -8.4, ZF + 0.1); scene.add(heatGlow);
  const resGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: '#FFC27A', transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); resGlow.scale.set(16, 4.5, 1); resGlow.position.set(0, -5.2, ZF + 0.05); scene.add(resGlow);
  const anchors = { heat: { p: V(0.2, -8.3, ZF), dx: 140, dy: -20 }, rain: { p: V(-5.9, -1.4, ZF), dx: -100, dy: -60 }, res: { p: V(3.5, -5.2, ZF), dx: 120, dy: 40 }, cap: { p: V(4.0, capTop(4.0) - 0.5, ZF), dx: 120, dy: -60 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [10.5, 6.5, 20], l: [0, -2.0, 0], fov: 34 }, { t: cu('heat', 5), p: [3.5, -3.5, 17.5], l: [0.2, -6.0, 2.0], fov: 34 }, { t: cu('water', 11), p: [-9.5, 4.0, 16.5], l: [-4.5, -1.6, 1.5], fov: 34 }, { t: cu('res', 19), p: [1.0, -2.6, 17.5], l: [0.0, -5.0, 2.0], fov: 34 }, { t: cu('cap', 27), p: [6.0, 1.0, 18.0], l: [1.5, -3.0, 2.0], fov: 34 }, { t: cu('all', 35), p: [0.5, 5.5, 23.5], l: [0, -2.6, 0], fov: 34 }, { t: entry.dur, p: [-2.5, 6.0, 23.5], l: [0, -2.8, 0], fov: 34 }]);
  return {
    scene, camera, anchors,
    update(t) {
      path.apply(camera, t, 0.05);
      const kH = smooth(prog(t, cu('heat', 5), 1)), kW = smooth(prog(t, cu('water', 11), 1)), kR = smooth(prog(t, cu('res', 19), 1)), kC = smooth(prog(t, cu('cap', 27), 1)), kA = smooth(prog(t, cu('all', 35), 1));
      const hp = 0.75 + 0.25 * Math.sin(t * 3.5);
      heatGlow.material.opacity = (kH * (1 - 0.5 * kW) + 0.4 * kA) * hp * 0.9;
      // hujan
      const rainOn = kW; rain.visible = rainOn > 0.01; rain.material.opacity = 0.7 * rainOn;
      for (let i = 0; i < RN; i++) { const [x, z, o] = rainSeed[i]; const y = 6.2 - ((o + t * 1.6) % 1) * 6.2; rp.set([x, y, z, x - 0.05, y - 0.35, z], i * 6); } rainGeo.attributes.position.needsUpdate = true;
      clouds.children.forEach((s, i) => (s.material.opacity = 0.95 * Math.max(kW, 0.0) * (1 - 0.6 * kA) + 0.0));
      fDown.mesh.visible = kW > 0.01; fDown.update(t, kW);
      fConv.mesh.visible = kR > 0.01; fConv.update(t); fUp.mesh.visible = kC > 0.01 || kA > 0; fUp.update(t);
      resGlow.material.opacity = 0.35 * kR * (1 - 0.6 * kC) * hp;
      capGlow.material.opacity = 0.5 * kC * (1 - 0.5 * kA) * (0.7 + 0.3 * Math.sin(t * 4));
      vp.update(t); hs.plume.update(t); fu.plume.update(t);
    },
  };
}
