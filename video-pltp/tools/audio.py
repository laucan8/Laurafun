# -*- coding: utf-8 -*-
"""Audio: musik latar orisinal (sintesis prosedural, bebas royalti), SFX transisi/UI, VO, mixing + ducking.
Output: build/mix/{vo,music,sfx,final}.wav  (48 kHz)
"""
import json, os, subprocess, math
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SR = 48000
OUT = os.path.join(ROOT, "build", "mix"); os.makedirs(OUT, exist_ok=True)
TL = json.load(open(os.path.join(ROOT, "engine", "timeline.json"), encoding="utf-8"))
DUR = TL["duration"] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(7)

def decode(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32).copy()

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = np.stack([x, x], 1)
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", path], stdin=subprocess.PIPE)
    p.stdin.write(x.astype(np.float32).tobytes()); p.stdin.close(); p.wait()

def onepole_lp(x, fc):
    a = math.exp(-2 * math.pi * fc / SR); y = np.empty_like(x); s = 0.0
    # vektorisasi blok via scipy jika ada
    try:
        from scipy.signal import lfilter
        return lfilter([1 - a], [1, -a], x).astype(np.float32)
    except Exception:
        for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
        return y

def env_ar(n, a, r):
    e = np.ones(n, np.float32); na = min(n, int(a * SR)); nr = min(n - na, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[n - nr:] = np.linspace(1, 0, nr)
    return e

midi = lambda m: 440.0 * 2 ** ((m - 69) / 12)

# ---------------- VO ----------------
vo = np.zeros(N, np.float32)
for s in TL["scenes"]:
    if not s.get("vo_start"): continue
    x = decode(os.path.join(ROOT, "build", "audio", s["id"] + ".mp3"))
    i0 = int(s["vo_start"] * SR); vo[i0:i0 + len(x)] += x[: max(0, N - i0)]
# EQ ringan: high-pass 80 Hz + sedikit presence via perbedaan LP
vo = vo - onepole_lp(vo, 80)
pk = np.max(np.abs(vo)) + 1e-9; vo = vo / pk * 0.89

# ---------------- MUSIK ----------------
# mood per adegan
def mood_of(s):
    if s["type"] in ("conspiracy", "dieng"): return "mystery"
    if s["type"] == "factcheck": return "fact"
    if s["type"] == "chapter": return "bump"
    if s["id"] in ("s01", "s02", "s04", "s46", "s47"): return "epic"
    if s["ch"] == 4: return "tech"
    return "calm"
moods = ["calm", "mystery", "fact", "bump", "epic", "tech"]
mood_env = {m: np.zeros(N, np.float32) for m in moods}
for s in TL["scenes"]:
    m = mood_of(s); a = int(s["start"] * SR); b = int((s["start"] + s["dur"]) * SR)
    mood_env[m][a:min(N, b)] = 1.0
# crossfade halus (LP pada envelope)
for m in moods: mood_env[m] = onepole_lp(onepole_lp(mood_env[m], 0.5), 0.5)

t = np.arange(N, dtype=np.float32) / SR
BPM = 96.0; beat = 60 / BPM; bar = beat * 4

def pad_layer(prog_chords, bars_per, cutoff, gain, detune=0.12, oct_shift=0):
    """pad akord: gelombang gergaji ter-detune + LP; crossfade antar akord."""
    out = np.zeros(N, np.float32); seg = bars_per * bar; nchord = len(prog_chords)
    nseg = int(DUR / seg) + 2
    for k in range(nseg):
        ch = prog_chords[k % nchord]; t0 = k * seg; i0 = int(t0 * SR); i1 = min(N, int((t0 + seg + 1.2) * SR))
        if i0 >= N: break
        n = i1 - i0; tt = np.arange(n) / SR; y = np.zeros(n, np.float32)
        for note in ch:
            f = midi(note + 12 * oct_shift)
            for d in (-detune, 0, detune):
                ph = (f * (1 + d / 100)) * tt + rng.random()
                y += (2 * (ph % 1) - 1) * 0.33
        e = env_ar(n, 1.0, 1.4); out[i0:i1] += y * e / max(1, len(ch))
    out = onepole_lp(onepole_lp(out, cutoff), cutoff * 1.5)
    return out * gain

def pluck_layer(prog_chords, bars_per, gain, pattern_seed=1, density=0.7, oct_=1, decay=3.5):
    out = np.zeros(N, np.float32); r = np.random.default_rng(pattern_seed); seg = bars_per * bar
    step = beat / 2; nsteps = int(DUR / step)
    L = int(1.2 * SR); tt = np.arange(L) / SR
    for k in range(nsteps):
        if r.random() > density: continue
        tk = k * step; ci = int(tk / seg) % len(prog_chords); ch = prog_chords[ci]
        pent = sorted(set([n % 12 for n in ch]))
        note = ch[0] + 12 * oct_ + [0, 2, 4, 7, 9, 12, 14][r.integers(0, 7)] if r.random() < 0.3 else ch[r.integers(0, len(ch))] + 12 * oct_
        f = midi(note); i0 = int(tk * SR); i1 = min(N, i0 + L); n = i1 - i0
        y = (np.sin(2 * np.pi * f * tt[:n]) + 0.35 * np.sin(4 * np.pi * f * tt[:n]) + 0.12 * np.sin(6 * np.pi * f * tt[:n])) * np.exp(-tt[:n] * decay)
        out[i0:i1] += y.astype(np.float32) * (0.6 + 0.4 * r.random())
    return onepole_lp(out, 5000) * gain

def bass_layer(prog_chords, bars_per, gain, pump=True):
    out = np.zeros(N, np.float32); seg = bars_per * bar
    roots = np.array([prog_chords[int(x / seg) % len(prog_chords)][0] - 12 for x in t[::480]])
    f = midi(np.repeat(roots, 480)[:N].astype(np.float64))
    ph = np.cumsum(f / SR); y = np.sin(2 * np.pi * ph).astype(np.float32)
    if pump: y *= (0.55 + 0.45 * np.minimum(1, ((t % (beat)) / (beat * 0.6)) ** 0.7))
    return onepole_lp(y, 300) * gain

# progresi
CALM = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]]      # Cmaj7 Am7 Fmaj7 G6
TECH = [[62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70], [57, 61, 64, 67]]      # Dm7 Bbmaj7 C7 A
MYST = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]                      # Am F Dm E
FACT = [[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 62, 66]]                      # Em C D Bm
EPIC = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]]

