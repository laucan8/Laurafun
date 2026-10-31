// Ekstrak geometri Indonesia (10m) + daratan dunia (50m) dari world-atlas -> JSON ringan untuk engine.
const fs = require('fs');
const path = require('path');
const topo = require('topojson-client');
const NM = process.argv[2]; // path node_modules
const out = process.argv[3];
const c10 = JSON.parse(fs.readFileSync(path.join(NM, 'world-atlas/countries-10m.json')));
const land50 = JSON.parse(fs.readFileSync(path.join(NM, 'world-atlas/land-50m.json')));
const countries = topo.feature(c10, c10.objects.countries);
const idn = countries.features.find(f => f.id === '360' || (f.properties && f.properties.name === 'Indonesia'));
// Douglas-Peucker sederhana untuk mengurangi titik
function dpRing(ring, eps) {
  // ring tertutup: pecah di titik terjauh dari titik awal agar DP bekerja
  const r = ring.slice(0, -1); if (r.length < 4) return ring;
  let far = 0, fd = -1; for (let i = 1; i < r.length; i++) { const d = Math.hypot(r[i][0]-r[0][0], r[i][1]-r[0][1]); if (d > fd) { fd = d; far = i; } }
  const A = dpLine(r.slice(0, far + 1), eps), B = dpLine(r.slice(far).concat([r[0]]), eps);
  return A.slice(0, -1).concat(B);
}
function dp(pts, eps) { return dpRing(pts, eps); }
function dpLine(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const a = pts[0], b = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]; const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1e-9;
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) { const l = dpLine(pts.slice(0, idx + 1), eps), r = dpLine(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}
const polys = [];
const geom = idn.geometry;
const P = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
for (const poly of P) {
  const outer = poly[0];
  // hitung luas kasar, buang pulau sangat kecil
  let area = 0; for (let i = 0; i < outer.length - 1; i++) area += outer[i][0] * outer[i + 1][1] - outer[i + 1][0] * outer[i][1];
  area = Math.abs(area / 2);
  if (area < 0.004) continue;
  const simp = dp(outer, area > 5 ? 0.02 : 0.01).map(p => [+p[0].toFixed(3), +p[1].toFixed(3)]);
  if (simp.length >= 4) polys.push(simp);
}
fs.writeFileSync(path.join(out, 'indonesia.json'), JSON.stringify(polys));
// daratan dunia untuk tekstur globe (50m, disederhanakan)
const land = topo.feature(land50, land50.objects.land);
const lp = [];
const LG = land.geometry || land.features[0].geometry;
const LP = LG.type === 'Polygon' ? [LG.coordinates] : LG.coordinates;
for (const poly of LP) for (const ring of poly.slice(0,1)) { const s = dp(ring, 0.05).map(p => [+p[0].toFixed(2), +p[1].toFixed(2)]); if (s.length >= 4) lp.push(s); }
// juga semua negara (outline) untuk konteks peta regional (Malaysia, PNG, Timor Leste dll)
const neigh = [];
for (const f of countries.features) {
  if (f.id === '360') continue;
  const g = f.geometry; if (!g) continue;
  const PP = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of PP) { const r = poly[0]; const cx = r.reduce((s,p)=>s+p[0],0)/r.length, cy = r.reduce((s,p)=>s+p[1],0)/r.length;
    if (cx > 90 && cx < 145 && cy > -15 && cy < 12) { let area=0; for (let i=0;i<r.length-1;i++) area += r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1]; if (Math.abs(area/2)<0.01) continue; neigh.push(dp(r,0.02).map(p=>[+p[0].toFixed(3),+p[1].toFixed(3)])); } }
}
fs.writeFileSync(path.join(out, 'land.json'), JSON.stringify(lp));
fs.writeFileSync(path.join(out, 'neighbors.json'), JSON.stringify(neigh));
console.log('indonesia polys', polys.length, 'pts', polys.reduce((s, p) => s + p.length, 0), 'land', lp.length, 'neigh', neigh.length);
