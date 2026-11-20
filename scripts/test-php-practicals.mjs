// Verification Suite for TYBCA Web Technology-I (PHP) Practicals (CA-317(A))
import assert from 'node:assert/strict';
import { PRACTICALS } from '../src/practicals.js';
import { SUBJECT_DEFAULTS } from '../src/lab-journal.js';

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running TYBCA PHP Practicals (CA-317(A)) Suite tests...');

// 1. Array count & existence
test('PRACTICALS.php contains exactly 10 syllabus practicals', () => {
  assert.ok(Array.isArray(PRACTICALS.php), 'PRACTICALS.php must be an array');
  assert.equal(PRACTICALS.php.length, 10, 'Expected exactly 10 PHP assignments');
});

// 2. Metadata completeness
test('All 10 PHP practicals have complete metadata and IDs php-1 through php-10', () => {
  const ids = PRACTICALS.php.map(p => p.id);
  const expectedIds = Array.from({ length: 10 }, (_, i) => `php-${i + 1}`);
  assert.deepEqual(ids, expectedIds);

  PRACTICALS.php.forEach((p, idx) => {
    assert.equal(p.num, `Assignment ${idx + 1}`);
    assert.ok(p.cat && typeof p.cat === 'string' && p.cat.trim().length > 0, `Assignment ${idx + 1} must have a category`);
    assert.ok(p.title && typeof p.title === 'string' && p.title.trim().length > 0, `Assignment ${idx + 1} must have a title`);
    assert.ok(p.desc && typeof p.desc === 'string' && p.desc.trim().length > 0, `Assignment ${idx + 1} must have a description`);
    assert.ok(p.code && typeof p.code === 'string' && p.code.includes('<?php'), `Assignment ${idx + 1} must contain valid PHP code`);
  });
});

// 3. Syllabus topic alignment
test('Assignments match the official TYBCA CA-317(A) university syllabus topics', () => {
  const titles = PRACTICALS.php.map(p => p.title.toLowerCase());
  // 1: Hello World & current date
  assert.ok(titles[0].includes('hello world') && titles[0].includes('date'));
  // 2: Arithmetic operators & calculations
  assert.ok(titles[1].includes('arithmetic'));
  // 3: Conditional statements & loops / tables
  assert.ok(titles[2].includes('conditional') || titles[2].includes('table'));
  // 4: Functions & arrays (indexed and associative) with foreach
  assert.ok(titles[3].includes('function') && titles[3].includes('array'));
  // 5: MySQL database connect & URL parameter insert
  assert.ok(titles[4].includes('mysql') || titles[4].includes('database'));
  // 6: CRUD operations (display, update, delete)
  assert.ok(titles[5].includes('crud'));
  // 7: HTML form with $_GET and $_POST validation
  assert.ok(titles[6].includes('form'));
  // 8: Login and logout system using sessions
  assert.ok(titles[7].includes('session') || titles[7].includes('login'));
  // 9: File upload & cookies
  assert.ok(titles[8].includes('upload') || titles[8].includes('cookie'));
  // 10: PHP classes & JSON data using json_encode
  assert.ok(titles[9].includes('json') || titles[9].includes('class'));
});

// 4. Dual-mode HTML form integration
test('Dual-mode assignments (php-7, php-8, php-9) contain semantic HTML forms', () => {
  const formAssignments = PRACTICALS.php.filter(p => ['php-7', 'php-8', 'php-9'].includes(p.id));
  assert.equal(formAssignments.length, 3);

  formAssignments.forEach(p => {
    assert.ok(typeof p.html === 'string' && p.html.length > 50, `${p.id} must have html defined`);
    assert.ok(p.html.includes('<form'), `${p.id} html must have a form element`);
    assert.ok(p.html.includes('action="process.php"'), `${p.id} form must post to process.php`);
  });
});

// 5. Offline database compatibility
test('Database practicals (php-5, php-6, php-10) include offline-safe PDO/SQLite execution & standard MySQL comments', () => {
  const p5 = PRACTICALS.php.find(p => p.id === 'php-5');
  const p6 = PRACTICALS.php.find(p => p.id === 'php-6');
  const p10 = PRACTICALS.php.find(p => p.id === 'php-10');

  assert.ok(p5.code.includes('sqlite::memory:') || p5.code.includes('PDO'), 'php-5 must support offline WASM execution');
  assert.ok(p5.code.includes('CREATE TABLE') && p5.code.includes('INSERT INTO'), 'php-5 must perform SQL table creation and insert');

  assert.ok(p6.code.includes('UPDATE') && p6.code.includes('DELETE') && p6.code.includes('SELECT'), 'php-6 must demonstrate full CRUD operations');

  assert.ok(p10.code.includes('class Student'), 'php-10 must define an OOP class');
  assert.ok(p10.code.includes('json_encode'), 'php-10 must use json_encode to output JSON');
});

// 6. Lab journal subject mapping
test('SUBJECT_DEFAULTS.php is configured for Web Technology-I (PHP) Lab (CA-317(A))', () => {
  assert.equal(SUBJECT_DEFAULTS.php, 'Web Technology-I (PHP) Lab (CA-317(A))');
});

console.log(`\nAll ${passed} TYBCA PHP practicals tests passed successfully! ✨\n`);
