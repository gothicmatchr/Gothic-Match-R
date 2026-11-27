"""Atmospheric lofi breakcore: keeps the gothic melody/harmony render, replaces the soft
General MIDI drums with a synthesised breakbeat that is sliced, chopped, stuttered,
rolled and crushed the way breakcore edits a break. Builds the calm loop and the rage loop."""
import numpy as np, wave, subprocess, mido, os
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 170
BAR = 4 * 60 / BPM
S16 = BAR / 16
BARS = 48
L = int(round(BARS * BAR * SR))
rng = np.random.default_rng(170)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
M = os.path.join(HERE, 'build'); os.makedirs(M, exist_ok=True)

def T(d): return np.arange(int(d * SR)) / SR
def filt(x, kind, f, order=2):
    sos = butter(order, f, kind, fs=SR, output='sos'); return sosfilt(sos, x)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def drive(x, k): return np.tanh(x * k) / np.tanh(k)

# ---------- one-shots ----------
def kick(v=1):
    t = T(.32); f = 44 + 120 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8.5)
    click = filt(noise(.004), 'highpass', 2500) * np.linspace(1, 0, int(.004 * SR))
    x = body.copy(); x[:len(click)] += click * .5
    return drive(x * 1.4, 2.2) * v
def snare(v=1):
    t = T(.26)
    tone = (np.sin(2 * np.pi * 186 * t) * np.exp(-t * 22) + .55 * np.sin(2 * np.pi * 332 * t) * np.exp(-t * 30))
    nz = filt(filt(noise(.26), 'highpass', 1400), 'lowpass', 9000) * np.exp(-t * 15)
    return drive(tone * .8 + nz * 1.1, 2.0) * v
def hat(v=1, open_=False):
    d = .26 if open_ else .05; t = T(d)
    return filt(noise(d), 'highpass', 7000) * np.exp(-t * (11 if open_ else 65)) * v
def ride(v=1):
    t = T(.7); x = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (587, 845, 1243, 1677, 2211))
    return filt(x, 'highpass', 3500) * np.exp(-t * 5.5) * .12 * v
def crash(v=1):
    t = T(1.4); return filt(noise(1.4), 'highpass', 2800) * np.exp(-t * 2.6) * .7 * v

def place(buf, s, at):
    i = int(round(at * SR))
    if i >= len(buf): return
    e = min(len(buf), i + len(s)); buf[i:e] += s[:e - i]

# ---------- the break: two bars, original groove, slight lofi swing ----------
def render_break():
    b = np.zeros(int(2 * BAR * SR) + SR)
    sw = lambda st: st * S16 + (S16 * .07 if st % 2 else 0)
    A = {'k': [0, 2, 10, 11], 's': [4, 12], 'g': [7, 9, 15]}
    B = {'k': [0, 2, 10], 's': [4, 12], 'g': [7, 9, 14], 'o': [14]}
    for bi, P in enumerate((A, B)):
        off = bi * BAR
        for st in P['k']: place(b, kick(rng.uniform(.9, 1)), off + sw(st))
        for st in P['s']: place(b, snare(rng.uniform(.92, 1)), off + sw(st))
        for st in P['g']: place(b, snare(rng.uniform(.25, .35)), off + sw(st))
        for st in range(0, 16, 2):
            if st not in P.get('o', []): place(b, hat(.32 if st % 4 else .42), off + sw(st))
        for st in range(1, 16, 2): place(b, hat(.13), off + sw(st))
        for st in P.get('o', []): place(b, hat(.3, True), off + sw(st))
    return b[:int(2 * BAR * SR)]

BRK = render_break()
NS = int(round(S16 * SR))
def sl(i, n=1):  # slice i of the 32 sixteenth slices, n slices long
    i %= 32; a = int(round(i * S16 * SR)); return BRK[a:a + int(round(n * S16 * SR))]
def resample(x, rate):
    if rate == 1: return x
    idx = np.arange(0, len(x) - 1, rate); return np.interp(idx, np.arange(len(x)), x)
