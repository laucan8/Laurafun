// japan.js — onsen Jepang: kolam air panas, batu, ember kayu, papan "tolak PLTP"; taman nasional di latar.
import { THREE, C, V, baseScene, mat, basic, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, smooth, prog, cueOf, CamPath, Plume, rng, textPlane, popScale } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [6, 16, 10] });
  camera.setViewOffset(1920, 1080, -300, 0, 1920, 1080);
  const isl = rbox(14, 0.5, 9, 0.3, mat('#C2E0AE')); isl.position.y = -0.25; scene.add(isl);
  const r = rng(5);
  // kolam onsen dengan batu
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.0, 48), new THREE.MeshStandardMaterial({ color: '#8FD9E4', roughness: 0.08, emissive: '#3BB7C9', emissiveIntensity: 0.2 })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.06, 0.5); scene.add(pool);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + r() * 0.18, 0), mat(r() > 0.5 ? '#9A9AA4' : '#B7B3AA', { flat: true })); rock.position.set(Math.cos(a) * 2.15, 0.12, 0.5 + Math.sin(a) * 2.0); rock.scale.y = 0.6; rock.rotation.set(r(), r() * 3, r()); rock.castShadow = true; scene.add(rock); }
  const steam = new Plume(22, { rise: 2.4, spread: 3.0, size0: 0.5, size1: 2.0, life: 3.8, opacity: 0.5, seed: 4 }); steam.group.position.set(0, 0.1, 0.5); scene.add(steam.group);
  // ember kayu
  const bucket = cyl(0.28, 0.24, 0.36, mat('#C99A5B', { r: 0.7 }), 24); bucket.position.set(2.8, 0.18, 2.2); scene.add(bucket);
  // pondok kayu
  const hut = new THREE.Group(); hut.position.set(-3.6, 0, -1.8); scene.add(hut); hut.add(box(2.2, 1.3, 1.6, mat('#D9B48A'), 0, 0.65, 0)); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.9, 4), mat('#5B4E44')); roof.position.y = 1.75; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.8); roof.castShadow = true; hut.add(roof);
  const noren = textPlane([{ text: 'ONSEN ♨', size: 120, color: '#ffffff', weight: 800, align: 'center' }], { width: 1.6, w: 768, h: 220, y: 155, bg: '#2E5C9A' }); noren.position.set(0, 1.0, 0.81); hut.add(noren);
  // papan protes
  const sign = new THREE.Group(); sign.position.set(3.4, 0, -0.2); scene.add(sign); sign.add(cyl(0.05, 0.05, 1.4, mat('#8C6A48'), 8, 0, 0.7, 0)); const board = textPlane([{ text: 'TOLAK', size: 120, color: '#E63946', weight: 800, align: 'center' }, { text: 'PLTP!', size: 120, color: '#E63946', weight: 800, align: 'center' }], { width: 1.5, w: 512, h: 400, y: 160, bg: '#FFFDF6' }); board.position.y = 1.55; sign.add(board);
  // pohon taman nasional
  for (let i = 0; i < 30; i++) { const x = -6.5 + r() * 13, z = -4.2 + r() * 1.8; const h = 0.8 + r() * 1.0; const c = new THREE.Mesh(new THREE.ConeGeometry(0.35, h, 7), mat(r() > 0.5 ? '#6FA77E' : '#86B98A', { flat: true })); c.position.set(x, h / 2, z); c.castShadow = true; scene.add(c); }
  const park = textPlane([{ text: 'Taman Nasional', size: 90, color: '#2A6B47', weight: 800, align: 'center' }], { width: 2.8, w: 1024, h: 200, y: 140 }); park.position.set(1.0, 2.6, -3.6); scene.add(park);
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [3.5, 7.5, 14.5], l: [0.5, 0.6, 0], fov: 34 }, { t: cu('onsen', 9), p: [-1.5, 5.0, 11.5], l: [0.8, 0.6, 0.4], fov: 34 }, { t: entry.dur, p: [2.0, 6.5, 13.5], l: [0.8, 0.8, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.03); steam.update(t); popScale(sign, t, cu('onsen', 9), 0.6); park.material.opacity = smooth(prog(t, cu('park', 6), 0.6)); } };
}
