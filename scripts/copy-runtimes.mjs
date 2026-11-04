// Copies offline runtimes from node_modules into public/ so they ship inside the APK.
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import esbuild from 'esbuild';

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

// Generate public/jscpp/jscpp.js for C++ engine
if (existsSync('node_modules/JSCPP/lib/launcher.js')) {
  mkdirSync('public/jscpp', { recursive: true });
  const mockPlugin = {
    name: 'mock-plugin',
    setup(build) {
      build.onResolve({ filter: /^(babel-polyfill|util|stream)$/ }, args => ({
        path: args.path,
        namespace: 'mock-ns'
      }));
      build.onLoad({ filter: /.*/, namespace: 'mock-ns' }, args => {
        if (args.path === 'util') return { contents: 'module.exports = { inspect: (x) => String(x) };' };
        if (args.path === 'stream') return { contents: 'module.exports = { Stream: class {} };' };
        return { contents: 'module.exports = {};' };
      });
    }
  };

  const res = await esbuild.build({
    entryPoints: ['node_modules/JSCPP/lib/launcher.js'],
    bundle: true,
    format: 'iife',
    globalName: 'JSCPP_EXPORT',
    write: false,
    platform: 'browser',
    plugins: [mockPlugin],
    define: { 'process.env.NODE_ENV': '"production"' }
  });

  const jscppStandalone = `// JSCPP runtime wrapped for ThinkCode Lab offline C++ execution
(function(global) {
${res.outputFiles[0].text}
  global.JSCPP = JSCPP_EXPORT.default;
})(typeof self !== "undefined" ? self : globalThis);
`;
  writeFileSync('public/jscpp/jscpp.js', jscppStandalone);
}

console.log('Offline runtimes ready in public/');
