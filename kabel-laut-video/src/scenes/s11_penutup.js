import * as THREE from 'three';
import { PAL, lonlat3 } from '../lib/world.js';
import { ap, win, camRig, clamp, easeInOut, easeOutBack, lerp, inv } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { setCable, flashA, cityV } from './common.js';
import s00 from './s00_coldopen.js';
import { SOURCES_LIST } from './sources_list.js';

export default {
  async build(ctx) {
    const st = await s00.build(ctx);
    st.post.visible = false;
    return st;
  },
  update(st, lt, T) {
    const L = T.L.bind(T); const sw = L(3) - 0.1; st.phase = lt < sw ? 1 : 0;
    const beat = 0.6 + 0.4 * Math.pow(Math.max(0, Math.sin(lt * Math.PI * 1.1)), 8);
    if (st.phase === 1) {
      st.scene = st.B.scene; st.camera = st.B.camera;
      camRig(st.camera, [[0, [-9.5, 9, 9], [-10.6, 0, 2.0]], [L(1), [-7, 16, 15], [-8, 0, 2.5]], [L(2) + 1, [-3, 26, 22], [-4, 0, 1.5]], [sw, [0, 34, 28], [-2, 0, 1]]], lt, 0.15);
      Object.values(st.B.cables).forEach(c => { setCable(c, lt, { prog: 1, color: PAL.cyan }); c.material.uniforms.uPulseAmt.value = beat; });
      const pr = (lt % 1.4) / 1.4; st.pulseB.scale.setScalar(1 + pr * 2.2); st.pulseB.material.opacity = (1 - pr) * 0.8;
    } else {
      st.scene = st.A.scene; st.camera = st.A.camera;
      const u = easeInOut(inv(sw, T.dur - 8, lt)); const lon = lerp(104, 150, u), lat = lerp(2, 12, u), dist = lerp(18, 40, u);
      const p = lonlat3(lon, lat, dist); st.camera.position.copy(p); st.camera.lookAt(0, 0, 0);
      st.A.sun.position.copy(p).add(new THREE.Vector3(0, 14, 0)).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
      Object.values(st.glc).forEach(m => { setCable(m, lt, { prog: 1 }); m.material.uniforms.uPulseAmt.value = beat; });
      const pr = (lt % 1.6) / 1.6; st.ring.scale.setScalar(1 + pr * 2.5); st.ring.material.opacity = 1 - pr;
    }
  },
  header(st, lt, T) { return { big: 'PENUTUP', date: '31 OKT 2026', hide: ap(lt, T.L(5) + 2, 0.8), noSrc: lt > T.L(5) + 2, noCaption: lt > T.L(5) + 2.2 }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T);
    const items = [['check', PAL.cyan, 'Trafik internasional: sangat bergantung pada Singapura'], ['cross', PAL.red, 'Tidak ada “satu tombol” untuk memadamkan Indonesia'], ['bolt', PAL.yellow, 'Kuncinya: jalur, pusat data, ketahanan sendiri']];
    items.forEach(([ic, c, s], i) => { const a = win(lt, L(1) + 0.8 + i * 2.6, L(2) + 6, 0.5); if (a <= 0) return; h.save(); h.globalAlpha = a; const y = 290 + i * 100; const x = 1000 + (1 - easeOutBack(clamp(a))) * 60; H.rr(h, x, y, 860, 80, 14); h.fillStyle = '#fff'; h.fill(); h.fillStyle = c; H.rr(h, x, y, 80, 80, 14); h.fill(); H.icon(h, ic, x + 40, y + 40, 48, '#fff'); H.text(h, s, x + 104, y + 51, H.F.sans(600, 30), PAL.navy); h.restore(); });
    H.label(h, { x: 960, y: 330 }, null, 'NADI BERSAMA', { alpha: win(lt, T.w(2, 'nadi') - 0.2, L(3) - 0.3, 0.5), size: 80, style: 'navy' });
    // CTA poll
    const ca = win(lt, L(4) + 0.2, L(5) + 2, 0.5);
    H.card(h, 520, 260, 880, 470, { alpha: ca, kicker: 'TULIS DI KOMENTAR', title: 'Indonesia harus fokus ke mana dulu?', titleSize: 62, accent: PAL.red, draw: (hh, x, y, w) => {
      ['A · Kabel & gerbang baru', 'B · Pusat data & IX lokal', 'C · Izin cepat & pasti', 'D · Ketahanan & pemulihan'].forEach((s, i) => { const yy = y + 10 + i * 62; hh.fillStyle = '#eef3f7'; H.rr(hh, x + 34, yy, w - 68, 50, 10); hh.fill(); H.text(hh, s, x + 56, yy + 35, H.F.cond(600, 34), PAL.navy, 'left', 1); });
    } });
    // credits roll
    const cr = ap(lt, L(5) + 2, 0.8);
    if (cr > 0) {
      h.save(); h.globalAlpha = cr; h.fillStyle = 'rgba(240,247,251,0.9)'; h.fillRect(0, 0, 1920, 1080);
      H.text(h, 'NADI DI DASAR LAUT', 960, 150, H.F.cond(700, 96), PAL.navy, 'center', 6);
      H.text(h, 'SUMBER (per 31 Okt 2026) — daftar lengkap di deskripsi', 960, 210, H.F.mono(700, 24), PAL.gray, 'center', 2);
      const span = T.dur - (L(5) + 2.5); const off = clamp(inv(L(5) + 2.5, T.dur - 1.5, lt)) * Math.max(0, SOURCES_LIST.length * 34 - 600);
      h.save(); h.beginPath(); h.rect(0, 240, 1920, 700); h.clip();
      SOURCES_LIST.forEach((s, i) => { const y = 290 + i * 34 - off; if (y < 230 || y > 960) return; const t = s.length > 118 ? s.slice(0, 116) + '…' : s; H.text(h, `${String(i + 1).padStart(2, '0')}  ${t}`, 200, y, H.F.mono(500, 19), PAL.navy); });
      h.restore();
      H.text(h, 'Visual: ilustrasi rekonstruksi, rute kabel disederhanakan · Suara: AI (id-ID) · Musik: sintetis orisinal', 960, 1000, H.F.mono(500, 20), PAL.gray, 'center');
      h.restore();
    }
  },
  overlay(st, h, lt, T) { H.flash(h, flashA(lt, T.L(3) - 0.1, 0.4)); },
};
