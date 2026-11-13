import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import { LANGS } from './languages.js';
import { engines } from './engines/index.js';
import { createEditor } from './editor.js';
import { formatCode } from './formatter.js';
import { sqlui } from './sql-ui.js';
import { shellui } from './shell-ui.js';
import { PRACTICALS } from './practicals.js';
import {
  loadJournalProfile,
  saveJournalProfile,
  todayIsoDate,
  sanitizePdfFilename,
  collectJournalSnapshot,
  buildJournalHtml,
  renderJournalPdfBytes
} from './lab-journal.js';
import {
  APP_META,
  UPDATE_STORAGE_KEYS,
  SNOOZE_DURATION_MS,
  getInstalledAppVersion,
  normalizeManifest,
  isUpdateAvailable,
  shouldRunSilentCheck,
  shouldShowUpdateToast,
  createSimulatedManifest,
  fetchLatestManifest,
  formatReleaseDate,
  formatShortChecksum
} from './update-checker.js';
import {
  initPythonTools,
  openPackagesDialog,
  openDataFilesDialog,
  markPackageLoaded,
  markPackageFailed,
  setMountedFiles,
  addMountedFile,
  removeMountedFile,
  isPlottingScript
} from './python-tools.js';

const $ = id => document.getElementById(id);
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
};
const con = $('console'), preview = $('preview');
let cur = LANGS.find(l => l.id === store.get('cf.lang') && l.engine) || LANGS[0];
let running = false, stopped = false, saveTimer = 0;
let editorHtml = null, editorPhp = null, lastFocusedEditor = null;
let phpViewMode = store.get('cf.php.view_mode', 'split');
let activePracticalMeta = null;

// ---------- small helpers ----------
const wide = () => matchMedia('(min-width: 900px)').matches;
function setSplit(p) {
  const prop = wide() ? '--split-desktop' : '--split';
  document.documentElement.style.setProperty(prop, Math.min(85, Math.max(15, p)) + '%');
}
function setOutputSmall() {
  if (!wide()) setSplit(80);
}
function setOutputLarge() {
  if (!wide()) setSplit(35);
}
let toastTimer;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600); }
function setState(s, text) { const e = $('runtimeState'); if (!e) return; e.dataset.s = s; e.textContent = text; }
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

export function showPlotLoader(title = 'Rendering Data Visualization…', status = 'Preparing scientific libraries & plotting engine…') {
  const loader = $('pyPlotLoader');
  if (!loader) return;
  const tEl = $('pyPlotLoaderTitle');
  const sEl = $('pyPlotLoaderStatus');
  if (tEl) tEl.textContent = title;
  if (sEl) sEl.textContent = status;
  loader.hidden = false;
  requestAnimationFrame(() => {
    loader.classList.add('is-active');
  });
}

export function hidePlotLoader() {
  const loader = $('pyPlotLoader');
  if (!loader || loader.hidden) return;
  loader.classList.remove('is-active');
  loader.hidden = true;
}

export function updatePlotLoaderStatus(status) {
  const loader = $('pyPlotLoader');
  if (!loader || loader.hidden) return;
  const sEl = $('pyPlotLoaderStatus');
  if (sEl && status) {
    let clean = String(status).trim();
    if (clean.startsWith('Loading ')) clean = `Downloading ${clean.slice(8)}…`;
    else if (clean.startsWith('Loaded ')) clean = `✓ Loaded ${clean.slice(7)}`;
    sEl.textContent = clean;
  }
}

function renderPlotImage(b64) {
  const wrap = document.createElement('div');
  wrap.className = 'con-plot-wrap';

  const head = document.createElement('div');
  head.className = 'con-plot-head';

  const title = document.createElement('span');
  title.className = 'con-plot-title';
  title.textContent = '📊 Matplotlib Plot';

  const tools = document.createElement('div');
  tools.className = 'con-plot-tools';

  const btnCopy = document.createElement('button');
  btnCopy.type = 'button';
  btnCopy.className = 'tool con-plot-btn-copy';
  btnCopy.textContent = 'Copy';
  btnCopy.title = 'Copy Image to Clipboard';
  btnCopy.onclick = async () => {
    try {
      const res = await fetch(`data:image/png;base64,${b64}`);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast('✓ Plot copied to clipboard!');
      } else {
        toast('Clipboard copy not supported by browser');
      }
    } catch (_) {
      toast('Could not copy plot');
    }
  };

  const btnSave = document.createElement('button');
  btnSave.type = 'button';
  btnSave.className = 'tool con-plot-btn-save';
  btnSave.textContent = 'Save PNG';
  btnSave.title = 'Download Plot as PNG image';
  btnSave.onclick = () => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${b64}`;
    a.download = `plot_${Date.now()}.png`;
    a.click();
    toast('✓ Plot downloaded!');
  };

  tools.append(btnCopy, btnSave);
  head.append(title, tools);

  const imgBox = document.createElement('div');
  imgBox.className = 'con-plot-img-box';

  const img = document.createElement('img');
  img.className = 'con-plot-img';
  img.src = `data:image/png;base64,${b64}`;
  img.alt = 'Python Matplotlib Plot';

  imgBox.append(img);
  wrap.append(head, imgBox);

  con.append(wrap);
  stick();
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
  window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
}

const sink = {
  out: s => print(s),
  err: s => {
    hidePlotLoader();
    print(s, 'err');
  },
  table,
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
  need_input: () => {
    hidePlotLoader();
    con.querySelector('.con-input-wrap, .con-input')?.remove();
    const wrap = document.createElement('span');
    wrap.className = 'con-input-wrap';

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'con-input';
    inp.autocomplete = 'off';
    inp.autocorrect = 'off';
    inp.autocapitalize = 'off';
    inp.spellcheck = false;
    inp.enterKeyHint = 'send';
    inp.style.width = '3ch';
    inp.oninput = () => {
      inp.style.width = Math.max(3, inp.value.length + 1) + 'ch';
      stick();
    };

    const submit = () => {
      const val = inp.value;
      const s = document.createElement('span');
      s.className = 'con-val';
      s.textContent = val + '\n';
      wrap.replaceWith(s);
      engines[cur.engine]?.sendInput(val);
      stick();
    };

    inp.onkeydown = e => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13) {
        e.preventDefault();
        submit();
      }
    };

    const btnSend = document.createElement('button');
    btnSend.type = 'button';
    btnSend.className = 'con-input-submit';
    btnSend.textContent = '↵ Enter';
    btnSend.title = 'Send input (Enter)';
    btnSend.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      submit();
    };

    wrap.append(inp, btnSend);
    con.append(wrap);
    stick();
    setTimeout(() => {
      inp.focus();
      inp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 25);
  },
  meta: m => sqlui.onMeta(m), save: v => sqlui.onSave(v), tx: v => sqlui.onTx(v), export: v => sqlui.onExport(v),
  status: s => {
    setState('loading', s);
    const txt = con.querySelector('.cwn-text');
    if (txt) txt.textContent = s;
    if (cur.id === 'python' && /matplotlib|seaborn|pyplot/i.test(s)) {
      const loader = $('pyPlotLoader');
      if (loader && loader.hidden && running) {
        showPlotLoader('Rendering Data Visualization…', s);
      }
    }
    updatePlotLoaderStatus(s);
  },
  clear: () => {
    con.textContent = '';
    hideJavaGui();
    hidePlotLoader();
  },
  preview: html => {
    preview.srcdoc = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + HOOK) : HOOK + html;
    showTab('preview');
  },
  gui_window: winData => renderJavaGuiWindow(winData),
  plot: b64 => {
    hidePlotLoader();
    renderPlotImage(b64);
  },
  package_loaded: ({ name }) => {
    markPackageLoaded(name);
    toast(`✓ Installed ${name} successfully!`);
  },
  package_failed: ({ name, error }) => {
    markPackageFailed(name, error);
    toast(`Failed to install ${name}: ${error}`);
  },
  file_list: files => setMountedFiles(files),
  file_mounted: ({ name, size }) => addMountedFile(name, size),
  file_unmounted: ({ name }) => removeMountedFile(name)
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
lastFocusedEditor = editor;
editor.view?.dom.addEventListener('focusin', () => { lastFocusedEditor = editor; });

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
  const target = cur;
  const eng = engines[target.engine], label = eng?.label || target.name;
  if (!eng) return Promise.resolve();
  stopped = false;
  const needsWarm = target.id === 'python' || target.id === 'sql' || target.id === 'php' || target.id === 'c' || target.id === 'cpp' || target.id === 'java';
  if (needsWarm && !eng.isReady) {
    setState('loading', `Loading ${label}…`);
    if (!running && con.textContent.trim() === '') {
      showConsoleWarmNotice(label);
    }
  } else if (eng.isReady) {
    setState('ready', `${label} · offline`);
  }

  return eng.load(sink).then(() => {
    if (cur.id === target.id && !stopped) {
      setState('ready', `${label} · offline`);
      hideConsoleWarmNotice(label);
    }
    if (target.id === 'sql' && cur.id === 'sql') sqlui.ensure().catch(e => { if (!stopped) print(String(e.message || e) + '\n', 'err'); });
  }).catch(e => {
    if (cur.id === target.id && !stopped && e?.message !== 'Stopped') {
      setState('error', 'Runtime failed');
      print(String(e.message || e) + '\n', 'err');
    }
  });
}
function hideJavaGui() {
  const modal = $('guiWindowModal');
  if (modal) modal.hidden = true;
  const btnReopen = $('btnReopenGui');
  if (btnReopen) btnReopen.hidden = true;
}

function select(l) {
  if (!l.engine) return toast(`${l.name} — ${l.soon}`);
  if (l.id === cur.id) return;
  if (running) return toast('Stop the current run first.');
  hideJavaGui();
  activePracticalMeta = null;
  if (cur.input === 'stdin' && $('stdin')) store.set('cf.in.' + cur.id, $('stdin').value);
  cur = l; store.set('cf.lang', l.id);
  editor.set(store.get('cf.code.' + l.id, l.tpl), l.id);
  if ($('stdin')) $('stdin').value = l.input === 'stdin' ? store.get('cf.in.' + l.id, l.stdin || '') : '';
  con.textContent = ''; setOutputSmall(); applyLang(); warm();
}
let wasShell = false;
function applyLang() {
  hidePlotLoader();
  if (cur.id !== 'java') {
    hideJavaGui();
  }
  const isPhp = cur.id === 'php';
  const isPy = cur.id === 'python';
  $('editor').hidden = isPhp;
  $('dualEditor').hidden = !isPhp;
  $('phpViewSwitch').hidden = !isPhp;
  const pyTools = $('pyToolsSwitch');
  if (pyTools) pyTools.hidden = !isPy;
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
function setRunLabel(text) {
  const btn = $('btnRun');
  if (!btn) return;
  const sr = btn.querySelector('.sr-only');
  if (sr) sr.textContent = text;
  btn.title = `${text} (⌘↵)`;
  btn.setAttribute('aria-label', text);
}

function syncButtons() {
  const btn = $('btnRun');
  if (btn) {
    const isUnstoppable = cur.id === 'shell' || cur.id === 'web';
    const iconRun = btn.querySelector('.icon-run');
    const iconStop = btn.querySelector('.icon-stop');

    if (running) {
      btn.classList.add('is-running');
      if (iconRun) iconRun.hidden = true;
      if (iconStop) iconStop.hidden = false;
      btn.disabled = isUnstoppable;
      setRunLabel(isUnstoppable ? 'Running…' : 'Stop');
      btn.title = isUnstoppable ? 'Running…' : 'Stop execution (⌘↵)';
    } else {
      btn.classList.remove('is-running');
      if (iconRun) iconRun.hidden = false;
      if (iconStop) iconStop.hidden = true;
      btn.disabled = false;
      setRunLabel('Run');
      btn.title = 'Run code (⌘↵)';
    }
  }
  const btnStop = $('btnStop');
  if (btnStop) btnStop.disabled = !running || cur.id === 'shell' || cur.id === 'web';
  const bSec = $('btnRunPhpSec');
  if (bSec) bSec.disabled = running;
  if (!running) {
    con.querySelector('.con-input-wrap, .con-input')?.remove();
    closePromptModal(null);
  }
}
async function run(arg) {
  if (running || !cur.engine) return;
  hideJavaGui();
  setOutputLarge();
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
    const wasWarming = !eng.isReady && (cur.id === 'python' || cur.id === 'sql' || cur.id === 'php' || cur.id === 'c' || cur.id === 'cpp' || cur.id === 'java');
    sink.clear();

    const codeToRun = customCode || editor.get();
    const isPyPlot = cur.id === 'python' && isPlottingScript(codeToRun);
    if (isPyPlot) {
      const initialStatus = wasWarming
        ? 'Initializing Pyodide WebAssembly runtime & scientific packages…'
        : 'Preparing scientific libraries & plotting engine…';
      showPlotLoader('Rendering Data Visualization…', initialStatus);
    }

    if (wasWarming) {
      print(`⏳ ${eng.label || cur.name} runtime is still downloading/loading on your device…\n`, 'sys');
      print(`   Execution is queued — your code will run automatically as soon as ready!\n\n`, 'mute');
      toast(`⏳ Loading ${eng.label || cur.name}... queued to run`);
      setRunLabel('Loading…');
    }
    const t0 = performance.now();
    if (cur.id === 'shell') print(`$ bash ${cur.file}\n`, 'cmd');
    else if (cur.id === 'c') print(`$ gcc ${cur.file} -o main && ./main\n`, 'cmd');
    else if (cur.id === 'cpp') print(`$ g++ ${cur.file} -o main && ./main\n`, 'cmd');
    else if (cur.id === 'java') print(`$ javac ${cur.file} && java Main\n`, 'cmd');
    await eng.load(sink); setState('ready', `${eng.label || cur.name} · offline`);
    if (wasWarming && !stopped) {
      print(`✓ ${eng.label || cur.name} ready! Executing your code…\n`, 'ok');
      print('──────────────────────────────────────────────────\n', 'mute');
      setRunLabel('Running…');
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
    hidePlotLoader();
    running = false;
    syncButtons();
  }
}
function stop() {
  if (!running) return;
  stopped = true;
  running = false;
  syncButtons();
  hideJavaGui();
  hidePlotLoader();
  con.querySelector('.con-input-wrap, .con-input')?.remove();
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
    setRunLabel('Loading…');
  }
  const t0 = performance.now();
  print(`$ php process.php\n`, 'cmd');
  await eng.load(sink);
  if (wasWarming && !stopped) {
    print(`✓ PHP 8.2 ready! Executing code…\n`, 'ok');
    print('──────────────────────────────────────────────────\n', 'mute');
    setRunLabel('Running…');
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

const bRun = $('btnRun');
if (bRun) {
  bRun.onclick = () => {
    if (running) stop();
    else run();
  };
}
const bStop = $('btnStop');
if (bStop) bStop.onclick = stop;
const bCancelPlot = $('btnCancelPlot');
if (bCancelPlot) bCancelPlot.onclick = stop;
const bClr = $('btnClear');
if (bClr) bClr.onclick = () => { con.textContent = ''; hidePlotLoader(); setOutputSmall(); };
const stdinEl = $('stdin');
if (stdinEl) stdinEl.oninput = e => store.set('cf.in.' + cur.id, e.target.value);
window.addEventListener('keydown', e => {
  if ($('journalDialog')?.open || $('updateDialog')?.open || $('pyPkgDialog')?.open || $('pyDataFilesDialog')?.open) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (running) stop();
    else run();
  }
});
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
      return true;
    } else {
      const mime = name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('Saved ' + name);
      return true;
    }
  } catch (e) {
    const msg = String(e?.message || e);
    if (/cancel/i.test(msg)) return false;
    toast('Could not save: ' + msg);
    return false;
  }
}
function handleExportCode() {
  if (cur.id === 'php' && editorHtml && editorPhp) {
    if (phpViewMode === 'html') saveFile('index.html', editorHtml.get());
    else saveFile('process.php', editorPhp.get());
  } else {
    saveFile(cur.file, editor.get());
  }
}
if ($('btnExport')) $('btnExport').onclick = handleExportCode;
function openSheet(title, node) {
  $('sheetTitle').textContent = title;
  const b = $('sheetBody');
  b.textContent = '';
  if (typeof node === 'string') b.innerHTML = node;
  else b.append(node);
  $('sheet').hidden = false;
}
function closeSheet() {
  $('sheet').hidden = true;
  window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
}
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
  const ver = getInstalledAppVersion();
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
      <span>ThinkCode Lab v${ver.versionName} (Build ${ver.versionCode} • Production Release) • 100% Offline WASM</span>
    </div>
  `;
  openSheet('Developer & Architecture', card);
}
$('btnDev')?.addEventListener('click', showDevProfile);
$('btnDevHeader')?.addEventListener('click', (e) => {
  e.stopPropagation();
  showDevProfile();
});
$('brandDev')?.addEventListener('click', showDevProfile);

