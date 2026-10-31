// bars.js — grafik batang 3D berbasis data (negara, RUPTL, emisi, CAPEX, CAPEX/CF, LCOE).
import { THREE, C, V, baseScene, mat, basic, glass, rbox, box, cyl, sphere, clamp, lerp, easeOut, easeBack, easeInOut, smooth, prog, cueOf, CamPath, textPlane, Plume, ring, dashed, glowSprite } from '../core/kit.js';

const SETS = {
  countries: { unit: ' MW', dec: 0, max: 4200, H: 4.6, items: [['Amerika Serikat', 3953, '#9FB3CC'], ['Indonesia', 2742, C.hot], ['Filipina', 2034, '#9FB3CC'], ['Turki', 1797, '#9FB3CC'], ['Selandia Baru', 1259, '#9FB3CC']], cueAll: 'rank', title: 'Kapasitas terpasang PLTP, akhir 2025' },
  ruptl: { unit: ' GW', dec: 1, max: 18, H: 4.8, items: [['PLTS', 17.1, '#F4C04D'], ['PLTA', 11.7, '#4FA3E0'], ['Penyimpanan', 10.3, '#8E6CEF'], ['PLTG/GU', 10.3, '#AEB8C6'], ['PLTB', 7.2, '#7DD3B0'], ['PLTU batu bara', 6.3, '#4A4E69'], ['PLTP', 5.2, C.hot], ['Bioenergi', 0.9, '#9CCB8A'], ['Nuklir', 0.5, '#C9B9E8']], cueAll: 'ruptl', title: 'Tambahan kapasitas RUPTL 2025–2034 (69,5 GW)' },
  emissions: { unit: '', dec: 0, max: 850, H: 5.0, items: [['Batu bara', 820, '#4A4E69', 'coal'], ['Gas', 490, '#AEB8C6', 'gas'], ['Surya', 48, '#F4C04D', 'x20'], ['Panas bumi', 38, C.hot, 'geo'], ['Air', 24, '#4FA3E0', 'x20'], ['Angin', 11, '#7DD3B0', 'x20']], title: 'Emisi siklus hidup (gCO₂e/kWh, median IPCC)' },
  capex: { unit: '', dec: 1, max: 7, H: 5.0, items: [['PLTS', 1.0, '#F4C04D', 'pv'], ['PLTGU', 1.1, '#AEB8C6', 'ccgt'], ['PLTU SC', 1.6, '#4A4E69', 'sc'], ['PLTU USC', 1.7, '#5C6178', 'usc'], ['PLTB', 1.7, '#7DD3B0', 'usc'], ['PLTA', 2.2, '#4FA3E0', 'hydro'], ['PLTP besar', 4.4, C.hot, 'geo'], ['PLTP kecil', 5.5, '#FF9A5A', 'geos']], title: 'CAPEX (juta US$/MW, USD 2022)' },
  lcoe: { unit: '', dec: 0, max: 110, H: 5.0, items: [['PLTA', 60, '#4FA3E0', 'hydro'], ['PLTS', 62, '#F4C04D', 'pv'], ['PLTU SC', 69, '#4A4E69', 'sc'], ['PLTP', 87, C.hot, 'geo'], ['PLTB', 92, '#7DD3B0', 'wind'], ['PLTGU', 102, '#AEB8C6', 'ccgt']], title: 'LCOE (US$/MWh, WACC 10%)' },
};
SETS.capexcf = { ...SETS.capex, cf: [0.204, 0.571, 0.8, 0.8, 0.272, 0.51, 0.8, 0.8], title: 'CAPEX per MW rata-rata dihasilkan (juta US$)' };
SETS.capexcf.max = 7.2;

