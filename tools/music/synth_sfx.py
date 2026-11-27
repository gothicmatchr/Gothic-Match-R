"""Match-3 style gem sound effects, synthesised. Bright, satisfying, rounded sounds,
kept in the game's gothic palette: D harmonic minor notes, a dark hall reverb,
organ/choir colour on the bigger effects."""
import numpy as np, wave, subprocess, os

SR = 48000
rng = np.random.default_rng(5)
OUT = '/home/claude/music/sfx_new'
os.makedirs(OUT, exist_ok=True)

def hz(name):
    names = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
    p, o = name[:-1], int(name[-1])
    return 440 * 2 ** ((12 * (o + 1) + names[p] - 69) / 12)

def T(d): return np.arange(int(d * SR)) / SR

def env(t, a, d):  # attack then exponential decay (d = time to -60 dB)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-6.9 * np.maximum(0, t - a) / d)
    return e

def bell(f, d=.6, idx=2.2, ratio=3.5, a=.002):
    t = T(d)
    m = idx * np.exp(-t * 9) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + m) * env(t, a, d)

def marimba(f, d=.35):
    t = T(d)
    return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * env(t, .002, d)

def sweep(f0, f1, d, shape='exp'):
    t = T(d)
    f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

def noise(d): return rng.uniform(-1, 1, int(d * SR))

def lp(x, fc):  # one-pole low-pass, run twice
    a = np.exp(-2 * np.pi * fc / SR)
    for _ in range(2):
        y = np.zeros_like(x); acc = 0.0
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc; y[i] = acc
        x = y
    return x

def hp(x, fc): return x - lp(x, fc)

def bp_sweep(x, f0, f1):  # crude moving band-pass: chunked lp/hp
    out = np.zeros_like(x); n = len(x); CH = 512
    for s in range(0, n, CH):
        k = s / n; fc = f0 * (f1 / f0) ** k
        seg = x[max(0, s - 2048):s + CH]
        y = hp(lp(seg, fc * 1.4), fc * .7)
        out[s:s + CH] = y[-len(out[s:s + CH]):]
    return out

def sparkle(d=.4, n=7, lo='D7', hi='D8'):
    out = np.zeros(int(d * SR) + SR // 2)
    notes = [hz(x) for x in ['D7', 'F7', 'A7', 'C#8', 'D8', 'A7', 'F7']]
    for i in range(n):
        st = int(rng.uniform(0, d) * SR); s = bell(notes[i % len(notes)], .25, 1.2, 2.0) * rng.uniform(.25, .5)
        out[st:st + len(s)] += s
    return out[:int(d * SR) + int(.25 * SR)]

def mix(*parts, length=None):
    L = length or max(len(p) for p, _, _ in parts)
    out = np.zeros(L)
    for p, at, g in parts:
        s = int(at * SR); e = min(L, s + len(p)); out[s:e] += p[:e - s] * g
    return out

def reverb(x, d=.9, wet=.18, dark=3500):
    ir_t = T(d); ir = noise(d) * np.exp(-6.9 * ir_t / d); ir = lp(ir, dark); ir /= np.sqrt(np.sum(ir ** 2))
    y = np.convolve(x, ir)[:len(x) + int(d * SR)]
    out = np.zeros(len(y)); out[:len(x)] += x
    return out * (1 - wet) + y * wet * .5

def finish(name, x, peak=.89, tail=.7):
    x = reverb(x, tail)
    nz = np.nonzero(np.abs(x) > 1e-4)[0]; x = x[:nz[-1] + 1] if len(nz) else x
    f = int(.01 * SR); x[-f:] *= np.linspace(1, 0, f)
    x = x / np.max(np.abs(x)) * peak
    wav = f'{OUT}/{name}.wav'
    with wave.open(wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '64k',
                    f'/home/claude/gemslide/audio/sfx/{name}.ogg'], check=True)
    print(name, round(len(x) / SR, 2), 's')

# MATCH: soft bell "pling" on D6. The game steps it up the D harmonic minor scale per gem.
f = hz('D6')
finish('match', mix((bell(f, .5, 1.6, 2.0), 0, .8), (marimba(f / 2, .3), 0, .35), (bell(f * 2, .25, .8, 3.0), 0, .18)), tail=.6)

