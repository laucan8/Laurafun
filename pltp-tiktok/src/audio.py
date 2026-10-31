"""Original procedural score + sound design, synced to timeline/events, then mixed
with the VO (ducking) and loudness-normalised for TikTok (-14 LUFS).

Usage (from pltp-tiktok/): python3 -I src/audio.py
In : build/timeline.json, build/events.json, build/vo_full.wav
Out: build/music.wav, build/sfx.wav, build/mix.wav
"""
import json, os, subprocess, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build')
SR = 48000
tl = json.load(open(os.path.join(B, 'timeline.json')))
EV = json.load(open(os.path.join(B, 'events.json')))
K = EV['K']
DUR = tl['duration'] + 0.3
N = int(DUR * SR)
rng = np.random.default_rng(7)


def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)


def tt(n): return np.arange(n) / SR


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0: return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    a, b = max(0, i), min(len(buf), i + len(sig))
    buf[a:b] += sig[a - i:b - i] * gain


def fft_filter(x, lo=None, hi=None, slope=1.0):
    n = len(x); X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi: g *= 1 / (1 + (f / hi) ** (2 * slope))
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    if X.ndim == 2: g = g[:, None]
    return np.fft.irfft(X * g, n, axis=0)


def reverb(x, decay=1.8, mix=0.25, seed=3):
    r = np.random.default_rng(seed); n = int(decay * 1.6 * SR)
    t = tt(n); env = np.exp(-t * 6.9 / decay)
    ir = np.stack([r.standard_normal(n) * env, r.standard_normal(n) * env], 1)
    ir = fft_filter(ir, hi=6000); ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) + 1e-9
    L = len(x) + n; nf = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf, axis=0) * np.fft.rfft(ir, nf, axis=0), nf, axis=0)[:len(x)]
    return x * (1 - mix) + y * mix * 0.9


NOISE = rng.standard_normal(SR * 8)
HAT_N = fft_filter(NOISE, lo=7000)
SN_N = fft_filter(NOISE, lo=900, hi=6000)
LOW_N = fft_filter(NOISE, hi=180)
MID_N = fft_filter(NOISE, lo=300, hi=2500)
HI_N = fft_filter(NOISE, lo=2500, hi=12000)


def nseg(bank, n, off=None):
    o = rng.integers(0, len(bank) - n) if off is None else off
    return bank[o:o + n].copy()


# ------------------------------------------------------------------ instruments
def pluck(f, dur=0.55, tau=0.17):
    n = int(dur * SR); t = tt(n)
    s = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t / tau) * np.minimum(1, t / 0.004)


def bass(f, dur=0.55):
    n = int(dur * SR); t = tt(n)
    s = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)))
    return s * np.exp(-t / 0.4) * np.minimum(1, t / 0.008)


def kick(dur=0.45, soft=1.0):
    n = int(dur * SR); t = tt(n)
    f = 44 + 80 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.27) * soft + nseg(MID_N, n) * np.exp(-t / 0.006) * 0.25


def hat(dur=0.05):
    n = int(dur * SR); t = tt(n); return nseg(HAT_N, n) * np.exp(-t / 0.018)


def snare():
    n = int(0.3 * SR); t = tt(n)
    return nseg(SN_N, n) * np.exp(-t / 0.11) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.06) * 0.6


def tick():
    n = int(0.03 * SR); t = tt(n)
    return nseg(HI_N, n) * np.exp(-t / 0.004) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.008) * 0.5


