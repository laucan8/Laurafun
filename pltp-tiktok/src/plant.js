// Set pieces: PLTP cutaway diorama, PLTU block, turbine set, balance scale,
// Indonesia map, hazard zone, seismic rings, rain.
import * as THREE from 'three';
import { COL, M, MU, add, cgeo, merge, VC, T, rng, clamp, lerp, smooth, Flow, roundedPath, Particles,
  treeGeo, towerGeo, mbaruNiangGeo, canvasTex, roundRect } from './world.js';
import { GEO } from './data/geo.js';

// ---------------------------------------------------------------- turbine set
export function makeTurbineSet() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(34, 2.4, 10), M(0x4a5560), { x: 17, y: 1.2 });
  const axisY = 7.6;
  // casing (lathe along +x)
  const prof = [[3.2, 0], [3.6, 2.5], [4.4, 7], [5.6, 12.5], [5.8, 14]].map(([r, y]) => new THREE.Vector2(r, y));
  const casG = new THREE.LatheGeometry(prof, 14); casG.rotateZ(-Math.PI / 2);
  const casMat = MU(0x8fa3b8, { transparent: true, opacity: 1, side: THREE.DoubleSide });
  const casing = add(g, casG, casMat, { x: 2, y: axisY });
  // rotor
  const rotor = new THREE.Group(); rotor.position.set(0, axisY, 0); g.add(rotor);
  const shaft = new THREE.CylinderGeometry(0.7, 0.7, 31, 8); shaft.rotateZ(Math.PI / 2);
  add(rotor, shaft, M(0x8a96a3), { x: 16.5, cast: false });
  const stages = [];
  for (let s = 0; s < 7; s++) {
    const R = 2.5 + s * 0.42, x = 3 + s * 1.85;
    const parts = [];
    const disc = new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.7, 14); disc.rotateZ(Math.PI / 2);
    parts.push(cgeo(disc, 0x9fabb8, T(x, 0, 0)));
    const nb = 16;
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * Math.PI * 2;
      const bl = new THREE.BoxGeometry(0.5, R * 0.48, 1.0);
      const m = new THREE.Matrix4().makeRotationX(a).multiply(new THREE.Matrix4().makeTranslation(0, R * 0.74, 0)).multiply(new THREE.Matrix4().makeRotationY(0.5));
      parts.push(cgeo(bl, s % 2 ? 0xe7edf2 : 0xcfd8e0, new THREE.Matrix4().makeTranslation(x, 0, 0).multiply(m)));
    }
    stages.push(...parts);
  }
  const rotG = merge(stages);
  const rotMesh = new THREE.Mesh(rotG, VC); rotMesh.castShadow = true; rotor.add(rotMesh);
  // generator
  const gen = new THREE.Group(); g.add(gen);
  const genBody = new THREE.CylinderGeometry(4.5, 4.5, 10, 16); genBody.rotateZ(Math.PI / 2);
  add(gen, genBody, M(0x2c5a85), { x: 24, y: axisY });
  for (let k = 0; k < 5; k++) { const rg = new THREE.CylinderGeometry(4.75, 4.75, 0.5, 16); rg.rotateZ(Math.PI / 2); add(gen, rg, M(0x24496b), { x: 19.8 + k * 2.1, y: axisY }); }
  const cap = new THREE.CylinderGeometry(3.6, 4.5, 1.6, 16); cap.rotateZ(Math.PI / 2);
  add(gen, cap, M(0x3b6e9c), { x: 29.8, y: axisY });
  const exc = new THREE.CylinderGeometry(2.2, 2.2, 3, 12); exc.rotateZ(Math.PI / 2);
  add(gen, exc, M(0x9aa6b2), { x: 32.2, y: axisY });
  add(gen, new THREE.BoxGeometry(11, 4, 7), M(0x3a4652), { x: 24, y: 3.6 });
  return { group: g, rotor, casing, casMat, gen, axisY };
}

function wellheadGeo() {
  return merge([
    cgeo(new THREE.CylinderGeometry(1.7, 1.9, 2.4, 10), 0x6b7682, T(0, 1.2, 0)),
    cgeo(new THREE.CylinderGeometry(2.4, 2.4, 1.6, 10), 0xd9443b, T(0, 3.0, 0)),
    cgeo(new THREE.CylinderGeometry(1.3, 1.3, 3.0, 10), 0x6b7682, T(0, 5.2, 0)),
    cgeo(new THREE.CylinderGeometry(2.0, 2.0, 1.2, 10), 0xd9443b, T(0, 7.0, 0)),
    cgeo(new THREE.TorusGeometry(1.3, 0.3, 5, 12), 0xf2b632, T(2.6, 3.0, 0, 0, Math.PI / 2)),
    cgeo(new THREE.TorusGeometry(1.3, 0.3, 5, 12), 0xf2b632, T(-2.6, 3.0, 0, 0, Math.PI / 2)),
    cgeo(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), 0x6b7682, T(0, 3.0, 0, 0, 0, Math.PI / 2)),
  ]);
}
function rigGeo(h = 38) {
  const parts = [];
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    parts.push(cgeo(new THREE.BoxGeometry(0.7, h, 0.7), 0xd9443b, T(x * 4.2, h / 2, z * 4.2, z * 0.1, 0, -x * 0.1)));
  }
  for (let k = 1; k < 7; k++) {
    const w = 4.0 - k * 0.42;
    parts.push(cgeo(new THREE.BoxGeometry(w * 2, 0.4, 0.4), 0xf4f4f4, T(0, h * k / 7.2, w)));
    parts.push(cgeo(new THREE.BoxGeometry(w * 2, 0.4, 0.4), 0xf4f4f4, T(0, h * k / 7.2, -w)));
    parts.push(cgeo(new THREE.BoxGeometry(0.4, 0.4, w * 2), 0xf4f4f4, T(w, h * k / 7.2, 0)));
    parts.push(cgeo(new THREE.BoxGeometry(0.4, 0.4, w * 2), 0xf4f4f4, T(-w, h * k / 7.2, 0)));
  }
  parts.push(cgeo(new THREE.BoxGeometry(14, 1.2, 14), 0x5b6573, T(0, 3, 0)));
  parts.push(cgeo(new THREE.BoxGeometry(3, 2, 3), 0xd9443b, T(0, h + 1, 0)));
  parts.push(cgeo(new THREE.BoxGeometry(8, 5, 6), 0xf2f2f2, T(9, 2.5, 4)));
  return merge(parts);
}

