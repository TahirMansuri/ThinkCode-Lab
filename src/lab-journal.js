// 1-Tap Student Lab Journal & Assignment PDF Export Module (100% Offline)
// Generates both an instant multi-page A4 .pdf binary (zero external deps) and semantic print HTML.

const PROFILE_KEY = 'cf.journal.profile';

export const SUBJECT_DEFAULTS = {
  python: 'Python Programming Lab (CA-214)',
  java: 'Java Programming & AWT/Swing Lab (TYBCA)',
  cpp: 'Object Oriented Programming in C++ (CA-113 / CA-123)',
  c: 'C Programming Lab',
  php: 'Web Technology — PHP & HTML Lab',
  sql: 'Database Management System — Oracle SQL (CA-223)',
  shell: 'Linux Operating System Shell Lab (CA-123)',
  js: 'Web Design II — JavaScript Lab (CA-125)',
  web: 'Web Design I — HTML & CSS Lab (CA-115)'
};

const KEYWORDS = {
  c: new Set(['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','inline','int','long','register','restrict','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while','_Bool','NULL']),
  cpp: new Set(['alignas','alignof','and','asm','auto','bool','break','case','catch','char','class','const','constexpr','continue','default','delete','do','double','dynamic_cast','else','enum','explicit','export','extern','false','float','for','friend','goto','if','inline','int','long','mutable','namespace','new','noexcept','nullptr','operator','private','protected','public','register','return','short','signed','sizeof','static','static_cast','struct','switch','template','this','throw','true','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while','std','string','cin','cout','endl']),
  java: new Set(['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','goto','if','implements','import','instanceof','int','interface','long','native','new','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','try','void','volatile','while','true','false','null','String','System','Scanner']),
  python: new Set(['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','print','input','len','range','int','float','str','list','dict','set']),
  js: new Set(['async','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','false','finally','for','function','if','import','in','instanceof','let','new','null','of','return','static','super','switch','this','throw','true','try','typeof','undefined','var','void','while','with','yield','console','prompt','alert']),
  php: new Set(['abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','do','echo','else','elseif','empty','enddeclare','endfor','endforeach','endif','endswitch','endwhile','enum','extends','final','finally','fn','for','foreach','function','global','goto','if','implements','include','include_once','instanceof','interface','isset','list','match','namespace','new','or','print','private','protected','public','readonly','require','require_once','return','static','switch','throw','trait','try','unset','use','var','while','xor','yield','true','false','null','$_POST','$_GET','$_REQUEST','$_SERVER']),
  sql: new Set(['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','FULL','OUTER','CROSS','ON','GROUP','BY','HAVING','ORDER','ASC','DESC','AS','DISTINCT','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','VIEW','SEQUENCE','ALTER','DROP','PRIMARY','KEY','FOREIGN','REFERENCES','NOT','NULL','DEFAULT','CHECK','UNIQUE','CONSTRAINT','COMMIT','ROLLBACK','SAVEPOINT','TO','AND','OR','IN','BETWEEN','LIKE','IS','EXISTS','UNION','MINUS','INTERSECT','COUNT','SUM','AVG','MIN','MAX','ROUND','NVL','NVL2','DECODE','TO_CHAR','TO_DATE','SYSDATE','DUAL','ROWNUM','EXEC']),
  shell: new Set(['if','then','elif','else','fi','case','esac','for','while','until','do','done','in','function','return','exit','break','continue','export','local','readonly','echo','printf','read','cd','pwd','ls','mkdir','rm','cp','mv','cat','grep','sed','awk','find','sort','uniq','wc','head','tail','chmod','touch','tree'])
};

export function loadJournalProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        institute: parsed.institute ?? 'InfoGalaxy Computers, Shirpur',
        department: parsed.department ?? 'Department of Computer Applications',
        studentName: parsed.studentName ?? '',
        rollNo: parsed.rollNo ?? '',
        className: parsed.className ?? '',
        academicYear: parsed.academicYear ?? computeAcademicYear()
      };
    }
  } catch {}
  return {
    institute: 'InfoGalaxy Computers, Shirpur',
    department: 'Department of Computer Applications',
    studentName: '',
    rollNo: '',
    className: '',
    academicYear: computeAcademicYear()
  };
}

export function saveJournalProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      institute: profile.institute || '',
      department: profile.department || '',
      studentName: profile.studentName || '',
      rollNo: profile.rollNo || '',
      className: profile.className || '',
      academicYear: profile.academicYear || ''
    }));
  } catch {}
}

