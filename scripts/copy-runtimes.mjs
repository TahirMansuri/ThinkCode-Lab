// Copies offline runtimes from node_modules into public/ so they ship inside the APK.
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const jobs = [
  ['node_modules/pyodide', 'public/pyodide',
    ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']],
  ['node_modules/sql.js/dist', 'public/sql', ['sql-wasm.js', 'sql-wasm.wasm']],
  ['node_modules/php-wasm', 'public/php', [
    ['php8.2-web.js', 'php.js'],
    ['5840bf8b8c2fdd088bf166046c29f540f1332bb5.wasm', 'php.wasm'],
    ['5840bf8b8c2fdd088bf166046c29f540f1332bb5.wasm', '5840bf8b8c2fdd088bf166046c29f540f1332bb5.wasm']
  ]]
];

for (const [src, dst, files] of jobs) {
  mkdirSync(dst, { recursive: true });
  for (const item of files) {
    const [srcFile, dstFile] = Array.isArray(item) ? item : [item, item];
    const srcPath = `${src}/${srcFile}`;
    const dstPath = `${dst}/${dstFile}`;
    if (!existsSync(srcPath)) throw new Error(`Missing runtime file: ${srcPath}`);
    cpSync(srcPath, dstPath);
  }
}

// Generate public/picoc/picoc.js for C engine
if (existsSync('node_modules/picoc-js/dist/bundle.umd.js')) {
  mkdirSync('public/picoc', { recursive: true });
  const umd = readFileSync('node_modules/picoc-js/dist/bundle.umd.js', 'utf8');
  const start = umd.indexOf('var PicocModule =');
  const end = umd.indexOf('module.exports = PicocModule;');
  const picocStandalone = `// PicoC WebAssembly runtime wrapped for ThinkCode Lab offline execution
(function(global) {
${umd.substring(start, end)}
  global.Picoc = PicocModule;
})(typeof self !== "undefined" ? self : globalThis);
`;
  writeFileSync('public/picoc/picoc.js', picocStandalone);
}

console.log('Offline runtimes ready in public/');
