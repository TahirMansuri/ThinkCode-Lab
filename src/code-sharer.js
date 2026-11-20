/**
 * ⚡ ThinkCode Lab — Serverless Code Sharing via URL Hash & QR Code
 *
 * Enables 100% serverless, private peer-to-peer code sharing between mobile phones
 * and college lab computers without requiring accounts, logins, or cloud databases.
 *
 * Features:
 * - High-efficiency URL-safe LZ-String compression (40%–75% size reduction).
 * - 100% offline pure-JS QR code generation with high-contrast scanner card.
 * - One-tap clipboard copy with instant visual checkmark confirmation.
 * - Native mobile OS share sheet integration (WhatsApp, Classroom, AirDrop, etc.).
 * - High-resolution QR PNG download for student lab worksheets & journals.
 * - Automatic incoming share detection on boot & hashchange with safety restore.
 *
 * Authored for ThinkCode Lab by Tahir Mansuri.
 */

import { createQRCode } from './qr-code.js';

// --- Pure-JS URL-Safe LZ-String Compressor (Zero Dependencies) ---
const KEY_STR_URI_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';

/**
 * Compresses an arbitrary string into a URL-safe character stream
 */
export function compressToEncodedURIComponent(input) {
  if (input === null || input === undefined || input === '') return '';
  return _compress(input, 6, a => KEY_STR_URI_SAFE.charAt(a));
}

/**
 * Decompresses a URL-safe character stream back to original string
 */
export function decompressFromEncodedURIComponent(input) {
  if (input === null || input === undefined || input === '') return '';
  // Clean potential URL artifacts or whitespace
  input = input.replace(/ /g, '+');
  return _decompress(input.length, 32, index => {
    return _getBaseValue(KEY_STR_URI_SAFE, input.charAt(index));
  });
}

function _getBaseValue(alphabet, character) {
  const idx = alphabet.indexOf(character);
  return idx > -1 ? idx : -1;
}

function _compress(uncompressed, bitsPerChar, getCharFromInt) {
  let i, value;
  const context_dictionary = Object.create(null);
  const context_dictionaryToCreate = Object.create(null);
  let context_c = '';
  let context_wc = '';
  let context_w = '';
  let context_enlargeIn = 2;
  let context_dictSize = 3;
  let context_numBits = 2;
  let context_data_val = 0;
  let context_data_position = 0;
  let context_data_string = '';

  for (let ii = 0; ii < uncompressed.length; ii += 1) {
    context_c = uncompressed.charAt(ii);
    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++;
      context_dictionaryToCreate[context_c] = true;
    }

    context_wc = context_w + context_c;
    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc;
    } else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0;
              context_data_string += getCharFromInt(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0;
              context_data_string += getCharFromInt(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0;
              context_data_string += getCharFromInt(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0;
              context_data_string += getCharFromInt(context_data_val);
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn === 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data_string += getCharFromInt(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn === 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
      context_dictionary[context_wc] = context_dictSize++;
      context_w = String(context_c);
    }
  }

  if (context_w !== '') {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1);
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data_string += getCharFromInt(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
        }
        value = context_w.charCodeAt(0);
        for (i = 0; i < 8; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data_string += getCharFromInt(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      } else {
        value = 1;
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | value;
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data_string += getCharFromInt(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = 0;
        }
        value = context_w.charCodeAt(0);
        for (i = 0; i < 16; i++) {
          context_data_val = (context_data_val << 1) | (value & 1);
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0;
            context_data_string += getCharFromInt(context_data_val);
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn === 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
      delete context_dictionaryToCreate[context_w];
    } else {
      value = context_dictionary[context_w];
      for (i = 0; i < context_numBits; i++) {
        context_data_val = (context_data_val << 1) | (value & 1);
        if (context_data_position === bitsPerChar - 1) {
          context_data_position = 0;
          context_data_string += getCharFromInt(context_data_val);
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value = value >> 1;
      }
    }
    context_enlargeIn--;
    if (context_enlargeIn === 0) {
      context_enlargeIn = Math.pow(2, context_numBits);
      context_numBits++;
    }
  }

  // Mark the end of the stream
  value = 2;
  for (i = 0; i < context_numBits; i++) {
    context_data_val = (context_data_val << 1) | (value & 1);
    if (context_data_position === bitsPerChar - 1) {
      context_data_position = 0;
      context_data_string += getCharFromInt(context_data_val);
      context_data_val = 0;
    } else {
      context_data_position++;
    }
    value = value >> 1;
  }

  // Flush remaining bits
  while (true) {
    context_data_val = (context_data_val << 1);
    if (context_data_position === bitsPerChar - 1) {
      context_data_string += getCharFromInt(context_data_val);
      break;
    } else {
      context_data_position++;
    }
  }
  return context_data_string;
}

function _decompress(length, resetValue, getNextValue) {
  const dictionary = [];
  let next;
  let enlargeIn = 4;
  let dictSize = 4;
  let numBits = 3;
  let entry = '';
  let result = [];
  let i;
  let w;
  let bits, resb, maxpower, power;
  let c;
  const data = { val: getNextValue(0), position: resetValue, index: 1 };

  for (i = 0; i < 3; i += 1) {
    dictionary[i] = i;
  }

  bits = 0;
  maxpower = Math.pow(2, 2);
  power = 1;
  while (power !== maxpower) {
    resb = data.val & data.position;
    data.position >>= 1;
    if (data.position === 0) {
      data.position = resetValue;
      data.val = getNextValue(data.index++);
    }
    bits |= (resb > 0 ? 1 : 0) * power;
    power <<= 1;
  }

  switch (next = bits) {
    case 0:
      bits = 0;
      maxpower = Math.pow(2, 8);
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 1:
      bits = 0;
      maxpower = Math.pow(2, 16);
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }
      c = String.fromCharCode(bits);
      break;
    case 2:
      return '';
  }
  dictionary[3] = c;
  w = c;
  result.push(c);

  while (true) {
    if (data.index > length) {
      return '';
    }

    bits = 0;
    maxpower = Math.pow(2, numBits);
    power = 1;
    while (power !== maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position === 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (c = bits) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits);
        c = dictSize - 1;
        enlargeIn--;
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits);
        c = dictSize - 1;
        enlargeIn--;
        break;
      case 2:
        return result.join('');
    }

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits);
      numBits++;
    }

    if (dictionary[c]) {
      entry = dictionary[c];
    } else {
      if (c === dictSize) {
        entry = w + w.charAt(0);
      } else {
        return null;
      }
    }
    result.push(entry);

    dictionary[dictSize++] = w + entry.charAt(0);
    enlargeIn--;
    w = entry;

    if (enlargeIn === 0) {
      enlargeIn = Math.pow(2, numBits);
      numBits++;
    }
  }
}

