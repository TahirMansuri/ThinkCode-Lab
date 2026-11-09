/**
 * Automated Regression Suite for C (PicoC WASM) & C++ (Unified JSCPP) Workers.
 * Verifies:
 *  - SharedArrayBuffer + Atomics real-time unbuffered prompt ordering & single-line stdin
 *  - Every C & C++ template + syllabus practical (c-1..c-4, cpp-1..cpp-12)
 *  - C & C++ Beautifier (formatCode) round-trip executability
 *  - Error isolation & worker recovery after syntax errors and exit(1)
 *  - Advanced C++ features: OOP constructors/overloads/inheritance, references, pointers, STL string/iomanip, unions
 *  - UI setState() null-safety guard in src/main.js
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const { LANGS } = await import(path.join(root, 'src/languages.js'));
const { PRACTICALS } = await import(path.join(root, 'src/practicals.js'));
const { formatCode } = await import(path.join(root, 'src/formatter.js'));

const cWorkerPath = path.join(root, 'src/engines/c.worker.js');
const cppWorkerPath = path.join(root, 'src/engines/cpp.worker.js');
const picocPath = path.join(root, 'public/picoc/picoc.js');
const jscppPath = path.join(root, 'public/jscpp/jscpp.js');

const cWorkerCode = fs.readFileSync(cWorkerPath, 'utf8');
const cppWorkerCode = fs.readFileSync(cppWorkerPath, 'utf8');
const picocCode = fs.readFileSync(picocPath, 'utf8');
const jscppCode = fs.readFileSync(jscppPath, 'utf8');

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function check(name, fn) {
  try {
    fn();
    ok(name);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}:`, e && e.stack ? e.stack : e);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}:`, e && e.stack ? e.stack : e);
  }
}

// ---------------------------------------------------------------------------
// 1. Structural / UI Guard Checks
// ---------------------------------------------------------------------------
console.log('\n[1/4] UI Guard & Formatter Contract');

check('src/main.js setState() has null-safety guard', () => {
  const mainJs = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  const m = mainJs.match(/function setState\s*\([^)]*\)\s*\{([^}]*)\}/);
  assert.ok(m, 'setState function should exist in src/main.js');
  assert.match(m[1], /if\s*\(\s*!e\s*\)\s*return/, 'setState must return early when #runtimeState is null');
});

// ---------------------------------------------------------------------------
// 2. Real Worker Thread + SharedArrayBuffer Interactive Stdin Streaming Tests
// ---------------------------------------------------------------------------
console.log('\n[2/4] Real SharedArrayBuffer + Atomics Worker Streaming');

function runInteractiveWorker(workerCode, runtimeCode, code, inputs) {
  return new Promise((resolve, reject) => {
    const sharedCtrl = new SharedArrayBuffer(8);
    const sharedData = new SharedArrayBuffer(4096);
    const enc = new TextEncoder();

    // Wrap WebWorker globals inside worker_threads for exact browser parity
    const bootstrap = `
      const { parentPort, workerData } = require('node:worker_threads');
      const vm = require('node:vm');
      const events = [];
      let workerOnMessage = null;
      const sandbox = vm.createContext({
        console,
        setTimeout, clearTimeout,
        TextEncoder, TextDecoder,
        SharedArrayBuffer, Atomics,
        WebAssembly,
        atob: (s) => Buffer.from(s, 'base64').toString('binary'),
        btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
        location: { href: 'http://localhost/' },
        performance,
        importScripts: () => vm.runInContext(workerData.runtimeCode, sandbox),
        postMessage: (msg) => parentPort.postMessage(msg)
      });
      vm.runInContext('this.globalThis = this; this.self = this; var onmessage = null;', sandbox);
      vm.runInContext(workerData.workerCode, sandbox);
      parentPort.on('message', (msg) => {
        sandbox.onmessage({ data: msg });
      });
    `;

    const w = new Worker(bootstrap, {
      eval: true,
      workerData: { workerCode, runtimeCode }
    });

    const events = [];
    let inputIdx = 0;
    const timeout = setTimeout(() => {
      w.terminate();
      reject(new Error('Interactive worker timed out. Events so far: ' + JSON.stringify(events)));
    }, 10000);

    w.on('message', (msg) => {
      events.push(msg);
      if (msg.t === 'ready') {
        w.postMessage({ type: 'run', code, stdin: '' });
      } else if (msg.t === 'need_input') {
        if (inputIdx < inputs.length) {
          const text = inputs[inputIdx++];
          const bytes = enc.encode(text);
          new Uint8Array(sharedData).set(bytes);
          const ctrl = new Int32Array(sharedCtrl);
          Atomics.store(ctrl, 1, bytes.length);
          Atomics.store(ctrl, 0, 2);
          Atomics.notify(ctrl, 0, 1);
        } else {
          // Cancel extra unexpected input requests immediately instead of hanging
          const ctrl = new Int32Array(sharedCtrl);
          Atomics.store(ctrl, 0, 3);
          Atomics.notify(ctrl, 0, 1);
        }
      } else if (msg.t === 'fatal') {
        clearTimeout(timeout);
        w.terminate();
        reject(new Error('Fatal worker error: ' + msg.s));
      } else if (msg.t === 'done') {
        clearTimeout(timeout);
        w.terminate();
        resolve({ events, inputsConsumed: inputIdx });
      }
    });

    w.on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });

    w.postMessage({ type: 'init', base: '', sharedCtrl, sharedData });
  });
}

await checkAsync('C interactive: unbuffered prompt emitted BEFORE single need_input (no 1024-byte loop)', async () => {
  const cTpl = LANGS.find(l => l.id === 'c').tpl;
  const { events, inputsConsumed } = await runInteractiveWorker(cWorkerCode, picocCode, cTpl, ['5']);
  const needIdx = events.findIndex(e => e.t === 'need_input');
  assert.notEqual(needIdx, -1, 'Expected need_input event');
  assert.equal(events.filter(e => e.t === 'need_input').length, 1, 'Expected exactly 1 need_input prompt');
  assert.equal(inputsConsumed, 1);
  const outBeforeInput = events.slice(0, needIdx).filter(e => e.t === 'out').map(e => e.s).join('');
  assert.match(outBeforeInput, /Enter a number:\s*/, 'Prompt must stream before waiting on stdin');
  const fullOut = events.filter(e => e.t === 'out').map(e => e.s).join('');
  const fullErr = events.filter(e => e.t === 'err').map(e => e.s).join('');
  assert.equal(fullErr, '');
  assert.match(fullOut, /Factorial of 5 is 120/);
});

