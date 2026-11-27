"""Sister Morwen's theme, melody and harmony only (drums/texture are synthesised in make_breakcore3.py).
Gothic atmospheric lofi breakcore, softer and longer: D harmonic minor, 140 BPM, 96 bars = 6 sections of 16.
Two bars per chord, 16-bar cycle: Dm | Dm/C | Bbmaj7 | Asus4-A7 | Gm | Dm/F | Em7b5 | A7b9 (loops back into Dm).
Melancholy colour: a cello lead, music box, harp arpeggios, choir, tolling bells, a soft organ in the breakdown."""
import os
from mutil import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gothic_morwen_140bpm.mid')
s = Song(140, "Sister Morwen's theme 140bpm", seed=31)
BAR, BEAT = 4 * PPQ, PPQ
s.track('Cello', 0, 42, reverb=100)
s.track('Music Box', 1, 10, reverb=110)
s.track('Harp', 2, 46, reverb=100)
s.track('Choir', 3, 52, reverb=120)
s.track('Bells', 4, 14, reverb=127)       # Tubular Bells
s.track('Organ', 5, 20, reverb=110)       # Reed Organ: softer than the church organ
s.track('Bass', 6, 35, reverb=40)         # Fretless
s.track('Strings', 7, 49, reverb=115)

CH = [  # root (bass), voicing, harp tones
    ('D2', ['D3', 'F3', 'A3'], ['D3', 'A3', 'D4', 'F4', 'A4']),
    ('C2', ['C3', 'F3', 'A3'], ['C3', 'A3', 'D4', 'F4', 'A4']),
    ('Bb1', ['Bb2', 'D3', 'F3', 'A3'], ['Bb2', 'F3', 'A3', 'D4', 'F4']),
    ('A1', ['A2', 'D3', 'E3', 'G3'], ['A2', 'E3', 'G3', 'C#4', 'E4']),
    ('G1', ['G2', 'Bb2', 'D3'], ['G2', 'D3', 'G3', 'Bb3', 'D4']),
    ('F1', ['F2', 'A2', 'D3'], ['F2', 'D3', 'F3', 'A3', 'D4']),
    ('E2', ['E3', 'G3', 'Bb3', 'D4'], ['E3', 'Bb3', 'D4', 'G4', 'Bb4']),
    ('A1', ['A2', 'C#3', 'G3', 'Bb3'], ['A2', 'E3', 'G3', 'Bb3', 'C#4']),
]
A = [('A3', 4), ('F3', 2), ('E3', 1), ('D3', 1),  ('E3', 2), ('F3', 2), ('G3', 2), ('A3', 2),
     ('D4', 3), ('C4', 1), ('Bb3', 2), ('A3', 2), ('A3', 2), ('D4', 2), ('C#4', 4),
     ('Bb3', 3), ('A3', 1), ('G3', 2), ('D4', 2), ('F4', 4), ('E4', 2), ('D4', 2),
     ('G4', 3), ('F4', 1), ('E4', 2), ('Bb3', 2), ('C#4', 4), ('E4', 2), ('A3', 2)]
B = [('A5', 1), ('F5', 1), ('D5', 1), ('A4', 1), ('F5', 2), ('E5', 2),  ('D5', 1), ('E5', 1), ('F5', 1), ('A5', 1), ('G5', 3), ('F5', 1),
     ('F5', 2), ('D5', 1), ('Bb4', 1), ('A5', 2), ('F5', 2),            ('E5', 2), ('D5', 2), ('C#5', 2), ('E5', 2),
     ('D5', 1), ('Bb4', 1), ('G4', 1), ('Bb4', 1), ('D5', 2), ('G5', 2), ('F5', 3), ('E5', 1), ('D5', 2), ('A4', 2),
     ('Bb4', 2), ('D5', 1), ('E5', 1), ('G5', 2), ('F5', 2),            ('E5', 2), ('C#5', 2), ('Bb5', 2), ('A5', 2)]
assert sum(b for _, b in A) == 64 and sum(b for _, b in B) == 64

def mel(bar0, motif, name, vel, oct=0, legato=.95, sparse=False):
    t = bar0 * BAR
    for i, (nm, b) in enumerate(motif):
        if not (sparse and i % 3 == 1): s.add(name, t, n(nm) + 12 * oct, vel, b * BEAT * legato)
        t += b * BEAT
def each(bar0, bars, fn):
    for k in range(0, bars, 2): fn((bar0 + k) * BAR, CH[(k // 2) % 8])
def harp(bar0, bars=16, vel=50):
    def f(t, c):
        tones = c[2]; order = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 2]
        for i in range(16): s.add('Harp', t + i * BEAT // 2, n(tones[order[i]]) + 12, vel - (6 if i % 2 else 0), BEAT * 1.6)
    each(bar0, bars, f)
def choir(bar0, bars=16, vel=40):
    each(bar0, bars, lambda t, c: [s.add('Choir', t, n(v) + 12, vel, 2 * BAR - 20, jitter=2) for v in c[1]])
def strings(bar0, bars=16, vel=40):
    each(bar0, bars, lambda t, c: [s.add('Strings', t, n(v) + 12, vel, 2 * BAR - 20, jitter=2) for v in c[1][1:]])
def organ(bar0, bars=16, vel=38):
    each(bar0, bars, lambda t, c: [s.add('Organ', t, n(v), vel, 2 * BAR - 20, jitter=2) for v in c[1]])
def bass(bar0, bars=16, vel=74):
    def f(t, c):
        r = n(c[0])
        for b in range(2): s.add('Bass', t + b * BAR, r, vel, BEAT * 3.2); s.add('Bass', t + b * BAR + 3 * BEAT, r + (7 if b else 12), vel - 14, BEAT * .9)
    each(bar0, bars, f)
def bell(bar, note='D4', vel=58): s.add('Bells', bar * BAR, n(note), vel, 2 * BAR)

# 1. Intro (0-15): bells toll, harp alone, then choir; the music box hints at B
bell(0); bell(8, 'A3', 50); harp(0, vel=44); choir(8, 8, vel=34); mel(8, B[:9], 'Music Box', 46)
# 2. Cello enters (16-31): melody A over harp, bass, choir
bell(16); harp(16); bass(16); choir(16, vel=36); mel(16, A, 'Cello', 78)
# 3. Music box on B (32-47), strings pad, cello answers sparsely an octave down
harp(32, vel=46); bass(32); strings(32); mel(32, B, 'Music Box', 56); mel(32, A, 'Cello', 52, oct=-1, sparse=True)
# 4. Breakdown (48-63): organ and choir, bells, cello alone on A (rubato feel: legato)
bell(48); bell(56, 'A3', 52); organ(48); choir(48, vel=42); mel(48, A, 'Cello', 70, legato=1.05)
# 5. Peak (64-79): everything, cello on A with music box on B above
bell(64); harp(64, vel=50); bass(64, vel=80); choir(64, vel=44); strings(64, vel=44); mel(64, A, 'Cello', 84); mel(64, B, 'Music Box', 50)
# 6. Outro (80-95): harp and music box fade back to the intro's stillness, ends on A7b9
bell(80); harp(80, vel=42); choir(80, 8, vel=32); mel(80, B, 'Music Box', 42, sparse=True); bell(94, 'A3', 40)

print(round(s.save(OUT), 1), 's ->', OUT)
