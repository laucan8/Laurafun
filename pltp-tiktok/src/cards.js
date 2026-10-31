// Info cards (reference "LZB" white-card style) with animated SVG diagrams.
import { clamp, smooth, easeOut, lerp } from './world.js';

const fmt = (n, d = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const q = (el, s) => el.querySelector(s);

export const CARDS = {
  presto: {
    html: `<div class="hd"><h1>PANCI<br>PRESTO</h1><div class="chip n">ANALOGI</div></div>
      <p>Tutup rapat mengunci uap, tekanan & suhu naik. Di perut bumi, “tutup”-nya adalah <b>caprock</b>: lapisan batuan kedap.</p>
      <svg viewBox="0 0 900 330">
        <g class="lbl" font-size="34" fill="#142a47">
          <path d="M110 120 h220 v130 q0 40 -40 40 h-140 q-40 0 -40 -40z" fill="#eef2f6" stroke="#142a47" stroke-width="6"/>
          <rect x="120" y="190" width="200" height="88" rx="10" fill="#7fd3f5"/>
          <path d="M96 120 q124 -46 248 0 z" fill="#a08fb3" stroke="#142a47" stroke-width="6"/>
          <rect x="208" y="66" width="24" height="26" rx="4" fill="#142a47"/>
          <g class="steam" fill="#cfd8e0"><circle cx="220" cy="48" r="10"/><circle cx="236" cy="26" r="13"/><circle cx="214" cy="6" r="9"/></g>
          <path d="M150 300 q15 -30 30 0 q15 -30 30 0 q15 -30 30 0 q15 -30 30 0 q15 -30 30 0" fill="none" stroke="#ff5a1f" stroke-width="8"/>
          <text x="220" y="328" text-anchor="middle" fill="#ff5a1f">API</text>
          <text x="450" y="200" font-size="90" text-anchor="middle" fill="#142a47">=</text>
          <rect x="560" y="70" width="300" height="46" fill="#a08fb3"/><text x="710" y="103" text-anchor="middle" fill="#fff">CAPROCK</text>
          <rect x="560" y="116" width="300" height="110" fill="#e9be7e"/>
          <g fill="#3cc3f0"><circle cx="600" cy="150" r="7"/><circle cx="660" cy="190" r="6"/><circle cx="720" cy="140" r="8"/><circle cx="790" cy="185" r="6"/><circle cx="830" cy="145" r="7"/></g>
          <text x="710" y="215" text-anchor="middle" fill="#142a47">RESERVOIR</text>
          <path d="M600 330 q0 -86 110 -96 q110 10 110 96z" fill="#ff7a2a"/><text x="710" y="314" text-anchor="middle" fill="#fff">MAGMA</text>
        </g></svg>`,
    update(el, k, t) { const s = q(el, '.steam'); if (s) s.setAttribute('transform', `translate(0 ${(-((t * 30) % 20)).toFixed(1)})`); },
  },
  donut: {
    html: `<div class="hd"><h1 class="md">BAURAN<br>LISTRIK</h1><div class="chip n">ESDM · 2024</div></div>
      <svg viewBox="0 0 900 470">
        <g transform="translate(250 235)">
          <circle r="170" fill="none" stroke="#e9eef3" stroke-width="70"/>
          <circle class="d-coal" r="170" fill="none" stroke="#33363b" stroke-width="70" stroke-dasharray="0 1068" transform="rotate(-90)"/>
          <circle class="d-geo" r="170" fill="none" stroke="#19b8e6" stroke-width="70" stroke-dasharray="0 1068" transform="rotate(151)"/>
          <text class="d-num" y="20" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="92" fill="#142a47">0%</text>
          <text y="70" text-anchor="middle" class="lbl" font-size="34" fill="#5b6b80">BATU BARA</text>
        </g>
        <g class="lbl" font-size="40" fill="#142a47">
          <rect x="520" y="120" width="34" height="34" rx="6" fill="#33363b"/><text x="572" y="150">BATU BARA ±67%</text>
          <rect x="520" y="200" width="34" height="34" rx="6" fill="#19b8e6"/><text x="572" y="230">PANAS BUMI ±5%</text>
          <rect x="520" y="280" width="34" height="34" rx="6" fill="#e9eef3"/><text x="572" y="310">LAINNYA</text>
        </g></svg>`,
    update(el, k) {
      const C = 1068;
      const kc = smooth(k / 0.7), kg = smooth((k - 0.55) / 0.35);
      q(el, '.d-coal').setAttribute('stroke-dasharray', `${(C * 0.67 * kc).toFixed(1)} ${C}`);
      q(el, '.d-geo').setAttribute('stroke-dasharray', `${(C * 0.05 * kg).toFixed(1)} ${C}`);
      q(el, '.d-num').textContent = Math.round(67 * kc) + '%';
    },
  },
  drysteam: {
    html: `<div class="hd"><h1 class="md">UAP<br>KERING</h1><div class="chip c">LANGKA</div></div>
      <p>Reservoir Kamojang didominasi uap, bukan air panas. Uapnya bisa langsung memutar turbin. Lapangan seperti ini hanya segelintir di dunia.</p>
      <svg viewBox="0 0 900 300"><g class="lbl" font-size="34" fill="#142a47">
        <rect x="0" y="40" width="900" height="200" rx="24" fill="#eef4f8"/>
        <path d="M60 170 q60 -70 150 -40 q70 25 120 -20 q50 -40 120 0 q70 40 160 -10 q80 -45 230 20" fill="none" stroke="#c9d6e2" stroke-width="40" stroke-linecap="round"/>
        <g class="pin1"><circle cx="150" cy="140" r="16" fill="#19b8e6" stroke="#142a47" stroke-width="5"/><text x="150" y="215" text-anchor="middle">THE GEYSERS · AS</text></g>
        <g class="pin2"><circle cx="440" cy="125" r="16" fill="#19b8e6" stroke="#142a47" stroke-width="5"/><text x="440" y="90" text-anchor="middle">LARDERELLO · ITALIA</text></g>
        <g class="pin3"><circle cx="740" cy="150" r="22" fill="#ff5a1f" stroke="#142a47" stroke-width="5"/><text x="740" y="220" text-anchor="middle" font-weight="700">KAMOJANG & DARAJAT</text></g>
      </g></svg>`,
    update(el, k) { ['.pin1', '.pin2', '.pin3'].forEach((s, i) => { const a = smooth((k - 0.2 - i * 0.15) / 0.2); q(el, s).setAttribute('opacity', a.toFixed(2)); }); },
  },
  emisi: {
    html: `<div class="hd"><h1>EMISI</h1><div class="chip n">SIKLUS HIDUP</div></div>
      <div class="meta">gram CO₂-eq per kWh · median IPCC AR5</div>
      <div class="bar"><div class="bl"><span>PLTU BATU BARA</span><span class="v1">0</span></div><div class="bt"><div class="bf f1" style="background:#e23b3b"></div></div></div>
      <div class="bar"><div class="bl"><span>PLTP PANAS BUMI</span><span class="v2">0</span></div><div class="bt"><div class="bf f2" style="background:#19b8e6"></div></div></div>
      <div class="x21" style="margin-top:30px;display:flex;align-items:center;gap:24px;opacity:0"><div style="font:700 120px/1 'JetBrains Mono';color:#e23b3b;letter-spacing:-4px">≈21×</div><div style="font:500 36px/1.25 Inter;color:#0f1e33">lebih tinggi<br>dari PLTP</div></div>`,
    update(el, k) {
      const a = smooth(k / 0.35), b = smooth((k - 0.25) / 0.3);
      q(el, '.f1').style.width = (100 * a).toFixed(1) + '%'; q(el, '.v1').textContent = fmt(Math.round(820 * a));
      q(el, '.f2').style.width = (100 * 38 / 820 * b).toFixed(2) + '%'; q(el, '.v2').textContent = fmt(Math.round(38 * b));
      q(el, '.x21').style.opacity = smooth((k - 0.62) / 0.15).toFixed(2);
    },
  },
  cf: {
    html: `<div class="hd"><h1 class="md">FAKTOR<br>KAPASITAS</h1><div class="chip c">PGE · H1-2026</div></div>
      <svg viewBox="0 0 900 400"><g transform="translate(220 200)">
        <circle r="150" fill="none" stroke="#e9eef3" stroke-width="44"/>
        <circle class="g" r="150" fill="none" stroke="#19b8e6" stroke-width="44" stroke-linecap="round" stroke-dasharray="0 943" transform="rotate(-90)"/>
        <text class="gv" y="22" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="76" fill="#142a47">0%</text></g>
        <g class="lbl" font-size="44" fill="#142a47"><text x="430" y="150">MENYALA ±24 JAM</text><text x="430" y="210" fill="#5b6b80" font-size="36">tak bergantung cuaca</text><text x="430" y="290" fill="#5b6b80" font-size="36">armada PGE, 90,4–90,6%</text></g></svg>`,
    update(el, k) { const a = smooth(k / 0.6); q(el, '.g').setAttribute('stroke-dasharray', `${(943 * 0.904 * a).toFixed(1)} 943`); q(el, '.gv').textContent = (90.4 * a).toFixed(1).replace('.', ',') + '%'; },
  },
  hba: (dmo) => ({
    html: `<div class="hd"><h1 class="md">HARGA<br>BATU BARA</h1><div class="chip ${dmo ? 'r' : 'o'}">${dmo ? 'DMO vs PASAR' : 'HBA · 2022'}</div></div>
      <svg viewBox="0 0 900 420"><g class="lbl" font-size="30" fill="#5b6b80">
        <line x1="70" y1="360" x2="880" y2="360" stroke="#c9d3de" stroke-width="3"/>
        <line x1="70" y1="40" x2="70" y2="360" stroke="#c9d3de" stroke-width="3"/>
        <text x="58" y="370" text-anchor="end">0</text><text x="58" y="208" text-anchor="end">170</text><text x="58" y="50" text-anchor="end">340</text>
        <text x="90" y="400">JAN 22</text><text x="470" y="400" text-anchor="middle">JUL 22</text><text x="860" y="400" text-anchor="end">JAN 23</text>
        <path class="ln" d="" fill="none" stroke="#ff5a1f" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
        <g class="dots" fill="#ff5a1f"></g>
        <g class="pk" opacity="0"><rect x="560" y="0" width="300" height="50" rx="8" fill="#142a47"/><text x="710" y="35" text-anchor="middle" fill="#fff">US$330,97 · OKT 22</text></g>
        ${dmo
    ? `<line class="dm" x1="70" y1="294" x2="70" y2="294" stroke="#e23b3b" stroke-width="7" stroke-dasharray="18 12"/><g class="dmt" opacity="0"><text x="860" y="282" text-anchor="end" fill="#e23b3b" font-size="36" font-weight="700">PLN: MAKS US$70/t (DMO)</text></g>`
    : `<line class="dm" x1="70" y1="352" x2="70" y2="352" stroke="#19b8e6" stroke-width="8"/><g class="dmt" opacity="0"><text x="860" y="336" text-anchor="end" fill="#139ac2" font-size="34" font-weight="700">UAP BUMI · TANPA BELI BAHAN BAKAR</text></g>`}
      </g></svg>`,
    update(el, k) {
      // verified HBA points (US$/t): Jan, Feb, Apr, May, Jun, Aug, Sep, Oct 2022, Jan 2023
      const pts = [[0, 158.5], [1, 188.38], [3, 288.4], [4, 275.64], [5, 323.91], [7, 321.59], [8, 319.22], [9, 330.97], [12, 305.21]];
      const X = (m) => 90 + m * (770 / 12), Y = (v) => 360 - v * (320 / 340);
      const a = smooth(k / 0.6) * 12;
      let d = ''; const dots = [];
      for (let i = 0; i < pts.length; i++) {
        const [m, v] = pts[i];
        if (m <= a) { d += (d ? 'L' : 'M') + X(m).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; dots.push(`<circle cx="${X(m).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="9"/>`); }
        else if (i > 0) { const [m0, v0] = pts[i - 1]; if (m0 < a) { const u = (a - m0) / (m - m0); d += 'L' + X(lerp(m0, m, u)).toFixed(1) + ' ' + Y(lerp(v0, v, u)).toFixed(1); } break; }
      }
      q(el, '.ln').setAttribute('d', d);
      const g = q(el, '.dots'); const key = dots.length; if (g._n !== key) { g.innerHTML = dots.join(''); g._n = key; }
      q(el, '.pk').setAttribute('opacity', smooth((a - 9) / 1).toFixed(2));
      const b = smooth((k - 0.55) / 0.3);
      q(el, '.dm').setAttribute('x2', (70 + 810 * b).toFixed(1));
      q(el, '.dmt').setAttribute('opacity', smooth((k - 0.75) / 0.15).toFixed(2));
    },
  }),
  sk: {
    html: `<div class="hd"><h1 class="md">SEXY<br>KILLERS</h1><div class="chip o">KLAIM DOKUMENTER</div></div>
      <div class="meta">Watchdoc · 13 Apr 2019 · >20 juta penonton dalam 9 hari</div>
      <p>Menuding ada jejaring elite politik di balik bisnis tambang & PLTU batu bara. Ini tudingan film, <b>bukan putusan hukum</b>.</p>
      <svg viewBox="0 0 900 190"><g>
        <rect x="0" y="10" width="900" height="170" rx="18" fill="#142a47"/>
        ${Array.from({ length: 14 }, (_, i) => `<rect x="${24 + i * 63}" y="24" width="34" height="22" rx="4" fill="#fff" opacity=".85"/><rect x="${24 + i * 63}" y="144" width="34" height="22" rx="4" fill="#fff" opacity=".85"/>`).join('')}
        <circle cx="450" cy="95" r="40" fill="#ff5a1f"/><path d="M438 75 L470 95 L438 115z" fill="#fff"/>
      </g></svg>`,
  },
  irena: {
    html: `<div class="hd"><h1 class="md">BIAYA LISTRIK<br>PANAS BUMI</h1><div class="chip n">IRENA · 2024</div></div>
      <div class="meta">LCOE · US$ per kWh</div>
      <div class="bar"><div class="bl"><span>INDONESIA</span><span class="v1">0,000</span></div><div class="bt"><div class="bf f1" style="background:#ff5a1f"></div></div></div>
      <div class="bar"><div class="bl"><span>RATA-RATA DUNIA</span><span class="v2">0,000</span></div><div class="bt"><div class="bf f2" style="background:#8a96a3"></div></div></div>
      <div class="bar"><div class="bl"><span>TÜRKIYE</span><span class="v3">0,000</span></div><div class="bt"><div class="bf f3" style="background:#19b8e6"></div></div></div>
      <div class="meta" style="margin-top:26px;color:#e23b3b">TERTINGGI DI ANTARA NEGARA YANG DIDATA</div>`,
    update(el, k) {
      [[0.090, '.f1', '.v1', 0], [0.060, '.f2', '.v2', 0.15], [0.033, '.f3', '.v3', 0.3]].forEach(([v, f, t, d]) => {
        const a = smooth((k - d) / 0.35);
        q(el, f).style.width = (100 * v / 0.09 * a).toFixed(1) + '%';
        q(el, t).textContent = (v * a).toFixed(3).replace('.', ',');
      });
    },
  },
  egs: {
    html: `<div class="hd"><h1 class="md">EGS ≠<br>PLTP BIASA</h1><div class="chip o">POHANG 2017</div></div>
      <svg viewBox="0 0 900 360"><g class="lbl" font-size="32">
        <rect x="0" y="0" width="430" height="300" rx="18" fill="#f1e6d2"/><rect x="470" y="0" width="430" height="300" rx="18" fill="#f1e6d2"/>
        <rect x="0" y="0" width="430" height="70" rx="18" fill="#a08fb3"/><rect x="470" y="0" width="430" height="70" rx="18" fill="#c9b9a0"/>
        <text x="215" y="46" text-anchor="middle" fill="#fff">HIDROTERMAL (RI)</text><text x="685" y="46" text-anchor="middle" fill="#fff">EGS</text>
        <g stroke="#9b7548" stroke-width="5"><line x1="40" y1="130" x2="130" y2="160"/><line x1="160" y1="210" x2="250" y2="180"/><line x1="280" y1="120" x2="390" y2="150"/><line x1="90" y1="250" x2="200" y2="270"/><line x1="300" y1="230" x2="400" y2="260"/></g>
        <g fill="#3cc3f0"><circle cx="85" cy="145" r="9"/><circle cx="205" cy="195" r="9"/><circle cx="335" cy="135" r="9"/><circle cx="145" cy="260" r="9"/><circle cx="350" cy="245" r="9"/></g>
        <rect x="205" y="70" width="14" height="150" fill="#59636e"/>
        <rect x="610" y="70" width="14" height="190" fill="#59636e"/><rect x="750" y="70" width="14" height="190" fill="#59636e"/>
        <g class="frac" stroke="#ff5a1f" stroke-width="6" fill="none"><path d="M617 240 l30 -12 l22 16 l30 -14 l22 14 l24 -10"/><path d="M617 210 l40 10 l30 -16 l40 12"/></g>
        <path class="star" d="M700 150 l12 26 l28 4 l-20 18 l6 28 l-26 -14 l-26 14 l6 -28 l-20 -18 l28 -4z" fill="#ff5a1f"/>
        <text x="215" y="340" text-anchor="middle" fill="#142a47">REKAHAN ALAMI</text><text x="685" y="340" text-anchor="middle" fill="#142a47">REKAHAN DIPAKSA (TEKANAN)</text>
      </g></svg>
      <p style="font-size:33px">Gempa M5,4 Pohang dikaitkan dengan stimulasi hidraulik EGS, bukan teknik PLTP hidrotermal.</p>`,
    update(el, k, t) { const s = q(el, '.star'); if (s) { const sc = 1 + 0.12 * Math.sin(t * 9); s.setAttribute('transform', `translate(700 190) scale(${sc.toFixed(3)}) translate(-700 -190)`); } },
  },
};

export const END_HTML = `<div id="end"><h2>SUMBER</h2><div class="sub">SEMUA ANGKA DALAM VIDEO INI</div><ol>
<li><b>ESDM</b> Potensi 23.742 MW · sumur KMJ-3 (1926) · batu bara ±67% bauran</li>
<li><b>THINKGEOENERGY</b> Kapasitas 2.742 MW, #2 dunia (akhir 2025)</li>
<li><b>IPCC AR5</b> Emisi siklus hidup 38 vs 820 g CO₂-eq/kWh</li>
<li><b>IRENA 2024</b> LCOE panas bumi RI US$0,090/kWh</li>
<li><b>PLN · PGE · GEO DIPA</b> ±10 rb t batu bara/hari per GW · CF 90% · biaya sumur</li>
<li><b>KEPMEN ESDM 1395/2018</b> Harga DMO batu bara maks US$70/t</li>
<li><b>IEEFA · KOMISI KOREA · ESDM</b> Take-or-pay · Pohang · Sorik Marapi</li>
</ol><div class="note">Ilustrasi 3D disederhanakan, tidak berskala. Tautan lengkap ada di deskripsi.</div></div>`;
export { fmt };
