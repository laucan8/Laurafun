// Deterministic helpers: easing, keyframes, seeded random
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
export const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeIn = t => t * t * t;
export const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const easeOutElastic = t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
// appear progress: 0 before a, eased to 1 over d seconds
export const ap = (t, a, d = 0.6, ease = easeOut) => ease(inv(a, a + d, t));
// in-out window: rises at a over d, falls at b over d
export const win = (t, a, b, d = 0.5) => Math.min(ap(t, a, d), 1 - ap(t, b - d, d, easeIn));

export function mulberry(seed) { return function () { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// keyframe track: keys = [[t, value(array|number)], ...] ; move-hold-move with easeInOut
export function track(keys, t, ease = easeInOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = ease(inv(t0, t1, t));
      if (Array.isArray(v0)) return v0.map((x, k) => lerp(x, v1[k], u));
      return lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// Camera rig: keys [[t, [px,py,pz], [lx,ly,lz], fov?]]
export function camRig(camera, keys, t, drift = 0.25) {
  const pos = track(keys.map(k => [k[0], k[1]]), t);
  const look = track(keys.map(k => [k[0], k[2]]), t);
  const fov = track(keys.map(k => [k[0], k[3] ?? 40]), t);
  const d = drift;
  camera.position.set(pos[0] + Math.sin(t * 0.31) * d, pos[1] + Math.sin(t * 0.23 + 1) * d * 0.6, pos[2] + Math.cos(t * 0.27) * d);
  camera.lookAt(look[0], look[1], look[2]);
  if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

export function fmt(n, dec = 0) { return n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
// move-hold keys: list [[t, pos, look], ...] -> camera keys that move over `mv` seconds then hold
export function holdKeys(list, mv = 1.5) {
  const out = [list[0]];
  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1], cur = list[i];
    out.push([cur[0], prev[1], prev[2]]);
    out.push([cur[0] + mv, cur[1], cur[2]]);
  }
  return out;
}
