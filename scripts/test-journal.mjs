// Lightweight Node verification for 1-Tap Lab Journal & Offline PDF Engine
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SUBJECT_DEFAULTS,
  computeAcademicYear,
  todayIsoDate,
  formatDisplayDate,
  inferPracticalTitle,
  sanitizePdfFilename,
  tokenizeLine,
  extractConsoleSnapshot,
  buildJournalHtml,
  buildPdfFromJpegPages
} from '../src/lab-journal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running Lab Journal & Offline PDF unit tests...');

test('Academic year calculation rolls over in June', () => {
  assert.equal(computeAcademicYear(new Date(2026, 4, 15)), '2025-26'); // May 2026
  assert.equal(computeAcademicYear(new Date(2026, 5, 1)), '2026-27');  // June 2026
  assert.equal(todayIsoDate(new Date(2026, 10, 5)), '2026-11-05');
  assert.equal(formatDisplayDate('2026-11-05'), '05 Nov 2026');
});

test('Subject defaults exist for all supported runtimes', () => {
  for (const lang of ['python', 'java', 'cpp', 'c', 'php', 'sql', 'shell', 'js', 'web']) {
    assert.ok(SUBJECT_DEFAULTS[lang]?.length > 5, `Missing subject default for ${lang}`);
  }
});

test('Practical title inference extracts clean titles across languages', () => {
  assert.equal(inferPracticalTitle('// Single Inheritance in C++ — runs 100% offline', 'cpp', 'C++'), 'Single Inheritance in C++');
  assert.equal(inferPracticalTitle('# Factorial using Recursion in Python\ndef fact(n): pass', 'python', 'Python'), 'Factorial using Recursion in Python');
  assert.equal(inferPracticalTitle('-- Employee Salary Query\nSELECT * FROM EMP;', 'sql', 'SQL'), 'Employee Salary Query');
  assert.equal(inferPracticalTitle('#!/bin/bash\n# File Permissions & Loops\nls -la', 'shell', 'Linux Shell'), 'File Permissions & Loops');
  assert.equal(inferPracticalTitle('<!-- Student Registration Form -->\n<!doctype html>', 'web', 'HTML / CSS'), 'Student Registration Form');
  assert.equal(inferPracticalTitle('int main(){return 0;}', 'c', 'C'), 'C Lab Exercise');
});

test('PDF filename sanitization strips unsafe characters cleanly', () => {
  assert.equal(
    sanitizePdfFilename({ practicalNo: 'Practical #04', rollNo: 'TY-24/A' }, 'cpp'),
    'ThinkCodeLab_cpp_Practical_04_TY_24_A.pdf'
  );
  assert.equal(
    sanitizePdfFilename({ practicalNo: 'Lab 1', studentName: 'Rohan Patil' }, 'python'),
    'ThinkCodeLab_python_Lab_1_Rohan_Patil.pdf'
  );
});

test('Tokenizer classifies keywords, strings, numbers, preprocessor directives, and multiline comments', () => {
  const cState = { inBlockComment: false };
  const incTokens = tokenizeLine('#include <iostream>', 'cpp', cState);
  assert.deepEqual(incTokens, [{ text: '#include <iostream>', kind: 'meta' }]);

  const blockStart = tokenizeLine('int x = 42; /* start', 'cpp', cState);
  assert.equal(cState.inBlockComment, true);
  assert.equal(blockStart[0].kind, 'kw'); // int
  assert.ok(blockStart.some(t => t.kind === 'num' && t.text === '42'));
  assert.equal(blockStart[blockStart.length - 1].kind, 'com');

  const blockEnd = tokenizeLine('still comment */ return x;', 'cpp', cState);
  assert.equal(cState.inBlockComment, false);
  assert.equal(blockEnd[0].kind, 'com');
  assert.ok(blockEnd.some(t => t.kind === 'kw' && t.text === 'return'));

  const sqlTokens = tokenizeLine("select name from emp where sal > 5000 -- check", 'sql');
  assert.ok(sqlTokens.some(t => t.kind === 'kw' && t.text === 'select'));
  assert.ok(sqlTokens.some(t => t.kind === 'com' && t.text === '-- check'));
});

test('HTML journal builder escapes untrusted strings and renders code, output, SQL, GUI, and signature sections', () => {
  const html = buildJournalHtml(
    {
      institute: 'InfoGalaxy <Test>',
      department: 'Computer Applications',
      studentName: 'Asha <script>alert(1)</script>',
      rollNo: '12',
      className: 'TYBCA',
      academicYear: '2026-27',
      subject: 'Oracle SQL',
      practicalNo: 'Practical #07',
      title: 'Join & Group By <Demo>',
      aim: 'Query employee salaries.',
      date: '2026-11-12'
    },
    {
      langId: 'sql',
      langName: 'Oracle SQL',
      codeFiles: [
        { filename: 'query.sql', label: 'Oracle SQL Source', langId: 'sql', code: 'SELECT ENAME, SAL FROM EMP;' }
      ],
      logs: [{ kind: 'ok', text: '✓ Query succeeded\n' }],
      tables: [{ caption: '1 row (2 cols)', cols: ['ENAME', 'SAL'], rows: [{ cells: [{ text: 'KING', isNull: false }, { text: '5000', isNull: false }] }] }],
      gui: { title: 'Login Form', size: '400x300', status: 'Active', fields: [{ kind: 'Input', value: 'student' }] },
      preview: { title: 'Form', textLines: ['Submitted'], inputs: ['user: asha'] },
      hasOutput: true,
      suggested: { practicalNo: 'Practical #07', subject: 'Oracle SQL', title: 'Join & Group By', aim: '' }
    },
    { includeCode: true, includeOutput: true, includeSignature: true }
  );

  assert.ok(!html.includes('<script>'), 'Must escape script tags');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('jp-sql-table'));
  assert.ok(html.includes('jp-gui-card'));
  assert.ok(html.includes('jp-prev-box'));
  assert.ok(html.includes('jp-sig-box'));
});

