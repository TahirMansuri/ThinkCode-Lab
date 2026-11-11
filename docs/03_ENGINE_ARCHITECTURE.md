# ⚙️ Multi-Engine Architecture & Implementation Guide — ThinkCode Lab

> **In-depth technical architecture of all 8 offline compilation, interpretation, and emulation engines in ThinkCode Lab, including Java AWT/Swing desktop emulation and the C/C++ Clang upgrade path.**

---

## ☕ 1. Java Offline Engine & Desktop AWT/Swing Architecture

### 1.1 Overview
The Java engine (`src/engines/java.worker.js`) provides a 100% offline, lightweight Java compiler, AST transpiler, and graphical window environment. Designed specifically for college Computer Science and BCA curricula (such as TYBCA CA-313 and CA-315), it eliminates the need to install a heavy 400 MB JDK or bloated IDE on student devices.

### 1.2 Transpilation Pipeline
```plaintext
Java Source Code (Main.java)
       │
       ▼
[AST Tokenizer & Lexer]
       │
       ▼
[Java OOP Synthesizer]
   ├── Class & Constructor Normalization
   ├── Method Overloading Dispatcher (by argument count & types)
   ├── Interface & Inheritance Binder (extends / implements / super)
   └── Exception Hierarchy Mapper (try-catch-finally polymorphism)
       │
       ▼
[AWT / Swing Component Extractor]
   ├── Detects JFrame, JPanel, JLabel, JTextField, JButton, etc.
   ├── Extracts Layout Managers (GridLayout, BorderLayout, FlowLayout)
   └── Binds Event Listeners (ActionListener, Button Clicks)
       │
       ▼
[Sandboxed Runtime Execution]
   ├── Console Output (System.out.println / printf)
   ├── Interactive Scanner Input Bridge
   └── GUI DOM Message Dispatch (to #guiWindowModal in Main Thread)
```

### 1.3 Key Java Capabilities Implemented
1. **Try-Catch-Finally Exception Handling**:
   - Transpiles typed catch blocks (`catch (ArithmeticException e)`, `catch (ArrayIndexOutOfBoundsException e)`) into JavaScript runtime error classification.
   - Built-in exception classes with full inheritance: `Throwable` ➔ `Exception` ➔ `RuntimeException` ➔ `ArithmeticException`, `NullPointerException`, `NumberFormatException`, `ArrayIndexOutOfBoundsException`, `SQLException`.
   - `.getMessage()` and `.printStackTrace()` emulation.
2. **Method & Constructor Overloading**:
   - Methods sharing identical names with different signatures are dynamically dispatched based on argument count and runtime types (e.g. `area(double)`, `area(double, double)`).
3. **Interactive Console Scanner**:
   - Synchronous `Scanner(System.in)` with `next()`, `nextLine()`, `nextInt()`, and `nextDouble()`.
4. **Interactive AWT / Swing Desktop Window Frame**:
   - Calling `frame.setVisible(true)` triggers an event dispatched from the worker to the main UI thread.
   - Main thread renders a simulated desktop window frame with title bar, coffee icon ☕, minimize `—`, maximize `▢`, close `✕` buttons, and draggable movement.
   - Full layout support for `GridLayout(rows, cols)`, `BorderLayout`, and `FlowLayout`.
   - Native event binding: clicking simulated buttons in the GUI window executes Java action listeners, updates text fields, and logs event triggers to the console.

---

## ⚙️ 2. C & C++ Compilation & Interpretation Architecture

### 2.1 Architectural Evaluation & Strategy
To run C and C++ inside an offline-first mobile IDE without remote cloud compilers, three architectural approaches were evaluated:

| Parameter | ⚡ Option 1: Lightweight Embedded Engine *(Active)* | 📦 Option 2: Clang WASM On-Demand Pack *(Future Upgrade)* | 🚀 Option 3: Pre-Bundled Clang WASM |
| :--- | :--- | :--- | :--- |
| **App Size Impact** | **+1.2 MB to APK** | **0 MB to Base APK** *(~30 MB on-demand)* | **+45 to 60 MB to Base APK** |
| **Startup / Compile Speed** | **Instantaneous (< 50 ms)** | 1.5 – 3.5 seconds | 1.5 – 3.5 seconds |
| **Offline Execution** | 100% Offline out-of-the-box | 100% Offline after 1-time download | 100% Offline out-of-the-box |
| **RAM Footprint** | Extremely low (< 25 MB) | Moderate (~120–200 MB during LLVM compile) | Moderate (~120–200 MB during LLVM compile) |
| **Academic Syllabus Fit** | **Covers 100% of BCA / CS lab practicals** | Advanced C++17/20 STL & Competitive Programming | Advanced C++17/20 STL & Competitive Programming |

