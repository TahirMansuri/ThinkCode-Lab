# 📱 ThinkCode Lab — Project Overview

> **A high-performance, 100% offline multi-language code playground and mobile IDE for computer science students.**  
> *A companion project to [ThinkCode](https://thinkcode.infogalaxy.space/) by Tahir Mansuri.*

---

## 🎯 1. Vision & Origin

### Background
In computer science and information technology education (particularly across universities and colleges like IMRD College), students frequently face severe infrastructure bottlenecks:
1. **Unreliable Internet Connectivity:** In many lab and home environments, internet access is intermittent or limited, making cloud-dependent IDEs (Replit, CodeSandbox, GitHub Codespaces, Google Colab) sluggish or unusable.
2. **Server Infrastructure Costs:** Online compilers typically rely on remote cloud servers to spin up Docker containers for code execution. This introduces 500ms–2s latency, ongoing server hosting costs, security risks (container escapes, DDoS), and rate limits.
3. **Heavy Desktop IDE Requirements:** Traditional IDEs (VS Code, Android Studio, PyCharm, Eclipse, Oracle 19c) require high RAM (8GB–16GB), modern CPUs, and GBs of disk space, which many student laptops and mobile devices cannot handle.
4. **Mobile Learning Constraints:** Students often have smartphones or budget tablets as their primary or on-the-go devices, where running standard compilers natively is difficult.

### The Solution: ThinkCode Lab
**ThinkCode Lab** (formerly CodeForge) was engineered as the dedicated coding playground and IDE companion to [ThinkCode](https://thinkcode.infogalaxy.space/) (the Interactive DSA Visualizer & Code Tracer).

While ThinkCode focuses on visual algorithm tracing and step-by-step memory inspection, **ThinkCode Lab** provides a full-featured, zero-latency, offline code editor and compiler lab. It runs entirely inside the client’s browser or as a lightweight (~16 MB) native Android application using WebAssembly (WASM) and Web Workers.

---

## 🌟 2. Core Value Proposition

| Pillar | How ThinkCode Lab Delivers |
| :--- | :--- |
| **100% Offline** | All runtimes (Python 3.12, PHP 8.2, SQLite/Oracle WASM, JavaScript, Shell) are self-hosted inside the app bundle. Zero network requests required to compile or run code. |
| **0ms Server Latency** | Execution happens directly on the device CPU through WebAssembly. Code begins executing instantaneously with zero queue or cloud spin-up time. |
| **True Runtime Interactive Input** | Unlike typical online compilers that require pre-entering all inputs in a text box before execution, ThinkCode Lab supports sequential, real-time in-console `input()` / `fgets(STDIN)` prompts. |
| **Multi-Language Breadth** | Python 3.12, PHP 8.2, Oracle-compatible SQL, JavaScript, HTML/CSS Web Preview, and Linux Bash Shell in a single unified interface, with C/C++ and Java on the roadmap. |
| **Cross-Platform Flexibility** | Runs as a responsive Single-Page Web App (SPA) on desktop/mobile browsers, and as an offline native Android APK packaged via Capacitor. |
| **Student-First UX** | Obsidian dark mode with glowing luminous borders, collapsible panels, draggable split pane, built-in practice SQL schemas (SCOTT, UNIVERSITY, BANK), and pre-loaded queries. |

---

## 🧩 3. Supported Language Engines (Current & Planned)

### Currently Available (Phase 1 & Phase 2)
1. **Python 3.12 (CPython via Pyodide 0.26.4 WASM)**
   - Full standard library execution in an isolated Web Worker.
   - Interactive runtime `input()` and `sys.stdin` with inline console prompt injection.
   - Robust error stack traces mapped back to user code.
2. **PHP 8.2 (Official WebAssembly SAPI Runtime & Dual-Section Practical Workspace)**
   - Full standalone PHP 8.2.11 engine bundled offline in WebAssembly (`php.wasm`).
   - Supports OOP classes, typed constructors, arrays, JSON functions, regex, and math.
   - **Dual-Section Split Editor:** Separates HTML frontend form (`index.html`) from PHP backend script (`process.php`) with 3 view modes (`Split`, `HTML`, `PHP`).
   - **Client-Side CGI Simulation:** Real-time form submission via `FormData` populates `$_POST`, `$_GET`, `$_REQUEST`, and `$_SERVER['REQUEST_METHOD']`.
   - **Standalone Script Execution:** Dedicated `[ ▶ Run PHP ]` button for testing pure algorithms and console scripts directly.
   - Clean blank practical structure tailored for academic syllabi (BCA, B.Sc. IT, MCA).
   - Syntax highlighting powered by `@codemirror/lang-php` and `@codemirror/lang-html`.
3. **Oracle-Compatible SQL Engine (SQLite 3.46.0 WASM + Translation Layer)**
   - Live pre-seeded relational schemas: **SCOTT** (EMP, DEPT, SALGRADE, BONUS), **UNIVERSITY**, **BANK**, and **WORKSPACE**.
   - Transaction semantics: `COMMIT`, `ROLLBACK`, `SAVEPOINT`, and `ROLLBACK TO`.
   - Comprehensive Oracle function emulation: `NVL`, `NVL2`, `DECODE`, `INITCAP`, `LPAD`, `RPAD`, `TO_CHAR`, `TO_DATE`, `TRUNC`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `LISTAGG`, `SYSDATE`, `DUAL`, `MINUS`, `ROWNUM`, and `CREATE SEQUENCE`.
   - Interactive Schema Inspector, table row counters, DDL generator, and 60+ preloaded practice queries.
4. **Modern JavaScript (ES2022+ Worker Engine)**
   - Sandboxed execution with asynchronous loop safety and timeout guards.
   - Console intercepts (`log`, `warn`, `error`, `table`, `info`, `dir`).
   - Interactive runtime `prompt()` support.
5. **HTML / CSS / JS Live Web Preview**
   - Sandboxed `<iframe>` with instant live reload and render-on-run toggle.
   - DOM error capturing and bidirectional console message forwarding.
6. **Virtual Linux Bash Shell Emulator**
   - In-browser virtual filesystem persisted in `localStorage`.
   - Supports 35+ UNIX commands (`ls`, `cat`, `grep`, `mkdir`, `rm`, `find`, `curl`, `tree`, `wc`, `head`, `tail`, `touch`, `chmod`, `alias`, etc.).
   - UNIX pipelines (`|`), input/output redirections (`>`, `>>`, `<`), environment variables (`$VAR`), and control flow (`if`/`for`/`while`).

### In Development (Phase 3 – Phase 5)
- **C / C++**: Compilation and execution via Clang WASM + WASI runtime pack.
- **Java**: Bytecode execution via JVM WebAssembly.

---

## 👥 4. Target Audience & Educational Impact

- **BCA, B.Sc. (IT/CS), B.Tech, and MCA Students:** Practicing programming assignments, lab practicals, database queries, and web design directly from budget laptops or mobile phones.
- **Computer Science Educators:** Conducting interactive classroom demonstrations without relying on university internet firewalls or server maintenance.
- **Competitive Programmers & Hobbyists:** Testing code snippets, algorithm edge cases, and SQL logic instantly without spinning up local Docker containers or terminal environments.

---

## 👤 5. Leadership & Credits

- **Project Lead & Author:** **Tahir Mansuri** (Lead System Engineer & HOD, IMRD College)
- **Parent Initiative:** [ThinkCode — Interactive DSA Visualizer & Dual-Engine Code Tracer](https://thinkcode.infogalaxy.space/)
- **License:** Open Source under the **MIT License**.
