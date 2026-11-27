"""Second battle theme, melody and harmony only (drums are synthesised in make_breakcore2.py).
Gothic atmospheric lofi breakcore, D harmonic minor, 176 BPM. 48 bars = 6 sections of 8 bars,
one chord per bar: Dm | C#dim7 | Dm/F | Gm | Bb | Gm6 | Asus4 | A7, so the loop always turns back into Dm.
Colour: church organ, a fast baroque harpsichord, celesta, a lofi violin lead and a choir."""
import os
from mutil import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gothic_requiem_176bpm.mid')
s = Song(176, 'Gothic requiem breakcore 176bpm', seed=27)
BAR, BEAT, S16 = 4 * PPQ, PPQ, PPQ // 4
r = s.rng
s.track('Organ', 0, 19, reverb=95)        # Church Organ
s.track('Harpsichord', 1, 6, reverb=55)
s.track('Celesta', 2, 8, reverb=90)
s.track('Violin', 3, 40, reverb=85)
s.track('Choir', 4, 52, reverb=110)       # Choir Aahs
s.track('Bass', 5, 39, reverb=20)         # Synth Bass 2
s.track('Strings', 6, 49, reverb=100)     # Slow Strings

CH = [  # bass root, organ voicing, arp tones (4)
    ('D2', ['D3', 'F3', 'A3', 'D4'], ['D4', 'F4', 'A4', 'D5']),
    ('C#2', ['C#3', 'E3', 'G3', 'Bb3'], ['C#4', 'E4', 'G4', 'Bb4']),
    ('F1', ['F2', 'A2', 'D3', 'F3'], ['F4', 'A4', 'D5', 'F5']),
    ('G1', ['G2', 'Bb2', 'D3', 'G3'], ['G4', 'Bb4', 'D5', 'G5']),
    ('Bb1', ['Bb2', 'D3', 'F3', 'A3'], ['Bb3', 'D4', 'F4', 'A4']),
    ('G1', ['G2', 'Bb2', 'D3', 'E3'], ['G4', 'Bb4', 'D5', 'E5']),
    ('A1', ['A2', 'D3', 'E3', 'A3'], ['A3', 'D4', 'E4', 'A4']),
    ('A1', ['A2', 'C#3', 'E3', 'G3'], ['A3', 'C#4', 'E4', 'G4']),
]

# Motifs: (note, beats). A = the hook (falling, plaintive), B = the climb (augmented 2nd Bb-C# for the harmonic-minor bite)
A = [('D5', 1.5), ('A4', .5), ('F4', 1), ('E4', 1),   ('C#5', 2), ('Bb4', 1), ('A4', 1),
     ('F4', 1.5), ('G4', .5), ('A4', 2),              ('G4', 1), ('F4', 1), ('E4', 1), ('D4', 1),
     ('F4', 1.5), ('E4', .5), ('D4', 1), ('Bb4', 1),  ('A4', 2), ('G4', 1), ('E4', 1),
     ('E4', 1), ('F4', 1), ('G4', 1), ('A4', 1),      ('C#5', 3), ('E4', 1)]
B = [('A4', .5), ('Bb4', .5), ('C#5', 1), ('D5', 1), ('E5', 1),  ('F5', 2), ('E5', 1), ('Bb4', 1),
     ('A4', 1), ('D5', 1), ('F5', 1), ('A5', 1),                ('G5', 1.5), ('F5', .5), ('E5', 1), ('D5', 1),
     ('D5', 1), ('F5', 1), ('Bb5', 2),                          ('G5', 1), ('E5', 1), ('D5', 1), ('Bb4', 1),
     ('A4', 1), ('D5', 1), ('E5', 2),                           ('C#5', 1), ('E5', 1), ('A5', 2)]

def mel(bar0, motif, name, vel, octave=0, sparse=False, legato=.92):
    t = bar0 * BAR
    for i, (nm, b) in enumerate(motif):
        if not (sparse and i % 3 == 2):
            s.add(name, t, n(nm) + 12 * octave, vel, b * BEAT * legato)
        t += b * BEAT

def organ(bar0, bars=8, vel=50):
    for k in range(bars):
        root, voi, _ = CH[k % 8]
        for v in voi: s.add('Organ', (bar0 + k) * BAR, n(v), vel, BAR - 15, jitter=2)

def strings(bar0, bars=8, vel=44):
    for k in range(0, bars, 2):
        _, voi, _ = CH[k % 8]
        for v in voi[1:]: s.add('Strings', (bar0 + k) * BAR, n(v) + 12, vel, 2 * BAR - 20, jitter=2)

def choir(bar0, bars=8, vel=42):
    for k in range(bars):
        _, voi, _ = CH[k % 8]
        for v in voi[1:3]: s.add('Choir', (bar0 + k) * BAR, n(v) + 12, vel, BAR - 15, jitter=2)

def bass(bar0, bars=8, busy=False, vel=92):
    for k in range(bars):
        root = n(CH[k % 8][0]); t = (bar0 + k) * BAR
        pat = [(0, 0, 1.4), (1.5, 0, .4), (2.5, 7, .4), (3, 12, .8)] if not busy else \
              [(0, 0, .45), (.75, 0, .2), (1.5, 12, .3), (2, 0, .45), (2.75, 7, .2), (3, 10 if k % 8 in (0, 3) else 12, .3), (3.5, 7, .3)]
        for beat, iv, ln in pat: s.add('Bass', t + beat * BEAT, root + iv, vel - (12 if beat % 1 else 0), ln * BEAT)

def harpsi(bar0, bars=8, vel=46, sixteenths=True):
    order = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 3, 0, 2, 1, 3]
    for k in range(bars):
        _, _, tones = CH[k % 8]; t = (bar0 + k) * BAR
        steps = 16 if sixteenths else 8
        for i in range(steps):
            ln = S16 if sixteenths else 2 * S16
            s.add('Harpsichord', t + i * ln, n(tones[order[i] if sixteenths else order[i * 2]]), vel + (8 if i % 4 == 0 else 0), ln - 8)

# 1. Intro (0-7): organ alone, celesta states the hook
organ(0, vel=42); mel(0, A, 'Celesta', 58, octave=1)
# 2. Break in (8-15): bass, 8th harpsichord, violin takes the hook
organ(8, vel=40); bass(8); harpsi(8, sixteenths=False); mel(8, A, 'Violin', 74)
# 3. Think groove (16-23): busy bass, 16th harpsichord, celesta climbs on motif B, choir pad
bass(16, busy=True); harpsi(16); choir(16); mel(16, B, 'Celesta', 62, octave=1)
# 4. Breakdown (24-31): strings + choir, violin sparse, organ swells back in for the last 2 bars
strings(24, vel=48); choir(24, vel=46); mel(24, A, 'Violin', 60, sparse=True, legato=1.1); organ(30, bars=2, vel=56)
# 5. Peak (32-39): everything, violin on B, harpsichord 16ths, organ
organ(32, vel=48); bass(32, busy=True, vel=96); harpsi(32, vel=50); choir(32, vel=44); mel(32, B, 'Violin', 84)
mel(32, B, 'Celesta', 46, octave=1, sparse=True)
# 6. Outro (40-47): thins to organ + celesta hook, lands on A7 so the loop returns to Dm
organ(40, vel=40); bass(40, bars=4, vel=80); mel(40, A, 'Celesta', 54, octave=1, sparse=True); strings(44, bars=4, vel=40)

print(round(s.save(OUT), 1), 's ->', OUT)
