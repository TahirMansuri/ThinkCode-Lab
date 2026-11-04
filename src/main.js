import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import { LANGS } from './languages.js';
import { engines } from './engines/index.js';
import { createEditor } from './editor.js';
import { sqlui } from './sql-ui.js';
import { shellui } from './shell-ui.js';

const $ = id => document.getElementById(id);
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
const con = $('console'), preview = $('preview');
let cur = LANGS.find(l => l.id === store.get('cf.lang') && l.engine) || LANGS[0];
let running = false, stopped = false, saveTimer = 0;
let editorHtml = null, editorPhp = null;
let phpViewMode = store.get('cf.php.view_mode', 'split');

// ---------- small helpers ----------
let toastTimer;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600); }
function setState(s, text) { const e = $('runtimeState'); e.dataset.s = s; e.textContent = text; }
const stick = () => { con.scrollTop = con.scrollHeight; };
function print(text, cls) {
  const last = con.lastChild;
  if (last && last.nodeType === 1 && last.dataset.k === (cls || 'out')) last.textContent += text;
  else { const s = document.createElement('span'); s.dataset.k = cls || 'out'; if (cls) s.className = cls; s.textContent = text; con.append(s); }
  stick();
}
let runStart = 0;
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
const HOOK = `<script>(()=>{
  const s=(k,a)=>parent.postMessage({cf:k,m:[...a].map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return String(x)}}).join(' ')},'*');
  ['log','warn','error'].forEach(k=>{const o=console[k];console[k]=(...a)=>{s(k,a);o.apply(console,a)}});
  addEventListener('error',e=>s('error',[e.message]));
  document.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.target, m=(f.method||'POST').toUpperCase(), d={}, fd=new FormData(f);
    for(const [k,v] of fd.entries()) d[k]=v;
    if(e.submitter && e.submitter.name) d[e.submitter.name]=e.submitter.value;
    parent.postMessage({cf:'form_submit', method:m, action:f.getAttribute('action')||'', data:d},'*');
  });
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');
    if(!a) return;
    const h=a.getAttribute('href')||'';
    e.preventDefault();
    parent.postMessage({cf:'nav_link', href:h},'*');
  });
})()<\/script>`;
function showTab(name) {
  con.hidden = name !== 'console'; preview.hidden = name !== 'preview'; $('schemaView').hidden = name !== 'schema';
  for (const n of ['Console', 'Preview', 'Schema']) $('tab' + n).classList.toggle('on', name === n.toLowerCase());
}
const sink = {
  out: s => print(s), err: s => print(s, 'err'), table,
  need_input: () => {
    con.querySelector('.con-input')?.remove();
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'con-input';
    inp.autocomplete = 'off';
    inp.autocorrect = 'off';
    inp.autocapitalize = 'off';
    inp.spellcheck = false;
    inp.style.width = '2ch';
    inp.oninput = () => {
      inp.style.width = Math.max(2, inp.value.length + 1) + 'ch';
      stick();
    };
    inp.onkeydown = e => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = inp.value;
        const s = document.createElement('span');
        s.className = 'con-val';
        s.textContent = val + '\n';
        inp.replaceWith(s);
        engines[cur.engine]?.sendInput(val);
        stick();
      }
    };
    con.append(inp);
    stick();
    setTimeout(() => inp.focus(), 15);
  },
  meta: m => sqlui.onMeta(m), save: v => sqlui.onSave(v), tx: v => sqlui.onTx(v), export: v => sqlui.onExport(v),
  status: s => setState('loading', s), clear: () => (con.textContent = ''),
  preview: html => {
    preview.srcdoc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + HOOK) : HOOK + html;
    showTab('preview');
  }
};
con.addEventListener('click', () => {
  const inp = con.querySelector('.con-input');
  if (inp) inp.focus();
});
window.addEventListener('message', e => {
  if (e.source !== preview.contentWindow || !e.data || !e.data.cf) return;
  if (e.data.cf === 'form_submit') { handleFormSubmit(e.data); return; }
  if (e.data.cf === 'nav_link') { handleNavLink(e.data.href); return; }
  print(`[${e.data.cf}] ${e.data.m}\n`, e.data.cf === 'log' ? 'sys' : 'err');
});
function handleNavLink(href) {
  const clean = (href || '').trim();
  if (clean === 'index.html' || clean === './index.html' || clean === '' || clean === '#') {
    toast('Returning to HTML Form');
    sink.preview(editorHtml ? editorHtml.get() : DEFAULT_PHP_HTML);
  } else if (clean && !clean.startsWith('javascript:')) {
    toast(`Navigation to "${clean}" is restricted in playground.`);
  }
}
function handleFormSubmit({ method, action, data }) {
  if (cur.id === 'php' || (action && action.endsWith('.php'))) {
    toast(`[HTTP ${method}] Submitting to PHP…`);
    print(`\n[HTTP ${method} Request ➔ PHP]\n` + JSON.stringify(data, null, 2) + '\n', 'cmd');
    run({ method, data, tab: 'preview' });
  } else {
    toast(`Form submitted (${method})`);
  }
}

