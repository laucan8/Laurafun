import json, os, sys, wave, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from script_data import SCENES, SOURCES
B = os.path.join(os.path.dirname(__file__), "..", "build")
SR = 48000
def readwav(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
t = 0.0; out = []; segs = []
for si, s in enumerate(SCENES):
    lead = 2.4 if si == 0 else 1.7
    tail = 0.7
    sc = {"id": s["id"], "chapter": s["chapter"], "date": s["date"], "clock": s["clock"],
          "transition": s["transition_in"], "start": t, "lines": []}
    t += lead
    for i, (text, srcs) in enumerate(s["lines"]):
        js = json.load(open(f"{B}/tts/{s['id']}_{i:02d}.json"))
        audio = readwav(f"{B}/tts/{s['id']}_{i:02d}.wav")
        # trim trailing silence a bit
        dur = len(audio) / SR
        segs.append((t, audio))
        sc["lines"].append({"start": round(t, 3), "end": round(t + dur, 3), "text": text,
                            "src": [SOURCES[k][0] for k in srcs],
                            "words": [[round(t + a, 3), round(t + b, 3), w] for a, b, w in js["words"]]})
        gap = 0.75 if text.strip().endswith("?") else 0.42
        if i == len(s["lines"]) - 1: gap = 0
        t += dur + gap
    t += tail
    if si == len(SCENES) - 1: t += 9.0   # outro / sources roll
    sc["end"] = round(t, 3); sc["start"] = round(sc["start"], 3)
    out.append(sc)
total = t
voice = np.zeros(int(total * SR) + SR, dtype=np.float32)
for st, a in segs:
    i = int(st * SR); voice[i:i + len(a)] += a
with wave.open(f"{B}/voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(voice, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump({"fps": 30, "width": 1920, "height": 1080, "duration": round(total, 3), "scenes": out}, open(f"{B}/timeline.json", "w"), ensure_ascii=False, indent=1)
for sc in out: print(f"{sc['id']:18s} {sc['start']:8.2f} {sc['end']:8.2f} {sc['end']-sc['start']:6.1f}s")
print("TOTAL", round(total, 1), "s =", f"{int(total//60)}:{int(total%60):02d}")
