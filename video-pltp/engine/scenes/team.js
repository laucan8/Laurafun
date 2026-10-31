// team.js — analogi tim sepak bola: penyerang PLTS/PLTB, gelandang PLTA/baterai, bek tengah PLTP.
import { THREE, C, V, baseScene, mat, basic, box, rbox, cyl, sphere, clamp, lerp, easeOut, easeInOut, easeBack, smooth, prog, cueOf, CamPath, textPlane, glowSprite, ring } from '../core/kit.js';

function pitchTex() { const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1000; const g = cv.getContext('2d'); for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#BFE3B0' : '#B3DCA3'; g.fillRect(i * 160, 0, 160, 1000); } g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.strokeRect(40, 40, 1520, 920); g.beginPath(); g.moveTo(800, 40); g.lineTo(800, 960); g.stroke(); g.beginPath(); g.arc(800, 500, 130, 0, 7); g.stroke(); g.strokeRect(40, 280, 220, 440); g.strokeRect(1340, 280, 220, 440); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
function token(label, color) { const g = new THREE.Group(); const base = cyl(0.55, 0.6, 0.25, mat('#FFFFFF'), 32); base.position.y = 0.12; g.add(base); const top = cyl(0.5, 0.5, 0.06, mat(color, { em: color, ei: 0.15 }), 32); top.position.y = 0.27; g.add(top); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 16), mat(color, { r: 0.4 })); body.position.y = 0.9; body.castShadow = true; g.add(body); const head = sphere(0.24, mat('#FFFFFF'), 0, 1.55, 0); g.add(head); const t = textPlane([{ text: label, size: 110, color, weight: 800, align: 'center' }], { width: 1.8, w: 1024, h: 220, y: 155 }); t.position.y = 2.25; g.add(t); return g; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 12, lightPos: [6, 18, 10] });
  const pitch = rbox(16, 0.3, 10, 0.2, new THREE.MeshStandardMaterial({ map: pitchTex(), roughness: 0.9 })); pitch.rotation.x = 0; pitch.position.y = -0.15; scene.add(pitch);
  // gawang
  for (const x of [-7.6, 7.6]) { const g = new THREE.Group(); g.position.x = x; scene.add(g); for (const z of [-1.2, 1.2]) g.add(cyl(0.05, 0.05, 1.2, mat('#fff'), 8, 0, 0.6, z)); const bar = cyl(0.05, 0.05, 2.4, mat('#fff'), 8, 0, 1.2, 0); bar.rotation.x = Math.PI / 2; g.add(bar); }
  const cu = (n, f) => cueOf(entry, n, f);
  const P = [['PLTS', '#F4A100', 3.8, -2.2, 'fw'], ['PLTB', '#2A9D8F', 3.8, 2.2, 'fw'], ['PLTA', '#2E86DE', 0.6, -1.8, 'mf'], ['Baterai', '#8E6CEF', 0.6, 1.8, 'mf'], ['PLTP', C.hot, -4.6, 0, 'df']];
  const toks = P.map(([nm, col, x, z, cue], i) => { const t = token(nm, col); t.position.set(x, 0, z); t.scale.setScalar(0.9); scene.add(t); const h = glowSprite(col, 2.6, 0); h.position.set(x, 0.9, z); scene.add(h); return { t, h, x, z, cue, at: cu(cue, 4) + (i % 2) * 0.3, i }; });
  const shield = ring(1.2, 0.08, C.hot); shield.position.set(-4.6, 0.05, 0); scene.add(shield);
  const ball = sphere(0.22, mat('#ffffff', { r: 0.4 }), 0, 0.22, 0); scene.add(ball);
  const anchors = { fw: { p: V(3.8, 2.6, 0), dx: 130, dy: 40 }, mf: { p: V(0.6, 2.6, 0), dx: -120, dy: -150 }, df: { p: V(-4.6, 2.6, 0), dx: -100, dy: -60 } };
  const path = new CamPath([{ t: 0, p: [0, 13, 15], l: [0, 0, 0], fov: 34 }, { t: cu('fw', 5), p: [8.5, 6.5, 12.5], l: [2.6, 0.8, 0], fov: 34 }, { t: cu('mf', 11), p: [2.5, 7.0, 13.5], l: [0.2, 0.8, 0], fov: 34 }, { t: cu('df', 15), p: [-9.5, 6.0, 11.5], l: [-3.8, 1.0, 0], fov: 34 }, { t: entry.dur, p: [-2.0, 12.0, 16.0], l: [-0.5, 0.4, 0], fov: 34 }]);
  return { scene, camera, anchors, update(t) { path.apply(camera, t, 0.03);
    toks.forEach((o) => { const k = easeBack(prog(t, o.at - 0.6, 0.6)); let vis = clamp(k); if (o.cue === 'fw' && t > o.at + 1) { const blink = Math.sin(t * 1.3 + o.i * 2.1); vis *= blink > -0.2 ? 1 : 0.15; } o.t.scale.setScalar(Math.max(0.001, 0.9 * clamp(k, 0, 1.2))); o.t.traverse((m) => { if (m.material) { m.material.transparent = true; m.material.opacity = vis; } });
      if (o.cue === 'mf') o.t.position.set(o.x + Math.sin(t * 0.8 + o.i) * 0.6, 0, o.z + Math.cos(t * 0.6 + o.i) * 0.4); o.h.material.opacity = o.cue === 'df' ? 0.5 * smooth(prog(t, o.at, 0.6)) * (0.7 + 0.3 * Math.sin(t * 3)) : 0; });
    shield.material.opacity = 0.9 * smooth(prog(t, cu('df', 15), 0.6)); shield.scale.setScalar(1 + 0.08 * Math.sin(t * 3)); const bp = (t * 0.25) % 1; ball.position.set(lerp(-4, 4, 0.5 + 0.5 * Math.sin(bp * Math.PI * 2)), 0.22 + Math.abs(Math.sin(t * 3)) * 0.3, Math.sin(t * 0.9) * 2); } };
}
