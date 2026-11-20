/**
 * ⚡ ThinkCode Lab — 100% Offline Pure-JS QR Code Generator
 *
 * Implements ISO/IEC 18004 standards-compliant QR Code generation in pure JavaScript.
 * Zero external dependencies. Zero network calls. Works 100% offline.
 * Supports Byte Mode (UTF-8), Versions 1 to 40, Error Correction Levels L, M, Q, H.
 * Generates Scalable SVG strings, HTML5 Canvas 2D drawings, and PNG Data URLs.
 *
 * Authored for ThinkCode Lab by Tahir Mansuri.
 */

// --- Galois Field GF(2^8) Arithmetic ---
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val <<= 1;
    if (val & 256) {
      val ^= 285; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
    }
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function rsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateEcc(data, eccLength) {
  const gen = rsGeneratorPoly(eccLength);
  const res = new Uint8Array(eccLength);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < eccLength - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(gen[eccLength - 1 - j], factor);
    }
    res[eccLength - 1] = gfMul(gen[0], factor);
  }
  return res;
}

// --- QR Code Standard Tables (ISO/IEC 18004) ---
// Error Correction Levels: L = 1, M = 0, Q = 3, H = 2 (Format info bits)
export const ECC_LEVELS = {
  L: { id: 'L', formatBits: 1, capacityIdx: 0 },
  M: { id: 'M', formatBits: 0, capacityIdx: 1 },
  Q: { id: 'Q', formatBits: 3, capacityIdx: 2 },
  H: { id: 'H', formatBits: 2, capacityIdx: 3 }
};

// Alignment pattern base positions (ISO 18004 Table E.1)
const ALIGNMENT_PATTERN_TABLE = [
  [], // V0 (dummy)
  [], // V1
  [6, 18], // V2
  [6, 22], // V3
  [6, 26], // V4
  [6, 30], // V5
  [6, 34], // V6
  [6, 22, 38], // V7
  [6, 24, 42], // V8
  [6, 26, 46], // V9
  [6, 28, 50], // V10
  [6, 30, 54], // V11
  [6, 32, 58], // V12
  [6, 34, 62], // V13
  [6, 26, 46, 66], // V14
  [6, 26, 48, 70], // V15
  [6, 26, 50, 74], // V16
  [6, 30, 54, 78], // V17
  [6, 30, 56, 82], // V18
  [6, 30, 58, 86], // V19
  [6, 34, 62, 90], // V20
  [6, 28, 50, 72, 94], // V21
  [6, 26, 50, 74, 98], // V22
  [6, 30, 54, 78, 102], // V23
  [6, 28, 54, 80, 106], // V24
  [6, 32, 58, 84, 110], // V25
  [6, 30, 58, 86, 114], // V26
  [6, 34, 62, 90, 118], // V27
  [6, 26, 50, 74, 98, 122], // V28
  [6, 30, 54, 78, 102, 126], // V29
  [6, 26, 52, 78, 104, 130], // V30
  [6, 30, 56, 82, 108, 134], // V31
  [6, 34, 60, 86, 112, 138], // V32
  [6, 30, 58, 86, 114, 142], // V33
  [6, 34, 62, 90, 118, 146], // V34
  [6, 30, 54, 78, 102, 126, 150], // V35
  [6, 24, 50, 76, 102, 128, 154], // V36
  [6, 28, 54, 80, 106, 132, 158], // V37
  [6, 32, 58, 84, 110, 136, 162], // V38
  [6, 26, 54, 82, 110, 138, 166], // V39
  [6, 30, 58, 86, 114, 142, 170]  // V40
];

