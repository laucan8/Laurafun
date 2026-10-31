import * as THREE from 'three';
import { setupScene, buildMap, cableMat, tubeFrom, P, CITY, PAL, lonlat3 } from '../lib/world.js';
import { ap, clamp, easeInOut, inv } from '../lib/util.js';

const _v = new THREE.Vector3();
export function projector(camera) {
  return (v, dy = 0) => {
    _v.copy(v); _v.project(camera);
    if (_v.z > 1 || _v.z < -1) return null;
    return { x: (_v.x * 0.5 + 0.5) * 1920, y: (-_v.y * 0.5 + 0.5) * 1080 + dy };
  };
}
export const off = (p, dx, dy) => p ? { x: p.x + dx, y: p.y + dy } : null;
// white flash alpha around time `at`
export const flashA = (lt, at, d = 0.35) => Math.max(0, 1 - Math.abs(lt - at) / d);

// Illustrative cable routes (lon,lat) — simplified, not survey-accurate
export const ROUTES = {
  matrix: [[106.83, -6.1], [106.5, -4.6], [105.7, -2.7], [104.9, -0.6], [104.25, 0.85], [103.92, 1.27]],
  b3js: [[107.1, -5.95], [106.75, -4.0], [105.85, -2.2], [105.05, -0.2], [104.55, 0.6], [104.15, 1.1], [103.99, 1.33]],
  batamsg: [[104.1, 1.13], [104.06, 1.24], [103.99, 1.34]],
  dumai_sg: [[101.45, 1.68], [102.3, 1.42], [103.2, 1.18], [103.64, 1.27]],
  dumai_melaka: [[101.45, 1.68], [101.85, 1.95], [102.25, 2.19]],
  west: [[103.64, 1.22], [102.6, 2.0], [101.2, 2.9], [99.6, 4.3], [97.8, 5.7], [95.5, 6.5], [92, 7.1], [88.5, 7.5]],
  north: [[104.1, 1.42], [105.2, 3.5], [107.5, 8.5], [110.5, 13.5], [113, 18], [114.2, 22.2]],
  north2: [[104.3, 1.36], [106.2, 4.5], [109.8, 9.5], [115.5, 13.5], [119.5, 17.5], [121.4, 21.0], [123, 24.6]],
  south_au: [[103.95, 1.2], [104.95, -0.8], [105.7, -3.8], [105.25, -6.9], [106.2, -9.5], [108, -12.3], [110, -15.5]],
  jkt_au: [[106.83, -6.05], [105.9, -6.45], [105.2, -7.4], [106.4, -9.8], [108.8, -12.5], [111, -15.5]],
  bifrost: [[104.0, 1.32], [105.2, 0.2], [106.6, -2.6], [108.6, -4.6], [112, -5.25], [115.8, -4.6], [118.0, -3.2], [118.7, -0.5], [119.6, 2.6], [121.8, 4.6], [125.3, 5.3], [128.5, 7.4], [134, 10.2], [140, 12.4], [144.75, 13.45]],
  bifrost_jkt: [[108.6, -4.6], [107.6, -5.5], [106.9, -6.05]],
  bifrost_mdo: [[121.8, 4.6], [123.6, 2.8], [124.84, 1.55]],
  seaus: [[124.84, 1.49], [125.6, 3.2], [126.2, 5.8], [125.75, 7.0], [129, 9], [136, 11.6], [144.75, 13.45]],
  smpcs: [[124.84, 1.49], [126.3, 1.2], [127.38, 0.79], [129.5, -0.3], [131.25, -0.87], [133.5, -0.7], [136.08, -1.18], [137.5, -1.4], [138.75, -1.86], [139.8, -2.2], [140.7, -2.53]],
  png_jyp: [[141.3, -2.68], [141.0, -2.55], [140.7, -2.53]],
  dom1: [[106.83, -6.1], [108.5, -6.0], [110.4, -6.6], [112.75, -6.9], [114.6, -7.6], [115.2, -8.3]],
  dom2: [[112.75, -7.0], [114.3, -5.0], [116.2, -2.6], [116.8, -1.25]],
  dom3: [[116.8, -1.25], [118.3, -2.6], [119.4, -5.15]],
  dom4: [[119.4, -5.15], [121.8, -4.3], [123.4, -2.5], [124.6, -0.6], [124.84, 1.49]],
  dom5: [[106.83, -6.1], [105.6, -5.0], [104.75, -2.98]],
  dom6: [[104.75, -2.98], [103.6, -1.0], [101.45, 1.68]],
  dom7: [[109.3, -0.03], [107.8, -2.6], [106.83, -6.1]],
  dom8: [[119.4, -5.15], [121.3, -8.3], [123.6, -10.17]],
  dom9: [[101.45, 1.68], [100.0, 2.8], [98.67, 3.6]],
};
export const INTL_SG = ['matrix', 'b3js', 'batamsg', 'dumai_sg', 'west', 'north', 'north2', 'south_au', 'bifrost'];
export const DOMESTIC = ['dom1', 'dom2', 'dom3', 'dom4', 'dom5', 'dom6', 'dom7', 'dom8', 'dom9', 'smpcs'];

