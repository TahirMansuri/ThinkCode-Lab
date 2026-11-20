// Verification Suite for 1-Tap "New Blank File" Feature
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, BLANK_TEMPLATES } from '../src/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running 1-Tap New Blank File feature tests...');

// 1. index.html DOM structure
test('index.html contains btnNewCode with accessible labels, SVG icon, and .btn-new-label in editor pane-head', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('id="btnNewCode"'), 'index.html must include id="btnNewCode"');
  assert.ok(html.includes('class="btn-new-code"'), 'index.html must have class="btn-new-code"');
  assert.ok(html.includes('aria-label="New Blank File"'), 'index.html must have aria-label="New Blank File"');
  assert.ok(html.includes('title="New Blank File (Alt+N)"'), 'index.html must have descriptive title attribute');
  assert.ok(html.includes('<span class="btn-new-label">New</span>'), 'index.html must have text label wrapped in .btn-new-label');
});

// 2. src/styles.css styling & mobile/android space-saving rules
test('src/styles.css hides .btn-new-label on mobile screens and in native Android app to preserve space', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  assert.ok(css.includes('.btn-new-code'), 'styles.css must style .btn-new-code');
  assert.ok(css.includes('.btn-new-code .btn-new-label'), 'styles.css must style .btn-new-label');
  assert.ok(css.includes('.btn-new-code:hover'), 'styles.css must have hover state for .btn-new-code');
  assert.ok(css.includes("[data-theme='light'] .btn-new-code"), 'styles.css must have light theme styling for .btn-new-code');
  assert.ok(css.includes('@media (max-width: 600px)'), 'styles.css must define mobile breakpoint');
  assert.ok(css.includes('body.is-native-app .btn-new-code .btn-new-label'), 'styles.css must hide label on native Android app');
});

// 3. src/main.js event binding & blank template reset contract
test('src/main.js wires btnNewCode to handleResetTemplate, resets practical meta, and binds Alt+N shortcut', () => {
  const mainJs = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  assert.ok(mainJs.includes("$('btnNewCode')?.addEventListener('click', handleResetTemplate)"), 'main.js must bind btnNewCode');
  assert.ok(mainJs.includes('activePracticalMeta = null'), 'handleResetTemplate must reset activePracticalMeta');
  assert.ok(mainJs.includes("store.set('cf.code.' + cur.id, blankCode)"), 'handleResetTemplate must persist blankCode');
  assert.ok(mainJs.includes("e.altKey && (e.key === 'N' || e.key === 'n')"), 'main.js must bind Alt+N shortcut');
});

// 4. Initial minimal blank code segments for all languages
test('BLANK_TEMPLATES provides clean minimal boilerplate matching syllabus expectations for every language', () => {
  assert.ok(BLANK_TEMPLATES && typeof BLANK_TEMPLATES === 'object', 'BLANK_TEMPLATES must be defined');
  // Python: print("Welcome")
  assert.ok(BLANK_TEMPLATES.python.includes('print("Welcome")'), 'Python blank template must have print("Welcome")');
  // C: #include <stdio.h> and int main()
  assert.ok(BLANK_TEMPLATES.c.includes('#include <stdio.h>') && BLANK_TEMPLATES.c.includes('int main()'), 'C blank template must have stdio.h and main');
  // C++: #include <iostream> and int main()
  assert.ok(BLANK_TEMPLATES.cpp.includes('#include <iostream>') && BLANK_TEMPLATES.cpp.includes('int main()'), 'C++ blank template must have iostream and main');
  // Java: Scanner and class Main
  assert.ok(BLANK_TEMPLATES.java.includes('public class Main') && BLANK_TEMPLATES.java.includes('static void main'), 'Java blank template must have class Main');
  // C#: class Program and static void Main
  assert.ok(BLANK_TEMPLATES.csharp.includes('class Program') && BLANK_TEMPLATES.csharp.includes('static void Main'), 'C# blank template must have class Program');
  // PHP: <?php echo "Welcome"; ?>
  assert.ok(BLANK_TEMPLATES.php.includes('<?php') && BLANK_TEMPLATES.php.includes('Welcome'), 'PHP blank template must have Welcome');

  for (const lang of LANGS) {
    assert.ok(lang.blank, `${lang.name} must have a blank template defined`);
    // Ensure all leading spaces in blank templates are multiples of 2
    const lines = lang.blank.split('\n');
    for (const l of lines) {
      const m = l.match(/^( +)[^ ]/);
      if (m) {
        assert.equal(m[1].length % 2, 0, `${lang.name} blank template line has non-even indentation (${m[1].length} spaces): "${l}"`);
      }
    }
  }
});

console.log(`\nAll ${passed} New Blank File feature tests passed successfully! ✨\n`);
