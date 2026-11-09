// C (C99) worker: Offline ANSI/C99 WebAssembly interpreter (PicoC) with isolated per-run instances & interactive stdin.
let base = '';
let readyInstance = null;
let warmingPromise = null;
let status = null, dataLen = null, dataBuf = null;
const enc = new TextEncoder();
const dec = new TextDecoder();
const post = (t, s) => postMessage({ t, s });

function preprocessCCode(code) {
  if (!code || typeof code !== 'string') return '';
  let out = '';
  let i = 0;
  const n = code.length;
  const hasStdio = /^\s*#\s*include\s*[<"]stdio\.h[>"]/m.test(code);

  // Strip conio.h + normalize long long & %ll* outside/inside strings cleanly
  while (i < n) {
    const ch = code[i];

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      if (end === -1) { out += code.slice(i); break; }
      out += code.slice(i, end);
      i = end;
      continue;
    }

    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      if (end === -1) { out += code.slice(i); break; }
      out += code.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // String literal: fix %lld -> %ld etc. (avoiding %%lld)
    if (ch === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"') {
        if (code[j] === '\\') j++;
        j++;
      }
      if (j < n) j++;
      const strLit = code.slice(i, j).replace(
        /((?:^|[^%])(?:%%)*)%((?:[-+ #0*]|\d|\.)*)ll([diouxX])/g,
        '$1%$2l$3'
      );
      out += strLit;
      i = j;
      continue;
    }

    // Char literal
    if (ch === "'") {
      let j = i + 1;
      while (j < n && code[j] !== "'") {
        if (code[j] === '\\') j++;
        j++;
      }
      if (j < n) j++;
      out += code.slice(i, j);
      i = j;
      continue;
    }

    // Preprocessor #include <conio.h>
    if (ch === '#') {
      const lineEnd = code.indexOf('\n', i);
      const rawLine = lineEnd === -1 ? code.slice(i) : code.slice(i, lineEnd);
      if (/^#\s*include\s*<\s*conio\.h\s*>/.test(rawLine)) {
        // Keep blank line so compile diagnostic line numbers stay exact
        i = lineEnd === -1 ? n : lineEnd;
        continue;
      }
      out += rawLine;
      i = lineEnd === -1 ? n : lineEnd;
      continue;
    }

    // Identifier / keyword check
    if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
      let j = i + 1;
      while (j < n && /[\w]/.test(code[j])) j++;
      const rest = code.slice(i);
      const llMatch = rest.match(/^(?:(unsigned|signed)\s+)?long\s+long(?:\s+int)?\b/);
      if (llMatch) {
        out += (llMatch[1] ? llMatch[1] + ' ' : '') + 'long';
        i += llMatch[0].length;
        continue;
      }
      out += code.slice(i, j);
      i = j;
      continue;
    }

    out += ch;
    i++;
  }

  // Inject setbuf(stdout, 0); at start of main() when <stdio.h> is included so prompts before scanf flush immediately
  if (hasStdio) {
    let injected = false;
    let scan = 0;
    let inStr = false, inChr = false, inLC = false, inBC = false;
    while (scan < out.length) {
      const c = out[scan], nx = out[scan + 1] || '';
      if (inLC) { if (c === '\n') inLC = false; scan++; continue; }
      if (inBC) { if (c === '*' && nx === '/') { inBC = false; scan += 2; continue; } scan++; continue; }
      if (inStr) { if (c === '\\') scan += 2; else { if (c === '"') inStr = false; scan++; } continue; }
      if (inChr) { if (c === '\\') scan += 2; else { if (c === "'") inChr = false; scan++; } continue; }
      if (c === '/' && nx === '/') { inLC = true; scan += 2; continue; }
      if (c === '/' && nx === '*') { inBC = true; scan += 2; continue; }
      if (c === '"') { inStr = true; scan++; continue; }
      if (c === "'") { inChr = true; scan++; continue; }
      if (c === '#') {
        while (scan < out.length && out[scan] !== '\n') {
          if (out[scan] === '\\' && out[scan + 1] === '\n') scan += 2;
          else scan++;
        }
        continue;
      }

      if (c === 'm' && out.startsWith('main', scan) && (scan === 0 || !/\w/.test(out[scan - 1]))) {
        const afterMain = out.slice(scan + 4).match(/^\s*\([^)]*\)\s*\{/);
        if (afterMain) {
          const braceIdx = scan + 4 + afterMain[0].length;
          out = out.slice(0, braceIdx) + ' setbuf(stdout, 0);' + out.slice(braceIdx);
          injected = true;
          break;
        }
      }
      scan++;
    }
    void injected;
  }

  return out;
}