### 2.2 Active Implementation (Option 1 — Hardened Unified Engines)
- **C Engine (`src/engines/c.worker.js`)**:
  - Embedded [PicoC](https://github.com/jpoirier/picoc) ANSI/C99 interpreter compiled directly to WebAssembly (`public/picoc/picoc.js`).
  - Spawns fresh, isolated pre-warmed PicoC WASM instances per execution (with Emscripten's `Module.then` stripped so Promises resolve cleanly without thenable recursion).
  - Unbuffered `stdout` (`setbuf(stdout, 0)` auto-injected into `main()` and direct `stream_ops.write` streaming) + single-line-stop `stdin` (`b === 10`) over `SharedArrayBuffer` / `Atomics` on Web or the synchronous `POST /__native_stdin` `NativeStdinBridge` on Android WebView, preventing EOF retry loops and ensuring prompts flush before blocking input.
  - Supports true pointers (`int *p = &x`, `**p`), `malloc()` and `free()`, structs, unions, arrays, `long long`/`%lld` normalization, `<conio.h>` tolerance, and standard headers (`stdio.h`, `stdlib.h`, `string.h`, `math.h`).
- **C++ Engine (`src/engines/cpp.worker.js`)**:
  - **Single Unified Pipeline** powered by patched `JSCPP` (`public/jscpp/jscpp.js` + `scripts/jscpp-string.js`), removing the legacy regex OOP split-brain runner.
  - Token-aware validation and AST/lowering passes support full `std::string` (`getline`, `cin.ignore`, `substr`, `find`, `append`), `<iomanip>`, references (`&`), pointers & hex addresses, `struct`, shared-memory `union`, and OOP classes, constructors, overloading, and inheritance.
  - Interactive on-demand `cin >>` input bridge (via `SharedArrayBuffer` or `NativeStdinBridge` on Android) ensuring preceding `cout <<` prompts stream before blocking for input.
- **Automated Regression Suite (`scripts/test-c-cpp.mjs`)**:
  - Run `npm run test:ccpp` to verify `SharedArrayBuffer` streaming, all C/C++ templates and syllabus practicals, Beautify formatter round-trips, error recovery, and UI `setState()` null-guards.

### 2.3 Future Upgrade: Clang WASM Downloadable Pack (Option 2)
When ThinkCode Lab expands to advanced competitive programming and full C++ Standard Template Library (`<vector>`, `<map>`, `<algorithm>`), Option 2 will be activated:
```plaintext
Client Browser / Android App
 ├── Base App (~17 MB) [Python, Java, PHP, SQL, JS, Shell, C/C++ Lightweight]
 └── "Download Clang Pack" (Triggered on demand)
      ├── Fetches: clang.wasm (~22 MB gzip) + lld.wasm (~8 MB) + sysroot.tar (~6 MB)
      ├── Caches in: Capacitor Filesystem (Native) or CacheStorage / IndexedDB (Web)
      └── Spawns: clang.worker.js with memfs in-memory virtual filesystem
```

---

## 🐘 3. PHP 8.2 Engine & Dual-Section Practical Workspace

### 3.1 Architecture
The PHP engine (`src/engines/php.worker.js`) embeds the official PHP 8.2.11 WebAssembly SAPI (`@php-wasm/web`).

### 3.2 Dual-Section Split Workspace
Academic web design and server-side scripting syllabi require writing an HTML frontend form that submits data to a separate PHP backend processing script. ThinkCode Lab solves this entirely client-side without requiring Apache, Nginx, or XAMPP:
1. **Independent CodeMirror Editors**:
   - `editorHtml`: Configured with HTML syntax highlighting for `index.html`.
   - `editorPhp`: Configured with PHP syntax highlighting for `process.php`.
2. **Three Workspace View Modes**:
   - `[ ⬍ Split ]`: Displays both HTML and PHP editors vertically with a draggable resizer.
   - `[ 🌐 HTML ]`: Maximizes the HTML form editor.
   - `[ 🐘 PHP ]`: Maximizes the PHP script editor.
3. **Client-Side CGI Form Bridge**:
   - An event listener inside the Preview `<iframe>` traps form submissions (`<form method="POST" action="process.php">`).
   - Extracts submitted field values via `FormData`.
   - Synthesizes PHP CGI global superglobals: `$_SERVER['REQUEST_METHOD']`, `$_POST`, `$_GET`, `$_REQUEST`.
   - Executes the PHP script in `php.worker.js` with the populated CGI environment and renders the output directly in the Preview or Output tab.
4. **Standalone Script Execution**:
   - The `[ ▶ Run PHP ]` button allows running pure PHP algorithms and console scripts without HTML.

---

## 🗄️ 4. Oracle SQL Engine & Relational Schema Architecture

### 4.1 Architecture
The SQL engine (`src/engines/sql.worker.js`) combines `sql.js` (SQLite compiled to WebAssembly) with a comprehensive Oracle SQL compatibility translation layer.

### 4.2 Compatibility Layer & Features
1. **Oracle Dialect Emulation**:
   - Custom User-Defined Functions (UDFs): `NVL(x, y)`, `NVL2(x, y, z)`, `DECODE()`, `INITCAP()`, `LPAD()`, `RPAD()`, `TO_CHAR()`, `TO_DATE()`, `TRUNC()`, `ADD_MONTHS()`, `MONTHS_BETWEEN()`, `LAST_DAY()`, `LISTAGG()`, `SYSDATE`, `DUAL`, `MINUS`, and `ROWNUM <= n`.
2. **Pre-Seeded Schemas**:
   - `SCOTT`: Classic Oracle educational schema (`EMP`, `DEPT`, `SALGRADE`, `BONUS`).
   - `UNIVERSITY`: Academic relational schema (`STUDENTS`, `COURSES`, `INSTRUCTORS`, `ENROLLMENTS`, `DEPARTMENTS`).
   - `BANK`: Financial schema (`CUSTOMERS`, `ACCOUNTS`, `TRANSACTIONS`, `BRANCHES`).
   - `WORKSPACE`: Blank sandbox database for student DDL/DML practice.
3. **Transaction State Machine**:
   - Explicit `COMMIT`, `ROLLBACK`, and `SAVEPOINT` management.
   - Data persists across sessions in `localStorage` as base64-encoded binary images (`cf.sql.db.<SCHEMA>`).
4. **Data Visualization & Export**:
   - Structured table rendering with row indices and query duration (`⚡ ms`).
   - 1-click **Copy to Clipboard (TSV)** and **Export to CSV**.

---

## 🐧 5. Virtual Linux Shell Emulator Architecture

### 5.1 Architecture
The Linux shell engine (`src/engines/shell.js`) implements a client-side UNIX command interpreter and virtual filesystem.

### 5.2 Key Components
1. **Virtual Filesystem (VFS)**:
   - Inode-based tree structure with directories, files, permissions, and timestamps.
   - Persisted across app restarts in browser `localStorage`.
2. **UNIX Pipelines & Redirections**:
   - Piping stdout to stdin (`cat file.txt | grep "pattern" | wc -l`).
   - Stream redirections (`> file.txt`, `>> file.txt`, `< input.txt`).
3. **Control Flow & Expansion**:
   - Loops and conditionals (`for x in 1 2 3; do ... done`, `if [ -f file ]; then ... fi`).
   - Command substitution (`CURRENT_USER=$(whoami)`).
   - Arithmetic expansion (`$((a + b * c))`).
4. **Supported Commands (35+)**:
   - Navigation & FS: `ls`, `cd`, `pwd`, `mkdir`, `rmdir`, `touch`, `cp`, `mv`, `rm`, `cat`, `head`, `tail`, `tree`, `find`.
   - Text Processing: `grep`, `wc`, `cut`, `paste`, `sort`, `uniq`, `tr`, `echo`.
   - System & Shell: `date`, `cal`, `whoami`, `uname`, `clear`, `export`, `alias`, `history`, `help`.

---

## 🐍 6. Python 3.12 Pyodide Architecture

### 6.1 Architecture
The Python engine (`src/engines/python.worker.js`) leverages Pyodide v0.26.4 (CPython 3.12 WebAssembly).

### 6.2 Key Components
1. **Self-Hosted Packaging**:
   - All runtime files (`pyodide.js`, `pyodide.asm.wasm`, `pyodide.asm.js`, and `python_stdlib.zip`) reside in `public/pyodide/`.
   - Operates 100% offline without accessing external CDNs.
2. **Interactive In-Console `input()`**:
   - Overrides `sys.stdin.readline` to invoke `Atomics.wait()` on a `SharedArrayBuffer` on Web, or `readNativeStdinSync()` via `POST /__native_stdin` on Android WebView.
   - The main thread injects an inline `<input>` field into `#console`, captures student typing, and writes the string to shared memory (or the native bridge slot), resuming CPython instantly.
