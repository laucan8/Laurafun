"""Procedural ambient score + SFX + final mix (all synthesized, royalty-free)."""
import json, os, wave, numpy as np
from scipy import signal
B = os.path.join(os.path.dirname(__file__), "..", "build")
SR = 48000
tl = json.load(open(f"{B}/timeline.json"))
T = tl["duration"]; N = int(T * SR) + SR
rng = np.random.default_rng(7)
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
MOOD = {"s00_coldopen": "myst", "s01_kronologi": "neutral", "s02_perjalanan": "bright", "s03_anatomi": "bright",
        "s04_cahaya": "bright", "s05_kenapa_sg": "bright", "s06_faktacek": "neutral", "s07_konspirasi": "tense",
        "s08_simulasi": "tense", "s09_perbaikan": "neutral", "s10_solusi": "bright", "s11_penutup": "myst"}
PROG = {  # chords as midi notes
 "bright": [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]],   # D Bm G A
 "neutral": [[50, 57, 62, 64, 69], [46, 53, 58, 62, 65], [43, 50, 55, 58, 62], [45, 52, 57, 60, 64]],  # Dsus Bb Gm Am
 "myst": [[50, 57, 64, 66, 69], [43, 50, 57, 59, 66], [47, 54, 61, 62, 66], [45, 52, 59, 61, 64]],
 "tense": [[38, 45, 50, 53, 57], [34, 41, 46, 50, 53], [36, 43, 48, 51, 55], [37, 44, 49, 52, 56]],   # Dm Bb Cm C#dim-ish
}
music = np.zeros((N, 2), np.float32)
def add(buf, start, x, pan=0.0):
    i = int(start * SR)
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x))
    if j <= i: return
    x = x[: j - i]
    buf[i:j, 0] += x * (1 - pan) * 0.5 + x * 0.5 * (1 - abs(pan))
    buf[i:j, 1] += x * (1 + pan) * 0.5 + x * 0.5 * (1 - abs(pan))
CH = 8.0  # seconds per chord
for sc in tl["scenes"]:
    mood = MOOD[sc["id"]]; prog = PROG[mood]
    s0, s1 = sc["start"], sc["end"]
    k = 0; t = s0 - 1.0
    while t < s1:
        notes = prog[k % 4]; dur = CH + 3.0
        n = int(dur * SR); tt = np.arange(n) / SR
        env = np.minimum(1, tt / 2.2) * np.minimum(1, (dur - tt) / 2.8)
        env = np.clip(env, 0, 1) ** 1.5
        pad = np.zeros(n, np.float32)
        for ni, m in enumerate(notes):
            f = midi(m + 12 if mood != "tense" else m + 12)
            for det in (-0.12, 0.0, 0.11):
                ph = rng.uniform(0, 6.28)
                ff = f * 2 ** (det / 12)
                pad += (np.sin(2 * np.pi * ff * tt + ph) + 0.25 * np.sin(4 * np.pi * ff * tt + ph) + 0.08 * np.sin(6 * np.pi * ff * tt)) * (0.9 if ni else 1.2)
        pad *= env * (0.010 if mood != "tense" else 0.012)
        trem = 1 + 0.12 * np.sin(2 * np.pi * 0.17 * tt)
        add(music, t, pad * trem, pan=rng.uniform(-0.3, 0.3))
        # pluck arpeggio
        if mood in ("bright", "myst", "neutral"):
            step = 60 / 96 / 2
            seq = [notes[2], notes[3], notes[4], notes[3], notes[2] + 12, notes[4], notes[3], notes[1] + 12]
            for a in range(int(CH / step)):
                if mood == "neutral" and a % 2: continue
                if mood == "myst" and a % 4 not in (0, 3): continue
                m = seq[a % len(seq)] + 12
                nd = 1.2; tn = np.arange(int(nd * SR)) / SR
                pl = (np.sin(2 * np.pi * midi(m) * tn) + 0.3 * np.sin(4 * np.pi * midi(m) * tn)) * np.exp(-tn * 5.5) * np.minimum(1, tn / 0.004)
                add(music, t + a * step, (pl * 0.010).astype(np.float32), pan=0.5 * np.sin(a))
        if mood == "tense":
            # low drone + slow heartbeat pulse
            tn = np.arange(int(dur * SR)) / SR
            dr = (np.sin(2 * np.pi * midi(notes[0] - 12) * tn) * 0.6 + np.sin(2 * np.pi * midi(notes[0] - 5) * tn) * 0.3) * env * 0.035
            add(music, t, dr.astype(np.float32))
            for a in range(int(CH / 1.25)):
                tb = np.arange(int(0.5 * SR)) / SR
                th = np.sin(2 * np.pi * (55 * np.exp(-tb * 6) + 38) * tb) * np.exp(-tb * 9) * 0.05
                add(music, t + a * 1.25, th.astype(np.float32)); add(music, t + a * 1.25 + 0.28, (th * 0.6).astype(np.float32))
        t += CH; k += 1
