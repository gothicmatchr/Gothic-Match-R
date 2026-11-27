# Gem Slide — project notes for Claude

Gem Slide is a gothic match-3 battle game for Android, built by Jamil entirely from his phone
(Xiaomi 13T). Plain JavaScript + HTML + CSS on a 2D canvas, no framework, no build step.
Target: Google Play (wrap with Capacitor, AAB, target API 36).

Jamil tests every build on his phone through GitHub Pages (this repo's `main` branch is
published automatically by `.github/workflows/pages.yml`). After every change: commit, push
to `main`, and tell him the build is live at https://gothicmatchr.github.io/Gothic-Match-R/
(he refreshes the page on his phone).

## Standing rules (always apply)
- **Google Play compliance on everything.** Original IP only (no copied characters, art, music
  or samples). Works offline (font is bundled with its OFL licence). Collects no personal data.
  Content stays consistent with the planned age rating: **no blood** (battle damage is bruises,
  dark cuts, grazes, dents, scratches, cracks). Check Play's payments policy before any
  real-money purchases. Comfort: sound/volume settings, no rapid flashing.
- **Weak phones matter.** Typical 2026 Android buyer (incl. India): Galaxy A07 / A16 class,
  Helio G99 / Dimensity 6300 / Exynos 1330, Mali-G57 MC2 GPU, 4–6 GB RAM, 720p–1080p.
  Avoid live `shadowBlur`, full-screen filters, unbounded particles, decoded music in memory.
  Music streams via `<audio>`; only short effects are decoded into Web Audio.
- **Art style:** gothic, Castlevania: Symphony of the Night *inspired* (original art only),
  procedural pixel art drawn from Path2D shapes (see `js/art.js`).
- **Audio style:** gothic atmospheric lofi breakcore in D harmonic minor. Keep this theme
  for all music and effects (see `tools/music`).
- **Visual signposting over written guidance.** Show cause and effect on screen (e.g. bucket bars
  fill only as gem dust lands in them). Keep text tutorials and explanatory toasts to a minimum; the
  game does not explain every mechanic, and discovering tricks (like chaining force gems) is part of
  the fun. When a change could teach through motion, colour or sound instead of words, prefer that,
  and suggest better ways to Jamil when you see them.
- Ask Jamil before guessing on gameplay rules that are ambiguous. He prefers short, factual
  answers, no "Title: description" bullet formatting.
- `TEST_SLINGS=true` in `js/config.js` places 3 test slingshots at battle start. **Switch off
  before launch.**

## Files
- `index.html` — markup only. Scripts load in order: config, audio, enemies, art, pose, scars, game
  (classic scripts sharing global scope, no modules).
- `js/config.js` — constants (board size, gem types, timings).
- `js/enemies.js` — enemies, armour pieces (weak/resist/durability), dialogue lines.
- `js/art.js` — procedural pixel art: gems, enemy layers, articulated arm rig parts, backdrop.
- `js/pose.js` — enemy arm rig animator (threat pose on the enemy turn, sword strikes).
- `js/scars.js` — battle damage painted onto enemy skin/armour canvases.
- `js/audio.js` — music (calm/rage crossfade), Web Audio effects, volume panel.
- `js/game.js` — rules, board, effects, input, UI.
- `audio/` — `battle_theme.ogg`, `battle_theme_rage.ogg` (same 48-bar loop, synced), `sfx/*.ogg`.
- `tools/music/` — MIDI sources and Python generators for all audio (see below).
- `tools/tests/` — headless Playwright stress bot and performance test (see below).

## Game rules (current)
- 7×7 board, HuniePop-style drag: slide a gem any distance along its row/column; no match = snap back.
- Gems: Diamond (enemy gem, dark matte purple), Shield (blue), Plus (green, heals you), Coin
  (gold coin), Square (purple), Star (pink).
- Enemy HP = right board border; player HP = left border. Matches damage enemy HP;
  bucket blasts damage armour. Armour comes off in order: shoulders, helmet, lower chest,
  upper chest; each piece has its own weakness/resistance. Goal: strip all armour before the
  enemy dies (bonus 300 per piece + 1000 for a full strip; less reward with armour left).
- Coins: your coin matches give 1 gold per coin gem, no damage, still fill the Coin bucket.
  Enemy coin matches take half that (rounded) from your gold, no damage.
- Your green matches never heal the enemy.
- Enemy acts every 2 of your turns; matches all gems; tries to heal 80% of the time, else
  looks for 4 of a kind, then a multi-strike. Delays apply at end of your turn, capped at 2.
- If your HP hits 0 the enemy regains its last broken armour piece and your HP refills.
- Rage at one armour piece left: enemy destroys ~30% of gems, refilled with Plus gems;
  music crossfades to the rage version.
