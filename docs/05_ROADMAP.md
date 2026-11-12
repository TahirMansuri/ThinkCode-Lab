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
│ • JavaScript    │     │ • Dual Split    │     │ • Unified JSCPP │     │ • Swing/AWT GUI │
│ • HTML/CSS Web  │     │   Editor        │     │ • 47-Test Suite │     │   Window Frame  │
│ • Bash Shell    │     │ • CGI Form      │     │ • 17 Practicals │     │ • 16 Practicals │
│ • CodeMirror 6  │     │   Bridge        │     │ • Clang Guide   │     │ • Try-Catch-Fin │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                 │
                                                                                 ▼
┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│               PHASE 5                   │     │           PHASE 6 (feature/v1.3.5)      │
│             [COMPLETED]                 │ ──▶ │         [WEB LIVE / IN PROGRESS]        │
│                                         │     │                                         │
│ • Adaptive 80:20 Split & Attached UI    │     │ • 1-Tap Lab Journal A4 PDF [DONE]       │
│ • Quick-Symbol Strip & Beautifier       │     │ • Silent APK Update Checker [DONE]      │
│ • Slim Header & Slide-Out Drawer        │     │ • My Saved Programs (IndexedDB) [NEXT]  │
│ • Native Android Stdin & Edge-to-Edge   │     │ • Classroom Auto-Graded Links [QUEUED]  │
│ • v1.3.4 Build 11 APK Released          │     │ • Input Replay + Error Hints [QUEUED]   │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘
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

### 5. Phase 5: Student Ergonomics, Hardened Engines & Android API 36 Polish (`v1.3.2` – `v1.3.4`)
- Adaptive **80% Code Editor : 20% Output** initial split ratio on mobile devices with auto-expansion to **65% Output** on **Run** and attached zero-waste IDE framing.
- Bottom-pinned 25-token Mobile Quick-Symbol Strip (`#quickBar`), One-Tap Offline Code Beautifier (`🪄` / `Shift+Alt+F`), ultra-slim 1-line header + slide-out drawer, and compact dual `A−`/`A+` zoom controls.
- Universal **2-space indentation** applied across all 78 syllabus practicals.
- Hardened PicoC C99 & unified patched `JSCPP` C++ engines backed by the 47-check `npm run test:ccpp` suite.
- Native Android `NativeStdinBridge` (`/__native_stdin`), Edge-to-Edge `WindowInsets` alignment, dynamic Light/Dark system bar contrast, and versioned APK downloads (`ThinkCodeLab-v1.3.4.apk`, Build 11).

### 6. Phase 6: Academic Productivity & Sideload Update Workflow (`feature/v1.3.5`)
- ✅ **1-Tap Student Lab Journal / Assignment A4 PDF Export**: Offline pure-JS JPEG-in-PDF 1.4 generator (`src/lab-journal.js`), sticky Student Profile, live preview modal, Android native print adapter, and 10-check verification (`scripts/test-journal.mjs`).
- ✅ **Silent In-App APK Update Check**: Zero-telemetry `/version.json` manifest with CORS/CORP/`no-store` headers, auto-hydrating `/download` portal, Menu dot badge, `popover="manual"` toast + 24h snooze, native `getAppVersion()`/`openExternalUrl()` bridges, and 10-check verification (`scripts/test-update-checker.mjs`).

---

## 🔜 Approved Next Queue (Shortlisted for `v1.3.5+`)

### 💾 1. My Saved Programs (IndexedDB) + Undo-Safe Practical Loading
- Dedicated personal sketch/program notebook stored locally in `IndexedDB`, allowing students to name, bookmark, filter, and switch programs across sessions while preserving undo/backup safety whenever loading a syllabus practical over unsaved edits.

### 🎓 2. Classroom Auto-Graded Test / Challenge Links (Zero-Backend Teacher Tool)
- Serverless challenge link builder enabling teachers to encode assignment prompts, starter code, and hidden stdin/stdout test cases into a shareable URL hash that grades student solutions 100% locally on device.

### 🔁 3. "Replay Last Input" Presets + Student-Friendly Error Hints
- One-tap replay of recent runtime stdin answers so students debugging `scanf`/`cin`/`input()` loops don't re-type test inputs repeatedly, paired with plain-English diagnostic hints beneath cryptic compiler/runtime errors.

---

## 🚀 Longer-Term Roadmap (Phase 7+)

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
- Add Viva Voce quick-reference drawer and serverless QR code sharing.
