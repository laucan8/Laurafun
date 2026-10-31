import * as THREE from 'three';
import { Overlay } from './overlay.js';
import { Director } from './director.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const QP = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: QP.get('aa') !== '0', preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = QP.get('soft') === '0' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
window.SHADOW = parseInt(QP.get('sh') || '2048');
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 2, 15000);
const ov = new Overlay(document.getElementById('ov'), camera);

await Promise.all([
  document.fonts.load('600 40px BarlowC'), document.fonts.load('700 40px BarlowC'), document.fonts.load('500 40px BarlowC'),
  document.fonts.load('600 40px Inter'), document.fonts.load('500 40px Inter'), document.fonts.load('700 40px "JetBrains Mono"'),
]);

const dir = new Director(window.TIMELINE, scene, camera, ov);

window.renderFrame = (t) => {
  dir.update(t);
  renderer.render(scene, camera);
  return true;
};
window.scanEvents = () => {
  // overlay-only pass (no WebGL draw) to list when each overlay element appears -> SFX sync
  const ev = []; const seen = new Set(); const fps = window.TIMELINE.fps; const N = Math.round(window.TIMELINE.duration * fps);
  for (let f = 0; f < N; f++) {
    const t = f / fps; dir.update(t);
    for (const id of ov.used) if (!seen.has(id)) { seen.add(id); ev.push({ t, id }); }
    for (const id of [...seen]) if (!ov.used.has(id)) seen.delete(id);
  }
  return { events: ev, K: dir.K };
};
window.DURATION = window.TIMELINE.duration;
window.FPS = window.TIMELINE.fps;

const q = new URLSearchParams(location.search);
if (q.has('t')) {
  window.renderFrame(parseFloat(q.get('t')));
} else if (!q.has('render')) {
  // interactive preview: plays in real time with the VO track
  const audio = new Audio('../build/vo_full.wav');
  let t0 = performance.now();
  document.body.addEventListener('click', () => { audio.currentTime = 0; audio.play(); t0 = performance.now(); });
  const loop = () => { const t = audio.paused ? (performance.now() - t0) / 1000 % window.DURATION : audio.currentTime; window.renderFrame(t); requestAnimationFrame(loop); };
  loop();
}
window.READY = true;
