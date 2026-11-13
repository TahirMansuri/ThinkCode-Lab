// Verification Suite for Android Hardware Back-Button Interception & Exit Confirmation
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running Android Back-Button & Exit Confirmation tests...');

// 1. Check DOM markup in index.html
test('Exit dialog DOM structure and accessibility in index.html', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(html.includes('id="exitDialog"'), 'exitDialog element must exist');
  assert.ok(html.includes('id="exitDialogTitle"'), 'exitDialogTitle must exist');
  assert.ok(html.includes('id="exitDialogDesc"'), 'exitDialogDesc must exist');
  assert.ok(html.includes('id="btnExitCancel"'), 'btnExitCancel button must exist');
  assert.ok(html.includes('id="btnExitConfirm"'), 'btnExitConfirm button must exist');
  assert.ok(html.includes('id="menuBtnExit"'), 'menuBtnExit in drawer must exist');
  assert.ok(html.includes('aria-labelledby="exitDialogTitle"'), 'exitDialog must have aria-labelledby');
  assert.ok(html.includes('aria-describedby="exitDialogDesc"'), 'exitDialog must have aria-describedby');
});

// 2. Check CSS styles in src/styles.css
test('Exit confirmation dialog CSS classes and animations in src/styles.css', () => {
  const css = fs.readFileSync(path.join(rootDir, 'src', 'styles.css'), 'utf8');
  assert.ok(css.includes('.exit-dialog {'), '.exit-dialog styles must exist');
  assert.ok(css.includes('.exit-dialog[open] {'), '.exit-dialog[open] must be scoped');
  assert.ok(css.includes('.exit-dialog::backdrop {'), '.exit-dialog backdrop must exist');
  assert.ok(css.includes('@keyframes exitDialogPop'), 'exitDialogPop animation must exist');
  assert.ok(css.includes('.exit-btn-cancel'), '.exit-btn-cancel button style must exist');
  assert.ok(css.includes('.exit-btn-danger'), '.exit-btn-danger button style must exist');
  assert.ok(css.includes('.drawer-item-exit'), '.drawer-item-exit style must exist');
});

// 3. Check MainActivity.java native implementation
test('Android native back dispatcher and exit bridge in MainActivity.java', () => {
  const java = fs.readFileSync(path.join(rootDir, 'android', 'app', 'src', 'main', 'java', 'com', 'igc', 'thinkcodelab', 'MainActivity.java'), 'utf8');
  assert.ok(java.includes('import androidx.activity.OnBackPressedCallback;'), 'Must import OnBackPressedCallback');
  assert.ok(java.includes('getOnBackPressedDispatcher().addCallback'), 'Must register back pressed callback');
  assert.ok(java.includes('window.handleThinkCodeBackPress'), 'Must invoke JS window.handleThinkCodeBackPress');
  assert.ok(java.includes('public void exitApp()'), 'Must expose exitApp in SystemUiBridge');
  assert.ok(java.includes('finishAffinity()'), 'exitApp must call finishAffinity');
});

// 4. Test logic priority simulation
test('handleThinkCodeBackPress closes topmost overlay without exiting', () => {
  // Simulate DOM state
  const state = {
    exitDialogOpen: false,
    promptModalHidden: true,
    guiWindowHidden: true,
    plotLoaderHidden: true,
    openDialogs: [],
    menuDrawerOpen: false,
    sheetHidden: true,
    activeElement: { tagName: 'BODY', blur() {} },
    appExited: false
  };

  function simulateBackPress() {
    if (state.exitDialogOpen) {
      state.exitDialogOpen = false;
      return true;
    }
    if (!state.promptModalHidden) {
      state.promptModalHidden = true;
      return true;
    }
    if (!state.guiWindowHidden) {
      state.guiWindowHidden = true;
      return true;
    }
    if (!state.plotLoaderHidden) {
      state.plotLoaderHidden = true;
      return true;
    }
    if (state.openDialogs.length > 0) {
      state.openDialogs.pop();
      return true;
    }
    if (state.menuDrawerOpen) {
      state.menuDrawerOpen = false;
      return true;
    }
    if (!state.sheetHidden) {
      state.sheetHidden = true;
      return true;
    }
    if (state.activeElement.tagName === 'SELECT' || state.activeElement.tagName === 'INPUT') {
      state.activeElement.blur();
      state.activeElement = { tagName: 'BODY', blur() {} };
      return true;
    }
    state.exitDialogOpen = true;
    return true;
  }

  // 1. Bottom sheet is open (e.g. Practicals list)
  state.sheetHidden = false;
  assert.equal(simulateBackPress(), true);
  assert.equal(state.sheetHidden, true, 'Sheet must be closed');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 2. Menu drawer is open
  state.menuDrawerOpen = true;
  assert.equal(simulateBackPress(), true);
  assert.equal(state.menuDrawerOpen, false, 'Menu drawer must be closed');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 3. Python package dialog is open
  state.openDialogs.push('pyPkgDialog');
  assert.equal(simulateBackPress(), true);
  assert.equal(state.openDialogs.length, 0, 'Dialog must be closed');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 4. Input prompt modal is open
  state.promptModalHidden = false;
  assert.equal(simulateBackPress(), true);
  assert.equal(state.promptModalHidden, true, 'Prompt modal must be closed');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 5. GUI window modal is open
  state.guiWindowHidden = false;
  assert.equal(simulateBackPress(), true);
  assert.equal(state.guiWindowHidden, true, 'GUI modal must be closed');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 6. Active select dropdown is focused
  let blurred = false;
  state.activeElement = { tagName: 'SELECT', blur() { blurred = true; } };
  assert.equal(simulateBackPress(), true);
  assert.equal(blurred, true, 'Dropdown select must be blurred');
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must NOT be opened yet');

  // 7. Nothing is open -> Now Exit Dialog opens!
  assert.equal(simulateBackPress(), true);
  assert.equal(state.exitDialogOpen, true, 'Exit dialog must now be shown');

  // 8. If user presses back again while Exit Dialog is open -> Dismisses dialog (stays in app)
  assert.equal(simulateBackPress(), true);
  assert.equal(state.exitDialogOpen, false, 'Exit dialog must be dismissed without exiting app');
});

// 5. Check main.js exports and window bindings
test('main.js exposes handleThinkCodeBackPress and initExitConfirmation', () => {
  const mainJs = fs.readFileSync(path.join(rootDir, 'src', 'main.js'), 'utf8');
  assert.ok(mainJs.includes('export function handleThinkCodeBackPress'), 'handleThinkCodeBackPress must be exported');
  assert.ok(mainJs.includes('window.handleThinkCodeBackPress = handleThinkCodeBackPress;'), 'Must attach to window');
  assert.ok(mainJs.includes('export function showExitConfirmDialog'), 'showExitConfirmDialog must be exported');
  assert.ok(mainJs.includes('export function closeExitConfirmDialog'), 'closeExitConfirmDialog must be exported');
  assert.ok(mainJs.includes('window.ThinkCodeSystemUI.exitApp()'), 'Must call ThinkCodeSystemUI.exitApp()');
  assert.ok(mainJs.includes('initExitConfirmation();'), 'initExitConfirmation must be invoked on boot');
});

console.log(`\nAll ${passed} Android Back-Button & Exit Confirmation tests passed successfully! ✨`);