def fade(x, ms=2):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n > 0: x = x.copy(); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def crush(x, bits=8, down=3):
    q = 2 ** bits; y = np.round(x * q) / q; y = np.repeat(y[::down], down)[:len(x)]; return y

def bar_play(src_bar):  # straight break bar
    return [(st, sl(src_bar * 16 + st)) for st in range(16)]
def bar_chop():  # rearranged slices, keeping the backbeat
    out = []
    for st in range(16):
        if st == 0: i = 0
        elif st in (4, 12): i = rng.choice([4, 12, 20, 28])
        else: i = int(rng.integers(0, 32))
        out.append((st, sl(i)))
    return out
def stutter(at_step, src, reps, div):  # repeat a short piece of one slice
    piece = fade(sl(src)[:int(NS / div)]); return [(at_step + k / div, piece) for k in range(reps)]
def pitchroll(at_step, steps, src=4):  # accelerating, rising snare roll
    ev, pos, k = [], at_step, 0
    while pos < at_step + steps - 1e-6:
        div = 2 if pos < at_step + steps * .4 else 4 if pos < at_step + steps * .75 else 8
        rate = 1 + .5 * (pos - at_step) / steps
        ev.append((pos, fade(resample(sl(src)[:int(NS / div * rate)], rate)))); pos += 1 / div; k += 1
    return ev

def render_bar(events, gain=1.0):
    buf = np.zeros(int(BAR * SR) + SR)
    for st, s in events: place(buf, fade(s) * gain, st * S16)
    return buf

def build_drums(rage=False):
    out = np.zeros(L + 4 * SR)
    def put(bar, x): place(out, x, bar * BAR)
    for bar in range(BARS):
        sec = bar // 8; ev = []; post = None; g = 1.0
        if sec == 0:
            if rage:  # muffled half-time heartbeat break under the intro
                ev = [(0, sl(0, 2)), (8, sl(4, 2))] + ([(14, sl(9)), (15, sl(10))] if bar % 2 else [])
                post = lambda x: filt(x, 'lowpass', 700); g = .8
            elif bar >= 6:  # filtered break rising in
                ev = bar_play(bar % 2); f = 500 if bar == 6 else 1600
                post = lambda x, f=f: filt(x, 'lowpass', f); g = .55 if bar == 6 else .75
                if bar == 7: ev = ev[:12] + stutter(12, 4, 8, 2)
            else:
                continue
        elif sec in (1, 4) or (sec == 2):
            heavy = sec == 4 or rage
            r = bar % 8
            if sec == 1 and not rage:
                ev = bar_chop() if r == 5 else bar_play(bar % 2)
                if r == 3: ev = ev[:14] + stutter(14, 12, 4, 2)
                if r == 7: ev = ev[:8] + pitchroll(8, 8)
            else:
                ev = bar_chop() if (r % 2 == 1 or heavy) else bar_play(bar % 2)
                if r % 2 == 1: ev = ev[:12] + stutter(12, int(rng.choice([4, 12])), 8, 2)
                if r == 3 and heavy: ev = ev[:8] + stutter(8, 0, 8, 4) + stutter(10, 4, 4, 2) + ev[12:]
                if r == 5: ev = [(st, s[::-1] if st in (14, 15) else s) for st, s in ev]   # reversed hits into the downbeat
                if r == 7: ev = ev[:8] + pitchroll(8, 8, int(rng.choice([4, 12])))
                if (r == 3 and sec == 4) or (rage and r % 4 == 2): post = lambda x: crush(x, 7, 3) * .9 + x * .3
        elif sec == 3:
            if rage:  # double-time panic instead of the half-time breakdown
                ev = bar_chop() + stutter(14, 4, 8, 4)
            else:
                ev = [(0, kick()), (8, snare()), (3, snare(.25)), (11, snare(.22)), (14, kick(.7))]
                ev += [(st, ride(.9 if st % 4 == 0 else .6)) for st in range(0, 16, 2)]
                if bar >= 29: ev += [(st / 2, hat(.18 + .1 * (bar - 29))) for st in range(32)]
                if bar == 31: ev = [e for e in ev if e[0] < 8] + pitchroll(8, 8)
        elif sec == 5:
            r = bar % 8
            if r < 6 or rage:
                ev = bar_play(bar % 2) if (r % 2 == 0 and not rage) else bar_chop()
                fc = 8000 * (0.35 ** (r / 5)) if not rage else 6000
                post = lambda x, fc=fc: filt(x, 'lowpass', max(700, fc)); g = 1 - .1 * r if not rage else 1
                if rage and r % 2: ev = ev[:12] + stutter(12, 4, 8, 4)
            else:
                ev = [(st, hat(.12)) for st in range(0, 16, 2)]
        x = render_bar(ev, g)
        if post is not None: x = post(x)
        put(bar, x)
        if bar in (8, 16, 32) or (rage and bar % 8 == 0 and bar > 0): place(out, crash(.9), bar * BAR)
    # lofi tone on the drum bus: gentle low-pass, a little saturation
    out = drive(filt(out, 'lowpass', 10500), 1.4)
    return out