def pad_chord(notes, dur, att=0.9, rel=1.0):
    n = int((dur + rel) * SR); t = tt(n)
    s = np.zeros(n)
    for m in notes:
        for d in (-0.07, 0.0, 0.07):
            f = mtof(m + d)
            s += 2 * ((f * t + rng.random()) % 1.0) - 1
    env = np.minimum(1, t / att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    return s * env / (3 * len(notes))


CH = {  # chord voicings (MIDI)
    'Dm': [50, 57, 62, 65], 'Bb': [46, 58, 62, 65], 'F': [53, 60, 65, 69], 'C': [48, 55, 64, 67],
    'Gm': [43, 55, 62, 67], 'A': [45, 57, 61, 64], 'Dm2': [50, 57, 64, 65], 'Am': [45, 57, 60, 64],
}
ROOT_N = {'Dm': 38, 'Bb': 34, 'F': 41, 'C': 36, 'Gm': 43, 'A': 33, 'Dm2': 38, 'Am': 33}

BEAT = 0.6  # 100 BPM
# sections: (t0, t1, chords, bars_per_chord, layers)
S = {s['key']: s for s in tl['scenes']}
sec = [
    (0.0, K['tele1'] - 0.1, ['Dm', 'Dm', 'Bb', 'Dm2'], 2, dict(pad=0.9, ticks=1)),
    (K['tele1'], K['peta']['kebetulan'] - 0.1, ['Dm', 'Bb', 'F', 'C'], 2, dict(pad=0.8, arp=0.7, kick=0.6, hat=0.5, bass=0.6)),
    (K['peta']['kebetulan'] - 0.1, K['tele2'] - 0.05, ['Dm2', 'Bb'], 1, dict(pad=0.9, ticks=1)),
    (K['tele2'], S['twist']['start'] - 0.12, ['F', 'C', 'Dm', 'Bb'], 2, dict(pad=0.65, arp=0.8, kick=0.75, hat=0.6, snare=0.35, bass=0.7)),
    (S['twist']['start'] + 0.5, S['skor']['start'], ['Dm', 'Bb', 'C', 'A'], 2, dict(pad=0.8, arp=0.6, kick=0.6, hat=0.5, bass=0.7)),
    (S['skor']['start'], S['kenapa']['start'] - 0.1, ['F', 'C', 'Dm', 'Bb'], 2, dict(pad=0.65, arp=0.75, kick=0.7, hat=0.6, snare=0.3, bass=0.7)),
    (S['kenapa']['start'] + 0.3, K['kenapa']['konsp'] - 0.05, ['Dm', 'Bb', 'Gm', 'A'], 2, dict(pad=0.85, arp=0.45, kick=0.55, ticks=1, bass=0.75)),
    (K['kenapa']['belum'] - 0.05, S['gelap']['start'] - 0.1, ['Dm', 'Bb'], 1, dict(pad=0.85, kick=0.5, bass=0.7)),
    (S['gelap']['start'] + 0.3, K['tele3'] - 0.1, ['Dm', 'Gm', 'Dm', 'A'], 2, dict(pad=0.9, heart=0.8, bass=0.5)),
    (K['tele3'], DUR, ['Bb', 'C', 'F', 'Dm'], 2, dict(pad=0.75, arp=0.6, kick=0.45, hat=0.35, bass=0.55)),
]

pad = np.zeros((N, 2)); arp = np.zeros((N, 2)); drums = np.zeros((N, 2)); low = np.zeros((N, 2))
ARP_PAT = [0, 2, 3, 1, 3, 2, 3, 1]
for (t0, t1, chords, bpc, L) in sec:
    cd = bpc * 4 * BEAT
    t = t0; ci = 0
    while t < t1 - 0.05:
        name = chords[ci % len(chords)]
        dur = min(cd, t1 - t)
        notes = CH[name]
        if L.get('pad'):
            place(pad, pad_chord(notes, dur, rel=0.9 if t + dur < t1 - 0.05 else 0.5), t, 0.5 * L['pad'], 0)
        nb = int(round(dur / BEAT))
        for b in range(nb):
            tb = t + b * BEAT
            if tb >= t1 - 0.02: break
            if L.get('kick') and b % 2 == 0: place(drums, kick(), tb, 0.9 * L['kick'])
            if L.get('snare') and b % 2 == 1: place(drums, snare(), tb, 0.35 * L['snare'], 0.1)
            if L.get('hat'): place(drums, hat(), tb + BEAT / 2, 0.18 * L['hat'], 0.3)
            if L.get('ticks'): place(drums, tick(), tb, 0.16, -0.25); place(drums, tick(), tb + BEAT / 2, 0.08, 0.25)
            if L.get('heart') and b % 2 == 0:
                place(drums, kick(0.4, 0.8), tb, 0.55 * L['heart']); place(drums, kick(0.4, 0.6), tb + 0.22, 0.35 * L['heart'])
            if L.get('bass'): place(low, bass(mtof(ROOT_N[name])), tb, 0.42 * L['bass'])
            if L.get('arp'):
                for h in range(2):
                    k = (b * 2 + h) % len(ARP_PAT)
                    m = notes[ARP_PAT[k]] + 12
                    place(arp, pluck(mtof(m)), tb + h * BEAT / 2, 0.16 * L['arp'], -0.35 if h else 0.35)
        t += dur; ci += 1

pad = fft_filter(pad, hi=1400, slope=1.2)
music = reverb(pad * 0.9 + arp * 0.9, 2.4, 0.32) + drums * 0.85 + fft_filter(low, hi=400) * 0.9

# ------------------------------------------------------------------ SFX
sfx = np.zeros((N, 2))


def whoosh(dur=1.4, up=True):
    n = int(dur * SR); t = tt(n); u = t / dur
    env = np.sin(np.pi * u) ** 2
    lo, mi, hi = nseg(LOW_N, n), nseg(MID_N, n), nseg(HI_N, n)
    w_lo = (1 - u) if up else u
    s = (lo * 0.8 * w_lo + mi * 0.7 + hi * 0.35 * (u if up else 1 - u)) * env
    pan = np.linspace(-0.7, 0.7, n)
    return np.stack([s * np.cos((pan + 1) * np.pi / 4), s * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4


def boom(dur=2.2):
    n = int(dur * SR); t = tt(n)
    f = 34 + 40 * np.exp(-t / 0.12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.75)
    s += nseg(LOW_N, n) * np.exp(-t / 0.35) * 2.5 + nseg(MID_N, n) * np.exp(-t / 0.05) * 0.4
    return s


def riser(dur=1.5):
    n = int(dur * SR); t = tt(n); u = t / dur
    s = nseg(MID_N, n) * (1 - u) * u * 2 + nseg(HI_N, n) * u ** 2
    f = 200 + 1000 * u ** 2
    s += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * u
    return s * u ** 1.5


def pop(f0=900, f1=1350, dur=0.08):
    n = int(dur * SR); t = tt(n)
    f = f0 + (f1 - f0) * (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) + nseg(HI_N, n) * np.exp(-t / 0.003) * 0.3


def ding(f=1760, dur=0.7):
    n = int(dur * SR); t = tt(n)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t)) * np.exp(-t / 0.22)


def swish(dur=0.28):
    n = int(dur * SR); t = tt(n); u = t / dur
    return nseg(HI_N, n) * np.sin(np.pi * u) ** 2 * 0.8 + nseg(MID_N, n) * np.sin(np.pi * u) ** 2 * 0.4


def clack():
    n = int(0.12 * SR); t = tt(n)
    f = 140 + 260 * rng.random()
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.03) * 0.6 + nseg(MID_N, n) * np.exp(-t / 0.015) * 0.6


