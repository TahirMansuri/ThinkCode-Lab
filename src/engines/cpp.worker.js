// C++ Unified Worker: Single offline C++ engine powered by JSCPP with full STL string, iomanip,
// pointers, references (&), structs, unions (shared memory), OOP classes/constructors/inheritance,
// and real-time interactive in-console stdin.

let base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
const dec = new TextDecoder();
const post = (t, s) => postMessage({ t, s });

function requestInputFromConsole() {
  if (status) {
    post('need_input');
    Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
    Atomics.wait(status, 0, 1);
    const st = Atomics.load(status, 0);
    Atomics.store(status, 0, 0);
    if (st === 2) { // 2 = INPUT_READY
      const len = Atomics.load(dataLen, 0);
      const copy = new Uint8Array(len);
      copy.set(dataBuf.subarray(0, len));
      return dec.decode(copy) + '\n';
    }
    return ''; // Cancelled / Stopped -> end wait loop cleanly
  }
  if (queue.length > 0) {
    return queue.shift() + '\n';
  }
  return '';
}

// ---------- C++ Lexical Tokenizer ----------

const PRIMITIVE_KEYWORDS = new Set([
  'void', 'bool', 'char', 'wchar_t', 'char16_t', 'char32_t',
  'short', 'int', 'long', 'float', 'double',
  'signed', 'unsigned'
]);

const QUALIFIER_KEYWORDS = new Set([
  'const', 'volatile', 'static', 'mutable', 'register', 'extern'
]);

const SKIP_SPECIFIERS = new Set([
  'inline', 'explicit', 'constexpr', 'virtual', 'override', 'final'
]);

const CONTROL_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'goto', 'sizeof', 'typeof', 'typedef',
  'struct', 'class', 'union', 'enum', 'public', 'private', 'protected',
  'using', 'namespace', 'true', 'false', 'nullptr', 'new', 'delete', 'this'
]);

