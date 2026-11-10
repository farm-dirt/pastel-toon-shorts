#!/usr/bin/env python3
"""Synthesize SFX + music bed and mix them under the voice-over.

usage: python3 audio.py PROJECT_DIR
reads  PROJECT_DIR/project-files/project.json  (sfx cues, music settings)
       PROJECT_DIR/project-files/timing.json
       PROJECT_DIR/voice-over/<voice file named in project.json>
writes PROJECT_DIR/audio/mix.wav  (final, -14 LUFS, true peak <= -1 dBFS)
       PROJECT_DIR/audio/mix.mp3  (for the browser preview)

LEVELS (user preference: background must never fight the voice):
  music  = 8 % of the voice level during speech (-22 dB), rises to 14 % in long pauses
  sfx    = peaks at 35 % of the voice peak
Override in project.json: "mix": {"music": 0.08, "musicPause": 0.14, "sfx": 0.35}
"""
import json, os, subprocess, sys, re
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env_ad(n, a=0.005, d=None):
    e = np.ones(n)
    na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if d:
        e *= np.exp(-np.arange(n) / (d * SR))
    return e


def sweep(f0, f1, d, wave='sine'):
    f = np.geomspace(f0, f1, int(SR * d)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if wave == 'sine' else np.sign(np.sin(ph)) * 0.5


def noise(d):
    return rng.standard_normal(int(SR * d))


def lp(x, a):  # one-pole low-pass, a in (0,1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


# ---------------- SFX library (all original, synthesized) ----------------
def sfx_pop():      return sweep(900, 300, 0.07) * env_ad(int(0.07 * SR), 0.002, 0.02)
def sfx_boing():
    d = 0.55; t = t_(d); f = 220 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.004, 0.25)
def sfx_whoosh():
    d = 0.4; n = noise(d); t = t_(d); a = 0.02 + 0.5 * np.sin(np.pi * t / d) ** 2
    return lp(n, 0.08) * np.sin(np.pi * t / d) ** 2 * 3 * a
def sfx_thud():     return (sweep(160, 45, 0.25) + 0.3 * lp(noise(0.25), 0.05)) * env_ad(int(0.25 * SR), 0.002, 0.07)
def sfx_bonk():     return (sweep(700, 500, 0.18) * 0.6 + sweep(1400, 1000, 0.18) * 0.3) * env_ad(int(0.18 * SR), 0.001, 0.05)
def sfx_ding():
    t = t_(1.0); return (np.sin(2 * np.pi * 1568 * t) + 0.4 * np.sin(2 * np.pi * 3136 * t) + 0.2 * np.sin(2 * np.pi * 4700 * t)) * env_ad(len(t), 0.002, 0.3) * 0.6
def sfx_sparkle():
    out = np.zeros(int(0.7 * SR))
    for k, f in enumerate([2093, 2637, 3136, 4186, 3520]):
        s = int(k * 0.08 * SR); t = t_(0.3); tone = np.sin(2 * np.pi * f * t) * env_ad(len(t), 0.002, 0.08)
        out[s:s + len(tone)] += tone[:len(out) - s] * 0.5
    return out
def sfx_slide_up():   return sweep(300, 1500, 0.45) * env_ad(int(0.45 * SR), 0.01) * 0.7
def sfx_slide_down(): return sweep(1500, 250, 0.5) * env_ad(int(0.5 * SR), 0.01) * 0.7
def sfx_tick():       return lp(noise(0.03), 0.6) * env_ad(int(0.03 * SR), 0.0005, 0.006)
def sfx_gulp():       return sweep(500, 180, 0.12) * env_ad(int(0.12 * SR), 0.003, 0.05) + np.concatenate([np.zeros(int(.13*SR)), sweep(420, 160, 0.12) * env_ad(int(0.12 * SR), 0.003, 0.05)])[:int(0.12*SR)]
def sfx_drumroll():
    d = 1.2; out = np.zeros(int(d * SR))
    for k in range(int(d * 22)):
        s = int(k / 22 * SR); h = lp(noise(0.05), 0.3) * env_ad(int(0.05 * SR), 0.001, 0.015) * (0.4 + 0.6 * k / (d * 22))
        out[s:s + len(h)] += h[:len(out) - s]
    return out
def sfx_tada():
    out = np.zeros(int(1.2 * SR))
    for s0, fs in [(0, [523, 659, 784]), (0.16, [523, 659, 784, 1047])]:
        t = t_(1.0 if s0 else 0.15); ch = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.12 + np.sin(2 * np.pi * f * t) * 0.2 for f in fs)
        ch *= env_ad(len(t), 0.005, 0.5 if s0 else 0.08); s = int(s0 * SR); out[s:s + len(ch)] += ch[:len(out) - s]
    return out
def sfx_wahwah():
    out = np.zeros(int(2.0 * SR))
    for k, f in enumerate([392, 370, 349, 330]):
        d = 0.9 if k == 3 else 0.38; t = t_(d); vib = 1 + (0.03 * np.sin(2 * np.pi * 6 * t) if k == 3 else 0)
        tone = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f * vib) / SR)), 0.15) * env_ad(len(t), 0.02, 0.6)
        s = int(k * 0.4 * SR); out[s:s + len(tone)] += tone[:len(out) - s] * 0.6
    return out
