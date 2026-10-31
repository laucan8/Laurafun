import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from script_data import SCENES, SOURCES
R = os.path.join(os.path.dirname(__file__), '..')
tl = json.load(open(f'{R}/build/timeline.json'))
def tc(x): return f"{int(x//60)}:{int(x%60):02d}"
names = {'s00_coldopen': 'Pembuka: unggahan “Cut?”'}
L = ["# Paket YouTube — NADI DI DASAR LAUT", "", "## Judul (pilih salah satu)",
     "1. Benarkah 90% Internet Indonesia Bergantung pada Singapura? | Kabel Bawah Laut Dijelaskan 3D",
     "2. Kalau Singapura Putus Kabelnya, Internet Indonesia Mati? Ini Faktanya (Animasi 3D)",
     "3. NADI DI DASAR LAUT: Kabel Internet Indonesia–Singapura, Dokumen Bocor 2013 & Skenario Terburuk", "",
     "## Deskripsi", "",
     "25 Oktober 2026, satu unggahan berisi infografis “90%” dan kata “Cut?” bikin geger. Benarkah internet Indonesia bisa dipadamkan dari Singapura? Video ini membedah cara kerja kabel bawah laut dalam animasi 3D, menguji angka 90%, membahas teori yang beredar (dengan label status: terdokumentasi / dicurigai / tidak didukung bukti), mensimulasikan skenario kabel putus, dan solusi agar Indonesia tidak bergantung pada satu koridor.", "",
     "⚠️ Visual adalah ilustrasi rekonstruksi; rute kabel disederhanakan. Bagian teori diberi label status dan tidak dimaksudkan sebagai tuduhan. Fakta per 31 Oktober 2026.", "",
     "### Chapter"]
for s, sc in zip(SCENES, tl['scenes']):
    L.append(f"{tc(sc['start'])} {names.get(s['id'], s['chapter'].split('·',1)[-1].strip().title() if s['chapter'] else '')}")
used = []
for s in SCENES:
    for _, srcs in s['lines']:
        for k in srcs:
            if k not in used: used.append(k)
L += ["", "### Sumber"]
for i, k in enumerate(used):
    lab, title, url = SOURCES[k]
    L.append(f"{i+1}. {lab} — {title}" + (f" {url}" if url else ""))
L += ["", "Suara narasi: AI text-to-speech (Microsoft Neural id-ID-ArdiNeural). Musik & efek suara: sintetis orisinal (bebas royalti).", "",
      "#KabelBawahLaut #InternetIndonesia #Singapura #Komdigi #KedaulatanDigital #Animasi3D", "",
      "## Tag", "kabel bawah laut, internet indonesia, singapura, 90 persen internet, komdigi, meutya hafid, calvin cheng, kabel laut putus, SEA-US, bifrost, IIX, APJII, snowden singapura, five eyes, kedaulatan digital, animasi 3d, explainer"]
open(f'{R}/YOUTUBE.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[12:26]))