// ---------- editor ----------
const editor = createEditor($('editor'), {
  doc: store.get('cf.code.' + cur.id, cur.tpl), lang: cur.id, onRun: () => run(),
  onChange: text => {
    $('saveState').textContent = 'Saving…'; clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { store.set('cf.code.' + cur.id, text); $('saveState').textContent = 'Saved'; }, 350);
  }
});

// ---------- language rail ----------
function renderRail() {
  const rail = $('rail'); rail.textContent = '';
  for (const l of LANGS) {
    const b = document.createElement('button');
    b.className = 'chip' + (l.engine ? '' : ' soon'); b.style.setProperty('--c', l.hue);
    b.setAttribute('aria-current', String(l.id === cur.id));
    b.innerHTML = l.engine ? '<i></i>' : '<svg><use href="#i-lock"/></svg>';
    b.append(l.name); b.onclick = () => select(l);
    rail.append(b);
  }
  rail.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
function renderTools() {
  const box = $('tools'); box.textContent = '';
  const mk = (label, fn) => { const b = document.createElement('button'); b.className = 'tool'; b.textContent = label; b.onclick = fn; box.append(b); };
  if (cur.id === 'sql') sqlui.tools(box);
  if (cur.id === 'shell') mk('Reset files', () => extra('reset'));
  if (cur.id === 'php') {
    mk('▶ Run PHP', () => runPhpDirect());
    mk('🌐 Preview Form', () => previewHtmlDirect());
  }
}
async function extra(type) {
  if (running) return toast('Wait for the current run to finish.');
  running = true; syncButtons();
  try { await engines[cur.engine].extra(type, sink); } catch (e) { print(String(e.message || e) + '\n', 'err'); }
  running = false; syncButtons();
}
function warm() {
  const eng = engines[cur.engine], label = eng.label || cur.name;
  if (cur.id === 'python' || cur.id === 'sql' || cur.id === 'php') setState('loading', `Loading ${label}…`);
  eng.load(sink).then(() => {
    if (!stopped) setState('ready', `${label} · offline`);
    if (cur.id === 'sql') sqlui.ensure().catch(e => { if (!stopped) print(String(e.message || e) + '\n', 'err'); });
  }).catch(e => {
    if (!stopped && e?.message !== 'Stopped') {
      setState('error', 'Runtime failed');
      print(String(e.message || e) + '\n', 'err');
    }
  });
}
function select(l) {
  if (!l.engine) return toast(`${l.name} — ${l.soon}`);
  if (l.id === cur.id) return;
  if (running) return toast('Stop the current run first.');
  if (cur.input === 'stdin') store.set('cf.in.' + cur.id, $('stdin').value);
  cur = l; store.set('cf.lang', l.id);
  editor.set(store.get('cf.code.' + l.id, l.tpl), l.id);
  $('stdin').value = l.input === 'stdin' ? store.get('cf.in.' + l.id, l.stdin || '') : '';
  con.textContent = ''; applyLang(); warm();
}
let wasShell = false;
function applyLang() {
  const isPhp = cur.id === 'php';
  $('editor').hidden = isPhp;
  $('dualEditor').hidden = !isPhp;
  $('phpViewSwitch').hidden = !isPhp;
  if (isPhp) {
    initDualEditor();
    setPhpViewMode(phpViewMode);
  } else {
    $('fileName').textContent = cur.file;
  }
  $('inputbar').hidden = cur.input !== 'stdin';
  $('promptbar').hidden = cur.input !== 'prompt';
  $('tabPreview').hidden = cur.id !== 'web' && cur.id !== 'php'; $('tabSchema').hidden = cur.id !== 'sql'; $('fileTree').hidden = cur.id !== 'shell'; if (cur.id === 'shell') shellui.render();
  if ((cur.id === 'shell') !== wasShell) { wasShell = cur.id === 'shell'; setSplit(wasShell ? 34 : 52); } if (cur.id === 'sql') sqlui.refresh(); else $('tableStrip').hidden = true; showTab('console');
  if (cur.input === 'prompt') $('promptLabel').textContent = engines.shell.sh.prompt;
  renderRail(); renderTools();
}

// ---------- run / stop / clear ----------
function syncButtons() {
  $('btnRun').disabled = running; $('btnStop').disabled = !running || cur.id === 'shell' || cur.id === 'web';
  $('btnRun').querySelector('span').textContent = running ? 'Running…' : 'Run';
  const bSec = $('btnRunPhpSec');
  if (bSec) bSec.disabled = running;
  if (!running) con.querySelector('.con-input')?.remove();
}
async function run(arg) {
  if (running || !cur.engine) return;
  const eng = engines[cur.engine]; running = true; stopped = false; syncButtons();
  const opts = typeof arg === 'object' && arg !== null ? arg : null;
  const customCode = typeof arg === 'string' ? arg : null;

  try {
    if (cur.id === 'php' && editorHtml && editorPhp) {
      if (opts && opts.method) {
        sink.clear();
        showTab('preview');
        const t0 = performance.now();
        await eng.load(sink);
        await eng.run(editorPhp.get(), '', sink, opts);
        if (!stopped) print(`\n✓ PHP Response updated in ${Math.round(performance.now() - t0)} ms\n`, 'ok');
        return;
      }

      if (phpViewMode === 'php') {
        await executePhpCode(editorPhp.get());
        return;
      }

      if (phpViewMode === 'html') {
        previewHtmlDirect();
        return;
      }

      const htmlCode = editorHtml.get();
      const phpCode = editorPhp.get();
      const hasInputs = /<(?:input|button|select|textarea)\b/i.test(htmlCode);
      const hasPhpCode = phpCode.trim().length > 5 && !/^<\?php\s*\?>$/i.test(phpCode.trim());

      if (hasPhpCode && !hasInputs) {
        await executePhpCode(phpCode);
        return;
      }

      previewHtmlDirect();
      return;
    }

    if (cur.id !== 'web' && (!opts || opts.tab !== 'preview')) showTab('console');
    sink.clear();
    const t0 = performance.now();
    if (cur.id === 'shell') print(`$ bash ${cur.file}\n`, 'cmd');
    await eng.load(sink); setState('ready', `${eng.label || cur.name} · offline`);
    if (cur.id === 'sql') await sqlui.ensure();
    runStart = performance.now();
    await eng.run(customCode || editor.get(), cur.input === 'stdin' ? $('stdin').value : '', sink, opts);
    if (!stopped) print(`\n✓ Finished in ${Math.round(performance.now() - t0)} ms\n`, 'ok');
    if (cur.id === 'shell') $('promptLabel').textContent = engines.shell.sh.prompt;
    if (cur.id === 'sql') con.scrollTop = 0;
  } catch (e) {
    if (!stopped && e?.message !== 'Stopped') {
      print(String(e.message || e) + '\n', 'err');
      setState('error', 'Runtime failed');
    }
  } finally {
    running = false;
    syncButtons();
  }
}
function stop() {
  if (!running) return;
  stopped = true;
  running = false;
  syncButtons();
  con.querySelector('.con-input')?.remove();
  try { engines[cur.engine]?.stop(sink); } catch (_) {}
  if (cur.id !== 'shell') $('promptbar').hidden = true;
  setState('idle', 'Stopped');
}

async function executePhpCode(code) {
  const eng = engines.php;
  showTab('console');
  sink.clear();
  const t0 = performance.now();
  print(`$ php process.php\n`, 'cmd');
  await eng.load(sink);
  await eng.run(code, '', sink);
  if (!stopped) print(`\n✓ Finished in ${Math.round(performance.now() - t0)} ms\n`, 'ok');
}

async function runPhpDirect() {
  if (running) return;
  running = true; stopped = false; syncButtons();
  try {
    const code = editorPhp ? editorPhp.get() : editor.get();
    await executePhpCode(code);
  } catch (e) {
    if (!stopped && e?.message !== 'Stopped') print(String(e.message || e) + '\n', 'err');
  } finally {
    running = false;
    syncButtons();
  }
}

function previewHtmlDirect() {
  if (editorHtml) {
    sink.preview(editorHtml.get());
    toast('HTML Form loaded in Preview');
  }
}

$('btnRun').onclick = () => run();
$('btnStop').onclick = stop;
$('btnClear').onclick = () => { con.textContent = ''; };
$('stdin').oninput = e => store.set('cf.in.' + cur.id, e.target.value);
window.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
$('promptbar').onsubmit = e => {
  e.preventDefault();
  const i = $('promptInput'), line = i.value;
  i.value = '';
  if (cur.id === 'shell') {
    if (!line.trim()) return;
    print(`${engines.shell.sh.prompt} ${line}\n`, 'cmd');
    engines.shell.exec(line, sink);
    $('promptLabel').textContent = engines.shell.sh.prompt;
  } else if (running && engines[cur.engine]?.sendInput) {
    print(line + '\n', 'cmd');
    engines[cur.engine].sendInput(line);
    $('promptbar').hidden = true;
  }
};
$('tabConsole').onclick = () => showTab('console');
$('tabPreview').onclick = () => showTab('preview');
$('tabSchema').onclick = () => showTab('schema');

// ---------- files, theme, layout ----------
async function saveFile(name, data) {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      let b = '';
      if (typeof data !== 'string') for (let i = 0; i < data.length; i += 0x8000) b += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
      const r = await Filesystem.writeFile(typeof data === 'string'
        ? { path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8 }
        : { path: name, data: btoa(b), directory: Directory.Cache });
      await Share.share({ title: name, url: r.uri, dialogTitle: 'Save or share ' + name });
    } else {
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([data])), download: name });
      a.click(); URL.revokeObjectURL(a.href); toast('Saved ' + name);
    }
  } catch (e) { toast('Could not save: ' + (e.message || e)); }
}
$('btnExport').onclick = () => {
  if (cur.id === 'php' && editorHtml && editorPhp) {
    if (phpViewMode === 'html') saveFile('index.html', editorHtml.get());
    else saveFile('process.php', editorPhp.get());
  } else {
    saveFile(cur.file, editor.get());
  }
};
function openSheet(title, node) { $('sheetTitle').textContent = title; const b = $('sheetBody'); b.textContent = ''; b.append(node); $('sheet').hidden = false; }
function closeSheet() { $('sheet').hidden = true; }
document.querySelectorAll('[data-close]').forEach(e => (e.onclick = closeSheet));
$('btnOpen').onclick = () => $('filePick').click();
$('filePick').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  editor.set(await f.text(), cur.id); toast('Opened ' + f.name); e.target.value = '';
};
$('btnReset').onclick = () => {
  if (confirm('Replace your code with the starter template?')) {
    if (cur.id === 'php' && editorHtml && editorPhp) {
      editorHtml.set(DEFAULT_PHP_HTML, 'web');
      editorPhp.set(DEFAULT_PHP_SCRIPT, 'php');
      store.set('cf.code.php_html', DEFAULT_PHP_HTML);
      store.set('cf.code.php_script', DEFAULT_PHP_SCRIPT);
    } else {
      editor.set(cur.tpl, cur.id);
    }
    toast('Template restored');
  }
};
function theme(t) {
  document.documentElement.dataset.theme = t; store.set('cf.theme', t);
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0C1720' : '#EEF2F5';
  $('btnTheme').querySelector('use').setAttribute('href', t === 'dark' ? '#i-sun' : '#i-moon');
}
$('btnTheme').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
theme(store.get('cf.theme', 'dark'));

