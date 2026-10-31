import * as THREE from 'three';
import { setupScene, buildSeabed, lam, basic, PAL, cableMat } from '../lib/world.js';
import { ap, win, camRig, clamp, easeOut, easeInOut, mulberry } from '../lib/util.js';
import * as H from '../lib/hud.js';
import { projector, off } from './common.js';

export function underwater(o = {}) {
  const S = setupScene({ top: '#79cbe6', mid: '#a9e0ef', bot: '#dff3f8', fogColor: '#c4eaf3', near: o.near ?? 14, far: o.far ?? 70, hemi: 1.7, sun: 1.5, fov: 38, ground: 0xd9c9a0 });
  const bed = buildSeabed({ size: o.size || 140, seed: o.seed || 11, rocks: 50, weeds: 90, clear: o.clear }); bed.position.y = o.bedY ?? -3; S.scene.add(bed);
  // light shafts
  const r = mulberry(17); const shaftM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2 + r() * 3, 40), shaftM); m.position.set((r() - 0.5) * 60, 12, -10 - r() * 25); m.rotation.z = 0.35; m.rotation.y = r() - 0.5; S.scene.add(m); }
  // plankton
  const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 60; pos[i * 3 + 1] = r() * 14 - 3; pos[i * 3 + 2] = (r() - 0.5) * 40; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.06, transparent: true, opacity: 0.7 })); S.scene.add(pts);
  return { ...S, bed, pts };
}
function helix(x0, x1, R, k, ph, rad, mat, seg = 160) {
  const pts = []; for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60; const a = x * k + ph; pts.push(new THREE.Vector3(x, Math.cos(a) * R, Math.sin(a) * R)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, rad, 5), mat);
}
// layered cable along +x starting at x=0; returns group with layers
export function layeredCable(o = {}) {
  const g = new THREE.Group(); const L = {};
  const cyl = (r, len, mat, seg = 32) => { const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, false); geo.rotateZ(-Math.PI / 2); geo.translate(len / 2, 0, 0); return new THREE.Mesh(geo, mat); };
  const fcols = ['#12b5e5', '#e8473c', '#ffc233', '#3fbf6f', '#a46cf0', '#ff7a2f', '#ffffff', '#5b8def'];
  L.fiber = new THREE.Group(); fcols.forEach((c, i) => { const a = i / 8 * Math.PI * 2; const m = cyl(0.05, 15, basic(c), 6); m.position.set(0, Math.cos(a) * 0.17, Math.sin(a) * 0.17); L.fiber.add(m); }); g.add(L.fiber);
  L.tube = cyl(0.36, 13, new THREE.MeshLambertMaterial({ color: '#ffd36a', transparent: true, opacity: 0.55, depthWrite: false })); L.tube.renderOrder = 3; g.add(L.tube);
  L.steel = new THREE.Group(); const sm = lam('#bcc6d0'); for (let i = 0; i < 16; i++) L.steel.add(helix(0, 11, 0.5, 0.35, i / 16 * Math.PI * 2, 0.1, sm, 120)); g.add(L.steel);
  L.cu = cyl(0.7, 9, lam('#d98a4f')); g.add(L.cu);
  L.pe = cyl(0.86, 7, lam('#26384d')); g.add(L.pe);
  const cap = new THREE.Mesh(new THREE.RingGeometry(0.0, 0.86, 32), lam('#3a5068', { side: THREE.DoubleSide })); cap.rotation.y = Math.PI / 2; cap.position.x = 0; g.add(cap);
  L.lens = { fiber: 15, tube: 13, steel: 11, cu: 9, pe: 7 };
  g.userData.L = L; return g;
}
export default {
  async build() {
    const U = underwater({});
    const { scene, camera } = U;
    // cable lying on seabed (deep-sea, thin) + garden hose comparison
    const thin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 140, 10), lam('#26384d')); thin.rotation.z = Math.PI / 2; thin.position.set(0, -2.7, 0); scene.add(thin);
    const hose = new THREE.Group(); const hm = lam('#4caf50');
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.17, 6, 28), hm); t.rotation.x = Math.PI / 2; t.position.y = -2.75 + i * 0.3; hose.add(t); }
    hose.position.set(-4.5, 0, 2.6); scene.add(hose);
    const ex = layeredCable(); ex.position.set(-8, 0.4, 0); scene.add(ex);
    // armored near-shore variant
    const arm = new THREE.Group();
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 6, 24), lam('#26384d')); core.rotation.z = Math.PI / 2; core.position.x = 3; arm.add(core);
    const am = lam('#7d8b99'); for (let i = 0; i < 22; i++) arm.add(helix(0, 4.6, 1.02, -0.6, i / 22 * Math.PI * 2, 0.14, am, 90));
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 24), lam('#1b2633')); outer.rotation.z = Math.PI / 2; outer.position.x = 1.5; arm.add(outer);
    arm.position.set(-6, -1.2, -5.5); scene.add(arm);
    return { scene, camera, U, ex, arm, hose, thin, pj: projector(camera) };
  },
  update(st, lt, T) {
    const L = T.L.bind(T); const Ls = st.ex.userData.L;
    camRig(st.camera, [
      [0, [-9, -0.6, 8], [-2, -2.6, 0]],
      [L(1) - 0.2, [-8.5, -1.2, 7.5], [-3.5, -2.5, 0.8]],
      [L(1) + 3.5, [-7.5, -0.8, 7], [-4, -2.4, 1.6]],
      [L(2) + 0.2, [0, 2.6, 14.5], [-1.5, 0.3, 0]],
      [L(4) + 0.5, [2.5, 2.2, 13], [-2, 0.3, 0]],
      [L(5) + 0.4, [-3, 3, 13], [-4, -0.4, -2.5]],
      [L(6) + 0.3, [1, 4.5, 16], [-1, 0, -1]],
      [T.dur, [3, 4, 15], [-1, 0, -1]],
    ], lt, 0.12);
    // exploded cable rises from seabed at L0
    const rise = ap(lt, L(0) + 0.3, 2.2, easeInOut);
    st.ex.position.y = -2.7 + rise * 3.1; st.ex.scale.setScalar(0.2 + 0.8 * rise); st.ex.visible = rise > 0.01;
    st.ex.rotation.x = lt * 0.12;
    const ext = (m, at, len) => { const p = ap(lt, at, 1.6); m.scale.x = Math.max(0.001, (7 + (len - 7) * p) / len); };
    ext(Ls.fiber, L(2) + 0.3, 15); ext(Ls.tube, L(3) + 0.2, 13); ext(Ls.steel, T.w(3, 'kawat') - 0.3, 11); ext(Ls.cu, L(4) + 0.3, 9);
    st.hose.visible = lt < L(2) + 1;
    st.arm.visible = lt > T.w(5, 'pantai') - 1.0; st.arm.position.y = -1.2 - (1 - ap(lt, T.w(5, 'pantai') - 1.0, 1.2)) * 4;
  },
  header() { return { big: 'BAB 3' }; },
  hud(st, h, lt, T) {
    const L = T.L.bind(T), pj = st.pj; const ex = st.ex;
    const at = (x, y = 0, z = 0) => { const v = new THREE.Vector3(x, y, z); ex.localToWorld(v); return pj(v); };
    const hp = pj(new THREE.Vector3(-4.5, -1.6, 2.6)); const cp = pj(new THREE.Vector3(-1, -2.55, 0));
    H.label(h, off(hp, -160, -170), hp, '≈ SELANG TAMAN', { alpha: win(lt, L(1) + 1.0, L(2), 0.5), size: 38 });
    H.label(h, off(cp, 220, -120), cp, 'KABEL LAUT DALAM', { alpha: win(lt, L(1) + 0.4, L(2), 0.5), size: 38, style: 'navy' });
    const lab = (s, x, r, a0, a1, dy, tag, tagColor) => { const p = at(x, r, 0); H.label(h, off(p, 40, dy), p, s, { alpha: win(lt, a0, a1, 0.5), size: 36, tag, tagColor }); };
    lab('SERAT OPTIK', 14.6, 0.1, L(2) + 1.6, T.dur, -150, '≈ RAMBUT', PAL.cyan);
    lab('TABUNG & GEL', 12.5, 0.36, L(3) + 1.4, T.dur, -230);
    lab('KAWAT BAJA', 10.4, 0.55, T.w(3, 'kawat') + 1.2, T.dur, 160, 'KUAT TARIK', '#bcc6d0');
    lab('TEMBAGA', 8.4, 0.7, L(4) + 1.4, T.dur, -220, 'LISTRIK', PAL.orange);
    lab('POLIETILENA', 3.2, 0.86, L(5) + 0.5, T.dur, 200, 'ISOLATOR', '#9fb0c2');
    const ap2 = pj(new THREE.Vector3(-3.5, -0.0, -5.5));
    H.label(h, off(ap2, -120, -150), ap2, 'VERSI DEKAT PANTAI', { alpha: win(lt, T.w(5, 'pantai') + 0.4, T.dur, 0.5), size: 36, style: 'navy', tag: '+ BAJA', tagColor: PAL.orange });
    H.stat(h, 1440, 640, '≈ 224 Tbps', 'KABEL MAREA · ATLANTIK', { alpha: win(lt, T.w(6, 'MAREA') - 0.2, T.dur + 1, 0.6), align: 'center', size: 96 });
  },
};
