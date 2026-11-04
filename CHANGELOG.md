# 📝 ThinkCode Lab — Changelog & Completed Milestones

All notable changes, optimizations, and technical updates to **ThinkCode Lab** are documented below.

---

## 🚀 Version 1.2.0 — C & C++ Lightweight Embedded Engines (Phase 3 Milestone)
*Release Date: November 2026*

### ⚙️ C (C99) Real WebAssembly Execution Engine (`src/engines/c.worker.js`)
- **PicoC WebAssembly Architecture**:
  - Embedded the fast, lightweight ANSI/C99 PicoC interpreter compiled directly to WebAssembly (`public/picoc/picoc.js`).
  - Total package impact is only ~800 KB, preserving ThinkCode Lab's compact ~18 MB App Bundle footprint with 0 external network requests.
- **Academic Syllabus Coverage**:
  - **Pointers & Memory**: Real pointer arithmetic, address-of `&`, dereferencing `*`, double pointers `**`, and dynamic memory management (`malloc`, `free`).
  - **Data Structures**: Structures (`struct`), unions, and typedefs for practical college data structures (Linked Lists, Stacks, Queues, Binary Trees).
  - **Standard Libraries**: Comprehensive support for `<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`, and `<ctype.h>`.
  - **Interactive I/O**: Interactive `scanf` and `getchar` bridge connected to `SharedArrayBuffer` (`Atomics.wait`) and pre-buffered stdin queue.

### ⚡ C++ Interactive Engine (`src/engines/cpp.worker.js`)
- **Dual-Path C++ Execution**:
  - **Procedural Logic**: Powered by `JSCPP` for instant, native evaluation of `<iostream>` (`cin >>`, `cout <<`, `endl`), `<cmath>`, `<cstring>`, `<cctype>`, `<cstdlib>`, `<ctime>`, and `<iomanip>` (`setw`, `setprecision`, `fixed`).
  - **Object-Oriented Practicals**: Integrated OOP Transpiler Runner that seamlessly compiles user-defined classes (`class`, access specifiers `public:`/`private:`, constructors, destructors, member methods, member fields, objects) into native JavaScript runtime execution.
- **Academic Practical Starter Templates**:
  - Preloaded starter templates for C (Factorial with `printf`/`scanf`) and C++ (Class `Student` with constructor, member method, and `cout`).
- **CodeMirror Syntax Highlighting**:
  - Connected `@codemirror/legacy-modes/mode/clike` for rich C and C++ syntax highlighting in `src/editor.js`.
- **Architectural Reference (`C_CPP_ENGINE_ARCHITECTURE.md`)**:
  - Authored a dedicated architectural reference documenting Option 1 (Embedded Engine), Option 2 (Clang WASM Downloadable Pack), and Option 3 (Pre-bundled Clang) with a step-by-step upgrade guide for future competitive programming extensions.

---

## 🚀 Version 1.1.4 — Google Play Store Production Release
*Release Date: November 2026*

### 📱 Google Play Production Release & Full Rollout
- **Google Play Console Submission**:
  - Successfully compiled, signed, verified, and submitted production App Bundle `ThinkCodeLab-release.aab` (`versionCode 6`, `versionName "1.1.4"`) to the Google Play Console Production track.
  - Full rollout initiated across target countries (India, Bangladesh, United Arab Emirates).
- **Target API 36 Compliance**:
  - Upgraded project build targets to `targetSdkVersion 36` and `compileSdkVersion 36` to satisfy Google Play's latest security and runtime performance requirements (Android 15 & 16 ready).
- **Min SDK 24 Auto-Protection**:
  - Upgraded `minSdkVersion` to `24` (Android 7.0+) satisfying Google Play's Play Automatic App Protection prerequisite.
- **Store Listing & Privacy Compliance**:
  - Bundled high-resolution 512x512 app icon, 1024x500 banner feature graphic, and screenshots.
  - Published fully offline, zero-data-collection educational Privacy Policy (`privacy.html` and `docs/privacy.html`) hosted on GitHub Pages.

---

## 🚀 Version 1.1.2 — JavaScript Prompt Modal & Universal Mobile Input
*Release Date: November 2026*