function pipe(parent, pts, r = 1.3, color = COL.steel, supports = true) {
  const path = roundedPath(pts, 3);
  const geo = new THREE.TubeGeometry(path, Math.max(24, Math.floor(path.getLength() / 1.2)), r, 8, false);
  add(parent, geo, M(color, { flatShading: false }));
  if (supports) {
    const L = path.getLength();
    const p = new THREE.Vector3(), tg = new THREE.Vector3();
    for (let d = 4; d < L - 2; d += 7) {
      path.getPointAt(d / L, p); path.getTangentAt(d / L, tg);
      if (Math.abs(tg.y) < 0.2 && p.y > r + 1.2) add(parent, new THREE.BoxGeometry(0.8, p.y - r, 0.8), M(0x8b949e), { x: p.x, y: (p.y - r) / 2, z: p.z });
    }
  }
  return path;
}

// ---------------------------------------------------------------- PLTP diorama
export function makePLTP() {
  const P = { group: new THREE.Group(), flows: {}, anchors: {} };
  const G = P.group;
  const X0 = -100, X1 = 100, D = 60;
  // strata boundary functions (section profile)
  const B = [
    () => -1.2,
    (x) => -8 - 2 * Math.sin(x * 0.05),
    (x) => -52 + 17 * Math.exp(-(((x + 5) / 70) ** 2)) + 2 * Math.sin(x * 0.07),
    (x) => -82 + 20 * Math.exp(-(((x + 5) / 75) ** 2)) + 2 * Math.sin(x * 0.05 + 1),
    (x) => -165 + 8 * Math.exp(-((x / 80) ** 2)) + 3 * Math.sin(x * 0.04),
    (x) => -210 + 4 * Math.sin(x * 0.03),
    () => -255,
  ];
  P.B = B;
  const layerCols = [0x8e6b4e, 0xd8c39b, 0xa08fb3, 0xe9be7e, 0xe39a5c, 0xcf6e45];
  const shapeFor = (k) => {
    const s = new THREE.Shape(); const n = 40;
    s.moveTo(X0, B[k](X0));
    for (let i = 1; i <= n; i++) { const x = X0 + (X1 - X0) * i / n; s.lineTo(x, B[k](x)); }
    for (let i = n; i >= 0; i--) { const x = X0 + (X1 - X0) * i / n; s.lineTo(x, B[k + 1](x)); }
    s.closePath(); return s;
  };
  P.back = new THREE.Group(); G.add(P.back);
  P.cover = new THREE.Group(); G.add(P.cover);
  P.coverMats = [];
  P.layerMats = [];
  for (let k = 0; k < 6; k++) {
    const sh = shapeFor(k);
    const gb = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 4 }); gb.translate(0, 0, -D);
    const mat = k === 2 ? MU(layerCols[k]) : M(layerCols[k]);
    const side = k === 2 ? mat : M(new THREE.Color(layerCols[k]).multiplyScalar(0.9).getHex());
    P.layerMats.push(mat);
    add(P.back, gb, [mat, side], { cast: false });
    const gf = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false, curveSegments: 4 });
    const cm = MU(layerCols[k], { transparent: true });
    const cs = MU(new THREE.Color(layerCols[k]).multiplyScalar(0.9).getHex(), { transparent: true });
    P.coverMats.push(cm, cs);
    add(P.cover, gf, [cm, cs], { cast: false });
  }
  P.caprockMat = P.layerMats[2];
  // grass top (back + cover), patchwork
  const r = rng(21);
  const gcols = [0x8cc152, 0x7db54a, 0x9dcb5e, 0x93c75a];
  for (let i = 0; i < 5; i++) {
    add(P.back, new THREE.BoxGeometry(39.6, 1.2, 59.6), M(gcols[i % 4]), { x: -80 + i * 40, y: -0.6, z: -30, cast: false });
    const cm = MU(gcols[(i + 2) % 4], { transparent: true }); P.coverMats.push(cm);
    add(P.cover, new THREE.BoxGeometry(39.6, 1.2, 59.6), cm, { x: -80 + i * 40, y: -0.6, z: 30, cast: false });
  }
  // cover trees
  const tg = treeGeo(1);
  const coverTrees = new THREE.InstancedMesh(tg, MU(0xffffff, { vertexColors: true, transparent: true }), 14);
  P.coverMats.push(coverTrees.material);
  for (let i = 0; i < 14; i++) coverTrees.setMatrixAt(i, T(-95 + i * 14 + r() * 4, 0, 18 + r() * 34, 0, r() * 6, 0, 0.8 + r() * 0.5));
  coverTrees.castShadow = true; P.cover.add(coverTrees);

  // ---- section face decorations (z ~ 0+)
  P.section = new THREE.Group(); G.add(P.section);
  // magma
  const mshape = new THREE.Shape();
  const mcx = 12, mry = 68, mrx = 82, n = 28;
  mshape.moveTo(mcx - mrx, -255);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI;
    const wob = 1 + 0.07 * Math.sin(i * 1.7) + 0.05 * Math.cos(i * 2.9);
    mshape.lineTo(mcx + Math.cos(a) * mrx * wob, -255 + Math.sin(a) * mry * wob);
  }
  mshape.closePath();
  const mg = new THREE.ExtrudeGeometry(mshape, { depth: 50, bevelEnabled: false }); mg.translate(0, 0, -49.6);
  P.magmaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGlow: { value: 1 } },
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vP; uniform float uTime,uGlow;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){ float n=nz(vP.xy*0.05+vec2(0.0,-uTime*0.35))*0.6+nz(vP.xy*0.13+vec2(uTime*0.2,0.0))*0.4;
        float top=smoothstep(-255.0,-195.0,vP.y);
        vec3 a=vec3(0.93,0.22,0.05), b=vec3(1.0,0.78,0.28);
        vec3 col=mix(a,b,clamp(n*0.85+top*0.35,0.0,1.0));
        gl_FragColor=vec4(col*uGlow,1.0);} `,
  });
  P.magma = add(P.section, mg, P.magmaMat, { cast: false });
  // glow halo
  const halo = canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,150,60,0.75)'); gr.addColorStop(0.5, 'rgba(255,110,40,0.25)'); gr.addColorStop(1, 'rgba(255,90,30,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  P.halo = new THREE.Mesh(new THREE.PlaneGeometry(320, 210), new THREE.MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  P.halo.position.set(12, -230, 1.2); P.halo.renderOrder = 2; P.section.add(P.halo);
  // fractures + pores in reservoir
  const fr = [];
  for (let i = 0; i < 34; i++) {
    const x = -92 + r() * 184; const top = B[3](x) - 6, bot = B[4](x) + 6;
    const y = bot + r() * (top - bot);
    fr.push(cgeo(new THREE.BoxGeometry(6 + r() * 14, 0.7, 0.3), 0x9b7548, T(x, y, 0.25, 0, 0, (r() - 0.5) * 2.2)));
  }
  for (let i = 0; i < 26; i++) {
    const x = -96 + r() * 192; const y = B[1](x) - 4 - r() * 30;
    fr.push(cgeo(new THREE.CircleGeometry(0.9 + r() * 1.4, 6), 0xbfa77d, T(x, y, 0.22)));
  }
  add(P.section, merge(fr), VC, { cast: false, recv: false });
  const pores = [];
  for (let i = 0; i < 70; i++) {
    const x = -94 + r() * 188; const top = B[3](x) - 3, bot = B[4](x) + 3;
    pores.push(cgeo(new THREE.CircleGeometry(1.0 + r() * 1.5, 7), 0x3cc3f0, T(x, bot + r() * (top - bot), 0.3)));
  }
  P.poreMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
  P.pores = add(P.section, merge(pores), P.poreMat, { cast: false, recv: false });
  // faults (dashed)
  const fl = [];
  for (const [x0, y0, x1, y1] of [[-93, -2, -60, -140], [94, -2, 64, -150]]) {
    const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    for (let d = 0; d < L; d += 9) { const u = d / L; fl.push(cgeo(new THREE.BoxGeometry(5.5, 1.0, 0.3), 0x5d4b3a, T(lerp(x0, x1, u), lerp(y0, y1, u), 0.35, 0, 0, a))); }
  }
  add(P.section, merge(fl), VC, { cast: false, recv: false });
  // section outline (crisp edge)
  const edge = [];
  edge.push(cgeo(new THREE.BoxGeometry(201, 0.8, 0.8), 0x3d3328, T(0, -255, 0.4)));
  edge.push(cgeo(new THREE.BoxGeometry(0.8, 255, 0.8), 0x3d3328, T(-100.2, -127.5, 0.4)));
  edge.push(cgeo(new THREE.BoxGeometry(0.8, 255, 0.8), 0x3d3328, T(100.2, -127.5, 0.4)));
  add(P.section, merge(edge), VC, { cast: false, recv: false });

  // ---- flows on section
  const Z = 0.9;
  P.flows.recL = new Flow([[-95, 0, Z], [-91, -28, Z], [-83, -66, Z], [-72, -106, Z], [-58, -136, Z], [-36, -150, Z], [-14, -152, Z]], { colorA: 0x2fb7ef, colorB: 0xff8a3a, radius: 1.6 });
  P.flows.recR = new Flow([[96, 0, Z], [92, -36, Z], [84, -82, Z], [72, -122, Z], [54, -150, Z], [34, -160, Z]], { colorA: 0x2fb7ef, colorB: 0xff8a3a, radius: 1.6 });
  P.flows.conv1 = new Flow([[16, -196, Z], [8, -170, Z], [-6, -140, Z], [-24, -112, Z], [-40, -96, Z], [-48, -92, Z]], { colorA: 0xff7a2a, colorB: 0xffd36e, radius: 1.5 });
  P.flows.conv2 = new Flow([[38, -196, Z], [44, -164, Z], [36, -128, Z], [16, -104, Z], [-8, -92, Z]], { colorA: 0xff7a2a, colorB: 0xffd36e, radius: 1.5 });
  P.flows.prod = new Flow([[-45, -126, 2.8], [-45, -60, 2.8], [-45, -1, 2.8]], { colorA: 0xff9a3c, colorB: 0xffffff, radius: 1.35, speed: 2.2 });
  P.flows.inj = new Flow([[72, -1, 2.8], [72, -70, 2.8], [72, -138, 2.8]], { colorA: 0x5fd0ff, colorB: 0x1f8fd6, radius: 1.35, speed: 1.6 });
  P.flows.inj2 = new Flow([[72, -138, Z], [64, -152, Z], [48, -166, Z], [30, -176, Z]], { colorA: 0x1f8fd6, colorB: 0xff8a3a, radius: 1.5 });
  // wells (casings), drill bit, rig
  const casG = new THREE.CylinderGeometry(2.4, 2.4, 1, 10); casG.translate(0, -0.5, 0);
  P.prodCasing = add(P.section, casG, M(0x59636e), { x: -45, y: -0.3, z: 0, cast: false });
  P.injCasing = add(P.section, casG, M(0x59636e), { x: 72, y: -0.3, z: 0, cast: false });
  P.prodDepth = 128; P.injDepth = 140;
  const bitG = new THREE.ConeGeometry(3.2, 7, 8); bitG.rotateX(Math.PI);
  P.bit = add(P.section, bitG, M(0xf2b632), { x: -45, y: -4, z: 0.5, cast: false });
  P.rig = add(G, rigGeo(), VC, { x: -45, y: 0, z: -5 });
  // ---- surface plant
  const S = new THREE.Group(); G.add(S); P.surface = S;
  add(S, new THREE.BoxGeometry(30, 0.8, 22), M(COL.concrete), { x: -45, y: 0.4, z: -11.5 });
  add(S, new THREE.BoxGeometry(26, 0.8, 22), M(COL.concrete), { x: 72, y: 0.4, z: -11.5 });
  P.wellP = add(S, wellheadGeo(), VC, { x: -45, y: 0.8, z: -2.2 });
  P.wellI = add(S, wellheadGeo(), VC, { x: 72, y: 0.8, z: -2.2 });
  // separator
  const sep = new THREE.Group(); sep.position.set(-20, 0, -15); S.add(sep);
  add(sep, new THREE.CylinderGeometry(4.6, 4.6, 14, 14), M(0xf3f5f7), { y: 10 });
  add(sep, new THREE.SphereGeometry(4.6, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf3f5f7), { y: 17 });
  add(sep, new THREE.SphereGeometry(4.6, 14, 7, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xf3f5f7), { y: 3 });
  add(sep, new THREE.CylinderGeometry(4.75, 4.75, 1.6, 14), M(COL.navy), { y: 13 });
  for (const [lx, lz] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) add(sep, new THREE.BoxGeometry(0.8, 3, 0.8), M(0x6b7682), { x: lx, y: 1.5, z: lz });
  P.anchors.separator = new THREE.Vector3(-20, 22, -15);
  // power house x[0,40] z[-36,-12]
  const ph = new THREE.Group(); S.add(ph); P.ph = ph;
  add(ph, new THREE.BoxGeometry(40, 0.6, 24), M(0xb9c0c7), { x: 20, y: 0.3, z: -24 });
  const wallM = M(0xf1f3f5);
  add(ph, new THREE.BoxGeometry(40, 18, 0.8), wallM, { x: 20, y: 9, z: -35.6 });
  add(ph, new THREE.BoxGeometry(0.8, 18, 24), wallM, { x: 0.4, y: 9, z: -24 });
  add(ph, new THREE.BoxGeometry(0.8, 18, 24), wallM, { x: 39.6, y: 9, z: -24 });
  P.phFrontMat = MU(0xf1f3f5, { transparent: true });
  P.phFront = add(ph, new THREE.BoxGeometry(40, 18, 0.8), P.phFrontMat, { x: 20, y: 9, z: -12.4 });
  P.phStripeMat = MU(0x5d7a94, { transparent: true });
  P.phStripe = add(ph, new THREE.BoxGeometry(40.2, 2.2, 0.9), P.phStripeMat, { x: 20, y: 14.2, z: -12.3, cast: false });
  P.phRoofMat = MU(COL.roof, { transparent: true });
  P.phRoof = add(ph, new THREE.BoxGeometry(42, 1.4, 26), P.phRoofMat, { x: 20, y: 18.7, z: -24 });
  const tset = makeTurbineSet(); tset.group.position.set(3, 0.6, -24); ph.add(tset.group); P.turbine = tset;
  P.anchors.turbine = new THREE.Vector3(12, 14, -24);
  P.anchors.generator = new THREE.Vector3(30, 13, -24);
  // cooling tower x[44,84] z[-57,-43]
  const ct = new THREE.Group(); S.add(ct);
  add(ct, new THREE.BoxGeometry(40, 12, 14), M(0xc9d2da), { x: 64, y: 6, z: -50 });
  for (let k = 0; k < 5; k++) add(ct, new THREE.BoxGeometry(38, 0.8, 0.4), M(0x8f9aa5), { x: 64, y: 2.5 + k * 1.8, z: -42.9, cast: false });
  P.fanX = [49, 59, 69, 79];
  for (const fx of P.fanX) {
    add(ct, new THREE.CylinderGeometry(4.3, 4.6, 3.6, 12), M(0xaeb8c2), { x: fx, y: 13.8, z: -50 });
    add(ct, new THREE.CylinderGeometry(3.6, 3.6, 0.3, 12), M(0x4a5560), { x: fx, y: 15.5, z: -50, cast: false });
  }
  P.anchors.cooling = new THREE.Vector3(64, 16, -50);
  // control building + switchyard + tower
  add(S, new THREE.BoxGeometry(22, 8, 14), M(0xf4f1ea), { x: -80, y: 4, z: -44 });
  add(S, new THREE.BoxGeometry(22.2, 2, 14.2), M(0x6fb5d9), { x: -80, y: 5.4, z: -44, cast: false });
  add(S, new THREE.BoxGeometry(24, 1, 16), M(COL.roof), { x: -80, y: 8.5, z: -44 });
  for (let k = 0; k < 3; k++) add(S, new THREE.BoxGeometry(4, 5, 4), M(0x7d8a96), { x: 88 + (k % 2) * 6, y: 2.5, z: -20 - k * 7 });
  add(S, towerGeo(34), VC, { x: 92, y: 0, z: -50 });
  // trees on block
  const tA = treeGeo(0), tB = treeGeo(1);
  const tpos = [[-96, -56], [-88, -57], [-60, -55], [-50, -57], [-40, -54], [-30, -56], [-96, -30], [-97, -20], [-94, -10], [92, -4], [96, -10], [-66, -30], [-12, -54], [-2, -50], [34, -52], [86, -56], [97, -38]];
  tpos.forEach(([x, z], i) => add(S, i % 3 ? tB : tA, VC, { x, y: 0, z, ry: i, s: 0.8 + (i % 4) * 0.12 }));
  // pipes
  P.pipeP1 = pipe(S, [[-45, 6.5, -2.2], [-45, 6.5, -9], [-32, 6.5, -9], [-26, 7, -12]]);
  P.pipeP2 = pipe(S, [[-15.4, 15, -15], [-8, 15, -15], [-8, 8, -15], [-8, 8, -24], [3.5, 8, -24]]);
  P.pipeP3 = pipe(S, [[-20, 2.6, -10.4], [-20, 2.6, -6], [72, 2.6, -6], [72, 2.6, -4.5]], 1.1);
  P.pipeP4 = pipe(S, [[50, 2.6, -43], [50, 2.6, -6.6]], 1.0);
  P.pipeP5 = pipe(S, [[30, 4, -36], [30, 4, -40], [46, 4, -40], [46, 4, -43]], 1.1);
  const ov = (path, a, b, sp = 1.4, rad = 1.6) => new Flow(null, { curve: path, colorA: a, colorB: b, radius: rad, speed: sp });
  P.flows.p1 = ov(P.pipeP1, 0xff9a3c, 0xffc06a);
  P.flows.p2 = ov(P.pipeP2, 0xffffff, 0x9fe6ff, 2.0, 1.65);
  P.flows.p3 = ov(P.pipeP3, 0x4fc6f5, 0x1f8fd6, 1.4, 1.35);
  P.flows.p4 = ov(P.pipeP4, 0x7fd8ff, 0x4fc6f5, 1.4, 1.25);
  P.flows.p5 = ov(P.pipeP5, 0x9fe6ff, 0x7fd8ff, 1.4, 1.35);
  P.flows.elec = new Flow([[38, 9, -24], [42, 12, -18], [88, 12, -18], [92, 29, -50]], { colorA: 0x19b8e6, colorB: 0xfff36b, radius: 0.9, speed: 3 });
  for (const f of Object.values(P.flows)) G.add(f.group);
  // emitters (particles) — world positions added by caller
  P.plumes = P.fanX.map((fx, i) => new Particles({ origin: [fx, 16, -50], count: 46, life: 4.2, vel: [5, 16, -1], spread: [2.2, 3, 2.2], area: [4, 1, 4], acc: [2.5, -0.4, 0], size: [7, 30], opacity: 0.9, seed: 50 + i }));
  P.burst = new Particles({ origin: [-45, 9, -2.2], count: 90, life: 2.2, vel: [0, 44, 0], spread: [6, 10, 6], area: [2, 1, 2], acc: [3, -4, 0], size: [5, 26], opacity: 0.95, seed: 77 });
  P.h2s = new Particles({ origin: [-45, 3, -6], count: 160, life: 7, vel: [3, 2.5, 4], spread: [18, 1.5, 18], area: [10, 2, 10], acc: [0, 0, 0], size: [18, 70], color: 0xd2d95a, opacity: 0.38, seed: 91, shade: 0.05, fadeIn: 0.2, fadeOut: 0.5 });
  P.anchors.prodTop = new THREE.Vector3(-45, 9, -2);
  P.anchors.injTop = new THREE.Vector3(72, 9, -2);
  return P;
}

// ---------------------------------------------------------------- rain
export function makeRain(count = 420, box = [200, 190, 120]) {
  const r = rng(5);
  const pos = new Float32Array(count * 6);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0x6fa9da, transparent: true, opacity: 0.0 });
  const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false;
  const seeds = Array.from({ length: count }, () => [r(), r(), r()]);
  return {
    obj: lines, mat,
    update(t, k) {
      mat.opacity = 0.65 * k; lines.visible = k > 0.01;
      if (!lines.visible) return;
      for (let i = 0; i < count; i++) {
        const [a, b, c] = seeds[i];
        const y = box[1] - ((t * 170 + b * box[1]) % box[1]);
        const x = (a - 0.5) * box[0], z = (c - 0.5) * box[2];
        pos.set([x, y + 7, z, x + 0.6, y, z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- PLTU block
export function makePLTU() {
  const U = { group: new THREE.Group(), anchors: {}, flows: {} };
  const G = U.group;
  add(G, new THREE.BoxGeometry(200, 38.8, 100), M(0x8e6b4e), { y: -20.6, cast: false });
  add(G, new THREE.BoxGeometry(200, 1.2, 78), M(0x93c75a), { y: -0.6, z: 11, cast: false });
  add(G, new THREE.BoxGeometry(200, 5, 22), M(0x79c3e6), { y: -3.6, z: -39, cast: false });
  add(G, new THREE.BoxGeometry(200, 3, 2), M(COL.concrete), { y: -1, z: -28 });
  add(G, new THREE.BoxGeometry(150, 0.5, 60), M(0xb7bcc0), { x: 15, y: 0.25, z: 6, cast: false });
  // coal piles
  const coal = M(0x2b2d31);
  [[-70, 25, 16, 11], [-48, 33, 13, 9], [-64, 6, 14, 10], [-80, 40, 10, 7]].forEach(([x, z, rr, h], i) => add(G, new THREE.ConeGeometry(rr, h, 7), i % 2 ? coal : M(0x33363b), { x, y: h / 2, z, ry: i }));
  add(G, new THREE.BoxGeometry(4, 10, 4), M(0xf2b632), { x: -56, y: 5, z: 18 });
  add(G, new THREE.BoxGeometry(26, 2, 2), M(0xf2b632), { x: -56, y: 10, z: 18, ry: 0.6 });
  // conveyor
  const c0 = new THREE.Vector3(-50, 3, 14), c1 = new THREE.Vector3(-21, 52, 8);
  const cl = c0.distanceTo(c1), mid = c0.clone().add(c1).multiplyScalar(0.5);
  const conv = add(G, new THREE.BoxGeometry(3.6, 2.2, cl), M(0x9aa3ad), { x: mid.x, y: mid.y, z: mid.z });
  conv.lookAt(c1.clone().add(G.position));
  U.conv = { c0, c1 };
  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1.4, 1.8), M(0x1e1f22), 26);
  cubes.castShadow = true; G.add(cubes); U.cubes = cubes;
  // boiler house x[-20,10] z[-6,22]
  const bw = M(0xdde2e7);
  add(G, new THREE.BoxGeometry(30, 64, 0.8), bw, { x: -5, y: 32, z: -5.6 });
  add(G, new THREE.BoxGeometry(0.8, 64, 28), bw, { x: -19.6, y: 32, z: 8 });
  add(G, new THREE.BoxGeometry(0.8, 64, 28), bw, { x: 9.6, y: 32, z: 8 });
  add(G, new THREE.BoxGeometry(31, 1.2, 29), M(0x7d8a96), { x: -5, y: 64.6, z: 8 });
  U.boilerFrontMat = MU(0xdde2e7, { transparent: true });
  add(G, new THREE.BoxGeometry(30, 64, 0.8), U.boilerFrontMat, { x: -5, y: 32, z: 21.6 });
  for (let k = 0; k < 4; k++) add(G, new THREE.BoxGeometry(1.0, 64.2, 1.0), M(0x9aa6b2), { x: -19 + k * 9.6, y: 32, z: 22.2 });
  add(G, new THREE.BoxGeometry(24, 46, 18), M(0x3b2b25), { x: -5, y: 24, z: 6 });
  U.flames = [];
  const fl1 = new THREE.MeshBasicMaterial({ color: 0xff7a1a }), fl2 = new THREE.MeshBasicMaterial({ color: 0xffc24a });
  for (let k = 0; k < 7; k++) {
    const f = add(G, new THREE.ConeGeometry(2.6 + (k % 3), 14 + (k % 2) * 6, 6), k % 2 ? fl2 : fl1, { x: -14 + k * 3, y: 10, z: 12 + (k % 2) * 2, cast: false, recv: false });
    f.userData.base = f.position.y; U.flames.push(f);
  }
  const drum = new THREE.CylinderGeometry(3, 3, 24, 12); drum.rotateZ(Math.PI / 2);
  add(G, drum, M(0xf3f5f7), { x: -5, y: 68, z: 8 });
  U.anchors.boiler = new THREE.Vector3(-5, 30, 18);
  // ESP + duct + chimney
  add(G, new THREE.BoxGeometry(22, 20, 14), M(0xc9d0d6), { x: -8, y: 10, z: -16 });
  add(G, new THREE.BoxGeometry(22, 6, 6), M(0xaab3bc), { x: -27, y: 14, z: -16 });
  const chim = new THREE.CylinderGeometry(4.2, 6.2, 112, 14);
  add(G, chim, M(0xf2f3f4), { x: -40, y: 56, z: -16 });
  for (const yy of [96, 106]) add(G, new THREE.CylinderGeometry(4.55, 4.75, 5, 14), M(COL.red), { x: -40, y: yy, z: -16 });
  U.smoke = new Particles({ origin: [-40, 113, -16], count: 70, life: 7, vel: [7, 12, -1], spread: [2.5, 3, 2.5], area: [4, 1, 4], acc: [2.4, -0.3, 0], size: [9, 52], color: 0x8a8f96, opacity: 0.8, seed: 33, shade: 0.18 });
  U.anchors.chimney = new THREE.Vector3(-40, 116, -16);
  // turbine hall x[24,64] z[-10,22]
  const tw = M(0xf1f3f5);
  add(G, new THREE.BoxGeometry(40, 24, 0.8), tw, { x: 44, y: 12, z: -9.6 });
  add(G, new THREE.BoxGeometry(0.8, 24, 32), tw, { x: 24.4, y: 12, z: 6 });
  add(G, new THREE.BoxGeometry(0.8, 24, 32), tw, { x: 63.6, y: 12, z: 6 });
  U.hallFrontMat = MU(0xf1f3f5, { transparent: true });
  add(G, new THREE.BoxGeometry(40, 24, 0.8), U.hallFrontMat, { x: 44, y: 12, z: 21.6 });
  U.hallRoofMat = MU(0x7d8a96, { transparent: true });
  add(G, new THREE.BoxGeometry(42, 1.4, 34), U.hallRoofMat, { x: 44, y: 24.7, z: 6 });
  const ts = makeTurbineSet(); ts.group.position.set(27, 0.5, 6); G.add(ts.group); U.turbine = ts;
  U.anchors.turbine = new THREE.Vector3(37, 15, 6);
  U.steamPath = pipe(G, [[10, 50, 12], [18, 50, 12], [18, 9, 12], [18, 8.1, 6], [29, 8.1, 6]], 1.2, COL.steel, false);
  U.flows.steam = new Flow(null, { curve: U.steamPath, colorA: 0xffffff, colorB: 0x9fe6ff, radius: 1.45, speed: 2 });
  G.add(U.flows.steam.group);
  // switchyard + tower
  for (let k = 0; k < 3; k++) add(G, new THREE.BoxGeometry(5, 6, 5), M(0x7d8a96), { x: 80 + (k % 2) * 7, y: 3, z: 30 - k * 8 });
  add(G, towerGeo(36), VC, { x: 88, y: 0, z: -12 });
  // barge + unloader
  add(G, new THREE.BoxGeometry(52, 5, 14), M(0x3d3f45), { x: -30, y: -1.5, z: -40 });
  add(G, new THREE.BoxGeometry(52.4, 1.2, 14.4), M(COL.red), { x: -30, y: -2.6, z: -40, cast: false });
  add(G, new THREE.ConeGeometry(10, 6, 7), coal, { x: -36, y: 4, z: -40, sz: 0.55 });
  add(G, new THREE.ConeGeometry(9, 5, 7), coal, { x: -20, y: 3.5, z: -40, sz: 0.55 });
  add(G, new THREE.BoxGeometry(3, 26, 3), M(0xf2b632), { x: 2, y: 13, z: -30 });
  add(G, new THREE.BoxGeometry(3, 3, 26), M(0xf2b632), { x: 2, y: 25, z: -36 });
  // trees
  const tB = treeGeo(1);
  [[90, 44], [96, 34], [70, 46], [-96, 46], [-92, -8], [60, -20], [96, 10]].forEach(([x, z], i) => add(G, tB, VC, { x, y: 0, z, s: 0.8 + i * 0.05 }));
  return U;
}

// ---------------------------------------------------------------- balance scale
export function makeScale() {
  const S = { group: new THREE.Group(), anchors: {} };
  const G = S.group;
  add(G, new THREE.CylinderGeometry(48, 54, 10, 24), M(0xf5f7f9), { y: -5 });
  add(G, new THREE.CylinderGeometry(54.5, 54.5, 2, 24), M(COL.navy), { y: -9 });
  add(G, new THREE.CylinderGeometry(14, 18, 10, 12), M(COL.navy), { y: 5 });
  add(G, new THREE.BoxGeometry(9, 140, 9), M(COL.navy), { y: 75 });
  const pv = new THREE.CylinderGeometry(6, 6, 14, 14); pv.rotateX(Math.PI / 2);
  add(G, pv, M(0xf5f7f9), { y: 150 });
  S.beam = new THREE.Group(); S.beam.position.set(0, 150, 0); G.add(S.beam);
  add(S.beam, new THREE.BoxGeometry(250, 7, 9), M(COL.navy));
  for (const sx of [-1, 1]) add(S.beam, new THREE.SphereGeometry(5, 12, 8), M(sx < 0 ? COL.cyan : COL.red), { x: sx * 122 });
  const mkPan = (color) => {
    const pg = new THREE.Group();
    add(pg, new THREE.CylinderGeometry(44, 36, 5, 20), M(0xf5f7f9), { y: -78 });
    add(pg, new THREE.CylinderGeometry(44.6, 44.6, 1.6, 20), M(color), { y: -75.8 });
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * Math.PI * 2 + Math.PI / 6;
      const end = new THREE.Vector3(Math.cos(a) * 40, -76, Math.sin(a) * 40);
      const len = end.length();
      const rod = new THREE.CylinderGeometry(0.5, 0.5, len, 5); rod.translate(0, -len / 2, 0);
      const m = add(pg, rod, M(0x6b7682), { cast: false });
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), end.clone().normalize());
    }
    G.add(pg); return pg;
  };
  S.panL = mkPan(COL.cyan); S.panR = mkPan(COL.red);
  // mini models on pans
  const miniCT = new THREE.Group();
  add(miniCT, new THREE.BoxGeometry(30, 12, 14), M(0xc9d2da), { y: 6 });
  for (const fx of [-8, 8]) add(miniCT, new THREE.CylinderGeometry(4.5, 5, 4, 12), M(0xaeb8c2), { x: fx, y: 14 });
  miniCT.position.set(-6, -75.5, 0); S.panL.add(miniCT);
  const miniCh = new THREE.Group();
  add(miniCh, new THREE.CylinderGeometry(3.5, 5.5, 34, 12), M(0xf2f3f4), { y: 17 });
  add(miniCh, new THREE.CylinderGeometry(3.7, 3.9, 4, 12), M(COL.red), { y: 30 });
  add(miniCh, new THREE.BoxGeometry(18, 14, 14), M(0xdde2e7), { x: -14, y: 7 });
  miniCh.position.set(14, -75.5, -6); S.panR.add(miniCh);
  // coal heap (market price weight)
  S.coal = new THREE.Group();
  const rr = rng(4);
  for (let k = 0; k < 9; k++) add(S.coal, new THREE.IcosahedronGeometry(6 + rr() * 5, 0), M(k % 2 ? 0x2b2d31 : 0x36393f), { x: (rr() - 0.5) * 34, y: 5 + rr() * 9, z: (rr() - 0.5) * 26 });
  S.coal.position.set(-12, -75.5, 10); S.panR.add(S.coal);
  // padlock + chain
  S.lock = new THREE.Group();
  add(S.lock, new THREE.BoxGeometry(16, 13, 7), M(0xf2b632), { y: 0 });
  add(S.lock, new THREE.TorusGeometry(5.5, 1.4, 8, 16, Math.PI), M(0x9aa6b2), { y: 6.5 });
  add(S.lock, new THREE.CylinderGeometry(1.6, 1.6, 2, 8), M(0x3b2b25), { y: 0, z: 3.6, rx: Math.PI / 2 });
  G.add(S.lock);
  S.chain = new THREE.Group();
  for (let k = 0; k < 14; k++) add(S.chain, new THREE.TorusGeometry(2.4, 0.7, 6, 10), M(0x9aa6b2), { y: -k * 4, ry: (k % 2) * Math.PI / 2 });
  G.add(S.chain);
  // drill weight
  S.drill = new THREE.Group();
  add(S.drill, new THREE.CylinderGeometry(11, 14, 16, 6), M(0x5b6573), { y: 8 });
  add(S.drill, new THREE.CylinderGeometry(11.4, 11.4, 2.4, 6), M(0xf2b632), { y: 15 });
  add(S.drill, new THREE.ConeGeometry(4, 10, 8), M(0xf2b632), { y: 22, rx: Math.PI });
  S.drill.position.set(16, -75.5, 8); S.panL.add(S.drill);
  S.update = (angle) => {
    S.beam.rotation.z = angle;
    const e = new THREE.Vector3();
    for (const [pan, sx] of [[S.panL, -1], [S.panR, 1]]) {
      e.set(sx * 118, 0, 0).applyEuler(S.beam.rotation).add(S.beam.position);
      pan.position.copy(e);
    }
    // chain from PLTU pan bottom to pedestal
    const top = S.panR.position.clone().add(new THREE.Vector3(0, -82, 6));
    const bot = new THREE.Vector3(70, 0, 30);
    const len = top.distanceTo(bot);
    S.chain.position.copy(top);
    S.chain.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bot.clone().sub(top).normalize());
    S.chain.userData.len = len;
    S.chain.children.forEach((c, k) => { c.visible = k * 4 < len; });
    S.lock.position.copy(top.clone().lerp(bot, 0.45)).add(new THREE.Vector3(0, 0, 4));
  };
  S.update(0);
  return S;
}

// ---------------------------------------------------------------- Indonesia map
export const MAPO = new THREE.Vector3(20000, 0, 0);
export const MK = 60;
export function lonlat(lon, lat, y = 0) { return new THREE.Vector3(MAPO.x + (lon - 118) * MK, y, MAPO.z - (lat + 2.5) * MK); }
export function makeMap() {
  const Mp = { group: new THREE.Group(), anchors: {} };
  const G = Mp.group;
  add(G, new THREE.PlaneGeometry(9000, 6000), M(0xa8d8ef), { x: MAPO.x, y: -1, z: MAPO.z, rx: -Math.PI / 2, cast: false });
  // subtle sea grid
  const grid = [];
  for (let lon = 90; lon <= 146; lon += 5) grid.push(cgeo(new THREE.BoxGeometry(1.4, 0.2, 2400), 0x96cbe6, T(MAPO.x + (lon - 118) * MK, -0.5, MAPO.z)));
  for (let lat = -15; lat <= 10; lat += 5) grid.push(cgeo(new THREE.BoxGeometry(3600, 0.2, 1.4), 0x96cbe6, T(MAPO.x, -0.5, MAPO.z - (lat + 2.5) * MK)));
  add(G, merge(grid), VC, { cast: false });
  const shapeOf = (ring) => {
    const s = new THREE.Shape();
    ring.forEach(([lon, lat], i) => { const x = (lon - 118) * MK, y = (lat + 2.5) * MK; i ? s.lineTo(x, y) : s.moveTo(x, y); });
    s.closePath(); return s;
  };
  const r = rng(9);
  const idTop = [0x9fcd66, 0x95c75e, 0xa6d26f, 0x8fc35a];
  for (const [code, polys] of Object.entries(GEO)) {
    const isID = code === 'IDN';
    polys.forEach((ring, i) => {
      const g = new THREE.ExtrudeGeometry(shapeOf(ring), { depth: isID ? 7 : 4, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      const top = isID ? M(idTop[i % 4]) : M(0xe7e2d6);
      const side = isID ? M(0xe6d6a6) : M(0xd3ccbd);
      add(G, g, [top, side], { x: MAPO.x, y: 0, z: MAPO.z, cast: true });
    });
  }
  // ring of fire path
  const arc = [[94.5, 6.2], [95.6, 4.6], [97.4, 3.0], [99.0, 1.4], [100.4, -0.5], [101.6, -2.2], [103.0, -3.7], [104.6, -5.1], [105.6, -6.4], [107.2, -7.3], [109.3, -7.6], [111.6, -8.0], [113.8, -8.3], [116.2, -8.6], [118.6, -8.7], [121.2, -8.8], [123.8, -8.6], [126.4, -7.9], [128.6, -7.3], [130.4, -6.2], [131.0, -4.7], [129.9, -3.3], [128.4, -1.6], [127.6, 0.4], [126.9, 2.4], [126.3, 4.6], [126.4, 7.0]];
  Mp.arc = arc;
  Mp.ring = new Flow(arc.map(([lo, la]) => { const v = lonlat(lo, la, 9); return [v.x, v.y, v.z]; }), { colorA: 0xff5a1f, colorB: 0xff8a3a, radius: 5, speed: 0.6, dash: 60, seg: 400 });
  G.add(Mp.ring.group);
  // volcano markers along arc
  const vol = [];
  const arcCurve = new THREE.CatmullRomCurve3(arc.map(([lo, la]) => new THREE.Vector3(lo, la, 0)));
  for (let i = 0; i < 64; i++) {
    const p = arcCurve.getPointAt(Math.min(0.93, i / 64 + r() * 0.01));
    const v = lonlat(p.x + (r() - 0.5) * 0.9, p.y + (r() - 0.5) * 0.7, 7);
    vol.push(cgeo(new THREE.ConeGeometry(9, 18, 6), 0xe0643c, T(v.x - MAPO.x, 7 + 9, v.z - MAPO.z)));
  }
  Mp.volcanoes = add(G, merge(vol), VC, { x: MAPO.x, z: MAPO.z });
  // potential dots (368) — instanced, staggered appear
  const nDots = 368;
  Mp.dots = new THREE.InstancedMesh(new THREE.CylinderGeometry(5, 5, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0xffa23a }), nDots);
  Mp.dotPos = [];
  for (let i = 0; i < nDots; i++) {
    let lo, la;
    if (i < 300) { const p = arcCurve.getPointAt(Math.min(0.95, r())); lo = p.x + (r() - 0.5) * 1.6; la = p.y + (r() - 0.5) * 1.1; }
    else { const zone = [[121, -2, 3, 3], [113, -1, 3, 2], [106, -2.5, 1.5, 1], [128, -3, 2, 1.5], [124, 0.6, 1.5, 0.6]][i % 5]; lo = zone[0] + (r() - 0.5) * zone[2]; la = zone[1] + (r() - 0.5) * zone[3]; }
    Mp.dotPos.push([lonlat(lo, la, 8.6), r()]);
  }
  G.add(Mp.dots);
  // installed plants (cyan pillars) ~ illustrative heights
  const fields = [[106.64, -6.74, 377, 'Salak'], [107.73, -7.22, 271, 'Darajat'], [107.63, -7.2, 227, 'Wayang Windu'], [107.8, -7.13, 235, 'Kamojang'], [107.4, -7.16, 55, 'Patuha'], [108.08, -7.1, 30, 'Karaha'], [109.9, -7.2, 60, 'Dieng'], [114.24, -8.05, 35, 'Ijen'], [99.07, 1.9, 330, 'Sarulla'], [99.54, 0.69, 180, 'Sorik Marapi'], [98.5, 3.23, 12, 'Sibayak'], [101.1, -1.6, 85, 'Muara Laboh'], [104.6, -5.3, 220, 'Ulubelu'], [103.4, -4.0, 98, 'Rantau Dedap'], [103.6, -4.25, 110, 'Lumut Balai'], [124.85, 1.27, 120, 'Lahendong'], [120.4, -8.68, 10, 'Ulumbu'], [121.0, -8.83, 3, 'Mataloko']];
  Mp.pillars = fields.map(([lo, la, mw, name]) => {
    const h = 14 + mw * 0.42;
    const g = new THREE.CylinderGeometry(7, 7, 1, 10); g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: COL.cyan, emissive: 0x0b5f7a, emissiveIntensity: 0.6 }));
    m.position.copy(lonlat(lo, la, 7)); m.userData = { h, name }; m.castShadow = true; G.add(m);
    return m;
  });
  Mp.anchors.kamojang = lonlat(107.8, -7.13, 10);
  Mp.anchors.jawa = lonlat(110.2, -7.2, 10);
  Mp.anchors.sumatra = lonlat(101.5, -0.6, 10);
  Mp.anchors.ring = lonlat(116.2, -8.6, 12);
  Mp.anchors.sulawesi = lonlat(120.4, -2.0, 10);
  Mp.anchors.kalimantan = lonlat(113.8, 0.4, 10);
  Mp.anchors.papua = lonlat(137.5, -4.2, 10);
  Mp.anchors.center = lonlat(114, -3, 0);
  Mp.anchors.sorik = lonlat(99.54, 0.69, 10);
  Mp.anchors.flores = lonlat(120.4, -8.68, 10);
  Mp.setDots = (k) => {
    const m = new THREE.Matrix4();
    Mp.dotPos.forEach(([p, rr], i) => {
      const s = smooth((k * 1.35 - rr * 0.35) / 0.25);
      m.compose(p, new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      Mp.dots.setMatrixAt(i, m);
    });
    Mp.dots.instanceMatrix.needsUpdate = true;
    Mp.dots.visible = k > 0.001;
  };
  Mp.setPillars = (k, glow = 0.6) => {
    Mp.pillars.forEach((m, i) => {
      const s = smooth((k * 1.4 - i / Mp.pillars.length * 0.4) / 0.3);
      m.scale.set(1, Math.max(0.001, m.userData.h * s), 1);
      m.visible = s > 0.001;
      m.material.emissiveIntensity = glow;
    });
  };
  Mp.setDots(0); Mp.setPillars(0);
  return Mp;
}

// ---------------------------------------------------------------- hazard zone (reference style)
export function makeHazard(w = 230, h = 170) {
  const tex = canvasTex(1024, 760, (g, W, H) => {
    g.save(); roundRect(g, 16, 16, W - 32, H - 32, 40); g.clip();
    g.strokeStyle = 'rgba(255,90,31,0.55)'; g.lineWidth = 16;
    for (let x = -H; x < W + H; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); }
    g.restore();
    g.strokeStyle = '#ff4a12'; g.lineWidth = 22; roundRect(g, 16, 16, W - 32, H - 32, 40); g.stroke();
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -4 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 2;
  return { mesh: m, mat };
}

export function makeRings(n = 4) {
  const g = new THREE.Group(); const rings = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; g.add(m); rings.push(m);
  }
  return {
    group: g,
    update(t, k) {
      rings.forEach((m, i) => {
        const u = ((t * 0.55 + i / n) % 1);
        const s = 6 + u * 120; m.scale.set(s, s, 1);
        m.material.opacity = k * (1 - u) * 0.9; m.visible = k > 0.01;
      });
    },
  };
}

export function makeVillage(center = [-230, 0, 90], count = 7, rad = 26) {
  const g = new THREE.Group(); const geo = mbaruNiangGeo();
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2;
    add(g, geo, VC, { x: Math.cos(a) * rad, z: Math.sin(a) * rad, ry: -a, s: i === 0 ? 1.25 : 1 });
  }
  add(g, new THREE.CylinderGeometry(rad * 1.5, rad * 1.5, 0.6, 24), M(0xa8c66a), { y: 0.3, cast: false });
  g.position.set(...center);
  return g;
}
