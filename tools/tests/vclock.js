(()=>{let now=0;const timers=[];let rafs=[];let tid=1;
window.__vnow=()=>now;
performance.now=()=>now;
window.requestAnimationFrame=f=>{rafs.push(f);return 1};
window.setTimeout=(f,ms)=>{const id=tid++;timers.push({id,t:now+(ms||0),f});return id};
window.clearTimeout=id=>{const i=timers.findIndex(x=>x.id===id);if(i>=0)timers.splice(i,1)};
window.__tick=(n)=>{for(let k=0;k<n;k++){now+=16;timers.sort((a,b)=>a.t-b.t);while(timers.length&&timers[0].t<=now){const x=timers.shift();try{x.f()}catch(e){window.__err=(window.__err||'')+e.stack+'\n'}}
  const r=rafs;rafs=[];for(const f of r){try{f(now)}catch(e){window.__err=(window.__err||'')+e.stack+'\n'}}}};
})();
