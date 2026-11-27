// Battle rules, board, effects, input and UI.
let sayT=0,sayHide,lowSaid=false;
function say(kind,force){const L=foe.lines;if(!L||!L[kind])return;const now=performance.now();
  if(!force&&now-sayT<2600)return;sayT=now;const b=$('speech');b.firstChild.textContent=L[kind][Math.floor(Math.random()*L[kind].length)];
  b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(sayHide);sayHide=setTimeout(()=>b.classList.remove('on'),3400)}
const cv=document.getElementById('c'),ctx=cv.getContext('2d',{willReadFrequently:false}),$=id=>document.getElementById(id);
let size=300,cell=size/N,dpr=1,sprites=[],icons=[];
let grid,score=0,best=0,battleScore=0,state='idle',combo=0,popT=0,drag=null,floats=[],lastMoved=null;
let ammo=0,summoned=false,ward=0,lackeyQ=false,roundMax=MAXHP,money=0,replay=null,firstStep=false,chainN=0,chainBase=0,locked=false,preview=null,charge=null,fz=0,parts=[],flT,em=null,noGauge=false,fi=0,foe,foeHp,hp,turns,cursed,curseNow,gauge,power,pendingTurn,phase,rage,rageQueued,armDur,toastT,hl=null,rq=null;
try{best=+localStorage.getItem('gemslide-best')||0}catch(e){}
try{money=+localStorage.getItem('gemslide-gold')||0}catch(e){}

/* ---------- performance ----------
   Board canvas DPR is capped (pixel art needs no more), the fx overlay runs at a lower DPR, glows are
   pre-rendered sprites instead of live shadowBlur, the board is only redrawn while something moves, and
   lowFx switches on by itself when frames run slow (fewer particles, no glow rims, slower torch). */
let lowFx=false,boardDirty=true,lastFull=0,slowT=0,slowN=0,darkSprites=[],glowSprites={},halos={};
const BOARD_DPR=()=>lowFx?1.5:2,FX_DPR=()=>lowFx?1:1.5,PCAP=()=>lowFx?160:420;
function resize(){
  const r=cv.getBoundingClientRect();size=r.width;dpr=Math.min(window.devicePixelRatio||1,BOARD_DPR());
  cv.width=Math.round(size*dpr);cv.height=Math.round(size*dpr);cell=size/N;
  sprites=[0,1,2,3,4,5,6,7].map(t=>gemCanvas(t,Math.round(cell*dpr)));
  darkSprites=sprites.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.filter='brightness(.3) grayscale(.7)';x.drawImage(im,0,0);return c});
  glowSprites={};halos={};boardDirty=true;
}
// soft glow behind a sprite, rendered once (replaces per-frame shadowBlur)
function glowSprite(t,col,blur){const k=t+col+blur;let c=glowSprites[k];if(c)return c;const im=sprites[t],pad=Math.ceil(blur*2*dpr);
  c=glowSprites[k]=document.createElement('canvas');c.width=c.height=im.width+pad*2;const x=c.getContext('2d');
  x.shadowColor=col;x.shadowBlur=blur*dpr;x.drawImage(im,pad,pad);x.drawImage(im,pad,pad);c.pad=pad/dpr;return c}
// round radial halo in a colour, rendered once per colour/size
function halo(col){let c=halos[col];if(c)return c;const z=Math.max(8,Math.round(cell*1.2*dpr)),h=z/2;c=halos[col]=document.createElement('canvas');c.width=c.height=z;
  const x=c.getContext('2d'),rg=x.createRadialGradient(h,h,h*.13,h,h,h);rg.addColorStop(0,glowA(col,1));rg.addColorStop(.5,glowA(col,.5));rg.addColorStop(1,glowA(col,0));x.fillStyle=rg;x.fillRect(0,0,z,z);return c}
// glowing stroke without shadowBlur: wide faint passes under a sharp one
function glowStroke(c,col,w,path,a){c.strokeStyle=col;const ga=c.globalAlpha;if(!lowFx){c.globalAlpha=ga*(a||.25);c.lineWidth=w*3.2;path();c.stroke();c.globalAlpha=ga*(a||.25)*1.6;c.lineWidth=w*2;path();c.stroke()}c.globalAlpha=ga;c.lineWidth=w;path();c.stroke()}
function setLowFx(){if(lowFx)return;lowFx=true;document.body.classList.add('lowfx');resize();sizeFx();dust.length=Math.min(dust.length,PCAP())}
function perfWatch(dt,busy){if(lowFx||!busy||dt>.2)return;slowT+=dt;slowN++;if(slowN>=60){if(slowT/slowN>.03)setLowFx();slowT=0;slowN=0}}
function capPush(a,o){if(a.length<PCAP())a.push(o)}

function buildFoe(e){
  const L=layers(e),fig=document.createElement('div');fig.className='fig';fig.setAttribute('role','img');fig.setAttribute('aria-label',e.name);
  const add=(c,cls)=>{if(cls)c.className=cls;fig.appendChild(c)};
  const baseC=raster(L.base,true);add(baseC,'basec');add(raster(L.fn,false),'fn');add(raster(L.ff,false),'ff');add(raster(L.fa,false),'fa');
  const armC=[];for(const i of[2,3,1]){const c=raster(L.arm[i],true);c.dataset.p=i;add(c,'arm');armC[i]=c}
  const rig=Pose.build(fig,L);fig.appendChild(rig.lU);fig.appendChild(rig.rU);
  {const c=raster(L.arm[0],true);c.dataset.p=0;add(c,'arm');armC[0]=c}
  Scars.attach(baseC,armC,rig);
  const f=$('foe');f.innerHTML='';f.appendChild(fig);
  const bg=$('bg');bgStatic=backdrop(e);bg.width=BW;bg.height=BH;drawBackdrop(0);
}
const TH=[.75,.5,.25],PIECES=['Shoulders','Helmet','Lower chest','Upper chest'];
const piece=()=>{const i=armDur.findIndex(d=>d>0);return i<0?4:i};
function chips(){const p=piece(),a=foe.arm[p];
  $('segs').innerHTML=armDur.map((d,i)=>'<i class="'+(i===p?'cur':'')+'"><b style="width:'+(d/foe.arm[i][2]*100)+'%"></b></i>').join('');
  $('chips').innerHTML=a?PIECES[p]+' · weak <img src="'+icons[a[0]]+'" alt="'+GEMS[a[0]].n+'"> resists <img src="'+icons[a[1]]+'" alt="'+GEMS[a[1]].n+'">':'No armour'}
function renderFoe(){
  $('foeName').textContent=foe.name+(rage?' · RAGE':'');$('pwLabel').textContent=foe.lackey?'Summon':'Power';
  {const pct=foeHp/foe.hp*100;$('foeBar').style.height=pct+'%';$('foeGhost').style.height=pct+'%';barPulse('vbFoe',foeHp,'lf')}
  $('foeHp').textContent=Math.max(0,Math.ceil(foeHp))+' / '+foe.hp;
  power=Math.min(power,foe.cap);$('pwBar').style.width=Math.min(100,power/foe.cap*100)+'%';$('pwBar').parentNode.classList.toggle('full',power>=foe.cap);
  const tb=$('turns');tb.innerHTML='Moves in <b>'+turns+'</b>';tb.classList.toggle('frozen',turns>EVERY);
  $('foe').querySelectorAll('.arm').forEach(g=>g.classList.toggle('off',armDur[g.dataset.p]<=0));chips();
}
const lastV={};
function barPulse(id,v,key){if(lastV[key]===undefined||lastV[key]===v){lastV[key]=v;return}const el=$(id),cls=v<lastV[key]?'dmg':'heal';lastV[key]=v;
  el.classList.remove('dmg','heal');void el.offsetWidth;el.classList.add(cls)}
function renderMe(){$('vbMe').classList.toggle('warded',!!ward);{const at=$('ammoTag');at.hidden=!ammo;at.textContent='Pierce ×'+ammo}$('wardTag').hidden=!ward;
  {const pct=hp/MAXHP*100;$('meBar').style.height=pct+'%';$('meGhost').style.height=pct+'%';barPulse('vbMe',hp,'lm')}$('meHp').textContent=hp+' / '+MAXHP;
  const f=hp/MAXHP;[...$('pips').children].forEach((p,i)=>p.classList.toggle('off',f<=TH[i]));
}
// gauge[] is the bucket's true total (set when a match scores); shown[] is what the bar shows and fills only
// as gem dust lands in the bucket. A bucket can be fired once its bar is visibly full.
let shown=Array(TYPES).fill(0),gaugeWait=Array(TYPES).fill(0),gq=[[],[],[],[],[],[]];// gq: value of each scored gem still to burst, per type
const ready=t=>shown[t]>=GEMS[t].cap;
function renderGauges(){for(const t of ATK){if(shown[t]>gauge[t])shown[t]=gauge[t]}
  $('gauges').querySelectorAll('.g').forEach((b,j)=>{const t=ATK[j];b.querySelector('i').style.width=(shown[t]/GEMS[t].cap*100)+'%';b.classList.toggle('full',ready(t))})}
function addMoney(d){money=Math.max(0,money+d);hud();try{localStorage.setItem('gemslide-gold',money)}catch(e){}}
function hud(){$('money').textContent=money}
function pop(html,side){side=side||'me';const fd=$('feed-'+side);while(fd.children.length>=4)fd.lastChild.remove();const d=document.createElement('div');d.className='pop';d.innerHTML=html;fd.prepend(d)}
function clearLog(){roundMax=MAXHP;$('feed-me').innerHTML='';$('feed-foe').innerHTML=''}
// small shake on an element: "not yet"
function flash(el,c){el.classList.remove(c);void el.offsetWidth;el.classList.add(c);el.addEventListener('animationend',function f(e){if(e.target!==el)return;el.classList.remove(c);el.removeEventListener('animationend',f)})}
function nudge(el){flash(el,'nope')}
// icons arc from one element to another (compositor-only transform animation); done() runs when the last one lands
function flyIcon(from,to,src,n,done){const a=from.getBoundingClientRect(),z=22;let left=n;
  for(let i=0;i<n;i++){const im=document.createElement('img');im.src=src;im.className='flyi';im.alt='';
    const sx=a.left+a.width/2-z/2+(n>1?(i-(n-1)/2)*8:0),sy=a.top+a.height*.3-z/2;im.style.left=sx+'px';im.style.top=sy+'px';document.body.appendChild(im);
    const r=to.getBoundingClientRect(),dx=r.left+r.width/2-z/2-sx,dy=r.top+Math.min(r.height/2,40)-z/2-sy,lift=-Math.max(50,Math.abs(dx)*.25);
    const an=im.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx*.45}px,${dy*.45+lift}px) scale(1.35)`,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.7)`}],
      {duration:620,delay:i*70,easing:'cubic-bezier(.4,0,.6,1)',fill:'backwards'});
    an.onfinish=()=>{im.remove();flash(to,'bump');if(--left===0&&done)done()}}}
