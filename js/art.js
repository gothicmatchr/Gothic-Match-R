// Pixel-art generation: gems, enemy portraits, castle backdrop and the archer.
const mix=(h,w,f)=>{const a=parseInt(h.slice(1),16),b=parseInt(w.slice(1),16);const ch=(x,s)=>(x>>s)&255;
  return'#'+[16,8,0].map(s=>Math.round(ch(a,s)+(ch(b,s)-ch(a,s))*f).toString(16).padStart(2,'0')).join('')};
const GP=24;
function crisp(c,outline){const x=c.getContext('2d'),W=c.width,im=x.getImageData(0,0,W,W),d=im.data,on=new Uint8Array(W*W);
  for(let i=0;i<W*W;i++){on[i]=d[i*4+3]>=120?1:0;d[i*4+3]=on[i]?255:0}
  if(outline)for(let i=0;i<W*W;i++){if(on[i])continue;const X=i%W,y=(i-X)/W;
    if((X>0&&on[i-1])||(X<W-1&&on[i+1])||(y>0&&on[i-W])||(y<W-1&&on[i+W])){d[i*4]=outline[0];d[i*4+1]=outline[1];d[i*4+2]=outline[2];d[i*4+3]=255}}
  x.putImageData(im,0,0)}
function gemArt(t){
  const c=document.createElement('canvas');c.width=c.height=GP;const x=c.getContext('2d');
  if(t>=SP){x.drawImage(orbCanvas(t,GP),0,0);crisp(c,[20,10,18]);return c}
  if(t===3){const[l,m,dk]=COLORS[3],rim=mix(dk,'#000000',.1);
    x.fillStyle=rim;x.beginPath();x.arc(12,12,11.2,0,7);x.fill();
    const g=x.createLinearGradient(4,3,20,21);g.addColorStop(0,mix(l,'#ffffff',.45));g.addColorStop(.5,m);g.addColorStop(1,dk);x.fillStyle=g;x.beginPath();x.arc(12,12,10,0,7);x.fill();
    for(let k=0;k<20;k++){const a=k/20*Math.PI*2;x.fillStyle=k%2?mix(dk,'#000000',.2):mix(l,'#ffffff',.2);x.fillRect(Math.round(12+Math.cos(a)*10.3),Math.round(12+Math.sin(a)*10.3),1,1)}
    const f=x.createLinearGradient(6,6,18,18);f.addColorStop(0,l);f.addColorStop(1,m);x.fillStyle=f;x.beginPath();x.arc(12,12,7.2,0,7);x.fill();
    x.strokeStyle=mix(dk,'#000000',.15);x.lineWidth=1;x.beginPath();x.arc(12,12,7.4,0,7);x.stroke();
    const cr=(dx,dy)=>{x.beginPath();x.moveTo(8+dx,15+dy);x.lineTo(8+dx,10+dy);x.lineTo(10+dx,12+dy);x.lineTo(12+dx,9+dy);x.lineTo(14+dx,12+dy);x.lineTo(16+dx,10+dy);x.lineTo(16+dx,15+dy);x.closePath();x.fill()};
    x.fillStyle=mix(dk,'#000000',.25);cr(.8,.8);x.fillStyle=mix(l,'#ffffff',.5);cr(0,0);
    x.fillStyle='#ffffff';x.fillRect(6,5,2,1);x.fillRect(5,6,1,2);crisp(c,[20,10,18]);return c}
  const[l,m,dk]=COLORS[t],matte=t===RED,hi=mix(l,'#ffffff',matte?.12:.55),dd=mix(dk,'#000000',.35);
  // silhouette per type: 0 enemy diamond, 1 Frost circle, 2 Bloom plus, 3 Volt triangle, 4 Hex square, 5 Star star
  const ring=(n,r,cx,cy,rot)=>[...Array(n)].map((_,k)=>[cx+r*Math.cos(rot+2*Math.PI*k/n),cy+r*Math.sin(rot+2*Math.PI*k/n)]);
  const O=t===0?[[12,1],[23,12],[12,23],[1,12]]
    :t===1?[[3,2],[12,1],[21,2],[21.5,11],[18,18],[12,23],[6,18],[2.5,11]]
    :t===2?[[8,1],[16,1],[16,8],[23,8],[23,16],[16,16],[16,23],[8,23],[8,16],[1,16],[1,8],[8,8]]
    :t===3?[[12,1],[23,21.5],[1,21.5]]
    :t===4?[[4,1],[20,1],[23,4],[23,20],[20,23],[4,23],[1,20],[1,4]]
    :[...Array(10)].map((_,k)=>{const a=-Math.PI/2+Math.PI/5*k,r=k%2?5:11.8;return[12+r*Math.cos(a),12.8+r*Math.sin(a)]});
  const cx=O.reduce((a,p)=>a+p[0],0)/O.length,cy=O.reduce((a,p)=>a+p[1],0)/O.length,K=t===2?.5:t===5?.5:.55;
  const T=O.map(([px,py])=>[cx+(px-cx)*K,cy+(py-cy)*K]);
  const tones=matte?[mix(l,'#ffffff',.1),l,m,dk,mix(dk,'#000000',.15)]:[hi,l,m,dk,dd];
  for(let i=0;i<O.length;i++){const j=(i+1)%O.length,mx=(O[i][0]+O[j][0])/2-cx,my=(O[i][1]+O[j][1])/2-cy,len=Math.hypot(mx,my)||1;
    const dot=(-mx-my)/(len*Math.SQRT2);x.fillStyle=dot>.55?tones[0]:dot>.15?tones[1]:dot>-.3?tones[2]:dot>-.7?tones[3]:tones[4];
    x.beginPath();x.moveTo(...O[i]);x.lineTo(...O[j]);x.lineTo(...T[j]);x.lineTo(...T[i]);x.closePath();x.fill()}
  const g=x.createLinearGradient(0,cy-6,0,cy+6);g.addColorStop(0,matte?m:l);g.addColorStop(1,matte?dk:m);x.fillStyle=g;
  x.beginPath();T.forEach((p,k)=>x[k?'lineTo':'moveTo'](...p));x.closePath();x.fill();
  if(!matte){x.fillStyle='#ffffff';const sx=Math.round(cx-3),sy=Math.round(cy-3);x.fillRect(sx,sy,2,1);x.fillRect(sx,sy+1,1,1);
    x.fillStyle=mix(l,'#ffffff',.35);x.fillRect(sx+2,sy,1,1)}
  crisp(c,[20,10,18]);return c;
}
// item icons (24px pixel art): green draught flask, holy water vial, warhammer, hourglass
function itemArt(k){const c=document.createElement('canvas');c.width=c.height=GP;const x=c.getContext('2d'),R=(f,a,b,w,h)=>{x.fillStyle=f;x.fillRect(a,b,w,h)};
  if(k==='draught'){x.fillStyle='#cfe8ff';x.beginPath();x.arc(12,15,7.5,0,7);x.fill();R('#cfe8ff',9,4,6,6);
    x.fillStyle='#21b34a';x.beginPath();x.arc(12,15.5,6,0,Math.PI);x.fill();R('#21b34a',6,14,12,2);R('#9df2a8',8,14,4,1);R('#7a4a22',9,2,6,3);R('#ffffff',8,11,2,3)}
  else if(k==='holy'){R('#d8e8f4',9,5,6,15);R('#8fd3ff',10,10,4,9);R('#1f7ae0',10,17,4,2);R('#c9d0d8',8,3,8,2);R('#7d8792',10,1,4,2);R('#ffffff',11.5,11,1,5);R('#ffffff',10.5,12.5,3,1);R('#ffffff',9.5,6,1,3)}
  else if(k==='hammer'){x.save();x.translate(12,12);x.rotate(-Math.PI/4);R('#5a3418',-1,-3,2.4,14);R('#c9a23a',-1.2,6,2.8,1.4);R('#d8dde4',-6,-8,12,5);R('#7d8792',-6,-4,12,1.5);R('#ffffff',-5.5,-7.5,4,1);x.restore()}
  else{R('#c9a23a',5,2,14,2);R('#c9a23a',5,20,14,2);R('#7a5a20',6,4,1.5,16);R('#7a5a20',16.5,4,1.5,16);
    x.fillStyle='#e8f2ff';x.beginPath();x.moveTo(8,4);x.lineTo(16,4);x.lineTo(12.6,12);x.lineTo(16,20);x.lineTo(8,20);x.lineTo(11.4,12);x.closePath();x.fill();
    x.fillStyle='#f5a623';x.beginPath();x.moveTo(9.5,5.5);x.lineTo(14.5,5.5);x.lineTo(12,10);x.closePath();x.fill();x.beginPath();x.moveTo(12,15);x.lineTo(15,19);x.lineTo(9,19);x.closePath();x.fill();R('#f5a623',11.6,11,.8,4)}
  crisp(c,[20,10,18]);return c}