function openPracticalsSheet() {
  const activeLang = cur.id;
  let activeCat = 'All';
  let searchQuery = '';

  const titles = {
    python: '🐍 Python Lab Practicals (CA-214)',
    cpp: '⚡ C++ Lab Practicals (CA-113 & CA-123)',
    shell: '🐧 Linux OS Practicals (CA-123)',
    web: '🌐 Web Design-I HTML Practicals (CA-115)',
    js: '💛 Web Design-II JavaScript Practicals (CA-125)',
    sql: '🗄️ DBMS Oracle SQL Practicals (CA-223)',
    c: '⚙️ C Programming Practicals'
  };

  const title = titles[activeLang] || `📚 ${cur.name} Practicals`;

  const container = document.createElement('div');
  container.className = 'prac-container';

  const items = PRACTICALS[activeLang] || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: var(--mute);">
        <div style="font-size: 32px; margin-bottom: 12px;">📚</div>
        <h3 style="color: var(--text); margin-bottom: 8px;">No Practicals Available Yet</h3>
        <p>University syllabus practicals for ${cur.name} are coming soon.</p>
      </div>
    `;
    openSheet(title, container);
    return;
  }

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'sheet-search';
  searchInput.placeholder = `Search ${cur.name} practicals (e.g. Assignment, Function, Loop)...`;

  const catBar = document.createElement('div');
  catBar.className = 'prac-filter-bar';

  const list = document.createElement('div');
  list.className = 'prac-cards-list';

  function renderCats() {
    catBar.innerHTML = '';
    const cats = ['All', ...new Set(items.map(i => i.cat))];
    if (cats.length <= 2 && cats[0] === 'All') {
      catBar.style.display = 'none';
      return;
    }
    catBar.style.display = 'flex';
    cats.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `prac-chip ${activeCat === c ? 'active' : ''}`;
      btn.textContent = c;
      btn.onclick = () => {
        activeCat = c;
        renderCats();
        renderList();
      };
      catBar.appendChild(btn);
    });
  }

  function renderList() {
    list.innerHTML = '';
    const q = searchQuery.toLowerCase().trim();

    const filtered = items.filter(item => {
      const matchesCat = activeCat === 'All' || item.cat === activeCat;
      const matchesSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        item.num.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--mute);">No practicals found matching your search.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'prac-card';
      card.innerHTML = `
        <div class="prac-card-top">
          <span class="prac-badge">${item.num}</span>
          <span class="prac-cat">${item.cat}</span>
        </div>
        <h4 class="prac-card-title">${item.title}</h4>
        <p class="prac-card-desc">${item.desc}</p>
        <div class="prac-card-footer">
          <button type="button" class="prac-btn-load">Load into Editor ➔</button>
        </div>
      `;
      card.onclick = () => {
        loadPracticalCode(item, activeLang);
      };
      list.appendChild(card);
    });
  }

  searchInput.oninput = e => {
    searchQuery = e.target.value;
    renderList();
  };

  container.appendChild(searchInput);
  container.appendChild(catBar);
  container.appendChild(list);

  renderCats();
  renderList();

  openSheet(title, container);
}

function loadPracticalCode(item, langId) {
  const targetLang = LANGS.find(l => l.id === langId);
  if (!targetLang) return;

  if (cur.id !== langId) {
    select(targetLang);
  }
  activePracticalMeta = {
    langId,
    num: item.num,
    cat: item.cat,
    title: item.title,
    desc: item.desc
  };
  editor.set(item.code, langId);
  store.set('cf.code.' + langId, item.code);

  // Reset output box and set it to small position
  sink.clear();
  con.querySelector('.con-input-wrap, .con-input')?.remove();
  if (cur.id === 'web' || cur.id === 'php') {
    preview.srcdoc = '';
  }
  showTab('console');
  setOutputSmall();

  closeSheet();
  toast(`✓ Loaded ${item.num}: ${item.title}`);
}

$('btnPracticals')?.addEventListener('click', openPracticalsSheet);
if ($('btnOpen')) $('btnOpen').onclick = () => $('filePick')?.click();
$('filePick').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  editor.set(await f.text(), cur.id); toast('Opened ' + f.name); e.target.value = '';
};

function handleResetTemplate() {
  if (confirm('Replace your code with the starter template?')) {
    activePracticalMeta = null;
    if (cur.id === 'php' && editorHtml && editorPhp) {
      editorHtml.set(DEFAULT_PHP_HTML, 'web');
      editorPhp.set(DEFAULT_PHP_SCRIPT, 'php');
      store.set('cf.code.php_html', DEFAULT_PHP_HTML);
      store.set('cf.code.php_script', DEFAULT_PHP_SCRIPT);
    } else {
      editor.set(cur.tpl, cur.id);
    }
    sink.clear();
    con.querySelector('.con-input-wrap, .con-input')?.remove();
    setOutputSmall();
    toast('Template restored');
  }
}
if ($('btnReset')) $('btnReset').onclick = handleResetTemplate;

/* ==========================================================================
   Slide-out Navigation Drawer / Options Slider
   ========================================================================== */
function openMenuDrawer() {
  const d = $('menuDrawer');
  if (!d) return;
  d.hidden = false;
  requestAnimationFrame(() => {
    d.classList.add('open');
  });
  updateDrawerThemeStatus();
}

function closeMenuDrawer() {
  const d = $('menuDrawer');
  if (!d || d.hidden) return;
  d.classList.remove('open');
  setTimeout(() => {
    if (!d.classList.contains('open')) {
      d.hidden = true;
      window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
    }
  }, 280);
}

function updateDrawerThemeStatus() {
  const currentTheme = document.documentElement.dataset.theme || store.get('cf.theme', 'dark');
  const isDark = currentTheme === 'dark';
  const icon = $('menuThemeIcon');
  const title = $('menuThemeTitle');
  const sub = $('menuThemeSub');
  const pill = $('menuThemePill');
  if (icon) icon.textContent = isDark ? '🌙' : '☀️';
  if (title) title.textContent = isDark ? 'Theme: Dark Mode' : 'Theme: Light Mode';
  if (sub) sub.textContent = isDark ? 'Tap to switch to Light mode' : 'Tap to switch to Dark mode';
  if (pill) {
    pill.textContent = isDark ? 'Dark' : 'Light';
    pill.className = `d-badge ${isDark ? 'dark' : 'light'}`;
  }
}

// Drawer openers & closers
$('btnMenu')?.addEventListener('click', openMenuDrawer);
$('brandLogo')?.addEventListener('click', openMenuDrawer);
$('brandLogo')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openMenuDrawer();
  }
});
$('btnCloseDrawer')?.addEventListener('click', closeMenuDrawer);
$('menuDrawerBackdrop')?.addEventListener('click', closeMenuDrawer);
document.querySelectorAll('[data-close-drawer]').forEach(el => {
  el.addEventListener('click', closeMenuDrawer);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('menuDrawer')?.hidden) {
    closeMenuDrawer();
  }
});

// Drawer menu item actions
$('menuBtnOpen')?.addEventListener('click', () => {
  closeMenuDrawer();
  $('filePick')?.click();
});
$('menuBtnExport')?.addEventListener('click', () => {
  closeMenuDrawer();
  handleExportCode();
});
$('menuBtnReset')?.addEventListener('click', () => {
  closeMenuDrawer();
  handleResetTemplate();
});
$('menuBtnTheme')?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  theme(next);
});
$('menuBtnDev')?.addEventListener('click', () => {
  closeMenuDrawer();
  showDevProfile();
});

function syncNativeSystemBars(t) {
  if (!document.body.classList.contains('app-ready')) return;
  try {
    window.ThinkCodeSystemUI?.setTheme?.(t === 'light');
  } catch (_) {}
}

function theme(t) {
  document.documentElement.dataset.theme = t; store.set('cf.theme', t);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = t === 'dark' ? '#0E1622' : '#FFFFFF';
  $('btnTheme')?.querySelector('use')?.setAttribute('href', t === 'dark' ? '#i-sun' : '#i-moon');
  updateDrawerThemeStatus();
  syncNativeSystemBars(t);
}
if ($('btnTheme')) $('btnTheme').onclick = () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
theme(store.get('cf.theme', 'dark'));

const grip = $('grip'), work = $('work');
grip.onpointerdown = e => {
  grip.setPointerCapture(e.pointerId);
  work.classList.add('resizing');
  const mv = ev => { const r = work.getBoundingClientRect(); setSplit(((wide() ? ev.clientX - r.left : ev.clientY - r.top) / (wide() ? r.width : r.height)) * 100); };
  grip.addEventListener('pointermove', mv);
  grip.addEventListener('pointerup', () => {
    work.classList.remove('resizing');
    grip.removeEventListener('pointermove', mv);
  }, { once: true });
};
grip.onkeydown = e => {
  const cs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(wide() ? '--split-desktop' : '--split')) || (wide() ? 52 : 80);
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
  editorHtml.view?.dom.addEventListener('focusin', () => { lastFocusedEditor = editorHtml; });

  editorPhp = createEditor($('editorPhp'), {
    doc: initialPhp,
    lang: 'php',
    onRun: () => run(),
    onChange: text => {
      $('saveState').textContent = 'Saving…'; clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { store.set('cf.code.php_script', text); $('saveState').textContent = 'Saved'; }, 350);
    }
  });
  editorPhp.view?.dom.addEventListener('focusin', () => { lastFocusedEditor = editorPhp; });

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
    $('fileName').textContent = 'index.html';
  } else if (mode === 'php') {
    $('fileName').textContent = 'process.php';
  } else {
    $('fileName').textContent = 'index.php';
  }
}

// ---------- Zoom Controls (Editor & Console Output) ----------
let currentEditorFontSize = parseFloat(store.get('cf.editor_font_size') || '13.5');
if (isNaN(currentEditorFontSize) || currentEditorFontSize < 9.5 || currentEditorFontSize > 26) {
  currentEditorFontSize = 13.5;
}

let currentOutFontSize = parseFloat(store.get('cf.output_font_size') || '13');
if (isNaN(currentOutFontSize) || currentOutFontSize < 9.5 || currentOutFontSize > 26) {
  currentOutFontSize = 13;
}

function applyEditorZoom(size) {
  currentEditorFontSize = Math.min(24, Math.max(9.5, Math.round(size * 10) / 10));
  document.documentElement.style.setProperty('--editor-font-size', `${currentEditorFontSize}px`);
  store.set('cf.editor_font_size', String(currentEditorFontSize));
}

function applyOutputZoom(size) {
  currentOutFontSize = Math.min(24, Math.max(9.5, Math.round(size * 10) / 10));
  document.documentElement.style.setProperty('--console-font-size', `${currentOutFontSize}px`);
  store.set('cf.output_font_size', String(currentOutFontSize));
}

function initZoomControls() {
  applyEditorZoom(currentEditorFontSize);
  applyOutputZoom(currentOutFontSize);

  // Editor zoom buttons (A-, A+)
  $('btnZoomIn')?.addEventListener('click', () => {
    applyEditorZoom(currentEditorFontSize + 1);
  });
  $('btnZoomOut')?.addEventListener('click', () => {
    applyEditorZoom(currentEditorFontSize - 1);
  });

  // Output zoom buttons (A-, A+)
  $('btnOutZoomIn')?.addEventListener('click', () => {
    applyOutputZoom(currentOutFontSize + 1);
  });
  $('btnOutZoomOut')?.addEventListener('click', () => {
    applyOutputZoom(currentOutFontSize - 1);
  });

  // Keyboard shortcuts: Ctrl/Cmd + / - (adjusts editor)
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        applyEditorZoom(currentEditorFontSize + 1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        applyEditorZoom(currentEditorFontSize - 1);
      } else if (e.key === '0') {
        e.preventDefault();
        applyEditorZoom(13.5);
        applyOutputZoom(13);
      }
    }
  });

  // Touch pinch-to-zoom on editorPane for mobile
  const editorPane = $('editorPane');
  if (editorPane) {
    let initialPinchDist = 0;
    let initialFontSize = currentEditorFontSize;

    editorPane.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialFontSize = currentEditorFontSize;
      }
    }, { passive: true });

    editorPane.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = dist - initialPinchDist;
        if (Math.abs(diff) > 15) {
          applyEditorZoom(initialFontSize + (diff / 25));
        }
      }
    }, { passive: true });

    editorPane.addEventListener('touchend', e => {
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
    }, { passive: true });
  }

  // Touch pinch-to-zoom on output/console for mobile
  const conEl = $('console');
  if (conEl) {
    let initialConPinchDist = 0;
    let initialConFontSize = currentOutFontSize;

    conEl.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initialConPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialConFontSize = currentOutFontSize;
      }
    }, { passive: true });

    conEl.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && initialConPinchDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = dist - initialConPinchDist;
        if (Math.abs(diff) > 15) {
          applyOutputZoom(initialConFontSize + (diff / 25));
        }
      }
    }, { passive: true });

    conEl.addEventListener('touchend', e => {
      if (e.touches.length < 2) {
        initialConPinchDist = 0;
      }
    }, { passive: true });
  }
}

// ---------- Java AWT / Swing Interactive Desktop Window Frame ----------
let activeGuiWinData = null;

function renderJavaGuiWindow(winData) {
  if (!winData) return;
  activeGuiWinData = winData;

  const modal = $('guiWindowModal');
  const win = $('guiWindow');
  const titleEl = $('guiWinTitle');
  const contentEl = $('guiWinContent');
  const statusEl = $('guiStatusText');
  const btnReopen = $('btnReopenGui');

  if (!modal || !win || !contentEl) return;

  if (titleEl) titleEl.textContent = winData.title || 'Java Application Frame';
  if (statusEl) statusEl.textContent = `Active · Dimensions: ${winData.width || 400}x${winData.height || 300}`;

  win.classList.remove('maximized');
  win.style.position = '';
  win.style.left = '';
  win.style.top = '';
  win.style.margin = '';
  if (winData.width && winData.width >= 300 && winData.width <= 650 && window.innerWidth > 600) {
    win.style.width = `${winData.width + 30}px`;
  } else {
    win.style.width = '';
  }

  contentEl.innerHTML = '';
  const renderedTree = buildGuiContainer(winData.layout, winData.components);
  contentEl.appendChild(renderedTree);

  modal.hidden = false;
  if (btnReopen) btnReopen.hidden = true;

  toast(`☕ Java GUI Window Launched: "${winData.title}"`);
}

function buildGuiContainer(layout, components = []) {
  const container = document.createElement('div');
  const rawType = (layout?.type || layout?.layoutType || '').toLowerCase();

  if (rawType.includes('border')) {
    container.className = 'gui-layout-border';
    const northList = [];
    const centerList = [];
    const southList = [];
    const westList = [];
    const eastList = [];

    for (const c of components) {
      const pos = (c.pos || '').toLowerCase();
      if (pos.includes('north')) northList.push(c);
      else if (pos.includes('south')) southList.push(c);
      else if (pos.includes('east')) eastList.push(c);
      else if (pos.includes('west')) westList.push(c);
      else centerList.push(c);
    }

    if (northList.length) {
      const nDiv = document.createElement('div');
      nDiv.className = 'gui-pos-north';
      northList.forEach(c => nDiv.appendChild(buildGuiComp(c)));
      container.appendChild(nDiv);
    }
    if (centerList.length) {
      const cDiv = document.createElement('div');
      cDiv.className = 'gui-pos-center';
      centerList.forEach(c => cDiv.appendChild(buildGuiComp(c)));
      container.appendChild(cDiv);
    }
    if (southList.length) {
      const sDiv = document.createElement('div');
      sDiv.className = 'gui-pos-south';
      southList.forEach(c => sDiv.appendChild(buildGuiComp(c)));
      container.appendChild(sDiv);
    }
    return container;
  }

  if (rawType.includes('grid')) {
    container.className = 'gui-layout-grid';
    const cols = layout.cols || 2;
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (const c of components) {
      container.appendChild(buildGuiComp(c));
    }
    return container;
  }

  container.className = 'gui-layout-flow';
  for (const c of components) {
    container.appendChild(buildGuiComp(c));
  }
  return container;
}

function buildGuiComp(c) {
  const t = (c.type || '').toLowerCase();

  if (t === 'jpanel' || t === 'panel') {
    const p = buildGuiContainer(c.layout, c.children || []);
    p.classList.add('gui-panel');
    return p;
  }

  if (t === 'jtextfield' || t === 'textfield') {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'gui-input';
    inp.value = c.text || '';
    if (c.text === '0' && c.pos && c.pos.toLowerCase().includes('north')) {
      inp.classList.add('calc-screen');
      inp.readOnly = true;
    } else {
      inp.placeholder = 'Enter username';
    }
    inp.dataset.compId = 'textfield';
    return inp;
  }

  if (t === 'jpasswordfield' || t === 'passwordfield') {
    const inp = document.createElement('input');
    inp.type = 'password';
    inp.className = 'gui-input';
    inp.value = c.text || '';
    inp.placeholder = 'Enter password';
    inp.dataset.compId = 'passwordfield';
    return inp;
  }

  if (t === 'jlabel' || t === 'label') {
    const lbl = document.createElement('label');
    lbl.className = 'gui-label';
    lbl.textContent = c.text;
    return lbl;
  }

  if (t === 'jbutton' || t === 'button') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gui-btn';
    btn.textContent = c.text;

    if (['+', '-', '*', '/'].includes(c.text)) {
      btn.classList.add('calc-btn-op');
    } else if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(c.text)) {
      btn.classList.add('calc-btn-num');
    } else if (c.text === 'C' || c.text === 'Clear') {
      btn.classList.add('calc-btn-clear');
    } else if (c.text === '=') {
      btn.classList.add('calc-btn-eq');
    } else if (c.text.toLowerCase().includes('login') || c.text.toLowerCase().includes('submit')) {
      btn.classList.add('btn-login-submit');
    } else if (c.text.toLowerCase().includes('reset')) {
      btn.classList.add('btn-login-reset');
    }

    btn.onclick = () => handleGuiButtonClick(c.text, btn);
    return btn;
  }

  if (t === 'jcheckbox' || t === 'checkbox' || t === 'jradiobutton' || t === 'radiobutton') {
    const wrap = document.createElement('label');
    wrap.className = 'gui-label';
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    wrap.style.cursor = 'pointer';

    const chk = document.createElement('input');
    chk.type = t.includes('radio') ? 'radio' : 'checkbox';
    chk.checked = c.selected;
    chk.onchange = () => {
      print(`[Swing GUI] ${c.type} (${c.text}) toggled: ${chk.checked}\n`, 'sys');
    };

    const span = document.createElement('span');
    span.textContent = c.text;
    wrap.append(chk, span);
    return wrap;
  }

  if (t === 'jcombobox' || t === 'combobox' || t === 'choice') {
    const sel = document.createElement('select');
    sel.className = 'gui-input';
    (c.items || []).forEach(it => {
      const opt = document.createElement('option');
      opt.value = it;
      opt.textContent = it;
      sel.appendChild(opt);
    });
    sel.onchange = () => {
      print(`[Swing GUI] ComboBox selection changed to: "${sel.value}"\n`, 'sys');
    };
    return sel;
  }

  if (t === 'jtextarea' || t === 'textarea') {
    const ta = document.createElement('textarea');
    ta.className = 'gui-input';
    ta.rows = c.rows || 4;
    ta.value = c.text || '';
    return ta;
  }

  if (t === 'jlist' || t === 'list') {
    const sel = document.createElement('select');
    sel.className = 'gui-input';
    sel.size = Math.max(2, (c.items || []).length);
    (c.items || []).forEach(it => {
      const opt = document.createElement('option');
      opt.value = it;
      opt.textContent = it;
      sel.appendChild(opt);
    });
    return sel;
  }

  const d = document.createElement('div');
  d.textContent = c.text || c.type;
  return d;
}

function handleGuiButtonClick(btnText, btnEl) {
  print(`[Swing GUI] Button Click: "${btnText}"\n`, 'cmd');

  const contentEl = $('guiWinContent');
  const calcScreen = contentEl?.querySelector('.calc-screen');
  const statusText = $('guiStatusText');
  const statusDot = document.querySelector('.gui-status-dot');

  // Calculator (Assignment 13)
  if (calcScreen) {
    if (btnText === 'C') {
      calcScreen.value = '0';
      if (statusText) statusText.textContent = 'Calculator display cleared.';
      return;
    }
    if (btnText === '=') {
      try {
        const expr = calcScreen.value.replace(/×/g, '*').replace(/÷/g, '/').trim();
        if (/^[0-9+\-*/. ()]+$/.test(expr)) {
          const res = Function(`"use strict"; return (${expr})`)();
          calcScreen.value = String(res);
          print(`[Swing Event Listener Triggered] Calculation Result: ${expr} = ${res}\n`, 'ok');
          if (statusText) statusText.textContent = `Result: ${res}`;
        }
      } catch (err) {
        calcScreen.value = 'Error';
        if (statusText) statusText.textContent = 'Calculation Error';
      }
      return;
    }
    if (['+', '-', '*', '/'].includes(btnText)) {
      calcScreen.value += ` ${btnText} `;
      return;
    }
    if (calcScreen.value === '0' || calcScreen.value === 'Error') {
      calcScreen.value = btnText;
    } else {
      calcScreen.value += btnText;
    }
    return;
  }

  // Login Form (Assignment 14)
  if (btnText.toLowerCase().includes('login')) {
    const userInp = contentEl?.querySelector('input[type="text"]:not(.calc-screen)');
    const passInp = contentEl?.querySelector('input[type="password"]');
    const uVal = userInp?.value.trim() || '';
    const pVal = passInp?.value || '';

    print(`[Authentication Event Listener] Validating credentials for "${uVal}"...\n`, 'sys');

    if (!uVal || !pVal) {
      if (statusText) statusText.textContent = `✗ Please enter both Username and Password.`;
      if (statusDot) statusDot.classList.add('err');
      print(`✗ Authentication Failed: Both fields are required.\n`, 'err');
      toast(`✗ Please enter both Username and Password.`);
      return;
    }

    if ((uVal.toLowerCase() === 'juned_khan' && pVal === 'admin@123') || (uVal.toLowerCase() === 'admin' && pVal === 'admin')) {
      if (statusText) statusText.textContent = `✓ Login Successful! Welcome ${uVal} (Admin)`;
      if (statusDot) statusDot.classList.remove('err');
      print(`✓ Login Successful! Welcome to InfoGalaxy Computers Student Portal.\n`, 'ok');
      toast(`✓ Welcome ${uVal}! Login Successful.`);
    } else {
      if (statusText) statusText.textContent = `✓ Login Successful! Welcome ${uVal}`;
      if (statusDot) statusDot.classList.remove('err');
      print(`✓ Login Successful! Welcome "${uVal}" to Student Portal.\n`, 'ok');
      toast(`✓ Welcome ${uVal}! Login Successful.`);
    }
    return;
  }

  if (btnText.toLowerCase().includes('reset')) {
    const inputs = contentEl?.querySelectorAll('input');
    inputs?.forEach(i => i.value = '');
    if (statusText) statusText.textContent = 'Form reset: inputs cleared.';
    if (statusDot) statusDot.classList.remove('err');
    print(`[Swing GUI] Form inputs cleared.\n`, 'sys');
    toast('Form reset');
    return;
  }

  if (statusText) statusText.textContent = `Action performed: "${btnText}"`;
}

function initGuiWindowControls() {
  const modal = $('guiWindowModal');
  const win = $('guiWindow');
  const btnClose = $('guiBtnClose');
  const btnMin = $('guiBtnMin');
  const btnMax = $('guiBtnMax');
  const btnReopen = $('btnReopenGui');
  const titlebar = $('guiWinTitlebar');

  btnClose?.addEventListener('click', () => {
    modal.hidden = true;
    if (btnReopen && cur.id === 'java') btnReopen.hidden = false;
    print(`[GUI Window Closed]\n`, 'sys');
    window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
  });

  btnMin?.addEventListener('click', () => {
    modal.hidden = true;
    if (btnReopen && cur.id === 'java') btnReopen.hidden = false;
    toast('Window Minimized. Tap "☕ Java GUI Frame" to restore.');
    window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
  });

  btnMax?.addEventListener('click', () => {
    win?.classList.toggle('maximized');
  });

  btnReopen?.addEventListener('click', () => {
    modal.hidden = false;
    btnReopen.hidden = true;
  });

  modal?.addEventListener('click', e => {
    if (e.target.dataset.closeGui !== undefined || e.target.classList.contains('gui-backdrop')) {
      modal.hidden = true;
      if (btnReopen && cur.id === 'java') btnReopen.hidden = false;
      window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
    }
  });

  if (titlebar && win) {
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    titlebar.addEventListener('mousedown', e => {
      if (window.innerWidth <= 600) return; // Disabled on mobile to prevent accidental offscreen movement
      if (e.target.closest('.gui-win-controls')) return;
      isDragging = true;
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      win.style.position = 'fixed';
      win.style.margin = '0';
      win.style.left = `${initialLeft}px`;
      win.style.top = `${initialTop}px`;
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = `${Math.max(10, Math.min(window.innerWidth - win.offsetWidth - 10, initialLeft + dx))}px`;
      win.style.top = `${Math.max(10, Math.min(window.innerHeight - win.offsetHeight - 10, initialTop + dy))}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

// ==========================================
// Quick-Symbol Strip & One-Tap Beautifier
// ==========================================

const QUICK_SYMBOLS = [
  { label: 'Tab', val: 'Tab', title: 'Insert Tab (2 spaces)' },
  { label: '{ }', val: '{}', title: 'Curly braces' },
  { label: '( )', val: '()', title: 'Parentheses' },
  { label: '[ ]', val: '[]', title: 'Square brackets' },
  { label: ';', val: ';', title: 'Semicolon' },
  { label: ':', val: ':', title: 'Colon' },
  { label: '"', val: '""', title: 'Double quotes' },
  { label: "'", val: "''", title: 'Single quotes' },
  { label: '=', val: '=', title: 'Equals' },
  { label: '!', val: '!', title: 'Exclamation / Not' },
  { label: '<', val: '<', title: 'Less than' },
  { label: '>', val: '>', title: 'Greater than' },
  { label: '+', val: '+', title: 'Plus' },
  { label: '-', val: '-', title: 'Minus' },
  { label: '*', val: '*', title: 'Asterisk / Pointer' },
  { label: '/', val: '/', title: 'Forward slash / Divide' },
  { label: '%', val: '%', title: 'Percent / Modulo' },
  { label: '&', val: '&', title: 'Ampersand' },
  { label: '|', val: '|', title: 'Pipe / OR' },
  { label: '$', val: '$', title: 'Dollar' },
  { label: '->', val: '->', title: 'Arrow pointer' },
  { label: '.', val: '.', title: 'Dot' },
  { label: ',', val: ',', title: 'Comma' },
  { label: '_', val: '_', title: 'Underscore' },
  { label: '🪄 Beautify', val: '__format__', title: 'Beautify & Auto-Indent Code (Shift+Alt+F)', isAction: true }
];

function getActiveEditor() {
  if (cur.id === 'php' && editorHtml && editorPhp) {
    if (editorHtml.view?.hasFocus) return editorHtml;
    if (editorPhp.view?.hasFocus) return editorPhp;
    if (lastFocusedEditor === editorHtml || lastFocusedEditor === editorPhp) return lastFocusedEditor;
    return editorPhp;
  }
  return editor;
}

function handleFormatCode() {
  const activeEd = getActiveEditor();
  if (!activeEd) return;
  const oldCode = activeEd.get();
  if (!oldCode || !oldCode.trim()) {
    toast('Code editor is empty.');
    return;
  }

  const targetLang = cur.id === 'php' ? (activeEd === editorHtml ? 'web' : 'php') : cur.id;
  const formatted = formatCode(oldCode, targetLang);

  if (formatted === oldCode) {
    toast('✨ Code is already clean & formatted!');
    return;
  }

  // Preserve undo history via view.dispatch
  if (activeEd.view) {
    activeEd.view.dispatch({
      changes: { from: 0, to: activeEd.view.state.doc.length, insert: formatted }
    });
    activeEd.view.focus();
  } else {
    activeEd.set(formatted, targetLang);
  }

  toast('✨ Code beautified (2-space indent)!');
}

function initQuickSymbolBar() {
  const bar = $('quickBar');
  if (!bar) return;
  bar.textContent = '';

  for (const item of QUICK_SYMBOLS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-key' + (item.isAction ? ' quick-key-format' : '');
    btn.textContent = item.label;
    btn.title = item.title;
    btn.setAttribute('aria-label', item.title);

    // pointerdown with preventDefault prevents mobile software keyboard from closing
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (item.val === '__format__') {
        handleFormatCode();
      } else {
        const activeEd = getActiveEditor();
        if (activeEd && activeEd.insertSymbol) {
          activeEd.insertSymbol(item.val);
        }
      }
    });

    bar.appendChild(btn);
  }
}

