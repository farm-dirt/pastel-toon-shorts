"""Original synthesized sound library for pastel-toon-shorts (no downloads, no samples).

Two families:
  FOLEY / ACCENTS  short sounds for actions: step_soft, step_tiny, land, land_tiny, hop_up, cloth, swish,
                   swish_small, whip_air, take_pop, take_double, pop_in, boop_q, twinkle, poof, impact_soft,
                   clatter, reveal_swell, iris_bloop, chime_soft, creak_soft, gust, heartbeat_soft, tick_clock
  AMBIENCE beds    loopable world sound, built to any length: amb_night (crickets + air), amb_day (sparse
                   birds + air), amb_indoor (room air + slow clock), amb_eerie (sparse far crickets + airy
                   whistle, never a low drone: user rule)
Design rules: soft attacks with no clicks, bright or mid-range body (no long low rumbles), every sound a
little different each time (callers pass an rng), peak-normalised by the mixer.
"""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000


def _t(d): return np.arange(int(SR * d)) / SR
def _n(rng, d): return rng.standard_normal(int(SR * d))
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lpf(x, f, order=2): return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hpf(x, f, order=2): return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)


def env(n, a=0.004, d=0.1, hold=0.0):
    """attack (s) -> hold (s) -> exponential decay with time-constant d (s); click-free ends."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.where(t < a + hold, 1.0, np.exp(-(t - a - hold) / d)))
    k = min(n, int(0.004 * SR)); e[-k:] *= np.linspace(1, 0, k)
    return e


def tone(f, d, wave='sine'):
    f = np.broadcast_to(np.asarray(f, float), (int(SR * d),)) if np.ndim(f) == 0 else f
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if wave == 'sine' else np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)


def glide(f0, f1, d, curve=1.0):
    u = np.linspace(0, 1, int(SR * d)) ** curve
    return f0 * (f1 / f0) ** u


def place(out, x, at):
    i = int(at * SR); n = min(len(x), len(out) - i)
    if n > 0: out[i:i + n] += x[:n]
    return out


# ---------------- foley ----------------
def step_soft(rng):     # soft cartoon shoe on ground: muffled heel thump + a tiny scuff
    d = 0.16; th = lpf(_n(rng, d), 420 * rng.uniform(0.85, 1.15)) * env(int(SR * d), 0.002, 0.025)
    sc = bp(_n(rng, d), 1800, 4200) * env(int(SR * d), 0.003, 0.018) * 0.25
    body = tone(glide(150, 80, d), d) * env(int(SR * d), 0.002, 0.03) * 0.5
    return th * 1.4 + sc + body
def step_tiny(rng):     # small character: lighter, higher, quicker
    d = 0.11; th = bp(_n(rng, d), 300, 1400) * env(int(SR * d), 0.0015, 0.016)
    tick = bp(_n(rng, d), 2500, 6000) * env(int(SR * d), 0.001, 0.008) * 0.3
    return th * 1.3 + tick + tone(glide(260, 160, d), d) * env(int(SR * d), 0.001, 0.02) * 0.35
def land(rng):          # landing from a hop: body thump + cloth flap
    d = 0.35; n = int(SR * d)
    thump = (tone(glide(120, 55, d, 0.6), d) * 0.8 + lpf(_n(rng, d), 300) * 0.9) * env(n, 0.002, 0.06)
    return place(thump, cloth(rng) * 0.4, 0)
def land_tiny(rng):
    d = 0.25; n = int(SR * d)
    return place((tone(glide(220, 110, d, 0.6), d) * 0.7 + bp(_n(rng, d), 200, 1200)) * env(n, 0.002, 0.04), cloth(rng) * 0.3, 0)
def hop_up(rng):        # light rising "bwip" + air
    d = 0.2; n = int(SR * d)
    return tone(glide(280, 760 * rng.uniform(0.95, 1.05), d, 0.7), d) * env(n, 0.006, 0.07) * 0.6 + bp(_n(rng, d), 1500, 5000) * env(n, 0.02, 0.05) * 0.2
def cloth(rng):         # sweater rustle for arm moves: band noise with a soft swell
    d = 0.3; n = int(SR * d); t = _t(d)
    shape = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * rng.uniform(18, 30) * t))
    return bp(_n(rng, d), 900, 5500) * shape * 0.8
def swish(rng):         # air swish (camera push, speed lines, punch)
    d = 0.32; n = int(SR * d); t = _t(d)
    out = np.zeros(n); cen = glide(700, 2600, d)
    x = _n(rng, d)
    for lo, hi in [(500, 1400), (1200, 3200), (2800, 6500)]:
        out += bp(x, lo, hi)
    shape = np.sin(np.pi * t / d) ** 2
    return out * shape * (0.6 + 0.4 * (cen / cen.max()))
def swish_small(rng):   # head turn / quick glance
    return swish(rng)[::2][: int(SR * 0.16)] * 0.7
def whip_air(rng):      # whip transition: fast doppler-ish rise and fall
    d = 0.38; n = int(SR * d); t = _t(d)
    x = bp(_n(rng, d), 600, 7000); sh = np.exp(-((t - d * 0.55) / (d * 0.18)) ** 2)
    return x * sh + tone(glide(400, 1200, d), d) * sh * 0.08
def take_pop(rng):      # eye-pop accent for a shock take: woody "plok" + bright ping on top
    d = 0.45; n = int(SR * d); f = rng.uniform(0.95, 1.05)
    wood = tone(glide(900 * f, 420 * f, 0.08), 0.08) * env(int(SR * 0.08), 0.001, 0.02)
    ping = (tone(1760 * f, d) + 0.35 * tone(3520 * f, d)) * env(n, 0.002, 0.09) * 0.35
    out = np.zeros(n); place(out, wood, 0); place(out, ping, 0.012)
    return out
def take_double(rng):
    a = take_pop(rng); out = np.zeros(int(SR * 0.6)); place(out, a * 0.6, 0); place(out, a, 0.16)
    return out
def pop_in(rng):        # bubbly pop (exclaim mark, pop transition)
    d = 0.14; n = int(SR * d)
    return tone(glide(380, 1150 * rng.uniform(0.95, 1.05), d, 0.5), d) * env(n, 0.002, 0.035) + bp(_n(rng, d), 2000, 6000) * env(n, 0.001, 0.006) * 0.4
def boop_q(rng):        # question mark: up-down "hm?"
    d = 0.3; n = int(SR * d); u = np.linspace(0, 1, n)
    f = 520 + 260 * np.sin(np.pi * u * 0.9)
    return tone(f, d, 'soft') * env(n, 0.01, 0.12) * 0.6
def twinkle(rng):       # soft glockenspiel sparkle
    out = np.zeros(int(SR * 0.9)); base = rng.choice([1568, 1760, 2093])
    for k, r in enumerate([1, 1.25, 1.5, 2.0]):
        d = 0.5; n = int(SR * d); f = base * r
        x = (tone(f, d) + 0.3 * tone(f * 2.76, d)) * env(n, 0.001, 0.12) * (0.6 - 0.08 * k)
        place(out, x, k * rng.uniform(0.05, 0.08))
    return out
def poof(rng):          # puff of dust / smoke
    d = 0.4; n = int(SR * d)
    return lpf(_n(rng, d), 1800) * env(n, 0.01, 0.09) + bp(_n(rng, d), 3000, 7000) * env(n, 0.004, 0.03) * 0.3
def impact_soft(rng):   # cartoon impact: punchy mid thud + crack + short tail (no long rumble)
    d = 0.6; n = int(SR * d)
    body = tone(glide(180, 60, d, 0.3), d) * env(n, 0.001, 0.09)
    crack = bp(_n(rng, d), 1500, 6000) * env(n, 0.0005, 0.015) * 0.6
    tail = lpf(_n(rng, d), 900) * env(n, 0.002, 0.12) * 0.5
    return body + crack + tail
def clatter(rng):       # small debris / pebbles
    out = np.zeros(int(SR * 0.8))
    for _ in range(rng.integers(7, 12)):
        d = 0.05; n = int(SR * d); f = rng.uniform(1800, 4200)
        x = (tone(f, d) * 0.5 + bp(_n(rng, d), 1500, 7000)) * env(n, 0.0005, 0.01)
        place(out, x * rng.uniform(0.3, 1.0), rng.uniform(0, 0.6) ** 1.6)
    return out
def reveal_swell(rng):  # reverse-cymbal style swell that peaks ON the reveal (cue it ~0.55 s early)
    d = 0.6; n = int(SR * d); t = _t(d)
    sh = (t / d) ** 2.6
    x = hpf(_n(rng, d), 2500) * 0.6 + tone(glide(600, 1400, d), d) * 0.08
    out = x * sh; k = int(0.01 * SR); out[-k:] *= np.linspace(1, 0, k)
    return out
def iris_bloop(rng):    # iris close: descending soft "bwoooop"
    d = 0.5; n = int(SR * d)
    return tone(glide(900, 180, d, 0.8), d, 'soft') * env(n, 0.01, 0.2) * 0.6
def chime_soft(rng):    # gentle realisation chime
    out = np.zeros(int(SR * 1.4))
    for k, f in enumerate([1046.5, 1318.5, 1568]):
        d = 1.2; n = int(SR * d); place(out, (tone(f, d) + 0.2 * tone(f * 3, d)) * env(n, 0.003, 0.35) * 0.5, k * 0.07)
    return out
def creak_soft(rng):    # wood creak (door, floorboard, post): pulse train through a resonant band
    d = 0.7; n = int(SR * d); t = _t(d)
    rate = 40 + 50 * np.sin(np.pi * t / d) + rng.uniform(-8, 8)
    pulses = (np.diff(np.floor(np.cumsum(rate) / SR), prepend=0) > 0).astype(float)
    x = bp(pulses + 0.05 * _n(rng, d), 500, 2200)
    return x * np.sin(np.pi * t / d) ** 0.8 * 3
def gust(rng):          # airy wind gust (high/mid, NOT a low rumble)
    d = 1.2; n = int(SR * d); t = _t(d)
    x = bp(_n(rng, d), 700, 4000); sh = np.sin(np.pi * t / d) ** 2 * (0.75 + 0.25 * np.sin(2 * np.pi * 2.3 * t))
    return x * sh
def heartbeat_soft(rng):  # one lub-dub, mid body so phones play it
    out = np.zeros(int(SR * 0.7))
    for at, a in [(0, 1.0), (0.17, 0.7)]:
        d = 0.15; n = int(SR * d)
        place(out, (tone(glide(110, 70, d), d) + 0.4 * tone(glide(220, 140, d), d)) * env(n, 0.004, 0.035) * a, at)
    return out
def tick_clock(rng):
    d = 0.03; n = int(SR * d)
    return bp(_n(rng, d), 2500, 7000) * env(n, 0.0003, 0.004)


FOLEY = {k: v for k, v in dict(globals()).items() if callable(v) and k in (
    'step_soft step_tiny land land_tiny hop_up cloth swish swish_small whip_air take_pop take_double pop_in boop_q '
    'twinkle poof impact_soft clatter reveal_swell iris_bloop chime_soft creak_soft gust heartbeat_soft tick_clock').split()}


# ---------------- ambience beds (built to length, quiet, loop-free) ----------------
def _air(rng, d, lo=1200, hi=6000):
    t = _t(d); x = bp(_n(rng, d), lo, hi)
    return x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t + rng.uniform(0, 6)))


def amb_night(rng, d, sparse=False):
    out = _air(rng, d) * 0.25
    for voice in range(2 if sparse else 4):           # a few crickets, each its own pitch and rhythm
        f = rng.uniform(3900, 5200); rate = rng.uniform(1.4, 2.6) * (0.6 if sparse else 1)
        pan_gain = rng.uniform(0.4, 1.0); at = rng.uniform(0, 1)
        while at < d:
            nchirp = rng.integers(2, 4)
            for c in range(nchirp):
                cd = 0.045; n = int(SR * cd); tt = _t(cd)
                chirp = tone(f, cd) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 55 * tt))) * env(n, 0.004, 0.02) * pan_gain
                place(out, chirp * 0.5, at + c * 0.07)
            at += 1 / rate * rng.uniform(0.7, 1.4) * (2.5 if sparse else 1)
    return out


def amb_day(rng, d):
    out = _air(rng, d, 800, 5000) * 0.3
    at = rng.uniform(0.3, 1.5)
    while at < d:                                     # sparse little birds: 2-4 note chirps
        base = rng.uniform(2600, 4200)
        for k in range(rng.integers(2, 5)):
            cd = rng.uniform(0.05, 0.1); n = int(SR * cd)
            f = glide(base * rng.uniform(0.9, 1.1), base * rng.uniform(1.1, 1.5), cd)
            place(out, tone(f, cd) * env(n, 0.005, 0.03) * 0.35, at + k * rng.uniform(0.08, 0.14))
        at += rng.uniform(1.6, 4.0)
    return out


def amb_indoor(rng, d):
    out = _air(rng, d, 300, 3000) * 0.22
    t = 0.4
    while t < d:
        place(out, tick_clock(rng) * 0.35, t); t += 1.0
    return out


def amb_eerie(rng, d):
    out = amb_night(rng, d, sparse=True) * 0.8
    t = _t(d); f = 900 + 60 * np.sin(2 * np.pi * 0.11 * t)  # far, thin airy whistle (high, not a drone)
    out += bp(_n(rng, d), 700, 1300) * (0.25 + 0.2 * np.sin(2 * np.pi * 0.09 * t) ** 2) * 0.5
    out += tone(f, d) * 0.006
    return out


AMBIENCE = {'night': amb_night, 'day': amb_day, 'indoor': amb_indoor, 'eerie': amb_eerie}
# location -> bed; scene "ambience": "<bed>" or false overrides; mood eerie/dark/danger at night -> eerie
LOC_BED = {'park': 'day', 'street': 'day', 'shop': 'indoor', 'kitchen': 'indoor', 'night': 'night'}