function tokenize(code) {
  const tokens = [];
  const n = code.length;
  let i = 0;
  let line = 1;

  while (i < n) {
    const ch = code[i];

    // Newline
    if (ch === '\n' || (ch === '\r' && code[i + 1] === '\n')) {
      const val = ch === '\r' ? '\r\n' : '\n';
      tokens.push({ type: 'nl', val, line });
      i += val.length;
      line++;
      continue;
    }

    // Horizontal whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\v' || ch === '\f') {
      let j = i + 1;
      while (j < n && (code[j] === ' ' || code[j] === '\t' || code[j] === '\v' || code[j] === '\f')) j++;
      tokens.push({ type: 'ws', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      let j = i + 2;
      while (j < n && code[j] !== '\n') j++;
      tokens.push({ type: 'comment_line', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      let j = i + 2;
      const startLine = line;
      while (j < n && !(code[j] === '*' && code[j + 1] === '/')) {
        if (code[j] === '\n') line++;
        j++;
      }
      if (j < n) j += 2;
      tokens.push({ type: 'comment_block', val: code.slice(i, j), line: startLine });
      i = j;
      continue;
    }

    // Preprocessor directive (# at start of line or after whitespace)
    if (ch === '#') {
      const prev = tokens[tokens.length - 1];
      const atLineStart = !prev || prev.type === 'nl' || (prev.type === 'ws' && (tokens.length < 2 || tokens[tokens.length - 2].type === 'nl'));
      if (atLineStart) {
        let j = i + 1;
        const startLine = line;
        while (j < n) {
          if (code[j] === '\\' && code[j + 1] === '\n') { line++; j += 2; continue; }
          if (code[j] === '\\' && code[j + 1] === '\r' && code[j + 2] === '\n') { line++; j += 3; continue; }
          if (code[j] === '\n') break;
          j++;
        }
        tokens.push({ type: 'preproc', val: code.slice(i, j), line: startLine });
        i = j;
        continue;
      }
    }

    // Prefixed strings/chars (u8"...", L"...", u"...", U"...", L'...')
    const prefMatch = code.slice(i).match(/^(u8|L|u|U)(?=["'])/);
    if (prefMatch) {
      const pLen = prefMatch[1].length;
      const q = code[i + pLen];
      let j = i + pLen + 1;
      while (j < n && code[j] !== q) {
        if (code[j] === '\\') j++;
        if (code[j] === '\n') line++;
        j++;
      }
      if (j < n) j++;
      tokens.push({ type: q === '"' ? 'str' : 'chr', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // String literal
    if (ch === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"') {
        if (code[j] === '\\') j++;
        if (code[j] === '\n') line++;
        j++;
      }
      if (j < n) j++;
      tokens.push({ type: 'str', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // Char literal
    if (ch === "'") {
      let j = i + 1;
      while (j < n && code[j] !== "'") {
        if (code[j] === '\\') j++;
        if (code[j] === '\n') line++;
        j++;
      }
      if (j < n) j++;
      tokens.push({ type: 'chr', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // Numbers
    if ((ch >= '0' && ch <= '9') || (ch === '.' && code[i + 1] >= '0' && code[i + 1] <= '9')) {
      const numM = code.slice(i).match(/^(?:0[xX][0-9a-fA-F]+[uUlL]*|0[bB][01]+[uUlL]*|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFlLuU]*)/);
      if (numM) {
        tokens.push({ type: 'num', val: numM[0], line });
        i += numM[0].length;
        continue;
      }
    }

    // Identifiers
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
      let j = i + 1;
      while (j < n && /\w/.test(code[j])) j++;
      tokens.push({ type: 'ident', val: code.slice(i, j), line });
      i = j;
      continue;
    }

    // Multi-char operators
    const op3 = code.slice(i, i + 3);
    if (op3 === '<<=' || op3 === '>>=' || op3 === '...' || op3 === '->*') {
      tokens.push({ type: 'op', val: op3, line });
      i += 3;
      continue;
    }
    const op2 = code.slice(i, i + 2);
    if (
      op2 === '::' || op2 === '->' || op2 === '<<' || op2 === '>>' ||
      op2 === '<=' || op2 === '>=' || op2 === '==' || op2 === '!=' ||
      op2 === '&&' || op2 === '||' || op2 === '++' || op2 === '--' ||
      op2 === '+=' || op2 === '-=' || op2 === '*=' || op2 === '/=' ||
      op2 === '%=' || op2 === '&=' || op2 === '|=' || op2 === '^='
    ) {
      tokens.push({ type: 'op', val: op2, line });
      i += 2;
      continue;
    }

    tokens.push({ type: 'punct', val: ch, line });
    i++;
  }

  return tokens;
}

function isTrivia(tok) {
  return !tok || tok.type === 'ws' || tok.type === 'nl' || tok.type === 'comment_line' || tok.type === 'comment_block';
}

function nextSig(tokens, idx) {
  let k = idx + 1;
  while (k < tokens.length && isTrivia(tokens[k])) k++;
  return k < tokens.length ? k : -1;
}

function prevSig(tokens, idx) {
  let k = idx - 1;
  while (k >= 0 && isTrivia(tokens[k])) k--;
  return k;
}

function findMatching(tokens, openIdx, openCh, closeCh) {
  let depth = 0;
  for (let i = openIdx; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'punct') continue;
    if (t.val === openCh) depth++;
    else if (t.val === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function tokStr(tokens) {
  let s = '';
  for (let i = 0; i < tokens.length; i++) s += tokens[i].val;
  return s;
}

function splitTopLevelCommas(tokens) {
  const groups = [];
  let cur = [];
  let p = 0, b = 0, c = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'punct') {
      if (t.val === '(') p++;
      else if (t.val === ')') p--;
      else if (t.val === '[') b++;
      else if (t.val === ']') b--;
      else if (t.val === '{') c++;
      else if (t.val === '}') c--;
      else if (t.val === ',' && p === 0 && b === 0 && c === 0) {
        groups.push(cur);
        cur = [];
        continue;
      }
    }
    cur.push(t);
  }
  if (cur.length > 0 || groups.length > 0) groups.push(cur);
  return groups;
}

// ---------- Validation Layer (Token-Aware, Zero Comment False-Positives) ----------

function validateCppCode(code, tokens) {
  const errors = [];
  const lines = code.split('\n');

  // Check 1: Missing main function (check non-trivia tokens so comments/strings don't spoof main())
  let hasMain = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ident' && t.val === 'main') {
      const prev = prevSig(tokens, i);
      const next = nextSig(tokens, i);
      if (prev !== -1 && next !== -1 && tokens[next].val === '(' &&
          (tokens[prev].val === 'int' || tokens[prev].val === 'void' || tokens[prev].val === 'signed')) {
        hasMain = true;
        break;
      }
    }
  }
  if (!hasMain) {
    return ["main.cpp: error: undefined reference to 'main'\ncollect2: error: ld returned 1 exit status\n"];
  }

  // Check 2: Balanced braces outside comments and string/char literals
  const braceStack = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'punct') continue;
    if (t.val === '{') {
      braceStack.push(t);
    } else if (t.val === '}') {
      if (braceStack.length === 0) {
        const lineText = lines[t.line - 1] || '';
        errors.push(`main.cpp:${t.line}: error: expected unqualified-id before '}' token\n ${lineText}\n`);
        return errors;
      }
      braceStack.pop();
    }
  }
  if (braceStack.length > 0) {
    const unclosed = braceStack[braceStack.length - 1];
    const lineText = lines[unclosed.line - 1] || '';
    errors.push(`main.cpp:${unclosed.line}: error: expected '}' to close block opened here\n ${lineText}\n`);
    return errors;
  }

  // Check 3: Missing semicolon after class/struct/union definition (allowing inline variable declarators `} s1;`)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ident' && (t.val === 'class' || t.val === 'struct' || t.val === 'union')) {
      const k1 = nextSig(tokens, i);
      if (k1 === -1) continue;
      let braceIdx = -1;
      if (tokens[k1].type === 'punct' && tokens[k1].val === '{') {
        braceIdx = k1;
      } else if (tokens[k1].type === 'ident') {
        let k2 = nextSig(tokens, k1);
        if (k2 !== -1 && tokens[k2].type === 'punct' && tokens[k2].val === ':') {
          // Inheritance clause until '{' or ';'
          let k3 = nextSig(tokens, k2);
          while (k3 !== -1 && tokens[k3].val !== '{' && tokens[k3].val !== ';') {
            k3 = nextSig(tokens, k3);
          }
          if (k3 !== -1 && tokens[k3].val === '{') braceIdx = k3;
        } else if (k2 !== -1 && tokens[k2].val === '{') {
          braceIdx = k2;
        }
      }
      if (braceIdx === -1) continue;
      const closeIdx = findMatching(tokens, braceIdx, '{', '}');
      if (closeIdx === -1) continue;
      // Walk until ';' or another top-level declaration keyword / '{'
      let k = nextSig(tokens, closeIdx);
      let okSemi = false;
      while (k !== -1) {
        const tk = tokens[k];
        if (tk.type === 'punct' && tk.val === ';') { okSemi = true; break; }
        if (tk.type === 'punct' && (tk.val === '{' || tk.val === '}')) break;
        if (tk.type === 'ident' && (PRIMITIVE_KEYWORDS.has(tk.val) || tk.val === 'class' || tk.val === 'struct' || tk.val === 'union' || tk.val === 'using')) break;
        k = nextSig(tokens, k);
      }
      if (!okSemi) {
        const lNum = tokens[closeIdx].line;
        const lineText = lines[lNum - 1] || '}';
        errors.push(`main.cpp:${lNum}: error: expected ';' after ${t.val} definition\n ${lineText}\n`);
      }
    }
  }

  return errors;
}

// ---------- Stage A: Preprocessor, std::, and Keyword Normalization ----------

function normalizeLexicalCpp(tokens) {
  const out = [];
  const tokOutPos = new Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    tokOutPos[i] = out.length;
    const t = tokens[i];

    // Preprocessor headers
    if (t.type === 'preproc') {
      let line = t.val;
      if (/^#\s*include\s*<\s*iostream\.h\s*>/.test(line)) {
        line = '#include <iostream>';
      } else if (/^#\s*include\s*<\s*conio\.h\s*>/.test(line)) {
        line = '';
      } else if (/^#\s*include\s*<\s*bits\/stdc\+\+\.h\s*>/.test(line)) {
        line = [
          '#include <iostream>',
          '#include <cmath>',
          '#include <cstring>',
          '#include <cstdlib>',
          '#include <cctype>',
          '#include <string>',
          '#include <iomanip>'
        ].join('\n');
      }
      out.push({ type: 'preproc', val: line, line: t.line });
      continue;
    }

    // Strip std:: prefix and string::npos -> (-1)
    if (t.type === 'ident' && t.val === 'std') {
      const k1 = nextSig(tokens, i);
      if (k1 !== -1 && tokens[k1].type === 'op' && tokens[k1].val === '::') {
        i = k1;
        continue;
      }
    }
    if (t.type === 'ident' && t.val === 'string') {
      const k1 = nextSig(tokens, i);
      const k2 = k1 !== -1 ? nextSig(tokens, k1) : -1;
      if (k1 !== -1 && k2 !== -1 && tokens[k1].val === '::' && tokens[k2].val === 'npos') {
        out.push({ type: 'punct', val: '(', line: t.line });
        out.push({ type: 'punct', val: '-', line: t.line });
        out.push({ type: 'num', val: '1', line: t.line });
        out.push({ type: 'punct', val: ')', line: t.line });
        i = k2;
        continue;
      }
    }

    if (t.type === 'ident' && t.val === 'nullptr') {
      out.push({ type: 'num', val: '0', line: t.line });
      continue;
    }

    if (t.type === 'ident' && SKIP_SPECIFIERS.has(t.val)) {
      continue;
    }

    out.push(t);
  }
  return tokenize(tokStr(out));
}

// ---------- Stage B: Extract & Lower struct / union / class ----------

function isKnownTypeKeyword(val, records) {
  return PRIMITIVE_KEYWORDS.has(val) || QUALIFIER_KEYWORDS.has(val) || val === 'string' || Boolean(records[val]);
}

function collectParamNames(paramsTokens, records) {
  const names = new Set();
  for (const paramGroup of splitTopLevelCommas(paramsTokens)) {
    const sig = paramGroup.filter(t => !isTrivia(t));
    for (let i = sig.length - 1; i >= 0; i--) {
      if (sig[i].type === 'ident' && !isKnownTypeKeyword(sig[i].val, records) && !CONTROL_KEYWORDS.has(sig[i].val)) {
        if (i + 1 >= sig.length || sig[i + 1].val === '[' || sig[i + 1].val === '=') {
          names.add(sig[i].val);
          break;
        }
      }
    }
  }
  return names;
}

function collectDeclVarsFromIdx(tokens, startTypeIdx, stopIdx, scopeEndIdx, records, outEntries) {
  // Scan declarator identifiers after a leading type keyword up to ';' or stopIdx
  let j = startTypeIdx + 1;
  while (j < stopIdx && tokens[j].val !== ';') {
    const cur = tokens[j];
    if (!isTrivia(cur)) {
      if (cur.val === '(' || cur.val === '{' || cur.val === '=') {
        if (cur.val === '(') {
          const closeP = findMatching(tokens, j, '(', ')');
          if (closeP !== -1) { j = closeP + 1; continue; }
        }
        if (cur.val === '{') {
          const closeB = findMatching(tokens, j, '{', '}');
          if (closeB !== -1) { j = closeB + 1; continue; }
        }
        let k = j + 1, dp = 0, db = 0, dc = 0;
        while (k < stopIdx) {
          const tk = tokens[k];
          if (tk.type === 'punct') {
            if (tk.val === '(') dp++;
            else if (tk.val === ')') dp--;
            else if (tk.val === '[') db++;
            else if (tk.val === ']') db--;
            else if (tk.val === '{') dc++;
            else if (tk.val === '}') dc--;
            else if ((tk.val === ',' || tk.val === ';') && dp === 0 && db === 0 && dc === 0) break;
          }
          k++;
        }
        j = k;
        continue;
      }
      if (cur.type === 'ident' && !isKnownTypeKeyword(cur.val, records) && !CONTROL_KEYWORDS.has(cur.val)) {
        const nxt = nextSig(tokens, j);
        if (nxt === -1 || tokens[nxt].val !== '(') {
          outEntries.push({ name: cur.val, startIdx: j, endIdx: scopeEndIdx });
        }
      }
    }
    j++;
  }
}

function buildShadowScopes(paramsTokens, bodyTokens, records) {
  const scopes = [];
  const pNames = collectParamNames(paramsTokens, records);
  for (const pn of pNames) {
    scopes.push({ name: pn, startIdx: 0, endIdx: bodyTokens.length });
  }

  // Track brace blocks { ... } as endIdx ranges
  const blockEndAtOpen = new Map();
  const stack = [bodyTokens.length];
  for (let i = 0; i < bodyTokens.length; i++) {
    const t = bodyTokens[i];
    if (t.type !== 'punct') continue;
    if (t.val === '{') {
      const closeB = findMatching(bodyTokens, i, '{', '}');
      const end = closeB !== -1 ? closeB : bodyTokens.length;
      blockEndAtOpen.set(i, end);
      stack.push(end);
    } else if (t.val === '}') {
      if (stack.length > 1) stack.pop();
    }
  }

  // Re-walk to collect local declarations bound to their enclosing block or `for` loop range
  const scopeStack = [bodyTokens.length];
  let parenDepth = 0;
  for (let i = 0; i < bodyTokens.length; i++) {
    const t = bodyTokens[i];
    if (isTrivia(t)) continue;

    if (t.val === '(') { parenDepth++; continue; }
    if (t.val === ')') { parenDepth = Math.max(0, parenDepth - 1); continue; }
    if (t.val === '{') {
      scopeStack.push(blockEndAtOpen.get(i) ?? bodyTokens.length);
      continue;
    }
    if (t.val === '}') {
      if (scopeStack.length > 1) scopeStack.pop();
      continue;
    }

    if (t.type === 'ident' && t.val === 'for') {
      const openP = nextSig(bodyTokens, i);
      const closeP = openP !== -1 && bodyTokens[openP].val === '(' ? findMatching(bodyTokens, openP, '(', ')') : -1;
      if (closeP !== -1) {
        let forEnd = closeP;
        const bodyStart = nextSig(bodyTokens, closeP);
        if (bodyStart !== -1) {
          if (bodyTokens[bodyStart].val === '{') {
            forEnd = findMatching(bodyTokens, bodyStart, '{', '}');
            if (forEnd === -1) forEnd = bodyTokens.length;
          } else {
            let k = bodyStart, dp = 0, db = 0, dc = 0;
            while (k < bodyTokens.length) {
              const tk = bodyTokens[k];
              if (tk.type === 'punct') {
                if (tk.val === '(') dp++;
                else if (tk.val === ')') dp--;
                else if (tk.val === '[') db++;
                else if (tk.val === ']') db--;
                else if (tk.val === '{') dc++;
                else if (tk.val === '}') {
                  if (dc === 0 && dp === 0 && db === 0) break;
                  dc--;
                } else if (tk.val === ';' && dp === 0 && db === 0 && dc === 0) {
                  forEnd = k;
                  break;
                }
              }
              k++;
            }
          }
        }
        // Scan declaration inside `for (...)` header
        let h = nextSig(bodyTokens, openP);
        if (h !== -1 && h < closeP && bodyTokens[h].type === 'ident' && isKnownTypeKeyword(bodyTokens[h].val, records) && !QUALIFIER_KEYWORDS.has(bodyTokens[h].val)) {
          collectDeclVarsFromIdx(bodyTokens, h, closeP, forEnd, records, scopes);
        }
      }
      continue;
    }

    if (parenDepth === 0 && t.type === 'ident' && isKnownTypeKeyword(t.val, records) && !QUALIFIER_KEYWORDS.has(t.val)) {
      const prv = prevSig(bodyTokens, i);
      const pv = prv !== -1 ? bodyTokens[prv].val : '';
      if (prv === -1 || pv === ';' || pv === '{' || pv === '}' || pv === ':') {
        const curBlockEnd = scopeStack[scopeStack.length - 1];
        collectDeclVarsFromIdx(bodyTokens, i, curBlockEnd, curBlockEnd, records, scopes);
      }
    }
  }
  return scopes;
}

function rewriteMemberBody(bodyTokens, className, fieldNames, methodNames, paramsTokens, records, inheritedShadows = null) {
  const scopes = buildShadowScopes(paramsTokens, bodyTokens, records);
  if (inheritedShadows) {
    for (const s of inheritedShadows) scopes.push({ name: s, startIdx: 0, endIdx: bodyTokens.length });
  }
  const isShadowedAt = (name, idx) => scopes.some(sc => idx >= sc.startIdx && idx <= sc.endIdx && sc.name === name);
  const activeShadowsAt = (idx) => new Set(scopes.filter(sc => idx >= sc.startIdx && idx <= sc.endIdx).map(sc => sc.name));

  const out = [];

  for (let i = 0; i < bodyTokens.length; i++) {
    const t = bodyTokens[i];
    if (isTrivia(t)) { out.push(t.val); continue; }

    // Replace `this->` with `__this->`
    if (t.type === 'ident' && t.val === 'this') {
      const nxt = nextSig(bodyTokens, i);
      if (nxt !== -1 && bodyTokens[nxt].val === '->') {
        out.push('__this');
        continue;
      }
      const prv = prevSig(bodyTokens, i);
      if (prv !== -1 && bodyTokens[prv].val === '*') {
        out.push('__this');
        continue;
      }
      out.push('__this');
      continue;
    }

    if (t.type === 'ident' && !isShadowedAt(t.val, i)) {
      const prv = prevSig(bodyTokens, i);
      const prevVal = prv !== -1 ? bodyTokens[prv].val : '';
      const isMemberPostfix = prevVal === '.' || prevVal === '->' || prevVal === '::';
      if (!isMemberPostfix) {
        const nxt = nextSig(bodyTokens, i);
        // Implicit method call e.g. `calculate();` -> `__m_Class_calculate(__this);`
        if (nxt !== -1 && bodyTokens[nxt].val === '(' && methodNames.has(t.val)) {
          const closeP = findMatching(bodyTokens, nxt, '(', ')');
          if (closeP !== -1) {
            const argTokens = bodyTokens.slice(nxt + 1, closeP);
            const hasArgs = argTokens.some(a => !isTrivia(a));
            const innerStr = tokStr(tokenize(rewriteMemberBody(argTokens, className, fieldNames, methodNames, [], records, activeShadowsAt(i))));
            out.push(`__m_${className}_${t.val}(__this${hasArgs ? ', ' + innerStr : ''})`);
            i = closeP;
            continue;
          }
        }
        // Implicit field access -> `__this->field`
        if (fieldNames.has(t.val)) {
          // Do not rewrite declaration type names
          if (prv === -1 || !isKnownTypeKeyword(bodyTokens[prv].val, records)) {
            out.push(`__this->${t.val}`);
            continue;
          }
        }
      }
    }

    out.push(t.val);
  }
  return out.join('');
}

function parseFieldDeclaration(stmtTokens, records) {
  let sig = stmtTokens.filter(t => !isTrivia(t));
  if (sig.length > 0 && sig[sig.length - 1].val === ';') sig = sig.slice(0, -1);
  if (sig.length < 2) return [];

  // Parse leading base type tokens (up to first declarator ident after at least one type token)
  let splitIdx = 0;
  while (splitIdx < sig.length) {
    const tok = sig[splitIdx];
    if (tok.type === 'ident' && (PRIMITIVE_KEYWORDS.has(tok.val) || QUALIFIER_KEYWORDS.has(tok.val))) {
      splitIdx++;
    } else if (splitIdx === 0 && tok.type === 'ident' && (tok.val === 'string' || records[tok.val])) {
      splitIdx++;
    } else if (splitIdx > 0 && QUALIFIER_KEYWORDS.has(tok.val)) {
      splitIdx++;
    } else {
      break;
    }
  }
  if (splitIdx === 0) return [];

  const baseTypeTokens = sig
    .slice(0, splitIdx)
    .filter(t => !QUALIFIER_KEYWORDS.has(t.val))
    .map(t => t.val);

  if (baseTypeTokens.length === 0) return [];

  const rest = sig.slice(splitIdx);
  const decls = splitTopLevelCommas(rest);
  const parsed = [];

  for (const decl of decls) {
    if (decl.length === 0) continue;
    let k = 0;
    let ptrDepth = 0;
    while (k < decl.length && decl[k].val === '*') {
      ptrDepth++;
      k++;
    }
    if (k >= decl.length || decl[k].type !== 'ident') continue;
    const name = decl[k].val;
    k++;
    const dims = [];
    while (k < decl.length && decl[k].val === '[') {
      const closeB = findMatching(decl, k, '[', ']');
      if (closeB === -1) break;
      const dimExpr = tokStr(decl.slice(k + 1, closeB)).trim();
      const dimVal = /^\d+$/.test(dimExpr) ? parseInt(dimExpr, 10) : 1;
      dims.push(dimVal);
      k = closeB + 1;
    }
    let initExpr = null;
    if (k < decl.length && decl[k].val === '=') {
      initExpr = decl.slice(k + 1).map(t => t.val).join(' ').trim();
    }
    parsed.push({ name, baseTypeTokens, ptrDepth, dims, initExpr });
  }
  return parsed;
}

function parseCtorInitList(tokens, className, bases, fieldNames, records, asTargetClass = null) {
  const prepends = [];
  const calledBases = new Set();
  const baseSet = new Set(bases);
  const targetCls = asTargetClass || className;
  for (const item of splitTopLevelCommas(tokens)) {
    const clean = item.filter(t => !isTrivia(t));
    if (clean.length < 3) continue;
    const id = clean[0];
    if (id.type !== 'ident') continue;
    const open = clean[1];
    if (open.val === '(' || open.val === '{') {
      const closeVal = open.val === '(' ? ')' : '}';
      const closeIdx = findMatching(clean, 1, open.val, closeVal);
      if (closeIdx !== -1) {
        const argStr = clean.slice(2, closeIdx).map(t => t.val).join(' ').trim();
        if (baseSet.has(id.val)) {
          calledBases.add(id.val);
          const baseRec = records[id.val];
          if (baseRec && baseRec.rawCtors && baseRec.rawCtors.length > 0) {
            prepends.push(`__ctor_${targetCls}_base_${id.val}(__this${argStr ? ', ' + argStr : ''});`);
          }
        } else if (fieldNames.has(id.val)) {
          prepends.push(`__this->${id.val} = (${argStr});`);
        }
      }
    }
  }
  return { code: prepends.join(' '), calledBases };
}

function splitClassMembers(bodyTokens) {
  const items = [];
  let start = 0;
  let braceDepth = 0;
  let parenDepth = 0;

  for (let i = 0; i < bodyTokens.length; i++) {
    const t = bodyTokens[i];
    if (isTrivia(t)) continue;

    if (t.val === '(') parenDepth++;
    else if (t.val === ')') parenDepth--;
    else if (t.val === '{') braceDepth++;
    else if (t.val === '}') {
      braceDepth--;
      if (braceDepth === 0 && parenDepth === 0) {
        // Check if followed by ';' (optional in inline method definitions)
        const nxt = nextSig(bodyTokens, i);
        const endIdx = (nxt !== -1 && bodyTokens[nxt].val === ';') ? nxt : i;
        items.push(bodyTokens.slice(start, endIdx + 1));
        i = endIdx;
        start = i + 1;
      }
    } else if (braceDepth === 0 && parenDepth === 0) {
      if (t.val === ':' && start <= i) {
        // Access specifier like public: private: protected:
        const prefixSig = bodyTokens.slice(start, i).filter(x => !isTrivia(x));
        if (prefixSig.length === 1 && (prefixSig[0].val === 'public' || prefixSig[0].val === 'private' || prefixSig[0].val === 'protected')) {
          start = i + 1;
          continue;
        }
      }
      if (t.val === ';') {
        items.push(bodyTokens.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  return items;
}

function extractAndTransformRecords(tokens) {
  const records = {};
  const recordOrder = [];
  const out = [];
  let anonCounter = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // Check `typedef struct|union|class [Name] { ... } Alias;` OR bare `struct|union|class Name [: ...] { ... } [decls];`
    let isTypedef = false;
    let kwIdx = -1;

    if (t.type === 'ident' && t.val === 'typedef') {
      const k1 = nextSig(tokens, i);
      if (k1 !== -1 && tokens[k1].type === 'ident' &&
          (tokens[k1].val === 'struct' || tokens[k1].val === 'union' || tokens[k1].val === 'class')) {
        isTypedef = true;
        kwIdx = k1;
      }
    } else if (t.type === 'ident' && (t.val === 'struct' || t.val === 'union' || t.val === 'class')) {
      kwIdx = i;
    }

    if (kwIdx !== -1) {
      const kind = tokens[kwIdx].val;
      const kName = nextSig(tokens, kwIdx);
      if (kName !== -1) {
        let className = null;
        let scanIdx = kName;
        const bases = [];

        if (tokens[kName].type === 'ident') {
          className = tokens[kName].val;
          scanIdx = nextSig(tokens, kName);
        }

        // Parse optional inheritance `:`
        if (scanIdx !== -1 && tokens[scanIdx].val === ':') {
          let k = nextSig(tokens, scanIdx);
          while (k !== -1 && tokens[k].val !== '{' && tokens[k].val !== ';') {
            if (tokens[k].type === 'ident' &&
                tokens[k].val !== 'public' && tokens[k].val !== 'private' && tokens[k].val !== 'protected') {
              bases.push(tokens[k].val);
            }
            k = nextSig(tokens, k);
          }
          scanIdx = k;
        }

        if (scanIdx !== -1 && tokens[scanIdx].val === '{') {
          const openBrace = scanIdx;
          const closeBrace = findMatching(tokens, openBrace, '{', '}');
          if (closeBrace !== -1) {
            // Scan until terminating ';'
            let semiIdx = nextSig(tokens, closeBrace);
            while (semiIdx !== -1 && tokens[semiIdx].val !== ';') {
              semiIdx = nextSig(tokens, semiIdx);
            }
            const afterCloseTokens = semiIdx !== -1 ? tokens.slice(closeBrace + 1, semiIdx) : [];

            let typedefAlias = null;
            if (isTypedef) {
              const sigAfter = afterCloseTokens.filter(x => !isTrivia(x));
              if (sigAfter.length > 0 && sigAfter[sigAfter.length - 1].type === 'ident') {
                typedefAlias = sigAfter[sigAfter.length - 1].val;
              }
            }
            if (!className) {
              className = typedefAlias || `__AnonRecord_${++anonCounter}`;
            }

            // Inherit fields + methods from bases first
            const rec = {
              kind,
              name: className,
              bases: [...bases],
              fields: [],
              ownFields: [],
              rawMethods: [],
              rawCtors: [],
              methods: new Map(), // methodName -> [ { paramsTokens, bodyTokens, retStr } ]
              hasZeroCtor: false,
              typedefAliases: []
            };
            if (typedefAlias && typedefAlias !== className) rec.typedefAliases.push(typedefAlias);

            for (const bName of bases) {
              const baseRec = records[bName];
              if (baseRec) {
                for (const bf of baseRec.fields) rec.fields.push({ ...bf });
                for (const bm of baseRec.rawMethods) rec.rawMethods.push({ ...bm });
                for (const [mName, mList] of baseRec.methods.entries()) {
                  rec.methods.set(mName, [...mList]);
                }
              }
            }

            const bodyTokens = tokens.slice(openBrace + 1, closeBrace);
            const items = splitClassMembers(bodyTokens);

            // Split into fields vs ctors vs methods
            const ownCtors = [];
            const ownMethods = [];
            for (const item of items) {
              const sigItem = item.filter(x => !isTrivia(x));
              if (sigItem.length === 0) continue;

              const hasBrace = sigItem.some(x => x.val === '{');
              const firstParen = item.findIndex(x => x.val === '(');

              if (hasBrace && firstParen !== -1) {
                // Constructor, destructor, or member method
                const closeParen = findMatching(item, firstParen, '(', ')');
                const openBody = item.findIndex((x, idx) => idx > closeParen && x.val === '{');
                const closeBody = openBody !== -1 ? findMatching(item, openBody, '{', '}') : -1;
                if (closeParen !== -1 && openBody !== -1 && closeBody !== -1) {
                  const headTokens = item.slice(0, firstParen).filter(x => !isTrivia(x));
                  const paramsTokens = item.slice(firstParen + 1, closeParen);
                  const betweenTokens = item.slice(closeParen + 1, openBody);
                  const methodBody = item.slice(openBody + 1, closeBody);

                  // Destructor? Skip (~ClassName)
                  if (headTokens.some(x => x.val === '~')) {
                    continue;
                  }

                  // Constructor? (headTokens is [ClassName])
                  if (headTokens.length === 1 && headTokens[0].val === className) {
                    const colonIdx = betweenTokens.findIndex(x => x.val === ':');
                    const initListTokens = colonIdx !== -1 ? betweenTokens.slice(colonIdx + 1) : [];
                    ownCtors.push({ paramsTokens, initListTokens, bodyTokens: methodBody });
                    continue;
                  }

                  // Method: last ident before '(' is methodName, preceding tokens are return type
                  const methodNameTok = headTokens[headTokens.length - 1];
                  if (methodNameTok && methodNameTok.type === 'ident') {
                    const retStr = headTokens.slice(0, -1).map(t => t.val).join(' ').replace(/\s+\*/g, '*') || 'void';
                    ownMethods.push({
                      methodName: methodNameTok.val,
                      retStr,
                      paramsTokens,
                      bodyTokens: methodBody
                    });
                    continue;
                  }
                }
              }

              // Otherwise check if it's a prototype ending with `;` (has `(...)` before `;`)
              if (!hasBrace && firstParen !== -1) {
                // Skip prototype inside class cleanly
                continue;
              }

              // Field declaration(s)
              const parsedFields = parseFieldDeclaration(item, records);
              for (const pf of parsedFields) {
                if (!rec.fields.some(existing => existing.name === pf.name)) {
                  rec.fields.push(pf);
                }
                if (!rec.ownFields.some(existing => existing.name === pf.name)) {
                  rec.ownFields.push(pf);
                }
              }
            }

            records[className] = rec;
            if (typedefAlias && typedefAlias !== className) records[typedefAlias] = rec;
            recordOrder.push(rec);

            const fieldNames = new Set(rec.fields.map(f => f.name));
            const methodNames = new Set();

            // Register inherited methods first, then own methods override matching name if same sig
            for (const om of ownMethods) {
              methodNames.add(om.methodName);
              if (!rec.methods.has(om.methodName)) rec.methods.set(om.methodName, []);
              rec.methods.get(om.methodName).push(om);
            }
            for (const mName of rec.methods.keys()) methodNames.add(mName);

            // Emit C++ functions for inherited (non-overridden) methods + own methods + constructors
            const emittedLines = [];
            const ownFieldInits = rec.ownFields
              .filter(f => f.initExpr != null)
              .map(f => `__this->${f.name} = (${f.initExpr});`)
              .join(' ');

            // Emit inherited methods that belong strictly to Base so Derived gets its own `__m_Derived_...(__this)` wrapper
            const ownMethodKeys = new Set(ownMethods.map(m => m.methodName + '|' + m.paramsTokens.filter(x => !isTrivia(x)).map(x => x.val).join(',')));
            for (const baseMethod of rec.rawMethods) {
              const key = baseMethod.methodName + '|' + baseMethod.paramsTokens.filter(x => !isTrivia(x)).map(x => x.val).join(',');
              if (ownMethodKeys.has(key)) continue;
              const pStr = tokStr(baseMethod.paramsTokens).trim();
              const rewrittenBody = rewriteMemberBody(baseMethod.bodyTokens, className, fieldNames, methodNames, baseMethod.paramsTokens, records);
              emittedLines.push(`${baseMethod.retStr} __m_${className}_${baseMethod.methodName}(${className} *__this${pStr ? ', ' + pStr : ''}) { ${rewrittenBody} }`);
            }

            // Emit own methods and save rawMethods for subclasses
            for (const om of ownMethods) {
              rec.rawMethods.push(om);
              const pStr = tokStr(om.paramsTokens).trim();
              const rewrittenBody = rewriteMemberBody(om.bodyTokens, className, fieldNames, methodNames, om.paramsTokens, records);
              emittedLines.push(`${om.retStr} __m_${className}_${om.methodName}(${className} *__this${pStr ? ', ' + pStr : ''}) { ${rewrittenBody} }`);
            }

            // Emit specialized base-class constructor helpers for `className *__this` (topological post-order)
            const ancVisited = new Set();
            const ancOrder = [];
            const collectAncPostOrder = (baseList) => {
              for (const bName of baseList) {
                if (ancVisited.has(bName)) continue;
                ancVisited.add(bName);
                const bRec = records[bName];
                if (bRec) {
                  collectAncPostOrder(bRec.bases);
                  ancOrder.push(bRec);
                }
              }
            };
            collectAncPostOrder(bases);

            for (const ancRec of ancOrder) {
              const ancFieldNames = new Set(ancRec.fields.map(f => f.name));
              const ancOwnInits = ancRec.ownFields
                .filter(f => f.initExpr != null)
                .map(f => `__this->${f.name} = (${f.initExpr});`)
                .join(' ');
              for (const ancCt of ancRec.rawCtors) {
                const pStr = tokStr(ancCt.paramsTokens).trim();
                const ancInitRes = parseCtorInitList(ancCt.initListTokens, ancRec.name, ancRec.bases, ancFieldNames, records, className);
                let ancAutoBase = '';
                for (const gbName of ancRec.bases) {
                  const gbRec = records[gbName];
                  if (gbRec && gbRec.hasZeroCtor && !ancInitRes.calledBases.has(gbName)) {
                    ancAutoBase += `__ctor_${className}_base_${gbName}(__this); `;
                  }
                }
                const rewrittenAncBody = rewriteMemberBody(ancCt.bodyTokens, className, ancFieldNames, methodNames, ancCt.paramsTokens, records);
                emittedLines.push(`void __ctor_${className}_base_${ancRec.name}(${className} *__this${pStr ? ', ' + pStr : ''}) { ${ancAutoBase}${ancOwnInits} ${ancInitRes.code} ${rewrittenAncBody} }`);
              }
            }

            // Emit constructors
            for (const ct of ownCtors) {
              rec.rawCtors.push(ct);
              const sigP = ct.paramsTokens.filter(x => !isTrivia(x));
              const isZero = sigP.length === 0 || (sigP.length === 1 && sigP[0].val === 'void');
              if (isZero) rec.hasZeroCtor = true;
              const pStr = tokStr(ct.paramsTokens).trim();
              const initListRes = parseCtorInitList(ct.initListTokens, className, bases, fieldNames, records);
              // Call base default ctor automatically if Base has zero-arg ctor and wasn't explicitly initialized
              let autoBaseCtor = '';
              for (const bName of bases) {
                const baseRec = records[bName];
                if (baseRec && baseRec.hasZeroCtor && !initListRes.calledBases.has(bName)) {
                  autoBaseCtor += `__ctor_${className}_base_${bName}(__this); `;
                }
              }
              const rewrittenBody = rewriteMemberBody(ct.bodyTokens, className, fieldNames, methodNames, ct.paramsTokens, records);
              emittedLines.push(`void __ctor_${className}(${className} *__this${pStr ? ', ' + pStr : ''}) { ${autoBaseCtor}${ownFieldInits} ${initListRes.code} ${rewrittenBody} }`);
            }

            // Synthesize 0-arg constructor if field initializers exist or base has zero-arg ctor
            const needsSynthZero = !rec.hasZeroCtor && ownCtors.length === 0 && (ownFieldInits.length > 0 || bases.some(b => records[b]?.hasZeroCtor));
            if (needsSynthZero) {
              rec.hasZeroCtor = true;
              rec.rawCtors.push({ paramsTokens: [], initListTokens: [], bodyTokens: [] });
              let autoBaseCtor = '';
              for (const bName of bases) {
                if (records[bName]?.hasZeroCtor) autoBaseCtor += `__ctor_${className}_base_${bName}(__this); `;
              }
              emittedLines.push(`void __ctor_${className}(${className} *__this) { ${autoBaseCtor}${ownFieldInits} }`);
            }

            // If inline instances followed `struct S { ... } s1, s2;` (and NOT typedef)
            if (!isTypedef && afterCloseTokens.some(x => !isTrivia(x))) {
              emittedLines.push(`${className} ${tokStr(afterCloseTokens).trim()};`);
            }

            out.push(emittedLines.join('\n'));
            i = semiIdx !== -1 ? semiIdx : closeBrace;
            continue;
          }
        }
      }
    }

    out.push(t.val);
  }

  return {
    code: out.join(''),
    records,
    recordOrder
  };
}

// ---------- Stage C: Constructor Invocations, Struct Aggregate Inits, Member Method Calls ----------

function isTypeStartAt(tokens, i, records) {
  const t = tokens[i];
  if (!t || t.type !== 'ident') return false;
  if (PRIMITIVE_KEYWORDS.has(t.val) || QUALIFIER_KEYWORDS.has(t.val)) return true;
  if (t.val === 'string') return true;
  if (records[t.val]) {
    // Exclude constructors / casts inside expressions by checking previous significant token
    const prv = prevSig(tokens, i);
    const pv = prv !== -1 ? tokens[prv].val : '';
    return prv === -1 || pv === ';' || pv === '{' || pv === '}' || pv === ':' || pv === '(' || pv === ',';
  }
  return false;
}

function collectDeclTypeAndEnd(tokens, i, records) {
  let k = i;
  const typeParts = [];
  while (k < tokens.length) {
    const tk = tokens[k];
    if (isTrivia(tk)) { k++; continue; }
    if (tk.type === 'ident' && (PRIMITIVE_KEYWORDS.has(tk.val) || QUALIFIER_KEYWORDS.has(tk.val) || tk.val === 'string' || (typeParts.length === 0 && records[tk.val]))) {
      if (!QUALIFIER_KEYWORDS.has(tk.val)) typeParts.push(tk.val);
      k++;
    } else break;
  }
  return { baseType: typeParts.join(' '), nextIdx: k };
}

function findReceiverSlice(tokens, dotIdx) {
  // Returns { startIdx, rootIdent, deref } for expr right before '.' or '->'
  const endSig = prevSig(tokens, dotIdx);
  if (endSig === -1) return null;

  let k = endSig;
  if (tokens[k].val === ']') {
    // e.g. arr[i]
    let d = 0;
    while (k >= 0) {
      if (tokens[k].val === ']') d++;
      else if (tokens[k].val === '[') { d--; if (d === 0) break; }
      k--;
    }
    const idIdx = prevSig(tokens, k);
    if (idIdx >= 0 && tokens[idIdx].type === 'ident') {
      return { startIdx: idIdx, rootIdent: tokens[idIdx].val, deref: true };
    }
  } else if (tokens[k].val === ')') {
    let d = 0;
    while (k >= 0) {
      if (tokens[k].val === ')') d++;
      else if (tokens[k].val === '(') { d--; if (d === 0) break; }
      k--;
    }
    // Find identifier inside (*ptr)
    const inner = tokens.slice(k + 1, endSig).filter(x => !isTrivia(x));
    if (inner.length === 2 && inner[0].val === '*' && inner[1].type === 'ident') {
      return { startIdx: k, rootIdent: inner[1].val, deref: true };
    }
    if (inner.length === 1 && inner[0].type === 'ident') {
      return { startIdx: k, rootIdent: inner[0].val, deref: false };
    }
    return null;
  } else if (tokens[k].type === 'ident') {
    return { startIdx: k, rootIdent: tokens[k].val, deref: false };
  }
  return null;
}

function transformObjectsAndMethods(code, records) {
  let tokens = tokenize(code);
  const scopeStack = [new Map()]; // varName -> typeName

  const lookupVarType = (name) => {
    for (let s = scopeStack.length - 1; s >= 0; s--) {
      if (scopeStack[s].has(name)) return scopeStack[s].get(name);
    }
    return null;
  };

  // First strip standalone C-style `struct`/`union`/`class` prefix before known record identifiers
  const stripped = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ident' && (t.val === 'struct' || t.val === 'union' || t.val === 'class')) {
      const nxt = nextSig(tokens, i);
      if (nxt !== -1 && tokens[nxt].type === 'ident' && records[tokens[nxt].val]) {
        continue;
      }
    }
    stripped.push(t.val);
  }
  tokens = tokenize(stripped.join(''));

  const out = [];
  const tokOutPos = new Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    tokOutPos[i] = out.length;
    const t = tokens[i];

    if (t.type === 'punct' && t.val === '{') {
      scopeStack.push(new Map());
      out.push(t.val);
      continue;
    }
    if (t.type === 'punct' && t.val === '}') {
      if (scopeStack.length > 1) scopeStack.pop();
      out.push(t.val);
      continue;
    }

    // Track `string` declarations + rewrite `string s("lit");` -> `string s = "lit";`
    if (t.type === 'ident' && t.val === 'string') {
      const prv = prevSig(tokens, i);
      const pv = prv !== -1 ? tokens[prv].val : '';
      if (prv === -1 || pv === ';' || pv === '{' || pv === '}' || pv === ':' || pv === '(' || pv === ',') {
        const k1 = nextSig(tokens, i);
        if (k1 !== -1 && tokens[k1].type === 'ident') {
          const k2 = nextSig(tokens, k1);
          // Check if direct constructor: `string s(arg);`
          if (k2 !== -1 && tokens[k2].val === '(') {
            const closeP = findMatching(tokens, k2, '(', ')');
            const afterP = closeP !== -1 ? nextSig(tokens, closeP) : -1;
            if (afterP !== -1 && (tokens[afterP].val === ';' || tokens[afterP].val === ',')) {
              const argTokens = tokens.slice(k2 + 1, closeP);
              const inner = argTokens.some(a => !isTrivia(a)) ? tokStr(argTokens).trim() : '""';
              scopeStack[scopeStack.length - 1].set(tokens[k1].val, 'string');
              out.push(`string ${tokens[k1].val} = ${inner}`);
              i = closeP;
              continue;
            }
          }
        }
      }
    }

    // Track user-class/struct/union declarations & constructor calls & aggregate initializers
    if (t.type === 'ident' && records[t.val]) {
      const className = t.val;
      const rec = records[className];
      const prv = prevSig(tokens, i);
      const pv = prv !== -1 ? tokens[prv].val : '';
      const isCastOrDecl = prv === -1 || pv === ';' || pv === '{' || pv === '}' || pv === ':';
      const nxt = nextSig(tokens, i);

      if (isCastOrDecl && nxt !== -1) {
        // Check function definition or prototype returning ClassName: `ClassName fn(...) {` or `;`
        // Find terminating `;` or `{` at depth 0
        let semi = -1;
        let p = 0, c = 0;
        let hasParenFn = false;
        let scan = i + 1;
        while (scan < tokens.length) {
          const st = tokens[scan];
          if (isTrivia(st)) { scan++; continue; }
          if (st.val === '(') p++;
          else if (st.val === ')') p--;
          else if (st.val === '{') {
            if (p === 0 && c === 0) {
              // Could be function body or brace init `= { ... }`
              const pPrev = prevSig(tokens, scan);
              if (pPrev !== -1 && tokens[pPrev].val === ')') {
                hasParenFn = true;
                break;
              }
            }
            c++;
          } else if (st.val === '}') c--;
          else if (st.val === ';' && p === 0 && c === 0) {
            semi = scan;
            break;
          }
          scan++;
        }

        if (!hasParenFn && semi !== -1) {
          const declTokens = tokens.slice(i + 1, semi);
          // Distinguish prototype `ClassName foo(int a);` from object construction
          const sigDecl = declTokens.filter(x => !isTrivia(x));
          let isProto = false;
          if (sigDecl.length >= 4 && sigDecl[0].type === 'ident' && sigDecl[1].val === '(') {
            const cP = findMatching(sigDecl, 1, '(', ')');
            if (cP !== -1) {
              const pArgs = sigDecl.slice(2, cP);
              if (pArgs.some(a => a.type === 'ident' && (PRIMITIVE_KEYWORDS.has(a.val) || QUALIFIER_KEYWORDS.has(a.val) || a.val === 'string' || records[a.val]))) {
                isProto = true;
              }
            }
          }

          if (!isProto) {
            const parts = splitTopLevelCommas(declTokens);
            const emittedStmts = [];
            let handled = true;

            for (const part of parts) {
              const clean = part.filter(x => !isTrivia(x));
              if (clean.length === 0) continue;

              let k = 0;
              let ptrDepth = 0;
              while (k < clean.length && clean[k].val === '*') { ptrDepth++; k++; }
              if (k >= clean.length || clean[k].type !== 'ident') { handled = false; break; }
              const vName = clean[k].val;
              scopeStack[scopeStack.length - 1].set(vName, className);

              // Skip pointers / arrays without special ctors (record variable type cleanly!)
              const afterName = clean.slice(k + 1);
              if (ptrDepth > 0 || (afterName.length > 0 && afterName[0].val === '[')) {
                emittedStmts.push(`${className} ${clean.map(x => x.val).join(' ')};`);
                continue;
              }

              // Constructor args: `var(arg1, arg2)`
              if (afterName.length >= 2 && afterName[0].val === '(') {
                const closeP = findMatching(afterName, 0, '(', ')');
                if (closeP !== -1) {
                  const argsRaw = afterName.slice(1, closeP);
                  const argStr = tokStr(argsRaw).trim();
                  emittedStmts.push(`${className} ${vName}; __ctor_${className}(&${vName}${argStr ? ', ' + argStr : ''});`);
                  continue;
                }
              }

              // Aggregate brace initializer: `Point p = {10, 20};`
              if (afterName.length >= 3 && afterName[0].val === '=' && afterName[1].val === '{') {
                const closeB = findMatching(afterName, 1, '{', '}');
                if (closeB !== -1) {
                  const inits = splitTopLevelCommas(afterName.slice(2, closeB));
                  const assignLines = [`${className} ${vName};`];
                  inits.forEach((initToks, fIdx) => {
                    const f = rec.fields[fIdx];
                    if (!f) return;
                    const expr = initToks.map(x => x.val).join(' ').trim();
                    if (f.dims.length > 0 && f.baseTypeTokens.join(' ') === 'char') {
                      assignLines.push(`{ const char *__s = ${expr}; int __i = 0; while (__s[__i] != '\\0' && __i < ${f.dims[0] - 1}) { ${vName}.${f.name}[__i] = __s[__i]; __i++; } ${vName}.${f.name}[__i] = '\\0'; }`);
                    } else {
                      assignLines.push(`${vName}.${f.name} = ${expr};`);
                    }
                  });
                  emittedStmts.push(assignLines.join(' '));
                  continue;
                }
              }

              // Plain default declaration: `Student s1;` or copy init `Student s2 = s1;`
              if (afterName.length === 0 && rec.hasZeroCtor && scopeStack.length > 1) {
                emittedStmts.push(`${className} ${vName}; __ctor_${className}(&${vName});`);
              } else {
                emittedStmts.push(`${className} ${clean.map(x => x.val).join(' ')};`);
              }
            }

            if (handled && emittedStmts.length > 0) {
              out.push(emittedStmts.join(' '));
              i = semi;
              continue;
            }
          }
        }
      }
    }

    // Track pointer/parameter types inside `( ... )` parameter lists so `ptr->display()` knows ptr's class
    if (t.type === 'ident' && records[t.val]) {
      const k1 = nextSig(tokens, i);
      if (k1 !== -1) {
        let kk = k1;
        while (kk < tokens.length && (isTrivia(tokens[kk]) || tokens[kk].val === '*' || tokens[kk].val === '&')) kk++;
        if (kk < tokens.length && tokens[kk].type === 'ident') {
          scopeStack[scopeStack.length - 1].set(tokens[kk].val, t.val);
        }
      }
    }

    // Member method calls: `obj.method(args)` or `ptr->method(args)`
    if ((t.val === '.' || t.val === '->') && out.length > 0) {
      const mIdx = nextSig(tokens, i);
      const pIdx = mIdx !== -1 ? nextSig(tokens, mIdx) : -1;
      if (mIdx !== -1 && tokens[mIdx].type === 'ident' && pIdx !== -1 && tokens[pIdx].val === '(') {
        const methodName = tokens[mIdx].val;
        const recv = findReceiverSlice(tokens, i);
        const closeP = findMatching(tokens, pIdx, '(', ')');
        if (recv && closeP !== -1) {
          let clsName = lookupVarType(recv.rootIdent);
          // Fallback: if unique method name across records
          if (!clsName) {
            const matches = Object.values(records).filter(r => r.methods.has(methodName));
            if (matches.length === 1) clsName = matches[0].name;
          }
          if (clsName && records[clsName] && records[clsName].methods.has(methodName)) {
            // Rewind output slice cleanly back to where the receiver expression began
            out.length = tokOutPos[recv.startIdx];

            const recvText = tokStr(tokens.slice(recv.startIdx, i)).trim();
            const rawArgs = tokens.slice(pIdx + 1, closeP);
            const transformedArgs = transformObjectsAndMethods(tokStr(rawArgs), records).trim();
            const simpleIdentRecv = /^[A-Za-z_]\w*(?:\[[^\]]+\])?$/.test(recvText);
            const ptrExpr = t.val === '->' ? recvText : (simpleIdentRecv ? `&${recvText}` : `&(${recvText})`);
            out.push(`__m_${clsName}_${methodName}(${ptrExpr}${transformedArgs ? ', ' + transformedArgs : ''})`);
            i = closeP;
            continue;
          }
        }
      }
    }

    out.push(t.val);
  }

  return out.join('');
}

// ---------- Stage D: Reference Parameters (&) and Local References ----------

function findParamBaseTypes(paramSigTokens, records) {
  // Check if tokens represent a declaration ending with optional `&` + `ident`
  const ampIdx = paramSigTokens.findIndex(t => t.val === '&');
  if (ampIdx <= 0) return -1;
  const beforeAmp = paramSigTokens.slice(0, ampIdx);
  // All tokens before `&` must be qualifiers, type keywords, known record names, or `*`
  const ok = beforeAmp.every(t =>
    t.val === '*' ||
    (t.type === 'ident' && (PRIMITIVE_KEYWORDS.has(t.val) || QUALIFIER_KEYWORDS.has(t.val) || t.val === 'string' || Boolean(records[t.val])))
  );
  if (!ok) return -1;
  if (ampIdx + 1 >= paramSigTokens.length || paramSigTokens[ampIdx + 1].type !== 'ident') return -1;
  return ampIdx;
}

function rewriteRefUsesInSlice(sliceTokens, refNamesSet, stopAtShadow = true) {
  // Rewrites occurrences of ref variables `x` -> `(*__ref_x)` and `&x` -> `__ref_x`
  const out = [];
  for (let i = 0; i < sliceTokens.length; i++) {
    const t = sliceTokens[i];
    if (isTrivia(t)) { out.push(t.val); continue; }

    // Replace unary `&x` or `&(x)` -> `__ref_x`
    if (t.val === '&') {
      const prv = prevSig(sliceTokens, i);
      const pv = prv !== -1 ? sliceTokens[prv].val : '';
      const pt = prv !== -1 ? sliceTokens[prv].type : '';
      const isUnaryCtx = prv === -1 || (pt !== 'ident' && pt !== 'num' && pv !== ')' && pv !== ']');
      if (isUnaryCtx) {
        const nxt = nextSig(sliceTokens, i);
        if (nxt !== -1 && sliceTokens[nxt].type === 'ident' && refNamesSet.has(sliceTokens[nxt].val)) {
          out.push(`__ref_${sliceTokens[nxt].val}`);
          i = nxt;
          continue;
        }
        if (nxt !== -1 && sliceTokens[nxt].val === '(') {
          const closeP = findMatching(sliceTokens, nxt, '(', ')');
          const inner = closeP !== -1 ? sliceTokens.slice(nxt + 1, closeP).filter(x => !isTrivia(x)) : [];
          if (inner.length === 1 && inner[0].type === 'ident' && refNamesSet.has(inner[0].val)) {
            out.push(`__ref_${inner[0].val}`);
            i = closeP;
            continue;
          }
        }
      }
    }

    if (t.type === 'ident' && refNamesSet.has(t.val)) {
      const prv = prevSig(sliceTokens, i);
      const pv = prv !== -1 ? sliceTokens[prv].val : '';
      if (pv !== '.' && pv !== '->' && pv !== '::') {
        out.push(`(*__ref_${t.val})`);
        continue;
      }
    }

    out.push(t.val);
  }
  return out.join('');
}

function transformReferences(code, records) {
  let tokens = tokenize(code);
  // Map of funcName -> Map(arity -> Set of 0-based ref param indices)
  const refFuncs = new Map();

  // Pass 1: Identify & rewrite reference parameters on all function definitions & prototypes
  const out1 = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ident') {
      const pOpen = nextSig(tokens, i);
      if (pOpen !== -1 && tokens[pOpen].val === '(') {
        const prv = prevSig(tokens, i);
        const isFuncSig = prv !== -1 && (
          tokens[prv].val === '*' ||
          (tokens[prv].type === 'ident' && !CONTROL_KEYWORDS.has(tokens[prv].val) &&
           (PRIMITIVE_KEYWORDS.has(tokens[prv].val) || tokens[prv].val === 'string' || Boolean(records[tokens[prv].val])))
        );
        if (isFuncSig && !CONTROL_KEYWORDS.has(t.val)) {
          const pClose = findMatching(tokens, pOpen, '(', ')');
          const afterClose = pClose !== -1 ? nextSig(tokens, pClose) : -1;
          if (pClose !== -1 && afterClose !== -1 && (tokens[afterClose].val === '{' || tokens[afterClose].val === ';')) {
            const paramTokens = tokens.slice(pOpen + 1, pClose);
            const paramGroups = splitTopLevelCommas(paramTokens);
            const refIndices = new Set();
            const refNames = new Set();
            const newParams = [];

            paramGroups.forEach((pg, pIdx) => {
              const sigPg = pg.filter(x => !isTrivia(x));
              const ampPos = findParamBaseTypes(sigPg, records);
              if (ampPos !== -1) {
                refIndices.add(pIdx);
                const pNameTok = sigPg[ampPos + 1];
                refNames.add(pNameTok.val);
                // Strip leading 'const' on ref parameter so non-const args & mutations work cleanly
                const typePart = sigPg.slice(0, ampPos).filter(x => x.val !== 'const').map(x => x.val).join(' ');
                const tailPart = sigPg.slice(ampPos + 2).map(x => x.val).join(' ');
                newParams.push(`${typePart} *__ref_${pNameTok.val}${tailPart ? ' ' + tailPart : ''}`);
              } else {
                newParams.push(tokStr(pg).trim());
              }
            });

            if (refIndices.size > 0) {
              if (!refFuncs.has(t.val)) refFuncs.set(t.val, new Map());
              refFuncs.get(t.val).set(paramGroups.length, refIndices);

              out1.push(t.val);
              out1.push('(' + newParams.join(', ') + ')');

              if (tokens[afterClose].val === '{') {
                const bodyClose = findMatching(tokens, afterClose, '{', '}');
                if (bodyClose !== -1) {
                  const bodySlice = tokens.slice(afterClose, bodyClose + 1);
                  out1.push(rewriteRefUsesInSlice(bodySlice, refNames));
                  i = bodyClose;
                  continue;
                }
              } else {
                out1.push(';');
                i = afterClose;
                continue;
              }
            }
          }
        }
      }
    }
    out1.push(t.val);
  }

  // Pass 2: Local reference aliases (`int &r = x;`) inside blocks & function bodies
  tokens = tokenize(out1.join(''));
  const out2 = [];
  const blockRefStack = [new Set()];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'punct' && t.val === '{') {
      blockRefStack.push(new Set(blockRefStack[blockRefStack.length - 1]));
      out2.push(t.val);
      continue;
    }
    if (t.type === 'punct' && t.val === '}') {
      if (blockRefStack.length > 1) blockRefStack.pop();
      out2.push(t.val);
      continue;
    }

    // Detect local `Type &alias = initExpr;`
    const curRefs = blockRefStack[blockRefStack.length - 1];
    if (t.type === 'ident' && isKnownTypeKeyword(t.val, records)) {
      const prv = prevSig(tokens, i);
      const pv = prv !== -1 ? tokens[prv].val : '';
      if (prv === -1 || pv === ';' || pv === '{' || pv === '}' || pv === ':') {
        let semi = nextSig(tokens, i);
        let depthP = 0, depthB = 0;
        while (semi >= 0 && semi < tokens.length) {
          const ts = tokens[semi];
          if (ts.val === '(') depthP++;
          else if (ts.val === ')') depthP--;
          else if (ts.val === '{') {
            if (depthP === 0 && depthB === 0) {
              const prevS = prevSig(tokens, semi);
              if (prevS !== -1 && tokens[prevS].val === ')') { semi = -1; break; }
            }
            depthB++;
          } else if (ts.val === '}') {
            if (depthB === 0) { semi = -1; break; }
            depthB--;
            if (depthB === 0 && depthP === 0) { semi = -1; break; }
          } else if (ts.val === ';' && depthP === 0 && depthB === 0) {
            break;
          }
          semi++;
        }
        if (semi >= 0 && semi < tokens.length && tokens[semi].val === ';') {
          const stmt = tokens.slice(i, semi).filter(x => !isTrivia(x));
          const ampIdx = stmt.findIndex(x => x.val === '&');
          if (ampIdx > 0 && ampIdx + 2 < stmt.length && stmt[ampIdx + 1].type === 'ident' && stmt[ampIdx + 2].val === '=') {
            const typeBefore = stmt.slice(0, ampIdx);
            const allTypes = typeBefore.every(x =>
              x.val === '*' || (x.type === 'ident' && isKnownTypeKeyword(x.val, records))
            );
            if (allTypes) {
              const aliasName = stmt[ampIdx + 1].val;
              const typeStr = typeBefore.filter(x => x.val !== 'const').map(x => x.val).join(' ');
              const initRaw = stmt.slice(ampIdx + 3);
              const initRewritten = rewriteRefUsesInSlice(initRaw, curRefs);
              curRefs.add(aliasName);
              out2.push(`${typeStr} *__ref_${aliasName} = &(${initRewritten.trim()});`);
              i = semi;
              continue;
            }
          }
        }
      }
    }

    // Rewrite current block ref usages
    if (t.val === '&') {
      const nxt = nextSig(tokens, i);
      if (nxt !== -1 && tokens[nxt].type === 'ident' && curRefs.has(tokens[nxt].val)) {
        const prv = prevSig(tokens, i);
        const pv = prv !== -1 ? tokens[prv].val : '';
        const pt = prv !== -1 ? tokens[prv].type : '';
        if (prv === -1 || (pt !== 'ident' && pt !== 'num' && pv !== ')' && pv !== ']')) {
          out2.push(`__ref_${tokens[nxt].val}`);
          i = nxt;
          continue;
        }
      }
    }
    if (t.type === 'ident' && curRefs.has(t.val)) {
      const prv = prevSig(tokens, i);
      const pv = prv !== -1 ? tokens[prv].val : '';
      if (pv !== '.' && pv !== '->' && pv !== '::') {
        out2.push(`(*__ref_${t.val})`);
        continue;
      }
    }

    out2.push(t.val);
  }

  // Pass 3: Rewrite call sites `funcName(a, b)` -> `funcName(&a, &b)` for reference params
  if (refFuncs.size === 0) return out2.join('');

  tokens = tokenize(out2.join(''));
  const out3 = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'ident' && refFuncs.has(t.val)) {
      const prv = prevSig(tokens, i);
      const pv = prv !== -1 ? tokens[prv].val : '';
      const isDeclSig = prv !== -1 && (tokens[prv].val === '*' || (tokens[prv].type === 'ident' && isKnownTypeKeyword(pv, records)));
      const pOpen = nextSig(tokens, i);
      if (!isDeclSig && pOpen !== -1 && tokens[pOpen].val === '(') {
        const pClose = findMatching(tokens, pOpen, '(', ')');
        if (pClose !== -1) {
          const argGroups = splitTopLevelCommas(tokens.slice(pOpen + 1, pClose));
          const arityMap = refFuncs.get(t.val);
          const refSet = arityMap.get(argGroups.length) || [...arityMap.values()][0];
          if (refSet) {
            const wrappedArgs = argGroups.map((ag, idx) => {
              // Recursively transform nested calls inside arguments
              const agStr = transformCallSitesOnly(tokStr(ag), refFuncs, records).trim();
              if (!refSet.has(idx)) return agStr;
              // Collapse `(*__ref_x)` -> `__ref_x` cleanly
              const mRef = agStr.match(/^\(\*(__ref_\w+)\)$/);
              if (mRef) return mRef[1];
              return `&(${agStr})`;
            });
            out3.push(`${t.val}(${wrappedArgs.join(', ')})`);
            i = pClose;
            continue;
          }
        }
      }
    }
    out3.push(t.val);
  }

  return out3.join('');
}

