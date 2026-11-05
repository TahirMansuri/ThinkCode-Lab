// Classic worker: SQLite (sql.js WASM) behaving like an Oracle schema: transactions, sequences,
// data dictionary views, ORA-style errors, per-schema persistence.

let SQL = null, db = null, base = '', schema = 'SCOTT', inTx = false, seqs = {};
const post = (t, s, x) => postMessage({ t, s, ...x });
const out = s => post('out', s + '\n');
const cap = s => s[0].toUpperCase() + s.slice(1).toLowerCase();

// ---------- Oracle date/number helpers ----------
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const DAY = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const p2 = n => String(n).padStart(2, '0');
const iso = d => d.toISOString().slice(0, 10);
const toDate = v => { const d = new Date(String(v).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(v)) ? '' : 'Z')); return isNaN(d) ? null : d; };

function parseDate(s, f) {
  if (s === null) return null;
  if (!f) return toDate(s);
  const map = { YYYY: '(\\d{4})', YY: '(\\d{2})', MM: '(\\d{1,2})', DD: '(\\d{1,2})', MON: '([A-Za-z]{3})', HH24: '(\\d{1,2})', HH: '(\\d{1,2})', MI: '(\\d{2})', SS: '(\\d{2})' };
  const order = [];
  const re = '^' + String(f).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/YYYY|YY|MM|DD|MON|HH24|HH|MI|SS/gi, t => { order.push(t.toUpperCase()); return map[t.toUpperCase()]; }) + '$';
  const m = String(s).trim().match(new RegExp(re, 'i'));
  if (!m) throw new Error('ORA-01861: literal does not match format string');
  let Y = 1970, M = 1, D = 1, h = 0, mi = 0, se = 0;
  order.forEach((t, i) => { const v = m[i + 1];
    if (t === 'YYYY') Y = +v; else if (t === 'YY') Y = 2000 + +v; else if (t === 'MM') M = +v; else if (t === 'DD') D = +v;
    else if (t === 'MON') M = MON.indexOf(v.toUpperCase()) + 1; else if (t === 'HH24' || t === 'HH') h = +v; else if (t === 'MI') mi = +v; else se = +v; });
  return new Date(Date.UTC(Y, M - 1, D, h, mi, se));
}
function toChar(v, f) {
  if (v === null) return null;
  const d = typeof v === 'number' ? null : toDate(v);
  if (!d) return String(v);
  return String(f).replace(/YYYY|YY|MONTH|MON|MM|DD|DAY|DY|HH24|HH12|HH|MI|SS|AM|PM/gi, t => ({
    YYYY: d.getUTCFullYear(), YY: String(d.getUTCFullYear()).slice(2), MONTH: MONTH[d.getUTCMonth()], MON: MON[d.getUTCMonth()],
    MM: p2(d.getUTCMonth() + 1), DD: p2(d.getUTCDate()), DAY: DAY[d.getUTCDay()], DY: DAY[d.getUTCDay()].slice(0, 3),
    HH24: p2(d.getUTCHours()), HH12: p2(d.getUTCHours() % 12 || 12), HH: p2(d.getUTCHours() % 12 || 12),
    MI: p2(d.getUTCMinutes()), SS: p2(d.getUTCSeconds()), AM: d.getUTCHours() < 12 ? 'AM' : 'PM', PM: d.getUTCHours() < 12 ? 'AM' : 'PM' })[t.toUpperCase()]);
}

