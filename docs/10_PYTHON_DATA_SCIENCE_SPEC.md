# 🐍 Python Data Science & Scientific Suite — Technical Specification & Roadmap

> **Feature Specification: On-Demand Scientific Libraries, Client-Side Data File Uploads (CSV/Excel), and Inline Plot Visualizer for ThinkCode Lab.**  
> Target Syllabus: Unit 4 (Object-Oriented Concepts, NumPy, Pandas, Matplotlib, Scikit-learn, Seaborn) & University Practical Syllabi (BCA, B.Sc. CS/IT, B.Tech, MCA).

---

## 📌 1. Executive Summary & Educational Objectives

### Motivation & Problem Statement
In undergraduate computer science curricula (e.g. FYBCA/SYBCA/TYBCA, B.Sc. IT/CS), Python courses require students to work with data science and machine learning libraries:
1. **NumPy** for matrix operations, linear algebra, and vector math.
2. **Pandas** for structured DataFrames, data cleaning, and CSV/Excel file analysis.
3. **Matplotlib & Seaborn** for 2D charts, scatter plots, histograms, and statistical visualization.
4. **Scikit-learn** for fundamental machine learning algorithms (Linear Regression, KNN, Decision Trees, K-Means Clustering).

Traditionally, running these libraries requires heavy local installations (Anaconda, Jupyter Notebook, PyCharm) or cloud-hosted Jupyter environments (Google Colab, Replit) requiring continuous high-speed internet.

### ThinkCode Lab Solution
Extend ThinkCode Lab's bundled **Pyodide CPython 3.12 WebAssembly engine** with an **On-Demand Scientific Library Manager**, a **Local Virtual Filesystem File Uploader**, and an **Inline Matplotlib Plot Visualizer**.

### Non-Negotiable Core Principles
1. **Zero Base APK Bloat:** The base Android APK remains ultra-compact at **~17.7 MB**. No heavy `.whl` or compiled shared libraries are bundled inside the core installer.
2. **Zero Base Web Bloat:** First-time web visitors at `thinkcode-lab.web.app` experience the same instant startup speed.
3. **On-Demand Local Installation:** Libraries are fetched from the Pyodide/PyPI CDN only when requested by the student and cached locally on the device (IndexedDB / CacheStorage). Once cached, they run completely offline.
4. **Client-Side Data Privacy:** User-uploaded `.csv`, `.xlsx`, and `.json` data files never touch any external server; they are mounted directly into Pyodide's virtual in-memory filesystem (`pyodide.FS`).

---

## 📊 2. Library Capability & Feasibility Matrix

| Library | Version / Source | Size (Approx) | Status | What Works in Client-Side WASM |
| :--- | :---: | :---: | :---: | :--- |
| 🔢 **NumPy** | `1.26.4` (Pyodide official) | ~14 MB | ✅ Supported | `ndarray`, linear algebra (`np.linalg`), slicing, matrix arithmetic, broadcasting, math functions. |
| 🐼 **Pandas** | `2.2.0` (Pyodide official) | ~18 MB | ✅ Supported | `DataFrame`, `Series`, `read_csv()`, `read_json()`, groupby, filtering, descriptive statistics (`describe()`). |
| 📊 **Matplotlib** | `3.5.2` (Pyodide official) | ~10 MB | ✅ Supported | `pyplot` 2D plots (line, bar, scatter, pie, histogram). Captured to Base64 PNG and rendered inline. |
| 🤖 **Scikit-learn** | `1.4.2` + `scipy 1.12` | ~35 MB | ✅ Supported | `train_test_split`, `LinearRegression`, `LogisticRegression`, `KNeighborsClassifier`, `KMeans`, metrics. |
| 📈 **Seaborn** | Latest (via `micropip`) | ~5 MB | ✅ Supported | Statistical charts (`sns.barplot`, `sns.heatmap`, `sns.pairplot`, `sns.boxplot`) built on top of Matplotlib. |
| 📁 **openpyxl** | Pure Python (via `micropip`) | ~2 MB | ✅ Supported | Excel file support enabling `pd.read_excel('data.xlsx')`. |
| 🧠 **PyTorch** | *None* | >200 MB | ❌ Not Feasible | Heavy native C++/CUDA binaries with no official Pyodide/WASM port. |
| 🕸️ **PyBrain** | *Legacy* | N/A | ❌ Incompatible | Abandoned >10 years ago for Python 2/old scipy; breaks on Python 3.12. |
| 🌐 **Flask** | *Server* | N/A | ⚠️ Server Restricted | Web sandboxes block raw TCP listening sockets (`socket.bind`/`listen`); `app.run()` server cannot open real ports. |

---

## 📂 3. Client-Side Data Files & Virtual Filesystem (VFS)

### 3.1 Local Upload Pipeline (Zero Server Overhead)
Students can upload local CSV or Excel files from their phone or computer into the virtual workspace:

```
[Student selects "students.csv" from device]
                   │
                   ▼ (HTML5 FileReader as Uint8Array)
       [JavaScript Host Thread]
                   │
                   ▼ postMessage({ type: 'mount_file', name: 'students.csv', data: buffer })
        [python.worker.js (Pyodide)]
                   │
                   ▼ pyodide.FS.writeFile('/home/pyodide/students.csv', data)
[Python Code Execution: pd.read_csv('students.csv') succeeds instantly!]
```