def noise_bed(bank, t0, t1, fade=0.5):
    n = int((t1 - t0) * SR)
    if n <= 0: return np.zeros(1)
    s = np.concatenate([bank] * (n // len(bank) + 1))[:n].copy()
    t = tt(n); env = np.minimum(1, t / fade) * np.minimum(1, (t[-1] - t) / fade)
    return s * env


# overlay-driven SFX
for e in EV['events']:
    i, t = e['id'], e['t']
    if i.startswith('co_isl_'): continue
    if i.startswith('co_'): place(sfx, pop(), t + 0.1, 0.16, (rng.random() - 0.5) * 0.6)
    elif i.startswith('tg_'): place(sfx, pop(700, 1100, 0.07), t + 0.02, 0.15, -0.2); place(sfx, pop(1050, 1500, 0.07), t + 0.1, 0.13, 0.2)
    elif i.startswith('cd_'): place(sfx, swish(), t, 0.22); place(sfx, ding(1568), t + 0.18, 0.06)
    elif i.startswith('bg_'): place(sfx, boom(), t, 0.36); place(sfx, swish(0.35), t, 0.22)
    elif i.startswith('ct_'): place(sfx, ding(1318), t, 0.09); place(sfx, ding(1760), t + 0.12, 0.08)

# transitions
for tp in (K['tele1'], K['tele3']): place(sfx, whoosh(1.6, True), tp - 0.95, 0.42)
place(sfx, whoosh(1.8, False), K['tele2'] - 1.1, 0.42)
place(sfx, riser(1.4), S['twist']['start'] - 1.4, 0.28)
place(sfx, riser(1.0), K['kenapa']['belum'] - 1.0, 0.2)
# hook ambience: steam hiss + wind
place(sfx, noise_bed(HI_N, 0, K['tele1'] - 0.4, 1.0), 0.0, 0.035, 0.15)
place(sfx, noise_bed(LOW_N, 0, K['tele1'], 1.0), 0.0, 0.08)
# tile drop: rumble + debris clacks
d0 = K['drop0']
place(sfx, noise_bed(LOW_N, 0, 4.2, 0.4), d0, 0.42)
for k in range(140):
    tc = d0 + 0.25 + (k / 140) ** 0.8 * 3.4 + rng.random() * 0.06
    place(sfx, clack(), tc, 0.05 + 0.05 * rng.random(), (rng.random() - 0.5) * 1.4)
place(sfx, whoosh(1.4, False), K['cover0'], 0.3)
# rain
bw = K['bawah']
place(sfx, noise_bed(fft_filter(NOISE, lo=500, hi=7000), bw['hujan'] - 0.5, bw['mendekati'] + 0.6, 0.6), bw['hujan'] - 0.5, 0.06)
# counters
for (a, d, step) in [(K['peta']['n23'] - 0.3, 1.2, 0.045), (K['peta']['dipakai'], 0.9, 0.045), (bw['terpanas'], 1.6, 0.07), (K['pembangkit']['dibor'], max(0.6, K['pembangkit']['begitu'] - K['pembangkit']['dibor']), 0.06)]:
    for k in range(int(d / step)): place(sfx, tick(), a + k * step, 0.06, 0.1)
# drilling
kp = K['pembangkit']
dn = int((kp['tembus'] - kp['dibor'] + 0.3) * SR)
if dn > 0:
    t = tt(dn); s = nseg(MID_N, dn) * (0.6 + 0.4 * np.sin(2 * np.pi * 17 * t)) + 0.4 * np.sin(2 * np.pi * (110 + 6 * np.sin(2 * np.pi * 5 * t)) * t)
    s *= np.minimum(1, t / 0.3) * np.minimum(1, (t[-1] - t) / 0.15)
    place(sfx, s, kp['dibor'], 0.16, -0.2)
# steam burst
n = int(1.8 * SR); t = tt(n); place(sfx, nseg(HI_N, n) * np.exp(-t / 0.55) * np.minimum(1, t / 0.02) + nseg(LOW_N, n) * np.exp(-t / 0.3), kp['tembus'], 0.32)
# steam in pipe
n = int(2.2 * SR); t = tt(n); place(sfx, nseg(HI_N, n) * np.sin(np.pi * t / t[-1]) ** 2, kp['uapnya'] - 0.2, 0.08, 0.3)
# turbine hum
t0h, t1h = kp['memutar1'] - 0.5, S['siklus']['start'] + 0.5
n = int((t1h - t0h) * SR); t = tt(n)
hum = 0.5 * np.sin(2 * np.pi * 50 * t) + 0.3 * np.sin(2 * np.pi * 100 * t) + 0.12 * np.sin(2 * np.pi * 150 * t) + 0.05 * np.sin(2 * np.pi * 1500 * t)
hum *= np.minimum(1, t / 0.8) * np.minimum(1, (t[-1] - t) / 0.8)
place(sfx, hum, t0h, 0.14)
# zap (electricity)
n = int(0.6 * SR); t = tt(n)
zap = np.sign(np.sin(2 * np.pi * 100 * t)) * nseg(MID_N, n) * 0.5 + 0.4 * np.sin(2 * np.pi * np.cumsum(300 + 900 * t / t[-1]) / SR)
place(sfx, zap * np.exp(-t / 0.25), kp['jadilah'] + 0.05, 0.14)
# PLTU fire crackle + conveyor
kt = K['twist']
for k in range(int((kt['pltp'] - kt['siapa']) * 26)):
    place(sfx, clack() * 0.6, kt['siapa'] + rng.random() * (kt['pltp'] - kt['siapa']), 0.05, (rng.random() - 0.5))
place(sfx, noise_bed(LOW_N, kt['siapa'], kt['pltp'], 0.4), kt['siapa'], 0.12)
# magma rumble "Bumi yang merebus"
place(sfx, boom(2.5), kt['bumi'] - 0.1, 0.22)
# scale actions
kw = K['kenapa']
place(sfx, whoosh(1.0, False), kw['dipatok'], 0.25)
for k in range(12):
    n = int(0.09 * SR); t = tt(n); f = 2600 + 1600 * rng.random()
    place(sfx, np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02), kw['kontrak'] - 0.1 + k * 0.055, 0.07, 0.3)
place(sfx, boom(1.2), kw['n4'] + 0.33, 0.4)
place(sfx, ding(620, 1.0), kw['n4'] + 0.33, 0.12)
# H2S alarm + gas hiss
kg = K['gelap']
for k in range(3):
    for j, f in enumerate((880, 660)):
        n = int(0.16 * SR); t = tt(n); place(sfx, np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.005) * np.minimum(1, (t[-1] - t) / 0.01), kg['bocor'] + 0.2 + k * 0.42 + j * 0.2, 0.07)
