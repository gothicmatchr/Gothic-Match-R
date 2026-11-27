// Battle damage that builds up on the enemy as big hits land. No blood: bruises,
// dark cuts and grazes on exposed skin; dents, scratches and cracks on armour.
// Marks are painted straight onto the body-part canvases (only over existing pixels),
// so they move with the arms and stay on armour pieces until they break off.
const Scars=(()=>{
  const RIGO=[-20,-40];let base=null,arm=[],cv={},skinN=0,armN=[0,0,0,0],hits={};
  const SPOTS=[ // [x, y, canvas, needs] in body coordinates; needs = armour piece that must be broken first
    [88,64,'base'],[112,64,'base'],[104,79,'base'],[95,40,'base',1],[106,39,'base',1],
    [152,124,'rU'],[158,134,'rU'],[48,124,'lU'],[42,134,'lU'],[156,150,'rF'],[44,150,'lF'],
    [50,112,'base',0],[150,112,'base',0],
    [80,118,'base',3],[118,122,'base',3],[96,128,'base',3],[82,150,'base',2],[116,148,'base',2]];
  function attach(b,a,rig){base=b;arm=a;skinN=0;armN=[0,0,0,0];hits={};
    cv={base:b,rU:rig.rU.querySelector(':scope>canvas'),rF:rig.rU.querySelector('.rF>canvas'),lU:rig.lU.querySelector(':scope>canvas'),lF:rig.lU.querySelector('.lF>canvas')}}
  const toPx=(x,y,k)=>k==='base'?[x*PS,y*PS]:[(x-RIGO[0])*PS,(y-RIGO[1])*PS];
  function ctx(c){const x=c.getContext('2d');x.save();x.globalCompositeOperation='source-atop';return x}
  const R=(a,b)=>a+Math.random()*(b-a);
  function px(x,X,Y,col){x.fillStyle=col;x.fillRect(Math.round(X),Math.round(Y),1,1)}
  function bruise(x,X,Y,s){for(let i=0;i<46*s;i++){const a=R(0,6.28),r=Math.sqrt(Math.random())*4.4*s;px(x,X+Math.cos(a)*r*1.25,Y+Math.sin(a)*r,`rgba(${R(60,85)|0},${R(25,40)|0},${R(75,100)|0},${r<2.2*s?.5:.3})`)}
    for(let i=0;i<10;i++)px(x,X+R(-1.5,1.5),Y+R(-1,1),'rgba(45,18,55,.45)')}
  function cut(x,X,Y){const a=R(-.9,.9)+(Math.random()<.5?0:Math.PI/2),L=R(6,10);
    for(let i=-L/2;i<=L/2;i+=.6){const th=Math.abs(i)<L/3?1:0,cx=X+Math.cos(a)*i,cy=Y+Math.sin(a)*i;px(x,cx,cy,'rgba(34,10,20,.9)');if(th)px(x,cx+Math.sin(a)*.8,cy-Math.cos(a)*.8,'rgba(60,20,32,.75)');
      px(x,cx-Math.sin(a)*1.4,cy+Math.cos(a)*1.4,'rgba(130,60,80,.35)')}}
  function graze(x,X,Y){for(let i=0;i<22;i++)px(x,X+R(-4,4),Y+R(-2.5,2.5),`rgba(${R(80,110)|0},40,55,.55)`);for(let i=0;i<3;i++)px(x,X+R(-3,3),Y+R(-2,2),'rgba(255,230,215,.35)')}
  function dent(x,X,Y){for(let i=-2;i<=2;i++){px(x,X+i,Y-Math.abs(i)*.5+1,'rgba(0,0,0,.55)');px(x,X+i,Y-Math.abs(i)*.5+2,'rgba(255,255,255,.45)')}px(x,X,Y,'rgba(0,0,0,.35)')}
  function scratch(x,X,Y){const a=R(-.8,-.3);for(let k=0;k<3;k++)for(let i=0;i<R(4,7);i++){const cx=X+Math.cos(a)*i+k*1.2,cy=Y+Math.sin(a)*i+k*1.5;px(x,cx,cy,'rgba(255,255,255,.55)');px(x,cx,cy+1,'rgba(0,0,0,.3)')}}
  function crack(x,X,Y){let cx=X,cy=Y,a=R(0,6.28);for(let i=0;i<R(8,12);i++){a+=R(-.7,.7);cx+=Math.cos(a);cy+=Math.sin(a);px(x,cx,cy,'rgba(8,8,14,.85)');
      if(i===4){let bx=cx,by=cy,b=a+R(.8,1.4);for(let j=0;j<4;j++){bx+=Math.cos(b);by+=Math.sin(b);px(x,bx,by,'rgba(8,8,14,.75)')}}}px(x,X+1,Y,'rgba(255,255,255,.4)')}
  function open(k){return k===undefined||(typeof armDur!=='undefined'&&armDur[k]<=0)}
  function skin(n){if(!base)return;
    for(let i=0;i<(n||1);i++){if(skinN>=16)return;
      const ok=SPOTS.filter(s=>open(s[3])&&cv[s[2]]);if(!ok.length)return;
      ok.sort((a,b)=>(hits[a]||0)-(hits[b]||0)+Math.random()-.5);const sp=ok[0];hits[sp]=(hits[sp]||0)+1;
      const c=cv[sp[2]],[X,Y]=toPx(sp[0]+R(-2.5,2.5),sp[1]+R(-2,2),sp[2]),x=ctx(c),r=Math.random();
      if(r<.45||hits[sp]>1)bruise(x,X,Y,hits[sp]>1?1.15:1);if(r>=.45&&r<.8)cut(x,X,Y);else if(r>=.8)graze(x,X,Y);x.restore();skinN++}}
  function armour(p,heavy){const c=arm[p];if(!c||armN[p]>=12)return;
    const g=c.getContext('2d'),d=g.getImageData(0,0,c.width,c.height).data;let X=0,Y=0;
    for(let tries=0;tries<60;tries++){X=R(3,c.width-3)|0;Y=R(3,c.height-3)|0;if(d[(Y*c.width+X)*4+3]&&d[((Y+2)*c.width+X)*4+3]&&d[((Y-2)*c.width+X)*4+3])break}
    const x=ctx(c),r=Math.random();if(heavy||r<.3)crack(x,X,Y);else if(r<.65)dent(x,X,Y);else scratch(x,X,Y);x.restore();armN[p]++}
  return{attach,skin,armour};
})();
