# -*- coding: utf-8 -*-
"""Generate dokumen: SCRIPT.md, STORYBOARD.md, SUMBER.md, YOUTUBE_DESKRIPSI.md, subtitle SRT (Indonesia)."""
import json, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D = json.load(open(os.path.join(ROOT, "script", "script.json"), encoding="utf-8"))
TL = json.load(open(os.path.join(ROOT, "engine", "timeline.json"), encoding="utf-8"))
REFS = D["refs"]; CH = {c[0]: c for c in D["chapters"]}
tlmap = {s["id"]: s for s in TL["scenes"]}
DOCS = os.path.join(ROOT, "docs"); os.makedirs(DOCS, exist_ok=True)
VOICE = {"ardi": "Ardi (narator)", "ardi_dark": "Ardi — nada misteri", "gadis": "Gadis (Fakta Cek)"}
TRN = {"none": "kontinu (kamera terbang, satu dunia 3D)", "cube": "Kubus 3D berputar", "flip": "Kartu terbalik 3D", "shatter": "Pecah kaca 3D (tile beterbangan)", "zoom": "Zoom-punch + radial blur", "slide": "Carousel panel 3D", "heat": "Heat-dissolve (tepi api)", "end": "fade putih"}

def ts(t, ms=False):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    if ms: return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    return f"{int(m):02d}:{int(s):02d}" if h < 1 else f"{int(h)}:{int(m):02d}:{int(s):02d}"
clean = lambda v: re.sub(r"\[\[[^\]]+\]\]", "", v).replace("  ", " ").strip()
def ui_text(u):
    k = u.get("k")
    if k == "stat": return f"Angka: **{u.get('prefix','')}{u['value']}{u.get('suffix','')}** — {u.get('label','')}"
    if k in ("bullets", "facts", "chips"): return f"{'Poin' if k!='facts' else 'Fakta'}: " + " · ".join(i[1] for i in u["items"])
    if k == "steps": return "Langkah: " + " · ".join(f"{i[1]}. {i[2]}" for i in u["items"])
    if k == "callout": return f"Callout 3D: {u['text']}" + (f" ({u['sub']})" if u.get("sub") else "")
    if k in ("badge", "legend", "formula"): return f"{k.title()}: {u['text']}"
    if k in ("quote", "quote2"): return f"Kutipan: “{u['text']}”"
    if k == "title": return f"Judul: {u['text']} — {u.get('sub','')}"
    if k == "theory": return f"Stempel TEORI KONSPIRASI #{u['n']}: {u['text']}"
    if k == "verdict": return "Stempel STATUS (verdict)"
    if k == "calc": return "Kartu hitung: " + " | ".join(u["lines"])
    if k == "timeline": return "Garis waktu: " + " · ".join(f"{i[1]} {i[2]}" for i in u["items"])
    if k == "stack": return "Capital stack: " + " · ".join(f"{a} US${b} jt" for a, b in u["items"])
    if k == "cards3": return "Kartu: " + " · ".join(i[1] for i in u["items"])
    if k == "procon": return "Plus–minus: " + " · ".join(i[1] for i in u["items"])
    if k == "stepbadge": return f"Badge LANGKAH {u['n']}/6 — {u['text']}"
    if k == "endcard": return "End card + daftar sumber bergulir"
    return k

# ---------- SCRIPT ----------
L = [f"# Script Narasi — {D['title']}", "", f"Durasi video: **{ts(TL['duration'])}** · {len(D['scenes'])} adegan · ±{sum(len(clean(s['vo']).split()) for s in D['scenes'])} kata · Bahasa Indonesia", "",
     "Suara: edge-tts neural **id-ID-ArdiNeural** (narator; nada lebih rendah & lambat untuk segmen teori konspirasi) dan **id-ID-GadisNeural** (segmen *Fakta Cek*).", "",
     "> Angka ditulis dengan kata agar dibaca TTS dengan benar. Angka numerik ada di overlay layar.", ""]
cur = None
for s in D["scenes"]:
    if s["ch"] != cur:
        cur = s["ch"]; c = CH[cur]; L += ["", f"## {c[1]} — {c[2]}", ""]
    e = tlmap[s["id"]]
    L += [f"**[{ts(e['start'])}] {s['id'].upper()}** · _{VOICE[s['voice']]}_", "", clean(s["vo"]), ""]
    if s.get("src"): L += ["<sub>Sumber: " + "; ".join(REFS[k][0] for k in s["src"]) + "</sub>", ""]
open(os.path.join(DOCS, "SCRIPT.md"), "w", encoding="utf-8").write("\n".join(L))

