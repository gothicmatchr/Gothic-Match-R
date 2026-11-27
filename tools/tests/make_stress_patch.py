"""Regenerate stress.patch against the current js/game.js (run after editing game.js).
Keeps the bot API at the end of the old patch and the two counters on enemyMove/runLackey."""
import os, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
pt = open(os.path.join(HERE, 'stress.patch')).read()
api = '\n'.join(l[1:] for l in pt[pt.index('+\n+window.__api'):].splitlines())
g = open(os.path.join(ROOT, 'js', 'game.js')).read()
g2 = g.replace('function enemyMove(){', 'function enemyMove(){window.__pt=(window.__pt||0)+1;', 1).replace('function runLackey(){', 'function runLackey(){window.__lk=(window.__lk||0)+1;', 1)
g2 = g2.rstrip('\n') + '\n' + api + '\n'
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f: f.write(g2); tmp = f.name
d = subprocess.run(['diff', '-u', '--label', 'game.bak.js', '--label', 'gs_stress/js/game.js', os.path.join(ROOT, 'js', 'game.js'), tmp], capture_output=True, text=True).stdout
open(os.path.join(HERE, 'stress.patch'), 'w').write(d); os.unlink(tmp); print('stress.patch updated,', d.count('\n@@'), 'hunks')
