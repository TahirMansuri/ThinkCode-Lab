# 📱 ThinkCode Lab — Project Overview

> **A high-performance, 100% offline multi-language code playground and mobile IDE for computer science students.**  
> *A companion project to [ThinkCode](https://thinkcode.infogalaxy.space/) by Tahir Mansuri.*

---

## 🎯 1. Vision & Origin

### Background & Motivation
In computer science and information technology education (particularly across universities and colleges like IMRD College), students frequently encounter severe infrastructure challenges:
1. **Unreliable Internet Connectivity:** In college laboratories and student homes, internet connectivity is often intermittent or firewall-restricted, rendering cloud-dependent web IDEs (Replit, CodeSandbox, GitHub Codespaces, Google Colab) sluggish or unusable.
2. **Server Infrastructure & Latency Bottlenecks:** Traditional online compilers rely on remote backend servers to spin up Docker containers for code execution. This introduces 500ms–2s latency per run, expensive recurring server hosting bills, rate limits, and denial-of-service risks.
3. **Bulky Desktop IDE Requirements:** Full-fledged desktop IDEs (VS Code, Android Studio, PyCharm, Eclipse, Oracle 19c) demand 8GB–16GB RAM, modern multi-core processors, and gigabytes of storage, which overwhelm budget student laptops and entry-level mobile devices.
4. **Mobile Learning Constraints:** Over 70% of students rely on Android smartphones or affordable tablets as their primary on-the-go study devices, where running native desktop compilers is virtually impossible.

### The Solution: ThinkCode Lab
**ThinkCode Lab** was engineered as the zero-latency, 100% offline coding playground and IDE companion to [ThinkCode](https://thinkcode.infogalaxy.space/) (the Interactive DSA Visualizer & Code Tracer).

While ThinkCode focuses on visual algorithm tracing and step-by-step memory inspection, **ThinkCode Lab** provides a complete, distraction-free code editor, compiler, and database laboratory. It runs entirely inside the client’s browser or as an ultra-compact (~17 MB) standalone native Android application powered by WebAssembly (WASM), Web Workers, and CodeMirror 6.

---

## 🌟 2. Core Value Proposition

| Pillar | How ThinkCode Lab Delivers |
| :--- | :--- |
| **100% Offline** | All 8 language runtimes (Python 3.12, Java JDK, C99, C++, PHP 8.2, Oracle SQL, JavaScript, Linux Shell) are self-hosted inside the app bundle. Zero network requests required to compile or run code. |
| **0ms Server Latency** | Execution occurs locally on the device's CPU via WebAssembly and Web Workers. Code begins executing instantaneously with zero cloud queue time. |
| **True Runtime Interactive Input** | Unlike typical online compilers that demand pre-entering all inputs in a static box before execution, ThinkCode Lab supports sequential, real-time in-console `input()`, `Scanner`, `cin >>`, and `scanf` prompts. |
| **Java Desktop Window Emulation** | Java AWT/Swing graphical applications open directly inside an interactive, draggable desktop window frame with title bar, minimize, maximize, close, and DOM layout managers. |
| **University Syllabus Practicals** | 78 official university lab assignments (FYBCA, SYBCA, TYBCA) preloaded with clean 2-space indentation and 1-click loading. |
| **Adaptive Split Pane** | Student-optimized vertical split: starts at **80% Code : 20% Output** for comfortable code viewing on mobile screens, and auto-expands to **65% Output** upon pressing **Run**. |
| **Cross-Platform Flexibility** | Runs as a responsive Single-Page Application (SPA) on desktop and mobile browsers, and as a native Android APK packaged via Capacitor 6. |

---

## 🧩 3. Supported Language Engines

ThinkCode Lab features 8 fully independent execution engines running in isolated sandboxes:

1. **Python 3.12 (CPython via Pyodide 0.26.4 WASM)**
   - Complete standard library execution in an isolated Web Worker (`python.worker.js`).
   - Interactive runtime `input()` and `sys.stdin` with inline console prompt injection and mobile touch modal.
   - Clean, student-friendly error tracebacks mapped back to user code.
   - 11 university syllabus practical assignments (CA-214: Python Programming Lab).

2. **Java JDK Simulation & AWT/Swing Window Engine (`java.worker.js`)**
   - 100% offline Java compiler and AST transpiler supporting classes, constructors, methods, overloading, overriding, inheritance, interfaces, and exception handling (`try-catch-finally`).
   - Interactive `Scanner` input with sequential in-console prompting.
   - **Interactive Desktop Window Frame:** Full AWT/Swing graphical window emulation (`JFrame`, `JLabel`, `JTextField`, `JPasswordField`, `JButton`, `GridLayout`, `BorderLayout`, `FlowLayout`) with draggable title bar, minimize/maximize/close, and floating reopen button.
   - Simulated JDBC connectivity (`DriverManager`, `Connection`, `Statement`, `ResultSet`) for academic database practicals.
   - 16 TYBCA university syllabus practical assignments (CA-313 / CA-315).

3. **C (C99) Real WebAssembly Execution Engine (`c.worker.js`)**
   - 100% offline ANSI/C99 execution via PicoC WebAssembly (~800 KB bundle).
   - Real pointer arithmetic, dynamic memory (`malloc`/`free`), structures (`struct`), unions, arrays, functions, recursion, and standard headers (`<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`).
   - Interactive in-console `scanf` and `getchar` supported via `SharedArrayBuffer` (`Atomics.wait`) and input queue.
   - 5 university syllabus practical assignments.

4. **C++ Interactive & OOP Engine (`cpp.worker.js`)**
   - Native `<iostream>` (`cin >>`, `cout <<`, `endl`), formatted I/O (`<iomanip>`), `<cmath>`, 1D/2D arrays, recursion, and pointer arithmetic via JSCPP.
   - User-defined classes (`class`), constructors, destructors, access specifiers (`public:`/`private:`), member methods, and object lifecycles via OOP Transpiler.
   - Real-time sequential input ordering (`cout` outputs before `cin` blocks).
   - 17 university syllabus practical assignments (CA-113 & CA-123).

5. **PHP 8.2 (Official WebAssembly SAPI Runtime & Dual-Section Workspace)**
   - Standalone PHP 8.2.11 WebAssembly engine (`php.wasm`) self-hosted in `public/php/`.
   - **Dual-Section Split Editor:** Separates HTML frontend form (`index.html`) from PHP backend script (`process.php`) with 3 view modes (`Split`, `HTML`, `PHP`).
   - **Client-Side CGI Simulation:** Real-time form submission via `FormData` populating `$_POST`, `$_GET`, `$_REQUEST`, and `$_SERVER['REQUEST_METHOD']`.
   - Standalone script execution via dedicated `[ ▶ Run PHP ]` button for testing algorithms.

6. **Oracle-Compatible SQL Engine (SQLite WASM + Translation Layer)**
   - 4 pre-seeded relational schemas: **SCOTT** (EMP, DEPT, SALGRADE, BONUS), **UNIVERSITY**, **BANK**, and **WORKSPACE**.
   - Transaction semantics: `COMMIT`, `ROLLBACK`, `SAVEPOINT`, and `ROLLBACK TO`.
   - Comprehensive Oracle function emulation: `NVL`, `NVL2`, `DECODE`, `INITCAP`, `LPAD`, `RPAD`, `TO_CHAR`, `TO_DATE`, `TRUNC`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `LISTAGG`, `SYSDATE`, `DUAL`, `MINUS`, `ROWNUM`, and `CREATE SEQUENCE`.
   - Interactive Schema Inspector, row count metrics, automatic DDL viewer, 60+ preloaded practice queries, and table export to CSV/TSV.
   - 8 university syllabus practical assignments (CA-223).

7. **Virtual Linux Bash Shell Emulator (`shell.js`)**
   - In-browser virtual filesystem persisted in `localStorage`.
   - Supports 35+ core UNIX commands (`ls`, `cat`, `grep`, `mkdir`, `rm`, `find`, `curl`, `tree`, `wc`, `head`, `tail`, `touch`, `chmod`, `alias`, etc.).
   - UNIX pipelines (`|`), input/output redirections (`>`, `>>`, `<`), environment variables (`$VAR`), command substitution (`$(...)`, `$((...))`), and control flow (`if`/`for`/`while`).
   - 10 university syllabus practical assignments (CA-123).

8. **Modern JavaScript (ES2022+ Engine) & HTML/CSS Live Web Preview**
   - Sandboxed Web Worker executing modern JavaScript via `AsyncFunction`.
   - Console intercepts (`log`, `warn`, `error`, `table`, `info`, `dir`).
   - Touch-friendly `prompt()` and `alert()` modal dialog (`#promptModal`) with non-blocking Promise resolution and virtual keyboard support.
   - Sandboxed `<iframe>` Web Preview with instant live reload and render-on-run toggle.
   - 7 HTML/CSS assignments (CA-115) + 4 JavaScript assignments (CA-125).

---

## 👥 4. Target Audience & Educational Impact

- **BCA, B.Sc. (IT/CS), B.Tech, and MCA Students:** Practicing programming assignments, lab practicals, database queries, and web design directly from budget laptops or mobile phones.
- **Computer Science Educators:** Conducting interactive classroom demonstrations without relying on campus internet firewalls or server maintenance.
- **Competitive Programmers & Self-Learners:** Testing code snippets, algorithm edge cases, and SQL logic instantly without spinning up local Docker containers or terminal environments.

---

## 👤 5. Leadership & Credits

- **Author & Lead System Architect:** **Tahir Mansuri** (Lead System Engineer & HOD, IMRD College)
- **Parent Initiative:** [ThinkCode — Interactive DSA Visualizer & Code Tracer](https://thinkcode.infogalaxy.space/)
- **License:** Open Source under the **MIT License**.