// --- Payload Serialization & Schema Validation ---
export const SHARE_SCHEMA_VERSION = 1;

/**
 * Serializes code state into a compact JSON string
 */
export function packSharePayload({ lang, code, htmlCode, title }) {
  if (!lang || typeof code !== 'string') {
    throw new Error('Valid language ID and code string required to pack share payload');
  }

  const payload = {
    v: SHARE_SCHEMA_VERSION,
    l: String(lang).toLowerCase(),
    c: code
  };

  if (htmlCode && typeof htmlCode === 'string') {
    payload.h = htmlCode;
  }
  if (title && typeof title === 'string') {
    payload.t = title.trim();
  }

  return JSON.stringify(payload);
}

/**
 * Deserializes and validates a share payload
 */
export function unpackSharePayload(decompressedStr) {
  if (!decompressedStr || typeof decompressedStr !== 'string') return null;

  try {
    const data = JSON.parse(decompressedStr);
    if (!data || typeof data !== 'object') return null;
    if (!data.l || typeof data.c !== 'string') return null;

    return {
      version: Number(data.v) || 1,
      lang: String(data.l).toLowerCase(),
      code: data.c,
      htmlCode: typeof data.h === 'string' ? data.h : null,
      title: typeof data.t === 'string' ? data.t : null
    };
  } catch (_) {
    return null;
  }
}

/**
 * Creates the complete shareable URL
 */
export function generateShareUrl({ lang, code, htmlCode, title, origin, pathname }) {
  const json = packSharePayload({ lang, code, htmlCode, title });
  const compressed = compressToEncodedURIComponent(json);

  const base = origin && pathname ? `${origin}${pathname}` : 'https://thinkcode-lab.web.app/';
  const fullUrl = `${base.replace(/\/+$/, '')}/#c=${compressed}`;

  const rawBytes = new Blob ? new Blob([json]).size : json.length;
  const compBytes = compressed.length;
  const savings = rawBytes > compBytes ? Math.round(((rawBytes - compBytes) / rawBytes) * 100) : 0;

  return {
    url: fullUrl,
    hash: `#c=${compressed}`,
    compressed,
    originalBytes: rawBytes,
    compressedBytes: compBytes,
    savingsPercent: savings
  };
}

/**
 * Parses incoming URL hash (supports #c=..., #code=..., #share=...)
 */
