"""Rage layer for Sister Morwen's theme (140 BPM, 96 bars, lines up bar for bar with make_gothic3.py).
Non-drum colour: dissonant choir clusters, detuned bells, a tritone organ drone, reverse swells, slow pitch dives."""
import os
from mutil import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gothic_morwen_rage_140bpm.mid')
s = Song(140, 'Morwen rage layer', seed=113)
BAR, BEAT, S16 = 4 * PPQ, PPQ, PPQ // 4
r = s.rng
s.track('Choir Cluster', 0, 53, reverb=120)
s.track('Bells', 1, 14, bend_range=2, reverb=127)
s.track('Organ Drone', 2, 19, reverb=110)
s.track('Reverse Cymbal', 3, 119, reverb=50)
s.track('Dive Synth', 4, 81, bend_range=24, reverb=70)
s.track('Orchestra Hit', 5, 55, reverb=60)

for bar in range(0, 96, 4):  # choir clusters D-Eb-Ab, swelling
    for nm in ('D4', 'Eb4', 'Ab4'): s.add('Choir Cluster', bar * BAR, n(nm), 34 + (8 if 48 <= bar < 80 else 0), 4 * BAR - 40, jitter=2)
for bar in range(0, 96, 2):  # organ drone with the tritone
    for nm in ('D2', 'Ab2'): s.add('Organ Drone', bar * BAR, n(nm), 32, 2 * BAR - 30, jitter=2)
for bar in range(4, 96, 8):  # detuned bell pairs, a quarter-tone apart
    t = bar * BAR + r.choice([0, 6, 10]) * S16
    s.add('Bells', t, n(r.choice(['Eb4', 'Ab3', 'D4'])), 54, 2 * BAR); s.bend('Bells', t - 5, -2048); s.bend('Bells', t + 2 * BAR, 0)
for bar in range(7, 96, 8): s.add('Reverse Cymbal', bar * BAR, n('C5'), 54, BAR)
for bar in range(16, 96, 2):  # sparse dissonant stabs from the second section on
    if r.random() < .45:
        t = bar * BAR + r.choice([3, 7, 11, 14]) * S16
        for nm in ('Eb4', 'Ab4'): s.add('Orchestra Hit', t, n(nm), 58, S16 * 2)
for bar in range(10, 96, 6):
    t = bar * BAR + r.choice([2, 9, 13]) * S16; note = n(r.choice(['D5', 'A5', 'C#5']))
    s.add('Dive Synth', t, note, 46, BEAT)
    for i in range(13): s.bend('Dive Synth', t + i * BEAT / 12, -8192 * i / 12)
    s.bend('Dive Synth', t + BEAT + 5, 0)

print(round(s.save(OUT), 1), 's ->', OUT)