function gemCanvas(t,px){
  const o=document.createElement('canvas');o.width=o.height=px;const x=o.getContext('2d');x.imageSmoothingEnabled=false;
  const g=Math.round(px*.07);x.drawImage(gemArt(t),g,g,px-2*g,px-2*g);return o;
}
function orbCanvas(t,px){
  const o=document.createElement('canvas');o.width=o.height=px;const c=o.getContext('2d'),m=px/2;
  if(t===CR){  // Crush: an iron orb with a crimson rim and a warhammer across it
    const R=px*.4,glow=c.createRadialGradient(m,m,R*.3,m,m,R*1.25);glow.addColorStop(0,'rgba(255,90,80,.75)');glow.addColorStop(1,'rgba(160,20,30,0)');
    c.fillStyle=glow;c.fillRect(0,0,px,px);
    const g=c.createRadialGradient(m-R*.3,m-R*.35,R*.1,m,m,R);g.addColorStop(0,'#9aa0aa');g.addColorStop(.55,'#4a4e58');g.addColorStop(1,'#1c1d24');
    c.beginPath();c.arc(m,m,R*.85,0,Math.PI*2);c.fillStyle=g;c.fill();c.lineWidth=px*.05;c.strokeStyle='#8c1f2a';c.stroke();
    c.save();c.translate(m,m);c.rotate(-Math.PI/4);const u=R/10;
    c.fillStyle='#5a3418';c.fillRect(-u*.8,-u*2,u*1.6,u*9);c.fillStyle='#c9a23a';c.fillRect(-u*.9,u*3.5,u*1.8,u*1.1);  // haft + band
    c.fillStyle='#d8dde4';c.fillRect(-u*4.6,-u*5.2,u*9.2,u*3.6);c.fillStyle='#7d8792';c.fillRect(-u*4.6,-u*2.6,u*9.2,u*1);  // head
    c.fillStyle='#ffffff';c.fillRect(-u*4.2,-u*4.9,u*3,u*.7);c.fillStyle='#1c1d24';c.fillRect(-u*.4,-u*5.2,u*.8,u*3.6);
    c.restore();return o;
  }
  if(t===SL){
    const R=px*.4,glow=c.createRadialGradient(m,m,R*.2,m,m,R*1.25);glow.addColorStop(0,'rgba(170,255,240,.9)');glow.addColorStop(1,'rgba(80,220,200,0)');
    c.fillStyle=glow;c.fillRect(0,0,px,px);
    const g=c.createRadialGradient(m-R*.3,m-R*.3,R*.1,m,m,R);g.addColorStop(0,'#e6fffb');g.addColorStop(.5,'#3fd6c0');g.addColorStop(1,'#0b7a6c');
    c.beginPath();c.arc(m,m,R*.82,0,Math.PI*2);c.fillStyle=g;c.fill();c.lineWidth=px*.035;c.strokeStyle='#064a42';c.stroke();
    c.strokeStyle='#fff';c.lineWidth=px*.07;c.lineCap='round';c.lineJoin='round';
    for(const o of[-.18,.12]){c.beginPath();c.moveTo(m-R*.38,m+R*(o+.18));c.lineTo(m,m+R*(o-.2));c.lineTo(m+R*.38,m+R*(o+.18));c.stroke()}
    return o;
  }
  if(t===SP){
    const R=px*.4,glow=c.createRadialGradient(m,m,R*.2,m,m,R*1.25);glow.addColorStop(0,'rgba(255,240,180,.9)');glow.addColorStop(1,'rgba(255,209,102,0)');
    c.fillStyle=glow;c.fillRect(0,0,px,px);
    const g=c.createRadialGradient(m-R*.3,m-R*.3,R*.1,m,m,R);g.addColorStop(0,'#fff6d5');g.addColorStop(.5,'#ffd166');g.addColorStop(1,'#c47f00');
    c.beginPath();c.arc(m,m,R*.82,0,Math.PI*2);c.fillStyle=g;c.fill();c.lineWidth=px*.035;c.strokeStyle='#8a5300';c.stroke();
    c.fillStyle='#5a2a00';const w=R*.2,h=R*.55,a=R*.3;
    for(const d of[-1,1]){c.beginPath();c.moveTo(m,m+d*(h+a*.2));c.lineTo(m+a,m+d*(h-a));c.lineTo(m+w*.5,m+d*(h-a));c.lineTo(m+w*.5,m);c.lineTo(m-w*.5,m);c.lineTo(m-w*.5,m+d*(h-a));c.lineTo(m-a,m+d*(h-a));c.closePath();c.fill()}
    return o;
  }
  return o;
}
/* ---------- enemy art ---------- */
// fitted, feminine plate for petite enemies: small layered pauldrons, a sleek open-face helm with a widow's peak,
// a laced corset-plate at the waist and a contoured breastplate trimmed with filigree
function femArmour(A,K,Ad,Al,Tr,e){const TrD=mix(Tr,'#000000',.2);
  const pl=(sx)=>{const X=x=>sx<0?200-x:x;const P=s=>s.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,(m,a,b)=>X(+a)+' '+b);
    return[{d:P('M54 112Q55 98 72 98L74 110Q63 112 54 112Z'),f:A},{d:P('M54 112Q64 114 74 110L74 117Q64 121 56 119Z'),f:A},
      {d:P('M54 112Q64 114 74 110'),s:Tr,w:1.4},{d:P('M56 119Q64 121 74 117'),s:Tr,w:1.1},{d:P('M58 103Q64 100 70 100'),s:Al,w:1.6},
      {d:P('M59 107Q62 105 65 107Q68 105 71 107'),s:TrD,w:.7},{d:C(X(70),104,1.1),f:K}]};
  return[
   [...pl(1),...pl(-1),{d:'M146 112Q145 98 128 98L126 110Q137 112 146 112Z',f:Ad}],
   [{d:'M82 50Q81 23 100 21Q119 23 118 50L114 50Q113 34 100 32Q87 34 86 50Z',f:A},{d:'M104 22Q119 25 118 50L114 50Q114 36 104 33Z',f:Ad},
    {d:'M95 32L100 41L105 32Z',f:A},{d:'M95 32L100 41L105 32',s:Tr,w:1},{d:'M86 50Q87 34 100 32Q113 34 114 50',s:Tr,w:1.6},{d:'M87 42Q88 30 97 25',s:Al,w:2},
    {d:'M100 21Q96 15 91 17M100 21Q104 15 109 17',s:Tr,w:1.2},{d:C(100,27,1.6),f:e.gem},
    {d:'M82 50L86 50L87 62L83 60Z',f:A},{d:'M118 50L114 50L113 62L117 60Z',f:A},{d:'M118 50L114 50L113 62L117 60Z',f:Ad}],
   [{d:'M73 136Q100 141 127 136L125 150Q100 155 75 150Z',f:A},{d:'M75 150Q100 155 125 150L124 160Q100 165 76 160Z',f:A},
    {d:'M112 139Q124 138 127 136L124 160Q118 162 112 163Z',f:Ad},{d:'M75 150Q100 155 125 150',s:K,w:1.4},{d:'M77 139Q90 142 98 141',s:Al,w:1.3},
    {d:'M97 138L103 141M103 138L97 141M97 143L103 146M103 143L97 146',s:Tr,w:.8},{d:'M76 160Q100 165 124 160',s:Tr,w:1.2},{d:'M73 136Q100 141 127 136',s:Tr,w:1.2}],
   [{d:'M70 104Q85 97 100 105Q115 97 130 104L127 137Q100 142 73 137Z',f:A},{d:'M100 105Q115 97 130 104L127 137Q114 140 100 141Z',f:Ad},
    {d:'M70 104Q85 97 100 105Q115 97 130 104',s:Tr,w:2.2},{d:'M76 107Q85 102 94 104',s:Al,w:1.8},{d:'M78 118Q86 122 94 120',s:Al,w:1},
    {d:'M86 110Q90 117 87 125Q85 129 88 133M114 110Q110 117 113 125Q115 129 112 133',s:Tr,w:.8},{d:'M100 112V134',s:Tr,w:.7},
    {d:'M73 137Q100 142 127 137',s:Tr,w:1.6},{d:C(100,110,2.2),f:Tr},{d:C(100,110,1.4),f:e.gem}]]}
