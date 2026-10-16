"""Calmer original background track for KAIRO AI reels (no third-party rights).

Same 120 BPM grid as music.py (2 s bars, so cuts still land on downbeats) but half-time feel:
soft kick on 1 and 3, a gentle rim on 3, light swung shaker, warm pad, electric-piano chords,
round sustained bass, no risers or booms. Modern but in the background.

Usage: python3 music_chill.py out.wav            (optional env MUSIC_CFG like music.py: ticks, fix_ticks, chime)
"""
import json
import os
import sys
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BEAT = 0.5
BAR = 2.0
DUR = 24.0
N = int(SR * DUR)
rng = np.random.default_rng(23)

AM9, FMAJ7, CMAJ7, G6 = [57, 60, 64, 67, 71], [53, 57, 60, 64], [55, 60, 64, 71], [55, 59, 62, 64]
CHORDS = [AM9, FMAJ7, CMAJ7, G6, AM9, FMAJ7, CMAJ7, G6, AM9, FMAJ7, G6, AM9]
ROOTS = [45, 41, 48, 43, 45, 41, 48, 43, 45, 41, 43, 45]
DRUMS_START, DRUMS_END = 4.0, 20.0

cfg = json.loads(os.environ.get("MUSIC_CFG", "{}"))
TICKS = cfg.get("ticks", [])
TICK_NOTES = cfg.get("tick_notes", [76, 74, 72, 71, 69])
FIX_TICKS = cfg.get("fix_ticks", [])
CHIME = cfg.get("chime", None)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(round(start * SR))
        if i >= N:
            return
        j = min(N, i + len(sig))
        th = (pan + 1) * np.pi / 4
        seg = sig[: j - i] * gain
        self.L[i:j] += seg * np.cos(th)
        self.R[i:j] += seg * np.sin(th)

    def st(self):
        return np.stack([self.L, self.R])


pad, keys, bass, drums, fx = Bus(), Bus(), Bus(), Bus(), Bus()
t_all = np.arange(N) / SR

# ---- warm pad: detuned triangles, low cutoff, slow attack ----
for k, chord in enumerate(CHORDS):
    start = k * BAR
    last = k == len(CHORDS) - 1
    hold = (DUR - start) if last else BAR
    n = int((hold + 1.2) * SR)
    t = np.arange(n) / SR
    env = np.clip(t / 0.7, 0, 1) * np.where(t < hold, 1.0, np.exp(-(t - hold) / 0.35))
    for m in chord:
        for cents, pan in ((-7, -0.6), (7, 0.6)):
            f = mtof(m) * 2 ** (cents / 1200)
            tri = 2 * np.abs(2 * np.mod(f * t + rng.random(), 1) - 1) - 1
            pad.add(lp(tri, 1600) * env, start, gain=0.05, pan=pan)

# ---- electric piano: chord stabs on the "and" of 2 and on 4, soft bell attack, long decay ----
def epiano(f, n):
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.25)
            + 0.12 * np.sin(2 * np.pi * 3.0 * f * t) * np.exp(-t / 0.08))
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return tone * np.exp(-t / 0.9) * np.clip(t / 0.004, 0, 1) * trem

for k, chord in enumerate(CHORDS[:-1]):
    voicing = sorted(chord)[1:]  # leave the low note to the bass
    for off, vel in ((1.25, 0.8), (1.5, 0.6)) if k < 2 else ((0.75, 0.75), (1.5, 0.9), (1.75, 0.5)):
        for idx, m in enumerate(voicing):
            n = int(1.6 * SR)
            keys.add(epiano(mtof(m + 12), n), k * BAR + off + idx * 0.012, gain=0.058 * vel, pan=-0.25 + 0.15 * idx)
# final chord rung once, gently
for idx, m in enumerate(sorted(CHORDS[-1])[1:]):
    keys.add(epiano(mtof(m + 12), int(2.5 * SR)), 22.0 + idx * 0.02, gain=0.05, pan=-0.2 + 0.12 * idx)

