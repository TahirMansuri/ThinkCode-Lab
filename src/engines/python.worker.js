// Classic worker: real CPython 3.12 (Pyodide) with interactive stdin,
// on-demand scientific package loading, virtual filesystem data mounts, and inline plot capture.

let py = null, base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
let nativeStdin = false;
let stdoutBuf = '';
const post = (t, s, extra = {}) => postMessage({ t, s, ...extra });
const dec = new TextDecoder();
const clean = m => { const i = m.indexOf('  File "<exec>"'); return i > 0 ? 'Traceback (most recent call last):\n' + m.slice(i) : m; };

const SAMPLE_DATASETS = {
  'students.csv': `roll_no,name,gender,marks_python,marks_dbms,attendance,grade
101,Aarav Sharma,Male,85,78,92,A
102,Priya Patel,Female,92,88,96,A+
103,Rohan Verma,Male,67,72,81,B
104,Sneha Kulkarni,Female,74,69,85,B+
105,Aditya Joshi,Male,89,91,94,A+
106,Ananya Mehta,Female,58,62,75,C
107,Kunal Patil,Male,95,94,98,A+
108,Divya Nair,Female,81,85,89,A
109,Sameer Khan,Male,63,59,72,C
110,Pooja Desai,Female,88,84,91,A`,

  'iris.csv': `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica`,

  'sales.csv': `date,region,product,units_sold,unit_price,revenue
2026-01-15,North,Laptop,12,55000,660000
2026-01-18,West,Mouse,45,650,29250
2026-01-22,South,Keyboard,30,1200,36000
2026-01-25,East,Monitor,18,12500,225000
2026-02-05,North,Mouse,60,650,39000
2026-02-12,West,Laptop,15,55000,825000
2026-02-18,South,Monitor,22,12500,275000
2026-02-25,East,Keyboard,35,1200,42000
2026-03-04,North,Monitor,25,12500,312500
2026-03-10,West,Keyboard,50,1200,60000
2026-03-18,South,Laptop,20,55000,1100000
2026-03-24,East,Mouse,70,650,45500`
};

function readNativeStdinSync() {
  post('need_input');
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', base + '__native_stdin?ts=' + Date.now(), false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send('{}');
    if (xhr.status === 200 && xhr.responseText) {
      const res = JSON.parse(xhr.responseText);
      if (!res.cancelled) return String(res.text ?? '');
    }
  } catch (_) {}
  return null;
}

function mountAcademicDatasets() {
  if (!py?.FS) return;
  for (const [name, content] of Object.entries(SAMPLE_DATASETS)) {
    try {
      py.FS.writeFile(name, content);
    } catch (_) {}
  }
}

function flushStdoutBuffer() {
  if (!stdoutBuf) return;
  if (stdoutBuf.startsWith('__THINKCODE_IMAGE_B64__:')) {
    const b64 = stdoutBuf.slice('__THINKCODE_IMAGE_B64__:'.length).trim();
    if (b64) postMessage({ t: 'plot', b64 });
  } else {
    post('out', stdoutBuf);
  }
  stdoutBuf = '';
}

async function preparePythonImports(code) {
  if (!py) return;

  // 1. PyPI pure-python dependencies requiring micropip
  const needsSeaborn = /\b(?:import\s+seaborn|from\s+seaborn)\b/.test(code);
  const needsOpenpyxl = /\b(?:import\s+openpyxl|from\s+openpyxl)\b/.test(code);

  if (needsSeaborn || needsOpenpyxl) {
    try {
      post('status', 'Loading micropip installer…');
      await py.loadPackage('micropip');
      const micropip = py.pyimport('micropip');
      if (needsSeaborn) {
        post('status', 'Installing seaborn & dependencies…');
        await micropip.install('seaborn');
      }
      if (needsOpenpyxl) {
        post('status', 'Installing openpyxl for Excel files…');
        await micropip.install('openpyxl');
      }
    } catch (e) {
      post('err', `Warning: Failed to install PyPI package via micropip: ${e.message || e}\n`);
    }
  }

  // 2. Official Pyodide packages (numpy, pandas, matplotlib, scikit-learn, scipy)
  try {
    if (typeof py.loadPackagesFromImports === 'function') {
      await py.loadPackagesFromImports(code, {
        messageCallback: msg => post('status', msg),
        errorCallback: err => console.warn('Pyodide import warning:', err)
      });
    }
  } catch (e) {
    console.warn('loadPackagesFromImports skipped/failed:', e);
  }
}

async function setupMatplotlibHook() {
  if (!py) return;
  try {
    await py.runPythonAsync(`
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as _tc_plt
    import io, base64

    def _tc_custom_show(*args, **kwargs):
        for _fignum in _tc_plt.get_fignums():
            _fig = _tc_plt.figure(_fignum)
            _buf = io.BytesIO()
            _fig.savefig(_buf, format="png", bbox_inches="tight", dpi=120)
            _buf.seek(0)
            _b64 = base64.b64encode(_buf.read()).decode("ascii")
            print("__THINKCODE_IMAGE_B64__:" + _b64)
        _tc_plt.close("all")

    _tc_plt.show = _tc_custom_show
except Exception:
    pass
`);
  } catch (_) {}
}