function transformCallSitesOnly(code, refFuncs, records) {
  if (!refFuncs.size) return code;
  const tokens = tokenize(code);
  const out = [];
  const tokOutPos = new Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    tokOutPos[i] = out.length;
    const t = tokens[i];
    if (t.type === 'ident' && refFuncs.has(t.val)) {
      const pOpen = nextSig(tokens, i);
      if (pOpen !== -1 && tokens[pOpen].val === '(') {
        const pClose = findMatching(tokens, pOpen, '(', ')');
        if (pClose !== -1) {
          const argGroups = splitTopLevelCommas(tokens.slice(pOpen + 1, pClose));
          const arityMap = refFuncs.get(t.val);
          const refSet = arityMap.get(argGroups.length) || [...arityMap.values()][0];
          if (refSet) {
            const wrapped = argGroups.map((ag, idx) => {
              const s = transformCallSitesOnly(tokStr(ag), refFuncs, records).trim();
              if (!refSet.has(idx)) return s;
              const mRef = s.match(/^\(\*(__ref_\w+)\)$/);
              return mRef ? mRef[1] : `&(${s})`;
            });
            out.push(`${t.val}(${wrapped.join(', ')})`);
            i = pClose;
            continue;
          }
        }
      }
    }
    out.push(t.val);
  }
  return out.join('');
}

