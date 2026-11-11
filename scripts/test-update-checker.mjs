// Lightweight Node verification for Silent In-App APK Update Checker
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_META,
  SILENT_CHECK_INTERVAL_MS,
  SNOOZE_DURATION_MS,
  sanitizeHttpUrl,
  parseSemver,
  compareSemver,
  isUpdateAvailable,
  normalizeManifest,
  formatReleaseDate,
  formatShortChecksum,
  getInstalledAppVersion,
  shouldRunSilentCheck,
  shouldShowUpdateToast,
  createSimulatedManifest,
  fetchLatestManifest
} from '../src/update-checker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
function test(name, fn) {
  const res = fn();
  if (res && typeof res.then === 'function') {
    throw new Error(`Sync test() called on async test: ${name}`);
  }
  passed++;
  console.log(`  ✓ ${name}`);
}

async function testAsync(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Running Silent APK Update Checker unit tests...');

test('Semver parser and comparator handle versions, prefixes, and pre-releases', () => {
  assert.deepEqual(parseSemver('v1.3.5'), { major: 1, minor: 3, patch: 5, extra: 0, prerelease: '' });
  assert.equal(compareSemver('1.3.5', '1.3.4'), 1);
  assert.equal(compareSemver('v1.4.0', '1.3.99'), 1);
  assert.equal(compareSemver('1.3.4', '1.3.4'), 0);
  assert.equal(compareSemver('1.3.5-beta.1', '1.3.5'), -1);
  assert.equal(compareSemver('1.3.5', '1.3.5-rc.2'), 1);
  assert.equal(parseSemver('invalid..ver'), null);
});

test('isUpdateAvailable prioritizes Android integer versionCode over semver', () => {
  assert.equal(isUpdateAvailable({ versionCode: 11, versionName: '1.3.4' }, { versionCode: 12, versionName: '1.3.4' }), true);
  assert.equal(isUpdateAvailable({ versionCode: 12, versionName: '1.3.5' }, { versionCode: 12, versionName: '1.4.0' }), false);
  assert.equal(isUpdateAvailable({ versionCode: 11, versionName: '1.3.4' }, { versionCode: 10, versionName: '1.3.5' }), false);
  // Semver fallback if versionCode missing
  assert.equal(isUpdateAvailable({ versionName: '1.3.4' }, { versionName: '1.3.5' }), true);
});

test('sanitizeHttpUrl rejects javascript:, data:, file:, and non-local http:', () => {
  assert.equal(sanitizeHttpUrl('https://thinkcode-lab.web.app/version.json'), 'https://thinkcode-lab.web.app/version.json');
  assert.equal(sanitizeHttpUrl('/version.json', true), '/version.json');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)', true), '');
  assert.equal(sanitizeHttpUrl('data:text/html,<script>1</script>', true), '');
  assert.equal(sanitizeHttpUrl('http://evil.example.com/app.apk'), '');
  assert.equal(sanitizeHttpUrl('http://localhost:5173/version.json'), 'http://localhost:5173/version.json');
});

test('normalizeManifest validates fields, caps release notes, and strips unsafe URLs', () => {
  assert.equal(normalizeManifest(null), null);
  assert.equal(normalizeManifest({ versionName: '1.3.5', versionCode: 0 }), null);
  assert.equal(normalizeManifest({ versionName: 'bad', versionCode: 12 }), null);
  assert.equal(normalizeManifest({
    versionName: 'v1.3.5',
    versionCode: 12,
    apkUrl: 'javascript:alert(1)',
    fallbackUrl: '',
    downloadPageUrl: ''
  })?.downloadPageUrl, APP_META.downloadPageUrl);

  const clean = normalizeManifest({
    versionName: 'v1.3.5',
    versionCode: 12,
    releaseDate: '2026-11-12',
    apkFilename: 'ThinkCodeLab v1.3.5.apk',
    apkUrl: 'https://github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.5/ThinkCodeLab-v1.3.5.apk',
    sha256: 'A'.repeat(64),
    releaseNotes: ['  One  ', '', 'Two', 'Three']
  });
  assert.equal(clean.versionName, '1.3.5');
  assert.equal(clean.apkFilename, 'ThinkCodeLabv1.3.5.apk');
  assert.equal(clean.sha256, 'a'.repeat(64));
  assert.deepEqual(clean.releaseNotes, ['One', 'Two', 'Three']);
});

