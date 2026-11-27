// Gothic Match R: game settings and balance values. Tune numbers here.
// Saved data moved from the old name's keys (gemslide-*) to gothicmatchr-*, once, keeping players' gold and settings.
try{for(const k of['gold','best','vol','music']){const o=localStorage.getItem('gemslide-'+k);if(o!==null){if(localStorage.getItem('gothicmatchr-'+k)===null)localStorage.setItem('gothicmatchr-'+k,o);localStorage.removeItem('gemslide-'+k)}}}catch(e){}
// Board: N x N grid. Gem types: 0 Diamond (enemy), 1 Shield, 2 Plus (heal), 3 Coin, 4 Square, 5 Star. SP = force gem, SL = slingshot gem.
const TEST_SLINGS=true;// testing: start each battle with 3 slingshot gems
const N=7,TYPES=6,SP=6,SL=7,POP=0.5,MAXHP=100,EVERY=2,DMG=3,RED=0,GREEN=2,COIN=3,STAR=5,COIN_GOLD=1,ATK=[1,3,4,5];
const COLORS=[['#7a6090','#4e3862','#2a1a38'],['#8fd3ff','#1f7ae0','#0e3f86'],['#9df2a8','#21b34a','#0d6428'],['#ffe58a','#f5a623','#9a5b06'],['#d9a8ff','#8b3ee0','#4b1586'],['#ffb3d9','#ff4fa0','#a0105a']];
const GEMS=[
 {n:'Diamond',pts:10},
 {n:'Shield',pts:12,cap:130,atk:'Shield blast',dmg:22,fx:'22 armour damage'},
 {n:'Plus',pts:8},
 {n:'Coin',pts:15,cap:165,atk:'Coin blast',dmg:27,fx:'3 hits of 9 armour damage'},
 {n:'Square',pts:20,cap:220,atk:'Square blast',dmg:33,fx:'33 armour damage'},
 {n:'Star',pts:25,cap:275,atk:'Star blast',dmg:40,fx:'40 armour damage'}];
// Force gem charge: hold time to start, full charge seconds, perfect window size, diamonds cleared on a perfect, chain strike limits.
const CHAIN_MAX=5,CHAIN_SPEEDUP=.06,HOLD=.28,CHARGE=1.6,VR=3.4,PERFECT=.08,PERFECT_REDS=5;
// Falling gems: gravity (cells/s^2), top speed (cells/s), bounce kept on landing (0-1).
const FALL_G=30,FALL_MAX=13,FALL_BOUNCE=.28;
// Most moves the enemy's counter can be delayed to. Raise later to allow stacking delays.
const MAX_TURNS=EVERY;
// The enemy always acts after at most this many of your turns, whatever delays you stack.
const QUIET_MAX=3;
// Cascade chains multiply damage (x2, x3...). The enemy's chain multiplier stops at this.
const FOE_CHAIN_MAX=2;
// Most HP one enemy turn can take (multi-strikes and chains included), so no turn ends a battle out of nowhere.
const TURN_CAP=45;
// An enemy blow this big gets the heavy slam, hit-stop and a triumphant shout (once per enemy turn).
const BIG_HIT=18;
// Idle taunts: seconds of no input on your turn before the enemy may taunt (min, random extra).
const IDLE_TAUNT=[14,10];
// Enemy AI: goes for a heal only below this share of its HP, and then only this often.
const HEAL_BELOW=.75,HEAL_CHANCE=.35;
// Slingshot: minimum pull (in gem widths) to fire, and how far down it must go. Short pulls aim just as well; distance doesn't change power.
const SLING_MIN_PULL=.3,SLING_MIN_DOWN=.12;
// Match pop timing (seconds): pause after the last gem lights, swell before each burst, settle after the last burst.
const LIGHT_HOLD=.1,SWELL=.14,POST=.22;
