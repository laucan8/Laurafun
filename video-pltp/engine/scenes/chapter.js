// chapter.js — bumper pembuka bab: angka 3D raksasa berputar masuk, cincin orbit, lantai grid.
import { THREE, C, baseScene, mat, basic, clamp, easeOut, easeBack, easeInOut, smooth, floorGrid, glowSprite, rng, sphere } from '../core/kit.js';
import { FontLoader } from '../lib/jsm/FontLoader.js';
import { TextGeometry } from '../lib/jsm/TextGeometry.js';
let FONT = null;
async function font() { if (!FONT) FONT = await new Promise((res) => new FontLoader().load('lib/fonts3d/helvetiker_bold.typeface.json', res)); return FONT; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [8, 18, 14] });
  const f = await font();
  const n = String(entry.params.n).padStart(2, '0');
  const geo = new TextGeometry(n, { font: f, size: 3.2, depth: 1.1, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.09, bevelSegments: 4 });
  geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, 0, -(bb.max.z + bb.min.z) / 2);
  const num = new THREE.Mesh(geo, [mat(C.navy, { r: 0.35, m: 0.1 }), mat(C.hot, { r: 0.4, em: C.hot, ei: 0.15 })]); num.castShadow = true; num.receiveShadow = true;
  const holder = new THREE.Group(); holder.add(num); holder.position.y = 1.6; scene.add(holder);
  const grid = floorGrid(40, 40, '#c9d3df', 0.55); scene.add(grid);
  // cincin partikel orbit
  const orb = new THREE.Group(); scene.add(orb); const r = rng(entry.params.n * 17);
  const balls = []; for (let i = 0; i < 26; i++) { const s = sphere(0.06 + r() * 0.1, mat(i % 3 === 0 ? C.hot : i % 3 === 1 ? C.gold : '#9fb3cc', { em: i % 3 === 0 ? C.hot : '#000', ei: 0.4 }), 0, 0, 0, 12); orb.add(s); balls.push({ s, a: r() * Math.PI * 2, rad: 4.2 + r() * 1.6, y: 1 + r() * 4, sp: 0.4 + r() * 0.5 }); }
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.025, 8, 160), basic(C.hot, { opacity: 0.6 })); ringM.rotation.x = Math.PI / 2; ringM.position.y = 0.02; scene.add(ringM);
  const glow = glowSprite(C.gold, 9, 0.35); glow.position.set(0, 3, -2); scene.add(glow);
  return {
    scene, camera, anchors: {},
    update(t) {
      const a = easeBack(clamp((t - 0.15) / 0.9));
      holder.rotation.set((1 - a) * -1.2, (1 - easeOut(clamp(t / 1.4))) * 2.4 + Math.sin(t * 0.8) * 0.06, 0);
      holder.position.y = 1.6 + (1 - a) * 4; holder.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * a));
      for (const b of balls) { const ang = b.a + t * b.sp; b.s.position.set(Math.cos(ang) * b.rad, b.y + Math.sin(t * 1.3 + b.a) * 0.2, Math.sin(ang) * b.rad); }
      ringM.scale.setScalar(0.6 + 0.4 * easeOut(clamp(t / 1.2))); ringM.material.opacity = 0.6 * smooth(t / 0.8);
      const k = easeInOut(clamp(t / 3.2)); camera.position.set(Math.sin(-0.5 + k * 0.7) * 15, 4.6 - k * 0.8, Math.cos(-0.5 + k * 0.7) * 15); camera.lookAt(0, 2.6, 0);
    },
  };
}
