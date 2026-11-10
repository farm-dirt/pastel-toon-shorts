#!/usr/bin/env python3
"""Voice-over analysis -> timing.json (the master clock for the whole animation).

usage: python3 timing.py VOICE_AUDIO OUT_timing.json [--script script.txt]

Outputs:
  dur        exact audio length in seconds
  envFps,env loudness envelope 0..1 at 30 fps (drives mouth flaps)
  speech     [[start,end],...] speaking segments
  pauses     [[start,end],...] silences >= 0.18 s
  sentences  [{s,e,text}]  (only with --script) each sentence snapped to real pauses
  words      [{w,s,e}]     (only with --script) estimated word times
  captions   [{s,e,text}]  (only with --script) draft 1-3 word caption chunks
No Whisper needed: sentence edges come from the real pauses, words inside a
sentence are spread by syllable count and snapped to the nearest energy dip.
"""
import json, re, subprocess, sys
import numpy as np

SR = 16000
FPS = 30


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def rms_db(x, hop):
    n = len(x) // hop
    fr = x[:n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)


def syllables(w):
    w = re.sub(r'[^a-z]', '', w.lower())
    if not w:
        return 1
    if w.isdigit():
        return 2
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and n > 1 and not w.endswith(('le', 'ee')):
        n -= 1
    return max(1, n)


def main():
    a = sys.argv[1:]
    voice, out = a[0], a[1]
    script = open(a[a.index('--script') + 1], encoding='utf-8').read() if '--script' in a else None
    x = load(voice)
    dur = len(x) / SR

    # --- envelope at 30 fps for mouths ---
    hop = SR // FPS
    db = rms_db(x, hop)
    ref = np.percentile(db, 95)
    env = np.clip((db - (ref - 32)) / 26, 0, 1)
    env = np.convolve(env, np.ones(3) / 3, mode='same')  # remove 1-frame chatter

    # --- silence detection at 10 ms ---
    h10 = SR // 100
    d10 = rms_db(x, h10)
    d10 = np.convolve(d10, np.ones(5) / 5, mode='same')
    thr = np.percentile(d10, 95) - 30
    silent = d10 < thr
    pauses, i = [], 0
    while i < len(silent):
        if silent[i]:
            j = i
            while j < len(silent) and silent[j]:
                j += 1
            if (j - i) * 0.01 >= 0.18:
                pauses.append([round(i * 0.01, 3), round(min(j * 0.01, dur), 3)])
            i = j
        else:
            i += 1
    speech, cur = [], 0.0
    for s, e in pauses:
        if s - cur > 0.05:
            speech.append([round(cur, 3), s])
        cur = e
    if dur - cur > 0.05:
        speech.append([round(cur, 3), round(dur, 3)])

    res = {'dur': round(dur, 4), 'fps': FPS, 'envFps': FPS, 'env': [round(float(v), 3) for v in env],
           'speech': speech, 'pauses': pauses}

    if script:
        text = re.sub(r'\s+', ' ', script).strip()
        ABBR = r'(?<!\bMr\.)(?<!\bMs\.)(?<!\bDr\.)(?<!\bSt\.)(?<!\bvs\.)(?<!\bMrs\.)(?<!\bJr\.)(?<!\bSr\.)'
        sents = [s.strip() for s in re.split(ABBR + r'(?<=[.!?…])\s+', text) if s.strip()]
        K = len(sents)
        # inner pauses (not leading/trailing silence), longest K-1 become sentence breaks
        inner = [p for p in pauses if p[0] > speech[0][0] + 0.05 and p[1] < speech[-1][1] - 0.05] if speech else []
        brk = sorted(sorted(inner, key=lambda p: p[1] - p[0], reverse=True)[:max(0, K - 1)])
        if len(brk) < K - 1:  # not enough pauses: fall back to syllable-proportional breaks
            brk = None
        t0, t1 = speech[0][0], speech[-1][1]
        edges = [t0]
        if brk:
            for p in brk:
                edges += [p[0], p[1]]
        else:
            syl = [sum(syllables(w) for w in s.split()) for s in sents]
            tot, acc = sum(syl), 0
            for k in range(K - 1):
                acc += syl[k]
                tt = t0 + (t1 - t0) * acc / tot
                edges += [tt, tt]
        edges.append(t1)
        sentences, words = [], []
        dips = d10  # for snapping
        for k, s in enumerate(sents):
            ss, se = edges[2 * k], edges[2 * k + 1]
            sentences.append({'s': round(ss, 3), 'e': round(se, 3), 'text': s})
            ws = s.split()
            # speaking time inside this sentence (skip inner short pauses)
            segs = [[max(a_, ss), min(b_, se)] for a_, b_ in speech if b_ > ss and a_ < se]
            segs = [g for g in segs if g[1] - g[0] > 0.02] or [[ss, se]]
            total = sum(g[1] - g[0] for g in segs)
            wts = np.array([syllables(w) + (0.6 if re.search(r'[,;:]$', w) else 0) for w in ws], float)
            cum = np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * total

            def tmap(u):  # speaking-time offset -> real time
                for a_, b_ in segs:
                    if u <= b_ - a_:
                        return a_ + u
                    u -= b_ - a_
                return segs[-1][1]
            bounds = [tmap(u) for u in cum]
            for j in range(1, len(bounds) - 1):  # snap inner word edges to energy dips (+-0.1 s)
                c = int(bounds[j] * 100)
                lo, hi = max(0, c - 10), min(len(dips), c + 11)
                if hi > lo:
                    bounds[j] = (lo + int(np.argmin(dips[lo:hi]))) * 0.01
            for j, w in enumerate(ws):
                words.append({'w': w, 's': round(bounds[j], 3), 'e': round(max(bounds[j + 1], bounds[j] + 0.1), 3)})
        res['sentences'] = sentences
        res['words'] = words
        # draft captions: 1-3 words, max ~16 chars, break after punctuation
        caps, chunk = [], []
        for wd in words:
            chunk.append(wd)
            txt = ' '.join(c['w'] for c in chunk)
            if len(chunk) >= 3 or len(txt) >= 14 or re.search(r'[.,!?;:…]$', wd['w']):
                caps.append(chunk); chunk = []
        if chunk:
            caps.append(chunk)
        res['captions'] = []
        for k, c in enumerate(caps):
            e = c[-1]['e']
            nxt = caps[k + 1][0]['s'] if k + 1 < len(caps) else e + 0.4
            e = min(nxt, e + 0.25) if nxt - e < 0.6 else e + 0.25  # hold through tiny gaps
            res['captions'].append({'s': c[0]['s'], 'e': round(e, 3),
                                    'text': re.sub(r'[.,;:]+$', '', ' '.join(w['w'] for w in c)).lower()})
    json.dump(res, open(out, 'w'), indent=None, separators=(',', ':'))
    print(f'dur={dur:.2f}s  speech={len(speech)}  pauses={len(pauses)}' +
          (f"  sentences={len(res['sentences'])}  words={len(res['words'])}" if script else ''))
    for p in pauses:
        print(f'  pause {p[0]:6.2f}-{p[1]:6.2f}  ({p[1]-p[0]:.2f}s)')


if __name__ == '__main__':
    main()
