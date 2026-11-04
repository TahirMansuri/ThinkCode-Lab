// Classic worker: sandboxed JavaScript runner with console + runtime prompt() support.
let status = null, dataLen = null, dataBuf = null;
const post = (t, s) => postMessage({ t, s });
const dec = new TextDecoder();
const show = v => {
  if (typeof v === 'string') return v;
  try { if (typeof v !== 'object' || v === null) return String(v); const c = JSON.stringify(v); return c.length <= 80 ? c : JSON.stringify(v, null, 2); } catch { return String(v); }
};
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;

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
  if (data.type !== 'run') return;
  const lines = (data.stdin || '').split('\n').filter(Boolean);
  const promptFn = msg => {
    if (status) {
      if (msg) post('out', msg + ' ');
      post('need_input', msg);
      Atomics.store(status, 0, 1);
      Atomics.wait(status, 0, 1);
      if (Atomics.load(status, 0) === 2) {
        const len = Atomics.load(dataLen, 0);
        const copy = new Uint8Array(len);
        copy.set(dataBuf.subarray(0, len));
        const text = dec.decode(copy);
        Atomics.store(status, 0, 0);
        return text;
      }
      Atomics.store(status, 0, 0);
      return null;
    }
    if (lines.length) return lines.shift();
    return null;
  };
  const w = k => (...a) => post(k, a.map(show).join(' ') + '\n');
  const con = { log: w('out'), info: w('out'), debug: w('out'), warn: w('err'), error: w('err'),
    table: d => post('out', show(d) + '\n') };
  try { await new AsyncFn('console', 'prompt', data.code)(con, promptFn); }
  catch (e) { post('err', `${e && e.name || 'Error'}: ${e && e.message || e}\n`); }
  post('done');
};
