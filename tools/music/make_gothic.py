"""Atmospheric lofi breakcore with gothic synth melodies. D harmonic minor, 170 BPM.
48 bars = 6 sections of 8 bars. Ends on the A chord so it loops back into Dm."""
import random
import mido

random.seed(13)
PPQ, BPM = 480, 170
BEAT = PPQ
BAR = 4 * BEAT
S16 = BEAT // 4
SWING = 18  # ticks of delay on off-beat 16ths: lofi lilt

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}

def n(name):
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTE[p]

tracks = {}  # name -> (channel, program, [(tick, note, vel, len)])

def track(name, ch, prog):
    tracks[name] = (ch, prog, [])

def add(name, tick, note, vel, length):
    vel = max(1, min(127, vel + random.randint(-4, 4)))
    tracks[name][2].append((int(tick), note, vel, int(length)))

track('Drums', 9, 0)
track('Bass', 0, 38)          # Synth Bass 1
track('Pad', 1, 89)           # Warm Pad
track('Choir', 2, 52)         # Choir Aahs
track('Music Box', 3, 10)     # Music Box
track('Harpsichord', 4, 6)    # Harpsichord

# Chords: one per 2 bars, 8-bar cycle
CHORDS = [  # (bass root, pad voicing, arp tones)
    ('D2',  ['D3', 'F3', 'A3', 'E4'],  ['D4', 'F4', 'A4', 'E5']),   # Dm(add9)
    ('Bb1', ['Bb2', 'D3', 'F3', 'A3'], ['Bb3', 'D4', 'F4', 'A4']),  # Bbmaj7
    ('G1',  ['G2', 'Bb2', 'D3', 'A3'], ['G3', 'Bb3', 'D4', 'A4']),  # Gm9
    ('A1',  ['A2', 'C#3', 'E3', 'G3'], ['A3', 'C#4', 'E4', 'G4']),  # A7 (harmonic minor)
]

MOTIF_A = [  # (note, beats) over 8 bars
    ('A4', 2), ('F4', 1), ('E4', 1), ('D4', 3), ('A3', 1),
    ('Bb4', 2), ('A4', 1), ('G4', 1), ('F4', 3), ('D4', 1),
    ('G4', 1.5), ('A4', .5), ('Bb4', 2), ('D5', 2), ('C5', 1), ('Bb4', 1),
    ('A4', 2), ('G4', 1), ('F4', 1), ('E4', 2), ('C#4', 2),
]
MOTIF_B = [
    ('D5', 1), ('C#5', .5), ('D5', .5), ('E5', 1), ('F5', 1), ('E5', 2), ('D5', 1), ('A4', 1),
    ('F5', 2), ('E5', .5), ('D5', .5), ('C5', 1), ('D5', 3), ('Bb4', 1),
    ('G4', 1), ('Bb4', 1), ('D5', 1), ('G5', 1), ('F5', 2), ('E5', 1), ('D5', 1),
    ('E5', 2), ('C#5', 1), ('A4', 1), ('A4', 4),
]

def melody(bar0, motif, vel=72, name='Music Box', sparse=False):
    t = bar0 * BAR
    for i, (nm, beats) in enumerate(motif):
        if not (sparse and i % 2):
            add(name, t, n(nm), vel, beats * BEAT * .95)
        t += beats * BEAT

