import * as THREE from 'three';
import { setupScene, lam, basic, PAL, cableMat, ship, building, tree } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeInOut, smooth, lerp, inv, mulberry, holdKeys } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off } from './common.js';
import { buildDiorama, bedY } from './s02_perjalanan.js';

const XB = 33, Z = 3;
export default {
  async build() {
    const { scene, camera } = setupScene({ top: '#a9d8f2', bot: '#eef7fb', near: 70, far: 170, fov: 38 });
    const dio = buildDiorama(scene, { landW: 12, seaW: 56, seed: 33 });
    const st0 = building(3, 2, 3, '#ffffff', PAL.cyan); st0.position.set(-5, 0, Z); scene.add(st0);
    const r = mulberry(3); for (let i = 0; i < 14; i++) { const t = tree(0.9 + r()); t.position.set(-11 + r() * 8, 0, -8 + r() * 16); scene.add(t); }
    const mat = cableMat({ color: '#26384d', pulse: PAL.cyan, dens: 14, speed: 0.4, pulseAmt: 0.0 });
    const cL = new THREE.Mesh(new THREE.BufferGeometry(), mat), cR = new THREE.Mesh(new THREE.BufferGeometry(), mat.clone()); scene.add(cL, cR);
    const boat = ship({}); boat.scale.setScalar(1.25); scene.add(boat);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 5), lam('#e8d9b0')); scene.add(rope);
    const grap = new THREE.Group(); const gm = lam('#5b6b7d'); const gs = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), gm); gs.position.y = 0.5; grap.add(gs); for (let i = 0; i < 4; i++) { const hk = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 4, 10, Math.PI), gm); hk.rotation.y = i * Math.PI / 2; hk.rotation.x = Math.PI; grap.add(hk); } scene.add(grap);
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), lam(PAL.orange)); scene.add(buoy);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), basic('#ffffff')); scene.add(pulse);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 6, 30), basic(PAL.red)); ring.position.set(XB, bedY(XB) + 0.2, Z); scene.add(ring);
    return { scene, camera, dio, cL, cR, boat, rope, grap, buoy, pulse, ring, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T);
    camRig(st.camera, holdKeys([
      [0, [24, 8, 46], [24, -3, 0]],
      [L(1), [16, 4, 36], [16, -3, 1]],
      [L(2), [37, 3.5, 25], [34, -3.2, 3]],
      [L(3), [41, 5, 20], [36, -1, 3]],
      [L(4), [24, 11, 50], [24, -3, 0]],
      [T.dur - 4, [20, 13, 54], [22, -3, 0]],
    ], 2.0), lt, 0.15);
    // ship arrives
    const sx = lerp(56, XB - 1.6, ap(lt, L(1) + 1, 7, easeInOut)); st.boat.position.set(sx, 0.05, Z + 0.3); st.boat.rotation.y = Math.PI; st.boat.position.y = 0.05 + Math.sin(lt * 1.3) * 0.06; st.boat.rotation.z = Math.sin(lt * 0.9) * 0.02;
    const bow = new THREE.Vector3(sx - 4.0, 1.4, Z);
    // grapnel path: lower, drag, hook (left end), lift
    const g0 = L(2) + 0.5, gDown = g0 + 2.5, gHook = gDown + 3.5, gUp = gHook + 3.2;
    let gp;
    const yb = x => bedY(x) + 0.25;
    if (lt < g0) gp = bow.clone();
    else if (lt < gDown) gp = bow.clone().lerp(new THREE.Vector3(XB - 6, yb(XB - 6), Z), easeInOut(inv(g0, gDown, lt)));
    else if (lt < gHook) { const x = lerp(XB - 6, XB - 1.2, inv(gDown, gHook, lt)); gp = new THREE.Vector3(x, yb(x), Z); }
    else gp = new THREE.Vector3(XB - 1.2, yb(XB - 1.2), Z).lerp(new THREE.Vector3(XB - 1.5, -0.2, Z), easeInOut(inv(gHook, gUp, lt)));
    const show = lt > g0 && lt < L(4);
    st.grap.visible = show; st.rope.visible = show; st.grap.position.copy(gp);
    const mid = bow.clone().lerp(gp, 0.5); const len = bow.distanceTo(gp); st.rope.position.copy(mid); st.rope.scale.y = Math.max(0.01, len); st.rope.lookAt(gp); st.rope.rotateX(Math.PI / 2);
    // cable halves with lifting
    const pL = ap(lt, gHook, gUp - gHook, easeInOut);
    const pR = ap(lt, L(3) + 1.0, 3.2, easeInOut);
    const top = new THREE.Vector3(XB - 1.5, -0.1, Z);
    const half = (x0, x1, p, end) => { const pts = []; const n = 40; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); const base = new THREE.Vector3(x, bedY(x) + 0.14, Z + Math.sin(x * 0.12) * 0.3); const w = end === 'R' ? smooth(XB + 9, XB, x) : smooth(XB - 9, XB, x); const lift = new THREE.Vector3(lerp(x, top.x + (end === 'R' ? 0.5 : -0.5), w), lerp(base.y, top.y, w * w), Z); pts.push(base.lerp(lift, p * w)); } return pts; };
    const lpts = half(-3, XB - 0.15, pL, 'L'), rpts = half(XB + 0.15, 55, pR, 'R');
    st.cL.geometry.dispose(); st.cL.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lpts), 160, 0.13, 6);
    st.cR.geometry.dispose(); st.cR.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rpts), 120, 0.13, 6);
    const repaired = lt > L(4) + 1;
    [st.cL, st.cR].forEach(c => { c.material.uniforms.uTime.value = lt; c.material.uniforms.uPulseAmt.value = repaired ? 1 : 0; });
    st.buoy.visible = pL > 0.6 && lt < L(4); st.buoy.position.set(XB - 2.2, 0.15 + Math.sin(lt * 1.5) * 0.08, Z + 1.2);
    // OTDR pulse
    const o0 = L(1) + 0.4, oHit = o0 + 3.0, oBack = oHit + 3.0;
    const px = lt < oHit ? lerp(-3, XB, inv(o0, oHit, lt)) : lerp(XB, -3, inv(oHit, oBack, lt));
    st.pulse.visible = lt > o0 && lt < oBack; st.pulse.position.set(px, bedY(px) + 0.3, Z); st.pulse.material.color.set(lt < oHit ? '#ffffff' : '#ff8a80');
    const rr = ((lt - oHit) % 1.2) / 1.2; st.ring.visible = lt > oHit && lt < L(4); st.ring.scale.setScalar(1 + rr * 1.5); st.ring.rotation.y = Math.PI / 2;
  },
  header(st, lt, T) { return { big: 'BAB 9', route: { state: lt > T.L(4) + 1 ? 'active' : 'cut' } }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj;
    const bp = pj(new THREE.Vector3(XB, bedY(XB) + 0.4, Z));
    H.label(h, off(bp, -40, -240), bp, 'LOKASI KERUSAKAN', { alpha: win(lt, L(1) + 3.4, L(2) + 1, 0.4), style: 'red', size: 38, tag: 'DARI PANTULAN SINYAL', tagColor: PAL.navy, tagFg: '#fff' });
    const sp = pj(st.boat.position.clone().add(new THREE.Vector3(0, 3.2, 0)));
    H.label(h, off(sp, 120, -120), sp, 'KAPAL PERBAIKAN KABEL', { alpha: win(lt, L(2) - 0.5, L(3) + 3, 0.4), size: 36, style: 'navy' });
    const gp = pj(st.grap.position); H.label(h, off(gp, -230, 90), gp, 'GRAPNEL', { alpha: win(lt, L(2) + 3, L(2) + 10, 0.4), size: 36, tag: 'PENGAIT', tagColor: PAL.yellow });
    const bu = pj(st.buoy.position); H.label(h, off(bu, -220, -150), bu, 'PELAMPUNG', { alpha: win(lt, L(2) + 10.2, L(3) + 4, 0.4), size: 34, tag: 'PENANDA', tagColor: PAL.orange });
    // splice inset
    const sa = win(lt, L(3) + 4.5, L(4) + 0.2, 0.5);
    H.card(h, 1200, 270, 660, 360, { alpha: sa, kicker: 'RUANG BERSIH DI KAPAL', title: 'Sambung serat satu per satu', titleSize: 52, accent: PAL.cyan, draw: (hh, x, y, w) => {
      const p = ap(lt, L(3) + 5.5, 3); const cx = x + w / 2, cy = y + 80; const gap = (1 - p) * 140;
      ['#12b5e5', '#e8473c', '#ffc233', '#3fbf6f'].forEach((c, i) => { hh.strokeStyle = c; hh.lineWidth = 6; const yy = cy - 30 + i * 20; hh.beginPath(); hh.moveTo(x + 50, yy); hh.lineTo(cx - gap / 2, yy); hh.moveTo(cx + gap / 2, yy); hh.lineTo(x + w - 50, yy); hh.stroke(); });
      if (p > 0.95 && Math.floor(lt * 8) % 2) { hh.fillStyle = '#fff3b0'; hh.beginPath(); hh.arc(cx, cy, 26, 0, 7); hh.fill(); }
      H.text(hh, p > 0.95 ? 'UJI SELURUH JALUR ✓' : 'MENYAMBUNG…', x + 50, cy + 80, H.F.mono(700, 24), p > 0.95 ? PAL.green : PAL.gray);
    } });
    // repair time chart
    const ta = win(lt, L(4) + 0.3, L(5) + 0.2, 0.5);
    H.card(h, 1120, 270, 740, 420, { alpha: ta, kicker: 'PRESENTASI INDUSTRI · 2011', title: 'Berapa lama?', titleSize: 64, accent: PAL.orange, draw: (hh, x, y, w) => {
      const rows = [['BERLAYAR KE LOKASI', 'beberapa hari', 0.55, PAL.gray], ['OPERASI DI LOKASI', '3–5 hari', 0.8, PAL.orange], ['SATU SAMBUNGAN', '12–24 jam', 0.25, PAL.cyan], ['+ CUACA BURUK', 'tidak pasti', 0.4, '#b9c6d3']];
      rows.forEach(([a, b, f, c], i) => { const q = ap(lt, L(4) + 1 + i * 1.6, 0.8); const yy = y + 10 + i * 66; H.text(hh, a, x + 34, yy + 28, H.F.cond(700, 28), PAL.navy, 'left', 1.5); hh.fillStyle = '#e4ebf2'; H.rr(hh, x + 300, yy + 6, w - 340, 32, 8); hh.fill(); hh.fillStyle = c; H.rr(hh, x + 300, yy + 6, (w - 340) * f * easeOut(q), 32, 8); hh.fill(); hh.save(); hh.globalAlpha *= q; H.text(hh, b, x + 312, yy + 30, H.F.mono(700, 20), '#fff'); hh.restore(); });
    } });
    H.card(h, 1160, 270, 700, 330, { alpha: win(lt, L(5) + 0.4, T.dur + 1, 0.5), kicker: 'TANTANGAN DI INDONESIA', title: 'Perizinan', titleSize: 76, body: 'Bifrost sempat molor, salah satunya karena izin pendaratan & melintas perairan Indonesia.', bodySize: 30, accent: PAL.red, chip: 'IZIN', chipColor: PAL.red });
  },
};