function toast(s){$('toast').textContent=s;clearTimeout(toastT);toastT=setTimeout(()=>$('toast').textContent='',3500)}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
const _ga={};function glowA(h,a){let c=_ga[h];if(!c){const n=parseInt(h.slice(1),16);c=_ga[h]=[n>>16&255,n>>8&255,n&255]}return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a.toFixed(3)+')'}
function shake(){const m=$('main');m.classList.remove('hurt');void m.offsetWidth;m.classList.add('hurt')}

/* ---------- combat ---------- */
function fire(t,src,only){Sfx.bucket();
  let p=piece();
  if(only!==undefined&&only>p&&armDur[only]>0){const G=GEMS[t],pc=foe.arm[only],m=pc[0]===t?1.5:pc[1]===t?.5:1,dmg=Math.round(G.dmg*m),d=Math.min(dmg,armDur[only]-1);
    armDur[only]-=d;Scars.armour(only,m>1);pop(G.atk+' '+d+'<small>'+(m>1?'Weak! ':'')+PIECES[only]+(armDur[only]<=1?' is hanging by a thread':' weakened')+'</small>');
    const f=$('foe');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit');buzz(25);renderFoe();return true}
  if(p>=4){const G=GEMS[t],dmg=Math.round(G.dmg*.4);foeHp=Math.max(0,foeHp-dmg);Scars.skin(2);
    pop((src||G.atk)+' '+dmg+'<small>No armour left, hits HP (reduced)</small>');
    const f=$('foe');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit');
    if(!src){const b=$('gauges').children[ATK.indexOf(t)];b.classList.remove('fire');void b.offsetWidth;b.classList.add('fire')}
    buzz(25);renderFoe();return true}
  const G=GEMS[t],pc=foe.arm[p],m=pc[0]===t?1.5:pc[1]===t?.5:1;
  let dmg=Math.round(G.dmg*m),left=dmg;const broke=[];Scars.armour(p,m>1);if(m>1)Scars.armour(p,false);
  while(left>0&&p<4){const d=Math.min(left,armDur[p]);armDur[p]-=d;left-=d;if(armDur[p]<=0){broke.push(PIECES[p]);p++}}
  pop(G.atk+' '+dmg+(t===3?' (3 hits)':'')+'<small>'+(m>1?'Weak! ':m<1?'Resisted ':'')+(broke.length?broke.join(' and ')+' broken!':'')+'</small>');
  if(broke.length)say('armour',true);else if(Math.random()<.4)say('hurt');
  const f=$('foe');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit');
  const b=$('gauges').children[ATK.indexOf(t)];b.classList.remove('fire');void b.offsetWidth;b.classList.add('fire');
  buzz(broke.length?70:25);if(broke.length)shake();
  if(!rage&&piece()===3){rage=true;rageQueued=true;$('stage').classList.add('rage')}
  renderFoe();return true;
}
let slashes=[];
let swingT;
function enemyStrikeFx(big){Pose.strike(()=>slashLand(big))}
function slashLand(big){
  const fl=$('hurtflash');fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');
  const vb=document.querySelector('.vbar.me');vb.classList.remove('hurt');void vb.offsetWidth;vb.classList.add('hurt');
  const br=cv.getBoundingClientRect();const n=big?5:3;
  for(let i=0;i<n;i++)slashes.push({x:br.left+br.width*(.2+.6*Math.random()),y:br.top+br.height*(.15+.5*Math.random()),a:-.9+Math.random()*.4,len:br.width*(big?.7:.45),t:-i*.06,w:big?9:6});
}
function hurtMe(d,label,backlash){
  if(ward&&!backlash){ward=0;renderMe();pop('<span style="color:#8fc8ff">Blocked!</span><small>'+label+' stopped by your ward</small>','foe');const vb=$('vbMe');vb.classList.remove('heal');void vb.offsetWidth;vb.classList.add('heal');buzz(30);if(!backlash)enemyStrikeFx(false);return}
  if(curseNow)d=Math.round(d/2);hp=Math.max(0,hp-d);renderMe();buzz(d>=15?[80,40,160]:90);shake();if(backlash){const fl=$('hurtflash');fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on')}else enemyStrikeFx(d>=15);
  pop('<span style="color:#ff4d5e">'+label+' -'+d+'</span>','foe');
}
function resolve(gs,bonus,x,y,isMatch,mult,healGreens){mult=mult||1;
  if(isMatch&&phase==='enemy'){let hits=0,reds=0,greens=0,coins=0;for(const g of gs){if(g.t===SP||g.t===SL)continue;if(g.t===GREEN)greens++;else if(g.t===COIN)coins++;else{hits++;if(g.t===RED)reds++}}
    if(coins){const st=Math.min(money,Math.round(coins*COIN_GOLD*mult/2));if(st>0){addMoney(-st);pop('<span style="color:#d4af37">'+foe.name.split(' ')[0]+' pockets '+st+' gold</span>','foe')}}
    if(greens){const h=Math.min(greens*3*mult,foe.hp-foeHp);foeHp+=h;if(h)pop('<span style="color:#5fdc7a">'+foe.name.split(' ')[0]+' heals +'+h+'</span>','foe')}
    if(foe.powerAll)power+=(hits+greens+coins)*mult;
    if(hits){hurtMe(hits*foe.hit*mult,foe.name.split(' ')[0]+' strikes!');if(!foe.powerAll)power+=reds}
    renderFoe();return}
  let pts=bonus,reds=0,greens=0,coins=0;const add=Array(TYPES).fill(0);
  for(const g of gs){const t=g.t;if(t===SP||t===SL)continue;
    if(t===RED){reds++;if(!isMatch)pts+=GEMS[RED].pts;continue}
    pts+=GEMS[t].pts;if(t===GREEN)greens++;else add[t]+=GEMS[t].pts;if(t===COIN)coins++}
  pts*=Math.max(1,combo)*mult;
  const healer=false;let hits=0;for(const g of gs)if(g.t!==RED&&g.t!==SP&&g.t!==SL&&g.t!==COIN&&!(g.t===GREEN&&isMatch&&healer))hits++;
  if(coins){const gg=Math.round(coins*COIN_GOLD*mult);addMoney(gg);floats.push({s:'+'+gg+' gold',x,y:y+.45,life:1.3})}
  if(hits&&foeHp>0){foeHp=Math.max(0,foeHp-Math.round(hits*DMG*mult));if(hits*DMG*mult>=15)Scars.skin(hits*DMG*mult>=27?2:1);const f=$('foe');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit')}
  if(pts)score+=pts;
  if((isMatch||healGreens)&&greens){
    if(healer){const h=Math.min(greens*3*mult,foe.hp-foeHp);foeHp+=h;if(h)pop('<span style="color:#5fdc7a">'+foe.name.split(' ')[0]+' recovers +'+h+'</span>','foe')}
    else{const h=Math.min(Math.round(greens*2*mult),MAXHP-hp);hp+=h;renderMe()}
  }
  if(isMatch&&reds){
    hurtMe(reds*foe.hit,'Diamonds burn you',true);power+=reds;
  }
  if(!noGauge){for(const t of ATK)gauge[t]=Math.min(GEMS[t].cap,gauge[t]+add[t]*mult);for(const g of gs)if(ATK.includes(g.t)&&gq[g.t].length<60)gq[g.t].push(GEMS[g.t].pts*mult)}
  renderGauges();renderFoe();hud();
}
function afterTurn(){
  if(foeHp<=0)return win();
  if(!lowSaid&&foeHp<foe.hp*.25){lowSaid=true;say('low',true)}
  if(hp<=0){const p=piece();if(p===0)return lose();
    armDur[p-1]=foe.arm[p-1][2];hp=MAXHP;renderMe();renderFoe();shake();buzz(150);say('fall',true);
    pop('<span style="color:#ff4d5e">You fall!</span><small>'+foe.name.split(' ')[0]+' straps the '+PIECES[p-1].toLowerCase()+' armour back on. Your HP is restored.</small>','foe')}
  if(rageQueued){rageQueued=false;return startRage()}
  if(lackeyQ){lackeyQ=false;return runLackey()}
  if(replay){const r=replay;replay=null;state='replay';
    setTimeout(()=>{if(state!=='replay')return;const prev=phase;phase=r.ph;combo=1;
      const ord=['','','Second','Third','Fourth'][r.n];pop('<span style="color:#ff9ad5">'+ord+' strike!</span>',r.ph==='enemy'?'foe':'me');floats.push({s:ord.toUpperCase()+' STRIKE!',x:N/2,y:N/2,life:1.6});shake();buzz([40,30,80]);
      r.gs.forEach(g=>{if(g.t<TYPES)burstCell(g.x,g.y,g.t,true)});
      resolve(r.gs,r.bonus,r.x,r.y,true,1);
      if(r.delay){delayQ+=r.delay;}
      if(r.left>1)replay={...r,left:r.left-1,n:r.n+1};
      phase=prev;combo=0;state='replayWait';setTimeout(()=>{if(state==='replayWait'){state='idle';afterTurn()}},700)},900);return}
  if(phase==='enemy'&&power>=foe.cap&&!summoned){summoned=true;power-=foe.cap;renderFoe();if(foe.lackey)return runLackey();hurtMe(foe.big,'Power attack!')}
  if(phase==='enemy'){phase='player';curseNow=false;summoned=false}
  else{const used=pendingTurn;pendingTurn=false;if(used)turns--;if(delayQ){turns=Math.min(MAX_TURNS,turns+delayQ);delayQ=0;const tb=$('turns');tb.classList.remove('bump');void tb.offsetWidth;tb.classList.add('bump')}
    if(turns<=0){turns=EVERY;renderFoe();return enemyMove()}}
  renderFoe();
  if(!hasMove()){floats.push({s:'Shuffle!',x:N/2,y:N/2,life:1.2});
    const slots=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const t=grid[r][c].t;if(t!==SP&&t!==SL)slots.push([r,c])}const pool=slots.map(([r,c])=>grid[r][c]);
    let tries=0;do{pool.sort(()=>Math.random()-.5);slots.forEach(([r,c],i)=>grid[r][c]=pool[i]);if(++tries>60)pool.forEach(g=>g.t=rnd())}while((matchesIn(types(),'all').hit.size||!hasMove())&&tries<400);state='falling'}
}
function enemyMove(){
  state='enemy';curseNow=false;cursed=false;renderFoe();toast(foe.name+' makes a move…');shake();buzz(40);
  setTimeout(()=>{
    if(state!=='enemy')return;
    const m=bestEnemyMove();phase='enemy';
    if(m)say(healMode&&m.greens?'heal':'attack',true);
    if(m)toast(foe.name.split(' ')[0]+(healMode&&m.greens?' goes for a heal':m.four?' lines up 4 of a kind':m.dbl?' goes for a double hit':' attacks'));
    if(m){const[lo,hi]=span(lineOf(grid,m.axis,m.i),m.o,m.axis);
      drag={axis:m.axis,i:m.i,o:m.o,d:0,lo,hi,g:m.axis==='h'?grid[m.i][m.o]:grid[m.o][m.i],enemy:true};em={...m,time:0,done:false};state='enemyAnim'}
    else{hurtMe(foe.hit*2,foe.name.split(' ')[0]+' lunges!');state='idle';afterTurn()}
  },900);
}
let healMode=false;
function bestEnemyMove(){
  healMode=Math.random()<.8;
  const T0=types();let best=null,bs=0;
  for(const axis of['h','v'])for(let i=0;i<N;i++){const L0=lineOf(T0,axis,i);
    for(let o=0;o<N;o++){if(L0[o]===SP||L0[o]===SL)continue;const[lo,hi]=span(L0,o,axis);
      for(let t=lo;t<=hi;t++){if(t===o)continue;const T=T0.map(r=>r.slice());setLine(T,axis,i,slide(L0,o,t));
        const cnt={};let n=0;matchesIn(T,'all').hit.forEach(k=>{const v=T[Math.floor(k/N)][k%N];cnt[v]=(cnt[v]||0)+1;n++});
        if(!n)continue;const greens=cnt[GREEN]||0,four=Object.values(cnt).some(v=>v>=4),dbl=Object.keys(cnt).length>=2;
        const sc=(healMode&&greens?1e6+greens*1e3:0)+(four?1e4:0)+(dbl?1e3:0)+n+Math.random()*.5;
        if(sc>bs){bs=sc;best={axis,i,o,t,greens,four,dbl}}}}}
  return best;
}
function enemyTick(dt){
  em.time+=dt;const LIFT=.7,SLIDE=1.1,HOLD=.5;
  if(em.time<LIFT)drag.d=0;
  else if(em.time<LIFT+SLIDE){const p=(em.time-LIFT)/SLIDE,e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;drag.d=(em.t-em.o)*cell*e}
  else if(!em.done){em.done=true;drag=null;firstStep=true;setLine(grid,em.axis,em.i,slide(lineOf(grid,em.axis,em.i),em.o,em.t));hl={axis:em.axis,i:em.i,life:1.2};shake();buzz(60)}
  else if(em.time>=LIFT+SLIDE+HOLD){em=null;state='falling'}
}
// Varro's lackey, Andressa: targets a special gem (bursting a radius-2 area around it); with none on the board she shoots a bottom-row gem.
const LACKEY={name:'Andressa',radius:2,
  special:["Pretty bauble. Mine now.","That glitter won't save thee!","Shatter, trinket!"],
  none:["No baubles to break? The floor will do, then.","Nothing worth an arrow... this one, then."]};
function sayL(t){const b=$('lspeech');b.firstChild.textContent=t;b.classList.remove('on');void b.offsetWidth;b.classList.add('on');clearTimeout(b._h);b._h=setTimeout(()=>b.classList.remove('on'),3000)}
function runLackey(){
  state='lackey';say('lackey',true);const L=$('lackey');if(!L.firstChild)L.appendChild(archerArt());
  L.classList.remove('on','shoot');void L.offsetWidth;L.classList.add('on');
  pop('<span style="color:#c8a070">'+LACKEY.name+' the archer!</span><small>Varro summons his lackey</small>','foe');
  const specials=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const t=grid[r][c].t;if(t===SP||t===SL)specials.push({r,c})}
  let tgt;
  if(specials.length){tgt={...specials[Math.floor(Math.random()*specials.length)],special:true}}
  else{const row=[];for(let c=0;c<N;c++){const t=grid[N-1][c].t;if(t!==SP&&t!==SL)row.push(c)}tgt={r:N-1,c:row.length?row[Math.floor(Math.random()*row.length)]:0,special:false}}
  setTimeout(()=>{if(state!=='lackey')return;sayL(tgt.special?LACKEY.special[Math.floor(Math.random()*3)]:LACKEY.none[Math.floor(Math.random()*2)])},900);
  setTimeout(()=>{if(state!=='lackey')return;L.classList.add('shoot');
    const a=L.getBoundingClientRect(),br=cv.getBoundingClientRect(),sx=a.left+a.width*.85,sy=a.top+a.height*.54,tx=br.left+(tgt.c+.5)*cell,ty=br.top+(tgt.r+.5)*cell;
    arrow={x:sx,y:sy,sx,sy,tx,ty,t:0,dur:.6,tgt}},1900);
}
let arrow=null;
function arrowTick(dt){const A=arrow;A.t+=dt;const k=Math.min(1,A.t/A.dur);A.x=A.sx+(A.tx-A.sx)*k;A.y=A.sy+(A.ty-A.sy)*k;
  if(k<1)return;
  arrow=null;$('lackey').classList.remove('on','shoot');const T=A.tgt,cells=[[T.r,T.c]];
  if(T.special){for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(r===T.r&&c===T.c)continue;const t=grid[r][c].t;if(t===SP||t===SL)continue;if((r-T.r)**2+(c-T.c)**2<=LACKEY.radius*LACKEY.radius+.01)cells.push([r,c])}
    rings.push({x:A.tx,y:A.ty,t:0});burstFx(A.tx,A.ty,['#ffffff','#ffd166','#c84a2a','#7a5a3a'],50,cell*8);shake();buzz([40,30,100]);
    pop('<span style="color:#c8a070">'+LACKEY.name+' shatters your '+(grid[T.r][T.c].t===SP?'force':'slingshot')+' gem!</span>','foe')}
  else{burstFx(A.tx,A.ty,['#ffffff','#c84a2a'],16,cell*4);buzz(40);pop('<span style="color:#c8a070">'+LACKEY.name+'\'s arrow</span><small>No special gems, so she hit the bottom row</small>','foe')}
  for(const[r,c]of cells){const g=grid[r][c];g.pop=true;g.burst=true;if(g.t<TYPES)burstCell(c,r,g.t,false,true)}
  popExtra=0;state='popping';popT=0}