function bytesFromStreamSlice(buffer, offset, length) {
  if (buffer && buffer.buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset + offset, length);
  }
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) arr[i] = buffer[offset + i] & 0xff;
  return arr;
}

function createReadyInstance(activeCtxRef) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let inst = null;
    try {
      const cfg = {
        stdin: () => null,
        stdout: () => {},
        stderr: () => {},
        print: (msg) => {
          const ctx = activeCtxRef.current;
          if (!ctx || msg == null) return;
          const s = String(msg);
          if (ctx.suppressPrint) return;
          if (/(?:error:|undefined|Syntax error|expression expected|file\.c:\d+:\d+)/.test(s)) {
            ctx.onErr(s + '\n');
          } else {
            ctx.onOut(s + '\n');
          }
        },
        printErr: (msg) => {
          const ctx = activeCtxRef.current;
          if (ctx && msg != null) ctx.onErr(String(msg) + '\n');
        },
        quit: () => {
          // Swallow exit()/abort() status so worker remains healthy
        },
        onAbort: (what) => {
          if (!settled) {
            settled = true;
            reject(new Error(String(what || 'C runtime aborted')));
          }
        },
        onRuntimeInitialized: () => {
          if (settled) return;
          settled = true;
          const mod = inst || cfg;
          // Strip Emscripten's custom `.then` so resolving Promises with `mod` never loops as a thenable
          try { if (mod && mod.then) delete mod.then; } catch (_) {}

          // Attach zero-copy stream_ops for unbuffered stdout prompts and single-line-stop stdin reads
          if (mod && mod.FS && mod.FS.streams) {
            const stdinStream = mod.FS.streams[0];
            const stdoutStream = mod.FS.streams[1];
            const stderrStream = mod.FS.streams[2];

            if (stdinStream && stdinStream.stream_ops) {
              stdinStream.stream_ops.read = (stream, buffer, offset, length) => {
                const ctx = activeCtxRef.current;
                if (!ctx || length <= 0) return 0;

                if (ctx.charQueue.length === 0) {
                  const line = ctx.readLine();
                  if (line === null) return 0;
                  const encoded = enc.encode(line + '\n');
                  for (let i = 0; i < encoded.length; i++) ctx.charQueue.push(encoded[i]);
                }

                let bytesRead = 0;
                while (bytesRead < length && ctx.charQueue.length > 0) {
                  const b = ctx.charQueue.shift();
                  buffer[offset + bytesRead] = b;
                  bytesRead++;
                  if (b === 10) break; // Terminate read syscall at newline so C scanf/fgets don't loop!
                }
                if (bytesRead > 0 && stream && stream.node) {
                  stream.node.timestamp = Date.now();
                }
                return bytesRead;
              };
            }

            if (stdoutStream && stdoutStream.stream_ops) {
              stdoutStream.stream_ops.write = (stream, buffer, offset, length) => {
                const ctx = activeCtxRef.current;
                if (ctx && length > 0) {
                  const text = ctx.outDec.decode(bytesFromStreamSlice(buffer, offset, length), { stream: true });
                  if (text) {
                    if (/(?:^|\n)file\.c:\d+:\d+/.test(text)) ctx.onErr(text);
                    else ctx.onOut(text);
                  }
                }
                if (length && stream && stream.node) stream.node.timestamp = Date.now();
                return length;
              };
            }

            if (stderrStream && stderrStream.stream_ops) {
              stderrStream.stream_ops.write = (stream, buffer, offset, length) => {
                const ctx = activeCtxRef.current;
                if (ctx && length > 0) {
                  const text = ctx.errDec.decode(bytesFromStreamSlice(buffer, offset, length), { stream: true });
                  if (text) ctx.onErr(text);
                }
                if (length && stream && stream.node) stream.node.timestamp = Date.now();
                return length;
              };
            }
          }
          resolve(mod);
        }
      };

      inst = globalThis.Picoc(cfg);
      try { if (inst && inst.then) delete inst.then; } catch (_) {}
      if (inst && inst.calledRun && !settled) {
        cfg.onRuntimeInitialized();
      }
    } catch (e) {
      if (!settled) {
        settled = true;
        reject(e);
      }
    }
  });
}

