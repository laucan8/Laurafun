// Director: builds the world, then maps time t -> camera, world state, overlays.
// All cues are tied to VO word timings from build/timeline.js.
import * as THREE from 'three';
import { COL, M, add, VC, rng, clamp, lerp, smooth, easeInOut, easeOut, easeIn, backOut, Terrain, volcanoGeo,
  makeSky, aimSun, Particles, cloudTex, makeCloud, treeGeo, canvasTex } from './world.js';
import { makePLTP, makePLTU, makeScale, makeMap, makeHazard, makeRings, makeVillage, makeRain, lonlat, MAPO } from './plant.js';
import { CARDS, END_HTML, fmt } from './cards.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ST = (p, l, fov = 40, up = [0, 1, 0]) => ({ p: p.isVector3 ? p : V(...p), l: l.isVector3 ? l : V(...l), fov, up: V(...up) });
const UPX = [1, 0, 0.0001];
const env = (t, a, b, fi = 0.35, fo = 0.35) => smooth((t - a) / fi) * (1 - smooth((t - (b - fo)) / fo));
const ramp = (t, a, d) => smooth((t - a) / d);
const bump = (t, a, d) => { const u = (t - a) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
const KMJ = V(-160, 0, 120);
const PLTU_POS = V(0, 150, -200);

export class Director {
  constructor(TL, scene, camera, ov) {
    this.TL = TL; this.scene = scene; this.cam = camera; this.ov = ov;
    this.S = {}; TL.scenes.forEach((s) => (this.S[s.key] = s));
    this.build();
    this.K = this.makeCues();
    this.shots = this.makeShots();
  }

  // ------------------------------------------------------------------ cues
  norm(w) { return w.toLowerCase().replace(/[^0-9a-z]/g, ''); }
  cue(key, w, n = 1, edge = 't0') {
    const s = this.S[key]; const nw = this.norm(w);
    for (const mode of ['eq', 'sw']) {
      let c = 0;
      for (const tk of s.tokens) {
        const d = this.norm(tk.d);
        if (mode === 'eq' ? d === nw : d.startsWith(nw)) { c++; if (c === n) return tk[edge]; }
      }
    }
    console.warn('cue miss', key, w, n); return s.voStart;
  }
  makeCues() {
    const c = (k, w, n = 1) => this.cue(k, w, n);
    const S = this.S;
    const K = {};
    for (const k of Object.keys(S)) K[k] = { st: S[k].start, en: S[k].end, vs: S[k].voStart, ve: S[k].voEnd };
    Object.assign(K.hook, { belanda: c('hook', 'Belanda'), mengebor: c('hook', 'mengebor'), m60: c('hook', '60'), kamojang: c('hook', 'Kamojang'), seratus: c('hook', 'Seratus'), masih: c('hook', 'masih'), menyembur: c('hook', 'menyemburkan'), tanpa: c('hook', 'Tanpa') });
    Object.assign(K.peta, { indonesia: c('peta', 'Indonesia'), n23: c('peta', '23'), dipakai: c('peta', 'dipakai'), cuma: c('peta', 'Cuma'), n11: c('peta', '11'), dua: c('peta', 'Dua'), kebetulan: c('peta', 'Kebetulan'), kita: c('peta', 'Kita'), tapi: c('peta', 'Tapi'), cara: c('peta', 'cara') });
    Object.assign(K.bawah, { semua: c('bawah', 'Semua'), hujan: c('bawah', 'hujan'), meresap: c('bawah', 'meresap'), mendekati: c('bawah', 'mendekati'), magma: c('bawah', 'magma'), terpanas: c('bawah', 'terpanaskan'), n240: c('bawah', '240'), lapisan: c('bawah', 'Lapisan'), kedap: c('bawah', 'kedap'), mengunci: c('bawah', 'mengunci'), persis: c('bawah', 'Persis'), panci: c('bawah', 'panci') });
    Object.assign(K.pembangkit, { lalu: c('pembangkit', 'Lalu'), dibor: c('pembangkit', 'dibor'), begitu: c('pembangkit', 'Begitu'), tembus: c('pembangkit', 'tembus'), fluida: c('pembangkit', 'fluida'), separator: c('pembangkit', 'Separator'), memisahkan: c('pembangkit', 'memisahkan'), uapnya: c('pembangkit', 'Uapnya'), pipa: c('pembangkit', 'pipa'), memutar1: c('pembangkit', 'memutar', 1), turbin1: c('pembangkit', 'turbin', 1), turbin2: c('pembangkit', 'turbin', 2), generator: c('pembangkit', 'generator'), jadilah: c('pembangkit', 'jadilah'), listrik: c('pembangkit', 'listrik') });
    Object.assign(K.siklus, { sisa: c('siklus', 'Sisa'), menara: c('siklus', 'menara'), itu: c('siklus', 'Itu'), bukan: c('siklus', 'bukan'), airnya: c('siklus', 'Airnya'), disuntik: c('siklus', 'disuntikkan'), perut: c('siklus', 'perut'), injeksi: c('siklus', 'injeksi'), siklusnya: c('siklus', 'siklusnya'), bonus: c('siklus', 'Bonus'), kamojang: c('siklus', 'Kamojang'), langka: c('siklus', 'langka') });
    Object.assign(K.twist, { nah: c('twist', 'Nah'), pltu1: c('twist', 'PLTU', 1), turbin: c('twist', 'turbin'), bedanya: c('twist', 'Bedanya'), siapa: c('twist', 'siapa'), pltu2: c('twist', 'PLTU', 2), n10: c('twist', '10'), seribu: c('twist', 'seribu'), pltp: c('twist', 'PLTP'), bumi: c('twist', 'Bumi'), tanpa: c('twist', 'Tanpa'), n24: c('twist', '24') });
    Object.assign(K.skor, { emisi: c('skor', 'Emisi'), pltu: c('skor', 'PLTU'), n820: c('skor', '820'), n20: c('skor', '20'), pltp2: c('skor', 'PLTP', 2), faktor: c('skor', 'faktor'), n90: c('skor', '90'), dan: c('skor', 'Dan'), meroket: c('skor', 'meroket'), n2022: c('skor', '2022') });
    Object.assign(K.kenapa, { teori: c('kenapa', 'Teorinya'), dok: c('kenapa', 'Dokumenter'), tuding: c('kenapa', 'tudingan'), terdok: c('kenapa', 'terdokumentasi'), satu: c('kenapa', 'Satu'), dipatok: c('kenapa', 'dipatok'), murah: c('kenapa', 'murah'), dua: c('kenapa', 'Dua'), kontrak: c('kenapa', 'kontrak'), dipakai: c('kenapa', 'dipakai'), surplus: c('kenapa', 'surplus'), tiga: c('kenapa', 'Tiga', 2), n4: c('kenapa', '4'), kering: c('kenapa', 'kering'), hasilnya: c('kenapa', 'Hasilnya'), termahal: c('kenapa', 'termahal'), konsp: c('kenapa', 'Konspirasi'), belum: c('kenapa', 'Belum'), aturan: c('kenapa', 'aturan') });
    Object.assign(K.gelap, { tahun: c('gelap', 'Tahun'), bocor: c('gelap', 'kebocoran'), sorik: c('gelap', 'Sorik'), tewas: c('gelap', 'menewaskan'), flores: c('gelap', 'Flores'), poco: c('gelap', 'Poco'), gempa: c('gelap', 'gempa'), dikaitkan: c('gelap', 'dikaitkan'), egs: c('gelap', 'EGS'), teknologi: c('gelap', 'teknologi') });
    Object.assign(K.penutup, { panci: c('penutup', 'panci'), pertanyaan: c('penutup', 'Pertanyaannya'), mau: c('penutup', 'mau'), menurutmu: c('penutup', 'Menurutmu'), tulis: c('penutup', 'Tulis') });
    // transitions
    K.tele1 = K.peta.st + 1.25;          // ground -> map
    K.tele2 = K.bawah.st;                // map -> ground (diorama)
    K.tele3 = K.penutup.st + 1.25;       // ground -> map
    K.drop0 = K.bawah.st + 0.35;
    K.cover0 = K.bawah.meresap - 1.0;
    K.rise0 = K.gelap.st + 0.9;
    K.endCard = K.penutup.en - 4.3;
    return K;
  }

  // ------------------------------------------------------------------ world
  build() {
    const sc = this.scene;
    this.sky = makeSky(sc);
    this.terrain = new Terrain(sc, {
      exclude: (cx, cz) => Math.abs(cx) <= 80 && Math.abs(cz) <= 40,
      override: (cx, cz) => (cx === KMJ.x && cz === KMJ.z ? 'kawah' : null),
    });
    // volcanoes & far mountains (sink with the ripple)
    const vg = volcanoGeo(300, 240, 3), vg2 = volcanoGeo(250, 180, 8), vg3 = volcanoGeo(200, 130, 12, false);
    this.mountains = [];
    for (const [g, x, z, ry] of [[vg, -150, -440, 0.3], [vg2, 330, -560, 1.2], [vg3, -520, -620, 2], [vg3, 640, -260, 0.5], [vg2, -760, -150, 2.6], [vg3, 120, -900, 1.1]]) {
      const m = add(sc, g, VC, { x, y: -2, z, ry, recv: true });
      this.terrain.attach(m, 0.9); this.mountains.push(m);
    }
    // KMJ-3 historic well
    const kmj = new THREE.Group(); kmj.position.copy(KMJ); sc.add(kmj);
    add(kmj, new THREE.CylinderGeometry(15, 17, 0.6, 14), M(0xece6c9), { y: 0.3, cast: false });
    add(kmj, new THREE.CylinderGeometry(1.4, 1.6, 5, 10), M(0xb5652f), { y: 2.5 });
    add(kmj, new THREE.CylinderGeometry(2.2, 2.2, 1, 10), M(0x8a4b24), { y: 1.2 });
    add(kmj, new THREE.TorusGeometry(1.6, 0.35, 5, 12), M(0xd9443b), { x: 1.8, y: 3, rz: Math.PI / 2 });
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; add(kmj, new THREE.BoxGeometry(0.5, 2.4, 0.5), M(0x7a5a3c), { x: Math.cos(a) * 11, y: 1.2, z: Math.sin(a) * 11 }); }
    const signT = canvasTex(256, 128, (g) => { g.fillStyle = '#142a47'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#fff'; g.font = '700 54px BarlowC'; g.textAlign = 'center'; g.fillText('KMJ-3', 128, 62); g.font = '600 38px BarlowC'; g.fillText('1926', 128, 108); });
    add(kmj, new THREE.BoxGeometry(0.5, 4, 0.5), M(0x7a5a3c), { x: -7, y: 2, z: 8 });
    add(kmj, new THREE.PlaneGeometry(7, 3.5), new THREE.MeshBasicMaterial({ map: signT }), { x: -7, y: 5, z: 8.3, cast: false });
    this.jet = new Particles({ origin: [0, 5.5, 0], count: 140, life: 3.4, vel: [3, 34, -1], spread: [3, 7, 3], area: [1.5, 0.5, 1.5], acc: [4, -2, 0], size: [3, 30], opacity: 0.95, seed: 3 });
    kmj.add(this.jet.points);
    this.terrain.attach(kmj, 0);
    this.kmj = kmj;
    // village (Poco Leok style mbaru niang) on tiles
    this.village = makeVillage([-250, 0, 140], 7, 24); sc.add(this.village); this.terrain.attach(this.village, 0.1);
    // transmission towers off the block
    // PLTP diorama
    const P = this.P = makePLTP(); sc.add(P.group);
    P.plumes.forEach((p) => P.group.add(p.points)); P.group.add(P.burst.points); P.group.add(P.h2s.points);
    this.rain = makeRain(); P.group.add(this.rain.obj);
    // PLTU block
    const U = this.U = makePLTU(); U.group.position.set(0, -900, -200); sc.add(U.group); U.group.add(U.smoke.points);
    // scale
    const SC = this.SC = makeScale(); SC.group.position.set(0, -800, 0); sc.add(SC.group);
    // map
    const MP = this.MP = makeMap(); sc.add(MP.group);
    // hazard + rings
    this.hz = makeHazard(250, 190); this.hz.mesh.position.set(-55, 0.7, 0); sc.add(this.hz.mesh);
    this.rings = makeRings(); this.rings.group.position.set(200, 0.8, 180); sc.add(this.rings.group);
    // clouds
    this.clouds = [];
    const ct = [cloudTex(1), cloudTex(2), cloudTex(3)];
    const r = rng(17);
    const addCloud = (x, y, z, w, op, set) => { const s = makeCloud(ct[Math.floor(r() * 3)], w, w * 0.5, op); s.position.set(x, y, z); sc.add(s); this.clouds.push({ s, set, op }); return s; };
    for (let i = 0; i < 10; i++) addCloud(-1200 + r() * 2400, 380 + r() * 200, -1300 - r() * 600, 700 + r() * 500, 0.9, 'skyA');
    for (let i = 0; i < 26; i++) addCloud(-700 + r() * 1400, 600 + r() * 120, -500 + r() * 1100, 380 + r() * 260, 0.95, 'layerA');
    this.rainClouds = [];
    for (let i = 0; i < 4; i++) { const s = addCloud(-80 + i * 55, 205 + r() * 20, -20 + r() * 40, 160, 0, 'rain'); this.rainClouds.push(s); s.material.color.set(0xe3e9ee); }
  }

  // ------------------------------------------------------------------ camera
  makeShots() {
    const K = this.K, sh = [];
    const shot = (t0, t1, A, B, ease = easeInOut, via) => sh.push({ t0, t1, A, B, ease, via });
    const LL = (lo, la, y) => lonlat(lo, la, y);
    // S01 hook
    const A1 = ST([-30, 300, 470], [-160, 0, 95], 40);
    const B1 = ST([-102, 118, 300], [-160, 12, 118], 38);
    const C1 = ST([-118, 92, 252], [-160, 18, 120], 38);
    const D1 = ST([-128, 78, 232], [-160, 22, 120], 37);
    shot(0, K.hook.seratus, A1, B1);
    shot(K.hook.seratus, K.hook.tanpa, B1, C1);
    shot(K.hook.tanpa, K.hook.en, C1, D1, easeOut);
    // S02 rise -> map
    const E2 = ST([-150, 640, 300], [-150, 760, -500], 44);
    shot(K.peta.st, K.tele1, D1, E2, easeIn, [V(-150, 160, 240)]);
    const KM = LL(107.8, -7.13, 0);
    const F2 = ST(KM.clone().add(V(-330, 640, 40)), KM, 42, UPX);
    const MC = LL(118.2, -2.6, 0);
    const G2 = ST(MC.clone().add(V(-1650, 3350, 60)), MC.clone().add(V(150, 0, 0)), 42, UPX);
    const H2 = ST(MC.clone().add(V(-1450, 3200, -40)), MC.clone().add(V(220, 0, 0)), 42, UPX);
    const I2 = ST(KM.clone().add(V(-70, 150, 20)), KM, 46, UPX);
    shot(K.tele1, K.peta.n23 + 0.6, F2, G2, easeInOut);
    shot(K.peta.n23 + 0.6, K.peta.kita, G2, H2, easeInOut);
    shot(K.peta.kita, K.tele2, H2, I2, easeIn);
    // S03 descend into diorama
    const J3 = ST([0, 780, 460], [0, 0, 0], 42);
    const K3 = ST([0, 250, 470], [0, -30, 0], 42);
    const L3 = ST([0, 34, 650], [0, -90, 0], 40);
    const M3 = ST([-16, 20, 620], [-6, -86, 0], 40);
    const N3 = ST([8, 36, 655], [0, -90, 0], 40);
    shot(K.tele2, K.tele2 + 1.9, J3, K3, easeOut);
    shot(K.tele2 + 1.9, K.bawah.meresap + 0.6, K3, L3, easeInOut);
    shot(K.bawah.meresap + 0.6, K.bawah.lapisan, L3, M3, easeInOut);
    shot(K.bawah.lapisan, K.bawah.en, M3, N3, easeInOut);
    // S04 drilling -> separator -> pipe -> turbine -> grid
    const P1 = ST([-30, 0, 380], [-42, -56, 0], 40);
    const P2 = ST([-54, 36, 60], [-22, 9, -14], 42);
    const P3 = ST([-78, 62, 58], [-6, 6, -20], 42);
    const P4 = ST([-40, 56, 50], [12, 6, -24], 42);
    const P5 = ST([22, 46, 32], [18, 5, -24], 42);
    const P6 = ST([38, 42, 28], [28, 5, -24], 42);
    const P7 = ST([118, 66, 160], [56, 12, -30], 40);
    shot(K.pembangkit.st, K.pembangkit.dibor + 0.3, N3, P1);
    shot(K.pembangkit.separator - 0.7, K.pembangkit.separator + 0.4, P1, P2);
    shot(K.pembangkit.uapnya - 0.35, K.pembangkit.pipa + 0.3, P2, P3);
    shot(K.pembangkit.pipa + 0.3, K.pembangkit.memutar1 + 0.1, P3, P4, (u) => u);
    shot(K.pembangkit.memutar1 + 0.1, K.pembangkit.turbin1 + 0.8, P4, P5);
    shot(K.pembangkit.turbin2, K.pembangkit.generator + 0.6, P5, P6);
    shot(K.pembangkit.jadilah - 0.2, K.pembangkit.en + 0.3, P6, P7);
    // S05 cooling -> injection -> full cycle
    const Q1 = ST([104, 50, 30], [64, 16, -50], 40);
    const Q2 = ST([86, 0, 290], [62, -70, 0], 40);
    const Q3 = ST([0, 34, 660], [0, -90, 0], 40);
    const Q4 = ST([-34, 56, 690], [0, -86, 0], 40);
    shot(K.siklus.st - 0.2, K.siklus.menara + 0.3, P7, Q1);
    shot(K.siklus.airnya - 0.3, K.siklus.perut + 0.4, Q1, Q2);
    shot(K.siklus.siklusnya - 0.2, K.siklus.bonus + 0.2, Q2, Q3);
    shot(K.siklus.bonus + 0.2, K.siklus.en, Q3, Q4, (u) => u);
    // S06 twist: both blocks
    const R1 = ST([170, 110, 740], [0, 20, -90], 40);
    const R2 = ST([80, 236, 210], [-6, 180, -200], 42);
    const R3 = ST([30, -110, 380], [12, -175, 0], 42);
    const R4 = ST([-170, 100, 720], [0, 18, -90], 40);
    shot(K.twist.st, K.twist.pltu1 + 0.5, Q4, R1);
    shot(K.twist.pltu2 - 0.3, K.twist.n10 + 0.3, R1, R2);
    shot(K.twist.pltp - 0.4, K.twist.bumi + 0.3, R2, R3);
    shot(K.twist.n24 - 0.2, K.twist.en, R3, R4);
    // S07 slow orbit
    const R5 = ST([180, 150, 690], [0, 30, -90], 40);
    shot(K.skor.st, K.skor.en, R4, R5, (u) => u);
    // S08 scale
    const T1 = ST([0, 205, 830], [0, 118, 0], 40);
    const T2 = ST([-120, 190, 800], [0, 114, 0], 40);
    const T3 = ST([130, 185, 790], [0, 112, 0], 40);
    const T4 = ST([30, 230, 800], [0, 120, 0], 40);
    shot(K.kenapa.st, K.kenapa.st + 2.6, R5, T1);
    shot(K.kenapa.terdok, K.kenapa.tiga, T1, T2, (u) => easeInOut(u));
    shot(K.kenapa.tiga, K.kenapa.konsp, T2, T3, (u) => easeInOut(u));
    shot(K.kenapa.konsp, K.kenapa.en, T3, T4);
    // S09 dark side
    const V1 = ST([70, 250, 340], [-40, 0, -10], 40);
    const V2 = ST([30, 175, 270], [-52, 0, -6], 40);
    const V3 = ST([-170, 92, 290], [-250, 6, 140], 40);
    const V4 = ST([270, 120, 350], [200, 0, 180], 40);
    shot(K.gelap.st, K.gelap.st + 3.2, T4, V1);
    shot(K.gelap.bocor - 0.4, K.gelap.bocor + 1.0, V1, V2);
    shot(K.gelap.flores - 0.3, K.gelap.flores + 1.1, V2, V3);
    shot(K.gelap.gempa - 0.3, K.gelap.gempa + 1.1, V3, V4);
    shot(K.gelap.gempa + 1.1, K.gelap.en, V4, ST([255, 105, 335], [200, 0, 180], 40), (u) => u);
    // S10 rise -> map finale
    const W1 = ST([200, 760, 360], [200, 860, -300], 46);
    const W2 = ST(MC.clone().add(V(-1800, 3500, 80)), MC.clone().add(V(100, 0, 0)), 42, UPX);
    const W3 = ST(MC.clone().add(V(-1500, 3250, -60)), MC.clone().add(V(200, 0, 0)), 42, UPX);
    shot(K.penutup.st, K.tele3, ST([255, 105, 335], [200, 0, 180], 40), W1, easeIn, [V(230, 200, 330)]);
    shot(K.tele3, K.penutup.en, W2, W3, easeOut);
    sh.sort((a, b) => a.t0 - b.t0);
    return sh;
  }
  camState(t) {
    let s = this.shots[0];
    for (const x of this.shots) if (x.t0 <= t) s = x; else break;
    const u = s.ease(clamp((t - s.t0) / (s.t1 - s.t0)));
    let p;
    if (s.via) { const c = new THREE.CatmullRomCurve3([s.A.p, ...s.via, s.B.p]); p = c.getPoint(u); }
    else p = s.A.p.clone().lerp(s.B.p, u);
    const l = s.A.l.clone().lerp(s.B.l, u);
    const fov = lerp(s.A.fov, s.B.fov, u);
    const up = s.A.up.clone().lerp(s.B.up, u).normalize();
    return { p, l, fov, up };
  }

  // ------------------------------------------------------------------ frame
  update(t) {
    const K = this.K, ov = this.ov, P = this.P, U = this.U, SC = this.SC, MP = this.MP;
    ov.begin(t);
    // ---- camera
    const cs = this.camState(t);
    const dist = cs.p.distanceTo(cs.l);
    const dr = Math.min(3, dist / 220);
    cs.p.x += Math.sin(t * 0.37) * dr; cs.p.y += Math.sin(t * 0.29 + 1) * dr * 0.6;
    this.cam.position.copy(cs.p); this.cam.up.copy(cs.up); this.cam.fov = cs.fov; this.cam.updateProjectionMatrix(); this.cam.lookAt(cs.l);
    this.cam.updateMatrixWorld();
    const atMap = cs.p.x > 10000;
    const camScale = 1920 / (2 * Math.tan(THREE.MathUtils.degToRad(cs.fov) / 2));
    // ---- environment
    const fog = this.scene.fog;
    if (atMap) { fog.near = 5200; fog.far = 13000; }
    else if (t > K.drop0 + 2 && t < K.rise0) { fog.near = 1500; fog.far = 5000; }
    else { fog.near = 750; fog.far = 2700; }
    aimSun(this.sky.sun, cs.l, atMap ? 1700 : (t > K.twist.st && t < K.kenapa.st + 2 ? 470 : 330));
    MP.group.visible = atMap;
    // ---- terrain drop / rise
    let tl = -10;
    if (t >= K.drop0 && t < K.rise0) tl = t - K.drop0;
    else if (t >= K.rise0) tl = 5.6 - (t - K.rise0) * (5.6 / 3.0);
    tl = Math.min(tl, 6);
    this.terrain.setDrop(tl);
    this.terrain.group.visible = !atMap && !(tl >= 5.9);
    // ---- clouds
    for (const c of this.clouds) {
      if (c.set === 'map') c.s.visible = atMap;
      else if (c.set === 'rain') { /* below */ }
      else c.s.visible = !atMap && (c.set === 'skyA' ? tl < 1 : true);
    }
    const rainK = env(t, K.bawah.hujan - 0.5, K.bawah.mendekati + 0.6, 0.5, 0.8);
    this.rain.update(t, rainK);
    this.rainClouds.forEach((s) => { s.material.opacity = 0.95 * rainK; s.visible = rainK > 0.01; });
    // ---- PLTP block position (sink in S08, rise in S09)
    let py = 0;
    if (t > K.kenapa.st + 0.3 && t < K.gelap.st) py = -950 * easeIn((t - (K.kenapa.st + 0.3)) / 1.3);
    if (t >= K.gelap.st) py = -950 * (1 - easeOut((t - (K.gelap.st + 0.35)) / 1.6));
    P.group.position.y = py; P.group.visible = py > -940;
    // cover open/close
    let co = ramp(t, K.cover0, 1.5);
    if (t >= K.gelap.st) co = 1 - ramp(t, K.gelap.st + 1.0, 1.3);
    P.cover.position.set(0, -70 * co * co, 190 * easeIn(co));
    const cop = 1 - smooth((co - 0.25) / 0.6);
    P.coverMats.forEach((m) => { m.opacity = cop; m.transparent = cop < 0.999; m.depthWrite = cop > 0.5; });
    P.cover.visible = cop > 0.01;
    const sectionOn = co > 0.02;
    P.halo.material.opacity = 0.85 * smooth(co);
    // magma + caprock
    let glow = 1 + 0.35 * bump(t, K.bawah.magma - 0.2, 1.4) + 0.4 * bump(t, K.twist.bumi - 0.2, 1.6) + 0.2 * bump(t, K.twist.siapa, 1.4);
    P.magmaMat.uniforms.uTime.value = t; P.magmaMat.uniforms.uGlow.value = glow;
    const capK = env(t, K.bawah.lapisan - 0.1, K.bawah.en + 0.6, 0.4, 0.6);
    P.caprockMat.emissive.setHex(0x8a5fc0); P.caprockMat.emissiveIntensity = capK * (0.25 + 0.2 * Math.sin(t * 7));
    P.poreMat.opacity = 0.9 * ramp(t, K.bawah.terpanas - 0.2, 1.0) * (t < K.gelap.st ? 1 : 0);
    // flows
    const F = P.flows;
    const sec = t < K.gelap.st ? 1 : 0;
    F.recL.set(t, ramp(t, K.bawah.meresap - 0.1, 2.4), sec);
    F.recR.set(t, ramp(t, K.bawah.meresap + 0.2, 2.4), sec);
    F.conv1.set(t, ramp(t, K.bawah.terpanas - 0.1, 2.0), sec);
    F.conv2.set(t, ramp(t, K.bawah.terpanas + 0.3, 2.0), sec);
    F.prod.set(t, ramp(t, K.pembangkit.tembus - 0.05, 0.9), sec);
    F.p1.set(t, ramp(t, K.pembangkit.fluida, 1.0), 1);
    F.p2.set(t, ramp(t, K.pembangkit.memisahkan, 1.6), 1);
    F.p3.set(t, ramp(t, K.pembangkit.memisahkan + 0.4, 2.0), 1);
    F.elec.set(t, ramp(t, K.pembangkit.jadilah - 0.1, 1.2), 1);
    F.p5.set(t, ramp(t, K.siklus.sisa - 0.1, 1.2), 1);
    F.p4.set(t, ramp(t, K.siklus.airnya - 0.2, 1.0), 1);
    F.inj.set(t, ramp(t, K.siklus.perut - 0.4, 1.3), sec);
    F.inj2.set(t, ramp(t, K.siklus.perut + 0.9, 1.2), sec);
    // wells
    const drill = ramp(t, K.pembangkit.dibor - 0.1, Math.max(0.6, K.pembangkit.begitu - K.pembangkit.dibor + 0.1));
    const prodDepth = t > K.gelap.st ? 0 : P.prodDepth * drill;
    P.prodCasing.scale.y = Math.max(0.001, prodDepth); P.prodCasing.visible = prodDepth > 0.5;
    P.bit.position.y = -0.3 - prodDepth - 3.2; P.bit.visible = drill > 0.01 && t < K.pembangkit.tembus + 0.25 && sectionOn;
    const injD = t > K.gelap.st ? 0 : P.injDepth * ramp(t, K.siklus.disuntik - 0.5, 1.2);
    P.injCasing.scale.y = Math.max(0.001, injD); P.injCasing.visible = injD > 0.5;
    const rigK = env(t, K.pembangkit.lalu - 0.3, K.pembangkit.tembus + 0.6, 0.45, 0.4);
    P.rig.scale.set(1, Math.max(0.001, backOut(rigK)), 1); P.rig.visible = rigK > 0.01;
    // particles
    P.burst.o.t0 = K.pembangkit.tembus; P.burst.o.t1 = K.pembangkit.tembus + 1.1;
    P.burst.intensity = 1; P.burst.update(t, camScale);
    const plumeK = t > K.siklus.st && t < K.siklus.en ? 1.0 : 0.82;
    P.plumes.forEach((p) => { p.intensity = plumeK; p.update(t, camScale); });
    P.h2s.intensity = 0.6 * env(t, K.gelap.bocor - 0.2, K.gelap.flores + 0.8, 0.8, 0.8);
    P.h2s.update(t, camScale);
    this.jet.intensity = tl < 0.5 && !atMap ? 1 : 0; this.jet.update(t, camScale);
    // power house reveal
    let ph = ramp(t, K.pembangkit.memutar1 - 0.7, 0.8);
    if (t >= K.gelap.st) ph = 1 - ramp(t, K.gelap.st + 1.0, 0.8);
    const pho = 1 - ph;
    for (const [mat, mesh] of [[P.phFrontMat, P.phFront], [P.phRoofMat, P.phRoof], [P.phStripeMat, P.phStripe]]) { mat.opacity = pho; mat.depthWrite = pho > 0.5; mesh.visible = pho > 0.01; }
    const cas = ramp(t, K.pembangkit.turbin1 - 0.3, 0.6) * (t < K.gelap.st ? 1 : 0);
    P.turbine.casMat.opacity = 1 - 0.78 * cas; P.turbine.casMat.depthWrite = cas < 0.5;
    P.turbine.rotor.rotation.x = t * 9;
    // ---- PLTU block
    let uy = -900;
    if (t > K.twist.st + 0.15) uy = lerp(-900, PLTU_POS.y, backOut(clamp((t - (K.twist.st + 0.15)) / 2.0)) * 0.985 + 0.015 * clamp((t - (K.twist.st + 0.15)) / 2.0));
    if (t > K.kenapa.st + 0.3) uy = PLTU_POS.y + 1300 * easeIn((t - (K.kenapa.st + 0.3)) / 1.5);
    U.group.position.y = uy; U.group.visible = uy > -880 && uy < 1400 && !atMap;
    if (U.group.visible) {
      const hall = ramp(t, K.twist.turbin - 0.6, 0.8);
      U.hallFrontMat.opacity = 1 - hall; U.hallRoofMat.opacity = 1 - hall; U.hallFrontMat.depthWrite = hall < 0.5; U.hallRoofMat.depthWrite = hall < 0.5;
      const boil = ramp(t, K.twist.siapa - 0.5, 0.8);
      U.boilerFrontMat.opacity = 1 - boil; U.boilerFrontMat.depthWrite = boil < 0.5;
      U.turbine.rotor.rotation.x = t * 9;
      U.turbine.casMat.opacity = 1 - 0.78 * hall; U.turbine.casMat.depthWrite = hall < 0.5;
      U.flames.forEach((f, i) => { f.scale.y = 1 + 0.28 * Math.sin(t * 13 + i * 1.7) + 0.14 * Math.sin(t * 23 + i); f.position.y = f.userData.base + f.scale.y * 3; });
      const m = new THREE.Matrix4(); const { c0, c1 } = U.conv; const pp = new THREE.Vector3();
      for (let i = 0; i < 26; i++) { const u = ((t * 0.14 + i / 26) % 1); pp.copy(c0).lerp(c1, u); pp.y += 1.7; m.makeTranslation(pp.x, pp.y, pp.z); U.cubes.setMatrixAt(i, m); }
      U.cubes.instanceMatrix.needsUpdate = true;
      U.smoke.intensity = 1; U.smoke.update(t, camScale);
      U.flows.steam.set(t, ramp(t, K.twist.turbin - 0.2, 1.0), 1);
    }
    // ---- scale
    let sy = -800;
    if (t > K.kenapa.st + 0.9) sy = lerp(-800, 0, backOut(clamp((t - (K.kenapa.st + 0.9)) / 1.7)));
    if (t > K.gelap.st + 0.15) sy = -900 * easeIn((t - (K.gelap.st + 0.15)) / 1.4);
    SC.group.position.y = sy; SC.group.visible = sy > -790 && !atMap;
    if (SC.group.visible) {
      let ang = -0.16;
      ang = lerp(ang, 0.11, easeInOut((t - (K.kenapa.dipatok + 0.2)) / 1.3));
      ang = lerp(ang, 0.25, easeOut((t - (K.kenapa.n4 + 0.35)) / 0.9));
      ang += 0.03 * Math.sin(t * 2.1) * (1 - smooth((t - K.kenapa.terdok) / 2));
      ang += 0.025 * bump(t, K.kenapa.n4 + 0.3, 0.8);
      SC.update(ang);
      const coalS = lerp(1, 0.32, easeInOut((t - K.kenapa.dipatok) / 0.9));
      SC.coal.scale.setScalar(coalS);
      const lockK = backOut(clamp((t - (K.kenapa.kontrak - 0.15)) / 0.6));
      SC.lock.scale.setScalar(Math.max(0.001, lockK)); SC.lock.visible = lockK > 0.01;
      const chainRev = smooth((t - (K.kenapa.kontrak - 0.2)) / 0.8);
      SC.chain.children.forEach((c, k) => { c.visible = k * 4 < (SC.chain.userData.len || 0) * chainRev; });
      const dk = clamp((t - (K.kenapa.n4 - 0.25)) / 0.6);
      SC.drill.visible = t > K.kenapa.n4 - 0.25;
      SC.drill.position.y = -75.5 + 140 * (1 - easeIn(dk)) + (dk >= 1 ? 3 * bump(t, K.kenapa.n4 + 0.35, 0.35) : 0);
    }
    // ---- map
    if (atMap) {
      MP.ring.set(t, t < K.tele3 ? ramp(t, K.tele1 + 0.3, 2.2) : 1, 1);
      const dots = t < K.tele3 ? ramp(t, K.peta.n23 - 0.3, 1.8) : 1;
      MP.setDots(dots);
      const pil = t < K.tele3 ? ramp(t, K.peta.dipakai - 0.1, 1.3) : 1;
      MP.setPillars(pil, 0.5 + 0.3 * Math.sin(t * 4));
    }
    // ---- hazard + rings
    const hzK = env(t, K.gelap.bocor - 0.2, K.gelap.gempa + 0.2, 0.6, 0.6);
    this.hz.mat.opacity = hzK; this.hz.mesh.visible = hzK > 0.01;
    this.rings.update(t, env(t, K.gelap.gempa - 0.2, K.gelap.en + 0.3, 0.4, 0.4));

    // ================================================================ overlays
    this.overlays(t, cs, atMap, tl);
    ov.end();
  }

  overlays(t, cs, atMap, tl) {
    const K = this.K, ov = this.ov, P = this.P, U = this.U, SC = this.SC, MP = this.MP;
    const pv = (v) => v.clone().add(P.group.position);
    const uv = (v) => v.clone().add(U.group.position);
    // cloud wipes
    let cw = 0;
    cw = Math.max(cw, smooth((t - (K.tele1 - 0.75)) / 0.7) * (1 - smooth((t - (K.tele1 + 0.05)) / 0.75)));
    cw = Math.max(cw, smooth((t - (K.tele2 - 0.9)) / 0.85) * (1 - smooth((t - (K.tele2 + 0.05)) / 0.85)));
    cw = Math.max(cw, smooth((t - (K.tele3 - 0.75)) / 0.7) * (1 - smooth((t - (K.tele3 + 0.05)) / 0.75)));
    ov.clouds(cw);
    // scene + captions + source
    const sc = this.TL.scenes.find((s) => t >= s.start && t < s.end) || this.TL.scenes[this.TL.scenes.length - 1];
    const endA = ramp(t, K.endCard, 0.5);
    ov.captions(sc, t, 1 - endA);
    ov.source(sc.source, Math.min(ramp(t, sc.start + 0.3, 0.4), 1 - ramp(t, sc.end - 0.25, 0.25)) * (1 - endA));
    // ---------- HUD
    const hud = { show: 1 - endA, lab: '', val: '', a: 'PERUT BUMI', b: 'RUMAH ANDA', fill: 0, pills: [] };
    const k = this.S;
    if (t < K.peta.st) {
      const yr = 1926 + Math.round(100 * easeInOut((t - K.hook.seratus) / 1.1));
      hud.lab = 'KAMOJANG · GARUT'; hud.val = String(yr);
      hud.pills = [{ t: 'UAP', c: 'w', x: 0.04 }];
    } else if (t < K.bawah.st) {
      hud.lab = t < K.peta.dipakai ? 'POTENSI RI' : 'PERINGKAT DUNIA';
      hud.val = t < K.peta.dipakai ? '23,7 GW' : '#2';
      hud.a = 'TERPAKAI'; hud.b = 'POTENSI';
      const f = 0.115 * ramp(t, K.peta.cuma, 1);
      hud.fill = f; hud.pills = [{ t: '≈11,5%', c: 'c', x: Math.max(0.1, f), a: ramp(t, K.peta.cuma, 0.5) }];
    } else if (t < K.pembangkit.st) {
      const temp = Math.round(lerp(27, 240, easeInOut((t - K.bawah.terpanas) / 1.6)));
      hud.lab = 'SUHU RESERVOIR'; hud.val = temp + '°C';
      hud.fill = 0.12 * ramp(t, K.bawah.meresap, 2); hud.pills = [{ t: 'AIR', c: 'c', x: 0.04 + hud.fill }];
    } else if (t < K.siklus.st) {
      const kp = K.pembangkit;
      if (t < kp.separator) { const d = Math.round(2350 * ramp(t, kp.dibor - 0.1, Math.max(0.6, kp.begitu - kp.dibor + 0.1))); hud.lab = 'KEDALAMAN SUMUR'; hud.val = fmt(d) + ' m'; }
      else if (t < kp.memutar1) { hud.lab = 'SEPARATOR'; hud.val = 'UAP+AIR'; }
      else { hud.lab = 'PUTARAN TURBIN'; hud.val = '3.000 rpm'; }
      hud.fill = t < kp.separator ? 0.2 : t < kp.memutar1 ? lerp(0.2, 0.5, ramp(t, kp.separator, 1)) : t < kp.jadilah ? lerp(0.5, 0.75, ramp(t, kp.memutar1, 1.5)) : lerp(0.75, 1, ramp(t, kp.jadilah, 1));
      hud.pills = [{ t: t < kp.separator ? 'FLUIDA' : 'UAP', c: t < kp.jadilah ? 'w' : 'c', x: hud.fill }];
      if (t > kp.jadilah) hud.pills = [{ t: 'LISTRIK', c: 'c', x: hud.fill }];
    } else if (t < K.twist.st) {
      hud.lab = 'SIKLUS'; hud.val = t < K.siklus.siklusnya ? 'REINJEKSI' : 'TERTUTUP';
      hud.a = 'PRODUKSI'; hud.b = 'INJEKSI'; hud.fill = ramp(t, K.siklus.airnya, 3);
      hud.pills = [{ t: 'AIR', c: 'c', x: hud.fill }];
    } else if (t < K.kenapa.st) {
      hud.lab = 'PEMBANDING'; hud.val = t < K.skor.st ? '1.000 MW' : t < K.skor.faktor ? '38 vs 820' : t < K.skor.dan ? '90,4%' : 'US$331';
      hud.a = 'PANAS BUMI'; hud.b = 'BATU BARA';
      hud.pills = [{ t: 'PLTP', c: 'c', x: 0.3 }, { t: 'PLTU', c: 'r', x: 0.7 }];
    } else if (t < K.gelap.st) {
      const n = t < K.kenapa.satu ? 0 : t < K.kenapa.dua ? 1 : t < K.kenapa.tiga ? 2 : 3;
      hud.lab = 'PENYEBAB'; hud.val = n ? `${n}/3` : '?';
      hud.a = 'TEORI'; hud.b = 'FAKTA'; hud.fill = n / 3;
      hud.pills = [{ t: n ? 'FAKTA' : 'TEORI', c: n ? 'c' : 'o', x: Math.max(0.05, Math.min(0.95, n / 3)) }];
    } else if (t < K.penutup.st) {
      const kg = K.gelap;
      if (t < kg.flores) { hud.lab = 'SORIK MARAPI'; hud.val = '25.01.21'; }
      else if (t < kg.gempa) { hud.lab = 'POCO LEOK, NTT'; hud.val = '2023–24'; }
      else { hud.lab = 'POHANG, KOREA'; hud.val = 'M5,4'; }
      if (t < kg.tahun) { hud.lab = 'RISIKO PLTP'; hud.val = '3 KASUS'; }
      hud.a = '2017'; hud.b = '2024';
      const cur = t < kg.flores ? 1 : t < kg.gempa ? 2 : 0;
      hud.pills = [{ t: 'POHANG', c: cur === 0 && t > kg.gempa ? 'o' : 'w', x: 0.06 }, { t: 'SORIK', c: cur === 1 && t > kg.tahun ? 'o' : 'w', x: 0.55 }, { t: 'POCO LEOK', c: cur === 2 ? 'o' : 'w', x: 0.9 }];
    } else {
      hud.lab = 'POTENSI'; hud.val = '23.742 MW'; hud.a = 'TERPAKAI 11,5%'; hud.b = 'POTENSI'; hud.fill = 0.115;
      hud.pills = [{ t: 'RI', c: 'c', x: 0.115 }];
    }
    ov.hud(hud);

    // ---------- S01 hook
    const kh = K.hook;
    ov.big('y1926', { a: t < 0.05 ? 1 : env(t, -1, kh.belanda + 0.2, 0.3, 0.45), small: 'KAMOJANG · HINDIA BELANDA', big: '1926', y: 470 });
    ov.callout('kmj', { p: KMJ.clone().add(V(0, 7, 0)), parts: [{ t: 'SUMUR KMJ-3', c: 'white' }, { t: '60 m', c: 'navy' }], a: env(t, kh.mengebor, kh.masih + 0.1, 0.8, 0.4), len: 190 });
    ov.callout('kmj2', { p: KMJ.clone().add(V(0, 7, 0)), parts: [{ t: 'UAP', c: 'navy' }, { t: 'MASIH AKTIF', c: 'cyan' }], a: env(t, kh.masih, kh.en + 0.6, 0.6, 0.4), len: 230 });
    ov.callout('pltpbg', { p: V(60, 30, -50), parts: [{ t: 'PLTP KAMOJANG', c: 'white' }], a: env(t, kh.kamojang, kh.seratus + 0.2, 0.6, 0.4), len: 120, size: 'sm' });

    // ---------- S02 map
    const kp = K.peta;
    if (atMap && t < K.tele3) {
      ov.callout('ring', { p: MP.anchors.ring, parts: [{ t: 'CINCIN API', c: 'white' }, { t: 'PASIFIK', c: 'orange' }], a: env(t, K.tele1 + 0.6, kp.n23 - 0.2, 0.6, 0.3), len: 150, size: 'sm' });
      for (const [id, lo, la, nm] of [['su', 101.6, -0.4, 'SUMATRA'], ['ja', 110.6, -7.35, 'JAWA'], ['ka', 114.2, 0.4, 'KALIMANTAN'], ['sl', 120.4, -2.0, 'SULAWESI'], ['pa', 138.2, -4.6, 'PAPUA']]) {
        ov.callout('isl_' + id, { p: lonlat(lo, la, 12), parts: [{ t: nm, c: 'white' }], a: env(t, K.tele1 + 0.5, kp.dipakai + 0.3, 0.5, 0.4), len: 2, size: 'sm' });
      }
      ov.callout('kmjmap', { p: MP.anchors.kamojang, parts: [{ t: 'KAMOJANG', c: 'navy' }], a: env(t, K.tele1 + 0.2, kp.n23 + 0.3, 0.5, 0.3), len: 120, size: 'sm' });
    }
    ov.big('pot', { a: env(t, kp.n23 - 0.3, kp.dipakai - 0.05, 0.4, 0.3), small: 'POTENSI PANAS BUMI RI', big: '0', y: 470,
      update: (e, a) => { const n = Math.round(23742 * easeOut((t - (kp.n23 - 0.3)) / 1.2)); const b = e.querySelector('.b'); const h = fmt(n) + '<small>MW</small>'; if (b._h !== h) { b.innerHTML = h; b._h = h; } } });
    ov.big('inst', { a: env(t, kp.dipakai, kp.dua - 0.1, 0.4, 0.3), small: 'TERPASANG AKHIR 2025 · #2 DUNIA', big: '0', y: 470,
      update: (e) => { const n = Math.round(2742 * easeOut((t - kp.dipakai) / 0.9)); const b = e.querySelector('.b'); const h = fmt(n) + '<small>MW</small>'; if (b._h !== h) { b.innerHTML = h; b._h = h; } } });
    ov.tag('pct', { x: 540, y: 760, parts: [{ t: 'BARU', c: 'navy' }, { t: '≈ 11,5% TERPAKAI', c: 'orange' }], a: env(t, kp.n11 - 0.1, kp.dua - 0.1, 0.4, 0.3), size: 'lg' });
    ov.card('donut', { html: CARDS.donut.html, a: env(t, kp.dua - 0.1, kp.kebetulan + 0.25, 0.4, 0.35), k: ramp(t, kp.dua, 1.6), update: CARDS.donut.update });
    ov.tag('keb', { x: 540, y: 620, parts: [{ t: 'KEBETULAN?', c: 'navy' }, { t: 'ATAU DIBIARKAN?', c: 'orange' }], a: env(t, kp.kebetulan + 0.1, kp.cara + 0.2, 0.4, 0.35), size: 'lg' });

    // ---------- S03 underground
    const kb = K.bawah;
    const fa = (a, b, fi = 0.6, fo = 0.4) => env(t, a, b, fi, fo);
    ov.callout('hujan', { p: pv(V(-93, 0, 2)), parts: [{ t: 'AIR HUJAN', c: 'white' }, { t: 'MERESAP', c: 'cyan' }], a: fa(kb.meresap - 0.1, kb.magma), len: 120 });
    ov.callout('magma', { p: pv(V(14, -200, 2)), parts: [{ t: 'DAPUR MAGMA', c: 'orange' }], a: fa(kb.magma - 0.1, kb.lapisan - 0.2), len: 70 });
    ov.callout('res', { p: pv(V(-20, -120, 2)), parts: [{ t: 'RESERVOIR', c: 'white' }, { t: '>240 °C', c: 'orange' }], a: fa(kb.terpanas, kb.lapisan + 0.2), len: 90 });
    ov.callout('cap', { p: pv(V(-12, -48, 2)), parts: [{ t: 'CAPROCK', c: 'navy' }, { t: 'BATUAN KEDAP', c: 'white' }], a: fa(kb.lapisan, kb.persis + 0.1), len: 120 });
    ov.card('presto', { html: CARDS.presto.html, a: env(t, kb.persis - 0.15, kb.en + 0.15, 0.45, 0.4), update: CARDS.presto.update });

    // ---------- S04 plant
    const kq = K.pembangkit;
    const bitP = pv(V(-45, P.bit.position.y, 1));
    ov.callout('bor', { p: bitP, parts: [{ t: 'MATA BOR', c: 'white' }, { t: '2–2,5 KM', c: 'navy' }], a: fa(kq.dibor, kq.tembus + 0.1, 0.5, 0.3), len: 90, dx: 120 });
    ov.callout('prod', { p: pv(V(-45, -30, 3)), parts: [{ t: 'SUMUR PRODUKSI', c: 'white' }], a: fa(kq.tembus + 0.1, kq.separator - 0.4, 0.5, 0.3), len: 100, dx: 110 });
    ov.callout('sep', { p: pv(P.anchors.separator), parts: [{ t: 'SEPARATOR', c: 'white' }, { t: 'UAP | AIR', c: 'cyan' }], a: fa(kq.separator, kq.uapnya - 0.2, 0.6, 0.3), len: 150 });
    ov.callout('pipa', { p: pv(V(-8, 10, -19)), parts: [{ t: 'PIPA UAP', c: 'navy' }, { t: 'AKTIF', c: 'cyan' }], a: fa(kq.uapnya + 0.1, kq.memutar1 - 0.2, 0.5, 0.3), len: 170 });
    ov.callout('turb', { p: pv(P.anchors.turbine), parts: [{ t: 'TURBIN', c: 'white' }, { t: '3.000 RPM', c: 'cyan' }], a: fa(kq.turbin1 - 0.1, kq.turbin2 + 0.2, 0.5, 0.3), len: 170 });
    ov.callout('gen', { p: pv(P.anchors.generator), parts: [{ t: 'GENERATOR', c: 'white' }], a: fa(kq.generator - 0.2, kq.jadilah + 0.3, 0.5, 0.3), len: 170 });
    ov.callout('elec', { p: pv(V(92, 31, -50)), parts: [{ t: 'LISTRIK', c: 'cyan' }, { t: 'KE JARINGAN', c: 'navy' }], a: fa(kq.jadilah + 0.2, K.siklus.st + 0.2, 0.5, 0.3), len: 130 });

    // ---------- S05 cycle
    const ks = K.siklus;
    ov.callout('ct', { p: pv(P.anchors.cooling), parts: [{ t: 'MENARA PENDINGIN', c: 'white' }], a: fa(ks.menara - 0.1, ks.itu + 0.1, 0.5, 0.3), len: 150 });
    ov.callout('uap', { p: pv(V(70, 40, -52)), parts: [{ t: 'UAP AIR', c: 'navy' }, { t: 'BUKAN ASAP', c: 'cyan' }], a: fa(ks.itu, ks.airnya, 0.5, 0.3), len: 110 });
    ov.callout('inj', { p: pv(V(72, -60, 3)), parts: [{ t: 'SUMUR INJEKSI', c: 'white' }], a: fa(ks.disuntik, ks.siklusnya + 0.3, 0.5, 0.3), len: 110, dx: -110 });
    ov.tag('siklus', { x: 540, y: 600, parts: [{ t: 'SIKLUS', c: 'navy' }, { t: 'BERKELANJUTAN', c: 'cyan' }], a: env(t, ks.siklusnya, ks.bonus - 0.1, 0.4, 0.3), size: 'lg' });
    ov.card('dry', { html: CARDS.drysteam.html, a: env(t, ks.bonus - 0.1, ks.en + 0.1, 0.45, 0.35), k: ramp(t, ks.bonus, 2.6), update: CARDS.drysteam.update });

    // ---------- S06 twist
    const kt = K.twist;
    ov.big('twist', { a: env(t, kt.st + 0.05, kt.pltu1 - 0.05, 0.3, 0.3), small: 'BAB 2 · PLTP vs PLTU', big: 'PLOT TWIST', bc: true, y: 520 });
    if (U.group.visible) {
      ov.callout('tu', { p: uv(U.anchors.turbine), parts: [{ t: 'TURBIN UAP', c: 'white' }], a: fa(kt.turbin, kt.siapa, 0.5, 0.3), len: 120, size: 'sm' });
      ov.callout('boil', { p: uv(U.anchors.boiler), parts: [{ t: 'BOILER', c: 'navy' }, { t: 'BAKAR BATU BARA', c: 'red' }], a: fa(kt.siapa, kt.pltp - 0.2, 0.5, 0.3), len: 150, size: 'sm' });
      ov.callout('coal', { p: uv(V(-60, 12, 20)), parts: [{ t: '±10.000 TON/HARI', c: 'navy' }, { t: 'PER 1.000 MW', c: 'red' }], a: fa(kt.n10 - 0.1, kt.pltp - 0.2, 0.5, 0.3), len: 130, size: 'sm' });
    }
    ov.callout('tp', { p: pv(P.anchors.turbine), parts: [{ t: 'TURBIN UAP', c: 'white' }], a: fa(kt.turbin, kt.siapa, 0.5, 0.3), len: 90, size: 'sm' });
    ov.tag('sama', { x: 540, y: 1150, parts: [{ t: 'TURBIN', c: 'navy' }, { t: 'SAMA PERSIS', c: 'cyan' }], a: env(t, kt.turbin + 0.4, kt.siapa + 0.1, 0.4, 0.3), size: 'lg' });
    ov.callout('heat', { p: pv(V(14, -196, 2)), parts: [{ t: 'PANAS BUMI', c: 'orange' }], a: fa(kt.siapa + 0.2, kt.pltu2, 0.5, 0.3), len: 80, size: 'sm' });
    ov.callout('bumi', { p: pv(V(14, -196, 2)), parts: [{ t: 'BUMI YANG MEREBUS', c: 'orange' }], a: fa(kt.bumi - 0.1, kt.en, 0.5, 0.3), len: 90 });
    ov.tag('bbm', { x: 540, y: 600, parts: [{ t: 'BELI BAHAN BAKAR', c: 'navy' }, { t: 'TIDAK PERLU', c: 'cyan' }], a: env(t, kt.tanpa, kt.en + 0.1, 0.4, 0.3) });
    ov.tag('247', { x: 540, y: 700, parts: [{ t: '24/7', c: 'cyan' }, { t: 'BASELOAD', c: 'navy' }], a: env(t, kt.n24, kt.en + 0.1, 0.4, 0.3) });

    // ---------- S07 score cards
    const kk = K.skor;
    ov.card('emisi', { html: CARDS.emisi.html, a: env(t, kk.emisi - 0.25, kk.pltp2 - 0.1, 0.4, 0.3), k: (() => { const a = ramp(t, kk.emisi, 0.01) * 0; const e1 = smooth((t - kk.pltu) / 1.2) * 0.35; const e2 = smooth((t - kk.emisi - 0.6) / 1.2) * 0.3; const e3 = smooth((t - kk.n20) / 0.4) * 0.35; return Math.min(1, e1 + e2 + e3 + a); })(), update: CARDS.emisi.update });
    ov.card('cf', { html: CARDS.cf.html, a: env(t, kk.pltp2 - 0.05, kk.dan - 0.1, 0.4, 0.3), k: ramp(t, kk.faktor - 0.2, 1.6), update: CARDS.cf.update });
    const hba = CARDS._hba || (CARDS._hba = CARDS.hba(false));
    ov.card('hba', { html: hba.html, a: env(t, kk.dan - 0.05, kk.en + 0.15, 0.4, 0.35), k: ramp(t, kk.dan, 3.0), update: hba.update });

    // ---------- S08 why
    const kw = K.kenapa;
    ov.big('why', { a: env(t, kw.st + 0.05, kw.teori - 0.05, 0.3, 0.3), small: 'BAB 3 · PENYEBAB', big: 'KENAPA LAMBAT?', bc: true, y: 520 });
    ov.tag('teori', { x: 540, y: 520, parts: [{ t: 'TEORI', c: 'navy' }, { t: 'BELUM TERBUKTI', c: 'orange' }], a: env(t, kw.teori - 0.05, kw.dok, 0.4, 0.3), size: 'lg' });
    ov.card('sk', { html: CARDS.sk.html, a: env(t, kw.dok - 0.1, kw.tuding + 0.5, 0.4, 0.3) });
    ov.tag('klaim', { x: 540, y: 560, parts: [{ t: 'TUDINGAN', c: 'navy' }, { t: '≠ BUKTI', c: 'orange' }], a: env(t, kw.tuding + 0.45, kw.terdok + 0.2, 0.3, 0.3), size: 'lg' });
    ov.tag('fakta', { x: 540, y: 520, parts: [{ t: 'FAKTA', c: 'navy' }, { t: 'TERDOKUMENTASI', c: 'cyan' }], a: env(t, kw.terdok - 0.05, kw.satu + 0.5, 0.4, 0.3), size: 'lg' });
    if (SC.group.visible) {
      ov.tag('legend', { x: 540, y: 1222, parts: [{ t: 'LEBIH BERAT', c: 'navy' }, { t: '= LEBIH MAHAL', c: 'white' }], a: env(t, kw.terdok, kw.hasilnya, 0.4, 0.3), size: 'sm' });
      const panR = SC.panR.position.clone().add(SC.group.position).add(V(0, -60, 20));
      const panL = SC.panL.position.clone().add(SC.group.position).add(V(0, -60, 20));
      ov.callout('pltuPan', { p: panR, parts: [{ t: 'PLTU', c: 'red' }], a: fa(kw.tuding + 0.6, kw.satu, 0.5, 0.3), len: 60, size: 'sm' });
      ov.callout('pltpPan', { p: panL, parts: [{ t: 'PLTP', c: 'cyan' }], a: fa(kw.tuding + 0.6, kw.dipatok, 0.5, 0.3), len: 60, size: 'sm' });
      ov.callout('f1', { p: panR, parts: [{ t: '1 · HARGA DMO', c: 'navy' }, { t: 'MAKS US$70/t', c: 'red' }], a: fa(kw.satu, kw.dua - 0.1, 0.5, 0.3), len: 110, size: 'sm' });
      ov.callout('f2', { p: SC.lock.position.clone().add(SC.group.position), parts: [{ t: '2 · TAKE-OR-PAY', c: 'navy' }, { t: 'TETAP DIBAYAR', c: 'orange' }], a: fa(kw.kontrak, kw.tiga - 0.1, 0.5, 0.3), len: 110, size: 'sm', dx: -40 });
      ov.callout('f3', { p: panL, parts: [{ t: '3 · 1 SUMUR', c: 'navy' }, { t: 'US$4–10 JUTA', c: 'cyan' }], a: fa(kw.tiga, kw.hasilnya - 0.1, 0.5, 0.3), len: 120, size: 'sm' });
      ov.callout('kering', { p: panL.clone().add(V(0, -30, 0)), parts: [{ t: 'RISIKO', c: 'navy' }, { t: 'SUMUR KERING', c: 'orange' }], a: fa(kw.kering - 0.05, kw.hasilnya - 0.1, 0.4, 0.3), len: 2, down: true, size: 'sm' });
    }
    const hbaD = CARDS._hbaD || (CARDS._hbaD = CARDS.hba(true));
    ov.card('dmo', { html: hbaD.html, a: env(t, kw.dipatok - 0.1, kw.dua - 0.15, 0.4, 0.3), k: 0.55 + 0.45 * ramp(t, kw.dipatok, 1.4), update: hbaD.update });
    ov.tag('surplus', { x: 540, y: 640, parts: [{ t: 'SURPLUS LISTRIK', c: 'navy' }, { t: '±4–6 GW (2022–23)', c: 'orange' }], a: env(t, kw.surplus - 0.1, kw.tiga - 0.05, 0.4, 0.3) });
    ov.card('irena', { html: CARDS.irena.html, a: env(t, kw.hasilnya - 0.1, kw.konsp - 0.05, 0.4, 0.3), k: ramp(t, kw.hasilnya + 0.1, 1.8), update: CARDS.irena.update });
    ov.tag('konsp', { x: 540, y: 560, parts: [{ t: 'KONSPIRASI?', c: 'navy' }, { t: 'BELUM TERBUKTI', c: 'orange' }], a: env(t, kw.konsp, kw.en + 0.1, 0.35, 0.3), size: 'lg' });
    ov.tag('aturan', { x: 540, y: 670, parts: [{ t: 'ATURAN MAIN', c: 'navy' }, { t: 'MEMIHAK BATU BARA', c: 'red' }], a: env(t, kw.aturan - 0.1, kw.en + 0.1, 0.35, 0.3), size: 'lg' });

    // ---------- S09 dark side
    const kg = K.gelap;
    ov.big('dark', { a: env(t, kg.st + 0.05, kg.tahun - 0.05, 0.3, 0.3), small: 'BAB 4 · RISIKO PLTP', big: 'SISI GELAP', bc: true, y: 520 });
    ov.callout('h2s', { p: pv(P.anchors.prodTop), parts: [{ t: 'H₂S', c: 'navy' }, { t: 'GAS BERACUN', c: 'orange' }], a: fa(kg.bocor, kg.flores, 0.5, 0.3), len: 150 });
    ov.callout('tewas', { p: V(-150, 3, 70), parts: [{ t: 'SORIK MARAPI 2021', c: 'white' }, { t: '5 WARGA MENINGGAL', c: 'red' }], a: fa(kg.tewas - 0.1, kg.flores, 0.5, 0.3), len: 110, size: 'sm' });
    ov.callout('poco', { p: V(-250, 30, 140), parts: [{ t: 'POCO LEOK, FLORES', c: 'white' }, { t: 'MENOLAK', c: 'orange' }], a: fa(kg.poco - 0.1, kg.gempa, 0.5, 0.3), len: 120 });
    ov.callout('pohang', { p: V(200, 1, 180), parts: [{ t: 'POHANG, KOREA', c: 'white' }, { t: 'M5,4 · 2017', c: 'orange' }], a: fa(kg.gempa + 0.1, kg.dikaitkan + 0.2, 0.5, 0.3), len: 140 });
    ov.card('egs', { html: CARDS.egs.html, a: env(t, kg.dikaitkan, kg.en + 0.1, 0.45, 0.35), update: CARDS.egs.update });

    // ---------- S10 finale
    const kz = K.penutup;
    ov.big('fin', { a: env(t, K.tele3 + 0.3, kz.menurutmu - 0.1, 0.4, 0.3), small: 'POTENSI YANG MENUNGGU', big: '23.742<small>MW</small>', y: 470 });
    ov.tag('mau', { x: 540, y: 760, parts: [{ t: 'BISA ✓', c: 'navy' }, { t: 'MAU ?', c: 'orange' }], a: env(t, kz.mau - 0.1, kz.menurutmu, 0.35, 0.3), size: 'lg' });
    ov.cta('cta', { y: 600, html: '<i>💬</i>TULIS DI KOMENTAR', a: env(t, kz.menurutmu, K.endCard + 0.2, 0.4, 0.3) });
    ov.tag('who', { x: 540, y: 740, parts: [{ t: 'SIAPA YANG', c: 'navy' }, { t: 'DIUNTUNGKAN?', c: 'orange' }], a: env(t, kz.menurutmu + 0.3, K.endCard + 0.2, 0.4, 0.3), size: 'lg' });
    ov.endCard(END_HTML, endA);
  }
}