export function parseShareHash(hashString) {
  if (!hashString || typeof hashString !== 'string') return null;
  let hash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
  if (!hash) return null;

  let compressed = '';
  if (hash.startsWith('c=')) {
    compressed = hash.slice(2);
  } else if (hash.startsWith('code=')) {
    compressed = hash.slice(5);
  } else if (hash.startsWith('share=')) {
    compressed = hash.slice(6);
  } else {
    // Treat raw hash without key as payload
    compressed = hash;
  }

  if (!compressed) return null;

  try {
    // 1. Try LZ-string decompression
    const jsonStr = decompressFromEncodedURIComponent(compressed);
    if (jsonStr) {
      const unpacked = unpackSharePayload(jsonStr);
      if (unpacked) return unpacked;
    }

    // 2. Fallback: URI component decoding
    const decodedUri = decodeURIComponent(compressed);
    const unpackedUri = unpackSharePayload(decodedUri);
    if (unpackedUri) return unpackedUri;

    // 3. Fallback: Standard Base64 decoding
    if (typeof atob === 'function') {
      const b64Decoded = atob(compressed.replace(/-/g, '+').replace(/_/g, '/'));
      const unpackedB64 = unpackSharePayload(b64Decoded);
      if (unpackedB64) return unpackedB64;
    }
  } catch (_) {}

  return null;
}

// --- Share Controller & Modal Wiring ---
let activeShareQr = null;

