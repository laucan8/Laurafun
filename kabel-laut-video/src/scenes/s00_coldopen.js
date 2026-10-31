import * as THREE from 'three';
import { setupScene, buildGlobe, cableMat, tubeFrom, lonlat3, canvasPlane, PAL } from '../lib/world.js';
import { ap, win, clamp, easeOut, easeInOut, track, camRig, inv, lerp, easeOutBack } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { mapWorld, setCable, projector, globePath, cityV, flashA, INTL_SG, DOMESTIC, off } from './common.js';

const R = 10;
const GL = {
  europe: [[103.8, 1.3], [95, 6.5], [80, 5.8], [60, 13], [44, 12], [38, 20], [32.5, 30.5], [20, 35], [5.4, 43.3]],
  japan_us: [[103.9, 1.3], [110, 9], [114.2, 22.3], [125, 28], [139.7, 35], [165, 38], [-160, 36], [-122, 37]],
  aus: [[103.9, 1.3], [105.5, -8], [110, -22], [115.8, -32]],
  aus2: [[106.8, -6.1], [112, -18], [135, -38], [151.2, -33.9]],
  pac: [[124.8, 1.5], [144.7, 13.4], [-158, 21.3], [-118.2, 33.9]],
  india: [[103.8, 1.3], [92, 8], [80.3, 13.1]],
  hk: [[103.9, 1.4], [108, 12], [121, 18], [121.5, 25]],
};
export default {
  async build({ GEO, T }) {
    // ---- phase A: globe
    const A = setupScene({ top: '#a9d8f3', bot: '#eef7fb', fog: false, fov: 36 });
    const globe = buildGlobe(GEO.dots, R); A.scene.add(globe);
    const glc = {};
    for (const [k, w] of Object.entries(GL)) { const m = tubeFrom(globePath(w, R, 1.012), 0.05, cableMat({ color: PAL.cyan, dens: 4, speed: 0.4, transparent: true }), 200, 5); A.scene.add(m); glc[k] = m; }
    const sg = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: PAL.red })); sg.position.copy(lonlat3(103.85, 1.3, R * 1.02)); A.scene.add(sg);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 32), new THREE.MeshBasicMaterial({ color: PAL.red, transparent: true, side: THREE.DoubleSide }));
    ring.position.copy(sg.position); ring.lookAt(new THREE.Vector3()); A.scene.add(ring);
    A.scene.add(A.camera);
    // post card (illustrative reconstruction) attached to camera
    const post = canvasPlane(1000, 1180, (x, w, hh) => {
      H.rr(x, 10, 10, w - 20, hh - 20, 36); x.fillStyle = '#fff'; x.fill();
      x.fillStyle = '#d5dde6'; x.beginPath(); x.arc(110, 120, 56, 0, 7); x.fill();
      H.text(x, 'CC', 110, 140, H.F.cond(700, 54), '#5b6b7d', 'center');
      H.text(x, 'Calvin Cheng', 190, 112, H.F.sans(700, 44), '#0f1419');
      H.text(x, '@calvinelcheng · 25 Okt 2026', 190, 160, H.F.sans(400, 32), '#536471');
      H.text(x, 'X', w - 90, 135, H.F.sans(700, 64), '#0f1419', 'center');
      H.text(x, 'Cut?', 64, 290, H.F.sans(700, 92), '#0f1419');
      H.rr(x, 54, 340, w - 108, 690, 26); x.fillStyle = PAL.navy; x.fill();
      H.text(x, "INDONESIA'S INTERNET", w / 2, 430, H.F.cond(700, 64), '#fff', 'center', 3);
      H.text(x, 'DEPENDENCE ON SINGAPORE', w / 2, 500, H.F.cond(700, 64), '#fff', 'center', 3);
      H.text(x, '90%', w / 2, 760, H.F.cond(700, 260), PAL.red, 'center', 4);
      H.text(x, 'international internet traffic', w / 2, 850, H.F.sans(600, 40), '#dfe8f1', 'center');
      H.text(x, 'passes through Singapore', w / 2, 905, H.F.sans(600, 40), '#dfe8f1', 'center');
      H.rr(x, w / 2 - 250, 955, 500, 50, 10); x.fillStyle = 'rgba(255,255,255,0.14)'; x.fill();
      H.text(x, 'REKONSTRUKSI ILUSTRATIF', w / 2, 990, H.F.mono(700, 26), '#fff', 'center', 3);
      H.text(x, '♡ 12,4K    ⟲ 3,1K    💬 2,8K', 64, 1110, H.F.sans(400, 32), '#536471');
    }, 3.7);
    post.position.set(-1.9, -0.3, -9); A.camera.add(post);
    // ---- phase B: SEA map
    const B = mapWorld(GEO, { near: 60, far: 150 });
    INTL_SG.forEach(n => B.add(n, PAL.cyan, 0.075));
    ['seaus', 'smpcs', 'dumai_melaka', 'jkt_au', 'bifrost_jkt', 'bifrost_mdo'].forEach(n => B.add(n, PAL.cyan, 0.06));
    const sgB = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 20), new THREE.MeshBasicMaterial({ color: PAL.red })); sgB.position.copy(cityV('singapore', 0.2)); B.scene.add(sgB);
    const pulseB = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 40), new THREE.MeshBasicMaterial({ color: PAL.red, transparent: true, side: THREE.DoubleSide })); pulseB.rotation.x = -Math.PI / 2; pulseB.position.copy(cityV('singapore', 0.25)); B.scene.add(pulseB);
    return { scene: A.scene, camera: A.camera, A, B, glc, post, ring, sg, sgB, pulseB, pjA: projector(A.camera), pjB: projector(B.camera) };
  },
  update(st, lt, T) {
    const sw = T.L(3) - 0.05; st.phase = lt < sw ? 0 : 1;
    if (st.phase === 0) {
      st.scene = st.A.scene; st.camera = st.A.camera;
      const lon = lerp(78, 108, easeInOut(inv(0, sw, lt))), lat = lerp(14, 4, inv(0, sw, lt));
      const dist = lerp(36, 25.5, easeInOut(inv(0, sw, lt)));
      const p = lonlat3(lon, lat, dist); st.camera.position.copy(p); st.camera.lookAt(lonlat3(lon + 6, lat - 2, 0).multiplyScalar(0));
      st.camera.lookAt(0, 0, 0);
      st.A.sun.position.copy(p).add(new THREE.Vector3(0, 14, 0)).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
      let k = 0; for (const m of Object.values(st.glc)) { setCable(m, lt, { prog: ap(lt, 0.8 + k * 0.7, 4.5) }); k++; }
      const pr = (lt % 1.6) / 1.6; st.ring.scale.setScalar(1 + pr * 2.5); st.ring.material.opacity = 1 - pr;
      // post card motion
      const pin = ap(lt, T.L(0) + 0.5, 1.2), pout = ap(lt, sw - 1.2, 0.9);
      st.post.position.set(lerp(-6.5, -2.1, easeOut(pin)) - pout * 6, -0.35 + Math.sin(lt * 0.6) * 0.1, -9);
      st.post.rotation.set(Math.sin(lt * 0.5) * 0.03, 0.32 - pin * 0.12 + Math.sin(lt * 0.4) * 0.04, 0.02);
      st.post.visible = pin > 0 && pout < 1;
      const s90 = 1 + 0.04 * win(lt, T.L(2), T.L(2) + 2, 0.4); st.post.scale.setScalar(s90);
    } else {
      st.scene = st.B.scene; st.camera = st.B.camera;
      const L = T.L.bind(T);
      camRig(st.camera, [
        [L(3), [-4, 26, 24], [-4, 0, 1]],
        [L(4) + 0.5, [-10.5, 9, 6.5], [-9.6, 0, 2.2]],
        [L(5) + 0.3, [-6, 20, 18], [-5.5, 0, 1.5]],
        [L(6) + 0.5, [2, 30, 25], [0, 0, 0]],
        [L(7), [-8, 15, 14], [-8, 0, 1.5]],
        [T.dur, [-9, 12, 10.5], [-9, 0, 1.4]],
      ], lt, 0.2);
      const cutT = T.L(4) + 1.2;
      for (const [n, m] of Object.entries(st.B.cables)) {
        const isMx = n === 'matrix'; const k = Object.keys(st.B.cables).indexOf(n);
        setCable(m, lt, { prog: ap(lt, L(3) + 0.1 + k * 0.12, 1.6), color: isMx && lt > cutT ? (Math.floor(lt * 4) % 2 ? PAL.red : '#ff9b8f') : PAL.cyan });
      }
      const pr = (lt % 1.4) / 1.4; st.pulseB.scale.setScalar(1 + pr * 2.2); st.pulseB.material.opacity = (1 - pr) * 0.8;
    }
  },
  header(st, lt, T) {
    const cut = lt > T.L(4) + 1.2 && lt < T.L(6);
    return { big: lt < T.L(1) ? '--:--' : 'CUT?', route: { state: cut ? 'cut' : 'active' }, hide: ap(lt, T.dur - 6.6, 0.4) * 0.0 };
  },
  hud(st, h, lt, T) {
    if (st.phase === 0) {
      const pj = st.pjA; const sgp = pj(st.sg.position);
      H.label(h, off(sgp, 260, -150), sgp, 'SINGAPURA', { alpha: win(lt, 4.0, T.L(0) + 0.4, 0.5), style: 'navy', tag: 'HUB', tagColor: PAL.red, tagFg: '#fff' });
      if (lt < T.L(0) + 1) H.label(h, { x: 1500, y: 560 }, null, 'KABEL BAWAH LAUT', { alpha: win(lt, 1.2, T.L(0) + 0.5, 0.5), size: 36, tag: 'AKTIF', tagColor: PAL.cyan });
    } else {
      const pj = st.pjB; const L = T.L.bind(T);
      const sgp = pj(cityV('singapore'));
      H.pin(h, sgp, 'SINGAPURA', ap(lt, L(3) + 0.6, 0.5), { dot: PAL.red });
      H.pin(h, pj(cityV('jakarta')), 'JAKARTA', ap(lt, L(3) + 0.9, 0.5), { left: true });
      const cutp = pj(cityV('bangka', 0.2).add(new THREE.Vector3(0.6, 0, -0.9)));
      H.label(h, off(cutp, 120, -170), cutp, 'PUTUS?', { alpha: win(lt, L(4) + 1.4, L(5) + 0.5), style: 'red', size: 46 });
      const jk = pj(cityV('jakarta')); H.label(h, off(jk, 160, -230), jk, '90%?', { alpha: win(lt, T.w(5, '90'), L(6) + 0.2), size: 64, style: 'navy' });
      H.label(h, { x: 1240, y: 420 }, null, 'DARI MANA?', { alpha: win(lt, T.w(5, 'asal'), L(6) + 0.2), size: 50 });
      H.label(h, off(sgp, -260, -170), sgp, 'KENAPA SINGAPURA?', { alpha: win(lt, T.w(5, 'kecil'), L(6) + 0.2), size: 50, style: 'red' });
      // teaser montage cards
      const items = [['01', 'CARA KERJA KABEL', T.w(6, 'Cara')], ['02', 'FAKTA ANGKA 90%', T.w(6, 'fakta')], ['03', 'TEORI & DOKUMEN BOCOR 2013', T.w(6, 'teori')], ['04', 'SKENARIO TERBURUK', T.w(6, 'skenario')]];
      items.forEach(([n, s, at], i) => {
        const a = win(lt, at, L(7) - 0.2, 0.45); if (a <= 0) return;
        const x = 80 + i * 450, y = 640;
        H.card(h, x, y, 420, 190, { alpha: a, kicker: 'BAGIAN ' + n, title: s, titleSize: 46, accent: [PAL.cyan, PAL.navy, PAL.orange, PAL.red][i] });
      });
      // title card
      const ta = ap(lt, L(7) - 0.1, 0.7);
      if (ta > 0) {
        h.save(); h.globalAlpha = ta; h.fillStyle = 'rgba(234,245,251,0.55)'; h.fillRect(0, 0, 1920, 1080); h.restore();
        const s = 0.92 + 0.08 * easeOutBack(clamp(ta));
        h.save(); h.translate(960, 470); h.scale(s, s); h.globalAlpha = ta;
        H.text(h, 'NADI DI DASAR LAUT', 0, 0, H.F.cond(700, 170), PAL.navy, 'center', 8);
        h.fillStyle = PAL.cyan; h.fillRect(-380, 34, 760, 8);
        H.text(h, 'Benarkah 90% Internet Indonesia Bergantung pada Singapura?', 0, 110, H.F.sans(600, 44), PAL.navy, 'center');
        h.restore();
      }
    }
  },
  overlay(st, h, lt, T) { H.flash(h, flashA(lt, T.L(3) - 0.05, 0.4)); },
};