function startRage(){
  state='rage';say('rage',true);pop('<span style="color:#ff4d5e">RAGE!</span><small>'+foe.name+' tears up the board</small>','foe');buzz(150);shake();
  const cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(grid[r][c].t!==SP&&grid[r][c].t!==SL)cells.push([r,c]);
  cells.sort(()=>Math.random()-.5);rq={list:cells.slice(0,Math.round(N*N*.3)),i:0,t:0};
}
function rageTick(dt){
  rq.t+=dt;
  while(rq.i<rq.list.length&&rq.t>=rq.i*.11){const[r,c]=rq.list[rq.i++];if(grid[r][c]){grid[r][c].dying=0;Sfx.pop(grid[r][c].t,true)}buzz(10)}
  let busy=false;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){const g=grid[r][c];if(g&&g.dying!==undefined){g.dying+=dt;busy=true;if(g.dying>=.15)grid[r][c]=null}}
  if(rq.i>=rq.list.length&&!busy&&rq.t>rq.list.length*.11+.45){
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c]){const g=gem(GREEN,c,r);g.grow=0;grid[r][c]=g}
    rq=null;phase="player";curseNow=false;noGauge=true;state="falling";
  }
}
function overlay(html){const o=$('over');o.innerHTML=html;o.classList.add('on')}
function saveBest(){if(score>best){best=score;try{localStorage.setItem('gemslide-best',best)}catch(e){}}hud()}
function win(){$('speech').classList.remove('on');
  const n=armDur.filter(d=>d<=0).length,bonus=n*300+(n===4?1000:0);score+=bonus;
  state='over';$('foe').classList.add('down');$('stage').classList.remove('rage');saveBest();
  overlay(`<h3>${foe.name} is beaten</h3><p>Armour stripped ${n}/4 · +${bonus}${n===4?' (full strip!)':''}</p><p class="q">“${foe.plea}”</p><div class="btns"><button class="btn alt" data-act="spare">Spare</button><button class="btn red" data-act="kill">Kill</button></div>`);
}
function lose(){
  state='over';saveBest();
  overlay(`<h3>You were defeated</h3><p>${foe.name} stands over you. Score ${score}</p><div class="btns"><button class="btn" data-act="retry">Try again</button></div>`);
}
$('over').addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act;
  if(act==='spare'||act==='kill'){
    $('foe').classList.add(act==='spare'?'spared':'killed');
    overlay(`<h3>${act==='spare'?'Spared':'Slain'}</h3><p>${act==='spare'?foe.spare:foe.kill}</p><div class="btns"><button class="btn" data-act="next">Next battle</button></div>`);
  }else if(act==='next'){fi=(fi+1)%FOES.length;battle()}
  else if(act==='retry'){score=battleScore;battle()}
});

