import * as THREE from 'three';
import { lam, basic, PAL, P, CITY, cableMat, tubeFrom, flow, updateFlow } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, mulberry, lerp, inv, holdKeys } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, mapWorld, setCable, cityV, routePts, INTL_SG, DOMESTIC, ROUTES } from './common.js';

function xMark(color = PAL.red, s = 0.5) { const g = new THREE.Group(); const m = basic(color); for (const r of [0.78, -0.78]) { const b = new THREE.Mesh(new THREE.BoxGeometry(s, 0.09, 0.09), m); b.rotation.y = r; g.add(b); } return g; }
export default {
  async build({ GEO }) {
    const W = mapWorld(GEO, { near: 70, far: 180 });
    const { scene, camera } = W;
    INTL_SG.forEach(n => W.add(n, PAL.cyan, 0.075));
    DOMESTIC.forEach(n => W.add(n, PAL.green, 0.055, { dens: 2 }));
    ['seaus', 'bifrost_jkt', 'bifrost_mdo', 'dumai_melaka', 'png_jyp', 'jkt_au'].forEach(n => W.add(n, PAL.cyan, 0.075));
    // Luzon strait cables (illustrative)
    const lz = []; for (let i = 0; i < 8; i++) { const pts = [[114.3 + i * 0.08, 22.15 - i * 0.06], [117.5, 21.2 + (i - 3.5) * 0.18], [120.4 + (i - 3.5) * 0.12, 21.05 + (i - 3.5) * 0.16], [122.8, 22.2 + i * 0.25], [126, 24 + i * 0.12]].map(p => P(p[0], p[1], 0.17)); const m = tubeFrom(pts, 0.05, cableMat({ color: PAL.cyan, dens: 3, transparent: true }), 120, 5); scene.add(m); lz.push(m); }
    const quake = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 48), new THREE.MeshBasicMaterial({ color: PAL.red, transparent: true, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.copy(P(120.6, 21.4, 0.3)); scene.add(r); return r; });
    const x1 = xMark(); x1.position.copy(P(105.75, -2.8, 0.3)); scene.add(x1);
    const x2 = xMark(PAL.red, 0.7); x2.position.copy(P(137.4, -1.45, 0.3)); scene.add(x2);
    const sgRed = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24), basic(PAL.red)); sgRed.position.copy(cityV('singapore', 0.24)); scene.add(sgRed);
    const sgRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 40), new THREE.MeshBasicMaterial({ color: PAL.red, transparent: true, side: THREE.DoubleSide })); sgRing.rotation.x = -Math.PI / 2; sgRing.position.copy(cityV('singapore', 0.26)); scene.add(sgRing);
    // traffic flows
    const fMx = flow(W.cables.matrix.userData.curve, 10, 0.1, '#ffffff'), fB3 = flow(W.cables.b3js.userData.curve, 14, 0.1, '#fff4c2'); scene.add(fMx, fB3);
    const fSeaus = flow(W.cables.seaus.userData.curve, 14, 0.12, '#fff4c2'); scene.add(fSeaus);
    // satellites
    const sat = new THREE.Group(); const sb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), lam('#e9eef3')); sat.add(sb); for (const s of [-1, 1]) { const pn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.6), lam('#2f5fa8')); pn.position.x = s * 1.1; sat.add(pn); } const dish = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 12, 1, true), lam('#ffffff', { side: THREE.DoubleSide })); dish.position.y = -0.35; dish.rotation.x = Math.PI; sat.add(dish); sat.scale.setScalar(1.8); scene.add(sat);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: PAL.yellow, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })); scene.add(beam);
    const star = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.08, 0.28), basic('#13243b'), 60); star.frustumCulled = false; scene.add(star);
    // two-way arcs
    const jk = cityV('jakarta', 0.3), sg = cityV('singapore', 0.3);
    const a1 = new THREE.QuadraticBezierCurve3(jk.clone().add(new THREE.Vector3(0.3, 0, 0)), jk.clone().lerp(sg, 0.5).add(new THREE.Vector3(1.8, 3, 0)), sg.clone().add(new THREE.Vector3(0.3, 0, 0)));
    const a2 = new THREE.QuadraticBezierCurve3(sg.clone().add(new THREE.Vector3(-0.3, 0, 0)), jk.clone().lerp(sg, 0.5).add(new THREE.Vector3(-1.8, 3, 0)), jk.clone().add(new THREE.Vector3(-0.3, 0, 0)));
    const arc1 = tubeFrom(a1.getPoints(40), 0.09, cableMat({ color: PAL.red, dens: 5, speed: 0.8, transparent: true }), 80, 6), arc2 = tubeFrom(a2.getPoints(40), 0.09, cableMat({ color: PAL.orange, dens: 5, speed: 0.8, transparent: true }), 80, 6); scene.add(arc1, arc2);
    return { scene, camera, W, lz, quake, x1, x2, sgRed, sgRing, fMx, fB3, fSeaus, sat, beam, star, arc1, arc2, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    camRig(st.camera, holdKeys([
      [0, [2, 31, 28], [0, 0, 1]],
      [L(1) + 0.5, [-7.5, 11, 12], [-9.4, 0, 4.4]],
      [L(3) + 0.2, [23.5, 9, 13], [22.5, 0, 4.6]],
      [L(4) + 0.5, [6, 13, -7], [5.5, 0, -18]],
      [L(7) - 0.2, [-9.2, 9, 9], [-11, 0, 2]],
      [L(9) + 0.2, [5, 31, 27], [5, 0, 3]],
      [L(10) + 0.2, [17, 19, 13], [18, 0, -3.5]],
      [L(11) + 0.2, [5, 30, 24], [6, 0, -1]],
      [L(12) + 0.2, [-10.5, 10, 12], [-12, 0, 3]],
      [L(13) + 0.2, [4, 30, 25], [5, 0, 0]],
      [L(14) + 0.2, [0, 24, 33], [0, 3, 1]],
      [L(16) + 0.2, [-6.5, 14, 15], [-9.5, 0, 4.8]],
      [T.dur - 3, [-4, 22, 22], [-7, 0, 3]],
    ], 1.8), lt, 0.12);
    const s3 = lt > L(7) + 1.2; const s1 = lt > L(2) + 1 && lt < L(3);
    Object.entries(st.W.cables).forEach(([n, c]) => {
      const intl = INTL_SG.includes(n); const dom = DOMESTIC.includes(n);
      let o = { op: 1 };
      if (n === 'matrix' && s1) o.color = PAL.red; else if (intl) o.color = PAL.cyan;
      if (n === 'b3js' && s1) o.color = PAL.orange;
      if (intl && s3) { o.color = Math.floor(lt * 2.5) % 2 ? PAL.red : '#c97a74'; o.op = lt > L(9) ? 0.45 : 1; }
      if (n === 'smpcs') o.color = lt > L(3) + 2 && lt < L(4) ? PAL.red : PAL.green;
      if (['seaus', 'bifrost_jkt', 'bifrost_mdo', 'dumai_melaka', 'png_jyp', 'jkt_au'].includes(n)) o.color = PAL.cyan;
      if (n === 'seaus' && lt > L(10)) o.color = PAL.orange;
      if ((n === 'bifrost_jkt' || n === 'bifrost_mdo') && lt > L(11)) o.color = PAL.orange;
      if (n === 'bifrost' && lt > L(11) && s3) o.color = lt > L(13) + 3 && lt < L(14) ? (Math.floor(lt * 3) % 2 ? PAL.red : PAL.orange) : PAL.orange, o.op = 1;
      if (n === 'dumai_melaka' && lt > L(12)) o.color = PAL.orange;
      if (dom) o.color = PAL.green, o.op = lt > L(9) && lt < L(10) ? 1 : (s3 ? 0.9 : 0.75);
      if (lt > L(13) && lt < L(14) && ['seaus', 'bifrost_jkt', 'bifrost_mdo', 'dumai_melaka'].includes(n)) o.op = 0.55 + 0.45 * Math.sin(lt * 5);
      setCable(c, lt, o);
    });
    st.x1.visible = s1; st.x1.scale.setScalar(1 + 0.15 * Math.sin(lt * 6));
    st.x2.visible = lt > L(3) + 2 && lt < L(4); st.x2.scale.setScalar(1 + 0.15 * Math.sin(lt * 6));
    updateFlow(st.fMx, lt, 0.08, lt < L(2) + 1 ? win(lt, L(1), L(3), 0.4) : 0, [0, 1]);
    updateFlow(st.fB3, lt, 0.08, s1 ? 1 : 0);
    updateFlow(st.fSeaus, lt, 0.06, win(lt, L(10) + 1, L(14), 0.5));
    // quake
    const qa = win(lt, L(5) + 0.5, L(7), 0.4);
    st.quake.forEach((r, i) => { const u = ((lt * 0.6 + i / 3) % 1); r.scale.setScalar(0.5 + u * 5); r.material.opacity = (1 - u) * qa; r.visible = qa > 0.01; });
    st.lz.forEach((m, i) => setCable(m, lt, { color: lt > L(5) + 2 + i * 0.35 && lt < L(7) ? PAL.red : PAL.cyan, op: 1 }));
    st.sgRed.visible = s3; const pr = (lt % 1.2) / 1.2; st.sgRing.visible = s3; st.sgRing.scale.setScalar(1 + pr * 3); st.sgRing.material.opacity = (1 - pr);
    // satellite
    const sa = win(lt, L(14) + 0.3, L(15) + 0.5, 0.6);
    st.sat.visible = sa > 0.01; st.sat.position.set(-6 + Math.sin(lt * 0.3) * 1.5, 8.5, 4); st.sat.rotation.y = lt * 0.2; st.sat.scale.setScalar(1.8 * sa);
    st.beam.visible = sa > 0.01; st.beam.position.set(st.sat.position.x, 5, 4.5); st.beam.material.opacity = 0.12 * sa;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(); const sl = win(lt, L(15) + 0.2, L(16) + 0.5, 0.6); const r = mulberry(2);
    for (let i = 0; i < 60; i++) { const lane = i % 6, k = Math.floor(i / 6); const u = ((k / 10) + lt * 0.03 + lane * 0.07) % 1; v.set(-30 + u * 60, 6.5 + lane * 0.35, -14 + lane * 5 + u * 6); s.setScalar(sl); m.compose(v, q, s); st.star.setMatrixAt(i, m); }
    st.star.instanceMatrix.needsUpdate = true; st.star.visible = sl > 0.01;
    const ta = win(lt, L(16) + 0.5, T.dur, 0.6); setCable(st.arc1, lt, { op: ta, prog: ap(lt, L(16) + 0.5, 1.5) }); setCable(st.arc2, lt, { op: ta, prog: ap(lt, L(16) + 2.5, 1.5) });
  },
  header(st, lt, T) {
    const L = T.L.bind(T); const simT = Math.max(0, lt - L(0)) * 37; const mm = Math.floor(simT / 60), ss = Math.floor(simT % 60);
    const state = lt > L(7) + 1.2 ? 'cut' : (lt > L(2) + 1 && lt < L(3)) ? 'warn' : 'active';
    return { big: `T+${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, date: 'SIMULASI', route: { state } };
  },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj;
    const scen = [[L(1), L(4), 'SKENARIO 1', 'SATU KABEL RUSAK', PAL.yellow, 'SERING'], [L(4), L(7), 'SKENARIO 2', 'BANYAK KABEL SERENTAK', PAL.orange, 'LANGKA'], [L(7), T.dur, 'SKENARIO 3', 'KORIDOR SINGAPURA LUMPUH', PAL.red, 'HIPOTETIS']];
    scen.forEach(([a, b, k, t, c, tag]) => { const al = win(lt, a + 0.2, b - 0.2, 0.4); if (al <= 0) return; h.save(); h.globalAlpha = al; H.rr(h, 36, 216, 560, 112, 14); h.fillStyle = '#fff'; h.fill(); h.fillStyle = c; H.rr(h, 36, 216, 12, 112, 6); h.fill(); H.text(h, k, 66, 256, H.F.mono(700, 24), PAL.gray, 'left', 3); H.text(h, t, 66, 306, H.F.cond(700, 44), PAL.navy, 'left', 1); const tw = H.measure(h, tag, H.F.cond(700, 26), 2) + 26; h.fillStyle = c; H.rr(h, 596 - tw - 16, 232, tw, 36, 8); h.fill(); H.text(h, tag, 596 - 16 - tw / 2, 259, H.F.cond(700, 26), '#fff', 'center', 2); h.restore(); });
    H.label(h, { x: 960, y: 520 }, null, 'SIMULASI · ILUSTRASI', { alpha: win(lt, 0.8, L(1), 0.5), size: 64, style: 'navy', tag: 'BUKAN PREDIKSI', tagColor: PAL.yellow });
    const xp = pj(st.x1.position); H.label(h, off(xp, 220, -150), xp, 'KABEL RUSAK', { alpha: win(lt, L(2) + 1.3, L(3) - 0.2, 0.4), style: 'red', size: 38 });
    H.label(h, { x: 1460, y: 330 }, null, 'TRAFIK DIALIHKAN OTOMATIS', { alpha: win(lt, L(2) + 3, L(3) - 0.2, 0.4), size: 38, tag: 'ROUTING', tagColor: PAL.orange });
    const bp = pj(st.x2.position); H.label(h, off(bp, -160, -190), bp, 'SMPCS · BIAK–SARMI', { alpha: win(lt, L(3) + 2.5, L(4) - 0.2, 0.4), style: 'red', size: 36, tag: '≈ 4.050 M', tagColor: PAL.navy, tagFg: '#fff' });
    H.pin(h, pj(P(...CITY.biak, 0.2)), 'BIAK', win(lt, L(3) + 1.5, L(4), 0.4), { left: true }); H.pin(h, pj(P(...CITY.jayapura, 0.2)), 'JAYAPURA', win(lt, L(3) + 1.5, L(4), 0.4), { dy: 30 });
    H.card(h, 1240, 470, 620, 300, { alpha: win(lt, L(3) + 5, L(4) - 0.2, 0.5), kicker: 'APRIL–MEI 2021 · JAYAPURA', title: '30 Apr → 20 Mei', titleSize: 70, body: 'Layanan Telkom terganggu ± 3 minggu sampai kabel diperbaiki.', bodySize: 28, accent: PAL.red });
    const qp = pj(P(120.6, 21.4, 0.3)); H.label(h, off(qp, -260, 150), qp, 'GEMPA HENGCHUN · DES 2006', { alpha: win(lt, L(5) + 0.8, L(7) - 0.2, 0.4), style: 'red', size: 38 });
    H.stat(h, 1500, 280, '8 SISTEM KABEL', 'PUTUS SEKALIGUS · PULIH ± 1 BULAN', { alpha: win(lt, L(5) + 3, L(6) + 0.2, 0.4), align: 'center', size: 90 });
    H.card(h, 1200, 270, 660, 300, { alpha: win(lt, L(6) + 0.6, L(7) - 0.2, 0.4), kicker: 'DAMPAK KE INDONESIA', title: 'Koneksi Tier-1 terganggu', titleSize: 64, body: 'Pemerintah membentuk satuan tugas pengaturan trafik. — Heru Sutadi', bodySize: 28, accent: PAL.orange });
    H.pin(h, pj(cityV('singapore')), 'SINGAPURA', win(lt, L(7) + 1, L(9), 0.4), { dot: PAL.red, bg: PAL.red, fg: '#fff' });
    // services panel
    const sv = win(lt, L(8) + 0.5, L(9) + 0.5, 0.5);
    if (sv > 0) { h.save(); h.globalAlpha = sv; H.rr(h, 1260, 260, 600, 330, 14); h.fillStyle = '#fff'; h.fill(); H.text(h, 'LAYANAN BERSERVER LUAR NEGERI', 1290, 305, H.F.cond(700, 32), PAL.navy, 'left', 2);
      [['cloud', 'CLOUD'], ['brief', 'APLIKASI BISNIS'], ['card', 'PEMBAYARAN LINTAS NEGARA'], ['game', 'GIM DARING']].forEach(([ic, s], i) => { const a = ap(lt, T.w(8, ['cloud', 'bisnis', 'pembayaran', 'gim'][i]) - 0.2, 0.4); const y = 340 + i * 60; h.globalAlpha = sv * (0.35 + 0.65 * a); H.icon(h, ic, 1320, y + 18, 44, a > 0.5 ? PAL.red : PAL.navy); H.text(h, s, 1370, y + 30, H.F.cond(600, 32), PAL.navy, 'left', 1); if (a > 0.5) { h.fillStyle = PAL.red; H.rr(h, 1730, y, 110, 36, 8); h.fill(); H.text(h, 'GANGGUAN', 1785, y + 27, H.F.cond(700, 22), '#fff', 'center', 1); } });
      h.restore(); }
    H.label(h, { x: 1420, y: 330 }, null, 'TIDAK GELAP TOTAL', { alpha: win(lt, L(9) + 1.5, L(10), 0.4), size: 60, style: 'white', tag: 'DOMESTIK JALAN', tagColor: PAL.green, tagFg: '#fff' });
    const mp = pj(cityV('manado')); H.pin(h, mp, 'MANADO', win(lt, L(10), L(13) + 1, 0.4), { dy: 30 });
    H.label(h, { x: 1450, y: 300 }, null, 'SEA-US · MANADO → LOS ANGELES', { alpha: win(lt, L(10) + 1, L(11), 0.4), size: 38, style: 'navy', tag: 'DESAIN ≈ 20 Tbps', tagColor: PAL.orange });
    const gp = pj(P(144.75, 13.45, 0.2)); H.pin(h, gp, 'GUAM → HAWAII → LA', win(lt, L(10) + 3, L(11) + 0.5, 0.4), { left: true });
    H.label(h, { x: 1450, y: 300 }, null, 'BIFROST · CABANG JAKARTA & MANADO', { alpha: win(lt, L(11) + 1, L(12), 0.4), size: 36, style: 'navy', tag: '240+ Tbps TOTAL', tagColor: PAL.orange });
    H.label(h, { x: 1450, y: 390 }, null, 'SIAP BEROPERASI · OKT 2025', { alpha: win(lt, L(11) + 2.5, L(12), 0.4), size: 30 });
    H.pin(h, pj(cityV('dumai')), 'DUMAI', win(lt, L(12) + 0.5, L(13), 0.4), { left: true }); H.pin(h, pj(cityV('melaka')), 'MELAKA (MY)', win(lt, L(12) + 0.8, L(13), 0.4));
    H.pin(h, pj(cityV('anyer')), 'ANYER', win(lt, L(12) + 3, L(13), 0.4), { left: true }); H.pin(h, pj(cityV('jakarta')), 'JAKARTA', win(lt, L(12) + 3.3, L(13), 0.4), { dy: 30 });
    H.card(h, 1240, 270, 620, 280, { alpha: win(lt, L(13) + 0.5, L(14) - 0.2, 0.4), kicker: 'CATATAN PENTING', title: 'Kapasitas cadangan belum tentu cukup', titleSize: 54, body: 'Sebagian kabel alternatif juga bercabang ke Singapura.', bodySize: 28, accent: PAL.yellow });
    const ca = win(lt, L(14) + 0.5, L(15) - 0.2, 0.4);
    H.card(h, 1160, 300, 700, 380, { alpha: ca, kicker: 'PERBANDINGAN SKALA', accent: PAL.yellow, draw: (hh, x, y, w) => {
      H.hbars(hh, x + 34, y + 10, w - 60, [{ label: 'IIX · PUNCAK', value: 14, valueLabel: '≈ 14 Tbps', color: PAL.green }, { label: 'SATRIA-1', value: 0.15, valueLabel: '150 Gbps', color: PAL.yellow }], ap(lt, L(14) + 1.5, 2), { rowH: 90 });
      H.text(hh, 'SATRIA-1 terpakai ≈ 70–80% (BAKTI)', x + 34, y + 210, H.F.mono(500, 22), PAL.gray);
      if (lt > T.w(14, 'seratus') - 0.3) H.text(hh, '≈ 93× LEBIH KECIL', x + 34, y + 262, H.F.cond(700, 44), PAL.red, 'left', 2);
    } });
    H.label(h, { x: 1450, y: 330 }, null, 'STARLINK · SEJAK MEI 2024', { alpha: win(lt, L(15) + 0.5, L(16), 0.4), size: 40, style: 'navy', tag: 'LAST-MILE', tagColor: PAL.cyan });
    H.label(h, { x: 1450, y: 420 }, null, 'BUKAN PENGGANTI TULANG PUNGGUNG', { alpha: win(lt, T.w(15, 'pengganti') - 0.3, L(16), 0.4), size: 34, style: 'red' });
    H.label(h, { x: 1450, y: 330 }, null, 'JALAN DUA ARAH', { alpha: win(lt, L(16) + 0.8, T.dur, 0.4), size: 60, style: 'navy' });
    H.stat(h, 1450, 430, '267 JUTA', 'PENGGUNA INTERNET INDONESIA', { alpha: win(lt, T.w(16, '267') - 0.2, T.dur, 0.4), align: 'center', size: 96 });
  },
};
