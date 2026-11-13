// Python Data Science & Scientific Suite: Package Manager & Data Files Dialogs
// Manages on-demand Pyodide packages (NumPy, Pandas, Matplotlib, Scikit-learn, Seaborn)
// and virtual filesystem data mounts (CSV, Excel, JSON).

import { SAMPLE_DATASETS, listSampleDatasets, getSampleDataset } from './python-datasets.js';

export const SCIENTIFIC_PACKAGES = Object.freeze([
  {
    id: 'numpy',
    name: 'NumPy',
    version: '1.26.4',
    size: '~14 MB',
    desc: 'Multi-dimensional arrays, linear algebra, vector math, and matrices.',
    importCode: 'import numpy as np'
  },
  {
    id: 'pandas',
    name: 'Pandas',
    version: '2.2.0',
    size: '~18 MB',
    desc: 'DataFrames, Series, CSV/Excel data cleaning, filtering, and analysis.',
    importCode: 'import pandas as pd'
  },
  {
    id: 'matplotlib',
    name: 'Matplotlib',
    version: '3.5.2',
    size: '~10 MB',
    desc: '2D publication-quality plotting (line, bar, scatter, pie) with inline preview.',
    importCode: 'import matplotlib.pyplot as plt'
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-learn',
    version: '1.4.2',
    size: '~35 MB',
    desc: 'Machine learning algorithms: Regression, Classification, Clustering (K-Means, KNN).',
    importCode: 'from sklearn.linear_model import LinearRegression'
  },
  {
    id: 'seaborn',
    name: 'Seaborn',
    version: '0.13.2',
    size: '~5 MB',
    desc: 'High-level statistical visualization, heatmaps, and dataset distribution plots.',
    importCode: 'import seaborn as sns'
  }
]);

const CACHE_NAME = 'thinkcode-pyodide-packages';

let mountedFiles = [];
let loadedPackages = new Set();
let installingPackages = new Set();
let callbacks = {
  onMountFile: () => {},
  onUnmountFile: () => {},
  onLoadPackage: () => {},
  onInsertCode: () => {},
  toast: () => {}
};

export async function isPackageCachedLocally(pkgId) {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const pkgLower = pkgId.toLowerCase();
    return keys.some(req => req.url.toLowerCase().includes(pkgLower));
  } catch {
    return false;
  }
}

export function initPythonTools(cbs = {}) {
  callbacks = { ...callbacks, ...cbs };
  setupPkgDialog();
  setupDataFilesDialog();
}

export function markPackageLoaded(pkgId) {
  const id = pkgId.toLowerCase();
  installingPackages.delete(id);
  loadedPackages.add(id);
  renderPkgDialogList();
}

export function markPackageFailed(pkgId, error) {
  const id = pkgId.toLowerCase();
  installingPackages.delete(id);
  renderPkgDialogList();
  callbacks.toast?.(`Failed to install ${pkgId}: ${error}`);
}

export function setMountedFiles(files) {
  mountedFiles = Array.isArray(files) ? files : [];
  renderDataFilesList();
}

export function addMountedFile(name, size = 0, isSample = false) {
  if (!mountedFiles.some(f => f.name === name)) {
    mountedFiles.push({ name, size, isSample, mtime: Date.now() });
    renderDataFilesList();
  }
}

export function removeMountedFile(name) {
  mountedFiles = mountedFiles.filter(f => f.name !== name);
  renderDataFilesList();
}

// ----------------- PACKAGES DIALOG -----------------
function setupPkgDialog() {
  const dialog = document.getElementById('pyPkgDialog');
  if (!dialog) return;

  const btnClose = dialog.querySelector('.py-dialog-close');
  btnClose?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
}

export async function openPackagesDialog() {
  const dialog = document.getElementById('pyPkgDialog');
  if (!dialog) return;
  await renderPkgDialogList();
  dialog.showModal();
}

async function renderPkgDialogList() {
  const listEl = document.getElementById('pyPkgList');
  if (!listEl) return;

  const items = await Promise.all(SCIENTIFIC_PACKAGES.map(async pkg => {
    const isLoaded = loadedPackages.has(pkg.id);
    const isInstalling = installingPackages.has(pkg.id);
    const isCached = isLoaded || (await isPackageCachedLocally(pkg.id));

    let badgeHtml = '';
    let btnHtml = '';

    if (isLoaded) {
      badgeHtml = '<span class="py-badge py-badge-ok">✓ Active in Runtime</span>';
      btnHtml = `<button type="button" class="btn btn-xs py-btn-snippet" data-code="${pkg.importCode}">+ Code</button>`;
    } else if (isInstalling) {
      badgeHtml = '<span class="py-badge py-badge-warn">⏳ Downloading…</span>';
      btnHtml = '<button type="button" class="btn btn-xs" disabled>Installing…</button>';
    } else if (isCached) {
      badgeHtml = '<span class="py-badge py-badge-cached">⚡ Cached Offline</span>';
      btnHtml = `<button type="button" class="btn btn-xs btn-primary py-btn-install" data-pkg="${pkg.id}">Load (${pkg.size})</button>`;
    } else {
      badgeHtml = '<span class="py-badge py-badge-mute">Not Downloaded</span>';
      btnHtml = `<button type="button" class="btn btn-xs btn-primary py-btn-install" data-pkg="${pkg.id}">Install (${pkg.size})</button>`;
    }

    return `
      <div class="py-pkg-card" data-pkg="${pkg.id}">
        <div class="py-pkg-main">
          <div class="py-pkg-header">
            <span class="py-pkg-title">${pkg.name}</span>
            <span class="py-pkg-version">v${pkg.version}</span>
            ${badgeHtml}
          </div>
          <p class="py-pkg-desc">${pkg.desc}</p>
        </div>
        <div class="py-pkg-actions">
          ${btnHtml}
        </div>
      </div>
    `;
  }));

  listEl.innerHTML = items.join('');

  listEl.querySelectorAll('.py-btn-install').forEach(btn => {
    btn.onclick = () => {
      const pkgId = btn.getAttribute('data-pkg');
      if (!pkgId) return;
      installingPackages.add(pkgId);
      renderPkgDialogList();
      callbacks.onLoadPackage?.(pkgId);
    };
  });

  listEl.querySelectorAll('.py-btn-snippet').forEach(btn => {
    btn.onclick = () => {
      const code = btn.getAttribute('data-code');
      if (code) {
        callbacks.onInsertCode?.(code + '\n');
        callbacks.toast?.(`✓ Added '${code}' to editor!`);
        document.getElementById('pyPkgDialog')?.close();
      }
    };
  });
}

