# 🛠️ ThinkCode Lab — Technical Stack & Architecture

> Detailed architectural specifications, engine internals, threading model, and runtime protocols for **ThinkCode Lab**.

---

## 🏛️ 1. High-Level Architecture

ThinkCode Studio is designed as an **offline-first, zero-backend, multi-threaded client application**. The host environment runs modern ES2022+ JavaScript inside the main UI thread, delegating CPU-intensive and blocking runtime tasks to dedicated background Web Workers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            THINKCODE STUDIO UI                              │
│                               (Main Thread)                                 │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────┐ │
│  │   CodeMirror 6 Core   │   │   Split Pane Manager  │   │  Theme Engine  │ │
│  │  (Syntax, Keymaps,    │   │  (Touch & Mouse Drag, │   │ (Obsidian Dark │ │
│  │   Luminous Glow)      │   │   Viewport Resizer)   │   │   / Crisp Day) │ │
│  └───────────────────────┘   └───────────────────────┘   └────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Worker Engine Coordinator                        │ │
│  │     (Task Serialization, SharedArrayBuffer Control, Life-cycle)       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────┬──────────────────────┬───────┘
                        │                      │                      │
       postMessage /    │     SharedArrayBuffer│      postMessage /   │
       Atomics          │     Atomics.wait()   │      ArrayBuffer     │
                        ▼                      ▼                      ▼
    ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐
    │  python.worker.js     │  │  sql.worker.js        │  │  js.worker.js   │
    │  (Pyodide WASM        │  │  (sql.js SQLite WASM  │  │  (AsyncFunction │
    │   CPython 3.12 +      │  │   + Oracle Translation│  │   Sandboxed     │
    │   Stdlib Runtimes)    │  │   Layer + 4 Schemas)  │  │   Worker Loop)  │
    └───────────────────────┘  └───────────────────────┘  └─────────────────┘