export function computeAcademicYear(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = m >= 5 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function todayIsoDate(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
  if (!m) return String(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const idx = parseInt(m[2], 10) - 1;
  return `${m[3]} ${months[idx] || m[2]} ${m[1]}`;
}

export function inferPracticalTitle(code, langId, fallbackName) {
  const lines = String(code || '').split(/\r?\n/);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const m = /^(?:\/\/|#|--|\/\*+|<!--)\s*(.+?)(?:\*\/|-->)?$/.exec(trimmed);
    if (m) {
      let candidate = m[1].replace(/\s*—\s*runs(?:\s+100%)?\s+offline.*$/i, '').trim();
      candidate = candidate.replace(/^!(?:\/usr)?\/bin\/(?:env\s+\w+|bash|sh)$/i, '').trim();
      candidate = candidate.replace(/^Tap\s+"Sample data".*$/i, '').trim();
      if (candidate.length >= 4 && candidate.length <= 90) {
        return candidate;
      }
      continue;
    }
    if (!/^<\?php|^<!doctype/i.test(trimmed)) break;
  }
  return fallbackName ? `${fallbackName} Lab Exercise` : 'Programming Practical';
}

export function sanitizePdfFilename(meta, langId) {
  const clean = s => String(s || '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const parts = [
    'ThinkCodeLab',
    clean(langId || 'code'),
    clean(meta.practicalNo || 'Practical'),
    clean(meta.rollNo || meta.studentName || '')
  ].filter(Boolean);
  return parts.join('_') + '.pdf';
}

// Lightweight per-line tokenizer optimized for high-contrast light paper printing
export function tokenizeLine(line, langId, state = { inBlockComment: false }) {
  const tokens = [];
  const s = String(line ?? '');
  if (!s) return tokens;

  const isHashCom = langId === 'python' || langId === 'shell' || langId === 'php';
  const isDashCom = langId === 'sql';
  const kwSet = KEYWORDS[langId] || KEYWORDS.cpp;
  let i = 0;

  const push = (text, kind) => {
    if (!text) return;
    if (tokens.length && tokens[tokens.length - 1].kind === kind) {
      tokens[tokens.length - 1].text += text;
    } else {
      tokens.push({ text, kind });
    }
  };

  if (state.inBlockComment) {
    const endIdx = s.indexOf('*/');
    if (endIdx === -1) {
      push(s, 'com');
      return tokens;
    }
    push(s.slice(0, endIdx + 2), 'com');
    state.inBlockComment = false;
    i = endIdx + 2;
  }

  while (i < s.length) {
    const ch = s[i];
    const next2 = s.slice(i, i + 2);

    // Preprocessor directive (#include, #define) in C/C++
    if ((langId === 'c' || langId === 'cpp') && ch === '#' && s.slice(0, i).trim() === '') {
      push(s.slice(i), 'meta');
      break;
    }

    // Comments
    if (langId === 'web' && s.slice(i, i + 4) === '<!--') {
      const endHtml = s.indexOf('-->', i + 4);
      if (endHtml === -1) {
        push(s.slice(i), 'com');
        break;
      }
      push(s.slice(i, endHtml + 3), 'com');
      i = endHtml + 3;
      continue;
    }
    if (next2 === '/*' && langId !== 'python' && langId !== 'shell') {
      const endIdx = s.indexOf('*/', i + 2);
      if (endIdx === -1) {
        push(s.slice(i), 'com');
        state.inBlockComment = true;
        break;
      }
      push(s.slice(i, endIdx + 2), 'com');
      i = endIdx + 2;
      continue;
    }
    if ((next2 === '//' && langId !== 'python' && langId !== 'sql' && langId !== 'shell')
      || (isHashCom && ch === '#' && !(langId === 'shell' && i === 0 && next2 === '#!'))
      || (isDashCom && next2 === '--')) {
      push(s.slice(i), 'com');
      break;
    }

    // PHP open/close tags & HTML tags
    if (langId === 'php' && (s.slice(i, i + 5) === '<?php' || next2 === '?>')) {
      const tagLen = s.slice(i, i + 5) === '<?php' ? 5 : 2;
      push(s.slice(i, i + tagLen), 'meta');
      i += tagLen;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === '\\' && j + 1 < s.length) { j += 2; continue; }
        if (s[j] === ch) { j++; break; }
        j++;
      }
      push(s.slice(i, j), 'str');
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) && (i === 0 || !/[A-Za-z_$]/.test(s[i - 1]))) {
      let j = i;
      while (j < s.length && /[0-9A-Fa-fxX._]/.test(s[j])) j++;
      push(s.slice(i, j), 'num');
      i = j;
      continue;
    }

    // Identifiers & keywords (including PHP $var or HTML <tag)
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < s.length && /[A-Za-z0-9_$]/.test(s[j])) j++;
      const word = s.slice(i, j);
      const cmp = langId === 'sql' ? word.toUpperCase() : word;
      if (kwSet.has(cmp)) {
        push(word, 'kw');
      } else if (langId === 'web' && i > 0 && (s[i - 1] === '<' || (i > 1 && s.slice(i - 2, i) === '</'))) {
        push(word, 'kw');
      } else {
        push(word, 'plain');
      }
      i = j;
      continue;
    }

    push(ch, 'plain');
    i++;
  }
  return tokens;
}

export function extractConsoleSnapshot(consoleEl) {
  const logs = [];
  const tables = [];
  if (!consoleEl) return { logs, tables };

  let lastGridCaption = '';
  const pushText = (text, kind) => {
    if (!text) return;
    if (logs.length && logs[logs.length - 1].kind === kind) {
      logs[logs.length - 1].text += text;
    } else {
      logs.push({ kind, text });
    }
  };

  for (const node of consoleEl.childNodes) {
    if (node.nodeType === 3) {
      pushText(node.textContent, 'out');
      continue;
    }
    if (node.nodeType !== 1) continue;
    const cls = node.classList;
    if (cls.contains('console-warm-notice') || cls.contains('cwn-ready') || cls.contains('con-input-wrap') || cls.contains('con-input')) {
      continue;
    }
    if (cls.contains('gridbar')) {
      const chips = [...node.querySelectorAll('.gchip')].map(c => c.textContent.trim()).filter(Boolean);
      lastGridCaption = chips.join(' · ');
      continue;
    }
    if (cls.contains('tablewrap')) {
      const tbl = node.querySelector('table');
      if (tbl) {
        const cols = [...tbl.querySelectorAll('thead th')].slice(1).map(th => th.textContent.trim());
        const rows = [...tbl.querySelectorAll('tbody tr')].map(tr => {
          const cells = [...tr.querySelectorAll('td')].slice(1).map(td => ({
            text: td.textContent,
            isNull: td.classList.contains('null')
          }));
          return { cells };
        });
        tables.push({ caption: lastGridCaption || `${rows.length} rows`, cols, rows });
        lastGridCaption = '';
      }
      continue;
    }
    let kind = node.dataset?.k || 'out';
    if (cls.contains('con-val')) kind = 'val';
    else if (cls.contains('err')) kind = 'err';
    else if (cls.contains('ok')) kind = 'ok';
    else if (cls.contains('cmd')) kind = 'cmd';
    else if (cls.contains('sys')) kind = 'sys';
    else if (cls.contains('mute')) kind = 'mute';
    pushText(node.textContent, kind);
  }

  return { logs, tables };
}

function collectGuiSnapshot(guiWinData, guiWinContentEl, statusText) {
  if (!guiWinData) return null;
  const fields = [];
  const walkDom = el => {
    if (!el || el.nodeType !== 1) return;
    const tag = el.tagName;
    if (tag === 'INPUT') {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        const label = el.parentElement?.textContent?.trim() || type;
        fields.push({ kind: type, label, checked: el.checked });
      } else {
        const val = type === 'password' ? (el.value ? '•'.repeat(Math.min(10, el.value.length)) : '(empty)') : (el.value || '(empty)');
        fields.push({ kind: el.classList.contains('calc-screen') ? 'Display' : 'Input', value: val, hint: el.placeholder || '' });
      }
      return;
    }
    if (tag === 'TEXTAREA') {
      fields.push({ kind: 'TextArea', value: el.value || '(empty)' });
      return;
    }
    if (tag === 'SELECT') {
      const chosen = el.value || el.options?.[0]?.text || '';
      fields.push({ kind: 'Select', value: chosen });
      return;
    }
    if (tag === 'BUTTON') {
      fields.push({ kind: 'Button', label: el.textContent.trim() });
      return;
    }
    if (tag === 'LABEL' && !el.querySelector('input')) {
      fields.push({ kind: 'Label', label: el.textContent.trim() });
      return;
    }
    for (const child of el.children) walkDom(child);
  };

  if (guiWinContentEl) walkDom(guiWinContentEl);
  return {
    title: guiWinData.title || 'Java Application Frame',
    size: `${guiWinData.width || 400}x${guiWinData.height || 300}`,
    status: statusText || 'Active',
    fields
  };
}

