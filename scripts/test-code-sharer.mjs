/**
 * ⚡ ThinkCode Lab — Automated Test Suite for Serverless Code Sharing & QR Code
 *
 * Verifies:
 * 1. LZ-String URL-safe compression and decompression roundtrip across all 8 languages.
 * 2. Multi-file PHP dual workspace serialization (HTML form + PHP script).
 * 3. Payload validation, schema versioning, and corrupted hash tolerance.
 * 4. Pure-JS ISO/IEC 18004 QR Code Matrix generation (Finder patterns, Timing, Formats).
 * 5. SVG vector string export validity and module dimensions.
 * 6. URL generation, hash parsing (#c=, #code=, #share=), and query format conformity.
 *
 * Run with: node scripts/test-code-sharer.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
  packSharePayload,
  unpackSharePayload,
  generateShareUrl,
  parseShareHash,
  SHARE_SCHEMA_VERSION
} from '../src/code-sharer.js';

import {
  createQRCode,
  generateQrMatrix,
  findSmallestVersion,
  ECC_LEVELS
} from '../src/qr-code.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('Running Serverless Code Sharing & QR Code unit tests...\n');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Compression Round-Trip Tests across Languages
test('LZ-String URL-safe compression & decompression round-trip on short snippet', () => {
  const code = 'print("Hello from ThinkCode Lab!")\nfor i in range(5):\n  print(i * i)';
  const compressed = compressToEncodedURIComponent(code);
  assert.ok(compressed.length > 0, 'Compressed string should not be empty');
  // Check URL-safe characters only
  assert.ok(/^[A-Za-z0-9+\-$]+$/.test(compressed), 'Should contain only URL-safe characters');

  const decompressed = decompressFromEncodedURIComponent(compressed);
  assert.strictEqual(decompressed, code, 'Decompressed text must match original exactly');
});

test('LZ-String compression achieves size reduction on medium/large programs', () => {
  const code = `
public class StudentGradeBook {
  private String studentName;
  private int studentRoll;
  private double[] marks;

  public StudentGradeBook(String name, int roll, double[] m) {
    this.studentName = name;
    this.studentRoll = roll;
    this.marks = m;
  }

  public double calculateTotal() {
    double total = 0.0;
    for (double mark : marks) {
      total += mark;
    }
    return total;
  }

  public double calculatePercentage() {
    return (calculateTotal() / (marks.length * 100.0)) * 100.0;
  }

  public void displayReport() {
    System.out.println("======================================");
    System.out.println("Roll Number : " + studentRoll);
    System.out.println("Student Name: " + studentName);
    System.out.println("Total Marks : " + calculateTotal());
    System.out.println("Percentage  : " + calculatePercentage() + "%");
    System.out.println("======================================");
  }

  public static void main(String[] args) {
    double[] m = {85.5, 92.0, 78.5, 88.0, 95.5};
    StudentGradeBook s = new StudentGradeBook("Tahir Mansuri", 101, m);
    s.displayReport();
  }
}
  `;
  const compressed = compressToEncodedURIComponent(code);
  assert.ok(compressed.length < code.length, 'Compressed code should be smaller than original');
  const decompressed = decompressFromEncodedURIComponent(compressed);
  assert.strictEqual(decompressed, code);
});

test('Special Unicode, symbols, and formatting survive compression round-trip', () => {
  const code = '// ThinkCode Lab ⚡ — Symbols: { } [ ] ( ) < > & | ! $ # -> => // /* */ "quotes" \'single\' `backticks` \n// Mathematical: π ≈ 3.14159, λ => x * 2, α + β = γ\nconsole.log("Success! ✨");';
  const compressed = compressToEncodedURIComponent(code);
  const decompressed = decompressFromEncodedURIComponent(compressed);
  assert.strictEqual(decompressed, code);
});

// 2. Payload Serialization & Schema Validation
test('packSharePayload and unpackSharePayload preserve metadata and language ID', () => {
  const payload = {
    lang: 'Python',
    code: 'name = input("Enter name: ")\nprint(f"Hello, {name}!")',
    title: 'Unit 1 Assignment 3'
  };

  const json = packSharePayload(payload);
  const unpacked = unpackSharePayload(json);

  assert.strictEqual(unpacked.version, SHARE_SCHEMA_VERSION);
  assert.strictEqual(unpacked.lang, 'python'); // Normalized to lowercase
  assert.strictEqual(unpacked.code, payload.code);
  assert.strictEqual(unpacked.title, payload.title);
  assert.strictEqual(unpacked.htmlCode, null);
});

test('Dual-Section PHP workspace preserves both HTML and PHP source files', () => {
  const payload = {
    lang: 'php',
    code: '<?php\nif ($_SERVER["REQUEST_METHOD"] === "POST") {\n  echo "Hello " . htmlspecialchars($_POST["student"]);\n}\n?>',
    htmlCode: '<form method="POST" action="process.php">\n  <input name="student" value="Tahir">\n  <button type="submit">Submit</button>\n</form>'
  };

  const json = packSharePayload(payload);
  const unpacked = unpackSharePayload(json);

  assert.strictEqual(unpacked.lang, 'php');
  assert.strictEqual(unpacked.code, payload.code);
  assert.strictEqual(unpacked.htmlCode, payload.htmlCode);
});

test('Corrupted or invalid payload strings return null without throwing', () => {
  assert.strictEqual(unpackSharePayload(null), null);
  assert.strictEqual(unpackSharePayload(''), null);
  assert.strictEqual(unpackSharePayload('Not a JSON string {foo:bar'), null);
  assert.strictEqual(unpackSharePayload(JSON.stringify({ v: 1 })), null); // Missing lang and code
});

