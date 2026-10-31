// earth.js — globe terbelah (lapisan Bumi) / Cincin Api & Indonesia / penutup.
import { THREE, C, V, baseScene, mat, basic, clamp, lerp, easeOut, easeBack, easeInOut, smooth, glowSprite, cueOf, CamPath, Plume, cyl, sphere, rng, curve, prog } from '../core/kit.js';
import { ll2v, globeTexture, RING, SUNDA, VOLCANOES } from './geo.js';

function ringsTexture() {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'); const c = S / 2;
  const layers = [[1.0, '#C9A57E'], [0.985, '#FFE2BF'], [0.88, '#FFC995'], [0.55, '#FF9A4D'], [0.35, '#FF7A33'], [0.19, '#FFE88A'], [0.1, '#FFFBEA']];
  for (const [r, col] of layers) { g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.fillStyle = col; g.fill(); }
  // gradasi halus mantel
  const gr = g.createRadialGradient(c, c, 0.55 * c, c, c, 0.985 * c); gr.addColorStop(0, 'rgba(255,140,60,0.55)'); gr.addColorStop(1, 'rgba(255,230,200,0)');
  g.globalCompositeOperation = 'source-atop'; g.beginPath(); g.arc(c, c, 0.985 * c, 0, Math.PI * 2); g.arc(c, c, 0.55 * c, 0, Math.PI * 2, true); g.fillStyle = gr; g.fill('evenodd');
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3;
  for (const r of [0.985, 0.55, 0.19]) { g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function create({ entry }) {
  const mode = entry.params.mode; const R = 3;
  const { scene, camera } = baseScene({ ground: false, shadow: false, hemi: 2.3, sun: 2.2, lightPos: [10, 12, 18] });
  const tex = await globeTexture();
  const wedge = mode === 'core' || mode === 'end';
  const planes = wedge ? [new THREE.Plane(V(-1, 0, 0), 0), new THREE.Plane(V(0, 0, -1), 0)] : [];
  const globeMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0, clippingPlanes: planes, clipIntersection: true });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 64), globeMat); scene.add(globe);
  // atmosfer halus
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 96, 48), new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false, toneMapped: false })); scene.add(atm);
  const anchors = {};
  let core = null, coreGlow = null, faces = [];
  if (wedge) {
    const rt = ringsTexture(); const fm = new THREE.MeshBasicMaterial({ map: rt, toneMapped: false, side: THREE.DoubleSide });
    // dinding irisan: setengah lingkaran pada bidang x=0 (z>0) dan z=0 (x>0)
    const f1 = new THREE.Mesh(new THREE.CircleGeometry(R, 96, -Math.PI / 2, Math.PI), fm); f1.rotation.y = -Math.PI / 2; scene.add(f1);
    const f2 = new THREE.Mesh(new THREE.CircleGeometry(R, 96, -Math.PI / 2, Math.PI), fm); scene.add(f2); faces = [f1, f2];
    core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.19, 48, 24, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#FFF4B8', toneMapped: false, side: THREE.DoubleSide })); core.rotation.y = 0; scene.add(core);
    coreGlow = glowSprite('#FFB347', R * 1.1, 0.7); coreGlow.position.set(0.25, 0, 0.25); scene.add(coreGlow);
    anchors.core = { p: V(0.3, 0.1, 0.3), dx: 120, dy: -160 };
  }
  // Cincin Api
  const ringPts = RING.map(([la, lo]) => ll2v(la, lo, R * 1.012)); const ringC = curve(ringPts, false, 0.2);
  const ringGeo = new THREE.TubeGeometry(ringC, 600, 0.017, 8, false); const ringMesh = new THREE.Mesh(ringGeo, basic(C.hot)); scene.add(ringMesh);
  const sunda = curve(SUNDA.map(([la, lo]) => ll2v(la, lo, R * 1.012)), false, 0.3); const sGeo = new THREE.TubeGeometry(sunda, 200, 0.02, 8, false); const sMesh = new THREE.Mesh(sGeo, basic(C.magma)); scene.add(sMesh);
  const ringOn = mode === 'indonesia' || mode === 'japan';
  ringMesh.visible = sMesh.visible = ringOn;
  // titik gunung api
  const volc = new THREE.Group(); scene.add(volc); const vgeo = new THREE.ConeGeometry(0.022, 0.06, 10); vgeo.translate(0, 0.03, 0);
  const vlist = VOLCANOES.slice().sort((a, b) => a[1] - b[1]).map(([la, lo], i) => { const m = new THREE.Mesh(vgeo, mat(C.magma, { em: C.magma, ei: 0.6 })); const p = ll2v(la, lo, R); m.position.copy(p); m.quaternion.setFromUnitVectors(V(0, 1, 0), p.clone().normalize()); volc.add(m); return m; });
  volc.visible = mode === 'indonesia';
  // kolom potensi vs terpakai (dari Jawa Barat)
  const base = ll2v(-6.9, 107.6, R); const nrm = base.clone().normalize(); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), nrm);
  const potH = 1.25, usedH = potH * 0.116;
  const potCol = new THREE.Group(); const pc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: C.hot, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); pc.position.y = 0.5; potCol.add(pc);
  const pcr = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 48), basic(C.hot)); pcr.rotation.x = Math.PI / 2; pcr.position.y = 1; potCol.add(pcr);
  potCol.position.copy(ll2v(-7.3, 104.6, R)); potCol.quaternion.copy(q); scene.add(potCol);
  const usedCol = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 32), mat(C.hot, { em: C.hot, ei: 0.35 })); usedCol.geometry.translate(0, 0.5, 0); usedCol.position.copy(potCol.position); usedCol.quaternion.copy(q); scene.add(usedCol);
  anchors.pot = { p: potCol.position.clone().addScaledVector(nrm, potH), dx: -260, dy: -60 };
  // PLTU kecil berasap (batu bara)
  const coalG = new THREE.Group(); const stack = cyl(0.035, 0.05, 0.42, mat('#9097a6'), 16); stack.position.y = 0.21; coalG.add(stack); const hb = cyl(0.02, 0.02, 0.06, mat('#E63946'), 12); hb.position.y = 0.36; coalG.add(hb);
  const blk = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), mat('#6B7080')); blk.position.set(0.12, 0.06, 0); coalG.add(blk);
  const smoke = new Plume(16, { rise: 0.9, spread: 0.25, size0: 0.08, size1: 0.45, life: 2.6, color: '#7b8091', opacity: 0.55, drift: [0.25, 0, 0.05], seed: 11 }); smoke.group.position.y = 0.42; coalG.add(smoke.group);
  coalG.position.copy(ll2v(-6.6, 112.0, R)); coalG.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), coalG.position.clone().normalize())); scene.add(coalG);

  // ---- kamera ----
  const dirOf = (la, lo, d) => ll2v(la, lo, d);
  let path;
  if (mode === 'core') {
    // dari dekat inti, mundur memperlihatkan globe terbelah
    path = new CamPath([{ t: 0, p: [0.9, 0.15, 0.9], l: [0, 0, 0], fov: 40 }, { t: 3.5, p: [3.2, 1.0, 3.2], l: [0, 0, 0], fov: 36 }, { t: 9, p: [7.5, 3.4, 7.5], l: [0, 0, 0], fov: 32 }, { t: 30, p: [10.5, 4.6, 7.2], l: [0, 0.2, 0], fov: 30 }]);
  } else if (mode === 'indonesia') {
    const p0 = dirOf(18, 165, 16), p1 = dirOf(4, 135, 13), p2 = dirOf(-20, 104, 9.2), p3 = dirOf(-24, 100, 8.6);
    const c = entry.cues; path = new CamPath([{ t: 0, p: p0.toArray(), l: [0, 0, 0], fov: 30 }, { t: (c.volc ?? 6) - 0.5, p: p1.toArray(), l: [0, 0, 0], fov: 30 }, { t: (c.pot ?? 10), p: p2.toArray(), l: ll2v(-2, 112, 2.2).toArray(), fov: 30 }, { t: entry.dur, p: p3.toArray(), l: ll2v(-3, 110, 2.4).toArray(), fov: 30 }]);
  } else if (mode === 'end' || mode === 'japan') {
    path = new CamPath([{ t: 0, p: [6.5, 2.6, 6.5], l: [-1.6, 0.2, 1.6], fov: 32 }, { t: entry.dur, p: [9.5, 3.6, 9.0], l: [-2.6, 0.2, 2.6], fov: 32 }]);
  }
  const cVolc = cueOf(entry, 'volc', 5), cRing = cueOf(entry, 'ring', 2), cPot = cueOf(entry, 'pot', 9), cUsed = cueOf(entry, 'used', 13), cCoal = cueOf(entry, 'coal', 17);
  return {
    scene, camera, anchors,
    update(t) {
      path.apply(camera, t);
      globe.rotation.y = 0; // globe diam (bidang potong di ruang dunia)
      if (core) { const pu = 1 + 0.04 * Math.sin(t * 3.2); core.scale.setScalar(pu); coreGlow.material.opacity = 0.55 + 0.2 * Math.sin(t * 3.2); }
      if (ringOn) { const k = easeInOut(prog(t, cRing, 2.4)); ringGeo.setDrawRange(0, Math.floor(ringGeo.index.count * k / 6) * 6); const k2 = easeInOut(prog(t, cRing + 1.6, 1.6)); sGeo.setDrawRange(0, Math.floor(sGeo.index.count * k2 / 6) * 6); }
      if (mode === 'indonesia') {
        vlist.forEach((m, i) => { const s = easeBack(prog(t, cVolc + i * 0.035, 0.4)); m.scale.setScalar(Math.max(0.001, s * (1 + 0.15 * Math.sin(t * 4 + i)))); m.visible = s > 0.01; });
        const kp = easeOut(prog(t, cPot, 1.4)); potCol.scale.set(1, Math.max(0.001, potH * kp), 1); potCol.visible = kp > 0.01;
        const ku = easeOut(prog(t, cUsed, 1.0)); usedCol.scale.set(1.02, Math.max(0.001, usedH * ku), 1.02); usedCol.visible = ku > 0.01;
        const kc = easeBack(prog(t, cCoal, 0.6)); coalG.scale.setScalar(Math.max(0.001, kc * 0.75)); coalG.visible = kc > 0.01; smoke.update(t, kc);
      } else { potCol.visible = usedCol.visible = coalG.visible = false; }
    },
  };
}
