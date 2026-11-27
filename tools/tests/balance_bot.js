// Injected after js/game.js by balance.js (shares the game's global scope). A reasonable greedy player.
// Tracks per-battle stats in window.__bal.
window.__bal={pt:0,et:0,falls:0,minHp:100,taken:0,foeHeal:0,maxHit:0,hits:[]};
(()=>{const _hurt=hurtMe;hurtMe=function(d,label,back){const h0=hp;_hurt(d,label,back);const lost=h0-hp;if(lost>0&&!back){__bal.taken+=lost;__bal.hits.push(lost);__bal.maxHit=Math.max(__bal.maxHit,lost)}if(lost>0&&back)__bal.taken+=lost;__bal.minHp=Math.min(__bal.minHp,hp)};
  const _after=afterTurn;afterTurn=function(){if(hp<=0&&piece()>0)__bal.falls++;return _after()};
  {const _rl=runLackey;runLackey=function(){__bal.fam=(__bal.fam||0)+1;return _rl()}}
  if(typeof runFamiliar==='function'){const _rf=runFamiliar;runFamiliar=function(){__bal.fam=(__bal.fam||0)+1;return _rf()}}
  const _em=enemyMove;enemyMove=function(){__bal.et++;return _em()};
  const _res=resolve;resolve=function(gs,b,x,y,isM,m,hg){const f0=foeHp;const r=_res(gs,b,x,y,isM,m,hg);if(foeHp>f0)__bal.foeHeal+=foeHp-f0;return r}})();
window.__botAct=function(){
  if(state!=='idle'||locked)return 'wait';
  for(const t of ATK)if(ready(t)){$('gauges').children[ATK.indexOf(t)].click();if(state==='select'){const g=grid[3][3];starPick(g.t<TYPES?g.t:1,3,3)}return 'gauge'}
  const sl=[],sp=[],cr=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(grid[r][c].t===CR)cr.push([r,c]);if(grid[r][c].t===SL)sl.push([r,c]);if(grid[r][c].t===SP)sp.push([r,c])}
  if(sl.length){const[r,c]=sl[0];fireSling({r,c,g:grid[r][c],px:0,py:cell*1.5});return 'sling'}
  if(cr.length){const[r,c]=cr[0];__bal.pt++;__bal.crush=(__bal.crush||0)+1;crushAt({r,c},Math.random()<.6?'perfect':'weak');return 'crush'}
  if(sp.length&&Math.random()<.6){const[r,c]=sp[0];const perfect=Math.random()<.6,f=perfect?charge0():.5;__bal.pt++;burstAt(r,c,burstSize(f),true,perfect);return 'force'}
  let best=null,bv=-1e9;
  for(const axis of['h','v'])for(let i=0;i<N;i++)for(let o=0;o<N;o++){const L=lineOf(types(),axis,i);if(L[o]>=SP)continue;const[lo,hi]=span(L,o,axis);
    for(let t=lo;t<=hi;t++){if(t===o)continue;const T=types();setLine(T,axis,i,slide(lineOf(T,axis,i),o,t));const m=matchesIn(T,'p');if(!m.hit.size)continue;
      let v=0;m.hit.forEach(k=>{const g=T[Math.floor(k/N)][k%N];v+=g===RED?-4:g===GREEN?(hp<70?3:.5):g===COIN?1:3});
      v+=m.big.length*7+Math.random();if(v>bv){bv=v;best=[axis,i,o,t]}}}
  if(!best)return 'nomove';const[axis,i,o,t]=best;__bal.pt++;
  setLine(grid,axis,i,slide(lineOf(grid,axis,i),o,t));clearLog();chainN=0;firstStep=true;lastMoved=grid[axis==='h'?i:t][axis==='h'?t:i];pendingTurn=true;phase='player';combo=0;state='falling';return 'move'};
function charge0(){return 1-PERFECT/2} // centre of the perfect band (band sits at the end of the ring)
