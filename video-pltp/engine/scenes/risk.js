// risk.js — risiko eksplorasi: 3 rig, 2 sukses uap, 1 kering (koin berjatuhan); perisai GREM berbagi risiko.
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeInOut, easeBack, smooth, prog, cueOf, CamPath, Plume, textPlane, rng, popScale, glowSprite, tube, curve } from '../core/kit.js';
import { drillRig } from './plantkit.js';

function markTex(ok) { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = ok ? '#2A9D8F' : '#E63946'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); if (ok) { g.moveTo(70, 132); g.lineTo(112, 176); g.lineTo(188, 86); } else { g.moveTo(84, 84); g.lineTo(172, 172); g.moveTo(172, 84); g.lineTo(84, 172); } g.stroke(); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [6, 18, 12], groundY: -4.2 });
  camera.setViewOffset(1920, 1080, 230, 0, 1920, 1080);
  // balok tanah
  const layers = [[0, -0.4, '#C2E0AE'], [-0.4, -2.0, '#EAD9B6'], [-2.0, -2.8, '#C9B9E8'], [-2.8, -4.0, '#F4BE88']];
  for (const [a, b, col] of layers) { const bx = rbox(13, a - b, 4, 0.04, mat(col, { r: 0.9 })); bx.position.y = (a + b) / 2; scene.add(bx); }
  const xs = [-4.2, 0, 4.2]; const ok = [true, false, true]; const cu = (n, f) => cueOf(entry, n, f);
  const rigs = xs.map((x, i) => { const g = new THREE.Group(); g.position.x = x; scene.add(g); const rig = drillRig(2.6); rig.scale.setScalar(0.8); rig.position.z = 0.6; g.add(rig);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), mat('#F5F7FA', { m: 0.3 })); well.geometry.translate(0, -0.5, 0); well.position.set(0, 0, 2.05); g.add(well);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex(ok[i]), transparent: true, depthWrite: false, toneMapped: false })); sp.scale.set(1.0, 1.0, 1); sp.position.set(0, 3.4, 0.6); g.add(sp);
    const pl = new Plume(14, { rise: 2.8, spread: 0.7, size0: 0.3, size1: 1.5, life: 2.8, opacity: 0.65, seed: 5 + i }); pl.group.position.set(0, 0.2, 2.0); g.add(pl.group);
    return { g, well, sp, pl, ok: ok[i], at: cu('risk', 2) + i * 0.8 }; });
  // koin jatuh untuk sumur kering
  const r = rng(3); const coins = []; for (let i = 0; i < 22; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), mat('#F4C04D', { m: 0.6, r: 0.3, em: '#F4A100', ei: 0.2 })); c.rotation.x = Math.PI / 2; scene.add(c); coins.push({ c, x: (r() - 0.5) * 1.6, o: r(), rs: r() * 6 }); }
  // perisai GREM
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7.4, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7CC4FF', transparent: true, opacity: 0, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide })); dome.scale.set(1, 0.62, 0.5); scene.add(dome);
  const domeR = new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.05, 8, 128), basic('#3A86FF', { opacity: 0 })); domeR.rotation.x = Math.PI / 2; domeR.scale.set(1, 0.5, 1); scene.add(domeR);
  const gt = textPlane([{ text: 'GREM — PT SMI × Bank Dunia', size: 76, color: C.blue, weight: 800, align: 'center' }, { text: 'berbagi risiko eksplorasi', size: 52, color: C.sub, weight: 600, align: 'center' }], { width: 5.4, w: 1024, h: 240, y: 100 }); gt.position.set(0.6, 3.7, 0); scene.add(gt);
  const path = new CamPath([{ t: 0, p: [0, 5.0, 17.5], l: [0, 0.4, 0], fov: 34 }, { t: cu('dry', 12), p: [1.5, 3.5, 12.5], l: [0, 0.6, 1.0], fov: 34 }, { t: cu('grem', 17), p: [0, 7.5, 21.0], l: [0, 1.0, 0], fov: 34 }, { t: entry.dur, p: [-2.0, 8.0, 21.5], l: [0, 1.0, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.03);
    for (const o of rigs) { const kd = easeInOut(prog(t, o.at, 2.0)); o.well.scale.set(1, Math.max(0.001, 3.7 * kd), 1); const done = kd >= 1; const km = easeBack(prog(t, o.at + 2.1, 0.5)); o.sp.scale.setScalar(Math.max(0.001, km * 1.0)); o.sp.visible = km > 0.01; o.pl.group.visible = o.ok && done; o.pl.update(t, o.ok ? smooth(prog(t, o.at + 2.0, 0.8)) : 0); }
    const kc = prog(t, rigs[1].at + 2.2, 0.01) > 0 ? 1 : 0; for (const c of coins) { const a = ((t * 0.5 + c.o) % 1); c.c.visible = kc > 0 && t < cu('grem', 17) + 1; c.c.position.set(c.x, 3.2 - a * 3.4, 1.2); c.c.rotation.z = t * c.rs; c.c.material.opacity = 1; }
    const kg = smooth(prog(t, cu('grem', 17), 1.2)); dome.material.opacity = 0.18 * kg; domeR.material.opacity = 0.9 * kg; gt.material.opacity = kg; dome.visible = domeR.visible = kg > 0.01; } };
}
