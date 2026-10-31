// lithium.js — ekstraksi lithium langsung (DLE) dari brine: manik penukar ion menangkap Li⁺, lalu jadi sel baterai.
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeInOut, easeBack, smooth, prog, cueOf, CamPath, rng, textPlane, glowSprite } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [6, 16, 10] });
  camera.setViewOffset(1920, 1080, -200, 0, 1920, 1080);
  const R = 1.3, Hc = 5.2, cy0 = 0.6;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Hc, 48, 1, true), glass('#e6f4ff', 0.22)); col.position.y = cy0 + Hc / 2; scene.add(col);
  for (const y of [cy0, cy0 + Hc]) { const rr = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 10, 48), mat('#9AA6B5', { m: 0.5 })); rr.rotation.x = Math.PI / 2; rr.position.y = y; scene.add(rr); }
  const cap = cyl(R * 1.05, R * 1.05, 0.25, mat('#DDE3EA'), 48, 0, cy0 - 0.12, 0); scene.add(cap);
  const inP = cyl(0.18, 0.18, 1.4, glass('#fff', 0.4), 16, 0, cy0 + Hc + 0.7, 0); scene.add(inP);
  // manik
  const r = rng(11); const beadG = new THREE.SphereGeometry(1, 12, 10); const NB = 420; const beads = new THREE.InstancedMesh(beadG, mat('#F6D9A8', { r: 0.4, em: '#F4A100', ei: 0.05 }), NB); const bPos = [];
  const m4 = new THREE.Matrix4(); for (let i = 0; i < NB; i++) { const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * (R - 0.15); const p = V(Math.cos(a) * rad, cy0 + 0.3 + r() * (Hc * 0.7), Math.sin(a) * rad); bPos.push(p); m4.compose(p, new THREE.Quaternion(), V(0.11, 0.11, 0.11)); beads.setMatrixAt(i, m4); } scene.add(beads);
  // ion: Li+ (ungu) tertangkap; ion lain (abu/hijau) lewat
  const ions = []; const ig = new THREE.SphereGeometry(1, 10, 8);
  for (let i = 0; i < 70; i++) { const li = i % 2 === 0; const m = new THREE.Mesh(ig, li ? mat('#8E6CEF', { em: '#8E6CEF', ei: 0.7 }) : mat(i % 3 ? '#9AA6B5' : '#7DD3B0', { em: '#000', ei: 0 })); scene.add(m); const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * (R - 0.2); const target = bPos[(i * 37) % NB]; ions.push({ m, li, x: Math.cos(a) * rad, z: Math.sin(a) * rad, o: r(), sp: 0.12 + r() * 0.08, target, cap: 0.3 + r() * 0.5 }); }
  const brine = []; for (let i = 0; i < 50; i++) { const m = new THREE.Mesh(ig, mat(C.water, { em: C.water, ei: 0.25, opacity: 0.6 })); scene.add(m); const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * (R - 0.2); brine.push({ m, x: Math.cos(a) * rad, z: Math.sin(a) * rad, o: r(), sp: 0.18 + r() * 0.1 }); }
  // sel baterai
  const bat = new THREE.Group(); bat.position.set(3.6, 0, 0.6); scene.add(bat);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.6, 40, 1, true), glass('#ffffff', 0.35)); shell.position.y = 1.3; bat.add(shell);
  const tTop = cyl(0.76, 0.76, 0.12, mat('#9AA6B5', { m: 0.5 }), 40, 0, 2.62, 0); bat.add(tTop); const tBot = cyl(0.76, 0.76, 0.12, mat('#9AA6B5', { m: 0.5 }), 40, 0, 0.0, 0); bat.add(tBot); bat.add(cyl(0.22, 0.22, 0.18, mat('#9AA6B5'), 20, 0, 2.75, 0));
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1, 40), mat('#8E6CEF', { em: '#8E6CEF', ei: 0.35, r: 0.3 })); fill.geometry.translate(0, 0.5, 0); fill.position.y = 0.07; bat.add(fill);
  const lt = textPlane([{ text: 'Li', size: 170, color: '#ffffff', weight: 800, align: 'center' }], { width: 0.9, w: 512, h: 256, y: 195 }); lt.position.set(0, 1.25, 0.78); bat.add(lt);
  const bg = glowSprite('#B39CFF', 3.2, 0.0); bg.position.set(3.6, 1.3, 0.8); scene.add(bg);
  const cu = (n, f) => cueOf(entry, n, f);
  const cBat = cu('bat', 20);
  const path = new CamPath([{ t: 0, p: [0.5, 7.0, 13.5], l: [0, 3.0, 0], fov: 34 }, { t: cu('beads', 10), p: [-2.5, 5.0, 9.5], l: [0, 2.8, 0], fov: 34 }, { t: cBat, p: [2.5, 5.0, 13.0], l: [1.6, 2.4, 0], fov: 34 }, { t: entry.dur, p: [0.5, 5.5, 14.5], l: [1.6, 2.4, 0], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.04);
    for (const b of brine) { const a = (b.o + t * b.sp) % 1; b.m.position.set(b.x + Math.sin(a * 10 + b.o * 5) * 0.08, cy0 + Hc + 0.6 - a * (Hc + 0.6), b.z); b.m.scale.setScalar(0.06); }
    for (const io of ions) { const a = (io.o + t * io.sp) % 1; const y = cy0 + Hc + 0.6 - a * (Hc + 0.6); const p = V(io.x, y, io.z);
      if (io.li) { // ditangkap: menuju manik lalu menempel; setelah cue baterai, terbang ke sel
        const k = smooth(clamp((a - io.cap) / 0.12)); p.lerp(io.target, k); const kb = easeInOut(prog(t, cBat + io.o * 1.5, 1.4)); if (kb > 0) p.lerp(V(3.6, 0.4 + io.o * 2.0, 0.6), kb); io.m.scale.setScalar(0.085 * (1 - 0.5 * kb)); }
      else io.m.scale.setScalar(0.06);
      io.m.position.copy(p); }
    const kf = smooth(prog(t, cBat + 0.8, 3)); fill.scale.set(1, Math.max(0.001, 0.15 + 2.3 * kf), 1); popBat(bat, t, cBat - 0.8); bg.material.opacity = 0.6 * smooth(prog(t, cu('two', 26), 0.6)) * (0.6 + 0.4 * Math.sin(t * 4)); } };
}
function popBat(b, t, at) { const k = easeBack(prog(t, at, 0.7)); b.scale.setScalar(Math.max(0.001, k)); b.visible = k > 0.01; }
