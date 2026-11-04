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

let currentPromptCb = null;

function showPromptModal(msg, defaultVal = '', cb, badgeText = 'JavaScript', titleText = 'Prompt', isAlert = false) {
  closePromptModal(null);
  currentPromptCb = cb;

  const modal = $('promptModal');
  const badge = $('pmBadge');
  const title = $('pmTitle');
  const messageEl = $('pmMessage');
  const input = $('pmInput');
  const cancelBtn = $('pmCancel');
  const okBtn = $('pmOk');

  if (!modal) return;

  if (badge) badge.textContent = badgeText;
  if (title) title.textContent = titleText;
  if (messageEl) messageEl.textContent = msg || (isAlert ? 'Alert' : 'Please enter a value:');

  if (isAlert) {
    if (input) input.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (okBtn) okBtn.textContent = 'OK';
  } else {
    if (input) {
      input.style.display = '';
      input.value = defaultVal || '';
    }
    if (cancelBtn) cancelBtn.style.display = '';
    if (okBtn) okBtn.textContent = 'OK';
  }

  modal.hidden = false;

  setTimeout(() => {
    if (!isAlert && input) {
      input.focus();
      if (defaultVal) input.select();
    } else if (okBtn) {
      okBtn.focus();
    }
  }, 40);
}

function closePromptModal(result = null) {
  const modal = $('promptModal');
  if (modal) modal.hidden = true;
  if (currentPromptCb) {
    const cb = currentPromptCb;
    currentPromptCb = null;
    cb(result);
  }
}

