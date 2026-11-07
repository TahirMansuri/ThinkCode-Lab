# ThinkCode Lab — Project Memory (read this first in a new session)

> **Full Documentation:** See [`docs/07_DEVELOPER_MEMORY.md`](docs/07_DEVELOPER_MEMORY.md) for complete guidelines.

## Quick Summary:
- **Product:** ThinkCode Lab (formerly CodeForge).
- **Author:** Tahir Mansuri (Lead System Engineer & HOD, IMRD College).
- **Version:** v1.3.2 (Build 9).
- **Offline Engines:** Java (AWT/Swing), Python 3.12, C99, C++, PHP 8.2, Oracle SQL, Linux Shell, HTML/CSS/JS.
- **Practicals:** 78 university practicals preloaded with 2-space indentation.
- **Split Ratio:** Default 80% Code : 20% Output. Auto-expands to 65% Output on Run.

## Strictly Enforced Rules:
1. **Web Deployment Only for Routine Updates:** Only build and deploy the web app (`npm run build` & `firebase deploy --only hosting`). Do NOT compile the release APK or sync Capacitor unless explicitly requested by the user.
2. **Backups on Explicit Request Only:** STRICT RULE — Do NOT create zip backups after each change. Only create a backup when the user explicitly requests one.
3. **Never Place Binaries in `public/`:** Storing `.apk` or `.aab` in `public/` causes Gradle to bundle the APK inside itself, doubling the APK size.
4. **Worker Minification:** Always use explicit `this.componentType` and `this.layoutType` on worker classes so Terser does not break them in production.
