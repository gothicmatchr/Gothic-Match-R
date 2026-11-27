// Enemy roster: stats, armour [weak gem, resisted gem, durability], looks, backdrop and dialogue.
// To add an enemy: add an entry to FOES and a matching block in ENEMY_LINES.
const FOES=[
 {key:'Varro',name:'Varro of Szarronetska',lackey:1,powerAll:1,expr:'weary',hp:520,hit:3,big:20,cap:12,arm:[[3,1,110],[4,5,120],[1,3,130],[5,4,160]],skin:'#dcb49c',hair:'#2a1a14',cape:'#2a1418',lining:'#6a1a24',gem:'#c02030',style:'short',beard:1,cloth:'#4a3226',armour:'#a9b2bc',iris:'#5a3a1e',trim:'#c9a23a',scene:{win:['#3a1a2a','#a0503a','#f0b070'],stone:'#2a2026'},eye:'#2a1a12',
  plea:'Enough! I yield. I only took to the road to feed my crew.',spare:'Varro bows low and slips away into the hills. The road is safe again.',kill:'Varro falls. His crew scatters without a leader.'},
 {key:'Morwen',name:'Sister Morwen',hp:560,hit:3,big:24,cap:12,arm:[[5,4,120],[1,3,130],[4,5,140],[3,1,170]],skin:'#f0dcd4',hair:'#1a1024',cape:'#1e1430',lining:'#4a2a6a',gem:'#9a5ae0',style:'long',fem:1,top:'#2e2142',cloth:'#2a1d3c',armour:'#6e5a8a',iris:'#5a8a6a',trim:'#d4c27a',scene:{win:['#0a1028','#2a3e7a','#9ab0e8'],stone:'#201c2a'},eye:'#1c1030',
  plea:'You broke my wards... Spare me and I\'ll trouble no village again.',spare:'Morwen pulls up her hood and vanishes in a swirl of violet smoke.',kill:'Morwen\'s staff splinters, and the curse on the valley lifts.'},
 {key:'Oren',name:'Captain Oren',hp:600,hit:4,big:28,cap:11,arm:[[1,5,125],[3,4,140],[5,1,150],[4,3,185]],skin:'#cfa88e',hair:'#6a6660',cape:'#14241e',lining:'#2a5a46',gem:'#3ac08a',style:'crop',scar:1,stubble:1,cloth:'#3a3a2a',armour:'#7d8a6a',iris:'#4a5a6a',trim:'#b08a3a',scene:{win:['#1c2234','#56688a','#c8c0b0'],stone:'#24222a'},eye:'#1a1a12',
  plea:'Stand down... I yield. The garrison is yours.',spare:'Oren salutes, gathers his men and marches them home.',kill:'Oren falls, and the garrison gates swing open.'},
 {key:'Dask',name:'Warlord Dask',hp:640,hit:4,big:32,cap:10,arm:[[4,3,135],[5,1,150],[3,4,160],[1,5,195]],skin:'#9a6c54',hair:'#a02a22',cape:'#241a14',lining:'#5a3a22',gem:'#e0a030',fur:'#6a5a4a',style:'mohawk',beard:1,tattoo:1,cloth:'#2a1a14',armour:'#4a4a55',iris:'#7a5a2a',trim:'#a83a2a',scene:{win:['#2a0608','#8a1418','#e04a3a'],stone:'#281a1c'},eye:'#1a0f0a',
  plea:'You fight like a storm... Let me leave with my life.',spare:'Dask drops his axe and rides off into the wastes, never to return.',kill:'The warlord\'s banner falls, and his horde scatters.'}];
const ENEMY_LINES={
 Varro:{intro:["Hah! Another fool come to die upon Varro's blade!","Stand aside, whelp. I have gutted better than thee... many times. Probably."],
  armour:["Mere scratch! I have... spare armour. Somewhere.","Thou'lt pay for that dent, cur!"],hurt:["Was that meant to sting? Ha! Ha...","Mine blood is merely... restless."],
  attack:["Taste steel, knave!","Hah! Fear me! ...Thou dost fear me, aye?"],heal:["A moment's respite. Not that I need it!","Every hero tends his wounds. 'Tis known."],
  rage:["Enough! I'll not die in this cursed hall!","Back! BACK, I say! I've so much yet to live for!"],low:["Surely we might parley, friend? Friend?","Death's cold hand... no! Not yet!"],
  lackey:["Andressa! To me, girl! Loose!","ANDRESSA! Shoot their trinkets, quickly!","Andressa! Earn thy keep!"],flinch:["Gah! Keep that devilry from me!"],fall:["Ha! HA! Didst thou see? I am unbeatable!"]},
 Morwen:{intro:["The candles whispered thy name, child. They always lie about the ending.","Come closer. The shadows here are hungry."],
  armour:["My wards crack... how quaint.","Thou breakest silver. Silver remembers."],hurt:["Pain is but a door. I know every hinge.","Mm. Thy sting is sweeter than I had hoped."],
  attack:["Bleed for the moon, little moth.","Hush now. Let the dark do its work."],heal:["The night mends what thou tearest.","Blood returns to me, as all things must."],
  rage:["Enough games. Let this hall drink thee whole!","I shall unmake thee, thread by thread!"],low:["The stars... dim. How unexpected.","No... the prophecy spake not of this."],
  flinch:["What light is this? Away!"],fall:["Rise, if thou canst. I do so love a second act."]},
 Oren:{intro:["By oath I hold this gate. By oath I shall cut thee down.","Turn back. I have buried enough of thy kind."],
  armour:["Steel fails. Duty does not.","A fine strike. It changes nothing."],hurt:["I have bled on worse fields than this.","Pain is an old comrade."],
  attack:["For the garrison.","Forgive me. The oath demands it."],heal:["Not yet. The watch is not over.","Stand fast, old bones."],
  rage:["Then let this hall be my last stand!","I'll not yield the gate! Not to thee!"],low:["Is this... my relief, at last?","The night watch... ends."],
  flinch:["Hold— hold the line!"],fall:["Stay down. I take no joy in this."]},
 Dask:{intro:["Fresh meat walks into Dask's hall! HA!","I'll drink from thy skull ere the moon sets!"],
  armour:["Rip it off! I fight better bare!","HA! NOW 'tis a real fight!"],hurt:["MORE! Strike harder, worm!","That tickles! Again!"],
  attack:["Blood for the horde!","CRUSH! BREAK! FEAST!"],heal:["Dask feeds upon thy fear!","Wounds close. Hunger grows."],
  rage:["Now thou seest the beast! RAAAH!","I'll paint these walls with thee!"],low:["Dask... does not... kneel!","The horde shall avenge me!"],
  flinch:["What trickery is THAT?!"],fall:["HAHA! Get up! I'm not done chewing!"]}};
for(const f of FOES)f.lines=ENEMY_LINES[f.key]||{};
