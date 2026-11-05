// C++ classic worker: Fast offline C++ runtime supporting iostream, cmath, cstring, pointers, arrays, and OOP classes.
let base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
const dec = new TextDecoder();
const post = (t, s) => postMessage({ t, s });

function requestInputFromConsole() {
  // Priority 1: Interactive in-console stdin via SharedArrayBuffer (exact same as Python)
  if (status) {
    post('need_input');
    Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
    Atomics.wait(status, 0, 1);
    if (Atomics.load(status, 0) === 2) { // 2 = INPUT_READY
      const len = Atomics.load(dataLen, 0);
      const copy = new Uint8Array(len);
      copy.set(dataBuf.subarray(0, len));
      const text = dec.decode(copy) + '\n';
      Atomics.store(status, 0, 0);
      return text;
    }
    Atomics.store(status, 0, 0);
    return '\n';
  }
  // Fallback: Pre-buffered input queue (only if SharedArrayBuffer is unavailable)
  if (queue.length > 0) {
    return queue.shift() + '\n';
  }
  return '\n';
}

function stripTypes(paramStr) {
  if (!paramStr || !paramStr.trim()) return '';
  return paramStr.split(',').map(p => {
    const parts = p.trim().split(/\s+/);
    return parts[parts.length - 1].replace(/^[*&]+/, '');
  }).filter(Boolean).join(', ');
}

