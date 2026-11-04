#!/usr/bin/env python3
"""Run from the CodeForge project root:  python3 patch-sql-grid.py
Adds (1) a table strip with row counts above the SQL output, tap = see table data,
     (2) a better output grid: # column, "✓ 14 rows (6 cols)" + time chips, Copy and CSV buttons."""
import re, sys
bad = 0
def edit(path, old, new, rx=False):
    global bad
    s = open(path, encoding='utf-8').read()
    if (re.search(old, s, re.S) if rx else old in s) is None or (not rx and old not in s):
        print('MISSING in', path, '->', (old[:50] + '…')); bad += 1; return
    s = re.sub(old, lambda m: new, s, count=1, flags=re.S) if rx else s.replace(old, new, 1)
    open(path, 'w', encoding='utf-8').write(s); print('ok  ', path)

# ---------- 1. output grid (src/main.js) ----------
GRID = r'''let runStart = 0;
function table(cols, rows) {
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const shown = rows.slice(0, 500), ms = (performance.now() - runStart).toFixed(1);
  const csv = () => [cols, ...rows].map(r => r.map(v => { const s = v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const tsv = () => [cols, ...rows].map(r => r.map(v => (v === null ? '' : v)).join('\t')).join('\n');
  const bar = mk('div', 'gridbar'), sp = mk('span'); sp.style.flex = '1';
  const btn = (l, f) => { const b = mk('button', 'tool', l); b.onclick = f; return b; };
  bar.append(mk('span', 'gchip', `✓ ${rows.length} row${rows.length === 1 ? '' : 's'} (${cols.length} cols)${rows.length > 500 ? ' · first 500' : ''}`),
    mk('span', 'gchip dim', `⚡ ${ms} ms`), sp,
    btn('Copy', () => navigator.clipboard && navigator.clipboard.writeText(tsv()).then(() => toast('Copied'))),
    btn('CSV', () => saveFile('result.csv', csv())));
  const wrap = mk('div', 'tablewrap'), t = mk('table'), hr = mk('tr');
  hr.append(mk('th', 'rn', '#')); cols.forEach(c => hr.append(mk('th', '', c)));
  const th = mk('thead'); th.append(hr); t.append(th);
  const tb = mk('tbody');
  shown.forEach((r, i) => {
    const tr = mk('tr'); tr.append(mk('td', 'rn', String(i + 1)));
    for (const v of r) { const td = mk('td'); if (v === null) { td.className = 'null'; td.textContent = 'NULL'; } else td.textContent = typeof v === 'number' && !Number.isInteger(v) ? String(+v.toPrecision(12)) : v; tr.append(td); }
    tb.append(tr);
  });
  t.append(tb); wrap.append(t); con.append(bar, wrap); stick();
}
'''
edit('src/main.js', r'function table\(cols, rows\) \{.*?\n\}\n', GRID, rx=True)
edit('src/main.js', "    await eng.run(typeof code", "    runStart = performance.now();\n    await eng.run(typeof code")
edit('src/main.js', "$('tabSchema').hidden = cur.id !== 'sql';", "$('tabSchema').hidden = cur.id !== 'sql'; if (cur.id === 'sql') sqlui.refresh(); else $('tableStrip').hidden = true;")

# ---------- 2. table strip ----------
edit('index.html', '<div id="console"', '<div id="tableStrip" class="strip" hidden></div>\n    <div id="console"')
edit('src/sql-ui.js', "function renderSchema() {", '''function renderStrip() {
  const s = document.getElementById('tableStrip'); s.textContent = '';
  const items = meta ? [...meta.tables.map(t => [t.name, String(t.rows)]), ...meta.views.map(v => [v.name, 'view'])] : [];
  s.hidden = !items.length;
  for (const [n, c] of items) { const b = el('button', 'tchip'); b.append(el('b', '', n), el('i', '', c)); b.onclick = () => C.run(`SELECT * FROM ${n};`); s.append(b); }
}

function renderSchema() {''')
edit('src/sql-ui.js', "v.textContent = ''; if (!meta) return;", "v.textContent = ''; renderStrip(); if (!meta) return;")
edit('src/sql-ui.js', "  init(ctx) {", "  refresh() { renderStrip(); },\n  init(ctx) {")

edit('src/styles.css', ".tablewrap {", ".gridbar { display: flex; align-items: center; gap: 8px; margin: 8px 0 6px; }\n.gchip { white-space: nowrap; padding: 3px 10px; border-radius: 999px; background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok); font: 600 12px var(--mono); }\n.gchip.dim { background: var(--raised); color: var(--mute); }\n.rn { width: 1%; color: var(--mute); text-align: right; }\n.strip { display: flex; gap: 6px; padding: 8px 12px; overflow-x: auto; border-bottom: 1px solid var(--line); scrollbar-width: none; }\n.tchip { display: flex; align-items: center; gap: 8px; padding: 5px 11px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); white-space: nowrap; font: 600 12.5px var(--mono); }\n.tchip i { padding: 1px 7px; border-radius: 99px; background: var(--raised); color: var(--mute); font: normal 11px var(--ui); }\n.tchip:hover { border-color: var(--ember); }\n.tablewrap {")
print('DONE' if not bad else f'{bad} edit(s) missing — send me that message')
sys.exit(1 if bad else 0)
