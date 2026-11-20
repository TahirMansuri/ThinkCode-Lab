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
│               PHASE 5                   │     │               PHASE 6                   │
│             [COMPLETED]                 │ ──▶ │             [COMPLETED]                 │
│                                         │     │                                         │
│ • Adaptive 80:20 Split & Attached UI    │     │ • 1-Tap Lab Journal A4 PDF              │
│ • Quick-Symbol Strip & Beautifier       │     │ • Silent APK Update Checker             │
│ • Slim Header & Slide-Out Drawer        │     │ • Python Data Science Suite (NumPy,     │
│ • Native Android Stdin & Edge-to-Edge   │     │   Pandas, Matplotlib, Scikit-learn,     │
│ • v1.3.4 Build 11 APK Released          │     │   Seaborn) & Inline Plotting            │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│               PHASE 7                   │     │               PHASE 8                   │
│             [COMPLETED]                 │ ──▶ │             [COMPLETED]                 │
│                                         │     │                                         │
│ • Android Back-Gesture Interception     │     │ • Serverless Code Sharing via URL Hash  │
│ • Exit Confirmation Dialog (#exitDialog)│     │ • Pure-JS Offline ISO/IEC 18004 QR Code │
│ • Python input() Prompt Streaming Fix   │     │ • Share Dialog & Mobile App Sharing     │
│ • Google Play Live (com.igc.thinkcodelab)│     │ • Hash Auto-Hydration & Backup Safety   │
│ • v1.3.8 Build 15 AAB & APK Released    │     │ • 99-Check Automated Test Suite         │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘
                                                                 │
                                                                 ▼
                                                ┌─────────────────────────────────────────┐
                                                │               PHASE 9                   │
                                                │               [QUEUED]                  │
                                                │                                         │
                                                │ • My Saved Programs (IndexedDB)         │
                                                │ • Classroom Auto-Graded Challenge Links │
                                                │ • Replay Input Presets & Error Hints    │
                                                │ • Clang C/C++ On-Demand Package         │
                                                │ • Multi-File Project Workspace          │
                                                └─────────────────────────────────────────┘
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

### 6. Phase 6: Academic Productivity & Sideload Update Workflow (`v1.3.5`)
- ✅ **1-Tap Student Lab Journal / Assignment A4 PDF Export**: Offline pure-JS JPEG-in-PDF 1.4 generator (`src/lab-journal.js`), sticky Student Profile, live preview modal, Android native print adapter, and 10-check verification (`scripts/test-journal.mjs`).
- ✅ **Silent In-App APK Update Check**: Zero-telemetry `/version.json` manifest with CORS/CORP/`no-store` headers, auto-hydrating `/download` portal, Menu dot badge, `popover="manual"` toast + 24h snooze, native `getAppVersion()`/`openExternalUrl()` bridges, and 10-check verification (`scripts/test-update-checker.mjs`).
- ✅ **Python Data Science & Scientific Suite**: On-demand package manager for NumPy, Pandas, Matplotlib, Scikit-learn, Seaborn + openpyxl (`src/python-tools.js`, `<dialog id="pyPkgDialog">`), client-side VFS CSV/Excel file uploader (`<dialog id="pyDataFilesDialog">`), pre-seeded sample datasets (`students.csv`, `iris.csv`, `sales.csv`), inline Matplotlib plot visualizer with copy/download PNG, 5 new Unit 4 practicals (83 total), and 12-check verification (`scripts/test-python-datascience.mjs`).

### 7. Phase 7: Android Navigation Polish & Google Play Store Launch (`v1.3.6` – `v1.3.8`)
- ✅ **Android Back-Gesture Hierarchical Dismissal & Exit Dialog (`v1.3.6`)**: Intercepts Android hardware and gesture back navigation via `OnBackPressedCallback`, cleanly closing dropdowns, drawer, modal dialogs, and Java GUI frames before presenting a confirmation dialog. 5-check test suite (`scripts/test-backpress-exit.mjs`).
- ✅ **Google Play Developer Policy Compliance (`v1.3.7`)**: Tailored update CTAs in native Android builds to point directly to Google Play Store listing (`com.igc.thinkcodelab`) while preserving direct APK downloads for Web students.
- ✅ **Python `input()` Prompt Streaming Fix (`v1.3.8`)**: Pyodide `isatty: false` configuration, unbuffered line streaming via `emitStdout()` and `flushStdoutBuffer()`, ensuring sequential `input()` prompts appear in `#console` prior to user typing.
- ✅ **Google Play Production Release (`v1.3.8 / Build 15`)**: Signed App Bundle (`ThinkCodeLab-v1.3.8.aab`, 17.5 MB) and Standalone APK (`ThinkCodeLab-v1.3.8.apk`, 17.7 MB) published with target API 36 compliance. Full 85-check automated verification suite passing.

### 8. Phase 8: Serverless Code Sharing & Offline QR Code (`v1.3.9`)
- ✅ **100% Serverless, Private Code Sharing (`src/code-sharer.js`)**: Pure-JS URL-safe LZ-String dictionary compression serializing language, code, and secondary HTML code into compact `#c=...` hash fragments without accounts, cloud databases, or tracking.
- ✅ **Pure-JS Offline ISO/IEC 18004 QR Code Generator (`src/qr-code.js`)**: $GF(2^8)$ Galois Field arithmetic, Reed-Solomon polynomial ECC, Versions 1–40, 8 penalty masks, high-contrast camera-scannable Canvas 2D and SVG vector output with zero external CDN dependencies.
- ✅ **Interactive Share Dialog (`<dialog id="shareDialog">`)**: High-contrast QR card, link input with live compression metrics, one-tap Copy with visual feedback, native app sharing via `@capacitor/share`, and PNG QR image download.
- ✅ **Incoming Share Auto-Hydration**: Automatic boot and `hashchange` link unpacking, previous code safety snapshot in `localStorage` (`cf.share.backup`), automatic language switching, and clean hash clearing via `history.replaceState`.
- ✅ **Automated Verification**: 17 automated unit tests (`scripts/test-code-sharer.mjs`).

### 9. Phase 9: TYBCA Web Technology-I (PHP CA-317(A)) Practicals Suite (`v1.3.10`)
- ✅ **10 Syllabus Practicals (`src/practicals.js`)**: Comprehensive university syllabus implementation covering basic I/O & date, arithmetic calculations, loops/tables, user functions & arrays, MySQL URL parameter insertion, database CRUD operations, HTML form processing & validation, login/logout session authentication, file upload & cookies, and OOP classes with JSON API generation (`json_encode`).
- ✅ **Dual-Mode Workspace Integration (`src/main.js`)**: Automatic loading of both `editorPhp` (`process.php`) and `editorHtml` (`index.html`) with auto-switching to split view and live iframe preview for form-based assignments.
- ✅ **Lab Journal & Testing (`src/lab-journal.js`, `scripts/test-php-practicals.mjs`)**: Configured `SUBJECT_DEFAULTS.php` to `'Web Technology-I (PHP) Lab (CA-317(A))'`, automated 6-test suite (`npm run test:php`), expanding total project tests to **91 checks** and global practicals count to **93**.

---

## 🔜 Approved Next Queue (Shortlisted for `v1.4.0+`)

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