async function flushMatplotlibPlots() {
  if (!py) return;
  try {
    await py.runPythonAsync(`
try:
    import matplotlib.pyplot as _tc_plt
    if len(_tc_plt.get_fignums()) > 0:
        _tc_plt.show()
except Exception:
    pass
`);
  } catch (_) {}
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    nativeStdin = Boolean(data.nativeStdin);
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'Loading Python runtime…');
    try {
      importScripts(base + 'pyodide/pyodide.js');
      py = await loadPyodide({ indexURL: base + 'pyodide/' });
      
      // Mount sample datasets
      mountAcademicDatasets();

      py.setStdout({
        write: b => {
          const chunk = dec.decode(b, { stream: true });
          stdoutBuf += chunk;
          let nl;
          while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
            const line = stdoutBuf.slice(0, nl);
            stdoutBuf = stdoutBuf.slice(nl + 1);
            if (line.startsWith('__THINKCODE_IMAGE_B64__:')) {
              const b64 = line.slice('__THINKCODE_IMAGE_B64__:'.length).trim();
              if (b64) postMessage({ t: 'plot', b64 });
            } else {
              post('out', line + '\n');
            }
          }
          return b.length;
        }
      });

      py.setStderr({
        write: b => {
          post('err', dec.decode(b, { stream: true }));
          return b.length;
        }
      });

      py.setStdin({
        isatty: true,
        stdin: () => {
          // Priority 1: Interactive in-console input via SharedArrayBuffer
          if (status) {
            post('need_input');
            Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
            Atomics.wait(status, 0, 1);
            if (Atomics.load(status, 0) === 2) { // 2 = INPUT_READY
              const len = Atomics.load(dataLen, 0);
              const copy = new Uint8Array(len);
              copy.set(dataBuf.subarray(0, len));
              const text = dec.decode(copy);
              Atomics.store(status, 0, 0);
              return text + '\n';
            }
            Atomics.store(status, 0, 0);
            return null;
          }
          // Priority 2: Android WebView Native Stdin Bridge
          if (nativeStdin) {
            const val = readNativeStdinSync();
            return val === null ? null : val + '\n';
          }
          // Fallback only if SharedArrayBuffer and Native Stdin Bridge are unavailable
          if (queue.length > 0) return queue.shift() + '\n';
          return null;
        }
      });

      post('ready');
    } catch (e) {
      post('fatal', 'Python runtime failed to load: ' + e);
    }
    return;
  }

  // Mount custom user data file
  if (data.type === 'mount_file') {
    if (!py?.FS) {
      post('err', 'Python virtual filesystem not ready.\n');
      return;
    }
    try {
      py.FS.writeFile(data.name, data.content);
      post('status', `Mounted file ${data.name}`);
      postMessage({ t: 'file_mounted', name: data.name, size: data.size || 0 });
    } catch (e) {
      post('err', `Failed to mount file ${data.name}: ${e.message || e}\n`);
    }
    return;
  }

  // Unmount custom user data file
  if (data.type === 'unmount_file') {
    if (py?.FS) {
      try {
        py.FS.unlink(data.name);
        postMessage({ t: 'file_unmounted', name: data.name });
      } catch (_) {}
    }
    return;
  }

  // List mounted files in virtual filesystem
  if (data.type === 'list_files') {
    const list = [];
    if (py?.FS) {
      try {
        for (const f of py.FS.readdir('.')) {
          if (f !== '.' && f !== '..') {
            const st = py.FS.stat(f);
            list.push({
              name: f,
              size: st.size,
              isSample: Boolean(SAMPLE_DATASETS[f]),
              mtime: st.mtime
            });
          }
        }
      } catch (_) {}
    }
    postMessage({ t: 'file_list', files: list });
    return;
  }

  // Explicit on-demand package loader
  if (data.type === 'load_package') {
    const pkg = String(data.name || '').trim().toLowerCase();
    if (!pkg) return;
    try {
      post('status', `Preparing ${pkg}…`);
      if (pkg === 'seaborn' || pkg === 'openpyxl') {
        await py.loadPackage('micropip');
        const micropip = py.pyimport('micropip');
        post('status', `Downloading ${pkg} from PyPI…`);
        await micropip.install(pkg);
      } else {
        await py.loadPackage(pkg, {
          messageCallback: m => post('status', m)
        });
      }
      post('status', `✓ ${pkg} loaded successfully`);
      postMessage({ t: 'package_loaded', name: pkg });
    } catch (e) {
      post('err', `Failed to install package '${pkg}': ${e.message || e}\n`);
      postMessage({ t: 'package_failed', name: pkg, error: String(e.message || e) });
    }
    return;
  }

  if (data.type === 'run') {
    queue = (data.stdin || '').split('\n').filter(Boolean);
    stdoutBuf = '';

    try {
      // 1. Check and install imports on demand (NumPy, Pandas, Matplotlib, Seaborn, openpyxl)
      await preparePythonImports(data.code);

      // 2. Setup Matplotlib plot interception if needed
      if (/\b(?:matplotlib|pyplot|plt|seaborn|sns)\b/.test(data.code)) {
        await setupMatplotlibHook();
      }

      // 3. Execute Python code
      await py.runPythonAsync(data.code);

      // 4. Auto-flush any open Matplotlib figures
      if (/\b(?:matplotlib|pyplot|plt|seaborn|sns)\b/.test(data.code)) {
        await flushMatplotlibPlots();
      }

      flushStdoutBuffer();
    } catch (e) {
      flushStdoutBuffer();
      post('err', clean(String(e.message || e)) + '\n');
    }
    post('done');
  }
};
