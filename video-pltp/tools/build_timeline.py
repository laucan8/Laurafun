# -*- coding: utf-8 -*-
"""Bangun engine/timeline.json dari script.json + metadata audio (durasi & cue per kata)."""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FPS = 30
TR = {"none": 0.0, "cube": 1.3, "flip": 1.1, "shatter": 1.5, "zoom": 1.0, "slide": 1.2, "heat": 1.4, "end": 0.0}
PRE, POST = 0.55, 0.65

def short(ref):
    t = ref[0]
    return t.split(" — ")[0].strip()

def main():
    data = json.load(open(os.path.join(ROOT, "script", "script.json"), encoding="utf-8"))
    chapters = {c[0]: (c[1], c[2]) for c in data["chapters"]}
    refs = data["refs"]
    out_scenes = []
    t = 0.0
    seen_ch = set()
    prev = None
    for sc in data["scenes"]:
        ch = sc["ch"]
        if ch not in seen_ch:
            seen_ch.add(ch)
            if ch >= 1:
                bump = {"id": f"ch{ch}", "ch": ch, "type": "chapter", "params": {"n": ch, "label": chapters[ch][0], "title": chapters[ch][1]},
                        "voice": None, "ui": [{"k": "bumper"}], "src": [], "tr": "zoom", "start": round(t, 3), "dur": 3.2, "vo_start": None, "cues": {},
                        "vo_dur": 0}
                if prev is not None:
                    # transisi dari adegan sebelumnya ke bumper memakai 'heat' jika tidak ditentukan
                    if prev["tr"] in ("none",):
                        prev["tr"] = "heat"
                out_scenes.append(bump)
                prev = bump
                t += bump["dur"]
        meta = json.load(open(os.path.join(ROOT, "build", "audio", sc["id"] + ".json")))
        pre = 1.4 if sc["id"] == "s01" else PRE
        extra = 0.0
        kinds = {u.get("k") for u in sc.get("ui", [])}
        if "verdict" in kinds: extra += 1.4
        if sc["id"] == "s04": extra += 2.6
        if sc["id"] == "s20": extra += 2.5
        if sc["id"] == "s47": extra += 7.0
        if sc["type"] in ("conspiracy",): extra += 0.6
        if sc["id"] in ("s24",): extra += 1.0
        dur = pre + meta["dur"] + POST + extra
        cues = {k: round(v + pre, 3) for k, v in meta["cues"].items()}
        e = dict(sc)
        e.update({"start": round(t, 3), "dur": round(dur, 3), "vo_start": round(t + pre, 3), "vo_dur": meta["dur"], "cues": cues,
                  "words": [[round(w[0] + pre, 3), round(w[1] + pre, 3), w[2]] for w in meta["words"]]})
        e.pop("vo", None)
        e.pop("visual", None)
        out_scenes.append(e)
        prev = e
        t += dur
    # transisi: durasi; jangan biarkan transisi lebih dari 45% durasi adegan terpendek yang terlibat
    for i, s in enumerate(out_scenes):
        trd = TR.get(s["tr"], 1.2)
        if i + 1 < len(out_scenes):
            nxt = out_scenes[i + 1]
            trd = min(trd, 0.45 * s["dur"], 0.45 * nxt["dur"])
        else:
            trd = 0.0
        s["trDur"] = round(trd, 3)
        s["srcText"] = [short(refs[k]) for k in s.get("src", []) if k in refs]
    total = t
    chap_times = []
    for s in out_scenes:
        if s["type"] == "chapter" or s["id"] == "s01":
            chap_times.append({"ch": s["ch"], "t": s["start"], "label": chapters[s["ch"]][0], "title": chapters[s["ch"]][1]})
    tl = {"fps": FPS, "width": 1920, "height": 1080, "duration": round(total, 3), "frames": int(round(total * FPS)),
          "chapters": chap_times, "scenes": out_scenes,
          "refs": [v[0] for v in refs.values()]}
    out = os.path.join(ROOT, "engine", "timeline.json")
    json.dump(tl, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"scenes={len(out_scenes)} duration={total:.1f}s ({total/60:.2f} min) frames={tl['frames']}")
    for c in chap_times:
        m, s_ = divmod(int(c["t"]), 60)
        print(f"  {m:02d}:{s_:02d} {c['label']} — {c['title']}")

if __name__ == "__main__":
    main()
