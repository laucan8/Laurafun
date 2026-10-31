// separator.js — separator siklon dalam potongan: aliran spiral, air ke bawah, uap naik.
import { THREE, C, V, baseScene, mat, basic, glass, box, cyl, sphere, clamp, lerp, easeOut, smooth, prog, cueOf, CamPath, Flow, curve, polyCurve, tube, Plume } from '../core/kit.js';

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [8, 16, 12] });
  const R = 1.8, Hh = 6.0, y0 = 0.9;
  const shellM = new THREE.MeshStandardMaterial({ color: '#F6F8FB', roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Hh, 64, 1, true, Math.PI / 2, Math.PI), shellM); back.position.y = y0 + Hh / 2; back.receiveShadow = true; scene.add(back);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.985, R * 0.985, Hh, 64, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#E7EEF6', roughness: 0.6, side: THREE.BackSide })); inner.position.copy(back.position); scene.add(inner);
  const capT = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 16, Math.PI / 2, Math.PI, 0, Math.PI / 2), shellM); capT.scale.y = 0.5; capT.position.y = y0 + Hh; scene.add(capT);
  const capB = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 16, Math.PI / 2, Math.PI, Math.PI / 2, Math.PI / 2), shellM); capB.scale.y = 0.5; capB.position.y = y0; scene.add(capB);
  // tepi potongan (oranye)
  const edgeM = basic(C.hot); for (const sx of [-1, 1]) { const e = box(0.06, Hh, 0.12, edgeM, sx * R, y0 + Hh / 2, 0); e.castShadow = false; scene.add(e); }
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(R, 0.04, 8, 64, Math.PI), edgeM); rimT.rotation.x = Math.PI / 2; rimT.rotation.z = Math.PI; rimT.position.y = y0 + Hh; scene.add(rimT);
  const rimB = rimT.clone(); rimB.position.y = y0; scene.add(rimB);
  // kaki
  for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + i * Math.PI / 2 + 0.3; scene.add(cyl(0.12, 0.12, y0 + 0.2, mat('#9aa6b5'), 10, Math.cos(a) * R * 0.8, (y0 - 0.6) / 2, -Math.abs(Math.sin(a)) * R * 0.8)); }
  // pipa pusat (vortex finder) ke atas
  const vf = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 3.8, 32, 1, true), glass('#ffffff', 0.35)); vf.position.y = y0 + Hh - 1.6; scene.add(vf);
  const outTop = tube(polyCurve([[0, y0 + Hh + 0.2, 0], [0, y0 + Hh + 1.4, 0], [2.6, y0 + Hh + 1.4, 0]]), 0.42, glass('#ffffff', 0.4)); scene.add(outTop);
  // inlet tangensial
  const inletC = polyCurve([[-5.2, y0 + Hh - 1.1, 1.3], [-R + 0.05, y0 + Hh - 1.1, 1.3]]); scene.add(tube(inletC, 0.38, glass('#ffffff', 0.4)));
  // outlet brine bawah
  const outB = polyCurve([[0, y0 - R * 0.5, 0], [0, 0.35, 0], [3.4, 0.35, 0]]); scene.add(tube(outB, 0.26, glass('#ffffff', 0.4)));
  // kolam air bawah
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.97, R * 0.97, 0.8, 64, 1, false, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#5FA8E8', transparent: true, opacity: 0.75, roughness: 0.15 })); pool.position.y = y0 + 0.4; scene.add(pool);
  // aliran
  const helix = (n, r0, r1, ya, yb, turns) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; const a = Math.PI * 0.6 + u * turns * Math.PI * 2; const r = lerp(r0, r1, u); pts.push(V(Math.cos(a) * r, lerp(ya, yb, u), -Math.abs(Math.sin(a)) * r * 0 + Math.sin(a) * r)); } return curve(pts); };
  const inFlow = new Flow(inletC, 30, { speed: 0.35, size: 0.1, colorFn: (u, c, i) => c.set(i % 2 ? '#ffffff' : '#FF9A5A'), color: '#fff', seed: 1 }); scene.add(inFlow.mesh);
  const spiral = helix(260, R * 0.88, R * 0.7, y0 + Hh - 1.1, y0 + 2.2, 3.2);
  const swirl = new Flow(spiral, 120, { speed: 0.12, size: 0.085, colorFn: (u, c, i) => c.set(i % 3 === 0 ? '#ffffff' : (u > 0.35 ? '#4C9BE8' : '#FF9A5A')), color: '#fff', seed: 2 }); scene.add(swirl.mesh);
  const drops = helix(120, R * 0.92, R * 0.9, y0 + 2.4, y0 + 0.8, 0.8); const fDrop = new Flow(drops, 40, { speed: 0.25, size: 0.07, color: '#4C9BE8', glow: 0.3, seed: 3 }); scene.add(fDrop.mesh);
  const steamUp = curve([V(0, y0 + 2.6, 0), V(0, y0 + Hh - 1.0, 0), V(0, y0 + Hh + 1.4, 0), V(2.6, y0 + Hh + 1.4, 0)]);
  const fSteam = new Flow(steamUp, 60, { speed: 0.2, size: 0.11, color: '#ffffff', glow: 0.6, jitter: 0.25, seed: 4 }); scene.add(fSteam.mesh);
  const fBrine = new Flow(outB, 30, { speed: 0.25, size: 0.08, color: '#2E86DE', glow: 0.3, seed: 5 }); scene.add(fBrine.mesh);
  const anchors = { inlet: { p: V(-3.4, y0 + Hh - 1.1, 1.3), dx: -60, dy: -120 }, steamout: { p: V(1.8, y0 + Hh + 1.4, 0), dx: 130, dy: 90 }, brineout: { p: V(2.6, 0.35, 0), dx: 120, dy: 60 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [4.5, 7.0, 21.0], l: [0, 4.0, 0], fov: 34 }, { t: cu('spin', 3), p: [-5.0, 7.5, 17.0], l: [-0.8, 4.8, 0], fov: 34 }, { t: cu('water', 8), p: [3.0, 3.5, 15.5], l: [0, 2.8, 0], fov: 34 }, { t: cu('steam', 12), p: [-3.0, 8.5, 16.5], l: [0.4, 5.2, 0], fov: 34 }, { t: entry.dur, p: [6.0, 5.5, 19.0], l: [0.6, 3.8, 0], fov: 34 }]);
  return {
    scene, camera, anchors,
    update(t) { path.apply(camera, t, 0.04); inFlow.update(t); swirl.update(t); fDrop.update(t); fSteam.update(t); fBrine.update(t); pool.position.y = y0 + 0.4 + Math.sin(t * 2) * 0.02; },
  };
}
