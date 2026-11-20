// Verification Suite for 1-Tap "New Program" / Starter Template Feature
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS } from '../src/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running 1-Tap New Program & Starter Template feature tests...');

// 1. index.html DOM structure
test('index.html contains btnNewCode with accessible labels and SVG icon in editor pane-head', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('id="btnNewCode"'), 'index.html must include id="btnNewCode"');
  assert.ok(html.includes('class="btn-new-code"'), 'index.html must have class="btn-new-code"');
  assert.ok(html.includes('aria-label="New Program"'), 'index.html must have aria-label="New Program"');
  assert.ok(html.includes('title="New Program / Blank Starter Template (Alt+N)"'), 'index.html must have descriptive title attribute');
  assert.ok(html.includes('<span>New</span>'), 'index.html must have text label "New"');
});

// 2. src/styles.css styling & theme support
test('src/styles.css defines .btn-new-code with dark and light themes, hover states, and responsive queries', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  assert.ok(css.includes('.btn-new-code'), 'styles.css must style .btn-new-code');
  assert.ok(css.includes('.btn-new-code:hover'), 'styles.css must have hover state for .btn-new-code');
  assert.ok(css.includes("[data-theme='light'] .btn-new-code"), 'styles.css must have light theme styling for .btn-new-code');
  assert.ok(css.includes('@media (max-width: 600px)'), 'styles.css must define mobile breakpoint');
});

// 3. src/main.js event binding & starter template reset contract
test('src/main.js wires btnNewCode to handleResetTemplate, resets practical meta, and binds Alt+N shortcut', () => {
  const mainJs = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
  assert.ok(mainJs.includes("$('btnNewCode')?.addEventListener('click', handleResetTemplate)"), 'main.js must bind btnNewCode');
  assert.ok(mainJs.includes('activePracticalMeta = null'), 'handleResetTemplate must reset activePracticalMeta');
  assert.ok(mainJs.includes("store.set('cf.code.' + cur.id, cur.tpl)"), 'handleResetTemplate must persist starter template');
  assert.ok(mainJs.includes("e.altKey && (e.key === 'N' || e.key === 'n')"), 'main.js must bind Alt+N shortcut');
});

// 4. Initial template integrity for every supported language
test('All 10 supported languages in LANGS have clean, non-empty starter templates', () => {
  assert.ok(Array.isArray(LANGS) && LANGS.length >= 10, 'LANGS must contain at least 10 languages');
  for (const lang of LANGS) {
    assert.ok(typeof lang.id === 'string' && lang.id.length > 0, 'Every language must have an id');
    assert.ok(typeof lang.name === 'string' && lang.name.length > 0, 'Every language must have a name');
    assert.ok(typeof lang.tpl === 'string' && lang.tpl.length > 0, `${lang.name} must have a non-empty starter template`);
    // Ensure all leading spaces in templates are multiples of 2
    const lines = lang.tpl.split('\n');
    for (const l of lines) {
      const m = l.match(/^( +)[^ ]/);
      if (m) {
        assert.equal(m[1].length % 2, 0, `${lang.name} template line has non-even indentation (${m[1].length} spaces): "${l}"`);
      }
    }
  }
});

console.log(`\nAll ${passed} New Program & Starter Template feature tests passed successfully! ✨\n`);