test('HTML journal builder supports code-only / no-output fallback cleanly', () => {
  const html = buildJournalHtml(
    { practicalNo: 'Practical #02', title: 'Hello World' },
    {
      langId: 'c',
      langName: 'C',
      codeFiles: [{ filename: 'main.c', label: 'C Source', langId: 'c', code: 'int main() { return 0; }' }],
      logs: [],
      tables: [],
      gui: null,
      preview: null,
      hasOutput: false,
      suggested: { practicalNo: 'Practical #02', subject: 'C Lab', title: 'Hello World', aim: '' }
    },
    { includeCode: true, includeOutput: true, includeSignature: false }
  );
  assert.ok(html.includes('No program output captured yet'));
  assert.ok(!html.includes('jp-sig-box'));
});

test('Standards-compliant multi-page PDF 1.4 binary validates exact xref byte offsets and embedded JPEG streams', () => {
  const fakeJpg1 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  const fakeJpg2 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x11, 0x22, 0x33, 0x44, 0xff, 0xd9]);
  const fakeJpg3 = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  const pdfBytes = buildPdfFromJpegPages([
    { bytes: fakeJpg1, width: 1240, height: 1754 },
    { bytes: fakeJpg2, width: 1240, height: 1754 },
    { bytes: fakeJpg3, width: 1240, height: 1754 }
  ]);

  const text = Buffer.from(pdfBytes).toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4\n'), 'Must start with %PDF-1.4 header');
  assert.ok(text.endsWith('%%EOF\n'), 'Must end with %%EOF');

  // Verify binary marker bytes > 127 on line 2
  assert.ok(pdfBytes[10] > 127 && pdfBytes[11] > 127 && pdfBytes[12] > 127 && pdfBytes[13] > 127);

  // Extract startxref offset and confirm it resolves cleanly to "xref\n"
  const startxrefMatch = /startxref\n(\d+)\n%%EOF\n$/.exec(text);
  assert.ok(startxrefMatch, 'Missing startxref trailer');
  const xrefOffset = Number(startxrefMatch[1]);
  assert.equal(text.slice(xrefOffset, xrefOffset + 5), 'xref\n', 'startxref must point directly to xref table');

  // Parse xref table: expect 3 + 3*3 = 12 objects (0..11)
  const xrefSection = text.slice(xrefOffset).split('trailer\n')[0];
  const xrefLines = xrefSection.slice(0, -1).split('\n');
  assert.equal(xrefLines[0], 'xref');
  assert.equal(xrefLines[1], '0 12');
  assert.equal(xrefLines.length, 14);
  assert.equal(xrefLines[2], '0000000000 65535 f ');

  for (let id = 1; id < 12; id++) {
    const entry = xrefLines[2 + id];
    assert.equal(entry.length, 19, `xref line ${id} (before \\n) must be 19 chars (20 bytes total)`);
    const objOffset = Number(entry.slice(0, 10));
    assert.equal(text.slice(objOffset, objOffset + `${id} 0 obj\n`.length), `${id} 0 obj\n`, `Offset mismatch for obj ${id}`);
  }

  // Verify embedded JPEG bytes in Image XObjects (5, 8, 11)
  const expectedImgs = [fakeJpg1, fakeJpg2, fakeJpg3];
  [5, 8, 11].forEach((imgObjId, idx) => {
    const objOffset = Number(xrefLines[2 + imgObjId].slice(0, 10));
    const slice = text.slice(objOffset, objOffset + 240);
    assert.ok(slice.includes(`/Length ${expectedImgs[idx].length} >>\nstream\n`));
    const streamPos = text.indexOf('stream\n', objOffset) + 7;
    const extracted = pdfBytes.subarray(streamPos, streamPos + expectedImgs[idx].length);
    assert.deepEqual(extracted, expectedImgs[idx], `JPEG payload mismatch on page ${idx + 1}`);
  });
});

test('extractConsoleSnapshot gracefully handles null input', () => {
  const empty = extractConsoleSnapshot(null);
  assert.deepEqual(empty, { logs: [], tables: [] });
});

test('HTML & JS DOM element IDs match cleanly with zero dangling selectors', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const mainJs = fs.readFileSync(path.join(rootDir, 'src/main.js'), 'utf8');

  const requiredIds = [
    'btnJournalOut', 'menuBtnJournal', 'journalDialog', 'journalDialogTitle',
    'btnJournalClose', 'journalOutNotice', 'journalForm', 'jfPracticalNo',
    'jfDate', 'jfTitle', 'jfTitleError', 'jfSubject', 'jfAim',
    'jfInstitute', 'jfDepartment', 'jfStudentName', 'jfRollNo',
    'jfClassName', 'jfClassSuggestions', 'jfAcademicYear',
    'jfIncCode', 'jfIncOutput', 'jfIncSig', 'journalPreviewWrap',
    'journalPreviewStage', 'journalStatus', 'btnJournalPreviewToggle',
    'btnJournalPrint', 'btnJournalDownload', 'journalPrintRoot'
  ];

  for (const id of requiredIds) {
    assert.ok(indexHtml.includes(`id="${id}"`), `Missing id="${id}" in index.html`);
    if (id !== 'journalDialogTitle' && id !== 'jfClassSuggestions') {
      assert.ok(mainJs.includes(`'${id}'`), `Unused or unreferenced id '${id}' in src/main.js`);
    }
  }
});

console.log(`\nAll ${passed} Lab Journal unit tests passed!\n`);
