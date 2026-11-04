# 🗺️ ThinkCode Lab — Future Roadmap & Planned Tasks

> Strategic roadmap outlining upcoming milestones, new language engines, mobile features, and architectural enhancements for **ThinkCode Lab**.

---

## 🎯 High-Level Phase Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHASE 1     │     │     PHASE 2     │     │     PHASE 3     │     │  PHASE 4 & 5    │
│  [COMPLETED]    │ ──▶ │  [IN PROGRESS]  │ ──▶ │   [PLANNED]     │ ──▶ │   [FUTURE]      │
│                 │     │                 │     │                 │     │                 │
│ • Python 3.12   │     │ • PHP 8.2 WASM  │     │ • Clang C/C++   │     │ • Java Runtime  │
│ • Oracle SQL    │     │   Runtime       │     │   WASM Compiler │     │ • PL/SQL Blocks │
│ • JavaScript    │     │ • File Manager  │     │ • Downloadable  │     │ • ER Diagrams   │
│ • HTML/CSS Web  │     │ • SQL CSV Export│     │   Offline Packs │     │ • Play Store    │
│ • Bash Shell    │     │ • Snippets Lib  │     │ • xterm.js Shell│     │   Release AAB   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🚀 Phase 2: PHP Runtime & Workspace Utilities (Near-Term)

### 🐘 1. PHP 8.2+ WebAssembly Engine & Dual-Section Practical Workspace [✅ COMPLETED]
- **Target Technology:** `@php-wasm/web` (~12 MB runtime).
- **Execution Target:** `src/engines/php.worker.js`.
- **Features Implemented:**
  - Full client-side offline PHP 8.2.11 WebAssembly execution.
  - Dual-Section Code Editor dividing HTML frontend form (`index.html`) from PHP backend (`process.php`).
  - 3 view modes (`Split`, `HTML`, `PHP`) with dynamic splitter grip.
  - Client-side CGI form bridge simulating `$_POST`, `$_GET`, `$_REQUEST`, and `$_SERVER['REQUEST_METHOD']`.
  - Preview iframe navigation sandbox preventing accidental IDE page reloads.
  - Dedicated `[ ▶ Run PHP ]` button for standalone algorithmic scripting without HTML.
  - Clean blank practical templates tailored for academic lab exercises.

### 📁 2. Multi-File Project Manager
- Add a collapsible file tree explorer sidebar to create, rename, and switch between multiple project files (`main.py`, `utils.py`, `data.csv`, `styles.css`).
- Persist student workspaces in browser `IndexedDB` with project import/export as `.zip`.

### 📊 3. SQL Data Export & Visualizations
- 1-click **Export to CSV / JSON** from query result grids.
- Add `EXPLAIN QUERY PLAN` visualization to teach students query optimization and index usage.

---

## ⚙️ Phase 3: Systems Programming — C / C++ Offline Engine (Mid-Term)

### 💻 1. In-Browser Clang / WASI Compiler
- **Architecture:** Downloadable offline pack leveraging LLVM Clang compiled to WebAssembly.
- **Pack Management:** On first use (or via Settings), download the ~25 MB Clang toolchain and cache it locally in Capacitor's native Filesystem (for Android) or CacheStorage (for Web).
- **Capabilities:**
  - Standard C (`gcc` / `clang`) and C++17/20 (`g++` / `clang++`).
  - Full STL support (`std::vector`, `std::map`, `std::string`, `std::algorithm`, pointers, structs, dynamic memory).
  - Interactive `cin` and `scanf` standard input handled via `SharedArrayBuffer` + `Atomics`.

### 🖥️ 2. Terminal Upgrade (xterm.js)
- Upgrade the simple terminal output box with a full-fledged [xterm.js](https://xtermjs.org/) terminal emulator.
- Add ANSI 256-color support, bash prompt customization, tab completion, command history navigation (`Up`/`Down` arrows), and clear shortcuts (`Ctrl+L`).

---

## ☕ Phase 4: Enterprise Languages — Java Runtime (Long-Term)

### ☕ 1. Java Execution Engine
- **Target Technology:** [CheerpJ](https://leaningtech.com/cheerpj/) or [TeaVM](https://teavm.org/) WebAssembly backend.
- **Core Focus:**
  - Standard Java SE syntax (`public static void main(String[] args)`).
  - Core OOP concepts (inheritance, polymorphism, interfaces, abstract classes).
  - Java Collections Framework (`ArrayList`, `HashMap`, `HashSet`, `LinkedList`).
  - Standard console input using `Scanner sc = new Scanner(System.in)`.

---

## 🗄️ Phase 5: Advanced Database & SQL Features

- **PL/SQL Anonymous Blocks:** Support `DECLARE ... BEGIN ... EXCEPTION ... END;` blocks with `DBMS_OUTPUT.PUT_LINE` emulation.
- **Interactive ER Diagram Generator:** Auto-render SVG Entity-Relationship diagrams dynamically from active database schemas (displaying tables, primary keys, and foreign key relations).
- **Query History & Bookmarking:** Save previously executed queries with execution time metrics and bookmark favorites.

---

## 📱 Phase 6: Mobile Distribution & Google Play Store

- **Production Signing [✅ COMPLETED]:** Generated official release keystore (`thinkcode-lab.keystore`) and configured Gradle release signing configs.
- **Signed Android App Bundle & APK [✅ COMPLETED]:** Built signed release APK (`ThinkCodeLab-release.apk`) and Android App Bundle (`ThinkCodeLab-release.aab`) v1.1.4 (`versionCode 6`) targeting API 36 with `minSdkVersion 24`.
- **Play Asset Delivery (PAD):** Modularize heavy offline language packs (Clang, JVM) as on-demand asset packs for future phases.
- **Google Play Console Release [✅ COMPLETED]:**
  - Store listing, high-resolution feature graphics (1024x500), 512x512 app icon, tablet/phone screenshots, and educational privacy policy completed.
  - Production track submitted and actively in review by Google Play.
- **GitHub Actions CI/CD:** Automated workflow to compile web assets, run headless Playwright test suite, and assemble debug/release APK artifacts on every commit.
