# -*- coding: utf-8 -*-
"""Generate voice-over Indonesia per adegan (edge-tts neural) + word boundaries -> cue timing & subtitle.
Output: build/audio/<id>.mp3, build/audio/<id>.json  {dur, cues{name:sec}, words[[t0,t1,text]]}
"""
import asyncio, json, os, re, ssl, subprocess, sys
import edge_tts
import edge_tts.communicate as _c

# proxy agen memakai CA sendiri
_c._SSL_CTX = ssl.create_default_context(cafile=os.environ.get("CCR_CA", "/root/.ccr/ca-bundle.crt"))

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "build", "audio")
os.makedirs(OUT, exist_ok=True)

VOICES = {
    "ardi": dict(voice="id-ID-ArdiNeural", rate="+12%", pitch="+0Hz"),
    "ardi_dark": dict(voice="id-ID-ArdiNeural", rate="+3%", pitch="-5Hz"),
    "gadis": dict(voice="id-ID-GadisNeural", rate="+10%", pitch="+0Hz"),
}

def norm(w):
    w = w.lower()
    w = re.sub(r"[^0-9a-zà-ÿ]+", "", w)
    return w

def parse(vo):
    """Return clean text, list of words, and cue->word index."""
    cues = {}
    words = []
    for tok in re.split(r"(\[\[[^\]]+\]\])|\s+", vo):
        if not tok:
            continue
        m = re.fullmatch(r"\[\[([^\]]+)\]\]", tok)
        if m:
            cues[m.group(1)] = len(words)
        else:
            words.append(tok)
    text = " ".join(words)
    return text, words, cues

async def synth(sc, sem):
    async with sem:
        sid = sc["id"]
        mp3 = os.path.join(OUT, sid + ".mp3")
        meta = os.path.join(OUT, sid + ".json")
        text, words, cues = parse(sc["vo"])
        v = VOICES[sc["voice"]]
        if os.path.exists(meta) and os.path.exists(mp3):
            old = json.load(open(meta))
            if old.get("text") == text and old.get("voice") == v:
                return sid, "cached"
        for attempt in range(5):
            try:
                com = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"],
                                           boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
                bounds = []
                with open(mp3, "wb") as f:
                    async for ch in com.stream():
                        if ch["type"] == "audio":
                            f.write(ch["data"])
                        elif ch["type"] == "WordBoundary":
                            bounds.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
                break
            except Exception as e:
                print("retry", sid, attempt, e, file=sys.stderr)
                await asyncio.sleep(2 * (attempt + 1))
        else:
            raise RuntimeError("TTS gagal: " + sid)
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                             "-of", "csv=p=0", mp3]).decode().strip())
        # --- align kata naskah ke boundary TTS (sekuensial, toleran) ---
        nb = [norm(b[2]) for b in bounds]
        mapping = [None] * len(words)
        j = 0
        for i, w in enumerate(words):
            nw = norm(w)
            if not nw:
                continue
            for k in range(j, min(j + 6, len(nb))):
                if nb[k] == nw or (len(nw) > 3 and (nb[k].startswith(nw[:4]) or nw.startswith(nb[k][:4]) if nb[k] else False)):
                    mapping[i] = k
                    j = k + 1
                    break
        def word_time(i):
            # cari kata terdekat yang terpetakan
            for d in range(0, len(words)):
                for ii in (i + d, i - d):
                    if 0 <= ii < len(words) and mapping[ii] is not None:
                        t = bounds[mapping[ii]][0]
                        if ii != i and len(words) > 0:
                            # interpolasi kasar 0.33 dtk per kata
                            t += (i - ii) * 0.33
                        return max(0.0, min(dur, t))
            return dur * i / max(1, len(words))
        cue_t = {name: round(word_time(idx) if idx < len(words) else dur, 3) for name, idx in cues.items()}
        mapped = sum(1 for m in mapping if m is not None)
        json.dump({"id": sid, "text": text, "voice": v, "dur": dur, "cues": cue_t,
                   "words": [[round(b[0], 3), round(b[1], 3), b[2]] for b in bounds],
                   "align": [mapped, len(words)]}, open(meta, "w"), ensure_ascii=False, indent=0)
        return sid, f"dur={dur:.1f}s align={mapped}/{len(words)}"

async def main():
    data = json.load(open(os.path.join(ROOT, "script", "script.json"), encoding="utf-8"))
    only = set(sys.argv[1:])
    sem = asyncio.Semaphore(4)
    tasks = [synth(s, sem) for s in data["scenes"] if not only or s["id"] in only]
    tot = 0
    for r in await asyncio.gather(*tasks):
        print(*r)
    for s in data["scenes"]:
        p = os.path.join(OUT, s["id"] + ".json")
        if os.path.exists(p):
            tot += json.load(open(p))["dur"]
    print(f"TOTAL VO: {tot:.1f}s = {tot/60:.2f} menit")

if __name__ == "__main__":
    asyncio.run(main())