# ---------- STORYBOARD ----------
L = [f"# Storyboard — {D['title']}", "", "Gaya visual: **3D isometrik tema terang** (studio putih tanpa batas, bayangan lembut, palet pastel; aksen oranye panas bumi #FF6B35, navy #14213D, biru air #2E86DE, hijau #2A9D8F). Tipografi: Plus Jakarta Sans (judul), Inter (teks), JetBrains Mono (sumber & angka hitung).", "",
     "Format: 1920×1080, 30 fps, " + ts(TL["duration"]) + ". Setiap adegan menampilkan **sumber di pojok kiri bawah**, pil bab di kiri atas, dan progress bar bab di tepi atas.", "",
     "| # | Waktu | Durasi | Adegan 3D | Visual / gerak kamera | Teks & grafik di layar | Transisi keluar | Sumber |", "|---|---|---|---|---|---|---|---|"]
for e in TL["scenes"]:
    if e["type"] == "chapter":
        L.append(f"| {e['id']} | {ts(e['start'])} | {e['dur']:.1f}s | chapter | Bumper bab: angka 3D raksasa \"{e['params']['n']:02d}\" berputar masuk, orbit bola, lantai grid | {e['params']['label']} — {e['params']['title']} | {TRN.get(e['tr'], e['tr'])} | — |"); continue
    s = next(x for x in D["scenes"] if x["id"] == e["id"])
    uis = "<br>".join(ui_text(u) for u in s.get("ui", []))
    src = "<br>".join(REFS[k][0].split(" — ")[0] for k in s.get("src", []))
    L.append(f"| {s['id']} | {ts(e['start'])} | {e['dur']:.1f}s | `{s['type']}`{(' ('+s['params'].get('mode', s['params'].get('set','')) + ')') if s['params'] else ''} | {s['visual']} | {uis} | {TRN.get(e['tr'], e['tr'])} | {src} |")
open(os.path.join(DOCS, "STORYBOARD.md"), "w", encoding="utf-8").write("\n".join(L))

# ---------- SUMBER ----------
L = ["# Daftar Sumber", "", "Semua angka di video dapat ditelusuri ke sumber berikut (diakses Oktober 2026). Label di layar = bagian sebelum tanda “—”.", ""]
used = {}
for s in D["scenes"]:
    for k in s.get("src", []): used.setdefault(k, []).append(s["id"])
for i, (k, (txt, url)) in enumerate(REFS.items(), 1):
    L.append(f"{i}. **{txt}**" + (f" — <{url}>" if url else "") + (f"  \n   _dipakai di: {', '.join(used.get(k, []))}_" if used.get(k) else ""))
L += ["", "## Catatan metodologi perhitungan kanal (CALC)", "",
      "- **CAPEX per MW rata-rata dihasilkan** = CAPEX ÷ faktor kapasitas (FLH/8.760). Data CAPEX & FLH: Katalog Teknologi RI 2024 (USD 2022).",
      "- **LCOE** (metode anuitas): `LCOE = (CAPEX·CRF + O&M tetap)/MWh + O&M variabel + biaya BBM`, CRF = r(1+r)^n/((1+r)^n−1), n = 30 th.",
      "  - PLTP besar: CAPEX 4,4 + biaya lain 0,32 jt US$/MW, O&M tetap 110 rb US$/MW/th, O&M var 0,27 US$/MWh, 7.008 jam/th → 87 (WACC 10%), ±70 (WACC 7%), ±99 (WACC 12%).",
      "  - PLTU superkritis: CAPEX 1,6 jt US$/MW, O&M tetap 47 rb, O&M var 1,4 US$/MWh, efisiensi 37%, batu bara 3,7 US$/GJ (≈ US$70/t, 4.500 kkal/kg), 7.000 jam/th → 69 (WACC 10%), ±63 (7%), ±73 (12%); pada US$130/t → ±99.",
      "  - Harga karbon impas ≈ (87,4 − 68,4) ÷ (0,935 − 0,038) tCO₂/MWh ≈ **US$21/tCO₂** (emisi langsung PLTU ≈ 9,73 GJ/MWh × 96 kgCO₂/GJ; PLTP memakai median siklus hidup IPCC 38 g/kWh).",
      "- **Biaya kumulatif tanpa diskonto** (adegan s35): PLTU 1,6 + 0,309/th; PLTP 4,72 + 0,112/th (jt US$/MW) → titik silang ≈ tahun ke-16. Ilustrasi struktur biaya, **bukan** rekomendasi investasi.",
      "- **55 MW ≈ 400 GWh/th ≈ 280.000 orang**: 55 × 8.760 × 0,83 ÷ 1.411 kWh/kapita (2024).",
      "- Koordinat gunung api & PLTP pada peta bersifat perkiraan/ilustratif."]
open(os.path.join(DOCS, "SUMBER.md"), "w", encoding="utf-8").write("\n".join(L))

