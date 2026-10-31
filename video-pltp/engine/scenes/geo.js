// geo.js — data & builder geografis bersama (globe, peta Indonesia)
import { THREE, C, V, basic, mat } from '../core/kit.js';
const cache = {};
export async function loadJSON(name) { return cache[name] ?? (cache[name] = await (await fetch('data/' + name)).json()); }
// lat/lon -> titik pada bola (konsisten dengan UV SphereGeometry three.js)
export function ll2v(lat, lon, r = 1) { const phi = (lon + 180) / 360 * Math.PI * 2; const th = (90 - lat) * Math.PI / 180; return V(-r * Math.cos(phi) * Math.sin(th), r * Math.cos(th), r * Math.sin(phi) * Math.sin(th)); }
let landTex = null;
export async function globeTexture() {
  if (landTex) return landTex; const land = await loadJSON('land.json');
  const W = 4096, H = 2048; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#D7E8F6'); grd.addColorStop(0.5, '#CFE3F5'); grd.addColorStop(1, '#D7E8F6'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
  for (let lon = -180; lon <= 180; lon += 15) { const x = (lon + 180) / 360 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let lat = -75; lat <= 75; lat += 15) { const y = (90 - lat) / 180 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = '#F7F1E6'; g.strokeStyle = '#D9CBB2'; g.lineWidth = 2.2;
  for (const poly of land) { g.beginPath(); poly.forEach(([lo, la], i) => { const x = (lo + 180) / 360 * W, y = (90 - la) / 180 * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke(); }
  landTex = new THREE.CanvasTexture(cv); landTex.colorSpace = THREE.SRGBColorSpace; landTex.anisotropy = 8; return landTex;
}
// Cincin Api (jalur ilustratif)
export const RING = [[-46,-73],[-38,-72],[-33,-70],[-23,-68],[-16,-71],[-8,-78],[-2,-78],[2,-77],[6,-76],[10,-85],[13,-88],[15,-91],[19,-99],[24,-106],[32,-116],[38,-122],[42,-122],[46,-122],[50,-124],[55,-131],[59,-140],[60,-150],[57,-156],[54,-163],[52,-172],[51,-180],[52,175],[54,167],[56,161],[52,157],[47,153],[43,146],[40,142],[36,139],[33,132],[29,130],[25,126],[20,122],[15,121],[11,124],[7,126],[3,126],[0,127],[-3,129],[-5,132],[-6,138],[-6,145],[-6,148],[-9,152],[-11,160],[-15,167],[-19,169],[-21,-175],[-25,-176],[-30,-178],[-34,179],[-38,177],[-40,175]];
export const SUNDA = [[5.5,95.5],[3,98],[1,99.5],[-1,100.5],[-3,102.3],[-5,104.5],[-6.5,106.5],[-7.2,108],[-7.5,110.5],[-7.9,112.5],[-8.2,114.2],[-8.4,116],[-8.4,118.5],[-8.6,121],[-8.4,123.5],[-7.6,126],[-6.6,129]];
// Gunung api aktif terpilih (koordinat perkiraan, ilustratif) — Smithsonian GVP
export const VOLCANOES = [[5.45,95.66],[4.91,96.33],[3.17,98.39],[0.69,99.54],[-0.38,100.47],[-0.98,100.68],[-1.70,101.26],[-3.52,102.62],[-4.03,103.13],[-6.10,105.42],[-6.72,106.73],[-6.78,106.98],[-6.77,107.60],[-7.32,107.73],[-7.14,107.84],[-7.25,108.06],[-7.24,109.21],[-7.20,109.92],[-7.30,109.99],[-7.38,110.07],[-7.54,110.45],[-7.63,111.19],[-7.93,112.31],[-7.73,112.58],[-8.11,112.92],[-7.94,112.95],[-8.13,114.04],[-8.06,114.24],[-8.34,115.51],[-8.24,115.38],[-8.42,116.46],[-8.25,117.99],[-8.20,119.07],[-8.88,120.95],[-8.77,121.82],[-8.68,122.45],[-8.54,122.78],[-8.27,123.50],[-7.53,127.42],[-6.64,129.73],[-4.53,129.88],[-0.17,121.61],[1.11,124.73],[1.36,124.79],[2.30,125.37],[2.78,125.40],[3.69,125.45],[0.80,127.33],[1.49,127.63],[1.69,127.88]];
// PLTP ikonik (koordinat perkiraan; kapasitas dari sumber di naskah)
export const PLANTS = [
  { k: 'kamojang', name: 'Kamojang', mw: 235, lat: -7.14, lon: 107.79, op: 'PGE', reg: 'jabar' },
  { k: 'salak', name: 'Gunung Salak', mw: 381, lat: -6.74, lon: 106.64, op: 'Star Energy', reg: 'jabar' },
  { k: 'darajat', name: 'Darajat', mw: 275, lat: -7.22, lon: 107.73, op: 'Star Energy', reg: 'jabar' },
  { k: 'wayang', name: 'Wayang Windu', mw: 231, lat: -7.20, lon: 107.63, op: 'Star Energy', reg: 'jabar' },
  { k: 'patuha', name: 'Patuha', mw: 55, lat: -7.16, lon: 107.40, op: 'Geo Dipa', reg: 'jabar' },
  { k: 'dieng', name: 'Dieng', mw: 60, lat: -7.20, lon: 109.88, op: 'Geo Dipa', reg: 'jateng' },
  { k: 'sarulla', name: 'Sarulla', mw: 330, lat: 1.90, lon: 99.05, op: 'SOL', reg: 'sumut' },
  { k: 'sibayak', name: 'Sibayak', mw: 12, lat: 3.23, lon: 98.50, op: 'PGE', reg: 'sumut' },
  { k: 'ulubelu', name: 'Ulubelu', mw: 220, lat: -5.30, lon: 104.57, op: 'PGE', reg: 'lampung' },
  { k: 'lumut', name: 'Lumut Balai', mw: 110, lat: -4.22, lon: 103.62, op: 'PGE', reg: 'sumsel' },
  { k: 'rantau', name: 'Rantau Dedap', mw: 98, lat: -4.30, lon: 103.40, op: 'Supreme Energy', reg: 'sumsel' },
  { k: 'muara', name: 'Muara Laboh', mw: 85, lat: -1.50, lon: 101.10, op: 'Supreme Energy', reg: 'sumbar' },
  { k: 'lahendong', name: 'Lahendong', mw: 120, lat: 1.27, lon: 124.83, op: 'PGE', reg: 'sulut' },
  { k: 'ijen', name: 'Ijen', mw: 34, lat: -8.06, lon: 114.20, op: 'Medco', reg: 'jatim' },
];
// Peta Indonesia 3D (proyeksi equirectangular lokal, skala 1 derajat = S unit)
export async function indonesiaMesh(o = {}) {
  const polys = await loadJSON('indonesia.json'); const neigh = await loadJSON('neighbors.json');
  const S = o.scale ?? 0.5, lon0 = o.lon0 ?? 118, lat0 = o.lat0 ?? -2.5, depth = o.depth ?? 0.22;
  const toXY = (lo, la) => [(lo - lon0) * S, (la - lat0) * S];
  const g = new THREE.Group();
  const mk = (list, color, d, side) => { const shapes = []; for (const p of list) { const sh = new THREE.Shape(); p.forEach(([lo, la], i) => { const [x, y] = toXY(lo, la); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }); shapes.push(sh); }
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: d, bevelEnabled: true, bevelThickness: d * 0.25, bevelSize: 0.02, bevelSegments: 1, curveSegments: 1 }); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, side); m.castShadow = true; m.receiveShadow = true; return m; };
  const land = mk(polys, '#fff', depth, [mat(o.top ?? '#F7F1E6', { r: 0.8 }), mat(o.side ?? '#E2CFAE', { r: 0.8 })]); g.add(land);
  const nb = mk(neigh, '#fff', depth * 0.6, [mat('#EEF1F5', { r: 0.9 }), mat('#D9DFE7', { r: 0.9 })]); g.add(nb);
  const pos = (lat, lon, y = depth + 0.03) => { const [x, z] = toXY(lon, lat); return V(x, y, -z); };
  return { group: g, pos, S, land };
}
