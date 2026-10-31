import * as THREE from 'three';
import { lam, basic, PAL, P, CITY, cableMat, tubeFrom, flow, updateFlow } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeOutBack, mulberry, lerp, holdKeys } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, mapWorld, setCable, cityV, INTL_SG, DOMESTIC } from './common.js';

const GATES = [['batam', 'BATAM', 'GERBANG BARAT'], ['manado', 'MANADO', 'LANGSUNG KE AMERIKA'], ['jakarta', 'JAKARTA', 'PERLUASAN'], ['surabaya', 'SURABAYA', 'PERLUASAN']];
const NEWC = [['INSICA', 2027, [[104.2, 1.2], [106.0, -2.0], [107.0, -5.9]]], ['CANDLE', 2028, [[112.75, -7.25], [118, -2], [123, 6], [125, 14]]], ['APX WEST', 2029, [[106.8, -6.1], [104, -9], [100, -12], [96, -14]]], ['AUG EAST', 2029, [[124.84, 1.49], [130, 7], [138, 12], [146, 15]]], ['HAWAIKI NUI 1', 2029, [[115.2, -8.65], [120, -12], [130, -15], [140, -15]]]];
export default {
  async build({ GEO }) {
    const W = mapWorld(GEO, { near: 70, far: 180, seed: 7 });
    const { scene, camera } = W;
    INTL_SG.forEach(n => W.add(n, PAL.cyan, 0.07));
    DOMESTIC.forEach(n => W.add(n, PAL.green, 0.05, { dens: 2 }));
    ['seaus', 'bifrost_mdo', 'bifrost_jkt', 'png_jyp'].forEach(n => W.add(n, PAL.orange, 0.08));
    const beacons = GATES.map(([k]) => { const g = new THREE.Group(); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: PAL.cyan, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); col.position.y = 1.6; g.add(col); const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), basic('#ffffff')); top.position.y = 3.25; g.add(top); const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32), new THREE.MeshBasicMaterial({ color: PAL.cyan, transparent: true, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; g.add(ring); g.userData.ring = ring; g.position.copy(cityV(k, 0.1)); scene.add(g); return g; });
    const newc = NEWC.map(([n, y, pts]) => { const m = tubeFrom(pts.map(p => P(p[0], p[1], 0.22)), 0.07, cableMat({ color: PAL.yellow, dash: true, dens: 4, transparent: true }), 120, 5); scene.add(m); return m; });
    const r = mulberry(12); const dcs = [];
    for (const [k, n] of [['jakarta', 22], ['batam', 14], ['surabaya', 12]]) { const c = CITY[k]; for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1, 0.09), lam(r() < 0.3 ? PAL.cyan : '#eef2f6')); b.userData = { h: 0.12 + r() * 0.3, d: r() }; b.position.copy(P(c[0] + (r() - 0.5) * 0.7, c[1] + (r() - 0.5) * 0.4, 0.13)); scene.add(b); dcs.push(b); } }
    // triangle SG - Batam - Johor
    const tri = [cityV('singapore', 0.3), cityV('batam', 0.3), cityV('johor', 0.3)];
    const triM = tubeFrom([tri[0], tri[1], tri[2], tri[0].clone()], 0.035, cableMat({ color: PAL.yellow, pulse: '#ffffff', dens: 6, speed: 0.8, transparent: true }), 80, 5); scene.add(triM);
    const eC = new THREE.QuadraticBezierCurve3(P(104.2, 0.6, 0.3), P(104.0, 1.0, 0.8), P(103.9, 1.28, 0.3)), dC = new THREE.QuadraticBezierCurve3(P(103.82, 1.3, 0.3), P(103.75, 0.95, 0.9), P(104.05, 0.65, 0.3));
    const fE = flow(eC, 6, 0.035, PAL.yellow), fD = flow(dC, 6, 0.03, PAL.cyan); scene.add(fE, fD);
    return { scene, camera, W, beacons, newc, dcs, triM, fE, fD, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    camRig(st.camera, holdKeys([
      [0, [6, 31, 27], [6, 0, 3]],
      [L(1) + 0.5, [4, 27, 24], [4, 0, 3.5]],
      [L(2) + 0.2, [19, 15, 17], [20, 0, 1.5]],
      [L(3) + 0.2, [6, 34, 30], [6, 0, 2]],
      [L(4) + 0.2, [-6.4, 6.5, 15.5], [-8.2, 0, 9.4]],
      [L(5) + 0.2, [-2, 22, 22], [-3, 0, 4]],
      [L(8) + 0.2, [-9.9, 4.0, 5.0], [-11.0, 0, 1.3]],
      [L(9) + 0.5, [2, 26, 26], [2, 0, 2]],
    ], 2.0), lt, 0.12);
    Object.entries(st.W.cables).forEach(([n, c], i) => {
      const alt = ['seaus', 'bifrost_mdo', 'bifrost_jkt', 'png_jyp'].includes(n);
      let op = 0.85; if (alt) op = n === 'png_jyp' ? ap(lt, L(2) + 0.5, 1) : ap(lt, T.w(1, 'Manado'), 1);
      setCable(c, lt, { op, prog: alt ? ap(lt, n === 'png_jyp' ? L(2) + 0.5 : T.w(1, 'Manado'), 2) : 1 });
    });
    const gAt = [T.w(1, 'Batam'), T.w(1, 'Manado'), T.w(1, 'Jakarta'), T.w(1, 'Surabaya')];
    st.beacons.forEach((b, i) => { const a = ap(lt, gAt[i] - 0.2, 0.8, easeOutBack) * (1 - 0.7 * win(lt, L(3), L(10) || 1e9, 1.0)) * (1 - win(lt, L(4) - 1, L(5) + 0.5, 0.8)) * (1 - win(lt, L(8) - 1, T.dur + 5, 0.8)); b.scale.set(Math.max(0.001, a), Math.max(0.001, a), Math.max(0.001, a)); b.visible = a > 0.001; const u = (lt * 0.8 + i * 0.3) % 1; b.userData.ring.scale.setScalar(1 + u * 2.5); b.userData.ring.material.opacity = 1 - u; });
    const years = [2027, 2028, 2029, 2029, 2029];
    st.newc.forEach((m, i) => { const at = L(3) + 2 + i * 2.4; setCable(m, lt, { op: win(lt, at, L(4) + 1, 0.5), prog: ap(lt, at, 1.8) }); });
    st.dcs.forEach(b => { const a = ap(lt, L(4) + 1 + b.userData.d * 4, 0.8, easeOut); b.scale.y = Math.max(0.001, a * b.userData.h); b.position.y = 0.13 + b.scale.y / 2; b.visible = a > 0; });
    const ta = win(lt, L(8) + 3, T.dur, 0.6); setCable(st.triM, lt, { op: ta, prog: ap(lt, L(8) + 3, 2) }); updateFlow(st.fE, lt, 0.35, win(lt, L(8) + 5, L(9) + 2, 0.5)); updateFlow(st.fD, lt, 0.35, win(lt, L(8) + 7, L(9) + 2, 0.5));
  },
  header() { return { big: 'BAB 10' }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj;
    const gAt = [T.w(1, 'Batam'), T.w(1, 'Manado'), T.w(1, 'Jakarta'), T.w(1, 'Surabaya')];
    GATES.forEach(([k, n, tag], i) => { const p = pj(cityV(k, 3.3)); const dx = [-150, 170, -150, 140][i], dy = [-110, -110, 120, 130][i]; H.label(h, off(p, dx, dy), p, n, { alpha: win(lt, gAt[i] + 0.3, L(2), 0.4), size: 34, style: 'navy', tag, tagColor: i === 1 ? PAL.orange : PAL.cyan }); });
    H.label(h, { x: 960, y: 300 }, null, '4 GERBANG INTERNASIONAL TELKOM', { alpha: win(lt, L(1) + 0.5, L(2), 0.4), size: 44, style: 'white', tag: 'SOLUSI 1', tagColor: PAL.cyan });
    H.pin(h, pj(P(...CITY.vanimo, 0.2)), 'VANIMO (PNG)', win(lt, L(2) + 0.8, L(3), 0.4), { dy: 30 }); H.pin(h, pj(P(...CITY.jayapura, 0.2)), 'JAYAPURA', win(lt, L(2) + 1.1, L(3), 0.4), { left: true });
    H.label(h, { x: 1450, y: 300 }, null, 'PAPUA: JALUR KEDUA · MEI 2026', { alpha: win(lt, L(2) + 1.5, L(3), 0.4), size: 38, style: 'navy', tag: '→ LOS ANGELES', tagColor: PAL.orange });
    // new cables timeline
    const na = win(lt, L(3) + 0.5, L(4) + 0.5, 0.5);
    if (na > 0) { h.save(); h.globalAlpha = na; H.rr(h, 36, 216, 620, 470, 14); h.fillStyle = '#fff'; h.fill(); H.text(h, 'SOLUSI 2 · KABEL BARU (TELEGEOGRAPHY)', 66, 260, H.F.mono(700, 20), PAL.gray, 'left', 2);
      NEWC.forEach(([n, y], i) => { const a = ap(lt, L(3) + 2 + i * 2.4, 0.5); const yy = 300 + i * 74; h.globalAlpha = na * (0.3 + 0.7 * a); h.fillStyle = PAL.yellow; H.rr(h, 66, yy, 120, 50, 10); h.fill(); H.text(h, String(y), 126, yy + 36, H.F.mono(700, 26), PAL.navy, 'center'); H.text(h, n, 210, yy + 38, H.F.cond(700, 40), PAL.navy, 'left', 2); });
      h.globalAlpha = na; H.text(h, 'Garis kuning = ilustrasi, rute belum final', 66, 668, H.F.mono(500, 18), PAL.gray); h.restore(); }
    H.label(h, { x: 1450, y: 300 }, null, 'BAWA DATA PULANG', { alpha: win(lt, L(4) + 0.5, L(5), 0.4), size: 50, style: 'white', tag: 'SOLUSI 3', tagColor: PAL.cyan });
    const ip = pj(P(106.95, -6.25, 0.6)); H.label(h, off(ip, 200, -170), ip, 'IIX-JK2 · JAKARTA TIMUR', { alpha: win(lt, T.w(4, 'IIX') + 2, L(5), 0.4), size: 34, style: 'navy', tag: 'JAN 2025', tagColor: PAL.green, tagFg: '#fff' });
    H.card(h, 1150, 270, 710, 360, { alpha: win(lt, L(5) + 0.3, L(6), 0.5), kicker: 'KAPASITAS PUSAT DATA', accent: PAL.cyan, draw: (hh, x, y, w) => {
      H.hbars(hh, x + 34, y + 10, w - 60, [{ label: 'RI 2020', value: 74, valueLabel: '74 MW', color: '#9fd8ee' }, { label: 'RI 2026 (PROYEKSI)', value: 348, valueLabel: '≈ 348 MW', color: PAL.cyan }, { label: 'SINGAPURA (EST.)', value: 1650, valueLabel: '≈ 1.650 MW', color: PAL.red }], ap(lt, L(5) + 1, 3), { rowH: 82 });
    } });
    H.card(h, 1150, 270, 710, 330, { alpha: win(lt, L(6) + 0.3, L(7), 0.5), kicker: 'SOLUSI 4', title: 'Izin cepat & pasti', titleSize: 76, body: 'Setiap bulan tertunda = modal ratusan juta dolar yang belum menghasilkan.', bodySize: 30, accent: PAL.orange, chip: '⏱', chipColor: PAL.orange });
    const ra = win(lt, L(7) + 0.3, L(8), 0.5);
    if (ra > 0) { h.save(); h.globalAlpha = ra; H.rr(h, 1150, 270, 710, 420, 14); h.fillStyle = '#fff'; h.fill(); H.text(h, 'SOLUSI 5 · KETAHANAN', 1180, 315, H.F.mono(700, 22), PAL.gray, 'left', 2); H.text(h, 'Arif Perdana — Monash Univ. Indonesia', 1180, 655, H.F.cond(600, 30), PAL.navy);
      ['Petakan layanan kritis', 'Cari titik kegagalan tunggal', 'Wajibkan target waktu pemulihan'].forEach((s, i) => { const a = ap(lt, T.w(7, ['memetakan', 'kegagalan', 'mewajibkan'][i]) - 0.2, 0.5); const yy = 350 + i * 92; h.globalAlpha = ra * (0.25 + 0.75 * a); h.fillStyle = a > 0.5 ? PAL.green : '#c9d5e0'; H.rr(h, 1180, yy, 64, 64, 12); h.fill(); H.icon(h, 'check', 1212, yy + 32, 40, '#fff'); H.text(h, s, 1270, yy + 44, H.F.sans(600, 34), PAL.navy); });
      h.restore(); }
    H.pin(h, pj(cityV('singapore')), 'SINGAPURA', win(lt, L(8) + 2.5, T.dur, 0.4), { dot: PAL.red, left: true }); H.pin(h, pj(cityV('batam')), 'BATAM', win(lt, L(8) + 2.8, T.dur, 0.4), { dy: 30 }); H.pin(h, pj(cityV('johor')), 'JOHOR (MY)', win(lt, L(8) + 3.1, T.dur, 0.4));
    H.label(h, { x: 1450, y: 300 }, null, 'SALING KETERGANTUNGAN', { alpha: win(lt, L(8) + 0.5, L(9), 0.4), size: 46, style: 'navy', tag: 'SOLUSI 6', tagColor: PAL.yellow });
    H.label(h, { x: 1450, y: 400 }, null, '⚡ ENERGI & LAHAN → PUSAT DATA', { alpha: win(lt, T.w(8, 'energi'), L(9), 0.4), size: 34, tag: 'INDONESIA', tagColor: PAL.yellow });
    H.card(h, 440, 300, 1040, 330, { alpha: win(lt, L(9) + 0.3, T.dur + 1, 0.5), kicker: 'ERZA AMINANTO · MONASH UNIVERSITY INDONESIA', title: '“Tidak mungkin 100 persen bebas tanpa negara asing.”', titleSize: 64, body: 'Tujuannya bukan isolasi, melainkan posisi tawar.', bodySize: 34, accent: PAL.navy });
  },
};
