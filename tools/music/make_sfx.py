"""Gem sound effects in the gothic breakcore palette (D harmonic minor, music box,
harpsichord, church organ, choir, tubular bells, chopped breakbeat drums).
Each effect is its own MIDI file, plus one combined file with a track per effect."""
import json, os
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "build", "sfx"), exist_ok=True)
from mutil import *

SEC = 2 * PPQ  # at 120 BPM one second is two beats
def t(sec): return int(sec * SEC)

FX = {}

def fx(name):
    s = Song(120, name, seed=hash(name) & 0xffff)
    FX[name] = s
    return s

# Match: one music-box chime. The game pitches it up the D harmonic minor scale for each gem in the chain.
s = fx('match')
s.track('Music Box', 0, 10, reverb=80); s.track('Celesta', 1, 8, reverb=80)
s.add('Music Box', 0, n('D5'), 92, t(.5)); s.add('Celesta', 0, n('D6'), 48, t(.35))

# Pop: harpsichord pluck plus a crushed hat and rim click.
s = fx('pop')
s.track('Harpsichord', 0, 6, reverb=40); s.track('Drums', 9)
s.add('Harpsichord', 0, n('A4'), 96, t(.12)); s.add('Harpsichord', 0, n('A3'), 60, t(.12))
s.add('Drums', 0, CH, 80, t(.03)); s.add('Drums', t(.025), RIM, 64, t(.03))

# Forge: special gem created. Rising harpsichord run with a choir swell.
s = fx('forge')
s.track('Harpsichord', 0, 6); s.track('Choir', 1, 52, reverb=100); s.track('Drums', 9)
for i, nm in enumerate(['D4', 'F4', 'A4', 'C#5', 'D5', 'F5', 'A5']):
    s.add('Harpsichord', t(i * .045), n(nm), 70 + i * 6, t(.1))
for nm in ('D4', 'A4', 'D5'):
    s.add('Choir', t(.1), n(nm), 70, t(.55))
s.add('Drums', t(.32), SPLASH, 70, t(.2)); s.add('Drums', t(.32), K, 80, t(.05))

# Gold burst: tubular bell and a chopped kick-snare stutter.
s = fx('gold')
s.track('Bells', 0, 14, reverb=90); s.track('Choir', 1, 52, reverb=100); s.track('Drums', 9)
s.add('Bells', 0, n('D5'), 100, t(.8)); s.add('Bells', 0, n('A5'), 70, t(.8))
s.add('Choir', 0, n('D4'), 60, t(.4)); s.add('Choir', 0, n('F4'), 55, t(.4))
for i, (nt, v) in enumerate([(K, 110), (SN, 90), (K, 80), (SN, 100)]):
    s.add('Drums', t(i * .055), nt, v, t(.04))
s.add('Drums', 0, CRASH, 70, t(.5))

# Gold perfect release: brighter bells, orchestra hit, 64th snare roll.
s = fx('gold_perfect')
s.track('Bells', 0, 14, reverb=100); s.track('Orch Hit', 1, 55, reverb=70); s.track('Choir', 2, 52, reverb=110); s.track('Drums', 9)
for nm, v in (('D5', 110), ('A5', 90), ('D6', 80)):
    s.add('Bells', 0, n(nm), v, t(1.0))
for nm in ('D4', 'A4', 'D5'):
    s.add('Orch Hit', 0, n(nm), 96, t(.25))
for nm in ('D4', 'F4', 'A4'):
    s.add('Choir', t(.05), n(nm), 70, t(.7))
for i in range(10):
    s.add('Drums', t(i * .031), SN, 50 + i * 7, t(.02))
s.add('Drums', t(.31), K, 120, t(.05)); s.add('Drums', t(.31), CRASH, 100, t(.6))

# Fizzle: overshot gold hold. Detuned organ falling a semitone, dull tom.
s = fx('fizzle')
s.track('Organ', 0, 19, reverb=70); s.track('Drums', 9)
s.add('Organ', 0, n('Eb4'), 80, t(.18)); s.add('Organ', 0, n('A3'), 70, t(.18))
s.add('Organ', t(.18), n('D4'), 70, t(.3)); s.add('Organ', t(.18), n('Ab3'), 60, t(.3))
s.add('Drums', 0, LT, 70, t(.1))

# Slingshot fire: snare roll accelerating into a crash, reverse cymbal tail-in.
s = fx('sling')
s.track('Rev Cymbal', 0, 119, reverb=30); s.track('Drums', 9); s.track('Harpsichord', 1, 6)
s.add('Rev Cymbal', 0, n('C5'), 70, t(.3))
tt, gap = 0.0, .05
for i in range(12):
    s.add('Drums', t(tt), SN if i % 3 else HT, 40 + i * 6, t(.02)); tt += gap; gap *= .85
s.add('Drums', t(tt), CRASH, 96, t(.4)); s.add('Drums', t(tt), K, 110, t(.05))
for i, nm in enumerate(['A4', 'D5', 'A5']):
    s.add('Harpsichord', t(tt + i * .03), n(nm), 80, t(.12))

# Bucket fire: church organ D minor (harmonic) stab over an amen-style chop.
s = fx('bucket')
s.track('Organ', 0, 19, reverb=100); s.track('Choir', 1, 52, reverb=110); s.track('Drums', 9)
for nm in ('D3', 'A3', 'D4', 'F4', 'A4'):
    s.add('Organ', 0, n(nm), 92, t(.55))
for nm in ('C#4', 'E4', 'A4'):  # resolves through the dominant: the gothic cadence
    s.add('Organ', t(.55), n(nm), 70, t(.25))
for nm in ('D4', 'F4', 'A4'):
    s.add('Choir', 0, n(nm), 60, t(.8))
chop = [(0, K, 120), (.075, CH, 60), (.15, SN, 110), (.225, K, 90), (.26, K, 80), (.3, SN, 105), (.34, SN, 50), (.375, CH, 60), (.45, SN, 120)]
for tt, nt, v in chop:
    s.add('Drums', t(tt), nt, v, t(.04))
s.add('Drums', 0, CRASH, 100, t(.8))

meta = {}
for name, s in FX.items():
    meta[name] = round(s.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build', 'sfx', f'{name}.mid')), 3)

# Combined file for FL Studio: each effect on its own track, two seconds apart
combo = Song(120, 'Gothic Match R SFX (each effect 2s apart)')
off = 0
for name, s in FX.items():
    for tn, tr in s.tracks.items():
        key = f'{name} - {tn}'
        combo.tracks[key] = dict(ch=tr['ch'], prog=tr['prog'], ev=[(a + off, b, c, d) for a, b, c, d in tr['ev']],
                                 bends=[(a + off, b) for a, b in tr['bends']], br=tr['br'], rv=tr['rv'], pc=off)
    off += t(2)
combo.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gothic_match_r_sfx.mid'))
print(json.dumps(meta))