// ---------- engine setup ----------
function registerFns() {
  const f = (n, fn) => db.create_function(n, fn);
  f('NVL', (a, b) => (a === null ? b : a));
  f('NVL2', (a, b, c) => (a === null ? c : b));
  f('INITCAP', s => (s === null ? null : String(s).toLowerCase().replace(/(^|[^a-z0-9])([a-z])/g, (m, a, b) => a + b.toUpperCase())));
  f('LPAD', (s, n, p) => String(s).padStart(n, p || ' ').slice(-n));
  f('RPAD', (s, n, p) => String(s).padEnd(n, p || ' ').slice(0, n));
  f('MOD', (a, b) => (b === 0 ? a : a % b));
  f('CEIL', a => Math.ceil(a)); f('FLOOR', a => Math.floor(a));
  f('POWER', (a, b) => Math.pow(a, b)); f('SQRT', a => Math.sqrt(a));
  f('TO_CHAR', toChar);
  f('TO_NUMBER', s => (s === null ? null : parseFloat(String(s).replace(/[^0-9.\-]/g, ''))));
  f('TO_DATE', (s, fmt) => { const d = parseDate(s, fmt); return d ? (/HH|MI|SS/i.test(fmt) ? d.toISOString().slice(0, 19).replace('T', ' ') : iso(d)) : s; });
  f('TRUNC', v => (typeof v === 'number' ? Math.trunc(v) : (toDate(v) ? iso(toDate(v)) : v)));
  f('TRUNC_N', (v, n) => Math.trunc(v * 10 ** n) / 10 ** n);
  f('ADD_MONTHS', (s, n) => { const d = s === null ? null : toDate(s); if (!d) return null; d.setUTCMonth(d.getUTCMonth() + n); return iso(d); });
  f('LAST_DAY', s => { const d = s === null ? null : toDate(s); if (!d) return null; return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))); });
  f('MONTHS_BETWEEN', (a, b) => { const x = a === null ? null : toDate(a), y = b === null ? null : toDate(b); if (!x || !y) return null; return (x.getUTCFullYear() - y.getUTCFullYear()) * 12 + x.getUTCMonth() - y.getUTCMonth() + (x.getUTCDate() - y.getUTCDate()) / 31; });
  f('NEXTVAL', n => { const q = seqs[String(n).toLowerCase()]; if (!q) throw new Error('ORA-02289: sequence does not exist'); q.cur = q.cur === null ? q.start : q.cur + q.inc; return q.cur; });
  f('CURRVAL', n => { const q = seqs[String(n).toLowerCase()]; if (!q) throw new Error('ORA-02289: sequence does not exist'); if (q.cur === null) throw new Error('ORA-08002: sequence CURRVAL is not yet defined in this session'); return q.cur; });
  db.run('PRAGMA foreign_keys = ON');
}
function ensureObjects() {
  db.run(`CREATE TABLE IF NOT EXISTS dual(dummy VARCHAR(1)); INSERT INTO dual SELECT 'X' WHERE NOT EXISTS (SELECT 1 FROM dual);
CREATE VIEW IF NOT EXISTS user_tables AS SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('dual','__meta');
CREATE VIEW IF NOT EXISTS user_views AS SELECT name AS view_name, sql AS text FROM sqlite_master WHERE type='view' AND name NOT IN ('user_tables','user_views','user_tab_columns','user_indexes');
CREATE VIEW IF NOT EXISTS user_tab_columns AS SELECT m.name AS table_name, p.name AS column_name, p.type AS data_type, CASE p."notnull" WHEN 1 THEN 'N' ELSE 'Y' END AS nullable, p.cid + 1 AS column_id FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type='table' AND m.name NOT IN ('dual','__meta');
CREATE VIEW IF NOT EXISTS user_indexes AS SELECT name AS index_name, tbl_name AS table_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';`);
}
function persist() {
  if (inTx) return;
  db.run('CREATE TABLE IF NOT EXISTS __meta(k TEXT PRIMARY KEY, v TEXT)');
  db.run("INSERT OR REPLACE INTO __meta VALUES('seqs', ?)", [JSON.stringify(seqs)]);
  const bytes = db.export(); registerFns();   // export() reopens the DB and drops UDFs
  post('save', { schema, bytes });
}
function open(name, bytes, seed) {
  schema = name.toUpperCase(); inTx = false; seqs = {};
  db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  registerFns();
  if (bytes) { try { const r = db.exec("SELECT v FROM __meta WHERE k='seqs'"); if (r.length) seqs = JSON.parse(r[0].values[0][0]); } catch {} }
  else if (seed) db.run(seed);
  ensureObjects();
  if (!bytes) persist();
}