def melody_stem(mid_in, wav_out, drop):
    m = mido.MidiFile(mid_in)
    m.tracks = [t for t in m.tracks if not any(getattr(e, 'name', '') in drop for e in t if e.type == 'track_name')]
    tmp = f'{M}/_stem.mid'; m.save(tmp)
    subprocess.run(['fluidsynth', '-ni', '-g', '0.6', '-R', '1', '-C', '1', '-F', wav_out, '/usr/share/sounds/sf2/default-GM.sf2', tmp],
                   check=True, capture_output=True)
def rd(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
    return a.mean(1)  # mono-sum is fine for the stems' level matching; stereo kept below
def rd2(p):
    w = wave.open(p); return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
def fold(a):  # wrap the tail into the start so the loop is seamless
    a = np.pad(a, ((0, max(0, L + 4 * SR - len(a))), (0, 0)))[:L + 4 * SR]
    body = a[:L].copy(); tail = a[L:]; body[:len(tail)] += tail; return body
def kick_env(drums):  # sidechain: duck the music a touch on each kick
    e = np.abs(filt(drums, 'lowpass', 120)); e = filt(e, 'lowpass', 12); e /= e.max() + 1e-9
    return 1 - .28 * np.clip(e * 1.6, 0, 1)

def write(name, x):
    x = x / np.max(np.abs(x)) * .97
    with wave.open(f'{M}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())

melody_stem(f'{HERE}/gothic_lofi_breakcore_170bpm.mid', f'{M}/stem_music.wav', {'Drums'})
melody_stem(f'{HERE}/gothic_rage_layer_170bpm.mid', f'{M}/stem_ragefx.wav', {'Rage Drums'})
mus = fold(rd2(f'{M}/stem_music.wav'))
rfx = rd2(f'{M}/stem_ragefx.wav'); rfx = fold(np.stack([filt(rfx[:, c], 'highpass', 50) for c in range(2)], 1))
for c in range(2): rfx[:, c] = crush(rfx[:, c], 9, 2) * .5 + rfx[:, c] * .5

for rage in (False, True):
    d = build_drums(rage); d = np.pad(d, (0, max(0, L + 4 * SR - len(d))))[:L + 4 * SR]
    body = d[:L].copy(); body[:len(d) - L] += d[L:]; d = body
    duck = kick_env(d)[:, None]
    m = mus / np.max(np.abs(mus))
    mixd = m * duck * .8 + d[:, None] * np.array([[.98, .94]]) * .3 / np.max(np.abs(d))
    if rage: mixd += rfx / np.max(np.abs(rfx)) * .42
    mixd = drive(mixd * 1.15, 1.3)
    write('loop_rage' if rage else 'loop', mixd)
    out = f'{ROOT}/audio/battle_theme' + ('_rage' if rage else '') + '.ogg'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{M}/{"loop_rage" if rage else "loop"}.wav', '-c:a', 'libopus', '-b:a', '96k', out], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{M}/{"loop_rage" if rage else "loop"}.wav', '-b:a', '160k',
                    f'{M}/{"rage" if rage else "battle"}_breakcore_preview.mp3'], check=True)
    print('done', 'rage' if rage else 'calm', round(L / SR, 2), 's')
