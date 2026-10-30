"""music.py OUT_WAV SECONDS - original lo-fi bed: Rhodes-style keys, bass, soft drums, vinyl crackle. 82 BPM, loops cleanly."""
import sys, numpy as np, soundfile as sf
SR = 48000; BPM = 82; beat = 60 / BPM
out, secs = sys.argv[1], float(sys.argv[2])
N = int((secs + 2) * SR); mixL = np.zeros(N); mixR = np.zeros(N)
rng = np.random.default_rng(11)
def env(n, a, d, s=0.0, r=0.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / a) * (s + (1 - s) * np.exp(-t / d))
    if r: e *= np.clip((n / SR - t) / r, 0, 1)
    return e
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    j = min(N, i + len(sig)); sig = sig[: j - i] * gain
    mixL[i:j] += sig * (1 - max(0, pan)); mixR[i:j] += sig * (1 + min(0, pan))
def lp(x, a):  # one-pole low-pass
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def keys(midi, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(midi)
    trem = 1 + 0.18 * np.sin(2 * np.pi * 4.2 * t)
    s = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 3)) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2)
    return s * trem * env(n, 0.01, 1.4, 0.25, 0.3)
def bass(midi, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(midi)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env(n, 0.01, 0.9, 0.5, 0.15)
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.18)
def snare():
    n = int(0.25 * SR); x = rng.standard_normal(n); x = x - lp(x, 0.15)
    return 0.6 * lp(x, 0.5) * env(n, 0.002, 0.07) + 0.3 * np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, 0.002, 0.04)
def hat():
    n = int(0.06 * SR); x = rng.standard_normal(n); x = x - lp(x, 0.4); return x * env(n, 0.001, 0.015)
# Fmaj9 - Em7 - Dm9 - Cmaj7  (bar each)
prog = [([53, 57, 60, 64, 67], 41), ([52, 55, 59, 62], 40), ([50, 53, 57, 60, 64], 38), ([48, 52, 55, 59], 36)]
bar = 4 * beat; t = 0.0; b = 0
while t < secs + bar:
    chord, root = prog[b % 4]
    for i, m in enumerate(chord): add(keys(m, bar * 0.98), t + i * 0.012, 0.11, pan=(i - 2) * 0.15)
    add(keys(chord[-1] + 12, beat * 1.2), t + beat * 2.5, 0.05, 0.3)       # little top-line answer
    add(bass(root - 12, beat * 1.6), t, 0.32); add(bass(root - 12, beat * 0.9), t + beat * 2.5, 0.26)
    for q in range(4):
        sw = 0.06 * beat
        if q in (0, 2): add(kick(), t + q * beat + (0.5 * beat if q == 2 and b % 2 else 0), 0.55)
        if q in (1, 3): add(snare(), t + q * beat, 0.32)
        add(hat(), t + q * beat, 0.12, 0.4); add(hat(), t + q * beat + beat / 2 + sw, 0.08, 0.4)
    t += bar; b += 1
crackle = np.zeros(N); idx = rng.integers(0, N, int(secs * 40)); crackle[idx] = rng.uniform(-1, 1, len(idx))
crackle = lp(crackle, 0.3) * 0.25 + lp(rng.standard_normal(N), 0.02) * 0.01
mix = np.stack([lp(mixL, 0.35) + crackle, lp(mixR, 0.35) + crackle], 1)[: int(secs * SR)]
fade = int(0.8 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]; mix[: int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))[:, None]
mix /= np.abs(mix).max() + 1e-9; sf.write(out, mix * 0.8, SR); print("music", out)
