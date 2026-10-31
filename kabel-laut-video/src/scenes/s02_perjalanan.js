import * as THREE from 'three';
import { setupScene, cableMat, tubeFrom, lam, basic, PAL, patchTex, building, tree, tower, canvasPlane, flow, updateFlow, blobShadow } from '../lib/world.js';
import { ap, win, camRig, clamp, mulberry, smooth, lerp, fmt, easeOut } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, setCable, off } from './common.js';

export const bedY = x => -0.5 - 7.6 * smooth(-2, 44, x) + Math.sin(x * 0.9) * 0.08;
export function buildDiorama(scene, o = {}) {
  const g = new THREE.Group(); scene.add(g);
  const landW = o.landW ?? 34, seaW = o.seaW ?? 46, D = 20;
  // land block
  const soilTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const cols = ['#cfae7e', '#c49b69', '#b88d5c', '#a87f52']; cols.forEach((cc, i) => { x.fillStyle = cc; x.fillRect(0, i * 64, 64, 64); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const top = new THREE.MeshLambertMaterial({ map: patchTex(o.seed || 21) }); top.map.repeat.set(2.2, 1.3);
  const soil = new THREE.MeshLambertMaterial({ map: soilTex });
  const land = new THREE.Mesh(new THREE.BoxGeometry(landW, 4, D), [soil, soil, top, soil, soil, soil]);
  land.position.set(-landW / 2, -2, 0); g.add(land);
  const beach = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, D), lam(PAL.sand)); beach.position.set(-1.5, 0.02, 0); g.add(beach);
  // seabed block (profile extruded along z)
  const sh = new THREE.Shape(); sh.moveTo(0, bedY(0)); for (let x = 0; x <= seaW; x += 1) sh.lineTo(x, bedY(x)); sh.lineTo(seaW, -9.5); sh.lineTo(0, -9.5); sh.closePath();
  const bed = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }), [lam('#e7d6a6'), lam('#d9bf89')]);
  bed.position.z = -D / 2; g.add(bed);
  // shore wedge filling gap between land block (bottom -4) and seabed
  const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.5, D), lam('#c49b69')); wedge.position.set(-0.4, -4.75, 0); g.add(wedge);
  const r = mulberry(5);
  for (let i = 0; i < 26; i++) { const x = 3 + r() * (seaW - 6), z = (r() - 0.5) * D * 0.8; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + r() * 0.6, 0), lam('#b5ad98')); m.position.set(x, bedY(x), z); g.add(m); }
  for (let i = 0; i < 40; i++) { const x = 2 + r() * (seaW - 4), z = (r() - 0.5) * D * 0.85; const s = 0.6 + r() * 1.6; const m = new THREE.Mesh(new THREE.ConeGeometry(0.14, s, 4), lam(r() < 0.5 ? '#6fb38a' : '#8ac79c')); m.position.set(x, bedY(x) + s / 2, z); g.add(m); }
  // water volume + surface
  const water = new THREE.Mesh(new THREE.BoxGeometry(seaW, 8.6, D), new THREE.MeshLambertMaterial({ color: '#72c9e2', transparent: true, opacity: 0.30, depthWrite: false }));
  water.position.set(seaW / 2, -4.3 + 0.0, 0); water.renderOrder = 5; g.add(water);
  const surfTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#9edcee'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 2; const rr = mulberry(3); for (let i = 0; i < 60; i++) { const px = rr() * 256, py = rr() * 256; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 3, px + 16, py); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(seaW, D), new THREE.MeshLambertMaterial({ map: surfTex, transparent: true, opacity: 0.55, depthWrite: false }));
  surf.rotation.x = -Math.PI / 2; surf.position.set(seaW / 2, 0.01, 0); surf.renderOrder = 6; g.add(surf);
  return { g, surf, water, D, seaW, landW };
}
export default {
  async build() {
    const { scene, camera } = setupScene({ top: '#a9d8f2', bot: '#eef7fb', near: 60, far: 160, fov: 38 });
    const dio = buildDiorama(scene);
    const r = mulberry(8);
    // city
    const cols = ['#f6f1e7', '#e9eef3', '#f3e3cf', '#dfe9f1', '#fbf7ee'];
    for (let i = 0; i < 46; i++) {
      const x = -32 + r() * 18, z = -8 + r() * 16; if (Math.abs(z) < 1.2) continue;
      const hgt = 1 + r() * r() * 7; const b = building(0.9 + r() * 1.4, hgt, 0.9 + r() * 1.4, cols[i % cols.length], r() < 0.3 ? '#12b5e5' : '#cfd8e0');
      b.position.set(x, 0, z); scene.add(b);
    }
    for (let i = 0; i < 30; i++) { const t = tree(0.8 + r() * 0.8); t.position.set(-13 + r() * 9, 0, -9 + r() * 18); scene.add(t); }
    const road = new THREE.Mesh(new THREE.BoxGeometry(30, 0.05, 1.6), lam('#8d98a5')); road.position.set(-17, 0.03, 0); scene.add(road);
    const road2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 18), lam('#8d98a5')); road2.position.set(-12, 0.03, 0); scene.add(road2);
    const tw = tower(6.5); tw.position.set(-9.5, 0, -3); scene.add(tw);
    // phone
    const phone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.4, 0.2), lam(PAL.navy)); phone.add(body);
    const screen = canvasPlane(340, 680, (x, w, hh) => {
      x.fillStyle = '#0b1626'; x.fillRect(0, 0, w, hh); x.fillStyle = '#1e3350'; x.fillRect(16, 60, w - 32, 200);
      x.fillStyle = '#e8473c'; x.beginPath(); x.moveTo(w / 2 - 22, 130); x.lineTo(w / 2 + 28, 160); x.lineTo(w / 2 - 22, 190); x.fill();
      x.fillStyle = '#12b5e5'; x.fillRect(16, 272, (w - 32) * 0.42, 8); x.fillStyle = '#3a5470'; x.fillRect(16 + (w - 32) * 0.42, 272, (w - 32) * 0.58, 8);
      for (let i = 0; i < 4; i++) { x.fillStyle = '#1e3350'; x.fillRect(16, 310 + i * 90, 110, 70); x.fillStyle = '#3a5470'; x.fillRect(140, 318 + i * 90, 170, 14); x.fillRect(140, 342 + i * 90, 120, 12); }
    }, 1.55);
    screen.position.z = 0.11; phone.add(screen);
    phone.position.set(-22, 6.4, 3); phone.rotation.y = 0.35; scene.add(phone);
    // landing station
    const cls = building(3.2, 2.1, 3.2, '#ffffff', PAL.cyan); cls.position.set(-5.2, 0, 2.5); scene.add(cls);
    const sign = canvasPlane(512, 160, (x, w, hh) => { H.rr(x, 4, 4, w - 8, hh - 8, 20); x.fillStyle = PAL.navy; x.fill(); H.text(x, 'CABLE LANDING STATION', w / 2, 98, H.F.cond(700, 50), '#fff', 'center', 3); }, 2.8);
    sign.position.set(-5.2, 2.75, 4.12); scene.add(sign);
    const man = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12), lam('#6b7a8c')); man.position.set(-1.6, 0.08, 2.5); scene.add(man);
    // routes
    const wire = new THREE.CatmullRomCurve3([new THREE.Vector3(-22, 6.4, 3), new THREE.Vector3(-16, 8.5, 0.5), new THREE.Vector3(-9.5, 6.6, -3)]);
    const landPts = [[-9.5, 0.08, -3], [-9.5, 0.08, -1.1], [-6.6, 0.08, -1.1], [-6.6, 0.08, 2.5], [-3.6, 0.08, 2.5], [-1.6, 0.08, 2.5]].map(a => new THREE.Vector3(...a));
    const fiber = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(landPts, false, 'catmullrom', 0.05), 80, 0.07, 5), cableMat({ color: PAL.cyan, dens: 5, speed: 0.6 })); scene.add(fiber);
    const seaPts = [new THREE.Vector3(-1.6, 0.0, 2.5), new THREE.Vector3(-0.6, -0.8, 2.5)];
    for (let x = 0.5; x <= 46; x += 1.5) { const buried = x < 14; seaPts.push(new THREE.Vector3(x, bedY(x) + (buried ? -0.55 * smooth(0, 3, x) : 0.14), 2.5 + Math.sin(x * 0.15) * 0.6)); }
    const seaCurve = new THREE.CatmullRomCurve3(seaPts);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(seaCurve, 300, 0.11, 6), cableMat({ color: '#1d3352', pulse: PAL.cyan, dens: 10, speed: 0.5, pulseAmt: 1 })); scene.add(cable);
    // x-ray overlay for buried part
    const xr = new THREE.Mesh(new THREE.TubeGeometry(seaCurve, 300, 0.12, 6), cableMat({ color: PAL.orange, dash: true, dens: 4, transparent: true, depthWrite: false }));
    xr.material.depthTest = false; xr.renderOrder = 10; scene.add(xr);
    const wireLine = new THREE.Mesh(new THREE.TubeGeometry(wire, 60, 0.03, 4), cableMat({ color: '#9fd8ee', dash: true, dens: 5, transparent: true })); scene.add(wireLine);
    const f1 = flow(wire, 6, 0.16, '#ffffff'), f2 = flow(fiber.geometry.parameters.path, 8, 0.15, '#ffffff'), f3 = flow(seaCurve, 14, 0.2, '#ffffff');
    scene.add(f1, f2, f3);
    return { scene, camera, dio, phone, tw, cls, fiber, cable, xr, wireLine, f1, f2, f3, seaCurve, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    camRig(st.camera, [
      [0, [-17.5, 8.2, 10.5], [-22, 6.2, 3]],
      [L(0) + 1, [-18, 7.6, 9], [-22, 6.2, 3]],
      [L(1) + 0.5, [-13, 10.5, 19], [-15, 3.5, 0]],
      [L(2) + 0.5, [-5, 7.5, 15], [-5, 1, 1.5]],
      [L(2) + 9, [8, 12, 30], [6, -1.5, 0]],
      [L(3) + 0.3, [-1.2, 4.6, 10.5], [-5, 1.3, 2.5]],
      [L(4) + 0.5, [14, -1.8, 33], [14, -3.8, 0]],
      [L(5) + 0.5, [6, 21, 50], [6, -2, 0]],
      [T.dur, [10, 19, 46], [6, -2, 0]],
    ], lt, 0.15);
    st.phone.position.y = 6.4 + Math.sin(lt * 1.2) * 0.15; st.phone.rotation.y = 0.35 + Math.sin(lt * 0.5) * 0.08;
    setCable(st.fiber, lt, { prog: 0.02 + ap(lt, L(1) + 1.5, 2.5) * 0.98 });
    setCable(st.cable, lt, { prog: 0.02 + ap(lt, L(2) + 3, 6) * 0.98 });
    setCable(st.xr, lt, { op: win(lt, L(4) + 1, T.dur, 0.6) * 0.9 });
    setCable(st.wireLine, lt, { op: ap(lt, L(0) + 1.2, 0.6) });
    updateFlow(st.f1, lt, 0.25, ap(lt, L(0) + 1.5, 0.5));
    updateFlow(st.f2, lt, 0.18, ap(lt, L(1) + 2.5, 0.5));
    updateFlow(st.f3, lt, 0.05, ap(lt, L(2) + 4, 0.5));
    st.dio.surf.material.map.offset.x = lt * 0.01;
  },
  header(st, lt, T) { return { big: 'BAB 2' }; },
  hud(st, h, lt, T) {
    const pj = st.pj, L = T.L.bind(T);
    const ph = pj(new THREE.Vector3(-22, 8.4, 3));
    H.label(h, off(ph, 230, -60), ph, 'PERMINTAAN DATA', { alpha: win(lt, L(0) + 0.8, L(1) + 3), tag: 'PAKET', tagColor: PAL.cyan });
    const tp = pj(new THREE.Vector3(-9.5, 6.8, -3));
    H.label(h, off(tp, 160, -120), tp, 'MENARA SELULER', { alpha: win(lt, L(1) + 0.5, L(2) + 1) });
    const fp = pj(new THREE.Vector3(-6.6, 0.1, 0.6));
    H.label(h, off(fp, -60, 170), null, 'SERAT OPTIK DARAT', { alpha: win(lt, L(1) + 3, L(2) + 2), style: 'cyan', size: 34 });
    // satellite vs cable card
    const sa = win(lt, L(2) + 5.5, L(3) - 0.2, 0.6);
    H.card(h, 1180, 300, 680, 420, { alpha: sa, kicker: 'KAPASITAS INTERNASIONAL AS', title: 'Satelit ≈ 0,37%', titleSize: 76, chip: 'FCC', chipColor: PAL.gray, body: 'Sisanya hampir seluruhnya lewat kabel bawah laut.', draw: (hh, x, y, w) => { hh.fillStyle = '#e4ebf2'; H.rr(hh, x + 34, y + 30, w - 68, 46, 10); hh.fill(); hh.fillStyle = PAL.cyan; H.rr(hh, x + 34, y + 30, (w - 68) * 0.9963 * ap(lt, L(2) + 6, 1.5), 46, 10); hh.fill(); hh.fillStyle = PAL.red; hh.fillRect(x + 34 + (w - 68) * 0.9963, y + 24, 6, 58); H.text(hh, 'KABEL LAUT', x + 50, y + 63, H.F.cond(700, 30), '#fff', 'left', 2); } });
    const cp = pj(new THREE.Vector3(-5.2, 2.2, 2.5));
    H.label(h, off(cp, 300, -170), cp, 'CABLE LANDING STATION', { alpha: win(lt, L(3) + 0.4, L(4) + 0.6), style: 'navy', tag: 'PINTU KELUAR', tagColor: PAL.cyan });
    H.label(h, { x: 1500, y: 470 }, null, 'DATA → PULSA CAHAYA', { alpha: win(lt, L(3) + 5, L(4) + 0.4), size: 38, style: 'cyan' });
    const bp = pj(st.seaCurve.getPointAt(0.12)); const dp = pj(st.seaCurve.getPointAt(0.75));
    H.label(h, off(bp, -40, -260), bp, 'DITANAM DI DASAR LAUT DANGKAL', { alpha: win(lt, L(4) + 1.5, L(5) + 0.5), size: 36, tag: 'TERLINDUNG', tagColor: PAL.orange });
    H.label(h, off(dp, 0, -300), dp, 'DIBARINGKAN DI DASAR LAUT DALAM', { alpha: win(lt, L(4) + 6.5, L(5) + 0.5), size: 36 });
    // stats
    H.stat(h, 470, 330, '600+', 'SISTEM KABEL · AKTIF & RENCANA', { alpha: win(lt, L(5) + 0.4, L(6) + 0.2), align: 'center' });
    H.stat(h, 1450, 330, '1,5 JUTA KM', 'PANJANG TOTAL', { alpha: win(lt, T.w(5, 'kilometer') - 1.5, L(6) + 0.2), align: 'center' });
    const ia = win(lt, L(6) + 0.3, T.dur + 1, 0.6);
    H.card(h, 560, 300, 800, 330, { alpha: ia, kicker: 'GEOCABLES · APRIL 2026', title: '72 sistem kabel laut melayani Indonesia', titleSize: 64, accent: PAL.red, draw: (hh, x, y, w) => {
      const p = ap(lt, L(6) + 2.5, 1.5); const tot = 72; const bw = w - 68;
      hh.fillStyle = PAL.cyan; H.rr(hh, x + 34, y + 20, bw * 42 / tot * p, 64, 10); hh.fill();
      hh.fillStyle = PAL.navy; H.rr(hh, x + 34 + bw * 42 / tot * p + 6, y + 20, Math.max(0, bw * 30 / tot * p - 6), 64, 10); hh.fill();
      if (p > 0.6) { H.text(hh, '42 DOMESTIK', x + 54, y + 64, H.F.cond(700, 36), '#fff', 'left', 2); H.text(hh, '30 INTERNASIONAL', x + 34 + bw - 20, y + 64, H.F.cond(700, 36), '#fff', 'right', 2); }
    } });
  },
};