await checkAsync('C multi-input: scanf + getchar + fgets with ordered prompts', async () => {
  const code = `
#include <stdio.h>
int main() {
  int n;
  char line[64];
  printf("Age: ");
  scanf("%d", &n);
  getchar();
  printf("Note: ");
  fgets(line, 64, stdin);
  printf("%d:%s", n, line);
  return 0;
}`;
  const { events, inputsConsumed } = await runInteractiveWorker(cWorkerCode, picocCode, code, ['21', 'ThinkCode Lab']);
  const needIndices = events.map((e, i) => e.t === 'need_input' ? i : -1).filter(i => i >= 0);
  assert.equal(needIndices.length, 2, 'Expected 2 separate need_input pauses');
  assert.equal(inputsConsumed, 2);
  const firstPrompt = events.slice(0, needIndices[0]).filter(e => e.t === 'out').map(e => e.s).join('');
  const secondPrompt = events.slice(needIndices[0], needIndices[1]).filter(e => e.t === 'out').map(e => e.s).join('');
  assert.match(firstPrompt, /Age:/);
  assert.match(secondPrompt, /Note:/);
  const fullOut = events.filter(e => e.t === 'out').map(e => e.s).join('');
  assert.match(fullOut, /21:ThinkCode Lab/);
});

await checkAsync('C++ interactive: cout prompt emitted BEFORE need_input across sequential cin >> calls', async () => {
  const cppTpl = LANGS.find(l => l.id === 'cpp').tpl;
  const { events, inputsConsumed } = await runInteractiveWorker(cppWorkerCode, jscppCode, cppTpl, ['Tahir', '101']);
  const needIndices = events.map((e, i) => e.t === 'need_input' ? i : -1).filter(i => i >= 0);
  assert.equal(needIndices.length, 2, 'Expected 2 need_input prompts');
  assert.equal(inputsConsumed, 2);
  const p1 = events.slice(0, needIndices[0]).filter(e => e.t === 'out').map(e => e.s).join('');
  const p2 = events.slice(needIndices[0], needIndices[1]).filter(e => e.t === 'out').map(e => e.s).join('');
  assert.match(p1, /Enter your name:/);
  assert.match(p2, /Enter your roll number:/);
  const fullOut = events.filter(e => e.t === 'out').map(e => e.s).join('');
  const fullErr = events.filter(e => e.t === 'err').map(e => e.s).join('');
  assert.equal(fullErr, '');
  assert.match(fullOut, /Hello, Tahir! \(Roll: 101\)/);
});

