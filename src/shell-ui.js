// File explorer for the Linux shell: reads the virtual filesystem; tapping runs the matching command.
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
