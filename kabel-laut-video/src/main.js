import * as THREE from 'three';
import * as H from './lib/hud.js';
import { SCENES } from './scenes/index.js';

const W = 1920, HT = 1080, TD = 0.75; // transition half-width (s)
const qs = new URLSearchParams(location.search);
const glc = document.getElementById('gl'), hudc = document.getElementById('hud');
const h = hudc.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: qs.get('aa') !== '0', preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, HT, false);
const SAMPLES = +(qs.get('msaa') ?? 4);
function mkRT() { const rt = new THREE.WebGLRenderTarget(W, HT, { samples: SAMPLES, depthBuffer: true }); if (!qs.get('lin')) rt.texture.colorSpace = THREE.SRGBColorSpace; return rt; }
const rtA = mkRT(), rtB = mkRT();

const post = new THREE.ShaderMaterial({
  uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, p: { value: 0 }, mode: { value: 0 }, px: { value: new THREE.Vector2(1 / W, 1 / HT) }, fxaa: { value: qs.get('fxaa') === '0' ? 0 : 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: `
  uniform sampler2D tA,tB; uniform float p; uniform int mode; uniform vec2 px; uniform float fxaa; varying vec2 vUv;
  vec3 fx(sampler2D tex, vec2 uv){
    vec3 l=vec3(0.299,0.587,0.114);
    vec3 nw=texture2D(tex,uv+vec2(-1.,-1.)*px).rgb, ne=texture2D(tex,uv+vec2(1.,-1.)*px).rgb, sw=texture2D(tex,uv+vec2(-1.,1.)*px).rgb, se=texture2D(tex,uv+vec2(1.,1.)*px).rgb, m=texture2D(tex,uv).rgb;
    float a=dot(nw,l),b=dot(ne,l),c=dot(sw,l),d=dot(se,l),e=dot(m,l);
    float mn=min(e,min(min(a,b),min(c,d))), mx=max(e,max(max(a,b),max(c,d)));
    vec2 dir=vec2(-((a+b)-(c+d)),((a+c)-(b+d)));
    float red=max((a+b+c+d)*(0.25*0.125),1./128.); float rcp=1./(min(abs(dir.x),abs(dir.y))+red);
    dir=clamp(dir*rcp,vec2(-8.),vec2(8.))*px;
    vec3 A=0.5*(texture2D(tex,uv+dir*(1./3.-.5)).rgb+texture2D(tex,uv+dir*(2./3.-.5)).rgb);
    vec3 B=A*0.5+0.25*(texture2D(tex,uv+dir*-.5).rgb+texture2D(tex,uv+dir*.5).rgb);
    float lb=dot(B,l); return (lb<mn||lb>mx)?A:B;
  }
  vec3 zb(sampler2D tex, vec2 uv, float s, float blur){ // zoom + radial blur
    vec2 c=vec2(0.5); vec2 u=c+(uv-c)/s; vec3 acc=vec3(0.); float w=0.;
    for(int i=0;i<8;i++){ float k=float(i)/7.; vec2 uu=c+(u-c)*(1.-blur*k*0.12); float ww=1.-k*0.5; acc+=texture2D(tex,clamp(uu,0.001,0.999)).rgb*ww; w+=ww; }
    return acc/w;
  }
  vec3 toS(vec3 c){ c=clamp(c,0.,1.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-0.055, step(0.0031308,c)); }
  void main(){
    vec3 col;
    if(mode==0){ col = fxaa>0.5 ? fx(tA,vUv) : texture2D(tA,vUv).rgb; }
    else if(mode==1){ // zoom-through
      float q=smoothstep(0.,1.,p);
      vec3 a=zb(tA,vUv,1.+q*q*1.6,q*3.); vec3 b=zb(tB,vUv,0.55+0.45*q,(1.-q)*3.);
      float m=smoothstep(0.38,0.62,p); col=mix(a,b,m); col=mix(col,vec3(1.),0.35*sin(3.14159*p)*sin(3.14159*p));
    } else if(mode==2){ // dive: water line sweeps up
      float edge=1.15-p*1.4+0.025*sin(vUv.x*14.+p*9.)+0.012*sin(vUv.x*37.-p*13.);
      vec2 ua=vUv+vec2(0.,-p*0.25); vec2 ub=vUv+vec2(0.,(1.-p)*0.25);
      vec3 a=texture2D(tA,clamp(ua,0.001,0.999)).rgb; vec3 b=texture2D(tB,clamp(ub,0.001,0.999)).rgb;
      float m=smoothstep(edge+0.004,edge-0.004,vUv.y); col=mix(a,b,1.-m);
      float foam=smoothstep(0.018,0.0,abs(vUv.y-edge)); col=mix(col,vec3(0.93,0.98,1.),foam*0.9);
      col=mix(col,vec3(0.55,0.82,0.92),0.18*(1.-m)*(1.-p));
    } else if(mode==3){ // flip card
      float ang=p*3.14159; float s=abs(cos(ang)); vec2 c=vec2(0.5);
      vec2 u=vUv-c; float persp=1.+ (p<0.5? u.x: -u.x)*0.35*sin(ang); u.x/=max(s,0.001); u.y*=persp; u+=c;
      vec3 bg=vec3(0.93,0.96,0.98);
      if(u.x<0.||u.x>1.||u.y<0.||u.y>1.) col=bg; else col = p<0.5 ? texture2D(tA,u).rgb : texture2D(tB,u).rgb;
      col=mix(col,bg,0.25*sin(ang));
    } else { // flash
      vec3 a=texture2D(tA,vUv).rgb, b=texture2D(tB,vUv).rgb; float m=smoothstep(0.42,0.58,p);
      col=mix(a,b,m); col=mix(col,vec3(1.),pow(sin(3.14159*p),2.)*0.92);
    }
    // gentle vignette
    vec2 d=vUv-0.5; col*=1.0-0.10*dot(d,d)*2.2;
    gl_FragColor=vec4(toS(col),1.);
  }`,
  depthTest: false, depthWrite: false,
});
const quadScene = new THREE.Scene(); const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const quad = new THREE.Mesh(tri, post); quad.frustumCulled = false; quadScene.add(quad);
const DIRECT = qs.get('direct') !== '0';
const MODES = { zoom: 1, dive: 2, flip: 3, flash: 4 };

let TL, GEO = {}; const built = new Map(); const chunkCache = new Map();
function makeT(sc) {
  const s = sc.start;
  return {
    dur: sc.end - s, n: sc.lines.length,
    L: i => sc.lines[Math.min(i, sc.lines.length - 1)].start - s,
    E: i => sc.lines[Math.min(i, sc.lines.length - 1)].end - s,
    w: (i, str, nth = 0) => { const ln = sc.lines[i]; let c = 0; for (const w of ln.words) if (w[2].toLowerCase().includes(str.toLowerCase())) { if (c++ === nth) return w[0] - s; } return ln.start - s; },
    wk: (i, k) => { const ws = sc.lines[i].words; return ws[Math.min(k, ws.length - 1)][0] - s; },
  };
}
async function ensure(i) {
  if (built.has(i)) return built.get(i);
  const sc = TL.scenes[i]; const mod = SCENES[sc.id];
  const T = makeT(sc);
  const st = await mod.build({ GEO, T, sc });
  st.T = T; st.mod = mod; built.set(i, st);
  // evict far scenes
  for (const k of [...built.keys()]) if (Math.abs(k - i) > 1) { disposeScene(built.get(k)); built.delete(k); }
  return st;
}
function disposeScene(st) {
  st.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
  if (st.scene.background && st.scene.background.dispose) st.scene.background.dispose();
}
function sceneAt(t) { let i = 0; for (let k = 0; k < TL.scenes.length; k++) if (t >= TL.scenes[k].start) i = k; return i; }
async function drawScene(i, t, rt) {
  const st = await ensure(i); const sc = TL.scenes[i]; const lt = t - sc.start;
  st.mod.update(st, lt, st.T, t);
  renderer.setRenderTarget(rt); renderer.render(st.scene, st.camera);
  return st;
}
function currentLine(sc, t) {
  for (const ln of sc.lines) if (t >= ln.start - 0.05 && t <= ln.end + 0.35) return ln;
  return null;
}
function lastSrc(sc, t) {
  let out = null; for (const ln of sc.lines) { if (ln.start - 0.05 <= t && t <= ln.end + 1.2) out = ln.src.length ? ln.src : out; }
  return out;
}
function drawHUD(i, t, stA, alphaScene = 1) {
  if (qs.get('nohud')) return;
  const sc = TL.scenes[i]; const lt = t - sc.start; const st = stA;
  const hdr = st.mod.header ? st.mod.header(st, lt, st.T) : {};
  const hideUI = hdr.hide ?? 0;
  const ua = 1 - hideUI;
  H.header(h, { date: hdr.date ?? sc.date, big: hdr.big ?? (sc.chapter ? sc.chapter.split('·')[0].trim() : sc.clock), route: hdr.route || {}, alpha: ua * (hdr.alpha ?? 1), time: t });
  H.badge(h, ua * (hdr.badge ?? 1));
  if (st.mod.hud) { h.save(); h.globalAlpha = alphaScene; st.mod.hud(st, h, lt, st.T, t); h.restore(); }
  H.chapterCard(h, sc.chapter, lt);
  const ln = currentLine(sc, t);
  if (ln && !hdr.noCaption) { if (!chunkCache.has(ln)) chunkCache.set(ln, H.chunkLine(ln)); H.caption(h, ln, chunkCache.get(ln), t); }
  const srcs = lastSrc(sc, t); if (srcs && !hdr.noSrc) H.sourcePill(h, srcs, ua);
  if (st.mod.overlay) st.mod.overlay(st, h, lt, st.T, t);
}
window.renderAt = async function (t) {
  const n = TL.scenes.length; let trans = null;
  for (let k = 1; k < n; k++) { const b = TL.scenes[k].start; if (TL.scenes[k].transition !== 'none' && Math.abs(t - b) < TD) trans = { from: k - 1, to: k, p: (t - (b - TD)) / (2 * TD), mode: MODES[TL.scenes[k].transition] || 1 }; }
  h.clearRect(0, 0, W, HT);
  if (trans) {
    const a = await drawScene(trans.from, t, rtA); const b = await drawScene(trans.to, t, rtB);
    post.uniforms.mode.value = trans.mode; post.uniforms.p.value = trans.p;
    renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
    if (trans.p < 0.5) drawHUD(trans.from, t, a, 1 - trans.p * 2); else drawHUD(trans.to, t, b, (trans.p - 0.5) * 2);
  } else {
    const i = sceneAt(t);
    if (DIRECT) { await drawScene(i, t, null); }
    else { await drawScene(i, t, rtA); post.uniforms.mode.value = 0; post.uniforms.p.value = 0; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); }
    const st = built.get(i);
    drawHUD(i, t, st, 1);
  }
  return true;
};
const comp = document.createElement('canvas'); comp.width = W; comp.height = HT; const cc = comp.getContext('2d');
window.grab = function (q = 0.93) { cc.drawImage(glc, 0, 0); cc.drawImage(hudc, 0, 0); return comp.toDataURL('image/jpeg', q); };
window.__built = built; window.__renderer = renderer;
window.TLinfo = () => ({ duration: TL.duration, fps: TL.fps, scenes: TL.scenes.map(s => [s.id, s.start, s.end]) });

(async () => {
  TL = await (await fetch('/build/timeline.json')).json();
  GEO.map = await (await fetch('/build/map_sea.json')).json();
  GEO.dots = await (await fetch('/build/globe_dots.json')).json();
  await Promise.all(['500 20px "Barlow Condensed"', '600 20px "Barlow Condensed"', '700 20px "Barlow Condensed"', 'italic 500 20px "Barlow Condensed"', '400 20px Inter', '600 20px Inter', '700 20px Inter', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"'].map(f => document.fonts.load(f)));
  window.ready = true;
  if (qs.has('t')) { await window.renderAt(+qs.get('t')); }
})();
