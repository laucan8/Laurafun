// main.js — orkestrasi timeline, instans adegan, transisi 3D, dan render deterministik per frame.
import { THREE, clamp, smooth, smoother, easeInOut, easeOut, easeIn, lerp, gradientTexture, rng, softTexture } from './kit.js';
import { SceneUI, GlobalUI } from './ui.js';

const W = 1920, H = 1080;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const QS0 = new URLSearchParams(location.search);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = QS0.get('shadow') === 'pcf' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping; renderer.localClippingEnabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace;
const rtOpts = { samples: 4, colorSpace: THREE.SRGBColorSpace };
const rtA = new THREE.WebGLRenderTarget(W, H, rtOpts), rtB = new THREE.WebGLRenderTarget(W, H, rtOpts);

const TL = await (await fetch('timeline.json?' + Date.now())).json();
window.TL = TL; window.__REFS = TL.refs || [];
await Promise.all(['800 40px PJS', '700 40px PJS', '600 40px PJS', '500 40px PJS', '400 20px Inter', '600 20px Inter', '400 20px JBM', '700 20px JBM'].map((f) => document.fonts.load(f)));
await document.fonts.ready;

const uiRoot = document.getElementById('ui');
const globalUI = new GlobalUI(uiRoot, TL);
const insts = new Map();
const modCache = {};

async function ensure(i) {
  const e = TL.scenes[i]; if (insts.has(e.id)) return insts.get(e.id);
  let mod = modCache[e.type];
  if (!mod) { try { mod = await import(`../scenes/${e.type}.js`); } catch (err) { console.warn('scene module missing, stub:', e.type, err.message); mod = await import('../scenes/stub.js'); } modCache[e.type] = mod; }
  const inst = await mod.create({ entry: e, prev: TL.scenes[i - 1], next: TL.scenes[i + 1], TL, renderer });
  inst.entry = e; inst.ui = new SceneUI(uiRoot, e, inst); insts.set(e.id, inst); return inst;
}
function disposeInst(id) {
  const inst = insts.get(id); if (!inst) return;
  inst.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); } } });
  if (inst.dispose) inst.dispose(); inst.ui.dispose(); insts.delete(id);
}
function locate(t) {
  const S = TL.scenes; let lo = 0, hi = S.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (S[mid].start <= t) lo = mid; else hi = mid - 1; }
  const i = lo;
  if (i + 1 < S.length && S[i].trDur > 0) { const b = S[i + 1].start, h = S[i].trDur / 2; if (t >= b - h) return { i, j: i + 1, p: clamp((t - (b - h)) / S[i].trDur) }; }
  if (i > 0 && S[i - 1].trDur > 0) { const b = S[i].start, h = S[i - 1].trDur / 2; if (t < b + h) return { i: i - 1, j: i, p: clamp((t - (b - h)) / S[i - 1].trDur) }; }
  return { i, j: null, p: 0 };
}