// ---------------------------------------------------------------------------
// 3. C (PicoC WASM) Corpus + Recovery + Formatter Round-Trip
// ---------------------------------------------------------------------------
console.log('\n[3/4] C Worker Full Practicals, Recovery & Formatter Round-Trip');

async function createCVMRunner() {
  const events = [];
  const ctx = vm.createContext({
    console,
    setTimeout, clearTimeout,
    TextDecoder, TextEncoder,
    WebAssembly,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    location: { href: 'http://localhost/' },
    performance,
    importScripts: (url) => {
      if (url.endsWith('picoc.js')) vm.runInContext(picocCode, ctx);
    },
    postMessage: (msg) => events.push(msg),
    SharedArrayBuffer, Atomics
  });
  vm.runInContext('this.globalThis = this; this.self = this; var onmessage = null;', ctx);
  vm.runInContext(cWorkerCode, ctx);

  await new Promise((res, rej) => {
    const checkReady = () => {
      const fat = events.find(e => e.t === 'fatal');
      if (fat) return rej(new Error(fat.s));
      if (events.some(e => e.t === 'ready')) return res();
      setTimeout(checkReady, 15);
    };
    ctx.onmessage({ data: { type: 'init', base: '' } });
    checkReady();
  });

  return async function runC(code, stdin = '') {
    events.length = 0;
    await ctx.onmessage({ data: { type: 'run', code, stdin } });
    return {
      out: events.filter(e => e.t === 'out').map(e => e.s).join(''),
      err: events.filter(e => e.t === 'err').map(e => e.s).join('')
    };
  };
}

const runC = await createCVMRunner();

const cCases = [
  { id: 'main.c', code: LANGS.find(l => l.id === 'c').tpl, stdin: '6\n', expect: /Factorial of 6 is 720/ },
  { id: 'c-1', code: PRACTICALS.c.find(p => p.id === 'c-1').code, stdin: '20 5\n', expect: /Sum\s+=\s+25[\s\S]*Quotient\s+=\s+4\.00/ },
  { id: 'c-2', code: PRACTICALS.c.find(p => p.id === 'c-2').code, stdin: '2024\n', expect: /2024 is a LEAP YEAR\./ },
  { id: 'c-3', code: PRACTICALS.c.find(p => p.id === 'c-3').code, stdin: '6\n', expect: /Factorial of 6 = 720[\s\S]*0 1 1 2 3 5 8 13/ },
  { id: 'c-4', code: PRACTICALS.c.find(p => p.id === 'c-4').code, stdin: '', expect: /Maximum: 89[\s\S]*Average: 49\.00/ }
];

for (const tc of cCases) {
  await checkAsync(`C ${tc.id} raw`, async () => {
    const { out, err } = await runC(tc.code, tc.stdin);
    assert.equal(err, '', `Unexpected stderr: ${err}`);
    assert.match(out, tc.expect);
  });
  await checkAsync(`C ${tc.id} formatted (Beautify)`, async () => {
    const formatted = formatCode(tc.code, 'c');
    const { out, err } = await runC(formatted, tc.stdin);
    assert.equal(err, '', `Unexpected stderr after Beautify: ${err}`);
    assert.match(out, tc.expect);
  });
}

await checkAsync('C syntax error reports diagnostic & next run recovers cleanly', async () => {
  const bad = `#include <stdio.h>\nint main() { int x = ; return 0; }\n`;
  const r1 = await runC(bad, '');
  assert.ok(r1.err.length > 0, 'Expected compile error output on bad C code');
  const r2 = await runC(`#include <stdio.h>\nint main() { printf("recovered_ok\\n"); return 0; }\n`, '');
  assert.equal(r2.err, '');
  assert.match(r2.out, /recovered_ok/);
});

await checkAsync('C exit(1) + <conio.h> stays isolated & next run works cleanly', async () => {
  const code = `#include <stdio.h>\n#include <stdlib.h>\n#include <conio.h>\nint main() { printf("before_exit"); exit(1); printf("after_exit"); return 0; }\n`;
  const r1 = await runC(code, '');
  assert.match(r1.out, /before_exit/);
  assert.doesNotMatch(r1.out, /after_exit/);
  const r2 = await runC(`#include <stdio.h>\nint main() { printf("still_alive\\n"); return 0; }\n`, '');
  assert.equal(r2.err, '');
  assert.match(r2.out, /still_alive/);
});

// ---------------------------------------------------------------------------
// 4. C++ (Unified JSCPP) Practicals, Stress Cases & Formatter Round-Trip
// ---------------------------------------------------------------------------
console.log('\n[4/4] C++ Worker Practicals, OOP/STL Stress & Formatter Round-Trip');

