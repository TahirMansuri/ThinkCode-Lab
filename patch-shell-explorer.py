#!/usr/bin/env python3
"""Run from the CodeForge project root:  python3 patch-shell-explorer.py
Linux shell: half-window file explorer (folders/files), richer sample filesystem, tap = runs cd / cat in the terminal,
plus `bash script.sh` and `./script.sh` support. Note: uses a new storage key, so old saved shell files are replaced by the samples."""
import re, sys
bad = 0
def edit(path, old, new, rx=False):
    global bad
    s = open(path, encoding='utf-8').read()
    ok = re.search(old, s, re.S) if rx else (old in s)
    if not ok: print('MISSING in', path, '->', old[:55]); bad += 1; return
    s = re.sub(old, lambda m: new, s, count=1, flags=re.S) if rx else s.replace(old, new, 1)
    open(path, 'w', encoding='utf-8').write(s); print('ok  ', path)

# ---------- src/engines/shell.js ----------
SAMPLE = r'''const KEY = 'cf.vfs2';
const SAMPLE = {
  'home/student/README.txt': 'Welcome to the CodeForge Linux lab!\n\nTry these:\n  ls -l\n  cd documents\n  cat notes.txt\n  grep -n linux notes.txt\n  wc -l ../data/students.csv\n  bash ../projects/hello.sh\n',
  'home/student/hello.txt': 'Hello from CodeForge!\nEverything here runs offline.\n',
  'home/student/.bashrc': '# hidden file - show it with: ls -a\nexport PS1="student$ "\n',
  'home/student/documents/notes.txt': 'Linux is a free, open-source operating system.\nlinux commands are case sensitive.\nThe shell reads and runs your commands.\nPractice makes perfect.\n',
  'home/student/documents/todo.txt': 'buy notebook\nfinish DBMS lab\nrevise linux commands\nsubmit assignment\n',
  'home/student/projects/hello.sh': '#!/bin/bash\nname="World"\necho "Hello, $name!"\nfor i in 1 2 3; do\n  echo "Count: $i"\ndone\n',
  'home/student/projects/web/index.html': '<h1>My page</h1>\n<p>Hello!</p>\n',
  'home/student/projects/web/style.css': 'body { font-family: sans-serif; }\n',
  'home/student/data/students.csv': 'id,name,city,marks\n1,Aarav,Nashik,82\n2,Diya,Pune,91\n3,Rohan,Nashik,58\n4,Sneha,Mumbai,85\n5,Imran,Pune,49\n6,Priya,Mumbai,95\n',
  'home/student/data/words.txt': 'banana\napple\ncherry\napple\nbanana\napple\n',
  'home/student/data/server.log': 'INFO  start\nINFO  user login\nERROR disk full\nINFO  user logout\nERROR timeout\nWARN  slow response\n',
  'etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\n'
};
function sampleFs() {
  const fs = { '/': { d: 1 } };
  const dir = p => { let c = ''; for (const s of p.split('/').filter(Boolean)) { c += '/' + s; fs[c] ??= { d: 1 }; } };
  for (const [p, c] of Object.entries(SAMPLE)) { dir(p.split('/').slice(0, -1).join('/')); fs['/' + p] = { c }; }
  ['tmp', 'home/student/pictures', 'home/student/trash'].forEach(dir);
  return fs;
}'''
S = 'src/engines/shell.js'
edit(S, "const KEY = 'cf.vfs';", SAMPLE)
edit(S, r"return \{ '/': \{ d: 1 \}.*?\};", "return sampleFs();", rx=True)
edit(S, r"""catch (e) { sink.err('shell error: ' + e.message + '\n'); }
    this.save();""", r"""catch (e) { sink.err('shell error: ' + e.message + '\n'); }
    this.save(); if (this.onChange) this.onChange();""")
edit(S, "this.fs = this.load(); this.env.PWD = this.env.HOME; }", "this.fs = this.load(); this.env.PWD = this.env.HOME; if (this.onChange) this.onChange(); }")
edit(S, "case 'chmod': case 'sleep': case 'true': return o('');", """case 'bash': case 'sh': { const r = this.read(rest[0]); if (r.err) return fail('bash: ' + r.err, 127); return this.script(r.c); }
      case 'chmod': case 'sleep': case 'true': return o('');""")
edit(S, "default: return fail(`${name}: command not found`, 127);", "default: { const p = name.includes('/') ? this.abs(name) : null; if (p && this.fs[p] && !this.fs[p].d) { return this.script(this.fs[p].c); } return fail(`${name}: command not found`, 127); }")

edit(S, "  run(script, sink, stdin = '') {", r'''  script(t) { const old = this.sink; let buf = ''; this.sink = { ...old, out: s => (buf += s), err: s => old.err(s) }; try { this.runLines(this.logical(t)); } finally { this.sink = old; } return { o: buf, c: this.code }; }
  run(script, sink, stdin = '') {''')

