# -*- coding: utf-8 -*-
"""Rakit video final: gabung chunk -> mux audio -> encode kirim (2-pass) -> potong per bagian (< 95 MB) + playlist.
python3 assemble.py <render_dir> [video_kbps=3600]
"""
import json, os, subprocess, sys, glob, math

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RD = sys.argv[1]; KBPS = int(sys.argv[2]) if len(sys.argv) > 2 else 3600
TL = json.load(open(os.path.join(ROOT, "engine", "timeline.json"), encoding="utf-8"))
OUT = os.path.join(ROOT, "output"); os.makedirs(OUT, exist_ok=True)
WORK = os.path.join(RD, "work"); os.makedirs(WORK, exist_ok=True)
run = lambda a: (print(">", " ".join(a[:12]), "..."), subprocess.check_call(a))

chunks = sorted(glob.glob(os.path.join(RD, "c*.mp4")))
n_exp = math.ceil(TL["frames"] / 1200)
assert len(chunks) == n_exp and all(os.path.exists(c[:-4] + ".done") for c in chunks), f"chunk belum lengkap {len(chunks)}/{n_exp}"
lst = os.path.join(WORK, "list.txt"); open(lst, "w").write("".join(f"file '{c}'\n" for c in chunks))
vmaster = os.path.join(WORK, "video_master.mp4")
if os.environ.get("REUSE") != "1": run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vmaster])
# master kualitas tinggi + audio (disimpan lokal / untuk unggah langsung)
master = os.path.join(WORK, "PLTP_master_full.mp4")
if os.environ.get("REUSE") != "1": run(["ffmpeg", "-y", "-v", "error", "-i", vmaster, "-i", os.path.join(ROOT, "build", "mix", "final.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", master])

# titik potong: awal tiap bab + pemecahan bab panjang (maks ~150 dtk) pada batas adegan
starts = [s["start"] for s in TL["scenes"]]
cuts = [c["t"] for c in TL["chapters"] if c["t"] > 0]
bounds = [0.0] + cuts + [TL["duration"]]
final_cuts = []
for a, b in zip(bounds[:-1], bounds[1:]):
    seg = b - a; k = max(1, math.ceil(seg / 150.0))
    for j in range(1, k):
        target = a + seg * j / k; best = min([x for x in starts if a < x < b], key=lambda x: abs(x - target), default=None)
        if best: final_cuts.append(best)
    if b < TL["duration"]: final_cuts.append(b)
final_cuts = sorted(set(round(x, 3) for x in final_cuts))
# keyframe master tiap 2 dtk (chunk 1200 frame, keyint=60) -> bulatkan titik potong ke kelipatan 2 dtk (ke bawah)
final_cuts = sorted(set(max(2.0, math.floor(x / 2.0) * 2.0) for x in final_cuts))
kf = ",".join(f"{x:.3f}" for x in final_cuts)
deliver = master
# potong (stream copy) tepat di keyframe; bagian > 70 MB dipecah lagi di tengah (keyframe genap)
def segment(cuts):
    for f in glob.glob(os.path.join(OUT, "PLTP_bagian_*.mp4")): os.remove(f)
    run(["ffmpeg", "-y", "-v", "error", "-i", deliver, "-map", "0", "-c", "copy", "-f", "segment", "-segment_times", ",".join(f"{x:.3f}" for x in cuts), "-reset_timestamps", "1", "-segment_format_options", "movflags=+faststart", os.path.join(OUT, "PLTP_bagian_%02d.mp4")])
    return sorted(glob.glob(os.path.join(OUT, "PLTP_bagian_*.mp4")))
for _ in range(4):
    parts = segment(final_cuts); edges = [0.0] + final_cuts + [TL["duration"]]; added = False
    for i, pth in enumerate(parts):
        if os.path.getsize(pth) > 70e6:
            mid = math.floor((edges[i] + edges[i + 1]) / 4.0) * 2.0
            if edges[i] + 4 < mid < edges[i + 1] - 4: final_cuts.append(mid); added = True
    final_cuts = sorted(set(final_cuts))
    if not added: break
parts = sorted(glob.glob(os.path.join(OUT, "PLTP_bagian_*.mp4")))
# label bagian
labels = []; edges = [0.0] + final_cuts + [TL["duration"]]
chs = TL["chapters"]
for i, (a, b) in enumerate(zip(edges[:-1], edges[1:])):
    ch = [c for c in chs if c["t"] <= a + 3.0][-1]
    labels.append({"file": os.path.basename(parts[i]) if i < len(parts) else None, "start": a, "end": b, "label": f"{ch['label']} — {ch['title']}", "mb": round(os.path.getsize(parts[i]) / 1e6, 1) if i < len(parts) else 0})
json.dump({"title": "PANAS BUMI: Harta Karun di Bawah Kaki Kita", "duration": TL["duration"], "parts": labels, "chapters": chs}, open(os.path.join(OUT, "playlist.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(OUT, "gabung_list.txt"), "w").write("".join(f"file '{os.path.basename(p)}'\n" for p in parts))
for l in labels: print(l)
print("total MB:", sum(l["mb"] for l in labels))
