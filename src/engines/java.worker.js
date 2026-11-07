// Java (JDK) Worker: 100% offline Java runtime supporting OOP, Scanner, inheritance, arrays, and standard libraries.
let base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
const dec = new TextDecoder();
const post = (t, s) => postMessage({ t, s });

function requestInputFromConsole() {
  // Priority 1: Interactive in-console stdin via SharedArrayBuffer
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
  // Fallback: Pre-buffered input queue
  if (queue.length > 0) {
    return queue.shift() + '\n';
  }
  return '\n';
}

function findMatching(str, startIdx, openChar = '{', closeChar = '}') {
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function stripTypes(paramStr) {
  if (!paramStr || !paramStr.trim()) return '';
  return paramStr.split(',').map(p => {
    let s = p.trim().replace(/\bfinal\s+/g, '');
    const parts = s.split(/\s+/);
    return parts[parts.length - 1].replace(/\[.*\]$/, '');
  }).filter(Boolean).join(', ');
}

function getParamTypes(rawParams) {
  if (!rawParams || !rawParams.trim()) return [];
  return rawParams.split(',').map(p => {
    let s = p.trim().replace(/\bfinal\s+/g, '');
    const parts = s.split(/\s+/);
    if (parts.length > 1) {
      return parts[0].replace(/\[\s*\]/g, '[]');
    }
    return '';
  }).filter(Boolean);
}

function getTypeCheck(argName, type) {
  if (type === 'String') return `typeof ${argName} === 'string'`;
  if (type === 'boolean') return `typeof ${argName} === 'boolean'`;
  if (type === 'float') return `(${argName} && ${argName}.__isFloat)`;
  if (type === 'double') return `(typeof ${argName} === 'number' && (!${argName} || !${argName}.__isFloat))`;
  if (type === 'int' || type === 'long' || type === 'short' || type === 'byte') return `typeof ${argName} === 'number'`;
  return null;
}

function __float(v) {
  const n = new Number(v);
  n.__isFloat = true;
  return n;
}

function validateJavaCode(code) {
  const errors = [];
  const lines = code.split('\n');

  // Check 1: Main method existence
  if (!/\b(?:public\s+)?static\s+void\s+main\s*\(/.test(code) && !/\bvoid\s+main\s*\(/.test(code)) {
    return ["Main.java: error: Main method not found in class, please define the main method as:\n   public static void main(String[] args)\n"];
  }

  // Check 2: Balanced braces and unclosed quotes
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

      if (ch === '"' && !inChar) {
        if (c === 0 || line[c - 1] !== '\\') inString = !inString;
        continue;
      }
      if (ch === "'" && !inString) {
        if (c === 0 || line[c - 1] !== '\\') inChar = !inChar;
        continue;
      }
      if (inString || inChar) continue;

      if (ch === '/' && next === '*') { inBlockComment = true; c++; continue; }
      if (ch === '/' && next === '/') { inLineComment = true; c++; continue; }

      if (ch === '{') {
        braceDepth++;
        braceStack.push({ line: l + 1, col: c + 1 });
      } else if (ch === '}') {
        braceDepth--;
        if (braceDepth < 0) {
          const caret = ' '.repeat(c) + '^';
          errors.push(`Main.java:${l + 1}:${c + 1}: error: class, interface, enum, or record expected\n ${line}\n ${caret}\n`);
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
    errors.push(`Main.java:${lines.length}:${(lines[lines.length - 1] || '').length + 1}: error: reached end of file while parsing\n ${lineText}\n ${caret}\n`);
    return errors;
  }

  // Check 3: Missing semicolon on statement lines
  for (let l = 0; l < lines.length; l++) {
    const raw = lines[l];
    const stripped = raw.replace(/\/\/.*/, '').trim();
    if (!stripped) continue;
    if (stripped.startsWith('//') || stripped.startsWith('/*') || stripped.startsWith('*')) continue;
    if (stripped.endsWith(';') || stripped.endsWith('{') || stripped.endsWith('}') || stripped.endsWith(':')) continue;
    if (/^(?:if|else|while|for|switch|case|default|try|catch|finally|synchronized)\b/.test(stripped)) continue;
    if (/^(?:public|private|protected|abstract|static|final)?\s*(?:class|interface|enum)\b/.test(stripped)) continue;
    if (/(?:void|int|float|double|char|boolean|String|long|short|byte|[A-Za-z_]\w*)\s+[A-Za-z_]\w*\s*\([^)]*\)\s*$/.test(stripped)) continue; // method signature
    if (stripped.endsWith(',') || stripped.endsWith('+') || stripped.endsWith('-') || stripped.endsWith('*') || stripped.endsWith('/') || stripped.endsWith('=')) continue;

    const nextLine = (lines[l + 1] || '').trim();
    if (nextLine === '}' || /^(?:System|Scanner|return|int|float|double|char|boolean|String|long|short|byte|while|for|if|try)\b/.test(nextLine) || /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?\s*\(/.test(nextLine)) {
      const cNum = raw.trimEnd().length + 1;
      const caret = ' '.repeat(Math.max(0, cNum - 1)) + '^';
      errors.push(`Main.java:${l + 1}:${cNum}: error: ';' expected\n ${raw}\n ${caret}\n`);
    }
  }

  return errors;
}

function transformTryCatch(code) {
  let res = '';
  let i = 0;

  while (i < code.length) {
    const tryIdx = code.indexOf('try', i);
    if (tryIdx === -1) {
      res += code.slice(i);
      break;
    }

    const before = tryIdx === 0 ? '' : code[tryIdx - 1];
    const after = code[tryIdx + 3] || '';
    if (/\w/.test(before) || (after !== '' && !/\s|\{/.test(after))) {
      res += code.slice(i, tryIdx + 3);
      i = tryIdx + 3;
      continue;
    }

    res += code.slice(i, tryIdx);

    const tryOpen = code.indexOf('{', tryIdx);
    if (tryOpen === -1) {
      res += code.slice(tryIdx);
      break;
    }
    const tryClose = findMatching(code, tryOpen, '{', '}');
    if (tryClose === -1) {
      res += code.slice(tryIdx);
      break;
    }

    const tryBody = code.slice(tryOpen + 1, tryClose);
    res += `try {${tryBody}}`;

    let curr = tryClose + 1;
    const catchBlocks = [];

    while (curr < code.length) {
      while (curr < code.length && /\s/.test(code[curr])) curr++;
      if (code.startsWith('catch', curr)) {
        const openParen = code.indexOf('(', curr + 5);
        const closeParen = code.indexOf(')', openParen);
        const openBrace = code.indexOf('{', closeParen);
        const closeBrace = findMatching(code, openBrace, '{', '}');
        if (openParen !== -1 && closeParen !== -1 && openBrace !== -1 && closeBrace !== -1) {
          const paramStr = code.slice(openParen + 1, closeParen).trim();
          const catchBody = code.slice(openBrace + 1, closeBrace);

          const parts = paramStr.split(/\s+/);
          const typeName = parts.length > 1 ? parts[0] : 'Exception';
          const varName = parts[parts.length - 1];

          catchBlocks.push({ type: typeName, varName, body: catchBody });
          curr = closeBrace + 1;
          continue;
        }
      }
      break;
    }

    if (catchBlocks.length === 1) {
      const c = catchBlocks[0];
      res += ` catch (${c.varName}) {${c.body}}`;
    } else if (catchBlocks.length > 1) {
      let merged = ` catch (_err) {\n`;
      for (let j = 0; j < catchBlocks.length; j++) {
        const c = catchBlocks[j];
        const isLast = j === catchBlocks.length - 1;
        const cond = (c.type === 'Exception' || c.type === 'Throwable') ? 'true' : `(_err instanceof ${c.type} || _err.name === '${c.type}')`;
        const prefix = j === 0 ? 'if' : (isLast && cond === 'true' ? 'else' : 'else if');
        if (isLast && cond === 'true') {
          merged += `  ${prefix} {\n    let ${c.varName} = _err;\n${c.body}\n  }\n`;
        } else {
          merged += `  ${prefix} (${cond}) {\n    let ${c.varName} = _err;\n${c.body}\n  }\n`;
        }
      }
      merged += `}`;
      res += merged;
    }

    i = curr;
  }

  return res;
}

const CONTAINER_METHODS = new Set([
  'add', 'remove', 'setLayout', 'setSize', 'setBounds', 'setVisible',
  'setTitle', 'setDefaultCloseOperation', 'pack', 'validate', 'repaint',
  'dispose', 'show', 'hide', 'getContentPane', 'setBackground', 'setForeground', 'setFont'
]);

function transformMethodBody(body, classFields, staticFields, className, paramStr = '', isContainer = false, instanceMethods = new Set()) {
  let b = transformTryCatch(body);

  const paramNames = new Set(paramStr.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean));

  // Strip Java typecasts: (int), (double), (float), (long), (short), (byte), (char), (boolean), (ClassName)
  b = b.replace(/(?<!\b(?:if|while|switch|for|catch)\s*)\(\s*(?:int|double|float|long|short|byte|char|boolean|[A-Z][A-Za-z0-9_]*)\s*\)(?=\s*[A-Za-z0-9_(])/g, '');

  // Float / Long suffixes: 3.5f -> __float(3.5), 100L -> 100
  b = b.replace(/\b(\d+(?:\.\d+)?)[fF]\b/g, '__float($1)');
  b = b.replace(/\b(\d+)[lL]\b/g, '$1');

  // 1. Enhanced for loop: for (Type x : arr) -> for (const x of arr)
  b = b.replace(/for\s*\(\s*(?:final\s+)?(?:int|float|double|char|boolean|String|long|short|byte|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([A-Za-z_]\w*)\s*:\s*([^)]+)\)/g, 'for (const $1 of $2)');

  // 2. Array instantiations:
  b = b.replace(/new\s+(?:int|float|double|long|short|byte)\s*\[([^\]]+)\]\s*\[([^\]]+)\]/g, 'Array.from({length: $1}, () => new Array($2).fill(0))');
  b = b.replace(/new\s+(?:int|float|double|long|short|byte)\s*\[([^\]]+)\]/g, 'new Array($1).fill(0)');
  b = b.replace(/new\s+boolean\s*\[([^\]]+)\]/g, 'new Array($1).fill(false)');
  b = b.replace(/new\s+String\s*\[([^\]]+)\]/g, 'new Array($1).fill("")');
  b = b.replace(/new\s+([A-Za-z_]\w*)\s*\[([^\]]+)\]/g, 'new Array($2).fill(null)');

  // 3. Array literals: { 1, 2, 3 } -> [ 1, 2, 3 ]
  b = b.replace(/=\s*\{\s*\{([^{}]+)\}\s*,\s*\{([^{}]+)\}\s*\}\s*;/g, '= [[$1], [$2]];');
  b = b.replace(/=\s*\{([^{}]+)\}\s*;/g, '= [$1];');

  // 4. Local variable declarations:
  const localVars = new Set();
  b = b.replace(/\b(?:final\s+)?(?:int|float|double|char|boolean|String|long|short|byte|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])+\s+([A-Za-z_]\w*)/g, (m, v) => {
    localVars.add(v);
    return `let ${v}`;
  });
  b = b.replace(/\b(?:final\s+)?(?:int|float|double|char|boolean|String|long|short|byte|[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?)\s+([A-Za-z_]\w*)\s*(?=[=;,])/g, (m, v) => {
    localVars.add(v);
    return `let ${v} `;
  });

  // 5. Replace .length() with .length
  b = b.replace(/\.length\(\)/g, '.length');

  // 6. Inherited container methods for JFrame, Frame, JPanel, etc.
  if (isContainer) {
    for (const cm of CONTAINER_METHODS) {
      if (paramNames.has(cm) || localVars.has(cm)) continue;
      const reg = new RegExp('(?<![\\w.]|this\\.)\\b' + cm + '\\s*\\(', 'g');
      b = b.replace(reg, `this.${cm}(`);
    }
  }

  // 7. Instance methods defined on the class: add this.method(...)
  for (const im of instanceMethods) {
    if (paramNames.has(im) || localVars.has(im)) continue;
    const reg = new RegExp('(?<![\\w.]|this\\.)\\b' + im + '\\s*\\(', 'g');
    b = b.replace(reg, `this.${im}(`);
  }

  // 8. Member fields: access via this.field (if not shadowed)
  for (const f of classFields) {
    if (paramNames.has(f) || localVars.has(f)) continue;
    const reg = new RegExp('(?<![\\w.]|this\\.)\\b' + f + '\\b', 'g');
    b = b.replace(reg, 'this.' + f);
  }

  // 9. Static fields on current class: access via ClassName.field
  for (const sf of staticFields) {
    if (paramNames.has(sf) || localVars.has(sf)) continue;
    const reg = new RegExp('(?<![\\w.]|this\\.|' + className + '\\.)\\b' + sf + '\\b', 'g');
    b = b.replace(reg, `${className}.${sf}`);
  }

  return b;
}

