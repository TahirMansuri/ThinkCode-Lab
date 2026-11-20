# 🔐 ThinkCode Lab — Master Accounts, Firebase, Keys & URLs Directory

> **Confidential & Operational Reference Guide**  
> Consolidates all administrative credentials, Firebase project settings, signing keys, cryptographic certificate fingerprints, release URLs, and deployment configurations for **ThinkCode Lab**.

---

## 📌 1. Master Project & Ownership Information

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Application Title** | `ThinkCode Lab` | Former development codename: *CodeForge* |
| **Android Application ID** | `com.igc.thinkcodelab` | Immutable package identifier on Google Play |
| **Google Play Store URL** | [play.google.com/store/apps/details?id=com.igc.thinkcodelab](https://play.google.com/store/apps/details?id=com.igc.thinkcodelab) | Official Google Play Store listing |
| **Current Production Release** | `v1.3.8` (`versionCode: 15`) | Signed AAB (`ThinkCodeLab-v1.3.8.aab`, 17.5 MB) & APK (`ThinkCodeLab-v1.3.8.apk`, 17.7 MB) |
| **Active Release Branch** | `release/v1.3.8` | Current release branch for `v1.3.8` (Build `15`) |
| **Lead Developer / Architect** | **Tahir Mansuri** | Lead System Engineer & HOD, IMRD College |
| **Organization / Agency** | **InfoGalaxy Computers** | Shirpur, Maharashtra, India |
| **Developer Email** | `tprocks786@gmail.com` | Primary Git author and developer contact |
| **Firebase Admin Account** | `infogalaxycomp@gmail.com` | Google account managing Firebase resources |
| **GitHub Profile** | [github.com/TahirMansuri](https://github.com/TahirMansuri) | Official developer GitHub |
| **Parent Initiative** | [ThinkCode Visualizer](https://thinkcode.infogalaxy.space/) | Interactive algorithm companion platform |

---

## 🌐 2. Official Application URLs & Live Web Endpoints

| Resource | URL | Purpose |
| :--- | :--- | :--- |
| **Google Play Store App** | [https://play.google.com/store/apps/details?id=com.igc.thinkcodelab](https://play.google.com/store/apps/details?id=com.igc.thinkcodelab) | Official Google Play Store listing |
| **Production Web App (Primary)** | [https://thinkcode-lab.web.app](https://thinkcode-lab.web.app) | Live 100% offline-ready web IDE |
| **Production Web App (Secondary)** | [https://thinkcode-lab.firebaseapp.com](https://thinkcode-lab.firebaseapp.com) | Alternate Firebase SSL domain |
| **APK Web Download Portal** | [https://thinkcode-lab.web.app/download](https://thinkcode-lab.web.app/download) | Auto-hydrating installer page reading `/version.json` (`v1.3.8`, Build `15`) |
| **Live App Update Manifest** | [https://thinkcode-lab.web.app/version.json](https://thinkcode-lab.web.app/version.json) | Public JSON manifest (`CORS`, `CORP: cross-origin`, `no-store`) consumed by in-app updater |
| **Versioned APK Download URL (Redirect)** | [https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.8.apk](https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.8.apk) | 302 redirect saving `ThinkCodeLab-v1.3.8.apk` |
| **Direct APK Download URL (Redirect)** | [https://thinkcode-lab.web.app/ThinkCodeLab.apk](https://thinkcode-lab.web.app/ThinkCodeLab.apk) | 302 redirect directly to latest GitHub release binary (`ThinkCodeLab-v1.3.8.apk`) |
| **Short APK Download Link** | [https://thinkcode-lab.web.app/apk](https://thinkcode-lab.web.app/apk) | Quick short URL for student sharing (`ThinkCodeLab-v1.3.8.apk`) |
| **Privacy Policy Portal** | [https://thinkcode-lab.web.app/privacy.html](https://thinkcode-lab.web.app/privacy.html) | Live privacy policy for Google Play compliance |
| **Companion Visualization Portal** | [https://thinkcode.infogalaxy.space/](https://thinkcode.infogalaxy.space/) | ThinkCode algorithm visualizer and tracing tool |

---

## 🔥 3. Firebase Project & Hosting Configuration

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Admin Google Account** | `infogalaxycomp@gmail.com` | Firebase login account |
| **Firebase Project Display Name** | `IGCQuiz` | Project label in Google Cloud / Firebase |
| **Firebase Project ID** | `igcquiz-5d910` | Unique GCP/Firebase project identifier |
| **Firebase Project Number** | `279043537134` | Internal Google Cloud project number |
| **Hosting Site Identifier** | `thinkcode-lab` | Target site mapped in `.firebaserc` & `firebase.json` |
| **Firebase Console Overview** | [console.firebase.google.com/project/igcquiz-5d910/overview](https://console.firebase.google.com/project/igcquiz-5d910/overview) | Main Firebase project dashboard |
| **Firebase Hosting Dashboard** | [console.firebase.google.com/project/igcquiz-5d910/hosting/sites/thinkcode-lab](https://console.firebase.google.com/project/igcquiz-5d910/hosting/sites/thinkcode-lab) | Deployment release history & rollbacks |
| **Local Config Files** | `.firebaserc` and `firebase.json` | Project binding and HTTP header rules |

### Critical HTTP Headers in `firebase.json`:
For `SharedArrayBuffer` and `Atomics` multi-threaded stdin execution on app routes (scoped away from `/download` and `/ThinkCodeLab*.apk` redirects so mobile APK downloads work cleanly):
```json
{
  "key": "Cross-Origin-Opener-Policy",
  "value": "same-origin"
},
{
  "key": "Cross-Origin-Embedder-Policy",
  "value": "require-corp"
}
```
And on `/version.json` for cross-origin update checks from Capacitor Android WebView and fresh cache invalidation:
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "*"
},
{
  "key": "Cross-Origin-Resource-Policy",
  "value": "cross-origin"
},
{
  "key": "Cache-Control",
  "value": "no-cache, no-store, must-revalidate"
}
```

---

## 🐙 4. GitHub Repository & Releases

| Parameter | Configuration | Details |
| :--- | :--- | :--- |
| **Repository URL** | [https://github.com/TahirMansuri/ThinkCode-Lab](https://github.com/TahirMansuri/ThinkCode-Lab) | Public open-source repository |
| **Git Clone SSH** | `git@github.com:TahirMansuri/ThinkCode-Lab.git` | SSH protocol clone link |
| **Git Clone HTTPS** | `https://github.com/TahirMansuri/ThinkCode-Lab.git` | HTTPS protocol clone link |
| **Default Branch** | `main` | Production-ready main branch |
| **Active Release Branch** | `release/v1.3.8` | Current release branch for Build 15 (`v1.3.8`) |
| **GitHub Releases Page** | [github.com/TahirMansuri/ThinkCode-Lab/releases](https://github.com/TahirMansuri/ThinkCode-Lab/releases) | Versioned binary distribution page |
| **Latest Release Tag** | `v1.3.8` | Tag containing `ThinkCodeLab-v1.3.8.apk` asset (`versionCode 15`) |
| **Release APK Direct CDN** | [github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.8/ThinkCodeLab-v1.3.8.apk](https://github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.8/ThinkCodeLab-v1.3.8.apk) | GitHub release asset binary download |
| **Git User Config** | Name: `TahirMansuri`<br>Email: `tprocks786@gmail.com` | Configured git identity |

---

## 🔑 5. Android Keystore, Signing & Cryptographic Fingerprints

> [!CAUTION]
> **CRITICAL SECURITY ASSET:**  
> If the `thinkcode-lab.keystore` file or credentials are lost, Google Play will permanently reject all future app updates. Always keep an encrypted offline backup.

### Keystore Configuration
| Property | Value |
| :--- | :--- |
| **Keystore Filename** | `thinkcode-lab.keystore` |
| **Primary Path in Project** | `android/app/thinkcode-lab.keystore` |
| **Backup Path in Project** | `thinkcode-lab.keystore` (root directory) |
| **Keystore Password** | `ThinkCodeLab@2026` |
| **Key Alias** | `thinkcodelab` |
| **Key Password** | `ThinkCodeLab@2026` |
| **Key Algorithm** | RSA 2048-bit (`SHA256withRSA`) |
| **Certificate Validity** | 10,000 Days (Valid through **March 21, 2054**) |
| **Certificate Owner (DN)** | `CN=Tahir Mansuri, OU=ThinkCode, O=InfoGalaxy, L=Shirpur, ST=Maharashtra, C=IN` |

### Cryptographic Hashes & Fingerprints

#### 1. SHA-256 Certificate Fingerprint
*(Required for Google Play Console, Firebase App Registration, and Google Cloud API credentials)*
```text
49:03:53:9B:E9:17:27:6E:1E:BC:30:1B:64:CC:F4:11:8D:ED:41:82:88:73:D7:B9:1F:29:E3:C3:D7:12:FE:30
```

#### 2. SHA-1 Certificate Fingerprint
```text
56:86:1D:2C:E4:67:30:8E:D6:30:94:89:20:F0:E1:FD:CC:4D:E2:CB
```

#### 3. v1.3.8 Production Binary SHA-256 File Hashes
*(Exact 64-character lowercase hex hashes for Google Play Console, Play Protect appeals & `public/version.json`)*
- **v1.3.8 Signed App Bundle (`ThinkCodeLab-v1.3.8.aab`, Build 15)**:
  ```text
  7860ab47bc48d06d9d08636a24de6ca9ab26fed2561a42f64965d253ceee2986
  ```
- **v1.3.8 Signed Release APK (`ThinkCodeLab-v1.3.8.apk`, Build 15)**:
  ```text
  a0cc2ef2092e9482227b8133de2b3314ef6ca6d43106b3f6bb35791011749809
  ```
- *(Previous `v1.3.7` AAB: `4993a47bd7f890915bb7dac4da062eec623db7d75bd875ff62c7acd6348688a1` / APK: `b71e5d4873cf447465aa773b24ef7fc05bef3930a829bd009afe2ee51c959a0b`)*
- *(Previous `v1.3.6` APK: `2ee17e6032c1a5b82bb45725ede444920ccc1260f96ed2a2f934895c1b4d7e3f`)*
- *(Previous `v1.3.5` APK: `feb6769c278631d7ef902fe61b78aa0406b7d4c06418249d1116575afd6bffb7`)*
- *(Previous `v1.3.4` APK: `879856e091aa8e0244f7125de596dd76a65328e9c6596e1e2cf1eec8c32419d0`)*

---

## 📱 6. Google Play Console & Android Build Specifications

| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Package Name** | `com.igc.thinkcodelab` | Android namespace & Google Play URL |
| **Google Play URL** | [play.google.com/store/apps/details?id=com.igc.thinkcodelab](https://play.google.com/store/apps/details?id=com.igc.thinkcodelab) | Live Google Play Store listing |
| **compileSdkVersion** | `36` | Target Android 16 platform APIs |
| **targetSdkVersion** | `36` | Strict compliance with Google Play requirements |
| **minSdkVersion** | `24` | Android 7.0 (Nougat) or higher (covers 95%+ of global devices) |
| **Signing Schemes Enabled** | `v1SigningEnabled = true`<br>`v2SigningEnabled = true` | Dual APK signature for modern & legacy Android |
| **Play Console Category** | **Education / Developer Tools** | App Store classification |
| **Content Rating** | **Everyone (PEGI 3)** | Clean educational coding environment |
| **Data Safety Declaration** | **Zero Data Collected** | 100% offline client-side code execution |
| **Release Artifact (Store)** | `ThinkCodeLab-v1.3.8.aab` (~17.5 MB, Build 15) | Google Play Android App Bundle |
| **Release Artifact (Sideload)** | `ThinkCodeLab-v1.3.8.apk` (~17.7 MB, Build 15) | Standalone APK with all WASM runtimes embedded |

---

## ⚡ 7. Quick Operational Commands Reference

```bash
# -------------------------------------------------------------
# 🌐 WEB DEVELOPMENT, VERIFICATION & FIREBASE DEPLOYMENT
# -------------------------------------------------------------
# 1. Start local Vite preview server
npm run dev

# 2. Run automated verification suites (67 checks total)
npm run test:ccpp
node scripts/test-journal.mjs
node scripts/test-update-checker.mjs

# 3. Compile production web distribution (outputs to dist/)
npm run build

# 4. Deploy web application live to Firebase Hosting
npx firebase deploy --only hosting


# -------------------------------------------------------------
# 📱 ANDROID BUILD & RELEASE COMPILATION (ONLY ON EXPLICIT REQUEST)
# -------------------------------------------------------------
# 1. Sync compiled web assets with Capacitor Android wrapper
npm run build
npx cap sync android

# 2. Compile signed production Release APK
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# 3. Verify 64-character APK SHA-256 hash & sync /version.json
shasum -a 256 android/app/build/outputs/apk/release/app-release.apk

# 4. Compile signed production Google Play Bundle (AAB)
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab


# -------------------------------------------------------------
# 🐙 GIT SYNCHRONIZATION COMMANDS
# -------------------------------------------------------------
# Push active release branch
git push origin release/v1.3.8
```

---

## 📂 8. Project Credentials, Release & Utility File Locations

| File | Project Location | Purpose |
| :--- | :--- | :--- |
| **Production Keystore** | `android/app/thinkcode-lab.keystore` | Android signing certificate |
| **Keystore Root Backup** | `thinkcode-lab.keystore` | Project root safety copy |
| **Gradle Signing Config** | `android/app/build.gradle` | Connects release build to keystore & defines `versionCode`/`versionName` |
| **Native Android Activity** | `android/app/src/main/java/com/igc/thinkcodelab/MainActivity.java` | `NativeStdinBridge`, `SystemUiBridge` (`setTheme`, `printDocument`, `getAppVersion`, `openExternalUrl`, `exitApp`), Back-Press dispatcher, Edge-to-Edge insets |
| **Android SDK Variables** | `android/variables.gradle` | Defines `targetSdkVersion = 36`, `minSdkVersion = 24` |
| **Live Update Manifest** | `public/version.json` | Single source of truth for current APK metadata, notes, and 64-char SHA-256 |
| **Web Download Portal** | `public/download.html` | Progressive-enhanced `/download` page hydrating live metadata from `/version.json` |
| **In-App Update Checker** | `src/update-checker.js` | Zero-telemetry semver/`versionCode` evaluator, throttling, Play Store routing, and snooze persistence |
| **Lab Journal PDF Exporter**| `src/lab-journal.js` | Pure-JS offline A4 JPEG-in-PDF 1.4 generator & student profile manager |
| **Firebase Target Mapping**| `.firebaserc` | Maps default project to `igcquiz-5d910` |
| **Firebase Hosting Rules** | `firebase.json` | COOP/COEP app rules, `/version.json` CORS/CORP/`no-store` headers, and APK 302 redirects |
| **Automated Test Suites** | `scripts/test-c-cpp.mjs`, `scripts/test-journal.mjs`, `scripts/test-update-checker.mjs`, `scripts/test-python-datascience.mjs`, `scripts/test-backpress-exit.mjs` | Automated 85-check runtime, PDF binary, update manifest, Python, and back-press tests |
| **Master Credentials Guide**| `docs/09_ACCOUNT_AND_DEPLOYMENT_INFO.md` | This document |

