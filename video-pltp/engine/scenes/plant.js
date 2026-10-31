// plant.js — DIORAMA UTAMA PLTP (mode: overview, explore, production, cooling, reinject)
import { THREE, C, V, baseScene, mat, glass, basic, box, cyl, sphere, tube, curve, polyCurve, Flow, Plume, vessel, pipeMesh, clamp, lerp, smooth, easeOut, easeInOut, easeBack, prog, cueOf, CamPath, setOpacity, glowSprite, popScale } from '../core/kit.js';
import { BLOCK, terrainBlock, capTop, capBot, capGlowTexture, wellhead, pad, powerhouse, coolingTower, drillRig, mtSensor, fumarole, hotSpring, transformerYard } from './plantkit.js';

const ZF = BLOCK.z1 + 0.06; // bidang sumur di depan penampang
// pose kamera bersama (agar kontinu antar mode)
const POSE = {
  wide: { p: [11.5, 7.8, 19.5], l: [0.4, -2.2, -0.4], fov: 34 },
  wideL: { p: [-6.5, 6.5, 19.0], l: [-1.2, -2.0, 0.0], fov: 34 },
  surf: { p: [-1.5, 6.0, 13.5], l: [-1.5, 0.2, 0.5], fov: 34 },
  well: { p: [-5.2, -2.6, 11.5], l: [-2.2, -3.2, 3.0], fov: 34 },
  head: { p: [-4.5, 2.6, 8.0], l: [-1.6, 0.6, 1.8], fov: 34 },
  cool: { p: [12.0, 5.8, 8.5], l: [5.2, 0.9, -2.4], fov: 34 },
};
const P = (k, t) => ({ t, ...POSE[k] });