/* ---------- board ---------- */
const rnd=()=>Math.floor(Math.random()*TYPES);
const gem=(t,x,y)=>({t,x,y,pop:false});
const types=()=>grid.map(r=>r.map(g=>g?g.t:-1));
function matchesIn(T,mode){
  const hit=new Set(),runs=[];
  const ok=v=>v>=0&&v!==SP&&v!==SL&&(mode==='all'||v!==RED);
  for(let r=0;r<N;r++)for(let c=0;c<N;){let e=c;const v=T[r][c];if(ok(v)){while(e+1<N&&T[r][e+1]===v)e++;if(e-c>=2){const a=[];for(let k=c;k<=e;k++)a.push(r*N+k);runs.push({a,v})}}c=e+1}
  for(let c=0;c<N;c++)for(let r=0;r<N;){let e=r;const v=T[r][c];if(ok(v)){while(e+1<N&&T[e+1][c]===v)e++;if(e-r>=2){const a=[];for(let k=r;k<=e;k++)a.push(k*N+c);runs.push({a,v})}}r=e+1}
  // merge crossing runs of the same colour into shapes (L, T, +)
  const groups=[];
  for(const run of runs){run.a.forEach(k=>hit.add(k));
    const g=groups.filter(g=>g.v===run.v&&run.a.some(k=>g.cells.has(k)));
    const m=g.length?g[0]:{v:run.v,cells:new Set(),count:new Map()};if(!g.length)groups.push(m);
    for(const o of g.slice(1)){o.cells.forEach(k=>m.cells.add(k));o.count.forEach((n,k)=>m.count.set(k,(m.count.get(k)||0)+n));groups.splice(groups.indexOf(o),1)}
    run.a.forEach(k=>{m.cells.add(k);m.count.set(k,(m.count.get(k)||0)+1)})}
  const big=[];let bonus=0;
  for(const g of groups){const n=g.cells.size;if(n>=4&&g.v!==RED){const cells=[...g.cells],corner=cells.find(k=>g.count.get(k)>1);
    const arr=corner!==undefined?[corner,...cells.filter(k=>k!==corner)]:cells;arr.shape=corner!==undefined?'LT':'line';big.push(arr);bonus+=n>=5?50:20}}
  return{hit,bonus,big};
}
const isSp=v=>v===SP||(v&&v.t===SP);
function span(line,o,axis){return[0,N-1]}  // force gems no longer block: other gems slide through them like regular gems
const lineOf=(T,axis,i)=>axis==='h'?T[i]:T.map(r=>r[i]);
function setLine(T,axis,i,arr){if(axis==='h')T[i]=arr;else arr.forEach((v,r)=>T[r][i]=v)}
function slide(arr,o,t){const a=arr.slice(),[g]=a.splice(o,1);a.splice(t,0,g);return a}
function hasMove(){
  const T0=types();if(T0.some(r=>r.includes(SP)||r.includes(SL)))return true;
  for(const axis of['h','v'])for(let i=0;i<N;i++)for(let o=0;o<N;o++)for(let t=0;t<N;t++){
    if(t===o)continue;const T=T0.map(r=>r.slice());setLine(T,axis,i,slide(lineOf(T,axis,i),o,t));
    if(matchesIn(T,'p').hit.size)return true;
  }
  return false;
}
function fill(){
  do{grid=[];for(let r=0;r<N;r++){grid.push([]);for(let c=0;c<N;c++){let t;do{t=rnd()}while((c>1&&grid[r][c-1].t===t&&grid[r][c-2].t===t)||(r>1&&grid[r-1][c].t===t&&grid[r-2][c].t===t));grid[r].push(gem(t,c,r-N-1))}}}while(!hasMove()&&Math.random()<.999);
}
function battle(){
  foe=FOES[fi];foeHp=foe.hp;hp=MAXHP;turns=EVERY;cursed=false;curseNow=false;gauge=Array(TYPES).fill(0);shown=Array(TYPES).fill(0);gq=[[],[],[],[],[],[]];gaugeWait=Array(TYPES).fill(0);power=0;pendingTurn=false;battleScore=score;
  ammo=0;phase='player';forges=[];popExtra=0;delayQ=0;ward=0;lackeyQ=false;arrow=null;em=null;slashes=[];fxp=[];rings=[];preview=null;$('lackey').classList.remove('on','shoot');$('speech').classList.remove('on');sayT=0;noGauge=false;rage=false;charge=null;proj=null;chainN=0;replay=null;boxParts=[];dust=[];parts=[];rageQueued=false;armDur=foe.arm.map(a=>a[2]);rq=null;hl=null;combo=0;drag=null;floats=[];lastMoved=null;
  $('foe').className='';buildFoe(foe);clearLog();lowSaid=false;setTimeout(()=>say('intro',true),700);$('stage').classList.remove('rage');
  $('over').classList.remove('on');fill();if(TEST_SLINGS)[[6,1],[6,3],[6,5]].forEach(([r,c])=>grid[r][c].t=SL);state='falling';renderFoe();renderMe();renderGauges();hud();
}
function step(){
  const{hit,bonus,big}=matchesIn(types(),'all');
  if(!hit.size){combo=0;noGauge=false;firstStep=false;state='idle';afterTurn();return}
  combo++;const made=new Set(),byCol={};
  if(combo>=2&&phase==='player'){  // match chain: a cascade from your own move. Each link knocks 1/5 off the enemy's summon/power bar
    const cut=foe.cap/5,had=power;power=Math.max(0,power-cut);renderFoe();
    floats.push({s:'Chain x'+combo+'!',x:N/2,y:N/2-.6,life:1.5});
    pop('<span style="color:#ffd166">Chain x'+combo+'!</span>'+(had>0?'<small>'+(foe.lackey?'Summon':'Power')+' bar -20%</small>':''));buzz(20)}
  hit.forEach(k=>{const r=Math.floor(k/N),c=k%N,t=grid[r][c].t;if(t===SP)return;(byCol[t]=byCol[t]||{n:0,x:0,y:0}).n++;byCol[t].x+=c;byCol[t].y+=r});
  const mk=new Map();if(phase!=='enemy')for(const a of big){if(a.some(k=>made.has(k)))continue;let k=a.find(k=>grid[Math.floor(k/N)][k%N]===lastMoved);if(k===undefined)k=a[0];made.add(k);mk.set(k,a.shape==='LT'?SL:SP)}
  for(const a of big){if(a.shape!=='LT')continue;const k=a.find(q=>made.has(q));let cx,cy;if(k!==undefined){cx=k%N+.5;cy=Math.floor(k/N)+.5}else{cx=a.reduce((v,q)=>v+q%N,0)/a.length+.5;cy=a.reduce((v,q)=>v+Math.floor(q/N),0)/a.length+.5}
    const bl={x:cx,y:cy};for(const q of a){const g=grid[Math.floor(q/N)][q%N];if(g)g.blast=bl}}
  let ox=null,oy=null;if(lastMoved){ox=lastMoved.x;oy=lastMoved.y}
  lastMoved=null;let sx=0,sy=0;const gs=[];
  hit.forEach(k=>{const g=grid[Math.floor(k/N)][k%N];sx+=k%N;sy+=Math.floor(k/N);if(made.has(k)){gs.push({t:g.t});g.t=mk.get(k);g.forge=0;const grp=big.find(a=>a.includes(k))||[k];Sfx.forge();forges.push({x:k%N,y:Math.floor(k/N),t:0,sl:g.t===SL,src:grp.filter(q=>q!==k).map(q=>({x:q%N,y:Math.floor(q/N),col:COLORS[gs[0]?.t??0]}))})}else{g.pop=true;gs.push(g)}});
  const kinds=Object.keys(byCol).filter(t=>phase==='enemy'||+t!==RED).length,dbl=firstStep&&kinds>=2;firstStep=false;
  if(dbl){const hits=Math.min(4,kinds);floats.push({s:'MULTI-STRIKE x'+hits+'!',x:N/2,y:N/2,life:1.8});pop('<span style="color:#ff9ad5">Multi-strike x'+hits+'!</span><small>'+(hits-1)+' more strike'+(hits>2?'s':'')+' follow</small>',phase==='enemy'?'foe':'me');shake();buzz([30,40,60]);
    replay={left:hits-1,n:2,ph:phase,gs:gs.map(g=>({t:g.t,x:g.x,y:g.y})),bonus,x:sx/hit.size+.5,y:sy/hit.size+.5,delay:phase!=='enemy'?big.length:0}}
  if(phase!=='enemy'&&big.length){delayQ+=big.length;}
  made.forEach(k=>{const r=Math.floor(k/N),c=k%N;floats.push({s:mk.get(k)===SL?'Slingshot!':'Force gem!',x:c+.5,y:r+.1,life:1.6})});
  resolve(gs,bonus,sx/hit.size+.5,sy/hit.size+.5,true,1);buzz(combo>1?30:15);
  if(ox===null){ox=sx/hit.size;oy=sy/hit.size}setPopOrder(ox,oy);
  state='popping';popT=0;
}
let forges=[],delayQ=0;
let popExtra=0,sfxN=0;const BURST_GAP=.045,BURST_SPREAD_MAX=.28;
function setPopOrder(ox,oy){const list=[];for(const row of grid)for(const g of row)if(g&&g.pop&&g.dying===undefined)list.push(g);
  list.sort((a,b)=>Math.hypot(a.x-ox,a.y-oy)-Math.hypot(b.x-ox,b.y-oy));const gap=list.length>1?Math.min(BURST_GAP,BURST_SPREAD_MAX/(list.length-1)):0;
  list.forEach((g,i)=>g.bAt=i*gap);popExtra=list.length?(list.length-1)*gap:0;sfxN=0}
const lt=g=>popT-(g.bAt||0);
const popDur=()=>phase==='enemy'?.65:POP;
// Match timeline: gems light up one by one (chain), short hold, then swell and burst one by one in the same order.
const pk=()=>phase==='enemy'?1.3:1;
const burstT=g=>popExtra+(LIGHT_HOLD+SWELL)*pk()+(g.bAt||0);
const popEnd=()=>popExtra*2+(LIGHT_HOLD+SWELL+POST)*pk();
let boxParts=[];
let dust=[];
function burstCell(gx,gy,t,big,noBucket,blast){
  const br=cv.getBoundingClientRect(),sx=br.left+(gx+.5)*cell,sy=br.top+(gy+.5)*cell,col=COLORS[t],n=Math.round((blast?38:big?30:24)*(lowFx?.5:1)),gv=!noBucket&&phase!=='enemy'&&gq[t]&&gq[t].length?gq[t].shift():0;
  let tx,ty,bucket=null;
  if(!noBucket&&phase!=='enemy'&&ATK.includes(t)){bucket=$('gauges').children[ATK.indexOf(t)];const r=bucket.getBoundingClientRect();tx=r.left+r.width/2;ty=r.top+r.height*.55}
  else{tx=sx;ty=br.bottom-6}
  for(let i=0;i<n;i++){const a=-Math.PI*(.15+.7*Math.random()),v=cell*(2+Math.random()*4);
    if(dust.length>=PCAP())break;dust.push({x:sx+(Math.random()-.5)*cell*.4,y:sy+(Math.random()-.5)*cell*.4,vx:Math.cos(a)*v*(Math.random()<.5?-1:1),vy:Math.sin(a)*v,
      s:Math.max(2,cell*(.06+Math.random()*.06)),col:i%5===0?'#ffffff':col[Math.floor(Math.random()*3)],tx:tx+(Math.random()-.5)*(bucket?cell*.8:cell*.9),ty,bucket,bt:bucket?t:-1,v:gv/n,
      delay:Math.random()*.12,life:3,settled:false});
    if(blast){const p=dust[dust.length-1],bx=br.left+blast.x*cell,by=br.top+blast.y*cell;let dx=sx-bx,dy=sy-by;const L=Math.hypot(dx,dy)||1;
      const a=Math.atan2(dy/L,dx/L)+(Math.random()-.5)*(L<2?6.28:1.3),v=cell*(7+Math.random()*8);p.vx=Math.cos(a)*v;p.vy=Math.sin(a)*v-cell*2;p.delay=Math.random()*.04;p.free=.3+Math.random()*.15;p.life=3.4}}
}
function dustTick(dt){
  const g=cell*16,fly=Array(TYPES).fill(0);let gd=false;for(const p of dust)if(p.bucket&&p.life>0)fly[p.bt]++;
  for(const p of dust){if(p.delay>0){p.delay-=dt;continue}p.life-=dt;if(p.settled){continue}
    if(p.free>0){p.free-=dt;p.vy+=g*.3*dt;const dr=Math.exp(-dt*3);p.vx*=dr;p.vy*=dr;p.x+=p.vx*dt;p.y+=p.vy*dt;continue}
    p.vy+=g*dt;p.vx+=((p.tx-p.x)*6-p.vx*2.2)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.y>=p.ty){if(p.bucket){p.life=0;const t=p.bt;if(shown[t]>=GEMS[t].cap){const bk=p.bucket,nw=performance.now();if(!bk._sp||nw-bk._sp>60){bk._sp=nw;burstFx(p.x,p.ty-cell*.15,['#fff3c4','#ffd166','#ffffff'],lowFx?3:5,cell*3.2);Sfx.spill()}}
      else if(shown[t]<gauge[t]){shown[t]+=p.v||(gauge[t]-shown[t])/Math.max(1,fly[t]);gd=true}fly[t]--;if(!p.bucket._sip||performance.now()-p.bucket._sip>120){p.bucket._sip=performance.now();p.bucket.classList.remove('sip');void p.bucket.offsetWidth;p.bucket.classList.add('sip')}}
      else{p.y=p.ty-Math.random()*cell*.15;p.vy=0;p.vx=0;p.settled=true;p.life=Math.min(p.life,.7)}}}
  dust=dust.filter(p=>p.life>0);
  // safety net: if a bucket's total is ahead of its bar with no dust on the way for 1.5 s, catch up
  for(const t of ATK){if(shown[t]<gauge[t]&&!fly[t]){gaugeWait[t]+=dt;if(gaugeWait[t]>1.5){shown[t]=gauge[t];gd=true}}else gaugeWait[t]=0}
  if(gd)renderGauges();
}
function boxTick(dt){for(const p of boxParts){p.life-=dt;if(p.settled)continue;p.vy+=14*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.x<p.x0+p.s/2){p.x=p.x0+p.s/2;p.vx=-p.vx*.45}if(p.x>p.x1-p.s/2){p.x=p.x1-p.s/2;p.vx=-p.vx*.45}
    if(p.y>p.floor-p.s/2){p.y=p.floor-p.s/2;if(Math.abs(p.vy)>2.5){p.vy=-p.vy*.3;p.vx*=.6}else{p.vy=0;p.settled=true}}}
  boxParts=boxParts.filter(p=>p.life>0)}