const activeCtxRef = { current: null };

function prewarmNext() {
  if (readyInstance || warmingPromise) return;
  warmingPromise = createReadyInstance(activeCtxRef)
    .then((inst) => {
      readyInstance = inst;
      warmingPromise = null;
      return inst;
    })
    .catch(() => {
      warmingPromise = null;
      return null;
    });
}

async function acquireInstance() {
  if (readyInstance) {
    const inst = readyInstance;
    readyInstance = null;
    return inst;
  }
  if (warmingPromise) {
    const inst = await warmingPromise;
    readyInstance = null;
    if (inst) return inst;
  }
  return await createReadyInstance(activeCtxRef);
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'Loading C (C99) runtime…');
    try {
      importScripts(base + 'picoc/picoc.js');
      readyInstance = await createReadyInstance(activeCtxRef);
      post('ready');
      setTimeout(prewarmNext, 0);
    } catch (e) {
      post('fatal', 'C runtime failed to load: ' + e);
    }
    return;
  }

  if (data.type === 'run') {
    const queue = (data.stdin || '').split('\n');
    if (queue.length > 0 && queue[queue.length - 1] === '') queue.pop();

    const ctx = {
      charQueue: [],
      outDec: new TextDecoder(),
      errDec: new TextDecoder(),
      suppressPrint: false,
      onOut: (s) => post('out', s),
      onErr: (s) => post('err', s),
      readLine: () => {
        if (status) {
          post('need_input');
          Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
          Atomics.wait(status, 0, 1);
          const st = Atomics.load(status, 0);
          Atomics.store(status, 0, 0);
          if (st === 2) {
            const len = Atomics.load(dataLen, 0);
            const copy = new Uint8Array(len);
            copy.set(dataBuf.subarray(0, len));
            return dec.decode(copy);
          }
          return null; // Cancelled / Stopped
        }
        if (queue.length > 0) {
          return queue.shift();
        }
        return null;
      }
    };

    try {
      const inst = await acquireInstance();
      activeCtxRef.current = ctx;
      const cleanCode = preprocessCCode(data.code || '');
      inst.runc(cleanCode, (msg) => {
        if (typeof msg !== 'string') return;
        if (/(?:error:|undefined|Syntax error|expression expected|file\.c:\d+:\d+)/.test(msg)) {
          post('err', msg + '\n');
        } else {
          post('out', msg + '\n');
        }
      });
      const tailOut = ctx.outDec.decode();
      if (tailOut) post('out', tailOut);
      const tailErr = ctx.errDec.decode();
      if (tailErr) post('err', tailErr);
    } catch (e) {
      post('err', String(e && e.message ? e.message : e) + '\n');
    } finally {
      activeCtxRef.current = null;
      setTimeout(prewarmNext, 0);
    }

    post('done');
  }
};