def harmony(bar0, pad=True, bass=True, arp=False, choir=False, pad_vel=52):
    for c, (root, voicing, tones) in enumerate(CHORDS):
        start = (bar0 + 2 * c) * BAR
        if pad:
            for v in voicing:
                add('Pad', start, n(v), pad_vel, 2 * BAR - 20)
        if choir:
            for v in voicing[1:3]:
                add('Choir', start, n(v) + 12, 40, 2 * BAR - 20)
        if bass:
            r = n(root)
            for b in range(2):
                s = start + b * BAR
                add('Bass', s, r, 88, BEAT * 2.4)
                add('Bass', s + int(BEAT * 2.5), r + 7, 70, BEAT * .45)
                add('Bass', s + BEAT * 3, r + (12 if b else 0), 80, BEAT * .9)
        if arp:
            order = [0, 1, 2, 3, 2, 1, 2, 3]   # rising-falling 8ths
            for i in range(16):
                add('Harpsichord', start + i * BEAT // 2, n(tones[order[i % 8]]), 44, BEAT // 2 - 10)

# ---- Drums (lofi: softer velocities, swing on off-16ths) ----
K, SN, RIM, CH, OH, RIDE, CRASH, LT, HT = 36, 38, 37, 42, 46, 51, 49, 45, 50

def dhit(tick, note, vel, length=S16 // 2):
    step = round((tick % BAR) / S16) if (tick % S16) == 0 else -1
    if step >= 0 and step % 2 == 1:
        tick += SWING
    add('Drums', tick, note, vel, length)

def grid(bar, pattern):
    vel = {'x': 100, 'o': 76, 'g': 30}
    for note, row in pattern.items():
        for i, c in enumerate(row):
            if c in vel:
                dhit(bar * BAR + i * S16, note, vel[c])

MAIN = {K: 'x.o.......o..o..', SN: '....x..g.g..x..g', CH: 'o.g.o.g.o.g.o.g.'}
ALT = {K: 'x.o.......xo....', SN: '....x..g.gx.x.g.', CH: 'o.g.o.g.o.g.o...', OH: '..............o.'}
HALF = {K: 'x.......x.o.....', SN: '........x.......', RIDE: 'o...o...o...o...'}
THIN = {RIM: '....o.......o...', CH: 'g.g.g.g.g.g.g.g.'}

def roll(bar, s16, e16, div, note=SN, v0=40, v1=95):
    steps = (e16 - s16) * div
    for i in range(steps):
        add('Drums', bar * BAR + s16 * S16 + i * S16 / div, note,
            int(v0 + (v1 - v0) * i / max(1, steps - 1)), S16 / div / 2)

def stutter(bar):
    pos = 0
    for size in [4, 4, 2, 2, 1, 1, 1, 1]:
        add('Drums', bar * BAR + pos * S16, K, 95, 40)
        if size >= 2:
            add('Drums', bar * BAR + (pos + 1) * S16, SN, 55, 40)
        add('Drums', bar * BAR + pos * S16, CH, 45, 40)
        pos += size

def break_section(bar0, chops=False, fill_last=True):
    for b in range(8):
        bar = bar0 + b
        if chops and b == 5:
            stutter(bar)
        elif b == 7 and fill_last:
            grid(bar, {K: 'x.o.......o.....', SN: '....x..g.g......', CH: 'o.g.o.g.o.g.....'})
            roll(bar, 12, 16, 2)
        else:
            grid(bar, ALT if b % 2 else MAIN)
    add('Drums', bar0 * BAR, CRASH, 80, BAR)

# ---- Arrangement ----
# 1. Intro (0-7): pad + music box, no drums, rising rim at the end
harmony(0, bass=False, pad_vel=45)
melody(0, MOTIF_A, vel=60)
for b in (6, 7):
    grid(b, THIN)
roll(7, 8, 16, 2, RIM, 20, 70)
# 2. Break in (8-15)
harmony(8)
melody(8, MOTIF_A)
break_section(8)
# 3. Main 2 (16-23): motif B, harpsichord arps, a stutter chop
harmony(16, arp=True)
melody(16, MOTIF_B)
break_section(16, chops=True)
# 4. Breakdown (24-31): half-time, choir, sparse melody
harmony(24, choir=True, pad_vel=48)
melody(24, MOTIF_A, vel=58, sparse=True)
for b in range(24, 32):
    grid(b, HALF)
roll(31, 8, 12, 2, LT, 50, 80)
roll(31, 12, 16, 4, SN, 50, 100)
# 5. Peak (32-39): everything
harmony(32, arp=True, choir=True)
melody(32, MOTIF_B, vel=80)
break_section(32, chops=True)
# 6. Outro (40-47): thins out, lands on A so the loop returns to Dm
harmony(40, pad_vel=45)
melody(40, MOTIF_A, vel=55, sparse=True)
for b in range(40, 46):
    grid(b, MAIN if b < 44 else THIN)
for b in (46, 47):
    grid(b, THIN)
roll(47, 12, 16, 2, RIM, 30, 70)

# ---- Write a format-1 MIDI with one track per instrument ----
mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)
meta = mido.MidiTrack(); mid.tracks.append(meta)
meta.append(mido.MetaMessage('track_name', name='Gothic lofi breakcore 170bpm', time=0))
meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM), time=0))
meta.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
for name, (ch, prog, evs) in tracks.items():
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('track_name', name=name, time=0))
    if ch != 9:
        tr.append(mido.Message('program_change', channel=ch, program=prog, time=0))
        tr.append(mido.Message('control_change', channel=ch, control=91, value=70, time=0))  # reverb send
    msgs = []
    for t, note, v, l in evs:
        msgs.append((t, 1, mido.Message('note_on', channel=ch, note=note, velocity=v)))
        msgs.append((t + max(10, l), 0, mido.Message('note_off', channel=ch, note=note, velocity=0)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    now = 0
    for t, _, m in msgs:
        m.time = t - now; now = t; tr.append(m)
mid.save('/home/claude/music/gothic_lofi_breakcore_170bpm.mid')
print({k: len(v[2]) for k, v in tracks.items()}, round(mid.length, 1), 's')