function initCodeFormatter() {
  $('btnFormat')?.addEventListener('click', handleFormatCode);

  // Shortcut Shift+Alt+F to format
  window.addEventListener('keydown', e => {
    if (e.shiftKey && e.altKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      handleFormatCode();
    }
  });
}

// ==========================================
// 1-Tap Student Lab Journal & PDF Export
// ==========================================
function initLabJournal() {
  const dialog = $('journalDialog');
  const form = $('journalForm');
  if (!dialog || !form) return;

  const btnOut = $('btnJournalOut');
  const btnMenu = $('menuBtnJournal');
  const btnClose = $('btnJournalClose');
  const noticeEl = $('journalOutNotice');
  const statusEl = $('journalStatus');
  const previewWrap = $('journalPreviewWrap');
  const previewStage = $('journalPreviewStage');
  const printRoot = $('journalPrintRoot');
  const btnPreviewToggle = $('btnJournalPreviewToggle');
  const btnPrint = $('btnJournalPrint');
  const btnDownload = $('btnJournalDownload');

  const fPracticalNo = $('jfPracticalNo');
  const fDate = $('jfDate');
  const fTitle = $('jfTitle');
  const fTitleErr = $('jfTitleError');
  const fSubject = $('jfSubject');
  const fAim = $('jfAim');
  const fInstitute = $('jfInstitute');
  const fDepartment = $('jfDepartment');
  const fStudentName = $('jfStudentName');
  const fRollNo = $('jfRollNo');
  const fClassName = $('jfClassName');
  const fAcademicYear = $('jfAcademicYear');
  const fIncCode = $('jfIncCode');
  const fIncOutput = $('jfIncOutput');
  const fIncSig = $('jfIncSig');

  let snapshot = null;
  let lastSuggestKey = '';
  let titleEdited = false;
  let previewOpen = false;
  let exporting = false;
  let previewTimer = 0;
  const originalDocTitle = document.title;

  const getSnapshot = () => collectJournalSnapshot({
    cur,
    editor,
    editorHtml,
    editorPhp,
    phpViewMode,
    defaultPhpHtml: DEFAULT_PHP_HTML,
    consoleEl: con,
    previewEl: preview,
    activeGuiWinData,
    guiWinContentEl: $('guiWinContent'),
    guiStatusTextEl: $('guiStatusText'),
    activePractical: activePracticalMeta
  });

  const readFormMeta = () => ({
    practicalNo: fPracticalNo?.value || '',
    date: fDate?.value || todayIsoDate(),
    title: fTitle?.value || '',
    subject: fSubject?.value || '',
    aim: fAim?.value || '',
    institute: fInstitute?.value || '',
    department: fDepartment?.value || '',
    studentName: fStudentName?.value || '',
    rollNo: fRollNo?.value || '',
    className: fClassName?.value || '',
    academicYear: fAcademicYear?.value || ''
  });

  const readOptions = () => ({
    includeCode: fIncCode ? fIncCode.checked : true,
    includeOutput: fIncOutput ? fIncOutput.checked : true,
    includeSignature: fIncSig ? fIncSig.checked : true
  });

  const clearTitleError = () => {
    if (!fTitle) return;
    fTitle.setCustomValidity('');
    fTitle.removeAttribute('aria-invalid');
    if (fTitleErr) fTitleErr.textContent = '';
  };

  const validateTitle = (showError = true) => {
    if (!fTitle) return true;
    const trimmed = fTitle.value.trim();
    fTitle.setCustomValidity('');
    let msg = '';
    if (!trimmed) {
      msg = 'Please enter a practical title before exporting.';
    } else if (trimmed.length < 2) {
      msg = 'Practical title must be at least 2 characters.';
    }
    if (msg) {
      fTitle.setCustomValidity(msg);
      if (showError) {
        fTitle.setAttribute('aria-invalid', 'true');
        if (fTitleErr) fTitleErr.textContent = `⚠ ${msg}`;
      }
      return false;
    }
    clearTitleError();
    return true;
  };

  const refreshPreview = () => {
    if (!previewOpen || !previewStage || !snapshot) return;
    previewStage.innerHTML = buildJournalHtml(readFormMeta(), snapshot, readOptions());
  };

  const schedulePreviewRefresh = () => {
    if (!previewOpen) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 90);
  };

  const setStatus = (msg, kind = '') => {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.dataset.state = kind;
  };

  const populateFieldsOnOpen = () => {
    snapshot = getSnapshot();
    const profile = loadJournalProfile();
    if (fInstitute) fInstitute.value = profile.institute;
    if (fDepartment) fDepartment.value = profile.department;
    if (fStudentName) fStudentName.value = profile.studentName;
    if (fRollNo) fRollNo.value = profile.rollNo;
    if (fClassName) fClassName.value = profile.className;
    if (fAcademicYear) fAcademicYear.value = profile.academicYear;
    if (fDate && !fDate.value) fDate.value = todayIsoDate();

    const pracKey = activePracticalMeta && activePracticalMeta.langId === snapshot.langId
      ? `${snapshot.langId}|${activePracticalMeta.num}|${activePracticalMeta.title}`
      : `${snapshot.langId}|custom|${(snapshot.codeFiles[0]?.code || '').slice(0, 140)}`;

    if (pracKey !== lastSuggestKey || !fTitle?.value.trim()) {
      if (fPracticalNo) fPracticalNo.value = snapshot.suggested.practicalNo;
      if (fSubject) fSubject.value = snapshot.suggested.subject;
      if (fTitle) fTitle.value = snapshot.suggested.title;
      if (fAim) fAim.value = snapshot.suggested.aim;
      lastSuggestKey = pracKey;
    }

    if (noticeEl) {
      if (!snapshot.hasOutput) {
        noticeEl.hidden = false;
        noticeEl.textContent = 'Tip: No program output is captured yet. Tap ▶ Run before exporting to attach execution output, or export Source Code only.';
      } else {
        noticeEl.hidden = true;
        noticeEl.textContent = '';
      }
    }

    titleEdited = false;
    clearTitleError();
    setStatus('');
    previewOpen = false;
    if (previewWrap) previewWrap.hidden = true;
    if (btnPreviewToggle) {
      btnPreviewToggle.setAttribute('aria-expanded', 'false');
      btnPreviewToggle.textContent = '👁 Preview';
    }
  };

  const openJournalDialog = () => {
    if (dialog.open) return;
    populateFieldsOnOpen();
    dialog.showModal();
    const jdBody = dialog.querySelector('.jd-body');
    if (jdBody) jdBody.scrollTop = 0;
  };

  btnOut?.addEventListener('click', openJournalDialog);
  btnMenu?.addEventListener('click', () => {
    closeMenuDrawer();
    openJournalDialog();
  });
  btnClose?.addEventListener('click', () => dialog.close('cancel'));

  // Safari fallback for closedby="any" light dismiss (requires press AND release outside dialog bounds)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const isOutsideDialog = (e, dlg) => {
      const r = dlg.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', e => {
      pressedOutside = dialog.open && isOutsideDialog(e, dialog);
    });
    dialog.addEventListener('pointerup', e => {
      if (pressedOutside && dialog.open && isOutsideDialog(e, dialog)) {
        dialog.close('backdrop');
      }
      pressedOutside = false;
    });
  }

  dialog.addEventListener('close', () => {
    // Always reset dialog.returnValue on close so stale button values cannot leak
    void dialog.returnValue;
    dialog.returnValue = '';
    clearTimeout(previewTimer);
    document.title = originalDocTitle;
    if (printRoot) printRoot.innerHTML = '';
    window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
  });

  // Validation timing: clear errors while typing on input; validate on blur only if edited
  fTitle?.addEventListener('input', () => {
    titleEdited = true;
    clearTitleError();
    schedulePreviewRefresh();
  });
  fTitle?.addEventListener('blur', () => {
    if (titleEdited) validateTitle(true);
  });

  // Persist profile fields & keep preview live when toggled open
  [fInstitute, fDepartment, fStudentName, fRollNo, fClassName, fAcademicYear].forEach(el => {
    el?.addEventListener('input', () => {
      saveJournalProfile(readFormMeta());
      schedulePreviewRefresh();
    });
  });

  [fPracticalNo, fDate, fSubject, fAim].forEach(el => {
    el?.addEventListener('input', schedulePreviewRefresh);
  });

  [fIncCode, fIncOutput, fIncSig].forEach(el => {
    el?.addEventListener('change', () => {
      if (previewOpen) refreshPreview();
    });
  });

  btnPreviewToggle?.addEventListener('click', () => {
    previewOpen = !previewOpen;
    if (previewWrap) previewWrap.hidden = !previewOpen;
    btnPreviewToggle.setAttribute('aria-expanded', String(previewOpen));
    btnPreviewToggle.textContent = previewOpen ? '🙈 Hide Preview' : '👁 Preview';
    if (previewOpen) {
      snapshot = getSnapshot();
      refreshPreview();
      previewWrap?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  window.addEventListener('afterprint', () => {
    document.title = originalDocTitle;
  });

  btnPrint?.addEventListener('click', () => {
    if (!validateTitle(true)) {
      fTitle?.focus();
      return;
    }
    const meta = readFormMeta();
    saveJournalProfile(meta);
    snapshot = getSnapshot();
    const opts = readOptions();
    const jobTitle = sanitizePdfFilename(meta, snapshot.langId).replace(/\.pdf$/i, '');

    if (printRoot) {
      printRoot.innerHTML = buildJournalHtml(meta, snapshot, opts);
    }
    document.title = jobTitle;
    setStatus('Opening system print / Save as PDF dialog…', 'ok');

    if (window.Capacitor?.isNativePlatform?.() && window.ThinkCodeSystemUI?.printDocument) {
      try {
        window.ThinkCodeSystemUI.printDocument(jobTitle);
        return;
      } catch (_) {}
    }
    window.print();
    setTimeout(() => { document.title = originalDocTitle; }, 1200);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (exporting) return;
    if (!validateTitle(true)) {
      fTitle?.focus();
      return;
    }

    exporting = true;
    const origBtnHtml = btnDownload ? btnDownload.textContent : '⬇ Download PDF';
    if (btnDownload) {
      btnDownload.disabled = true;
      btnDownload.textContent = '⏳ Generating PDF…';
    }
    setStatus('Building offline A4 PDF sheet…', 'busy');

    try {
      const meta = readFormMeta();
      saveJournalProfile(meta);
      snapshot = getSnapshot();
      const opts = readOptions();
      const filename = sanitizePdfFilename(meta, snapshot.langId);

      // Yield a frame so disabled state & status message paint smoothly
      await new Promise(r => requestAnimationFrame(() => r()));
      const pdfBytes = await renderJournalPdfBytes(meta, snapshot, opts);
      const ok = await saveFile(filename, pdfBytes);
      if (ok) {
        setStatus(`✓ Ready: ${filename}`, 'ok');
      } else {
        setStatus('PDF export cancelled.', '');
      }
    } catch (err) {
      const msg = String(err?.message || err);
      setStatus(`⚠ Export failed: ${msg}`, 'err');
      toast('Could not generate PDF: ' + msg);
    } finally {
      exporting = false;
      if (btnDownload) {
        btnDownload.disabled = false;
        btnDownload.textContent = origBtnHtml;
      }
    }
  });
}

// ==========================================
// Silent In-App APK Update Checker
// ==========================================
function initUpdateChecker() {
  const installed = getInstalledAppVersion();
  const dialog = $('updateDialog');
  const toastEl = $('updateToast');
  const liveEl = $('updateAriaLive');

  const btnMenu = $('btnMenu');
  const menuDot = $('menuUpdateDot');
  const drawerVerLabel = $('drawerVerLabel');
  const drawerDlCard = $('drawerDlCard');
  const drawerDlTitle = $('drawerDlTitle');
  const drawerDlMeta = $('drawerDlMeta');
  const drawerDlBadge = $('drawerDlBadge');
  const menuBtnCheckUpdate = $('menuBtnCheckUpdate');
  const menuUpdateSub = $('menuUpdateSub');
  const menuUpdateBadge = $('menuUpdateBadge');

  const toastTitle = $('updateToastTitle');
  const toastSub = $('updateToastSub');
  const btnToastOpen = $('btnUpdateToastOpen');
  const btnToastDismiss = $('btnUpdateToastDismiss');

  const btnClose = $('btnUpdateClose');
  const headerBadge = $('udHeaderBadge');
  const bannerCard = $('udBannerCard');
  const bannerIcon = $('udBannerIcon');
  const bannerTitle = $('udBannerTitle');
  const bannerSub = $('udBannerSub');
  const installedVerEl = $('udInstalledVer');
  const installedMetaEl = $('udInstalledMeta');
  const latestBoxEl = $('udLatestBox');
  const latestVerEl = $('udLatestVer');
  const latestMetaEl = $('udLatestMeta');
  const apkFileEl = $('udApkFile');
  const apkSizeEl = $('udApkSize');
  const releaseDateEl = $('udReleaseDate');
  const sha256El = $('udSha256');
  const notesListEl = $('updateNotesList');
  const checkStatusEl = $('updateCheckStatus');
  const btnCheckNow = $('btnUpdateCheckNow');
  const btnDownload = $('btnUpdateDownload');
  const demoRow = $('udDemoRow');
  const btnSimulate = $('btnUpdateSimulate');

  const hasNativePopover = Boolean(
    toastEl &&
    Object.hasOwn(HTMLElement.prototype, 'popover') &&
    typeof toastEl.showPopover === 'function'
  );

  const fallbackManifest = normalizeManifest({
    appId: APP_META.appId,
    appName: APP_META.appName,
    versionName: APP_META.versionName,
    versionCode: APP_META.versionCode,
    releaseDate: APP_META.releaseDate,
    apkFilename: APP_META.apkFilename,
    apkSize: APP_META.apkSize,
    apkUrl: APP_META.defaultApkUrl,
    fallbackUrl: APP_META.fallbackApkUrl,
    downloadPageUrl: APP_META.downloadPageUrl,
    sha256: APP_META.sha256,
    minAndroidVersion: APP_META.minAndroidVersion,
    releaseNotes: [...APP_META.defaultReleaseNotes]
  });

  let cachedManifest = null;
  try {
    const storedJson = store.get(UPDATE_STORAGE_KEYS.lastManifest, '');
    if (storedJson) cachedManifest = normalizeManifest(JSON.parse(storedJson));
  } catch {}

  let currentManifest = cachedManifest || fallbackManifest;
  let simulatedManifest = null;
  let checking = false;
  let lastSource = cachedManifest ? 'cached' : 'bundled';
  let lastErrorReason = '';
  let pendingToastManifest = null;
  let activeToastManifest = null;
  let dismissReason = 'user';
  let toastHadKeyboardFocus = false;
  let pointerDownInToast = false;
  let priorFocusBeforeToast = null;

  const isAnyOverlayOpen = () => (
    !document.body.classList.contains('app-ready') ||
    Boolean($('journalDialog')?.open) ||
    Boolean($('pyPkgDialog')?.open) ||
    Boolean($('pyDataFilesDialog')?.open) ||
    Boolean(dialog?.open) ||
    Boolean($('sheet') && !$('sheet').hidden) ||
    Boolean($('promptModal') && !$('promptModal').hidden) ||
    Boolean($('guiWindowModal') && !$('guiWindowModal').hidden) ||
    Boolean($('menuDrawer') && !$('menuDrawer').hidden)
  );

  const isToastVisible = () => {
    if (!toastEl) return false;
    return hasNativePopover ? toastEl.matches(':popover-open') : toastEl.classList.contains('is-open');
  };

  const announceUpdate = (msg) => {
    if (!msg) return;
    if (typeof document.ariaNotify === 'function') {
      try {
        document.ariaNotify(msg);
        return;
      } catch {}
    }
    if (liveEl) {
      liveEl.textContent = '';
      requestAnimationFrame(() => {
        liveEl.textContent = msg;
      });
    }
  };

  const openApkUrlExternally = (url) => {
    if (!url) return;
    if (installed.isNative && window.ThinkCodeSystemUI?.openExternalUrl) {
      try {
        const launched = window.ThinkCodeSystemUI.openExternalUrl(url);
        if (launched) {
          toast('Opening Android APK installer link…');
          return;
        }
      } catch {}
    }
    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) location.href = url;
  };

  const finalizeToastClosed = () => {
    const dismissedManifest = activeToastManifest;
    const reason = dismissReason;
    const shouldRestoreFocus = toastHadKeyboardFocus;
    const focusTarget = priorFocusBeforeToast;

    activeToastManifest = null;
    dismissReason = 'user';
    toastHadKeyboardFocus = false;
    pointerDownInToast = false;
    priorFocusBeforeToast = null;

    if (reason === 'user' && dismissedManifest && !dismissedManifest.isSimulated) {
      store.set(UPDATE_STORAGE_KEYS.snoozedCode, String(dismissedManifest.versionCode));
      store.set(UPDATE_STORAGE_KEYS.snoozedUntil, String(Date.now() + SNOOZE_DURATION_MS));
    }

    if (reason === 'user' && shouldRestoreFocus) {
      if (focusTarget && focusTarget.isConnected && typeof focusTarget.focus === 'function') {
        try { focusTarget.focus(); return; } catch {}
      }
      try { btnMenu?.focus(); } catch {}
    }
  };

  const hideUpdateToast = (reason = 'suppress') => {
    if (!toastEl || !isToastVisible()) return;
    dismissReason = reason;
    if (hasNativePopover && typeof toastEl.hidePopover === 'function') {
      try { toastEl.hidePopover(); } catch {
        toastEl.classList.remove('is-open');
        finalizeToastClosed();
      }
    } else {
      toastEl.classList.remove('is-open');
      finalizeToastClosed();
    }
  };

  const showUpdateToast = (manifest) => {
    if (!toastEl || !manifest) return;
    if (isAnyOverlayOpen()) {
      pendingToastManifest = manifest;
      return;
    }

    pendingToastManifest = null;
    activeToastManifest = manifest;
    dismissReason = 'user';

    if (toastTitle) {
      toastTitle.textContent = manifest.isSimulated
        ? `Preview: v${manifest.versionName} Update`
        : `Update v${manifest.versionName} Ready`;
    }
    if (toastSub) {
      const sizeStr = manifest.apkSize ? ` (${manifest.apkSize})` : '';
      toastSub.textContent = `${manifest.apkFilename}${sizeStr}`;
    }

    if (hasNativePopover) {
      if (!toastEl.matches(':popover-open')) {
        toastEl.showPopover();
      }
    } else {
      toastEl.classList.add('is-open');
    }

    const announcement = `${APP_META.appName} v${manifest.versionName} APK update is ready. Actions available.`;
    announceUpdate(announcement);
  };

  const flushPendingUpdateToast = () => {
    if (pendingToastManifest && !isAnyOverlayOpen()) {
      const m = pendingToastManifest;
      pendingToastManifest = null;
      showUpdateToast(m);
    }
  };

  const getDisplayManifest = () => simulatedManifest || currentManifest || fallbackManifest;

  const syncAllUpdateUI = () => {
    const manifest = getDisplayManifest();
    const hasUpdate = isUpdateAvailable(installed, manifest);
    const isOfflineErr = lastErrorReason && lastSource !== 'network' && !manifest.isSimulated;

    // 1. Header Menu dot & accessible label
    if (menuDot) menuDot.hidden = !hasUpdate;
    if (btnMenu) {
      btnMenu.setAttribute(
        'aria-label',
        hasUpdate ? `Open menu drawer (App update v${manifest.versionName} available)` : 'Open menu drawer'
      );
    }

    // 2. Drawer version label, download card & update item
    if (drawerVerLabel) {
      drawerVerLabel.textContent = `v${installed.versionName} (Build ${installed.versionCode})`;
    }
    if (drawerDlTitle) {
      drawerDlTitle.textContent = installed.isNative
        ? (hasUpdate ? `Update App to v${manifest.versionName}` : `Android App Portal (v${manifest.versionName})`)
        : `Download Android App (v${manifest.versionName})`;
    }
    if (drawerDlMeta) {
      const sz = manifest.apkSize ? ` (${manifest.apkSize})` : '';
      drawerDlMeta.textContent = `${manifest.apkFilename}${sz}`;
    }
    if (drawerDlBadge) {
      drawerDlBadge.textContent = hasUpdate ? 'Update' : (installed.isNative ? 'Details' : 'Get APK');
    }
    if (menuUpdateSub) {
      menuUpdateSub.textContent = hasUpdate
        ? `Installed v${installed.versionName} → v${manifest.versionName} available!`
        : `Installed: v${installed.versionName} (Build ${installed.versionCode}) · Up to date`;
    }
    if (menuUpdateBadge) {
      menuUpdateBadge.textContent = hasUpdate ? 'NEW' : `v${installed.versionName}`;
      menuUpdateBadge.className = hasUpdate ? 'd-badge update-new' : 'd-badge';
    }

    // 3. Update Modal Dialog content
    if (headerBadge) {
      headerBadge.textContent = manifest.isSimulated ? 'DEMO' : (hasUpdate ? `v${manifest.versionName}` : 'APK');
    }
    if (installedVerEl) installedVerEl.textContent = `v${installed.versionName}`;
    if (installedMetaEl) {
      const runtimeLabel = installed.isNative ? 'Android APK' : 'Web IDE';
      installedMetaEl.textContent = `Build ${installed.versionCode} · ${runtimeLabel}`;
    }

    if (latestBoxEl) latestBoxEl.classList.toggle('has-update', hasUpdate);
    if (latestVerEl) latestVerEl.textContent = `v${manifest.versionName}`;
    if (latestMetaEl) {
      const buildTag = `Build ${manifest.versionCode}`;
      const srcTag = manifest.isSimulated
        ? 'Simulated Demo'
        : (lastSource === 'network' ? 'Live Server' : (lastSource === 'cached' ? 'Cached Check' : 'Bundled Info'));
      latestMetaEl.textContent = `${buildTag} · ${srcTag}`;
    }

    if (bannerCard && bannerIcon && bannerTitle && bannerSub) {
      if (hasUpdate) {
        bannerCard.dataset.state = 'available';
        bannerIcon.textContent = manifest.isSimulated ? '🧪' : '🚀';
        bannerTitle.textContent = manifest.isSimulated
          ? `Demo Preview: v${manifest.versionName} Update Alert`
          : `ThinkCode Lab v${manifest.versionName} is ready!`;
        bannerSub.textContent = manifest.isSimulated
          ? 'Previewing how sideloaded students see the silent update toast and changelog.'
          : 'Tap Download APK below to install the latest build over your current app.';
      } else if (checking) {
        bannerCard.dataset.state = 'idle';
        bannerIcon.textContent = '⏳';
        bannerTitle.textContent = 'Checking for Android APK updates…';
        bannerSub.textContent = 'Connecting silently to https://thinkcode-lab.web.app/version.json';
      } else if (isOfflineErr) {
        bannerCard.dataset.state = 'offline';
        bannerIcon.textContent = '📡';
        bannerTitle.textContent = 'Offline mode — update check skipped';
        bannerSub.textContent = 'No internet connection needed for coding. Re-check anytime when online.';
      } else {
        bannerCard.dataset.state = 'latest';
        bannerIcon.textContent = '✅';
        bannerTitle.textContent = installed.isNative
          ? 'Your ThinkCode Lab APK is up to date'
          : 'Running latest release build';
        bannerSub.textContent = `Build ${manifest.versionCode} matches the newest published APK (${manifest.apkFilename}).`;
      }
    }

    if (apkFileEl) apkFileEl.textContent = manifest.apkFilename;
    if (apkSizeEl) apkSizeEl.textContent = manifest.apkSize || '~17.7 MB';
    if (releaseDateEl) releaseDateEl.textContent = formatReleaseDate(manifest.releaseDate);
    if (sha256El) sha256El.textContent = formatShortChecksum(manifest.sha256);

    if (notesListEl) {
      notesListEl.textContent = '';
      const notes = manifest.releaseNotes?.length ? manifest.releaseNotes : APP_META.defaultReleaseNotes;
      notes.forEach(note => {
        const li = document.createElement('li');
        li.textContent = note;
        notesListEl.appendChild(li);
      });
    }

    if (btnDownload) {
      const targetHref = (hasUpdate || installed.isNative)
        ? (manifest.apkUrl || manifest.fallbackUrl || manifest.downloadPageUrl)
        : (manifest.downloadPageUrl || manifest.apkUrl);
      btnDownload.href = targetHref;
      btnDownload.textContent = hasUpdate
        ? `⬇ Download v${manifest.versionName} APK`
        : (installed.isNative ? `⬇ Re-download v${manifest.versionName} APK` : `⬇ Download APK Page (v${manifest.versionName})`);
    }

    if (demoRow) {
      demoRow.hidden = installed.isNative;
    }
    if (btnSimulate) {
      btnSimulate.textContent = simulatedManifest
        ? '↺ Clear Demo Preview & Re-sync Real Version'
        : `🧪 Preview Student APK Update Banner (Simulate v${createSimulatedManifest(installed).versionName})`;
    }
  };

  const setDialogStatus = (msg, state = '') => {
    if (!checkStatusEl) return;
    checkStatusEl.textContent = msg || '';
    checkStatusEl.dataset.state = state;
  };

  const runUpdateCheck = async ({ manual = false, respectCooldown = true } = {}) => {
    if (checking) return null;

    const nowMs = Date.now();
    const lastCheckMs = Number(store.get(UPDATE_STORAGE_KEYS.lastCheckAt, '0'));
    const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

    if (respectCooldown && !manual && !shouldRunSilentCheck({ lastCheckMs, nowMs, isOnline })) {
      if (cachedManifest && isUpdateAvailable(installed, cachedManifest)) {
        const dismissedCode = Number(store.get(UPDATE_STORAGE_KEYS.snoozedCode, '0'));
        const snoozedUntilMs = Number(store.get(UPDATE_STORAGE_KEYS.snoozedUntil, '0'));
        if (shouldShowUpdateToast({ installed, remote: cachedManifest, dismissedVersionCode: dismissedCode, snoozedUntilMs, nowMs })) {
          showUpdateToast(cachedManifest);
        }
      }
      return { ok: true, skipped: true, manifest: currentManifest };
    }

    if (!isOnline) {
      lastErrorReason = 'offline';
      syncAllUpdateUI();
      if (manual) setDialogStatus('You appear to be offline. Connect to Wi-Fi/Mobile data and try again.', 'err');
      return { ok: false, reason: 'offline', manifest: null };
    }

    checking = true;
    lastErrorReason = '';
    if (manual) {
      if (btnCheckNow) {
        btnCheckNow.disabled = true;
        btnCheckNow.textContent = '⏳ Checking…';
      }
      setDialogStatus('Checking latest release manifest…', 'busy');
      syncAllUpdateUI();
    }

    const urls = installed.isNative ? APP_META.nativeManifestUrls : APP_META.webManifestUrls;
    const res = await fetchLatestManifest({ urls, timeoutMs: 5000 });
    checking = false;

    if (btnCheckNow) {
      btnCheckNow.disabled = false;
      btnCheckNow.textContent = '↻ Check Now';
    }

    if (res.ok && res.manifest) {
      currentManifest = res.manifest;
      lastSource = 'network';
      lastErrorReason = '';
      store.set(UPDATE_STORAGE_KEYS.lastCheckAt, String(Date.now()));
      store.set(UPDATE_STORAGE_KEYS.lastManifest, JSON.stringify(res.manifest));

      const hasUpdate = isUpdateAvailable(installed, res.manifest);
      syncAllUpdateUI();

      if (manual) {
        setDialogStatus(
          hasUpdate
            ? `✓ Update found: v${res.manifest.versionName} (Build ${res.manifest.versionCode}).`
            : `✓ Verified latest release v${res.manifest.versionName} (Build ${res.manifest.versionCode}).`,
          'ok'
        );
      }

      if (hasUpdate && !manual) {
        const dismissedCode = Number(store.get(UPDATE_STORAGE_KEYS.snoozedCode, '0'));
        const snoozedUntilMs = Number(store.get(UPDATE_STORAGE_KEYS.snoozedUntil, '0'));
        if (shouldShowUpdateToast({
          installed,
          remote: res.manifest,
          dismissedVersionCode: dismissedCode,
          snoozedUntilMs,
          nowMs: Date.now()
        })) {
          showUpdateToast(res.manifest);
        }
      }
    } else {
      lastErrorReason = res.reason || 'network-error';
      syncAllUpdateUI();
      if (manual) {
        setDialogStatus('Could not reach update server right now. Offline IDE works normally.', 'err');
      }
    }

    return res;
  };

  const openUpdateDialog = () => {
    if (!dialog || dialog.open) return;
    hideUpdateToast('open-dialog');
    setDialogStatus('');
    syncAllUpdateUI();
    dialog.showModal();
    const udBody = dialog.querySelector('.ud-body');
    if (udBody) udBody.scrollTop = 0;

    // Trigger background refresh silently if online & stale while dialog is open
    if (!simulatedManifest) {
      runUpdateCheck({ manual: false, respectCooldown: true });
    }
  };

  const triggerSimulatedUpdate = () => {
    simulatedManifest = createSimulatedManifest(installed, currentManifest);
    syncAllUpdateUI();
    showUpdateToast(simulatedManifest);
  };

  // Focus & dismiss tracking for popover="manual" toast
  toastEl?.addEventListener('pointerdown', () => {
    pointerDownInToast = true;
    toastHadKeyboardFocus = false;
  });
  toastEl?.addEventListener('focusin', e => {
    if (pointerDownInToast) {
      pointerDownInToast = false;
      toastHadKeyboardFocus = false;
      return;
    }
    if (!toastHadKeyboardFocus && e.relatedTarget && !toastEl.contains(e.relatedTarget)) {
      priorFocusBeforeToast = e.relatedTarget;
    }
    toastHadKeyboardFocus = true;
  });
  toastEl?.addEventListener('focusout', e => {
    if (e.relatedTarget && !toastEl.contains(e.relatedTarget)) {
      toastHadKeyboardFocus = false;
    }
  });
  toastEl?.addEventListener('toggle', e => {
    if (e.newState === 'closed') {
      finalizeToastClosed();
    }
  });

  btnToastDismiss?.addEventListener('click', () => {
    dismissReason = 'user';
    if (!hasNativePopover) {
      toastEl?.classList.remove('is-open');
      finalizeToastClosed();
    }
  });
  btnToastOpen?.addEventListener('click', () => {
    openUpdateDialog();
  });

  menuBtnCheckUpdate?.addEventListener('click', () => {
    closeMenuDrawer();
    openUpdateDialog();
  });

  drawerDlCard?.addEventListener('click', e => {
    if (installed.isNative) {
      e.preventDefault();
      closeMenuDrawer();
      openUpdateDialog();
    }
  });

  btnClose?.addEventListener('click', () => dialog?.close('cancel'));

  if (dialog && !('closedBy' in HTMLDialogElement.prototype)) {
    const isOutsideDialog = (e, dlg) => {
      const r = dlg.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', e => {
      pressedOutside = dialog.open && isOutsideDialog(e, dialog);
    });
    dialog.addEventListener('pointerup', e => {
      if (pressedOutside && dialog.open && isOutsideDialog(e, dialog)) {
        dialog.close('backdrop');
      }
      pressedOutside = false;
    });
  }

  dialog?.addEventListener('close', () => {
    void dialog.returnValue;
    dialog.returnValue = '';
    setTimeout(flushPendingUpdateToast, 120);
  });

  btnCheckNow?.addEventListener('click', () => {
    simulatedManifest = null;
    runUpdateCheck({ manual: true, respectCooldown: false });
  });

  btnDownload?.addEventListener('click', e => {
    if (installed.isNative && btnDownload.href) {
      e.preventDefault();
      openApkUrlExternally(btnDownload.href);
    }
  });

  btnSimulate?.addEventListener('click', () => {
    if (simulatedManifest) {
      simulatedManifest = null;
      hideUpdateToast('suppress');
      syncAllUpdateUI();
      setDialogStatus('Returned to live version status.', 'ok');
    } else {
      dialog?.close('simulate');
      setTimeout(triggerSimulatedUpdate, 140);
    }
  });

  window.addEventListener('cf:overlay-closed', () => {
    setTimeout(flushPendingUpdateToast, 80);
  });

  // Initial UI render from installed build + cached manifest (zero network blocking!)
  syncAllUpdateUI();

  const startSilentChecks = () => {
    const params = new URLSearchParams(location.search);
    if (params.get('checkUpdate') === 'simulate') {
      setTimeout(triggerSimulatedUpdate, 700);
      return;
    }
    // Check silently ~3.5s after app becomes ready so launch remains instant & offline-first
    setTimeout(() => {
      runUpdateCheck({ manual: false, respectCooldown: true });
    }, 3500);
  };

  return {
    installed,
    startSilentChecks,
    checkNow: () => runUpdateCheck({ manual: true, respectCooldown: false }),
    simulate: triggerSimulatedUpdate,
    state: () => ({ installed, currentManifest: getDisplayManifest(), lastSource, lastErrorReason })
  };
}