// ---------- JSCPP Dynamic Type Registrar for Struct / Union / Class ----------

function resolveFieldJscppType(rt, field) {
  let t;
  const baseStr = field.baseTypeTokens.join(' ');
  if (baseStr === 'string' || baseStr in rt.typedefs || rt.isPrimitiveType(baseStr)) {
    t = rt.simpleType(baseStr);
  } else {
    t = { type: 'class', name: baseStr };
  }
  for (let p = 0; p < field.ptrDepth; p++) {
    t = rt.normalPointerType(t);
  }
  if (field.dims.length > 0) {
    for (let d = field.dims.length - 1; d >= 0; d--) {
      t = rt.arrayPointerType(t, field.dims[d]);
    }
  }
  return t;
}

function sizeOfFieldBytes(rt, field) {
  if (field.ptrDepth > 0) return rt.config.limits.pointer.bytes;
  const baseStr = field.baseTypeTokens.join(' ');
  let elemBytes = 4;
  if (rt.isPrimitiveType(baseStr) && rt.config.limits[baseStr]) {
    elemBytes = rt.config.limits[baseStr].bytes;
  } else if (baseStr === 'string') {
    elemBytes = 32;
  } else {
    try {
      elemBytes = rt.getSizeByType({ type: 'class', name: baseStr });
    } catch (_) {
      elemBytes = 4;
    }
  }
  let count = 1;
  for (const dim of field.dims) count *= Math.max(1, dim);
  return elemBytes * count;
}

