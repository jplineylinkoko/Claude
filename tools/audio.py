"""Bande son synthétisée par code (numpy uniquement), calée sur la grille à 100 BPM.

    python3 tools/audio.py            → render/audio/music.wav, sfx.wav, mix.wav (-16 LUFS)

Lit config/timing.json (durées, repères) et config/sound.json (événements, intensités).
Déterministe : aléatoire seedé. Les stems music.wav et sfx.wav reçoivent le même gain
que le mix (mix.wav, normalisé à -16 LUFS intégré, crête limitée à -1,5 dBTP environ).
"""
import json, os, re, subprocess, wave
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 48000
rng = np.random.default_rng(2026)


def load(p):
    return json.load(open(os.path.join(ROOT, p), encoding='utf-8'))


T = load('config/timing.json'); SND = load('config/sound.json')
BEAT = 60 / T['bpm']
SEQ = []; acc = 0
for s in T['sequences']:
    SEQ.append({**s, 'start': acc}); acc += s['dur']
TOTAL = acc; N = int(TOTAL * SR) + SR
t = np.arange(N) / SR


def cue_time(seq, cue):
    s = SEQ[seq - 1]
    b = cue if isinstance(cue, (int, float)) else s['cues'].get(cue, 0)
    return s['start'] + b * BEAT


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- outils DSP (FFT)
def fft_filter(x, lo=None, hi=None, sr=SR):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(x.shape[0], 1 / sr)
    g = np.ones_like(f)
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo: g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), n=x.shape[0], axis=0)


def fft_conv(x, ir):
    n = x.shape[0] + ir.shape[0]; n2 = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, n2, axis=0) * np.fft.rfft(ir, n2, axis=0), n2, axis=0)
    return y[:x.shape[0]]


def reverb_ir(sec=2.6, damp=3.2):
    n = int(sec * SR); tt = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-damp * tt)[:, None]
    ir = fft_filter(ir, hi=5000); ir[0] += 0; return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = reverb_ir()


def env_ar(n, a, r):
    tt = np.arange(n) / SR
    return np.minimum(1, tt / max(a, 1e-4)) * np.exp(-tt / max(r, 1e-4))


