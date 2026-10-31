// indomap.js — peta Indonesia 3D dengan gunung api & pin PLTP (mode: overview, westjava, outer, summary).
import { THREE, C, V, baseScene, mat, basic, cyl, sphere, clamp, lerp, easeOut, easeBack, easeInOut, smooth, prog, cueOf, CamPath, textCanvas, FONT, glowSprite, ring, tube, curve, gradientTexture, radialFade } from '../core/kit.js';
import { indonesiaMesh, PLANTS, VOLCANOES } from './geo.js';

export function labelSprite(lines, o = {}) {
  const tex = textCanvas(lines, { w: o.w ?? 768, h: o.h ?? 220, y: o.y ?? 92, x: 40, bg: o.bg ?? 'rgba(255,255,255,0.96)', radius: 40, draw: (g, w, h) => { g.fillStyle = o.accent ?? C.hot; g.fillRect(0, 30, 14, h - 60); } });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest ?? true, toneMapped: false })); const s = o.scale ?? 1.4; sp.scale.set(s, s * (o.h ?? 220) / (o.w ?? 768), 1); sp.center.set(0, 0); return sp;
}

export async function create({ entry }) {
  const mode = entry.params.mode;
  const { scene, camera } = baseScene({ shadowSize: 16, lightPos: [6, 16, 10], groundColor: '#D3E7F7', groundSize: 70, shadowOpacity: 0.14 });
  scene.background = gradientTexture('#F4F8FC', '#DCEAF6');
  const M = await indonesiaMesh({ scale: 0.5, lon0: 118, lat0: -2.5, depth: 0.16 }); scene.add(M.group);
  // gunung api
  const vg = new THREE.ConeGeometry(0.045, 0.12, 8); vg.translate(0, 0.06, 0); const vm = mat(C.magma, { em: C.magma, ei: 0.5 });
  const volc = VOLCANOES.map(([la, lo]) => { const m = new THREE.Mesh(vg, vm); m.position.copy(M.pos(la, lo, 0.2)); scene.add(m); return m; });
  // pin PLTP
  const pins = {}; const H = (mw) => 0.25 + mw / 400 * 2.2;
  for (const p of PLANTS) {
    const g = new THREE.Group(); g.position.copy(M.pos(p.lat, p.lon, 0.2)); scene.add(g);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 20), mat(C.hot, { em: C.hot, ei: 0.35, r: 0.4 })); col.geometry.translate(0, 0.5, 0); col.castShadow = true; g.add(col);
    const cap = sphere(0.1, basic('#FFD166'), 0, 1, 0, 16); g.add(cap); const gl = glowSprite('#FF9A4D', 0.7, 0.6); g.add(gl);
    const baseR = ring(0.16, 0.03, C.hot, { opacity: 0.8 }); baseR.position.y = 0.01; g.add(baseR);
    const lab = labelSprite([{ text: p.name, size: 64, color: C.navy, weight: 800 }, { text: `${p.mw} MW · ${p.op}`, size: 44, color: C.sub, weight: 600, font: FONT.body }], { scale: 1.25 }); g.add(lab);
    pins[p.k] = { g, col, cap, gl, lab, baseR, p, h: H(p.mw) };
  }
  const cu = (n, f) => cueOf(entry, n, f); const D = entry.dur;
  const at = (k) => { const p = PLANTS.find((q) => q.k === k); return M.pos(p.lat, p.lon, 0.3); };
  let path; let showLab = () => 0; let pinIn = () => 1; let hi = () => 0;
  const order = PLANTS.slice().sort((a, b) => a.lon - b.lon).map((p) => p.k);
  if (mode === 'overview' || mode === 'summary') {
    path = new CamPath([{ t: 0, p: [2, 15, 14], l: [0, 0, 0.5], fov: 34 }, { t: D, p: [-5.5, 6.0, 9.5], l: [-4.0, 0, 0.6], fov: 34 }]);
    const t0 = mode === 'summary' ? 0.5 : cu('pins', 4);
    pinIn = (k) => easeBack(prog(entry._t, t0 + order.indexOf(k) * 0.12, 0.7));
    const major = ['sarulla', 'ulubelu', 'lahendong', 'dieng', 'salak', 'muara'];
    showLab = (k) => (major.includes(k) ? smooth(prog(entry._t, t0 + 1.8, 0.6)) : 0);
  } else if (mode === 'westjava') {
    const c = M.pos(-7.0, 107.4, 0); path = new CamPath([{ t: 0, p: [c.x - 3.0, 6.0, c.z + 9.0], l: [c.x, 0.9, c.z], fov: 34 }, { t: cu('salak', 14), p: [c.x - 3.6, 4.2, c.z + 7.0], l: [c.x - 0.3, 1.1, c.z - 0.1], fov: 34 }, { t: D, p: [c.x + 1.8, 4.4, c.z + 7.5], l: [c.x - 0.1, 1.1, c.z], fov: 34 }]);
    const jab = ['salak', 'darajat', 'wayang', 'kamojang', 'patuha'];
    pinIn = (k) => (jab.includes(k) ? easeBack(prog(entry._t, 0.3 + jab.indexOf(k) * 0.2, 0.7)) : 0.6);
    showLab = (k) => (['salak', 'darajat', 'wayang'].includes(k) ? smooth(prog(entry._t, cu('tri', 2) + ['salak', 'darajat', 'wayang'].indexOf(k) * 0.3, 0.5)) : k === 'kamojang' ? 0.85 : 0);
    hi = (k) => (k === 'salak' ? smooth(prog(entry._t, cu('salak', 14), 0.6)) : 0);
    // segitiga emas
    const tri = curve([at('salak'), at('darajat'), at('wayang'), at('salak')].map((v) => v.clone().setY(0.45)), true, 0); const triM = new THREE.Mesh(new THREE.TubeGeometry(tri, 120, 0.02, 6, true), basic('#FFD166')); scene.add(triM); entry._tri = triM;
  } else if (mode === 'outer') {
    const keys = [['ulu', 'ulubelu'], ['lah', 'lahendong'], ['lum', 'lumut'], ['mua', 'muara'], ['die', 'dieng']];
    const ks = [{ t: 0, p: [-6, 6, 9], l: [-5, 0, 0.5], fov: 34 }];
    for (const [cue, k] of keys) { const v = at(k); ks.push({ t: cu(cue, 2), p: [v.x - 2.2, 4.6, v.z + 6.8], l: [v.x, 0.9, v.z], fov: 34 }); }
    const dv = at('dieng'); ks.push({ t: D, p: [dv.x - 1.4, 3.2, dv.z + 4.8], l: [dv.x, 0.6, dv.z], fov: 34 }); ks.sort((a, b) => a.t - b.t);
    path = new CamPath(ks);
    pinIn = () => 1; const tmap = Object.fromEntries(keys.map(([c, k]) => [k, cu(c, 2)])); tmap.rantau = cu('lum', 6);
    showLab = (k) => (tmap[k] !== undefined ? smooth(prog(entry._t, tmap[k] - 0.2, 0.5)) * (1 - smooth(prog(entry._t, tmap[k] + 6, 0.6))) : 0);
    hi = (k) => (tmap[k] !== undefined ? smooth(prog(entry._t, tmap[k] - 0.2, 0.5)) : 0);
  }
  // redup untuk Dieng (teaser misteri)
  const fogM = new THREE.MeshBasicMaterial({ map: radialFade(), color: '#6d7288', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }); const fog = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), fogM); fog.rotation.x = -Math.PI / 2; fog.position.copy(at('dieng')).setY(0.35); scene.add(fog);
  return {
    scene, camera, anchors: {},
    update(t) {
      entry._t = t; path.apply(camera, t, 0.03);
      volc.forEach((m, i) => { const s = 1 + 0.15 * Math.sin(t * 3 + i); m.scale.setScalar(s); });
      for (const k in pins) { const o = pins[k]; const a = clamp(pinIn(k), 0, 1.3); const h = o.h * Math.max(0.001, a); o.col.scale.set(1, h, 1); o.cap.position.y = h; o.gl.position.y = h; o.g.visible = a > 0.01; const hv = hi(k); o.gl.material.opacity = 0.5 + 0.4 * hv * (0.6 + 0.4 * Math.sin(t * 5)); o.gl.scale.setScalar(0.7 + 0.6 * hv);
        const la = showLab(k); o.lab.visible = la > 0.02; o.lab.material.opacity = la; o.lab.position.set(0.12, h + 0.15, 0); o.baseR.scale.setScalar(1 + ((t * 0.8) % 1) * 1.5 * (0.3 + hv)); o.baseR.material.opacity = (1 - ((t * 0.8) % 1)) * 0.8; }
      if (entry._tri) { const k = easeInOut(prog(t, cueOf(entry, 'tri', 2), 1.5)); entry._tri.geometry.setDrawRange(0, Math.floor(entry._tri.geometry.index.count * k / 3) * 3); }
      fogM.opacity = mode === 'outer' ? 0.55 * smooth(prog(t, cueOf(entry, 'dark', 12), 1.5)) : 0;
    },
  };
}
