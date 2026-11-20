/**
 * ⚡ ThinkCode Lab — Standards-Compliant ISO/IEC 18004 QR Code Generator
 *
 * Implements 100% offline, camera-scannable QR Code generation in pure JavaScript.
 * Powered by battle-tested QR matrix algorithms with strict ISO/IEC 18004 standard compliance.
 * Works 100% offline on both Web and Android with zero network calls.
 *
 * Supports Versions 1 to 40, Error Correction Levels L, M, Q, H.
 * Generates high-contrast Canvas 2D raster and SVG vector representations.
 *
 * Authored for ThinkCode Lab by Tahir Mansuri.
 */

import QRCode from 'qrcode';

// Error Correction Levels: L = 1, M = 0, Q = 3, H = 2 (Format info bits)
export const ECC_LEVELS = {
  L: { id: 'L', formatBits: 1, capacityIdx: 0 },
  M: { id: 'M', formatBits: 0, capacityIdx: 1 },
  Q: { id: 'Q', formatBits: 3, capacityIdx: 2 },
  H: { id: 'H', formatBits: 2, capacityIdx: 3 }
};

/**
 * Determines the smallest QR version that fits dataLength bytes
 */
export function findSmallestVersion(dataByteLength, ecc = ECC_LEVELS.M) {
  const dummyText = 'X'.repeat(Math.max(1, dataByteLength));
  const eccId = typeof ecc === 'string' ? ecc.toUpperCase() : (ecc.id || 'M');
  const qr = QRCode.create(dummyText, { errorCorrectionLevel: eccId });
  return qr.version;
}

/**
 * Generates the complete 2D module matrix for a QR code
 */
export function generateQrMatrix(text, options = {}) {
  const ecc = typeof options.ecc === 'string' ? options.ecc.toUpperCase() : (options.ecc?.id || 'M');
  const qrOpts = { errorCorrectionLevel: ecc };
  if (options.version) qrOpts.version = options.version;

  const qr = QRCode.create(text, qrOpts);
  const size = qr.modules.size;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      modules[r][c] = qr.modules.get(r, c) === 1;
    }
  }

  return {
    version: qr.version,
    size,
    eccLevel: ecc,
    modules,
    rawQr: qr
  };
}

/**
 * High-level QR Code Object with Export Methods (SVG, Canvas, Data URL)
 */
export function createQRCode(text, options = {}) {
  const qr = generateQrMatrix(text, options);
  const { size, modules, version, eccLevel } = qr;

  return {
    version,
    size,
    eccLevel,
    modules,

    /**
     * Renders QR Code as an SVG vector string
     */
    toSVGString({
      margin = 4,
      darkColor = '#000000',
      lightColor = '#ffffff',
      title = 'ThinkCode Lab QR Code'
    } = {}) {
      const totalSize = size + (margin * 2);
      let pathData = '';

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            pathData += `M${c + margin},${r + margin}h1v1h-1z `;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges" role="img" aria-label="${title}">` +
        `<rect width="100%" height="100%" fill="${lightColor}" rx="8"/>` +
        `<path d="${pathData.trim()}" fill="${darkColor}"/>` +
      `</svg>`;
    },

    /**
     * Draws QR Code onto an HTML5 Canvas 2D element with crisp pixel rendering
     */
    toCanvas(canvas, {
      pixelSize = 8,
      margin = 4,
      darkColor = '#000000',
      lightColor = '#ffffff',
      borderRadius = 0
    } = {}) {
      if (!canvas) throw new Error('Canvas element required');
      const totalModules = size + (margin * 2);
      // Canvas dimension at least 320px for razor-sharp camera scanning
      const canvasDim = Math.max(320, totalModules * pixelSize);
      canvas.width = canvasDim;
      canvas.height = canvasDim;

      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      // Draw solid light background
      ctx.fillStyle = lightColor;
      ctx.fillRect(0, 0, canvasDim, canvasDim);

      // Compute exact module pixel size
      const modPixel = canvasDim / totalModules;

      // Draw dark modules with pixel grid alignment
      ctx.fillStyle = darkColor;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            const x = Math.round((c + margin) * modPixel);
            const y = Math.round((r + margin) * modPixel);
            const w = Math.round((c + margin + 1) * modPixel) - x;
            const h = Math.round((r + margin + 1) * modPixel) - y;
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      return canvas;
    },

    /**
     * Generates a PNG data URL (requires DOM Canvas environment)
     */
    toDataURL(type = 'image/png', options = {}) {
      if (typeof document === 'undefined') return '';
      const canvas = document.createElement('canvas');
      this.toCanvas(canvas, options);
      return canvas.toDataURL(type);
    }
  };
}