function collectPreviewSnapshot(curId, previewEl) {
  if (!previewEl || (curId !== 'web' && curId !== 'php')) return null;
  if (!previewEl.getAttribute('srcdoc')) return null;
  try {
    const doc = previewEl.contentDocument;
    if (!doc || !doc.body) return null;
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('script, style').forEach(n => n.remove());
    const textLines = (clone.innerText || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    const inputs = [...doc.querySelectorAll('input, select, textarea')].slice(0, 12).map(el => {
      const name = el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('placeholder') || el.type || 'field';
      const val = el.type === 'password'
        ? (el.value ? '•'.repeat(Math.min(8, el.value.length)) : '')
        : (el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? 'checked' : 'unchecked') : (el.value || ''));
      return `${name}: ${val || '(blank)'}`;
    });
    if (!textLines.length && !inputs.length) return null;
    return { title: doc.title || 'Web Preview', textLines, inputs };
  } catch {
    return null;
  }
}

export function collectJournalSnapshot({
  cur,
  editor,
  editorHtml,
  editorPhp,
  phpViewMode,
  defaultPhpHtml,
  consoleEl,
  previewEl,
  activeGuiWinData,
  guiWinContentEl,
  guiStatusTextEl,
  activePractical
}) {
  const codeFiles = [];
  if (cur.id === 'php' && editorHtml && editorPhp) {
    const htmlCode = editorHtml.get();
    const phpCode = editorPhp.get();
    const hasCustomHtml = htmlCode.trim() && (htmlCode.trim() !== String(defaultPhpHtml || '').trim() || phpViewMode === 'html');
    if (hasCustomHtml || !phpCode.trim()) {
      codeFiles.push({ filename: 'index.html', label: 'HTML Form (Frontend)', langId: 'web', code: htmlCode });
    }
    if (phpCode.trim() || phpViewMode !== 'html') {
      codeFiles.push({ filename: 'process.php', label: 'PHP Script (Backend)', langId: 'php', code: phpCode });
    }
  } else if (editor) {
    codeFiles.push({ filename: cur.file, label: `${cur.name} Source`, langId: cur.id, code: editor.get() });
  }

  const { logs, tables } = extractConsoleSnapshot(consoleEl);
  const gui = cur.id === 'java' ? collectGuiSnapshot(activeGuiWinData, guiWinContentEl, guiStatusTextEl?.textContent) : null;
  const preview = collectPreviewSnapshot(cur.id, previewEl);

  const primaryCode = codeFiles[0]?.code || '';
  const hasMetaForCur = activePractical && activePractical.langId === cur.id;
  const defaultTitle = hasMetaForCur
    ? activePractical.title
    : inferPracticalTitle(primaryCode, cur.id, cur.name);
  const defaultNo = hasMetaForCur ? activePractical.num : 'Practical #01';
  const defaultAim = hasMetaForCur ? (activePractical.desc || '') : '';
  const defaultSubject = SUBJECT_DEFAULTS[cur.id] || `${cur.name} Programming Lab`;

  const hasOutput = logs.some(l => l.text.trim()) || tables.length > 0 || !!gui || !!preview;

  return {
    langId: cur.id,
    langName: cur.name,
    codeFiles,
    logs,
    tables,
    gui,
    preview,
    hasOutput,
    suggested: {
      practicalNo: defaultNo,
      subject: defaultSubject,
      title: defaultTitle,
      aim: defaultAim
    }
  };
}

// =========================================================================
// Academic A4 HTML Builder (Preview Stage + @media print / Android PrintManager)
// =========================================================================
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderHighlightedCodeHtml(code, langId) {
  const lines = String(code ?? '').replace(/\r\n/g, '\n').split('\n');
  const state = { inBlockComment: false };
  return lines.map((line, idx) => {
    const tokens = tokenizeLine(line, langId, state);
    const lineHtml = tokens.length
      ? tokens.map(tok => tok.kind === 'plain' ? esc(tok.text) : `<span class="jp-tok-${tok.kind}">${esc(tok.text)}</span>`).join('')
      : ' ';
    return `<div class="jp-code-line"><span class="jp-ln">${String(idx + 1).padStart(2, '0')}</span><span class="jp-lc">${lineHtml}</span></div>`;
  }).join('');
}