print("sintesis musik...")
music = np.zeros(N, np.float32)
calm = pad_layer(CALM, 2, 1400, 0.20) + pluck_layer(CALM, 2, 0.085, 3, 0.55) + bass_layer(CALM, 2, 0.10)
tech = pad_layer(TECH, 2, 1800, 0.17) + pluck_layer(TECH, 2, 0.10, 5, 0.8, decay=5) + bass_layer(TECH, 2, 0.13)
myst = pad_layer(MYST, 2, 700, 0.24, detune=0.25, oct_shift=-1) + 0.05 * np.sin(2 * np.pi * midi(33) * t).astype(np.float32)
tick = np.zeros(N, np.float32); L = int(0.03 * SR); click = (rng.standard_normal(L) * np.exp(-np.arange(L) / (0.004 * SR))).astype(np.float32)
for k in range(int(DUR / beat)):
    i0 = int(k * beat * SR); tick[i0:i0 + L] += click[: max(0, min(L, N - i0))] * (0.6 if k % 2 else 1.0)
tick = (tick - onepole_lp(tick, 2500)) * 0.05
myst = myst + tick
fact = pad_layer(FACT, 2, 1600, 0.15) + pluck_layer(FACT, 2, 0.08, 9, 0.5, oct_=2, decay=6)
epic = pad_layer(EPIC, 2, 2000, 0.22, oct_shift=1) + pluck_layer(EPIC, 2, 0.07, 11, 0.45, oct_=2) + bass_layer(EPIC, 2, 0.12, pump=False)
bump = pad_layer(EPIC, 1, 2500, 0.18, oct_shift=1)
for m, sig in (("calm", calm), ("tech", tech), ("mystery", myst), ("fact", fact), ("epic", epic), ("bump", bump)):
    music += sig * mood_env[m]
# fade awal/akhir
music *= np.minimum(1, t / 2.0) * np.minimum(1, np.maximum(0, (DUR - t) / 4.0))
# stereo lebar sederhana (delay 12 ms pada kanan)
d = int(0.012 * SR); musicR = np.concatenate([np.zeros(d, np.float32), music[:-d]])

# ---------------- SFX ----------------
print("sintesis SFX...")
sfx = np.zeros(N, np.float32)
def add(x, at, g=1.0):
    x = x / (np.max(np.abs(x)) + 1e-9)
    i0 = int(at * SR); i1 = min(N, i0 + len(x));
    if i0 < N and i1 > i0: sfx[i0:i1] += x[: i1 - i0] * g
def whoosh(dur=1.0, f0=300, f1=4000, up=True):
    n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32); tt = np.arange(n) / n
    env = np.sin(np.pi * tt) ** 1.6
    # sapuan filter: rata-rata bergerak dengan panjang berubah -> approx; gunakan dua LP berbeda dan crossfade
    lo = onepole_lp(x, f0); hi = onepole_lp(x, f1) - onepole_lp(x, f0 * 0.8)
    k = tt if up else 1 - tt
    return ((lo * (1 - k) + hi * k) * env * 0.9).astype(np.float32)
def boom(dur=1.6, f=45):
    n = int(dur * SR); tt = np.arange(n) / SR; fr = f * (1 + 2.5 * np.exp(-tt * 18))
    ph = np.cumsum(fr / SR); x = np.sin(2 * np.pi * ph) * np.exp(-tt * 3.2)
    nz = onepole_lp(rng.standard_normal(n).astype(np.float32), 900) * np.exp(-tt * 14) * 0.6
    return (x + nz).astype(np.float32)
def blip(f=1200, dur=0.09):
    n = int(dur * SR); tt = np.arange(n) / SR; return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 45) * 0.5 + np.sin(2 * np.pi * f * 1.5 * tt) * np.exp(-tt * 60) * 0.25).astype(np.float32)
