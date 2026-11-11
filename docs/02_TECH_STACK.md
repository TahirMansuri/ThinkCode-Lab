# 🛠️ ThinkCode Lab — Technical Stack & Architecture

> **Comprehensive architectural specification, engine internals, threading model, and runtime protocols for ThinkCode Lab.**

---

## 🏛️ 1. High-Level Architecture

ThinkCode Lab is architected as an **offline-first, zero-backend, multi-threaded client application**. The host environment executes modern ES2022+ JavaScript inside the main UI thread, delegating compute-intensive tasks, code parsing, and runtime interpretation to dedicated background Web Workers.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THINKCODE LAB UI                                      │
│                                    (Main Thread)                                        │
│                                                                                         │
│  ┌───────────────────────┐   ┌───────────────────────────┐   ┌────────────────────────┐ │
│  │   CodeMirror 6 Core   │   │  Adaptive Split Manager   │   │   Theme & Zoom Engine  │ │
│  │  (2-Space Tab Size,   │   │   (80:20 Initial Ratio,   │   │  (Obsidian Cyber Dark  │ │
│  │   Syntax Highlighting,│   │   65:35 Auto-Expand on    │   │   / Crisp Light,       │ │
│  │   Luminous Glow)      │   │   Run, Draggable Grip)    │   │   Dual A− / A+ Bars)   │ │
│  └───────────────────────┘   └───────────────────────────┘   └────────────────────────┘ │
│                                            │                                            │
│  ┌─────────────────────────────────────────┴──────────────────────────────────────────┐ │
│  │                      Multi-Engine Host Coordinator (`src/engines/index.js`)        │ │
│  │         (Worker Lifecycle, SharedArrayBuffer Control, Console Sink Routing)        │ │
│  └─────────────────────────────────────────┬──────────────────────────────────────────┘ │
└────────────────────────────────────────────┼────────────────────────────────────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
           ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐
           │  python.worker.js   ││   java.worker.js    ││     c.worker.js     │
           │ (Pyodide CPython    ││ (Lightweight AST    ││ (PicoC C99 WASM,    │
           │  3.12 WASM Engine)  ││  Transpiler & Swing)││  Real Pointers/Heap)│
           └─────────────────────┘└─────────────────────┘└─────────────────────┘
                      ▼                      ▼                      ▼
           ┌─────────────────────┐┌─────────────────────┐┌─────────────────────┐
           │    cpp.worker.js    ││    php.worker.js    ││    sql.worker.js    │
           │ (JSCPP + OOP Class  ││ (php-wasm 8.2 SAPI  ││ (sql.js SQLite WASM │
           │  Transpiler Engine) ││  Dual Form Bridge)  ││  + Oracle Dialect)  │
           └─────────────────────┘└─────────────────────┘└─────────────────────┘
                      ▼                      ▼
           ┌─────────────────────┐┌─────────────────────┐
           │     js.worker.js    ││      shell.js       │
           │ (AsyncFunction      ││ (Virtual UNIX Bash, │
           │  Promise Sandbox)   ││  localStorage VFS)  │
           └─────────────────────┘└─────────────────────┘
```

---

## ⚙️ 2. Execution Engines & Runtime Protocols

### 🐍 1. Python 3.12 Engine (`src/engines/python.worker.js`)
- **Technology:** [Pyodide](https://pyodide.org/) v0.26.4 (CPython compiled to WebAssembly via Emscripten).
- **Packaging:** Self-hosted runtime (`pyodide.js`, `pyodide.asm.wasm`, `pyodide.asm.js`, `python_stdlib.zip`) in `public/pyodide/` for 100% offline access.
- **I/O Redirection:**
  - `py.setStdout`: Streams byte chunks decoded via `TextDecoder` to the main UI console sink.
  - `py.setStderr`: Strips Pyodide internals and displays clean academic tracebacks.
  - `py.setStdin`: Blocks worker execution using `SharedArrayBuffer` + `Atomics.wait()`, prompting the user via an inline terminal field or touch-friendly `#promptModal`.

### ☕ 2. Java JDK Simulation & AWT/Swing Engine (`src/engines/java.worker.js`)
- **Technology:** Lightweight offline Java AST transpiler and bytecode emulator.
- **Key Capabilities:**
  - Full object-oriented features: `class`, `extends`, `implements`, `super()`, `this`.
  - Constructor and method overloading with dynamic argument length and type dispatch.
  - Polymorphic exception handling: `try { ... } catch (SpecificException e) { ... } finally { ... }`.
  - Standard Java classes: `Scanner`, `Math`, `String`, `StringBuilder`, `Arrays`, `ArrayList`, `System.out.printf`.
  - Simulated JDBC connectivity (`DriverManager`, `Connection`, `Statement`, `ResultSet`).
  - **AWT & Swing Desktop GUI:** Real-time event extraction for `JFrame`, `JLabel`, `JTextField`, `JPasswordField`, `JButton`, and Layout Managers (`GridLayout`, `BorderLayout`, `FlowLayout`). Dispatches DOM component structures to the main thread's `#guiWindowModal`.