# --- mood crossfade smoothing: gentle global lowpass
b, a = signal.butter(2, 5200 / (SR / 2))
music = signal.lfilter(b, a, music, axis=0).astype(np.float32)
# --- SFX
sfx = np.zeros((N, 2), np.float32)
def whoosh(at, dur=1.3, up=True, gain=0.22):
    n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32)
    out = np.zeros(n, np.float32); seg = 1024
    for i in range(0, n, seg):
        p = i / n; fc = (300 + 5200 * (p if up else 1 - p) ** 1.6)
        bb, aa = signal.butter(2, [max(80, fc * 0.6) / (SR / 2), min(SR / 2 - 100, fc * 1.4) / (SR / 2)], btype="band")
        out[i:i + seg] = signal.lfilter(bb, aa, x[i:i + seg])
    tt = np.arange(n) / n
    env = np.sin(np.pi * tt) ** 2 * (1 - tt * 0.3)
    y = out * env * gain * 3
    i0 = int((at - dur / 2) * SR)
    for c, d in ((0, 0), (1, int(0.012 * SR))):
        j = max(0, i0 + d); sfx[j:j + n, c] += y[: max(0, min(n, N - j))]
def hit(at, gain=0.35):
    n = int(2.2 * SR); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * (70 * np.exp(-tt * 3) + 42) * tt) * np.exp(-tt * 2.2) * gain
    nz = rng.standard_normal(n) * np.exp(-tt * 18) * 0.08
    add(sfx, at, (y + nz).astype(np.float32))
def chime(at, gain=0.05):
    n = int(1.8 * SR); tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * midi(m) * tt) * np.exp(-tt * 3) for m in (86, 93, 98)) * gain
    add(sfx, at, y.astype(np.float32), pan=0.2)
for i, sc in enumerate(tl["scenes"]):
    if i > 0:
        whoosh(sc["start"], 1.5, True, 0.20)
    if sc["chapter"]:
        chime(sc["start"] + 0.5)
s0 = tl["scenes"][0]; hit(s0["end"] - 6.5, 0.4)   # title slam near end of cold open
for sc in tl["scenes"]:  # verdict stamps
    if sc["id"] in ("s06_faktacek",):
        hit(sc["lines"][7]["start"] - 0.1, 0.3)
    if sc["id"] == "s07_konspirasi":
        for li in (3, 7, 14): hit(sc["lines"][li]["start"] + 1.2, 0.18)
np.save(f"{B}/sfx_times.npy", np.array([0]))
# --- voice + ducking
with wave.open(f"{B}/voice.wav") as w:
    voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
env = np.sqrt(signal.lfilter([1], [1, -0.999], voice ** 2) * 0.001)
env = env / (env.max() + 1e-9)
sm = np.zeros_like(env); a_att, a_rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.6 * SR))
# vectorized-ish envelope follower via decimation
dec = 480; e = env[::dec]; o = np.zeros_like(e); v = 0
for i, x in enumerate(e):
    v = x if x > v else v * (a_rel ** dec); o[i] = v
sm = np.repeat(o, dec)[:N]
duck = 1.0 - 0.55 * np.clip(sm * 4, 0, 1)
mix = music * (duck[:, None] * 1.0) + sfx
mix[:, 0] += voice * 0.92; mix[:, 1] += voice * 0.92
# fade in/out
fi = int(1.0 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(4.0 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.1) / 1.1
with wave.open(f"{B}/mix_raw.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print("ok", mix.shape, float(np.abs(mix).max()))
