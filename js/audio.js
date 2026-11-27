// Audio: gothic lofi breakcore. Music streams (light on memory for 4GB phones);
// short effects are decoded once into Web Audio buffers.
// Everything starts after the first tap and stops when the game is hidden.
// The ♪ button opens a panel with Music and Effects volume sliders (remembered).
const Vol=(()=>{let bgm=.8,sfx=.8;
  try{const v=JSON.parse(localStorage.getItem('gemslide-vol')||'null');
    if(v){bgm=+v.bgm;sfx=+v.sfx}else if(localStorage.getItem('gemslide-music')==='off'){bgm=0;sfx=0}}catch(e){}
  const save=()=>{try{localStorage.setItem('gemslide-vol',JSON.stringify({bgm,sfx}))}catch(e){}};
  return{get bgm(){return bgm},get sfx(){return sfx},set bgm(v){bgm=v;save()},set sfx(v){sfx=v;save()}};
})();
let audioUnlocked=false;

const Music=(()=>{
  const mk=src=>{const a=new Audio(src);a.loop=true;a.preload='auto';a.volume=0;return a};
  const calm=mk('audio/battle_theme.ogg'),rageEl=mk('audio/battle_theme_rage.ogg');
  const VOL=.42,FADE=2.5;
  let cur=calm,mixT=0,fading=null,raging=false;  // mixT: 0 = calm, 1 = rage
  const on=()=>Vol.bgm>0&&audioUnlocked&&!document.hidden;
  function apply(){const v=VOL*Vol.bgm;calm.volume=v*(1-mixT);rageEl.volume=v*mixT}
  function play(){if(!on()){if(Vol.bgm<=0)stop();return}
    for(const a of (mixT>0&&mixT<1)?[calm,rageEl]:[cur]){const p=a.play();if(p&&p.catch)p.catch(()=>{})}apply()}
  function stop(){calm.pause();rageEl.pause()}
  function setRage(r){if(r===raging)return;raging=r;
    const from=r?calm:rageEl,to=r?rageEl:calm;
    // Same song, same length: start the other version at the same moment, then crossfade.
    try{to.currentTime=from.currentTime}catch(e){}
    cur=to;if(!on()){mixT=r?1:0;return}
    const p=to.play();if(p&&p.then)p.then(()=>{try{if(Math.abs(to.currentTime-from.currentTime)>.08)to.currentTime=from.currentTime}catch(e){}}).catch(()=>{});
    const start=performance.now(),m0=mixT,m1=r?1:0;clearInterval(fading);
    fading=setInterval(()=>{const k=Math.min(1,(performance.now()-start)/(FADE*1000));mixT=m0+(m1-m0)*k;apply();
      if(k>=1){clearInterval(fading);fading=null;from.pause()}},50)}
  // Follow the game's rage flag (declared in game.js, shared global scope).
  setInterval(()=>{let r=false;try{r=!!rage&&state!=='over'}catch(e){}setRage(r)},300);
  return{play,stop,apply,setRage,get playing(){return !cur.paused},get time(){return cur.currentTime},get rage(){return raging},get mix(){return mixT}};
})();