const sink = {
  out: s => print(s), err: s => print(s, 'err'), table,
  prompt_modal: (msg, data) => {
    const def = (data && data.defaultVal) || '';
    showPromptModal(msg, def, val => {
      engines[cur.engine]?.sendPromptResponse?.(val);
    }, 'JavaScript', 'Prompt', false);
  },
  alert_modal: (msg) => {
    showPromptModal(msg, '', () => {
      engines[cur.engine]?.sendPromptResponse?.('');
    }, 'JavaScript', 'Alert', true);
  },
  need_input: (promptMsg) => {
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    if (isMobile) {
      const langName = cur.name || cur.engine?.toUpperCase() || 'Input';
      showPromptModal(promptMsg || 'Enter input for program:', '', val => {
        const text = val !== null ? val : '';
        print(text + '\n');
        engines[cur.engine]?.sendInput(text);
      }, langName, 'Input Required', false);
      return;
    }
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
  status: s => {
    setState('loading', s);
    const txt = con.querySelector('.cwn-text');
    if (txt) txt.textContent = s;
  },
  clear: () => (con.textContent = ''),
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
function showConsoleWarmNotice(label) {
  if (running) return;
  const existing = con.querySelector('.console-warm-notice');
  if (existing) return;
  con.innerHTML = `
    <div class="console-warm-notice">
      <div class="cwn-header">
        <div class="cwn-spinner"></div>
        <b>Initializing ${label} WebAssembly Environment…</b>
      </div>
      <p class="cwn-text">Downloading & preparing offline runtime files on your device. First load may take a moment over mobile networks.</p>
      <p class="cwn-sub">💡 <i>You can write your code now. Clicking "Run" will queue execution to start automatically when ready.</i></p>
    </div>
  `;
}

function hideConsoleWarmNotice(label) {
  const notice = con.querySelector('.console-warm-notice');
  if (notice && !running) {
    notice.innerHTML = `
      <div class="cwn-ready">
        <b>✓ ${label} is ready!</b> Tap <span class="cwn-run-btn">Run</span> or press <kbd>⌘↵</kbd> to execute your code.
      </div>
    `;
    setTimeout(() => {
      if (!running && con.querySelector('.cwn-ready')) {
        con.textContent = '';
      }
    }, 4500);
  }
}

function warm() {
  const eng = engines[cur.engine], label = eng?.label || cur.name;
  if (!eng) return Promise.resolve();
  const needsWarm = cur.id === 'python' || cur.id === 'sql' || cur.id === 'php' || cur.id === 'c' || cur.id === 'cpp';
  if (needsWarm && !eng.isReady) {
    setState('loading', `Loading ${label}…`);
    if (!running && con.textContent.trim() === '') {
      showConsoleWarmNotice(label);
    }
  } else if (eng.isReady) {
    setState('ready', `${label} · offline`);
  }

  return eng.load(sink).then(() => {
    if (!stopped) {
      setState('ready', `${label} · offline`);
      hideConsoleWarmNotice(label);
    }
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
  if (cur.input === 'stdin' && $('stdin')) store.set('cf.in.' + cur.id, $('stdin').value);
  cur = l; store.set('cf.lang', l.id);
  editor.set(store.get('cf.code.' + l.id, l.tpl), l.id);
  if ($('stdin')) $('stdin').value = l.input === 'stdin' ? store.get('cf.in.' + l.id, l.stdin || '') : '';
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
  if ($('inputbar')) $('inputbar').hidden = cur.input !== 'stdin';
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
  if (!running) {
    con.querySelector('.con-input')?.remove();
    closePromptModal(null);
  }
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
    const wasWarming = !eng.isReady && (cur.id === 'python' || cur.id === 'sql' || cur.id === 'php' || cur.id === 'c' || cur.id === 'cpp');
    sink.clear();
    if (wasWarming) {
      print(`⏳ ${eng.label || cur.name} runtime is still downloading/loading on your device…\n`, 'sys');
      print(`   Execution is queued — your code will run automatically as soon as ready!\n\n`, 'mute');
      toast(`⏳ Loading ${eng.label || cur.name}... queued to run`);
      $('btnRun').querySelector('span').textContent = 'Loading…';
    }
    const t0 = performance.now();
    if (cur.id === 'shell') print(`$ bash ${cur.file}\n`, 'cmd');
    else if (cur.id === 'c') print(`$ gcc ${cur.file} -o main && ./main\n`, 'cmd');
    else if (cur.id === 'cpp') print(`$ g++ ${cur.file} -o main && ./main\n`, 'cmd');
    await eng.load(sink); setState('ready', `${eng.label || cur.name} · offline`);
    if (wasWarming && !stopped) {
      print(`✓ ${eng.label || cur.name} ready! Executing your code…\n`, 'ok');
      print('──────────────────────────────────────────────────\n', 'mute');
      $('btnRun').querySelector('span').textContent = 'Running…';
    }
    if (cur.id === 'sql') await sqlui.ensure();
    runStart = performance.now();
    await eng.run(customCode || editor.get(), (cur.input === 'stdin' && $('stdin')) ? $('stdin').value : '', sink, opts);
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
  closePromptModal(null);
  try { engines[cur.engine]?.stop(sink); } catch (_) {}
  if (cur.id !== 'shell') $('promptbar').hidden = true;
  setState('idle', 'Stopped');
}

async function executePhpCode(code) {
  const eng = engines.php;
  const wasWarming = !eng.isReady;
  showTab('console');
  sink.clear();
  if (wasWarming) {
    print(`⏳ PHP 8.2 WebAssembly runtime is still downloading/loading on your device…\n`, 'sys');
    print(`   Execution is queued — script will run automatically once loading completes!\n\n`, 'mute');
    toast('⏳ Initializing PHP runtime...');
    $('btnRun').querySelector('span').textContent = 'Loading…';
  }
  const t0 = performance.now();
  print(`$ php process.php\n`, 'cmd');
  await eng.load(sink);
  if (wasWarming && !stopped) {
    print(`✓ PHP 8.2 ready! Executing code…\n`, 'ok');
    print('──────────────────────────────────────────────────\n', 'mute');
    $('btnRun').querySelector('span').textContent = 'Running…';
  }
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
const stdinEl = $('stdin');
if (stdinEl) stdinEl.oninput = e => store.set('cf.in.' + cur.id, e.target.value);
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
function openSheet(title, node) {
  $('sheetTitle').textContent = title;
  const b = $('sheetBody');
  b.textContent = '';
  if (typeof node === 'string') b.innerHTML = node;
  else b.append(node);
  $('sheet').hidden = false;
}
function closeSheet() { $('sheet').hidden = true; }
document.querySelectorAll('[data-close]').forEach(e => (e.onclick = closeSheet));

const pmForm = $('pmForm');
if (pmForm) {
  pmForm.onsubmit = e => {
    e.preventDefault();
    const isAlert = $('pmInput')?.style.display === 'none';
    const val = isAlert ? '' : ($('pmInput')?.value || '');
    closePromptModal(val);
  };
}
const pmCancel = $('pmCancel');
if (pmCancel) {
  pmCancel.onclick = () => closePromptModal(null);
}
const promptModal = $('promptModal');
if (promptModal) {
  promptModal.addEventListener('click', e => {
    if (e.target.dataset.cancelPrompt !== undefined) closePromptModal(null);
  });
}
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && promptModal && !promptModal.hidden) closePromptModal(null);
});

function showDevProfile() {
  const card = document.createElement('div');
  card.className = 'dev-card';
  card.innerHTML = `
    <div class="dev-header">
      <div class="dev-avatar">
        <img src="assets/tahir-mansuri.png" alt="Tahir Mansuri" onerror="this.onerror=null; this.src='https://github.com/TahirMansuri.png';">
      </div>
      <div class="dev-titles">
        <h3 class="dev-name">Tahir Mansuri</h3>
        <p class="dev-role">Lead System Engineer • Educator • Full-Stack Developer</p>
        <p class="dev-org">IMRD College • Department of Computer Applications</p>
      </div>
    </div>

    <div class="dev-tags">
      <span class="dtag dtag-pri">System Architect</span>
      <span class="dtag">Educator</span>
      <span class="dtag">WebAssembly</span>
      <span class="dtag">ThinkCode Ecosystem</span>
    </div>

    <div class="dev-section">
      <h4>⚡ About ThinkCode Lab</h4>
      <p>
        Architected by <b>Tahir Mansuri</b> as a 100% offline multi-language coding playground and mobile IDE for students across BCA, B.Sc. IT, B.Tech, and MCA.
        Runs Python 3.12, PHP 8.2 with Dual-Section HTML+PHP Practical Workspace, Oracle-compatible SQL, and Linux Bash locally in WebAssembly with zero server latency.
      </p>
    </div>

    <div class="dev-project-box">
      <div class="dpb-icon">
        <img src="assets/icon.svg" width="28" height="28" alt="ThinkCode Icon">
      </div>
      <div class="dpb-info">
        <b>ThinkCode Platform</b>
        <small>Interactive DSA Visualizer & Dual-Engine Code Tracer</small>
      </div>
      <a href="https://thinkcode.infogalaxy.space/" target="_blank" rel="noopener" class="dpb-btn">
        Visit ↗
      </a>
    </div>

    <div class="dev-links">
      <a href="https://github.com/TahirMansuri" target="_blank" rel="noopener" class="dev-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
        <span>GitHub Profile</span>
      </a>
      <a href="mailto:tahirmansuri086@gmail.com" class="dev-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>Email Contact</span>
      </a>
    </div>

    <div class="dev-meta">
      <span>ThinkCode Lab v1.1.1 (Production Release) • 100% Offline WASM</span>
    </div>
  `;
  openSheet('Developer & Architecture', card);
}
$('btnDev')?.addEventListener('click', showDevProfile);
$('brandDev')?.addEventListener('click', showDevProfile);
$('brandDev')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDevProfile(); }
});
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
if ($('stdin')) $('stdin').value = cur.input === 'stdin' ? store.get('cf.in.' + cur.id, cur.stdin || '') : '';
applyLang(); syncButtons();
const warmPromise = warm();
window.__app = { run, stop, engines, cur: () => cur, editorPhp: () => editorPhp, editorHtml: () => editorHtml, running: () => running };

// ---------- compulsory 2.5s splash screen + component loading ----------
const splashMinTimer = new Promise(resolve => setTimeout(resolve, 2500));
const maxSafetyTimeout = new Promise(resolve => setTimeout(resolve, 6000));
const componentReady = Promise.all([
  warmPromise || Promise.resolve(),
  document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve()
]);

Promise.all([
  splashMinTimer,
  Promise.race([componentReady, maxSafetyTimeout])
]).then(() => {
  requestAnimationFrame(() => {
    document.body.classList.add('app-ready');
    const splash = $('app-splash');
    if (splash) {
      const caption = splash.querySelector('.splash-caption');
      if (caption) caption.textContent = 'Ready!';
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.remove();
        $('critical-splash-css')?.remove();
      }, 450);
    }
  });
});
