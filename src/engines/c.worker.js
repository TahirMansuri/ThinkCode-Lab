// C (C99) worker: Real ANSI/C99 WebAssembly interpreter (PicoC) running 100% offline.
let pc = null, base = '', queue = [], charBuffer = [];
let status = null, dataLen = null, dataBuf = null;
const dec = new TextDecoder();
const post = (t, s) => postMessage({ t, s });

function createPicocInstance() {
  return globalThis.Picoc({
    stdin: () => {
      if (charBuffer.length > 0) {
        return charBuffer.shift().charCodeAt(0);
      }
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
          for (let i = 0; i < text.length; i++) charBuffer.push(text[i]);
          return charBuffer.shift()?.charCodeAt(0) ?? null;
        }
        Atomics.store(status, 0, 0);
        return null;
      }
      // Fallback: Pre-buffered input queue
      if (queue.length > 0) {
        const text = queue.shift() + '\n';
        for (let i = 0; i < text.length; i++) charBuffer.push(text[i]);
        return charBuffer.shift()?.charCodeAt(0) ?? null;
      }
      return null;
    },
    quit: (exitCode) => {
      // Catch exit or runtime crash without terminating the worker
    }
  });
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
      pc = createPicocInstance();
      pc.onRuntimeInitialized = () => {
        post('ready');
      };
    } catch (e) {
      post('fatal', 'C runtime failed to load: ' + e);
    }
    return;
  }

  if (data.type === 'run') {
    queue = (data.stdin || '').split('\n').filter(Boolean);
    charBuffer = [];
    let hadError = false;

    try {
      pc.runc(data.code, (msg) => {
        // PicoC outputs errors with line and column markers
        if (typeof msg === 'string' && (msg.includes('error:') || msg.includes('undefined') || msg.includes('Syntax error'))) {
          hadError = true;
          post('err', msg + '\n');
        } else {
          post('out', msg + '\n');
        }
      });
    } catch (e) {
      post('err', String(e.message || e) + '\n');
    }

    post('done');
  }
};
