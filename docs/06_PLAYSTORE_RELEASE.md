# 🚀 Google Play Store Release & Android Distribution — ThinkCode Lab

> **Official credentials, keystore fingerprints, Android target API compliance, release artifacts, and build instructions for ThinkCode Lab on the Google Play Console.**

---

## 🔑 1. Production Release Keystore Information

> [!CAUTION]
> **Keep the keystore file and credentials backed up securely!**
> If this keystore file or key password is lost, Google Play will reject all future app updates.

| Parameter | Configuration Value |
| :--- | :--- |
| **Keystore File** | `thinkcode-lab.keystore` |
| **Keystore Location** | `android/app/thinkcode-lab.keystore` (also at repository root) |
| **Keystore Password** | `ThinkCodeLab@2026` |
| **Key Alias** | `thinkcodelab` |
| **Key Password** | `ThinkCodeLab@2026` |
| **Algorithm** | RSA 2048-bit (`SHA256withRSA`) |
| **Validity** | 10,000 days (Valid until March 21, 2054) |
| **Certificate Owner** | `CN=Tahir Mansuri, OU=ThinkCode, O=InfoGalaxy, L=Shirpur, ST=Maharashtra, C=IN` |

---

## 📜 2. Certificate Fingerprints & Hashes

### Certificate Fingerprints (for Firebase, Google Cloud & Play Console)
- **SHA-256 Fingerprint**:
  ```
  49:03:53:9B:E9:17:27:6E:1E:BC:30:1B:64:CC:F4:11:8D:ED:41:82:88:73:D7:B9:1F:29:E3:C3:D7:12:FE:30
  ```
- **SHA-1 Fingerprint**:
  ```
  56:86:1D:2C:E4:67:30:8E:D6:30:94:89:20:F0:E1:FD:CC:4D:E2:CB
  ```

### Google Play Protect Appeal Portal Reference
When appealing Play Protect warnings or filing developer verification forms:
- **Certificate Fingerprint Field**: Requires the colon-separated SHA-256 (`49:03:53:9B:E9:...`)
- **APK SHA-256 File Hash Field**: Requires the exact 64-character lowercase hexadecimal hash of the APK binary itself without colons:
  - **v1.3.2 APK File Hash**: `d01bf35bc3c077f02c5861da2df58898425a99e08f8d60c89801bd7232267566`

---

## 📦 3. Release Artifacts History

| Version | Version Code | Target API | Min API | Artifact Name | Size | Status |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **1.3.2** | **9** | **36** | **24** | `ThinkCodeLab.apk` | **17.6 MB** | **Active Release (Direct & Web)** |
| **1.3.1** | **8** | **36** | **24** | `ThinkCodeLab-release.apk` | **17.6 MB** | Previous Release |
| **1.1.4** | **6** | **36** | **24** | `ThinkCodeLab-release.aab` | **16.2 MB** | **Google Play Production Track** |

### Google Play Compliance Highlights:
- **`compileSdkVersion = 36` and `targetSdkVersion = 36`**: Strictly complies with Google Play’s latest target API requirement (Android 16).
- **`minSdkVersion = 24` (Android 7.0+)**: Satisfies Google Play’s Play Automatic App Protection mandate.
- **APK Signature Scheme v2 + v1**: Ensures compatibility with both modern and legacy Android operating systems.

---

## 🎨 4. Store Listing Assets Ready in Repository

- **App Icon (512x512)**: `resources/icon-512.png` & `public/assets/icon-512.png`
- **High-Res Master Icon (1024x1024)**: `resources/icon.png`
- **Feature Graphic (1024x500)**: `resources/feature-graphic.png`
- **Phone Screenshots**: `public/assets/` & store listings
- **Privacy Policy**: Hosted live at **[https://thinkcode-lab.web.app/privacy.html](https://thinkcode-lab.web.app/privacy.html)** and GitHub Pages.

---

## 📋 5. Google Play Console Listing Metadata

- **Application ID / Package**: `com.igc.thinkcodelab`
- **App Name**: `ThinkCode Lab`
- **Category**: Education / Tools
- **Content Rating**: Everyone / PEGI 3 (Non-violent, educational content)
- **Data Safety Declaration**:
  - **100% Offline**: No personal data, location, financial, or device identifier data is collected, stored, or transmitted to any external server.
- **Short Description**:
  ```text
  100% offline code editor & compiler for Java, Python, C, C++, PHP, SQL, and Shell.
  ```

---

## 🛠️ 6. How to Build Release Artifacts

### 1. Build Standalone Release APK
```bash
# 1. Build web distribution
npm run build

# 2. Sync web assets with Capacitor
npx cap sync android

# 3. Compile signed release APK
cd android
./gradlew assembleRelease

# 4. Resulting APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### 2. Build Google Play Android App Bundle (AAB)
```bash
cd android
./gradlew bundleRelease

# Resulting AAB location:
# android/app/build/outputs/bundle/release/app-release.aab
```