// ---------- SQL translation (Oracle -> SQLite) ----------
function split(s) {
  const o = []; let cur = '', q = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { cur += ch; if (ch === q) q = null; }
    else if (ch === "'" || ch === '"') { q = ch; cur += ch; }
    else if (ch === '-' && s[i + 1] === '-') { while (i < s.length && s[i] !== '\n') i++; cur += '\n'; }
    else if (ch === ';') { if (cur.trim()) o.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) o.push(cur.trim());
  return o.filter(x => x !== '/');
}
function args(s, i) {
  let d = 0, q = null, cur = ''; const a = [];
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === "'") { q = c; cur += c; continue; }
    if (c === '(') { if (d++ > 0) cur += c; continue; }
    if (c === ')') { if (--d === 0) { a.push(cur.trim()); return { a, end: j }; } cur += c; continue; }
    if (c === ',' && d === 1) { a.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  return null;
}
function rewrite(s, name, fn) {
  const re = new RegExp('\\b' + name + '\\s*\\(', 'i'); let m;
  for (let g = 0; g < 60 && (m = re.exec(s)); g++) {
    const r = args(s, m.index + m[0].length - 1); if (!r) break;
    const o = fn(r.a.map(x => rewrite(x, name, fn)));
    s = o === null ? s.slice(0, m.index) + name + '\u200b' + s.slice(m.index + name.length) : s.slice(0, m.index) + o + s.slice(r.end + 1);
  }
  return s.replace(/\u200b/g, '');
}
function translate(s) {
  let limit = null;
  s = s.replace(/\bdate\s+'(\d{4}-\d{2}-\d{2})'/gi, "'$1'")
    .replace(/\b(sysdate|systimestamp)\b/gi, "datetime('now')")
    .replace(/default\s+(datetime\('now'\))/gi, 'DEFAULT ($1)')
    .replace(/\bminus\b/gi, 'EXCEPT')
    .replace(/\bfetch\s+first\s+(\d+)\s+rows?\s+only\b/gi, (m, n) => { limit = n; return ''; })
    .replace(/\s+(where|and)\s+rownum\s*(<=|<|=)\s*(\d+)/gi, (m, kw, op, n) => { limit = op === '<' ? n - 1 : n; return /where/i.test(kw) ? ' WHERE 1=1' : ''; })
    .replace(/\brownum\b/gi, 'ROW_NUMBER() OVER ()')
    .replace(/\b(\w+)\.(nextval|currval)\b/gi, (m, n, k) => `${k.toUpperCase()}('${n}')`)
    .replace(/listagg\s*\(([^)]*)\)\s*within\s+group\s*\([^)]*\)/gi, 'GROUP_CONCAT($1)')
    .replace(/^create\s+or\s+replace\s+table\s+(\w+)/i, 'DROP TABLE IF EXISTS $1; CREATE TABLE $1')
    .replace(/^create\s+or\s+replace\s+view\s+(\w+)/i, 'DROP VIEW IF EXISTS $1; CREATE VIEW $1')
    .replace(/^(alter\s+table\s+\w+\s+add)\s*\(\s*([^)]+?)\s*\)\s*$/i, '$1 COLUMN $2')
    .replace(/^drop\s+table\s+(?:if\s+exists\s+)?(\w+)\s*(?:cascade\s+constraints\s*)?(?:purge)?\s*$/i, 'DROP TABLE IF EXISTS $1');
  if (/^alter\s+table\s+\w+\s+(modify|drop\s+constraint)/i.test(s)) throw new Error('ORA-NOTSUP: ALTER TABLE MODIFY / DROP CONSTRAINT is not supported here. Recreate the table with CREATE TABLE ... AS SELECT.');
  s = rewrite(s, 'decode', a => { const [e, ...r] = a; let o = 'CASE'; for (let i = 0; i + 1 < r.length; i += 2) o += ` WHEN (${e}) = (${r[i]}) THEN ${r[i + 1]}`; return o + (r.length % 2 ? ` ELSE ${r[r.length - 1]}` : '') + ' END'; });
  s = rewrite(s, 'to_char', a => (a.length === 1 ? `CAST(${a[0]} AS TEXT)` : null));
  s = rewrite(s, 'to_date', a => (a.length === 1 ? a[0] : null));
  s = rewrite(s, 'trunc', a => (a.length === 2 ? `TRUNC_N(${a[0]}, ${a[1]})` : null));
  return limit === null ? s : s + ' LIMIT ' + limit;
}
function oraErr(e) {
  const m = e.message || String(e);
  const map = [[/no such table/i, 'ORA-00942: table or view does not exist'], [/no such column/i, 'ORA-00904: invalid identifier'],
    [/UNIQUE constraint failed|PRIMARY KEY/i, 'ORA-00001: unique constraint violated'], [/NOT NULL constraint failed/i, 'ORA-01400: cannot insert NULL into a required column'],
    [/FOREIGN KEY constraint failed/i, 'ORA-02291/02292: integrity constraint (foreign key) violated'], [/CHECK constraint failed/i, 'ORA-02290: check constraint violated'],
    [/already exists/i, 'ORA-00955: name is already used by an existing object\n  (Tip: use DROP TABLE IF EXISTS <name>; before CREATE TABLE to re-run safely)'], [/ambiguous column/i, 'ORA-00918: column ambiguously defined'],
    [/syntax error|incomplete input|unrecognized token/i, 'ORA-00900: invalid SQL statement (syntax error)']];
  if (/^ORA-/.test(m)) return m;
  const h = map.find(([r]) => r.test(m)); return h ? `${h[1]}\n  (${m})` : 'ORA-00933: ' + m;
}

