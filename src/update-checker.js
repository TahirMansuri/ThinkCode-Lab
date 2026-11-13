// Silent In-App APK Update Checker for Sideloaded Android & Web Users
// Zero tracking, zero telemetry: reads public /version.json cleanly over HTTPS.

export const APP_META = Object.freeze({
  appId: 'com.igc.thinkcodelab',
  appName: 'ThinkCode Lab',
  versionName: '1.3.6',
  versionCode: 13,
  releaseDate: '2026-11-13',
  apkFilename: 'ThinkCodeLab-v1.3.6.apk',
  apkSize: '~17.7 MB',
  sha256: '2ee17e6032c1a5b82bb45725ede444920ccc1260f96ed2a2f934895c1b4d7e3f',
  minAndroidVersion: '7.0',
  downloadPageUrl: 'https://thinkcode-lab.web.app/download',
  defaultApkUrl: 'https://github.com/TahirMansuri/ThinkCode-Lab/releases/download/v1.3.6/ThinkCodeLab-v1.3.6.apk',
  fallbackApkUrl: 'https://thinkcode-lab.web.app/ThinkCodeLab.apk',
  webManifestUrls: Object.freeze(['/version.json']),
  nativeManifestUrls: Object.freeze([
    'https://thinkcode-lab.web.app/version.json',
    'https://thinkcode-lab.firebaseapp.com/version.json'
  ]),
  defaultReleaseNotes: Object.freeze([
    'Exit confirmation dialog before leaving ThinkCode Lab on Android',
    'Hardware back button & swipe gesture closes open menus, dialogs, and sheets before exiting',
    'Python Data Science Suite: NumPy, Pandas, Matplotlib, Scikit-learn, and Seaborn on-demand',
    'Interactive CSV & Excel Virtual Filesystem data upload with pre-seeded datasets',
    'Inline Matplotlib plot visualizer with image copy & PNG download',
    'Animated plot loading dialog with real-time Pyodide compilation status',
    '1-Tap Student Lab Journal & Assignment PDF export with faculty signature block',
    'Silent in-app APK update checker for sideloaded students'
  ])
});

export const UPDATE_STORAGE_KEYS = Object.freeze({
  lastCheckAt: 'cf.update.last_check_at',
  lastManifest: 'cf.update.last_manifest',
  snoozedCode: 'cf.update.snoozed_code',
  snoozedUntil: 'cf.update.snoozed_until'
});

