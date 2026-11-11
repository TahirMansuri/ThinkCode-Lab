// Classic worker: real CPython 3.12 (Pyodide) running fully offline with runtime interactive input.
let py = null, base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
let nativeStdin = false;
const post = (t, s) => postMessage({ t, s });
const dec = new TextDecoder();
const clean = m => { const i = m.indexOf('  File "<exec>"'); return i > 0 ? 'Traceback (most recent call last):\n' + m.slice(i) : m; };

function readNativeStdinSync() {
  post('need_input');
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', base + '__native_stdin?ts=' + Date.now(), false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send('{}');
    if (xhr.status === 200 && xhr.responseText) {
      const res = JSON.parse(xhr.responseText);
      if (!res.cancelled) return String(res.text ?? '');
    }
  } catch (_) {}
  return null;
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    nativeStdin = Boolean(data.nativeStdin);
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'Loading Python runtime…');
    try {
      importScripts(base + 'pyodide/pyodide.js');
      py = await loadPyodide({ indexURL: base + 'pyodide/' });
      py.setStdout({ write: b => { post('out', dec.decode(b, { stream: true })); return b.length; } });
      py.setStderr({ write: b => { post('err', dec.decode(b, { stream: true })); return b.length; } });
      py.setStdin({
        isatty: true,
        stdin: () => {
          // Priority 1: Interactive in-console input via SharedArrayBuffer
          if (status) {
            post('need_input');
            Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
            Atomics.wait(status, 0, 1);
            if (Atomics.load(status, 0) === 2) { // 2 = INPUT_READY
              const len = Atomics.load(dataLen, 0);
              const copy = new Uint8Array(len);
              copy.set(dataBuf.subarray(0, len));
              const text = dec.decode(copy);
              Atomics.store(status, 0, 0);
              return text + '\n';
            }
            Atomics.store(status, 0, 0);
            return null;
          }
          // Priority 2: Android WebView Native Stdin Bridge
          if (nativeStdin) {
            const val = readNativeStdinSync();
            return val === null ? null : val + '\n';
          }
          // Fallback only if SharedArrayBuffer and Native Stdin Bridge are unavailable
          if (queue.length > 0) return queue.shift() + '\n';
          return null;
        }
      });
      post('ready');
    } catch (e) { post('fatal', 'Python runtime failed to load: ' + e); }
    return;
  }
  if (data.type === 'run') {
    queue = (data.stdin || '').split('\n').filter(Boolean);
    try { await py.runPythonAsync(data.code); }
    catch (e) { post('err', clean(String(e.message || e)) + '\n'); }
    post('done');
  }
};
