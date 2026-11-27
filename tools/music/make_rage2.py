"""Rage layer for the second theme (176 BPM, 48 bars, lines up bar for bar with make_gothic2.py).
Non-drum colour only; the rage drums are synthesised in make_breakcore2.py."""
import os
from mutil import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gothic_requiem_rage_176bpm.mid')
s = Song(176, 'Requiem rage layer (play over theme 2)', seed=91)
BAR, BEAT, S16 = 4 * PPQ, PPQ, PPQ // 4
r = s.rng
s.track('Orchestra Hit', 0, 55, reverb=50)
s.track('Reverse Cymbal', 1, 119, reverb=40)
s.track('Organ Drone', 2, 19, reverb=100)
s.track('Dive Synth', 3, 81, bend_range=24, reverb=60)
s.track('Choir Cluster', 4, 53, reverb=110)   # Voice Oohs

# Stabs on the flat 2nd and tritone (Eb + Ab against D), on off-beats, sometimes glitch-repeated
for bar in range(8, 48):
    if bar % 8 in (3, 7) and r.random() < .5: continue
    pos = r.choice([3, 6, 7, 10, 11, 14, 15]); t = bar * BAR + pos * S16
    for nm in ('Eb4', 'Ab4'): s.add('Orchestra Hit', t, n(nm), 64, S16 * 2)
    if r.random() < .35:
        for k in range(1, 5):
            for nm in ('Eb4', 'Ab4'): s.add('Orchestra Hit', t + k * S16 / 2, n(nm), 52 - k * 8, S16 / 3)
# Reverse swells into each 4-bar block
for bar in range(3, 48, 4): s.add('Reverse Cymbal', bar * BAR, n('C5'), 56, BAR)
# Organ drone: D with the tritone, a minor-2nd rub on the turnaround bars
for bar in range(0, 48, 2):
    for nm in ('D2', 'Ab2'): s.add('Organ Drone', bar * BAR, n(nm), 34, 2 * BAR - 30, jitter=2)
    if bar % 8 == 6: s.add('Organ Drone', bar * BAR + BAR, n('Eb3'), 30, BAR - 30)
# Choir cluster (D-Eb-Ab) swells in the breakdown and peak
for bar in list(range(24, 32, 2)) + list(range(32, 40, 4)):
    for nm in ('D4', 'Eb4', 'Ab4'): s.add('Choir Cluster', bar * BAR, n(nm), 38, 2 * BAR - 30, jitter=2)
# Pitch dives
for bar in range(4, 48, 3):
    t = bar * BAR + r.choice([2, 6, 9, 13]) * S16; note = n(r.choice(['D5', 'A5', 'C#5', 'Bb5']))
    s.add('Dive Synth', t, note, 54, BEAT // 2)
    for i in range(9): s.bend('Dive Synth', t + i * BEAT / 16, -8192 * i / 8)
    s.bend('Dive Synth', t + BEAT // 2 + 5, 0)

print(round(s.save(OUT), 1), 's ->', OUT)
