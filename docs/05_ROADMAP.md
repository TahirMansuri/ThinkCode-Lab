# 🗺️ ThinkCode Lab — Strategic Roadmap & Future Milestones

> **Strategic product roadmap outlining completed milestones, near-term enhancements, and long-term architectural expansions for ThinkCode Lab.**

---

## 🎯 High-Level Phase Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     PHASE 1     │     │     PHASE 2     │     │     PHASE 3     │     │     PHASE 4     │
│  [COMPLETED]    │ ──▶ │  [COMPLETED]    │ ──▶ │  [COMPLETED]    │ ──▶ │  [COMPLETED]    │
│                 │     │                 │     │                 │     │                 │
│ • Python 3.12   │     │ • PHP 8.2 WASM  │     │ • C (C99) PicoC │     │ • Java JDK AST  │
│ • Oracle SQL    │     │   Runtime       │     │   WASM Engine   │     │   Transpiler    │
│ • JavaScript    │     │ • Dual Split    │     │ • C++ Engine    │     │ • Swing/AWT GUI │
│ • HTML/CSS Web  │     │   Editor        │     │ • OOP Classes   │     │   Window Frame  │
│ • Bash Shell    │     │ • CGI Form      │     │ • 17 Practicals │     │ • 16 Practicals │
│ • CodeMirror 6  │     │   Bridge        │     │ • Clang Guide   │     │ • Try-Catch-Fin │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                 │
                                                                                 ▼
                                                        ┌─────────────────────────────────┐
                                                        │         PHASES 5 & 6            │
                                                        │       [IN DEVELOPMENT]          │
                                                        │                                 │
                                                        │ • Adaptive 80:20 Split [DONE]   │
                                                        │ • 2-Space Indentation  [DONE]   │
                                                        │ • Multi-File Project Manager    │
                                                        │ • PL/SQL Blocks & ER Diagrams   │
                                                        │ • Clang WASM Downloadable Pack  │
                                                        └─────────────────────────────────┘
```

---

## ✅ Completed Milestones

### 1. Phase 1: Core Multi-Language Foundations
- 100% offline client-side code execution using WebAssembly and Web Workers.
- Python 3.12 via Pyodide with interactive in-console `input()` and clean tracebacks.
- Oracle-compatible SQL simulation engine with 4 pre-seeded schemas (`SCOTT`, `UNIVERSITY`, `BANK`, `WORKSPACE`), transactions, and Oracle dialect functions (`NVL`, `DECODE`, `ROWNUM`, `SYSDATE`).
- Modern JavaScript sandbox with mobile touch-friendly `prompt()` and `alert()` modals.
- Sandboxed HTML/CSS Web Preview with real-time DOM synchronization.
- Virtual Linux Bash Shell with 35+ commands, stream pipelines (`|`), file redirects, and persistent virtual filesystem.

### 2. Phase 2: PHP 8.2 Engine & Dual-Section Practical Workspace
- Standalone PHP 8.2.11 WebAssembly SAPI (`php.wasm`).
- Dual-Section Code Editor with 3 view modes (`Split`, `HTML`, `PHP`) for frontend form (`index.html`) + backend script (`process.php`).
- Client-side CGI form bridge simulating `$_POST`, `$_GET`, `$_REQUEST`, and `$_SERVER['REQUEST_METHOD']`.
- Standalone algorithm execution via `[ ▶ Run PHP ]` button.

### 3. Phase 3: Systems Programming — C & C++ Offline Engines
- C99 execution via PicoC WebAssembly (~800 KB bundle) supporting true pointers, `malloc`/`free`, structs, unions, arrays, and standard libraries.
- C++ execution combining `JSCPP` procedural evaluation with an OOP Transpiler Runner for user classes, constructors, methods, and inheritance.
- Authentic `g++` compiler diagnostics with visual caret (`^`) indicators.
- Embedded university practicals drawer with 17 C++ assignments and 10 Linux Shell practicals.

### 4. Phase 4: Enterprise Languages — Java JDK Engine & Desktop AWT/Swing Emulation
- Offline Java compiler and AST transpiler supporting classes, constructors, methods, overloading, overriding, inheritance, interfaces, and exception handling (`try-catch-finally`).
- Interactive `Scanner` input with sequential in-console prompting.
- Interactive AWT / Swing desktop window frame emulation (`JFrame`, `JLabel`, `JTextField`, `JPasswordField`, `JButton`, `GridLayout`, `BorderLayout`, `FlowLayout`) with draggable titlebar, minimize/maximize/close, and modal reopening.
- 16 TYBCA university syllabus assignments preloaded.

### 5. Phase 5: Student Ergonomics & Responsive UI (v1.3.2)
- Adaptive **80% Code Editor : 20% Output** initial split ratio on mobile devices.
- Auto-expansion to **65% Output / 35% Editor** upon clicking **Run**.
- Universal **2-space indentation** applied across all 78 syllabus practicals.
- Dual compact zoom toolbars (`A−` / `A+`) for both Editor and Output consoles.

---

## 🚀 Near-Term Roadmap (Phase 6)

### 📁 1. Multi-File Project Workspace
- Collapsible file tree sidebar to create, rename, delete, and switch between project files (`main.py`, `utils.py`, `data.csv`, `styles.css`).
- Local workspace persistence in browser `IndexedDB` with 1-click **Export as .ZIP** and **Import .ZIP**.

### 🗄️ 2. Advanced SQL: PL/SQL Blocks & Dynamic ER Diagrams
- **PL/SQL Anonymous Blocks**: Support `DECLARE ... BEGIN ... EXCEPTION ... END;` blocks with `DBMS_OUTPUT.PUT_LINE` emulation.
- **Dynamic ER Diagram Visualizer**: Auto-generate interactive SVG Entity-Relationship diagrams directly from active database schemas, visualizing tables, column types, primary keys, and foreign key relations.
- **SQL Execution Plan**: Visual query cost and index inspector using `EXPLAIN QUERY PLAN`.

### 📦 3. C++ Clang WASM Downloadable Pack (Option 2)
- Modular on-demand asset pack for full Clang/LLVM toolchain (~30 MB).
- Enables 100% C++17/20 standard compliance and the complete Standard Template Library (`<vector>`, `<map>`, `<set>`, `<algorithm>`, `<string>`, `<queue>`) for advanced competitive programming without inflating the initial base APK size.

### 📱 4. Google Play Store & Ecosystem Expansions
- Monitor Google Play Console production review for rollout in target regions.
- Implement Play Asset Delivery (PAD) for seamless on-demand packaging of optional runtime modules.
- Add code snippet sharing via web URLs (compressed hash parameters).