function createCppVMRunner() {
  const events = [];
  const ctx = vm.createContext({
    console,
    setTimeout, clearTimeout,
    TextDecoder, TextEncoder,
    importScripts: (url) => {
      if (url.endsWith('jscpp.js')) vm.runInContext(jscppCode, ctx);
    },
    postMessage: (msg) => events.push(msg),
    SharedArrayBuffer, Atomics
  });
  vm.runInContext('this.globalThis = this; this.self = this; var onmessage = null;', ctx);
  vm.runInContext(cppWorkerCode, ctx);
  ctx.onmessage({ data: { type: 'init', base: '' } });
  assert.ok(events.some(e => e.t === 'ready'), 'C++ worker failed to reach ready');

  return function runCpp(code, stdin = '') {
    events.length = 0;
    ctx.onmessage({ data: { type: 'run', code, stdin } });
    return {
      out: events.filter(e => e.t === 'out').map(e => e.s).join(''),
      err: events.filter(e => e.t === 'err').map(e => e.s).join('')
    };
  };
}

const runCpp = createCppVMRunner();

const cppCases = [
  { id: 'main.cpp', code: LANGS.find(l => l.id === 'cpp').tpl, stdin: 'Alice\n42\n', expect: /Hello, Alice! \(Roll: 42\)/ },
  { id: 'cpp-1', code: PRACTICALS.cpp.find(p => p.id === 'cpp-1').code, stdin: '15\n4\n', expect: /Addition \(a \+ b\)\s+:\s+19[\s\S]*3\.75[\s\S]*Modulo \(a % b\)\s+:\s+3/ },
  { id: 'cpp-2', code: PRACTICALS.cpp.find(p => p.id === 'cpp-2').code, stdin: '7\n2\n', expect: /7 is Positive\.[\s\S]*Cube of 7 is: 343/ },
  { id: 'cpp-3', code: PRACTICALS.cpp.find(p => p.id === 'cpp-3').code, stdin: '5\n', expect: /5 x 10 = 50[\s\S]*Sum of digits of 5 \(while loop\): 5[\s\S]*1 2 3 4 5/ },
  { id: 'cpp-4', code: PRACTICALS.cpp.find(p => p.id === 'cpp-4').code, stdin: '17\n', expect: /17 is a PRIME number\./ },
  { id: 'cpp-5', code: PRACTICALS.cpp.find(p => p.id === 'cpp-5').code, stdin: '6\n', expect: /Factorial of 6 \(6!\) = 720/ },
  { id: 'cpp-6', code: PRACTICALS.cpp.find(p => p.id === 'cpp-6').code, stdin: '6\n', expect: /Fibonacci Series: 0 1 1 2 3 5/ },
  { id: 'cpp-7', code: PRACTICALS.cpp.find(p => p.id === 'cpp-7').code, stdin: '', expect: /Sum\s+:\s+203[\s\S]*Maximum\s+:\s+89[\s\S]*3\t4/ },
  { id: 'cpp-8', code: PRACTICALS.cpp.find(p => p.id === 'cpp-8').code, stdin: '', expect: /After swapReference: x=20, y=10[\s\S]*Recursive Factorial of 5: 120/ },
  { id: 'cpp-9', code: PRACTICALS.cpp.find(p => p.id === 'cpp-9').code, stdin: '', expect: /Concatenated string: ThinkCode[\s\S]*Substring \(first 5 chars\): Think[\s\S]*After append: ThinkCode Lab/ },
  { id: 'cpp-10', code: PRACTICALS.cpp.find(p => p.id === 'cpp-10').code, stdin: '', expect: /Name\s+:\s+Tahir Mansuri[\s\S]*As Char\s+:\s+A \(Shared memory!\)[\s\S]*Size of Union: 4 bytes/ },
  { id: 'cpp-11', code: PRACTICALS.cpp.find(p => p.id === 'cpp-11').code, stdin: '', expect: /101\tJuned Khan\t257\/300[\s\S]*102\tPrerana Pawar\t273\/300[\s\S]*Distinction/ },
  { id: 'cpp-12', code: PRACTICALS.cpp.find(p => p.id === 'cpp-12').code, stdin: '', expect: /0x[0-9a-fA-F]+[\s\S]*New value of var\s+:\s+50[\s\S]*\*\(arrPtr \+ 2\) = 30/ }
];

for (const tc of cppCases) {
  check(`C++ ${tc.id} raw`, () => {
    const { out, err } = runCpp(tc.code, tc.stdin);
    assert.equal(err, '', `Unexpected stderr: ${err}`);
    assert.match(out, tc.expect);
  });
  check(`C++ ${tc.id} formatted (Beautify)`, () => {
    const formatted = formatCode(tc.code, 'cpp');
    const { out, err } = runCpp(formatted, tc.stdin);
    assert.equal(err, '', `Unexpected stderr after Beautify: ${err}`);
    assert.match(out, tc.expect);
  });
}

