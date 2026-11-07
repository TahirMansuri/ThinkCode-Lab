# 🧠 Developer Memory & Operational Guidelines — ThinkCode Lab

> **Essential project context, development rules, architectural gotchas, and operational guidelines for engineers working on ThinkCode Lab. Read this first when starting a new session.**

---

## 🎯 1. Core Vision & Goals
- **Product:** ThinkCode Lab (formerly CodeForge during initial scaffold).
- **Author:** Tahir Mansuri (Lead System Engineer & HOD, IMRD College).
- **Core Purpose:** Standalone, 100% OFFLINE multi-language coding playground and mobile IDE for computer science students.
- **Companion Project:** [ThinkCode Interactive Visualizer & Code Tracer](https://thinkcode.infogalaxy.space/).
- **Current Version:** **v1.3.2 (Build 9)**.

---

## 🚨 2. Strictly Enforced Operational Rules

### Rule 1: Web Deployment Only for Routine Updates
> [!IMPORTANT]
> **Do NOT automatically compile release APKs or sync Capacitor during routine code changes.**
> - Creating release APKs (`./gradlew assembleRelease`) takes significant build time.
> - For regular changes, feature updates, and bug fixes: **Only build and deploy the web application** (`npm run build` and `firebase deploy --only hosting`).
> - The student/tester tests the web app at `https://thinkcode-lab.web.app` first.
> - **Only compile the release APK when the user explicitly asks for an APK build.**

### Rule 2: Backups on Explicit Request Only
> [!WARNING]
> **STRICT RULE — Do NOT create zip backups after each code change.**
> Only generate a backup archive in `BackUp/` when the user explicitly requests one.

### Rule 3: Never Place Binaries in `public/`
> [!CAUTION]
> **Never store `.apk` or `.aab` binaries inside the `public/` folder.**
> Vite copies everything from `public/` into `dist/`. Capacitor then copies `dist/` into Android's asset bundle (`android/app/src/main/assets/public/`). If an APK is placed in `public/`, Gradle will bundle the APK inside itself, doubling the APK size from 17 MB to 34 MB!

---

## 💡 3. Critical Technical Gotchas Learned

1. **Worker Minification Protection (Terser Mangling)**:
   - In production builds (`npm run build`), Terser minifies worker code and renames class constructors into single-letter identifiers (`class X`, `class At`).
   - Any worker logic relying on `this.constructor.name` (such as Java AWT/Swing component identification) will fail in production.
   - **Solution:** Always set explicit string properties on instances, e.g. `this.componentType = 'JTextField'` and `this.layoutType = 'GridLayout'`.
2. **Adaptive Split Ratio Architecture**:
   - The workspace layout in `index.html` uses a CSS grid with `grid-template-rows: var(--split, 80%) 14px minmax(0, 1fr)`.
   - On mobile, `--split` is initialized to **80%** (giving 80% to the Code Editor and 20% to the Output pane).
   - Tapping **Run** calls `setOutputLarge()`, changing `--split` to **35%** (expanding output to **65%**).
   - Resetting, loading a practical, changing language, or tapping **Clear** calls `setOutputSmall()`, restoring `--split` to **80%**.
   - Desktop viewports ($\ge 900\text{px}$) use `--split-desktop: 52%` side-by-side columns and do not resize on Run.
3. **Interactive C++ `cin >>` / `cout <<` Execution Order**:
   - In JSCPP's `iostream.js`, `cin` was originally initialized at load time with `buf: stdio.drain()`, blocking execution before `main()` could print preceding `cout` statements.
   - **Solution:** Initialized with `buf: ""` and triggered `stdio.drain()` strictly on-demand when `_cin.v.buf` is empty during `cin >>`.
4. **JavaScript Web Worker `prompt()`**:
   - Standard Web Workers do not have access to `window.prompt()`.
   - **Solution:** In interactive JS runs, `prompt(...)` calls are transformed into `await prompt(...)` and connected via messages to the main thread's touch-friendly `#promptModal`.
5. **Mobile Virtual Keyboard Input**:
   - Touch keyboards on Android and iOS emit composition/beforeinput events instead of physical desktop Enter keys.
   - **Solution:** Wrapped prompt inputs in `<form id="pmForm">` with dedicated Submit and Cancel buttons to ensure compatibility with all virtual keyboards.
6. **Stop Button Lifecycle**:
   - When a worker is stopped via `stop()`, worker termination rejects `this.readyReject` and resolves `this.finish`.
   - `run()` always wraps execution in `try ... finally { running = false; syncButtons(); }` to prevent the Run button from freezing in a "Running..." state.
7. **2-Space Indentation Enforcement**:
   - All 78 syllabus practicals and language templates use **2-space indentation**.
   - Python code indentation must be validated using `ast.parse()` to avoid indentation errors.
8. **Firebase Hosting Direct APK Downloads**:
   - Firebase Hosting on the free Spark plan rejects direct deployment of `.apk` binaries inside `dist/`.
   - **Solution:** Release APKs are uploaded to GitHub Releases (`TahirMansuri/ThinkCode-Lab`). `firebase.json` uses HTTP 302 redirects from `/ThinkCodeLab.apk` and `/apk` directly to the GitHub release asset URL.

---

## 🛠️ 4. Common Commands Quick Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local Vite development server |
| `npm run build` | Prepare offline runtimes and build production `dist/` |
| `firebase deploy --only hosting` | Deploy web application to `https://thinkcode-lab.web.app` |
| `npx cap sync android` | Sync `dist/` web assets with the native Android project |
| `cd android && ./gradlew assembleRelease` | Build signed release APK (`ThinkCodeLab.apk`) |
| `cd android && ./gradlew bundleRelease` | Build signed Google Play Bundle (`ThinkCodeLab-release.aab`) |
