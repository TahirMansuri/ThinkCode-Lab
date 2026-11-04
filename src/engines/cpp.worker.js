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

function prepareCppCode(cppCode) {
  let c = cppCode;
  c = c.replace(/#include\s*<string>/g, '');
  if (/\bstring\b/.test(c) && !/typedef\s+char\s+string\b/.test(c)) {
    c = 'typedef char string[256];\n' + c;
  }
  return c;
}

function runCppOop(cppCode) {
  let code = cppCode;

  // Strip headers and namespace
  code = code.replace(/#include\s*<[^>]+>/g, '');
  code = code.replace(/using\s+namespace\s+std\s*;/g, '');
  code = code.replace(/\b(public|private|protected)\s*:/g, '');

  const classNames = [];
  const classRegex = /\bclass\s+([A-Za-z_]\w*)(?:\s*:\s*public\s+([A-Za-z_]\w*))?\s*\{/g;
  let m;
  while ((m = classRegex.exec(code)) !== null) {
    classNames.push(m[1]);
  }

  // Rewrite constructors
  for (const cName of classNames) {
    const ctorRe = new RegExp('\\b' + cName + '\\s*\\(([^)]*)\\)\\s*\\{', 'g');
    code = code.replace(ctorRe, (match, params) => `constructor(${stripTypes(params)}) {`);
  }

  // Class fields
  code = code.replace(/\b(?:int|float|double|char|string|bool|long)\s+([A-Za-z_]\w*)\s*;/g, '$1;');

  // Methods and functions
  code = code.replace(/\b(?:void|int|float|double|char|string|bool|long)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g, (match, name, params) => {
    if (name === 'main') return 'function main() {';
    return `${name}(${stripTypes(params)}) {`;
  });

  // Object instantiations
  for (const cName of classNames) {
    const instWithArgs = new RegExp('\\b' + cName + '\\s+([A-Za-z_]\\w*)\\s*\\(([^)]*)\\)\\s*;', 'g');
    code = code.replace(instWithArgs, 'let $1 = new ' + cName + '($2);');

    const instNoArgs = new RegExp('\\b' + cName + '\\s+([A-Za-z_]\\w*)\\s*;', 'g');
    code = code.replace(instNoArgs, 'let $1 = new ' + cName + '();');
  }

  // cout << a << b << endl;
  code = code.replace(/cout\s*<<\s*([^;]+);/g, (match, exprs) => {
    const parts = exprs.split('<<').map(s => s.trim());
    const jsArgs = parts.map(p => {
      if (p === 'endl') return '"\\n"';
      return p;
    });
    return `cout.print(${jsArgs.join(', ')});`;
  });

  // cin >> a >> b;
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
    const cppCode = data.code || '';
    queue = (data.stdin || '').split('\n').filter(Boolean);
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
      post('err', String(e.message || e) + '\n');
    }

    post('done');
  }
};
