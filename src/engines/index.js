// Engine registry. Every engine exposes: load(sink), run(code, stdin, sink) -> Promise, stop(), extra(type, sink).
import { Shell } from './shell.js';

const BASE = new URL('./', document.baseURI).href;

// SharedArrayBuffer for real-time interactive stdin between Main UI thread and Web Workers
const hasShared = typeof SharedArrayBuffer !== 'undefined';
let sharedCtrl = null, sharedData = null;
try {
  if (hasShared) {
    sharedCtrl = new SharedArrayBuffer(8); // Int32Array: [status, length]
    sharedData = new SharedArrayBuffer(4096); // Uint8Array UTF-8 payload
  }
} catch (e) {
  console.warn('SharedArrayBuffer disabled (requires crossOriginIsolated):', e);
}

class WorkerEngine {
  constructor(factory, label) {
    this.factory = factory;
    this.label = label;
    this.w = null;
    this.ready = null;
    this.cb = null;
    this.finish = null;
    this.readyReject = null;
    this.q = null;
    this.isReady = false;
  }
  spawn(sink) {
    this.w = this.factory();
    this.isReady = false;
    this.ready = new Promise((ok, no) => {
      this.readyReject = no;
      this.w.onmessage = ({ data: d }) => {
        if (d.t === 'ready') {
          this.isReady = true;
          ok();
        }
        else if (d.t === 'fatal') {
          this.isReady = false;
          no(new Error(d.s));
        }
        else if (d.t === 'status') (this.cb || sink)?.status?.(d.s);
        else if (d.t === 'done') { this.finish?.(); this.finish = null; }
        else if (d.t === 'table') (this.cb || sink).table?.(d.columns, d.rows);
        else if (d.t === 'need_input') (this.cb || sink).need_input?.(d.s);
        else if (d.t === 'prompt_modal') (this.cb || sink).prompt_modal?.(d.s, d);
        else if (d.t === 'alert_modal') (this.cb || sink).alert_modal?.(d.s, d);
        else (this.cb || sink)[d.t]?.(d.s);
      };
      this.w.onerror = e => {
        this.isReady = false;
        no(new Error(e.message || 'Worker crashed'));
      };
      this.w.postMessage({
        type: 'init',
        base: BASE,
        sharedCtrl,
        sharedData
      });
    });
    this.ready.catch(() => { this.isReady = false; });
  }
  async load(sink) { if (!this.w) this.spawn(sink); await this.ready; }
  chain(fn) { const p = (this.q || Promise.resolve()).then(fn, fn); this.q = p.catch(() => {}); return p; }
  run(code, stdin, sink, opts) {
    return this.chain(async () => {
      this.cb = sink;
      await this.load(sink);
      return new Promise(res => {
        this.finish = res;
        this.w?.postMessage({ type: 'run', code, stdin, opts });
      });
    });
  }
  sendInput(text) {
    if (sharedCtrl && sharedData) {
      const enc = new TextEncoder().encode(text);
      new Uint8Array(sharedData).set(enc);
      const ctrl = new Int32Array(sharedCtrl);
      Atomics.store(ctrl, 1, enc.length);
      Atomics.store(ctrl, 0, 2); // 2 = INPUT_READY
      Atomics.notify(ctrl, 0, 1);
    }
  }
  sendPromptResponse(value) {
    this.w?.postMessage({ type: 'prompt_response', value });
    if (sharedCtrl && sharedData) {
      if (value === null) {
        const ctrl = new Int32Array(sharedCtrl);
        Atomics.store(ctrl, 0, 0); // cancelled / null
        Atomics.notify(ctrl, 0, 1);
      } else {
        const enc = new TextEncoder().encode(String(value));
        new Uint8Array(sharedData).set(enc);
        const ctrl = new Int32Array(sharedCtrl);
        Atomics.store(ctrl, 1, enc.length);
        Atomics.store(ctrl, 0, 2); // 2 = INPUT_READY
        Atomics.notify(ctrl, 0, 1);
      }
    }
  }
  extra(type, sink, payload = {}) {
    return this.chain(async () => {
      this.cb = sink;
      await this.load(sink);
      return new Promise(res => {
        this.finish = res;
        this.w?.postMessage({ type, ...payload });
      });
    });
  }
  stop(sink) {
    if (!this.w) return;
    if (sharedCtrl) {
      const ctrl = new Int32Array(sharedCtrl);
      Atomics.store(ctrl, 0, 3); // 3 = CANCEL / STOP
      Atomics.notify(ctrl, 0, 1);
    }
    const worker = this.w;
    this.w = null;
    this.ready = null;
    this.q = null;
    this.isReady = false;
    try { worker.terminate(); } catch (_) {}
    this.readyReject?.(new Error('Stopped'));
    this.readyReject = null;
    this.finish?.();
    this.finish = null;
    sink?.err?.('\n■ Stopped. The runtime restarts on the next run.\n');
  }
}

class ShellEngine {
  constructor() { this.sh = new Shell(); }
  get isReady() { return true; }
  async load() {}
  async run(code, stdin, sink) { this.sh.run(code, sink, stdin); }
  exec(line, sink) { this.sh.run(line, sink); }
  stop() {}
  async extra(type, sink) { if (type === 'reset') { this.sh.reset(); sink.out('Filesystem reset.\n'); } }
}

class WebEngine {
  get isReady() { return true; }
  async load() {}
  async run(code, _stdin, sink) { sink.preview(code); sink.out('Preview updated. Open the Preview tab.\n'); }
  stop() {}
  async extra() {}
}

export const engines = {
  python: new WorkerEngine(() => new Worker(new URL('./python.worker.js', import.meta.url)), 'Python 3.12'),
  js: new WorkerEngine(() => new Worker(new URL('./js.worker.js', import.meta.url)), 'JavaScript'),
  sql: new WorkerEngine(() => new Worker(new URL('./sql.worker.js', import.meta.url)), 'Oracle SQL'),
  php: new WorkerEngine(() => new Worker(new URL('./php.worker.js', import.meta.url)), 'PHP 8.2'),
  shell: new ShellEngine(),
  web: new WebEngine()
};