export function buildJournalHtml(meta, snapshot, options = {}) {
  const { includeCode = true, includeOutput = true, includeSignature = true } = options;
  const institute = meta.institute?.trim() || 'Computer Science Laboratory';
  const department = meta.department?.trim() || '';
  const studentName = meta.studentName?.trim() || '________________________';
  const rollNo = meta.rollNo?.trim() || '________';
  const className = meta.className?.trim() || '________';
  const academicYear = meta.academicYear?.trim() || computeAcademicYear();
  const subject = meta.subject?.trim() || snapshot.suggested.subject;
  const practicalNo = meta.practicalNo?.trim() || 'Practical #01';
  const title = meta.title?.trim() || snapshot.suggested.title;
  const aim = meta.aim?.trim() || '';
  const dateLabel = formatDisplayDate(meta.date) || formatDisplayDate(todayIsoDate());
  const fileNames = snapshot.codeFiles.map(f => f.filename).join(', ');

  let sectionsHtml = '';

  if (aim) {
    sectionsHtml += `
      <div class="jp-aim-box">
        <span class="jp-aim-label">Aim / Objective:</span>
        <span>${esc(aim)}</span>
      </div>`;
  }

  if (includeCode && snapshot.codeFiles.length) {
    for (const file of snapshot.codeFiles) {
      const lineCount = String(file.code || '').replace(/\r\n/g, '\n').split('\n').length;
      sectionsHtml += `
        <section class="jp-section">
          <div class="jp-sec-head">
            <b>Source Code — ${esc(file.filename)}</b>
            <span>${esc(file.label)} · ${lineCount} line${lineCount === 1 ? '' : 's'}</span>
          </div>
          <div class="jp-code-box">${renderHighlightedCodeHtml(file.code, file.langId)}</div>
        </section>`;
    }
  }

  if (includeOutput) {
    let outParts = '';
    const nonEmptyLogs = snapshot.logs.filter(l => l.text.length > 0);
    if (nonEmptyLogs.length) {
      const logHtml = nonEmptyLogs.map(seg => `<span class="jp-out-${seg.kind}">${esc(seg.text)}</span>`).join('');
      outParts += `<pre class="jp-console-box">${logHtml}</pre>`;
    }

    for (const tbl of snapshot.tables) {
      const shownRows = tbl.rows.slice(0, 100);
      const thead = `<tr><th class="jp-rn">#</th>${tbl.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`;
      const tbody = shownRows.map((r, ri) =>
        `<tr><td class="jp-rn">${ri + 1}</td>${r.cells.map(c => `<td${c.isNull ? ' class="jp-null"' : ''}>${esc(c.text)}</td>`).join('')}</tr>`
      ).join('');
      const truncNote = tbl.rows.length > shownRows.length ? ` (first ${shownRows.length} shown)` : '';
      outParts += `
        <div class="jp-sql-wrap">
          <div class="jp-sql-cap">${esc(tbl.caption + truncNote)}</div>
          <table class="jp-sql-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>
        </div>`;
    }

    if (snapshot.gui) {
      const rowsHtml = snapshot.gui.fields.slice(0, 24).map(f => {
        if (f.kind === 'Label') return `<div class="jp-gui-row"><b>Label:</b> <span>${esc(f.label)}</span></div>`;
        if (f.kind === 'Button') return `<span class="jp-gui-btn">${esc(f.label)}</span>`;
        if (f.kind === 'checkbox' || f.kind === 'radio') return `<div class="jp-gui-row"><b>[${f.checked ? 'x' : ' '}]</b> <span>${esc(f.label)}</span></div>`;
        return `<div class="jp-gui-row"><b>${esc(f.kind)}:</b> <span>${esc(f.value)}</span></div>`;
      }).join('');
      outParts += `
        <div class="jp-gui-card">
          <div class="jp-gui-bar"><span>☕ ${esc(snapshot.gui.title)}</span><small>${esc(snapshot.gui.size)}</small></div>
          <div class="jp-gui-body">${rowsHtml || '<div class="jp-gui-empty">Window rendered cleanly.</div>'}</div>
          <div class="jp-gui-status">Status: ${esc(snapshot.gui.status)}</div>
        </div>`;
    }

    if (snapshot.preview) {
      const pText = snapshot.preview.textLines.map(t => esc(t)).join('\n');
      const pInputs = snapshot.preview.inputs.length
        ? `<div class="jp-prev-inputs"><b>Form Values:</b> ${snapshot.preview.inputs.map(esc).join(' · ')}</div>`
        : '';
      outParts += `
        <div class="jp-prev-box">
          <div class="jp-prev-title">🌐 Web Preview Output (${esc(snapshot.preview.title)})</div>
          ${pText ? `<pre class="jp-prev-text">${pText}</pre>` : ''}
          ${pInputs}
        </div>`;
    }

    if (!outParts) {
      outParts = `<div class="jp-out-empty">No program output captured yet. Tap ▶ Run before exporting to attach execution results.</div>`;
    }

    sectionsHtml += `
      <section class="jp-section">
        <div class="jp-sec-head">
          <b>Execution Output</b>
          <span>${esc(snapshot.langName)} Runtime</span>
        </div>
        ${outParts}
      </section>`;
  }

  const sigHtml = includeSignature ? `
    <footer class="jp-sig-box">
      <div class="jp-sig-cell"><span>Submission Date</span><b>${esc(dateLabel)}</b></div>
      <div class="jp-sig-cell"><span>Marks / Grade</span><b>______ / 10</b></div>
      <div class="jp-sig-cell"><span>Student Signature</span><b>_________________</b></div>
      <div class="jp-sig-cell"><span>Examiner / Faculty</span><b>_________________</b></div>
    </footer>` : '';

  return `
    <article class="jp-sheet">
      <header class="jp-header">
        <div>
          <h1 class="jp-inst">${esc(institute)}</h1>
          ${department ? `<div class="jp-dept">${esc(department)}</div>` : ''}
        </div>
        <div class="jp-badge-col">
          <span class="jp-prac-badge">${esc(practicalNo)}</span>
          <small class="jp-verified">ThinkCode Lab · Offline Verified</small>
        </div>
      </header>

      <table class="jp-meta-table">
        <tbody>
          <tr>
            <th>Student Name</th><td>${esc(studentName)}</td>
            <th>Roll No.</th><td>${esc(rollNo)}</td>
          </tr>
          <tr>
            <th>Class / Batch</th><td>${esc(className)}</td>
            <th>Academic Year</th><td>${esc(academicYear)}</td>
          </tr>
          <tr>
            <th>Subject</th><td>${esc(subject)}</td>
            <th>Date / File</th><td>${esc(dateLabel)} · <code>${esc(fileNames)}</code></td>
          </tr>
          <tr>
            <th>Practical Title</th><td colspan="3"><strong>${esc(title)}</strong></td>
          </tr>
        </tbody>
      </table>

      ${sectionsHtml}
      ${sigHtml}

      <div class="jp-doc-foot">
        <span>Generated with ThinkCode Lab (100% Offline Multi-Language IDE)</span>
        <span>${esc(dateLabel)}</span>
      </div>
    </article>`;
}

// =========================================================================
// High-DPI Multi-Page A4 Canvas Renderer + Standards-Compliant PDF 1.4 Writer
// =========================================================================
const A4_W_PX = 1240;
const A4_H_PX = 1754;
const A4_W_PT = 595.28;
const A4_H_PT = 841.89;
const MARGIN_X = 66;
const MARGIN_TOP = 64;
const FOOTER_H = 54;
const CONTENT_W = A4_W_PX - MARGIN_X * 2;
const MAX_Y = A4_H_PX - FOOTER_H - 18;

const UI_FONT = '"Bricolage Grotesque Variable", system-ui, -apple-system, sans-serif';
const MONO_FONT = '"JetBrains Mono Variable", ui-monospace, Menlo, Consolas, monospace';

const TOK_COLORS = {
  kw: '#1D4ED8',
  str: '#15803D',
  com: '#64748B',
  num: '#7E22CE',
  meta: '#B45309',
  plain: '#0F172A'
};

const OUT_COLORS = {
  out: '#0F172A',
  val: '#0F766E',
  cmd: '#1E40AF',
  ok: '#047857',
  err: '#B91C1C',
  sys: '#475569',
  mute: '#64748B'
};

