"""Second battle theme: gothic atmospheric lofi breakcore with classic breakcore drum work.
Renders make_gothic2.py / make_rage2.py MIDI with fluidsynth and a synthesised drum stem built from
classic patterns (no samples): an Amen-style 4-bar break and a Think-style funk break, cut up with the
standard breakcore edits: 3-3-2 regrouped chops, machine-gun 32nd snares, snare rushes rising to 64ths,
reversed hits into the downbeat, half-speed pitched drops, bitcrush, and gabber 4/4 kicks under amen
chops at the peak. Writes audio/battle_theme2.ogg and audio/battle_theme2_rage.ogg (seamless 48-bar loops).
Needs: numpy, scipy, mido, fluidsynth, ffmpeg, a GM soundfont (fluid-soundfont-gm)."""
import os, wave, subprocess
import numpy as np, mido
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BUILD = os.path.join(HERE, 'build'); os.makedirs(BUILD, exist_ok=True)
SF2 = next(p for p in ('/usr/share/sounds/sf2/FluidR3_GM.sf2', '/usr/share/sounds/sf2/default-GM.sf2') if os.path.exists(p))
SR, BPM, BARS = 44100, 176, 48
BAR = 4 * 60 / BPM; S16 = BAR / 16; L = int(round(BARS * BAR * SR))
rng = np.random.default_rng(176)

def T(d): return np.arange(int(d * SR)) / SR
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def drive(x, k): return np.tanh(x * k) / np.tanh(k)

# ---------- kit: a dusty, roomy "recorded break" character ----------
def room(x, d=.18, wet=.22):
    ir = filt(noise(d), 'lowpass', 5000) * np.exp(-T(d) * 22); ir /= np.sqrt(np.sum(ir ** 2))
    y = np.convolve(x, ir)[:len(x)]; return x + y * wet
def kick(v=1):
    t = T(.28); f = 52 + 110 * np.exp(-t * 34)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    c = filt(noise(.005), 'highpass', 2000) * np.linspace(1, 0, int(.005 * SR)); x[:len(c)] += c * .6
    return room(drive(x * 1.5, 2.4)) * v
def snare(v=1):
    t = T(.24)
    tone = np.sin(2 * np.pi * 196 * t) * np.exp(-t * 24) + .5 * np.sin(2 * np.pi * 345 * t) * np.exp(-t * 34)
    nz = filt(filt(noise(.24), 'highpass', 1200), 'lowpass', 8500) * np.exp(-t * 14)
    return room(drive(tone * .75 + nz * 1.15, 2.3), .22, .3) * v
def ride(v=1, bell=False):
    t = T(.55); fs = (531, 802, 1187, 1622, 2207) if not bell else (1093, 1640, 2460)
    x = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in fs)
    return filt(x, 'highpass', 3000) * np.exp(-t * (7 if not bell else 9)) * (.1 if not bell else .14) * v
def hat(v=1, open_=False):
    d = .24 if open_ else .045; return filt(noise(d), 'highpass', 7200) * np.exp(-T(d) * (12 if open_ else 70)) * v
def crash(v=1): return filt(noise(1.5), 'highpass', 2600) * np.exp(-T(1.5) * 2.4) * .7 * v
def gabber(v=1):  # distorted 4/4 hardcore kick
    t = T(.42); f = 48 + 190 * np.exp(-t * 26)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    return filt(drive(x * 6, 7), 'lowpass', 5200) * .9 * v

def place(buf, s, at):
    i = int(round(at * SR))
    if 0 <= i < len(buf): e = min(len(buf), i + len(s)); buf[i:e] += s[:e - i]

# ---------- the breaks (patterns in 16th steps) ----------
AMEN = [  # 4 bars: kick, snare (accent), ghost snares; ride 8ths throughout, crash on bar 4 step 10
    dict(k=[0, 2, 10, 11], s=[4, 12], g=[7, 9, 15]),
    dict(k=[0, 2, 10, 11], s=[4, 12], g=[7, 9, 15]),
    dict(k=[0, 2, 10], s=[4, 14], g=[7, 9]),
    dict(k=[2, 3, 10], s=[4, 14], g=[1, 7, 9], c=[10]),
]
THINK = [  # 2 bars: tight funk break, 16th hats with an open hat
    dict(k=[0, 7, 10], s=[4, 12], g=[9, 14], o=[6]),
    dict(k=[0, 3, 7, 10], s=[4, 12], g=[9, 15], o=[6]),
]
def render_break(bars, kind):
    b = np.zeros(int(len(bars) * BAR * SR) + SR)
    sw = lambda st: st * S16 + (S16 * .06 if st % 2 else 0)  # a touch of lofi swing
    for bi, P in enumerate(bars):
        o = bi * BAR
        for st in P['k']: place(b, kick(rng.uniform(.9, 1)), o + sw(st))
        for st in P['s']: place(b, snare(rng.uniform(.93, 1)), o + sw(st))
        for st in P['g']: place(b, snare(rng.uniform(.28, .4)), o + sw(st))
        for st in P.get('c', []): place(b, crash(.5), o + sw(st))
        if kind == 'amen':
            for st in range(0, 16, 2): place(b, ride(.9 if st % 4 == 0 else .6, bell=st % 8 == 0), o + sw(st))
        else:
            for st in range(16):
                if st not in P.get('o', []): place(b, hat(.34 if st % 2 == 0 else .16), o + sw(st))
            for st in P.get('o', []): place(b, hat(.3, True), o + sw(st))
    return b[:int(len(bars) * BAR * SR)]