# ---------- DESKRIPSI YOUTUBE ----------
chap = [f"{ts(c['t'])} {c['label']} — {c['title']}" for c in TL["chapters"]]
chap[0] = "00:00 Pembuka — Harta karun di bawah kaki kita"
chap = [c.replace("BAB 8 — Teori Terakhir & Penutup", "BAB 8 — Teori #4: Bom waktu gas beracun? & Penutup") for c in chap]
extra = []
for sid, label in [("s08", "Teori #1: “40% panas bumi dunia”"), ("s18", "Teori #2: PLTP picu gempa & letusan?"), ("s30", "Teori #3: Mafia batu bara?"), ("s36", "CAPEX per MW: PLTP vs PLTU vs EBT"), ("s43", "Teori #4: Bom waktu gas beracun?")]:
    extra.append((tlmap[sid]["start"], f"{ts(tlmap[sid]['start'])} {label}"))
base = [(c["t"], s) for c, s in zip(TL["chapters"], chap)]
extra = [e for e in extra if all(abs(e[0] - b[0]) >= 12 for b in base)]  # aturan YouTube: jarak bab >= 10 dtk
allc = sorted(base + extra)
L = ["# Judul & Deskripsi YouTube (siap tempel)", "", "## Opsi judul", "",
     "1. Harta Karun yang “Disembunyikan”? Cara Kerja PLTP & Duel Biaya vs PLTU (3D)",
     "2. Indonesia Duduk di Atas 23.742 MW Panas Bumi — Kenapa Masih Bakar Batu Bara?",
     "3. PLTP Dijelaskan 3D: Dari Perut Bumi ke Colokan Rumah + 4 Teori Konspirasi Dicek Fakta", "",
     "## Deskripsi", "", "```",
     "Indonesia punya sekitar 23.742 MW potensi panas bumi — terbesar kedua di dunia — tapi dua per tiga listrik kita masih dari batu bara. Kenapa?",
     "Di video ini: cara kerja PLTP dalam animasi 3D (eksplorasi → sumur → separator → turbin → kondensor → injeksi ulang), PLTP ikonik (Kamojang, Salak, Darajat, Wayang Windu, Sarulla, Ulubelu, Dieng…), teknologi baru (bottoming biner, hidrogen hijau, lithium dari brine, EGS & closed-loop), duel PLTP vs PLTU, CAPEX per MW dan LCOE, plus 4 teori konspirasi yang kami cek fakta satu per satu.",
     "", "BAB:"] + [x[1] for x in allc] + ["", "SUMBER UTAMA (lengkap di docs/SUMBER.md):"]
for k in ["ESDM25", "TGE10", "DEA24", "IRENA24", "RUPTL", "COAL68", "IPCC", "CREA", "DMO", "PERPRES", "SARULLA", "IJG", "BOTTOM", "H2", "LITHIUM", "FERVO", "EAVOR", "POHANG", "SORIK", "SINILA", "IFC13", "ESMAP", "GREM", "JAPAN", "KAMOJANG", "STAR"]:
    t, u = REFS[k]; L.append(f"• {t}" + (f" — {u}" if u else ""))
L += ["", "Catatan: perhitungan LCOE/CAPEX per MW rata-rata adalah ilustrasi kanal berdasarkan data resmi Ditjen Gatrik ESDM & Danish Energy Agency (2024), bukan rekomendasi investasi. Segmen “teori konspirasi” disajikan untuk diuji, bukan dibenarkan.",
      "Musik & efek suara: sintesis orisinal (bebas royalti). Narasi: suara sintetis neural.", "", "#PLTP #PanasBumi #Geothermal #EnergiTerbarukan #PLTU #Indonesia #TransisiEnergi", "```"]
open(os.path.join(DOCS, "YOUTUBE_DESKRIPSI.md"), "w", encoding="utf-8").write("\n".join(L))

# ---------- SRT ----------
cues = []
for e in TL["scenes"]:
    if not e.get("words"): continue
    words = e["words"]; buf = []; t0 = None
    for w in words:
        if t0 is None: t0 = w[0]
        buf.append(w)
        txt = " ".join(x[2] for x in buf)
        if len(txt) > 70 or (w[1] - t0) > 4.2 or re.search(r"[.!?]$", w[2]):
            cues.append((e["start"] + t0, e["start"] + w[1] + 0.15, txt)); buf = []; t0 = None
    if buf: cues.append((e["start"] + t0, e["start"] + buf[-1][1] + 0.15, " ".join(x[2] for x in buf)))
# words dari TTS tidak memuat tanda baca -> rekonstruksi dari naskah tidak diperlukan; tambahkan kapitalisasi awal
L = []
for i, (a, b, txt) in enumerate(cues, 1):
    L += [str(i), f"{ts(a, True)} --> {ts(min(b, cues[i][0] - 0.02) if i < len(cues) else b, True)}", txt, ""]
open(os.path.join(DOCS, "subtitle_id.srt"), "w", encoding="utf-8").write("\n".join(L))
print("docs ok:", os.listdir(DOCS), "srt cues", len(cues))
