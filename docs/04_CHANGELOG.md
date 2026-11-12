# 📝 ThinkCode Lab — Changelog & Completed Milestones

> **Comprehensive chronological record of all versions, architectural updates, engine implementations, bug fixes, and user experience enhancements for ThinkCode Lab.**

---

## 🚀 Version 1.3.5 (In Progress on `feature/v1.3.5` — Live on Web IDE)
*Development Window: November 2026 (Staged for Build 12 APK)*

### 🔔 Silent In-App APK Update Checker & Dynamic Manifest (`src/update-checker.js`, `public/version.json`)
- **Zero-Telemetry Update Manifest (`/version.json`)**:
  - Published structured metadata manifest in [`public/version.json`](../public/version.json) (`versionName`, `versionCode`, `releaseDate`, `apkFilename`, `apkSize`, `apkSizeBytes`, `apkUrl`, `fallbackUrl`, `sha256`, `minSdk`, and `releaseNotes`).
  - Configured explicit headers in `firebase.json` (`Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin`, `Cache-Control: no-cache, no-store, must-revalidate`) so both isolated Web contexts and native Android WebViews read fresh version metadata reliably.
- **Native Android Version & External Browser Bridges (`MainActivity.java`)**:
  - Extended `SystemUiBridge` (`ThinkCodeSystemUI`) with `getAppVersion()` (exposing true `PackageInfo` `versionName` + `versionCode`) and `openExternalUrl(url)` (launching validated `https://` APK downloads cleanly in Android's system browser).
- **Non-Intrusive Update UX (`index.html`, `src/main.js`, `src/styles.css`)**:
  - Added silent background update checks on startup and resume (throttled to 4 hours), a pulsing badge indicator (`#menuUpdateDot`), slide-out Drawer `App Updates` item (`#menuBtnCheckUpdate`) with live version badge (`#drawerVerLabel`), a top-layer `popover="manual"` `#updateToast` (automatically deferred while any modal/drawer is open, with 24h snooze dismissal), and `<dialog id="updateDialog" closedby="any">` release-notes modal with **Download APK** / **Open Download Page** actions and a Web demo trigger (`?checkUpdate=simulate`).
- **Auto-Hydrating Download Portal (`public/download.html`)**:
  - Upgraded `/download` to progressively fetch `/version.json`, dynamically updating version pills, APK filename/size cards, direct download URLs, and a collapsible `<details>` "What's New" release notes list.
- **Automated Verification (`scripts/test-update-checker.mjs`)**:
  - Added **10** automated unit checks covering `parseSemver`, `compareSemver`, `evaluateUpdateStatus` (`versionCode` + semver precedence), `sanitizeHttpUrl`, throttling, 24h snooze logic, and `public/version.json` integrity.

### 📄 1-Tap Offline Student Lab Journal & Assignment A4 PDF Export (`src/lab-journal.js`)
- **Zero-Dependency Pure-JS A4 PDF 1.4 Writer**:
  - Built [`src/lab-journal.js`](../src/lab-journal.js) combining high-DPI multi-page Canvas 2D A4 rendering with an embedded JPEG-in-PDF 1.4 binary writer + semantic `@media print` HTML export, working **100% offline** with zero cloud APIs or external heavy PDF libraries.
- **Academic Format & Sticky Student Profile (`<dialog id="journalDialog">`)**:
  - Added accessible trigger buttons (`#btnJournal` and Drawer item) opening a live A4 preview dialog with persistent Student Profile fields (`Institute`, `Department`, `Student Name`, `Roll No.`, `Class`, `Academic Year` in `cf.journal.profile`), auto-inferred subject and practical title, optional source code + line numbers, captured execution output (console text, SQL table results, Web iframe text, or Java Swing component snapshot), and faculty/examiner signature footer.
- **Native Android Print Adapter (`MainActivity.java`)**:
  - Added `ThinkCodeSystemUI.printDocument(title)` invoking Android `PrintManager` alongside `@capacitor/filesystem` / Web Blob `.pdf` export.
- **Automated Verification (`scripts/test-journal.mjs`)**:
  - Added **10** automated checks validating profile persistence, title/subject inference, language keyword tokenization, multi-page A4 pagination, and strict PDF 1.4 `xref` byte-offset validity.

### 🗂️ Workflow & Repository Hygiene (`f5ad090`)
- Created dedicated feature branch `feature/v1.3.5` for clean incremental releases, added `.firebase/` hosting cache to `.gitignore`, organized Play Store promotional assets, and codified the no-VDI / manual-testing workflow rule in `docs/07_DEVELOPER_MEMORY.md`.

---

## 🚀 Version 1.3.4 (Build 11) — Native Android Edge-to-Edge Header Alignment & Dynamic System Bar Contrast
*Release Date: November 2026*

### 📱 Fixed Top Header Misalignment & Android 15/16 Edge-to-Edge Collision
- **Root Cause Fixed**: On Android 15/16 (`targetSdkVersion = 36`, `EDGE_TO_EDGE_ENFORCED`), Capacitor 6 `BridgeActivity` placed the WebView underneath the translucent status bar (`env(safe-area-inset-top) > 0`), while `.top` in `src/styles.css` enforced a rigid `height: 40px;` (`box-sizing: border-box`), leaving only ~12px inner height for 22–32px header controls and causing header buttons to crowd the status bar and spill onto the language tab rail.
- **Native `WindowInsets` Handling (`MainActivity.java`)**:
  - Enabled explicit `WindowCompat.setDecorFitsSystemWindows(window, false)` with `ViewCompat.setOnApplyWindowInsetsListener` on `android.R.id.content` covering `systemBars() | displayCutout() | ime()` and returning `WindowInsetsCompat.CONSUMED` so WebView sits strictly between system bars/notch and soft keyboard without CSS double-padding.
  - Added `@JavascriptInterface` `SystemUiBridge` (`ThinkCodeSystemUI.setTheme(isLight)`) called from `src/main.js` (`theme()`) after splash dismissal to dynamically update system bar backgrounds (`#0E1622` dark / `#FFFFFF` light) and `WindowInsetsControllerCompat` light/dark status & navigation icon appearance.
- **Responsive Header & Navigation Drawer Polish (`src/styles.css`, `index.html`)**:
  - Replaced rigid `height: 40px;` on `.top` with flexible `min-height: calc(46px + env(safe-area-inset-top, 0px)); height: auto; padding: calc(env(safe-area-inset-top, 0px) + 5px) 12px 5px;`, centered `.brand`, `.btn-dev-lead`, and `.btn-menu` along one horizontal midline, defined `--hover`, and added `body { padding-bottom: env(safe-area-inset-bottom, 0px); }`.
  - Fixed Android Chromium compositor tile overlap and long runtime-status text truncation inside `#menuDrawer` (`contain: layout paint;`, solid `.drawer-header`/`.drawer-body`, `flex-shrink: 0;` header/footer), and tightened console ready-banner margins (`margin: 4px auto`) so status notices fit inside the 20% initial Output pane.
- **Verified & Packaged (`ThinkCodeLab-v1.3.4.apk`)**:
  - Verified visually on an Android API 36 emulator (`Pixel_3a_API_36`) in Dark Mode, Drawer Open, and Light Mode plus `47/47` automated C/C++ runtime checks (`npm run test:ccpp`).
  - Updated version metadata to **`v1.3.4 (Build 11)`** across `android/app/build.gradle`, `index.html`, `public/download.html`, and Firebase 302 redirects (`/ThinkCodeLab-v1.3.4.apk`, `/ThinkCodeLab.apk`, `/apk`).

---

## 🚀 Version 1.3.3 (Build 10) — Native Android Interactive Stdin Bridge & Hardened C/C++ Engines
*Release Date: November 2026*

### 📱 Native Android WebView Stdin Bridge (`MainActivity.java` & Workers)
- **Solved Missing `SharedArrayBuffer` on Android WebView**:
  - Android System WebView forces `window.crossOriginIsolated === false` even when native COOP/COEP headers are present, disabling `SharedArrayBuffer` for blocking terminal input.
  - Built `NativeStdinBridge` inside `android/app/src/main/java/com/igc/thinkcodelab/MainActivity.java` with `@JavascriptInterface` (`ThinkCodeNativeStdin`: `submit`, `cancel`, `reset`), thread-safe `StdinSlot` synchronization, and request interception for `POST /__native_stdin` across both `BridgeWebViewClient` and `ServiceWorkerClient`.
  - Updated `src/engines/index.js`, `c.worker.js`, `cpp.worker.js`, `python.worker.js`, and `java.worker.js` with `readNativeStdinSync()` synchronous XHR fallback so interactive `scanf`, `cin >>`, `input()`, and `Scanner` work identically across Web and Android APK.
  - Disabled `coi-serviceworker.js` registration inside native Capacitor shells and excluded `/__native_stdin` and non-GET requests from service worker interception (`public/coi-serviceworker.js`), eliminating WebView reload loops.

### ⚙️ Hardened C & C++ Engines + Regression Suite (`scripts/test-c-cpp.mjs`)
- **C Engine (`src/engines/c.worker.js`)**:
  - Isolated per-run PicoC WASM instances with Emscripten `Module.then` stripped, unbuffered `stdout` (`setbuf(stdout, 0)`), and single-line-stop `stdin` (`b === 10`), ensuring prompts appear before `scanf`/`getchar`/`fgets`.
- **C++ Engine (`src/engines/cpp.worker.js`)**:
  - Unified JSCPP pipeline supporting full `std::string`, `<iomanip>`, pointers, references, structs, unions, constructors, overloading, and inheritance with on-demand `cin >>` streaming.
- **Automated Verification**:
  - Added `npm run test:ccpp` (**47/47** checks passing) and verified end-to-end interactive execution across C, C++, Python 3.12, and Java inside a real Android API 36 emulator WebView.

### 📦 Versioned APK Distribution & Download Portal (`public/download.html`)
- **Explicit Version Metadata & Filename**:
  - Built signed release APK (`versionName "1.3.3"`, `versionCode 10`, ~17.7 MB) packaged as **`ThinkCodeLab-v1.3.3.apk`** so downloaded filenames clearly reflect app name and version on student devices.
  - Updated `/download` portal, drawer banner (`v1.3.3 (Build 10)`), Developer Profile modal, and Firebase Hosting 302 redirects (`/ThinkCodeLab-v1.3.3.apk`, `/ThinkCodeLab.apk`, `/apk`).

---

## 🚀 Version 1.3.2 (Build 9) — Adaptive 80:20 Split Ratio & Universal 2-Space Indentation
*Release Date: November 2026*

### 📐 Adaptive Split Ratio & Automatic Run Expansion
- **80% Code Editor : 20% Output Initial State**:
  - Based on student usability feedback, mobile screens now default to an **80% Code Editor : 20% Output** vertical split (`--split: 80%`).
  - Ensures full lines of code and nested practical algorithms are immediately visible without initial scrolling.
  - Initial 80:20 ratio is maintained on app startup, practical selection, template reset, language tab change, and clicking **Clear**.
- **Smooth Auto-Expansion to 65% Output on "Run"**:
  - Tapping **Run** triggers a `0.25s cubic-bezier` transition expanding the Output Console to **65%** height (editor collapses to 35%).
  - Provides generous vertical space for reviewing multi-line outputs, table grids, and interactive user prompts.
- **Desktop Side-by-Side Isolation**:
  - Viewports $\ge 900\text{px}$ continue to use independent horizontal split properties (`--split-desktop: 52%`), preserving side-by-side desktop productivity.

### 📏 Universal 2-Space Indentation Across All 78 Practicals
- **Syllabus Practical Conversion (1,181 Lines Re-indented)**:
  - Formatted all 78 official university lab assignments in `src/practicals.js` and starter templates in `src/languages.js` from 4-space to **2-space indentation**.
  - **Python (CA-214)**: Verified all 11 practicals using Python's `ast.parse()` syntax validator to guarantee zero `IndentationError` exceptions.
  - **Java, C, C++, JavaScript, Web, SQL, Shell**: Clean 2-space indentation matching CodeMirror's `EditorState.tabSize.of(2)`.
  - Dramatically improves readability on mobile screens by preventing awkward code line wrapping.

### 🔍 Compact Dual Zoom Controls (`A−` / `A+`)
- **Space-Optimized Toolbar**:
  - Removed redundant percentage text in zoom controls to maximize horizontal header real estate on smaller phone screens.
  - Added matching independent `A−` and `A+` zoom controls to the Output Console header, allowing students to scale output text independently from the code editor.

### 🔘 Floating Action Button (FAB) & Full-Screen Mobile Workspace
- **Removed Bulky Bottom Dock**:
  - Eliminated the fixed `<footer class="dock">` (~75px–85px height) from mobile viewports, transferring that entire vertical height directly to active editing and output space.
- **Smart Morphing FAB (`#btnRun`)**:
  - Pinned directly into the bottom-right corner of the code editor pane (`#editorPane`).
  - **Idle State**: Glowing ember gradient (`#FFB04A` $\rightarrow$ `#FF8A00`) with Play icon (▶).
  - **Running State**: Morphs into an active Coral/Red gradient (`#FF5C67` $\rightarrow$ `#E63746`) with Stop icon (⏹) and an ambient pulsing radar ring (`@keyframes fab-running-pulse`).
  - Single-tap execution when idle; single-tap immediate termination when running.
- **Output Clear Button Relocation**:
  - Relocated the Clear button (`#btnClear`) into the Output Console header bar (`.head-right`), freeing bottom space while maintaining one-tap clearing (which also resets the view to the 80:20 split ratio).
- **Collision-Free Editor Scrolling**:
  - Added `padding-bottom: 64px !important;` to `.cm-content`, guaranteeing that student code text is never obscured under the floating button even when scrolled to the bottom of long files.

### ⌨️ Mobile Keyboard Quick-Symbol Strip (`#quickBar`)
- **Bottom-Pinned Touch Typing**:
  - Relocated quick-symbol toolbar to the **bottom edge of the code editor box**, positioning it directly above mobile virtual keyboards where thumbs naturally rest.
  - 25 high-frequency tokens and programming brackets: `Tab`, `{ }`, `( )`, `[ ]`, `;`, `:`, `"`, `'`, `=`, `+`, `-`, `*`, `/`, `%`, `<`, `>`, `&`, `|`, `!`, `$`, `#`, `->`, `=>`, `//`, `_`.
  - Double brackets and quotes automatically place cursor inside pairs: e.g. `{ }` inserts `{}` and places cursor between the braces.
  - Implemented with `pointerdown` and `event.preventDefault()` to prevent Android / iOS soft keyboards from unfocusing or hiding during rapid symbol entry.

### 🪄 One-Tap Code Beautifier & Auto-Formatter (`src/formatter.js`)
- **Single-Line Micro-Toolbar & Zero-Dependency Formatter**:
  - Compact icon-only wand button (`🪄`) in editor pane header and universal keyboard shortcut `Shift+Alt+F`.
  - Compact design keeps `main.js`, `Practicals`, `🪄`, `A- A+`, and `Saved` strictly on **1 single row** across all mobile viewports without wrapping.
  - Built pure client-side formatter for all 8 supported languages: C, C++, Java, Python, PHP, Oracle SQL, HTML/Web, and Bash Shell.
  - Enforces uniform 2-space indentation, cleans up whitespace, aligns nested blocks, and capitalizes Oracle SQL keywords (`SELECT`, `INSERT INTO`, `WHERE`, `CREATE TABLE`).

### 📱 Attached Zero-Waste IDE Layout
- **Connected Native Mobile Ergonomics**:
  - Eliminated floating card gaps, outer padding, and outer border radii between the language selector rail, code editor box, splitter divider, and output console.
  - 8px attached precision splitter divider with glowing center grip connecting the editor directly to the console.
  - Maximum active screen estate allocated directly to code writing and output review.

### 📱 Ultra-Slim Single-Row Header & Slide-Out Navigation Drawer (`#menuDrawer`)
- **38px Single-Line Header (Maximized Vertical Screen Space)**:
  - Collapsed previous multi-line 75px+ header into a clean 38px single-row bar with App Logo, bold title, clickable `Dev By - Tahir Mansuri` profile pill, and a `[ ☰ Menu ]` button.
  - Tapping `Dev By - Tahir Mansuri` immediately opens the developer bio, college leadership background, and architectural overview sheet.
  - Saves 35px+ of vertical height on mobile viewports, directly increasing visible code editor lines.
- **Modern Slide-Out Options Drawer**:
  - Smooth 60fps off-canvas drawer with blurred backdrop (`backdrop-filter: blur(6px)`).
  - **Android App Banner Card**: Distinctive card for downloading the offline APK (`/download`).
  - **File & Project**: Open Local File, Save Code to Device, and Reset to Starter Template.
  - **Appearance**: Live Theme toggle (Dark / Light mode) with real-time status pill.
  - **About & Developer**: Developer profile for Tahir Mansuri and Privacy Policy link.
  - Accessible via `[ ☰ Menu ]` tap, tapping brand logo, backdrop click, `✕` button, or `Escape` key.

---

## 🚀 Version 1.3.1 (Build 8) — Production Minification Fixes & Firebase Hosting
*Release Date: November 2026*

### ☕ Java AWT / Swing Engine Hardening
- **Production Minification Mangling Fix**:
  - Resolved an issue in `src/engines/java.worker.js` where production bundler Terser mangled component constructors (`class X`, `class At`) into single-letter identifiers, causing AWT components to render as raw text labels.
  - Added explicit `this.componentType` and `this.layoutType` property definitions across all components (`JFrame`, `JLabel`, `JTextField`, `JPasswordField`, `JButton`) and layout managers (`GridLayout`, `BorderLayout`, `FlowLayout`).
- **Mobile Responsive Layout**:
  - Added `@media (max-width: 600px)` styling for the Java desktop window modal, ensuring frames fit neatly on phone screens.
- **Java GUI Floating Reopen Button Gating**:
  - Added `hideJavaGui()` called on language tab switch, practical load, clear, stop, and reset, preventing the `[☕ Java GUI Frame]` button from leaking into other language tabs.

### 🐘 PHP Header Badge Cleanup
- Cleaned up the `#fileName` tag in PHP mode to display `index.php` (or `index.html` / `process.php`) with `white-space: nowrap; flex-shrink: 0;`, eliminating awkward two-line badge wrapping on mobile devices.

### ☁️ Cloud Distribution & Live Web App
- Deployed live Single-Page Application on Firebase Hosting at **[thinkcode-lab.web.app](https://thinkcode-lab.web.app)**.
- Created dedicated web download portal at **[thinkcode-lab.web.app/download](https://thinkcode-lab.web.app/download)**.
- Added 302 redirects for `/ThinkCodeLab.apk` and `/apk` streaming the signed 17.6MB release APK directly from GitHub releases with correct `application/vnd.android.package-archive` MIME type headers.

---

## 🚀 Version 1.3.0 (Build 7) — Offline Java JDK Engine, Swing/AWT Desktop Window & Editor Zoom
*Release Date: November 2026*

### ☕ 100% Offline Java Programming Engine (`src/engines/java.worker.js`)
- **Full Offline JDK Simulation**:
  - Standalone offline Java compiler and transpiler worker supporting core object-oriented features, classes, inheritance, interfaces, abstract classes, and standard Java library classes (`Scanner`, `System.out.println`, `System.out.printf`, `Arrays`, `ArrayList`, `Math`, `String`).
- **Try-Catch-Finally Exception Handling**:
  - Transpiles typed catch blocks and multiple catch clauses (`catch (ArithmeticException e)`, `catch (Exception ex)`) into clean polymorphic runtime catch blocks.
  - Full Java exception hierarchy (`Throwable` ➔ `Exception` ➔ `RuntimeException` ➔ `ArithmeticException`, `NullPointerException`, `ArrayIndexOutOfBoundsException`, `NumberFormatException`, `SQLException`).
- **Constructor & Method Overloading**:
  - Overloaded constructors and methods with dynamic argument-length and runtime type dispatching.
- **JDBC Database Simulation**:
  - Simulated JDBC connectivity (`DriverManager`, `Connection`, `Statement`, `ResultSet`) for academic CRUD practicals.

### 🖼️ Interactive Java AWT / Swing Desktop Window Frame
- Simulated computer desktop window modal with title bar, minimize `—`, maximize `▢`, close `✕` buttons, and desktop menu bar.
- Draggable title bar support for desktop and laptop users.
- Interactive component DOM rendering for `JFrame`, `JPanel`, `JLabel`, `JTextField`, `JPasswordField`, `JButton`.
- Layout Manager emulation for `BorderLayout`, `GridLayout` (e.g. 4x4 Calculator, 4x2 Login form), and `FlowLayout`.
- Live interaction for **Assignment 13 (Simple Calculator)** and **Assignment 14 (Login Form)**.
- Floating `[☕ Java GUI Frame]` reopen button when window is minimized or closed.

### 📚 TYBCA Java Programming Syllabus Practicals (CA-313 / CA-315)
- Embedded all 16 official TYBCA university assignments in `src/practicals.js`:
  1. Display Student Information
  2. Arithmetic Operations using Switch Case
  3. Find Largest Element in an Array
  4. Command Line Arguments
  5. Accept User Input using Scanner
  6. Constructors and Methods (Default & Parameterized)
  7. Method Overloading (Square, Rectangle, Triangle, Circle)
  8. Concept of Inheritance (Multilevel Employee-Developer hierarchy)
  9. Method Overriding (Dynamic polymorphism)
  10. Interface for Shape Area Calculation
  11. String Manipulation Operations
  12. Try-Catch-Finally Exception Handling
  13. Simple Calculator Using AWT/Swing
  14. Simple Login Form Using Swing
  15. Demonstrate Database Connectivity (JDBC)
  16. Perform Insert, Update, Delete (CRUD) on Database

---

## 🚀 Version 1.2.0 (Build 6) — C & C++ Lightweight Embedded Engines
*Release Date: November 2026*

### ⚙️ C (C99) Real WebAssembly Execution Engine (`src/engines/c.worker.js`)
- Embedded PicoC ANSI/C99 interpreter compiled directly to WebAssembly (`public/picoc/picoc.js`).
- Ultra-compact ~800 KB bundle preserving ThinkCode Lab's lightweight footprint.
- Real pointer arithmetic, dynamic memory (`malloc`, `free`), structures (`struct`), unions, arrays, and standard headers (`<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`, `<ctype.h>`).
- Interactive in-console `scanf` and `getchar` supported via `SharedArrayBuffer` (`Atomics.wait`).

### ⚡ C++ Interactive & OOP Engine (`src/engines/cpp.worker.js`)
- Hybrid execution: `JSCPP` for procedural evaluation + custom OOP Transpiler Runner for user-defined classes (`class`, access specifiers `public:`/`private:`, constructors, destructors, member methods, and objects).
- Fixed C++ `cin >>` / `cout <<` execution order by removing premature load-time `stdio.drain()`.
- Authentic `g++` compiler diagnostics with line, column, and visual caret (`^`) indicators.
- Removed redundant raw STDIN "Program input" box from the Output tab across all languages.

### 📚 Academic Practicals Drawer (`src/practicals.js`)
- Dedicated `📚 Practicals` drawer button directly in the editor header.
- Added 17 university assignments for C++ (CA-112, CA-113, CA-121, CA-123).
- Added 10 Linux OS Shell practicals for CA-123.
- Live text search, category filter chips, and one-click "Load into Editor" with automatic language switching.

---

## 🚀 Version 1.1.4 (Build 5) — Google Play Store Production Release
*Release Date: November 2026*

- Generated official release keystore (`thinkcode-lab.keystore`) with RSA 2048-bit encryption.
- Built signed release APK (`ThinkCodeLab-release.apk`) and Android App Bundle (`ThinkCodeLab-release.aab`) targeting Android API 36 (`minSdkVersion 24`).
- Packaged high-resolution store graphics: 512x512 app icon, 1024x500 feature graphic, phone/tablet screenshots, and educational privacy policy.
- Full rollout submitted to Google Play Console under Application ID `com.igc.thinkcodelab`.

---

## 🚀 Version 1.0.0 – 1.1.0 — Core Multi-Language Platform
*Release Date: October – November 2026*

- **Python 3.12 Engine**: Pyodide 0.26.4 WebAssembly with interactive in-console `input()` and clean tracebacks.
- **PHP 8.2 Engine**: WebAssembly runtime (`php.wasm`) with Dual-Section Split Editor (`index.html` + `process.php`) and client-side CGI form simulation.
- **Oracle SQL Engine**: SQLite 3.46.0 WASM with custom Oracle PL/SQL translation layer (`NVL`, `DECODE`, `ROWNUM`, `SYSDATE`, `DUAL`, sequences) and 4 pre-seeded schemas (`SCOTT`, `UNIVERSITY`, `BANK`, `WORKSPACE`).
- **Linux Shell Emulator**: 35+ UNIX commands, pipelines (`|`), redirections (`>`, `>>`), and persistent virtual filesystem in `localStorage`.
- **Modern JavaScript & HTML/CSS**: Sandboxed execution with mobile touch-friendly `prompt()` / `alert()` modal and live iframe preview.
- **UI Architecture**: Obsidian dark cyber theme with luminous glowing borders, CodeMirror 6 code editor, and responsive viewport manager.