// Error correction codewords and block configuration [total_data_bytes, ecc_per_block, g1_blocks, g1_data, g2_blocks, g2_data]
// Index: [version][ecc: 0=L, 1=M, 2=Q, 3=H]
const VERSION_SPEC = [
  null,
  // V1 (21x21, Total 26)
  [[19, 7, 1, 19, 0, 0], [16, 10, 1, 16, 0, 0], [13, 13, 1, 13, 0, 0], [9, 17, 1, 9, 0, 0]],
  // V2 (25x25, Total 44)
  [[34, 10, 1, 34, 0, 0], [28, 16, 1, 28, 0, 0], [22, 22, 1, 22, 0, 0], [16, 28, 1, 16, 0, 0]],
  // V3 (29x29, Total 70)
  [[55, 15, 1, 55, 0, 0], [44, 26, 1, 44, 0, 0], [34, 18, 2, 17, 0, 0], [26, 22, 2, 13, 0, 0]],
  // V4 (33x33, Total 100)
  [[80, 20, 1, 80, 0, 0], [64, 18, 2, 32, 0, 0], [48, 26, 2, 24, 0, 0], [36, 16, 4, 9, 0, 0]],
  // V5 (37x37, Total 134)
  [[108, 26, 1, 108, 0, 0], [86, 24, 2, 43, 0, 0], [62, 18, 2, 15, 2, 16], [46, 22, 2, 11, 2, 12]],
  // V6 (41x41, Total 172)
  [[136, 18, 2, 68, 0, 0], [108, 16, 4, 27, 0, 0], [76, 24, 4, 19, 0, 0], [60, 28, 4, 15, 0, 0]],
  // V7 (45x45, Total 196)
  [[156, 20, 2, 78, 0, 0], [124, 18, 4, 31, 0, 0], [88, 18, 2, 14, 4, 15], [66, 26, 4, 13, 1, 14]],
  // V8 (49x49, Total 242)
  [[194, 24, 2, 97, 0, 0], [154, 22, 2, 38, 2, 39], [110, 22, 4, 18, 2, 19], [86, 26, 4, 14, 2, 15]],
  // V9 (53x53, Total 292)
  [[232, 30, 2, 116, 0, 0], [182, 22, 3, 36, 2, 37], [132, 20, 4, 16, 4, 17], [100, 24, 4, 12, 4, 13]],
  // V10 (57x57, Total 346)
  [[274, 18, 2, 68, 2, 69], [216, 26, 4, 43, 1, 44], [154, 18, 6, 19, 2, 20], [122, 28, 6, 15, 2, 16]],
  // V11 (61x61, Total 404)
  [[324, 20, 4, 81, 0, 0], [254, 30, 1, 50, 4, 51], [180, 24, 4, 22, 4, 23], [140, 24, 3, 12, 8, 13]],
  // V12 (65x65, Total 466)
  [[370, 24, 2, 92, 2, 93], [290, 22, 6, 36, 2, 37], [206, 20, 4, 20, 6, 21], [158, 28, 7, 14, 4, 15]],
  // V13 (69x69, Total 532)
  [[428, 26, 4, 107, 0, 0], [334, 22, 8, 37, 1, 38], [244, 24, 8, 20, 4, 21], [180, 22, 12, 11, 4, 12]],
  // V14 (73x73, Total 581)
  [[461, 30, 3, 115, 1, 116], [365, 24, 4, 40, 5, 41], [261, 20, 11, 16, 5, 17], [197, 24, 11, 12, 5, 13]],
  // V15 (77x77, Total 655)
  [[523, 22, 5, 87, 1, 88], [415, 24, 5, 41, 5, 42], [295, 30, 5, 24, 7, 25], [223, 24, 11, 12, 7, 13]],
  // V16 (81x81, Total 733)
  [[589, 24, 5, 98, 1, 99], [453, 28, 7, 45, 3, 46], [325, 24, 15, 19, 2, 20], [253, 30, 3, 15, 13, 16]],
  // V17 (85x85, Total 815)
  [[647, 28, 1, 107, 5, 108], [507, 28, 10, 46, 1, 47], [367, 28, 1, 22, 15, 23], [283, 28, 2, 14, 17, 15]],
  // V18 (89x89, Total 901)
  [[721, 30, 5, 120, 1, 121], [563, 26, 9, 43, 4, 44], [397, 28, 17, 22, 1, 23], [313, 28, 2, 14, 19, 15]],
  // V19 (93x93, Total 991)
  [[795, 28, 3, 113, 4, 114], [627, 26, 3, 44, 11, 45], [445, 26, 17, 21, 4, 22], [341, 26, 9, 13, 16, 14]],
  // V20 (97x97, Total 1085)
  [[861, 28, 3, 107, 5, 108], [669, 26, 3, 41, 13, 42], [485, 30, 15, 24, 5, 25], [385, 28, 15, 15, 10, 16]],
  // V21 (101x101, Total 1156)
  [[932, 28, 4, 116, 4, 117], [714, 26, 17, 42, 0, 0], [512, 28, 17, 22, 6, 23], [406, 30, 19, 16, 6, 17]],
  // V22 (105x105, Total 1258)
  [[1006, 28, 2, 111, 7, 112], [782, 28, 17, 46, 0, 0], [568, 30, 7, 24, 16, 25], [442, 24, 34, 13, 0, 0]],
  // V23 (109x109, Total 1364)
  [[1094, 30, 4, 121, 5, 122], [860, 28, 4, 47, 14, 48], [614, 30, 11, 24, 14, 25], [464, 30, 16, 15, 14, 16]],
  // V24 (113x113, Total 1474)
  [[1174, 30, 6, 117, 4, 118], [914, 28, 6, 45, 14, 46], [664, 30, 11, 24, 16, 25], [514, 30, 30, 16, 2, 17]],
  // V25 (117x117, Total 1588)
  [[1276, 26, 8, 106, 4, 107], [1000, 28, 8, 47, 13, 48], [718, 30, 7, 24, 22, 25], [538, 30, 22, 15, 13, 16]],
  // V26 (121x121, Total 1706)
  [[1370, 28, 10, 114, 2, 115], [1062, 28, 19, 46, 4, 47], [754, 28, 28, 22, 6, 23], [596, 30, 33, 16, 4, 17]],
  // V27 (125x125, Total 1828)
  [[1468, 30, 8, 122, 4, 123], [1128, 28, 22, 45, 3, 46], [808, 30, 8, 23, 26, 24], [628, 30, 12, 15, 28, 16]],
  // V28 (129x129, Total 1921)
  [[1531, 30, 3, 117, 10, 118], [1193, 28, 3, 45, 23, 46], [871, 30, 4, 24, 31, 25], [661, 30, 11, 15, 31, 16]],
  // V29 (133x133, Total 2051)
  [[1631, 30, 7, 116, 7, 117], [1267, 28, 21, 45, 7, 46], [911, 30, 1, 23, 37, 24], [701, 30, 19, 15, 26, 16]],
  // V30 (137x137, Total 2185)
  [[1735, 30, 5, 115, 10, 116], [1373, 28, 19, 47, 10, 48], [985, 30, 15, 24, 25, 25], [745, 30, 23, 15, 25, 16]],
  // V31 (141x141, Total 2323)
  [[1843, 30, 13, 115, 3, 116], [1455, 28, 2, 46, 29, 47], [1033, 30, 42, 24, 1, 25], [793, 30, 23, 15, 28, 16]],
  // V32 (145x145, Total 2465)
  [[1955, 30, 17, 115, 0, 0], [1541, 28, 10, 46, 23, 47], [1115, 30, 10, 24, 35, 25], [845, 30, 19, 15, 35, 16]],
  // V33 (149x149, Total 2611)
  [[2071, 30, 17, 115, 1, 116], [1631, 28, 14, 46, 21, 47], [1171, 30, 29, 24, 19, 25], [901, 30, 11, 15, 46, 16]],
  // V34 (153x153, Total 2761)
  [[2191, 30, 13, 115, 6, 116], [1725, 28, 14, 46, 23, 47], [1231, 30, 44, 24, 7, 25], [961, 30, 59, 16, 1, 17]],
  // V35 (157x157, Total 2876)
  [[2306, 30, 12, 121, 7, 122], [1812, 28, 12, 47, 26, 48], [1286, 30, 39, 24, 14, 25], [986, 30, 22, 15, 41, 16]],
  // V36 (161x161, Total 3034)
  [[2434, 30, 6, 121, 14, 122], [1914, 28, 6, 47, 34, 48], [1354, 30, 46, 24, 10, 25], [1054, 30, 2, 15, 64, 16]],
  // V37 (165x165, Total 3196)
  [[2566, 30, 17, 122, 4, 123], [1992, 28, 29, 46, 14, 47], [1426, 30, 49, 24, 10, 25], [1096, 30, 24, 15, 46, 16]],
  // V38 (169x169, Total 3362)
  [[2702, 30, 4, 122, 18, 123], [2102, 28, 13, 46, 32, 47], [1502, 30, 48, 24, 14, 25], [1142, 30, 42, 15, 32, 16]],
  // V39 (173x173, Total 3532)
  [[2812, 30, 20, 117, 4, 118], [2216, 28, 40, 47, 7, 48], [1582, 30, 43, 24, 22, 25], [1222, 30, 10, 15, 67, 16]],
  // V40 (177x177, Total 3706)
  [[2956, 30, 19, 118, 6, 119], [2334, 28, 18, 47, 31, 48], [1666, 30, 34, 24, 34, 25], [1276, 30, 20, 15, 61, 16]]
];

