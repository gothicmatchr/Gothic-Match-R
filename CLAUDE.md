# Gothic Match R — project notes for Claude

Gothic Match R (formerly "Gem Slide", renamed to avoid clashing with other games of that name)
is a gothic match-3 battle game for Android, built by Jamil entirely from his phone
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
- `js/config.js` — constants (board size, gem types, timings), and the one-time move of saved data
  from the old `gemslide-*` localStorage keys to `gothicmatchr-*`.
- `js/enemies.js` — enemies, armour pieces (weak/resist/durability), dialogue lines.
- `js/art.js` — procedural pixel art: gems, enemy layers, articulated arm rig parts, backdrop.
- `js/pose.js` — enemy arm rig animator (threat pose on the enemy turn, sword strikes).
- `js/scars.js` — battle damage painted onto enemy skin/armour canvases.
- `js/audio.js` — music (calm/rage crossfade), Web Audio effects, volume panel.
- `js/game.js` — rules, board, effects, input, UI.
- `audio/` — battle themes, each a calm + rage pair of the same length, synced bar for bar:
  `battle_theme*.ogg` (original, 170 BPM, 48 bars), `battle_theme2*.ogg` (Varro's theme, 176 BPM, 48 bars),
  `battle_theme3*.ogg` (Sister Morwen's theme, 140 BPM, 96 bars ≈ 2:45, softer and atmospheric).
  A battle starts on the enemy's `theme` (index into `TRACKS` in audio.js; random if none); when a track
  ends the next one plays, cycling through the list, staying on rage versions while raging. `sfx/*.ogg`.
- `tools/music/` — MIDI sources and Python generators for all audio (see below).
- `tools/tests/` — headless Playwright stress bot and performance test (see below).

## Game rules (current)
- 7×7 board, HuniePop-style drag: slide a gem any distance along its row/column; no match = snap back.
- Gems: Diamond (enemy gem, dark matte purple), Shield (blue), Plus (green, heals you), Coin
  (gold coin), Square (purple), Star (pink).
- Enemy HP = right board border; player HP = left border. Matches damage enemy HP (`DMG` 2.5 per gem,
  lowered from 3 so armour has time to come off without fights dragging). Armour comes off
  only from slingshot hits, perfect force hits and Crush gems (buckets no longer damage the enemy). Armour comes off in order: shoulders, helmet, lower chest,
  upper chest; each piece has its own weakness/resistance. Goal: strip all armour before the
  enemy dies (bonus 300 per piece + 1000 for a full strip; less reward with armour left).
- Coins: your coin matches give 1 gold per coin gem, no damage, still fill the Coin bucket.
  Enemy coin matches take half that (rounded) from your gold, no damage.
- Your green matches never heal the enemy.
- Enemy acts every 2 of your turns, and always after at most 3 (`QUIET_MAX`) whatever delays are
  stacked. Making specials no longer delays him; force gem use still does (+1, capped at 2).
  He matches all gems; goes for a heal only below 75% HP and then 35% of the time (`HEAL_BELOW`,
  `HEAL_CHANCE`), else looks for 4 of a kind, then a multi-strike. One enemy turn can take at most
  45 HP (`TURN_CAP`). Blows of 18+ (`BIG_HIT`) get a heavy slam, hit-stop and a triumphant shout
  (once per turn). Every blow plays `Sfx.hit` and shows a red damage number by your HP bar.
- Idle taunts: after 14–24 s without input on your turn, 70% chance the enemy taunts (`IDLE_TAUNT`).
- If your HP hits 0 the enemy regains its last broken armour piece and your HP refills.
- Rage at one armour piece left: enemy destroys ~30% of gems, refilled with Plus gems;
  music crossfades to the rage version.
- **Force gem** (4+ in a line): tap clears 1 above/below; hold to charge a ring, release in the
  perfect band (fizzles if overshot). Perfect: up to 5 diamonds destroyed, all armour −12–16% (`FORCE_CUT`),
  chain strikes on consecutive turns +2% each up to 5. Gives 8–12 gold, delays the enemy.
  Drag horizontally only; other gems slide through it on both axes. No gravity.
- **Crush gem** (`CR`): every 2nd perfect force hit in a row (chain links 2 and 4) earns one. Once that
  burst settles it falls from the top of that column and smashes into the second force gem's spot
  (`dropCrush`, `Sfx.anvil`). Held like a force gem, but its ring charges at chain-stage 3 speed
  (`CRUSH_STAGE`). Release: a warhammer swings down onto the current armour piece (`crushAt`,
  `drawHammer`, `Sfx.crush`) and cuts it by 50% of its total (perfect), 25% (outside the band) or 10%
  (overshoot) (`CRUSH_CUT`); with no armour left it hits HP. Uses your turn. A short tap only wiggles it.
  Treated as a special: no gravity, slingshots push it aside, Andressa can shoot it.
- **Slingshot gem** (L/T/cross): pull down and release; free action; pops gems in its path;
  hitting the current armour piece fires that piece's weak bucket ×1.5; no armour = reduced
  body blow. Pushes force gems aside. No gravity. Specials can't destroy each other.
  Drawn as a crossbow (`crossbow()` in game.js: recurve limbs, stock with steel rail, string to the
  nock). Idle nudge every 3.2 s on your turn: a small crossbow fades in over the gem, draws it down
  and lets go. No text label. Aiming shows the full crossbow flexing with the pull.
- Buckets fill from gem dust: the bar rises only as dust lands (`shown[]`; `gauge[]` is the true
  total, 1.5 s catch-up if no dust arrives); fire once the bar is visibly full; tap to fire; each heals 20% of round max HP.
  Emptying a bucket does **not** damage the enemy (removed: it stripped armour too fast and unclearly).
  Slingshot hits still fire the piece's weak bucket ×1.5 as armour damage (`fire()`).
  Shield: also a Ward that blocks the next enemy attack. Coin: also +15 gold.
  Square: also loads a stacking **Piercing shot** — next slingshot can hit any intact armour
  piece; a later piece is damaged but can't break before its turn (stops at 1).
  Star: **Star power** instead of an armour attack — tap any non-special gem (diamonds allowed);
  up to 5 random gems of that kind shatter at 1.25× value; free action; tap the bucket again
  to cancel.
- **Items** (`ITEMS` in config.js): Healing draught 70g (+35 HP), Hourglass 80g (enemy waits one more
  turn), Holy water 100g (every diamond shatters), Warhammer 150g (a Crush gem drops onto a random cell).
  Bought from the merchant after a win (spare/kill screen → Merchant) or mid-battle from the satchel's
  + button at double price (`EMERGENCY_MULT`). Carried in a 3-slot satchel under the buckets (saved in
  `gothicmatchr-satchel`); tap one on your turn to use it as a free action. A useless use (full HP, no
  diamonds) shakes the slot with a clunk and keeps the item. Prices assume ~155–210 gold per battle.
- Signposting cues (no explanatory text): tapping a bucket that isn't ready shakes it with a
  dull clunk (`Sfx.clunk`); touching the board on the enemy's turn shakes it with a lower clunk;
  bucket bonuses fly as icons into the Ward/Pierce tags, gold counter (5 coins) and HP bar (3 plus
  gems), and those update when they land; dust landing in a full bucket sparks over the rim
  (`Sfx.spill`); a weak slingshot pull makes the band go slack and wobble (`Sfx.snap`); in Star
  power, tapping a special gem wiggles it and clunks. No opening tutorial toast, no Star prompt.
- Multi-strike: matching 2–4 gem types in one move replays effects as separate rounds (up to 4).
- Match chains: each cascade link multiplies damage and bucket fill (x2, x3…) for you; the enemy's
  chains multiply his damage up to x2 (`FOE_CHAIN_MAX`). A live ×N badge (top right of the board,
  red for the enemy) grows with each link. Your links also cut the enemy's Summon/Power bar by 1/5.
- Force chain: 5 notches under each force gem light up per perfect link in a row; the perfect
  release chime rises in pitch with each link. No text explains it.
- L/T matches blast their dust outward with a shockwave before it gathers into the buckets.
- Varro of Szarronetska: Summon bar charges from every gem he matches (and your diamond
  matches); at full it waits and the summon happens at the **end of his own turn**, max once
  per turn. His lackey Andressa (female archer, brown sleeveless jerkin) shoots a random
  special gem (destroying it and gems within radius 2) or, with none, a random bottom-row gem.
- Enemy turn: enemy snarls, raises the short sword and a clenched fist; strikes chop overhead
  and down across the body, then circle back up.
  Each blow tears the screen: 2–3 parallel jagged rips (dark inside, crimson torn edges) that shed
  slivers (`drawShred`). Varro's short sword is serrated (`serrated:1`) and he holds it up in a guard
  at rest (`rest` pose in FOES, `Pose.setRest`) so it is always in view.
- Battle log: your actions left, enemy's right. Gothic parchment speech bubbles to the right
  of the enemy's head; each enemy has a distinct voice (Varro blusters to hide fear of death).
- No score on screen (still counted internally; shown on the defeat screen).

## Testing
- Phone: GitHub Pages link above.
- Balance: `node tools/tests/balance.js [battlesPerEnemy]` plays full battles with a greedy bot
  (`balance_bot.js`) on the virtual clock and prints turns, damage taken, hits, falls and outcome.
  After the difficulty pass (16 battles): 15/16 wins, enemy 4–8 turns per battle, avg hit 12–25,
  min HP mostly 15–60; before it the enemy got 0–4 turns and the player rarely dropped below 70.
- After removing bucket damage (12 battles): 11/12 wins but only 0–1 armour pieces stripped (was 2–4).
  With `DMG` 2.5 and `FORCE_CUT` 12–16%: 12/12 wins, 0–4 pieces (avg ~1.3), ~20 turns (was ~18), so fights
  stay fast; the bot earns 155–210 gold per battle. The report now includes Crush uses and gold earned.
- Stress bot: `tools/tests/stress.py` plays thousands of actions on a patched copy of the game
  under a virtual clock (`vclock.js`) and reports errors/stuck states. It expects a copy at
  `/tmp/gs_stress2` with `stress.patch` applied to `js/game.js` (adds `window.__api`), and Chrome
  at `/usr/bin/google-chrome`. Adjust paths to your environment. After editing game.js, run
  `python3 tools/tests/make_stress_patch.py` to regenerate the patch.
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
- Theme 2: `make_gothic2.py` (melody/harmony MIDI: organ, harpsichord, celesta, violin, choir; Dm | C#dim7 |
  Dm/F | Gm | Bb | Gm6 | Asus4 | A7) + `make_rage2.py` (rage layer) → `make_breakcore2.py` renders them and
  synthesises classic breakcore drums (Amen-style 4-bar break, Think-style break; 3-3-2 chops, machine-gun
  snares, snare rushes to 64ths, reversed hits, half-speed drops, bitcrush, gabber 4/4 under amen chops at
  the peak). No samples. Writes `audio/battle_theme2*.ogg`; intermediates go to `tools/music/build/`.
- Morwen's theme: `make_gothic3.py` (cello lead, music box, harp, choir, tubular bells, reed organ; Dm | Dm/C |
  Bbmaj7 | Asus4-A7 | Gm | Dm/F | Em7b5 | A7b9, two bars each) + `make_rage3.py` → `make_breakcore3.py` (soft,
  lowpassed Think/Amen breaks with gentle edits, half-speed heartbeat in the breakdown, vinyl crackle and soft
  rain bed; the rage version is harder). Writes `audio/battle_theme3*.ogg` at 80 kbps.
- `synth_sfx.py` synthesises the match-3 style effects into `audio/sfx/*.ogg`
  (`python3 synth_sfx.py name …` renders only those).
- Needs: python3, numpy, scipy, mido, fluidsynth, ffmpeg, a GM `.sf2` soundfont
  (`apt-get install fluidsynth fluid-soundfont-gm`; `pip install numpy scipy mido`).

## Pre-launch checklist (not started)
Switch off TEST_SLINGS; title screen + settings; lock portrait; test small phone + tablet;
Capacitor Android project (API 36); icon, screenshots, privacy policy page; Play Console
account + identity verification; closed test with 15–20 testers for 14 days; content rating,
target audience (teens and adults, to confirm), data safety and ads forms; apply for production.
