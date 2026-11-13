// Verification Suite for Python Data Science & Scientific Suite
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_DATASETS, listSampleDatasets, getSampleDataset } from '../src/python-datasets.js';
import { SCIENTIFIC_PACKAGES } from '../src/python-tools.js';
import { PRACTICALS } from '../src/practicals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running Python Data Science & Scientific Suite tests...');

// 1. Datasets tests
test('Pre-seeded sample datasets integrity & content mapping', () => {
  assert.equal(typeof SAMPLE_DATASETS, 'object');
  const names = Object.keys(SAMPLE_DATASETS);
  assert.equal(names.length, 3);
  assert.deepEqual(names, ['students.csv', 'iris.csv', 'sales.csv']);

  for (const name of names) {
    const content = SAMPLE_DATASETS[name];
    assert.ok(typeof content === 'string');
    assert.ok(content.length > 50);
  }
});

test('Dataset helper functions listSampleDatasets and getSampleDataset', () => {
  const list = listSampleDatasets();
  assert.equal(list.length, 3);
  assert.equal(list[0].name, 'students.csv');

  const studentsMeta = list.find(d => d.name === 'students.csv');
  assert.ok(studentsMeta);
  assert.equal(studentsMeta.rowCount, 10);
  assert.ok(studentsMeta.headers.includes('roll_no'));
  assert.ok(studentsMeta.headers.includes('grade'));

  const irisMeta = list.find(d => d.name === 'iris.csv');
  assert.ok(irisMeta);
  assert.equal(irisMeta.rowCount, 15);
  assert.ok(irisMeta.headers.includes('species'));

  const salesMeta = list.find(d => d.name === 'sales.csv');
  assert.ok(salesMeta);
  assert.equal(salesMeta.rowCount, 12);
  assert.ok(salesMeta.headers.includes('revenue'));

  const rawStudents = getSampleDataset('students.csv');
  assert.ok(rawStudents && rawStudents.startsWith('roll_no,name'));
  assert.equal(getSampleDataset('nonexistent.csv'), null);
});

test('CSV content format conforms to RFC 4180 parsing expectations', () => {
  const list = listSampleDatasets();
  for (const item of list) {
    const raw = getSampleDataset(item.name);
    const lines = raw.trim().split('\n');
    assert.equal(lines.length, item.rowCount + 1, `Line count matches rowCount + header in ${item.name}`);
    const headerCols = lines[0].split(',');
    assert.deepEqual(headerCols, item.headers);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      assert.equal(cols.length, headerCols.length, `Row ${i} col count matches header in ${item.name}`);
    }
  }
});

// 2. Scientific Packages Metadata tests
test('Scientific packages list contains all 5 key Unit 4 libraries', () => {
  assert.equal(SCIENTIFIC_PACKAGES.length, 5);
  const ids = SCIENTIFIC_PACKAGES.map(p => p.id);
  assert.deepEqual(ids, ['numpy', 'pandas', 'matplotlib', 'scikit-learn', 'seaborn']);

  for (const pkg of SCIENTIFIC_PACKAGES) {
    assert.ok(pkg.id);
    assert.ok(pkg.name);
    assert.ok(pkg.version);
    assert.ok(pkg.size.includes('MB'));
    assert.ok(pkg.desc);
    assert.ok(pkg.importCode.includes('import'));
  }
});

// 3. Practicals Extension tests
test('Practicals include all 5 new Python Unit 4 Data Science practicals', () => {
  const pyPracticals = PRACTICALS.python;
  assert.ok(Array.isArray(pyPracticals), 'PRACTICALS.python must be an array');
  assert.equal(pyPracticals.length, 16, 'Total Python practicals should be 16 (11 original + 5 new)');

  const practicalIds = ['py-12', 'py-13', 'py-14', 'py-15', 'py-16'];
  for (const id of practicalIds) {
    const p = pyPracticals.find(item => item.id === id);
    assert.ok(p, `Practical ${id} must exist in PRACTICALS.python`);
    assert.ok(p.title);
    assert.ok(p.code);
    assert.ok(p.desc);
  }

  // Check specific content
  const p12 = pyPracticals.find(p => p.id === 'py-12');
  assert.ok(p12.title.includes('NumPy'));
  assert.ok(p12.code.includes('import numpy as np'));

  const p13 = pyPracticals.find(p => p.id === 'py-13');
  assert.ok(p13.title.includes('Pandas'));
  assert.ok(p13.code.includes('pd.read_csv("students.csv")'));

  const p14 = pyPracticals.find(p => p.id === 'py-14');
  assert.ok(p14.title.includes('Matplotlib'));
  assert.ok(p14.code.includes('plt.show()'));

  const p15 = pyPracticals.find(p => p.id === 'py-15');
  assert.ok(p15.title.includes('Seaborn'));
  assert.ok(p15.code.includes('import seaborn as sns'));
  assert.ok(p15.code.includes('iris.csv'));

  const p16 = pyPracticals.find(p => p.id === 'py-16');
  assert.ok(p16.title.includes('Scikit-learn') || p16.title.includes('Machine Learning'));
  assert.ok(p16.code.includes('LinearRegression'));
});

// 4. Pyodide Patch tests
test('Pyodide runtime script public/pyodide/pyodide.asm.js has offline CacheStorage & CDN fallback patch', () => {
  const asmPath = path.join(rootDir, 'public', 'pyodide', 'pyodide.asm.js');
  assert.ok(fs.existsSync(asmPath), 'pyodide.asm.js must exist');
  const content = fs.readFileSync(asmPath, 'utf8');

  assert.ok(
    content.includes('thinkcode-pyodide-packages') || content.includes('Ge + n'),
    'pyodide.asm.js must contain the patched CDN fallback or CacheStorage logic'
  );
});

// 5. Total Practicals Count
test('Global practicals count across all languages matches exactly 83', () => {
  const allPracticals = Object.values(PRACTICALS).flat();
  assert.equal(allPracticals.length, 83, 'Total practicals should be 83 (78 prior + 5 new Python data science)');
});

console.log(`\nAll ${passed} Python Data Science tests passed successfully! ✨\n`);