### 💬 Dedicated Touch-Friendly JavaScript `prompt()` & `alert()` Modal
- **Glassmorphic Popup Dialog (`#promptModal`)**:
  - Engineered an accessible `#promptModal` pop-up dialog in `index.html` and `src/styles.css` matching the obsidian luminous theme with amber `#F4D35E` accents.
  - Includes prompt message display, autofocus text input, and explicit `Cancel` and `OK` action buttons.
- **Asynchronous Code Transformation (`transformPromptCode`)**:
  - Implemented automatic AST/regex pre-transformation in `src/engines/js.worker.js` that wraps `prompt()` and `alert()` calls in asynchronous message-passing.
  - **Dual-Mode Execution**:
    - **With `SharedArrayBuffer`**: Synchronous blocking via `Atomics.wait`.
    - **Without `SharedArrayBuffer` (Mobile Web, iOS Safari, Cloudflare Tunnel)**: Non-blocking Promise resolution between Web Worker and UI thread.
  - Completely eliminated the issue on mobile web where `prompt()` previously dropped input and silently returned `null`.
- **Universal Mobile Input Modal (Python & JavaScript)**:
  - Upgraded `sink.need_input` in `src/main.js`: on mobile screens (touch devices and narrow viewports), prompts for Python `input()` and program inputs automatically display the touch-friendly modal dialog.
  - Mobile keyboards on Android and iOS submit cleanly via standard `<form>` submission without losing focus or dropping Enter keys.
- **Stop Button & Modal Lifecycle**:
  - Clicking the **Stop** button or pressing <kbd>Escape</kbd> automatically dismisses the prompt modal and gracefully unblocks worker runtime execution.

---

## 🚀 Version 1.1.1
*Release Date: November 2026*

### 📱 Android WebView Runtime & Stop Synchronization Hardening
- **Stop State Protection**:
  - Filtered worker rejection errors (`e?.message === 'Stopped'`) in `warm()`, `run()`, and `runPhpDirect()` to prevent post-stop rejections from falsely tagging the runtime state as `Runtime failed` or outputting false error strings.
  - Synchronized secondary execution buttons (e.g., `#btnRunPhpSec`) alongside `#btnRun` to ensure full UI locking and unlocking across mobile viewports.
- **Android Release v1.1.1**:
  - Bumped Android Gradle release configuration to `versionCode 3`, `versionName "1.1.1"` to force clean cache invalidation and reliable installation across Android package managers.
  - Re-compiled and signed standalone APK (`ThinkCodeLab-release.apk`) and App Bundle (`ThinkCodeLab-release.aab`).

---

## 🚀 Version 1.1.0
*Release Date: November 2026*

### 🐘 PHP Dual-Section Split Editor & Form-to-Backend Practical Workflow
- **Dual-Section Code Editor Layout (`index.html` + `process.php`):**
  - Designed specifically for student practicals (BCA, B.Sc. IT, Computer Engineering) to solve the confusion between client-side HTML markup and server-side PHP logic.
  - **Section 1: 🌐 HTML Form (Frontend) • `index.html`** with syntax highlighting and action targeting `process.php`.
  - **Section 2: 🐘 PHP Code (Backend) • `process.php`** with syntax highlighting and `$_POST` / `$_GET` handling.
  - Interactive draggable splitter (`#dualResizer`) allowing students to adjust vertical editor proportions dynamically.
- **Three View Modes in Editor Header:**
  - `[ ⬍ Split ]`: 50/50 dual editor view displaying both frontend markup and backend script.
  - `[ 🌐 HTML ]`: 100% full-height focus on the HTML form.
  - `[ 🐘 PHP ]`: 100% full-height focus on the PHP script (ideal for pure CLI algorithms).
- **Clean Blank Starter Structures:**
  - Removed all bloated pre-baked sample templates (admission portals, login dashboards, CLI demos).
  - Provided clean, empty default tag structures: standard `<form action="process.php" method="POST">` in HTML, and `<?php ?>` in PHP so students can write their practicals from scratch.
- **Dedicated Execution Controls:**
  - Added `[ ▶ Run PHP ]` direct execution button on the PHP editor header and Output toolbar.
  - Added `[ 🌐 Preview Form ]` button on the HTML editor header and Output toolbar.
  - **Smart Run Detection:** In Split mode, if the student wrote PHP code and HTML is blank (no inputs), clicking the main **Run** button automatically executes the PHP code directly in the console.
