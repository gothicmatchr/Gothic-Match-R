// Injected after js/game.js by perf.py (classic script: shares the game's global scope).
// Records frame timestamps in window.__ft; __busy() keeps the board and effects busy for a few seconds.
if(location.hash==="#low")addEventListener("load",()=>setLowFx());window.__ft=[];(function rec(t){window.__ft.push(t);requestAnimationFrame(rec)})(performance.now());
window.__busy=function(ms){ms=ms||3000;const end=performance.now()+ms;
  (function tick(){if(performance.now()>end)return;
    if(state==='idle'&&!locked){const moves=[];
      for(const axis of['h','v'])for(let i=0;i<N;i++)for(let o=0;o<N;o++){const L=lineOf(types(),axis,i);if(L[o]>=SP)continue;const[lo,hi]=span(L,o,axis);
        for(let t=lo;t<=hi;t++){if(t===o)continue;const T=types();setLine(T,axis,i,slide(lineOf(T,axis,i),o,t));if(matchesIn(T,'p').hit.size)moves.push([axis,i,o,t])}}
      if(moves.length){const[axis,i,o,t]=moves[Math.floor(Math.random()*moves.length)];setLine(grid,axis,i,slide(lineOf(grid,axis,i),o,t));clearLog();chainN=0;firstStep=true;pendingTurn=true;phase='player';combo=0;state='falling'}}
    for(let k=0;k<6;k++)burstCell(Math.floor(Math.random()*N),Math.floor(Math.random()*N),1+Math.floor(Math.random()*5),false,false,k===0?{x:3.5,y:3.5}:null);
    const br=cv.getBoundingClientRect();burstFx(br.left+br.width/2,br.top-40,['#ffffff','#7ff5e1','#ffd166'],46,cell*9);rings.push({x:br.left+br.width/2,y:br.top-40,t:0});
    slashes.push({x:br.left+br.width*.5,y:br.top+br.height*.3,a:-.7,len:br.width*.6,t:0,w:9});
    forges.push({x:3,y:3,t:0,sl:false,src:[{x:1,y:3},{x:2,y:3},{x:4,y:3},{x:5,y:3}]});
    setTimeout(tick,450)})()};
