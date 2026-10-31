// Precompute geo assets: SEA map polygons (clipped, 50m) + globe land dots (110m)
const fs = require('fs'), path = require('path');
const topo = require('topojson-client');
const B = path.join(__dirname, '..', 'build'); fs.mkdirSync(B, { recursive: true });
const w50 = require('world-atlas/countries-50m.json');
const land110 = require('world-atlas/land-110m.json');
const countries = topo.feature(w50, w50.objects.countries).features;
const BBOX = [88, -16, 150, 27]; // lon0, lat0, lon1, lat1 (generous; render region smaller)
function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; }
function inBox(r) { return r.some(p => p[0] >= BBOX[0] && p[0] <= BBOX[2] && p[1] >= BBOX[1] && p[1] <= BBOX[3]); }
function simplify(r, tol) { // radial distance simplification
  const out = [r[0]]; for (let i = 1; i < r.length; i++) { const p = r[i], q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > tol) out.push(p); }
  return out.length >= 4 ? out : null;
}
const map = [];
for (const f of countries) {
  const g = f.geometry; if (!g) continue;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  for (const poly of polys) {
    if (!inBox(poly[0])) continue;
    const outer = simplify(poly[0], 0.02); if (!outer) continue;
    if (Math.abs(ringArea(outer)) < 0.004) continue;
    const holes = poly.slice(1).map(h => simplify(h, 0.02)).filter(Boolean);
    map.push({ n: f.properties.name, o: outer.map(p => [+p[0].toFixed(3), +p[1].toFixed(3)]), h: holes.map(h => h.map(p => [+p[0].toFixed(3), +p[1].toFixed(3)])) });
  }
}
fs.writeFileSync(path.join(B, 'map_sea.json'), JSON.stringify(map));
console.log('map polys', map.length, 'names', [...new Set(map.map(m => m.n))].join(', '));
// globe dots
const land = topo.feature(land110, land110.objects.land).features;
const rings = []; for (const f of land) { const g = f.geometry; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const p of polys) rings.push(p[0]); }
const bbs = rings.map(r => { let a = [1e9, 1e9, -1e9, -1e9]; for (const p of r) { a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]); } return a; });
function pip(x, y, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
const N = 26000, dots = []; const ga = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = ga * i;
  const lat = Math.asin(y) * 180 / Math.PI; let lon = Math.atan2(Math.sin(th) * rad, Math.cos(th) * rad) * 180 / Math.PI;
  let inside = false; for (let k = 0; k < rings.length && !inside; k++) { const b = bbs[k]; if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue; if (pip(lon, lat, rings[k])) inside = true; }
  if (inside && lat > -60) dots.push([+lon.toFixed(2), +lat.toFixed(2)]);
}
fs.writeFileSync(path.join(B, 'globe_dots.json'), JSON.stringify(dots));
console.log('globe dots', dots.length);
