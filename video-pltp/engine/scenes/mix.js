// mix.js — donat 3D bauran produksi listrik 2024 + batang kecil PLTP (kapasitas).
import { THREE, C, V, baseScene, mat, basic, rbox, cyl, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, textPlane } from '../core/kit.js';

function ringSector(r0, r1, a0, a1, h, color) { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, curveSegments: 48 }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, mat(color, { r: 0.45 })); m.castShadow = true; m.receiveShadow = true; return m; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [6, 16, 10] });
  camera.setViewOffset(1920, 1080, -380, 0, 1920, 1080);
  const segs = [['Batu bara 68,2%', 68.18, '#4A4E69', 'c68', 0.9], ['Gas & BBM ±17%', 17.2, '#AEB8C6', 'c68', 0.55], ['EBT ±14,6%', 14.62, C.green, 'ebt', 0.7]];
  const cu = (n, f) => cueOf(entry, n, f); let a = Math.PI / 2; const parts = [];
  for (const [nm, v, col, cue, h] of segs) { const da = v / 100 * Math.PI * 2; const m = ringSector(1.4, 3.0, a, a + da, h, col); scene.add(m); const mid = a + da / 2; const lp = textPlane([{ text: nm, size: 84, color: col === '#AEB8C6' ? C.sub : col, weight: 800, align: 'center' }], { width: 3.2, w: 1024, h: 200, y: 140 }); lp.position.set(Math.cos(mid) * 4.1, h + 0.4, -Math.sin(mid) * 3.6); scene.add(lp); parts.push({ m, lp, at: cu(cue, 2) + parts.length * 0.3, mid, h }); a += da; }
  const pt = textPlane([{ text: 'Produksi listrik 2024', size: 70, color: C.sub, weight: 700, align: 'center' }], { width: 3.2, w: 1024, h: 200, y: 140 }); pt.position.set(0, 0.1, 0); pt.rotation.x = -Math.PI / 2; scene.add(pt);
  // batang kecil PLTP (2,57% kapasitas)
  const capBar = rbox(0.5, 1, 0.5, 0.06, mat(C.hot, { em: C.hot, ei: 0.2 })); capBar.geometry.translate(0, 0.5, 0); capBar.position.set(4.6, 0, 1.8); scene.add(capBar);
  const capBg = rbox(0.5, 1, 0.5, 0.06, new THREE.MeshStandardMaterial({ color: '#C9D3DF', transparent: true, opacity: 0.35, depthWrite: false })); capBg.geometry.translate(0, 0.5, 0); capBg.position.set(4.6, 0, 1.8); capBg.scale.y = 3.5; scene.add(capBg);
  const capT = textPlane([{ text: 'PLTP = 2,57%', size: 76, color: C.hot, weight: 800, align: 'center' }, { text: 'dari kapasitas nasional (balok abu = 100%)', size: 44, color: C.sub, weight: 600, align: 'center' }], { width: 3.4, w: 1024, h: 240, y: 100 }); capT.position.set(4.6, 4.1, 1.8); scene.add(capT);
  const path = new CamPath([{ t: 0, p: [1.0, 11.0, 13.5], l: [1.2, 0.6, 0], fov: 34 }, { t: entry.dur, p: [-1.5, 9.0, 15.0], l: [1.2, 0.8, 0.4], fov: 34 }]);
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t, 0.03); parts.forEach((p) => { const k = easeOut(prog(t, p.at, 1)); p.m.scale.set(1, Math.max(0.001, k), 1); p.m.visible = k > 0.01; p.lp.material.opacity = k; const pop = p.at < cu('ebt', 9) && p.m.material.color.getHexString() === '4a4e69' ? 0.15 * smooth(prog(t, p.at + 1, 0.6)) : 0; p.m.position.set(Math.cos(p.mid) * pop, 0, -Math.sin(p.mid) * pop); });
    const kc = easeOut(prog(t, cu('pltp', 12), 1)); capBar.scale.y = Math.max(0.001, 3.5 * 0.0257 * kc); capBar.visible = capBg.visible = kc > 0.01; capT.material.opacity = kc; capBg.material.opacity = 0.35 * kc; } };
}
