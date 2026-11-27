from playwright.sync_api import sync_playwright
import statistics
def stats(ft):
    d=[b-a for a,b in zip(ft,ft[1:])]
    d=sorted(d);return round(statistics.mean(d),1),round(d[int(len(d)*.95)],1),round(sum(1 for x in d if x>33.4)/len(d)*100)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for rate in (1,4,6):
        pg=b.new_page(viewport={'width':393,'height':851},device_scale_factor=2.75)
        cdp=pg.context.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':rate})
        t0=__import__('time').time();pg.goto('file:///tmp/gs_perf/index.html');pg.wait_for_function("window.__ft&&window.__ft.length>5");load=round((__import__('time').time()-t0)*1000)
        pg.wait_for_timeout(2500);pg.evaluate("window.__ft=[]");pg.wait_for_timeout(3000);idle=stats(pg.evaluate("window.__ft"))
        pg.evaluate("window.__ft=[];__busy()");pg.wait_for_timeout(3000);busy=stats(pg.evaluate("window.__ft"))
        print(f'cpu x{rate}: load {load}ms | idle mean/p95 ms, %frames>33ms {idle} | busy {busy}')
        pg.close()
    b.close()