const Sfx=(()=>{
  const FILES={match:.35,pop:.4,forge:.5,gold:.6,gold_perfect:.7,fizzle:.45,sling:.5,bucket:.65,clunk:.55,snap:.5,spill:.35,hit:.8}; // name: volume
  // D harmonic minor, in semitones from D: each gem in a match chain rings one step higher
  const SCALE=[0,2,3,5,7,8,11,12,14,15,17,19,20,23,24,26,27];
  let ctx=null,master=null;const buf={},last={};let voices=0;
  function load(name){const x=new XMLHttpRequest();x.open('GET','audio/sfx/'+name+'.ogg');x.responseType='arraybuffer';
    x.onload=()=>{if(x.response)ctx.decodeAudioData(x.response,b=>buf[name]=b,()=>{})};x.send()}
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    ctx=new AC();master=ctx.createGain();master.gain.value=Vol.sfx;master.connect(ctx.destination);Object.keys(FILES).forEach(load)}
  function setVol(v){if(master)master.gain.value=v}
  function play(name,rate=1,vol=1,gap=0){
    if(Vol.sfx<=0||!ctx||document.hidden||!buf[name])return;
    const now=performance.now();if(gap&&last[name]&&now-last[name]<gap)return;if(voices>=12)return;last[name]=now;
    if(ctx.state==='suspended')ctx.resume();
    const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=buf[name];s.playbackRate.value=rate;g.gain.value=FILES[name]*vol;
    s.connect(g);g.connect(master);voices++;s.onended=()=>{voices--;g.disconnect()};s.start()}
  const st=i=>Math.pow(2,SCALE[Math.min(i,SCALE.length-1)]/12);
  return{init,setVol,play,get ctx(){return ctx},get loaded(){return Object.keys(buf).length},
    match:i=>play('match',st(i),1,0),
    pop:(t,low)=>play('pop',(low?.75:1)*Math.pow(2,[0,3,7,5,10,12][t%6]/12)*(.97+Math.random()*.06),.9,22),
    forge:()=>play('forge'),
    gold:(perfect,link)=>play(perfect?'gold_perfect':'gold',Math.pow(2,[0,3,5,7,10][Math.min(link||0,4)]/12)),
    fizzle:()=>play('fizzle'),
    sling:()=>play('sling'),
    bucket:()=>play('bucket',1,1,120),
    clunk:low=>play('clunk',low?.8:1,1,90),  // "not yet": lower for the locked board
    snap:()=>play('snap',1,1,120),
    hit:big=>play('hit',big?.82:1+Math.random()*.06,big?1.15:.9,60),
    spill:()=>play('spill',.95+Math.random()*.1,1,70),
    suspend(){if(ctx&&ctx.state==='running')ctx.suspend()},resume(){if(ctx)ctx.resume()}};
})();

(()=>{
  const btn=document.getElementById('musicBtn'),panel=document.getElementById('volPanel');
  const bgmIn=document.getElementById('volBgm'),sfxIn=document.getElementById('volSfx');
  function show(){if(!btn)return;btn.classList.toggle('off',Vol.bgm<=0&&Vol.sfx<=0);
    if(bgmIn){bgmIn.value=Math.round(Vol.bgm*100);bgmIn.nextElementSibling.textContent=bgmIn.value}
    if(sfxIn){sfxIn.value=Math.round(Vol.sfx*100);sfxIn.nextElementSibling.textContent=sfxIn.value}}
  // Phones only allow sound after a completed tap (touch end / click), not on touch start,
  // so try on every kind of tap until playback has actually started.
  const EV=['pointerdown','pointerup','touchend','click','keydown'];
  function unlock(){audioUnlocked=true;Sfx.init();Sfx.resume();Music.play();
    setTimeout(()=>{const ok=(Vol.bgm<=0||Music.playing)&&(!Sfx.ctx||Sfx.ctx.state==='running');if(ok)EV.forEach(t=>document.removeEventListener(t,unlock,true))},150)}
  EV.forEach(t=>document.addEventListener(t,unlock,true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){Music.stop();Sfx.suspend()}else{Music.play();Sfx.resume()}});
  window.addEventListener('pagehide',()=>{Music.stop();Sfx.suspend()});
  const open=o=>{if(!panel)return;panel.hidden=!o;btn.setAttribute('aria-expanded',o?'true':'false')};
  if(btn)btn.addEventListener('click',e=>{e.stopPropagation();unlock();open(panel.hidden)});
  document.addEventListener('pointerdown',e=>{if(panel&&!panel.hidden&&!panel.contains(e.target)&&e.target!==btn)open(false)});
  const close=document.getElementById('volClose');if(close)close.addEventListener('click',()=>open(false));
  if(bgmIn)bgmIn.addEventListener('input',()=>{Vol.bgm=bgmIn.value/100;Music.apply();Music.play();show()});
  if(sfxIn){sfxIn.addEventListener('input',()=>{Vol.sfx=sfxIn.value/100;Sfx.setVol(Vol.sfx);show()});
    sfxIn.addEventListener('change',()=>Sfx.match(4))}  // preview the effects level when the slider is let go
  show();
})();
