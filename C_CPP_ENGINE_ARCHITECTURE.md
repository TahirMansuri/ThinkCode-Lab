# ⚙️ C & C++ Engine Architecture & Future Upgrade Guide — ThinkCode Lab

> **Document Purpose:**  
> This document details the architectural options, trade-offs, and technical roadmap for C and C++ execution in **ThinkCode Lab**. Use this guide whenever evaluating or upgrading the C/C++ compilation strategy.

---

## 🎯 1. Architectural Options Evaluated

To run C and C++ inside an **offline-first mobile IDE and client-side web application** with zero backend servers, three distinct architectural approaches exist:

| Parameter | ⚡ Option 1: Lightweight Embedded Engine *(Current)* | 📦 Option 2: Clang WASM On-Demand Pack *(Future Upgrade)* | 🚀 Option 3: Pre-Bundled Full Clang WASM |
| :--- | :--- | :--- | :--- |
| **App Size Impact** | **+2 to 4 MB** | **0 MB to Base APK** *(~30 MB on-demand)* | **+45 to 60 MB to Base APK** |
| **Startup / Compile Speed** | **Instantaneous (< 50 ms)** | 1.5 – 3.5 seconds | 1.5 – 3.5 seconds |
| **Offline Execution** | 100% Offline out-of-the-box | 100% Offline after 1-time download | 100% Offline out-of-the-box |
| **RAM Footprint** | Extremely low (< 25 MB) | Moderate (~120–200 MB during LLVM compile) | Moderate (~120–200 MB during LLVM compile) |
| **Language Coverage** | C99 + C++ core OOP, functions, I/O, pointers, arrays, structs | 100% C++17/20 + full STL (`<vector>`, `<map>`, `<algorithm>`) | 100% C++17/20 + full STL (`<vector>`, `<map>`, `<algorithm>`) |
| **Mobile Suitability** | **Exceptional for all devices (even entry-level 2GB phones)** | Great for modern phones with storage | May deter downloads on cellular data in emerging regions |

---

## 💡 2. Current Implementation: Option 1 (Lightweight Embedded Engine)

### Why Option 1 is Active Now:
1. **Preserves the ~18 MB App Bundle Size:**  
   ThinkCode Lab's core advantage on the Google Play Store is being an ultra-fast, lightweight download for students in regions with limited cellular data bandwidth.
2. **Instant 0ms Feedback:**  
   Students learning loops, conditionals, recursion, and pointers get instant console feedback without waiting 3 seconds for an LLVM compiler pipeline to generate and link object files.
3. **Covers 95% of Academic Practical Syllabi:**  
   BCA, B.Sc. IT, and 1st-year Engineering lab courses focus strictly on procedural logic, pointer manipulation, arrays, structures, math, and introductory classes.

---

## 🗺️ 3. Future Upgrade Guide: Switching to Full Clang/LLVM (Option 2)

When ThinkCode Lab expands to advanced data structures and competitive programming (Phase 3+), follow these steps to migrate to **Option 2 (Clang WASM Downloadable Pack)**:

### Architecture of Option 2:
```plaintext
Client Browser / Android App
 ├── Base App (~18 MB) [Python, PHP, SQL, JS, Shell, C/C++ Lightweight]
 └── "Download Clang Pack" (Triggered on first demand)
      ├── Fetches: clang.wasm (~22 MB gzip) + lld.wasm (~8 MB) + sysroot.tar (~6 MB)
      ├── Caches in: Capacitor Filesystem (Native) or CacheStorage / IndexedDB (Web)
      └── Spawns: clang.worker.js with memfs in-memory virtual filesystem
```

### Steps to Implement Option 2 in the Future:
1. **Toolchain Source:**
   - Use [`binji/wasm-clang`](https://github.com/binji/wasm-clang) or upstream `wasi-sdk` (Clang + LLD targeting `wasm32-wasi`).
2. **Pack Manager Component (`src/pack-manager.js`):**
   - Implement an on-demand asset pack downloader that checks `localStorage` or Capacitor `Filesystem.stat()`.
   - If pack is missing, display a modern progress modal:
     > *"Downloading C/C++ Complete STL Compiler Pack (32 MB)... Download once, compiles offline forever."*
   - Verify SHA-256 integrity upon download completion.
3. **Compiler Worker Interface (`src/engines/clang.worker.js`):**
   - Mount virtual filesystem (`memfs`).
   - Write source code to `/main.cpp`.
   - Invoke `clang -target wasm32-wasi -c /main.cpp -o /main.o`.
   - Invoke `wasm-ld /main.o -L/lib -lc -lc++ -o /main.wasm`.
   - Instantiate resulting WebAssembly binary with WASI standard I/O hooks.
4. **Interactive Stdin Bridge:**
   - Connect standard WASI `fd_read` (stdin) to ThinkCode Lab's `SharedArrayBuffer` + `Atomics.wait` for `cin >>` and `scanf`.

---

## 📋 4. Active Features in Option 1

- **C Engine (`src/engines/c.worker.js`)**:
  - Full C99 standard library emulation: `stdio.h` (`printf`, `scanf`), `math.h`, `string.h`, `stdlib.h` (`malloc`, `free`, `abs`, `rand`).
  - True pointer arithmetic, multidimensional arrays, recursive function calls.
- **C++ Engine (`src/engines/cpp.worker.js`)**:
  - `iostream` (`std::cout`, `std::cin`, `std::endl`).
  - Classes, access specifiers (`public`, `private`), constructors, destructors, member methods.
  - Structs and basic standard template functions.
- **Unified UI Integration**:
  - CodeMirror C/C++ syntax highlighting.
  - Interactive terminal stdin & touch-friendly `#promptModal` integration.
  - One-click starter practical templates for college assignments.