export const SILENT_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours between auto background checks
export const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours after tapping Dismiss

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function sanitizeHttpUrl(url, allowRelative = false) {
  if (typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';
  if (allowRelative && /^\/(?!\/)/.test(clean)) return clean;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

export function cleanVersionString(v) {
  return String(v || '').trim().replace(/^v/i, '');
}

export function parseSemver(versionStr) {
  const raw = cleanVersionString(versionStr);
  if (!raw) return null;
  const [corePart, prePart = ''] = raw.split('-', 2);
  const segs = corePart.split('.');
  if (segs.length === 0 || segs.length > 4) return null;
  const nums = segs.map(s => (/^\d+$/.test(s) ? Number(s) : NaN));
  if (nums.some(n => !Number.isSafeInteger(n) || n < 0)) return null;
  return {
    major: nums[0] || 0,
    minor: nums[1] || 0,
    patch: nums[2] || 0,
    extra: nums[3] || 0,
    prerelease: prePart.trim()
  };
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;

  const keys = ['major', 'minor', 'patch', 'extra'];
  for (const k of keys) {
    if (pa[k] !== pb[k]) return pa[k] > pb[k] ? 1 : -1;
  }

  // Stable releases sort higher than pre-releases (e.g. 1.3.5 > 1.3.5-beta.1)
  if (!pa.prerelease && pb.prerelease) return 1;
  if (pa.prerelease && !pb.prerelease) return -1;
  if (pa.prerelease && pb.prerelease && pa.prerelease !== pb.prerelease) {
    return pa.prerelease.localeCompare(pb.prerelease, undefined, { numeric: true, sensitivity: 'base' }) > 0 ? 1 : -1;
  }
  return 0;
}

export function isUpdateAvailable(installed, remote) {
  if (!remote || typeof remote !== 'object') return false;
  const instCode = Number(installed?.versionCode);
  const remCode = Number(remote.versionCode);

  if (Number.isFinite(instCode) && instCode > 0 && Number.isFinite(remCode) && remCode > 0) {
    return remCode > instCode;
  }
  return compareSemver(remote.versionName, installed?.versionName) > 0;
}

export function normalizeManifest(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const versionName = cleanVersionString(raw.versionName);
  const versionCode = Number(raw.versionCode);
  if (!versionName || !Number.isInteger(versionCode) || versionCode <= 0) {
    return null;
  }
  if (!parseSemver(versionName)) return null;

  const apkUrl = sanitizeHttpUrl(raw.apkUrl);
  const fallbackUrl = sanitizeHttpUrl(raw.fallbackUrl);
  const downloadPageUrl = sanitizeHttpUrl(raw.downloadPageUrl) || APP_META.downloadPageUrl;

  if (!apkUrl && !fallbackUrl && !downloadPageUrl) {
    return null;
  }

  const releaseNotes = Array.isArray(raw.releaseNotes)
    ? raw.releaseNotes
        .map(item => String(item ?? '').trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  const cleanFilename = String(raw.apkFilename || `ThinkCodeLab-v${versionName}.apk`)
    .replace(/[^a-zA-Z0-9._-]+/g, '')
    .slice(0, 80) || `ThinkCodeLab-v${versionName}.apk`;

  const sha256 = typeof raw.sha256 === 'string' && /^[a-f0-9]{32,64}$/i.test(raw.sha256.trim())
    ? raw.sha256.trim().toLowerCase()
    : '';

  return {
    appId: String(raw.appId || APP_META.appId),
    appName: String(raw.appName || APP_META.appName),
    versionName,
    versionCode,
    releaseDate: typeof raw.releaseDate === 'string' ? raw.releaseDate.trim().slice(0, 32) : '',
    apkFilename: cleanFilename,
    apkSize: typeof raw.apkSize === 'string' ? raw.apkSize.trim().slice(0, 24) : '',
    apkSizeBytes: Number.isFinite(Number(raw.apkSizeBytes)) ? Number(raw.apkSizeBytes) : 0,
    apkUrl: apkUrl || fallbackUrl || downloadPageUrl,
    fallbackUrl: fallbackUrl || downloadPageUrl,
    downloadPageUrl,
    sha256,
    minAndroidVersion: typeof raw.minAndroidVersion === 'string' ? raw.minAndroidVersion.trim().slice(0, 16) : '7.0',
    releaseNotes,
    isSimulated: Boolean(raw.isSimulated)
  };
}

export function formatReleaseDate(dateStr) {
  if (!dateStr) return 'Latest build';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr).trim());
  if (!m) return String(dateStr).trim();
  const monthIdx = Number(m[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${m[3]} ${MONTHS[monthIdx]} ${m[1]}`;
}

export function getInstalledAppVersion(win = typeof globalThis !== 'undefined' ? globalThis : {}) {
  const isNative = Boolean(win?.Capacitor?.isNativePlatform?.());
  try {
    const rawJson = win?.ThinkCodeSystemUI?.getAppVersion?.();
    if (typeof rawJson === 'string' && rawJson.trim()) {
      const parsed = JSON.parse(rawJson);
      const versionName = cleanVersionString(parsed.versionName);
      const versionCode = Number(parsed.versionCode);
      if (versionName && Number.isInteger(versionCode) && versionCode > 0) {
        return {
          appName: APP_META.appName,
          packageName: String(parsed.packageName || APP_META.packageName),
          versionName,
          versionCode,
          isNative,
          source: 'android-package-manager'
        };
      }
    }
  } catch {
    // Fall back safely to bundled version metadata
  }

  return {
    appName: APP_META.appName,
    packageName: APP_META.packageName,
    versionName: APP_META.versionName,
    versionCode: APP_META.versionCode,
    isNative,
    source: 'bundled-meta'
  };
}

export function shouldRunSilentCheck({
  lastCheckMs = 0,
  nowMs = Date.now(),
  minIntervalMs = SILENT_CHECK_INTERVAL_MS,
  isOnline = true
} = {}) {
  if (!isOnline) return false;
  const last = Number(lastCheckMs);
  if (!Number.isFinite(last) || last <= 0) return true;
  if (nowMs < last) return true; // Clock adjusted backwards
  return (nowMs - last) >= minIntervalMs;
}

export function shouldShowUpdateToast({
  installed,
  remote,
  dismissedVersionCode = 0,
  snoozedUntilMs = 0,
  nowMs = Date.now()
} = {}) {
  if (!remote) return false;
  if (remote.isSimulated) return true;
  if (!isUpdateAvailable(installed, remote)) return false;

  const snoozedCode = Number(dismissedVersionCode) || 0;
  const untilMs = Number(snoozedUntilMs) || 0;
  if (snoozedCode >= Number(remote.versionCode) && nowMs < untilMs) {
    return false;
  }
  return true;
}

export function createSimulatedManifest(installed, baseManifest = null) {
  const curVer = parseSemver(installed?.versionName || APP_META.versionName) || { major: 1, minor: 3, patch: 4 };
  const nextVersionName = `${curVer.major}.${curVer.minor}.${curVer.patch + 1}`;
  const curCode = Number(installed?.versionCode) || APP_META.versionCode;
  const nextVersionCode = curCode + 1;

  return {
    appId: APP_META.appId,
    appName: APP_META.appName,
    versionName: nextVersionName,
    versionCode: nextVersionCode,
    releaseDate: '2026-11-12',
    apkFilename: `ThinkCodeLab-v${nextVersionName}.apk`,
    apkSize: baseManifest?.apkSize || APP_META.apkSize,
    apkSizeBytes: baseManifest?.apkSizeBytes || 0,
    // Keep live verified download links during demo preview so tapping Download never hits a 404
    apkUrl: baseManifest?.apkUrl || APP_META.defaultApkUrl,
    fallbackUrl: baseManifest?.fallbackUrl || APP_META.fallbackApkUrl,
    downloadPageUrl: baseManifest?.downloadPageUrl || APP_META.downloadPageUrl,
    sha256: baseManifest?.sha256 || '',
    minAndroidVersion: baseManifest?.minAndroidVersion || APP_META.minAndroidVersion,
    releaseNotes: [
      'Sample Preview: In-App Silent APK Update Notifier active for sideloaded students',
      '1-Tap Student Lab Journal / Assignment A4 PDF export with instant preview',
      'Improved mobile keyboard toolbar responsiveness & runtime caching'
    ],
    isSimulated: true
  };
}

export function formatShortChecksum(sha256) {
  if (!sha256 || typeof sha256 !== 'string') return 'Verified HTTPS Release';
  const clean = sha256.trim().toLowerCase();
  if (clean.length < 16) return clean;
  return `${clean.slice(0, 12)}…${clean.slice(-8)}`;
}

export async function fetchLatestManifest({
  urls = APP_META.webManifestUrls,
  fetchFn = typeof fetch === 'function' ? fetch : null,
  timeoutMs = 5000
} = {}) {
  if (typeof fetchFn !== 'function') {
    return { ok: false, reason: 'no-fetch', manifest: null, sourceUrl: '' };
  }

  let lastReason = 'unreachable';
  for (const url of urls) {
    const cleanUrl = sanitizeHttpUrl(url, true);
    if (!cleanUrl) continue;

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const resp = await fetchFn(cleanUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        ...(controller ? { signal: controller.signal } : {})
      });
      if (!resp || !resp.ok) {
        lastReason = `http-${resp?.status || 0}`;
        continue;
      }
      const json = await resp.json();
      const manifest = normalizeManifest(json);
      if (!manifest) {
        lastReason = 'invalid-manifest';
        continue;
      }
      return { ok: true, reason: 'ok', manifest, sourceUrl: cleanUrl };
    } catch (err) {
      lastReason = err?.name === 'AbortError' ? 'timeout' : 'network-error';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return { ok: false, reason: lastReason, manifest: null, sourceUrl: '' };
}
