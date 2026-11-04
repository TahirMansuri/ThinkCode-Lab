# ThinkCode Lab — Project Memory (read this first in a new session)

## Goal
Standalone Android app (Capacitor) with ALL language engines running 100% OFFLINE:
Python, PHP, Oracle SQL, JavaScript, HTML/CSS, Linux shell, then C/C++, Java.
Sibling of the ThinkCode web project (Tahir Mansuri, IMRD College). User wants: low token use, professional + stylish UI, no extra prose.

## Status: v1.1.4 Submitted to Google Play Production (versionCode 6, targetSdk 36, minSdk 24)
| Engine | Tech | Where | Notes |
|---|---|---|---|
| Python 3.12 | Pyodide 0.26.4 (self-hosted in public/pyodide) | src/engines/python.worker.js | stdlib only; interactive in-console input() + mobile touch modal |
| PHP 8.2 | php-wasm 0.2.0 (self-hosted in public/php) | src/engines/php.worker.js | Standalone WASM, Dual-Section Split Editor (HTML+PHP), 3 view modes, CGI form bridge |
| JavaScript | AsyncFunction in Web Worker | js.worker.js | console.* + touch-friendly prompt() and alert() modal with non-blocking Promise resolution |
| SQL | sql.js (SQLite WASM) + Oracle layer | sql.worker.js | NVL NVL2 INITCAP LPAD RPAD MOD CEIL FLOOR POWER SQRT TO_CHAR TO_DATE ADD_MONTHS MONTHS_BETWEEN, DUAL, SYSDATE, MINUS, ROWNUM<=n, FETCH FIRST, DESC, SHOW TABLES, user_tables; 4 schemas (SCOTT, UNIVERSITY, BANK, WORKSPACE) |
| HTML/CSS/JS | sandboxed iframe (srcdoc) + console hook | engines/index.js WebEngine | Preview tab |
| Shell | custom bash emulator, virtual FS in localStorage | shell.js (main thread) | pipes, > >> <, && \|\|, vars, $(..), $((..)), if/for/while, ~35 commands, interactive prompt |

## Architecture
Vite + vanilla JS. `index.html` + `src/main.js` (UI/state) + `src/editor.js` (CodeMirror 6, themed via CSS vars) + `src/languages.js` (registry/templates; `engine:null` + `soon` = locked chip) + `src/engines/index.js` (WorkerEngine host: load/run/stop/extra; Stop = terminate worker, auto-respawn).
Workers are CLASSIC (vite worker.format=iife) and use importScripts on files in public/ (copied by `scripts/copy-runtimes.mjs`). Base URL passed to workers via init message.
Design: ink-teal palette, ember (#FFB04A) Run button, per-language colour underline on active chip, Bricolage Grotesque + JetBrains Mono (bundled via @fontsource), dark/light theme, draggable splitter (vertical on phone, horizontal >=900px).
Capacitor: appId com.igc.thinkcodelab, webDir dist. Export uses Filesystem+Share on native, Blob download on web.

## Commands
npm install → npm run dev | npm run build | npx cap sync android | ./gradlew assembleRelease bundleRelease (in android/)
Release APK: ThinkCodeLab-release.apk (~16 MB, self-contained WASM runtimes).
Release AAB: ThinkCodeLab-release.aab (~16 MB, Google Play Console ready).

## Known gaps / TODO (priority order)
1. Phase 3: C/C++ via Clang-WASM + WASI as downloadable offline pack (Capacitor Filesystem + pack manager with hash check).
2. Phase 4: Java via CheerpJ (check commercial licence) or alternative.
3. Phase 5 (optional): real Linux via v86 + Alpine image.
4. SQL: DECODE, 1-arg TO_CHAR/TRUNC not supported (sql.js create_function can't overload arity); use CASE/CAST. ROWNUM only as trailing `WHERE/AND ROWNUM <= n`.
5. Multi-file projects / file manager, shell history (↑), Python packages (numpy/pandas), xterm.js terminal, Play Asset Delivery for big packs, app icon/splash, tests.
6. Shell: no functions, no C-style for((;;)), no sed/awk.

## Gotchas learned
- Sandbox shell is /bin/sh: no brace expansion in mkdir -p {a,b}.
- sql.js create_function removes earlier registration of the same name → no arity overloads.
- Vite dev/preview servers die when a tool call ends; start and test in the same command.
- Test harness: Playwright (python) + chromium works in sandbox; /tmp/smoke.py pattern clicks chips, Run, reads #console.
- Backups: STRICT RULE — Do NOT create backups after each change. Only create a backup when the user explicitly requests one.
- Stop Button Lifecycle: `stop()` must always reset `running = false` and invoke `syncButtons()`. Worker termination rejects `this.readyReject` and resolves `this.finish`, and `run()` encloses execution in `try ... finally { running = false; syncButtons(); }` to prevent Run button deadlock on "Running...".
- Android WebView Post-Stop Rejection: In `warm()`, `run()`, and `runPhpDirect()`, guard `.catch()` against `if (!stopped && e?.message !== 'Stopped')` so terminating a running worker cleanly sets state to `"Stopped"` rather than falsely printing `"Stopped"` in red and marking state as `"Runtime failed"`.
- Android Package Updates: When rebuilding APK, bump `versionCode` in `build.gradle` (currently `versionCode 6`, `versionName "1.1.4"`).
- Google Play Auto-Protection: Mandates `minSdkVersion >= 24` in `variables.gradle`.
- Google Play Target API: Mandates `targetSdkVersion >= 36` and `compileSdkVersion >= 36`.
- JavaScript Web Worker `prompt()`: Web Workers do not have `window.prompt()`. Solved via `transformPromptCode` (rewriting `prompt(` to `await prompt(`) + message-based `#promptModal` with dual-mode support (synchronous `Atomics.wait` when `SharedArrayBuffer` exists, async Promise resolution on mobile web/Safari).
- Mobile Virtual Keyboard Input: Virtual keyboards on touch devices emit composition/beforeinput instead of desktop Enter; solved by wrapping inputs in `<form id="pmForm">` with explicit Submit and Cancel buttons.

## Assets (added)
User supplied ThinkCode brand assets (purple/teal "<·>" node icon; also hero-banner.png, cpp/python logos, profilepic — not used). Copied icon.svg, icon-192/512, favicons, apple-touch to public/assets and linked in index.html. resources/icon.png (1024) is for `npm run icons` (@capacitor/assets → Android launcher icons, after `npx cap add android`). In-app header mark is still the ember CodeForge mark; decide whether to unify branding.
