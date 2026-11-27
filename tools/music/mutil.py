"""Shared helpers: event lists -> multi-track MIDI. D harmonic minor gothic palette."""
import random
import mido

PPQ = 480
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
# GM drums
K, SN, RIM, CLAP, CH, OH, RIDE, CRASH, LT, MT, HT, SPLASH, CHINA = 36, 38, 37, 39, 42, 46, 51, 49, 45, 47, 50, 55, 52


def n(name):
    p, o = name[:-1], int(name[-1])
    return 12 * (o + 1) + NOTE[p]


class Song:
    def __init__(self, bpm, title, seed=1):
        self.bpm, self.title = bpm, title
        self.tracks = {}
        self.rng = random.Random(seed)

    def track(self, name, ch, prog=0, bend_range=None, reverb=70):
        self.tracks[name] = dict(ch=ch, prog=prog, ev=[], bends=[], br=bend_range, rv=reverb)

    def add(self, name, tick, note, vel, length, jitter=4):
        vel = max(1, min(127, vel + self.rng.randint(-jitter, jitter)))
        self.tracks[name]['ev'].append((int(tick), note, vel, max(10, int(length))))

    def bend(self, name, tick, value):  # value -8192..8191
        self.tracks[name]['bends'].append((int(tick), int(max(-8192, min(8191, value)))))

    def save(self, path):
        mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)
        meta = mido.MidiTrack(); mid.tracks.append(meta)
        meta.append(mido.MetaMessage('track_name', name=self.title, time=0))
        meta.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm), time=0))
        meta.append(mido.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        for name, t in self.tracks.items():
            if not t['ev'] and not t['bends']:
                continue
            ch = t['ch']
            tr = mido.MidiTrack(); mid.tracks.append(tr)
            tr.append(mido.MetaMessage('track_name', name=name, time=0))
            msgs = []
            if ch != 9:
                msgs.append((t.get('pc', 0), -2, mido.Message('program_change', channel=ch, program=t['prog'])))
                msgs.append((t.get('pc', 0), -2, mido.Message('control_change', channel=ch, control=91, value=t['rv'])))
                if t['br']:
                    for cc, v in ((101, 0), (100, 0), (6, t['br']), (38, 0)):
                        msgs.append((t.get('pc', 0), -1, mido.Message('control_change', channel=ch, control=cc, value=v)))
            for tk, v in t['bends']:
                msgs.append((tk, 0, mido.Message('pitchwheel', channel=ch, pitch=v)))
            for tk, note, v, l in t['ev']:
                msgs.append((tk, 1, mido.Message('note_on', channel=ch, note=note, velocity=v)))
                msgs.append((tk + l, 0, mido.Message('note_off', channel=ch, note=note, velocity=0)))
            msgs.sort(key=lambda m: (m[0], m[1]))
            now = 0
            for tk, _, m in msgs:
                m.time = tk - now; now = tk; tr.append(m)
        mid.save(path)
        return mid.length