function buildUnionMemberAccessor(rt, view, u8, ftype, field) {
  const baseStr = field.baseTypeTokens.join(' ');

  if (field.dims.length > 0 && field.ptrDepth === 0 && rt.isPrimitiveType(baseStr)) {
    const dim0 = Math.max(1, field.dims[0]);
    const elemSz = rt.config.limits[baseStr]?.bytes || 1;
    const arr = [];
    for (let i = 0; i < dim0; i++) {
      const elem = { t: rt.primitiveType(baseStr), left: true };
      const byteOff = i * elemSz;
      Object.defineProperty(elem, 'v', {
        enumerable: true,
        get() { return u8[byteOff]; },
        set(val) { u8[byteOff] = val & 0xff; }
      });
      arr.push(elem);
    }
    return { t: ftype, v: rt.makeArrayPointerValue(arr, 0), left: true };
  }

  const mem = { t: ftype, left: true };
  Object.defineProperty(mem, 'v', {
    enumerable: true,
    get() {
      if (baseStr === 'float') return view.getFloat32(0, true);
      if (baseStr === 'double') return view.getFloat64(0, true);
      if (baseStr === 'char' || baseStr === 'signed char') return view.getInt8(0);
      if (baseStr === 'unsigned char' || baseStr === 'bool') return view.getUint8(0);
      if (baseStr === 'short' || baseStr === 'short int' || baseStr === 'signed short') return view.getInt16(0, true);
      if (baseStr === 'unsigned short' || baseStr === 'unsigned short int') return view.getUint16(0, true);
      if (baseStr.startsWith('unsigned')) return view.getUint32(0, true);
      return view.getInt32(0, true);
    },
    set(val) {
      const n = Number(val) || 0;
      if (baseStr === 'float') view.setFloat32(0, n, true);
      else if (baseStr === 'double') view.setFloat64(0, n, true);
      else if (baseStr === 'char' || baseStr === 'signed char') view.setInt8(0, n);
      else if (baseStr === 'unsigned char' || baseStr === 'bool') view.setUint8(0, n ? 1 : 0);
      else if (baseStr === 'short' || baseStr === 'short int' || baseStr === 'signed short') view.setInt16(0, n, true);
      else if (baseStr === 'unsigned short' || baseStr === 'unsigned short int') view.setUint16(0, n, true);
      else if (baseStr.startsWith('unsigned')) view.setUint32(0, n >>> 0, true);
      else view.setInt32(0, n | 0, true);
    }
  });
  return mem;
}