# ---------------------------------------------------------------- musique
def music():
    out = np.zeros((N, 2))
    # progression (2 mesures par accord) : Dmaj9 – Bm9 – Gmaj9 – A6sus
    chords = [[50, 57, 61, 64, 66], [47, 54, 57, 61, 62], [43, 50, 54, 57, 59], [45, 52, 57, 59, 62]]
    bar = 4 * BEAT; dur = 2 * bar
    inten = np.interp(t, [s['start'] + s['dur'] / 2 for s in SEQ], SND['music']['intensity'])
    k = 0; c0 = 0.0
    while c0 < TOTAL:
        notes = chords[k % 4]
        if c0 >= cue_time(10, 'q') - 0.01: notes = [50, 57, 62, 66, 69, 74]  # accord final ouvert
        n0 = int(max(0, c0 - 1.2) * SR); n1 = min(N, int((c0 + dur + 1.8) * SR))
        tt = t[n0:n1] - (c0 - 1.2)
        L = n1 - n0; d = dur + 3.0
        env = np.clip(np.minimum(tt / 1.6, (d - tt) / 1.8), 0, 1) ** 1.5
        seg = np.zeros((L, 2))
        for i, m in enumerate(notes):
            f = midi(m)
            for det, pan in ((-0.11, 0.25), (0.0, 0.5), (0.13, 0.75)):
                ph = rng.uniform(0, 6.28)
                v = np.sin(2 * np.pi * f * (1 + det / 100) * tt + ph) + 0.18 * np.sin(4 * np.pi * f * tt + ph)
                v *= 0.5 + 0.5 * np.sin(2 * np.pi * (0.08 + 0.03 * i) * tt + ph)  # mouvement lent
                seg[:, 0] += v * (1 - pan); seg[:, 1] += v * pan
        out[n0:n1] += seg * env[:, None] * 0.05
        if c0 >= cue_time(10, 'q') - 0.01: break
        c0 += dur; k += 1
    out = fft_filter(out, hi=1600, lo=60)
    # basse douce sur les mesures (séq. 3 à 9)
    b0, b1 = SEQ[2]['start'], SEQ[9]['start']
    roots = [38, 35, 31, 33]
    x = b0
    while x < b1:
        idx = int(x / dur) % 4; n0 = int(x * SR); L = int(bar * SR); n1 = min(N, n0 + L)
        tt = np.arange(n1 - n0) / SR
        v = np.sin(2 * np.pi * midi(roots[idx]) * tt) * env_ar(n1 - n0, 0.02, 0.9) * 0.10
        out[n0:n1] += v[:, None]
        x += bar
    # arpège léger sur les demi-temps (séq. 5 à 7)
    a0, a1 = SEQ[4]['start'], SEQ[7]['start']
    x = a0; j = 0
    while x < a1:
        idx = int(x / dur) % 4; m = chords[idx][[1, 2, 3, 4, 3, 2][j % 6]] + 12
        n0 = int(x * SR); L = int(0.5 * SR); n1 = min(N, n0 + L); tt = np.arange(n1 - n0) / SR
        v = (np.sin(2 * np.pi * midi(m) * tt) + 0.3 * np.sin(4 * np.pi * midi(m) * tt)) * env_ar(n1 - n0, 0.004, 0.18) * 0.022
        pan = 0.3 + 0.4 * (j % 2)
        out[n0:n1, 0] += v * (1 - pan); out[n0:n1, 1] += v * pan
        x += BEAT / 2; j += 1
    # montée finale : souffle filtré + octave haute
    r0, r1 = SEQ[9]['start'], cue_time(10, 'q')
    n0, n1 = int(r0 * SR), int(r1 * SR)
    noise = fft_filter(rng.standard_normal((n1 - n0, 2)), lo=800, hi=6000)
    ramp = np.linspace(0, 1, n1 - n0) ** 2.5
    out[n0:n1] += noise * ramp[:, None] * 0.03
    out = out * inten[:, None]
    # ducking sous les extraits vidéo (place pour le son réel)
    duck = np.ones(N)
    for seq, cue, d in ((4, 'clip', 12), (8, 'clip', 6)):
        s0 = cue_time(seq, cue); g = 10 ** (SND['music']['duck_db'] / 20)
        tt = t
        w = np.clip(np.minimum((tt - (s0 - 0.6)) / 0.6, ((s0 + d + 0.6) - tt) / 0.6), 0, 1)
        duck *= 1 - (1 - g) * w
    out *= duck[:, None]
    # fin : extinction sur les 2 dernières secondes
    out *= np.clip((TOTAL - t) / 2.0, 0, 1)[:, None]
    wet = fft_conv(out, IR)
    return (out * 0.75 + wet * 0.45) * 10 ** (SND['music']['gain_db'] / 20)