function collapse(){
  for(let c=0;c<N;c++){const fixed=new Set(),keep=[];
    for(let r=N-1;r>=0;r--){const g=grid[r][c];if(!g.pop&&(g.t===SP||g.t===SL))fixed.add(r);else if(!g.pop)keep.push(g)}
    let s=0,ki=0;for(let r=N-1;r>=0;r--){if(fixed.has(r))continue;grid[r][c]=keep[ki++]||gem(rnd(),c,-1-(s++))}}
  state='falling';
}
// Star bucket power: tap a gem, then up to 5 random gems of that kind shatter at 1.25x value (free action).
function startSelect(){state='select';Sfx.forge();pop('<span style="color:#ff9ad5">Star power!</span>');}
function starPick(t,r0,c0){const all=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const g=grid[r][c];if(g&&g.t===t&&!g.pop&&g.dying===undefined)all.push(r*N+c)}
  for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
  const pick=all.slice(0,5);if(!pick.includes(r0*N+c0)&&pick.length===5&&all.includes(r0*N+c0))pick[4]=r0*N+c0;
  clearLog();Sfx.bucket();floats.push({s:'×1.25!',x:c0+.5,y:r0-.2,life:1.4});
  pop('<span style="color:#ff9ad5">'+pick.length+' '+GEMS[t].n+(pick.length===1?'':'s')+' shattered</span><small>Worth 1.25x</small>');
  state='idle';finishBlast(pick,0,c0+.5,r0+.5,true,true,true,1.25)}