function valLabel(txt, color = C.navy, w = 1.7) { return textPlane([{ text: txt, size: 110, color, weight: 800, align: 'center' }], { width: w, w: 1024, h: 256, y: 160 }); }
function nameLabel(txt, w = 1.7) { return textPlane([{ text: txt, size: 76, color: C.ink, weight: 700, align: 'center' }], { width: w, w: 1024, h: 256, y: 160 }); }
const fmt = (v, d) => v.toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export async function create({ entry, prev }) {
  const set = entry.params.set; const S = SETS[set];
  const { scene, camera } = baseScene({ shadowSize: 14, lightPos: [8, 18, 12] });
  if (set === 'ruptl' || set === 'countries') camera.setViewOffset(1920, 1080, -230, 0, 1920, 1080);
  if (set === 'capexcf') camera.setViewOffset(1920, 1080, 150, 0, 1920, 1080);
  const n = S.items.length; const gap = n > 7 ? 1.45 : 1.75; const x0 = -(n - 1) * gap / 2;
  const plat = rbox(n * gap + 1.2, 0.5, 3.2, 0.12, mat('#FFFFFF', { r: 0.6 })); plat.position.y = -0.25; scene.add(plat);
  const titleP = textPlane([{ text: S.title, size: 64, color: C.sub, weight: 700, align: 'center' }], { width: 9, w: 2048, h: 160, y: 110 }); titleP.position.set(0, 0.02, 1.95); titleP.rotation.x = -Math.PI / 2; titleP.visible = false;
  const cu = (k, f) => cueOf(entry, k, f);
  const bars = S.items.map(([nm, val, col, cue], i) => {
    const g = new THREE.Group(); g.position.x = x0 + i * gap; scene.add(g);
    const b = rbox(gap * 0.62, 1, gap * 0.62, 0.1, mat(col, { r: 0.42, em: col === C.hot ? C.hot : '#000', ei: col === C.hot ? 0.18 : 0 })); b.geometry.translate(0, 0.5, 0); g.add(b);
    const lv = valLabel('0', col === C.hot ? C.hot : C.navy, gap * 1.15); lv.position.set(0, 0.5, 0.2); g.add(lv);
    const ln = nameLabel(nm, gap * 1.2); ln.position.set(0, -0.15, 1.62); g.add(ln);
    let at = cue ? cu(cue, 1 + i) : cu(S.cueAll ?? 'x', 1) + i * 0.22;
    return { g, b, lv, val, nm, col, at, cur: -1 };
  });
  const H = (v) => Math.max(0.001, v / S.max * S.H);
  // ekstra per set
  let extra = () => {};
  if (set === 'countries') {
    // fase 1: menara potensi vs terpasang
    const potG = new THREE.Group(); scene.add(potG); potG.position.set(-1.6, 0, 0);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1, 48, 1, true), new THREE.MeshStandardMaterial({ color: C.hot, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); pot.geometry.translate(0, 0.5, 0); potG.add(pot);
    const potRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 8, 64), basic(C.hot)); potRing.rotation.x = Math.PI / 2; potG.add(potRing);
    const inst = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1, 48), mat(C.hot, { em: C.hot, ei: 0.25 })); inst.geometry.translate(0, 0.5, 0); inst.position.set(3.2, 0, 0); potG.add(inst);
    const lp = valLabel('23.742 MW', C.hot, 3.2); potG.add(lp); const li = valLabel('2.744 MW', C.hot, 3.2); potG.add(li);
    const np = nameLabel('Potensi', 2.4); np.position.set(0, -0.15, 1.62); potG.add(np); const ni = nameLabel('Terpasang', 2.4); ni.position.set(3.2, -0.15, 1.62); potG.add(ni);
    const cPot = cu('pot', 2), cInst = cu('inst', 8), cRank = cu('rank', 13);
    const addRing = ring(0.9, 0.06, C.hot); scene.add(addRing);
    extra = (t) => { const out = smooth(prog(t, cRank - 0.8, 0.8)); potG.visible = out < 0.99; potG.scale.setScalar(1 - 0.3 * out); potG.position.y = -out * 0.5; [pot, potRing, inst, lp, li, np, ni].forEach((m) => { m.material.opacity = (m === pot ? 0.22 : 1) * (1 - out); m.material.transparent = true; });
      const kp = easeOut(prog(t, cPot, 1.4)), ki = easeOut(prog(t, cInst, 1.0)); const hp = 5.2 * kp, hi = 5.2 * 0.1156 * ki; pot.scale.set(1, Math.max(0.001, hp), 1); potRing.position.y = hp; inst.scale.set(1, Math.max(0.001, hi), 1);
      lp.position.set(0, hp + 0.5, 0.95); li.position.set(3.2, hi + 0.5, 0.95); lp.visible = kp > 0.05; li.visible = ki > 0.05;
      bars.forEach((o) => (o.g.visible = t > cRank - 0.3)); plat.visible = true; titleP.visible = t > cRank;
      const ka = prog(t, cu('add', 20), 2.0); const idn = bars[1]; addRing.position.set(idn.g.position.x, 0.05, 0); addRing.scale.setScalar(1 + (ka * 3 % 1) * 1.6); addRing.material.opacity = ka > 0 ? (1 - (ka * 3 % 1)) : 0; addRing.visible = ka > 0; };
  }
  if (set === 'emissions') {
    const smoke = new Plume(12, { rise: 2.0, spread: 0.7, size0: 0.3, size1: 1.3, life: 3.2, color: '#6b7080', opacity: 0.5, seed: 4 }); scene.add(smoke.group);
    extra = (t) => { const c = bars[0]; smoke.group.position.set(c.g.position.x, H(c.val) * easeOut(prog(t, c.at, 1.2)) + 0.1, 0); smoke.update(t, smooth(prog(t, c.at + 0.8, 1))); };
  }
  if (set === 'ruptl') {
    const ghost = rbox(gap * 0.62, 1, gap * 0.62, 0.1, new THREE.MeshStandardMaterial({ color: C.hot, transparent: true, opacity: 0.25, depthWrite: false })); ghost.geometry.translate(0, 0.5, 0); scene.add(ghost);
    const gl = textPlane([{ text: '2,7 GW = 40 tahun', size: 70, color: C.hot, weight: 800, align: 'center' }], { width: 2.6, w: 1024, h: 200, y: 130 }); scene.add(gl);
    const pltp = bars[6];
    extra = (t) => { const k = easeOut(prog(t, cu('double', 8), 1)); ghost.position.set(pltp.g.position.x + gap * 0.5, 0, -0.9); ghost.scale.set(0.9, H(2.74) * Math.max(0.001, k), 0.9); ghost.visible = k > 0.01; gl.position.set(pltp.g.position.x + gap * 0.5, H(2.74) + 0.4, -0.9); gl.visible = k > 0.05; gl.material.opacity = k;
      const pulse = cu('pltp', 6); bars.forEach((o) => { const hi = o === pltp || o.nm === 'PLTU batu bara'; o.b.material.emissiveIntensity = o === pltp ? 0.18 + 0.2 * smooth(prog(t, pulse, 0.6)) * (0.6 + 0.4 * Math.sin(t * 4)) : 0; }); };
  }
  if (set === 'capexcf') {
    const rings = bars.map((o, i) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 48, 1, 0, Math.PI * 2 * S.cf[i]), basic(o.col, { side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(o.g.position.x, 0.03, 0); scene.add(r); const lab = textPlane([{ text: `CF ${Math.round(S.cf[i] * 100)}%`, size: 80, color: C.hot, weight: 800, align: 'center' }], { width: 1.4, w: 1024, h: 200, y: 140 }); lab.position.set(o.g.position.x, 0.25, 1.3); scene.add(lab); return { r, lab }; });
    const batt = new THREE.Group(); batt.add(rbox(0.5, 0.9, 0.35, 0.06, mat('#2A9D8F'))); batt.add(box(0.2, 0.1, 0.15, mat('#2A9D8F'), 0, 0.5, 0)); scene.add(batt);
    extra = (t) => { const cfCue = [cu('pv', 3), cu('morph', 20) - 0.5, cu('morph', 20) - 0.5, cu('morph', 20) - 0.5, cu('wind', 9), cu('morph', 20) - 0.5, cu('geo', 13), cu('geo', 13)];
      rings.forEach((o, i) => { const k = easeOut(prog(t, cfCue[i], 0.6)); o.r.scale.setScalar(Math.max(0.001, k)); o.r.visible = o.lab.visible = k > 0.01; o.lab.material.opacity = k; });
      const kb = easeBack(prog(t, cu('battery', 34), 0.6)); const pv = bars[0]; batt.position.set(pv.g.position.x, H(pv.val / S.cf[0]) + 1.2 + Math.sin(t * 2) * 0.05, 0); batt.scale.setScalar(Math.max(0.001, kb)); batt.visible = kb > 0.01; };
  }
  if (set === 'lcoe') {
    const l90 = dashed([V(x0 - 0.8, H(90), -0.6), V(-x0 + 0.8, H(90), -0.6)], C.hot, { dash: 0.25, gap: 0.15 }); scene.add(l90); const l60 = dashed([V(x0 - 0.8, H(60), -0.6), V(-x0 + 0.8, H(60), -0.6)], C.green, { dash: 0.25, gap: 0.15 }); scene.add(l60);
    const t90 = textPlane([{ text: 'IRENA: PLTP Indonesia 90', size: 64, color: C.hot, weight: 800 }], { width: 3.4, w: 1024, h: 140, y: 100, x: 10 }); t90.position.set(-x0 + 2.3, H(90), -0.6); scene.add(t90);
    const t60 = textPlane([{ text: 'IRENA: rata-rata dunia 60', size: 64, color: C.green, weight: 800 }], { width: 3.4, w: 1024, h: 140, y: 100, x: 10 }); t60.position.set(-x0 + 2.3, H(60), -0.6); scene.add(t60);
    extra = (t) => { const k = smooth(prog(t, cu('irena', 24), 0.8)); [l90, l60, t90, t60].forEach((m) => { m.visible = k > 0.01; m.material.opacity = k; }); };
  }
  // kamera
  const D = entry.dur; const span = (n - 1) * gap;
  const path = new CamPath([{ t: 0, p: [span * 0.16, 4.8, 13.5 + span * 0.42], l: [0, 2.4, 0], fov: 34 }, { t: D, p: [-span * 0.14, 4.4, 12.8 + span * 0.42], l: [0, 2.4, 0], fov: 34 }]);
  if (set === 'countries') path.k[0] = { t: 0, p: V(4.0, 3.8, 12.5), l: V(0, 2.4, 0), fov: 34 };
  return {
    scene, camera, anchors: {},
    update(t) {
      path.apply(camera, t, 0.04);
      for (let i = 0; i < bars.length; i++) {
        const o = bars[i]; let v = o.val; let k = easeOut(prog(t, o.at, 1.1));
        if (set === 'capexcf') { k = 1; const km = easeInOut(prog(t, cu('morph', 20) + i * 0.12, 1.4)); v = lerp(o.val, o.val / S.cf[i], km); }
        o.b.scale.set(1, H(v) * Math.max(0.001, k), 1); o.b.visible = k > 0.003;
        o.lv.position.y = H(v) * k + 0.38; o.lv.visible = k > 0.03;
        const shown = v * k; const txt = fmt(shown, S.dec) + (S.unit || ''); if (txt !== o.cur) { o.cur = txt; const old = o.lv.material.map; const np = valLabel(txt, o.col === C.hot ? C.hot : C.navy, gap * 1.15); o.lv.material.map = np.material.map; np.geometry.dispose(); old.dispose(); }
      }
      extra(t);
    },
  };
}