BRK = {'amen': render_break(AMEN, 'amen'), 'think': render_break(THINK, 'think')}
NS = int(round(S16 * SR))
def sl(kind, i, n=1):
    src = BRK[kind]; tot = len(src) // NS; i %= tot; a = i * NS; return src[a:a + n * NS]
def resample(x, rate):
    if rate == 1: return x
    return np.interp(np.arange(0, len(x) - 1, rate), np.arange(len(x)), x)
def fade(x, ms=2):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n > 0: x = x.copy(); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def crush(x, bits=7, down=3):
    q = 2 ** bits; y = np.round(x * q) / q; return np.repeat(y[::down], down)[:len(x)]

# ---------- classic edits: each returns [(step, audio)] for one bar ----------
SN_SLICES = {'amen': [4, 12, 20, 28, 36, 44, 52, 62], 'think': [4, 12, 20, 28]}
def straight(kind, bar): tot = len(BRK[kind]) // NS // 16; return [(st, sl(kind, (bar % tot) * 16 + st)) for st in range(16)]
def chop(kind):  # rearranged slices, backbeat kept
    out = []
    for st in range(16):
        i = 0 if st == 0 else int(rng.choice(SN_SLICES[kind])) if st in (4, 12) else int(rng.integers(0, len(BRK[kind]) // NS))
        out.append((st, sl(kind, i)))
    return out
def three32(kind):  # 3-3-2 regrouping: K(3) S(3) K(2) | S(3) S(3) K(2)
    plan = [(0, 0, 3), (3, 4, 3), (6, 0, 2), (8, 12, 3), (11, 4, 3), (14, 2, 2)]
    return [(st, sl(kind, src, n)) for st, src, n in plan]
def machinegun(at, beats, kind='amen', src=4):  # repeated 32nd snare, crescendo
    piece = fade(sl(kind, src)[:NS // 2]); k = int(beats * 8)
    return [(at + i / 2, piece * (.45 + .55 * i / max(1, k - 1))) for i in range(k)]
def rush(at, steps, kind='amen', src=12):  # snare rush: 8ths -> 16ths -> 32nds -> 64ths, rising pitch
    ev, pos = [], at
    while pos < at + steps - 1e-6:
        f = (pos - at) / steps; div = 1 if f < .25 else 2 if f < .55 else 4 if f < .8 else 8
        rate = 1 + .6 * f; ev.append((pos, fade(resample(sl(kind, src)[:int(NS / div * rate) + 2], rate)))); pos += 1 / div
    return ev
def reverse_into(ev, kind='amen'):  # last beat: a reversed snare sucking into the next downbeat
    return [e for e in ev if e[0] < 12] + [(12, sl(kind, 12, 4)[::-1])]
def halfspeed(kind, bar):  # half-speed, pitched down an octave: the "drop"
    return [(st * 2, resample(sl(kind, bar * 8 + st), .5)) for st in range(8)]
def doubletime(kind, bar):  # two bars of break squeezed into one, up an octave: panic
    return [(st / 2, resample(sl(kind, (bar * 32 + st) % (len(BRK[kind]) // NS)), 2.0)) for st in range(32)]

def render_bar(events, gain=1.0):
    buf = np.zeros(int(BAR * SR) + SR)
    for st, s in events: place(buf, fade(s) * gain, st * S16)
    return buf

def build_drums(rage=False):
    out = np.zeros(L + 4 * SR)
    for bar in range(BARS):
        sec, r = bar // 8, bar % 8; ev = []; post = None; g = 1.0; gab = False
        if sec == 0:  # intro
            if rage:
                ev = [(0, gabber(.8)), (6, gabber(.5)), (8, gabber(.8))] + (rush(12, 4) if r == 7 else [])
            elif r >= 4:
                ev = straight('amen', bar)
                if r == 7: ev = ev[:8] + rush(8, 8)
                f = [350, 700, 1400, 3200][r - 4]; post = lambda x, f=f: filt(x, 'lowpass', f); g = .5 + .1 * (r - 4)
            else:
                ev = [(st, ride(.5 if st % 4 else .7, bell=st % 8 == 0)) for st in range(0, 16, 2)] if r >= 2 else []
        elif sec == 1:  # amen, straight, with classic edits on the turnarounds
            ev = straight('amen', bar)
            if r == 3: ev = ev[:8] + three32('amen')[3:]
            if r == 5: ev = ev[:12] + machinegun(12, 1)
            if r == 7: ev = ev[:8] + rush(8, 8)
            gab = rage
        elif sec == 2:  # think groove
            ev = straight('think', bar) if r % 2 == 0 else chop('think')
            if r % 2 == 1: ev = ev[:14] + machinegun(14, .5, 'think', 4)
            if r == 5: ev = three32('think')
            if r == 6: ev = reverse_into(ev, 'think')
            if r == 7: ev = ev[:8] + rush(8, 8, 'think', 4)
            gab = rage and r % 2 == 0
        elif sec == 3:  # breakdown: half-speed drop (rage: double-time panic)
            if rage:
                ev = doubletime('amen', bar); post = lambda x: crush(x, 7, 2) * .8 + x * .4
            elif r < 4:
                ev = halfspeed('amen', bar); post = lambda x: filt(x, 'lowpass', 2200); g = .85
            else:
                ev = [(0, kick()), (8, snare()), (14, kick(.6))] + [(st, ride(.5, bell=st % 8 == 0)) for st in range(0, 16, 2)]
                if r >= 6: ev += [(st / 2, hat(.12 + .06 * (r - 5))) for st in range(32)]
                if r == 7: ev = [e for e in ev if e[0] < 8] + rush(8, 8)
        elif sec == 4:  # peak: amen chops over gabber 4/4
            ev = chop('amen') if r % 2 else straight('amen', bar)
            if r == 1: ev = three32('amen')
            if r == 3: ev = ev[:8] + machinegun(8, 1) + machinegun(12, 1, src=12); post = lambda x: crush(x, 7, 3) * .9 + x * .3
            if r == 5: ev = reverse_into(ev)
            if r == 7: ev = ev[:8] + rush(8, 8)
            gab = True
        else:  # outro: amen sinking under a closing filter, ride alone at the end
            if r < 6 or rage:
                ev = straight('amen', bar) if r % 2 == 0 else chop('amen')
                fc = max(700, 9000 * .45 ** r) if not rage else 6000; post = lambda x, fc=fc: filt(x, 'lowpass', fc); g = 1 - .08 * r
                if rage and r % 2: ev = ev[:12] + machinegun(12, 1)
            else:
                ev = [(st, ride(.45, bell=st % 8 == 0)) for st in range(0, 16, 2)]
        x = render_bar(ev, g)
        if post is not None: x = post(x)
        if gab:
            for q in range(4): place(x, gabber(.75 if not rage else .85), q * 4 * S16)
        place(out, x, bar * BAR)
        if bar in (8, 16, 32) or (rage and bar % 8 == 0 and bar > 0): place(out, crash(.9), bar * BAR)
    return drive(filt(out, 'lowpass', 10500), 1.4)  # lofi drum bus

# ---------- melody stems + mix (same chain as theme 1) ----------
def stem(mid_in, wav_out):
    subprocess.run(['fluidsynth', '-ni', '-g', '0.6', '-R', '1', '-C', '1', '-r', str(SR), '-F', wav_out, SF2, mid_in], check=True, capture_output=True)
    w = wave.open(wav_out); return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
def fold(a):  # wrap the tail into the start so the loop is seamless
    a = np.pad(a, ((0, max(0, L + 4 * SR - len(a))), (0, 0)))[:L + 4 * SR]; body = a[:L].copy(); body[:len(a) - L] += a[L:]; return body
def kick_env(d):
    e = np.abs(filt(d, 'lowpass', 120)); e = filt(e, 'lowpass', 12); e /= e.max() + 1e-9; return 1 - .3 * np.clip(e * 1.6, 0, 1)

mus = fold(stem(os.path.join(HERE, 'gothic_requiem_176bpm.mid'), os.path.join(BUILD, 'stem2_music.wav')))
for c in range(2): mus[:, c] = filt(mus[:, c], 'lowpass', 9000) * .85 + mus[:, c] * .15  # lofi: dull the top a little
rfx = fold(stem(os.path.join(HERE, 'gothic_requiem_rage_176bpm.mid'), os.path.join(BUILD, 'stem2_rage.wav')))
for c in range(2): rfx[:, c] = filt(rfx[:, c], 'highpass', 50); rfx[:, c] = crush(rfx[:, c], 9, 2) * .5 + rfx[:, c] * .5

for rage in (False, True):
    d = build_drums(rage); d = np.pad(d, (0, max(0, L + 4 * SR - len(d))))[:L + 4 * SR]
    body = d[:L].copy(); body[:len(d) - L] += d[L:]; d = body
    m = mus / np.max(np.abs(mus))
    mix = m * kick_env(d)[:, None] * .78 + d[:, None] * np.array([[.98, .94]]) * .34 / np.max(np.abs(d))
    if rage: mix += rfx / np.max(np.abs(rfx)) * .42
    mix = drive(mix * 1.15, 1.3); mix = mix / np.max(np.abs(mix)) * .97
    name = 'battle_theme2' + ('_rage' if rage else '')
    wav = os.path.join(BUILD, name + '.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libopus', '-b:a', '96k', os.path.join(ROOT, 'audio', name + '.ogg')], check=True)
    print('done', name, round(L / SR, 2), 's')
