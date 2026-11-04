// Classic worker: sandboxed JavaScript runner with console + runtime prompt() and alert() support.
let status = null, dataLen = null, dataBuf = null;
let promptResolver = null;
const post = (t, s, extra = {}) => postMessage({ t, s, ...extra });
const dec = new TextDecoder();
const show = v => {
  if (typeof v === 'string') return v;
  try { if (typeof v !== 'object' || v === null) return String(v); const c = JSON.stringify(v); return c.length <= 80 ? c : JSON.stringify(v, null, 2); } catch { return String(v); }
};
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;

function transformPromptCode(code) {
  if (!/(?:window\.)?(?:prompt|alert)\s*\(/.test(code)) return code;

  let transformed = code;
  transformed = transformed.replace(/(?<!\basync\s+)\bfunction\b/g, 'async function');
  transformed = transformed.replace(/(?<!\basync\s*)\(\s*\)\s*=>/g, 'async () =>');
  transformed = transformed.replace(/(?<!\basync\s*)\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g, 'async ($1) =>');
  transformed = transformed.replace(/(?<!\basync\s*)\(([^)]+)\)\s*=>/g, 'async ($1) =>');
  transformed = transformed.replace(/(?<!\bawait\s+)\b(?:window\.)?prompt\s*\(/g, 'await prompt(');
  transformed = transformed.replace(/(?<!\bawait\s+)\b(?:window\.)?alert\s*\(/g, 'await alert(');
  return transformed;
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('ready');
    return;
  }

  if (data.type === 'prompt_response') {
    if (promptResolver) {
      promptResolver(data.value);
      promptResolver = null;
    }
    return;
  }

  if (data.type !== 'run') return;

  const lines = (data.stdin || '').split('\n').filter(Boolean);

  const promptFn = (msg, defaultVal = '') => {
    // 1. Fallback to Program Input box if available
    if (lines.length) {
      const val = lines.shift();
      post('out', `${msg ? String(msg) + ' ' : ''}${val}\n`);
      return status ? val : Promise.resolve(val);
    }

    // 2. If SharedArrayBuffer is available, use Atomics.wait for synchronous blocking
    if (status) {
      post('prompt_modal', String(msg || ''), { defaultVal: String(defaultVal || '') });
      Atomics.store(status, 0, 1);
      Atomics.wait(status, 0, 1);
      if (Atomics.load(status, 0) === 2) {
        const len = Atomics.load(dataLen, 0);
        const copy = new Uint8Array(len);
        copy.set(dataBuf.subarray(0, len));
        const text = dec.decode(copy);
        Atomics.store(status, 0, 0);
        post('out', `${msg ? String(msg) + ' ' : ''}${text}\n`);
        return text;
      }
      Atomics.store(status, 0, 0);
      post('out', `${msg ? String(msg) + ' ' : ''}[cancelled]\n`);
      return null;
    }

    // 3. Async message-based prompt modal (works on mobile web, Cloudflare, Safari, everywhere!)
    return new Promise(resolve => {
      promptResolver = resolve;
      post('prompt_modal', String(msg || ''), { defaultVal: String(defaultVal || '') });
    }).then(res => {
      if (res !== null) {
        post('out', `${msg ? String(msg) + ' ' : ''}${res}\n`);
      } else {
        post('out', `${msg ? String(msg) + ' ' : ''}[cancelled]\n`);
      }
      return res;
    });
  };

  const alertFn = msg => {
    post('out', `[Alert] ${String(msg)}\n`);
    if (status) {
      post('alert_modal', String(msg || ''));
      Atomics.store(status, 0, 1);
      Atomics.wait(status, 0, 1);
      Atomics.store(status, 0, 0);
      return;
    }
    return new Promise(resolve => {
      promptResolver = () => resolve();
      post('alert_modal', String(msg || ''));
    });
  };

  const w = k => (...a) => post(k, a.map(show).join(' ') + '\n');
  const con = {
    log: w('out'), info: w('out'), debug: w('out'), warn: w('err'), error: w('err'),
    table: d => post('out', show(d) + '\n')
  };

  let codeToRun = data.code;
  try {
    const transformed = transformPromptCode(codeToRun);
    new AsyncFn('console', 'prompt', 'alert', transformed);
    codeToRun = transformed;
  } catch (_) {}

  try {
    await new AsyncFn('console', 'prompt', 'alert', codeToRun)(con, promptFn, alertFn);
  } catch (e) {
    post('err', `${e && e.name || 'Error'}: ${e && e.message || e}\n`);
  }
  post('done');
};