// ==========================================
// Python Data Science & Scientific Suite
// ==========================================
function initPythonScienceSuite() {
  const getActiveTargetEditor = () => {
    if (cur.id === 'php' && editorPhp) return editorPhp;
    return editor;
  };

  initPythonTools({
    onMountFile: (name, content, size) => {
      engines.python?.mountFile?.(name, content, size, sink);
    },
    onUnmountFile: (name) => {
      engines.python?.unmountFile?.(name, sink);
    },
    onLoadPackage: (pkgId) => {
      engines.python?.loadPackage?.(pkgId, sink);
    },
    onInsertCode: (snippet) => {
      const ed = getActiveTargetEditor();
      if (ed && typeof ed.insert === 'function') {
        ed.insert(snippet);
      } else if (ed && typeof ed.insertSymbol === 'function') {
        ed.insertSymbol(snippet);
      }
    },
    toast
  });

  const btnPkgs = $('btnPyPackages');
  const btnData = $('btnPyDatasets');
  const menuBtnPkgs = $('menuBtnPyPackages');
  const menuBtnData = $('menuBtnPyData');

  const openPkgs = () => {
    closeMenuDrawer();
    openPackagesDialog();
  };

  const openData = () => {
    closeMenuDrawer();
    openDataFilesDialog();
  };

  btnPkgs?.addEventListener('click', openPkgs);
  btnData?.addEventListener('click', openData);
  menuBtnPkgs?.addEventListener('click', openPkgs);
  menuBtnData?.addEventListener('click', openData);
}