test('getInstalledAppVersion reads Android PackageManager bridge when present and falls back cleanly', () => {
  const nativeMock = getInstalledAppVersion({
    Capacitor: { isNativePlatform: () => true },
    ThinkCodeSystemUI: {
      getAppVersion: () => JSON.stringify({ versionName: 'v1.3.9', versionCode: 16, packageName: 'com.igc.thinkcodelab' })
    }
  });
  assert.equal(nativeMock.isNative, true);
  assert.equal(nativeMock.versionName, '1.3.9');
  assert.equal(nativeMock.versionCode, 16);
  assert.equal(nativeMock.source, 'android-package-manager');

  const brokenMock = getInstalledAppVersion({
    Capacitor: { isNativePlatform: () => true },
    ThinkCodeSystemUI: { getAppVersion: () => '{bad json' }
  });
  assert.equal(brokenMock.isNative, true);
  assert.equal(brokenMock.versionCode, APP_META.versionCode);
  assert.equal(brokenMock.source, 'bundled-meta');
});

test('Cooldown and 24h snooze policies prevent student spam while surfacing newer releases immediately', () => {
  const t0 = 1_700_000_000_000;
  assert.equal(shouldRunSilentCheck({ lastCheckMs: 0, nowMs: t0, isOnline: false }), false);
  assert.equal(shouldRunSilentCheck({ lastCheckMs: 0, nowMs: t0, isOnline: true }), true);
  assert.equal(shouldRunSilentCheck({ lastCheckMs: t0 - 60_000, nowMs: t0, isOnline: true }), false);
  assert.equal(shouldRunSilentCheck({ lastCheckMs: t0 - SILENT_CHECK_INTERVAL_MS, nowMs: t0, isOnline: true }), true);

  const installed = { versionCode: 11, versionName: '1.3.4' };
  const v12 = { versionCode: 12, versionName: '1.3.5' };
  const v13 = { versionCode: 13, versionName: '1.3.6' };

  assert.equal(shouldShowUpdateToast({ installed, remote: v12, dismissedVersionCode: 0, snoozedUntilMs: 0, nowMs: t0 }), true);
  assert.equal(shouldShowUpdateToast({ installed, remote: v12, dismissedVersionCode: 12, snoozedUntilMs: t0 + SNOOZE_DURATION_MS, nowMs: t0 }), false);
  // Version 13 should still alert immediately even while version 12 is snoozed!
  assert.equal(shouldShowUpdateToast({ installed, remote: v13, dismissedVersionCode: 12, snoozedUntilMs: t0 + SNOOZE_DURATION_MS, nowMs: t0 }), true);
  // Expired snooze re-enables toast
  assert.equal(shouldShowUpdateToast({ installed, remote: v12, dismissedVersionCode: 12, snoozedUntilMs: t0 - 1, nowMs: t0 }), true);
});

test('Demo simulation produces bumped build with safe live links', () => {
  const sim = createSimulatedManifest({ versionName: '1.3.4', versionCode: 11 });
  assert.equal(sim.isSimulated, true);
  assert.equal(sim.versionName, '1.3.5');
  assert.equal(sim.versionCode, 12);
  assert.ok(sim.apkUrl.startsWith('https://'));
  assert.equal(formatReleaseDate('2026-11-11'), '11 Nov 2026');
  assert.equal(formatShortChecksum('abcdef1234567890abcdef1234567890'), 'abcdef123456…34567890');
});

