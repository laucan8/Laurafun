// tectonic.js — penampang subduksi: lempeng Indo-Australia menunjam di bawah Eurasia, magma naik ke busur gunung api.
import { THREE, C, V, baseScene, mat, basic, glass, box, cyl, sphere, clamp, lerp, easeOut, easeInOut, smooth, prog, cueOf, CamPath, Flow, curve, Plume, glowSprite, flatArrow, rng } from '../core/kit.js';

function extrudeProfile(pts, depth, material) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -depth / 2); const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true; return m; }
function stripeTex(c1, c2) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 256, 64); g.fillStyle = c2; for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 14, 64); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }

export async function create({ entry }) {
  const { scene, camera } = baseScene({ shadowSize: 16, lightPos: [8, 20, 14], groundY: -9.2, shadowOpacity: 0.1 });
  const Dp = 5;
  // mantel (latar)
  const mantle = extrudeProfile([[-11, -1.5], [11, -1.5], [11, -9], [-11, -9]], Dp * 0.98, mat('#FFB98A', { r: 0.95 })); mantle.position.z = -0.02; scene.add(mantle);
  // lempeng samudra (menunjam)
  const slabTop = [[-11, -1.0], [-4, -1.0], [-2.2, -1.3], [0, -2.4], [2.5, -4.6], [5.0, -7.4], [6.0, -8.8]];
  const bottom = slabTop.map(([x, y], i) => { const a = slabTop[Math.max(0, i - 1)], b = slabTop[Math.min(slabTop.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L; return [x + 1.2 * ty, y - 1.2 * tx]; }).reverse();
  const oceanPlate = extrudeProfile(slabTop.concat(bottom), Dp, new THREE.MeshStandardMaterial({ color: '#7FB2E5', roughness: 0.7 })); scene.add(oceanPlate);
  const stripeMat = new THREE.MeshStandardMaterial({ map: stripeTex('#7FB2E5', '#6AA3DB'), roughness: 0.7 }); const topStrip = new THREE.Mesh(new THREE.PlaneGeometry(7, Dp), stripeMat); topStrip.rotation.x = -Math.PI / 2; topStrip.position.set(-7.5, -0.99, 0); scene.add(topStrip);
  // laut
  const sea = extrudeProfile([[-11, 0], [-2.0, 0], [-2.0, -1.0], [-4, -1.0], [-11, -1.0]], Dp, glass('#9fd3ff', 0.45)); scene.add(sea);
  // lempeng benua
  const cont = extrudeProfile([[-2.0, 0], [-1.2, 0.25], [1.6, 0.5], [2.2, 0.6], [3.2, 0.6], [11, 0.6], [11, -3.6], [4, -3.4], [1.4, -2.0], [0, -1.6], [-1.0, -1.1], [-2.0, -0.6]], Dp, mat('#F1E2C2', { r: 0.9 })); scene.add(cont);
  const contTop = extrudeProfile([[-2.0, 0], [-1.2, 0.25], [1.6, 0.5], [2.2, 0.6], [3.2, 0.6], [11, 0.6], [11, 0.4], [3.2, 0.42], [-1.2, 0.08], [-2.0, -0.15]], Dp + 0.01, mat('#C2E0AE', { r: 0.95 })); scene.add(contTop);
  // gunung api
  const vol = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 2.2, 2.2, 40, 1, false), mat('#C9A27C', { r: 0.9 })); vol.position.set(2.6, 1.7, 0); vol.castShadow = true; scene.add(vol);
  const lava = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 24), basic('#FF6B35')); lava.position.set(2.6, 2.81, 0); scene.add(lava);
  const vglow = glowSprite('#FF8A3D', 2.2, 0.8); vglow.position.set(2.6, 3.0, 0); scene.add(vglow);
  const plume = new Plume(14, { rise: 3.0, spread: 1.0, size0: 0.4, size1: 1.8, life: 3.6, color: '#b8bcc8', opacity: 0.5, seed: 21 }); plume.group.position.set(2.6, 2.9, 0); scene.add(plume.group);
  const vol2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.4, 1.3, 32), mat('#D2AE88', { r: 0.9 })); vol2.position.set(5.6, 1.25, -1.2); vol2.castShadow = true; scene.add(vol2);
  // saluran & tetes magma
  const magPath = curve([V(2.4, -4.4, Dp / 2 + 0.03), V(2.3, -3.2, Dp / 2 + 0.03), V(2.5, -1.4, Dp / 2 + 0.03), V(2.6, 0.6, Dp / 2 + 0.03), V(2.6, 2.7, Dp / 2 + 0.03)]);
  const conduit = new THREE.Mesh(new THREE.TubeGeometry(magPath, 60, 0.12, 10), mat('#FF7A33', { em: '#FF6B35', ei: 0.5 })); scene.add(conduit);
  const blobs = new Flow(magPath, 18, { speed: 0.12, size: 0.16, color: '#FFB347', glow: 0.8, seed: 2 }); scene.add(blobs.mesh);
  const meltZone = glowSprite('#FF7A33', 3.4, 0.0); meltZone.position.set(2.4, -4.6, Dp / 2 + 0.2); scene.add(meltZone);
  // tetes air dari lempeng (dehidrasi)
  const waterDrops = new Flow(curve([V(2.0, -5.0, Dp / 2 + 0.05), V(2.3, -4.7, Dp / 2 + 0.05)]), 6, { speed: 0.4, size: 0.07, color: C.water, glow: 0.4, seed: 7 }); scene.add(waterDrops.mesh);
  // panah gerak lempeng
  const arrows = [0, 1, 2].map((i) => { const a = flatArrow(1.6, 0.18, '#2E86DE'); a.rotation.x = -Math.PI / 2; a.position.set(-9 + i * 2.2, -0.95, 1.2); scene.add(a); return a; });
  const anchors = { oplate: { p: V(-7, -1.6, Dp / 2), dx: -60, dy: 130 }, cplate: { p: V(8, 0.0, Dp / 2), dx: -80, dy: -170 }, trench: { p: V(-2.0, -0.6, Dp / 2), dx: -120, dy: -150 }, magma: { p: V(2.4, -3.0, Dp / 2), dx: 130, dy: 40 }, volcano: { p: V(2.6, 2.8, 0), dx: 110, dy: -90 } };
  const cu = (n, f) => cueOf(entry, n, f);
  const path = new CamPath([{ t: 0, p: [6, 7, 30], l: [0, -3.0, 0], fov: 34 }, { t: cu('sub', 9), p: [-4, 2.5, 25], l: [-1.0, -3.2, 0], fov: 34 }, { t: cu('melt', 18), p: [6.5, 0.5, 21], l: [2.0, -3.0, 0], fov: 34 }, { t: cu('arc', 24), p: [9.5, 6.0, 22], l: [2.4, -0.6, 0], fov: 34 }, { t: entry.dur, p: [11, 7.0, 24], l: [2.0, -1.0, 0], fov: 34 }]);
  return {
    scene, camera, anchors,
    update(t) {
      path.apply(camera, t, 0.05);
      stripeMat.map.offset.x = -t * 0.08; arrows.forEach((a, i) => { a.position.x = -9.6 + ((i * 2.2 + t * 0.6) % 6.6); a.visible = t > cu('plate', 4) - 0.5; });
      const km = smooth(prog(t, cu('melt', 18), 1.2)); conduit.visible = km > 0.01; conduit.scale.set(1, 1, 1); blobs.mesh.visible = km > 0.01; if (km > 0.01) blobs.update(t, km);
      meltZone.material.opacity = 0.7 * km; waterDrops.mesh.visible = t > cu('sub', 9); waterDrops.update(t);
      const ka = smooth(prog(t, cu('arc', 24), 1)); plume.update(t, 0.4 + 0.6 * ka); vglow.material.opacity = 0.4 + 0.5 * ka; lava.material.color.set(ka > 0.5 ? '#FF6B35' : '#E07A4F');
    },
  };
}
