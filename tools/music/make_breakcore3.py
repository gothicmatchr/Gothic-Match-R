"""Sister Morwen's theme: longer, more atmospheric gothic lofi breakcore with softer drums.
Renders make_gothic3.py / make_rage3.py MIDI with fluidsynth, adds a synthesised drum stem (soft Think-style
and Amen-style breaks, lowpassed, with gentle breakcore edits: stutters, a reversed swell, quiet snare rushes,
a half-speed heartbeat in the breakdown) and a lofi texture bed (vinyl crackle and soft rain). The rage version
is harder: open amen chops, bitcrush, machine-gun snares, double-time panic. No samples.
Writes audio/battle_theme3.ogg and audio/battle_theme3_rage.ogg (seamless 96-bar loops, ~2:45)."""
import os, wave, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BUILD = os.path.join(HERE, 'build'); os.makedirs(BUILD, exist_ok=True)
SF2 = next(p for p in ('/usr/share/sounds/sf2/FluidR3_GM.sf2', '/usr/share/sounds/sf2/default-GM.sf2') if os.path.exists(p))
SR, BPM, BARS = 44100, 140, 96
BAR = 4 * 60 / BPM; S16 = BAR / 16; L = int(round(BARS * BAR * SR))
rng = np.random.default_rng(140)

def T(d): return np.arange(int(d * SR)) / SR
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def drive(x, k): return np.tanh(x * k) / np.tanh(k)
def room(x, d=.3, wet=.3):
    ir = filt(noise(d), 'lowpass', 4000) * np.exp(-T(d) * 14); ir /= np.sqrt(np.sum(ir ** 2))
    return x + np.convolve(x, ir)[:len(x)] * wet

# ---------- soft kit: rounder kick, brushy snare, gentle hats, lots of room ----------
def kick(v=1):
    t = T(.3); f = 48 + 80 * np.exp(-t * 30); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    return room(drive(x * 1.2, 1.6), .25, .2) * v
def snare(v=1):
    t = T(.3); tone = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 26)
    nz = filt(filt(noise(.3), 'highpass', 900), 'lowpass', 6000) * np.exp(-t * 11)
    return room(tone * .5 + nz * 1.0, .35, .45) * v
def ride(v=1, bell=False):
    t = T(.8); fs = (531, 802, 1187, 1622) if not bell else (1093, 1640, 2460)
    return filt(sum(np.sign(np.sin(2 * np.pi * f * t)) for f in fs), 'highpass', 3200) * np.exp(-t * 5) * .07 * v
def hat(v=1, open_=False):
    d = .3 if open_ else .05; return filt(noise(d), 'highpass', 6500) * np.exp(-T(d) * (9 if open_ else 55)) * v * .8
def crash(v=1): return filt(noise(2.0), 'highpass', 2400) * np.exp(-T(2.0) * 1.8) * .5 * v
def gabber(v=1):
    t = T(.4); f = 48 + 170 * np.exp(-t * 26); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    return filt(drive(x * 5, 6), 'lowpass', 4500) * .8 * v
def place(buf, s, at):
    i = int(round(at * SR))
    if 0 <= i < len(buf): e = min(len(buf), i + len(s)); buf[i:e] += s[:e - i]

AMEN = [dict(k=[0, 2, 10, 11], s=[4, 12], g=[7, 9, 15]), dict(k=[0, 2, 10, 11], s=[4, 12], g=[7, 9, 15]),
        dict(k=[0, 2, 10], s=[4, 14], g=[7, 9]), dict(k=[2, 3, 10], s=[4, 14], g=[1, 7, 9])]
THINK = [dict(k=[0, 7, 10], s=[4, 12], g=[9, 14], o=[6]), dict(k=[0, 3, 7, 10], s=[4, 12], g=[9, 15], o=[6])]
def render_break(bars, kind):
    b = np.zeros(int(len(bars) * BAR * SR) + SR); sw = lambda st: st * S16 + (S16 * .1 if st % 2 else 0)  # lazier swing
    for bi, P in enumerate(bars):
        o = bi * BAR
        for st in P['k']: place(b, kick(rng.uniform(.85, 1)), o + sw(st))
        for st in P['s']: place(b, snare(rng.uniform(.8, .9)), o + sw(st))
        for st in P['g']: place(b, snare(rng.uniform(.18, .28)), o + sw(st))
        if kind == 'amen':
            for st in range(0, 16, 2): place(b, ride(.8 if st % 4 == 0 else .55, bell=st % 8 == 0), o + sw(st))
        else:
            for st in range(16):
                if st not in P.get('o', []): place(b, hat(.26 if st % 2 == 0 else .12), o + sw(st))
            for st in P.get('o', []): place(b, hat(.22, True), o + sw(st))
    return b[:int(len(bars) * BAR * SR)]