# POP: glassy bubble pop, a quick rising blip with a tiny click and a bright tick.
blip = sweep(520, 1500, .07) * env(T(.07), .001, .07)
click = hp(noise(.012), 3000) * env(T(.012), .0005, .012)
tick = bell(hz('A6'), .12, .9, 2.0)
finish('pop', mix((blip, 0, .9), (click, 0, .35), (tick, .01, .3)), tail=.35)

# FORGE: special gem created. Quick sparkling arpeggio up D harmonic minor, a soft whoosh and shimmer.
arp = mix(*[(bell(hz(nm), .45, 1.5, 2.0), i * .055, .7) for i, nm in enumerate(['D5', 'F5', 'A5', 'C#6', 'D6', 'F6'])])
whoosh = bp_sweep(noise(.4), 600, 5000) * env(T(.4), .25, .4)
choir = sum(np.sin(2 * np.pi * hz(nm) * (1 + dt) * T(.6)) for nm in ['D4', 'A4', 'D5'] for dt in (-.003, .003)) * env(T(.6), .12, .6)
finish('forge', mix((arp, 0, 1), (lp(whoosh, 4000), 0, .15), (sparkle(.35), .3, .6), (lp(choir, 2000), .05, .12)), tail=.9)

# GOLD: gold gem burst. Soft thump, coin-like double chime, sparkle.
thump = sweep(160, 45, .18) * env(T(.18), .002, .18)
coin1 = mix((bell(hz('A6'), .35, 2.5, 2.76), 0, 1), (bell(hz('D7'), .3, 2.0, 2.76), 0, .6))
finish('gold', mix((thump, 0, .9), (coin1, 0, .55), (coin1, .07, .45), (sparkle(.3), .08, .5)), tail=.8)

# GOLD PERFECT: bigger thump, D minor bell chord, rising glissando sparkle.
chord = mix(*[(bell(hz(nm), 1.1, 1.8, 2.0), 0, .5) for nm in ['D5', 'F5', 'A5', 'D6']])
gl = mix(*[(bell(hz(nm), .3, 1.0, 2.0), i * .035, .45) for i, nm in enumerate(['D6', 'E6', 'F6', 'G6', 'A6', 'Bb6', 'C#7', 'D7'])])
finish('gold_perfect', mix((sweep(180, 40, .3) * env(T(.3), .002, .3), 0, 1), (chord, 0, .7), (gl, .05, .6), (sparkle(.5, 10), .25, .55),
                          (bell(hz('D7'), .6, 2.5, 2.76), 0, .3)), tail=1.1)

# FIZZLE: overshot hold. Soft descending "wah" with a dull plop.
wah = sweep(700, 180, .45) * env(T(.45), .01, .45)
finish('fizzle', mix((lp(wah, 1500), 0, .9), (sweep(220, 90, .12) * env(T(.12), .002, .12), .3, .5)), tail=.5)

# SLING: rubber-band twang into a whoosh.
def pluck(f, d):  # Karplus-Strong
    n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]; buf[i % n] = .5 * (buf[i % n] + buf[(i + 1) % n]) * .996
    return out
tw = pluck(hz('D3'), .35) * sweep(1, 1, .35) ** 0  # plain pluck
wh = bp_sweep(noise(.45), 900, 3500) * np.sin(np.pi * T(.45) / .45)
finish('sling', mix((tw, 0, .8), (sweep(300, 900, .12) * env(T(.12), .003, .12), 0, .3), (lp(wh, 3000), .03, .4), (bell(hz('A6'), .2, 1, 2), .02, .25)), tail=.5)

# BUCKET: power attack. Impact, swelling D minor organ-choir chord, sparkle burst.
imp = mix((lp(noise(.12), 2500) * env(T(.12), .001, .12), 0, 1), (sweep(130, 40, .25) * env(T(.25), .002, .25), 0, 1))
d = .9; tt = T(d)
pad = sum((np.sign(np.sin(2 * np.pi * hz(nm) * (1 + dt) * tt)) * .3 + np.sin(2 * np.pi * hz(nm) * (1 + dt) * tt))
          for nm in ['D4', 'F4', 'A4', 'D5'] for dt in (-.004, 0, .004))
pad = lp(pad, 1800) * env(tt, .04, d)
finish('bucket', mix((imp, 0, 1), (pad, 0, .22), (bell(hz('D6'), .6, 2, 2), 0, .4), (bell(hz('A6'), .5, 2, 2), .04, .3), (sparkle(.4, 9), .1, .5)), tail=1.0)