export function initCodeSharer({
  getActiveLanguage,
  getActiveCode,
  getActiveHtmlCode,
  applySharedCode,
  toast = console.log,
  store = { get: () => null, set: () => {} }
}) {
  const dialog = document.getElementById('shareDialog');
  const btnShareToolbar = document.getElementById('btnShareCode');
  const menuBtnShare = document.getElementById('menuBtnShare');
  const btnClose = document.getElementById('btnShareClose');
  const btnCopy = document.getElementById('btnCopyShareUrl');
  const btnNativeShare = document.getElementById('btnNativeShare');
  const btnDownloadQr = document.getElementById('btnDownloadQr');
  const qrCanvas = document.getElementById('shareQrCanvas');
  const qrSvgWrap = document.getElementById('shareQrSvg');
  const urlInput = document.getElementById('shareUrlInput');
  const metaPill = document.getElementById('shareMetaPill');
  const previewSnippet = document.getElementById('sharePreviewSnippet');
  const copyToastNotice = document.getElementById('shareCopyFeedback');

  function openShareDialog() {
    if (!dialog) return;

    const lang = getActiveLanguage ? getActiveLanguage() : 'python';
    const code = getActiveCode ? getActiveCode() : '';
    const htmlCode = getActiveHtmlCode ? getActiveHtmlCode() : '';

    if (!code || code.trim() === '') {
      toast('Editor is empty. Write or load some code before sharing! ✏️');
      return;
    }

    // Generate Share URL & compression metrics
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thinkcode-lab.web.app';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

    const shareData = generateShareUrl({
      lang: typeof lang === 'object' ? lang.id : lang,
      code,
      htmlCode,
      origin,
      pathname
    });

    // Populate URL input
    if (urlInput) {
      urlInput.value = shareData.url;
    }

    // Populate meta stats
    if (metaPill) {
      const langName = typeof lang === 'object' ? (lang.name || lang.id) : lang;
      metaPill.textContent = `${langName} • ${shareData.savingsPercent}% smaller (${shareData.compressedBytes} B)`;
    }

    // Populate code preview
    if (previewSnippet) {
      const lines = code.trim().split('\n');
      const snippet = lines.slice(0, 4).join('\n') + (lines.length > 4 ? `\n... (+${lines.length - 4} more lines)` : '');
      previewSnippet.textContent = snippet;
    }

    // Generate Pure-JS Offline QR Code
    try {
      activeShareQr = createQRCode(shareData.url, { ecc: 'M' });

      // Render high-DPI Canvas for scanner & download
      if (qrCanvas) {
        activeShareQr.toCanvas(qrCanvas, {
          pixelSize: 8,
          margin: 4,
          lightColor: '#ffffff',
          darkColor: '#000000'
        });
      }

      // Render crisp SVG backup
      if (qrSvgWrap) {
        qrSvgWrap.innerHTML = activeShareQr.toSVGString({
          margin: 4,
          lightColor: '#ffffff',
          darkColor: '#000000'
        });
      }
    } catch (err) {
      console.warn('QR Code generation fallback:', err);
    }

    // Reset copy button state
    resetCopyFeedback();

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeShareDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  function resetCopyFeedback() {
    if (btnCopy) {
      btnCopy.classList.remove('is-copied');
      btnCopy.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy Link</span>`;
    }
    if (copyToastNotice) {
      copyToastNotice.hidden = true;
    }
  }

  async function handleCopyUrl() {
    if (!urlInput || !urlInput.value) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlInput.value);
      } else {
        urlInput.select();
        document.execCommand('copy');
      }

      if (btnCopy) {
        btnCopy.classList.add('is-copied');
        btnCopy.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied! ✓</span>`;
      }
      if (copyToastNotice) {
        copyToastNotice.hidden = false;
        copyToastNotice.textContent = 'Share link copied to clipboard! Paste it anywhere.';
      }
      toast('Share link copied to clipboard! 📋');

      setTimeout(resetCopyFeedback, 3000);
    } catch (_) {
      urlInput.select();
      toast('Press Ctrl+C / ⌘+C to copy the link');
    }
  }

  async function handleNativeShare() {
    if (!urlInput || !urlInput.value) return;
    const url = urlInput.value;
    const lang = getActiveLanguage ? getActiveLanguage() : 'code';
    const langName = typeof lang === 'object' ? lang.name : lang;

    // 1. Try Capacitor Native Share on Android/iOS
    try {
      if (window.Capacitor?.isNativePlatform?.()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: `ThinkCode Lab — ${langName} Code`,
          text: `Here is my ${langName} code on ThinkCode Lab (100% offline mobile IDE):`,
          url: url,
          dialogTitle: 'Share Code via...'
        });
        return;
      }
    } catch (_) {}

    // 2. Try Web Share API (Mobile Chrome / Safari / Edge)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `ThinkCode Lab — ${langName} Code`,
          text: `Check out this ${langName} code on ThinkCode Lab:`,
          url: url
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
      }
    }

    // 3. Fallback: Copy to clipboard
    handleCopyUrl();
  }

  function handleDownloadQr() {
    if (!qrCanvas) return;
    try {
      const lang = getActiveLanguage ? getActiveLanguage() : 'code';
      const langId = typeof lang === 'object' ? lang.id : lang;
      const dataUrl = qrCanvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ThinkCodeLab-${langId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast('QR Code downloaded as PNG! 💾');
    } catch (err) {
      console.warn('QR download error:', err);
      toast('Unable to export QR code image');
    }
  }

  // --- Wire Event Listeners ---
  btnShareToolbar?.addEventListener('click', openShareDialog);
  menuBtnShare?.addEventListener('click', () => {
    // Close menu drawer if open
    const closeBtn = document.getElementById('btnCloseDrawer');
    if (closeBtn) closeBtn.click();
    setTimeout(openShareDialog, 150);
  });
  btnClose?.addEventListener('click', closeShareDialog);
  btnCopy?.addEventListener('click', handleCopyUrl);
  btnNativeShare?.addEventListener('click', handleNativeShare);
  btnDownloadQr?.addEventListener('click', handleDownloadQr);

  urlInput?.addEventListener('focus', () => {
    urlInput.select();
  });

  dialog?.addEventListener('click', e => {
    if (e.target === dialog) {
      closeShareDialog();
    }
  });

  // Global Keyboard Shortcut: Alt+S or Option+S
  window.addEventListener('keydown', e => {
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      if (dialog && dialog.open) {
        closeShareDialog();
      } else {
        openShareDialog();
      }
    }
  });

  // --- Process Incoming Shared Link on Boot / HashChange ---
  function checkIncomingShare() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || hash.length < 5) return;

    const parsed = parseShareHash(hash);
    if (!parsed) return;

    // Check if applySharedCode handler is registered
    if (typeof applySharedCode === 'function') {
      // Backup previous code in localStorage safety slot before overriding
      try {
        const curCode = getActiveCode ? getActiveCode() : '';
        const curLang = getActiveLanguage ? getActiveLanguage() : '';
        if (curCode && curCode.trim().length > 0) {
          store.set('cf.share.backup', JSON.stringify({
            lang: typeof curLang === 'object' ? curLang.id : curLang,
            code: curCode,
            time: Date.now()
          }));
        }
      } catch (_) {}

      const success = applySharedCode(parsed);
      if (success) {
        const langTitle = parsed.lang.toUpperCase();
        toast(`Shared ${langTitle} program loaded successfully! 🚀`);

        // Clean up URL hash to prevent re-triggering on reload
        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } catch (_) {}
      }
    }
  }

  // Check immediately on startup and listen for hash changes
  setTimeout(checkIncomingShare, 100);
  window.addEventListener('hashchange', checkIncomingShare);

  return {
    open: openShareDialog,
    close: closeShareDialog,
    pack: packSharePayload,
    unpack: unpackSharePayload,
    generateUrl: generateShareUrl,
    parseHash: parseShareHash
  };
}