const C=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const E=(x,y,rx,ry)=>`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0Z`;
const Rc=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
function layers(e){
  const A=e.armour,K=mix(A,'#000000',.7),Ad='rgba(0,0,0,.24)',Al='rgba(255,255,255,.38)',Tr=e.trim,H=e.hair;
  const sk=e.skin,skL=mix(sk,'#fff4e0',.25),skS=mix(mix(sk,'#5a3050',.25),'#000000',.12),skD=mix(mix(sk,'#3a1a40',.35),'#000000',.2),HL=mix(H,'#e8d8c8',.3),HD=mix(H,'#000000',.45),HM=mix(H,'#ffffff',.12);
  const lip=mix(sk,e.fem?'#8a1a30':'#9a4a4a',e.fem?.6:.3),lipD=mix(lip,'#000000',.3),lipL=mix(lip,'#ffffff',.3),brow=mix(H,'#000000',.3);
  const cp=e.cape,cpD=mix(cp,'#000000',.45),cpL=mix(cp,'#8a7aa0',.25),ln=e.lining,lnL=mix(ln,'#ffffff',.2),lnD=mix(ln,'#000000',.35);
  const base=[];
  // cape behind the body, with high collar
  const capeAt=base.length;base.push({d:'M38 100Q18 140 12 170L188 170Q182 140 162 100Q130 92 100 96Q70 92 38 100Z',f:cp},
    {d:'M24 140Q16 156 12 170L36 170Q30 158 32 140Z',f:ln},{d:'M176 140Q184 156 188 170L164 170Q170 158 168 140Z',f:lnD},
    {d:'M30 120Q24 146 22 170M44 112Q38 142 40 170M156 112Q162 142 160 170M170 120Q176 146 178 170',s:cpD,w:2},{d:'M34 112Q28 136 26 160',s:cpL,w:1.2},
    {d:'M80 100Q60 78 62 40Q74 62 90 80Q91 90 92 100Z',f:cp},{d:'M120 100Q140 78 138 40Q126 62 110 80Q109 90 108 100Z',f:cpD},
    {d:'M82 98Q67 78 67 50Q77 68 90 82Z',f:ln},{d:'M118 98Q133 78 133 50Q123 68 110 82Z',f:lnD},
    {d:'M62 40Q60 70 80 100',s:Tr,w:1.4},{d:'M138 40Q140 70 120 100',s:mix(Tr,'#000000',.3),w:1.4});
  const PET=!!e.petite;if(PET)for(let i=capeAt;i<base.length;i++)base[i].m=[.8,0,0,1,20,0];  // slimmer cloak for a petite frame
  if(e.fur)base.push({d:'M56 104Q70 90 100 92Q130 90 144 104Q130 98 100 100Q70 98 56 104Z',f:e.fur},{d:'M60 101L63 97M68 98L70 93M78 96L79 91M122 96L121 91M132 98L130 93M140 101L137 97',s:mix(e.fur,'#ffffff',.3),w:1.2});
  if(e.style==='long')base.push({d:'M80 44Q68 84 64 124Q76 132 88 120Q84 90 86 56Z',f:H},{d:'M120 44Q132 84 136 124Q124 132 112 120Q116 90 114 56Z',f:HD},
    {d:'M76 66Q72 96 70 120M82 62Q78 92 78 116',s:HM,w:1.2},{d:'M124 66Q128 96 130 120M118 62Q122 92 122 116',s:H,w:1.2},{d:'M78 58Q74 84 72 104',s:HL,w:1});
  const rarm=[{d:'M140 100Q158 104 163 126L167 170L143 170L139 128Z',f:sk},{d:'M156 110Q163 120 163 130L167 170L158 170Q160 140 156 110Z',f:skS},{d:'M141 128Q143 150 145 170L149 170Q147 148 147 130Z',f:skS},
    {d:'M152 118Q156 132 158 150',s:skD,w:1}];
  if(PET)base.push({d:E(63,110,8,8),f:sk},{d:E(61,108,4,4),f:skL},{d:E(137,110,8,8),f:sk},{d:E(140,112,4,5),f:skS},
    {d:'M68 101Q100 95 132 101L126 148Q123 156 125 170L75 170Q77 156 74 148Z',f:sk});
  else base.push({d:E(50,112,12,11),f:sk},{d:E(46,110,6,6),f:skL},{d:E(150,112,12,11),f:sk},{d:E(155,114,6,7),f:skS},
    {d:'M60 100Q100 92 140 100L135 170L65 170Z',f:sk});
  if(PET){const T=e.top,TD=mix(T,'#000000',.4),TL=mix(T,'#ffffff',.18);  // sleeveless gown, plunging neckline, waist belt
    base.push({d:'M70 103Q100 98 130 103L125 148Q122 156 124 170L76 170Q78 156 75 148Z',f:T},{d:'M112 101Q128 101 130 103L125 148Q122 156 124 170L112 170Z',f:'rgba(0,0,0,.25)'},
      {d:'M85 101Q93 104 100 133Q107 104 115 101Z',f:sk},{d:'M107 104Q103 112 100 133Q104 112 113 102Z',f:skS},
      {d:'M85 101Q94 105 100 133M115 101Q106 105 100 133',s:TD,w:1.3},{d:'M86 102Q94 106 99.6 130',s:Tr,w:.6},
      {d:'M92 108Q96 116 98.6 125',s:skS,w:.8},{d:'M74 112Q78 104 84 103',s:TL,w:1.2},
      {d:'M75 146Q100 151 125 146L125 151Q100 156 75 151Z',f:Tr},{d:C(100,152,2),f:e.gem},
      {d:'M86 157L83 170M100 157V170M114 157L117 170',s:TD,w:1},{d:'M92 158L91 170',s:TL,w:.8})}
  else if(e.top)base.push({d:'M64 102Q100 95 136 102L134 170L66 170Z',f:e.top},{d:'M112 101Q134 101 136 104L134 170L114 170Z',f:'rgba(0,0,0,.25)'},
    {d:'M86 101Q100 112 114 101L114 104Q100 116 86 104Z',f:mix(e.top,'#000000',.4)},{d:'M100 110V168',s:mix(e.top,'#000000',.3),w:1.2},
    {d:'M70 120Q76 140 72 168M128 120Q124 140 128 168',s:mix(e.top,'#000000',.3),w:1.2},{d:'M74 110Q86 105 96 106',s:'rgba(255,255,255,.14)',w:1.6},
    {d:'M88 104L90 108M94 106L95 110M105 106L104 110M111 104L109 108',s:Tr,w:.9});
  else base.push({d:'M71 110Q86 126 99 115L99 121Q86 131 71 117Z',f:skS},{d:'M101 115Q114 126 129 110L129 117Q114 131 101 121Z',f:skS},
    {d:'M100 121V152',s:skS,w:1.6},{d:'M89 134H98M102 134H111M90 144H98M102 144H110',s:skS,w:1.4},{d:C(100,154,1.4),f:skD},
    {d:'M76 103Q87 106 96 104M104 104Q113 106 124 103',s:skS,w:1.6},{d:'M128 103Q141 102 139 110L135 170L124 170Q130 140 128 103Z',f:'rgba(30,10,40,.22)'},
    {d:'M73 107Q84 103 94 107',s:skL,w:2},{d:'M80 120Q86 124 92 122',s:skL,w:1.2},{d:'M118 126Q122 140 120 156',s:skD,w:1});
  if(!PET)base.push({d:Rc(65,158,70,12),f:e.cloth},{d:Rc(65,158,70,3),f:'rgba(0,0,0,.3)'},{d:Rc(95,157,10,9),f:Tr},{d:Rc(97,159,6,4),f:e.cloth},{d:Rc(96,157.5,8,1),f:'rgba(255,255,255,.4)'});
  // neck, chain clasp and brooch
  if(PET)base.push({d:'M93 72L93 99L107 99L107 72Z',f:sk},{d:'M93 90Q84 97 70 101L130 101Q116 97 107 90Z',f:sk},{d:'M103 74L107 74L107 98L103 98Z',f:skS},
    {d:'M95 94Q100 97 105 94',s:skS,w:1},{d:C(72,101,1.6),f:Tr},{d:C(128,101,1.6),f:Tr},
    // the amulet on a fine chain, resting at the neckline
    {d:'M93 93Q95 108 100 117Q105 108 107 93',s:Tr,w:.9},{d:E(100,121.5,3.4,4.4),f:Tr},{d:E(100,121.5,2.3,3.2),f:e.gem},{d:C(99.2,120.4,.8),f:mix(e.gem,'#ffffff',.7)},{d:'M98.6 126L100 129L101.4 126Z',f:Tr});
  else base.push({d:'M92 72L92 99L108 99L108 72Z',f:sk},{d:'M92 90Q80 97 62 100L138 100Q120 97 108 90Z',f:sk},{d:'M103 74L108 74L108 98L103 98Z',f:skS},
    {d:'M95 82L98 98M105 82L102 98',s:skS,w:1},{d:'M94 100Q100 103 106 100',s:skS,w:1.2},
    {d:'M84 100Q92 107 100 106Q108 107 116 100',s:Tr,w:1.3},{d:'M85 101Q92 108 100 107',s:'rgba(255,255,255,.3)',w:.6},
    {d:C(100,106,4.2),f:Tr},{d:C(100,106,2.8),f:e.gem},{d:C(99,105,1),f:mix(e.gem,'#ffffff',.7)},{d:C(84,100,2),f:Tr},{d:C(116,100,2),f:Tr});
  const face='M83 50Q83 72 92 79Q100 84 108 79Q117 72 117 50Q117 33 100 32Q83 33 83 50Z';
  base.push({d:E(83,57,3.5,5),f:sk},{d:E(117,57,3.5,5),f:skS},{d:E(83,57,1.4,2.5),f:skD},{d:E(117,57,1.4,2.5),f:skD},
    {d:face,f:sk},{d:E(100,84,9,3),f:'rgba(20,0,20,.3)'},
    {d:'M108 35Q117 41 117 52Q117 70 108 79Q112 64 110 50Z',f:skS},{d:'M112 46Q116 58 112 72',s:skD,w:1},{d:'M84 46Q83 58 86 68',s:skL,w:1},
    {d:E(92,52.5,5,2.2),f:skS},{d:E(108,52.5,5,2.2),f:skS},{d:E(92,40,6,3),f:skL},{d:'M86 63Q90 67.5 94 66.5',s:skS,w:1.4},{d:'M106 66.5Q110 67.5 114 63',s:skS,w:1.4},
    {d:E(88,62,3,2),f:mix(sk,'#c05060',.15)},{d:'M92 79Q100 83 108 79',s:skL,w:1});
  if(e.stubble)base.push({d:'M85 64Q86 76 93 80Q100 84 107 80Q114 76 115 64Q110 72 100 74Q90 72 85 64Z',f:mix(sk,H,.3)});
  if(e.beard)base.push({d:'M84 61Q85 78 93 82Q100 86 107 82Q115 78 116 61Q114 71 108 75Q100 78 92 75Q86 71 84 61Z',f:H},{d:'M100 75Q106 80 108 82Q115 78 116 61Q114 71 108 75Z',f:HD},
    {d:'M92 71Q100 68.5 108 71Q104 72.5 100 72Q96 72.5 92 71Z',f:H},{d:'M88 72L89 78M93 76L94 81M100 77V83M107 76L106 81M112 72L111 78',s:HD,w:1},{d:'M86 66Q88 75 93 79M90 74Q92 79 95 81',s:HL,w:.9});
  if(e.expr==='weary')base.push({d:E(92,53.6,6,3.6),f:'rgba(50,15,40,.3)'},{d:E(108,53.6,6,3.6),f:'rgba(50,15,40,.34)'},
    {d:'M87.5 57.2Q92 59.6 96.5 57.4M103.5 57.4Q108 59.6 112.5 57.2',s:'rgba(60,20,45,.4)',w:1.3},{d:'M88.5 59Q92 60.6 95.5 59.2M104.5 59.2Q108 60.6 111.5 59',s:'rgba(60,20,45,.22)',w:1},
    {d:'M94 66Q91.4 71 93 76.4M106 66Q108.6 71 107 76.4',s:'rgba(60,20,45,.3)',w:1.1});
  if(e.scar)base.push({d:'M109 40L113 58',s:mix(sk,'#7a2a2a',.5),w:1.6},{d:'M110.2 40L114.2 58',s:skL,w:.7});
  if(e.tattoo)base.push({d:'M86 44Q84 52 87 60M86 50L83 52M86 55L83 57',s:mix(sk,'#1a2a4a',.6),w:1.3});
  // hair: layered locks
  if(e.style==='short')base.push({d:'M82 50Q80 29 100 26Q120 29 118 50Q117 41 111 37Q105 40 99 37Q92 40 88 38Q84 42 82 50Z',f:H},
    {d:'M100 27Q118 29 118 50Q116 40 110 36Q106 34 100 27Z',f:HD},{d:'M86 38Q92 30 102 30M90 34Q96 29 106 28',s:HL,w:1.1},{d:'M84 46Q85 40 89 37M94 36Q96 33 100 32',s:HM,w:1},
    {d:'M110 30Q118 34 118 46',s:HD,w:1.4},{d:'M88 38L86 44M94 37L93 42M106 37L108 42M112 37L115 43',s:HD,w:1});
  if(e.style==='long')base.push({d:'M82 54Q78 28 100 25Q122 28 118 54Q114 40 106 35Q98 38 92 37Q86 42 82 54Z',f:H},{d:'M100 26Q122 28 118 54Q114 40 106 35Z',f:HD},
    {d:'M86 40Q92 30 102 29',s:HL,w:1.3},{d:'M88 44Q92 36 98 34M104 30Q112 31 116 40',s:HM,w:1},{d:'M100 26Q96 33 92 37',s:HD,w:1},
    {d:'M86 34Q100 28 114 34',s:mix(Tr,'#ffffff',.2),w:1.3},{d:C(100,30.5,1.5),f:e.gem},
    {d:C(84,62,1.4),f:Tr},{d:Rc(83.4,63,1.2,3),f:Tr},{d:C(84,66.6,1),f:e.gem});
  if(e.style==='crop')base.push({d:'M83 46Q82 30 100 29Q118 30 117 46Q113 37 100 36Q87 37 83 46Z',f:H},{d:'M100 29Q118 30 117 46Q113 37 104 36Z',f:HD},{d:'M88 36Q96 31 106 32',s:HL,w:1},{d:'M86 40L87 36M92 36L93 33M98 35L99 31',s:HM,w:.8});
  if(e.style==='mohawk')base.push({d:'M95 16L105 16L106 40L94 40Z',f:H},{d:'M100 16L105 16L106 40L100 40Z',f:HD},{d:'M97.5 18V38',s:HL,w:.8},{d:'M96 20V36',s:HM,w:.8},
    {d:'M83 46Q84 38 92 37M117 46Q116 38 108 37',s:mix(sk,H,.35),w:2.2},{d:Rc(94,26,12,2),f:Tr},{d:Rc(94,33,12,2),f:Tr});
  const eye=(cx,wide)=>wide?[{d:E(cx,54,4.6,3.4),f:'#fbf7f2'},{d:C(cx,53.6,1.5),f:e.iris},{d:C(cx,53.6,.8),f:'#0d0806'},{d:Rc(cx-.9,52.4,.9,.9),f:'#fff'},{d:`M${cx-5} 51Q${cx} 49 ${cx+5} 51`,s:'#24160f',w:1}]
    :[{d:`M${cx-4} 54Q${cx} 51.4 ${cx+4} 54Q${cx} 55.8 ${cx-4} 54Z`,f:'#efe8e0'},{d:C(cx+.3,53.8,1.8),f:e.iris},{d:C(cx+.3,54.3,1.2),f:mix(e.iris,'#000000',.35)},{d:C(cx+.3,53.8,.85),f:'#0d0806'},{d:Rc(cx-.6,52.6,.9,.9),f:'#fff'},
      {d:`M${cx-4.6} 53.9Q${cx} 50.6 ${cx+4.6} 53.6`,s:'#1a0e0a',w:e.fem?1.9:1.4},{d:`M${cx-3} 55.6Q${cx} 56.6 ${cx+3} 55.6`,s:skS,w:.8},{d:`M${cx-4} 50.8Q${cx} 49 ${cx+4} 50.6`,s:skS,w:.8}];
  const lid=mix(sk,'#5a3050',.12);
  const tiredEye=cx=>[{d:`M${cx-4} 54.4Q${cx} 52.9 ${cx+4} 54.4Q${cx} 55.8 ${cx-4} 54.4Z`,f:'#e9e1d8'},{d:C(cx+.2,54.5,1.6),f:e.iris},{d:C(cx+.2,54.5,.8),f:'#0d0806'},
    {d:`M${cx-4.4} 54.2Q${cx} 51.6 ${cx+4.4} 54L${cx+4.4} 52.4Q${cx} 50 ${cx-4.4} 52.6Z`,f:lid},{d:`M${cx-4.5} 54.2Q${cx} 52.9 ${cx+4.5} 54.1`,s:'#1a0e0a',w:1.3},
    {d:Rc(cx-.5,53.8,.8,.7),f:'#f4efe6'},{d:`M${cx-3.6} 56Q${cx} 57 ${cx+3.6} 56`,s:skS,w:.9}];
  const nose=[{d:'M99.5 52L99.5 64',s:skL,w:1},{d:'M102 55Q103.6 62 102.6 66',s:skS,w:1.3},{d:'M97 67Q100 69 103 67',s:skD,w:1.1},{d:Rc(99,64.6,1.6,1),f:skL},{d:'M96.6 66.4L97.4 67.4M103.4 66.4L102.6 67.4',s:skD,w:.8}];
  const steel='#c9d0d8',weapon=[{d:'M120 122Q117 150 121 174L141 174Q144 150 140 122Z',f:sk},{d:'M133 126Q138 150 137 172L141 172Q143 150 140 124Z',f:skS},
    {d:Rc(118,166,25,22),f:A},{d:'M118 166H143',s:Tr,w:2},{d:'M118 188H143',s:Tr,w:2},{d:Rc(120,168,4,18),f:'rgba(255,255,255,.3)'},
    {d:E(130.5,194,10,8),f:sk},{d:'M123 192H138M123 196H138',s:skS,w:1.2},{d:C(130.5,184,4),f:Tr},{d:C(130.5,184,2),f:e.gem},
    {d:'M111 201Q130.5 196 150 201L150 207Q130.5 203 111 207Z',f:Tr},{d:'M111 201Q130.5 196 150 201',s:'rgba(255,255,255,.4)',w:1},
    {d:'M125 207L136 207L134.5 252L130.5 262L126.5 252Z',f:steel},{d:'M130.5 209V250',s:'#7d8792',w:1.6},{d:'M126.3 208L127.8 250',s:'#ffffff',w:1}];
  // Articulated arms (body coordinates, rest pose = hanging). Upper arm pivots at the shoulder,
  // forearm + fist (+ short sword on the right) pivot at the elbow.
  const lth=mix(e.cloth,'#5a3a24',.5),lthL=mix(lth,'#ffffff',.25),KK=mix(A,'#000000',.7);
  const bracer=x=>[{d:Rc(x,158,17,20),f:lth},{d:`M${x} 158H${x+17}`,s:Tr,w:2},{d:`M${x} 178H${x+17}`,s:Tr,w:2},{d:Rc(x+2,160,3,16),f:'rgba(255,255,255,.22)'},
    {d:`M${x+1} 166H${x+16}M${x+1} 171H${x+16}`,s:mix(lth,'#000000',.35),w:.9},{d:C(x+4,168.5,1),f:Tr},{d:C(x+13,168.5,1),f:Tr}];
  const fist=x=>[{d:Rc(x-6,176,12,6),f:sk},{d:E(x,186,8,6.5),f:sk},{d:E(x+2,188,6,4),f:skS},{d:Rc(x-5,182,10,1.2),f:skL},
    {d:`M${x-7} 184.5H${x+7}M${x-7} 188H${x+7}`,s:skS,w:1.1},{d:`M${x-4} 191.5H${x+5}`,s:skD,w:1}];
  // serrated short sword: small teeth along the back edge (Varro)
  const serr=()=>{let d='M154 197L161 197L161 200';for(let y=200;y<228;y+=4.5)d+=`L162.8 ${y+1.5}L161 ${y+3}`;return d+'L160.4 232L157.5 240L154.6 232Z'};
  // reverse-grip dagger: the blade runs back along the forearm, so it points down when she raises it to strike
  const dagger=[{d:Rc(168.6,176,4.6,15),f:'#3a2418'},{d:'M169.2 179H172.6M169.2 183H172.6M169.2 187H172.6',s:'#6a4a2a',w:.8},{d:C(170.9,193,2.4),f:Tr},
    {d:Rc(164.4,173,13,2.8),f:Tr},{d:'M167.8 173.2L174 173.2L173.2 141L170.9 132L168.6 141Z',f:steel},
    {d:'M170.9 171V140',s:'#7d8792',w:.9},{d:'M168.4 172L169.2 141',s:'#ffffff',w:.8},{d:C(170.9,174.4,1),f:e.gem}];
  const rig={
    rU:[{d:'M139 101Q158 100 164 122L164 147Q157 153 149 150L145 146L140 126Z',f:sk},{d:'M157 110Q164 120 164 132L164 147L158 149Q161 128 157 110Z',f:skS},
      {d:'M146 112Q150 120 150 132',s:skL,w:1.2},{d:'M143 128Q145 138 147 147',s:skS,w:1.2},{d:'M150 147Q156 150 162 147',s:skD,w:1}],
    rF:[{d:'M148 144Q157 139 166 145L165 160L150 160Z',f:sk},{d:'M160 144Q166 147 165 160L160 160Z',f:skS},...bracer(148.5),...fist(157.5),
      ...(e.dagger?dagger:[{d:'M146 193Q157.5 190 169 193L169 197Q157.5 194 146 197Z',f:Tr},{d:'M146 193Q157.5 190 169 193',s:'rgba(255,255,255,.45)',w:.9},{d:C(157.5,195,1.6),f:e.gem},
      {d:e.serrated?serr():'M154 197L161 197L160.4 232L157.5 240L154.6 232Z',f:steel},{d:'M157.5 199V231',s:'#7d8792',w:1.4},{d:'M154.7 198L155.3 231',s:'#ffffff',w:.9},{d:'M160.4 198L160 231',s:'#5a6470',w:.8}])],
    lU:[{d:'M61 101Q42 100 36 122L36 147Q43 153 51 150L55 146L60 126Z',f:sk},{d:'M43 110Q36 120 36 132L36 147L41 148Q39 128 43 110Z',f:skL},
      {d:'M57 128Q55 138 53 147',s:skS,w:1.2},{d:'M50 147Q44 150 38 147',s:skD,w:1}],
    lF:[{d:'M52 144Q43 139 34 145L35 160L50 160Z',f:sk},{d:'M40 144Q34 147 35 160L40 160Z',f:skL},...bracer(34.5),...fist(42.5)]};
  const fa=[...eye(92,false),...eye(108,false),{d:E(92,51.6,5.4,1.6),f:mix(sk,'#5a3050',.2)},{d:E(108,51.6,5.4,1.6),f:mix(sk,'#5a3050',.2)},
    {d:'M86.4 47.2Q92 48.2 97.8 51.8',s:brow,w:2.4},{d:'M102.2 51.8Q108 48.2 113.6 47.2',s:brow,w:2.4},{d:'M98.4 46.6L99.4 51.4M101.6 46.6L100.6 51.4',s:skD,w:1},...nose,
    {d:'M93 63Q91 69 93.6 75.4M107 63Q109 69 106.4 75.4',s:skD,w:1.2},
    {d:E(100,75.6,5.6,2.4),f:'#2a0a0e'},{d:Rc(95.2,74.6,9.6,1.9),f:'#e6dccb'},{d:'M97.6 74.6V76.5M100 74.6V76.5M102.4 74.6V76.5',s:'#9a8e80',w:.6},
    {d:'M94 74.4Q100 72.6 106 74.4',s:lipD,w:1.2},{d:'M94.6 77.4Q100 78.8 105.4 77.4',s:lip,w:1}];
  if(PET){  // slimmer arms on narrower shoulders: squeeze each arm about its own line, and move the joints to match
    for(const k of['rU','rF'])rig[k]=rig[k].map(it=>({...it,m:[.8,0,0,1,18,0]}));
    for(const k of['lU','lF'])rig[k]=rig[k].map(it=>({...it,m:[.8,0,0,1,22,0]}));
    rig.J={rS:[138,108],rE:[143.6,146],lS:[62,108],lE:[56.4,146]}}
  return{base,rarm,weapon,rig,fa,
    fn:e.expr==='weary'?[...tiredEye(92),...tiredEye(108),{d:'M86.6 48.4Q92 47.6 97.2 50.8',s:brow,w:2.1},{d:'M102.8 50.8Q108 47.6 113.4 48.4',s:brow,w:2.1},{d:'M98.6 47.6L99.3 51.2M101.4 47.6L100.7 51.2',s:skS,w:.9},...nose,
      {d:'M94.6 75.6Q97 73.2 100 73.4Q103 73.2 105.4 75.6Q100 74.6 94.6 75.6Z',f:lipD},{d:'M95.8 76Q100 77.4 104.2 76Q100 75.6 95.8 76Z',f:lip},{d:'M94 75.4L93.3 76.6M106 75.4L106.7 76.6',s:skS,w:.9}]:
    [...eye(92,false),...eye(108,false),{d:'M87 49.5Q92 46.6 97 48.8',s:brow,w:e.fem?1.3:1.9},{d:'M103 48.8Q108 46.6 113 49.5',s:brow,w:e.fem?1.3:1.9},...nose,
      {d:'M94.5 73Q97 71.5 100 72.5Q103 71.5 105.5 73Q100 74 94.5 73Z',f:lipD},{d:'M95.5 73.6Q100 77.2 104.5 73.6Q100 74.6 95.5 73.6Z',f:lip},{d:Rc(98.8,74.8,2.2,.8),f:lipL},{d:'M94 73.2L93 74',s:skS,w:.8}],
    ff:[...eye(92,true),...eye(108,true),{d:'M87 47Q91 44 96.5 45.5',s:brow,w:e.fem?1.3:1.9},{d:'M103.5 45.5Q109 44 113 47',s:brow,w:e.fem?1.3:1.9},...nose,
      {d:E(100,74.5,4,3.2),f:'#3a0d12'},{d:Rc(97.2,71.6,5.6,1.3),f:'#efe8e0'},{d:'M95.5 74Q100 79 104.5 74',s:lip,w:1.2},
      {d:'M120 38q4 7 0 10q-4 -3 0 -10Z',f:'#9fd8ff'},{d:'M120.6 40.5q.6 2 0 3.5',s:'#ffffff',w:.7}],
    arm:PET?femArmour(A,K,Ad,Al,Tr,e):[
     [{d:'M30 118Q32 94 62 96L64 122Q46 126 30 118Z',f:A},{d:'M30 118Q46 128 64 124L63 132Q46 136 32 128Z',f:A},{d:'M34 108Q48 102 62 106',s:K,w:2},{d:'M36 103Q46 98 58 99',s:Al,w:2.5},
      {d:'M30 118Q46 126 64 122',s:Tr,w:2},{d:'M32 128Q46 134 63 131',s:Tr,w:1.5},{d:C(40,112,1.8),f:K},{d:C(54,108,1.8),f:K},{d:'M38 106Q44 102 50 103M40 110L46 106',s:mix(Tr,'#000000',.2),w:.8},
      {d:'M170 118Q168 94 138 96L136 122Q154 126 170 118Z',f:A},{d:'M170 118Q154 128 136 124L137 132Q154 136 168 128Z',f:A},{d:'M150 98Q168 102 170 118Q160 124 150 123Z',f:Ad},{d:'M166 108Q152 102 138 106',s:K,w:2},
      {d:'M142 99Q152 98 160 102',s:Al,w:2},{d:'M170 118Q154 126 136 122',s:Tr,w:2},{d:'M168 128Q154 134 137 131',s:Tr,w:1.5},{d:C(160,112,1.8),f:K},{d:C(146,108,1.8),f:K}],
     [{d:'M80 52Q80 21 100 21Q120 21 120 52L115 52Q114 34 100 34Q86 34 85 52Z',f:A},{d:'M104 22Q120 25 120 52L115 52Q115 36 104 34Z',f:Ad},{d:'M86 42Q87 28 97 24',s:Al,w:2.5},
      {d:'M100 21V34',s:K,w:1.8},{d:'M98.8 22V33',s:Al,w:1},{d:'M85 52Q86 34 100 34Q114 34 115 52',s:Tr,w:2.2},{d:'M90 26Q95 23 100 23M100 23Q105 23 110 26',s:mix(Tr,'#000000',.15),w:.9},
      {d:C(83,46,1.5),f:K},{d:C(117,46,1.5),f:K},{d:C(90,28,1.5),f:K},{d:C(110,28,1.5),f:K},
      {d:Rc(98,32,4,22),f:A},{d:Rc(98.4,33,1.2,20),f:Al},{d:Rc(100.8,33,1.2,20),f:Ad},{d:'M80 52L85 52L87 66L82 64Z',f:A},{d:'M120 52L115 52L113 66L118 64Z',f:A},{d:'M120 52L115 52L113 66L118 64Z',f:Ad},{d:C(83,57,1.2),f:K},{d:C(117,57,1.2),f:K}],
     [{d:Rc(64,136,72,10),f:A},{d:Rc(64,145,72,10),f:A},{d:Rc(64,154,72,10),f:A},{d:'M64 145.5H136M64 154.5H136M64 164H136',s:K,w:2},{d:'M66 137.5H134M66 146.8H134M66 156H134',s:Al,w:1.5},
      {d:Rc(118,136,18,28),f:Ad},{d:Rc(96,136,8,28),f:mix(e.cloth,'#000000',.2)},{d:Rc(95,148,10,6),f:Tr},{d:Rc(97.5,150,5,2),f:e.gem},
      {d:C(68,141,1.5),f:K},{d:C(132,141,1.5),f:K},{d:C(68,150,1.5),f:K},{d:C(132,150,1.5),f:K},{d:C(68,159,1.5),f:K},{d:C(132,159,1.5),f:K}],
     [{d:'M60 100Q100 90 140 100L136 136L64 136Z',f:A},{d:'M100 94Q122 94 140 100L136 136L100 136Z',f:Ad},{d:'M100 95V136',s:K,w:2},{d:'M98.4 96V135',s:Al,w:1.5},
      {d:'M70 112Q84 120 98 114M102 114Q116 120 130 112',s:K,w:1.5},{d:'M70 106Q84 100 96 101',s:Al,w:2.5},{d:'M72 124Q84 130 96 126',s:Al,w:1.5},
      {d:'M76 108Q80 112 84 108Q88 112 92 108M108 108Q112 112 116 108Q120 112 124 108',s:mix(Tr,'#000000',.15),w:.9},
      {d:'M60 100Q100 90 140 100',s:Tr,w:3},{d:'M64 136H136',s:Tr,w:2},{d:Rc(70,108,3,3),f:K},{d:Rc(127,108,3,3),f:K},{d:Rc(70,128,3,3),f:K},{d:Rc(127,128,3,3),f:K},
      {d:C(100,118,3),f:Tr},{d:C(100,118,1.8),f:e.gem}]]};
}
// gothic castle wall behind the enemy: stone pattern, arched window, wall sconce
const BW=160,BH=90,SCX=22,SCY=40;let bgStatic=null,flameT=0;
function backdrop(e){
  const c=document.createElement('canvas');c.width=BW;c.height=BH;const x=c.getContext('2d'),S=e.scene;
  let seed=[...e.name].reduce((a,ch)=>a*31+ch.charCodeAt(0)>>>0,7);const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
  const st=S.stone,mortar=mix(st,'#000000',.45);
  x.fillStyle=mortar;x.fillRect(0,0,BW,BH);
  for(let row=0;row*7<BH;row++){const off=row%2?-6:0;for(let col=-1;col*12<BW+12;col++){
    const bx=col*12+off,by=row*7,t=(rnd()-.5)*.16;x.fillStyle=t>0?mix(st,'#ffffff',t*.6):mix(st,'#000000',-t);x.fillRect(bx+1,by+1,11,6);
    x.fillStyle=mix(st,'#ffffff',.08);x.fillRect(bx+1,by+1,11,1);x.fillStyle=mix(st,'#000000',.25);x.fillRect(bx+1,by+6,11,1);
    if(rnd()<.18){x.fillStyle=mix(st,'#000000',.3);x.fillRect(bx+2+Math.floor(rnd()*8),by+2+Math.floor(rnd()*3),2,1)}}}
  // gothic arched window with tracery
  const wx=112,wy=8,ww=30,wh=58;x.fillStyle=mix(st,'#000000',.55);x.beginPath();x.moveTo(wx-3,wy+wh+3);x.lineTo(wx-3,wy+18);x.quadraticCurveTo(wx-3,wy-4,wx+ww/2,wy-7);x.quadraticCurveTo(wx+ww+3,wy-4,wx+ww+3,wy+18);x.lineTo(wx+ww+3,wy+wh+3);x.closePath();x.fill();
  const g=x.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,S.win[0]);g.addColorStop(.6,S.win[1]);g.addColorStop(1,S.win[2]);x.fillStyle=g;
  x.beginPath();x.moveTo(wx,wy+wh);x.lineTo(wx,wy+18);x.quadraticCurveTo(wx,wy-1,wx+ww/2,wy-3);x.quadraticCurveTo(wx+ww,wy-1,wx+ww,wy+18);x.lineTo(wx+ww,wy+wh);x.closePath();x.fill();
  x.fillStyle=mix(S.win[2],'#ffffff',.5);x.beginPath();x.arc(wx+21,wy+14,4,0,7);x.fill();
  x.fillStyle='#0b080d';x.fillRect(wx+ww/2-1,wy-2,2,wh+2);x.fillRect(wx,wy+30,ww,2);
  x.strokeStyle='#0b080d';x.lineWidth=1.5;x.beginPath();x.arc(wx+ww/2,wy+16,6,0,7);x.stroke();
  x.fillStyle=mix(st,'#ffffff',.15);x.fillRect(wx-4,wy+wh+2,ww+8,3);
  // light shaft on the floor area
  x.fillStyle='rgba(255,255,255,.04)';x.beginPath();x.moveTo(wx,wy+wh);x.lineTo(wx+ww,wy+wh);x.lineTo(wx+ww-30,BH);x.lineTo(wx-40,BH);x.closePath();x.fill();
  // pillar on the far left edge
  x.fillStyle=mix(st,'#000000',.2);x.fillRect(0,0,8,BH);x.fillStyle=mix(st,'#ffffff',.12);x.fillRect(6,0,1,BH);
  // vignette
  const v=x.createRadialGradient(BW*.45,BH*.55,BH*.3,BW*.45,BH*.55,BW*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.65)');x.fillStyle=v;x.fillRect(0,0,BW,BH);
  // sconce bracket
  x.fillStyle='#1a1214';x.fillRect(SCX-1,SCY,3,12);x.fillRect(SCX-4,SCY+10,9,2);x.fillRect(SCX-3,SCY-2,7,3);
  x.fillStyle='#6a5030';x.fillRect(SCX-3,SCY-2,7,1);x.fillStyle='#4a3420';x.fillRect(SCX-2,SCY+1,5,1);
  return c;
}
let bgAcc=1;
// the torch flickers at a low frame rate (12 fps, 8 in low effects): cheap, and it suits the pixel art
function drawBackdrop(dt){
  const bg=$('bg');if(!bgStatic||!bg)return;flameT+=dt;bgAcc+=dt;if(bgAcc<(typeof lowFx!=='undefined'&&lowFx?1/8:1/12))return;bgAcc=0;const x=bg.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(bgStatic,0,0);
  const fl=.85+.15*Math.sin(flameT*11)+.08*Math.sin(flameT*23.7),R=34*fl;
  const gl=x.createRadialGradient(SCX,SCY-6,2,SCX,SCY-6,R);gl.addColorStop(0,'rgba(255,170,70,.55)');gl.addColorStop(.4,'rgba(255,110,40,.18)');gl.addColorStop(1,'rgba(255,80,30,0)');
  x.globalCompositeOperation='lighter';x.fillStyle=gl;x.fillRect(0,0,BW,BH);x.globalCompositeOperation='source-over';
  const h=7+Math.round(2*Math.sin(flameT*9)),sway=Math.round(Math.sin(flameT*6));
  x.fillStyle='#c83a10';x.fillRect(SCX-2,SCY-3-h+3,5,h-1);x.fillStyle='#ff8a20';x.fillRect(SCX-1+sway,SCY-3-h+2,3,h-2);
  x.fillStyle='#ffe28a';x.fillRect(SCX+sway*0,SCY-5-Math.floor(h/2),1,Math.ceil(h/2));x.fillRect(SCX-1+sway,SCY-3-h+1,1,1);
  if(Math.sin(flameT*17)>.6){x.fillStyle='#ffb040';x.fillRect(SCX+sway*2,SCY-h-6,1,1)}
}
const PS=.9,PW=180,PH=153;
function raster(items,shade,vb){vb=vb||{w:200,h:170,ox:0,oy:0};const PW=Math.round(vb.w*PS),PH=Math.round(vb.h*PS);
  const cnv=document.createElement('canvas');cnv.width=PW;cnv.height=PH;const x=cnv.getContext('2d');
  x.setTransform(PS,0,0,PS,vb.tr?-vb.ox*PS:0,vb.tr?-vb.oy*PS:0);x.lineCap='round';x.lineJoin='round';
  for(const it of items){const p=new Path2D(it.d);if(it.m){x.save();x.transform(...it.m)}if(it.f){x.fillStyle=it.f;x.fill(p)}else{x.strokeStyle=it.s;x.lineWidth=it.w;x.stroke(p)}if(it.m)x.restore()}
  const im=x.getImageData(0,0,PW,PH),d=im.data,on=new Uint8Array(PW*PH);
  for(let i=0;i<PW*PH;i++){on[i]=d[i*4+3]>=110?1:0;d[i*4+3]=on[i]?255:0}
  if(shade){
    for(let y=0;y<PH;y++)for(let X=0;X<PW;X++){const i=y*PW+X;if(!on[i])continue;
      const up=y>0&&on[i-PW],lf=X>0&&on[i-1],dn=y<PH-1&&on[i+PW],dn2=y<PH-2&&on[i+2*PW],rt=X<PW-1&&on[i+1];
      let f=1;if(!up)f=1.3;else if(!lf)f=1.12;if(!dn)f=.6;else if(!dn2||!rt)f=.8;
      else if((X+y)%2===0&&y<PH-3&&!on[i+3*PW])f=.86;
      const wr=f>1?[255,232,190]:[46,26,70],k2=Math.min(1,Math.abs(f-1)*1.4);
      for(let k=0;k<3;k++)d[i*4+k]=Math.min(255,d[i*4+k]*(f>1?1:f)*(1-k2*.35)+wr[k]*k2*.35*(f>1?1:.6))}
    for(let i=0;i<PW*PH;i++){if(on[i])continue;const X=i%PW,y=(i-X)/PW;
      const nb=[X>0&&on[i-1]?i-1:-1,X<PW-1&&on[i+1]?i+1:-1,y>0&&on[i-PW]?i-PW:-1,y<PH-1&&on[i+PW]?i+PW:-1].filter(v=>v>=0);
      if(nb.length){const n=nb[0];d[i*4]=d[n*4]*.22+6;d[i*4+1]=d[n*4+1]*.16+3;d[i*4+2]=d[n*4+2]*.24+10;d[i*4+3]=255}}
  }
  // warm side light from the wall sconce (left), cool shadow on the far side
  for(let y=0;y<PH;y++)for(let X=0;X<PW;X++){const i=y*PW+X;if(!d[i*4+3])continue;const vx=X/PS+vb.ox,vy=y/PS+vb.oy,dist=Math.hypot(vx+70,vy-20);
    const L=Math.max(.5,Math.min(1.3,1.5-dist/250)),w=Math.max(0,Math.min(1,(L-.75)/.55)),cl=Math.max(0,(.82-L)/.32);
    d[i*4]=Math.min(255,d[i*4]*L+38*w);d[i*4+1]=Math.min(255,d[i*4+1]*L+14*w);d[i*4+2]=Math.min(255,d[i*4+2]*L*(1-.12*w)+22*cl)}
  if(shade)for(let y=0;y<PH;y++)for(let X=1;X<PW-1;X++){const i=y*PW+X;if(!on[i])continue;
    if(!on[i-1]&&X/PS+vb.ox<110){d[i*4]=Math.min(255,d[i*4]*.5+255*.5);d[i*4+1]=Math.min(255,d[i*4+1]*.5+170*.5);d[i*4+2]=d[i*4+2]*.5+80*.5}
    else if(!on[i+1]&&X/PS+vb.ox>90){d[i*4]=d[i*4]*.75+120*.25;d[i*4+1]=d[i*4+1]*.75+140*.25;d[i*4+2]=d[i*4+2]*.75+220*.25}}
  x.putImageData(im,0,0);return cnv;
}
// Vesper, Morwen's familiar: a black cat with violet eyes and a ribbon collar, crouched to pounce
function catArt(){const B='#16121c',B2='#221a2a',hl='#3a2e48',eye='#c89aff';
  const it=[{d:'M80 100Q104 98 106 78Q108 64 98 62Q102 76 94 86Q86 94 78 92Z',f:B},{d:'M98 64Q104 70 102 80',s:hl,w:1.2},
    {d:E(66,90,24,18),f:B},{d:'M48 84Q60 76 82 78',s:hl,w:1.4},{d:E(58,96,12,12),f:B2},
    {d:E(50,62,17,15),f:B},{d:'M36 54L37 36L49 48Z',f:B},{d:'M54 46L63 31L67 50Z',f:B},{d:'M38.5 50L39 40L46 47Z',f:'#4a2a4a'},{d:'M57 46L62 36L64.5 48Z',f:'#4a2a4a'},
    {d:'M40 52Q48 48 58 50',s:hl,w:1.2},
    {d:E(44,61,3.6,2.8),f:eye},{d:E(56,61,3.6,2.8),f:eye},{d:Rc(43.5,58.8,1,4.4),f:'#1a0a2a'},{d:Rc(55.5,58.8,1,4.4),f:'#1a0a2a'},{d:Rc(42.6,59.6,.9,.9),f:'#ffffff'},{d:Rc(54.6,59.6,.9,.9),f:'#ffffff'},
    {d:'M48.6 67L51.4 67L50 68.8Z',f:'#8a4a6a'},{d:'M47 69L36 67M47 70L37 72M53 69L64 67M53 70L63 72',s:'#6a5a7a',w:.6},
    {d:'M38 74Q50 80 62 74',s:'#6a3aa0',w:2.4},{d:C(50,79,2.2),f:'#d4c27a'},{d:C(50,79,1.1),f:'#9a5ae0'},
    {d:E(52,107,6,3.4),f:B},{d:E(66,107,6,3.4),f:B},{d:E(82,106,6,3.2),f:B}];
  const c=raster(it,true,{w:120,h:120,ox:0,oy:0});return c}