// ---------- execution ----------
const begin = () => { if (!inTx) { db.run('BEGIN'); inTx = true; } };
const ddl = q => { if (inTx) { db.run('COMMIT'); inTx = false; } db.run(q); persist(); };
const upper = c => (/[A-Z]/.test(c) ? c : c.toUpperCase());

function runOne(s) {
  const w = s.split(/\s+/)[0].toLowerCase(); let m;
  if (w === 'commit') { if (inTx) { db.run('COMMIT'); inTx = false; } persist(); return out('Commit complete.'); }
  if ((m = s.match(/^rollback\s+to\s+(?:savepoint\s+)?(\w+)/i))) { db.run('ROLLBACK TO ' + m[1]); return out('Rollback complete.'); }
  if (w === 'rollback') { if (inTx) { db.run('ROLLBACK'); inTx = false; } return out('Rollback complete.'); }
  if (w === 'savepoint') { begin(); db.run(s); return out('Savepoint created.'); }
  if (/^(grant|revoke)\b/i.test(s)) return out(`${cap(w)} succeeded.`);
  if (/^(set|spool|whenever|prompt|connect|conn|analyze|comment|audit)\b/i.test(s)) return out(`${w.toUpperCase()} accepted (no effect in this lab).`);
  if (/^show\s+user/i.test(s)) return out(`USER is "${schema}"`);
  if (/^show\s+tables/i.test(s)) s = 'SELECT table_name FROM user_tables';
  if ((m = s.match(/^create\s+sequence\s+(\w+)(.*)$/is))) {
    const st = (m[2].match(/start\s+with\s+(-?\d+)/i) || [])[1], inc = (m[2].match(/increment\s+by\s+(-?\d+)/i) || [])[1];
    seqs[m[1].toLowerCase()] = { start: +(st ?? 1), inc: +(inc ?? 1), cur: null }; persist(); return out('Sequence created.');
  }
  if ((m = s.match(/^drop\s+sequence\s+(\w+)/i))) { delete seqs[m[1].toLowerCase()]; persist(); return out('Sequence dropped.'); }
  if ((m = s.match(/^(?:desc|describe)\s+(\w+)/i))) {
    const r = db.exec(`SELECT upper(name) AS "Name", CASE WHEN "notnull" = 1 OR pk > 0 THEN 'NOT NULL' ELSE '' END AS "Null?", upper(type) AS "Type" FROM pragma_table_info('${m[1]}')`);
    if (!r.length) throw new Error(`ORA-04043: object ${m[1].toUpperCase()} does not exist`);
    return post('table', '', { columns: r[0].columns, rows: r[0].values });
  }
  if ((m = s.match(/^truncate\s+table\s+(\w+)/i))) { ddl(`DELETE FROM ${m[1]}`); return out('Table truncated.'); }
  if ((m = s.match(/^rename\s+(\w+)\s+to\s+(\w+)/i))) { ddl(`ALTER TABLE ${m[1]} RENAME TO ${m[2]}`); return out('Table renamed.'); }

  const q = translate(s), k = q.trim().split(/\s+/)[0].toLowerCase();
  if (/^(create|drop|alter)$/.test(k)) {
    try {
      ddl(q);
    } catch (e) {
      if (/duplicate column name/i.test(e.message)) {
        return out('Column already exists (skipped).');
      }
      throw e;
    }
    const o = (s.match(/^(?:create|drop|alter)\s+(?:or\s+replace\s+)?(?:unique\s+)?(\w+)/i) || [, 'object'])[1];
    return out(`${cap(o)} ${{ create: 'created', drop: 'dropped', alter: 'altered' }[w]}.`);
  }
  if (/^(insert|update|delete)$/.test(k)) {
    begin(); db.run(q); const n = db.getRowsModified();
    return out(`${n} row${n === 1 ? '' : 's'} ${{ insert: 'created', update: 'updated', delete: 'deleted' }[k]}.`);
  }
  const res = db.exec(q);
  if (!res.length) return out(/^(select|with|values)$/.test(k) ? 'no rows selected.' : 'Statement processed.');
  res.forEach(r => post('table', '', { columns: r.columns.map(upper), rows: r.values }));
}
function exec(code) {
  for (const s of split(code)) {
    try { runOne(s); } catch (e) { post('err', `Error: ${oraErr(e)}\n  in: ${s.replace(/\s+/g, ' ').slice(0, 90)}\n`); break; }
  }
}
function meta() {
  const q = sql => { const r = db.exec(sql); return r.length ? r[0].values : []; };
  const sys = new Set(['dual', '__meta', 'user_tables', 'user_views', 'user_tab_columns', 'user_indexes']);
  const objs = t => q(`SELECT name, sql FROM sqlite_master WHERE type='${t}' AND name NOT LIKE 'sqlite_%' ORDER BY name`).filter(([n]) => !sys.has(n));
  post('meta', {
    schema, inTx,
    tables: objs('table').map(([name, ddl]) => ({ name: name.toUpperCase(), ddl, rows: q(`SELECT COUNT(*) FROM "${name}"`)[0][0],
      cols: q(`SELECT name, type, "notnull", pk FROM pragma_table_info('${name}')`).map(([n, t, nn, pk]) => ({ n, t, nn, pk })),
      fks: q(`SELECT "from", "table", "to" FROM pragma_foreign_key_list('${name}')`).map(([f, t, to]) => ({ f, t, to })) })),
    views: objs('view').map(([name, ddl]) => ({ name: name.toUpperCase(), ddl })),
    indexes: q("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").map(([n, t]) => ({ n: n.toUpperCase(), t: t.toUpperCase() })),
    seqs: Object.entries(seqs).map(([n, v]) => ({ n: n.toUpperCase(), ...v }))
  });
}
const finish = () => { post('tx', inTx); meta(); post('done'); };

onmessage = async ({ data: d }) => {
  try {
    if (d.type === 'init') {
      base = d.base; post('status', 'Starting SQL engine…');
      importScripts(base + 'sql/sql-wasm.js');
      SQL = await initSqlJs({ locateFile: f => base + 'sql/' + f });
      post('ready');
    } else if (d.type === 'use') {
      if (db && inTx) { db.run('COMMIT'); inTx = false; persist(); }
      open(d.schema, d.bytes || null, d.seed); finish();
    } else if (d.type === 'run') { if (!db) open('SCOTT'); exec(d.code); finish(); }
    else if (d.type === 'meta') finish();
    else if (d.type === 'reset') { open(d.schema, null, d.seed); out(`Schema ${schema} restored to its original state.`); finish(); }
    else if (d.type === 'export') {
      if (inTx) post('err', 'COMMIT or ROLLBACK before exporting.\n');
      else { const bytes = db.export(); registerFns(); post('export', { name: schema, bytes }); }
      post('done');
    }
  } catch (e) { if (d.type === 'init') post('fatal', 'SQL engine failed to load: ' + e); else { post('err', oraErr(e) + '\n'); post('done'); } }
};