const grip = $('grip'), work = $('work'), wide = () => matchMedia('(min-width: 900px)').matches;
const setSplit = p => document.documentElement.style.setProperty('--split', Math.min(80, Math.max(20, p)) + '%');
grip.onpointerdown = e => {
  grip.setPointerCapture(e.pointerId);
  const mv = ev => { const r = work.getBoundingClientRect(); setSplit(((wide() ? ev.clientX - r.left : ev.clientY - r.top) / (wide() ? r.width : r.height)) * 100); };
  grip.addEventListener('pointermove', mv);
  grip.addEventListener('pointerup', () => grip.removeEventListener('pointermove', mv), { once: true });
};
grip.onkeydown = e => {
  const cs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--split')) || 52;
  if (/Arrow(Up|Left)/.test(e.key)) setSplit(cs - 3); if (/Arrow(Down|Right)/.test(e.key)) setSplit(cs + 3);
};

// ==========================================
// PHP Dual-Section Mode (HTML Form + PHP Backend)
// ==========================================
const DEFAULT_PHP_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>PHP Practical</title>
</head>
<body>

  <form action="process.php" method="POST">

  </form>

</body>
</html>`;

const DEFAULT_PHP_SCRIPT = `<?php

?>`;

function initDualEditor() {
  if (editorHtml && editorPhp) return;

  // Forcibly clear any old sample code from earlier sessions
  if (store.get('cf.php.v') !== '4') {
    store.set('cf.php.v', '4');
    store.set('cf.code.php_html', DEFAULT_PHP_HTML);
    store.set('cf.code.php_script', DEFAULT_PHP_SCRIPT);
  }

  const initialHtml = store.get('cf.code.php_html', DEFAULT_PHP_HTML);
  const initialPhp = store.get('cf.code.php_script', DEFAULT_PHP_SCRIPT);

  editorHtml = createEditor($('editorHtml'), {
    doc: initialHtml,
    lang: 'web',
    onRun: () => run(),
    onChange: text => {
      $('saveState').textContent = 'Saving…'; clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { store.set('cf.code.php_html', text); $('saveState').textContent = 'Saved'; }, 350);
    }
  });

  editorPhp = createEditor($('editorPhp'), {
    doc: initialPhp,
    lang: 'php',
    onRun: () => run(),
    onChange: text => {
      $('saveState').textContent = 'Saving…'; clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { store.set('cf.code.php_script', text); $('saveState').textContent = 'Saved'; }, 350);
    }
  });

  // Draggable splitter between HTML and PHP
  let dualDragging = false;
  const dualResizer = $('dualResizer');
  const secHtml = $('secHtml');
  const secPhp = $('secPhp');

  dualResizer.onpointerdown = e => {
    dualDragging = true;
    dualResizer.setPointerCapture(e.pointerId);
    dualResizer.classList.add('active');
  };
  dualResizer.onpointermove = e => {
    if (!dualDragging) return;
    const rect = $('dualEditor').getBoundingClientRect();
    const pct = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    secHtml.style.flex = `0 0 ${pct}%`;
    secPhp.style.flex = `0 0 ${100 - pct}%`;
  };
  dualResizer.onpointerup = () => {
    dualDragging = false;
    dualResizer.classList.remove('active');
  };

  // View switch buttons: [Split] [HTML] [PHP]
  $('phpViewSwitch').querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = () => setPhpViewMode(btn.dataset.mode);
  });

  const bRun = $('btnRunPhpSec');
  if (bRun) bRun.onclick = () => runPhpDirect();
  const bPrev = $('btnPreviewHtml');
  if (bPrev) bPrev.onclick = () => previewHtmlDirect();
}

function setPhpViewMode(mode) {
  phpViewMode = mode;
  store.set('cf.php.view_mode', mode);
  const dual = $('dualEditor');
  dual.className = 'dual-editor mode-' + mode;
  $('phpViewSwitch').querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.mode === mode);
  });
  if (mode === 'html') {
    $('fileName').textContent = 'index.html (HTML Form)';
  } else if (mode === 'php') {
    $('fileName').textContent = 'process.php (PHP Script)';
  } else {
    $('fileName').textContent = 'PHP Lab (HTML + PHP Split)';
  }
}

// ---------- boot ----------
function shellCmd(line) { print(`${engines.shell.sh.prompt} ${line}\n`, 'cmd'); engines.shell.exec(line, sink); $('promptLabel').textContent = engines.shell.sh.prompt; }
shellui.init({ sh: engines.shell.sh, cmd: shellCmd });
sqlui.init({ engine: engines.sql, editor, sink, run, toast, store, openSheet, closeSheet, saveFile, refreshTools: renderTools,
  busy: () => running, showText: t => { sink.clear(); showTab('console'); print(t, 'sys'); } });
$('stdin').value = cur.input === 'stdin' ? store.get('cf.in.' + cur.id, cur.stdin || '') : '';
applyLang(); syncButtons(); warm();
window.__app = { run, stop, engines, cur: () => cur, editorPhp: () => editorPhp, editorHtml: () => editorHtml, running: () => running };