BRK = {'amen': render_break(AMEN, 'amen'), 'think': render_break(THINK, 'think')}
NS = int(round(S16 * SR))
def sl(kind, i, n=1): src = BRK[kind]; i %= len(src) // NS; return src[i * NS:i * NS + n * NS]
def resample(x, rate): return x if rate == 1 else np.interp(np.arange(0, len(x) - 1, rate), np.arange(len(x)), x)
def fade(x, ms=3):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n > 0: x = x.copy(); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def crush(x, bits=7, down=3): q = 2 ** bits; return np.repeat((np.round(x * q) / q)[::down], down)[:len(x)]
def straight(kind, bar): tot = len(BRK[kind]) // NS // 16; return [(st, sl(kind, (bar % tot) * 16 + st)) for st in range(16)]
def chop(kind):
    sn = [4, 12, 20, 28]; return [(st, sl(kind, 0 if st == 0 else int(rng.choice(sn)) if st in (4, 12) else int(rng.integers(0, len(BRK[kind]) // NS)))) for st in range(16)]
def stutter(at, src, reps, div, kind='think'): p = fade(sl(kind, src)[:int(NS / div)]); return [(at + k / div, p) for k in range(reps)]
def machinegun(at, beats, kind='amen', src=4): p = fade(sl(kind, src)[:NS // 2]); k = int(beats * 8); return [(at + i / 2, p * (.4 + .6 * i / max(1, k - 1))) for i in range(k)]
def rush(at, steps, kind='think', src=4, top=4):
    ev, pos = [], at
    while pos < at + steps - 1e-6:
        f = (pos - at) / steps; div = 1 if f < .35 else 2 if f < .7 else top; rate = 1 + .4 * f
        ev.append((pos, fade(resample(sl(kind, src)[:int(NS / div * rate) + 2], rate)) * (.5 + .5 * f))); pos += 1 / div
    return ev
def reverse_into(ev, kind='amen'): return [e for e in ev if e[0] < 12] + [(12, sl(kind, 12, 4)[::-1] * .8)]
def halfspeed(kind, bar): return [(st * 2, resample(sl(kind, bar * 8 + st), .5)) for st in range(8)]
def doubletime(kind, bar): return [(st / 2, resample(sl(kind, (bar * 32 + st) % (len(BRK[kind]) // NS)), 2.0)) for st in range(32)]
def render_bar(events, gain=1.0):
    buf = np.zeros(int(BAR * SR) + 2 * SR)
    for st, s in events: place(buf, fade(s) * gain, st * S16)
    return buf

def build_drums(rage=False):
    out = np.zeros(L + 4 * SR)
    for bar in range(BARS):
        sec, r = bar // 16, bar % 16; ev = []; post = None; g = 1.0; gab = False
        if sec == 0:
            if rage and r >= 4:
                ev = [(0, kick()), (8, kick(.7))] + (straight('amen', bar) if r >= 8 else []) + (rush(8, 8, 'amen', 12) if r == 15 else [])
                post = lambda x, f=min(5000, 400 * 1.4 ** (r - 4)): filt(x, 'lowpass', f)
            elif r >= 12:
                ev = straight('think', bar) + (rush(8, 8) if r == 15 else []); f = [300, 600, 1100, 2000][r - 12]
                post = lambda x, f=f: filt(x, 'lowpass', f); g = .45 + .1 * (r - 12)
        elif sec == 1:  # the soft think groove
            ev = straight('think', bar) if (r % 4 != 3 or rage) else straight('think', bar)[:12] + stutter(12, 4, 4, 1)
            if rage and r % 2: ev = chop('think')
            if r == 15: ev = ev[:8] + rush(8, 8)
            post = (lambda x: filt(x, 'lowpass', 5200)) if not rage else None; g = .9
        elif sec == 2:  # soft amen with ride
            ev = straight('amen', bar)
            if r % 4 == 3: ev = ev[:14] + stutter(14, 12, 4, 2, 'amen')
            if r == 15: ev = reverse_into(ev)
            if rage:
                if r % 2: ev = chop('amen')
                if r % 4 == 2: post = lambda x: crush(x, 7, 3) * .8 + x * .4
                if r % 8 == 7: ev = ev[:12] + machinegun(12, 1)
            else: post = lambda x: filt(x, 'lowpass', 6000)
        elif sec == 3:  # breakdown: silence, then a half-speed heartbeat (rage: double-time panic)
            if rage:
                if r >= 4: ev = doubletime('amen', bar); post = lambda x: crush(x, 7, 2) * .7 + x * .4; g = .9
            elif r >= 8:
                ev = halfspeed('think', bar); post = lambda x: filt(x, 'lowpass', 1500); g = .7
                if r >= 14: ev = ev[:8] + rush(8, 8, 'think', 4) if r == 15 else ev
        elif sec == 4:  # peak: amen and gentle chops
            ev = chop('amen') if r % 2 else straight('amen', bar)
            if r % 8 == 7: ev = ev[:12] + (machinegun(12, 1) if rage else stutter(12, 4, 4, 1, 'amen'))
            if r == 15: ev = ev[:8] + rush(8, 8, 'amen', 12, 8 if rage else 4)
            if rage: gab = r % 2 == 0
            else: post = lambda x: filt(x, 'lowpass', 7500)
        else:  # outro: the think break closes down, then only texture (back to the intro's stillness)
            if r < 10 or (rage and r < 12):
                ev = straight('think', bar); fc = max(400, 7000 * .7 ** r); post = lambda x, fc=fc: filt(x, 'lowpass', fc); g = 1 - .07 * r
        if not ev: continue
        x = render_bar(ev, g)
        if post is not None: x = post(x)
        if gab:
            for q in range(4): place(x, gabber(.7), q * 4 * S16)
        place(out, x, bar * BAR)
        if bar in (16, 64) or (rage and bar % 16 == 0 and bar > 0): place(out, crash(.8), bar * BAR)
    return drive(filt(out, 'lowpass', 9000), 1.3)

def texture():  # vinyl crackle + soft rain, constant under the whole loop
    n = L; rain = filt(filt(rng.uniform(-1, 1, n), 'highpass', 900), 'lowpass', 5000) * .05
    rain *= 1 + .3 * np.sin(2 * np.pi * np.arange(n) / SR / 9.0)  # slow swells
    cr = np.zeros(n); idx = rng.integers(0, n, int(BARS * BAR * 22)); cr[idx] = rng.uniform(-1, 1, len(idx)) * rng.uniform(.1, 1, len(idx)) ** 3
    cr = filt(cr, 'highpass', 1500) * .5
    return rain + cr

def stem(mid_in, wav_out):
    subprocess.run(['fluidsynth', '-ni', '-g', '0.6', '-R', '1', '-C', '1', '-r', str(SR), '-F', wav_out, SF2, mid_in], check=True, capture_output=True)
    w = wave.open(wav_out); return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
def fold(a):
    a = np.pad(a, ((0, max(0, L + 4 * SR - len(a))), (0, 0)))[:L + 4 * SR]; body = a[:L].copy(); body[:len(a) - L] += a[L:]; return body
def kick_env(d):
    e = np.abs(filt(d, 'lowpass', 120)); e = filt(e, 'lowpass', 12); e /= e.max() + 1e-9; return 1 - .2 * np.clip(e * 1.6, 0, 1)

mus = fold(stem(os.path.join(HERE, 'gothic_morwen_140bpm.mid'), os.path.join(BUILD, 'stem3_music.wav')))
for c in range(2): mus[:, c] = filt(mus[:, c], 'lowpass', 7500) * .85 + mus[:, c] * .15  # warm, dusty top end
rfx = fold(stem(os.path.join(HERE, 'gothic_morwen_rage_140bpm.mid'), os.path.join(BUILD, 'stem3_rage.wav')))
for c in range(2): rfx[:, c] = filt(rfx[:, c], 'highpass', 50); rfx[:, c] = crush(rfx[:, c], 9, 2) * .5 + rfx[:, c] * .5
tex = texture()[:, None] * np.array([[1, .9]])

for rage in (False, True):
    d = build_drums(rage); d = np.pad(d, (0, max(0, L + 4 * SR - len(d))))[:L + 4 * SR]
    body = d[:L].copy(); body[:len(d) - L] += d[L:]; d = body
    m = mus / np.max(np.abs(mus))
    mix = m * kick_env(d)[:, None] * .85 + d[:, None] * np.array([[.96, .92]]) * (.24 if not rage else .33) / np.max(np.abs(d)) + tex * .35
    if rage: mix += rfx / np.max(np.abs(rfx)) * .4
    mix = drive(mix * 1.1, 1.2); mix = mix / np.max(np.abs(mix)) * .95
    name = 'battle_theme3' + ('_rage' if rage else ''); wav = os.path.join(BUILD, name + '.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '80k', os.path.join(ROOT, 'audio', name + '.ogg')], check=True)
    print('done', name, round(L / SR, 2), 's')