check('C++ stress: OOP inheritance + ctor overloading + overriding', () => {
  const code = `
#include <iostream>
#include <string>
using namespace std;
class Animal {
public:
  string name;
  Animal() : name("Unknown") {}
  Animal(string n) : name(n) { cout << "Animal:" << name << "\\n"; }
  void speak() { cout << name << " sound\\n"; }
};
class Dog : public Animal {
public:
  int age;
  Dog(string n, int a) : Animal(n), age(a) {}
  Dog(string n) : Animal(n), age(1) {}
  void speak() { cout << name << " barks (" << age << ")\\n"; }
};
int main() {
  Dog d("Rex", 4);
  d.speak();
  Dog d2("Buddy");
  d2.speak();
  Animal a;
  a.speak();
  return 0;
}`;
  const { out, err } = runCpp(code);
  assert.equal(err, '');
  assert.equal(out, 'Animal:Rex\nRex barks (4)\nAnimal:Buddy\nBuddy barks (1)\nUnknown sound\n');
});

check('C++ stress: multilevel inheritance + default member initializers', () => {
  const code = `
#include <iostream>
using namespace std;
class A {
public:
  int a = 10;
  int getA() { return a; }
};
class B : public A {
public:
  int b;
  B(int bv) : b(bv) {}
};
class C : public B {
public:
  int c;
  C(int bv, int cv) : B(bv), c(cv) {}
  void show() { cout << getA() << "," << b << "," << c << "\\n"; }
};
int main() {
  C obj(20, 30);
  obj.show();
  return 0;
}`;
  const { out, err } = runCpp(code);
  assert.equal(err, '');
  assert.equal(out, '10,20,30\n');
});

check('C++ stress: for-loop lexical variable shadowing vs class fields', () => {
  const code = `
#include <iostream>
using namespace std;
class Counter {
public:
  int i = 99;
  int run() {
    int sum = 0;
    for (int i = 0; i < 4; i++) {
      sum += i;
    }
    return sum + i;
  }
};
int main() {
  Counter c;
  cout << c.run() << "\\n";
  return 0;
}`;
  const { out, err } = runCpp(code);
  assert.equal(err, '');
  assert.equal(out, '105\n');
});

check('C++ stress: typedef struct brace init + pointers + -> + references + std::string + iomanip', () => {
  const code = `
#include <iostream>
#include <string>
#include <iomanip>
typedef struct {
  int x;
  int y;
  char label[16];
} Point;
void bump(int &v) { v += 5; }
int main() {
  Point p = {10, 25, "Origin"};
  Point *ptr = &p;
  Point *np = nullptr;
  bump(ptr->x);
  std::string line;
  int code;
  std::cin >> code;
  std::cin.ignore();
  std::getline(std::cin, line);
  std::cout << ptr->label << ":" << ptr->x << " null=" << (np == nullptr)
            << " s=" << line.substr(0, 4) << " w=" << std::setw(4) << code << "\\n";
  return 0;
}`;
  const { out, err } = runCpp(code, '42\nHello World\n');
  assert.equal(err, '');
  assert.equal(out, 'Origin:15 null=1 s=Hell w=  42\n');
});

check('C++ stress: comment/string brace immunity + syntax errors recover cleanly', () => {
  const commented = `
#include <iostream>
using namespace std;
// fake int main() { broken
/* block { } comment int main() */
int main() {
  cout << "fake { int main() /*" << endl;
  return 0;
}`;
  const r0 = runCpp(commented);
  assert.equal(r0.err, '');
  assert.match(r0.out, /fake \{ int main\(\)/);

  const missingMain = `#include <iostream>\nusing namespace std;\nvoid helper() {}\n`;
  assert.match(runCpp(missingMain).err, /undefined reference to 'main'/);

  const missingSemi = `#include <iostream>\nstruct Bad { int x; }\nint main() { return 0; }\n`;
  assert.match(runCpp(missingSemi).err, /expected ';' after struct definition/);

  const unclosedBrace = `#include <iostream>\nint main() { int x = 1;\n`;
  assert.match(runCpp(unclosedBrace).err, /expected '\}'/);

  // Must still run valid code immediately after errors
  const rOk = runCpp(`#include <iostream>\nint main() { std::cout << "ok_after_err\\n"; return 0; }\n`);
  assert.equal(rOk.err, '');
  assert.equal(rOk.out, 'ok_after_err\n');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
