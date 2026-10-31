import * as THREE from 'three';
import { setupScene, lam, basic, PAL, cableMat, tubeFrom, canvasPlane, ship } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeOutBack, mulberry, lerp, inv, holdKeys } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, infoCard, flashA, setCable } from './common.js';
import { underwater } from './s03_anatomi.js';

function corkTex() {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, 1024, 1024);
  const r = mulberry(5); for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(160,120,70,0.10)' : 'rgba(255,255,255,0.12)'; const s = 1 + r() * 3; x.fillRect(r() * 1024, r() * 1024, s, s); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.6); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function stampPlane(s, color, w = 6) {
  return canvasPlane(1100, 330, (x, W, Hh) => {
    x.save(); x.translate(W / 2, Hh / 2); x.rotate(-0.05);
    const lines = s.split('\n'); x.strokeStyle = color; x.lineWidth = 14; H.rr(x, -W / 2 + 30, -Hh / 2 + 30, W - 60, Hh - 60, 24); x.stroke(); x.lineWidth = 5; H.rr(x, -W / 2 + 52, -Hh / 2 + 52, W - 104, Hh - 104, 16); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.75)'; H.rr(x, -W / 2 + 56, -Hh / 2 + 56, W - 112, Hh - 112, 14); x.fill();
    lines.forEach((l, i) => H.text(x, l, 0, -((lines.length - 1) * 42) + i * 84 + 30, H.F.cond(700, 80), color, 'center', 6));
    x.restore();
  }, w);
}
const CARDS = {
  head: { at: [0, 13.4], w: 7.5, spec: { w: 1200, h: 520, kicker: 'ARSIP · BAB 7', title: 'TEORI YANG BEREDAR', titleSize: 120, accent: PAL.navy, body: 'Terdokumentasi vs spekulasi — kami beri label status.', bodySize: 44 } },
  t1: { at: [-10, 9.0], w: 7, spec: { w: 1200, h: 620, kicker: 'TEORI #1', title: '“Singapura sengaja jadi pintu tol digital”', titleSize: 92, accent: '#8a96a3' } },
  t1f: { at: [-10, 3.6], w: 7, spec: { w: 1200, h: 720, kicker: 'FAKTA PENYEIMBANG', body: 'Kabel dimiliki konsorsium operator & perusahaan dari banyak negara, termasuk Telkom. Tidak ada satu “saklar” di Singapura yang bisa memutus internet Indonesia.', bodySize: 50, who: 'Heru Sutadi — ICT Institute', src: 'Katadata, 28 Okt 2026', accent: PAL.green } },
  t2: { at: [0, 9.0], w: 7, spec: { w: 1200, h: 620, kicker: 'TEORI #2', title: 'Penyadapan di titik temu kabel', titleSize: 96, accent: PAL.orange } },
  t2f: { at: [0, 3.9], w: 7, spec: { w: 1200, h: 760, date: 'NOV 2013', kicker: 'DOKUMEN BOCORAN SNOWDEN', body: 'Singapura disebut membantu jaringan intelijen Five Eyes menyadap kabel bawah laut di Asia; SingTel disebut memfasilitasi akses. Indonesia & Malaysia disebut target sejak 1970-an.', bodySize: 46, src: 'Sydney Morning Herald / Fairfax', accent: PAL.orange, dateBg: '#7a4a00' } },
  t2g: { at: [9.0, 13.3], w: 4.6, spec: { w: 1000, h: 520, kicker: 'DAMPAK DIPLOMATIK', body: 'Dubes Singapura dipanggil di Jakarta & Kuala Lumpur. Singapura tidak mengonfirmasi maupun membantah.', bodySize: 48, src: 'AFP/Inquirer; Malay Mail', accent: PAL.navy } },
  t3: { at: [10, 9.0], w: 7, spec: { w: 1200, h: 620, kicker: 'TEORI #3', title: 'Jangkar yang “tidak sengaja”', titleSize: 100, accent: PAL.red } },
  t3f: { at: [10, 3.6], w: 7, spec: { w: 1200, h: 720, kicker: 'PENYEIMBANG · DATA ICPC', title: '150–200 kerusakan / tahun', titleSize: 84, body: '≈ 2/3 akibat kapal nelayan & jangkar. Sabotase sangat jarang.', bodySize: 50, src: 'TeleGeography FAQ; CNA Indonesia', accent: PAL.green } },
  eye: { at: [-9.0, 13.3], w: 4.6, spec: { w: 1000, h: 520, kicker: 'LOGIKA', title: 'Titik temu = posisi strategis', titleSize: 84, accent: PAL.cyan } },
};
const STRINGS = [['head', 't1'], ['head', 't2'], ['head', 't3'], ['t1', 't1f'], ['t2', 't2f'], ['t2', 't2g'], ['t3', 't3f'], ['t2', 'eye']];
export default {
  async build() {
    // --- board scene
    const A = setupScene({ top: '#d6ebf6', bot: '#f6fafc', fogColor: '#eef6fa', near: 40, far: 120, fov: 38 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(32, 17, 0.4), [lam('#b98f5f'), lam('#b98f5f'), lam('#b98f5f'), lam('#b98f5f'), new THREE.MeshLambertMaterial({ map: corkTex() }), lam('#b98f5f')]);
    board.position.set(0, 8, -0.25); A.scene.add(board);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(32.8, 17.8, 0.3), lam('#8a6a45')); frame.position.set(0, 8, -0.45); A.scene.add(frame);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), basic('#eef4f8')); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.6; A.scene.add(floor);
    const cards = {}; const r = mulberry(9);
    for (const [k, c] of Object.entries(CARDS)) {
      const m = infoCard(c.spec, c.w); m.position.set(c.at[0], c.at[1], 0.05 + r() * 0.04); m.rotation.z = (r() - 0.5) * 0.06; A.scene.add(m);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), basic(PAL.red)); const hh = m.geometry.parameters.height; pin.position.set(c.at[0], c.at[1] + hh / 2 - 0.25, 0.25); A.scene.add(pin);
      cards[k] = { m, pin, base: m.position.clone() };
    }
    const strings = STRINGS.map(([a, b]) => { const pa = cards[a].pin.position.clone().setZ(0.02), pb = cards[b].pin.position.clone().setZ(0.02); const mid = pa.clone().lerp(pb, 0.5); mid.y -= 0.8; const m = tubeFrom([pa, mid, pb], 0.035, cableMat({ color: '#d2302c', pulse: '#ff8a80', dens: 2, speed: 0.2, pulseAmt: 0.3 }), 40, 4); A.scene.add(m); return m; });
    const stamps = [stampPlane('TIDAK DIDUKUNG\nBUKTI', '#6b7a8c'), stampPlane('TERDOKUMENTASI LEWAT BOCORAN\nTIDAK DIAKUI RESMI', '#d06a00', 6.8), stampPlane('KASUS DICURIGAI\nMAYORITAS KECELAKAAN', '#c8323a', 6.6)];
    stamps.forEach((s, i) => { s.position.set([-10, 0, 10][i], 7.9, 0.45); A.scene.add(s); s.material.opacity = 0; });
    // --- underwater anchor scene
    const B = underwater({ near: 16, far: 70, seed: 7, clear: [-6, 8] });
    const cableBase = []; for (let x = -40; x <= 40; x += 1) cableBase.push(new THREE.Vector3(x, -2.72, 0));
    const cMat = cableMat({ color: '#26384d', pulse: PAL.cyan, dens: 20, speed: 0.6, pulseAmt: 0.9 });
    const cableL = new THREE.Mesh(new THREE.BufferGeometry(), cMat), cableR = new THREE.Mesh(new THREE.BufferGeometry(), cMat.clone()); B.scene.add(cableL, cableR);
    const anchor = new THREE.Group(); const am = lam('#5b6b7d');
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.2, 8), am); shank.position.y = 1.6; anchor.add(shank);
    const crown = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.16, 6, 16, Math.PI), am); crown.rotation.z = Math.PI; crown.position.y = 0.5; anchor.add(crown);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.8, 4), am); f.position.set(s * 1.1, 0.75, 0); f.rotation.z = -s * 0.5; anchor.add(f); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12), am); ring.position.y = 3.35; anchor.add(ring);
    anchor.rotation.z = 0.9; B.scene.add(anchor);
    const chainM = lam('#7d8b99'); const links = []; for (let i = 0; i < 26; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 4, 10), chainM); B.scene.add(l); links.push(l); }
    const hull = ship({ hull: '#2f3d4c', stripe: '#c8323a', funnel: '#2f3d4c', sheave: false }); hull.scale.setScalar(2.2); B.scene.add(hull);
    const sparks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.08, 0), basic('#ffb199'), 40); sparks.frustumCulled = false; B.scene.add(sparks);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: '#bfe9f4', transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })); surf.rotation.x = Math.PI / 2; surf.position.y = 9; B.scene.add(surf);
    return { scene: A.scene, camera: A.camera, A, B, cards, strings, stamps, cableBase, cableL, cableR, anchor, links, hull, sparks, pjA: projector(A.camera), pjB: projector(B.camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    const u0 = L(10) - 0.2, u1 = L(13) - 0.2; st.phase = lt >= u0 && lt < u1 ? 1 : 0;
    if (st.phase === 0) {
      st.scene = st.A.scene; st.camera = st.A.camera;
      const fc = (k, d = 8.5, dx = 0, dy = 0) => { const p = st.cards[k].base; return [[p.x + dx, p.y + dy, d], [p.x + dx, p.y + dy, 0]]; };
      const K = (t, k, d, dx, dy) => { const [a, b] = fc(k, d, dx, dy); return [t, a, b]; };
      camRig(st.camera, holdKeys([
        [0, [0, 8, 34], [0, 8, 0]], [L(0) + 0.5, [0, 9.5, 27], [0, 9.5, 0]], K(L(0) + 6, 'head', 14, 1.5, -0.5),
        K(L(1), 't1', 12.5), K(L(2), 't1f', 12.5, 0, 0.3), K(L(3) + 0.2, 't1', 15, 0, -2),
        K(L(4), 't2', 12.5), K(L(5), 't2f', 12.5, 0, 0.3), K(L(6) + 1.5, 't2g', 11.5, -0.5, -0.5), K(L(7), 't2', 15, 0, -2),
        K(L(8), 'eye', 14, 1.5, -1.2), [L(8) + 8, [0, 8.5, 27], [0, 8.5, 0]],
        K(L(9), 't3', 12.5), [u0 - 0.6, [10, 9, 10], [10, 9, 0]],
        K(u1 + 0.1, 't3f', 12.5, 0, 0.3), K(L(14), 't3', 15, 0, -2), [L(14) + 7, [0, 8.5, 31], [0, 8.5, 0]],
      ], 1.4), lt, 0.1);
      const appear = { head: 0.6, t1: L(1), t1f: L(2) + 0.3, t2: L(4), t2f: L(5) + 0.3, t2g: L(6) + 2, eye: L(8) + 0.5, t3: L(9), t3f: u1 + 0.3 };
      for (const [k, c] of Object.entries(st.cards)) { const a = ap(lt, appear[k], 0.7, easeOutBack); c.m.scale.setScalar(Math.max(0.001, a)); c.pin.visible = a > 0.9; c.m.visible = a > 0.001; }
      const sAt = [L(1) + 0.4, L(4) + 0.4, L(9) + 0.4, L(2) + 0.8, L(5) + 0.8, L(6) + 2.5, u1 + 0.8, L(8) + 1];
      st.strings.forEach((m, i) => setCable(m, lt, { prog: ap(lt, sAt[i], 1.2), op: ap(lt, sAt[i], 0.2) }));
      const stAt = [L(3) + 1.2, L(7) + 1.2, L(14) + 1.2];
      st.stamps.forEach((s, i) => { const p = ap(lt, stAt[i], 0.45); s.material.opacity = clamp(p * 1.5); s.scale.setScalar(1 + 1.4 * (1 - easeOut(p))); s.visible = p > 0; });
    } else {
      st.scene = st.B.scene; st.camera = st.B.camera;
      const k = lt - u0; // anchor timeline
      const ax = lerp(-24, 22, clamp(k / 26)); const snapT = 9.0; const snapped = k > snapT;
      const drag = clamp(k / 26);
      st.anchor.position.set(ax, -2.6, 0.2); st.anchor.rotation.set(0, 0, 1.25);
      st.hull.position.set(ax - 16, 9.2, -2); st.hull.rotation.y = 0;
      const top = new THREE.Vector3(ax - 15, 9, -2), bot = st.anchor.position.clone().add(new THREE.Vector3(-1.2, 1.6, 0));
      st.links.forEach((l, i) => { const u = i / (st.links.length - 1); const p = top.clone().lerp(bot, u); p.y -= Math.sin(u * Math.PI) * 1.5; l.position.copy(p); l.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, Math.atan2(bot.y - top.y, bot.x - top.x)); });
      // deform cable: near anchor x, pushed in +x direction until snap
      const pts = st.cableBase.map(p => p.clone());
      const pull = snapped ? 0 : clamp((ax - 0) / 1) ;
      const hook = Math.max(0, ax - (-0.5));
      const L1 = [], R1 = [];
      pts.forEach(p => { const d = p.x; const bend = !snapped ? Math.exp(-(d * d) / 18) * Math.min(hook, 7) : 0; const q = p.clone(); q.x += bend * 0.4; q.z += bend * 0.9; if (d < 0) L1.push(q); else R1.push(q); });
      if (snapped) { const gap = Math.min(3, (k - snapT) * 1.5); L1.forEach(q => { const w = Math.exp(-(q.x * q.x) / 30); q.z += w * gap * 0.6; q.x -= w * gap * 0.3; }); R1.forEach(q => { const w = Math.exp(-(q.x * q.x) / 30); q.z += w * gap * 0.9; q.x += w * gap * 0.3; }); }
      else { L1.push(R1[0].clone()); }
      st.cableL.geometry.dispose(); st.cableL.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(L1), 120, 0.2, 6);
      st.cableR.geometry.dispose(); st.cableR.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(R1), 120, 0.2, 6);
      st.cableL.material.uniforms.uTime.value = lt; st.cableR.material.uniforms.uTime.value = lt;
      const blink = snapped && Math.floor(lt * 3) % 2 ? PAL.red : '#26384d'; st.cableL.material.uniforms.uColor.value.set(blink); st.cableR.material.uniforms.uColor.value.set(blink); st.cableR.material.uniforms.uPulseAmt.value = snapped ? 0 : 0.9;
      // sparks
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(); const sp = clamp((k - snapT) / 1.6); const rr = mulberry(3);
      for (let i = 0; i < 40; i++) { const dir = new THREE.Vector3(rr() - 0.5, rr() * 0.8, rr() - 0.5).normalize(); v.set(0.2, -2.5, 1.2).add(dir.multiplyScalar(sp * (1.5 + rr() * 2.5))); s.setScalar(sp > 0 && sp < 1 ? (1 - sp) * 1.5 : 0); m.compose(v, q, s); st.sparks.setMatrixAt(i, m); }
      st.sparks.instanceMatrix.needsUpdate = true;
      camRig(st.camera, [[0, [-14, 1.5, 14], [-6, -2.2, 0]], [6, [-4, 0.5, 11], [0, -2.4, 0.5]], [12, [5, 1.0, 10], [1, -2.4, 1]], [22, [14, 4, 16], [4, -1, 0]], [31, [6, 2, 18], [2, -1.5, 0]]], k, 0.15);
    }
  },
  header(st, lt, T) { return { big: 'BAB 7', route: { state: st.phase === 1 && lt - (T.L(10) - 0.2) > 9 ? 'cut' : 'active' } }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T);
    if (st.phase === 0) {
      const a = win(lt, L(0) + 1.5, L(1), 0.5);
      if (a > 0) {
        h.save(); h.globalAlpha = a;
        H.rr(h, 1280, 260, 580, 230, 14); h.fillStyle = '#fff'; h.fill();
        H.text(h, 'LABEL STATUS', 1310, 305, H.F.mono(700, 22), PAL.gray, 'left', 3);
        [['TERDOKUMENTASI', PAL.orange], ['DICURIGAI', PAL.red], ['TIDAK DIDUKUNG BUKTI', '#6b7a8c']].forEach(([s, c], i) => { h.fillStyle = c; H.rr(h, 1310, 325 + i * 52, 30, 30, 6); h.fill(); H.text(h, s, 1356, 350 + i * 52, H.F.cond(700, 34), PAL.navy, 'left', 2); });
        h.restore();
      }
      H.label(h, { x: 1500, y: 300 }, null, '“Data yang lewat bisa terlihat”', { alpha: win(lt, L(8) + 4, L(9) - 0.2, 0.5), size: 38, style: 'navy' });
      H.label(h, { x: 1500, y: 390 }, null, 'RISIKO SPIONASE → DIVERSIFIKASI JALUR', { alpha: win(lt, T.w(8, 'spionase') - 0.3, L(9) - 0.2, 0.5), size: 34, tag: 'PAKAR', tagColor: PAL.cyan });
      H.label(h, { x: 960, y: 820 }, null, 'KABEL BAWAH LAUT ITU RAPUH', { alpha: win(lt, T.w(14, 'rapuh') - 0.5, T.dur, 0.4), size: 56, style: 'red' });
    } else {
      const cases = [
        [L(10) - 0.2, L(11) - 0.3, '2023 · KEP. MATSU, TAIWAN', 'Dua kabel putus. Otoritas Taiwan menyebut dua kapal asal Tiongkok sebagai penyebab. Perbaikan ± 50 hari.', 'Reuters via Canberra Times'],
        [L(11), L(12) - 0.3, 'DES 2024 · LAUT BALTIK', 'Tanker Eagle S diduga menyeret jangkar; kabel listrik Estlink 2 (Finlandia–Estonia) rusak.', 'BISI · Dangerous Tides 3'],
        [L(12), L(13), 'AWAL 2024 · LAUT MERAH', 'Kapal Rubymar dihantam rudal Houthi, tenggelam sambil menyeret jangkar. Tiga kabel rusak.', 'CBS News; gCaptain'],
      ];
      cases.forEach(([a, b, t, body], i) => H.card(h, 1120, 270, 740, 330, { alpha: win(lt, a + 0.5, b, 0.45), kicker: 'KASUS ' + (i + 1) + ' / 3', title: t, titleSize: 52, body, bodySize: 28, accent: PAL.red }));
      const pj = st.pjB; const ap2 = pj(st.anchor.position.clone().add(new THREE.Vector3(0, 2, 0)));
      H.label(h, off(ap2, -60, -200), ap2, 'JANGKAR TERSERET', { alpha: win(lt, L(10) + 1.5, L(10) + 8.5, 0.4), size: 36, style: 'navy' });
      const k = lt - (L(10) - 0.2);
      const cp = pj(new THREE.Vector3(0.2, -2.6, 1.2));
      H.label(h, off(cp, 60, -240), cp, 'PUTUS', { alpha: win(lt, L(10) - 0.2 + 9.2, L(11) + 1, 0.3), size: 52, style: 'red' });
      H.label(h, { x: 420, y: 330 }, null, 'ILUSTRASI · BUKAN REKAMAN', { alpha: win(lt, L(10) + 0.4, L(13) - 0.4, 0.4), size: 28 });
    }
  },
  overlay(st, h, lt, T) { H.flash(h, flashA(lt, T.L(10) - 0.2, 0.35) + flashA(lt, T.L(13) - 0.2, 0.35)); },
};