# ---------------------------------------------------------------- effets
def sfx_sample(kind):
    def sine(f, n, decay, a=0.003):
        tt = np.arange(n) / SR; return np.sin(2 * np.pi * f * tt) * env_ar(n, a, decay)
    if kind == 'ping':
        n = int(1.4 * SR); v = sine(1318.5, n, 0.35) + 0.5 * sine(1975.5, n, 0.22) + 0.25 * sine(2637, n, 0.12); return v * 0.16
    if kind == 'chime':
        n = int(3.5 * SR); v = sum(sine(midi(m), n, 1.4, 0.01) * g for m, g in ((74, 1), (78, 0.7), (81, 0.6), (86, 0.4))); return v * 0.12
    if kind == 'tick':
        n = int(0.08 * SR); v = sine(2800, n, 0.012, 0.0005) + 0.5 * rng.standard_normal(n) * env_ar(n, 0.0005, 0.006); return v * 0.10
    if kind == 'click':
        a = sfx_sample('tick'); n = int(0.2 * SR); v = np.zeros(n); v[:len(a)] += a * 1.2; o = int(0.07 * SR); v[o:o + len(a)] += a * 0.7
        return v + 0.15 * sine(900, n, 0.03, 0.001) * 0.4
    if kind == 'pop':
        n = int(0.5 * SR); tt = np.arange(n) / SR; f = 420 + 380 * np.exp(-tt * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(n, 0.002, 0.08) * 0.22
    if kind == 'thud':
        n = int(0.9 * SR); tt = np.arange(n) / SR; f = 95 * np.exp(-tt * 3) + 45
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ar(n, 0.004, 0.22) + 0.15 * rng.standard_normal(n) * env_ar(n, 0.001, 0.02)) * 0.2
    if kind in ('whoosh', 'scratch'):
        d = 1.0 if kind == 'whoosh' else 0.45; n = int(d * SR); tt = np.arange(n) / SR
        x = rng.standard_normal(n)
        x = fft_filter(x, lo=300 if kind == 'whoosh' else 1500, hi=2500 if kind == 'whoosh' else 7000)
        e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** (2 if kind == 'whoosh' else 1.2)
        return x * e * (0.10 if kind == 'whoosh' else 0.05)
    if kind == 'swell':
        n = int(2.0 * SR); tt = np.arange(n) / SR; e = np.clip(tt / 1.6, 0, 1) ** 2 * np.clip((2.0 - tt) / 0.4, 0, 1)
        return sum(np.sin(2 * np.pi * midi(m) * tt) for m in (62, 69, 74)) * e * 0.05
    if kind == 'sparkle':
        n = int(1.6 * SR); v = np.zeros(n)
        for k in range(6):
            o = int(k * 0.07 * SR); m = [86, 90, 93, 98, 93, 90][k]; s = sine(midi(m), n - o, 0.25) * 0.06; v[o:] += s
        return v
    raise ValueError(kind)


def sfx():
    out = np.zeros((N, 2))
    for i, ev in enumerate(SND['events']):
        s = sfx_sample(ev['type']) * 10 ** (ev.get('gain', 0) / 20)
        t0 = cue_time(ev['seq'], ev['cue']) + ev.get('dt', 0)
        n0 = int(t0 * SR); n1 = min(N, n0 + len(s))
        if n0 >= N: continue
        pan = 0.5 + 0.18 * np.sin(i * 1.7)
        out[n0:n1, 0] += s[:n1 - n0] * (1 - pan) * 1.0; out[n0:n1, 1] += s[:n1 - n0] * pan * 1.0
    wet = fft_conv(out, IR)
    return out * 0.85 + wet * 0.25


def limiter(x, thr=0.84, blk=256):
    """Limiteur à anticipation : gain par blocs, lissé (attaque ~5 ms, relâchement ~120 ms)."""
    n = x.shape[0]; nb = (n + blk - 1) // blk
    pk = np.pad(np.abs(x).max(axis=1), (0, nb * blk - n)).reshape(nb, blk).max(axis=1)
    pk = np.maximum(pk, np.concatenate([pk[1:], [0]]))   # anticipation d'un bloc
    g = np.minimum(1, thr / np.maximum(pk, 1e-9))
    rel = np.exp(-blk / SR / 0.12); out = g.copy()
    for i in range(1, nb): out[i] = min(g[i], out[i - 1] * rel + (1 - rel))
    gs = np.interp(np.arange(n), np.arange(nb) * blk + blk / 2, out)
    return x * gs[:, None]


def write_wav(path, x):
    x = np.clip(x, -1, 1); d = (x * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())


def loudness(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); P = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
    return I, P


if __name__ == '__main__':
    out = os.path.join(ROOT, 'render/audio'); os.makedirs(out, exist_ok=True)
    m = music()[:int(TOTAL * SR)]; s = sfx()[:int(TOTAL * SR)]
    tmp = os.path.join(out, '_mix_raw.wav'); write_wav(tmp, (m + s) * 0.5)
    I, P = loudness(tmp)
    g = 10 ** ((-16 - I) / 20) * 0.5
    write_wav(os.path.join(out, 'music.wav'), limiter(m * g)); write_wav(os.path.join(out, 'sfx.wav'), limiter(s * g))
    write_wav(os.path.join(out, 'mix.wav'), limiter((m + s) * g))
    os.remove(tmp)
    I2, P2 = loudness(os.path.join(out, 'mix.wav'))
    print(f'mix.wav : {I2:.1f} LUFS intégré, crête vraie {P2:.1f} dBTP  → {out}')
