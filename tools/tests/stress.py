from playwright.sync_api import sync_playwright
import json,sys
runs=int(sys.argv[1]) if len(sys.argv)>1 else 3
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for run in range(runs):
        pg=b.new_page(viewport={'width':393,'height':780})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.add_init_script(path='/tmp/vclock.js')
        pg.goto('file:///tmp/gs_stress2/index.html')
        seen=set();stats={};same=0;last=None;stuck=[];battles=0;actions=0
        for step in range(2500):
            pg.evaluate("__tick(10)")
            s=pg.evaluate("__api.s")
            if s['state']=='over':
                battles+=1;pg.evaluate("__api.click('[data-act=kill],[data-act=spare],[data-act=retry]')");pg.evaluate("__tick(5)");pg.evaluate("__api.click('[data-act=next]')");continue
            a=pg.evaluate("__api.act()");stats[a]=stats.get(a,0)+1
            seen.add(s['state']);key=(s['state'],s['phase'])
            if key==last and s['state']!='idle':same+=1
            else:same=0
            last=key
            if same>150:stuck.append(dict(s));same=0
            if a=='nomove' and s['state']=='idle':stuck.append({'nomove':s})
        err=pg.evaluate("window.__err||''")
        print('run',run,'battles',battles,'actions',stats,'final',pg.evaluate("__api.s"))
        print(' states seen',sorted(seen));print(' pageerrors',errs[:3]);print(" caught",err[:800]);print(" chains",pg.evaluate("window.__chain.length"),pg.evaluate("window.__chain.slice(0,6)"),"prompt hidden",pg.evaluate("document.getElementById(\"prompt\").hidden"));print(" stuck",stuck[:3])
        pg.close()
    b.close()