function registerRecordsInRuntime(rt, recordOrder) {
  if (!recordOrder || recordOrder.length === 0) return;

  // Step 1: Pre-register all class/struct/union type slots so forward/self pointers & nested structs resolve
  const clsTypes = new Map();
  for (const rec of recordOrder) {
    const clsType = rt.newClass(rec.name, []);
    clsTypes.set(rec.name, clsType);
    for (const alias of rec.typedefAliases) {
      rt.registerTypedef(clsType, alias);
    }
  }

  // Step 2: Populate full constructors, sizeBytes, o(&), o(=), cClone
  for (const rec of recordOrder) {
    const clsType = clsTypes.get(rec.name);
    const sig = rt.getTypeSignature(clsType);
    const def = rt.types[sig];

    if (rec.kind === 'union') {
      let maxBytes = 4;
      for (const f of rec.fields) {
        maxBytes = Math.max(maxBytes, sizeOfFieldBytes(rt, f));
      }
      def.sizeBytes = maxBytes;

      def.cConstructor = function (_rt, _this) {
        const buf = new ArrayBuffer(maxBytes);
        const view = new DataView(buf);
        const u8 = new Uint8Array(buf);
        _this.v._unionBuf = buf;
        _this.v.members = {};
        for (const f of rec.fields) {
          const ft = resolveFieldJscppType(_rt, f);
          _this.v.members[f.name] = buildUnionMemberAccessor(_rt, view, u8, ft, f);
        }
      };

      def.cClone = function (_rt, v) {
        const cloned = { t: clsType, v: { members: {} }, left: false };
        def.cConstructor(_rt, cloned);
        if (v.v && v.v._unionBuf) {
          new Uint8Array(cloned.v._unionBuf).set(new Uint8Array(v.v._unionBuf));
        }
        return cloned;
      };

      def.handlers['o(=)'] = {
        default(_rt, l, r) {
          if (!l.left) _rt.raiseException(_rt.makeValString(l) + ' is not a left value');
          if (l.v && r.v && l.v._unionBuf && r.v._unionBuf) {
            new Uint8Array(l.v._unionBuf).set(new Uint8Array(r.v._unionBuf));
          }
          return l;
        }
      };
    } else {
      let totalBytes = 0;
      for (const f of rec.fields) {
        totalBytes += sizeOfFieldBytes(rt, f);
      }
      def.sizeBytes = Math.max(1, totalBytes);

      def.cConstructor = function (_rt, _this) {
        _this.v.members = {};
        for (const f of rec.fields) {
          const ft = resolveFieldJscppType(_rt, f);
          const m = _rt.defaultValue(ft, true);
          m.left = true;
          _this.v.members[f.name] = m;
        }
      };

      def.cClone = function (_rt, v) {
        const clonedMembers = {};
        for (const f of rec.fields) {
          const orig = v.v && v.v.members ? v.v.members[f.name] : null;
          if (orig) {
            const cp = _rt.clone(orig, true);
            cp.left = true;
            clonedMembers[f.name] = cp;
          } else {
            const ft = resolveFieldJscppType(_rt, f);
            clonedMembers[f.name] = _rt.defaultValue(ft, true);
          }
        }
        return { t: clsType, v: { members: clonedMembers }, left: false };
      };

      def.handlers['o(=)'] = {
        default(_rt, l, r) {
          if (!l.left) _rt.raiseException(_rt.makeValString(l) + ' is not a left value');
          const cloned = def.cClone(_rt, r);
          l.v.members = cloned.v.members;
          return l;
        }
      };
    }

    def.handlers['o(&)'] = {
      default(_rt, l) {
        if ('array' in l) {
          return _rt.val(_rt.arrayPointerType(l.t, l.array.length), _rt.makeArrayPointerValue(l.array, l.arrayIndex));
        }
        return _rt.val(_rt.normalPointerType(l.t), _rt.makeNormalPointerValue(l));
      }
    };
  }
}