# ---- bass: round sustained notes, two per bar ----
for k, root in enumerate(ROOTS):
    if k * BAR < DRUMS_START - BAR:  # enters on bar 2
        continue
    for off, length in ((0.0, 1.3), (1.5, 0.45)):
        n = int(length * SR)
        t = np.arange(n) / SR
        f = mtof(root)
        env = np.clip(t / 0.02, 0, 1) * np.exp(-t / (0.9 if off == 0 else 0.3))
        tone = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.35 * np.sin(np.pi * f * t)
        bass.add(np.tanh(1.3 * tone) * env, k * BAR + off, gain=0.24)

# ---- drums: half-time, soft ----
kick_n = int(0.35 * SR)
tk = np.arange(kick_n) / SR
kick = np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-tk / 0.025)) / SR) * np.exp(-tk / 0.13)
rim_n = int(0.12 * SR)
tr = np.arange(rim_n) / SR
rim = bp(rng.standard_normal(rim_n), 1800, 5000) * np.exp(-tr / 0.02) * 0.6 + np.sin(2 * np.pi * 820 * tr) * np.exp(-tr / 0.015) * 0.4
sh_n = int(0.07 * SR)
ts = np.arange(sh_n) / SR
t = DRUMS_START
while t < DRUMS_END - 1e-6:
    pos = round((t - DRUMS_START) / BEAT) % 4
    if pos in (0, 2) and not (pos == 2 and rng.random() < 0.0):
        drums.add(kick, t, gain=0.26 if pos == 0 else 0.18)
    if pos == 2:
        drums.add(rim, t, gain=0.11, pan=0.1)
    for e, swing in ((0, 0.0), (1, 0.035)):  # swung 8th shaker
        sh = hp(rng.standard_normal(sh_n), 6000) * np.exp(-ts / 0.025) * np.clip(ts / 0.006, 0, 1)
        drums.add(sh, t + e * BEAT / 2 + swing, gain=(0.035 if e == 0 else 0.055) * (0.8 + 0.4 * rng.random()), pan=0.3)
    t += BEAT

# ---- fx: soft marimba ticks and a gentle chime ----
def marimba(f, n):
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / 0.02)) * np.exp(-t / 0.18)

for tt, m in list(zip(TICKS, TICK_NOTES)) + list(zip(FIX_TICKS, [81, 84, 88, 91, 93])):
    fx.add(marimba(mtof(m), int(0.5 * SR)), tt, gain=0.06, pan=0.15)
if CHIME is not None:
    for m, d in ((69, 0.0), (76, 0.08), (83, 0.16)):
        fx.add(marimba(mtof(m), int(1.2 * SR)), CHIME + d, gain=0.05, pan=-0.3 + d * 3)

# ---- mix: light sidechain, big soft reverb ----
side = np.ones(N)
t = DRUMS_START
while t < DRUMS_END - 1e-6:
    i = int(t * SR)
    j = min(N, i + int(0.5 * SR))
    side[i:j] = np.minimum(side[i:j], 1 - 0.15 * np.exp(-np.arange(j - i) / SR / 0.15))
    t += 2 * BEAT

ir_n = int(3.0 * SR)
tir = np.arange(ir_n) / SR
irs = []
for _ in range(2):
    ir = lp(rng.standard_normal(ir_n), 5000) * np.exp(-tir / 0.8)
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
send = hp(0.45 * pad.st() + 0.55 * keys.st() + 0.6 * fx.st() + 0.08 * drums.st(), 200)
wet = np.stack([fftconvolve(send[0], irs[0])[:N], fftconvolve(send[1], irs[1])[:N]])

master = pad.st() * side + 1.0 * keys.st() + bass.st() * side + drums.st() + fx.st() + 0.32 * wet
master = hp(master, 30)
master = np.tanh(master * 1.1) / 1.1
fade = np.ones(N)
fs = int(22.4 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.6
fade[: int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
master = master * fade
master = master / np.max(np.abs(master)) * 10 ** (-1.0 / 20)

out = sys.argv[1] if len(sys.argv) > 1 else "music_chill.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((master.T * 32767).astype(np.int16).tobytes())


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)


print("wrote", out)
for s in range(0, 24, 4):
    print(f"{s:2d}-{s+4:2d}s  rms {rms_db(master[:, s*SR:(s+4)*SR]):6.1f} dBFS")