let SEC_CACHE = null;
export async function create({ entry, prev }) {
  const mode = entry.params.mode;
  const { scene, camera } = baseScene({ shadowSize: 16, lightPos: [10, 22, 16], target: [0, -2, 0], groundY: -BLOCK.depth - 0.01, shadowOpacity: 0.12 });
  const T = terrainBlock(); scene.add(T.group);
  const anchors = {};
  // ---------- sumur ----------
  const wP1 = [V(-2.9, 0.05, ZF), V(-2.9, -2.0, ZF), V(-2.75, -4.0, ZF), V(-2.5, -5.6, ZF)];
  const wP2 = [V(-2.1, 0.05, ZF), V(-2.0, -1.6, ZF), V(-1.3, -3.6, ZF), V(-0.4, -5.9, ZF)];
  const wI = [V(6.4, 0.05, ZF), V(6.35, -1.8, ZF), V(5.7, -3.8, ZF), V(4.6, -6.0, ZF)];
  const cP1 = curve(wP1), cP2 = curve(wP2), cI = curve(wI);
  const casing = mat('#F5F7FA', { r: 0.3, m: 0.4 });
  const wellGlass = glass('#ffffff', 0.32);
  const mkWell = (c) => { const g = new THREE.Group(); const gt = tube(c, 0.11, wellGlass, 100, 12); gt.castShadow = false; g.add(gt); const edgeL = tube(c, 0.03, casing, 100, 6); edgeL.castShadow = false; edgeL.position.x -= 0.11; g.add(edgeL); const edgeR = tube(c, 0.03, casing, 100, 6); edgeR.castShadow = false; edgeR.position.x += 0.11; g.add(edgeR); return g; };
  const wells = new THREE.Group(); scene.add(wells); const gP1 = mkWell(cP1), gP2 = mkWell(cP2), gI = mkWell(cI); wells.add(gP1, gP2, gI);
  // aliran dalam sumur produksi: cair (oranye) -> uap (putih) di atas zona flashing
  const flashY = -2.2;
  const colProd = (u, c, i) => { const y = lerp(-5.6, 0, u); if (y > flashY && (i % 3 !== 0)) c.set('#FFFFFF'); else c.set(y > flashY ? '#FFC089' : '#FF7A33'); };
  const sizeProd = (u, i) => { const y = lerp(-5.6, 0, u); return y > flashY && (i % 3 !== 0) ? 0.075 + 0.04 * ((i * 7) % 5) / 5 : 0.06; };
  const rev = (c) => curve(c.getPoints(60).reverse());
  const fP1 = new Flow(rev(cP1), 90, { speed: 0.12, colorFn: colProd, sizeFn: sizeProd, color: '#ffffff', glow: 0.25, seed: 3 }); scene.add(fP1.mesh);
  const fP2 = new Flow(rev(cP2), 90, { speed: 0.12, colorFn: colProd, sizeFn: sizeProd, color: '#ffffff', glow: 0.25, seed: 4 }); scene.add(fP2.mesh);
  const fI = new Flow(cI, 70, { speed: 0.1, size: 0.06, color: C.water, glow: 0.3, seed: 5 }); scene.add(fI.mesh);
  // aliran reservoir: dari dasar injeksi -> dasar produksi (biru -> oranye, dipanaskan ulang)
  const resC = curve([V(4.6, -6.0, ZF), V(3.2, -6.6, ZF), V(1.4, -6.85, ZF), V(-0.3, -6.6, ZF), V(-1.6, -6.1, ZF), V(-2.5, -5.62, ZF)]);
  const colRes = (u, c) => { c.set(C.water).lerp(new THREE.Color('#FF7A33'), smooth(u * 1.2)); };
  const fRes = new Flow(resC, 60, { speed: 0.045, size: 0.07, colorFn: colRes, color: '#ffffff', glow: 0.3, seed: 8 }); scene.add(fRes.mesh);
  const resC2 = curve([V(-0.3, -6.9, ZF), V(-0.35, -6.4, ZF), V(-0.4, -5.95, ZF)]);
  // kepala sumur & pad
  const surf = new THREE.Group(); scene.add(surf);
  const padP = pad(2.2, 1.4); padP.position.set(-2.5, 0, 2.3); surf.add(padP);
  const wh1 = wellhead(); wh1.position.set(-2.9, 0.08, ZF - 0.05); surf.add(wh1); const wh2 = wellhead(); wh2.position.set(-2.1, 0.08, ZF - 0.05); surf.add(wh2);
  const padI = pad(1.6, 1.2); padI.position.set(6.3, 0, 2.4); surf.add(padI); const whI = wellhead(); whI.position.set(6.4, 0.08, ZF - 0.05); surf.add(whI);
  // ---------- fasilitas permukaan ----------
  const fac = new THREE.Group(); scene.add(fac);
  const sepPos = V(0.3, 0.5, 0.6);
  const sep = vessel(0.5, 2.3, '#F7F9FB', { band: C.hot, legH: 0.5 }); sep.position.copy(sepPos); shadowAllSafe(sep); fac.add(sep);
  const ph = powerhouse(); ph.group.position.set(3.2, 0, -1.7); fac.add(ph.group);
  const cond = vessel(0.38, 1.0, '#E8EEF5', { legH: 0.3, band: C.water }); cond.position.set(4.95, 0.3, -2.95); fac.add(cond);
  const ct = coolingTower({ fans: 3 }); ct.group.position.set(7.0, 0, -2.5); fac.add(ct.group);
  const gasx = vessel(0.2, 0.6, '#EEF1F5', { legH: 0.25 }); gasx.position.set(1.7, 0.25, -3.1); fac.add(gasx);
  const vent = cyl(0.05, 0.05, 1.6, mat('#B8C2CF'), 10); vent.position.set(1.95, 0.8, -3.1); fac.add(vent);
  const ty = transformerYard(); ty.position.set(0.6, 0, -3.4); fac.add(ty);
  // pipa (kaca + partikel) — dua fase, uap, brine, kondensat
  const pipeGlass = glass('#ffffff', 0.38);
  const pTwo = polyCurve([[-2.9, 0.95, ZF - 0.05], [-2.9, 0.95, 1.5], [-1.6, 0.95, 1.5], [-1.6, 1.85, 1.5], [-0.9, 1.85, 1.5], [-0.9, 0.95, 1.5], [-0.2, 0.95, 1.5], [-0.2, 0.95, 0.6], [sepPos.x - 0.5, 0.95, sepPos.z]]);
  const pTwo2 = polyCurve([[-2.1, 0.95, ZF - 0.05], [-2.1, 0.95, 1.5]]);
  const pSteam = polyCurve([[sepPos.x, sepPos.y + 2.55, sepPos.z], [sepPos.x, 3.4, sepPos.z], [1.6, 3.4, sepPos.z], [1.6, 3.4, -1.7], [2.3, 3.4, -1.7], [2.3, 0.62, -1.7], [2.55, 0.62, -1.7]]);
  const pBrine = polyCurve([[sepPos.x + 0.5, 0.6, sepPos.z], [1.3, 0.25, sepPos.z], [1.3, 0.25, 1.9], [6.4, 0.25, 1.9], [6.4, 0.25, ZF - 0.08], [6.4, 0.6, ZF - 0.08]]);
  const pCond = polyCurve([[4.2, 0.62, -1.7], [4.95, 0.62, -1.7], [4.95, 0.62, -2.6]]);
  const pCT = polyCurve([[4.95, 1.0, -2.95], [5.6, 1.0, -2.95], [5.6, 1.0, -2.5], [5.6, 0.9, -2.5]]);
  const pRe = polyCurve([[6.2, 0.3, -1.75], [6.2, 0.3, 1.0], [6.0, 0.3, 1.9]]);
  const pipes = new THREE.Group(); fac.add(pipes);
  const supportsFor = (c) => pipeMesh(c, 0.0001, '#ffffff', { supports: true, supportEvery: 1.4, material: basic('#ffffff', { opacity: 0 }) });
  for (const [c, r] of [[pTwo, 0.13], [pTwo2, 0.13], [pSteam, 0.15], [pBrine, 0.1], [pCond, 0.1], [pCT, 0.09], [pRe, 0.08]]) { const m = tube(c, r, pipeGlass, 200, 14); m.castShadow = true; pipes.add(m); pipes.add(supportsFor(c)); }
  const fTwo = new Flow(pTwo, 60, { speed: 0.14, size: 0.06, colorFn: (u, c, i) => c.set(i % 2 ? '#ffffff' : '#FF9A5A'), color: '#fff', seed: 11 }); fac.add(fTwo.mesh);
  const fTwo2 = new Flow(pTwo2, 10, { speed: 0.3, size: 0.06, colorFn: (u, c, i) => c.set(i % 2 ? '#ffffff' : '#FF9A5A'), color: '#fff', seed: 12 }); fac.add(fTwo2.mesh);
  const fSteam = new Flow(pSteam, 70, { speed: 0.16, size: 0.07, color: '#FFFFFF', glow: 0.5, seed: 13, colorFn: (u, c) => c.set('#F4FAFF') }); fac.add(fSteam.mesh);
  const fBrine = new Flow(pBrine, 60, { speed: 0.12, size: 0.055, color: C.water, glow: 0.3, seed: 14 }); fac.add(fBrine.mesh);
  const fCond = new Flow(pCond, 14, { speed: 0.3, size: 0.05, color: C.sky, seed: 15 }); fac.add(fCond.mesh);
  const fCT = new Flow(pCT, 14, { speed: 0.3, size: 0.05, color: C.sky, seed: 16 }); fac.add(fCT.mesh);
  const fRe = new Flow(pRe, 20, { speed: 0.2, size: 0.045, color: C.water, seed: 17 }); fac.add(fRe.mesh);
  // kepulan menara pendingin
  const plumes = ct.stacks.map((s, i) => { const pl = new Plume(12, { rise: 3.2, spread: 0.9, size0: 0.5, size1: 2.0, life: 3.6, opacity: 0.6, seed: 30 + i, drift: [0.25, 0, -0.05] }); pl.group.position.copy(s).add(ct.group.position); scene.add(pl.group); return pl; });
  // ---------- elemen eksplorasi ----------
  const expl = new THREE.Group(); scene.add(expl);
  const fum = fumarole({ seed: 41 }); fum.group.position.set(-6.0, 0, 1.2); expl.add(fum.group);
  const hs = hotSpring({ seed: 42 }); hs.group.position.set(-7.2, 0, -0.9); expl.add(hs.group);
  const alter = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), basic('#F2E6A6', { opacity: 0.8 })); alter.rotation.x = -Math.PI / 2; alter.position.set(-6.4, 0.012, 0.6); expl.add(alter);
  const mts = [[-7.4, 2.2], [-5.0, 2.4], [-1.0, 2.0], [1.8, 2.3], [4.4, 2.1]].map(([x, z]) => { const m = mtSensor(); m.position.set(x, 0, z); expl.add(m); return m; });
  const cable = tube(curve(mts.map((m) => m.position.clone().setY(0.03))), 0.012, mat('#14213D')); expl.add(cable);
  const capGlow = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: SEC_CACHE ?? (SEC_CACHE = capGlowTexture()), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); capGlow.position.set(0, -4.5, BLOCK.z1 + 0.02); scene.add(capGlow);
  const rig = drillRig(3.6); rig.position.set(-2.9, 0, 2.4); scene.add(rig);
  const bitGlow = glowSprite(C.gold, 0.9, 0.9); scene.add(bitGlow);
  // ---------- zona flashing (pita) ----------
  const flashBand = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), basic('#ffffff', { opacity: 0 })); flashBand.position.set(-2.4, flashY - 0.2, BLOCK.z1 + 0.03); scene.add(flashBand);
  // ---------- anchor ----------
  Object.assign(anchors, {
    fumarole: { p: V(-6.0, 0.6, 1.2), dx: -60, dy: -120 }, mt: { p: V(-1.0, 0.6, 2.0), dx: 80, dy: -150 }, clay: { p: V(-5.5, capTop(-5.5) - 0.5, ZF), dx: -80, dy: 110 },
    rig: { p: V(-2.9, 3.0, 2.4), dx: 90, dy: -40 }, reservoir: { p: V(-1.0, -6.3, ZF), dx: 120, dy: 60 }, flashzone: { p: V(-2.85, flashY, ZF), dx: -110, dy: -40 },
    wellhead: { p: V(-2.9, 1.0, ZF), dx: -120, dy: -90 }, loop: { p: V(-1.25, 1.9, 1.5), dx: 100, dy: -110 },
    condenser: { p: V(4.95, 1.4, -2.95), dx: -140, dy: -120 }, tower: { p: V(7.0, 1.4, -2.5), dx: 60, dy: 130 }, plume: { p: V(7.0, 3.6, -2.5), dx: 90, dy: -40 }, gasx: { p: V(1.95, 1.6, -3.1), dx: -120, dy: -60 },
    injwell: { p: V(5.9, -3.4, ZF), dx: 110, dy: -40 },
  });
  // ---------- jalur kamera per mode ----------
  const cu = (n, f) => cueOf(entry, n, f); const D = entry.dur;
  let path;
  if (mode === 'overview') path = new CamPath([{ t: 0, p: [16, 12, 26], l: [0.4, -2.6, -0.4], fov: 34 }, { t: 9, p: [6, 8.5, 21.5], l: [0.4, -2.4, -0.4], fov: 34 }, { t: cu('nofire', 16), p: [12.5, 6.5, 17.5], l: [1.5, -1.0, -0.6], fov: 34 }, { t: D, ...POSE.wideL }]);
  else if (mode === 'explore') path = new CamPath([{ t: 0, ...POSE.wideL }, { t: cu('signs', 4), p: [-9.0, 5.0, 11.0], l: [-5.4, 0.0, 0.6], fov: 34 }, { t: cu('mt', 9), p: [-3.5, 7.0, 15.0], l: [-2.4, -0.4, 1.0], fov: 34 }, { t: cu('clay', 14), p: [-1.0, 1.2, 23.0], l: [-1.0, -3.4, 2.0], fov: 34 }, { t: cu('drill', 22), p: [-8.0, 2.6, 16.5], l: [-2.6, -2.2, 2.4], fov: 34 }, { t: D, p: [-8.5, 0.6, 16.5], l: [-2.4, -3.2, 2.4], fov: 34 }]);
  else if (mode === 'production') path = new CamPath([{ t: 0, p: [-8.5, 0.6, 16.5], l: [-2.4, -3.2, 2.4], fov: 34 }, { t: cu('liquid', 3), ...POSE.well }, { t: cu('flash', 13), p: [-5.6, -1.0, 10.0], l: [-2.6, -2.0, 3.0], fov: 34 }, { t: cu('head', 18), ...POSE.head }, { t: cu('pipe', 22), p: [-3.2, 3.6, 8.6], l: [-1.0, 1.0, 1.2], fov: 34 }, { t: D, p: [-1.8, 3.4, 7.6], l: [0.2, 1.4, 0.8], fov: 34 }]);
  else if (mode === 'cooling') path = new CamPath([{ t: 0, p: [1.0, 3.8, 6.5], l: [3.2, 0.9, -1.7], fov: 34 }, { t: cu('cond', 4), p: [7.2, 2.6, 2.2], l: [4.6, 0.7, -2.4], fov: 34 }, { t: cu('tower', 13), ...POSE.cool }, { t: cu('plume', 25), p: [10.5, 6.5, 6.0], l: [6.6, 2.4, -2.5], fov: 34 }, { t: cu('ncg', 30), p: [5.5, 3.6, 3.5], l: [2.2, 0.9, -2.8], fov: 34 }, { t: D, p: [6.5, 4.4, 5.0], l: [2.6, 0.9, -2.6], fov: 34 }]);
  else if (mode === 'reinject') path = new CamPath([{ t: 0, p: [6.5, 4.4, 5.0], l: [2.6, 0.9, -2.6], fov: 34 }, { t: cu('inject', 4), p: [10.0, 1.0, 13.5], l: [5.0, -2.4, 2.0], fov: 34 }, { t: cu('reheat', 10), p: [3.0, -3.4, 15.5], l: [1.2, -5.2, 2.0], fov: 34 }, { t: cu('loop', 15), p: [1.0, 1.5, 21.0], l: [1.0, -3.4, 1.0], fov: 34 }, { t: D, p: [-2.5, 4.5, 22.5], l: [0.5, -3.0, 0.0], fov: 34 }]);
  // ---------- status per mode ----------
  const cDrill = cu('drill', 20), cClay = cu('clay', 14), cMT = cu('mt', 9), cSigns = cu('signs', 4);
  return {
    scene, camera, anchors,
    update(t) {
      path.apply(camera, t, 0.05);
      // fasilitas: eksplorasi -> sembunyi; produksi -> muncul kembali
      let facA = 1, explA = 0, rigA = 0, wellGrow = 1, flowsOn = 1;
      if (mode === 'explore') { facA = 1 - smooth(t / 1.4); explA = smooth(prog(t, 0.8, 1.0)); rigA = easeBack(prog(t, cDrill - 0.6, 0.8)); wellGrow = easeInOut(prog(t, cDrill, 7)); flowsOn = 0; }
      if (mode === 'production') { facA = smooth(prog(t, 0.3, 1.4)); explA = 1 - smooth(t / 1.0); rigA = 1 - smooth(t / 0.8); }
      setOpacity(fac, facA); fac.visible = facA > 0.01; fac.scale.setScalar(0.85 + 0.15 * facA);
      setOpacity(expl, explA); expl.visible = explA > 0.01;
      mts.forEach((m, i) => popScale(m, t, cMT + i * 0.18, 0.5)); if (mode !== 'explore') mts.forEach((m) => (m.visible = false));
      rig.visible = rigA > 0.01; rig.scale.setScalar(Math.max(0.001, rigA));
      // sumur: saat eksplorasi tumbuh dari permukaan
      gP2.visible = gI.visible = mode !== 'explore' ? true : facA > 0.05; setOpacity(gP2, mode === 'explore' ? facA : 1); setOpacity(gI, mode === 'explore' ? facA : 1);
      gP1.children.forEach((m) => { m.geometry.setDrawRange(0, Math.floor(m.geometry.index.count * (mode === 'explore' ? wellGrow : 1) / 6) * 6); });
      if (mode === 'explore' && wellGrow > 0 && wellGrow < 1) { const p = cP1.getPointAt(wellGrow); bitGlow.position.copy(p); bitGlow.visible = true; bitGlow.material.opacity = 0.9; } else bitGlow.visible = false;
      // kubah lempung menyala
      capGlow.material.opacity = mode === 'explore' ? 0.55 * smooth(prog(t, cClay - 0.2, 0.8)) * (0.75 + 0.25 * Math.sin(t * 4)) * (1 - smooth(prog(t, cDrill + 2, 1.5))) : 0;
      // aliran
      const fl = flowsOn; const show = (f, v) => { f.mesh.visible = v; if (v) f.update(t); };
      show(fP1, fl > 0 && mode !== 'explore'); show(fP2, mode !== 'explore'); show(fI, mode !== 'explore'); show(fRes, mode !== 'explore');
      for (const f of [fTwo, fTwo2, fSteam, fBrine, fCond, fCT, fRe]) show(f, facA > 0.3);
      plumes.forEach((pl) => { pl.group.visible = facA > 0.05; pl.update(t, facA); }); ct.fans.forEach((f, i) => (f.rotation.y = t * 6 + i));
      fum.plume.update(t, explA); hs.plume.update(t, explA);
      // sorotan per mode
      const focus = (m) => { const v = mode === m; return v; };
      flashBand.material.opacity = mode === 'production' ? 0.28 * smooth(prog(t, cu('flash', 12) - 0.5, 0.8)) * (0.6 + 0.4 * Math.sin(t * 5)) : 0;
      if (mode === 'reinject') { fRes.mesh.scale.setScalar(1); }
      // turbin di rumah pembangkit berputar pelan (visual)
      ph.turbine.rotation.x = t * 2;
    },
  };
}
function shadowAllSafe(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); }