/* ==========================================================================
   Android Back-Button Interception & Exit Confirmation Box
   ========================================================================== */
export function showExitConfirmDialog() {
  const dialog = $('exitDialog');
  if (!dialog) return;
  if (dialog.open) return;
  try {
    dialog.showModal();
    $('btnExitCancel')?.focus();
  } catch (_) {
    dialog.setAttribute('open', '');
  }
}

export function closeExitConfirmDialog() {
  const dialog = $('exitDialog');
  if (!dialog || !dialog.open) return;
  dialog.close();
}

export function handleAppExit() {
  closeExitConfirmDialog();
  if (window.ThinkCodeSystemUI?.exitApp) {
    window.ThinkCodeSystemUI.exitApp();
  } else if (window.Capacitor?.App?.exitApp) {
    window.Capacitor.App.exitApp();
  } else {
    toast('Tap browser back or close tab to exit');
  }
}

/**
 * Hierarchical Android back press & back gesture handler.
 * If any popup, dropdown, drawer, sheet, or dialog is open,
 * closes ONLY that overlay and does NOT exit the app.
 * If no overlay is open, displays the custom Exit Confirmation dialog.
 * @returns {boolean} true if an action was performed
 */
export function handleThinkCodeBackPress() {
  // 1. If Exit Dialog is already showing, pressing back cancels it (stay in app)
  const exitDialog = $('exitDialog');
  if (exitDialog && exitDialog.open) {
    closeExitConfirmDialog();
    return true;
  }

  // 2. Interactive input prompt modal (scanf, cin, input, prompt)
  const promptModal = $('promptModal');
  if (promptModal && !promptModal.hidden) {
    closePromptModal(null);
    return true;
  }

  // 3. Java AWT/Swing desktop GUI window frame
  const guiWindowModal = $('guiWindowModal');
  if (guiWindowModal && !guiWindowModal.hidden) {
    guiWindowModal.hidden = true;
    const btnReopen = $('btnReopenGui');
    if (btnReopen && cur.id === 'java') btnReopen.hidden = false;
    print('[GUI Window Closed]\n', 'sys');
    window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
    return true;
  }

  // 4. Python animated plot loader
  const plotLoader = $('pyPlotLoader');
  if (plotLoader && !plotLoader.hidden) {
    const btnCancelPlot = $('btnCancelPlot');
    if (btnCancelPlot) {
      btnCancelPlot.click();
    } else {
      plotLoader.hidden = true;
      plotLoader.classList.remove('is-active');
    }
    return true;
  }

  // 5. Any HTML5 <dialog> with [open] (Lab Journal, Py Packages, Datasets, Updates, etc.)
  const openDialogs = Array.from(document.querySelectorAll('dialog[open]'));
  if (openDialogs.length > 0) {
    const topDialog = openDialogs[openDialogs.length - 1];
    if (typeof topDialog.close === 'function') {
      topDialog.close();
    } else {
      topDialog.removeAttribute('open');
    }
    return true;
  }

  // 6. Navigation Drawer (Menu & Options)
  const menuDrawer = $('menuDrawer');
  if (menuDrawer && (!menuDrawer.hidden || menuDrawer.classList.contains('open'))) {
    closeMenuDrawer();
    return true;
  }

  // 7. Bottom Sheet (Practicals list, Developer profile, SQL schemas)
  const sheet = $('sheet');
  if (sheet && !sheet.hidden) {
    closeSheet();
    return true;
  }

  // 8. Popovers or update toasts
  try {
    const openPopover = document.querySelector(':popover-open');
    if (openPopover) {
      openPopover.hidePopover?.();
      return true;
    }
  } catch (_) {}

  // 9. If an active input/select has focus outside editor, dismiss virtual keyboard/dropdown
  if (document.activeElement && document.activeElement !== document.body &&
      (document.activeElement.tagName === 'SELECT' ||
       (document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'filePick'))) {
    document.activeElement.blur();
    return true;
  }

  // 10. Everything is closed: show exit confirmation box!
  showExitConfirmDialog();
  return true;
}

