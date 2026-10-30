"""sfx.py - synthesised sound effects (48 kHz), no licensing needed."""
import math
import numpy as np
# ---------- SFX (synthesised, 48 kHz) ----------
SR = 48000
def _env(n, a=0.004, d=0.12):
    t = np.arange(n) / SR; e = np.minimum(1, t / a) * np.exp(-t / d); return e
def sfx_pop():
    n = int(0.16 * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 22) + 260
    return 0.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.05)
def sfx_whoosh(dur=0.35):
    n = int(dur * SR); x = np.random.default_rng(1).standard_normal(n)
    y = np.zeros(n); a = 0.0
    for i in range(n):  # sweeping one-pole low-pass
        c = 0.02 + 0.25 * math.sin(math.pi * i / n); a += c * (x[i] - a); y[i] = a
    return 1.6 * y * np.sin(np.linspace(0, math.pi, n)) ** 2
def sfx_ding(f0=1568):
    n = int(0.6 * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f0 * m * t) for m, a in ((1, 1), (2.76, .5), (5.4, .25)))
    return 0.35 * s * _env(n, 0.002, 0.18)
def sfx_tick():
    n = int(0.04 * SR); return 0.45 * np.random.default_rng(2).standard_normal(n) * _env(n, 0.0005, 0.006)
def sfx_thud():
    n = int(0.25 * SR); t = np.arange(n) / SR; f = 140 * np.exp(-t * 12) + 45
    return 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.08)
def sfx_scribble(dur=0.4):
    n = int(dur * SR); x = np.random.default_rng(3).standard_normal(n)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * np.arange(n) / SR) ** 2
    hp = np.diff(np.concatenate([[0], x])); return 0.12 * hp * am * np.sin(np.linspace(0, math.pi, n))
def mix_sfx(events, total):
    out = np.zeros(int(total * SR) + SR)
    for t0, snd, gain in events:
        i = int(t0 * SR); out[i:i + len(snd)] += gain * snd[: max(0, len(out) - i)]
    return out[: int(total * SR)]
