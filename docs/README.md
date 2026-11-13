# 📚 ThinkCode Lab — Technical Documentation Directory

Welcome to the comprehensive technical documentation for **ThinkCode Lab**. All architectural guides, release specifications, engine internals, and developer memory files are organized systematically below:

---

## 📑 Documentation Index

| # | Document | Description |
| :---: | :--- | :--- |
| **01** | [**Project Overview**](01_PROJECT_OVERVIEW.md) | Vision, educational background, core value proposition, 8 offline language engines, Lab Journal PDF export, and repository structure. |
| **02** | [**Technical Stack & Architecture**](02_TECH_STACK.md) | High-level threading model, engine runtimes, dual stdin bridges (`SharedArrayBuffer` + Android `POST /__native_stdin`), pure-JS PDF writer, Popover/Dialog UI, and Capacitor Android bridges. |
| **03** | [**Engine Architecture & Implementation**](03_ENGINE_ARCHITECTURE.md) | Deep dive into Java AST & Swing emulation, hardened PicoC & unified JSCPP C++ engines, Clang upgrade path, PHP CGI bridge, Oracle SQL layer, Lab Journal PDF pipeline, and silent update checker. |
| **04** | [**Changelog & Milestones**](04_CHANGELOG.md) | Chronological version history from v1.0.0 through **v1.3.4 (Build 11 APK)** and active **`feature/v1.3.5`** enhancements (Lab Journal PDF + Silent APK Update Checker). |
| **05** | [**Future Roadmap**](05_ROADMAP.md) | Strategic roadmap covering completed Phases 1–6 (Lab Journal PDF, Update Checker), approved upcoming queue (#2 Saved Programs, #3 Classroom Auto-Graded Links, #5 Error Hints/Input Replay), and longer-term plans. |
| **06** | [**Google Play Store & Android Distribution**](06_PLAYSTORE_RELEASE.md) | Production release keystore details, SHA-256 certificate & APK hashes, Play Protect appeal guide, target API 36 compliance, `version.json` checklist, and release build instructions. |
| **07** | [**Developer Memory & Operational Rules**](07_DEVELOPER_MEMORY.md) | Critical developer memory, strictly enforced rules (Web-only deployment, no unrequested APK builds or VDI/emulator launches, backup policy), and production gotchas learned. |
| **08** | [**Future Enhancements & Feature Catalog**](08_FUTURE_ENHANCEMENTS.md) | Status-tracked specifications for completed enhancements (Quick-Symbol Strip, Beautifier, App Drawer, Lab Journal PDF, Silent APK Updates) and upcoming features. |
| **09** | [**Master Accounts, Keys & URLs Directory**](09_ACCOUNT_AND_DEPLOYMENT_INFO.md) | Complete directory of administrative accounts, Firebase project IDs, `/version.json` manifest rules, signing keystore passwords, SHA-256 hashes, release URLs, and Git/deployment commands. |
| **10** | [**Python Data Science & Scientific Suite**](10_PYTHON_DATA_SCIENCE_SPEC.md) | Technical specification and roadmap for on-demand scientific libraries (NumPy, Pandas, Matplotlib, Scikit-learn, Seaborn), local CSV/Excel uploads, and inline plot visualization. |

---

## 🌐 Live Resources & Portals

- **Live Web Application**: [https://thinkcode-lab.web.app](https://thinkcode-lab.web.app)
- **APK Download Portal**: [https://thinkcode-lab.web.app/download](https://thinkcode-lab.web.app/download) *(auto-hydrates from `/version.json`)*
- **Live Update Manifest**: [https://thinkcode-lab.web.app/version.json](https://thinkcode-lab.web.app/version.json) *(CORS + CORP + `no-store`)*
- **Direct APK Download**: [https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.4.apk](https://thinkcode-lab.web.app/ThinkCodeLab-v1.3.4.apk) (or short link `/apk`)
- **GitHub Repository**: [https://github.com/TahirMansuri/ThinkCode-Lab](https://github.com/TahirMansuri/ThinkCode-Lab)
- **Parent Initiative**: [ThinkCode — Interactive Algorithm Visualizer](https://thinkcode.infogalaxy.space/)
