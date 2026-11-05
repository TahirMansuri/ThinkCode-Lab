// Oracle SQL front-end: schema switcher, practice-query library, schema browser, commit/rollback, persistence.
import { SCHEMAS, QUERIES, STARTERS } from './sql-data.js';
import { SEEDS } from './engines/sql-seeds.js';

let C, schema = 'SCOTT', meta = null, inTx = false, loaded = null, pend = null;
const KEY = s => 'cf.sql.db.' + s;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const loadBytes = s => { try { const v = localStorage.getItem(KEY(s)); return v ? unb64(v) : null; } catch { return null; } };
const btn = (label, fn, cls = 'tool') => { const b = el('button', cls, label); b.onclick = fn; return b; };

async function use() { const e = C.engine; await e.load(C.sink); loaded = e.w; await e.extra('use', C.sink, { schema, bytes: loadBytes(schema), seed: SEEDS[schema] }); }
function connect() { if (!pend) pend = use().finally(() => { pend = null; }); return pend; }

async function switchSchema(id) {
  if (C.busy()) return C.toast('Wait for the current run to finish.');
  schema = id; C.store.set('cf.sql.schema', id);
  const cur = C.editor.get().trim();
  if (Object.values(STARTERS).some(x => x.trim() === cur)) C.editor.set(STARTERS[id], 'sql');
  await connect(); C.refreshTools(); C.toast(`Connected to ${id}`);
}

function schemaSheet() {
  const body = el('div');
  for (const s of SCHEMAS) {
    const c = el('button', 'scard' + (s.id === schema ? ' on' : ''));
    c.append(el('b', '', s.id), el('span', '', s.desc), el('small', '', s.tables));
    c.onclick = () => { C.closeSheet(); switchSchema(s.id); };
    body.append(c);
  }
  const row = el('div', 'sheet-actions');
  row.append(
    btn('Reset ' + schema, async () => {
      if (!confirm(`Restore ${schema} to its original data? Your changes in this schema will be lost.`)) return;
      try { localStorage.removeItem(KEY(schema)); } catch {}
      C.closeSheet(); await C.engine.extra('reset', C.sink, { schema, seed: SEEDS[schema] }); C.toast(schema + ' restored');
    }),
    btn('Export .sqlite', () => { C.closeSheet(); C.engine.extra('export', C.sink); })
  );
  body.append(row);
  C.openSheet('Choose schema', body);
}

function queriesSheet() {
  const body = el('div'), q = el('input', 'sheet-search'), list = el('div');
  q.type = 'search'; q.placeholder = 'Search queries…'; body.append(q, list);
  const draw = () => {
    list.textContent = ''; const f = q.value.trim().toLowerCase();
    for (const g of QUERIES.filter(g => !g.s || g.s === schema)) {
      const items = g.items.filter(([t, sql]) => !f || t.toLowerCase().includes(f) || sql.toLowerCase().includes(f));
      if (!items.length) continue;
      list.append(el('h4', '', g.cat));
      for (const [t, sql] of items) {
        const b = el('button', 'qitem'); b.append(el('b', '', t), el('code', '', sql.replace(/\s+/g, ' ').slice(0, 80)));
        b.onclick = () => { C.editor.set(`-- ${t}\n${sql}\n`, 'sql'); C.closeSheet(); C.toast('Query loaded — press Run'); };
        list.append(b);
      }
    }
    if (!list.children.length) list.append(el('p', 'mute', 'No queries match.'));
  };
  q.oninput = draw; draw();
  C.openSheet(`Practice queries · ${schema}`, body);
}

function tableCard(t, isView) {
  const c = el('section', 'tcard'), h = el('div', 'tc-head');
  h.append(el('b', '', t.name), el('span', '', isView ? 'view' : `${t.rows} row${t.rows === 1 ? '' : 's'}`));
  const act = el('div', 'tc-act');
  act.append(btn('Data', () => C.run(`SELECT * FROM ${t.name};`)), btn('DDL', () => C.showText(t.ddl.trim() + ';\n')));
  h.append(act); c.append(h);
  if (!isView) {
    const g = el('div', 'cols');
    for (const col of t.cols) {
      const fk = t.fks.find(f => f.f === col.n);
      const tags = [col.pk ? 'PK' : '', col.nn && !col.pk ? 'NOT NULL' : '', fk ? `FK → ${fk.t.toUpperCase()}.${(fk.to || '').toUpperCase()}` : ''].filter(Boolean).join(' · ');
      const r = el('div', 'col'); r.append(el('b', '', col.n.toUpperCase()), el('i', '', (col.t || 'ANY').toUpperCase()), el('em', '', tags)); g.append(r);
    }
    c.append(g);
  }
  return c;
}

function renderStrip() {
  const s = document.getElementById('tableStrip'); s.textContent = '';
  const items = meta ? [...meta.tables.map(t => [t.name, String(t.rows)]), ...meta.views.map(v => [v.name, 'view'])] : [];
  s.hidden = !items.length;
  for (const [n, c] of items) { const b = el('button', 'tchip'); b.append(el('b', '', n), el('i', '', c)); b.onclick = () => C.run(`SELECT * FROM ${n};`); s.append(b); }
}

function renderSchema() {
  const v = document.getElementById('schemaView'); v.textContent = ''; renderStrip(); if (!meta) return;
  const head = el('div', 'sv-head');
  head.append(el('b', '', meta.schema), el('span', '', `${meta.tables.length} tables · ${meta.views.length} views · ${meta.indexes.length} indexes${meta.inTx ? ' · uncommitted changes' : ''}`));
  v.append(head);
  if (!meta.tables.length) v.append(el('p', 'mute', 'No tables yet. Create one with CREATE TABLE (see Queries › DDL & constraints).'));
  meta.tables.forEach(t => v.append(tableCard(t, false)));
  if (meta.views.length) { v.append(el('div', 'sv-sec', 'VIEWS')); meta.views.forEach(t => v.append(tableCard(t, true))); }
  if (meta.indexes.length) { v.append(el('div', 'sv-sec', 'INDEXES')); meta.indexes.forEach(i => v.append(el('div', 'sv-line', `${i.n}  on  ${i.t}`))); }
  if (meta.seqs.length) { v.append(el('div', 'sv-sec', 'SEQUENCES')); meta.seqs.forEach(s => v.append(el('div', 'sv-line', `${s.n} · start ${s.start} · step ${s.inc} · current ${s.cur ?? '—'}`))); }
}

export const sqlui = {
  refresh() { renderStrip(); },
  init(ctx) { C = ctx; schema = C.store.get('cf.sql.schema', 'SCOTT'); },
  async ensure() { const e = C.engine; await e.load(C.sink); if (loaded !== e.w) await connect(); else if (pend) await pend; },
  tools(box) {
    box.append(btn(`${schema} ▾`, schemaSheet, 'tool pri'), btn('✨ Queries', queriesSheet, 'tool tool-queries-glow'));
    if (inTx) box.append(btn('Commit', () => C.run('COMMIT;'), 'tool ok'), btn('Rollback', () => C.run('ROLLBACK;'), 'tool warn'));
  },
  onMeta(m) { meta = m; if (m.inTx !== inTx) { inTx = m.inTx; C.refreshTools(); } renderSchema(); },
  onTx(v) { if (v !== inTx) { inTx = v; C.refreshTools(); } },
  onSave({ schema: s, bytes }) { try { localStorage.setItem(KEY(s), b64(bytes)); } catch { C.toast('Storage full — changes last only for this session.'); } },
  onExport({ name, bytes }) { C.saveFile(name.toLowerCase() + '.sqlite', bytes); }
};