### 3.2 Pre-Seeded Academic Datasets
To eliminate friction for students on mobile devices who do not have sample CSVs saved on their phones, ThinkCode Lab will pre-seed **3 classic university datasets** directly into the virtual environment:
1. `students.csv`: Columns `roll_no`, `name`, `gender`, `marks_python`, `marks_dbms`, `attendance`, `grade`.
2. `iris.csv`: Columns `sepal_length`, `sepal_width`, `petal_length`, `petal_width`, `species` (classic dataset for Scikit-learn and Seaborn).
3. `sales.csv`: Columns `date`, `region`, `product`, `units_sold`, `unit_price`, `revenue` (ideal for Pandas grouping and Matplotlib line/bar graphs).

---

## 📈 4. Matplotlib & Seaborn Inline Plot Visualizer Architecture

In desktop Python, `plt.show()` creates a desktop GUI window (via Tkinter/Qt), which cannot display in a web worker or mobile browser. 

### Inline DOM Image Interception:
1. In `src/engines/python.worker.js`, configure Matplotlib's backend to `module://matplotlib_inline.backend_inline` or inject an automatic wrapper around `plt.show()`:
   ```python
   import io, base64, matplotlib.pyplot as plt
   def _custom_show():
       buf = io.BytesIO()
       plt.savefig(buf, format='png', bbox_inches='tight', dpi=120)
       buf.seek(0)
       img_b64 = base64.b64encode(buf.read()).decode('utf-8')
       # Emit special console sentinel or postMessage image event
       print(f"__THINKCODE_IMAGE_B64__:{img_b64}")
       plt.close()
   plt.show = _custom_show
   ```
2. The UI console sink in `src/main.js` catches the sentinel, strips it from text logs, and renders a clean, touch-zoomable `<img class="console-plot-image">` with **Save Image (PNG)** and **Copy Image** buttons.

---

## 🗺️ 5. Implementation Roadmap & Task Breakdown

### Phase 1: Engine & Package Loader Extension (`python.worker.js`)
- [x] Add `load_package` message handler in `src/engines/python.worker.js` calling `py.loadPackage(name)` or `micropip.install(name)`.
- [x] Add real-time download progress and status reporting (`post('status', 'Downloading numpy (14 MB)...')`).
- [x] Configure IndexedDB / CacheStorage persistence for loaded Pyodide packages (`thinkcode-pyodide-packages`).

### Phase 2: Virtual Filesystem (VFS) & Data File Manager
- [x] Add `mount_file` message handler in `python.worker.js` calling `py.FS.writeFile(filename, data)`.
- [x] Pre-mount the 3 academic datasets (`students.csv`, `iris.csv`, `sales.csv`) into `/home/pyodide/`.
- [x] Add a **[📁 Data]** button in the Python editor sub-bar allowing users to upload `.csv`, `.xlsx`, `.json`, and `.txt` files.
- [x] Display an active files dialog showing mounted filenames with a 1-tap `[×]` remove action and `[Use in Code]` snippet insert.

### Phase 3: Inline Plot Visualizer (Matplotlib & Seaborn)
- [x] Inject custom `plt.show()` interceptor into the Pyodide runtime before code execution.
- [x] Add `#console` renderer for plot images with high-DPI scaling, dark/light border contrast, and download/copy action.
- [x] Auto-flush unclosed plots when execution finishes so students who omit `plt.show()` still see their generated graphs.

### Phase 4: UI Package Manager Modal (`#pyPkgDialog`)
- [x] Build a sleek, accessible `<dialog id="pyPkgDialog">` listing the 5 supported scientific packages:
  - 🔢 **NumPy** (`~14 MB`)
  - 🐼 **Pandas** (`~18 MB`)
  - 📊 **Matplotlib** (`~10 MB`)
  - 🤖 **Scikit-learn + SciPy** (`~35 MB`)
  - 📈 **Seaborn** (`~5 MB`)
- [x] Show individual **[Install]** buttons, download progress bars, and **[✓ Active in Runtime]** / **[⚡ Cached Offline]** badges.
- [x] Automatically detect `import numpy`, `import pandas`, etc. in student code via `pyodide.loadPackagesFromImports` and `preparePythonImports`.

### Phase 5: New University Syllabus Practicals
- [x] Add **Unit 4 Practicals** in `src/practicals.js`:
  1. *NumPy Arrays & Matrix Operations* (`py-12`: Multiplication, Transpose, Determinant)
  2. *Pandas DataFrame Operations on `students.csv`* (`py-13`: Filtering, Sorting, GroupBy, Averages)
  3. *Matplotlib 2D Data Visualization* (`py-14`: Bar Graph with Labels/Legends & Inline Rendering)
  4. *Seaborn Statistical Plots on `iris.csv`* (`py-15`: Pairwise/Scatter Distribution)
  5. *Scikit-learn Machine Learning Model* (`py-16`: Linear Regression on Sales Data)

### Phase 6: Automated Verification & Unit Tests
- [x] Create `scripts/test-python-datascience.mjs` verifying:
  - Pre-seeded dataset schemas (`students.csv`, `iris.csv`, `sales.csv`).
  - RFC 4180 parsing conformance.
  - Scientific packages catalog integrity.
  - Practicals extension (83 global practicals, 16 Python practicals).
  - Pyodide runtime CDN fallback & CacheStorage patch.
  - Integrated into `npm run test` command.

---

## 🔒 6. Zero-Server & Offline Reliability Verification

1. **Base APK Size:** Kept under **18 MB** (no `.whl` files added to `android/app/src/main/assets/public/`).
2. **Network Dependency:** Required **only during the initial 1-time download** of the selected library. Once cached in local browser storage, executions run 100% offline.
3. **Data Security:** All student data files exist exclusively in the device's local memory / WebAssembly heap.

---

*Authored by: **Tahir Mansuri** · InfoGalaxy Computers · ThinkCode Lab Architecture Group*