// ======================= TRANSISI =======================
const tcam = new THREE.PerspectiveCamera(35, W / H, 0.1, 400); const D = 10;
const PH = 2 * D * Math.tan(THREE.MathUtils.degToRad(17.5)), PW = PH * W / H;
const TS = new THREE.Scene(); TS.background = gradientTexture('#F5F8FC', '#D9E1EB');
const mA = new THREE.MeshBasicMaterial({ map: rtA.texture, toneMapped: false }), mB = new THREE.MeshBasicMaterial({ map: rtB.texture, toneMapped: false });
const planeGeo = new THREE.PlaneGeometry(PW, PH);
function shadowCard(w, h) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.12, h * 1.18), new THREE.MeshBasicMaterial({ map: softTexture(), color: 0x1b2a44, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); return m; }
// kubus
const cube = new THREE.Group(); TS.add(cube);
const cA = new THREE.Mesh(planeGeo, mA); cA.position.z = PW / 2; cube.add(cA);
const cB = new THREE.Mesh(planeGeo, mB); cB.position.x = PW / 2; cB.rotation.y = Math.PI / 2; cube.add(cB);
// flip
const flip = new THREE.Group(); TS.add(flip);
const fA = new THREE.Mesh(planeGeo, mA); flip.add(fA); const fB = new THREE.Mesh(planeGeo, mB); fB.rotation.y = Math.PI; fB.position.z = -0.001; flip.add(fB);
const fSh = shadowCard(PW, PH); fSh.position.z = -2.5; TS.add(fSh);
// slide (karousel)
const sA = new THREE.Mesh(planeGeo, mA), sB = new THREE.Mesh(planeGeo, mB); TS.add(sA); TS.add(sB);
const sShA = shadowCard(PW, PH), sShB = shadowCard(PW, PH); TS.add(sShA); TS.add(sShB);
// shatter
const NX = 16, NY = 9; const shards = new THREE.Group(); TS.add(shards); const shB = new THREE.Mesh(planeGeo, mB); TS.add(shB);
const shardData = []; { const r = rng(99); for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
  const g = new THREE.PlaneGeometry(PW / NX, PH / NY); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) { uv.setXY(k, (x + uv.getX(k)) / NX, (y + uv.getY(k)) / NY); }
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: rtA.texture, toneMapped: false, transparent: true, side: THREE.DoubleSide }));
  const cx = -PW / 2 + (x + 0.5) * PW / NX, cy = -PH / 2 + (y + 0.5) * PH / NY; m.position.set(cx, cy, 0.01); shards.add(m);
  const dist = Math.hypot(cx / PW, cy / PH);
  shardData.push({ m, cx, cy, delay: dist * 0.55 + r() * 0.18, rx: (r() - 0.5) * 7, ry: (r() - 0.5) * 7, rz: (r() - 0.5) * 3, vx: cx * (0.5 + r()), vy: cy * (0.5 + r()) + (r() - 0.3) * 2, vz: 6 + r() * 10 });
} }
// shader transisi layar penuh
const ocam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const QS = new THREE.Scene();
const qMat = new THREE.ShaderMaterial({
  uniforms: { A: { value: rtA.texture }, B: { value: rtB.texture }, p: { value: 0 }, mode: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D A; uniform sampler2D B; uniform float p; uniform int mode; varying vec2 vUv;
    float h(vec2 q){ return fract(sin(dot(q, vec2(127.1,311.7)))*43758.5453); }
    float n2(vec2 q){ vec2 i=floor(q), f=fract(q); vec2 u=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
    float fbm(vec2 q){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n2(q); q*=2.03; a*=.5; } return s; }
    vec4 zb(sampler2D T, vec2 uv, float s, float blur){ vec2 c=vec2(.5); vec2 d=(uv-c)/s; vec4 acc=vec4(0.); for(int i=0;i<12;i++){ float k=float(i)/11.; acc+=texture2D(T, c + d*(1.-k*blur)); } return acc/12.; }
    vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
    void main(){
      vec4 col;
      if(mode==0){ // ZOOM PUNCH
        float e=p*p*(3.-2.*p);
        vec4 a=zb(A, vUv, 1.+e*1.4, 0.18*sin(3.14159*min(1.,p*1.6)));
        vec4 b=zb(B, vUv, 1.+(1.-e)*0.9, 0.16*sin(3.14159*max(0.,p*1.6-.6)));
        float m=smoothstep(.42,.58,p); col=mix(a,b,m);
        col.rgb += vec3(1.)*0.35*exp(-pow((p-.5)*7.,2.));
      } else { // HEAT DISSOLVE
        float n=fbm(vUv*vec2(4.2,2.4) + vec2(0., -p*0.6));
        float th=p*1.25-0.12;
        float edge=1.-smoothstep(0.,0.075,abs(n-th));
        vec2 off=vec2(0., edge*0.012*sin(vUv.x*80.+p*20.));
        vec4 a=texture2D(A, vUv+off), b=texture2D(B, vUv-off);
        float m=smoothstep(th-0.012, th+0.012, n);
        col=mix(b,a,m);
        vec3 hot=mix(vec3(1.,.42,.21), vec3(1.,.82,.4), edge);
        col.rgb=mix(col.rgb, hot, edge*0.9);
      }
      gl_FragColor=col;
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false, toneMapped: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), qMat); QS.add(quad);

function hideAllT() { cube.visible = flip.visible = fSh.visible = sA.visible = sB.visible = sShA.visible = sShB.visible = shards.visible = shB.visible = false; }
function drawTransition(kind, p) {
  hideAllT(); tcam.fov = 35; tcam.position.set(0, 0, D); tcam.lookAt(0, 0, 0); tcam.updateProjectionMatrix();
  if (kind === 'zoom' || kind === 'heat') { qMat.uniforms.p.value = p; qMat.uniforms.mode.value = kind === 'zoom' ? 0 : 1; renderer.render(QS, ocam); return; }
  const e = easeInOut(p);
  if (kind === 'cube') {
    cube.visible = true; cube.position.set(0, 0, -PW / 2); cube.rotation.set(0, -e * Math.PI / 2, 0);
    const pull = Math.sin(Math.PI * e); tcam.position.set(0, pull * 1.2, D + pull * (PW * 0.62)); tcam.lookAt(0, 0, -pull * 2);
  } else if (kind === 'flip') {
    flip.visible = true; fSh.visible = true; flip.rotation.set(Math.sin(Math.PI * e) * 0.12, e * Math.PI, 0); const pull = Math.sin(Math.PI * e);
    flip.position.z = -pull * 5; fSh.material.opacity = 0.35 * pull; tcam.position.set(0, 0, D);
  } else if (kind === 'slide') {
    sA.visible = sB.visible = true; sShA.visible = sShB.visible = true; const pull = Math.sin(Math.PI * e);
    sA.position.set(-e * PW * 1.15, 0, -pull * 6); sA.rotation.set(0, e * 0.75, 0);
    sB.position.set((1 - e) * PW * 1.15, 0, -pull * 6); sB.rotation.set(0, -(1 - e) * 0.75, 0);
    sShA.position.copy(sA.position).add(new THREE.Vector3(0, -0.6, -1.5)); sShA.rotation.copy(sA.rotation); sShA.material.opacity = 0.3 * pull;
    sShB.position.copy(sB.position).add(new THREE.Vector3(0, -0.6, -1.5)); sShB.rotation.copy(sB.rotation); sShB.material.opacity = 0.3 * pull;
  } else if (kind === 'shatter') {
    shards.visible = true; shB.visible = true; const s = 1.08 - 0.08 * easeOut(p); shB.scale.set(s, s, 1); shB.position.z = -0.02;
    for (const d of shardData) { const k = clamp((p - d.delay * 0.6) / 0.55); const ke = easeIn(k);
      d.m.position.set(d.cx + d.vx * ke * 0.9, d.cy + d.vy * ke * 0.9 - ke * ke * 2.0, 0.01 + d.vz * ke); d.m.rotation.set(d.rx * ke, d.ry * ke, d.rz * ke); d.m.material.opacity = 1 - smooth((k - 0.55) / 0.45); d.m.visible = k < 1; }
  } else { // fallback: crossfade sederhana via zoom shader tanpa zoom
    qMat.uniforms.p.value = p; qMat.uniforms.mode.value = 0; renderer.render(QS, ocam); return;
  }
  renderer.render(TS, tcam);
}

// ======================= RENDER =======================
let lastT = -1;
window.renderAt = async (t) => {
  const { i, j, p } = locate(t);
  const A = await ensure(i); const B = j !== null ? await ensure(j) : null;
  const ea = TL.scenes[i], eb = j !== null ? TL.scenes[j] : null;
  if (!B) {
    A.update(t - ea.start); renderer.setRenderTarget(null); renderer.render(A.scene, A.camera);
  } else {
    A.update(t - ea.start); renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(A.scene, A.camera);
    B.update(t - eb.start); renderer.setRenderTarget(rtB); renderer.clear(); renderer.render(B.scene, B.camera);
    renderer.setRenderTarget(null); drawTransition(ea.tr, p);
  }
  for (const [id, inst] of insts) {
    if (inst === A) inst.ui.update(t - ea.start, B ? 1 - smooth(clamp(p * 2.2)) : 1);
    else if (inst === B) inst.ui.update(t - eb.start, smooth(clamp(p * 2.2 - 1.2)));
    else inst.ui.update(-99, 0);
  }
  globalUI.update(t, ea, eb, p);
  // bersihkan instans yang jauh dari waktu sekarang
  for (const [id] of insts) { const e = TL.scenes.find((s) => s.id === id); if (e && (e.start + e.dur + 4 < t || e.start - 6 > t)) disposeInst(id); }
  lastT = t; return true;
};
window.sceneT = (id, local = 0) => { const e = TL.scenes.find((s) => s.id === id); return e ? e.start + local : 0; };
window.ready = true;
const q = new URLSearchParams(location.search);
if (q.has('noui')) uiRoot.style.display = 'none';
if (q.has('t')) await window.renderAt(parseFloat(q.get('t')));
else if (q.has('s')) await window.renderAt(window.sceneT(q.get('s'), parseFloat(q.get('l') || '3')));
