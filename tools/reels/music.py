"""Original background track for KAIRO AI reels (no third-party rights).

Minimal, clean electronic at 120 BPM, 24 s = 12 bars of 2 s. Structure follows the reel's scenes:
  0-4 s   intro: pad + filtered arp, riser into the drop
  4-10 s  groove in: kick, offbeat hats, bass; a "tick" on each row that turns automatic
  10-18 s full groove: claps, brighter arp
  18-22 s final: chime on the CTA
  22-24 s drums out, final chord rings and fades

Usage: python3 music.py out.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = 4 * BEAT           # 2.0 s
DUR = 24.0
N = int(SR * DUR)
rng = np.random.default_rng(11)

# per-bar chords (pad voicing, bass root) — Am9 F C G | Am9 F C G | Am9 F G Am9
AM9, FMAJ7, CMAJ7, G6 = [57, 60, 64, 67, 71], [53, 57, 60, 64], [55, 60, 64, 71], [55, 59, 62, 64]
CHORDS = [AM9, FMAJ7, CMAJ7, G6, AM9, FMAJ7, CMAJ7, G6, AM9, FMAJ7, G6, AM9]
ROOTS = [45, 41, 48, 43, 45, 41, 48, 43, 45, 41, 43, 45]

GROOVE_START, GROOVE_END = 4.0, 22.0
CLAP_START = 10.0
TICKS = [6.5, 7.0, 7.5, 8.0, 8.5]          # rows switching to "automático"
IMPACTS = [4.0, 10.0, 14.0, 18.0, 22.0]    # scene cuts
CHIME = 20.0                               # CTA appears

# optional per-video overrides: MUSIC_CFG='{"impacts":[...],"ticks":[...],"tick_notes":[...],"fix_ticks":[...],"chime":20.6}'
import os as _os, json as _json
_cfg = _json.loads(_os.environ.get("MUSIC_CFG", "{}"))
IMPACTS = _cfg.get("impacts", IMPACTS)
TICKS = _cfg.get("ticks", TICKS)
CHIME = _cfg.get("chime", CHIME)
FIX_TICKS = _cfg.get("fix_ticks", [])
TICK_NOTES = _cfg.get("tick_notes", [81, 84, 88, 91, 93])


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return 2.0 * np.mod(freq * t + phase, 1.0) - 1.0


def env_adsr(n, a, r, sustain_len):
    """attack a s, hold until sustain_len s, release r s (linear-ish, smooth)."""
    t = np.arange(n) / SR
    e = np.clip(t / a, 0, 1)
    e = e * np.where(t < sustain_len, 1.0, np.exp(-(t - sustain_len) / (r / 4)))
    return e


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(round(start * SR))
        if i >= N or i + len(sig) <= 0:
            return
        s0 = max(0, -i)
        i = max(0, i)
        j = min(N, i + len(sig) - s0)
        th = (pan + 1) * np.pi / 4
        seg = sig[s0:s0 + (j - i)] * gain
        self.L[i:j] += seg * np.cos(th)
        self.R[i:j] += seg * np.sin(th)

    def stereo(self):
        return np.stack([self.L, self.R])


pad, bass, drums, arp, fx = Bus(), Bus(), Bus(), Bus(), Bus()

# ---------------- pad: detuned saws, dark in the intro, opening up later ----------------
for k, chord in enumerate(CHORDS):
    start = k * BAR
    is_last = k == len(CHORDS) - 1
    hold = (DUR - start) if is_last else BAR
    n = int((hold + 0.8) * SR)
    e = env_adsr(n, 0.35 if k else 0.8, 1.6 if is_last else 0.7, hold)
    for m in chord:
        f = mtof(m)
        for cents, pan in ((-9, -0.65), (0, 0.0), (9, 0.65)):
            v = saw(f * 2 ** (cents / 1200), n, rng.random()) * e
            pad.add(v, start, gain=0.07, pan=pan)
# brightness automation: crossfade a dark and a bright filtered copy
pad_st = pad.stereo()
dark = np.stack([lp(ch, 650, 2) for ch in pad_st])
bright = np.stack([lp(ch, 3400, 2) for ch in pad_st])
t = np.arange(N) / SR
mix = np.clip((t - 0.0) / 4.0, 0, 1) * 0.55 + np.clip((t - 10.0) / 8.0, 0, 1) * 0.45
mix = np.where(t > 22.0, mix * np.exp(-(t - 22.0) / 1.2), mix)
pad_st = dark * (1 - mix) + bright * mix

# ---------------- kick + sidechain envelope ----------------
side = np.ones(N)
kick_n = int(0.45 * SR)
tk = np.arange(kick_n) / SR
freq = 52 + (140 - 52) * np.exp(-tk / 0.03)
kick = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-tk / 0.15)
kick += hp(rng.standard_normal(kick_n), 2500) * np.exp(-tk / 0.004) * 0.12
kick = np.tanh(kick * 1.6) / np.tanh(1.6)
beat_times = np.arange(GROOVE_START, GROOVE_END - 1e-6, BEAT)
for bt in beat_times:
    drums.add(kick, bt, gain=0.40)
    i = int(bt * SR)
    j = min(N, i + int(0.45 * SR))
    side[i:j] = np.minimum(side[i:j], 1 - 0.35 * np.exp(-np.arange(j - i) / SR / 0.12))

# ---------------- hats ----------------
hat_n = int(0.08 * SR)
th = np.arange(hat_n) / SR
for bt in beat_times:
    h = hp(rng.standard_normal(hat_n), 7500, 2) * np.exp(-th / 0.03)
    drums.add(h, bt + BEAT / 2, gain=0.27 * (0.85 + 0.3 * rng.random()), pan=0.25)
    if bt >= CLAP_START:  # quiet 16th ghosts in the full groove
        for off in (0.25, 0.75):
            g = hp(rng.standard_normal(hat_n), 9000, 2) * np.exp(-th / 0.015)
            drums.add(g, bt + BEAT * off, gain=0.085 * (0.7 + 0.6 * rng.random()), pan=-0.3)

# ---------------- claps on 2 and 4 ----------------
clap_n = int(0.3 * SR)
tc = np.arange(clap_n) / SR
clap = np.zeros(clap_n)
for d in (0.0, 0.011, 0.022):
    i = int(d * SR)
    burst = bp(rng.standard_normal(clap_n - i), 900, 3200) * np.exp(-tc[: clap_n - i] / (0.012 if d < 0.02 else 0.11))
    clap[i:] += burst
for bt in beat_times:
    if bt >= CLAP_START and int(round((bt - GROOVE_START) / BEAT)) % 2 == 1:
        drums.add(clap, bt, gain=0.22)

# ---------------- bass: offbeat house-style pumps, phone-audible harmonics + sub ----------------
for bt in beat_times:
    k = int(bt // BAR)
    f = mtof(ROOTS[k])
    n = int(0.24 * SR)
    tb = np.arange(n) / SR
    e = np.clip(tb / 0.005, 0, 1) * np.exp(-tb / 0.11)
    body = lp(saw(f, n), 850, 2) * e
    sub = np.sin(2 * np.pi * (f / 2) * tb) * e
    bass.add(np.tanh(1.8 * body) * 0.9 + sub * 0.28, bt + BEAT / 2, gain=0.36)

# ---------------- arp: 8th-note plucks with ping-pong dotted-8th delay ----------------
arp_dry = Bus()
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
for k, chord in enumerate(CHORDS[:-1]):
    tones = sorted(chord)[:4]
    for s in range(8):
        tn = k * BAR + s * (BEAT / 2)
        m = tones[pattern[s] % len(tones)] + 12
        n = int(0.32 * SR)
        ta = np.arange(n) / SR
        f = mtof(m)
        wave = 0.6 * saw(f, n) + 0.4 * np.sign(np.sin(2 * np.pi * f * ta))
        cutoff = 1800 if tn < GROOVE_START else (3200 if tn < CLAP_START else 4800)
        note = lp(wave, cutoff, 2) * np.exp(-ta / 0.13) * np.clip(ta / 0.003, 0, 1)
        accent = 1.0 if s % 2 == 0 else 0.75
        level = 0.75 if tn < GROOVE_START else 1.0
        arp_dry.add(note, tn, gain=0.15 * accent * level)
arp_st = arp_dry.stereo()
dly = int(0.375 * SR)
wetL, wetR = np.zeros(N), np.zeros(N)
src = arp_st.mean(axis=0)
for tap in range(1, 5):
    g = 0.38 ** tap
    shift = dly * tap
    if shift >= N:
        break
    target = wetL if tap % 2 else wetR
    target[shift:] += lp(src[: N - shift], 3000 - 400 * tap, 1) * g
arp_st = arp_st + np.stack([wetL, wetR])

# ---------------- fx: risers, impacts, ticks, chime ----------------
for imp in IMPACTS:
    big = imp in (4.0, 22.0)
    rl = 1.0 if imp == 4.0 else 0.5
    nr = int(rl * SR)
    tr = np.arange(nr) / SR
    riser = bp(rng.standard_normal(nr), 1500, 7000) * (tr / rl) ** 2.2
    if imp != 22.0:
        fx.add(riser, imp - rl, gain=0.07 if big else 0.04)
    ni = int(1.4 * SR)
    ti = np.arange(ni) / SR
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-ti / 0.06)) * ti) * np.exp(-ti / (0.45 if big else 0.25))
    air = lp(rng.standard_normal(ni), 5000) * np.exp(-ti / 0.35)
    fx.add(boom, imp, gain=0.17 if big else 0.07)
    fx.add(air, imp, gain=0.05 if big else 0.025)

for tt, m in list(zip(TICKS, TICK_NOTES)) + list(zip(FIX_TICKS, [81, 84, 88, 91, 93])):
    n = int(0.25 * SR)
    tq = np.arange(n) / SR
    f = mtof(m)
    tick = (np.sin(2 * np.pi * f * tq) + 0.3 * np.sin(2 * np.pi * 2 * f * tq)) * np.exp(-tq / 0.06)
    fx.add(tick, tt, gain=0.085, pan=0.15)

for m, d in ((69, 0.0), (76, 0.06), (83, 0.12)):  # A4 E5 B5 bell on the CTA
    n = int(1.8 * SR)
    tq = np.arange(n) / SR
    f = mtof(m)
    bell = sum(a * np.sin(2 * np.pi * f * r * tq) * np.exp(-tq / dec)
               for r, a, dec in ((1, 1.0, 0.9), (2.0, 0.35, 0.5), (3.01, 0.15, 0.25)))
    fx.add(bell, CHIME + d, gain=0.06, pan=(-0.3 + d * 4))

# ---------------- mix ----------------
pad_st = pad_st * side
bass_st = bass.stereo() * side
drums_st = drums.stereo()
fx_st = fx.stereo()

# reverb send (stereo decorrelated noise IR, ~2 s)
ir_n = int(2.4 * SR)
tir = np.arange(ir_n) / SR
irL = lp(rng.standard_normal(ir_n), 6000) * np.exp(-tir / 0.55)
irR = lp(rng.standard_normal(ir_n), 6000) * np.exp(-tir / 0.55)
irL /= np.sqrt(np.sum(irL ** 2))
irR /= np.sqrt(np.sum(irR ** 2))
send = 0.35 * pad_st + 0.45 * arp_st + 0.5 * fx_st + 0.25 * np.stack([np.zeros(N), np.zeros(N)])
clap_only = drums_st  # small room on drums
send = send + 0.08 * clap_only
send = hp(send, 250)
wet = np.stack([fftconvolve(send[0], irL)[:N], fftconvolve(send[1], irR)[:N]])

master = 1.0 * pad_st + 0.9 * bass_st + 1.0 * drums_st + 0.9 * arp_st + 1.0 * fx_st + 0.28 * wet
master = hp(master, 28)

# gentle glue + soft clip, fade the very end
master = np.tanh(master * 1.25) / 1.25
fade = np.ones(N)
fs = int(22.6 * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 1.5
master = master * fade
master = master / np.max(np.abs(master)) * 10 ** (-1.0 / 20)

out = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
pcm = (master.T * 32767).astype(np.int16)
import wave
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

# quick report
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)

print("wrote", out)
for s in range(0, 24, 2):
    seg = master[:, s * SR:(s + 2) * SR]
    print(f"{s:2d}-{s+2:2d}s  rms {rms_db(seg):6.1f} dBFS")
corr = np.corrcoef(master[0], master[1])[0, 1]
print("L/R correlation", round(float(corr), 3), "| nan:", bool(np.isnan(master).any()))
