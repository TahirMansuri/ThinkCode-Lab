# 🚀 Google Play Store Release Details — ThinkCode Lab

This document contains the signing credentials, certificate fingerprints, configuration, and release artifacts for publishing **ThinkCode Lab** on the **Google Play Console**.

---

## 🔑 Release Keystore Information

> [!CAUTION]
> **Keep your keystore file and passwords safe and backed up!**
> If you lose this `.keystore` file or credentials, Google Play will NOT allow you to update your app in the future.

| Parameter | Value |
| :--- | :--- |
| **Keystore File** | `thinkcode-lab.keystore` |
| **Keystore Location** | `android/app/thinkcode-lab.keystore` (also at project root) |
| **Keystore Password** | `ThinkCodeLab@2026` |
| **Key Alias** | `thinkcodelab` |
| **Key Password** | `ThinkCodeLab@2026` |
| **Algorithm** | RSA 2048-bit (SHA256withRSA) |
| **Validity** | 10,000 days (Until March 21, 2054) |
| **Certificate Owner** | `CN=Tahir Mansuri, OU=ThinkCode, O=InfoGalaxy, L=Shirpur, ST=Maharashtra, C=IN` |

---

## 📜 Certificate Fingerprints (for Firebase, Google Cloud, APIs)

- **SHA-256 Fingerprint**:
  ```
  49:03:53:9B:E9:17:27:6E:1E:BC:30:1B:64:CC:F4:11:8D:ED:41:82:88:73:D7:B9:1F:29:E3:C3:D7:12:FE:30
  ```
- **SHA-1 Fingerprint**:
  ```
  56:86:1D:2C:E4:67:30:8E:D6:30:94:89:20:F0:E1:FD:CC:4D:E2:CB
  ```

---

## 📦 Current Production Release Artifacts (v1.1.4)

| Artifact | File Name | Version | Version Code | Target SDK | Min SDK | Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Play Bundle** | `ThinkCodeLab-release.aab` | **1.1.4** | **6** | **API 36** | **API 24** | **16 MB** |
| **Standalone Release APK** | `ThinkCodeLab-release.apk` | **1.1.4** | **6** | **API 36** | **API 24** | **16 MB** |

> **Play Store Compliance**:
> - `minSdkVersion: 24` (Android 7.0+) satisfies Google Play's Play Automatic App Protection.
> - `targetSdkVersion: 36` and `compileSdkVersion: 36` satisfies Google Play's latest target API level mandate.

---

## 🎨 Store Listing Assets Ready in Project

- **App Icon (512x512)**: `resources/icon-512.png` & `ThinkCode-PlayStore-Assets/01-app-icon/`
- **High-Res Icon (1024x1024)**: `resources/icon.png`
- **Feature Graphic (1024x500)**: `resources/feature-graphic.png` & `ThinkCode-PlayStore-Assets/feature-graphic-1024x500.png`
- **Phone Screenshots**: `ThinkCode-PlayStore-Assets/02-phone-screenshots/`
- **Tablet 7-inch Screenshots**: `ThinkCode-PlayStore-Assets/03-tablet-7inch/`
- **Tablet 10-inch Screenshots**: `ThinkCode-PlayStore-Assets/04-tablet-10inch/`
- **Privacy Policy**: `privacy.html` & `docs/privacy.html` (Hosted on GitHub Pages: `https://tahirmansuri.github.io/ThinkCode-Lab/privacy.html`)

---

## 📋 Google Play Console Submission Status

- **Application ID / Package**: `com.igc.thinkcodelab`
- **App Name**: `ThinkCode-Lab`
- **Release Track**: **Production** (`v1.1.4`, Version Code `6`)
- **Rollout Status**: Full Rollout submitted (Under Google Review)
- **Target Countries / Regions**: India, United Arab Emirates, Bangladesh (expandable to all regions)
- **Content Rating**: Everyone / PEGI 3 (No violence, no objectionable content)
- **Data Safety**: 100% Offline — No data collected, shared, or transmitted.

---

## 📝 Release Notes (Production v1.1.4)

```text
ThinkCode Lab v1.1.4:
• 100% offline multi-language code playground & mobile IDE.
• Python 3.12 with interactive in-console input() support.
• PHP 8.2 WebAssembly runtime with Dual-Section HTML+PHP workspace.
• Oracle-compatible SQL engine with live schema visualizer.
• Touch-friendly JavaScript prompt() and alert() popups for mobile & desktop.
• Sandboxed HTML/CSS Web Preview & Linux Bash Shell.
• Built on latest Android API 36 with optimized performance and battery efficiency.
```