def sfx_footstep():  return lp(noise(0.06), 0.15) * env_ad(int(0.06 * SR), 0.001, 0.015) * 1.5
def sfx_record_scratch():
    d = 0.35; t = t_(d); f = 600 * np.abs(np.sin(2 * np.pi * 5 * t)) + 100
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lp(noise(d), 0.3) * 0.5) * env_ad(len(t), 0.002, 0.15)

SFX = {k[4:]: v for k, v in globals().items() if k.startswith('sfx_')}


# ---------------- music bed: light pizzicato/marimba loop ----------------
def music(dur, bpm=112, key=0, stops=()):
    beat = 60 / bpm; n = int(dur * SR) + SR; out = np.zeros(n)
    prog = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]  # I vi IV V
    base = 261.63 * 2 ** (key / 12)

    def note(f, d, amp, kind):
        t = t_(d)
        if kind == 'mar':
            w = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30)
            return w * env_ad(len(t), 0.002, 0.18) * amp
        w = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
        return w * env_ad(len(t), 0.004, 0.25) * amp
    step, k = beat / 2, 0
    while k * step < dur + 1:
        bar = int(k // 8) % 4; ch = prog[bar]; s = int(k * step * SR)
        if k % 8 == 0 or k % 8 == 4:  # bass on beats 1 and 3
            b = note(base / 2 * 2 ** (ch[0] / 12), beat * 1.6, 0.55, 'bass'); out[s:s + len(b)] += b[:n - s]
        pat = [0, 1, 2, 1, 0, 2, 1, 2][k % 8]
        m = note(base * 2 * 2 ** (ch[pat] / 12), step * 1.8, 0.28 if k % 2 == 0 else 0.18, 'mar'); out[s:s + len(m)] += m[:n - s]
        k += 1
    out = out[:int(dur * SR)]
    for a, b in stops:  # musical "freeze" for gags: hard drop then fade back in
        i0, i1 = int(a * SR), int(b * SR); out[i0:i1] = 0
        fi = min(int(0.15 * SR), len(out) - i1)
        if fi > 0: out[i1:i1 + fi] *= np.linspace(0, 1, fi)
    return out


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-12)


def main():
    P = sys.argv[1]
    proj = json.load(open(os.path.join(P, 'project-files', 'project.json')))
    tim = json.load(open(os.path.join(P, 'project-files', 'timing.json')))
    mixcfg = {'music': 0.08, 'musicPause': 0.14, 'sfx': 0.35}; mixcfg.update(proj.get('mix', {}))
    vpath = os.path.join(P, 'voice-over', proj['voice'])
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vpath, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    voice = np.frombuffer(raw, np.float32).astype(np.float64)
    dur = len(voice) / SR
    # voice level = RMS of speaking parts only
    sp = np.zeros(len(voice), bool)
    for a, b in tim['speech']: sp[int(a * SR):int(b * SR)] = True
    vr = rms(voice[sp]) if sp.any() else rms(voice)
    vpk = float(np.abs(voice).max())

    bed = np.zeros(len(voice))
    mcfg = proj.get('music', {'on': True})
    if mcfg.get('on', True):
        m = music(dur, mcfg.get('bpm', 112), mcfg.get('key', 0), mcfg.get('stops', []))[:len(voice)]
        m = m / rms(m) * vr
        # gain curve: music% during speech, musicPause% in pauses >= 0.6 s, smoothed 150 ms
        g = np.full(len(voice), mixcfg['music'])
        for a, b in tim['pauses']:
            if b - a >= 0.6: g[int(a * SR):int(b * SR)] = mixcfg['musicPause']
        k = int(0.15 * SR); g = np.convolve(g, np.ones(k) / k, mode='same')
        fade = int(0.4 * SR); m[-fade:] *= np.linspace(1, 0, fade)
        bed += m * g
    fx = np.zeros(len(voice))
    for cue in proj.get('sfx', []):
        name = cue['name']
        if name not in SFX: print('!! unknown sfx', name, '-> available:', ', '.join(sorted(SFX))); continue
        s = SFX[name](); s = s / (np.abs(s).max() + 1e-9) * vpk * mixcfg['sfx'] * cue.get('gain', 1.0)
        i = int(cue['t'] * SR); fx[i:i + len(s)] += s[:max(0, len(fx) - i)]
    mix = voice + bed + fx
    os.makedirs(os.path.join(P, 'audio'), exist_ok=True)
    tmp = os.path.join(P, 'audio', 'mix_raw.wav')
    pcm = np.clip(mix / max(1.0, np.abs(mix).max()), -1, 1)
    import wave
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((pcm * 32767).astype(np.int16).tobytes())
    # loudness: measure, one linear gain to -14 LUFS, then true-peak limiter
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1])
    gain = -14.0 - I
    out = os.path.join(P, 'audio', 'mix.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89:attack=3:release=50:level=disabled',
                    '-ar', '48000', '-ac', '2', out], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-b:a', '160k', os.path.join(P, 'audio', 'mix.mp3')], check=True)
    os.remove(tmp)
    print(f'mix ok  dur={dur:.2f}s  measured {I:.1f} LUFS -> gain {gain:+.1f} dB  sfx={len(proj.get("sfx", []))}')


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--list':
        print(', '.join(sorted(SFX)))
    else:
        main()
