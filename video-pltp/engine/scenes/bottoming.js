// bottoming.js — unit biner "bottoming": memeras panas sisa brine tanpa sumur baru.
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, smooth, prog, cueOf, CamPath, Flow, polyCurve, tube, vessel, textPlane, popScale, glowSprite } from '../core/kit.js';
import { miniTurbine, heatEx, airCooler } from './types3.js';

function bolt() { const s = new THREE.Shape(); s.moveTo(0.1, 0.6); s.lineTo(-0.25, 0.0); s.lineTo(0.0, 0.0); s.lineTo(-0.12, -0.6); s.lineTo(0.28, 0.12); s.lineTo(0.02, 0.12); s.lineTo(0.2, 0.6); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }); return new THREE.Mesh(g, mat('#FFD166', { em: '#FFB703', ei: 0.6 })); }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [8, 18, 12] });
  camera.setViewOffset(1920, 1080, 120, 0, 1920, 1080);
  const slab = rbox(12, 0.5, 6, 0.2, mat('#FFFFFF', { r: 0.6 })); slab.position.y = -0.25; scene.add(slab); const gr = rbox(11.8, 0.06, 5.8, 0.15, mat('#C2E0AE')); gr.position.y = 0.03; scene.add(gr);
  const sep = vessel(0.45, 1.8, '#F7F9FB', { band: C.hot, legH: 0.35 }); sep.position.set(-4.6, 0.35, 0); scene.add(sep);
  const sepT = textPlane([{ text: 'Separator (PLTP lama)', size: 66, color: C.sub, weight: 700, align: 'center' }], { width: 3, w: 1024, h: 180, y: 120 }); sepT.position.set(-4.6, 3.1, 0); scene.add(sepT);
  const unit = new THREE.Group(); scene.add(unit);
  const pad = rbox(5.0, 0.12, 3.6, 0.1, mat('#E8ECF1')); pad.position.set(0.8, 0.06, 0); unit.add(pad);
  const hx = heatEx(); hx.position.set(-0.6, 0.12, 0.6); unit.add(hx); const tb = miniTurbine('#E7F7EF'); tb.position.set(0.9, 0.12, -0.9); unit.add(tb); const ac = airCooler(); ac.position.set(2.4, 0.12, 0.8); unit.add(ac);
  const cOrc = polyCurve([[-0.3, 1.0, 0.6], [-0.3, 1.5, 0.6], [0.5, 1.5, -0.9], [0.5, 0.7, -0.9], [2.4, 0.7, -0.9], [2.4, 1.3, 0.2], [2.4, 1.3, 0.8], [1.6, 0.4, 0.8], [0.2, 0.4, 0.6], [-0.3, 1.0, 0.6]]);
  unit.add(tube(cOrc, 0.07, glass('#BDF2D8', 0.45))); const fOrc = new Flow(cOrc, 40, { speed: 0.13, size: 0.06, color: C.green, glow: 0.5, seed: 6 }); unit.add(fOrc.mesh);
  const unitT = textPlane([{ text: 'Unit bottoming (biner)', size: 70, color: C.green, weight: 800, align: 'center' }], { width: 3.4, w: 1024, h: 180, y: 120 }); unitT.position.set(0.8, 2.4, -0.9); unit.add(unitT);
  // brine: separator -> HX (oranye) -> injeksi (biru)
  const cB1 = polyCurve([[-4.1, 0.6, 0], [-2.0, 0.6, 0], [-2.0, 0.62, 0.6], [-1.3, 0.62, 0.6]]); scene.add(tube(cB1, 0.09, glass('#fff', 0.4)));
  const cB2 = polyCurve([[0.1, 0.62, 0.6], [0.4, 0.3, 2.2], [5.0, 0.3, 2.2], [5.0, -0.05, 2.2]]); scene.add(tube(cB2, 0.09, glass('#fff', 0.4)));
  const fB1 = new Flow(cB1, 22, { speed: 0.25, size: 0.07, color: '#FF7A33', glow: 0.5, seed: 1 }); scene.add(fB1.mesh);
  const fB2 = new Flow(cB2, 30, { speed: 0.18, size: 0.06, colorFn: (u, c) => c.set('#FF9A5A').lerp(new THREE.Color(C.water), smooth(u * 3)), color: '#fff', seed: 2 }); scene.add(fB2.mesh);
  const tIn = textPlane([{ text: '> 150 °C', size: 90, color: C.hot, weight: 800, align: 'center' }], { width: 1.8, w: 512, h: 180, y: 130 }); tIn.position.set(-2.9, 1.2, 0); scene.add(tIn);
  const tOut = textPlane([{ text: 'lebih dingin → injeksi', size: 64, color: C.water, weight: 800, align: 'center' }], { width: 3.0, w: 1024, h: 180, y: 120 }); tOut.position.set(3.2, 0.9, 2.2); scene.add(tOut);
  const bl = bolt(); bl.position.set(3.4, 2.0, -0.9); scene.add(bl); const bg = glowSprite('#FFD166', 1.8, 0.7); bg.position.copy(bl.position); scene.add(bg);
  const plus = textPlane([{ text: '+ MW', size: 120, color: '#F4A100', weight: 800, align: 'center' }], { width: 1.6, w: 512, h: 200, y: 145 }); plus.position.set(4.6, 2.0, -0.9); scene.add(plus);
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [-4.0, 6.0, 13.5], l: [-2.6, 1.0, 0], fov: 34 }, { t: cu('unit', 10), p: [0.5, 6.0, 12.5], l: [0.0, 0.8, 0], fov: 34 }, { t: cu('ulu', 20), p: [3.0, 7.0, 14.0], l: [0.2, 0.8, 0], fov: 34 }, { t: entry.dur, p: [-1.0, 7.5, 14.5], l: [0.0, 0.8, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.04); const ku = popScale(unit, t, cu('unit', 10) - 0.3, 0.8); fOrc.update(t); fB1.update(t); fB2.update(t); fB2.mesh.visible = ku > 0.3;
    tIn.material.opacity = smooth(prog(t, cu('squeeze', 3), 0.6)); tOut.material.opacity = smooth(prog(t, cu('unit', 10) + 1.5, 0.6)); const kb = easeBack(prog(t, cu('nowell', 14), 0.6)); bl.scale.setScalar(Math.max(0.001, kb)); bl.rotation.y = t * 1.5; bg.material.opacity = 0.7 * kb * (0.6 + 0.4 * Math.sin(t * 6)); plus.material.opacity = smooth(prog(t, cu('nowell', 14) + 0.3, 0.5)); } };
}