- **Force gem** (4+ in a line): tap clears 1 above/below; hold to charge a ring, release in the
  perfect band (fizzles if overshot). Perfect: up to 5 diamonds destroyed, all armour −8–12%,
  chain strikes on consecutive turns +2% each up to 5. Gives 8–12 gold, delays the enemy.
  Drag horizontally only; other gems slide through it on both axes. No gravity.
- **Slingshot gem** (L/T/cross): pull down and release; free action; pops gems in its path;
  hitting the current armour piece fires that piece's weak bucket ×1.5; no armour = reduced
  body blow. Pushes force gems aside. No gravity. Specials can't destroy each other.
  Cue: a small "PULL" tag on its top edge (in the gap between gems) and a tug every 3.2 s
  (orb dips on two bands and springs back inside its cell; only while idle).
- Buckets fill from gem dust: the bar rises only as dust lands (`shown[]`; `gauge[]` is the true
  total, 1.5 s catch-up if no dust arrives); fire once the bar is visibly full; tap to fire; each heals 20% of round max HP.
  Shield: also a Ward that blocks the next enemy attack. Coin: also +15 gold.
  Square: also loads a stacking **Piercing shot** — next slingshot can hit any intact armour
  piece; a later piece is damaged but can't break before its turn (stops at 1).
  Star: **Star power** instead of an armour attack — tap any non-special gem (diamonds allowed);
  up to 5 random gems of that kind shatter at 1.25× value; free action; tap the bucket again
  to cancel.
- Multi-strike: matching 2–4 gem types in one move replays effects as separate rounds (up to 4).
- Match chains: cascades from your own move show "Chain x2/x3…"; each link cuts the enemy's
  Summon/Power bar by 1/5.
- L/T matches blast their dust outward with a shockwave before it gathers into the buckets.
- Varro of Szarronetska: Summon bar charges from every gem he matches (and your diamond
  matches); at full it waits and the summon happens at the **end of his own turn**, max once
  per turn. His lackey Andressa (female archer, brown sleeveless jerkin) shoots a random
  special gem (destroying it and gems within radius 2) or, with none, a random bottom-row gem.
- Enemy turn: enemy snarls, raises the short sword and a clenched fist; strikes chop overhead
  and down across the body, then circle back up.
- Battle log: your actions left, enemy's right. Gothic parchment speech bubbles to the right
  of the enemy's head; each enemy has a distinct voice (Varro blusters to hide fear of death).
- No score on screen (still counted internally; shown on the defeat screen).

## Testing
- Phone: GitHub Pages link above.
- Stress bot: `tools/tests/stress.py` plays thousands of actions on a patched copy of the game
  under a virtual clock (`vclock.js`) and reports errors/stuck states. It expects a copy at
  `/tmp/gs_stress2` with `stress.patch` applied to `js/game.js` (adds `window.__api`), and Chrome
  at `/usr/bin/google-chrome`. Adjust paths to your environment.
- Performance: `node tools/tests/perf.js` (Node Playwright; injects `perf_hook.js`) measures idle and busy
  frames at CPU throttle ×1/×4/×6 on a phone-sized viewport. `LOW=1` forces low effects.
  After the performance pass (headless, software rendering), mean frame ms:
  ×4 idle 16.8, busy 25 (was 29 / 77); ×6 idle 16.8, busy 44, with low effects 27 (was 47 / 105).
- Performance rules in `js/game.js` (see the "performance" block): board canvas DPR ≤2 (1.5 in low effects),
  fx overlay DPR ≤1.5 (1), glows are pre-rendered sprites/halos (no live shadowBlur or ctx.filter),
  the board redraws only while something moves (plus a 2 fps fallback), particles are capped,
  the backdrop torch redraws at 12 fps, CSS glow pulses animate opacity only.
  `lowFx` switches on by itself after ~60 busy frames averaging over 30 ms (halved particles,
  no glow rims, `body.lowfx` CSS). Keep new effects within these rules.

## Audio tools (`tools/music`)
- `make_gothic.py` → base MIDI (melody/harmony); `make_rage.py` → rage layer MIDI.
- `make_breakcore.py` renders the melody stems with fluidsynth (GM soundfont), synthesises a
  sliced/chopped breakcore drum stem, and writes `audio/battle_theme*.ogg` (seamless 48-bar loops).
- `synth_sfx.py` synthesises the match-3 style effects into `audio/sfx/*.ogg`.
- Needs: python3, numpy, scipy, mido, fluidsynth, ffmpeg, a GM `.sf2` soundfont.

## Pre-launch checklist (not started)
Switch off TEST_SLINGS; title screen + settings; lock portrait; test small phone + tablet;
Capacitor Android project (API 36); icon, screenshots, privacy policy page; Play Console
account + identity verification; closed test with 15–20 testers for 14 days; content rating,
target audience (teens and adults, to confirm), data safety and ads forms; apply for production.