function finishBlast(cells,bonus,x,y,keepSL,healGreens,free,mult){
  const gs=[];cells.forEach(k=>{const g=grid[Math.floor(k/N)][k%N];if(keepSL&&g.t===SL)return;g.pop=true;gs.push(g)});
  combo=1;resolve(gs,bonus,x,y,false,mult||1,healGreens);combo=0;
  phase='player';if(!free)pendingTurn=true;setPopOrder(x-.5,y-.5);state='popping';popT=0;return gs;
}
const burstSize=f=>Math.min(7,1+Math.floor(f/.12));
function startCharge(){charge={r:drag.r,c:drag.c,g:drag.g,f:0,T:.7+Math.random()*.1,lv:1};state='charging';buzz(15)}
function burstAt(r0,c0,rad,ok,perfect){
  clearLog();if(ok!==false)Sfx.gold(!!perfect);
  if(!perfect)chainN=0;
  const cells=new Set([r0*N+c0]);
  for(let r=Math.max(0,r0-rad);r<=Math.min(N-1,r0+rad);r++){const t=grid[r][c0].t;if(r!==r0&&(t===SP||t===SL))continue;cells.add(r*N+c0)}
  const n=1;delayQ+=n;let earned=0;for(let i=0;i<n;i++)earned+=8+Math.floor(Math.random()*5);money+=earned;hud();floats.push({s:'+'+earned+' gold',x:c0+.5,y:r0+.9,life:1.6});
  try{localStorage.setItem('gemslide-gold',money)}catch(e){}
  let reds=[];if(perfect){for(let r=0;r<N;r++)for(let c=0;c<N;c++){const k=r*N+c;if(!cells.has(k)&&grid[r][c].t===RED)reds.push(k)}
    reds=reds.filter(k=>{const t=grid[Math.floor(k/N)][k%N].t;return t!==SP&&t!==SL});reds.sort(()=>Math.random()-.5);reds=reds.slice(0,PERFECT_REDS);reds.forEach(k=>cells.add(k))}
  const gs=finishBlast(cells,20*rad+30*(n-1),c0+.5,r0+.5,true);
  if(ok==='tap'){pixels(c0+.5,r0+.5,['#ffd166','#f5a623'],14,.6);buzz(40)}
  else if(ok){
    pixels(c0+.5,r0+.5,['#fff6d5','#ffd166','#f5a623','#c47f00'],46,1);
    for(const g of gs)if(g.t<TYPES)pixels(g.x+.5,g.y+.5,COLORS[g.t],4,.6);
    floats.push({s:(perfect?'PERFECT! ':'')+'Burst '+rad+'!'+(n>1?' Chain x'+n:''),x:c0+.5,y:r0-.3,life:1.6});flinch();buzz(perfect?[60,40,120]:90);shake();
    if(perfect){reds.forEach(k=>pixels(k%N+.5,Math.floor(k/N)+.5,COLORS[RED],10,.8));
      chainN=chainN+1;if(chainN===1)chainBase=8+Math.random()*4;const pct=chainBase+2*(chainN-1);
      let tot=0;const broke=[];armDur.forEach((d,i)=>{if(d<=0)return;Scars.armour(i,false);const hit=Math.round(foe.arm[i][2]*pct/100);armDur[i]=Math.max(0,d-hit);tot+=Math.min(d,hit);if(armDur[i]<=0)broke.push(PIECES[i])});
      if(!rage&&piece()===3){rage=true;rageQueued=true;$('stage').classList.add('rage')}
      toast(chainN<CHAIN_MAX?'Chain '+chainN+'/'+CHAIN_MAX+': hold another force gem on your next turn for '+Math.round(pct+2)+'%. It charges a little faster.':'Chain complete! 5/5');
      const f=$('foe');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit');renderFoe();
      pop('<span style="color:#ffd166">'+(chainN>1?'Chain strike x'+chainN+'!':'Perfect release!')+'</span><small>'+reds.length+' diamonds destroyed · all armour -'+Math.round(pct)+'% ('+tot+')'+(broke.length?' · '+broke.join(' and ')+' broken!':'')+'</small>');if(chainN>=CHAIN_MAX)chainN=0}
  }else floats.push({s:'Fizzle…',x:c0+.5,y:r0-.3,life:1.2});
}
function pixels(x,y,cols,n,sp){
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(1.5+Math.random()*5)*sp;
    capPush(parts,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2*sp,life:.6+Math.random()*.6,s:.07+Math.random()*.09,col:cols[Math.floor(Math.random()*cols.length)]})}
}
function flinch(){if(Math.random()<.6)say('flinch');const f=$('foe');if(f.classList.contains('down'))return;f.classList.remove('flinch');void f.offsetWidth;f.classList.add('flinch');clearTimeout(flT);flT=setTimeout(()=>f.classList.remove('flinch'),1300)}
/* ---------- slingshot ---------- */
const fx=document.getElementById('fx'),fctx=fx.getContext('2d');let proj=null,fxp=[],rings=[],fxDrawn=true;
function sizeFx(){const d=Math.min(window.devicePixelRatio||1,FX_DPR());fxDrawn=true;fx.width=innerWidth*d;fx.height=innerHeight*d;fx.style.width=innerWidth+'px';fx.style.height=innerHeight+'px';fctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',sizeFx);
const target=()=>piece()>=4?$('foe').querySelector('.fig canvas:not([class])'):$('foe').querySelector('.arm[data-p="'+piece()+'"]');
function setTarget(on){$('foe').querySelectorAll('.arm').forEach(a=>a.classList.remove('target'));if(!on)return;
  if(ammo>0&&piece()<4){$('foe').querySelectorAll('.arm').forEach(a=>{if(armDur[a.dataset.p]>0)a.classList.add('target')});return}
  const t=target();if(t)t.classList.add('target')}
function pixHit(el,x,y){if(!el||el.classList.contains('off'))return false;const r=el.getBoundingClientRect();
  if(x<r.left||x>r.right||y<r.top||y>r.bottom)return false;
  if(!el._a)el._a=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
  const px=Math.floor((x-r.left)/r.width*el.width),py=Math.floor((y-r.top)/r.height*el.height);return el._a[(py*el.width+px)*4+3]>0}
// returns the armour canvas that was hit (or null). Piercing shots can hit any intact piece, front-most first.
function armourHit(x,y,pierce){
  if(pierce&&piece()<4){for(const p of[0,1,3,2]){if(armDur[p]<=0)continue;const el=$('foe').querySelector('.arm[data-p="'+p+'"]');if(pixHit(el,x,y))return el}return null}
  const el=target();return pixHit(el,x,y)?el:null}
const slingOk=D=>D.py>cell*SLING_MIN_DOWN&&Math.hypot(D.px,D.py)>cell*SLING_MIN_PULL;
function fireSling(D){
  const br=cv.getBoundingClientRect(),L=Math.hypot(D.px,D.py),sp=8.5*cell;
  proj={x:br.left+(D.c+.5)*cell,y:br.top+(D.r+.5)*cell,vx:-D.px/L*sp,vy:-D.py/L*sp,cells:new Set([D.r*N+D.c]),pushed:new Set(),trail:[],spin:0};
  D.g.dying=0;state='sling';buzz(30);Sfx.sling();if(ammo>0){ammo--;proj.pierce=true;renderMe()}
}
function endSling(hit){
  const p=proj;proj=null;
  if(hit&&piece()>=4){fire(5,'Body blow');flinch();shake();buzz([40,30,90])}
  else if(hit&&p.hitP!==undefined&&p.hitP>piece()){const q=p.hitP,w=foe.arm[q][0];pop('<span style="color:#7ff5e1">Piercing hit!</span><small>'+PIECES[q]+' takes a '+GEMS[w].n+' blast</small>');fire(w,undefined,q);flinch();shake();buzz([40,30,90])}
  else if(hit){const w=foe.arm[piece()][0];pop('<span style="color:#7ff5e1">Direct hit!</span><small>'+PIECES[piece()]+' takes a '+GEMS[w].n+' blast</small>');fire(w);flinch();shake();buzz([40,30,90])}
  else floats.push({s:'Miss',x:N/2,y:.6,life:1.2});
  finishBlast(p.cells,20*p.cells.size+(hit?100:0),N/2,N/2,false,true,true);
}
// a weak pull: the band goes slack and wobbles back to rest
let slacks=[];
function slack(D){Sfx.snap();buzz(10);slacks.push({c:D.c,r:D.r,px:D.px,py:D.py,t:0})}
function burstFx(x,y,cols,n,spd){if(lowFx)n=Math.ceil(n/2);for(let i=0;i<n;i++){if(fxp.length>=PCAP())break;const a=Math.random()*Math.PI*2,v=(.3+Math.random())*spd;fxp.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-spd*.3,life:.5+Math.random()*.6,s:3+Math.random()*5,col:cols[Math.floor(Math.random()*cols.length)]})}}
function slingTick(dt){
  if(proj.hit){proj.hold-=dt;if(proj.hold<=0)endSling(true);return}
  const br=cv.getBoundingClientRect(),st=$('stage').getBoundingClientRect(),n=Math.ceil(Math.hypot(proj.vx,proj.vy)*dt/(cell*.2));
  proj.spin+=dt*14;
  for(let i=0;i<n;i++){
    proj.x+=proj.vx*dt/n;proj.y+=proj.vy*dt/n;proj.trail.push([proj.x,proj.y]);if(proj.trail.length>14)proj.trail.shift();
    const bx=(proj.x-br.left)/cell,by=(proj.y-br.top)/cell;
    if(by>=0&&by<N){if(bx<0||bx>=N)return endSling(false);
      const c=Math.floor(bx),r=Math.floor(by),k=r*N+c,g=grid[r][c];
      if(g&&g.t===SP&&!proj.pushed.has(g)&&Math.hypot(bx-c-.5,by-r-.5)<.55){let bk=-1,bd=99;
        proj.cells.forEach(q=>{const qr=Math.floor(q/N),qc=q%N,dd=Math.hypot(qr-r,qc-c);if(dd<bd){bd=dd;bk=q}});
        if(bk>=0){const qr=Math.floor(bk/N),qc=bk%N,hole=grid[qr][qc];grid[qr][qc]=g;grid[r][c]=hole;proj.cells.delete(bk);proj.cells.add(k);proj.pushed.add(g);floats.push({s:'Pushed!',x:qc+.5,y:qr+.3,life:1});buzz(12)}}
      if(g&&g.t!==SP&&g.t!==SL&&!proj.cells.has(k)&&Math.hypot(bx-c-.5,by-r-.5)<.55){proj.cells.add(k);g.dying=0;g.burst=true;Sfx.pop(g.t);if(g.t<TYPES)burstCell(c,r,g.t,false);buzz(8)}}
    else if(by<0){const hel=armourHit(proj.x,proj.y,proj.pierce);if(hel){proj.hit=true;proj.hold=.35;const el=hel;proj.hitP=el.dataset.p===undefined?4:+el.dataset.p;
        el.classList.remove('struck');void el.offsetWidth;el.classList.add('struck');setTimeout(()=>el.classList.remove('struck'),550);
        burstFx(proj.x,proj.y,['#ffffff','#7ff5e1','#3fd6c0',foe.armour,'#ffd166'],46,cell*9);rings.push({x:proj.x,y:proj.y,t:0});buzz(60);return}
      if(proj.y<st.top){burstFx(proj.x,st.top+4,['#7ff5e1','#ffffff'],12,cell*4);return endSling(false)}
      if(proj.x<st.left||proj.x>st.right)return endSling(false)}
    else if(proj.vy>=0||proj.y>innerHeight)return endSling(false);
  }
}
function fxTick(dt){for(const k of slacks)k.t+=dt;slacks=slacks.filter(k=>k.t<.45);for(const sl of slashes)sl.t+=dt;slashes=slashes.filter(sl=>sl.t<.5);for(const p of fxp){p.vy+=cell*14*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}fxp=fxp.filter(p=>p.life>0);for(const r of rings)r.t+=dt;rings=rings.filter(r=>r.t<.5)}
function drawFx(){
  const any=slacks.length||(drag&&drag.sling)||proj||slashes.length||dust.length||arrow||rings.length||fxp.length;
  if(!any&&!fxDrawn)return;fxDrawn=!!any;
  fctx.clearRect(0,0,innerWidth,innerHeight);if(!any)return;fctx.imageSmoothingEnabled=false;
  const br=cv.getBoundingClientRect(),im=sprites[SL];if(!im)return;
  if(drag&&drag.sling){const ox=br.left+(drag.c+.5)*cell,oy=br.top+(drag.r+.5)*cell,gx=ox+drag.px,gy=oy+drag.py,L=Math.hypot(drag.px,drag.py),ok=slingOk(drag);
    if(ok){const ux=-drag.px/L,uy=-drag.py/L,len=(oy-br.top)/Math.max(.2,uy);fctx.save();fctx.setLineDash([4,7]);fctx.lineWidth=3;fctx.strokeStyle='rgba(127,245,225,.9)';
      fctx.beginPath();fctx.moveTo(ox,oy);const al=Math.min(len,N*cell/3);fctx.lineTo(ox+ux*al,oy+uy*al);fctx.stroke();fctx.restore()}
    fctx.lineWidth=4;fctx.strokeStyle='#c98a4a';fctx.beginPath();fctx.moveTo(ox-cell*.45,oy-cell*.2);fctx.lineTo(gx,gy);fctx.lineTo(ox+cell*.45,oy-cell*.2);fctx.stroke();
    fctx.fillStyle='#6b3e1e';[[-.45],[.45]].forEach(([d])=>{fctx.beginPath();fctx.arc(ox+cell*d,oy-cell*.2,4,0,Math.PI*2);fctx.fill()});
    fctx.drawImage(im,gx-cell/2,gy-cell/2,cell,cell)}
  for(const k of slacks){const ox=br.left+(k.c+.5)*cell,oy=br.top+(k.r+.5)*cell,e=Math.exp(-k.t*9)*Math.cos(k.t*34),gx=ox+k.px*e,gy=oy+k.py*e;
    fctx.globalAlpha=Math.min(1,(.45-k.t)*6);fctx.lineWidth=3;fctx.strokeStyle='#c98a4a';fctx.beginPath();fctx.moveTo(ox-cell*.45,oy-cell*.2);fctx.lineTo(gx,gy);fctx.lineTo(ox+cell*.45,oy-cell*.2);fctx.stroke();fctx.globalAlpha=1}
  if(proj){fctx.save();proj.trail.forEach(([x,y],i)=>{const f=i/proj.trail.length;fctx.globalAlpha=f*.8;fctx.fillStyle=i%2?'#ffffff':'#7ff5e1';const z=cell*.42*f;fctx.fillRect(x-z/2,y-z/2,z,z)});fctx.restore();
    const z=cell*1.3*(proj.hit?1+Math.sin(proj.hold*40)*.12:1);
    fctx.save();fctx.translate(proj.x,proj.y);fctx.rotate(proj.spin);if(lowFx)fctx.drawImage(im,-z/2,-z/2,z,z);else{const gs=glowSprite(SL,'#7ff5e1',12),gz=z*(1+2*gs.pad/cell);fctx.drawImage(gs,-gz/2,-gz/2,gz,gz)}fctx.restore();
    if(proj.hit){fctx.save();fctx.globalAlpha=Math.min(1,proj.hold*4);fctx.fillStyle='#fff';fctx.beginPath();fctx.arc(proj.x,proj.y,cell*.9,0,Math.PI*2);fctx.fill();fctx.restore()}}
  for(const sl of slashes){if(sl.t<0)continue;const k=Math.min(1,sl.t/.12),fade=Math.max(0,1-(sl.t-.12)/.35);
    const dx=Math.cos(sl.a)*sl.len/2,dy=Math.sin(sl.a)*sl.len/2;fctx.save();fctx.globalAlpha=fade;fctx.lineCap='round';
    const sp=()=>{fctx.beginPath();fctx.moveTo(sl.x-dx,sl.y-dy);fctx.lineTo(sl.x-dx+2*dx*k,sl.y-dy+2*dy*k)};glowStroke(fctx,'#ff2a3a',sl.w+4,sp,.22);
    fctx.strokeStyle='#fff3f3';fctx.lineWidth=sl.w*.4;fctx.beginPath();fctx.moveTo(sl.x-dx,sl.y-dy);fctx.lineTo(sl.x-dx+2*dx*k,sl.y-dy+2*dy*k);fctx.stroke();fctx.restore()}
  for(const p of dust){if(p.delay>0)continue;fctx.globalAlpha=Math.min(1,p.life*2);fctx.fillStyle=p.col;fctx.fillRect(Math.round(p.x-p.s/2),Math.round(p.y-p.s/2),Math.round(p.s),Math.round(p.s))}fctx.globalAlpha=1;
  if(arrow){const ang=Math.atan2(arrow.ty-arrow.sy,arrow.tx-arrow.sx);fctx.save();fctx.translate(arrow.x,arrow.y);fctx.rotate(ang);
    fctx.fillStyle='#6a4a2a';fctx.fillRect(-cell*.9,-1.5,cell*.9,3);fctx.fillStyle='#c9d0d8';fctx.beginPath();fctx.moveTo(4,0);fctx.lineTo(-4,-4);fctx.lineTo(-4,4);fctx.closePath();fctx.fill();
    fctx.fillStyle='#c84a2a';fctx.fillRect(-cell*.9,-4,6,3);fctx.fillRect(-cell*.9,1,6,3);fctx.restore();
    fctx.save();fctx.globalAlpha=.35;fctx.strokeStyle='#ffe8b0';fctx.lineWidth=2;fctx.beginPath();fctx.moveTo(arrow.sx,arrow.sy);fctx.lineTo(arrow.x,arrow.y);fctx.stroke();fctx.restore()}
  for(const r of rings){const k=r.t/.5;fctx.save();fctx.globalAlpha=1-k;fctx.strokeStyle='#ffffff';fctx.lineWidth=6*(1-k)+1;fctx.beginPath();fctx.arc(r.x,r.y,cell*(.4+k*2.4),0,Math.PI*2);fctx.stroke();fctx.restore()}
  for(const p of fxp){fctx.globalAlpha=Math.min(1,p.life*2);fctx.fillStyle=p.col;fctx.fillRect(Math.round(p.x-p.s/2),Math.round(p.y-p.s/2),Math.round(p.s),Math.round(p.s))}fctx.globalAlpha=1
}
function chargeTick(dt){
  if(drag&&drag.special&&!drag.axis&&!drag.cancel&&state==='idle'&&!charge){drag.hold=(drag.hold||0)+dt;if(drag.hold>=HOLD)startCharge()}
  if(state==='charging'){charge.f+=dt/(CHARGE*(1-CHAIN_SPEEDUP*chainN));const lv=burstSize(charge.f);if(lv!==charge.lv){charge.lv=lv;buzz(12)}
    if(charge.f>=charge.T){drag=null;state='fizzle';fz=0;charge.g.dark=true;buzz(120);Sfx.fizzle()}}
  else if(state==='fizzle'){fz+=dt;charge.g.shrink=1-.45*Math.min(1,fz/.45);if(fz>=.55){const ch=charge;charge=null;burstAt(ch.r,ch.c,1,false)}}
  for(const p of parts){p.vy+=9*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}parts=parts.filter(p=>p.life>0);
}
function targets(){
  const tg=grid.map((row,r)=>row.map((g,c)=>[c,r]));
  if(drag&&drag.axis){const{axis,o,i,d}=drag,t=Math.max(0,Math.min(N-1,Math.round(o+d/cell)));
    for(let k=0;k<N;k++){let p=k;if(k===o)p=o+d/cell;else if(o<k&&k<=t)p=k-1;else if(t<=k&&k<o)p=k+1;if(axis==='h')tg[i][k]=[p,i];else tg[k][i]=[i,p]}}
  return tg;
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const tg=targets(),kk=1-Math.exp(-dt*16);let settled=true;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const g=grid[r][c];if(!g)continue;const[tx,ty]=tg[r][c];
    if(drag&&drag.g===g&&drag.axis){g.x=tx;g.y=ty;continue}
    if(state==='falling'&&(ty-g.y>.002||g.vy)){g.vy=Math.min(FALL_MAX,(g.vy||0)+FALL_G*dt);g.y+=g.vy*dt;
      if(g.y>=ty){g.y=ty;const v=g.vy;if(v>2.2){g.vy=-v*FALL_BOUNCE;g.sq=Math.min(.22,v*.018);const b=r+1<N&&grid[r+1][c];if(b){b.jv=(b.jv||0)+v*.06}}else{g.vy=0}}
      settled=false}
    else if(state!=='falling'||g.y>ty)g.y+=(ty-g.y)*kk;
    if(g.jv||g.jy){g.jv=(g.jv||0)+(-220*(g.jy||0)-14*g.jv)*dt;g.jy=(g.jy||0)+g.jv*dt;if(Math.abs(g.jy)<.003&&Math.abs(g.jv)<.05){g.jy=0;g.jv=0}else settled=false}
    if(g.sq){g.sq=Math.max(0,g.sq-dt*1.6);if(g.sq)settled=false}
    g.x+=(tx-g.x)*kk;if(Math.abs(tx-g.x)>.01||Math.abs(ty-g.y)>.01)settled=false;else{g.x=tx;g.y=ty}
    if(g.wig!==undefined){g.wig+=dt;settled=false;if(g.wig>.35)delete g.wig}
    if(g.grow!==undefined||g.forge!==undefined||g.dying!==undefined||g.shrink!==undefined)settled=false;
    if(g.grow!==undefined){g.grow+=dt;if(g.grow>.3)delete g.grow}
    if(g.forge!==undefined){g.forge+=dt;if(g.forge>.9)delete g.forge}
    if(g.dying!==undefined&&state!=='rage')g.dying+=dt;
  }
  if(hl&&(hl.life-=dt)<=0)hl=null;
  chargeTick(dt);Pose.tick(dt,(locked||state==='rage'||state==='enemy'||state==='enemyAnim')&&state!=='over');
  const lk=state==='enemy'||state==='enemyAnim'||state==='lackey'||(phase==='enemy'&&state!=='over');if(lk!==locked){locked=lk;cv.parentNode.classList.toggle('locked',lk)}
  if(state==='popping')for(const row of grid)for(const g of row)if(g&&g.pop&&!g._lit&&g.dying===undefined&&popT>=(g.bAt||0)){g._lit=1;Sfx.match(sfxN++)}
  if(state==='popping')for(const row of grid)for(const g of row)if(g&&g.pop&&!g.burst&&g.dying===undefined&&popT>=burstT(g)){g.burst=true;buzz(6);Sfx.pop(g.t);if(g.blast&&!g.blast.fx){g.blast.fx=1;const br=cv.getBoundingClientRect();rings.push({x:br.left+g.blast.x*cell,y:br.top+g.blast.y*cell,t:0});shake();buzz([30,20,60])}burstCell(g.x,g.y,g.t<TYPES?g.t:0,false,false,g.blast)}
  boxTick(dt);dustTick(dt);for(const f of forges)f.t+=dt;forges=forges.filter(f=>f.t<.95);
  if(state==='rage')rageTick(dt);
  else if(state==='enemyAnim')enemyTick(dt);
  else if(state==='lackey'&&arrow)arrowTick(dt);
  else if(state==='sling'&&proj)slingTick(dt);
  else if(state==='popping'){popT+=dt;if(popT>=popEnd())collapse()}else if(state==='falling'&&settled)step();
  fxTick(dt);
  const busy=boardDirty||!settled||(slingOnBoard()&&slingTugging())||state!=='idle'||drag||charge||hl||floats.length||parts.length||boxParts.length||forges.length||now-lastFull>500;
  if(busy){boardDirty=false;if(now-lastFull>500)lastFull=now;draw()}
  drawFx();drawBackdrop(dt);floats=floats.filter(f=>(f.life-=dt)>0);
  perfWatch(dt,busy&&(state!=='idle'||dust.length>0||fxp.length>0));requestAnimationFrame(frame);
}
/* slingshot "PULL" cue: a small tag on the gem's own top edge (sits in the gap between gems)
   and a tug every few seconds, where the orb dips on two bands and springs back inside its cell */