# ---------- src/shell-ui.js (new file) ----------
open('src/shell-ui.js', 'w', encoding='utf-8').write(r'''// File explorer for the Linux shell: reads the virtual filesystem; tapping runs the matching command.
let C, lastPwd = '', open = new Set(['/home', '/home/student']);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const size = n => (n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB');
function kids(fs, dir) {
  const pre = dir === '/' ? '/' : dir + '/';
  return Object.keys(fs).filter(k => k !== dir && k.startsWith(pre) && !k.slice(pre.length).includes('/'))
    .sort((a, b) => (!!fs[b].d - !!fs[a].d) || a.localeCompare(b));
}
function rel(sh, path) {
  const pwd = sh.env.PWD, home = sh.env.HOME, pre = pwd === '/' ? '/' : pwd + '/';
  if (path.startsWith(pre)) return path.slice(pre.length);
  if (path === home) return '~';
  return path.startsWith(home + '/') ? '~/' + path.slice(home.length + 1) : path;
}
export const shellui = {
  init(ctx) { C = ctx; C.sh.onChange = () => this.render(); },
  render() {
    const box = document.getElementById('fileTree'); if (!box || !C) return;
    const sh = C.sh, fs = sh.fs, pwd = sh.env.PWD, top = box.scrollTop;
    if (pwd !== lastPwd) { let c = ''; for (const s of pwd.split('/').filter(Boolean)) { c += '/' + s; open.add(c); } lastPwd = pwd; }
    box.textContent = '';
    const head = el('div', 'ft-head');
    head.append(el('b', '', pwd.replace(sh.env.HOME, '~') || '/'));
    for (const [label, cmd] of [['..', 'cd ..'], ['~', 'cd ~']]) { const b = el('button', 'tool', label); b.onclick = () => C.cmd(cmd); head.append(b); }
    box.append(head, el('div', 'ft-hint', 'Tap a folder to cd · tap a file to cat · ▸ expands'));
    const walk = (dir, depth) => {
      for (const p of kids(fs, dir)) {
        if (p.split('/').pop().startsWith('.') && !open.has('.all')) continue;
        const dirNode = !!fs[p].d, r = el('div', 'ft-row' + (p === pwd ? ' cur' : ''));
        r.style.paddingLeft = 12 + depth * 16 + 'px';
        const chev = el('span', 'ft-chev', dirNode ? (open.has(p) ? '▾' : '▸') : '');
        if (dirNode) chev.onclick = e => { e.stopPropagation(); open.has(p) ? open.delete(p) : open.add(p); this.render(); };
        r.append(chev, el('span', 'ft-name' + (dirNode ? ' dir' : ''), p.split('/').pop() + (dirNode ? '/' : '')),
          el('span', 'ft-meta', dirNode ? kids(fs, p).length + ' items' : size(fs[p].c.length)));
        r.onclick = () => C.cmd(dirNode ? `cd ${rel(sh, p)}` : `cat ${rel(sh, p)}`);
        box.append(r);
        if (dirNode && open.has(p)) walk(p, depth + 1);
      }
    };
    walk('/', 0); box.scrollTop = top;
  }
};
''')
print('ok   src/shell-ui.js (new)')

# ---------- index.html / main.js / styles.css ----------
edit('index.html', '<div id="console"', '<div id="fileTree" class="ftree" hidden></div>\n    <div id="console"')
M = 'src/main.js'
edit(M, "import { sqlui } from './sql-ui.js';", "import { sqlui } from './sql-ui.js';\nimport { shellui } from './shell-ui.js';")
edit(M, "function applyLang() {", "let wasShell = false;\nfunction applyLang() {")
edit(M, "$('tabSchema').hidden = cur.id !== 'sql';", "$('tabSchema').hidden = cur.id !== 'sql'; $('fileTree').hidden = cur.id !== 'shell'; if (cur.id === 'shell') shellui.render();\n  if ((cur.id === 'shell') !== wasShell) { wasShell = cur.id === 'shell'; setSplit(wasShell ? 34 : 52); }")
edit(M, "sqlui.init({", """function shellCmd(line) { print(`${engines.shell.sh.prompt} ${line}\\n`, 'cmd'); engines.shell.exec(line, sink); $('promptLabel').textContent = engines.shell.sh.prompt; }
shellui.init({ sh: engines.shell.sh, cmd: shellCmd });
sqlui.init({""")
edit('src/styles.css', ".tablewrap {" if False else "/* action dock */", """/* shell explorer */
.promptbar input { min-width: 0; width: 100%; }
.ftree { flex: 1 1 0; min-height: 0; overflow: auto; padding-bottom: 6px; border-bottom: 1px solid var(--line); font: 12.5px var(--mono); }
.ftree:not([hidden]) ~ .console { flex: 1 1 0; }
.ft-head { display: flex; align-items: center; gap: 8px; padding: 8px 12px 2px; }
.ft-head b { flex: 1; color: var(--ember); font: 600 12.5px var(--mono); }
.ft-hint { padding: 0 12px 6px; color: var(--mute); font: 11.5px var(--ui); }
.ft-row { display: flex; align-items: center; gap: 6px; padding: 5px 12px; white-space: nowrap; cursor: pointer; }
.ft-row:hover { background: var(--raised); }
.ft-row.cur { background: color-mix(in srgb, var(--ember) 14%, transparent); }
.ft-chev { width: 14px; color: var(--mute); font-size: 11px; text-align: center; }
.ft-name.dir { color: var(--syn-fn); font-weight: 600; }
.ft-meta { margin-left: auto; padding-left: 14px; color: var(--mute); font-size: 11px; }
/* action dock */""")
print('DONE' if not bad else f'{bad} edit(s) missing — send me that message'); sys.exit(1 if bad else 0)