// ----------------- DATA FILES DIALOG -----------------
function setupDataFilesDialog() {
  const dialog = document.getElementById('pyDataFilesDialog');
  if (!dialog) return;

  const btnClose = dialog.querySelector('.py-dialog-close');
  btnClose?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  const fileInput = document.getElementById('pyFileInput');
  const dropZone = document.getElementById('pyDropZone');

  dropZone?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
    fileInput.value = '';
  });

  dropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone?.addEventListener('drop', async e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) await handleFileUpload(file);
  });
}

async function handleFileUpload(file) {
  try {
    const name = file.name;
    const isText = /\.(csv|txt|json|tsv|dat)$/i.test(name);
    let content;

    if (isText) {
      content = await file.text();
    } else {
      const buf = await file.arrayBuffer();
      content = new Uint8Array(buf);
    }

    callbacks.onMountFile?.(name, content, file.size);
    addMountedFile(name, file.size, false);
    callbacks.toast?.(`✓ Mounted '${name}' into Python workspace!`);
  } catch (err) {
    callbacks.toast?.(`Failed to read file: ${err.message || err}`);
  }
}

export function openDataFilesDialog() {
  const dialog = document.getElementById('pyDataFilesDialog');
  if (!dialog) return;
  renderDataFilesList();
  dialog.showModal();
}

function renderDataFilesList() {
  const listEl = document.getElementById('pyDataFilesList');
  if (!listEl) return;

  // Combine pre-seeded sample datasets with any user uploaded files
  const sampleList = listSampleDatasets();
  const samplesByName = new Map(sampleList.map(s => [s.name, s]));

  const allFiles = [...mountedFiles];
  for (const s of sampleList) {
    if (!allFiles.some(f => f.name === s.name)) {
      allFiles.unshift({ name: s.name, size: s.sizeBytes, isSample: true });
    }
  }

  if (allFiles.length === 0) {
    listEl.innerHTML = '<div class="py-data-empty">No files mounted. Upload a CSV or Excel file above!</div>';
    return;
  }

  listEl.innerHTML = allFiles.map(f => {
    const sample = samplesByName.get(f.name);
    const sizeStr = f.size > 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${f.size} B`;
    const isCsv = f.name.endsWith('.csv');
    const isExcel = /\.(xlsx|xls)$/i.test(f.name);
    const codeSnippet = isCsv
      ? `import pandas as pd\ndf = pd.read_csv("${f.name}")\nprint(df.head())`
      : isExcel
      ? `import pandas as pd\ndf = pd.read_excel("${f.name}")\nprint(df.head())`
      : `with open("${f.name}") as f:\n  data = f.read()\nprint(data[:200])`;

    const meta = sample
      ? `<span class="py-file-tag sample">Pre-seeded Dataset (${sample.rowCount} rows)</span>`
      : `<span class="py-file-tag user">User File (${sizeStr})</span>`;

    const delBtn = sample
      ? ''
      : `<button type="button" class="btn btn-xs btn-danger py-btn-del" data-name="${f.name}" title="Unmount file">🗑 Delete</button>`;

    return `
      <div class="py-file-item">
        <div class="py-file-info">
          <div class="py-file-name-row">
            <span class="py-file-icon">${isCsv ? '📊' : isExcel ? '📑' : '📄'}</span>
            <b class="py-file-title">${f.name}</b>
            ${meta}
          </div>
          ${sample ? `<div class="py-file-cols">Cols: ${sample.headers.slice(0, 5).join(', ')}${sample.headers.length > 5 ? '…' : ''}</div>` : ''}
        </div>
        <div class="py-file-actions">
          <button type="button" class="btn btn-xs py-btn-insert" data-snippet="${encodeURIComponent(codeSnippet)}" title="Insert read code into editor">📋 Use in Code</button>
          ${delBtn}
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.py-btn-insert').forEach(btn => {
    btn.onclick = () => {
      const raw = btn.getAttribute('data-snippet');
      if (raw) {
        const code = decodeURIComponent(raw);
        callbacks.onInsertCode?.(code + '\n');
        callbacks.toast?.('✓ Inserted file loader code into editor!');
        document.getElementById('pyDataFilesDialog')?.close();
      }
    };
  });

  listEl.querySelectorAll('.py-btn-del').forEach(btn => {
    btn.onclick = () => {
      const name = btn.getAttribute('data-name');
      if (name) {
        callbacks.onUnmountFile?.(name);
        removeMountedFile(name);
        callbacks.toast?.(`Unmounted '${name}'`);
      }
    };
  });
}
