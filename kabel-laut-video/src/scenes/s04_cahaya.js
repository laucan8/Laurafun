import * as THREE from 'three';
import { setupScene, lam, basic, PAL, cableMat, tubeFrom, building } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeInOut, mulberry, lerp, inv } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off, mapWorld, setCable, cityV, flashA, INTL_SG, ROUTES } from './common.js';
import { underwater } from './s03_anatomi.js';

const LANES = [['#12b5e5', 0], ['#e8473c', 1.57], ['#3fbf6f', 3.14], ['#a46cf0', 4.71]];
export default {
  async build({ GEO }) {
    // --- A: inside the fiber
    const A = setupScene({ top: '#cdeef8', bot: '#f4fbfd', fogColor: '#e8f6fb', near: 25, far: 170, fov: 50 });
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 400, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#8fd3ea', side: THREE.BackSide, transparent: true, opacity: 0.6 }));
    tun.rotation.x = Math.PI / 2; tun.position.z = -190; A.scene.add(tun);
    const ringM = new THREE.MeshBasicMaterial({ color: '#4fb3dc', transparent: true, opacity: 0.8 });
    for (let z = 0; z > -380; z -= 7) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.98, 0.04, 4, 40), ringM); r.position.z = z; A.scene.add(r); }
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 400, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.BackSide, transparent: true, opacity: 0.25 }));
    core.rotation.x = Math.PI / 2; core.position.z = -190; A.scene.add(core);
    const r = mulberry(21); const caps = new THREE.CapsuleGeometry(0.11, 1.8, 3, 6); caps.rotateX(Math.PI / 2);
    const pulses = [];
    LANES.forEach(([c, ang], li) => {
      const bits = []; for (let i = 0; i < 160; i++) if (r() < 0.55) bits.push(i);
      const im = new THREE.InstancedMesh(caps, basic(c), bits.length); im.frustumCulled = false;
      im.userData = { bits, ang: ang + 0.4, rad: 0.75 }; A.scene.add(im); pulses.push(im);
    });
    // --- B: seabed with repeaters + PFE station
    const B = underwater({ near: 18, far: 80, seed: 3, clear: [-3, 16] });
    const st0 = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), [lam('#c49b69'), lam('#c49b69'), lam('#a9cf7a'), lam('#c49b69'), lam('#c49b69'), lam('#c49b69')]);
    st0.position.set(-26, 0.5, 0); B.scene.add(st0);
    const bld = building(4, 2.6, 4, '#ffffff', PAL.cyan); bld.position.set(-27, 4, -1); B.scene.add(bld);
    const pfe = new THREE.Group(); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.9), lam('#e9eef3')); cab.position.y = 1.1; pfe.add(cab);
    for (let i = 0; i < 5; i++) { const led = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.05), basic(i % 2 ? PAL.yellow : '#3fbf6f')); led.position.set(0, 0.5 + i * 0.32, 0.46); pfe.add(led); }
    const bolt = new THREE.Mesh(new THREE.CircleGeometry(0.28, 3), basic(PAL.yellow)); bolt.position.set(0, 2.0, 0.47); pfe.add(bolt);
    pfe.position.set(-23.2, 4, 2.2); B.scene.add(pfe);
    const cpts = [new THREE.Vector3(-22.5, 4.1, 2.2), new THREE.Vector3(-20, 0, 1.5), new THREE.Vector3(-17, -2.6, 0.5)];
    for (let x = -14; x <= 130; x += 4) cpts.push(new THREE.Vector3(x, -2.72 + Math.sin(x * 0.2) * 0.08, Math.sin(x * 0.05) * 0.8));
    const bcable = tubeFrom(cpts, 0.16, cableMat({ color: '#26384d', pulse: PAL.cyan, dens: 30, speed: 0.6, pulseAmt: 0.0 }), 600, 6); B.scene.add(bcable);
    const power = tubeFrom(cpts.map(p => p.clone().add(new THREE.Vector3(0, 0.03, 0))), 0.2, cableMat({ color: PAL.yellow, pulse: '#ffffff', dens: 40, speed: 1.2, dash: true, transparent: true, opacity: 0.9 }), 600, 6); B.scene.add(power);
    const reps = []; for (let x = -4; x <= 120; x += 14) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.8, 14), lam('#c9d2db')); body.rotation.z = Math.PI / 2; g.add(body); for (const s of [-1, 1]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 14), lam('#c9d2db')); cone.rotation.z = -s * Math.PI / 2; cone.position.x = s * 1.2; g.add(cone); } const glow = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 6, 20), basic(PAL.yellow)); glow.rotation.y = Math.PI / 2; g.add(glow); g.userData.glow = glow; g.position.set(x, -2.6, Math.sin(x * 0.05) * 0.8); B.scene.add(g); reps.push(g); }
    const sig = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), basic('#ffffff')); B.scene.add(sig);
    const sigHalo = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: PAL.cyan, transparent: true, opacity: 0.4, depthWrite: false })); B.scene.add(sigHalo);
    // --- C: map Jakarta–Singapore
    const C = mapWorld(GEO, { near: 40, far: 120 });
    INTL_SG.forEach(n => C.add(n, PAL.cyan, 0.06));
    const mx = C.add('matrix', PAL.cyan, 0.1); const ncc = C.add('batamsg', PAL.orange, 0.06);
    const pulseC = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), basic('#ffffff')); C.scene.add(pulseC);
    return { scene: A.scene, camera: A.camera, A, B, C, pulses, bcable, power, reps, sig, sigHalo, mx, ncc, pulseC, pjB: projector(B.camera), pjC: projector(C.camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    const cut1 = L(2) - 0.15, cut2 = L(4) - 0.15;
    st.phase = lt < cut1 ? 0 : lt < cut2 ? 1 : 2;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
    if (st.phase === 0) {
      st.scene = st.A.scene; st.camera = st.A.camera;
      const cz = -lt * 6; st.camera.position.set(1.7 + Math.sin(lt * 0.3) * 0.2, 1.1 + Math.cos(lt * 0.25) * 0.15, cz); st.camera.lookAt(0, 0, cz - 26);
      const show = ap(lt, L(1) + 0.3, 1.2);
      st.pulses.forEach((im, li) => { const { bits, ang, rad } = im.userData; bits.forEach((b, i) => { const z = cz - 4 - ((b * 2.6 + lt * 38 + li * 7) % 330); const sc = (li === 0 ? 1 : show); s.set(sc, sc, sc); v.set(Math.cos(ang) * rad, Math.sin(ang) * rad, z); m.compose(v, q, s); im.setMatrixAt(i, m); }); im.instanceMatrix.needsUpdate = true; im.visible = li === 0 || show > 0.01; });
    } else if (st.phase === 1) {
      st.scene = st.B.scene; st.camera = st.B.camera;
      const t1 = inv(cut1, L(3), lt); const camX = lerp(-6, 58, easeInOut(t1));
      const atPFE = ap(lt, L(3) + 0.2, 1.8, easeInOut), back = ap(lt, L(3) + 7, 3, easeInOut);
      const p1 = [camX - 2, 1.4, 9.5], l1 = [camX + 6, -2.5, 0.5];
      const p2 = [-20, 5.8, 8.5], l2 = [-23.4, 5, 2.2];
      const p3 = [8, 6, 26], l3 = [10, -2, 0];
      const pp = p1.map((a, i) => lerp(lerp(a, p2[i], atPFE), p3[i], back)), ll = l1.map((a, i) => lerp(lerp(a, l2[i], atPFE), l3[i], back));
      st.camera.position.set(...pp); st.camera.lookAt(...ll);
      // signal pulse travelling with amplitude decay between repeaters
      const sx = lerp(-10, 64, inv(cut1, L(3), lt)) + (lt > L(3) ? (lt - L(3)) * 10 : 0);
      const xx = -14 + ((sx + 14) % 140); st.sig.position.set(xx, -2.55, Math.sin(xx * 0.05) * 0.8); st.sigHalo.position.copy(st.sig.position);
      const d = ((xx + 4) % 14 + 14) % 14; const amp = Math.exp(-d * 0.14); st.sig.scale.setScalar(0.5 + amp * 0.8); st.sigHalo.material.opacity = 0.15 + 0.4 * amp;
      st.amp = amp; st.sx = xx;
      const powered = ap(lt, L(3) + 3, 1.0);
      setCable(st.power, lt, { op: powered, prog: ap(lt, L(3) + 3, 6) });
      st.reps.forEach((g, i) => { const on = ap(lt, L(3) + 3 + i * 0.6, 0.4); g.userData.glow.visible = on > 0.5; g.userData.glow.scale.setScalar(1 + 0.15 * Math.sin(lt * 6 + i)); });
      setCable(st.bcable, lt, {});
    } else {
      st.scene = st.C.scene; st.camera = st.C.camera;
      camRig(st.camera, [
        [cut2, [-6.5, 15, 12], [-7.3, 0, 4.5]],
        [L(5) - 0.2, [-7.5, 13, 10], [-7.6, 0, 4.0]],
        [L(5) + 1.2, [-10.6, 2.6, 2.6], [-10.95, 0, 1.75]],
        [L(6) + 0.3, [-10.4, 2.3, 2.4], [-10.95, 0, 1.75]],
        [T.dur, [-6, 22, 18], [-6, 0, 1]],
      ], lt, 0.08);
      Object.values(st.C.cables).forEach(c => setCable(c, lt, {}));
      setCable(st.mx, lt, { color: lt < L(5) ? PAL.cyan : '#7fcde6' });
      setCable(st.ncc, lt, { op: ap(lt, L(5), 0.6) });
      const curve = (lt < L(5) ? st.mx : st.ncc).userData.curve; const u = ((lt - cut2) % 1.6) / 1.6;
      st.pulseC.position.copy(curve.getPointAt(1 - u)); st.pulseC.position.y += 0.15;
      st.pulseC.scale.setScalar(lt < L(5) ? 1.4 : 0.22);
    }
  },
  header() { return { big: 'BAB 4' }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T);
    if (st.phase === 0) {
      const a = win(lt, L(1) + 1.0, L(2), 0.5);
      if (a > 0) {
        h.save(); h.globalAlpha = a;
        H.rr(h, 1260, 300, 600, 300, 14); h.fillStyle = 'rgba(255,255,255,0.94)'; h.fill();
        H.text(h, 'SATU SERAT, BANYAK WARNA', 1290, 350, H.F.cond(700, 40), PAL.navy, 'left', 2);
        LANES.forEach(([c], i) => { h.fillStyle = c; H.rr(h, 1290, 380 + i * 50, 120, 32, 8); h.fill(); H.text(h, `λ${i + 1}  →  jalur data ${i + 1}`, 1430, 405 + i * 50, H.F.mono(500, 24), PAL.navy); });
        h.restore();
      }
      // binary ticker
      const ba = win(lt, L(1) - 2, L(2), 0.5);
      if (ba > 0) { h.save(); h.globalAlpha = ba * 0.85; let s = ''; for (let i = 0; i < 46; i++) s += ((Math.sin(i * 12.9898 + Math.floor(lt * 12) * 78.233) * 43758.5453) % 1 + 1) % 1 > 0.5 ? '1 ' : '0 '; H.rr(h, 36, 250, 1180, 48, 8); h.fillStyle = 'rgba(19,36,59,0.85)'; h.fill(); H.text(h, s, 56, 283, H.F.mono(700, 24), '#9fe6ff', 'left', 2); h.restore(); }
    } else if (st.phase === 1) {
      const pj = st.pjB;
      // signal strength chart
      const a = win(lt, L(2) + 0.6, L(3) + 0.5, 0.5);
      if (a > 0) {
        h.save(); h.globalAlpha = a; const X = 1180, Y = 270, W = 680, Hh = 260;
        H.rr(h, X, Y, W, Hh, 14); h.fillStyle = 'rgba(255,255,255,0.94)'; h.fill();
        H.text(h, 'KEKUATAN SINYAL CAHAYA', X + 26, Y + 44, H.F.cond(700, 34), PAL.navy, 'left', 2);
        h.strokeStyle = '#d5dee7'; h.lineWidth = 2; h.beginPath(); h.moveTo(X + 30, Y + Hh - 40); h.lineTo(X + W - 30, Y + Hh - 40); h.stroke();
        h.strokeStyle = PAL.cyan; h.lineWidth = 4; h.beginPath();
        const prog = clamp(inv(L(2) - 0.15, L(3), lt) * 1.1);
        for (let i = 0; i <= 300 * prog; i++) { const u = i / 300; const d = (u * 4.5 % 1); const y = Y + Hh - 46 - 140 * Math.exp(-d * 2.2); const x = X + 30 + u * (W - 60); i ? h.lineTo(x, y) : h.moveTo(x, y); }
        h.stroke();
        for (let k = 1; k < 5; k++) { const x = X + 30 + (k / 4.5) * (W - 60); if (k / 4.5 <= prog) { h.fillStyle = PAL.yellow; h.beginPath(); h.arc(x, Y + Hh - 40, 7, 0, 7); h.fill(); } }
        H.text(h, '● REPEATER menyegarkan sinyal', X + 30, Y + Hh - 10, H.F.mono(500, 20), PAL.gray);
        h.restore();
      }
      const rp = st.reps.find(g => { const p = pj(g.position); return p && p.x > 600 && p.x < 1300; });
      if (rp && lt < L(3)) { const p = pj(rp.position); H.label(h, off(p, 0, -230), p, 'REPEATER', { alpha: win(lt, L(2) + 2, L(3) - 0.2, 0.4), tag: 'PENGUAT', tagColor: PAL.yellow }); }
      const pp = pj(new THREE.Vector3(-23.2, 6.2, 2.2));
      H.label(h, off(pp, 340, -120), pp, 'POWER FEED EQUIPMENT', { alpha: win(lt, L(3) + 1.0, L(4) - 0.3, 0.5), style: 'navy', tag: 'ARUS SEARAH', tagColor: PAL.yellow });
      H.stat(h, 1460, 560, '≈ 10–15 RIBU V', 'TEGANGAN · SISTEM SANGAT PANJANG', { alpha: win(lt, T.w(3, 'tegangan') - 0.2, L(4) - 0.3, 0.5), align: 'center', size: 84, color: '#b27a00' });
    } else {
      const pj = st.pjC;
      H.pin(h, pj(cityV('jakarta')), 'JAKARTA', ap(lt, L(4) + 0.3, 0.4), { left: true });
      H.pin(h, pj(cityV('singapore')), 'SINGAPURA', ap(lt, L(4) + 0.5, 0.4), { dot: PAL.red });
      if (lt > L(5)) { H.pin(h, pj(cityV('batam')), 'BATAM · NONGSA', ap(lt, L(5) + 1, 0.4), { dy: 30 }); H.pin(h, pj(cityV('changi')), 'CHANGI', ap(lt, L(5) + 1.2, 0.4), { dot: PAL.red, left: true, dy: -30 }); }
      const a = win(lt, L(4) + 1, L(5) - 0.2, 0.5);
      H.card(h, 1150, 270, 720, 300, { alpha: a, kicker: 'PERHITUNGAN ILUSTRATIF', title: '≈ 5 milidetik', titleSize: 84, accent: PAL.cyan, draw: (hh, x, y) => {
        H.text(hh, 'Cahaya di kaca ≈ 200.000 km/detik', x + 34, y + 30, H.F.mono(500, 24), PAL.navy);
        H.text(hh, 'Jakarta → Singapura ≈ 900 km', x + 34, y + 70, H.F.mono(500, 24), PAL.navy);
        H.text(hh, '900 ÷ 200.000 ≈ 0,0045 detik', x + 34, y + 110, H.F.mono(700, 24), PAL.cyan);
      } });
      H.stat(h, 1460, 300, '< 2 ms', 'NONGSA–CHANGI · KLAIM TELKOM', { alpha: win(lt, L(5) + 1.2, L(6) + 0.5, 0.5), align: 'center', color: PAL.orange });
      H.label(h, { x: 1340, y: 600 }, null, 'SINGAPURA = MAGNET', { alpha: win(lt, L(6) + 2.5, T.dur, 0.5), size: 52, style: 'red' });
    }
  },
  overlay(st, h, lt, T) { H.flash(h, flashA(lt, T.L(2) - 0.15, 0.35) + flashA(lt, T.L(4) - 0.15, 0.35)); },
};
