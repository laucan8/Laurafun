import { setupScene } from '../lib/world.js';
export default { async build() { const { scene, camera } = setupScene({}); camera.position.set(0, 5, 10); camera.lookAt(0, 0, 0); return { scene, camera }; }, update() {} };