function archerArt(){
  const sk='#e2b896',skS=mix(sk,'#5a3050',.25),hr='#8a3a1a',hrD=mix(hr,'#000000',.4),jk='#6a4426',jkD=mix(jk,'#000000',.4),jkL=mix(jk,'#ffffff',.18),bow='#4a2a12',str='#e8dcc0',K='#2a1a10';
  const it=[{d:'M40 120Q40 96 46 86L74 86Q80 96 80 120Z',f:'#3a2a1a'},
    {d:'M44 64Q40 76 42 92L48 92L50 66Z',f:sk},{d:'M76 64Q86 70 96 66L98 72Q86 78 74 72Z',f:sk},
    {d:'M46 60Q60 54 74 60L76 92Q60 98 44 92Z',f:jk},{d:'M60 58L60 94',s:jkD,w:1.2},{d:'M50 64Q60 60 70 64',s:jkL,w:1},{d:'M46 80H76',s:jkD,w:2},{d:Rc(57,78,6,4),f:'#b08a3a'},
    {d:'M52 62L56 70M68 62L64 70',s:jkD,w:1},{d:Rc(54,50,12,10),f:sk},{d:E(60,42,9,11),f:sk},{d:'M64 34Q69 40 69 46Q68 52 64 54Q66 44 64 34Z',f:skS},
    {d:'M51 42Q50 30 60 29Q70 30 69 42Q66 34 60 34Q54 34 51 42Z',f:hr},{d:'M68 36Q74 48 72 70Q70 76 68 70Q70 50 66 38Z',f:hr},{d:'M70 46Q72 58 70 68',s:hrD,w:1},
    {d:Rc(55,41,3,1.6),f:'#2a1a10'},{d:Rc(62,41,3,1.6),f:'#2a1a10'},{d:'M57 49Q60 50 63 49',s:'#8a3a3a',w:1},
    {d:'M98 30Q112 70 98 110',s:bow,w:3},{d:'M98 30Q110 70 98 110',s:mix(bow,'#ffffff',.25),w:1},{d:'M98 30L84 70L98 110',s:str,w:.8},
    {d:'M84 70L110 70',s:'#6a4a2a',w:1.3},{d:'M110 67L116 70L110 73Z',f:'#c9d0d8'},{d:'M84 67L80 66M84 73L80 74',s:'#c84a2a',w:1.5},
    {d:'M38 56L50 74',s:'#3a2414',w:4},{d:'M36 52L40 58M38 50L43 56',s:'#c84a2a',w:1.5}];
  return raster(it,true,{w:130,h:130,ox:-200,oy:0});
}