```

---

## ⚙️ 2. Language Execution Engines & Runtimes

### 🐍 Python 3.12 Engine (`src/engines/python.worker.js`)
- **Technology:** [Pyodide](https://pyodide.org/) v0.26.4 (CPython compiled to WebAssembly with Emscripten).
- **Execution Mode:** Classic Web Worker (IIFE format via Vite worker configuration) using `importScripts()`.
- **Packaging:** Runtime files (`pyodide.js`, `pyodide.asm.wasm`, `pyodide.asm.js`, `python_stdlib.zip`) are completely self-hosted in `public/pyodide/` for 100% offline access.
- **I/O Redirection:**
  - `py.setStdout`: Streams byte buffers decoded via `TextDecoder` to the main thread in real time.
  - `py.setStderr`: Captures exception traces, strips Pyodide internal stack lines, and displays clean student-friendly tracebacks.
  - `py.setStdin`: Custom blocking handler backed by `SharedArrayBuffer` (see Section 3).

### 🗄️ Oracle SQL Simulation Engine (`src/engines/sql.worker.js`)
- **Technology:** [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) + custom Oracle PL/SQL compatibility and translation engine.
- **Preloaded Schemas:**
  1. `SCOTT`: Standard Oracle tutorial schema (`EMP`, `DEPT`, `SALGRADE`, `BONUS`).
  2. `UNIVERSITY`: Academic relational schema (`STUDENTS`, `COURSES`, `INSTRUCTORS`, `ENROLLMENTS`, `DEPARTMENTS`).
  3. `BANK`: Financial transactional schema (`CUSTOMERS`, `ACCOUNTS`, `TRANSACTIONS`, `BRANCHES`).
  4. `WORKSPACE`: Clean sandbox database for student DDL/DML experimentation.
- **Oracle Emulation Layer:**
  - SQL parsing and query re-writing layer to simulate Oracle SQL dialect quirks on top of SQLite.
  - Custom User-Defined Functions (UDFs): `NVL(x, y)`, `NVL2(x, y, z)`, `DECODE()`, `INITCAP()`, `LPAD()`, `RPAD()`, `TO_CHAR()`, `TO_DATE()`, `TRUNC()`, `ADD_MONTHS()`, `MONTHS_BETWEEN()`, `LAST_DAY()`, `LISTAGG()`, and `ROWNUM`.
  - Transaction state machine: Explicit `COMMIT` and `ROLLBACK` management with in-memory savepoints.
  - Data persistence: Automatically commits and persists schema state in `localStorage` as base64-encoded SQLite binary images (`cf.sql.db.<SCHEMA>`).

### ⚡ JavaScript Engine (`src/engines/js.worker.js`)
- **Technology:** Sandboxed Web Worker executing code via `AsyncFunction`.
- **Console Interception:** Intercepts `console.log`, `console.info`, `console.warn`, `console.error`, and `console.table`.
- **Runtime Prompt:** Interactive `prompt(message)` implementation synchronized using the same `SharedArrayBuffer` protocol as Python.

### 🐘 PHP 8.2 WebAssembly Engine (`src/engines/php.worker.js`)
- **Technology:** Standalone PHP 8.2.11 compiled to WebAssembly (via Emscripten / `@php-wasm/web`).
- **Packaging:** Self-hosted runtime (`php.js` and `php.wasm` [12 MB]) located in `public/php/` for 100% offline client-side execution.
- **Dual-Section Code Editor:** Independent CodeMirror 6 instances for HTML Form (`editorHtml`) and PHP script (`editorPhp`) with 3 view modes (`Split`, `HTML`, `PHP`) and draggable splitter.
- **Client-Side CGI Simulation:** Real-time form submission interception inside the preview iframe intercepts POST/GET submissions, parses fields via `FormData`, populates simulated CGI globals (`$_SERVER['REQUEST_METHOD']`, `$_POST`, `$_GET`, `$_REQUEST`), and streams output to Preview and Console tabs without any backend.
- **Navigation Interception:** Sandboxed iframe hook traps `<a href="index.html">` links, cleanly returning to the student's HTML form rather than reloading the main IDE page.

### 🌐 HTML/CSS/JS Live Web Preview (`src/engines/index.js`)
- **Technology:** Sandboxed `<iframe>` leveraging `srcdoc`.
- **Security Attributes:** `sandbox="allow-scripts allow-modals"`.
- **Message Forwarding:** Injected script inside iframe captures uncaught errors, unhandled promise rejections, and `console` statements, routing them back to the host console tab.

### 🐧 Virtual Linux Shell Emulator (`src/engines/shell.js`)
- **Technology:** Custom in-browser UNIX shell interpreter written in modern JavaScript.
- **Virtual File System:** Hierarchical inode-like directory tree structure with file nodes, permissions, and timestamps persisted in `localStorage`.
- **Command Set:** 35+ core UNIX utilities (`ls`, `cat`, `head`, `tail`, `grep`, `mkdir`, `rm`, `cp`, `mv`, `chmod`, `wc`, `find`, `curl`, `tree`, `touch`, `clear`, `echo`, `export`, `alias`, etc.).
- **Shell Features:** Pipelines (`cmd1 | cmd2`), file redirects (`>`, `>>`, `<`), command substitution (`$(cmd)`), arithmetic expansion (`$((1 + 2))`), variables (`$USER`), and conditionals (`if`/`else`, `for`, `while`).

---

## 🔄 3. Interactive Runtime Stdin via `SharedArrayBuffer` & `Atomics`

Standard browser Web Workers cannot natively block their thread while waiting for user keystrokes in the main UI thread. In traditional online web compilers, this forces developers to either use pre-buffered input boxes or asynchronous callbacks that break standard Python `input()` semantics.

ThinkCode Studio solves this using **`SharedArrayBuffer`** and the **`Atomics` API**:

```
Main Thread (UI)                                  Python Worker Thread
┌─────────────────────────┐                       ┌─────────────────────────┐
│ User hits "Run"         │── postMessage('run') ─▶│ py.runPythonAsync(...) │
│                         │                       │   │                     │
│                         │                       │   ▼                     │
│                         │                       │ Calls input("Name: ")   │
│ Renders inline <input>  │◀── post('need_input') ─│   │                     │
│ inside #console element │                       │ Atomics.store(WAITING)  │
│                         │                       │ Atomics.wait(status, 1) │
│ User types "Tahir"      │                       │ [Thread Sleeping 💤]    │
│ and presses Enter       │                       │                         │
│                         │                       │                         │
│ Encodes string to UTF-8 │                       │                         │
│ Writes to sharedDataBuf │                       │                         │
│ Sets sharedDataLen      │                       │                         │
│ Atomics.store(READY)    │                       │                         │
│ Atomics.notify(status) ─┼──────────────────────▶│ Wakes Up ⚡             │
│                         │                       │ Copies data to unshared │
│ Locks input in console  │                       │ dec.decode(copy)        │
│                         │                       │ Resumes Python runtime! │
└─────────────────────────┘                       └─────────────────────────┘
```

### Critical Implementation Safeguards:
1. **Unshared View Copying:** Chromium and Safari enforce strict security checks: `TextDecoder.prototype.decode()` throws `TypeError: The provided ArrayBufferView value must not be shared` if invoked directly on a shared view. The engine copies the shared slice into a non-shared `Uint8Array` before decoding.
2. **COOP/COEP Headers:** `SharedArrayBuffer` requires Cross-Origin isolation:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
   - Enabled in Vite dev/preview server and polyfilled via `coi-serviceworker.js` for standalone static hosts and WebViews.

---

## 📱 4. Android Native Architecture (Capacitor 6)

ThinkCode Lab is packaged as a high-performance native Android application using **Capacitor 6**:

```
Android Native Application (.apk / .aab)
┌─────────────────────────────────────────────────────────────┐
│ MainActivity (com.igc.thinkcodelab)                         │
│  └── Android System WebView (Chromium 100+ Engine)          │
│       ├── Local Assets: https://localhost/                  │
│       ├── Pyodide WebAssembly Runtimes (Python 3.12)        │
│       ├── php-wasm WebAssembly Runtimes (PHP 8.2)           │
│       ├── sql.js WebAssembly Runtimes (Oracle SQL)          │
│       └── Bundled Fonts & Icons                             │
│                                                             │
│ Native Plugins:                                             │
│  ├── @capacitor/filesystem (Local file import/export)       │
│  └── @capacitor/share (Share code snippets to WhatsApp/app) │
└─────────────────────────────────────────────────────────────┘
```

- **Build Output:** Standalone release APK (`ThinkCodeLab-release.apk` ~16 MB) and Google Play Bundle (`ThinkCodeLab-release.aab` ~16 MB).
- **Release Version:** `v1.1.1` (`versionCode 3`, `versionName "1.1.1"`).
- **Target SDK:** Android 14 (API level 34) with backward compatibility down to Android 7.0 (API level 24).
- **Adaptive Icons & Splash Screen:** 74 pre-rendered adaptive mipmap icons and vector splash configurations generated via `@capacitor/assets`.
- **Build Toolchain:** OpenJDK 17 + Gradle 8.2.1 + Android Gradle Plugin (AGP) 8.2.1.
- **Stop & Re-run Lifecycle Hardening:** Guaranteed promise resolution and worker termination handling ensuring instantaneous reset of UI buttons and zero deadlocks.

---

## 🎨 5. UI, Editor & Design System

- **Frontend Core:** Pure Vanilla JavaScript (ES2022+) — zero heavy framework overhead (no React/Vue/Angular), delivering 60 FPS transitions and near-instant initial boot.
- **Code Editor:** [CodeMirror 6](https://codemirror.net/)
  - Language extensions: `@codemirror/lang-python`, `@codemirror/lang-javascript`, `@codemirror/lang-sql`, `@codemirror/lang-html`.
  - Custom syntax highlighting tokens matching ThinkCode branding.
  - Active line highlighting, bracket matching, code folding, indentation guides, and line wrapping.
- **Design System & Theme Tokens:**
  - **Luminous Obsidian Palette:** `#090E15` base background, `#0E1622` panel surfaces, with `#2B435E` and `#3D6085` crisp luminous borders.
  - **Ambient Edge Glows:** Custom CSS variable layers (`--box-glow`, `--box-glow-hover`, `--box-glow-focus`) providing a futuristic cyber aesthetic.
  - **Typography:** Self-hosted `Bricolage Grotesque Variable` (UI headers/labels) and `JetBrains Mono Variable` (editor/console) via `@fontsource-variable`.
  - **Responsive Split Layout:** CSS Grid layout with interactive drag splitter supporting vertical split on mobile phones and horizontal split on tablets/desktops (≥900px).
