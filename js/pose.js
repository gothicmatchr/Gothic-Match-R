// Enemy body animation: articulated arms (shoulder + elbow joints) driven by a small pose
// animator. On the enemy's turn the enemy eases into a threatening guard with the short
// sword raised; strikes flow from wherever the arms currently are, then settle back.
const Pose=(()=>{
  const RIG={w:240,h:330,ox:-20,oy:-40,tr:1};               // canvas frame for rig parts (body coords)
  const J={rS:[150,108],rE:[157,146],lS:[50,108],lE:[43,146]}; // joints
  const pct=(x,y)=>((x-RIG.ox)/RIG.w*100)+'% '+((y-RIG.oy)/RIG.h*100)+'%';
  const REST0={rU:0,rF:0,lU:0,lF:0,lean:0,ty:0,sc:1};let REST={...REST0};
  const THREAT={rU:-118,rF:-70,lU:58,lF:118,lean:-2,ty:-2,sc:1.03};
  let el={},cur={...REST},strike=null,queue=[],t=0,face=null,on=false,settled=false;

  function build(fig,L){
    const box=(cls,origin)=>{const d=document.createElement('div');d.className='rig '+cls;d.style.transformOrigin=origin;return d};
    const cnv=items=>{const c=raster(items,true,RIG);c.className='rigc';return c};
    // left (off-hand) arm, then right (sword) arm on top
    const lU=box('lU',pct(...J.lS)),lF=box('lF',pct(...J.lE));lU.appendChild(cnv(L.rig.lU));lF.appendChild(cnv(L.rig.lF));lU.appendChild(lF);
    const rU=box('rU',pct(...J.rS)),rF=box('rF',pct(...J.rE));rU.appendChild(cnv(L.rig.rU));rF.appendChild(cnv(L.rig.rF));rU.appendChild(rF);
    el={lU,lF,rU,rF,foe:document.getElementById('foe')};
    cur={...REST};strike=null;queue=[];settled=false;apply();
    return{lU,rU};
  }
  function setFace(fa){face=fa}
  const ease={lin:k=>k,in:k=>k*k*k,out:k=>1-Math.pow(1-k,3),io:k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2};
  // Strike keyframes, relative timing in seconds. 'from' = pose when the strike began.
  const STRIKE=[
    {t:.20,e:'out',p:{rU:-150,rF:-62,lU:66,lF:126,lean:-4,ty:-4,sc:1.02}},   // wind-up: draw the blade further back
    {t:.36,e:'in', p:{rU:-296,rF:14,lU:70,lF:40,lean:4,ty:9,sc:1.12}, hit:1},    // the cut: overhead, then down across the body at the player
    {t:.52,e:'out',p:{rU:-306,rF:22,lU:74,lF:36,lean:5,ty:11,sc:1.13}},          // follow-through
  ];
  const RECOVER=.45;
  const keys=['rU','rF','lU','lF','lean','ty','sc'];
  function startStrike(cb){strike={t:0,from:{...cur},cb,fired:false}}
  function doStrike(cb){if(strike)queue.push(cb);else startStrike(cb)}
  function base(threat){return threat?THREAT:REST}
  function tick(dt,threat){
    t+=dt;on=threat;
    if(!el.rU)return;
    if(strike){strike.t+=dt;const s=strike,T=s.t;let prevT=0,prev=s.from,done=true;
      for(const k of STRIKE){if(T<k.t){const kk=ease[k.e]((T-prevT)/(k.t-prevT));for(const q of keys)cur[q]=prev[q]+(k.p[q]-prev[q])*kk;done=false;break}
        if(k.hit&&!s.fired){s.fired=true;try{s.cb&&s.cb()}catch(e){}}prevT=k.t;prev=k.p}
      if(done){const last=STRIKE[STRIKE.length-1],k=Math.min(1,(T-last.t)/RECOVER),kk=ease.io(k),b=live(threat);
        b.rU-=360;  // keep circling the same way: down and back up the sword side, never back across the face
        for(const q of keys)cur[q]=last.p[q]+(b[q]-last.p[q])*kk;
        if(k>=1){cur.rU+=360;strike=null;if(queue.length)startStrike(queue.shift())}}
      settled=false;apply();return}
    if(queue.length){startStrike(queue.shift());return}
    const b=live(threat);let moving=false;const a=1-Math.exp(-dt*7);
    for(const q of keys){const d=b[q]-cur[q];if(Math.abs(d)>.02){cur[q]+=d*a;moving=true}else cur[q]=b[q]}
    if(moving||threat||!settled){apply();settled=!moving&&!threat}
  }
  function live(threat){const b={...base(threat)};
    if(threat){b.rU+=Math.sin(t*2.6)*3;b.rF+=Math.sin(t*2.6+1)*4;b.lF+=Math.sin(t*3.1)*3;b.ty+=Math.sin(t*2.2)*1.2}  // menacing sway, blade trembling
    return b}
  function apply(){
    el.rU.style.transform=`rotate(${cur.rU.toFixed(2)}deg)`;el.rF.style.transform=`rotate(${cur.rF.toFixed(2)}deg)`;
    el.lU.style.transform=`rotate(${cur.lU.toFixed(2)}deg)`;el.lF.style.transform=`rotate(${cur.lF.toFixed(2)}deg)`;
    el.foe.style.transform=(cur.lean||cur.ty||cur.sc!==1)?`translateY(${cur.ty.toFixed(2)}px) rotate(${cur.lean.toFixed(2)}deg) scale(${cur.sc.toFixed(3)})`:'';
    el.foe.classList.toggle('threat',on||!!strike)}
  // per-enemy idle stance (e.g. Varro keeps his sword raised in a guard so it's always in view)
  function setRest(p){REST={...REST0,...(p||{})};cur={...REST};settled=false;if(el.rU)apply()}
  function reset(){strike=null;queue=[];cur={...REST};if(el.rU)apply()}
  return{build,setFace,tick,strike:doStrike,reset,setRest,get busy(){return !!strike||queue.length>0},get cur(){return cur}};
})();
