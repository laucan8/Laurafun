import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { setupScene, lam, basic, PAL, blobShadow } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeOutBack, lerp } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, infoCard } from './common.js';

let FONT = null;
export async function loadFont() { if (!FONT) FONT = await new FontLoader().loadAsync('/node_modules/three/examples/fonts/helvetiker_bold.typeface.json'); return FONT; }
export function text3d(s, size, depth, mat) { const g = new TextGeometry(s, { font: FONT, size, depth, curveSegments: 4, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 1 }); g.computeBoundingBox(); const bb = g.boundingBox; g.translate(-(bb.max.x + bb.min.x) / 2, 0, -depth / 2); return new THREE.Mesh(g, mat); }
export function studio(o = {}) {
  const S = setupScene({ top: '#cfe8f5', bot: '#f6fafc', fogColor: '#eef6fa', near: 30, far: 90, fov: 36, hemi: 1.5 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(80, 48), basic('#eef4f8')); floor.rotation.x = -Math.PI / 2; S.scene.add(floor);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(13, 13.4, 0.4, 64), lam('#f8fbfd')); plat.position.y = 0.2; S.scene.add(plat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13.1, 0.06, 6, 96), basic(PAL.cyan)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.42; S.scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(6, 0.04, 6, 96), basic('#c9d8e4')); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.42; S.scene.add(ring2);
  return S;
}
const TESTS = [
  { k: 'UJI 1', t: 'SUMBER', pos: [-9.5, 0, -1.5], res: ['DIAKUI PEJABAT KOMDIGI', PAL.green, 'check'] },
  { k: 'UJI 2', t: 'YANG DIUKUR', pos: [-3.4, 0, -5.2], res: ['INTERNASIONAL ≠ SEMUA', PAL.yellow, 'warn'] },
  { k: 'UJI 3', t: 'METODOLOGI', pos: [3.4, 0, -5.2], res: ['TIDAK DIPUBLIKASIKAN', '#8a96a3', 'q'] },
  { k: 'UJI 4', t: 'DATA KABEL', pos: [9.5, 0, -1.5], res: ['24 KABEL ID–SG', PAL.green, 'check'] },
];
export default {
  async build() {
    await loadFont();
    const S = studio(); const { scene, camera } = S;
    const navy = new THREE.MeshLambertMaterial({ color: PAL.navy }); const big = text3d('90%', 3.6, 1.0, navy); big.position.set(0, 0.45, 0.5); scene.add(big);
    const sh = blobShadow(6, 0.15); sh.position.set(0, 0.43, 0.5); scene.add(sh);
    const pillars = TESTS.map((t, i) => {
      const g = new THREE.Group(); g.position.set(...t.pos);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 3.2, 24), lam('#ffffff')); col.position.y = 1.6; g.add(col);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.25, 24), basic(PAL.navy)); band.position.y = 2.9; g.add(band);
      const card = infoCard({ w: 900, h: 520, kicker: t.k, title: t.t, titleSize: 120, accent: PAL.cyan }, 3.6); card.position.y = 4.6; g.add(card);
      g.lookAt(0, 0, 18); g.rotation.x = 0; g.rotation.z = 0; scene.add(g);
      return { g, card, t };
    });
    // donut (illustrative split, no numbers)
    const donut = new THREE.Group();
    const segA = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.45, 8, 48, Math.PI * 0.9), lam(PAL.cyan)); donut.add(segA);
    const segB = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.45, 8, 48, Math.PI * 1.06), lam(PAL.green)); segB.rotation.z = Math.PI * 0.94; donut.add(segB);
    donut.position.set(6.5, 3.2, 3); donut.rotation.y = -0.35; scene.add(donut);
    // 24 cable pills
    const pills = []; for (let i = 0; i < 24; i++) { const live = i < 17; const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 3, 8), live ? lam(PAL.cyan) : new THREE.MeshLambertMaterial({ color: '#9fb0c2', transparent: true, opacity: 0.45 })); const a = -0.95 + i / 23 * 1.9; m.position.set(Math.sin(a) * 8.2, 1.05, 3.2 + Math.cos(a) * 2.4); scene.add(m); pills.push(m); }
    // capacity tanks
    const tank = (x, fill, color) => { const g = new THREE.Group(); const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 5, 32, 1, true), new THREE.MeshLambertMaterial({ color: '#d9eef7', transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); glass.position.y = 2.5; g.add(glass); const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.25, 32), lam(PAL.navy)); g.add(base); const liq = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 1, 32), lam(color)); g.add(liq); g.userData = { liq, fill }; g.position.set(x, 0.45, 2); scene.add(g); return g; };
    const tSG = tank(-3.2, 0.11, PAL.cyan), tID = tank(3.2, 0.67, PAL.orange);
    return { scene, camera, big, navy, pillars, donut, pills, tSG, tID, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    const pk = (i, d = 9) => { const p = st.pillars[i].g.position; const dir = new THREE.Vector3(-p.x, 0, 18 - p.z).normalize(); return [[p.x + dir.x * d, 6.2, p.z + dir.z * d], [p.x, 4.0, p.z]]; };
    const kk = (t, i, d) => { const [a, b] = pk(i, d); return [t, a, b]; };
    camRig(st.camera, [
      [0, [0, 10, 28], [0, 3.0, 0]],
      [L(0) + 2, [0, 7, 21], [0, 3.0, 0]],
      kk(L(1) + 0.4, 0, 10), kk(L(2) - 0.3, 0, 10), kk(L(2) + 0.5, 1, 10.5),
      [L(3) + 0.5, [3.5, 5, 14], [4.5, 2.8, 2]],
      kk(L(4) + 0.5, 2, 10.5), kk(L(5) - 0.3, 2, 10.5), kk(L(5) + 0.5, 3, 11),
      [L(5) + 6, [0, 6.5, 17], [0, 1.5, 2]],
      [L(6) + 0.5, [0, 4.6, 13.5], [0, 2.4, 2]],
      [L(7) + 0.5, [0, 8, 24], [0, 2.4, 0]],
      [L(8) + 0.5, [0, 4, 11], [0, 2.2, 0.5]],
      [T.dur, [0, 2.6, 4.5], [0, 2.0, 0.5]],
    ], lt, 0.1);
    st.big.rotation.y = Math.sin(lt * 0.35) * 0.12;
    const sink = win(lt, L(1) + 0.2, L(7) + 0.2, 0.8);
    st.big.scale.setScalar(Math.max(0.001, ap(lt, 0.5, 1.2, easeOutBack)));
    st.big.position.y = 0.45 - sink * 5.2; st.big.visible = sink < 0.98;
    st.navy.color.set(lt > L(8) + 1.5 ? PAL.red : PAL.navy);
    st.pillars.forEach((p, i) => { const at = [L(1), L(2), L(4), L(5)][i]; const a = ap(lt, Math.min(at, 1.2 + i * 0.4), 1.0, easeOutBack); p.g.scale.setScalar(Math.max(0.001, a)); });
    const da = win(lt, L(3) + 0.3, L(4) + 0.3, 0.6); st.donut.scale.setScalar(Math.max(0.001, easeOutBack(da))); st.donut.rotation.z = lt * 0.3; st.donut.visible = da > 0.01;
    st.pills.forEach((m, i) => { const a = win(lt, L(5) + 1.5 + i * 0.08, L(6) + 0.3, 0.4); m.scale.setScalar(Math.max(0.001, easeOutBack(a))); m.visible = a > 0.01; });
    [st.tSG, st.tID].forEach((t, i) => { const a = win(lt, L(6) + 0.4, L(7) + 0.3, 0.6); t.scale.setScalar(Math.max(0.001, a)); t.visible = a > 0.01; const f = t.userData.fill * ap(lt, L(6) + 2 + i * 6, 2); t.userData.liq.scale.y = Math.max(0.01, f * 5); t.userData.liq.position.y = 0.13 + f * 2.5; });
  },
  header() { return { big: 'BAB 6' }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj;
    st.pillars.forEach((p, i) => {
      const at = [T.w(1, 'Juni') + 1.0, T.w(2, 'berbeda'), T.w(4, 'menemukan') + 0.5, T.w(5, '17')][i];
      const v = p.g.localToWorld(new THREE.Vector3(0, 2.75, 0)); const q = pj(v); if (!q) return;
      const a = ap(lt, at, 0.5) * (1 - ap(lt, L(6), 0.5)); if (a <= 0) return;
      const [s, c, ic] = p.t.res; const font = H.F.cond(700, 30); const w = H.measure(h, s, font, 2) + 90;
      h.save(); h.globalAlpha = a; const sc = 0.7 + 0.3 * easeOutBack(clamp(a)); h.translate(q.x, q.y + 6); h.scale(sc, sc);
      H.rr(h, -w / 2, -26, w, 52, 26); h.fillStyle = c; h.fill(); H.icon(h, ic, -w / 2 + 32, 0, 36, '#fff'); H.text(h, s, -w / 2 + 62, 11, font, '#fff', 'left', 2); h.restore();
    });
    const dp = pj(new THREE.Vector3(6.5, 5.4, 3));
    H.label(h, off(dp, 0, -110), null, 'ILUSTRASI · PROPORSI TIDAK DIKETAHUI', { alpha: win(lt, L(3) + 0.8, L(4) + 0.3, 0.5), size: 30, style: 'navy' });
    const ca = pj(new THREE.Vector3(8.5, 3.2, 1.6)), cb = pj(new THREE.Vector3(4.6, 3.2, 3.6));
    H.label(h, off(ca, 120, -60), ca, 'INTERNASIONAL', { alpha: win(lt, L(3) + 1.5, L(4) + 0.3, 0.5), size: 34, style: 'cyan' });
    H.label(h, off(cb, -150, 140), cb, 'CACHE & PUSAT DATA LOKAL', { alpha: win(lt, L(3) + 3, L(4) + 0.3, 0.5), size: 34, tag: 'TIDAK MENYEBERANG', tagColor: PAL.green, tagFg: '#fff' });
    H.stat(h, 960, 270, '24 SISTEM KABEL', '17 BEROPERASI · 7 DIRENCANAKAN', { alpha: win(lt, L(5) + 3, L(6) + 0.3, 0.5), align: 'center', size: 90 });
    const ga = win(lt, L(6) + 1, L(7) + 0.3, 0.5);
    const s1 = pj(new THREE.Vector3(-3.2, 5.9, 2)), s2 = pj(new THREE.Vector3(3.2, 5.9, 2));
    if (s1) H.label(h, off(s1, -40, -60), null, 'SINGAPURA · 93 Tbps TERPASANG', { alpha: ga, size: 32, style: 'navy', tag: 'PAKAI ±11%', tagColor: PAL.cyan });
    if (s2) H.label(h, off(s2, 40, -60), null, 'INDONESIA · KAPASITAS MENYALA', { alpha: ap(lt, L(6) + 6.5, 0.5) * ga, size: 32, style: 'navy', tag: 'PAKAI ±67%', tagColor: PAL.orange });
    H.label(h, { x: 960, y: 820 }, null, 'OECD (DATA TELEGEOGRAPHY), 2021–2023', { alpha: ga, size: 26 });
    // verdict
    const va = win(lt, L(7) + 0.3, L(8) + 0.4, 0.4);
    if (va > 0) {
      h.save(); h.globalAlpha = va; h.fillStyle = 'rgba(240,246,250,0.75)'; h.fillRect(0, 0, 1920, 1080); h.restore();
      H.stamp(h, 960, 360, 'BENAR SEBAGIAN\nPERLU KONTEKS', PAL.orange, ap(lt, L(7) + 0.3, 0.45), -0.06, 78);
      const items = [['check', PAL.green, 'Ketergantungan internasional ke Singapura: nyata & diakui pemerintah'], ['q', '#8a96a3', 'Angka tepat 90%: belum bisa diverifikasi independen'], ['cross', PAL.red, 'Ditafsirkan sebagai 90% SELURUH internet: keliru']];
      items.forEach(([ic, c, s], i) => { const a = ap(lt, L(7) + 3 + i * 4.5, 0.5); if (a <= 0) return; h.save(); h.globalAlpha = a * va; const y = 560 + i * 92; H.rr(h, 360, y, 1200, 74, 14); h.fillStyle = '#fff'; h.fill(); h.fillStyle = c; H.rr(h, 360, y, 74, 74, 14); h.fill(); H.icon(h, ic, 397, y + 37, 46, '#fff'); H.text(h, s, 460, y + 48, H.F.sans(600, 32), PAL.navy); h.restore(); });
    }
    H.label(h, { x: 960, y: 300 }, null, 'SIAPA YANG DIUNTUNGKAN?', { alpha: win(lt, T.w(8, 'siapa'), T.dur, 0.4), size: 64, style: 'red' });
  },
};
