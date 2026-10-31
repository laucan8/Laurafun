// factcheck.js — panel Fakta Cek: objek 3D di kanan (grafik+kaca pembesar / Pohang / timbangan / Sorik).
import { THREE, C, V, baseScene, mat, basic, glass, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeBack, easeInOut, smooth, prog, cueOf, CamPath, rng, tube, curve, textPlane, FONT, Plume, glowSprite, ring, flatArrow, dashed, popScale } from '../core/kit.js';
import { wellhead, pad } from './plantkit.js';

function label(text, o = {}) { const p = textPlane([{ text, size: o.size ?? 80, color: o.color ?? C.navy, weight: 800, align: 'center' }], { width: o.width ?? 2.4, w: 1024, h: 256, y: 170 }); return p; }

function magnifier() { const g = new THREE.Group(); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.09, 16, 64), mat(C.navy, { r: 0.3, m: 0.3 })); g.add(rim); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.88, 48), glass('#d9ecff', 0.25)); g.add(lens); const h = cyl(0.09, 0.11, 1.4, mat(C.hot, { r: 0.4 }), 16); h.position.set(0.95, -0.95, 0); h.rotation.z = Math.PI / 4; g.add(h); g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; }

export async function create({ entry }) {
  const v = entry.params.scene3d || 'chart';
  const { scene, camera } = baseScene({ shadowSize: 10, lightPos: [6, 14, 10], groundY: v === 'pohang' ? -8.8 : 0 });
  camera.setViewOffset(1920, 1080, -380, 0, 1920, 1080);
  const cu = (n, f) => cueOf(entry, n, f);
  const root = new THREE.Group(); scene.add(root);
  let upd = () => {}; let path;
  if (v === 'chart') {
    // estimasi potensi panas bumi RI (GW) dari waktu ke waktu
    const data = [['BPPT 2015', 29, 'old'], ['sblm 2019', 27, 'old'], ['BG 2019', 23.9, 'corr'], ['ESDM 2025', 23.7, 'corr']];
    const bars = data.map(([nm, val, cue], i) => { const h = val / 29 * 3.6; const b = rbox(0.9, 1, 0.9, 0.12, mat(i < 2 ? '#C9D3DF' : C.hot, { r: 0.45 })); b.geometry.translate(0, 0.5, 0); b.position.set(-2.4 + i * 1.6, 0, 0); root.add(b); const lv = label(String(val).replace('.', ',') + ' GW', { size: 92, width: 2.0, color: i < 2 ? '#7a879a' : C.hot }); lv.position.set(b.position.x, h + 0.45, 0.5); root.add(lv); const ln = label(nm, { size: 70, width: 2.0, color: C.sub }); ln.position.set(b.position.x, 0.02, 1.1); ln.rotation.x = -Math.PI / 2; root.add(ln); return { b, h, lv, at: cu(cue, 2) + i * 0.25 }; });
    const mg = magnifier(); root.add(mg);
    path = new CamPath([{ t: 0, p: [1.5, 4.0, 15.0], l: [0, 2.0, 0], fov: 34 }, { t: entry.dur, p: [-1.2, 3.6, 14.0], l: [0, 2.0, 0], fov: 34 }]);
    upd = (t) => { bars.forEach((o) => { const k = easeOut(prog(t, o.at, 0.9)); o.b.scale.set(1, Math.max(0.001, o.h * k), 1); o.lv.position.y = o.h * k + 0.45; o.lv.material.opacity = k; });
      const k = smooth(prog(t, cu('corr', 6), 1.6)); const x = lerp(-2.4, 2.4, k) + Math.sin(t * 0.9) * 0.2; mg.position.set(x, 4.3 + Math.sin(t * 1.3) * 0.1, 1.2); mg.rotation.set(-0.25, 0, Math.sin(t * 0.7) * 0.1); };
  } else if (v === 'pohang') {
    // dua kolom penampang: EGS (kiri) vs konvensional (kanan)
    const mkCol = (x, color) => { const g = new THREE.Group(); const b = rbox(2.6, 6, 1.6, 0.08, mat(color, { r: 0.9 })); b.position.y = -3; g.add(b); const top = box(2.62, 0.25, 1.62, mat('#C2E0AE'), 0, -0.1, 0); g.add(top); g.position.x = x; root.add(g); return g; };
    const L = mkCol(-1.7, '#EAD9B6'), R = mkCol(1.7, '#EAD9B6');
    const resR = rbox(2.4, 1.6, 1.5, 0.06, mat('#F4BE88', { r: 0.9 })); resR.position.set(1.7, -4.3, 0.06); root.add(resR);
    const rockL = rbox(2.4, 1.6, 1.5, 0.06, mat('#C9AA8B', { r: 0.9 })); rockL.position.set(-1.7, -4.3, 0.06); root.add(rockL);
    const wl = cyl(0.06, 0.06, 4.6, mat('#F5F7FA', { m: 0.3 }), 10); wl.position.set(-1.7, -2.2, 0.85); root.add(wl);
    const wr = cyl(0.06, 0.06, 4.6, mat('#F5F7FA', { m: 0.3 }), 10); wr.position.set(1.7, -2.2, 0.85); root.add(wr);
    const whl = wellhead(); whl.scale.setScalar(0.8); whl.position.set(-1.7, 0, 0.85); root.add(whl); const whr = wellhead(); whr.scale.setScalar(0.8); whr.position.set(1.7, 0, 0.85); root.add(whr);
    // retakan merah menjalar (EGS)
    const r = rng(8); const cracks = []; for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2; const len = 0.4 + r() * 0.9; const pts = [V(-1.7, -4.4, 0.83)]; let p = pts[0].clone(); for (let k = 0; k < 3; k++) { p = p.clone().add(V(Math.cos(a + (r() - 0.5)) * len / 3, Math.sin(a + (r() - 0.5)) * len / 3 * 0.7, 0)); pts.push(p); } const m = new THREE.Mesh(new THREE.TubeGeometry(curve(pts), 20, 0.018, 5), basic(C.red)); root.add(m); cracks.push(m); }
    const waves = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 48), basic(C.red, { opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); m.position.set(-1.7, -4.4, 0.86); root.add(m); return m; });
    const press = [0, 1, 2].map((i) => { const a = flatArrow(0.8, 0.1, C.red); a.rotation.z = -Math.PI / 2; a.position.set(-1.95 + i * 0.25, -1.4 - i * 0.2, 0.9); root.add(a); return a; });
    const calm = new Plume(8, { rise: 0.01, spread: 0.6, size0: 0.25, size1: 0.6, life: 3, color: '#2E86DE', opacity: 0.35, seed: 3 }); calm.group.position.set(1.7, -4.4, 0.9); root.add(calm.group);
    const lt = label('EGS (Pohang)', { size: 84, color: C.red, width: 2.6 }); lt.position.set(-1.7, 1.45, 0.9); root.add(lt);
    const rt = label('PLTP konvensional', { size: 76, color: C.green, width: 2.6 }); rt.position.set(1.7, 1.45, 0.9); root.add(rt);
    // dapur magma dalam
    const magma = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 16), mat('#FF7A33', { em: '#FF6B35', ei: 0.6 })); magma.scale.set(1.8, 0.6, 0.9); magma.position.set(0, -8.6, 0); root.add(magma);
    const mg = glowSprite('#FF8A3D', 5, 0.6); mg.position.set(0, -8.5, 0.6); root.add(mg);
    const sc = dashed([V(3.4, 0, 0.9), V(3.4, -8.2, 0.9)], C.navy, { dash: 0.18, gap: 0.12 }); root.add(sc);
    const d1 = label('1–3 km', { size: 70, width: 1.6 }); d1.position.set(3.9, -3.5, 0.9); root.add(d1); const d2 = label('dapur magma', { size: 64, width: 2.0, color: C.hot }); d2.position.set(2.6, -8.3, 1.2); root.add(d2);
    root.position.y = 1.2;
    path = new CamPath([{ t: 0, p: [0.5, 1.0, 18.0], l: [0, -1.6, 0], fov: 34 }, { t: cu('depth', 30), p: [0.8, -0.5, 23.0], l: [0, -3.2, 0], fov: 34 }, { t: entry.dur, p: [-0.5, -0.8, 24.0], l: [0, -3.4, 0], fov: 34 }]);
    upd = (t) => { const ke = prog(t, cu('egs', 8), 2.5); cracks.forEach((c, i) => { const k = clamp(ke * 1.4 - i * 0.04); c.geometry.setDrawRange(0, Math.floor(c.geometry.index.count * k / 3) * 3); c.visible = k > 0.01; });
      waves.forEach((w, i) => { const a = ((t * 0.6 + i / 3) % 1); const on = ke > 0.2 ? 1 : 0; w.scale.setScalar(1 + a * 6); w.material.opacity = (1 - a) * 0.6 * on; });
      press.forEach((a, i) => { a.visible = ke > 0.01; a.position.y = -1.4 - i * 0.2 - ((t * 1.5 + i * 0.3) % 1) * 0.8; });
      const kc = smooth(prog(t, cu('conv', 18), 1)); calm.group.visible = kc > 0.01; calm.update(t, kc);
      const kd = smooth(prog(t, cu('depth', 30), 1.2)); magma.visible = mg.visible = sc.visible = d1.visible = d2.visible = kd > 0.01; mg.material.opacity = 0.6 * kd; d2.material.opacity = d1.material.opacity = kd; };
  } else if (v === 'scale') {
    // timbangan: batu bara vs PLTP
    const post = cyl(0.12, 0.2, 3.6, mat(C.navy, { r: 0.4, m: 0.3 }), 20); post.position.y = 1.8; root.add(post); const base = cyl(1.1, 1.3, 0.3, mat(C.navy), 32); base.position.y = 0.15; root.add(base);
    const beam = new THREE.Group(); beam.position.y = 3.6; root.add(beam); beam.add(box(5.6, 0.14, 0.2, mat('#C9A14A', { m: 0.5, r: 0.3 })));
    const mkPan = (x) => { const g = new THREE.Group(); g.position.x = x; beam.add(g); for (const dx of [-0.5, 0.5]) { const s = cyl(0.015, 0.015, 1.6, mat('#9aa6b5'), 6); s.position.set(dx * 0.9, -0.8, 0); s.rotation.z = dx * 0.55; g.add(s); } const pan = cyl(1.0, 0.85, 0.12, mat('#D9DFE7', { m: 0.4, r: 0.3 }), 32); pan.position.y = -1.6; g.add(pan); return { g, pan }; };
    const pl = mkPan(-2.6), pr = mkPan(2.6);
    const r = rng(6); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + r() * 0.1, 0), mat('#2B2D42', { flat: true, r: 0.5 })); c.position.set((r() - 0.5) * 1.2, -1.35 + (i > 5 ? 0.3 : 0), (r() - 0.5) * 0.8); c.rotation.set(r() * 3, r() * 3, 0); c.castShadow = true; pl.g.add(c); }
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.8, 24), mat('#F4F6F9')); tw.position.set(0, -1.15, 0); tw.castShadow = true; pr.g.add(tw); const pls = new Plume(6, { rise: 1.1, spread: 0.3, size0: 0.2, size1: 0.6, life: 2.6, opacity: 0.5 }); pls.group.position.set(0, -0.75, 0); pr.g.add(pls.group);
    const tags = [['US$70/ton (DMO)', -2.6, 'dmo', C.coal], ['biaya kesehatan tak ditagih', -2.6, 'health', C.red], ['plafon tarif + risiko', 2.6, 'tariff', C.hot]].map(([tx, x, cue, col], i) => { const p = label(tx, { size: 64, color: col, width: 3.0 }); p.position.set(x, 1.1 - (i === 1 ? 0.55 : 0), 1.0); root.add(p); return { p, at: cu(cue, 5) }; });
    path = new CamPath([{ t: 0, p: [0.5, 3.8, 14.5], l: [0, 2.2, 0], fov: 34 }, { t: entry.dur, p: [-1.0, 3.4, 13.5], l: [0, 2.2, 0], fov: 34 }]);
    upd = (t) => { const tilt = 0.06 * smooth(prog(t, cu('dmo', 4), 1.2)) + 0.07 * smooth(prog(t, cu('health', 10), 1.2)) + 0.05 * smooth(prog(t, cu('tariff', 20), 1.2)); const wob = Math.sin(t * 2.2) * 0.01; beam.rotation.z = tilt + wob; pl.g.rotation.z = -beam.rotation.z; pr.g.rotation.z = -beam.rotation.z; pls.update(t);
      tags.forEach((o) => { const k = easeBack(prog(t, o.at, 0.5)); o.p.scale.setScalar(Math.max(0.001, k)); }); };
  } else if (v === 'sorik') {
    const pd = pad(5, 3.6); root.add(pd); const wh = wellhead(); wh.position.set(0, 0.08, 0); wh.scale.setScalar(1.3); root.add(wh);
    const gas = new Plume(26, { rise: 1.6, spread: 4.2, size0: 0.6, size1: 2.8, life: 4.2, color: '#C9D45A', opacity: 0.45, drift: [0.6, 0, 0.3], seed: 13 }); gas.group.position.set(0, 1.0, 0); root.add(gas.group);
    const sensors = [[-2.8, 1.8], [2.8, 1.8], [-2.8, -1.8], [2.8, -1.8], [0, 2.6]].map(([x, z]) => { const g = new THREE.Group(); g.add(cyl(0.04, 0.04, 1.2, mat('#9aa6b5'), 8, 0, 0.6, 0)); g.add(box(0.26, 0.2, 0.16, mat('#F4F6F9'), 0, 1.25, 0)); const led = sphere(0.06, basic('#2A9D8F'), 0, 1.25, 0.09, 10); g.add(led); g.position.set(x, 0, z); root.add(g); return { g, led }; });
    const zone = ring(4.2, 0.12, C.red, { opacity: 0.9 }); zone.position.y = 0.03; root.add(zone); const zoneF = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), basic(C.red, { opacity: 0.08, depthWrite: false })); zoneF.rotation.x = -Math.PI / 2; zoneF.position.y = 0.02; root.add(zoneF);
    const houses = [[6.2, 1.0], [7.2, -0.6], [6.6, -2.2]].map(([x, z]) => { const g = new THREE.Group(); g.add(box(0.9, 0.6, 0.8, mat('#F4F6F9'), 0, 0.3, 0)); const rf = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.5, 4), mat('#E07A5F')); rf.position.y = 0.85; rf.rotation.y = Math.PI / 4; rf.castShadow = true; g.add(rf); g.position.set(x, 0, z); root.add(g); return g; });
    path = new CamPath([{ t: 0, p: [4.5, 9.0, 17.0], l: [1.8, 0.6, 0], fov: 34 }, { t: entry.dur, p: [1.0, 7.5, 16.0], l: [1.8, 0.6, 0], fov: 34 }]);
    upd = (t) => { const kg = smooth(prog(t, cu('sorik', 4), 1.5)) * (1 - 0.7 * smooth(prog(t, cu('lesson', 30), 2))); gas.update(t, kg); gas.group.visible = kg > 0.01;
      const kl = smooth(prog(t, cu('lesson', 30), 1)); zone.material.opacity = 0.9 * kl; zoneF.material.opacity = 0.08 * kl; zone.visible = zoneF.visible = kl > 0.01; zone.scale.setScalar(0.7 + 0.3 * easeOut(kl));
      sensors.forEach((s, i) => { const alarm = kg > 0.3 && kl < 0.5; s.led.material.color.set(alarm ? (Math.sin(t * 12 + i) > 0 ? '#E63946' : '#7a1b22') : '#2A9D8F'); popScale(s.g, t, cu('lesson', 30) - 6 + i * 0.1, 0.4); if (t < cu('lesson', 30) - 6) s.g.visible = true, s.g.scale.setScalar(1); }); };
  }
  return { scene, camera, anchors: {}, update(t) { path.apply(camera, t); upd(t); } };
}