await testAsync('fetchLatestManifest fails over silently from broken URL to healthy fallback', async () => {
  let calls = 0;
  const mockFetch = async (url) => {
    calls++;
    if (url.includes('first')) {
      return { ok: false, status: 503 };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        versionName: '1.3.5',
        versionCode: 12,
        apkUrl: 'https://thinkcode-lab.web.app/ThinkCodeLab.apk',
        releaseNotes: ['Offline update ready']
      })
    };
  };

  const okRes = await fetchLatestManifest({
    urls: ['https://thinkcode-lab.web.app/first.json', 'https://thinkcode-lab.web.app/version.json'],
    fetchFn: mockFetch
  });
  assert.equal(okRes.ok, true);
  assert.equal(calls, 2);
  assert.equal(okRes.manifest.versionCode, 12);

  const errRes = await fetchLatestManifest({
    urls: ['https://thinkcode-lab.web.app/version.json'],
    fetchFn: async () => { throw new Error('Network down'); }
  });
  assert.equal(errRes.ok, false);
  assert.equal(errRes.manifest, null);
});

test('public/version.json and firebase.json match valid release & CORS/CORP schema', () => {
  const versionRaw = fs.readFileSync(path.join(rootDir, 'public/version.json'), 'utf8');
  const versionJson = JSON.parse(versionRaw);
  const normalized = normalizeManifest(versionJson);
  assert.ok(normalized, 'public/version.json must normalize cleanly');
  assert.equal(normalized.versionCode, APP_META.versionCode);
  assert.equal(normalized.versionName, APP_META.versionName);
  assert.match(normalized.sha256, /^[a-f0-9]{64}$/);
  assert.ok(normalized.releaseNotes.length >= 3);

  const firebaseJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
  const verHeaderRule = firebaseJson.hosting.headers.find(h => h.source === '/version.json');
  assert.ok(verHeaderRule, 'firebase.json must define /version.json headers');
  const headerMap = Object.fromEntries(verHeaderRule.headers.map(h => [h.key, h.value]));
  assert.equal(headerMap['Access-Control-Allow-Origin'], '*');
  assert.equal(headerMap['Cross-Origin-Resource-Policy'], 'cross-origin');
  assert.ok(headerMap['Cache-Control'].includes('no-store'));
});

test('HTML, download portal, and main.js DOM IDs match cleanly with zero dangling selectors', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const downloadHtml = fs.readFileSync(path.join(rootDir, 'public/download.html'), 'utf8');
  const mainJs = fs.readFileSync(path.join(rootDir, 'src/main.js'), 'utf8');

  const appIds = [
    'menuUpdateDot', 'drawerVerLabel', 'drawerDlCard', 'drawerDlTitle', 'drawerDlMeta',
    'drawerDlBadge', 'menuBtnCheckUpdate', 'menuUpdateSub', 'menuUpdateBadge',
    'updateDialog', 'udHeaderBadge', 'updateDialogTitle', 'btnUpdateClose',
    'udBannerCard', 'udBannerIcon', 'udBannerTitle', 'udBannerSub',
    'udInstalledVer', 'udInstalledMeta', 'udLatestBox', 'udLatestVer', 'udLatestMeta',
    'udApkFile', 'udApkSize', 'udReleaseDate', 'udSha256', 'updateNotesList',
    'updateCheckStatus', 'btnUpdateCheckNow', 'btnUpdateDownload', 'udDemoRow',
    'btnUpdateSimulate', 'updateToastRegion', 'updateAriaLive', 'updateToast',
    'updateToastTitle', 'updateToastSub', 'btnUpdateToastOpen', 'btnUpdateToastDismiss'
  ];

  for (const id of appIds) {
    assert.ok(indexHtml.includes(`id="${id}"`), `Missing id="${id}" in index.html`);
    if (id !== 'updateDialogTitle' && id !== 'updateToastRegion') {
      assert.ok(mainJs.includes(`'${id}'`), `Unreferenced id '${id}' in src/main.js`);
    }
  }

  for (const dlId of ['dlVersionBadge', 'dlSizeBadge', 'downloadBtn', 'downloadBtnText', 'dlFilename', 'dlBuildNum', 'dlMinAndroid', 'dlReleaseNotes', 'dlNotesSummary', 'dlNotesList']) {
    assert.ok(downloadHtml.includes(`id="${dlId}"`), `Missing id="${dlId}" in public/download.html`);
  }
});

console.log(`\nAll ${passed} Update Checker unit tests passed!\n`);