function parseAndTranspileJava(javaCode) {
  let code = javaCode;

  // 1. Hide string literals & character literals
  const stringLiterals = [];
  code = code.replace(/"(?:[^"\\]|\\.)*"/g, m => {
    stringLiterals.push(m);
    return `__STR_${stringLiterals.length - 1}__`;
  });
  code = code.replace(/'(?:[^'\\]|\\.)*'/g, m => {
    stringLiterals.push(m);
    return `__STR_${stringLiterals.length - 1}__`;
  });

  // 2. Strip comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*/g, '');

  // 3. Strip package and imports
  code = code.replace(/package\s+[\w.]+;/g, '');
  code = code.replace(/import\s+[\w.*]+;/g, '');

  // 4. Strip annotations
  code = code.replace(/@\w+(\([^)]*\))?/g, '');

  // 5. Replace interfaces and abstract classes
  code = code.replace(/\binterface\s+([A-Za-z_]\w*)(?:\s+extends\s+[^{]+)?\s*\{[\s\S]*?\}/g, (m, name) => `class ${name} {}`);
  code = code.replace(/\bimplements\s+[A-Za-z_0-9,\s<>]+\s*\{/g, '{');
  code = code.replace(/\babstract\s+class\b/g, 'class');
  code = code.replace(/\babstract\s+(?:void|int|double|float|String|boolean|[A-Za-z_]\w*)\s+[A-Za-z_]\w*\s*\([^;)]*\)\s*;/g, '');

  // 6. Find all classes
  const classRe = /\b(?:public\s+|private\s+|protected\s+)?(?:final\s+)?class\s+([A-Za-z_]\w*)(?:\s+extends\s+([A-Za-z_]\w*))?\s*\{/g;
  let cm;
  const classes = [];
  while ((cm = classRe.exec(code)) !== null) {
    const name = cm[1];
    const base = cm[2];
    const openIdx = cm.index + cm[0].length - 1;
    const closeIdx = findMatching(code, openIdx, '{', '}');
    if (closeIdx === -1) continue;
    classes.push({
      start: cm.index,
      end: closeIdx + 1,
      name,
      base,
      rawBody: code.substring(openIdx + 1, closeIdx)
    });
  }

  let mainClass = null;
  const outputClasses = [];

  for (const cls of classes) {
    let body = cls.rawBody;
    const classFields = new Set();
    const staticFields = new Set();
    const staticMethods = new Set();
    const instanceMethodNames = new Set();
    const instanceMethods = [];
    const constructors = [];
    const fieldDecls = [];

    const isContainer = cls.base && /^(?:JFrame|Frame|JPanel|Panel|Applet|JApplet|Dialog|JDialog|Window)$/.test(cls.base);

    let idx = 0;
    while (idx < body.length) {
      while (idx < body.length && /\s/.test(body[idx])) idx++;
      if (idx >= body.length) break;

      const semiIdx = body.indexOf(';', idx);
      const openBrace = body.indexOf('{', idx);

      if (openBrace !== -1 && (semiIdx === -1 || openBrace < semiIdx)) {
        const header = body.substring(idx, openBrace).trim();
        const closeBrace = findMatching(body, openBrace, '{', '}');
        if (closeBrace === -1) break;
        const memberBody = body.substring(openBrace + 1, closeBrace);

        const ctorMatch = header.match(new RegExp('(?:public|private|protected)?\\s*\\b' + cls.name + '\\s*\\(([^)]*)\\)'));
        if (ctorMatch) {
          constructors.push({
            params: stripTypes(ctorMatch[1]),
            rawParams: ctorMatch[1],
            body: memberBody
          });
        } else {
          const methodMatch = header.match(/(?:public|private|protected)?\s*(static\s+)?(?:final\s+)?(?:void|int|float|double|char|boolean|String|long|short|byte|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
          if (methodMatch) {
            const isStatic = Boolean(methodMatch[1]);
            const mName = methodMatch[2];
            const params = stripTypes(methodMatch[3]);
            if (isStatic) staticMethods.add(mName);
            else instanceMethodNames.add(mName);
            if (mName === 'main') {
              mainClass = cls.name;
            }
            instanceMethods.push({
              name: mName,
              isStatic,
              params: mName === 'main' ? 'args = []' : params,
              rawParams: methodMatch[3],
              body: memberBody
            });
          }
        }
        idx = closeBrace + 1;
      } else if (semiIdx !== -1) {
        const decl = body.substring(idx, semiIdx).trim();
        const fieldMatch = decl.match(/(?:public|private|protected)?\s*(static\s+)?(?:final\s+)?(?:int|float|double|char|boolean|String|long|short|byte|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([^;]+)/);
        if (fieldMatch) {
          const isStatic = Boolean(fieldMatch[1]);
          const declList = fieldMatch[2].split(',');
          for (const d of declList) {
            const trimmed = d.trim();
            const nm = trimmed.match(/^([A-Za-z_]\w*)(?:\s*=\s*(.*))?$/);
            if (nm) {
              const varName = nm[1];
              let initVal = nm[2] || 'null';
              if (initVal.startsWith('{') && initVal.endsWith('}')) {
                initVal = '[' + initVal.slice(1, -1) + ']';
              }
              if (isStatic) {
                staticFields.add(varName);
                fieldDecls.push(`  static ${varName} = ${initVal};`);
              } else {
                classFields.add(varName);
                fieldDecls.push(`  ${varName} = ${initVal};`);
              }
            }
          }
        }
        idx = semiIdx + 1;
      } else {
        break;
      }
    }

    let classJs = `class ${cls.name}${cls.base ? ' extends ' + cls.base : ''} {\n`;
    if (fieldDecls.length > 0) {
      classJs += fieldDecls.join('\n') + '\n';
    }

    if (constructors.length === 0) {
      if (cls.base) {
        classJs += `  constructor(...args) { super(...args); }\n`;
      }
    } else if (constructors.length === 1) {
      const c = constructors[0];
      let transBody = transformMethodBody(c.body, classFields, staticFields, cls.name, c.params, isContainer, instanceMethodNames);
      const hasSuper = /\bsuper\s*\(/.test(transBody);
      const superCall = cls.base && !hasSuper ? '    super();\n' : '';
      classJs += `  constructor(${c.params}) {\n${superCall}${transBody}\n  }\n`;
    } else {
      // Overloaded constructors! Consolidate into a single ES6 constructor
      const superCall = cls.base ? '    super();\n' : '';
      classJs += `  constructor(...__args) {\n${superCall}`;

      for (let i = 0; i < constructors.length; i++) {
        const c = constructors[i];
        const pTypes = getParamTypes(c.rawParams);
        let cond = `__args.length === ${pTypes.length}`;
        const siblings = constructors.filter((other, idx) => idx !== i && getParamTypes(other.rawParams).length === pTypes.length);
        if (siblings.length > 0 && pTypes.length > 0) {
          const checks = [];
          for (let pIdx = 0; pIdx < pTypes.length; pIdx++) {
            const tc = getTypeCheck(`__args[${pIdx}]`, pTypes[pIdx]);
            if (tc) checks.push(tc);
          }
          if (checks.length > 0) cond += ` && (${checks.join(' && ')})`;
        }
        classJs += `    if (${cond}) { this.__ctor_${i}(...__args); return; }\n`;
      }
      classJs += `    if (typeof this.__ctor_0 === 'function') this.__ctor_0(...__args);\n`;
      classJs += `  }\n`;

      for (let i = 0; i < constructors.length; i++) {
        const c = constructors[i];
        let transBody = transformMethodBody(c.body, classFields, staticFields, cls.name, c.params, isContainer, instanceMethodNames);
        transBody = transBody.replace(/\bsuper\s*\([^)]*\);?/g, '');
        classJs += `  __ctor_${i}(${c.params}) {\n${transBody}\n  }\n`;
      }
    }

    // Method dispatching with overloading support
    const methodGroups = new Map();
    for (const m of instanceMethods) {
      const key = (m.isStatic ? 'static:' : 'instance:') + m.name;
      if (!methodGroups.has(key)) methodGroups.set(key, []);
      methodGroups.get(key).push(m);
    }

    for (const [key, group] of methodGroups.entries()) {
      const isStatic = group[0].isStatic;
      const staticPrefix = isStatic ? 'static ' : '';
      const mName = group[0].name;

      if (group.length === 1) {
        const m = group[0];
        let transBody = transformMethodBody(m.body, classFields, staticFields, cls.name, m.params, isContainer, instanceMethodNames);
        for (const sm of staticMethods) {
          const reg = new RegExp('(?<![\\w.]|' + cls.name + '\\.)\\b' + sm + '\\b(?=\\s*\\()', 'g');
          transBody = transBody.replace(reg, `${cls.name}.${sm}`);
        }
        classJs += `  ${staticPrefix}${m.name}(${m.params}) {\n${transBody}\n  }\n`;
      } else {
        // Overloaded methods!
        classJs += `  ${staticPrefix}${mName}(...__args) {\n`;
        for (let i = 0; i < group.length; i++) {
          const m = group[i];
          const pTypes = getParamTypes(m.rawParams);
          let cond = `__args.length === ${pTypes.length}`;
          const siblings = group.filter((other, idx) => idx !== i && getParamTypes(other.rawParams).length === pTypes.length);
          if (siblings.length > 0 && pTypes.length > 0) {
            const checks = [];
            for (let pIdx = 0; pIdx < pTypes.length; pIdx++) {
              const tc = getTypeCheck(`__args[${pIdx}]`, pTypes[pIdx]);
              if (tc) checks.push(tc);
            }
            if (checks.length > 0) cond += ` && (${checks.join(' && ')})`;
          }
          classJs += `    if (${cond}) { return ${isStatic ? cls.name : 'this'}.__${mName}_${i}(...__args); }\n`;
        }
        classJs += `    return ${isStatic ? cls.name : 'this'}.__${mName}_0(...__args);\n`;
        classJs += `  }\n`;

        for (let i = 0; i < group.length; i++) {
          const m = group[i];
          let transBody = transformMethodBody(m.body, classFields, staticFields, cls.name, m.params, isContainer, instanceMethodNames);
          for (const sm of staticMethods) {
            const reg = new RegExp('(?<![\\w.]|' + cls.name + '\\.)\\b' + sm + '\\b(?=\\s*\\()', 'g');
            transBody = transBody.replace(reg, `${cls.name}.${sm}`);
          }
          classJs += `  ${staticPrefix}__${mName}_${i}(${m.params}) {\n${transBody}\n  }\n`;
        }
      }
    }

    classJs += `}\n`;
    outputClasses.push(classJs);
  }

  let finalJs = outputClasses.join('\n');
  finalJs = finalJs.replace(/__STR_(\d+)__/g, (_, idx) => stringLiterals[parseInt(idx, 10)]);

  if (mainClass) {
    finalJs += `\nif (typeof ${mainClass} !== 'undefined' && typeof ${mainClass}.main === 'function') {\n  ${mainClass}.main(__cmd_args__);\n}\n`;
  }

  return { js: finalJs, mainClass };
}

function formatJavaPrintf(format, ...args) {
  let argIdx = 0;
  return format.replace(/%([0-9]*\.?[0-9]*[a-zA-Z%])/g, (match, spec) => {
    if (spec === '%') return '%';
    if (spec === 'n') return '\n';
    const val = args[argIdx++];
    if (val === undefined) return '';
    if (spec.endsWith('d') || spec.endsWith('i')) return parseInt(val, 10);
    if (spec.endsWith('f')) {
      const dot = spec.indexOf('.');
      if (dot !== -1) {
        const decimals = parseInt(spec.slice(dot + 1, -1), 10);
        return parseFloat(val).toFixed(decimals);
      }
      return parseFloat(val);
    }
    if (spec.endsWith('s')) return String(val);
    if (spec.endsWith('c')) return String(val).charAt(0);
    if (spec.endsWith('b')) return Boolean(val);
    return String(val);
  });
}

function createJavaEnvironment() {
  // String prototype polyfills for Java
  if (!String.prototype.equals) {
    String.prototype.equals = function(o) { return this.valueOf() === (o && o.valueOf ? o.valueOf() : o); };
  }
  if (!String.prototype.equalsIgnoreCase) {
    String.prototype.equalsIgnoreCase = function(o) { return this.toLowerCase() === (o ? String(o).toLowerCase() : ''); };
  }
  if (!String.prototype.compareTo) {
    String.prototype.compareTo = function(o) { return this.localeCompare(o); };
  }
  if (!String.prototype.contains) {
    String.prototype.contains = function(o) { return this.includes(o); };
  }
  if (!String.prototype.toCharArray) {
    String.prototype.toCharArray = function() { return this.split(''); };
  }
  if (!Error.prototype.getMessage) {
    Error.prototype.getMessage = function() { return this.message; };
  }
  if (!Error.prototype.printStackTrace) {
    Error.prototype.printStackTrace = function() { post('err', (this.stack || this.message) + '\n'); };
  }

  const StringClass = globalThis.String;
  StringClass.valueOf = function(v) { return globalThis.String(v); };

  // --- Java Standard Exceptions ---
  class Exception extends Error {
    constructor(msg = 'Exception') { super(msg); this.name = 'Exception'; }
  }
  class RuntimeException extends Exception {
    constructor(msg = 'RuntimeException') { super(msg); this.name = 'RuntimeException'; }
  }
  class ArithmeticException extends Exception {
    constructor(msg = '/ by zero') { super(msg); this.name = 'ArithmeticException'; }
  }
  class NullPointerException extends Exception {
    constructor(msg = 'null') { super(msg); this.name = 'NullPointerException'; }
  }
  class ArrayIndexOutOfBoundsException extends Exception {
    constructor(msg = 'Index out of bounds') { super(msg); this.name = 'ArrayIndexOutOfBoundsException'; }
  }
  class IndexOutOfBoundsException extends Exception {
    constructor(msg = 'Index out of bounds') { super(msg); this.name = 'IndexOutOfBoundsException'; }
  }
  class NumberFormatException extends Exception {
    constructor(msg = 'For input string') { super(msg); this.name = 'NumberFormatException'; }
  }
  class IllegalArgumentException extends Exception {
    constructor(msg = 'Illegal argument') { super(msg); this.name = 'IllegalArgumentException'; }
  }
  class IOException extends Exception {
    constructor(msg = 'I/O Error') { super(msg); this.name = 'IOException'; }
  }
  class ClassNotFoundException extends Exception {
    constructor(msg = 'Class not found') { super(msg); this.name = 'ClassNotFoundException'; }
  }
  class SQLException extends Exception {
    constructor(msg = 'SQL error') { super(msg); this.name = 'SQLException'; }
  }
  const Throwable = Exception;

  let inputTokens = [];

  class Scanner {
    constructor(source) {
      this.source = source;
    }
    _ensureTokens() {
      let attempts = 0;
      while (inputTokens.length === 0 && attempts < 3) {
        attempts++;
        const text = requestInputFromConsole();
        if (text === null || text === undefined) break;
        const parts = text.trim().split(/\s+/).filter(Boolean);
        for (const p of parts) inputTokens.push(p);
        if (inputTokens.length > 0) break;
      }
      if (inputTokens.length === 0) {
        inputTokens.push('0');
      }
    }
    next() {
      this._ensureTokens();
      return inputTokens.shift() || '';
    }
    nextLine() {
      if (inputTokens.length > 0) {
        const res = inputTokens.join(' ');
        inputTokens = [];
        return res;
      }
      return requestInputFromConsole().replace(/\r?\n$/, '');
    }
    nextInt() {
      const val = parseInt(this.next(), 10);
      return isNaN(val) ? 0 : val;
    }
    nextLong() { return this.nextInt(); }
    nextDouble() {
      const val = parseFloat(this.next());
      return isNaN(val) ? 0.0 : val;
    }
    nextFloat() { return this.nextDouble(); }
    nextBoolean() {
      return this.next().toLowerCase() === 'true';
    }
    hasNext() {
      this._ensureTokens();
      return inputTokens.length > 0;
    }
    hasNextInt() {
      this._ensureTokens();
      return inputTokens.length > 0 && !isNaN(parseInt(inputTokens[0], 10));
    }
    close() {}
  }

  class BufferedReader {
    constructor(reader) { this.reader = reader; }
    readLine() { return requestInputFromConsole().replace(/\r?\n$/, ''); }
    close() {}
  }

  class InputStreamReader {
    constructor(stream) { this.stream = stream; }
  }

  class StringBuffer {
    constructor(init = '') { this._s = String(init); }
    append(v) { this._s += String(v); return this; }
    insert(offset, v) { this._s = this._s.slice(0, offset) + String(v) + this._s.slice(offset); return this; }
    delete(start, end) { this._s = this._s.slice(0, start) + this._s.slice(end); return this; }
    reverse() { this._s = this._s.split('').reverse().join(''); return this; }
    charAt(idx) { return this._s.charAt(idx); }
    setCharAt(idx, ch) { this._s = this._s.slice(0, idx) + ch + this._s.slice(idx + 1); }
    toString() { return this._s; }
    get length() { return this._s.length; }
    length() { return this._s.length; }
  }
  const StringBuilder = StringBuffer;

  const System = {
    in: 'System.in',
    out: {
      println: (...args) => {
        if (args.length === 0) post('out', '\n');
        else post('out', args.map(a => (a === null ? 'null' : String(a))).join('') + '\n');
      },
      print: (...args) => {
        post('out', args.map(a => (a === null ? 'null' : String(a))).join(''));
      },
      printf: (fmt, ...args) => {
        post('out', formatJavaPrintf(fmt, ...args));
      }
    },
    err: {
      println: (...args) => {
        post('err', args.map(a => (a === null ? 'null' : String(a))).join('') + '\n');
      },
      print: (...args) => {
        post('err', args.map(a => (a === null ? 'null' : String(a))).join(''));
      }
    },
    currentTimeMillis: () => Date.now(),
    nanoTime: () => performance.now() * 1e6
  };

  const Arrays = {
    sort: (arr, comp) => {
      if (typeof comp === 'function') arr.sort(comp);
      else arr.sort((a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b)));
    },
    toString: (arr) => '[' + (Array.isArray(arr) ? arr.join(', ') : String(arr)) + ']',
    fill: (arr, val) => { if (Array.isArray(arr)) arr.fill(val); },
    equals: (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }
  };

  class ArrayList extends Array {
    add(item) { super.push(item); return true; }
    get(idx) { return this[idx]; }
    set(idx, item) { const old = this[idx]; this[idx] = item; return old; }
    size() { return this.length; }
    remove(itemOrIdx) {
      if (typeof itemOrIdx === 'number') return this.splice(itemOrIdx, 1)[0];
      const idx = this.indexOf(itemOrIdx);
      if (idx !== -1) { this.splice(idx, 1); return true; }
      return false;
    }
    contains(item) { return this.includes(item); }
    isEmpty() { return this.length === 0; }
    clear() { this.length = 0; }
    toArray() { return [...this]; }
  }

  const Integer = {
    parseInt: (s) => parseInt(s, 10),
    toString: (n) => String(n),
    valueOf: (v) => parseInt(v, 10),
    MAX_VALUE: 2147483647,
    MIN_VALUE: -2147483648
  };
  const Double = {
    parseDouble: (s) => parseFloat(s),
    toString: (n) => String(n),
    valueOf: (v) => parseFloat(v),
    MAX_VALUE: Number.MAX_VALUE,
    MIN_VALUE: Number.MIN_VALUE
  };
  const Float = Double;
  const Long = Integer;
  const Short = Integer;
  const Byte = Integer;

  const Character = {
    isDigit: (c) => /\d/.test(String(c)),
    isLetter: (c) => /[a-zA-Z]/.test(String(c)),
    isWhitespace: (c) => /\s/.test(String(c)),
    toUpperCase: (c) => String(c).toUpperCase(),
    toLowerCase: (c) => String(c).toLowerCase()
  };

  // --- AWT & Swing GUI Emulation (TYBCA Syllabus) ---
  class Component {
    constructor() {
      this.listeners = [];
      this.width = 0;
      this.height = 0;
    }
    addActionListener(l) { this.listeners.push(l); }
    addItemListener(l) { this.listeners.push(l); }
    addMouseListener(l) { this.listeners.push(l); }
    addKeyListener(l) { this.listeners.push(l); }
    addWindowListener(l) { this.listeners.push(l); }
    setSize(w, h) { this.width = typeof w === 'object' ? w.width : w; this.height = typeof w === 'object' ? w.height : h; }
    setBounds(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
    setBackground(c) { this.bg = c; }
    setForeground(c) { this.fg = c; }
    setFont(f) { this.font = f; }
    setVisible(b) {}
    repaint() {}
    validate() {}
  }

  function serializeComp(c) {
    if (!c) return null;
    const type = c.constructor?.name || 'Component';
    const res = {
      type,
      text: c.text !== undefined ? String(c.text) : '',
      pos: c._pos || '',
      cols: c.cols || 0,
      rows: c.rows || 0,
      selected: Boolean(c.selected),
      items: c.items ? [...c.items] : []
    };
    if (c.layout) {
      res.layout = {
        type: c.layout.constructor?.name || 'FlowLayout',
        rows: c.layout.rows,
        cols: c.layout.cols
      };
    }
    if (Array.isArray(c.components)) {
      res.children = c.components.map(serializeComp).filter(Boolean);
    }
    return res;
  }

  class JFrame extends Component {
    constructor(title = 'Java Application') {
      super();
      this.title = title;
      this.components = [];
      this.width = 400;
      this.height = 300;
    }
    setTitle(t) { this.title = t; }
    getTitle() { return this.title; }
    getWidth() { return this.width; }
    getHeight() { return this.height; }
    setLayout(layout) { this.layout = layout; }
    add(comp, pos) {
      if (!comp) return;
      if (typeof pos === 'string') comp._pos = pos;
      else if (pos && pos.toString) comp._pos = pos.toString();
      this.components.push(comp);
    }
    remove(comp) {
      const idx = this.components.indexOf(comp);
      if (idx !== -1) this.components.splice(idx, 1);
    }
    getContentPane() { return this; }
    pack() {}
    dispose() { post('out', `[GUI Window Closed: "${this.title}"]\n`); }
    show() { this.setVisible(true); }
    hide() { this.setVisible(false); }
    setVisible(b) {
      if (b) {
        post('out', `\n╔══════════════════════════════════════════════════════╗\n`);
        post('out', `║ GUI Window: "${this.title || 'Java GUI Application'}"\n`);
        post('out', `║ Dimensions: ${this.width} x ${this.height} | Layout: ${this.layout ? this.layout.constructor.name : 'Default'}\n`);
        post('out', `╠══════════════════════════════════════════════════════╣\n`);
        if (this.components.length === 0) {
          post('out', `║ (No child components added yet)\n`);
        } else {
          for (const c of this.components) {
            if (c && c.text !== undefined) post('out', `║  • [${c.constructor.name}: "${c.text}"]\n`);
            else if (c && c.constructor) post('out', `║  • [${c.constructor.name}]\n`);
          }
        }
        post('out', `╚══════════════════════════════════════════════════════╝\n`);
        post('out', `✓ GUI application launched successfully in simulated environment.\n`);

        const winData = {
          title: this.title || 'Java Application Frame',
          width: this.width || 380,
          height: this.height || 280,
          layout: this.layout ? {
            type: this.layout.constructor?.name || 'FlowLayout',
            rows: this.layout.rows,
            cols: this.layout.cols
          } : { type: 'FlowLayout' },
          components: this.components.map(serializeComp).filter(Boolean)
        };
        post('gui_window', winData);
      }
    }
    setDefaultCloseOperation(op) {}
  }
  const Frame = JFrame;

  class JPanel extends Component {
    constructor(layout) {
      super();
      this.components = [];
      this.layout = layout;
    }
    setLayout(l) { this.layout = l; }
    add(c, pos) {
      if (!c) return;
      if (typeof pos === 'string') c._pos = pos;
      else if (pos && pos.toString) c._pos = pos.toString();
      this.components.push(c);
    }
  }
  const Panel = JPanel;

  class JLabel extends Component {
    constructor(text = '') { super(); this.text = String(text); }
    setText(t) { this.text = String(t); }
    getText() { return this.text; }
  }
  const Label = JLabel;

  class JTextField extends Component {
    constructor(text = '', cols = 10) {
      super();
      this.text = typeof text === 'number' ? '' : String(text);
      this.cols = typeof text === 'number' ? text : cols;
    }
    setText(t) { this.text = String(t); }
    getText() { return this.text || ''; }
    setColumns(c) { this.cols = c; }
    getColumns() { return this.cols; }
    setEditable(b) { this.editable = b; }
    isEditable() { return this.editable !== false; }
  }
  const TextField = JTextField;

  class JPasswordField extends JTextField {
    getPassword() { return (this.text || '').split(''); }
  }

  class JButton extends Component {
    constructor(text = '') { super(); this.text = String(text); }
    setText(t) { this.text = String(t); }
    getText() { return this.text; }
    setActionCommand(c) { this.cmd = c; }
    getActionCommand() { return this.cmd || this.text; }
    setEnabled(b) { this.enabled = b; }
    isEnabled() { return this.enabled !== false; }
    doClick() {
      for (const l of this.listeners) {
        if (typeof l === 'function') l(new ActionEvent(this, 0, this.getActionCommand()));
        else if (l && typeof l.actionPerformed === 'function') l.actionPerformed(new ActionEvent(this, 0, this.getActionCommand()));
      }
    }
  }
  const Button = JButton;

  class JCheckBox extends Component {
    constructor(text = '', sel = false) { super(); this.text = String(text); this.selected = Boolean(sel); }
    isSelected() { return this.selected; }
    setSelected(s) { this.selected = Boolean(s); }
    getState() { return this.selected; }
    setState(s) { this.selected = Boolean(s); }
    getText() { return this.text; }
  }
  const Checkbox = JCheckBox;

  class CheckboxGroup {
    constructor() { this.selected = null; }
    setSelectedCheckbox(c) { this.selected = c; }
    getSelectedCheckbox() { return this.selected; }
  }

  class JRadioButton extends JCheckBox {}

  class Choice extends Component {
    constructor() { super(); this.items = []; }
    add(i) { this.items.push(String(i)); }
    addItem(i) { this.add(i); }
    getSelectedItem() { return this.items[0] || ''; }
    getSelectedIndex() { return 0; }
  }
  const JComboBox = Choice;

  class TextArea extends Component {
    constructor(text = '', r = 5, c = 20) { super(); this.text = String(text); this.rows = r; this.cols = c; }
    append(t) { this.text += String(t); }
    setText(t) { this.text = String(t); }
    getText() { return this.text; }
  }
  const JTextArea = TextArea;

  class JScrollPane extends Component {
    constructor(comp) { super(); this.comp = comp; }
  }

  class ButtonGroup {
    constructor() { this.buttons = []; }
    add(b) { this.buttons.push(b); }
  }

  class JList extends Component {
    constructor(items = []) { super(); this.items = items; }
    getSelectedValue() { return this.items[0] || ''; }
  }
  const List = JList;

  class Color {
    static red = '#ff4d4f'; static green = '#52c41a'; static blue = '#1890ff';
    static yellow = '#fadb14'; static black = '#000000'; static white = '#ffffff';
    static gray = '#8c8c8c'; static cyan = '#13c2c2'; static magenta = '#eb2f96';
    static orange = '#fa8c16'; static pink = '#ffadd2';
    constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
  }

  class Font {
    static PLAIN = 0; static BOLD = 1; static ITALIC = 2;
    constructor(name, style, size) { this.name = name; this.style = style; this.size = size; }
  }

  class Dimension {
    constructor(w, h) { this.width = w; this.height = h; }
  }
  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
  }
  class Insets {
    constructor(top = 0, left = 0, bottom = 0, right = 0) { this.top = top; this.left = left; this.bottom = bottom; this.right = right; }
  }

  class FlowLayout {
    static LEFT = 0; static CENTER = 1; static RIGHT = 2;
    constructor(align = 1, hgap = 5, vgap = 5) { this.align = align; this.hgap = hgap; this.vgap = vgap; }
  }
  class BorderLayout {
    static NORTH = 'North';
    static SOUTH = 'South';
    static EAST = 'East';
    static WEST = 'West';
    static CENTER = 'Center';
    constructor(hgap = 0, vgap = 0) { this.hgap = hgap; this.vgap = vgap; }
  }
  class GridLayout {
    constructor(r = 1, c = 1, hgap = 0, vgap = 0) { this.rows = r; this.cols = c; this.hgap = hgap; this.vgap = vgap; }
  }
  class CardLayout {
    constructor() {}
    show(parent, name) {}
  }

  // --- Events & Listeners ---
  class ActionEvent {
    constructor(source, id = 0, cmd = '') {
      this.source = source;
      this.id = id;
      this.command = cmd || source?.text || '';
    }
    getSource() { return this.source; }
    getActionCommand() { return this.command; }
  }
  class ActionListener {}

  class ItemEvent {
    constructor(source, item) { this.source = source; this.item = item; }
    getSource() { return this.source; }
    getItem() { return this.item; }
  }
  class ItemListener {}

  class MouseEvent {
    constructor(source, x = 0, y = 0) { this.source = source; this.x = x; this.y = y; }
    getSource() { return this.source; }
    getX() { return this.x; }
    getY() { return this.y; }
  }
  class MouseListener {}
  class MouseAdapter extends MouseListener {}

  class WindowEvent {
    constructor(source) { this.source = source; }
    getSource() { return this.source; }
  }
  class WindowListener {}
  class WindowAdapter extends WindowListener {}

  // --- JDBC Database Emulation (TYBCA Syllabus) ---
  class ResultSet {
    constructor(rows = []) {
      this.rows = rows;
      this.cursor = -1;
    }
    next() {
      this.cursor++;
      return this.cursor < this.rows.length;
    }
    getInt(col) {
      const row = this.rows[this.cursor];
      return row ? parseInt(row[col] ?? row[col.toLowerCase()] ?? 0, 10) : 0;
    }
    getString(col) {
      const row = this.rows[this.cursor];
      return row ? String(row[col] ?? row[col.toLowerCase()] ?? '') : '';
    }
    getDouble(col) {
      const row = this.rows[this.cursor];
      return row ? parseFloat(row[col] ?? row[col.toLowerCase()] ?? 0) : 0.0;
    }
    close() {}
  }

  class Statement {
    executeUpdate(sql) {
      post('out', `[JDBC] Executed Update: ${sql}\n`);
      return 1;
    }
    executeQuery(sql) {
      post('out', `[JDBC] Executed Query: ${sql}\n`);
      return new ResultSet([
        { roll_no: 101, name: 'Tahir Mansuri', course: 'TYBCA', marks: 88 },
        { roll_no: 102, name: 'Pratik Hajare', course: 'TYBCA', marks: 82 },
        { roll_no: 103, name: 'Prerana Pawar', course: 'TYBCA', marks: 91 },
        { roll_no: 104, name: 'Sandesh Marathe', course: 'TYBCA', marks: 85 },
        { roll_no: 105, name: 'Juned Khan', course: 'TYBCA', marks: 90 }
      ]);
    }
    close() {}
  }

  class PreparedStatement extends Statement {
    constructor(sql) { super(); this.sql = sql; this.params = {}; }
    setInt(idx, val) { this.params[idx] = val; }
    setString(idx, val) { this.params[idx] = val; }
    setDouble(idx, val) { this.params[idx] = val; }
    executeUpdate() {
      post('out', `[JDBC] Executed Prepared Update: ${this.sql}\n`);
      return 1;
    }
    executeQuery() {
      return super.executeQuery(this.sql);
    }
  }

  class Connection {
    createStatement() { return new Statement(); }
    prepareStatement(sql) { return new PreparedStatement(sql); }
    close() {
      post('out', `[JDBC] Database Connection closed.\n`);
    }
  }

  const DriverManager = {
    getConnection: (url, user = 'root', pass = '') => {
      post('out', `[JDBC] Connecting to database: ${url}\n`);
      post('out', `[JDBC] Connected as user: ${user}\n`);
      return new Connection();
    }
  };

  const Class = {
    forName: (driverName) => {
      post('out', `[JDBC] Registered driver: ${driverName}\n`);
      return true;
    }
  };

  return {
    System,
    Scanner,
    BufferedReader,
    InputStreamReader,
    StringBuffer,
    StringBuilder,
    Arrays,
    ArrayList,
    List: ArrayList,
    Vector: ArrayList,
    Integer,
    Double,
    Float,
    Long,
    Short,
    Byte,
    Character,
    Math: globalThis.Math,
    String: StringClass,
    __cmd_args__: ["Tahir", "Mansuri", "InfoGalaxy", "Computers", "100"],
    // Exceptions
    Exception,
    RuntimeException,
    ArithmeticException,
    NullPointerException,
    ArrayIndexOutOfBoundsException,
    IndexOutOfBoundsException,
    NumberFormatException,
    IllegalArgumentException,
    IOException,
    ClassNotFoundException,
    SQLException,
    Throwable,
    // Swing & AWT
    JFrame,
    Frame,
    JPanel,
    Panel,
    JLabel,
    Label,
    JTextField,
    TextField,
    JPasswordField,
    JButton,
    Button,
    JCheckBox,
    Checkbox,
    CheckboxGroup,
    JRadioButton,
    Choice,
    JComboBox,
    TextArea,
    JTextArea,
    JScrollPane,
    ButtonGroup,
    JList,
    FlowLayout,
    BorderLayout,
    GridLayout,
    CardLayout,
    Color,
    Font,
    Dimension,
    Point,
    Insets,
    // Events & Listeners
    ActionEvent,
    ActionListener,
    ItemEvent,
    ItemListener,
    MouseEvent,
    MouseListener,
    MouseAdapter,
    WindowEvent,
    WindowListener,
    WindowAdapter,
    // JDBC
    DriverManager,
    Connection,
    Statement,
    PreparedStatement,
    ResultSet,
    Class,
    __float: (v) => {
      const n = new Number(v);
      n.__isFloat = true;
      return n;
    }
  };
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'Java (JDK) offline runtime ready');
    post('ready');
    return;
  }

  if (data.type === 'run') {
    const javaCode = data.code || '';
    queue = (data.stdin || '').split('\n').filter(Boolean);

    // 1. Syntax & Pre-compilation Validation Layer
    const syntaxErrors = validateJavaCode(javaCode);
    if (syntaxErrors.length > 0) {
      for (const err of syntaxErrors) {
        post('err', err);
      }
      post('done');
      return;
    }

    try {
      const { js } = parseAndTranspileJava(javaCode);
      const env = createJavaEnvironment();
      const envKeys = Object.keys(env);
      const envVals = Object.values(env);

      const runner = new Function(...envKeys, js);
      runner(...envVals);
    } catch (e) {
      const msg = String(e?.message || e);
      post('err', `Main.java: error: ${msg}\n`);
    }

    post('done');
  }
};

