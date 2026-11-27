// Frame-time test under CDP CPU throttling on a phone-sized viewport.
// Copies the game to a temp dir, injects perf_hook.js after js/game.js, and measures idle and busy frames.
// Usage: node tools/tests/perf.js [chrome_path]   (defaults to Playwright's bundled Chromium)
const fs=require('fs'),os=require('os'),path=require('path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..');
const stats=ft=>{const d=ft.slice(1).map((t,i)=>t-ft[i]).sort((a,b)=>a-b),m=d.reduce((a,b)=>a+b,0)/d.length;
  return `mean ${m.toFixed(1)} p95 ${d[Math.floor(d.length*.95)].toFixed(1)} slow ${Math.round(d.filter(x=>x>33.4).length/d.length*100)}%`};
const dst=fs.mkdtempSync(path.join(os.tmpdir(),'gs_perf_'));
for(const n of['index.html','js','css','fonts','audio'])fs.cpSync(path.join(ROOT,n),path.join(dst,n),{recursive:true});
fs.copyFileSync(path.join(__dirname,'perf_hook.js'),path.join(dst,'js','perf_hook.js'));
const ix=path.join(dst,'index.html');fs.writeFileSync(ix,fs.readFileSync(ix,'utf8').replace('<script src="js/game.js"></script>','<script src="js/game.js"></script>\n<script src="js/perf_hook.js"></script>'));
(async()=>{const b=await chromium.launch(process.argv[2]?{executablePath:process.argv[2]}:{});
  for(const rate of[1,4,6]){const pg=await b.newPage({viewport:{width:393,height:851},deviceScaleFactor:2.75});
    const cdp=await pg.context().newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    const errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto('file://'+ix+(process.env.LOW?'#low':''));await pg.waitForFunction('window.__ft&&window.__ft.length>5');
    await pg.waitForTimeout(2500);await pg.evaluate('window.__ft=[]');await pg.waitForTimeout(3000);const idle=stats(await pg.evaluate('window.__ft'));
    await pg.evaluate('window.__ft=[];__busy(3000)');await pg.waitForTimeout(3000);const busy=stats(await pg.evaluate('window.__ft'));
    const lf=await pg.evaluate("typeof lowFx!=='undefined'?lowFx:'n/a'");
    console.log(`cpu x${rate} | idle ${idle} | busy ${busy} | lowFx ${lf}${errs.length?' | ERRORS '+errs.join('; '):''}`);await pg.close()}
  await b.close();fs.rmSync(dst,{recursive:true,force:true})})();
