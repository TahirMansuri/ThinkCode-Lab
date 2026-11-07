<div align="center">

<img src="public/assets/icon.svg" width="96" height="96" alt="ThinkCode Lab Logo" style="border-radius:20px; box-shadow: 0 8px 24px rgba(255,176,74,0.3);" />

# ⚡ ThinkCode Lab
### 100% Offline Multi-Language Code Playground & Mobile IDE for Students

> **Write, Compile & Execute Anywhere — Zero Latency, Zero Backend.**  
> Built for Computer Science and IT students to practice Java, Python, C, C++, PHP, Oracle SQL, JavaScript, HTML/CSS, and Linux Shell with true interactive runtime input and GUI window emulation directly on Web and Android.

[![Parent Initiative: ThinkCode](https://img.shields.io/badge/Companion_To-ThinkCode_Visualizer-8e5bd6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://thinkcode.infogalaxy.space/)
[![Live Web App](https://img.shields.io/badge/Live_App-thinkcode--lab.web.app-FFB04A?style=for-the-badge&logo=firebase&logoColor=black)](https://thinkcode-lab.web.app)
[![Android APK v1.3.2](https://img.shields.io/badge/Android-APK_v1.3.2_(17.6MB)-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://thinkcode-lab.web.app/download)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br>

[✨ Key Features](#-key-features) • [🧩 Supported Languages](#-supported-languages-all-100-offline) • [📚 Syllabus Practicals](#-university-syllabus-practicals-library) • [🚀 Quick Start](#-quick-start) • [📱 Android App](#-android-app-apk) • [📖 Documentation](#-complete-documentation-directory) • [👤 Author](#-author) • [📄 License](#-license)

---

</div>

## 🌟 Why ThinkCode Lab?

Most online code playgrounds and cloud IDEs rely on remote backend servers to spin up Docker containers. While functional, they suffer from significant drawbacks for students:
- **Server Latency & Spin-up Delays:** 500ms to 2s wait times on every run.
- **Unreliable Connectivity:** Fails completely without stable internet access.
- **Pre-buffered Input Limitations:** Forcing students to provide all inputs in a text box before running code, destroying the natural flow of sequential `input()` prompts.
- **Heavy Desktop IDE Requirements:** Heavy IDEs (VS Code, Android Studio, PyCharm, Eclipse) overwhelm student laptops and budget smartphones.

**ThinkCode Lab** redefines the student coding experience by executing **100% client-side** using WebAssembly and isolated Web Workers.

| Feature | Generic Cloud Compilers | Standard Mobile Code Apps | ⚡ ThinkCode Lab |
| :--- | :---: | :---: | :---: |
| **Server Latency** | 500ms – 2s | N/A | **0ms (Instant Local WASM)** |
| **Offline Capability** | ❌ Requires Internet | ⚠️ Limited / Ad-supported | **✅ 100% Fully Offline** |
| **Interactive Terminal Input** | ❌ Pre-buffered Stdin | ⚠️ Often Broken | **✅ True Sequential In-Console Input** |
| **Java Desktop Windows** | ❌ Headless / Text only | ❌ None | **✅ Simulated AWT/Swing Desktop Frame** |
| **Oracle SQL Simulation** | ❌ Standard SQLite only | ❌ None | **✅ Live Schemas + Oracle Dialect** |
| **PHP Form Practicals** | ❌ Requires Apache/XAMPP | ❌ None | **✅ Dual-Section Split Form Bridge** |
| **Multi-Language Breadth** | Usually 1-2 | Usually 1 | **✅ 8 Runtimes (Java/Python/C/C++/PHP/SQL/JS/Shell)** |
| **Native Android App** | ❌ Web-only | ⚠️ Heavy (>100 MB) | **✅ Ultra-compact APK (~17.6 MB)** |
| **Zero Backend Cost** | ❌ Expensive cloud | ⚠️ Ads / Subscriptions | **✅ Open-Source & Self-Contained** |

---

## ✨ Key Features

- **⚡ Instant 0ms Execution:** Code compiles and executes directly on the client device CPU via WebAssembly and Web Workers.
- **☕ Java AWT / Swing Desktop Window Emulation:**
  - Running GUI code like `JFrame`, `JLabel`, `JTextField`, `JPasswordField`, `JButton` renders an authentic interactive desktop window modal with title bar, minimize `—`, maximize `▢`, and close `✕` buttons.
  - Interactive layouts (`GridLayout`, `BorderLayout`, `FlowLayout`) and live event listeners.
- **📐 Adaptive Mobile Split Pane (80:20 ➔ 65:35):**
  - **Initial State:** 80% Code Editor : 20% Output for comfortable reading on mobile screens without scrolling.
  - **Auto-Expansion on Run:** Automatically animates output open to **65%** height upon clicking **Run**.
  - Reset to 80:20 on **Clear**, tab switch, practical selection, or template reset.
- **⌨️ True In-Console Interactive Stdin:**
  - Python `input()`, Java `Scanner`, C `scanf`, and C++ `cin >>` capture sequential input in real-time inside the console.
- **🐘 PHP 8.2 Dual-Section Form Workspace:**
  - Dual CodeMirror editors separating HTML Frontend (`index.html`) from PHP Backend (`process.php`) with 3 view modes (`Split`, `HTML`, `PHP`).
  - Client-side CGI bridge automatically populates `$_POST`, `$_GET`, `$_REQUEST` from HTML form submissions.
- **🗄️ Oracle-Compatible SQL Lab:**
  - 4 Pre-seeded schemas: **SCOTT** (`EMP`, `DEPT`, `SALGRADE`, `BONUS`), **UNIVERSITY**, **BANK**, and **WORKSPACE**.
  - Emulates Oracle functions: `NVL`, `NVL2`, `DECODE`, `INITCAP`, `LPAD`, `RPAD`, `TO_CHAR`, `TO_DATE`, `TRUNC`, `ADD_MONTHS`, `MONTHS_BETWEEN`, `LAST_DAY`, `LISTAGG`, `SYSDATE`, `DUAL`, `MINUS`, `ROWNUM <= n`.
  - Transaction control (`COMMIT`, `ROLLBACK`, `SAVEPOINT`) and 1-click **Export to CSV / TSV**.
- **🔍 Dual Compact Zoom Toolbars:**
  - Independent `A−` and `A+` zoom controls for both Code Editor and Output Console.
- **📏 Universal 2-Space Indentation:**
  - Clean 2-space tab indentation across all practical assignments and templates to prevent line wrapping on mobile.
- **📱 Standalone Native Android App:**
  - Built with Capacitor 6, targeting Android API 36 (`minSdkVersion 24`), signed with production keystore.

---

## 🧩 Supported Languages (All 100% Offline)

| Language | Engine / Technology | Environment | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Java (JDK)** | AST Transpiler & Swing Runner | Web Worker | Classes, Overloading, Overriding, Interfaces, `try-catch-finally`, `Scanner`, AWT/Swing GUI Window Frame, simulated JDBC |
| **Python 3.12** | Pyodide 0.26.4 (CPython WASM) | Web Worker | Full stdlib, interactive in-console `input()`, clean tracebacks |
| **C (C99)** | PicoC WebAssembly (WASM) | Web Worker | Real pointers, `malloc`/`free`, `struct`, unions, arrays, `stdio.h`, interactive `scanf` |
| **C++** | JSCPP + OOP Transpiler | Web Worker | `iostream` (`cin`/`cout`), `cmath`, classes, constructors, methods, inheritance, sequential input |
| **PHP 8.2** | php-wasm (PHP 8.2.11 WASM) | Web Worker | Dual-Section Split workspace, client-side CGI bridge (`$_POST`/`$_GET`), instant HTML preview |
| **Oracle SQL** | sql.js (SQLite WASM) + Oracle Layer | Web Worker | SCOTT/UNIVERSITY schemas, Oracle functions (`NVL`, `ROWNUM`, `SYSDATE`), transactions, CSV export |
| **Linux Shell** | Virtual UNIX Bash Emulator | Main Thread | 35+ commands, persistent virtual FS (`localStorage`), stream pipes (`\|`), redirections |
| **HTML / CSS** | Sandboxed `<iframe>` | Main Thread | Instant live preview, DOM error forwarding, console log capture |
| **JavaScript** | ES2022+ Engine | Web Worker | Modern async runtime, touch-friendly mobile `prompt()` & `alert()` modals |

---

## 📚 University Syllabus Practicals Library

ThinkCode Lab comes pre-loaded with **78 official university lab practicals** formatted with clean **2-space indentation** for instant 1-click loading:

| Subject / Course | Practical Count | Topics Covered |
| :--- | :---: | :--- |
| **Python (CA-214)** | **11** | Basic I/O, Conditions, Prime Range, Fibonacci, Matrix Addition, Functions & Recursion, Tuples/Sets, Dictionaries, OOP Class, File Handling, Inheritance |
| **Java (CA-313 / CA-315)** | **16** | Student Info, Switch Arithmetic, Array Largest, CLI Args, Scanner Input, Constructors, Overloading, Inheritance, Overriding, Interface Area, Strings, Exceptions, **AWT Calculator**, **Swing Login Form**, JDBC Connection, CRUD Operations |
| **C++ (CA-113 & CA-123)** | **17** | Arithmetic, Control Flow, Loops, Primes, Factorial, Fibonacci, 2D Matrix, Functions, Strings, Structs, Exam Tabulation, Default Args, Class, Constructors, Inheritance, Refrigerator App |
| **Linux Shell (CA-123)** | **10** | Commands Demo, Fibonacci, Time Greeting, Login Check, Factorial, Divisible by 7, Prime, Palindrome, Armstrong Number, Result Sheet Filtering |
| **Oracle SQL (CA-223)** | **8** | DDL Create Table, DML Insert/Update/Delete, WHERE & ORDER BY, Aggregate Functions & GROUP BY, Joins, Subqueries & Nested Queries, Views, Sequences |
| **HTML / Web-I (CA-115)** | **7** | Headings & Paragraphs, Formatting, Lists, Links & Images, Tables, Student Registration Form, Frameset & CSS |
| **JavaScript (CA-125)** | **4** | Dynamic Greetings, Factorial Calculation, Form Validation, Digital Clock & DOM |
| **C Programming** | **5** | Factorial, Pointers & Swapping, Array Search, Struct Student, Dynamic Memory (`malloc`/`free`) |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- Modern web browser (Chrome, Brave, Edge, Firefox, or Safari)

### 1. Clone & Install
```bash
git clone https://github.com/TahirMansuri/ThinkCode-Lab.git
cd ThinkCode-Lab

npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production Web Distribution
```bash
npm run build
```
Optimized static assets will be output to `dist/`.

### 4. Deploy Live to Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 📱 Android App (Release APK)

ThinkCode Lab compiles into a standalone, 100% offline native Android application (~17.6 MB) with all WASM runtimes embedded:

```bash
# 1. Build and sync web assets to Android
npm run build
npx cap sync android

# 2. Assemble signed production Release APK
cd android
./gradlew assembleRelease
```
- **Compiled Release APK:** `ThinkCodeLab.apk` (~17.6 MB)
- **Target API:** API 36 (Android 16) | **Min API:** API 24 (Android 7.0+)
- **Live Download:** **[thinkcode-lab.web.app/download](https://thinkcode-lab.web.app/download)**

---

## 📖 Complete Documentation Directory

All technical architecture guides, engine specifications, changelogs, roadmaps, and developer memory files are systematically organized inside the [`docs/`](docs/) directory:

- 📘 [**docs/01_PROJECT_OVERVIEW.md**](docs/01_PROJECT_OVERVIEW.md) — Vision, problem statement, core value proposition, and target audience.
- 🛠️ [**docs/02_TECH_STACK.md**](docs/02_TECH_STACK.md) — Technical architecture, threading model, and runtime protocols.
- ⚙️ [**docs/03_ENGINE_ARCHITECTURE.md**](docs/03_ENGINE_ARCHITECTURE.md) — Deep dive into Java AST/Swing emulation, C/C++ PicoC/JSCPP, Clang upgrade path, PHP CGI bridge, and Oracle SQL layer.
- 📝 [**docs/04_CHANGELOG.md**](docs/04_CHANGELOG.md) — Comprehensive version history from v1.0.0 through **v1.3.2**.
- 🗺️ [**docs/05_ROADMAP.md**](docs/05_ROADMAP.md) — Completed milestones, near-term enhancements (Multi-file manager, PL/SQL, ER diagrams), and future ecosystem plans.
- 🚀 [**docs/06_PLAYSTORE_RELEASE.md**](docs/06_PLAYSTORE_RELEASE.md) — Keystore credentials, SHA-256 certificate fingerprints, Play Protect appeal guide, and Play Store submission details.
- 🧠 [**docs/07_DEVELOPER_MEMORY.md**](docs/07_DEVELOPER_MEMORY.md) — Developer memory, strictly enforced rules (Web-only deployment, backup policy), and technical gotchas learned.

---

## 👤 Author

<table style="border: none; background: transparent;">
  <tr>
    <td width="100px" align="center" valign="middle">
      <img src="https://github.com/TahirMansuri.png" width="90px" style="border-radius: 50%; box-shadow: 0 4px 12px rgba(255,176,74,0.3);" alt="Tahir Mansuri" />
    </td>
    <td>
      <h3 style="margin: 0;">Tahir Mansuri</h3>
      <p style="margin: 4px 0; color: #58a6ff; font-weight: 600;">
        Lead System Engineer &amp; HOD, IMRD College
      </p>
      <p style="margin: 4px 0; color: #8b949e;">
        Creator of <b>ThinkCode Lab</b> &amp; <b>ThinkCode</b> • 8+ Years of Experience in IT, Systems Engineering, and Software Development
      </p>
      <p style="margin: 6px 0 0 0;">
        <a href="https://github.com/TahirMansuri">
          <img src="https://img.shields.io/badge/GitHub-TahirMansuri-181717?style=flat-square&logo=github" alt="GitHub Profile" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