export function routePts(name, y = 0.16) {
  const r = ROUTES[name]; return r.map(p => P(p[0], p[1], y));
}
export function mapWorld(GEO, o = {}) {
  const { scene, camera } = setupScene({ near: o.near ?? 70, far: o.far ?? 170, top: '#a6d6f2', bot: '#e3f2f9', fov: 38 });
  scene.background = new THREE.Color('#cfe9f4');
  const map = buildMap(GEO.map, { seed: o.seed || 5, fieldScale: o.fieldScale || 1.8 });
  scene.add(map);
  const cables = {};
  const add = (name, color = PAL.cyan, r = 0.07, extra = {}) => {
    const m = tubeFrom(routePts(name, extra.y ?? 0.17), r, cableMat({ color, dens: extra.dens ?? 3, speed: extra.speed ?? 0.25, pulse: extra.pulse || '#ffffff', dash: extra.dash, opacity: extra.opacity ?? 1, transparent: true }), null, 5);
    m.renderOrder = 2; scene.add(m); cables[name] = m; return m;
  };
  return { scene, camera, map, cables, add };
}
export function setCable(m, t, o = {}) {
  if (!m) return; const u = m.material.uniforms; u.uTime.value = t;
  if (o.prog !== undefined) u.uProg.value = o.prog;
  if (o.op !== undefined) { u.uOpacity.value = o.op; m.visible = o.op > 0.01; }
  if (o.color) u.uColor.value.set(o.color);
  if (o.pulse) u.uPulse.value.set(o.pulse);
}
export function cityV(name, y = 0.2) { const c = CITY[name]; return P(c[0], c[1], y); }
// slerp-densified great circle path on globe through waypoints
export function globePath(wps, R, lift = 1.015, per = 24) {
  const pts = [];
  for (let i = 0; i < wps.length - 1; i++) {
    const A = lonlat3(wps[i][0], wps[i][1], 1), B = lonlat3(wps[i + 1][0], wps[i + 1][1], 1); const ang = A.angleTo(B) || 1e-4;
    const n = Math.max(4, Math.round(per * ang));
    for (let k = 0; k < n; k++) { const u = k / n; const v = A.clone().multiplyScalar(Math.sin((1 - u) * ang) / Math.sin(ang)).add(B.clone().multiplyScalar(Math.sin(u * ang) / Math.sin(ang))); pts.push(v.normalize().multiplyScalar(R * lift)); }
  }
  const L = wps[wps.length - 1]; pts.push(lonlat3(L[0], L[1], R * lift)); return pts;
}

// ---------- 3D info card (canvas texture) ----------
import * as HH from '../lib/hud.js';
import { canvasPlane as _cp } from '../lib/world.js';
export function infoCard(spec, worldW = 6) {
  const w = spec.w || 1200, h = spec.h || 820;
  return _cp(w, h, (x) => {
    HH.rr(x, 8, 8, w - 16, h - 16, 34); x.fillStyle = spec.bg || '#ffffff'; x.fill();
    x.lineWidth = 3; x.strokeStyle = 'rgba(19,36,59,0.10)'; x.stroke();
    if (spec.accent) { x.save(); HH.rr(x, 8, 8, w - 16, h - 16, 34); x.clip(); x.fillStyle = spec.accent; x.fillRect(8, 8, 18, h); x.restore(); }
    let y = 70;
    if (spec.date) { HH.rr(x, 60, 46, HH.measure(x, spec.date, HH.F.mono(700, 46), 6) + 50, 80, 14); x.fillStyle = spec.dateBg || '#13243b'; x.fill(); HH.text(x, spec.date, 85, 102, HH.F.mono(700, 46), '#fff', 'left', 6); y = 190; }
    if (spec.kicker) { HH.text(x, spec.kicker, 64, y, HH.F.mono(700, 34), spec.kickerColor || '#6b7a8c', 'left', 4); y += 70; }
    if (spec.title) { for (const l of HH.wrap(x, spec.title, HH.F.cond(700, spec.titleSize || 92), w - 130)) { HH.text(x, l, 62, y + 40, HH.F.cond(700, spec.titleSize || 92), spec.titleColor || '#13243b', 'left', 1); y += (spec.titleSize || 92) * 0.98; } y += 40; }
    if (spec.quote) { HH.text(x, '“', 52, y + 70, HH.F.cond(700, 150), spec.accent || '#12b5e5'); for (const l of HH.wrap(x, spec.quote, HH.F.sans(600, spec.quoteSize || 60), w - 190)) { HH.text(x, l, 130, y + 40, HH.F.sans(600, spec.quoteSize || 60), '#0f1d30'); y += (spec.quoteSize || 60) * 1.3; } y += 30; }
    if (spec.body) { for (const l of HH.wrap(x, spec.body, HH.F.sans(400, spec.bodySize || 46), w - 130)) { HH.text(x, l, 64, y + 30, HH.F.sans(400, spec.bodySize || 46), '#24384f'); y += (spec.bodySize || 46) * 1.32; } }
    if (spec.who) HH.text(x, spec.who, 64, h - 110, HH.F.cond(600, 44), '#13243b', 'left', 1);
    if (spec.src) HH.text(x, 'SUMBER: ' + spec.src, 64, h - 50, HH.F.mono(500, 26), '#6b7a8c', 'left', 1);
    if (spec.draw) spec.draw(x, w, h);
  }, worldW);
}