const TUG_EVERY=3.2,TUG_LEN=.75;
const slingOnBoard=()=>grid&&grid.some(row=>row.some(g=>g&&g.t===SL));
function tugK(){if(state!=='idle'||locked)return 0;const t=(performance.now()/1000)%TUG_EVERY;if(t>TUG_LEN)return 0;
  const d=.22;return t<d?Math.sin(t/d*Math.PI/2):Math.exp(-(t-d)*7)*Math.cos((t-d)*14)}
const slingTugging=()=>tugK()!==0||(performance.now()/1000)%TUG_EVERY<TUG_LEN+.05;
function slingBands(g,k){if(k<=0)return;const x0=g.x*cell,y0=(g.y+(g.jy||0))*cell,cy=y0+cell*(.5+.09*k);ctx.save();ctx.globalAlpha=Math.min(1,k*1.6);
  ctx.strokeStyle='#c98a4a';ctx.lineWidth=Math.max(1.5,cell*.045);ctx.beginPath();ctx.moveTo(x0+cell*.1,y0+cell*.14);ctx.lineTo(x0+cell*.3,cy);ctx.moveTo(x0+cell*.9,y0+cell*.14);ctx.lineTo(x0+cell*.7,cy);ctx.stroke();
  ctx.fillStyle='#6b3e1e';const pr=Math.max(1.5,cell*.045);for(const px of[.1,.9]){ctx.beginPath();ctx.arc(x0+cell*px,y0+cell*.14,pr,0,7);ctx.fill()}ctx.restore()}