- **Preview Link Containment & Navigation Fix:**
  - Sandboxed navigation interceptor inside the preview iframe: links like `<a href="index.html">Try again</a>` safely reload the student's HTML form rather than navigating the iframe to the IDE homepage.
- **Output Pane Simplification:**
  - Configured `input: null` for PHP in the language registry, hiding the redundant raw STDIN "Program input" box and maximizing console workspace.
- **Brand Logo & Console Identity:**
  - Replaced the chemistry flask icon with a modern laptop / code console terminal symbol across the header, desktop browser tab, and mobile navigation.
- **Runtime Stop & Re-Run Lifecycle Fix:**
  - Resolved a state synchronization deadlock where clicking the Stop button failed to reset the `running` flag and left the Run button permanently disabled on `"Running..."`.
  - Added deterministic `try ... finally { running = false; syncButtons(); }` blocks to both general and PHP run functions.
  - Enhanced `WorkerEngine.stop()` to cleanly terminate workers, reject pending ready states, resolve execution promises, and reset promise chains, ensuring that subsequent runs immediately spawn a fresh runtime and execute without delay.
- **Native Android Release v1.1.0:**
  - Bumped `versionCode 2`, `versionName "1.1.0"` in Gradle build configuration.
  - Generated and signed production-ready standalone APK (`ThinkCodeLab-release.apk`) and Google Play App Bundle (`ThinkCodeLab-release.aab`).

---

## 🚀 Version 0.3.0
*Release Date: November 2026*

### 🐘 PHP 8.2 WebAssembly Engine & HTML Form CGI Bridge (Phase 2)
- **100% Offline PHP 8.2 WebAssembly Runtime:**
  - Bundled standalone PHP 8.2.11 WebAssembly runtime (`php.js` and `php.wasm` [12 MB]) inside `public/php/` and `dist/php/`.
  - Self-contained, zero-network execution with full support for OOP, arrays, math, regex, and json functions.
- **Interactive HTML ➔ PHP Form Submission Bridge:**
  - Implemented client-side CGI request simulation: automatically populates `$_POST`, `$_GET`, `$_REQUEST`, and `$_SERVER["REQUEST_METHOD"]`.
  - Smart code preprocessor: seamless execution of both standard CLI `<?php` scripts, raw statements, and HTML documents with embedded `<?php ... ?>` blocks.
  - Form interception hook inside the `preview` iframe intercepts HTML `<form method="POST">` submissions, marshals field values via `FormData`, and dispatches them to the PHP WebAssembly engine without any page reload or remote server.
- **Dual Output Routing (Console & Live Web Preview):**
  - When PHP outputs HTML markup, ThinkCode Lab automatically renders the visual page in the **Preview** tab with real-time response updates.
  - Standard text / CLI outputs continue to stream cleanly to the **Console** tab with microsecond timestamps.
- **One-Click Tools Bar Templates:**
  - Added **HTML Form Sample** button: loads and previews a complete student registration portal with input validation, course dropdowns, and live POST confirmation.
  - Added **CLI Sample** button: loads interactive standard input `fgets(STDIN)` demonstration.
- **CodeMirror 6 Syntax Highlighting:**
  - Integrated `@codemirror/lang-php` for tokenized keyword, variable, and class highlighting.

---

## 🚀 Version 0.2.0
*Release Date: November 2026*

### 🌟 Major Highlights & New Capabilities
- **True In-Console Interactive Stdin for Python 3.12:**
  - Implemented multi-threaded blocking I/O using `SharedArrayBuffer` and `Atomics.wait()` / `Atomics.notify()`.
  - Replaced the pre-buffered input panel with an inline, auto-focusing `<input class="con-input">` injected directly into the `#console` DOM stream right next to prompt strings (e.g. `Your name: `).
  - Pressing `Enter` commits the user's input as an immutable `<span class="con-val">` in the console log and instantly wakes up the Pyodide WebAssembly thread.
  - Full sequential multi-prompt support: correctly pauses on first prompt, waits for user response, resumes, prints second prompt, and pauses again without skipping.
- **`TextDecoder` SharedArrayBuffer Compatibility Fix:**
  - Resolved `TypeError: Failed to execute 'decode' on 'TextDecoder': The provided ArrayBufferView value must not be shared.`
  - Ensured data slices transferred across the shared array buffer are cloned into a non-shared `Uint8Array` before decoding, eliminating `OSError: [Errno 29] I/O error` across modern Chromium and Safari engines.
