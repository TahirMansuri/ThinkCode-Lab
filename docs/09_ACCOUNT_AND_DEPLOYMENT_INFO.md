# 🔐 ThinkCode Lab — Master Accounts, Firebase, Keys & URLs Directory

> **Confidential & Operational Reference Guide**  
> Consolidates all administrative credentials, Firebase project settings, signing keys, cryptographic certificate fingerprints, release URLs, and deployment configurations for **ThinkCode Lab**.

---

## 📌 1. Master Project & Ownership Information

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Application Title** | `ThinkCode Lab` | Former development codename: *CodeForge* |
| **Android Application ID** | `com.igc.thinkcodelab` | Immutable package identifier on Google Play |
| **Current Production Version** | `v1.3.4` | Semantic release version |
| **Current Version Code** | `11` | Integer build counter for Android package |
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
| **Production Web App (Primary)** | [https://thinkcode-lab.web.app](https://thinkcode-lab.web.app) | Live 100% offline-ready web IDE |
| **Production Web App (Secondary)** | [https://thinkcode-lab.firebaseapp.com](https://thinkcode-lab.firebaseapp.com) | Alternate Firebase SSL domain |
| **APK Web Download Portal** | [https://thinkcode-lab.web.app/download](https://thinkcode-lab.web.app/download) | Direct mobile-optimized installer page (`v1.3.4`, Build `11`) |
| **Versioned APK Download URL (Redirect)** | [https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.4.apk](https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.4.apk) | 302 redirect saving `ThinkCodeLab-v1.3.4.apk` |
| **Direct APK Download URL (Redirect)** | [https://thinkcode-lab.web.app/ThinkCodeLab.apk](https://thinkcode-lab.web.app/ThinkCodeLab.apk) | 302 redirect directly to latest GitHub release binary (`ThinkCodeLab-v1.3.4.apk`) |
| **Short APK Download Link** | [https://thinkcode-lab.web.app/apk](https://thinkcode-lab.web.app/apk) | Quick short URL for student sharing (`ThinkCodeLab-v1.3.4.apk`) |
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
For `SharedArrayBuffer` and `Atomics` multi-threaded stdin execution in the browser:
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

---

## 🐙 4. GitHub Repository & Releases

| Parameter | Configuration | Details |
| :--- | :--- | :--- |
| **Repository URL** | [https://github.com/TahirMansuri/ThinkCode-Lab](https://github.com/TahirMansuri/ThinkCode-Lab) | Public open-source repository |
| **Git Clone SSH** | `git@github.com:TahirMansuri/ThinkCode-Lab.git` | SSH protocol clone link |
| **Git Clone HTTPS** | `https://github.com/TahirMansuri/ThinkCode-Lab.git` | HTTPS protocol clone link |
| **Default Branch** | `main` | Production-ready main branch |
| **Active Release Branch** | `release/v1.3.2` | Feature development and release branch |
| **GitHub Releases Page** | [github.com/TahirMansuri/ThinkCode-Lab/releases](https://github.com/TahirMansuri/ThinkCode-Lab/releases) | Versioned binary distribution page |
| **Latest Release Tag** | `v1.3.4` | Tag containing `ThinkCodeLab-v1.3.4.apk` asset (`versionCode 11`) |
| **Release APK Direct CDN** | [github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.4/ThinkCodeLab-v1.3.4.apk](https://github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.4/ThinkCodeLab-v1.3.4.apk) | GitHub release asset binary download |
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

#### 3. v1.3.4 Release APK Binary SHA-256 File Hash
*(Exact 64-character lowercase hex hash of `ThinkCodeLab-v1.3.4.apk` [Build 11] for Google Play Protect Appeal forms)*
```text
879856e091aa8e0244f7125de596dd76a6596e1e2cf1eec8c32419d0
```
- *(Previous `v1.3.3` Build 10 hash: `6f5dbdb720c9df0c81ff4edbb6061b21ad7066cd4f47a8a1627232f50b53447e`)*
- *(Previous `v1.3.2` Build 9 hash: `d01bf35bc3c077f02c5861da2df58898425a99e08f8d60c89801bd7232267566`)*

---

## 📱 6. Google Play Console & Android Build Specifications

| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Package Name** | `com.igc.thinkcodelab` | Android namespace & Google Play URL |
| **compileSdkVersion** | `36` | Target Android 16 platform APIs |
| **targetSdkVersion** | `36` | Strict compliance with Google Play requirements |
| **minSdkVersion** | `24` | Android 7.0 (Nougat) or higher (covers 95%+ of global devices) |
| **Signing Schemes Enabled** | `v1SigningEnabled = true`<br>`v2SigningEnabled = true` | Dual APK signature for modern & legacy Android |
| **Play Console Category** | **Education / Developer Tools** | App Store classification |
| **Content Rating** | **Everyone (PEGI 3)** | Clean educational coding environment |
| **Data Safety Declaration** | **Zero Data Collected** | 100% offline client-side code execution |
| **Release Artifact (Sideload)** | `ThinkCodeLab-v1.3.4.apk` (~17.7 MB, Build 11) | Standalone APK with all WASM runtimes embedded |
| **Release Artifact (Store)** | `ThinkCodeLab-release.aab` (~16.2 MB) | Google Play Android App Bundle |

---

## ⚡ 7. Quick Operational Commands Reference

```bash
# -------------------------------------------------------------
# 🌐 WEB DEVELOPMENT & FIREBASE DEPLOYMENT
# -------------------------------------------------------------
# 1. Start local Vite preview server
npm run dev

# 2. Compile production web distribution (outputs to dist/)
npm run build

# 3. Deploy web application live to Firebase Hosting
npx firebase deploy --only hosting


# -------------------------------------------------------------
# 📱 ANDROID BUILD & RELEASE COMPILATION
# -------------------------------------------------------------
# 1. Sync compiled web assets with Capacitor Android wrapper
npm run build
npx cap sync android

# 2. Compile signed production Release APK
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# 3. Compile signed production Google Play Bundle (AAB)
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab


# -------------------------------------------------------------
# 🐙 GIT SYNCHRONIZATION COMMANDS
# -------------------------------------------------------------
# Sync both release branch and main on GitHub
git push origin release/v1.3.2
git checkout main
git merge --ff-only release/v1.3.2
git push origin main
git checkout release/v1.3.2
```

---

## 📂 8. Project Credentials File Locations

| File | Project Location | Purpose |
| :--- | :--- | :--- |
| **Production Keystore** | `android/app/thinkcode-lab.keystore` | Android signing certificate |
| **Keystore Root Backup** | `thinkcode-lab.keystore` | Project root safety copy |
| **Gradle Signing Config** | `android/app/build.gradle` | Connects release build to keystore |
| **Android SDK Variables** | `android/variables.gradle` | Defines `targetSdkVersion = 36`, `minSdkVersion = 24` |
| **Firebase Target Mapping**| `.firebaserc` | Maps default project to `igcquiz-5d910` |
| **Firebase Hosting Rules** | `firebase.json` | COOP/COEP headers and `/ThinkCodeLab-v1.3.4.apk`, `/ThinkCodeLab.apk`, `/apk` redirects |
| **Master Credentials Guide**| `docs/09_ACCOUNT_AND_DEPLOYMENT_INFO.md` | This document |

