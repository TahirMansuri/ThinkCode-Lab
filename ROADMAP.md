# 🗺️ ThinkCode Lab — Future Roadmap & Planned Tasks

> Strategic roadmap outlining upcoming milestones, new language engines, mobile features, and architectural enhancements for **ThinkCode Lab**.

---

## 🎯 High-Level Phase Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHASE 1     │     │     PHASE 2     │     │     PHASE 3     │     │  PHASE 4 & 5    │
│  [COMPLETED]    │ ──▶ │  [COMPLETED]    │ ──▶ │  [COMPLETED]    │ ──▶ │   [FUTURE]      │
│                 │     │                 │     │                 │     │                 │
│ • Python 3.12   │     │ • PHP 8.2 WASM  │     │ • C (C99) PicoC │     │ • Java Runtime  │
│ • Oracle SQL    │     │   Runtime       │     │   WASM Engine   │     │ • Clang Pack    │
│ • JavaScript    │     │ • Split Editor  │     │ • C++ Engine    │     │   (Option 2)    │
│ • HTML/CSS Web  │     │ • Play Store    │     │ • OOP Classes   │     │ • PL/SQL Blocks │
│ • Bash Shell    │     │   AAB Release   │     │ • CodeMirror C  │     │ • ER Diagrams   │
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

## ⚙️ Phase 3: Systems Programming — C / C++ Offline Engine [✅ COMPLETED]

### 💻 1. C (C99) Real WebAssembly Execution Engine (`src/engines/c.worker.js`) [✅ COMPLETED]
- **Technology:** PicoC ANSI/C99 interpreter compiled to WebAssembly (~800 KB bundle, 0 external network requests).
- **Features Implemented:**
  - Real pointer arithmetic, address-of `&`, dereference `*`, double pointers `**`.
  - Dynamic memory allocation (`malloc`, `free`).
  - Structures (`struct`), unions, and typedefs for college data structures (Linked Lists, Stacks, Queues, Binary Trees).
  - Standard headers: `<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`, `<ctype.h>`.
  - Interactive `scanf` and `getchar` supported via `SharedArrayBuffer` (`Atomics.wait`) and input queue.

### ⚡ 2. C++ Interactive & OOP Engine (`src/engines/cpp.worker.js`) [✅ COMPLETED]
- **Technology:** JSCPP + OOP Transpiler Engine (~380 KB).
- **Features Implemented:**
  - Native `<iostream>` (`cin >>`, `cout <<`, `endl`), formatted I/O (`<iomanip>`), `<cmath>`, `<cstring>`.
  - Arrays (1D & 2D matrices), recursion, and pointer arithmetic.
  - User-defined classes (`class`), constructors, destructors, access specifiers (`public:`/`private:`), member methods, and object lifecycles.
  - CodeMirror syntax highlighting via `@codemirror/legacy-modes/mode/clike`.

### 📦 3. Future Upgrade Path: Clang WASM Downloadable Pack (Option 2)
- Detailed in [`C_CPP_ENGINE_ARCHITECTURE.md`](C_CPP_ENGINE_ARCHITECTURE.md).
- Allows on-demand downloading of full Clang/LLVM toolchain (~30 MB) when expanding to advanced C++ STL (`<vector>`, `<map>`, `<algorithm>`) without inflating the base APK size.

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