// ---------- Pipeline Orchestrator & Error Formatter ----------

function prepareCppProgram(rawCode) {
  const initialTokens = tokenize(rawCode);
  const syntaxErrors = validateCppCode(rawCode, initialTokens);
  if (syntaxErrors.length > 0) {
    return { errors: syntaxErrors };
  }

  const normalizedTokens = normalizeLexicalCpp(initialTokens);
  const { code: noRecordCode, records, recordOrder } = extractAndTransformRecords(normalizedTokens);
  const withObjects = transformObjectsAndMethods(noRecordCode, records);
  const finalCode = transformReferences(withObjects, records);

  return {
    errors: [],
    code: finalCode,
    recordOrder
  };
}

function formatRuntimeError(e) {
  const msg = String(e && e.message ? e.message : e);
  const firstLine = msg.split('\n')[0];
  if (firstLine.startsWith('ERROR:') || firstLine.startsWith('Error:')) {
    return `main.cpp: error: ${firstLine.replace(/^ERROR:\s*/i, '')}\n`;
  }
  return `main.cpp: error: ${msg}\n`;
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'Loading C++ runtime…');
    try {
      importScripts(base + 'jscpp/jscpp.js');
      post('ready');
    } catch (e) {
      post('fatal', 'C++ runtime failed to load: ' + e);
    }
    return;
  }

  if (data.type === 'run') {
    const rawCode = data.code || '';
    const qLines = (data.stdin || '').split('\n');
    if (qLines.length > 0 && qLines[qLines.length - 1] === '') qLines.pop();
    queue = qLines;

    try {
      if (!globalThis.JSCPP) {
        throw new Error('JSCPP engine is not initialized');
      }

      const prepared = prepareCppProgram(rawCode);
      if (prepared.errors.length > 0) {
        for (const err of prepared.errors) post('err', err);
        post('done');
        return;
      }

      globalThis.JSCPP.run(prepared.code, '', {
        registerTypes: (rt) => registerRecordsInRuntime(rt, prepared.recordOrder),
        stdio: {
          write: (s) => post('out', s),
          drain: () => requestInputFromConsole()
        }
      });
    } catch (e) {
      post('err', formatRuntimeError(e));
    }

    post('done');
  }
};
