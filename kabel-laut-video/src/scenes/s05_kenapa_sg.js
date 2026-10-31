import * as THREE from 'three';
import { lam, basic, PAL, P, CITY, cableMat, tubeFrom, flow, updateFlow } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, mulberry, lerp, inv } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, mapWorld, setCable, cityV, routePts, INTL_SG, DOMESTIC, ROUTES } from './common.js';

function planeMesh() { const g = new THREE.Group(); const m = lam('#ffffff'); const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), m); g.add(f); const w = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.5), m); g.add(w); const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.02), lam(PAL.red)); t.position.set(-0.22, 0.06, 0); g.add(t); return g; }
function arc(a, b, hgt) { const A = P(a[0], a[1], 0.3), B = P(b[0], b[1], 0.3); const M = A.clone().lerp(B, 0.5); M.y = hgt; return new THREE.QuadraticBezierCurve3(A, M, B); }
export default {
  async build({ GEO }) {
    const W = mapWorld(GEO, { near: 70, far: 170 });
    const { scene, camera } = W;
    INTL_SG.forEach(n => W.add(n, PAL.cyan, 0.075));
    DOMESTIC.forEach(n => W.add(n, PAL.green, 0.055, { dens: 2 }));
    // telegraph (sepia dashed, off-map directions)
    const tg = [[[103.85, 1.3], [99, 4.5], [93, 7.5], [88.5, 9]], [[103.85, 1.3], [106, -6], [112, -12], [116, -15]], [[103.85, 1.3], [108, 8], [112, 16], [114.17, 22.3]]].map(r => { const m = tubeFrom(r.map(p => P(p[0], p[1], 0.35)), 0.06, cableMat({ color: '#a07850', dash: true, dens: 3, transparent: true }), 120, 5); scene.add(m); return m; });
    // SG hub + landing station pins
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 24), basic(PAL.red)); hub.position.copy(cityV('singapore', 0.22)); scene.add(hub);
    const ls = ['changi', 'tuas', 'katong'].map(k => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), basic(PAL.navy)); m.position.copy(cityV(k, 0.5)); scene.add(m); return m; });
    // data centers rising
    const r = mulberry(31); const dcs = [];
    for (let i = 0; i < 46; i++) { const c = i < 34 ? [103.62 + r() * 0.42, 1.25 + r() * 0.15] : [103.5 + r() * 0.5, 1.48 + r() * 0.25]; const hgt = 0.08 + r() * 0.22; const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1, 0.06), lam(r() < 0.25 ? PAL.cyan : '#eef2f6')); b.userData = { h: hgt, d: r() }; b.position.copy(P(c[0], c[1], 0.13)); scene.add(b); dcs.push(b); }
    // ships through Malacca
    const lane = new THREE.CatmullRomCurve3([[93, 7], [97.5, 5.6], [100.6, 3.4], [102.8, 1.7], [103.9, 1.18], [105, 1.6], [107.5, 4.5], [110.5, 9], [113, 14]].map(p => P(p[0], p[1], 0.16)));
    const ships = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.07, 0.08), lam('#ffffff'), 28); ships.frustumCulled = false; scene.add(ships);
    const laneLine = tubeFrom(lane.points, 0.025, cableMat({ color: '#ffffff', dash: true, dens: 12, transparent: true, opacity: 0.8 }), 200, 4); scene.add(laneLine);
    // planes (airport analogy)
    const from = [CITY.medan, CITY.pontianak, CITY.surabaya, CITY.makassar, CITY.jakarta, CITY.balikpapan];
    const inbound = from.map(c => arc(c, CITY.singapore, 2.2)); const outbound = [arc(CITY.singapore, [92, 9], 3), arc(CITY.singapore, [114, 22], 3), arc(CITY.singapore, [112, -14], 3)];
    const planes = [...inbound, ...outbound].map((c, i) => { const p = planeMesh(); p.scale.setScalar(1.1); scene.add(p); return { p, c, out: i >= inbound.length, i }; });
    const arcLines = [...inbound, ...outbound].map(c => { const m = tubeFrom(c.getPoints(30), 0.02, cableMat({ color: '#ffffff', dash: true, dens: 6, transparent: true, opacity: 0.9 }), 60, 4); scene.add(m); return m; });
    // tromboning path
    const ispA = P(106.6, -6.3, 0.3), ispB = P(107.15, -6.05, 0.3);
    const tPts = [ispA, ...routePts('matrix', 0.32).slice(1, -1), P(103.85, 1.3, 0.35), ...routePts('b3js', 0.32).slice(1, -1).reverse(), ispB];
    const trom = tubeFrom(tPts, 0.06, cableMat({ color: PAL.red, pulse: '#ffffff', dens: 6, speed: 0.6, transparent: true }), 300, 5); scene.add(trom);
    const tflow = flow(trom.userData.curve, 10, 0.12, '#ffffff'); scene.add(tflow);
    const iix = P(106.9, -6.2, 0.32); const local = new THREE.QuadraticBezierCurve3(ispA, iix.clone().setY(0.9), ispB);
    const loc = tubeFrom(local.getPoints(30), 0.05, cableMat({ color: PAL.green, pulse: '#ffffff', dens: 4, speed: 0.8, transparent: true }), 60, 5); scene.add(loc);
    const lflow = flow(local, 5, 0.06, '#ffffff'); scene.add(lflow);
    const iixRing = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 32), new THREE.MeshBasicMaterial({ color: PAL.green, transparent: true, side: THREE.DoubleSide })); iixRing.rotation.x = -Math.PI / 2; iixRing.position.copy(iix); scene.add(iixRing);
    return { scene, camera, W, tg, hub, ls, dcs, ships, lane, laneLine, planes, arcLines, trom, tflow, loc, lflow, iixRing, ispA, ispB, iix, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    camRig(st.camera, [
      [0, [-2, 36, 30], [-3, 0, 0]],
      [L(0) + 3, [-6, 26, 22], [-6, 0, 0]],
      [L(1) + 0.5, [-6, 34, 28], [-5, 0, 0]],
      [L(2) + 0.5, [-10.5, 6.5, 6.2], [-11.0, 0, 1.8]],
      [L(3) + 0.5, [-10.2, 3.0, 4.0], [-11.1, 0.2, 1.65]],
      [L(4) + 0.5, [-10.4, 4.2, 5], [-11.0, 0.2, 1.7]],
      [L(5) + 0.3, [-8, 14, 13], [-9, 0, 2.5]],
      [L(6) + 0.5, [-2, 25, 22], [-3, 0, 1.5]],
      [L(7) + 0.5, [-5.5, 17, 16.5], [-9.4, 0, 4.6]],
      [L(8) + 0.5, [-7.1, 3.6, 12.6], [-8.0, 0, 9.3]],
      [L(9) + 0.5, [2, 30, 27], [0, 0, 1]],
      [T.dur, [3, 28, 25], [0, 0, 1]],
    ], lt, 0.12);
    const intl = ap(lt, L(2) - 0.5, 2.5);
    Object.entries(st.W.cables).forEach(([n, c], i) => { const dom = DOMESTIC.includes(n); setCable(c, lt, dom ? { op: ap(lt, L(9) + 0.5, 1.0), prog: ap(lt, L(9) + 0.5 + i * 0.08, 1.5) } : { prog: Math.max(0.02, ap(lt, L(2) - 0.5 + i * 0.25, 1.5)), op: lt < L(7) || lt > L(9) ? 1 : 0.35 }); });
    st.tg.forEach((m, i) => setCable(m, lt, { op: win(lt, L(1) + i * 0.3, L(2) + 0.5, 0.5), prog: ap(lt, L(1) + i * 0.3, 2) }));
    st.ls.forEach((m, i) => { const a = ap(lt, L(2) + 2.5 + i * 0.3, 0.5); m.scale.y = Math.max(0.01, a); m.visible = a > 0; });
    st.hub.scale.setScalar(1 + 0.2 * Math.sin(lt * 4));
    st.dcs.forEach((b, i) => { const a = ap(lt, L(3) + 0.3 + b.userData.d * 3, 0.8, easeOut); b.scale.y = Math.max(0.001, a * b.userData.h); b.position.y = 0.13 + b.scale.y / 2; b.visible = a > 0; });
    // ships
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), tan = new THREE.Vector3();
    const sv = win(lt, 0.5, L(1) + 0.5, 0.6) + win(lt, L(2) + 0.5, L(5), 0.5) * 0.6;
    for (let i = 0; i < 28; i++) { const u = ((i / 28) + lt * 0.006) % 1; st.lane.getPointAt(u, v); st.lane.getTangentAt(u, tan); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-tan.z, tan.x)); s.setScalar(clamp(sv)); m.compose(v, q, s); st.ships.setMatrixAt(i, m); }
    st.ships.instanceMatrix.needsUpdate = true; st.ships.visible = sv > 0.01; setCable(st.laneLine, lt, { op: clamp(sv) * 0.8 });
    // planes
    const pa = win(lt, L(6) + 0.3, L(7) + 0.2, 0.6);
    st.planes.forEach(({ p, c, out, i }) => { const base = out ? 0.5 : 0; const u = clamp(((lt - L(6)) * 0.12 - base - i * 0.04) % 1.3); const uu = clamp(u); c.getPointAt(uu, v); c.getTangentAt(uu, tan); p.position.copy(v); p.lookAt(v.clone().add(tan)); p.rotateY(-Math.PI / 2); p.visible = pa > 0.01 && u > 0 && u < 1; p.scale.setScalar(1.1 * pa); });
    st.arcLines.forEach(a => setCable(a, lt, { op: pa * 0.8 }));
    const ta = win(lt, L(7) + 1, L(8) + 3.5, 0.6);
    setCable(st.trom, lt, { op: ta, prog: ap(lt, L(7) + 1, 3) }); updateFlow(st.tflow, lt, 0.12, ta * ap(lt, L(7) + 3, 0.5));
    const la = win(lt, L(8) + 2.5, L(9) + 4, 0.6);
    setCable(st.loc, lt, { op: la, prog: ap(lt, L(8) + 2.5, 1) }); updateFlow(st.lflow, lt, 0.5, la);
    st.iixRing.visible = la > 0.01; st.iixRing.scale.setScalar(1 + 0.3 * Math.sin(lt * 4)); st.iixRing.material.opacity = la;
  },
  header(st, lt, T) { return { big: 'BAB 5' }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj;
    const ra = win(lt, 0.8, L(1) + 0.3, 0.6);
    H.regionLabel(h, pj(P(98.5, 3.8, 0.2)), 'SELAT MALAKA', ra, 34);
    H.regionLabel(h, pj(P(112, 9, 0.2)), 'LAUT CINA SELATAN', ra, 34);
    H.regionLabel(h, pj(P(96, -6, 0.2)), 'SAMUDRA HINDIA', ra, 34);
    H.regionLabel(h, pj(P(111, -4.8, 0.2)), 'LAUT JAWA', ra * 0.8, 28);
    const sg = pj(cityV('singapore'));
    H.pin(h, sg, 'SINGAPURA', ap(lt, 1.2, 0.5) * (1 - win(lt, L(2) + 1, L(5), 0.4)), { dot: PAL.red });
    H.label(h, { x: 1450, y: 330 }, null, 'ABAD KE-19 · TELEGRAF', { alpha: win(lt, L(1) + 0.6, L(2), 0.5), style: 'navy', tag: 'SEJARAH', tagColor: '#c9a27a' });
    H.stat(h, 1500, 300, '± 25 SISTEM', '3 LOKASI STASIUN PENDARATAN', { alpha: win(lt, L(2) + 1.5, L(3), 0.5), align: 'center' });
    ['changi', 'tuas', 'katong'].forEach((k, i) => { const p = pj(cityV(k, 0.85)); H.pin(h, p, k.toUpperCase(), win(lt, L(2) + 2.7 + i * 0.3, L(3), 0.4), { left: i === 1, dy: i === 2 ? 28 : -14 }); });
    H.stat(h, 1500, 300, '≈ 1.650 MW', 'PUSAT DATA SINGAPURA · Q3 2026 (EST.)', { alpha: win(lt, L(3) + 2.5, L(4) + 0.2, 0.5), align: 'center' });
    ['AMAZON', 'GOOGLE', 'MICROSOFT', 'META'].forEach((s, i) => H.label(h, { x: 1180 + (i % 2) * 330, y: 360 + Math.floor(i / 2) * 110 }, null, s, { alpha: win(lt, L(4) + 1 + i * 0.5, L(5), 0.4), size: 44, style: i % 2 ? 'white' : 'navy' }));
    // cost comparison card
    const ca = win(lt, L(5) + 0.3, L(6) + 0.2, 0.5);
    H.card(h, 1120, 280, 740, 420, { alpha: ca, kicker: 'LOGIKA OPERATOR', title: 'Sewa ke Singapura vs jalur langsung', titleSize: 54, accent: PAL.cyan, draw: (hh, x, y, w) => {
      const rows = [['KE SINGAPURA', 'dekat · banyak pilihan · murah', PAL.cyan, 0.85], ['LANGSUNG KE BENUA LAIN', 'jauh · modal besar · mahal', PAL.red, 0.35]];
      rows.forEach(([a, b, c, f], i) => { const yy = y + 20 + i * 100; H.text(hh, a, x + 34, yy + 26, H.F.cond(700, 32), PAL.navy, 'left', 2); hh.fillStyle = '#e4ebf2'; H.rr(hh, x + 34, yy + 40, w - 68, 26, 8); hh.fill(); hh.fillStyle = c; H.rr(hh, x + 34, yy + 40, (w - 68) * f * ap(lt, L(5) + 1 + i * 0.4, 1), 26, 8); hh.fill(); H.text(hh, b, x + 34, yy + 92, H.F.mono(500, 20), PAL.gray); });
    } });
    H.label(h, { x: 1500, y: 300 }, null, '✈  SEPERTI BANDARA TRANSIT', { alpha: win(lt, L(6) + 0.8, L(7), 0.5), size: 46, style: 'navy', tag: 'HUB', tagColor: PAL.red, tagFg: '#fff' });
    // tromboning
    const ia = pj(st.ispA), ib = pj(st.ispB);
    const tA = win(lt, L(7) + 0.5, L(9), 0.5);
    H.pin(h, ia, 'ISP A', tA, { left: true, dot: PAL.navy }); H.pin(h, ib, 'ISP B', tA, { dy: 26 });
    H.label(h, { x: 1460, y: 320 }, null, 'TROMBONING', { alpha: win(lt, L(7) + 2, L(8) + 0.5, 0.5), size: 60, style: 'red' });
    H.label(h, { x: 1460, y: 420 }, null, 'JAKARTA → SINGAPURA → JAKARTA', { alpha: win(lt, L(7) + 3.5, L(8) + 0.5, 0.5), size: 34 });
    const ip = pj(st.iix.clone().setY(0.9));
    H.label(h, off(ip, 260, -180), ip, 'IIX · APJII', { alpha: win(lt, L(8) + 2.5, L(9) + 2, 0.5), style: 'navy', tag: 'PERTUKARAN LOKAL', tagColor: PAL.green, tagFg: '#fff' });
    const ba = win(lt, L(8) + 5, L(9) + 0.5, 0.5);
    H.card(h, 1150, 470, 710, 300, { alpha: ba, kicker: 'PUNCAK TRAFIK IIX', accent: PAL.green, draw: (hh, x, y, w) => {
      H.hbars(hh, x + 34, y + 10, w - 60, [{ label: '2021', value: 1.3, valueLabel: '1,3 Tbps', color: '#9fd8b4' }, { label: 'AKHIR 2024', value: 14, valueLabel: '≈ 14 Tbps', color: PAL.green }], ap(lt, L(8) + 6, 2), { rowH: 80 });
    } });
    H.label(h, { x: 560, y: 300 }, null, 'DOMESTIK: BISA BERPUTAR DI DALAM NEGERI', { alpha: win(lt, L(9) + 1, T.dur, 0.5), size: 36, style: 'white', tag: 'HIJAU', tagColor: PAL.green, tagFg: '#fff' });
    H.label(h, { x: 1420, y: 400 }, null, 'INTERNASIONAL → SINGAPURA', { alpha: win(lt, L(9) + 2.5, T.dur, 0.5), size: 36, style: 'navy', tag: 'BIRU', tagColor: PAL.cyan });
  },
};
