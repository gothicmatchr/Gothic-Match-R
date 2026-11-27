// Balance simulator: a greedy bot plays full battles on a virtual clock and reports how hard each enemy is.
// Usage: node tools/tests/balance.js [battlesPerEnemy=4]
const fs=require('fs'),os=require('os'),path=require('path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..'),N=+process.argv[2]||4;
const dst=fs.mkdtempSync(path.join(os.tmpdir(),'gs_bal_'));
for(const n of['index.html','js','css','fonts','audio'])fs.cpSync(path.join(ROOT,n),path.join(dst,n),{recursive:true});
fs.copyFileSync(path.join(__dirname,'balance_bot.js'),path.join(dst,'js','balance_bot.js'));
const ix=path.join(dst,'index.html');fs.writeFileSync(ix,fs.readFileSync(ix,'utf8').replace('<script src="js/game.js"></script>','<script src="js/game.js"></script>\n<script src="js/balance_bot.js"></script>'));
(async()=>{const b=await chromium.launch();const rows=[];
  const FOE=process.env.FOE!==undefined?+process.env.FOE:-1;
  for(let fi=0;fi<4;fi++)if(FOE<0||FOE===fi)for(let k=0;k<N;k++){const pg=await b.newPage({viewport:{width:393,height:780}});
    await pg.addInitScript({path:path.join(__dirname,'vclock.js')});if(process.env.STEAL)await pg.addInitScript(`window.__STEAL=${+process.env.STEAL}`);await pg.goto('file://'+ix);
    await pg.evaluate(f=>{window.__tick(20);fi=f;if(window.__STEAL!==undefined)FOES[1].steal=window.__STEAL;battle();Object.assign(__bal,{pt:0,et:0,falls:0,minHp:100,taken:0,foeHeal:0,maxHit:0,hits:[],gold0:money})},fi);
    let res='timeout';for(let s=0;s<6000;s++){await pg.evaluate(()=>{__tick(8);__botAct()});
      const st=await pg.evaluate(()=>state);if(st==='over'){res=await pg.evaluate(()=>hp<=0?'LOSE':'win '+armDur.filter(d=>d<=0).length+'/4 armour');break}}
    const r=await pg.evaluate(()=>({...__bal,gold:money-__bal.gold0,hits:undefined,avgHit:__bal.hits.length?Math.round(__bal.hits.reduce((a,b)=>a+b,0)/__bal.hits.length):0,err:window.__err||''}));
    rows.push({foe:['Varro','Morwen','Oren','Dask'][fi],res,...r});await pg.close()}
  await b.close();fs.rmSync(dst,{recursive:true,force:true});
  for(const r of rows)console.log(`${r.foe.padEnd(7)} ${r.res.padEnd(16)} myTurns ${String(r.pt).padStart(3)} foeTurns ${String(r.et).padStart(3)} dmgTaken ${String(r.taken).padStart(4)} avgHit ${String(r.avgHit).padStart(3)} maxHit ${String(r.maxHit).padStart(3)} falls ${r.falls} minHp ${r.minHp} foeHealed ${r.foeHeal} crush ${r.crush||0} gold ${r.gold} familiar ${r.fam||0}${r.err?' ERR '+r.err.slice(0,200):''}`)})();