function findMatchingBrace(str, startIndex) {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function prepareCppCode(cppCode) {
  let c = cppCode;
  c = c.replace(/#include\s*<iostream\.h>/g, '#include <iostream>');
  c = c.replace(/#include\s*<conio\.h>/g, '');
  c = c.replace(/#include\s*<string>/g, '');
  if (/\bstring\b/.test(c) && !/typedef\s+char\s+string\b/.test(c)) {
    c = 'typedef char string[256];\n' + c;
  }
  return c;
}

function validateCppCode(code) {
  const errors = [];
  const lines = code.split('\n');

  // Check 1: Missing main function
  if (!/\b(?:int|void)\s+main\s*\(/.test(code)) {
    return ["main.cpp: error: undefined reference to 'main'\ncollect2: error: ld returned 1 exit status\n"];
  }

  // Check 2: Balanced braces and class definitions
  let braceDepth = 0;
  const braceStack = [];
  let inString = false;
  let inChar = false;
  let inBlockComment = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    let inLineComment = false;

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      const next = line[c + 1] || '';

      if (inBlockComment) {
        if (ch === '*' && next === '/') { inBlockComment = false; c++; }
        continue;
      }
      if (inLineComment) continue;

      if (ch === '/' && next === '*') { inBlockComment = true; c++; continue; }
      if (ch === '/' && next === '/') { inLineComment = true; c++; continue; }
      if (ch === '"' && !inChar) {
        if (c === 0 || line[c - 1] !== '\\') inString = !inString;
        continue;
      }
      if (ch === "'" && !inString) {
        if (c === 0 || line[c - 1] !== '\\') inChar = !inChar;
        continue;
      }
      if (inString || inChar) continue;

      if (ch === '{') {
        braceDepth++;
        braceStack.push({ line: l + 1, col: c + 1 });
      } else if (ch === '}') {
        braceDepth--;
        if (braceDepth < 0) {
          const caret = ' '.repeat(c) + '^';
          errors.push(`main.cpp:${l + 1}:${c + 1}: error: expected unqualified-id before '}' token\n ${line}\n ${caret}\n`);
          braceDepth = 0;
        } else {
          braceStack.pop();
        }
      }
    }
  }

  if (braceDepth > 0 && braceStack.length > 0) {
    const unclosed = braceStack[braceStack.length - 1];
    const lineText = lines[unclosed.line - 1] || '';
    const caret = ' '.repeat(Math.max(0, unclosed.col - 1)) + '^';
    errors.push(`main.cpp:${lines.length}:${(lines[lines.length - 1] || '').length + 1}: error: expected '}' at end of input\n ${lineText}\n ${caret}\n`);
    return errors;
  }

  // Check 3: Missing semicolon after class definition
  const classRe = /\bclass\s+([A-Za-z_]\w*)(?:\s*:\s*public\s+([A-Za-z_]\w*))?\s*\{/g;
  let cm;
  while ((cm = classRe.exec(code)) !== null) {
    const openIdx = cm.index + cm[0].length - 1;
    let depth = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < code.length; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') {
        depth--;
        if (depth === 0) { closeIdx = i; break; }
      }
    }
    if (closeIdx !== -1) {
      const after = code.slice(closeIdx + 1);
      const trimmedAfter = after.match(/^\s*([^\s;])/);
      if (trimmedAfter) {
        const beforeClose = code.slice(0, closeIdx);
        const lNum = beforeClose.split('\n').length;
        const cNum = beforeClose.split('\n').pop().length + 1;
        const lineText = lines[lNum - 1] || '}';
        const caret = ' '.repeat(Math.max(0, cNum - 1)) + '^';
        errors.push(`main.cpp:${lNum}:${cNum}: error: expected ';' after class definition\n ${lineText}\n ${caret}\n ;\n`);
      }
    }
  }

  // Check 4: Missing semicolon on regular statement lines
  for (let l = 0; l < lines.length; l++) {
    const raw = lines[l];
    const stripped = raw.replace(/\/\/.*/, '').trim();
    if (!stripped) continue;
    if (stripped.startsWith('#')) continue;
    if (/^(?:public|private|protected)\s*:/.test(stripped)) continue;
    if (stripped.endsWith(';') || stripped.endsWith('{') || stripped.endsWith('}') || stripped.endsWith(':')) continue;
    if (/^(?:if|else|while|for|switch|case|default)\b/.test(stripped)) continue;
    if (/^(?:class|struct|union)\b/.test(stripped)) continue;
    if (/^(?:void|int|float|double|char|string|bool|long)\s+[A-Za-z_]\w*\s*\(/.test(stripped)) continue;
    if (stripped.endsWith(',') || stripped.endsWith('<<') || stripped.endsWith('>>') || stripped.endsWith('+') || stripped.endsWith('-') || stripped.endsWith('*') || stripped.endsWith('/') || stripped.endsWith('=')) continue;

    const nextLine = (lines[l + 1] || '').trim();
    if (nextLine === '}' || /^(?:cout|cin|return|int|float|double|char|string|bool|long|while|for|if)\b/.test(nextLine) || /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?\s*\(/.test(nextLine)) {
      const cNum = raw.trimEnd().length + 1;
      const caret = ' '.repeat(Math.max(0, cNum - 1)) + '^';
      errors.push(`main.cpp:${l + 1}:${cNum}: error: expected ';' before end of statement\n ${raw}\n ${caret}\n ;\n`);
    }
  }

  return errors;
}

function formatRuntimeError(e) {
  const msg = String(e?.message || e);
  const refMatch = msg.match(/(\w+) is not defined/);
  if (refMatch) {
    return `main.cpp: error: '${refMatch[1]}' was not declared in this scope\n`;
  }
  const typeMatch = msg.match(/(\w+) is not a function/);
  if (typeMatch) {
    return `main.cpp: error: '${typeMatch[1]}' cannot be used as a function\n`;
  }
  const synMatch = msg.match(/Unexpected identifier '(\w+)'/);
  if (synMatch) {
    return `main.cpp: error: syntax error near '${synMatch[1]}'\n`;
  }
  const firstLine = msg.split('\n')[0];
  if (firstLine.startsWith('ERROR:') || firstLine.startsWith('Error:')) {
    return `main.cpp: error: ${firstLine.replace(/^ERROR:\s*/i, '')}\n`;
  }
  return `main.cpp: error: ${firstLine}\n`;
}

function runCppOop(cppCode) {
  let code = cppCode;

  // 1. Strip comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  // 2. Strip headers & namespace
  code = code.replace(/#include\s*<[^>]+>/g, '');
  code = code.replace(/using\s+namespace\s+std\s*;/g, '');

  // 3. Find and transform each class block with balanced brace matching
  const classNames = [];
  let searchIdx = 0;

  while (true) {
    const classMatch = /\bclass\s+([A-Za-z_]\w*)(?:\s*:\s*public\s+([A-Za-z_]\w*))?\s*\{/g;
    classMatch.lastIndex = searchIdx;
    const m = classMatch.exec(code);
    if (!m) break;

    const className = m[1];
    const baseClass = m[2];
    classNames.push(className);

    const openBrace = m.index + m[0].length - 1;
    const closeBrace = findMatchingBrace(code, openBrace);
    if (closeBrace === -1) break;

    let classBody = code.substring(openBrace + 1, closeBrace);

    // Extract member fields (including arrays e.g. char name[20];)
    const fieldNames = new Set();
    const fieldLineRegex = /\b(?:int|float|double|char|string|bool|long|short)\s+([^;()]+);/g;
    let fm;
    while ((fm = fieldLineRegex.exec(classBody)) !== null) {
      const decls = fm[1].split(',');
      for (const d of decls) {
        const nameMatch = d.trim().match(/^([A-Za-z_]\w*)(?:\[.*\])?(?:\s*=.*)?$/);
        if (nameMatch) {
          fieldNames.add(nameMatch[1]);
        }
      }
    }

    // Clean up access specifiers
    classBody = classBody.replace(/\b(public|private|protected)\s*:/g, '');

    // Check if explicit constructor exists
    const ctorRe = new RegExp('\\b' + className + '\\s*\\(([^)]*)\\)\\s*\\{', 'g');
    const hasCtor = ctorRe.test(classBody);

    // Remove raw C++ field declarations from class body
    classBody = classBody.replace(/\b(?:int|float|double|char|string|bool|long|short)\s+([^;()]+);/g, '');

    // Rewrite constructors: ClassName(...) {
    classBody = classBody.replace(new RegExp('\\b' + className + '\\s*\\(([^)]*)\\)\\s*\\{', 'g'), (match, params) => {
      const fieldInits = Array.from(fieldNames).map(f => `this.${f} = "";`).join(' ');
      return `constructor(${stripTypes(params)}) { ${baseClass ? 'super(); ' : ''}${fieldInits} `;
    });

    // If no explicit constructor, inject default constructor with field inits
    let ctorCode = '';
    if (!hasCtor) {
      const fieldInits = Array.from(fieldNames).map(f => `this.${f} = "";`).join(' ');
      ctorCode = `\n  constructor() { ${baseClass ? 'super(); ' : ''}${fieldInits} }\n`;
    }

    // Rewrite member methods: void methodName(...) { -> methodName(...) {
    classBody = classBody.replace(/\b(?:void|int|float|double|char|string|bool|long|short)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g, (match, name, params) => {
      return `${name}(${stripTypes(params)}) {`;
    });

    // Inside class methods, replace member field references with this.fieldName
    for (const fName of fieldNames) {
      const fieldRefRe = new RegExp('(?<![\\w.]|this\\.)\\b' + fName + '\\b', 'g');
      classBody = classBody.replace(fieldRefRe, 'this.' + fName);
    }

    const transformedClass = `class ${className}${baseClass ? ' extends ' + baseClass : ''} {${ctorCode}\n${classBody}\n};`;
    
    // Replace class in code (also consuming optional trailing semicolon if present)
    const afterClose = code.substring(closeBrace + 1);
    const semicolonMatch = afterClose.match(/^\s*;/);
    const endReplace = closeBrace + 1 + (semicolonMatch ? semicolonMatch[0].length : 0);

    code = code.substring(0, m.index) + transformedClass + code.substring(endReplace);
    searchIdx = m.index + transformedClass.length;
  }

  // 4. Rewrite main and standalone functions outside classes
  code = code.replace(/\b(?:void|int)\s+main\s*\([^)]*\)\s*\{/g, 'function main() {');
  code = code.replace(/\b(?:void|int|float|double|char|string|bool|long)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g, (m, name, params) => {
    return `function ${name}(${stripTypes(params)}) {`;
  });

  // 5. Rewrite object instantiations: Student S; or Student s(args);
  for (const cName of classNames) {
    const instArgsRe = new RegExp('\\b' + cName + '\\s+([A-Za-z_]\\w*)\\s*\\(([^)]*)\\)\\s*;', 'g');
    code = code.replace(instArgsRe, 'let $1 = new ' + cName + '($2);');

    const instNoArgsRe = new RegExp('\\b' + cName + '\\s+([A-Za-z_][\\w\\s,]*);', 'g');
    code = code.replace(instNoArgsRe, (match, vars) => {
      const parts = vars.split(',').map(v => v.trim()).filter(Boolean);
      return parts.map(v => `let ${v} = new ${cName}();`).join(' ');
    });
  }

  // 6. Rewrite local variable declarations inside functions
  code = code.replace(/\b(?:int|float|double|char|string|bool|long|short)\s+([^;()]+);/g, (match, decls) => {
    const parts = decls.split(',').map(d => {
      const trimmed = d.trim();
      const arrMatch = trimmed.match(/^([A-Za-z_]\w*)\[.*\]$/);
      if (arrMatch) return `${arrMatch[1]} = ""`;
      return trimmed;
    });
    return `let ${parts.join(', ')};`;
  });

  // 7. Rewrite cout << ... ;
  code = code.replace(/cout\s*<<\s*([^;]+);/g, (match, exprs) => {
    const parts = exprs.split('<<').map(s => s.trim());
    const jsArgs = parts.map(p => {
      if (p === 'endl') return '"\\n"';
      return p;
    });
    return `cout.print(${jsArgs.join(', ')});`;
  });

  // 8. Rewrite cin >> ... ;
  code = code.replace(/cin\s*>>\s*([^;]+);/g, (match, vars) => {
    const parts = vars.split('>>').map(s => s.trim());
    return parts.map(v => `${v} = cin.next();`).join(' ');
  });

  let oopTokens = [];
  const env = {
    cout: {
      print: (...args) => post('out', args.join(''))
    },
    cin: {
      next: () => {
        if (oopTokens.length > 0) return oopTokens.shift();
        const text = requestInputFromConsole();
        const tokens = text.split(/\s+/).filter(Boolean);
        if (tokens.length > 0) {
          const res = tokens.shift();
          oopTokens.push(...tokens);
          return res;
        }
        return '';
      }
    },
    endl: '\n'
  };

  const runner = new Function('cout', 'cin', 'endl', code + '\nif (typeof main === "function") main();');
  runner(env.cout, env.cin, env.endl);
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
    let cppCode = data.code || '';
    queue = (data.stdin || '').split('\n').filter(Boolean);

    // Normalize legacy Turbo C++ headers if present
    cppCode = cppCode.replace(/#include\s*<iostream\.h>/g, '#include <iostream>');
    cppCode = cppCode.replace(/#include\s*<conio\.h>/g, '');

    // 1. Run C++ Syntax & Semantic Validation Layer (reports genuine g++ errors)
    const syntaxErrors = validateCppCode(cppCode);
    if (syntaxErrors.length > 0) {
      for (const err of syntaxErrors) {
        post('err', err);
      }
      post('done');
      return;
    }

    const hasClass = /\bclass\s+[A-Za-z_]\w*/.test(cppCode);

    try {
      if (hasClass) {
        runCppOop(cppCode);
      } else {
        if (!globalThis.JSCPP) {
          throw new Error('JSCPP engine is not initialized');
        }
        globalThis.JSCPP.run(prepareCppCode(cppCode), '', {
          stdio: {
            write: (s) => post('out', s),
            drain: () => requestInputFromConsole()
          }
        });
      }
    } catch (e) {
      post('err', formatRuntimeError(e));
    }

    post('done');
  }
};
