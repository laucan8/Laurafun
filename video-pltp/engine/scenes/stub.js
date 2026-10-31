// stub.js — placeholder untuk adegan yang belum dibuat
import { THREE, baseScene, textPlane, C, rbox, mat } from '../core/kit.js';
export async function create({ entry }) {
  const { scene, camera } = baseScene();
  const card = rbox(8, 4.5, 0.4, 0.4, mat('#ffffff')); card.position.set(0, 2.6, 0); scene.add(card);
  const tp = textPlane([{ text: entry.type.toUpperCase(), size: 110 }, { text: entry.id, size: 60, color: C.hot }], { width: 7, w: 1024, h: 512, y: 200, align: 'center' }); tp.position.set(0, 2.6, 0.25); scene.add(tp);
  return { scene, camera, anchors: {}, update(t) { camera.position.set(Math.sin(t * 0.2) * 3, 4, 14); camera.lookAt(0, 2.4, 0); } };
}