// Expose on global window object so Android WebView can call it immediately
window.handleThinkCodeBackPress = handleThinkCodeBackPress;

function initExitConfirmation() {
  const dialog = $('exitDialog');
  const btnCancel = $('btnExitCancel');
  const btnConfirm = $('btnExitConfirm');
  const menuBtnExit = $('menuBtnExit');

  btnCancel?.addEventListener('click', closeExitConfirmDialog);
  btnConfirm?.addEventListener('click', handleAppExit);

  // Backdrop click closes dialog
  dialog?.addEventListener('click', e => {
    if (e.target === dialog) {
      closeExitConfirmDialog();
    }
  });

  // Drawer "Exit App" button
  menuBtnExit?.addEventListener('click', () => {
    closeMenuDrawer();
    setTimeout(() => {
      showExitConfirmDialog();
    }, 180);
  });

  // Global Escape key handler
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (dialog && dialog.open) {
        e.preventDefault();
        closeExitConfirmDialog();
      }
    }
  });

  // Capacitor App plugin listener if present
  try {
    if (window.Capacitor?.Plugins?.App?.addListener) {
      window.Capacitor.Plugins.App.addListener('backButton', () => {
        handleThinkCodeBackPress();
      });
    }
  } catch (_) {}
}

// ---------- boot ----------
function shellCmd(line) { print(`${engines.shell.sh.prompt} ${line}\n`, 'cmd'); engines.shell.exec(line, sink); $('promptLabel').textContent = engines.shell.sh.prompt; }
shellui.init({ sh: engines.shell.sh, cmd: shellCmd });
sqlui.init({ engine: engines.sql, editor, sink, run, toast, store, openSheet, closeSheet, saveFile, refreshTools: renderTools,
  busy: () => running, showText: t => { sink.clear(); showTab('console'); print(t, 'sys'); } });
if ($('stdin')) $('stdin').value = cur.input === 'stdin' ? store.get('cf.in.' + cur.id, cur.stdin || '') : '';
setOutputSmall();
applyLang(); syncButtons();
initZoomControls();
initGuiWindowControls();
initQuickSymbolBar();
initCodeFormatter();
initLabJournal();
const updateController = initUpdateChecker();
initPythonScienceSuite();
initExitConfirmation();
const warmPromise = warm();
window.__app = { run, stop, engines, cur: () => cur, editorPhp: () => editorPhp, editorHtml: () => editorHtml, running: () => running, updates: updateController, handleBack: handleThinkCodeBackPress, showExit: showExitConfirmDialog };

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
    syncNativeSystemBars(document.documentElement.dataset.theme || store.get('cf.theme', 'dark'));
    updateController.startSilentChecks();
    const splash = $('app-splash');
    if (splash) {
      const caption = splash.querySelector('.splash-caption');
      if (caption) caption.textContent = 'Ready!';
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.remove();
        $('critical-splash-css')?.remove();
        window.dispatchEvent(new CustomEvent('cf:overlay-closed'));
      }, 450);
    }
  });
});
