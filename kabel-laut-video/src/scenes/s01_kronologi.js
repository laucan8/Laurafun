import * as THREE from 'three';
import { setupScene, cableMat, tubeFrom, lam, PAL, blobShadow } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOutBack, lerp } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, setCable, infoCard, off } from './common.js';

function gridTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#eef4f7'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(19,36,59,0.07)'; x.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 40); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const CARDS = [
  { u: 0.08, date: '8 JUN 2026', kicker: 'KOMDIGI · FORUM INDUSTRI, JAKARTA', quote: 'Jujur, trafik internet kita 90 persen tergantung Singapura.', who: 'Denny Setiawan — Dir. Strategi & Kebijakan Infrastruktur Digital', src: 'CNA Indonesia; Selular.id', accent: PAL.cyan },
  { u: 0.22, kicker: 'ANALOGI', title: 'HORMUZ · MALAKA', body: 'Satu titik sempit (chokepoint). Kalau tersumbat, dampaknya menjalar ke mana-mana.', src: 'detikInet, 28 Okt 2026', accent: PAL.yellow, h: 700, side: true },
  { u: 0.38, date: '24 OKT 2026', kicker: 'ENERGI', title: 'Pasokan gas ke Singapura dipangkas sebagian', body: 'Dialihkan untuk kebutuhan listrik & industri dalam negeri.', src: 'Katadata, 27 Okt 2026', accent: PAL.orange },
  { u: 0.54, date: '25 OKT 2026', kicker: 'UNGGAHAN DI X', title: '“Cut?”', body: 'Infografis: ±90% trafik internet internasional Indonesia lewat Singapura. Belakangan: “Singapura taat hukum, tidak akan melakukannya.”', who: 'Calvin Cheng — eks anggota parlemen Singapura', src: 'Katadata; Jakarta Globe', accent: PAL.red },
  { u: 0.72, date: '27 OKT 2026', kicker: 'INSTAGRAM MENKOMDIGI', quote: 'Kalau kabel terputus, 80% kapasitas konektivitas Singapura juga terancam lumpuh. Tidak perlu geram.', who: 'Meutya Hafid — Menteri Komunikasi & Digital', src: 'Jakarta Globe; Bisnis.com', accent: PAL.navy },
  { u: 0.88, date: '28 OKT 2026', kicker: 'PENGAMAT', quote: 'Itu opini pribadi, bukan sikap resmi pemerintah Singapura.', who: 'Heru Sutadi — ICT Institute', src: 'Katadata, 28 Okt 2026', accent: PAL.green },
];
export default {
  async build() {
    const { scene, camera } = setupScene({ top: '#b3dcf3', bot: '#f2f8fb', near: 45, far: 140, fov: 38 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: gridTex() })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new THREE.Vector3(-14 + u * 120, 0.25, Math.sin(u * 5.2) * 7)); }
    const rail = tubeFrom(pts, 0.16, cableMat({ color: PAL.navy, pulse: PAL.cyan, dens: 14, speed: 0.6, pulseAmt: 1 }), 400, 8); scene.add(rail);
    const curve = rail.userData.curve; const cards = [];
    CARDS.forEach((c, i) => {
      const p = curve.getPointAt(c.u); const m = infoCard(c, c.side ? 5.2 : 6.4);
      const tan = curve.getTangentAt(c.u);
      const side = c.side ? -1 : 1;
      const nrm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      m.position.copy(p).add(nrm.clone().multiplyScalar(side * -3.2)); m.position.y = 3.3 + (c.side ? 0.2 : 0);
      m.rotation.y = Math.atan2(tan.x, tan.z) - Math.PI / 2 + (c.side ? 0.25 : -0.05);
      scene.add(m);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(m.quaternion).multiplyScalar(0.25); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6), lam('#9fb0c2')); post.position.set(m.position.x + dir.x, 0.7, m.position.z + dir.z); scene.add(post);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 24), new THREE.MeshBasicMaterial({ color: c.accent })); dot.position.copy(p); dot.position.y = 0.3; scene.add(dot);
      const sh = blobShadow(2.6, 0.12); sh.position.set(m.position.x, 0.02, m.position.z); scene.add(sh);
      cards.push({ m, p, dot, post, base: m.position.clone() });
    });
    return { scene, camera, rail, curve, cards, pj: projector(camera) };
  },
  update(st, lt, T) {
    setCable(st.rail, lt, { prog: Math.min(1, 0.05 + ap(lt, 0.2, 5) * 0.95) });
    const focus = (i, dist = 9.5, dx = 0) => { const c = st.cards[i]; const m = c.m; const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(m.quaternion); const pos = m.position.clone().add(dir.multiplyScalar(dist)); pos.x += dx; pos.y = m.position.y + 0.6; return [pos.toArray(), m.position.toArray()]; };
    const k = (t, i, d, dx) => { const [p, l] = focus(i, d, dx); return [t, p, l]; };
    const L = T.L.bind(T);
    camRig(st.camera, [
      [0, [-30, 24, 30], [10, 0, 0]],
      [L(0) + 3.5, [-20, 16, 26], [8, 2, 0]],
      k(L(1), 0, 10.5), k(L(2) - 0.4, 0, 10.5), k(L(2) + 0.6, 1, 9), k(L(3) - 0.3, 1, 9),
      k(L(3) + 0.8, 2, 10.5), k(L(4) - 0.3, 2, 10.5), k(L(4) + 0.8, 3, 11), k(L(5) - 0.3, 3, 11),
      k(L(5) + 0.8, 4, 10.5), k(L(7) - 0.3, 4, 10.5), k(L(7) + 0.8, 5, 10.5), k(L(8), 5, 11),
      [L(8) + 4, [70, 26, 30], [90, 0, 0]], [T.dur, [96, 14, 6], [116, 0, 0]],
    ], lt, 0.12);
    st.cards.forEach((c, i) => {
      const at = [L(1) - 1.5, L(2), L(3), L(4), L(5), L(7)][i];
      const a = ap(lt, Math.min(at, 0.4 + i * 0.35), 0.9, easeOutBack);
      c.m.scale.setScalar(Math.max(0.001, a)); c.m.position.y = c.base.y - (1 - a) * 2;
      c.dot.scale.setScalar(1 + 0.25 * Math.sin(lt * 3 + i));
    });
  },
  header(st, lt, T) { return { big: 'BAB 1' }; },
  hud(st, h, lt, T) {
    // timeline scrubber at bottom-right of screen
    const marks = ['8 JUN', '24 OKT', '25 OKT', '27 OKT', '28 OKT']; const L = T.L.bind(T);
    const times = [L(1), L(3), L(4), L(5), L(7)]; let cur = -1; times.forEach((t, i) => { if (lt >= t - 0.3) cur = i; });
    const a = ap(lt, 1.0, 0.6) * (1 - ap(lt, T.dur - 2.2, 0.6)); if (a <= 0) return;
    h.save(); h.globalAlpha = a;
    const X = 1240, Y = 262, W = 620;
    H.rr(h, X - 24, Y - 34, W + 48, 92, 14); h.fillStyle = 'rgba(255,255,255,0.92)'; h.fill();
    h.strokeStyle = '#c9d5e0'; h.lineWidth = 4; h.beginPath(); h.moveTo(X, Y); h.lineTo(X + W, Y); h.stroke();
    marks.forEach((m, i) => {
      const x = X + i * W / (marks.length - 1); const on = i <= cur;
      h.fillStyle = on ? (i === cur ? PAL.red : PAL.navy) : '#c9d5e0'; h.beginPath(); h.arc(x, Y, i === cur ? 11 : 8, 0, 7); h.fill();
      H.text(h, m, x, Y + 40, H.F.mono(700, 19), on ? PAL.navy : '#9aa9b8', 'center', 2);
    });
    h.restore();
  },
};