def shimmer(dur=1.5):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.zeros(n, np.float32)
    for f in (1568, 2093, 2637, 3136):
        x += (np.sin(2 * np.pi * f * tt) * np.exp(-tt * (2.5 + f / 1500))).astype(np.float32) * 0.2
    return x
def glass(dur=1.2):
    n = int(dur * SR); x = np.zeros(n, np.float32); r = np.random.default_rng(3)
    for k in range(18):
        at = int(r.random() * 0.6 * SR); f = 2500 + r.random() * 5000; L = int(0.25 * SR); tt = np.arange(L) / SR
        y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 25) * (0.3 + 0.4 * r.random())
        x[at:at + L] += y[: max(0, min(L, n - at))].astype(np.float32)
    return x + whoosh(dur, 800, 6000) * 0.5
def fire(dur=1.4):
    n = int(dur * SR); tt = np.arange(n) / n; x = onepole_lp(rng.standard_normal(n).astype(np.float32), 1200) * np.sin(np.pi * tt) ** 1.2
    cr = (rng.random(n) > 0.9985).astype(np.float32) * rng.standard_normal(n).astype(np.float32); cr = cr - onepole_lp(cr, 3000)
    return (x * 1.2 + cr * 0.8).astype(np.float32)
def stamp():
    n = int(0.5 * SR); tt = np.arange(n) / SR; x = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt * 14) + onepole_lp(rng.standard_normal(n).astype(np.float32), 2500) * np.exp(-tt * 40) * 0.8
    return x.astype(np.float32)
def riser(dur=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR; fr = 200 + 1800 * (tt / dur) ** 2; ph = np.cumsum(fr / SR)
    return (np.sin(2 * np.pi * ph) * (tt / dur) ** 2 * 0.35 + whoosh(dur, 400, 5000) * 0.6).astype(np.float32)

S = TL["scenes"]
for i, s in enumerate(S[:-1]):
    if s["trDur"] <= 0: continue
    b = S[i + 1]["start"]; tr = s["tr"]; d = s["trDur"]
    if tr == "shatter": add(glass(1.3), b - d * 0.45, 0.16)
    elif tr == "heat": add(fire(1.5), b - d * 0.5, 0.17)
    elif tr == "zoom": add(riser(0.8), b - 0.8, 0.13); add(boom(1.0, 60), b, 0.22)
    else: add(whoosh(max(0.8, d), 250, 3500), b - max(0.8, d) / 2, 0.16)
for s in S:
    if s["type"] == "chapter": add(boom(1.8, 42), s["start"] + 0.25, 0.34); add(shimmer(1.6), s["start"] + 0.55, 0.12)
    cues = s.get("cues", {})
    for u in s.get("ui", []):
        k = u.get("k")
        if k == "verdict" and "verdict" in cues: add(stamp(), s["start"] + cues["verdict"] + 0.25, 0.32)
        elif k == "theory": add(boom(1.4, 50), s["start"] + cues.get("claim", 0.4) - 0.05, 0.26); add(stamp(), s["start"] + cues.get("claim", 0.4) + 0.05, 0.2)
        elif k in ("stat", "badge", "quote") and u.get("at") in cues: add(blip(1400 if k == "stat" else 1000), s["start"] + cues[u["at"]], 0.07)
        elif k in ("bullets", "facts", "chips", "steps", "timeline") and "items" in u:
            for it in u["items"]:
                c = it[0]
                if c in cues: add(blip(1700, 0.07), s["start"] + cues[c], 0.05)
        elif k == "callout" and u.get("at") in cues: add(blip(2200, 0.06), s["start"] + cues[u["at"]], 0.04)
    if s["id"] == "s04": add(boom(2.2, 38), s["start"] + cues.get("title", 0.5), 0.35); add(shimmer(2.0), s["start"] + cues.get("title", 0.5) + 0.3, 0.14)
add(riser(1.4), 0.0, 0.1)

# ---------------- MIX ----------------
print("mixing...")
# envelope VO untuk ducking
a_env = np.abs(vo); a_env = onepole_lp(a_env, 8.0); a_env = a_env / (np.percentile(a_env[a_env > 1e-4], 90) + 1e-9)
duck = np.clip(a_env, 0, 1); duck = onepole_lp(duck, 2.0)
mg = 0.80 * (1 - 0.6 * duck)  # musik turun ±7 dB saat narasi
L = vo * 1.0 + music * mg + sfx * 0.9
R = vo * 1.0 + musicR * mg + sfx * 0.9
mix = np.stack([L, R], 1)
write_wav(os.path.join(OUT, "vo.wav"), vo)
write_wav(os.path.join(OUT, "music.wav"), np.stack([music, musicR], 1) * 0.62)
write_wav(os.path.join(OUT, "sfx.wav"), sfx * 0.9)
write_wav(os.path.join(OUT, "premix.wav"), mix * 0.7)
# normalisasi loudness YouTube (-14 LUFS, TP -1.5)
subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(OUT, "premix.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", os.path.join(OUT, "final.wav")])
print("selesai:", OUT, f"{DUR:.1f}s")
