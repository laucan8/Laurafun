import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from script_data import SCENES, SOURCES
R = os.path.join(os.path.dirname(__file__), "..")
tl = json.load(open(f"{R}/build/timeline.json"))
def tc(x): return f"{int(x//60):02d}:{int(x%60):02d}"
TITLE = "NADI DI DASAR LAUT — Benarkah 90% Internet Indonesia Bergantung pada Singapura?"
# SCRIPT
L = [f"# Script Narasi — {TITLE}", "", f"Durasi: {tc(tl['duration'])} · Suara: Microsoft Neural `id-ID-ArdiNeural` · Fakta per 31 Okt 2026", "",
     "> Format: `[timecode]` narasi — *(sumber yang tampil di layar)*", ""]
for s, sc in zip(SCENES, tl["scenes"]):
    L += [f"## {tc(sc['start'])} · {s['chapter'] or 'COLD OPEN'}", ""]
    for (t, srcs), ln in zip(s["lines"], sc["lines"]):
        src = f" *({'; '.join(SOURCES[k][0] for k in srcs)})*" if srcs else ""
        L.append(f"- `[{tc(ln['start'])}]` {t}{src}")
    L.append("")
open(f"{R}/SCRIPT.md", "w").write("\n".join(L))
# STORYBOARD
L = [f"# Storyboard — {TITLE}", "", "Gaya visual: 3D low-poly *flat-shaded*, tema terang (langit biru muda, laut teal, daratan hijau/krem pola petak), UI navy `#13243B` + aksen cyan `#12B5E5`/merah `#E8473C`/oranye `#FF7A2F`. Header atas: tanggal + jam/bab + bar rute JAKARTA — BATAM — SINGAPURA. Badge `● ILUSTRASI REKONSTRUKSI`. Label 3D dengan garis penunjuk. Caption bawah dengan highlight per kata. Pil sumber di kiri bawah pada setiap klip.", "",
     "| # | Waktu | Bab | Transisi masuk | Shot / visual | Inti narasi |", "|---|---|---|---|---|---|"]
for i, (s, sc) in enumerate(zip(SCENES, tl["scenes"])):
    shots = "<br>".join(f"{j+1}. {x}" for j, x in enumerate(s["shots"]))
    gist = s["lines"][0][0][:90] + "…"
    L.append(f"| {i} | {tc(sc['start'])}–{tc(sc['end'])} | {s['chapter'] or 'COLD OPEN'} | {s['transition_in']} | {shots} | {gist} |")
open(f"{R}/STORYBOARD.md", "w").write("\n".join(L) + "\n")
# SOURCES
used = []
for s in SCENES:
    for _, srcs in s["lines"]:
        for k in srcs:
            if k not in used: used.append(k)
L = [f"# Sumber — {TITLE}", "", "Diurutkan sesuai kemunculan di video. Untuk deskripsi YouTube, salin daftar ini.", ""]
for i, k in enumerate(used):
    lab, title, url = SOURCES[k]
    L.append(f"{i+1}. **{lab}** — {title}" + (f" — {url}" if url else ""))
L += ["", "## Catatan editorial", "- Angka 90% = klaim Komdigi (Jun 2026) & infografis Calvin Cheng (25 Okt 2026); metodologi tidak dipublikasikan.",
      "- Angka 80% = klaim Menkomdigi tentang konektivitas Singapura; metodologi tidak dipublikasikan.",
      "- Bagian teori konspirasi diberi label status (tidak didukung bukti / terdokumentasi lewat bocoran / kasus dicurigai).",
      "- Rute kabel di peta adalah ilustrasi yang disederhanakan, bukan rute presisi.",
      "- Kapasitas pusat data Singapura (1.650 MW) = estimasi Datacentres.com; proyeksi data center RI 74→348 MW = proyeksi 2023."]
open(f"{R}/SOURCES.md", "w").write("\n".join(L) + "\n")
print("docs ok", len(used), "sources")
