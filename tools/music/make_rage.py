"""Rage layer for the gothic lofi breakcore theme: extra drums and jarring breakcore FX.
Same tempo, key and 48-bar length as the base loop, so it lines up bar for bar."""
from mutil import *

s = Song(170, 'Rage layer (play over base theme)', seed=66)
BAR, BEAT, S16 = 4 * PPQ, PPQ, PPQ // 4
r = s.rng
s.track('Rage Drums', 9)
s.track('Orchestra Hit', 5, 55, reverb=50)
s.track('Reverse Cymbal', 6, 119, reverb=40)
s.track('Organ Drone', 7, 19, reverb=90)
s.track('Dive Synth', 8, 81, bend_range=24, reverb=60)

def d(tick, note, vel, length=S16 // 2):
    s.add('Rage Drums', tick, note, vel, length)

def roll(bar, s16, e16, div, note=SN, v0=40, v1=100):
    steps = (e16 - s16) * div
    for i in range(steps):
        d(bar * BAR + s16 * S16 + i * S16 / div, note, int(v0 + (v1 - v0) * i / max(1, steps - 1)), S16 / div / 2)

for bar in range(48):
    b0 = bar * BAR
    sec = bar // 8
    if sec == 0:  # calm intro becomes a heartbeat
        d(b0, K, 78); d(b0 + 3 * S16, K, 58)
        d(b0 + 8 * S16, LT, 40)
        for i in range(32):
            if r.random() < .5:
                d(b0 + i * S16 / 2, CH, 18 + r.randint(0, 14))
        if bar == 7:
            roll(7, 8, 16, 4, SN, 20, 90)
        continue
    if sec == 3:  # half-time breakdown gets a double-time break against it
        pat_k = 'x.....x...x.....'; pat_s = '....x..g.g..x..g'
    else:
        pat_k = r.choice(['x..x......x..x..', 'x.....xx..x...x.', 'xx........x.x...'])
        pat_s = r.choice(['..g.x.g...gx..g.', '.g..x..gg...x.gg'])
    for i, c in enumerate(pat_k):
        if c == 'x': d(b0 + i * S16, K, 70)
    for i, c in enumerate(pat_s):
        if c == 'x': d(b0 + i * S16, SN, 74)
        elif c == 'g': d(b0 + i * S16, SN, 28)
    for i in range(16):  # restless hats with 32nd ratchets
        d(b0 + i * S16, CH, 34 + (12 if i % 4 == 0 else 0))
        if r.random() < .25:
            d(b0 + i * S16 + S16 / 2, CH, 26)
    if bar % 2 == 1:  # stutter-chop into the next downbeat
        for i in range(6):
            d(b0 + 13 * S16 + i * S16 / 2, K if i % 2 == 0 else CLAP, 50 + i * 8, S16 / 4)
    if bar % 4 == 3:
        roll(bar, 14, 16, 4, SN, 50, 110)
        d(b0 + 15 * S16 + S16 / 2, CHINA, 70, S16)

# Jarring orchestra stabs: flat 2nd and tritone against the D minor key
for bar in range(8, 48, 2):
    pos = r.choice([3, 6, 7, 10, 11, 14])
    t = bar * BAR + pos * S16
    for nm in ('Eb4', 'A4'):
        s.add('Orchestra Hit', t, n(nm), 66, S16 * 2)
    if r.random() < .4:  # glitch repeat of the stab
        for k in range(1, 4):
            for nm in ('Eb4', 'A4'):
                s.add('Orchestra Hit', t + k * S16 / 2, n(nm), 50 - k * 8, S16 / 3)

# Reverse cymbal swells into every 4-bar block
for bar in range(3, 48, 4):
    s.add('Reverse Cymbal', bar * BAR, n('C5'), 58, BAR)

# Uneasy organ drone: D with a tritone, swelling every 2 bars
for bar in range(0, 48, 2):
    for nm in ('D2', 'Ab2'):
        s.add('Organ Drone', bar * BAR, n(nm), 34, 2 * BAR - 30, jitter=2)
    if bar % 8 == 6:
        s.add('Organ Drone', bar * BAR + BAR, n('Eb3'), 30, BAR - 30)

# Pitch-dive glitches: a note that plunges two octaves
for bar in range(5, 48, 3):
    t = bar * BAR + r.choice([2, 6, 9, 13]) * S16
    note = n(r.choice(['D5', 'A5', 'C#5']))
    s.add('Dive Synth', t, note, 56, BEAT // 2)
    for i in range(9):
        s.bend('Dive Synth', t + i * BEAT / 16, -8192 * i / 8)
    s.bend('Dive Synth', t + BEAT // 2 + 5, 0)

print(round(s.save('/home/claude/music/gothic_rage_layer_170bpm.mid'), 1), 's')