### ⚙️ 3. C (C99) WebAssembly Engine (`src/engines/c.worker.js`)
- **Technology:** [PicoC](https://github.com/jpoirier/picoc) ANSI/C99 interpreter compiled to WebAssembly via Emscripten.
- **Packaging:** Ultra-compact ~800 KB bundle self-hosted in `public/picoc/picoc.js`.
- **Key Capabilities:**
  - True pointer arithmetic, address-of `&`, dereferencing `*`, double pointers `**`.
  - Dynamic heap allocation: `malloc()`, `free()`.
  - User structures (`struct`), unions, and typedefs for college data structures (Linked Lists, Binary Trees).
  - Standard libraries: `<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`, `<ctype.h>`.
  - Interactive `scanf` and `getchar` via `SharedArrayBuffer` / input queue.

### ⚡ 4. C++ Interactive & OOP Engine (`src/engines/cpp.worker.js`)
- **Technology:** Hybrid execution combining `JSCPP` (procedural logic) with a custom OOP Transpiler Runner.
- **Key Capabilities:**
  - `<iostream>` (`std::cin`, `std::cout`, `std::endl`), `<iomanip>`, `<cmath>`, `<cstring>`.
  - Multi-dimensional arrays, recursion, reference variables (`int &ref = x`), and function overloading.
  - User-defined classes (`class`), constructors, destructors, access specifiers (`public:`, `private:`), member methods, and object lifecycles.
  - Authentic `g++` compiler diagnostic formatting with line, column, and caret indicators (`^`).

### 🐘 5. PHP 8.2 WebAssembly Engine (`src/engines/php.worker.js`)
- **Technology:** Standalone PHP 8.2.11 compiled to WebAssembly (via `@php-wasm/web`).
- **Packaging:** Self-hosted runtime (`php.js` and `php.wasm` [12 MB]) in `public/php/`.
- **Dual-Section Split Editor:** Independent CodeMirror 6 editors for HTML Form (`editorHtml`) and PHP backend script (`editorPhp`) with 3 view modes (`Split`, `HTML`, `PHP`).
- **Client-Side CGI Simulation:** Form submit hooks inside the preview iframe intercept POST/GET submissions, parse fields via `FormData`, inject simulated CGI variables (`$_POST`, `$_GET`, `$_REQUEST`, `$_SERVER['REQUEST_METHOD']`), and render responses without server roundtrips.

### 🗄️ 6. Oracle SQL Simulation Engine (`src/engines/sql.worker.js`)
- **Technology:** [sql.js](https://sql.js.org/) (SQLite WASM) + custom Oracle PL/SQL compatibility and translation engine.
- **Preloaded Academic Schemas:** `SCOTT` (EMP, DEPT), `UNIVERSITY`, `BANK`, and `WORKSPACE`.
- **Oracle Compatibility Layer:**
  - UDFs: `NVL`, `NVL2`, `DECODE`, `INITCAP`, `LPAD`, `RPAD`, `TO_CHAR`, `TO_DATE`, `TRUNC`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `LISTAGG`, `SYSDATE`, `DUAL`, `MINUS`, `ROWNUM`, and sequences.
  - Transaction state machine: Explicit `COMMIT`, `ROLLBACK`, and `SAVEPOINT`.
  - Interactive SQL table viewer with automatic row numbering, execution duration, and CSV/TSV copy/download.

### 🐧 7. Virtual Linux Shell Emulator (`src/engines/shell.js`)
- **Technology:** Custom in-browser UNIX shell interpreter written in pure modern JavaScript.
- **Virtual File System:** Hierarchical inode-like directory tree structure with file nodes, permissions, and timestamps persisted in `localStorage`.
- **Command Set:** 35+ core UNIX utilities (`ls`, `cat`, `grep`, `mkdir`, `rm`, `find`, `curl`, `tree`, `wc`, `head`, `tail`, `touch`, `chmod`, `alias`, etc.).
- **Shell Features:** Pipelines (`cmd1 | cmd2`), file redirects (`>`, `>>`, `<`), command substitution (`$(cmd)`), arithmetic expansion (`$((1 + 2))`), variables (`$USER`), and conditionals (`if`/`else`, `for`, `while`).

### 🌐 8. JavaScript Engine (`src/engines/js.worker.js`) & HTML/CSS Live Web Preview
- **JavaScript Worker:** Sandboxed Web Worker running ES2022+ code via `AsyncFunction` with loop runaway guards. Intercepts `console.log`, `warn`, `error`, `table`.
- **Web Preview:** Sandboxed `<iframe>` (`sandbox="allow-scripts allow-modals allow-forms allow-same-origin"`) with instant live reload and console synchronization.

---

## 🔄 3. Interactive I/O Synchronization Model

ThinkCode Lab supports true interactive runtime input via a dual-mode communication bridge:

```
┌────────────────────────────────────────────────────────┐
│                   MAIN UI THREAD                       │
│                                                        │
│  User types answer in Console / Modal  ───┐            │
└───────────────────────────────────────────┼────────────┘
                                            │ Writes to Shared Buffer
                                            ▼
┌────────────────────────────────────────────────────────┐
│              SHAREDARRAYBUFFER / ATOMICS               │
│                                                        │
│  [Status Flag: 1 (Ready)]  [Data: "User Input\n\0"]    │
└────────────────────────────────────────────────────────┘
                                            │
                                            ▼ Atomics.notify()
┌────────────────────────────────────────────────────────┐
│                   RUNTIME WORKER                       │
│                                                        │
│  Atomics.wait(status, 0) wakes up                      │
│  Reads string bytes → returns to Python/C/Java engine  │
└────────────────────────────────────────────────────────┘
```

1. **High-Performance Path (SharedArrayBuffer + Atomics):**
   - Active on desktop/mobile web browsers where `crossOriginIsolated` is enabled (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`).
   - The worker executes `Atomics.wait(int32Array, 0, 0)` to enter a zero-overhead native sleep.
   - The main thread prompts the user, writes the string into the shared memory buffer, and calls `Atomics.notify(int32Array, 0, 1)`.
2. **Android WebView Native Stdin Bridge (`POST /__native_stdin` + `@JavascriptInterface`):**
   - Android System WebView forces `window.crossOriginIsolated === false` and disables `SharedArrayBuffer` even when native response headers are injected.
   - In `android/app/src/main/java/com/igc/thinkcodelab/MainActivity.java`, ThinkCode Lab registers `@JavascriptInterface` (`ThinkCodeNativeStdin` with `submit()`, `cancel()`, `reset()`) and intercepts synchronous `POST /__native_stdin` XHR requests from Web Workers inside `BridgeWebViewClient` and `ServiceWorkerClient`, blocking the worker thread cleanly on `StdinSlot` until the student enters input in `#console`.
3. **Fallback Path (Promise / Async Transform):**
   - In JavaScript runs or non-isolated web contexts where neither `SharedArrayBuffer` nor the Capacitor native bridge is present, `prompt()` calls resolve asynchronously via `#promptModal`.

---

## 🎨 4. User Interface Architecture

- **Code Editor Core:** Powered by **CodeMirror 6**, configured with 2-space tab indentation (`EditorState.tabSize.of(2)` and `indentUnit.of("  ")`), line wrapping, bracket matching, syntax highlighting, and active line glow.
- **Adaptive Split Manager:**
  - CSS custom properties `--split: 80%` (mobile vertical) and `--split-desktop: 52%` (desktop side-by-side).
  - Initial load, practical selection, template reset, and output clearing set the editor to **80%** height and the output pane to **20%**.
  - Tapping **Run** triggers a smooth `0.25s cubic-bezier` transition expanding the output pane to **65%** height.
- **Dual Zoom Controls:**
  - Independent zoom toolbars (`A-` and `A+`) for both the Code Editor and Output Console.
  - Scale ranges dynamically from 70% to 178% via CSS scroller variables.
- **Interactive Java Desktop Frame:**
  - Floating `#guiWindowModal` with draggable title bar, minimize, maximize, and close controls.
  - Floating action button (`[☕ Java GUI Frame]`) to restore minimized frames.
- **Practicals Drawer:** Slide-over modal containing 78 curated university assignments searchable by title, assignment number, or topic.

---

## 📱 5. Native Android Architecture (Capacitor 6)

- **Native Runtime Wrapper:** Powered by [Capacitor](https://capacitorjs.com/) v6.1.2 (`MainActivity.java` adds `NativeStdinBridge`, `SystemUiBridge` (`ThinkCodeSystemUI`), `WindowInsetsCompat` Edge-to-Edge inset consumption, and `COOP`/`COEP` response headers).
- **Android 15/16 Edge-to-Edge & Dynamic Bar Contrast:**
  - Consumes `WindowInsetsCompat.Type.systemBars() | displayCutout() | ime()` cleanly on `android.R.id.content` (`WindowInsetsCompat.CONSUMED`) so WebView never overlaps status/navigation bars or double-pads CSS `env(safe-area-inset-*)`.
  - Syncs system bar backgrounds and light/dark status & navigation bar icon contrast (`WindowInsetsControllerCompat`) dynamically via `ThinkCodeSystemUI.setTheme(isLight)` when switching Dark/Light themes.
- **Android Target Compliance:**
  - `compileSdkVersion = 36` (Android 16 / Latest API).
  - `targetSdkVersion = 36`.
  - `minSdkVersion = 24` (Android 7.0 Nougat+, meeting Google Play Automatic App Protection requirements).
- **Security & Signing:**
  - Dedicated production RSA 2048-bit release keystore (`thinkcode-lab.keystore`).
  - Signed using APK Signature Scheme v2 (`v2SigningEnabled = true` on `minSdkVersion 24+`).
- **Asset Packaging:**
  - All WebAssembly modules, fonts, and worker scripts are bundled inside `android/app/src/main/assets/public/` for 100% offline access.
  - Built-in aapt rule excludes unnecessary development files.