function pullTag(g,k){const fs=Math.max(7,Math.round(cell*.16)),cx=(g.x+.5)*cell;let y=(g.y+(g.jy||0))*cell+cell*.02+Math.max(0,k)*cell*.03;
  ctx.save();ctx.font='400 '+fs+'px Marcellus,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const w=ctx.measureText('PULL').width+fs*.8,h=fs*1.15;y=Math.max(h/2+1,y);ctx.globalAlpha=state==='idle'&&!locked?1:.45;
  ctx.fillStyle='#2a0d22';ctx.fillRect(Math.round(cx-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));
  ctx.strokeStyle='#d4af37';ctx.lineWidth=1;ctx.strokeRect(Math.round(cx-w/2)+.5,Math.round(y-h/2)+.5,Math.round(w)-1,Math.round(h)-1);
  ctx.fillStyle='#ffd166';ctx.fillText('PULL',cx,y+.5);ctx.restore()}
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,size,size);
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){ctx.fillStyle=(r+c)%2?'#1a141d':'#221a26';ctx.fillRect(c*cell,r*cell,cell+.5,cell+.5)}
  if(drag&&drag.axis){ctx.fillStyle=drag.enemy?'rgba(255,77,94,.3)':'rgba(255,95,162,.16)';drag.axis==='h'?ctx.fillRect(drag.lo*cell,drag.i*cell,(drag.hi-drag.lo+1)*cell,cell):ctx.fillRect(drag.i*cell,drag.lo*cell,cell,(drag.hi-drag.lo+1)*cell)}
  if(hl){ctx.fillStyle='rgba(255,77,94,'+Math.min(.35,hl.life*.5)+')';hl.axis==='h'?ctx.fillRect(0,hl.i*cell,size,cell):ctx.fillRect(hl.i*cell,0,cell,size)}
  if(charge&&state==='charging'){const rad=burstSize(charge.f);ctx.fillStyle='rgba(255,209,102,.2)';
    for(let r=Math.max(0,charge.r-rad);r<=Math.min(N-1,charge.r+rad);r++)ctx.fillRect(charge.c*cell+1,r*cell+1,cell-2,cell-2)}
  // picked-up gem highlight
  if(drag&&!drag.enemy&&!drag.cancel&&!drag.sling&&state==='idle'){const g=drag.g;ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(drag.c*cell,drag.r*cell,cell,cell);
    ctx.save();glowStroke(ctx,'#fff',2.5,()=>{ctx.beginPath();ctx.rect(g.x*cell+2,g.y*cell+2,cell-4,cell-4)});ctx.restore()}
  // live match preview while dragging
  preview=null;
  if(drag&&drag.axis&&!drag.enemy){const t=Math.max(drag.lo,Math.min(drag.hi,Math.round(drag.o+drag.d/cell)));
    if(t!==drag.o){const T=types();setLine(T,drag.axis,drag.i,slide(lineOf(T,drag.axis,drag.i),drag.o,t));const m=matchesIn(T,'p');
      if(m.hit.size){const gold=new Set();m.big.forEach(a=>a.forEach(k=>gold.add(k)));preview={hit:m.hit,gold};
        ctx.save();m.hit.forEach(k=>{const r=Math.floor(k/N),c=k%N,gd=gold.has(k);ctx.fillStyle=gd?'rgba(255,209,102,.35)':'rgba(255,255,255,.22)';ctx.fillRect(c*cell+1,r*cell+1,cell-2,cell-2);
          glowStroke(ctx,gd?'#ffd166':'#fff',2.5,()=>{ctx.beginPath();ctx.rect(c*cell+3,r*cell+3,cell-6,cell-6)},.18)});ctx.restore()}}}
  for(const p of boxParts){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.col;const z=Math.max(2,Math.round(p.s*cell));ctx.fillRect(Math.round(p.x*cell-z/2),Math.round(p.y*cell-z/2),z,z)}ctx.globalAlpha=1;
  let top=null;const tug=tugK(),slings=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){const g=grid[r][c];if(!g)continue;if(drag&&drag.g===g&&drag.axis){top=g;continue}if(drag&&drag.sling&&drag.g===g)continue;
    if(g.pop&&state==='popping'&&!g.burst&&lt(g)>=0){const l=lt(g),fl=Math.max(0,1-l/.12),a=.55+.45*fl,cx=(g.x+.5)*cell,cy=(g.y+.5)*cell;ctx.save();
      // soft round halo in the gem's colour, fading to nothing (no hard edges)
      const gc=g.t<TYPES?COLORS[g.t][0]:'#fff6d5';
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85*a;ctx.drawImage(halo(gc),cx-cell*.6,cy-cell*.6,cell*1.2,cell*1.2);
      // a light rim that follows the gem's own outline
      const im=sprites[g.t];if(im&&!lowFx){const z=cell*(1.1+.06*fl);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4+.45*fl;ctx.drawImage(im,cx-z/2,cy-z/2,z,z)}
      ctx.restore()}
    if(state==='select'&&g.t<TYPES&&!g.pop){const cx=(g.x+.5)*cell,cy=(g.y+.5)*cell,k=.5+.5*Math.sin(performance.now()/180+(g.x+g.y)*.6);ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=.3+.2*k;ctx.drawImage(halo('#ff9ad5'),cx-cell*.55,cy-cell*.55,cell*1.1,cell*1.1);ctx.restore()}
    let s=1;if(g.dying!==undefined)s=Math.max(0,1-g.dying/.15);else if(g.pop&&state==='popping')s=g.burst?0:lt(g)<0?1:1.06+.4*Math.max(0,Math.min(1,(popT-burstT(g)+SWELL*pk())/(SWELL*pk())));else if(g.forge!==undefined){const k=(g.forge-.32)/.38;s=k<0?0:k<1?(1-Math.pow(1-k,3))*1.25-.25*Math.max(0,k-.6)/.4*1:1}else if(g.grow!==undefined)s=1+Math.sin(g.grow/.3*Math.PI)*.35;
    if(drag&&!drag.enemy&&drag.g===g&&!drag.axis&&state==='idle')s*=1.18;
    if(g.shrink!==undefined)s*=g.shrink;else if(charge&&charge.g===g&&state==='charging')s*=1+Math.sin(charge.f*40)*.05+charge.f*.15;
    if(g.t===SL&&s===1&&!g.dark){slingBands(g,tug);slings.push(g)}
    if(s>0){const q=g.sq||0,w=cell*s*(1+q*.6),h=cell*s*(1-q),yy=(g.y+(g.jy||0)+(g.t===SL&&s===1?tug*.09:0))*cell;const wx=g.wig!==undefined?Math.sin(g.wig*50)*(1-g.wig/.35)*cell*.07:0;ctx.drawImage((g.dark?darkSprites:sprites)[g.t],g.x*cell+(cell-w)/2+wx,yy+cell-h-(cell-cell*s)/2,w,h)}}
  if(charge){const R1=VR*cell,m=.8*R1+6;
    const cx=Math.min(size-m,Math.max(m,(charge.c+.5)*cell)),cy=Math.min(size-m,Math.max(m,(charge.r+.5)*cell));
    const inZone=state==='charging'&&charge.f>=charge.T-PERFECT;
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,charge.T*R1,0,Math.PI*2);ctx.arc(cx,cy,(charge.T-PERFECT)*R1,0,Math.PI*2,true);
    ctx.fillStyle=inZone?'rgba(120,255,160,.7)':'rgba(95,220,122,.38)';ctx.fill();
    ctx.setLineDash([6,5]);ctx.lineWidth=2.5;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(cx,cy,charge.T*R1,0,Math.PI*2);ctx.stroke();ctx.restore();
    if(state==='charging'){ctx.save();const rr=Math.max(4,charge.f*R1),rp=()=>{ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2)};if(!lowFx){ctx.globalAlpha=inZone?.35:.25;ctx.strokeStyle=inZone?'#b8ffd0':'#ffd166';ctx.lineWidth=inZone?16:12;rp();ctx.stroke();ctx.globalAlpha=1}ctx.lineWidth=5;ctx.strokeStyle=inZone?'#ffffff':'#ffd166';rp();ctx.stroke();ctx.restore()}}
  for(const f of forges){const cx=(f.x+.5)*cell,cy=(f.y+.5)*cell,col=f.sl?['#bffff4','#3fd6c0']:['#fff3c4','#ffd166'];ctx.save();
    if(f.t<.32){const k=f.t/.32,e=k*k;for(const p of f.src){const px=((p.x+.5)+(f.x-p.x)*e)*cell,py=((p.y+.5)+(f.y-p.y)*e)*cell;
        if(!lowFx){ctx.globalAlpha=.6;ctx.drawImage(halo(col[1]),px-cell*.4,py-cell*.4,cell*.8,cell*.8)}ctx.globalAlpha=1;ctx.fillStyle=col[1];ctx.beginPath();ctx.arc(px,py,cell*(.22-.1*k),0,7);ctx.fill();
        ctx.strokeStyle=col[0];ctx.lineWidth=2;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(((p.x+.5)+(f.x-p.x)*Math.max(0,e-.25))*cell,((p.y+.5)+(f.y-p.y)*Math.max(0,e-.25))*cell);ctx.stroke()}}
    else{const k=(f.t-.32)/.63;ctx.globalAlpha=Math.max(0,1-k);if(!lowFx){const hz=cell*(1.2*(1-k)+.5);ctx.drawImage(halo(col[1]),cx-hz/2,cy-hz/2,hz,hz)}
      ctx.fillStyle=col[0];ctx.beginPath();ctx.arc(cx,cy,cell*(.55*(1-k)+.1),0,7);ctx.fill();
      ctx.strokeStyle=col[1];ctx.lineWidth=4*(1-k)+1;ctx.beginPath();ctx.arc(cx,cy,cell*(.3+k*1.3),0,7);ctx.stroke();
      ctx.translate(cx,cy);ctx.rotate(k*1.2);ctx.fillStyle=col[0];for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(cell*(.35+k*.5),-1.5,cell*.35*(1-k),3)}}
    ctx.restore()}
  for(const g of slings)pullTag(g,tug);
  if(top){const s=1.15;ctx.drawImage(sprites[top.t],top.x*cell-cell*(s-1)/2,top.y*cell-cell*(s-1)/2,cell*s,cell*s)}
  for(const p of parts){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.col;const z=p.s*cell;ctx.fillRect(Math.round(p.x*cell-z/2),Math.round(p.y*cell-z/2),Math.round(z),Math.round(z))}ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.font='400 '+Math.round(cell*.36)+'px Marcellus,system-ui,sans-serif';
  for(const f of floats){const y=Math.max(cell*.4,(f.y-(1-f.life)*.8)*cell),hw=ctx.measureText(f.s).width/2+4,fx=Math.min(size-hw,Math.max(hw,f.x*cell));ctx.globalAlpha=Math.min(1,f.life*2);ctx.lineWidth=5;ctx.strokeStyle='#2a0d22';ctx.strokeText(f.s,fx,y);ctx.fillStyle='#ffd166';ctx.fillText(f.s,fx,y);ctx.globalAlpha=1}
}

/* ---------- input ---------- */
function pos(e){const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointerdown',e=>{
  if(locked){Sfx.clunk(true);nudge(cv.parentNode);buzz(20);return}
  if(state==='select'){const[x,y]=pos(e),c=Math.floor(x/cell),r=Math.floor(y/cell);if(c<0||r<0||c>=N||r>=N)return;const g=grid[r][c];if(!g||g.t>=TYPES){if(g)g.wig=0;Sfx.clunk();buzz(15);return}starPick(g.t,r,c);return}
  if(state!=='idle'||drag)return;const[x,y]=pos(e),c=Math.floor(x/cell),r=Math.floor(y/cell);if(c<0||r<0||c>=N||r>=N)return;
  drag={r,c,sx:x,sy:y,axis:null,d:0,g:grid[r][c],id:e.pointerId,special:grid[r][c].t===SP,sling:grid[r][c].t===SL,px:0,py:0};if(drag.sling)setTarget(true);cv.setPointerCapture(e.pointerId);buzz(8);
});
cv.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id||drag.cancel||charge)return;const[x,y]=pos(e),dx=x-drag.sx,dy=y-drag.sy;
  if(drag.sling){const L=Math.hypot(dx,dy),m=cell*2.2,k=L>m?m/L:1;drag.px=dx*k;drag.py=dy*k;return}
  if(!drag.axis){if(Math.hypot(dx,dy)<8)return;drag.axis=Math.abs(dx)>Math.abs(dy)?'h':'v';drag.o=drag.axis==='h'?drag.c:drag.r;drag.i=drag.axis==='h'?drag.r:drag.c;if(drag.special&&drag.axis==='v'){drag.cancel=true;drag.axis=null;return}[drag.lo,drag.hi]=span(lineOf(grid,drag.axis,drag.i),drag.o,drag.axis)}
  const d=drag.axis==='h'?dx:dy;drag.d=Math.max((drag.lo-drag.o)*cell,Math.min((drag.hi-drag.o)*cell,d));
});
function release(e){
  if(state==='charging'&&charge){drag=null;const ch=charge;charge=null;burstAt(ch.r,ch.c,burstSize(ch.f),true,ch.f>=ch.T-PERFECT);return}
  if(!drag||e.pointerId!==drag.id)return;const D=drag;drag=null;
  if(D.sling){setTarget(false);if(slingOk(D)&&state==='idle')fireSling(D);else slack(D);return}
  if(D.special&&!D.axis){const[x,y]=pos(e);if(!D.cancel&&(D.hold||0)<HOLD&&Math.hypot(x-D.sx,y-D.sy)<cell*.6&&state==='idle')burstAt(D.r,D.c,1,'tap');return}
  if(!D.axis)return;const t=Math.max(0,Math.min(N-1,Math.round(D.o+D.d/cell)));if(t===D.o)return;
  setLine(grid,D.axis,D.i,slide(lineOf(grid,D.axis,D.i),D.o,t));
  if(matchesIn(types(),'p').hit.size){clearLog();chainN=0;firstStep=true;lastMoved=D.g;pendingTurn=true;phase='player';combo=0;state='falling'}
  else{setLine(grid,D.axis,D.i,slide(lineOf(grid,D.axis,D.i),t,D.o));buzz(8)}
}
cv.addEventListener('pointerup',release);cv.addEventListener('pointercancel',e=>{if(drag&&drag.sling&&e.pointerId===drag.id&&!slingOk(drag)){setTarget(false);slack(drag);drag=null;return}release(e)});cv.addEventListener('lostpointercapture',e=>{if(drag&&e.pointerId===drag.id)release(e)});

icons=[0,1,2,3,4,5].map(t=>gemCanvas(t,64).toDataURL());
$('pwIcon').src=icons[RED];
$('gauges').innerHTML=ATK.map(t=>`<button class="g" aria-label="${GEMS[t].n} gauge"><img src="${icons[t]}" alt=""><div class="bar"><i></i></div></button>`).join('');
$('gauges').querySelectorAll('.g').forEach((b,j)=>b.addEventListener('click',()=>{const t=ATK[j],G=GEMS[t];
    if(t===STAR&&state==='select'){gauge[t]=shown[t]=G.cap;state='idle';renderGauges();return}
    if(!(ready(t)&&state==='idle'&&!locked)){nudge(b);Sfx.clunk(locked);buzz(15);return}  // not yet: the bucket shakes and clunks
    gauge[t]=shown[t]=0;gq[t]=[];if(t===STAR)startSelect();else fire(t);
    // bucket bonuses fly to where they land instead of being described
    if(t===4){ammo++;const a=$('ammoTag'),was=!a.hidden;renderMe();if(!was)a.classList.add('due');flyIcon(b,a,icons[4],1,()=>a.classList.remove('due'))}
    if(t===1){ward=1;const w=$('wardTag');renderMe();w.classList.add('due');flyIcon(b,w,icons[1],1,()=>w.classList.remove('due'))}
    if(t===3){money+=15;try{localStorage.setItem('gemslide-gold',money)}catch(e){}flyIcon(b,$('money').parentNode,icons[3],5,hud)}
    const hl=Math.min(Math.round(roundMax*.2),MAXHP-hp);if(hl>0){hp+=hl;flyIcon(b,$('vbMe'),icons[GREEN],3,renderMe)}
    renderGauges();if(foeHp<=0)win();else if(rageQueued){rageQueued=false;startRage()}}));
const ro=new ResizeObserver(resize);ro.observe(cv);resize();sizeFx();battle();requestAnimationFrame(frame);