place(sfx, noise_bed(HI_N, kg['bocor'], kg['flores'] + 0.5, 0.6), kg['bocor'], 0.05)
# Pohang rumble
n = int(3.2 * SR); t = tt(n)
place(sfx, nseg(LOW_N, n) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) * np.sin(np.pi * t / t[-1]) * 3, kg['gempa'] - 0.1, 0.35)

sfx = reverb(sfx, 1.2, 0.18, seed=5)

# ------------------------------------------------------------------ VO + mix
def read_wav(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        return x if w.getnchannels() == 1 else x.reshape(-1, 2).mean(1)


vo = read_wav(os.path.join(B, 'vo_full.wav'))
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
# light VO polish: high-pass rumble, gentle presence
vo = fft_filter(vo, lo=70)
# ducking envelope from VO (O(N) moving averages)
def movavg(x, w):
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[w:] - c[:-w]) / w
    pad = len(x) - len(y)
    return np.concatenate([np.full(pad // 2, y[0]), y, np.full(pad - pad // 2, y[-1])])


rms = np.sqrt(np.maximum(movavg(vo ** 2, int(0.05 * SR)), 0))
act = np.clip(rms / 0.03, 0, 1)
act = np.maximum(movavg(act, int(0.12 * SR)), movavg(act, int(0.5 * SR)))
duck = 1 - 0.5 * np.clip(act, 0, 1)
end_fade = np.clip((DUR - 0.25 - tt(N)) / 3.0, 0, 1)
music_n = music / (np.abs(music).max() + 1e-9)
sfx_n = sfx / (np.abs(sfx).max() + 1e-9)
vo_n = vo / (np.abs(vo).max() + 1e-9)
mix = np.stack([vo_n, vo_n], 1) * 0.92 + music_n * 0.30 * duck[:, None] * end_fade[:, None] + sfx_n * 0.55
mix = np.tanh(mix * 1.1) / np.tanh(1.1)


def write(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(p, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


write(os.path.join(B, 'music.wav'), music_n * 0.8)
write(os.path.join(B, 'sfx.wav'), sfx_n * 0.8)
write(os.path.join(B, 'mix_raw.wav'), mix * 0.9)
# loudness normalise to TikTok-friendly -14 LUFS
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', os.path.join(B, 'mix_raw.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', os.path.join(B, 'mix.wav')], check=True)
print('audio ok', round(DUR, 2), 's')