function wrapCanvasText(ctx, text, maxWidth) {
  const raw = String(text ?? '');
  if (!raw) return [''];
  const words = raw.split(/(\s+)/);
  const lines = [];
  let current = '';
  for (const part of words) {
    const test = current + part;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else if (current.trim().length > 0) {
      lines.push(current.trimEnd());
      current = part.trimStart();
      while (ctx.measureText(current).width > maxWidth && current.length > 1) {
        let cut = current.length - 1;
        while (cut > 1 && ctx.measureText(current.slice(0, cut)).width > maxWidth) cut--;
        lines.push(current.slice(0, cut));
        current = current.slice(cut);
      }
    } else {
      let rem = part;
      while (ctx.measureText(rem).width > maxWidth && rem.length > 1) {
        let cut = rem.length - 1;
        while (cut > 1 && ctx.measureText(rem.slice(0, cut)).width > maxWidth) cut--;
        lines.push(rem.slice(0, cut));
        rem = rem.slice(cut);
      }
      current = rem;
    }
  }
  if (current.length) lines.push(current);
  return lines.length ? lines : [''];
}

function drawRoundedRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 1.5) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const cr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + cr, y);
    ctx.lineTo(x + w - cr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + cr);
    ctx.lineTo(x + w, y + h - cr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h);
    ctx.lineTo(x + cr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - cr);
    ctx.lineTo(x, y + cr);
    ctx.quadraticCurveTo(x, y, x + cr, y);
    ctx.closePath();
  }
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function splitTokensIntoWrappedLines(ctx, tokens, maxWidth) {
  const rows = [[]];
  let rowWidth = 0;

  const pushChunk = (text, kind) => {
    const seg = { text, kind };
    const w = ctx.measureText(text).width;
    if (rowWidth + w <= maxWidth || rows[rows.length - 1].length === 0) {
      rows[rows.length - 1].push(seg);
      rowWidth += w;
    } else {
      rows.push([seg]);
      rowWidth = w;
    }
  };

  for (const tok of tokens) {
    // Split on spaces cleanly when possible so code doesn't break mid-identifier unless needed
    const pieces = tok.text.split(/(\s+)/).filter(Boolean);
    for (const p of pieces) {
      if (ctx.measureText(p).width <= maxWidth) {
        pushChunk(p, tok.kind);
      } else {
        let rem = p;
        while (rem.length) {
          let cut = rem.length;
          while (cut > 1 && ctx.measureText(rem.slice(0, cut)).width > maxWidth) cut--;
          pushChunk(rem.slice(0, cut), tok.kind);
          rem = rem.slice(cut);
        }
      }
    }
  }
  return rows;
}

