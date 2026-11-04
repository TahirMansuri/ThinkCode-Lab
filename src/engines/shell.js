// Offline bash-style shell: virtual filesystem, pipes, redirects, variables, if/for/while, $(..), $((..)).
const KEY = 'cf.vfs2';
const SAMPLE = {
  'home/student/README.txt': 'Welcome to the ThinkCode Linux lab!\n\nTry these:\n  ls -l\n  cd documents\n  cat notes.txt\n  grep -n linux notes.txt\n  wc -l ../data/students.csv\n  bash ../projects/hello.sh\n',
  'home/student/hello.txt': 'Hello from ThinkCode Lab!\nEverything here runs offline.\n',
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
}
const HELP = `Commands: ls cd pwd cat echo printf mkdir touch rm rmdir cp mv head tail wc grep sort uniq cut tr find
          date whoami hostname uname env export read seq expr test [ basename dirname tee chmod clear help
Syntax:   cmd1 | cmd2   > >> <   && || ;   VAR=1  $VAR  $(cmd)  $((1+2))
          if/elif/else/fi   for x in ..; do ..; done   while [ .. ]; do ..; done`;

export class Shell {
  constructor() {
    this.env = { USER: 'student', HOME: '/home/student', PWD: '/home/student', SHELL: '/bin/bash', HOSTNAME: 'forge' };
    this.fs = this.load(); this.code = 0; this.stdin = []; this.sink = { out() {}, err() {} };
  }
  load() {
    try { const j = JSON.parse(localStorage.getItem(KEY)); if (j) return j; } catch {}
    return sampleFs();
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.fs)); } catch {} }
  reset() { localStorage.removeItem(KEY); this.fs = this.load(); this.env.PWD = this.env.HOME; if (this.onChange) this.onChange(); }
  get prompt() { return `${this.env.USER}@forge:${this.env.PWD.replace(this.env.HOME, '~')}$`; }

  // ---------- paths ----------
  abs(p) {
    if (p === '~' || p.startsWith('~/')) p = this.env.HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : this.env.PWD + '/' + p).split('/'), out = [];
    for (const s of parts) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
    return '/' + out.join('/');
  }
  kids(dir) {
    const pre = dir === '/' ? '/' : dir + '/';
    return Object.keys(this.fs).filter(k => k !== dir && k.startsWith(pre) && !k.slice(pre.length).includes('/')).sort();
  }
  glob(pat) {
    if (!/[*?]/.test(pat)) return [pat];
    const i = pat.lastIndexOf('/'), dir = i < 0 ? this.env.PWD : this.abs(pat.slice(0, i) || '/'), name = pat.slice(i + 1);
    const re = new RegExp('^' + name.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const m = this.kids(dir).map(k => k.split('/').pop()).filter(n => re.test(n) && !n.startsWith('.'));
    return m.length ? m.map(n => (i < 0 ? n : pat.slice(0, i + 1) + n)) : [pat];
  }

  // ---------- parsing ----------
  splitTop(s, ops) {
    const parts = [], found = []; let cur = '', q = null, depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
      if (ch === '(') depth++; if (ch === ')') depth--;
      const op = depth === 0 && ops.find(o => s.startsWith(o, i));
      if (op) { parts.push(cur); found.push(op); cur = ''; i += op.length - 1; } else cur += ch;
    }
    parts.push(cur); return { parts, found };
  }
  logical(script) {
    const out = []; let cur = '', q = null, depth = 0;
    const push = () => { const t = cur.trim(); if (t && !t.startsWith('#')) out.push(t); cur = ''; };
    for (let i = 0; i < script.length; i++) {
      const ch = script[i];
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
      if (ch === '(') depth++; if (ch === ')') depth--;
      if (ch === '#' && (i === 0 || /\s/.test(script[i - 1]))) { while (i < script.length && script[i] !== '\n') i++; push(); continue; }
      if ((ch === '\n' || ch === ';') && depth === 0) push(); else cur += ch;
    }
    push();
    const res = [];
    for (const l of out) { const m = l.match(/^(then|do|else)\s+(.+)$/); if (m) res.push(m[1], m[2]); else res.push(l); }
    return res;
  }
  parse(L, i, stop) {
    const body = [];
    while (i < L.length) {
      const s = L[i], w = s.split(/\s+/)[0];
      if (stop.includes(w)) break;
      if (w === 'if') {
        const n = { t: 'if', br: [], el: null }; let cond = s.slice(2).trim(); i++;
        for (;;) {
          if (L[i] === 'then') i++;
          const r = this.parse(L, i, ['elif', 'else', 'fi']); n.br.push({ c: cond, b: r.body }); i = r.i;
          const k = (L[i] || 'fi').split(/\s+/)[0];
          if (k === 'elif') { cond = L[i].slice(4).trim(); i++; continue; }
          if (k === 'else') { const r2 = this.parse(L, i + 1, ['fi']); n.el = r2.body; i = r2.i; }
          break;
        }
        i++; body.push(n);
      } else if (w === 'for' || w === 'while' || w === 'until') {
        const n = { t: w, h: s.slice(w.length).trim() }; i++;
        if (L[i] === 'do') i++;
        const r = this.parse(L, i, ['done']); n.b = r.body; i = r.i + 1; body.push(n);
      } else { body.push({ t: 'cmd', s }); i++; }
    }
    return { body, i };
  }

  // ---------- expansion ----------
  arith(e) {
    e = e.replace(/\$?([A-Za-z_]\w*)/g, (m, v) => (this.env[v] !== undefined && /^-?\d+$/.test(this.env[v]) ? this.env[v] : '0'));
    if (!/^[\d\s+\-*/%()]+$/.test(e)) return '0';
    try { return String(Math.trunc(Function('"use strict";return (' + e + ')')())); } catch { return '0'; }
  }
  tokenize(s) {
    const toks = []; let w = '', has = false, q = null, quoted = false;
    const flush = () => { if (has) toks.push({ w, quoted }); w = ''; has = false; quoted = false; };
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q === "'") { if (ch === "'") q = null; else w += ch; continue; }
      if (ch === '\\' && i + 1 < s.length) { w += s[++i]; has = true; continue; }
      if (q !== '"' && (ch === "'" || ch === '"')) { q = ch; has = quoted = true; continue; }
      if (q === '"' && ch === '"') { q = null; continue; }
      if (ch === '$') {
        if (s.startsWith('$((', i)) { const e = this.match(s, i + 1); w += this.arith(s.slice(i + 3, e - 1)); i = e; has = true; continue; }
        if (s[i + 1] === '(') { const e = this.match(s, i + 1); w += this.capture(s.slice(i + 2, e)); i = e; has = true; continue; }
        const m = s.slice(i + 1).match(/^(\{(\w+)\}|\?|[A-Za-z_]\w*)/);
        if (m) { const k = m[2] || m[1]; w += k === '?' ? this.code : (this.env[k] ?? ''); i += m[0].length; has = true; continue; }
      }
      if (!q && /\s/.test(ch)) { flush(); continue; }
      if (!q && (ch === '>' || ch === '<')) {
        let op = ch; if (ch === '>' && s[i + 1] === '>') { op = '>>'; i++; }
        if (w === '2' && !quoted) { op = '2' + op; w = ''; has = false; } else flush();
        if (op === '2>' && s[i + 1] === '&') { toks.push({ w: '2>&1', op: true }); i += 2; continue; }
        toks.push({ w: op, op: true }); continue;
      }
      w += ch; has = true;
    }
    flush(); return toks;
  }
  match(s, i) { let d = 0; for (; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')' && --d === 0) return i; } return s.length; }
  capture(cmd) {
    const old = this.sink; let buf = ''; this.sink = { out: t => (buf += t), err: t => old.err(t) };
    this.runLines(this.logical(cmd)); this.sink = old; return buf.replace(/\n+$/, '');
  }
  words(str) { return this.tokenize(str).flatMap(t => (t.quoted ? [t.w] : this.glob(t.w))); }

  // ---------- execution ----------
  runLines(L) { this.runBlock(this.parse(L, 0, []).body); }
  runBlock(nodes) {
    for (const n of nodes) {
      if (this.halt) return;
      if (n.t === 'cmd') this.stmt(n.s);
      else if (n.t === 'if') { const b = n.br.find(x => (this.stmt(x.c), this.code === 0)); if (b) this.runBlock(b.b); else if (n.el) this.runBlock(n.el); }
      else if (n.t === 'for') {
        const m = n.h.match(/^(\w+)\s+in\s*(.*)$/); if (!m) continue;
        for (const v of this.words(m[2]).flatMap(x => x.split(/\s+/).filter(Boolean))) { this.env[m[1]] = v; this.runBlock(n.b); if (this.halt) return; }
      } else {
        for (let c = 0; c < 10000; c++) { this.stmt(n.h); if ((this.code === 0) === (n.t === 'until')) break; this.runBlock(n.b); if (this.halt) return; }
      }
    }
  }
  stmt(s) {
    const { parts, found } = this.splitTop(s, ['&&', '||']);
    this.pipeline(parts[0]);
    for (let i = 0; i < found.length; i++) {
      if ((found[i] === '&&') === (this.code === 0)) this.pipeline(parts[i + 1]);
    }
  }
  pipeline(s) {
    s = s.trim(); if (!s) return;
    const segs = this.splitTop(s, ['|']).parts; let input = '';
    segs.forEach((seg, idx) => {
      const toks = this.tokenize(seg.trim());
      if (toks.length === 1 && /^[A-Za-z_]\w*=/.test(toks[0].w) && !toks[0].op) { const k = toks[0].w.indexOf('='); this.env[toks[0].w.slice(0, k)] = toks[0].w.slice(k + 1); this.code = 0; return; }
      const args = []; let outF = null, app = false, inF = null, errNull = false;
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i];
        if (t.op) {
          if (t.w === '2>&1') continue;
          const tgt = toks[++i]?.w; if (t.w === '>' || t.w === '>>') { outF = tgt; app = t.w === '>>'; } else if (t.w === '<') inF = tgt; else errNull = true;
        } else if (t.quoted) args.push(t.w); else args.push(...this.glob(t.w));
      }
      if (inF) { const f = this.fs[this.abs(inF)]; input = f ? f.c : ''; }
      const r = this.cmd(args[0], args.slice(1), input);
      if (r.e && !errNull) this.sink.err(r.e);
      this.code = r.c ?? 0; input = r.o || '';
      if (outF) {
        if (outF === '/dev/null') input = ''; else { const p = this.abs(outF); this.fs[p] = { c: (app && this.fs[p] ? this.fs[p].c : '') + input }; input = ''; this.save(); }
      }
      if (idx === segs.length - 1 && input) this.sink.out(input);
    });
  }
  read(p, stdin) { if (p === undefined) return { c: stdin }; const f = this.fs[this.abs(p)]; return f && !f.d ? { c: f.c } : { err: `${p}: No such file or directory` }; }
  cmd(name, a, inp) {
    if (!name) return { o: '' };
    const o = t => ({ o: t, c: 0 }), fail = (e, c = 1) => ({ o: '', e: e + '\n', c });
    const flags = a.filter(x => /^-[A-Za-z]+$/.test(x)).join(''), rest = a.filter(x => !/^-[A-Za-z]+$/.test(x));
    switch (name) {
      case 'echo': { const n = a[0] === '-n', e = a[0] === '-e' || a[1] === '-e'; let t = a.filter(x => !/^-[ne]$/.test(x)).join(' '); if (e) t = t.replace(/\\n/g, '\n').replace(/\\t/g, '\t'); return o(t + (n ? '' : '\n')); }
      case 'printf': { let i = 1; const f = (a[0] || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); return o(f.replace(/%[-\d.]*[sdfc]/g, m => { const v = a[i++] ?? ''; return m.endsWith('d') ? parseInt(v) || 0 : m.endsWith('f') ? (parseFloat(v) || 0).toFixed((m.match(/\.(\d+)/) || [0, 6])[1]) : v; })); }
      case 'pwd': return o(this.env.PWD + '\n');
      case 'cd': { const p = this.abs(rest[0] ?? '~'); if (!this.fs[p]?.d) return fail(`cd: ${rest[0]}: No such directory`); this.env.PWD = p; return o(''); }
      case 'ls': {
        const p = this.abs(rest[0] ?? '.'), n = this.fs[p]; if (!n) return fail(`ls: cannot access '${rest[0]}': No such file or directory`, 2);
        let l = n.d ? this.kids(p) : [p]; if (!flags.includes('a')) l = l.filter(k => !k.split('/').pop().startsWith('.'));
        const nm = k => k.split('/').pop();
        return o(flags.includes('l') ? l.map(k => `${this.fs[k].d ? 'drwxr-xr-x' : '-rw-r--r--'} student ${String(this.fs[k].c?.length ?? 4096).padStart(6)} ${nm(k)}`).join('\n') + (l.length ? '\n' : '') : l.map(nm).join('  ') + (l.length ? '\n' : ''));
      }
      case 'cat': { if (!rest.length) return o(inp); let t = ''; for (const p of rest) { const r = this.read(p); if (r.err) return fail('cat: ' + r.err); t += r.c; } return o(t); }
      case 'mkdir': for (const p of rest) { const d = this.abs(p); if (this.fs[d] && !flags.includes('p')) return fail(`mkdir: cannot create directory '${p}': File exists`); if (flags.includes('p')) { let c = ''; for (const s of d.split('/').filter(Boolean)) { c += '/' + s; this.fs[c] ??= { d: 1 }; } } else { if (!this.fs[this.abs(p + '/..')]?.d) return fail(`mkdir: cannot create directory '${p}': No such file or directory`); this.fs[d] = { d: 1 }; } } this.save(); return o('');
      case 'touch': for (const p of rest) this.fs[this.abs(p)] ??= { c: '' }; this.save(); return o('');
      case 'rm': case 'rmdir': for (const p of rest) { const d = this.abs(p); if (!this.fs[d]) { if (!flags.includes('f')) return fail(`${name}: cannot remove '${p}': No such file or directory`); continue; } if (this.fs[d].d && !flags.includes('r') && name === 'rm') return fail(`rm: cannot remove '${p}': Is a directory`); for (const k of Object.keys(this.fs)) if (k === d || k.startsWith(d + '/')) delete this.fs[k]; } this.save(); return o('');
      case 'cp': case 'mv': { const [s, d] = rest.map(x => this.abs(x)); if (!this.fs[s]) return fail(`${name}: cannot stat '${rest[0]}': No such file or directory`); const t = this.fs[d]?.d ? d + '/' + s.split('/').pop() : d; for (const k of Object.keys(this.fs)) if (k === s || k.startsWith(s + '/')) { this.fs[t + k.slice(s.length)] = { ...this.fs[k] }; if (name === 'mv') delete this.fs[k]; } this.save(); return o(''); }
      case 'head': case 'tail': { const i = a.indexOf('-n'), n = i >= 0 ? +a[i + 1] : 10, f = rest.filter(x => x !== String(n)); const r = this.read(f[0], inp); if (r.err) return fail(name + ': ' + r.err); const L = r.c.split('\n'); if (L[L.length - 1] === '') L.pop(); return o((name === 'head' ? L.slice(0, n) : L.slice(-n)).join('\n') + '\n'); }
      case 'wc': { const r = this.read(rest[0], inp); if (r.err) return fail('wc: ' + r.err); const t = r.c, l = (t.match(/\n/g) || []).length, w = t.split(/\s+/).filter(Boolean).length; return o((flags.includes('l') ? l : flags.includes('w') ? w : flags.includes('c') ? t.length : `${l} ${w} ${t.length}`) + '\n'); }
      case 'grep': {
        const pat = rest[0]; if (pat === undefined) return fail('grep: missing pattern', 2);
        let re; try { re = new RegExp(pat, flags.includes('i') ? 'i' : ''); } catch { return fail('grep: invalid pattern', 2); }
        const files = rest.slice(1), srcs = files.length ? files.map(f => [f, this.read(f)]) : [['', { c: inp }]]; let out = '', n = 0;
        for (const [f, r] of srcs) { if (r.err) return fail('grep: ' + r.err, 2); r.c.split('\n').forEach((ln, i, arr) => { if (i === arr.length - 1 && ln === '') return; if (re.test(ln) !== flags.includes('v')) { n++; out += (files.length > 1 ? f + ':' : '') + (flags.includes('n') ? i + 1 + ':' : '') + ln + '\n'; } }); }
        return { o: flags.includes('c') ? n + '\n' : out, c: n ? 0 : 1 };
      }
      case 'sort': { const r = this.read(rest[0], inp); const L = r.c.split('\n').filter(Boolean); L.sort(flags.includes('n') ? (x, y) => parseFloat(x) - parseFloat(y) : undefined); if (flags.includes('r')) L.reverse(); return o(L.join('\n') + (L.length ? '\n' : '')); }
      case 'uniq': { const L = this.read(rest[0], inp).c.split('\n').filter(Boolean), out = []; L.forEach(x => { if (out.at(-1)?.[0] === x) out.at(-1)[1]++; else out.push([x, 1]); }); return o(out.map(([x, c]) => (flags.includes('c') ? String(c).padStart(4) + ' ' : '') + x).join('\n') + (out.length ? '\n' : '')); }
      case 'cut': { const d = (a[a.indexOf('-d') + 1] ?? '\t'), f = +(a[a.indexOf('-f') + 1] ?? 1); return o(inp.split('\n').filter(Boolean).map(l => l.split(d)[f - 1] ?? '').join('\n') + '\n'); }
      case 'tr': { const [x, y] = rest; return o(inp.replace(new RegExp(`[${x}]`, 'g'), c => y[x.indexOf(c)] ?? y.at(-1))); }
      case 'find': { const root = this.abs(rest[0] && !rest[0].startsWith('-') ? rest[0] : '.'), i = a.indexOf('-name'), re = i >= 0 ? new RegExp('^' + a[i + 1].replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$') : null; return o(Object.keys(this.fs).filter(k => (k === root || k.startsWith(root === '/' ? '/' : root + '/')) && (!re || re.test(k.split('/').pop()))).sort().join('\n') + '\n'); }
      case 'date': return o(new Date().toString() + '\n');
      case 'whoami': return o(this.env.USER + '\n');
      case 'hostname': return o('forge\n');
      case 'uname': return o(flags.includes('a') ? 'Linux forge 6.1.0 #1 SMP aarch64 GNU/Linux\n' : 'Linux\n');
      case 'env': case 'printenv': return o(Object.entries(this.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
      case 'export': for (const x of rest) { const k = x.indexOf('='); if (k > 0) this.env[x.slice(0, k)] = x.slice(k + 1); } return o('');
      case 'read': { const vars = rest.filter((x, i) => !(a[i - 1] === '-p') && x !== '-p' && !/^-/.test(x)); const line = this.stdin.length ? this.stdin.shift() : ''; if (a[0] === '-p') this.sink.out(a[1]); vars.forEach((v, i) => { this.env[v] = vars.length === 1 ? line : (line.split(/\s+/)[i] ?? ''); }); return o(''); }
      case 'seq': { const n = rest.map(Number), [s, e] = n.length > 1 ? n : [1, n[0]]; const L = []; for (let i = s; i <= e; i++) L.push(i); return o(L.join('\n') + '\n'); }
      case 'expr': return o(this.arith(rest.join(' ')) + '\n');
      case 'basename': return o(rest[0].split('/').pop() + '\n');
      case 'dirname': return o((rest[0].split('/').slice(0, -1).join('/') || '/') + '\n');
      case 'tee': { const p = this.abs(rest[0]); this.fs[p] = { c: inp }; this.save(); return o(inp); }
      case 'bash': case 'sh': { const r = this.read(rest[0]); if (r.err) return fail('bash: ' + r.err, 127); return this.script(r.c); }
      case 'chmod': case 'sleep': case 'true': return o('');
      case 'false': return { o: '', c: 1 };
      case 'clear': this.sink.clear?.(); return o('');
      case 'help': return o(HELP + '\n');
      case 'exit': this.halt = true; return o('');
      case 'test': case '[': {
        const t = name === '[' ? a.slice(0, -1) : a; let r = false; const [x, op, y] = t;
        if (t.length === 2) { const p = this.abs(y ?? ''); r = op === '-z' ? !y : op === '-n' ? !!y : op === '-e' ? !!this.fs[p] : op === '-f' ? !!this.fs[p] && !this.fs[p].d : op === '-d' ? !!this.fs[p]?.d : false; }
        else if (t.length === 3) { const X = +x, Y = +y; r = ({ '=': x === y, '==': x === y, '!=': x !== y, '-eq': X === Y, '-ne': X !== Y, '-lt': X < Y, '-gt': X > Y, '-le': X <= Y, '-ge': X >= Y })[op] ?? false; }
        else r = t.length === 1 && !!x;
        return { o: '', c: r ? 0 : 1 };
      }
      default: { const p = name.includes('/') ? this.abs(name) : null; if (p && this.fs[p] && !this.fs[p].d) { return this.script(this.fs[p].c); } return fail(`${name}: command not found`, 127); }
    }
  }

  // ---------- public API ----------
  script(t) { const old = this.sink; let buf = ''; this.sink = { ...old, out: s => (buf += s), err: s => old.err(s) }; try { this.runLines(this.logical(t)); } finally { this.sink = old; } return { o: buf, c: this.code }; }
  run(script, sink, stdin = '') {
    this.sink = sink; this.halt = false; this.stdin = stdin ? stdin.split('\n') : [];
    try { this.runLines(this.logical(script)); } catch (e) { sink.err('shell error: ' + e.message + '\n'); }
    this.save(); if (this.onChange) this.onChange();
  }
}