// BCH(15, 5) Format Information Poly: x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 (1335)
const FORMAT_POLY = 1335;
const FORMAT_MASK = 0x5412;

function getFormatInfo(eccLevelBits, maskPattern) {
  let val = (eccLevelBits << 3) | maskPattern;
  let b = val << 10;
  for (let i = 14; i >= 10; i--) {
    if ((b >> i) & 1) {
      b ^= FORMAT_POLY << (i - 10);
    }
  }
  return ((val << 10) | b) ^ FORMAT_MASK;
}

// BCH(18, 6) Version Information Poly: x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1 (7973)
const VERSION_POLY = 7973;

function getVersionInfo(version) {
  let b = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((b >> i) & 1) {
      b ^= VERSION_POLY << (i - 12);
    }
  }
  return (version << 12) | b;
}

/**
 * Encodes a string into UTF-8 bytes
 */
function toUtf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      bytes.push(c);
    } else if (c < 2048) {
      bytes.push(192 | (c >> 6), 128 | (c & 63));
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      bytes.push(240 | (cp >> 18), 128 | ((cp >> 12) & 63), 128 | ((cp >> 6) & 63), 128 | (cp & 63));
    } else {
      bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
  }
  return new Uint8Array(bytes);
}

/**
 * BitBuffer helper for assembling bitstreams
 */
class BitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }

  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  putBit(bit) {
    const idx = Math.floor(this.length / 8);
    if (this.buffer.length <= idx) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[idx] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }

  getBytes() {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Determines the smallest QR version that fits dataLength bytes
 */
export function findSmallestVersion(dataByteLength, ecc = ECC_LEVELS.M) {
  const eccIdx = ecc.capacityIdx;
  for (let v = 1; v <= 40; v++) {
    const spec = VERSION_SPEC[v][eccIdx];
    const totalDataCap = spec[0];
    const charCountBits = v < 10 ? 8 : 16;
    // 4 bits (mode) + charCountBits + dataByteLength * 8
    const requiredBits = 4 + charCountBits + (dataByteLength * 8);
    if (Math.ceil(requiredBits / 8) <= totalDataCap) {
      return v;
    }
  }
  throw new Error(`Data is too large to fit in a QR Code (length: ${dataByteLength} bytes)`);
}

/**
 * Generates the complete 2D module matrix for a QR code
 */
export function generateQrMatrix(text, options = {}) {
  const ecc = typeof options.ecc === 'string' ? ECC_LEVELS[options.ecc.toUpperCase()] || ECC_LEVELS.M : options.ecc || ECC_LEVELS.M;
  const utf8 = toUtf8Bytes(text);
  const version = options.version || findSmallestVersion(utf8.length, ecc);
  const size = 4 * version + 17;
  const spec = VERSION_SPEC[version][ecc.capacityIdx];

  const totalDataBytes = spec[0];
  const eccPerBlock = spec[1];
  const g1Blocks = spec[2];
  const g1Data = spec[3];
  const g2Blocks = spec[4];
  const g2Data = spec[5];
  const totalBlocks = g1Blocks + g2Blocks;

  // 1. Build Bitstream (Byte Mode: 0100)
  const bb = new BitBuffer();
  bb.put(4, 4); // Byte Mode
  const charCountBits = version < 10 ? 8 : 16;
  bb.put(utf8.length, charCountBits);
  for (let i = 0; i < utf8.length; i++) {
    bb.put(utf8[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const remainingBits = (totalDataBytes * 8) - bb.length;
  bb.put(0, Math.min(4, Math.max(0, remainingBits)));

  // Byte alignment padding
  if (bb.length % 8 !== 0) {
    bb.put(0, 8 - (bb.length % 8));
  }

  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.length < totalDataBytes * 8) {
    bb.put(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = bb.getBytes();

  // 2. Partition data into blocks & calculate Error Correction Codewords
  const dataBlocks = [];
  const eccBlocks = [];
  let byteOffset = 0;

  for (let b = 0; b < totalBlocks; b++) {
    const isG1 = b < g1Blocks;
    const blockSize = isG1 ? g1Data : g2Data;
    const block = dataBytes.subarray(byteOffset, byteOffset + blockSize);
    byteOffset += blockSize;
    dataBlocks.push(block);
    eccBlocks.push(rsCalculateEcc(block, eccPerBlock));
  }

  // 3. Interleave Data Codewords and ECC Codewords
  const finalCodewords = [];
  const maxDataBlockLen = Math.max(g1Data, g2Data);
  for (let i = 0; i < maxDataBlockLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) {
        finalCodewords.push(dataBlocks[b][i]);
      }
    }
  }

  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      finalCodewords.push(eccBlocks[b][i]);
    }
  }

  // 4. Initialize Matrix and Reservation Tables
  // modules: true = dark, false = light, null = unassigned
  const modules = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r, c, val, func = false) {
    modules[r][c] = val;
    if (func) isFunction[r][c] = true;
  }

  // 5. Place Function Patterns
  // 5.1 Finder patterns at (0,0), (0, size-7), (size-7, 0)
  function placeFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isDark = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          setModule(nr, nc, isDark, true);
        } else {
          // Separator
          setModule(nr, nc, false, true);
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 5.2 Timing patterns (row 6 and col 6)
  for (let i = 8; i < size - 8; i++) {
    if (modules[6][i] === null) setModule(6, i, i % 2 === 0, true);
    if (modules[i][6] === null) setModule(i, 6, i % 2 === 0, true);
  }

  // 5.3 Alignment patterns (Version 2+)
  const alignCoords = ALIGNMENT_PATTERN_TABLE[version] || [];
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      const r = alignCoords[i];
      const c = alignCoords[j];
      if (isFunction[r][c]) continue; // Skip overlapping finder patterns
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, isDark, true);
        }
      }
    }
  }

  // 5.4 Dark Module at (4 * V + 9, 8)
  setModule(4 * version + 9, 8, true, true);

  // 5.5 Reserve Format Info Area
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 5.6 Reserve Version Info Area (Version >= 7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        isFunction[size - 11 + j][i] = true; // Bottom-left
        isFunction[i][size - 11 + j] = true; // Top-right
      }
    }
  }

  // 6. Place Data Codewords (2-column zigzag traversal)
  const dataBits = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    const val = finalCodewords[i];
    for (let b = 7; b >= 0; b--) {
      dataBits.push(((val >>> b) & 1) === 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const left = right - 1;

    const rowStart = upwards ? size - 1 : 0;
    const rowEnd = upwards ? -1 : size;
    const rowStep = upwards ? -1 : 1;

    for (let r = rowStart; r !== rowEnd; r += rowStep) {
      for (const col of [right, left]) {
        if (!isFunction[r][col]) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : false;
          modules[r][col] = bit;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Mask Evaluation and Selection (8 standard masks)
  function isMasked(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
      case 6: return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
      case 7: return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
      default: return false;
    }
  }

  function evaluatePenalty(matrix) {
    let penalty = 0;
    // N1: 5 or more consecutive same-colored modules in row/col
    for (let r = 0; r < size; r++) {
      let runColor = null, runLen = 0;
      for (let c = 0; c < size; c++) {
        const color = matrix[r][c];
        if (color === runColor) {
          runLen++;
        } else {
          if (runLen >= 5) penalty += 3 + (runLen - 5);
          runColor = color;
          runLen = 1;
        }
      }
      if (runLen >= 5) penalty += 3 + (runLen - 5);
    }

    for (let c = 0; c < size; c++) {
      let runColor = null, runLen = 0;
      for (let r = 0; r < size; r++) {
        const color = matrix[r][c];
        if (color === runColor) {
          runLen++;
        } else {
          if (runLen >= 5) penalty += 3 + (runLen - 5);
          runColor = color;
          runLen = 1;
        }
      }
      if (runLen >= 5) penalty += 3 + (runLen - 5);
    }

    // N2: 2x2 blocks of same color
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const color = matrix[r][c];
        if (color === matrix[r + 1][c] && color === matrix[r][c + 1] && color === matrix[r + 1][c + 1]) {
          penalty += 3;
        }
      }
    }

    // N3: 1:1:3:1:1 pattern
    const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - 11; c++) {
        let match1 = true, match2 = true;
        for (let k = 0; k < 11; k++) {
          if (matrix[r][c + k] !== pattern1[k]) match1 = false;
          if (matrix[r][c + k] !== pattern2[k]) match2 = false;
        }
        if (match1 || match2) penalty += 40;
      }
    }

    // N4: Dark module ratio balance
    let totalDark = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) totalDark++;
      }
    }
    const ratio = (totalDark / (size * size)) * 100;
    const step = Math.floor(Math.abs(ratio - 50) / 5);
    penalty += step * 10;

    return penalty;
  }

  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestMatrix = null;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map(row => [...row]);
    // Apply mask to data modules
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunction[r][c]) {
          candidate[r][c] = modules[r][c] ^ isMasked(mask, r, c);
        }
      }
    }

    // Apply Format Info to candidate for penalty evaluation
    const formatInfo = getFormatInfo(ecc.formatBits, mask);
    // Format bits on Top-Left
    for (let i = 0; i < 6; i++) candidate[8][i] = ((formatInfo >>> i) & 1) === 1;
    candidate[8][7] = ((formatInfo >>> 6) & 1) === 1;
    candidate[8][8] = ((formatInfo >>> 7) & 1) === 1;
    candidate[7][8] = ((formatInfo >>> 8) & 1) === 1;
    for (let i = 9; i < 15; i++) candidate[14 - i][8] = ((formatInfo >>> i) & 1) === 1;

    // Format bits on Top-Right & Bottom-Left
    for (let i = 0; i < 8; i++) candidate[8][size - 1 - i] = ((formatInfo >>> i) & 1) === 1;
    for (let i = 8; i < 15; i++) candidate[size - 15 + i][8] = ((formatInfo >>> i) & 1) === 1;

    const penalty = evaluatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  // 8. Place Final Format and Version Information into bestMatrix
  const finalFormatInfo = getFormatInfo(ecc.formatBits, bestMask);
  for (let i = 0; i < 6; i++) bestMatrix[8][i] = ((finalFormatInfo >>> i) & 1) === 1;
  bestMatrix[8][7] = ((finalFormatInfo >>> 6) & 1) === 1;
  bestMatrix[8][8] = ((finalFormatInfo >>> 7) & 1) === 1;
  bestMatrix[7][8] = ((finalFormatInfo >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) bestMatrix[14 - i][8] = ((finalFormatInfo >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) bestMatrix[8][size - 1 - i] = ((finalFormatInfo >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) bestMatrix[size - 15 + i][8] = ((finalFormatInfo >>> i) & 1) === 1;

  if (version >= 7) {
    const versionInfo = getVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((versionInfo >>> i) & 1) === 1;
      const r = size - 11 + (i % 3);
      const c = Math.floor(i / 3);
      bestMatrix[r][c] = bit; // Bottom-left
      bestMatrix[c][r] = bit; // Top-right
    }
  }

  return {
    version,
    size,
    eccLevel: ecc.id,
    modules: bestMatrix
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
        `<rect width="100%" height="100%" fill="${lightColor}" rx="12"/>` +
        `<path d="${pathData.trim()}" fill="${darkColor}"/>` +
      `</svg>`;
    },

    /**
     * Draws QR Code onto an HTML5 Canvas 2D element
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
      const canvasDim = totalModules * pixelSize;
      canvas.width = canvasDim;
      canvas.height = canvasDim;

      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      // Draw light background
      ctx.fillStyle = lightColor;
      if (borderRadius > 0 && typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(0, 0, canvasDim, canvasDim, borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, canvasDim, canvasDim);
      }

      // Draw dark modules
      ctx.fillStyle = darkColor;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            ctx.fillRect(
              (c + margin) * pixelSize,
              (r + margin) * pixelSize,
              pixelSize,
              pixelSize
            );
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
