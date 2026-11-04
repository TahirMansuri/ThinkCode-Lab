# 🚀 Google Play Store Release Details — ThinkCode Lab

This document contains the signing credentials, certificate fingerprints, and release artifacts for publishing **ThinkCode Lab** on the **Google Play Console**.

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

## 📦 Generated Release Artifacts

1. **Google Play Console App Bundle (.aab)**:
   - **File**: `ThinkCodeLab-release.aab` *(16 MB)*
   - **Version**: `1.1.2` (VersionCode: `4`)
   - **Usage**: **This is the exact file you upload to Google Play Console** (Production, Closed Testing, or Internal Testing track).
2. **Signed Release Standalone APK (.apk)**:
   - **File**: `ThinkCodeLab-release.apk` *(16 MB)*
   - **Version**: `1.1.2` (VersionCode: `4`)
   - **Usage**: Install directly on any real Android device (`adb install` or via file transfer) to test the signed production build locally.

---

## 🎨 Store Listing Assets Ready in Project

- **App Icon (512x512)**: `resources/icon-512.png`
- **High-Res Icon (1024x1024)**: `resources/icon.png`
- **Feature Graphic (1024x500)**: `resources/feature-graphic.png`
- **Privacy Policy**: `public/privacy.html` (Host on GitHub Pages or personal domain)

---

## 📋 Steps to Publish on Google Play Console

1. **Log in to Google Play Console**:
   - Go to [play.google.com/console](https://play.google.com/console).
2. **Create New App** (or select existing app if already created):
   - App name: **ThinkCode Lab**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
   - Accept the declarations and click **Create app**.
3. **Set Up App Details (Dashboard)**:
   - Complete the **Set up your app** tasks:
     - **Privacy Policy URL**: Link to your privacy policy.
     - **App access**: All functionality is available without special access.
     - **Ads**: No (ThinkCode Lab contains zero ads).
     - **Target audience & Content**: Select 13+ (or students/all ages).
     - **News app / Financial app**: No.
     - **Data safety**: App runs 100% offline, collects NO user data.
4. **Store Listing Assets**:
   - **App icon**: Upload `resources/icon.png` (512x512 / 1024x1024).
   - **Feature graphic**: 1024x500 banner.
   - **Screenshots**: Take 2–4 screenshots from your phone or browser running ThinkCode Lab.
   - **Short description**:
     > 100% offline multi-language code playground and mobile IDE for students. Python, PHP, Oracle SQL, JavaScript, HTML/CSS, and Linux Shell.
   - **Full description**: Use the full overview from [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md).
5. **Create Production / Internal Release**:
   - Under **Release**, go to **Production** (or **Internal testing** first).
   - Click **Create new release**.
   - Upload [`ThinkCodeLab-release.aab`](ThinkCodeLab-release.aab).
   - Release name: `1.1.1`
   - Release notes:
     ```
     ThinkCode Lab v1.1.1:
     - 100% offline multi-language code playground.
     - Full PHP 8.2 WebAssembly runtime with client-side CGI form bridge.
     - Dual-section split editor for PHP web practicals (HTML Form + PHP Backend).
     - Hardened runtime Stop & Re-Run lifecycle and button state synchronization.
     - Python 3.12 with real-time interactive in-console input().
     - Oracle-compatible SQL engine with live schemas (SCOTT, UNIVERSITY, BANK).
     - JavaScript, sandboxed HTML/CSS Web Preview, and Linux Bash Shell.
     ```
   - Click **Next** → **Review and rollout release**!
