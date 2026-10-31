"""Generate Indonesian VO per scene (edge-tts neural), compress long pauses,
and emit word-level timeline for karaoke captions + animation cues.

Usage: python3 -I src/tts.py            (run from pltp-tiktok/)
Output: build/vo/<ID>.wav, build/vo_full.wav, build/timeline.json
"""
import asyncio, json, os, re, subprocess, sys, wave
import numpy as np

CA = "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):  # sandbox proxy CA (no-op elsewhere)
    import certifi
    certifi.where = lambda: CA
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "build")
SR = 48000

TOKEN_RE = re.compile(r"\[([^|\]]+)\|([^\]]+)\]([.,!?:;]*)|(\|\|)|(\S+)")


def parse(vo):
    toks = []
    for m in TOKEN_RE.finditer(vo):
        if m.group(4):
            if toks:
                toks[-1]["pause"] = True
            continue
        if m.group(1):
            p = m.group(3) or ""
            toks.append({"d": m.group(1) + p, "s": m.group(2) + p, "pause": False})
        else:
            w = m.group(5)
            toks.append({"d": w, "s": w, "pause": False})
    return toks


def norm(w):
    return re.sub(r"[^0-9a-z]", "", w.lower())


async def synth(text, voice, rate, path):
    c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    bounds = []
    with open(path, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                bounds.append([s, s + ch["duration"] / 1e7, ch["text"]])
    return bounds


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def align(toks, bounds):
    words = []  # (token_idx, norm)
    for ti, t in enumerate(toks):
        for w in t["s"].split():
            words.append((ti, norm(w)))
    assign = [None] * len(words)
    j = 0
    for bi, b in enumerate(bounds):
        nb = norm(b[2])
        found = None
        for k in range(j, min(j + 5, len(words))):
            nw = words[k][1]
            if nw == nb or (nb and nw and (nw.startswith(nb) or nb.startswith(nw))):
                found = k
                break
        if found is None:
            found = min(j, len(words) - 1)
        assign[found] = bi
        j = found + 1
    # token times
    tt = [[None, None] for _ in toks]
    for wi, bi in enumerate(assign):
        if bi is None:
            continue
        ti = words[wi][0]
        s, e = bounds[bi][0], bounds[bi][1]
        tt[ti][0] = s if tt[ti][0] is None else min(tt[ti][0], s)
        tt[ti][1] = e if tt[ti][1] is None else max(tt[ti][1], e)
    # interpolate missing
    for i, (s, e) in enumerate(tt):
        if s is None:
            prev = next((tt[k][1] for k in range(i - 1, -1, -1) if tt[k][1] is not None), 0.0)
            nxt = next((tt[k][0] for k in range(i + 1, len(tt)) if tt[k][0] is not None), prev + 0.3)
            tt[i] = [prev, max(prev + 0.05, nxt)]
    return tt


def compress(audio, toks, tt):
    """Cut long silences between tokens; insert dramatic pauses at '||'."""
    out, pos = [], 0
    new_tt = []
    first = tt[0][0]
    cur = max(0.0, first - 0.04)
    i0 = int(cur * SR)
    for i, (s, e) in enumerate(tt):
        if i == 0:
            seg_start = i0
        new_s = pos + (int(s * SR) - seg_start) / SR
        new_tt.append([new_s, new_s + (e - s)])
        if i == len(tt) - 1:
            end_i = min(len(audio), int((e + 0.28) * SR))
            seg = audio[seg_start:end_i].copy()
            out.append(seg); pos += len(seg) / SR
            break
        ns = tt[i + 1][0]
        gap = ns - e
        d = toks[i]["d"]
        if d[-1:] in ".?!":
            target = 0.30
        elif d[-1:] in ",:;":
            target = 0.17
        else:
            target = 0.10
        extra = 0.38 if toks[i]["pause"] else 0.0
        if gap <= target + 0.02 and not extra:
            continue  # keep contiguous
        keep = min(gap, target)
        a = max(min(keep * 0.6, gap), min(0.07, gap))
        b = max(0.0, min(keep - a, gap - a))
        cut1 = int((e + a) * SR)
        seg = audio[seg_start:cut1].copy()
        f = min(len(seg), 240)
        if f:
            seg[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
        out.append(seg); pos += len(seg) / SR
        if extra:
            sil = np.zeros(int(extra * SR), dtype=np.float32)
            out.append(sil); pos += extra
        seg_start = int((ns - b) * SR)
        # fade-in handled on next append
        nxt_len = min(240, len(audio) - seg_start)
        if nxt_len > 0:
            audio[seg_start:seg_start + nxt_len] *= np.linspace(0, 1, nxt_len, dtype=np.float32)
    return np.concatenate(out), new_tt


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


async def main():
    cfg = json.load(open(os.path.join(ROOT, "src", "script.json"), encoding="utf-8"))
    os.makedirs(os.path.join(BUILD, "vo"), exist_ok=True)
    t = 0.0
    scenes, full = [], []
    for sc in cfg["scenes"]:
        toks = parse(sc["vo"])
        text = " ".join(tk["s"] for tk in toks)
        mp3 = os.path.join(BUILD, "vo", sc["id"] + ".mp3")
        bounds = None
        for attempt in range(4):
            try:
                bounds = await synth(text, cfg["voice"], cfg["rate"], mp3)
                break
            except Exception as ex:  # network hiccup
                print("retry", sc["id"], ex, file=sys.stderr)
                await asyncio.sleep(2 ** attempt)
        audio = decode(mp3)
        tt = align(toks, bounds)
        audio, tt = compress(audio, toks, tt)
        dur = len(audio) / SR
        write_wav(os.path.join(BUILD, "vo", sc["id"] + ".wav"), audio)
        start = t
        vo_start = start + sc["padBefore"]
        vo_end = vo_start + dur
        end = vo_end + sc["padAfter"]
        full.append(np.zeros(int(round(sc["padBefore"] * SR)), dtype=np.float32))
        full.append(audio)
        full.append(np.zeros(int(round(sc["padAfter"] * SR)), dtype=np.float32))
        # keep sample-accurate accumulation
        t = sum(len(x) for x in full) / SR
        end = t
        scenes.append({
            "id": sc["id"], "key": sc["key"], "start": round(start, 4), "voStart": round(vo_start, 4),
            "voEnd": round(vo_end, 4), "end": round(end, 4), "source": sc["source"],
            "tokens": [{"d": tk["d"], "t0": round(vo_start + a, 3), "t1": round(vo_start + b, 3),
                        "p": tk["pause"]} for tk, (a, b) in zip(toks, tt)],
        })
        print(f"{sc['id']} {sc['key']:<11} vo={dur:6.2f}s  start={start:7.2f}  end={end:7.2f}  words={len(toks)}/{len(bounds)}")
    vo = np.concatenate(full)
    write_wav(os.path.join(BUILD, "vo_full.wav"), vo)
    tl = {"fps": 30, "duration": round(len(vo) / SR, 4), "scenes": scenes}
    json.dump(tl, open(os.path.join(BUILD, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # also as JS for file:// loading
    with open(os.path.join(BUILD, "timeline.js"), "w", encoding="utf-8") as f:
        f.write("window.TIMELINE = " + json.dumps(tl, ensure_ascii=False) + ";\n")
    print("TOTAL", round(len(vo) / SR, 2), "s")


if __name__ == "__main__":
    asyncio.run(main())