export async function renderJournalPdfBytes(meta, snapshot, options = {}) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const { includeCode = true, includeOutput = true, includeSignature = true } = options;
  const institute = meta.institute?.trim() || 'Computer Science Laboratory';
  const department = meta.department?.trim() || '';
  const studentName = meta.studentName?.trim() || '________________________';
  const rollNo = meta.rollNo?.trim() || '________';
  const className = meta.className?.trim() || '________';
  const academicYear = meta.academicYear?.trim() || computeAcademicYear();
  const subject = meta.subject?.trim() || snapshot.suggested.subject;
  const practicalNo = meta.practicalNo?.trim() || 'Practical #01';
  const title = meta.title?.trim() || snapshot.suggested.title;
  const aim = meta.aim?.trim() || '';
  const dateLabel = formatDisplayDate(meta.date) || formatDisplayDate(todayIsoDate());
  const fileNames = snapshot.codeFiles.map(f => f.filename).join(', ');

  const pages = [];
  let canvas, ctx, y;

  const newPage = () => {
    canvas = document.createElement('canvas');
    canvas.width = A4_W_PX;
    canvas.height = A4_H_PX;
    ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, A4_W_PX, A4_H_PX);
    ctx.textBaseline = 'top';
    pages.push(canvas);
    y = MARGIN_TOP;

    if (pages.length > 1) {
      ctx.font = `600 18px ${UI_FONT}`;
      ctx.fillStyle = '#64748B';
      ctx.fillText(`${institute}  ·  ${practicalNo}: ${title}`.slice(0, 95), MARGIN_X, 26);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(MARGIN_X, 54);
      ctx.lineTo(A4_W_PX - MARGIN_X, 54);
      ctx.stroke();
      y = 74;
    }
  };

  const ensureSpace = neededH => {
    if (y + neededH > MAX_Y) {
      newPage();
      return true;
    }
    return false;
  };

  newPage();

  // --- Top Institutional Header Banner ---
  const badgeW = 280;
  ctx.font = `700 32px ${UI_FONT}`;
  const instLines = wrapCanvasText(ctx, institute, CONTENT_W - badgeW - 24).slice(0, 2);
  const headerH = Math.max(88, instLines.length * 38 + (department ? 28 : 10) + 18);

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 32px ${UI_FONT}`;
  instLines.forEach((ln, idx) => ctx.fillText(ln, MARGIN_X, y + idx * 38));

  if (department) {
    ctx.fillStyle = '#475569';
    ctx.font = `500 20px ${UI_FONT}`;
    ctx.fillText(department, MARGIN_X, y + instLines.length * 38 + 4, CONTENT_W - badgeW - 24);
  }

  // Right Practical Badge
  drawRoundedRect(ctx, A4_W_PX - MARGIN_X - badgeW, y + 2, badgeW, 44, 10, '#FFFBEB', '#F59E0B', 2);
  ctx.fillStyle = '#B45309';
  ctx.font = `700 21px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(practicalNo.slice(0, 22), A4_W_PX - MARGIN_X - badgeW / 2, y + 13);
  ctx.fillStyle = '#64748B';
  ctx.font = `500 15px ${UI_FONT}`;
  ctx.fillText('ThinkCode Lab · Offline Verified', A4_W_PX - MARGIN_X - badgeW / 2, y + 54);
  ctx.textAlign = 'left';

  y += headerH - 6;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, y);
  ctx.lineTo(A4_W_PX - MARGIN_X, y);
  ctx.stroke();
  y += 20;

  // --- Metadata Table ---
  const drawMetaGrid = () => {
    const rows = [
      [['Student Name', studentName], ['Roll No.', rollNo]],
      [['Class / Batch', className], ['Academic Year', academicYear]],
      [['Subject', subject], ['Date · File', `${dateLabel} · ${fileNames}`]]
    ];
    const rowH = 44;
    const halfW = CONTENT_W / 2;
    const lblW = 165;

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;

    rows.forEach(pair => {
      pair.forEach((cell, colIdx) => {
        const cx = MARGIN_X + colIdx * halfW;
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(cx, y, lblW, rowH);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx + lblW, y, halfW - lblW, rowH);
        ctx.strokeRect(cx, y, lblW, rowH);
        ctx.strokeRect(cx + lblW, y, halfW - lblW, rowH);

        ctx.fillStyle = '#475569';
        ctx.font = `700 17px ${UI_FONT}`;
        ctx.fillText(cell[0], cx + 12, y + 13, lblW - 20);

        ctx.fillStyle = '#0F172A';
        ctx.font = `600 18px ${UI_FONT}`;
        ctx.fillText(cell[1], cx + lblW + 12, y + 13, halfW - lblW - 22);
      });
      y += rowH;
    });

    // Full-width Practical Title row
    ctx.font = `700 19px ${UI_FONT}`;
    const titleLines = wrapCanvasText(ctx, title, CONTENT_W - lblW - 26).slice(0, 2);
    const titleH = Math.max(44, titleLines.length * 26 + 18);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(MARGIN_X, y, lblW, titleH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(MARGIN_X + lblW, y, CONTENT_W - lblW, titleH);
    ctx.strokeRect(MARGIN_X, y, lblW, titleH);
    ctx.strokeRect(MARGIN_X + lblW, y, CONTENT_W - lblW, titleH);

    ctx.fillStyle = '#475569';
    ctx.font = `700 17px ${UI_FONT}`;
    ctx.fillText('Practical Title', MARGIN_X + 12, y + 14);

    ctx.fillStyle = '#0F172A';
    ctx.font = `700 19px ${UI_FONT}`;
    titleLines.forEach((ln, idx) => ctx.fillText(ln, MARGIN_X + lblW + 12, y + 12 + idx * 26));
    y += titleH + 18;
  };
  drawMetaGrid();

  // --- Aim / Objective ---
  if (aim) {
    ctx.font = `500 18px ${UI_FONT}`;
    const aimLines = wrapCanvasText(ctx, `Aim / Objective: ${aim}`, CONTENT_W - 32);
    const aimH = aimLines.length * 25 + 22;
    ensureSpace(aimH + 12);
    drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, aimH, 8, '#FFFBEB', '#FCD34D', 1.5);
    ctx.fillStyle = '#78350F';
    aimLines.forEach((ln, idx) => ctx.fillText(ln, MARGIN_X + 16, y + 11 + idx * 25));
    y += aimH + 18;
  }

  // Helper: Draw Section Bar
  const drawSectionHeader = (leftTitle, rightMeta) => {
    ensureSpace(90);
    drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, 42, 8, '#1E293B', null);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 19px ${UI_FONT}`;
    ctx.fillText(leftTitle, MARGIN_X + 16, y + 11, CONTENT_W - 260);
    if (rightMeta) {
      ctx.fillStyle = '#CBD5E1';
      ctx.font = `500 16px ${UI_FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(rightMeta, MARGIN_X + CONTENT_W - 16, y + 13);
      ctx.textAlign = 'left';
    }
    y += 50;
  };

  // --- Source Code Blocks ---
  if (includeCode && snapshot.codeFiles.length) {
    for (const file of snapshot.codeFiles) {
      const rawLines = String(file.code ?? '').replace(/\r\n/g, '\n').split('\n');
      drawSectionHeader(`Source Code — ${file.filename}`, `${file.label} · ${rawLines.length} lines`);

      ctx.font = `400 17px ${MONO_FONT}`;
      const lineH = 26;
      const gutterW = 54;
      const codeMaxW = CONTENT_W - gutterW - 28;
      const tokState = { inBlockComment: false };
      const visualRows = [];

      rawLines.forEach((rawLine, idx) => {
        const toks = tokenizeLine(rawLine, file.langId, tokState);
        const wrapped = splitTokensIntoWrappedLines(ctx, toks, codeMaxW);
        wrapped.forEach((segRow, wIdx) => {
          visualRows.push({
            lineNo: wIdx === 0 ? String(idx + 1).padStart(2, '0') : '',
            segs: segRow
          });
        });
      });

      // Render code box chunk-by-chunk cleanly across page breaks
      let rIdx = 0;
      while (rIdx < visualRows.length) {
        const availRows = Math.max(1, Math.floor((MAX_Y - y - 24) / lineH));
        if (availRows < 2 && MAX_Y - y < 80) {
          newPage();
          drawSectionHeader(`Source Code — ${file.filename} (cont.)`, '');
          continue;
        }
        const chunkCount = Math.min(visualRows.length - rIdx, Math.max(1, Math.floor((MAX_Y - y - 20) / lineH)));
        const boxH = chunkCount * lineH + 20;

        drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, boxH, 8, '#F8FAFC', '#CBD5E1', 1.5);
        // Gutter background
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(MARGIN_X + 1, y + 1, gutterW - 4, boxH - 2);
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MARGIN_X + gutterW, y + 2);
        ctx.lineTo(MARGIN_X + gutterW, y + boxH - 2);
        ctx.stroke();

        ctx.font = `400 17px ${MONO_FONT}`;
        for (let k = 0; k < chunkCount; k++) {
          const row = visualRows[rIdx + k];
          const ry = y + 11 + k * lineH;
          if (row.lineNo) {
            ctx.fillStyle = '#94A3B8';
            ctx.textAlign = 'right';
            ctx.fillText(row.lineNo, MARGIN_X + gutterW - 10, ry);
            ctx.textAlign = 'left';
          }
          let tx = MARGIN_X + gutterW + 14;
          for (const seg of row.segs) {
            ctx.fillStyle = TOK_COLORS[seg.kind] || '#0F172A';
            ctx.fillText(seg.text, tx, ry);
            tx += ctx.measureText(seg.text).width;
          }
        }
        y += boxH + 14;
        rIdx += chunkCount;
        if (rIdx < visualRows.length) {
          newPage();
          drawSectionHeader(`Source Code — ${file.filename} (cont.)`, '');
        }
      }
    }
  }

  // --- Execution Output Section ---
  if (includeOutput) {
    drawSectionHeader('Execution Output', `${snapshot.langName} Runtime`);

    // 1. Console logs
    const nonEmptyLogs = snapshot.logs.filter(l => l.text.length > 0);
    if (nonEmptyLogs.length) {
      ctx.font = `400 17px ${MONO_FONT}`;
      const lineH = 25;
      const outMaxW = CONTENT_W - 32;
      const consoleLines = [];
      let curSegs = [];
      let curW = 0;

      const flushLine = () => {
        consoleLines.push(curSegs);
        curSegs = [];
        curW = 0;
      };

      for (const item of nonEmptyLogs) {
        const subLines = item.text.replace(/\r\n/g, '\n').split('\n');
        subLines.forEach((sl, sIdx) => {
          if (sl) {
            const wrapped = wrapCanvasText(ctx, sl, outMaxW);
            wrapped.forEach((wl, wIdx) => {
              const w = ctx.measureText(wl).width;
              if (curW + w > outMaxW && curSegs.length) {
                flushLine();
              }
              curSegs.push({ text: wl, kind: item.kind });
              curW += w;
              if (wIdx < wrapped.length - 1) flushLine();
            });
          }
          if (sIdx < subLines.length - 1) flushLine();
        });
      }
      if (curSegs.length) flushLine();

      let lIdx = 0;
      while (lIdx < consoleLines.length) {
        const availRows = Math.floor((MAX_Y - y - 24) / lineH);
        if (availRows < 2) {
          newPage();
          drawSectionHeader('Execution Output (cont.)', '');
          continue;
        }
        const take = Math.min(consoleLines.length - lIdx, availRows);
        const boxH = take * lineH + 22;
        drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, boxH, 8, '#FFFFFF', '#CBD5E1', 1.5);
        ctx.font = `400 17px ${MONO_FONT}`;
        for (let k = 0; k < take; k++) {
          const segs = consoleLines[lIdx + k];
          const ly = y + 12 + k * lineH;
          let tx = MARGIN_X + 16;
          for (const seg of segs) {
            ctx.fillStyle = OUT_COLORS[seg.kind] || '#0F172A';
            ctx.fillText(seg.text, tx, ly);
            tx += ctx.measureText(seg.text).width;
          }
        }
        y += boxH + 14;
        lIdx += take;
        if (lIdx < consoleLines.length) {
          newPage();
          drawSectionHeader('Execution Output (cont.)', '');
        }
      }
    }

    // 2. Oracle SQL Result Tables
    for (const tbl of snapshot.tables) {
      const shownRows = tbl.rows.slice(0, 100);
      const rnW = 50;
      const availColW = CONTENT_W - rnW;
      ctx.font = `700 16px ${MONO_FONT}`;
      const rawWeights = tbl.cols.map((colName, ci) => {
        let maxW = ctx.measureText(colName).width + 22;
        for (let r = 0; r < Math.min(20, shownRows.length); r++) {
          maxW = Math.max(maxW, ctx.measureText(String(shownRows[r].cells[ci]?.text ?? '')).width + 20);
        }
        return Math.min(340, Math.max(78, maxW));
      });
      const sumW = rawWeights.reduce((a, b) => a + b, 0) || 1;
      const colWidths = rawWeights.map(w => (w / sumW) * availColW);

      const drawSqlHeader = captionText => {
        ensureSpace(90);
        ctx.fillStyle = '#0F766E';
        ctx.font = `700 16px ${UI_FONT}`;
        ctx.fillText(captionText, MARGIN_X, y);
        y += 26;

        const hdrH = 36;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(MARGIN_X, y, CONTENT_W, hdrH);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(MARGIN_X, y, CONTENT_W, hdrH);

        ctx.fillStyle = '#0F172A';
        ctx.font = `700 16px ${MONO_FONT}`;
        ctx.fillText('#', MARGIN_X + 10, y + 10, rnW - 14);
        let cx = MARGIN_X + rnW;
        tbl.cols.forEach((col, ci) => {
          ctx.beginPath();
          ctx.moveTo(cx, y);
          ctx.lineTo(cx, y + hdrH);
          ctx.stroke();
          ctx.fillText(col, cx + 8, y + 10, colWidths[ci] - 14);
          cx += colWidths[ci];
        });
        y += hdrH;
      };

      const truncSuffix = tbl.rows.length > shownRows.length ? ` (first ${shownRows.length} shown)` : '';
      drawSqlHeader(tbl.caption + truncSuffix);

      const rowH = 34;
      shownRows.forEach((row, ri) => {
        if (y + rowH > MAX_Y) {
          newPage();
          drawSqlHeader(`${tbl.caption} (cont.)`);
        }
        ctx.fillStyle = ri % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
        ctx.fillRect(MARGIN_X, y, CONTENT_W, rowH);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.strokeRect(MARGIN_X, y, CONTENT_W, rowH);

        ctx.font = `400 15px ${MONO_FONT}`;
        ctx.fillStyle = '#64748B';
        ctx.fillText(String(ri + 1), MARGIN_X + 10, y + 9, rnW - 14);

        let cx = MARGIN_X + rnW;
        row.cells.forEach((cell, ci) => {
          ctx.beginPath();
          ctx.moveTo(cx, y);
          ctx.lineTo(cx, y + rowH);
          ctx.stroke();
          ctx.fillStyle = cell.isNull ? '#94A3B8' : '#0F172A';
          ctx.fillText(cell.text, cx + 8, y + 9, colWidths[ci] - 14);
          cx += colWidths[ci];
        });
        y += rowH;
      });
      y += 16;
    }

    // 3. Java AWT / Swing Desktop GUI Card
    if (snapshot.gui) {
      const guiRows = snapshot.gui.fields.slice(0, 18);
      const boxH = 88 + Math.max(1, guiRows.length) * 30 + 22;
      ensureSpace(boxH + 12);
      drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, boxH, 10, '#F8FAFC', '#64748B', 1.5);
      // Titlebar
      drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, 42, 8, '#1E293B', null);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 17px ${UI_FONT}`;
      ctx.fillText(`Java GUI Window — ${snapshot.gui.title} (${snapshot.gui.size})`, MARGIN_X + 14, y + 11, CONTENT_W - 28);

      let gy = y + 54;
      ctx.font = `500 16px ${MONO_FONT}`;
      if (!guiRows.length) {
        ctx.fillStyle = '#475569';
        ctx.fillText('AWT / Swing Window rendered successfully.', MARGIN_X + 16, gy);
        gy += 30;
      } else {
        for (const f of guiRows) {
          ctx.fillStyle = '#0F172A';
          const text = f.kind === 'Button'
            ? `[Button: ${f.label}]`
            : f.kind === 'Label'
              ? `Label: ${f.label}`
              : (f.kind === 'checkbox' || f.kind === 'radio')
                ? `[${f.checked ? 'x' : ' '}] ${f.label}`
                : `${f.kind}: ${f.value}`;
          ctx.fillText(text, MARGIN_X + 16, gy, CONTENT_W - 32);
          gy += 30;
        }
      }
      ctx.fillStyle = '#047857';
      ctx.font = `600 15px ${UI_FONT}`;
      ctx.fillText(`Status: ${snapshot.gui.status}`, MARGIN_X + 16, y + boxH - 28, CONTENT_W - 32);
      y += boxH + 16;
    }

    // 4. Web Preview Output Snapshot
    if (snapshot.preview) {
      ctx.font = `400 16px ${MONO_FONT}`;
      const pLines = snapshot.preview.textLines.flatMap(ln => wrapCanvasText(ctx, ln, CONTENT_W - 32)).slice(0, 18);
      if (snapshot.preview.inputs.length) {
        pLines.push('Form Values: ' + snapshot.preview.inputs.join(' · '));
      }
      const pH = 48 + Math.max(1, pLines.length) * 24 + 16;
      ensureSpace(pH + 12);
      drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, pH, 8, '#F8FAFC', '#CBD5E1', 1.5);
      ctx.fillStyle = '#0F172A';
      ctx.font = `700 17px ${UI_FONT}`;
      ctx.fillText(`Web Preview Output (${snapshot.preview.title})`, MARGIN_X + 14, y + 12);
      ctx.font = `400 16px ${MONO_FONT}`;
      ctx.fillStyle = '#334155';
      pLines.forEach((ln, idx) => ctx.fillText(ln, MARGIN_X + 16, y + 44 + idx * 24, CONTENT_W - 32));
      y += pH + 16;
    }

    if (!nonEmptyLogs.length && !snapshot.tables.length && !snapshot.gui && !snapshot.preview) {
      ensureSpace(64);
      drawRoundedRect(ctx, MARGIN_X, y, CONTENT_W, 54, 8, '#F8FAFC', '#CBD5E1', 1.5);
      ctx.fillStyle = '#64748B';
      ctx.font = `500 17px ${UI_FONT}`;
      ctx.fillText('No execution output captured yet. Run your code before exporting to attach output.', MARGIN_X + 16, y + 17);
      y += 68;
    }
  }

  // --- Evaluation & Signature Footer Box ---
  if (includeSignature) {
    const sigH = 86;
    ensureSpace(sigH + 16);
    y = Math.max(y + 10, Math.min(MAX_Y - sigH - 8, y + 10));
    const colW = CONTENT_W / 4;
    const cells = [
      ['Submission Date', dateLabel],
      ['Marks / Grade', '______ / 10'],
      ['Student Signature', '________________'],
      ['Examiner / Faculty', '________________']
    ];
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    cells.forEach((cell, idx) => {
      const cx = MARGIN_X + idx * colW;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(cx, y, colW, sigH);
      ctx.strokeRect(cx, y, colW, sigH);
      ctx.fillStyle = '#64748B';
      ctx.font = `600 15px ${UI_FONT}`;
      ctx.fillText(cell[0], cx + 14, y + 14);
      ctx.fillStyle = '#0F172A';
      ctx.font = `700 18px ${UI_FONT}`;
      ctx.fillText(cell[1], cx + 14, y + 48, colW - 24);
    });
    y += sigH + 12;
  }

  // Stamp consistent page footers across all pages
  const totalPages = pages.length;
  const jpegPages = [];
  for (let p = 0; p < totalPages; p++) {
    const pgCanvas = pages[p];
    const pCtx = pgCanvas.getContext('2d');
    const fy = A4_H_PX - 44;
    pCtx.strokeStyle = '#E2E8F0';
    pCtx.lineWidth = 1.2;
    pCtx.beginPath();
    pCtx.moveTo(MARGIN_X, fy - 10);
    pCtx.lineTo(A4_W_PX - MARGIN_X, fy - 10);
    pCtx.stroke();

    pCtx.fillStyle = '#64748B';
    pCtx.font = `500 15px ${UI_FONT}`;
    pCtx.textAlign = 'left';
    pCtx.fillText(`Generated by ThinkCode Lab (100% Offline) · ${dateLabel}`, MARGIN_X, fy);
    pCtx.textAlign = 'right';
    pCtx.fillText(`Page ${p + 1} of ${totalPages}`, A4_W_PX - MARGIN_X, fy);

    const dataUrl = pgCanvas.toDataURL('image/jpeg', 0.92);
    const b64 = dataUrl.split(',')[1] || '';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    jpegPages.push({ bytes, width: A4_W_PX, height: A4_H_PX });

    // Free bitmap memory promptly on budget phones
    pgCanvas.width = 0;
    pgCanvas.height = 0;
  }

  return buildPdfFromJpegPages(jpegPages);
}

// Pure-JS standards-compliant PDF 1.4 builder embedding A4 JPEG pages (zero dependencies)
export function buildPdfFromJpegPages(jpegPages) {
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [0]; // index 0 is free object 0
  let byteLen = 0;

  const writeBytes = u8 => {
    chunks.push(u8);
    byteLen += u8.length;
  };
  const writeStr = str => writeBytes(enc.encode(str));

  // Header + 4-byte binary marker (>127)
  writeBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageCount = jpegPages.length;
  const kidsRefs = [];
  for (let i = 0; i < pageCount; i++) {
    kidsRefs.push(`${3 + i * 3} 0 R`);
  }

  // 1: Catalog
  offsets[1] = byteLen;
  writeStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  offsets[2] = byteLen;
  writeStr(`2 0 obj\n<< /Type /Pages /Count ${pageCount} /Kids [${kidsRefs.join(' ')}] >>\nendobj\n`);

  // Each page uses 3 objects: Page (pObj), Content stream (cObj), Image XObject (iObj)
  for (let i = 0; i < pageCount; i++) {
    const pObj = 3 + i * 3;
    const cObj = pObj + 1;
    const iObj = pObj + 2;
    const jpg = jpegPages[i];

    offsets[pObj] = byteLen;
    writeStr(
      `${pObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W_PT} ${A4_H_PT}] ` +
      `/Resources << /XObject << /Im0 ${iObj} 0 R >> >> /Contents ${cObj} 0 R >>\nendobj\n`
    );

    const streamCmd = `q ${A4_W_PT} 0 0 ${A4_H_PT} 0 0 cm /Im0 Do Q\n`;
    offsets[cObj] = byteLen;
    writeStr(`${cObj} 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`);

    offsets[iObj] = byteLen;
    writeStr(
      `${iObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${jpg.width} /Height ${jpg.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.bytes.length} >>\nstream\n`
    );
    writeBytes(jpg.bytes);
    writeStr('\nendstream\nendobj\n');
  }

  const totalObjects = 3 + pageCount * 3;
  const xrefStart = byteLen;
  writeStr(`xref\n0 ${totalObjects}\n`);
  writeStr('0000000000 65535 f \n');
  for (let id = 1; id < totalObjects; id++) {
    writeStr(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  writeStr(`trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  const out = new Uint8Array(byteLen);
  let cursor = 0;
  for (const ch of chunks) {
    out.set(ch, cursor);
    cursor += ch.length;
  }
  return out;
}