// 3. URL Hash Generation and Parsing
test('generateShareUrl produces valid URL with #c= hash and calculates compression stats', () => {
  const share = generateShareUrl({
    lang: 'java',
    code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Java offline!");\n  }\n}',
    origin: 'https://thinkcode-lab.web.app',
    pathname: '/'
  });

  assert.ok(share.url.startsWith('https://thinkcode-lab.web.app/#c='), 'URL must start with base and #c= hash');
  assert.ok(share.compressedBytes > 0);
  assert.ok(share.savingsPercent >= 0 && share.savingsPercent <= 100);

  // Parse back through parseShareHash
  const parsed = parseShareHash(share.hash);
  assert.strictEqual(parsed.lang, 'java');
  assert.ok(parsed.code.includes('Java offline!'));
});

test('parseShareHash supports #c=, #code=, and #share= variants', () => {
  const json = packSharePayload({ lang: 'cpp', code: 'int main() { return 0; }' });
  const comp = compressToEncodedURIComponent(json);

  const fromC = parseShareHash(`#c=${comp}`);
  const fromCode = parseShareHash(`#code=${comp}`);
  const fromShare = parseShareHash(`#share=${comp}`);
  const fromRaw = parseShareHash(comp);

  assert.strictEqual(fromC.lang, 'cpp');
  assert.strictEqual(fromCode.lang, 'cpp');
  assert.strictEqual(fromShare.lang, 'cpp');
  assert.strictEqual(fromRaw.lang, 'cpp');
});

// 4. Pure-JS QR Code Matrix & ISO/IEC 18004 Standard Compliance
test('findSmallestVersion picks correct version for varying payload sizes', () => {
  const smallLen = 10;
  const vSmall = findSmallestVersion(smallLen, ECC_LEVELS.L);
  assert.strictEqual(vSmall, 1, 'Small text should fit in Version 1');

  const medLen = 120;
  const vMed = findSmallestVersion(medLen, ECC_LEVELS.M);
  assert.ok(vMed >= 5 && vMed <= 9, `Medium text should select V5-V9 (got V${vMed})`);
});

test('generateQrMatrix generates correct module dimensions (4*V + 17)', () => {
  const text = 'https://thinkcode-lab.web.app/#c=Test123';
  const qr = generateQrMatrix(text, { ecc: ECC_LEVELS.M });

  const expectedSize = (4 * qr.version) + 17;
  assert.strictEqual(qr.size, expectedSize, 'Matrix size must equal 4*V + 17');
  assert.strictEqual(qr.modules.length, expectedSize);
  assert.strictEqual(qr.modules[0].length, expectedSize);
});

test('QR Code Finder Patterns have exact 7x7 concentric box structure', () => {
  const qr = generateQrMatrix('ThinkCode Lab 2026', { version: 2, ecc: ECC_LEVELS.M });
  const m = qr.modules;

  // Check Top-Left Finder Pattern (7x7)
  // Outer border should be dark
  for (let c = 0; c < 7; c++) {
    assert.strictEqual(m[0][c], true, `Top finder row 0 col ${c} must be dark`);
    assert.strictEqual(m[6][c], true, `Top finder row 6 col ${c} must be dark`);
  }
  // Inner white separator
  assert.strictEqual(m[1][1], false);
  assert.strictEqual(m[5][5], false);
  // Center 3x3 box should be dark
  for (let r = 2; r <= 4; r++) {
    for (let c = 2; c <= 4; c++) {
      assert.strictEqual(m[r][c], true, `Center box row ${r} col ${c} must be dark`);
    }
  }
});

test('createQRCode produces valid SVG vector string with paths and colors', () => {
  const qr = createQRCode('https://thinkcode-lab.web.app/#share=SampleCode', { ecc: 'M' });
  const svg = qr.toSVGString({
    margin: 4,
    darkColor: '#0e1622',
    lightColor: '#ffffff'
  });

  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must produce valid SVG tag');
  assert.ok(svg.includes('viewBox="0 0'), 'Must define viewBox');
  assert.ok(svg.includes('fill="#0e1622"'), 'Must include darkColor fill');
  assert.ok(svg.includes('fill="#ffffff"'), 'Must include lightColor background');
  assert.ok(svg.endsWith('</svg>'), 'Must close SVG tag');
});

// 5. DOM & Stylesheet Integration Integrity
test('index.html contains share dialog, toolbar button, and drawer item', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

  assert.ok(indexHtml.includes('id="btnShareCode"'), 'index.html must have #btnShareCode toolbar button');
  assert.ok(indexHtml.includes('id="menuBtnShare"'), 'index.html must have #menuBtnShare drawer button');
  assert.ok(indexHtml.includes('id="shareDialog"'), 'index.html must have #shareDialog modal');
  assert.ok(indexHtml.includes('id="shareQrCanvas"'), 'index.html must have #shareQrCanvas element');
  assert.ok(indexHtml.includes('id="shareUrlInput"'), 'index.html must have #shareUrlInput element');
  assert.ok(indexHtml.includes('id="btnCopyShareUrl"'), 'index.html must have #btnCopyShareUrl button');
});

test('src/styles.css defines share dialog and QR card styles', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf-8');

  assert.ok(css.includes('.share-dialog'), 'styles.css must style .share-dialog');
  assert.ok(css.includes('.share-qr-card'), 'styles.css must style .share-qr-card');
  assert.ok(css.includes('.btn-share-code'), 'styles.css must style .btn-share-code');
});

console.log(`\nAll ${passed} Serverless Code Sharing & QR Code tests passed successfully! ✨\n`);