- **Obsidian Dark Mode with Luminous Glowing Borders:**
  - Modernized UI color tokens with deep obsidian dark backgrounds (`#090E15`) and raised surfaces (`#0E1622`).
  - Added luminous cyan/blue ambient glowing borders (`--box-glow`, `--box-glow-hover`, `--box-glow-focus`) to:
    - Code Editor Pane (`.pane`)
    - Output / Terminal Console Pane (`.pane`)
    - SQL Table Data Grid & Schema Cards (`.tablewrap`, `.tcard`, `.scard`)
    - File Name Badge & Tab Chips (`.fname`, `.chip`, `.tabs`)
- **Native Android APK Build & Verification:**
  - Initialized Capacitor 6 native Android platform (`npx cap add android`).
  - Configured `@capacitor/assets` to generate 74 adaptive icons and vector splash screens from master brand icon.
  - Embedded self-hosted Pyodide WASM, sql.js WASM, and web fonts into `android/app/src/main/assets/public`.
  - Compiled and verified standalone 12 MB debug APK (`ThinkCodeLab.apk`) via Gradle 8.2.1 and OpenJDK 17.
- **Comprehensive Project Documentation:**
  - Created dedicated technical guides: `PROJECT_OVERVIEW.md`, `TECH_STACK.md`, `CHANGELOG.md`, `ROADMAP.md`, and master `README.md`.
  - Implemented strict user-guided backup rules in `MEMORY.md`.

---

## 📦 Version 0.1.0 — Initial Foundation
*Release Date: November 2026*

### 🛠️ Core Engines & Language Runtimes
- **Python 3.12 Engine:**
  - Bundled Pyodide 0.26.4 runtime locally in `public/pyodide/` for 100% offline execution.
  - Implemented isolated Web Worker execution (`src/engines/python.worker.js`).
  - Configured custom stdout/stderr stream decoders.
- **Oracle-Compatible SQL Engine:**
  - Integrated `sql.js` (SQLite WASM) in a dedicated background worker (`src/engines/sql.worker.js`).
  - Implemented 4 complete relational database schemas:
    - **SCOTT:** Classic Oracle department/employee tables (`DEPT`, `EMP`, `SALGRADE`, `BONUS`).
    - **UNIVERSITY:** Academic schema (`STUDENTS`, `COURSES`, `INSTRUCTORS`, `ENROLLMENTS`, `DEPARTMENTS`).
    - **BANK:** Financial schema (`CUSTOMERS`, `ACCOUNTS`, `TRANSACTIONS`, `BRANCHES`).
    - **WORKSPACE:** Clean sandbox schema for open student experimentation.
  - Developed custom Oracle SQL compatibility layer emulating Oracle functions: `NVL`, `NVL2`, `DECODE`, `INITCAP`, `LPAD`, `RPAD`, `TO_CHAR`, `TO_DATE`, `TRUNC`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `LISTAGG`, `SYSDATE`, `DUAL`, `MINUS`, `ROWNUM`, and `CREATE SEQUENCE`.
  - Added transaction control semantics: `COMMIT`, `ROLLBACK`, `SAVEPOINT`, and `ROLLBACK TO`.
  - Built interactive Schema Tab, table viewer, column inspector, DDL generator, and 60+ preloaded practice queries.
- **JavaScript Engine:**
  - Web Worker execution with `AsyncFunction` sandbox.
  - Console methods interception (`log`, `warn`, `error`, `table`, `dir`).
- **HTML/CSS Live Web Preview:**
  - Sandboxed `<iframe>` rendering with instant code synchronization and console forwarding.
- **Linux Bash Shell Simulator:**
  - In-browser virtual UNIX shell with virtual file system stored in `localStorage`.
  - 35+ core shell commands, pipelines (`|`), and file redirections (`>`, `>>`, `<`).

### 🎨 User Interface & Editor
- Integrated CodeMirror 6 with custom syntax highlighters for Python, JavaScript, SQL, and HTML.
- Built responsive split-pane layout supporting touch-drag resizing on mobile phones and desktop split views.
- Created dark and light themes with quick toggle.
- Added code download, file export, reset, and quick execution keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter`).

