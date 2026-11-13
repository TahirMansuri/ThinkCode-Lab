// Copies offline runtimes from node_modules into public/ so they ship inside the APK.
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, promises as fsPromises } from 'node:fs';
import { resolve } from 'node:path';
import esbuild from 'esbuild';

function mustReplace(src, find, rep, label) {
  if (!src.includes(find)) {
    throw new Error(`Runtime patch mismatch in ${label}: could not find expected snippet:\n${find.slice(0, 140)}`);
  }
  return src.replace(find, rep);
}

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

// Patch public/pyodide/pyodide.asm.js for on-demand CDN fallback & CacheStorage in browser/worker
const pyodideAsmPath = 'public/pyodide/pyodide.asm.js';
if (existsSync(pyodideAsmPath)) {
  let asm = readFileSync(pyodideAsmPath, 'utf8');
  const targetSnippet = "try{return await me(o,a)}catch(l){if(!g||r.channel!==ge)throw l}console.log(`Didn't find package ${n} locally, attempting to load from ${Ge}`);let s=await me(Ge+n);return console.log(`Package ${n} loaded from ${Ge}, caching the wheel in node_modules for future use.`),await K.writeFile(o,s),s";
  const replacementSnippet = "try{return await me(o,a)}catch(l){if(r.channel!==ge)throw l}console.log(`Didn't find package ${n} locally, attempting to load from ${Ge}`);let s;if(typeof caches!=='undefined'){try{const _c=await caches.open('thinkcode-pyodide-packages');const _m=await _c.match(Ge+n);if(_m){s=new Uint8Array(await _m.arrayBuffer())}else{s=await me(Ge+n);try{await _c.put(Ge+n,new Response(s))}catch(_){}}}catch(_){s=await me(Ge+n)}}else{s=await me(Ge+n)}if(g&&typeof K!=='undefined'&&K.writeFile){try{await K.writeFile(o,s)}catch(_){}}return s";
  if (asm.includes(targetSnippet)) {
    asm = asm.replace(targetSnippet, replacementSnippet);
    writeFileSync(pyodideAsmPath, asm);
  }
}

// Generate public/picoc/picoc.js for C engine (exposing Module.FS for reliable line-buffered/interactive stream I/O)
if (existsSync('node_modules/picoc-js/dist/bundle.umd.js')) {
  mkdirSync('public/picoc', { recursive: true });
  const umd = readFileSync('node_modules/picoc-js/dist/bundle.umd.js', 'utf8');
  const start = umd.indexOf('var PicocModule =');
  const end = umd.indexOf('module.exports = PicocModule;');
  let picocCore = umd.substring(start, end);
  picocCore = mustReplace(
    picocCore,
    "Module['runc'] = runc;",
    "Module['runc'] = runc;\n\tModule['FS'] = FS;",
    'picoc bundle.umd.js'
  );
  const picocStandalone = `// PicoC WebAssembly runtime wrapped for ThinkCode Lab offline execution
(function(global) {
${picocCore}
  global.Picoc = PicocModule;
})(typeof self !== "undefined" ? self : globalThis);
`;
  writeFileSync('public/picoc/picoc.js', picocStandalone);
}

// Generate public/jscpp/jscpp.js for unified C++ engine (string, iomanip, pointers, classes, unions, interactive stdin)
if (existsSync('node_modules/JSCPP/lib/launcher.js')) {
  mkdirSync('public/jscpp', { recursive: true });
  const jscppStringPath = resolve('scripts/jscpp-string.js');

  const jscppPatchPlugin = {
    name: 'jscpp-thinkcode-plugin',
    setup(build) {
      build.onResolve({ filter: /^(babel-polyfill|util|stream)$/ }, args => ({
        path: args.path,
        namespace: 'mock-ns'
      }));
      build.onResolve({ filter: /^\.\/includes\/string$/ }, () => ({
        path: jscppStringPath
      }));
      build.onLoad({ filter: /.*/, namespace: 'mock-ns' }, args => {
        if (args.path === 'util') return { contents: 'module.exports = { inspect: (x) => String(x) };' };
        if (args.path === 'stream') return { contents: 'module.exports = { Stream: class {} };' };
        return { contents: 'module.exports = {};' };
      });

      // 1. launcher.js: register std::string include + rt.registerTypes hook
      build.onLoad({ filter: /JSCPP\/lib\/launcher\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        content = mustReplace(
          content,
          'iomanip: require("./includes/iomanip"),',
          'iomanip: require("./includes/iomanip"),\n    string: require("./includes/string"),',
          'launcher.js (includes.string)'
        );
        content = mustReplace(
          content,
          'const rt = new rt_1.CRuntime(_config);',
          'const rt = new rt_1.CRuntime(_config);\n    if (typeof _config.registerTypes === "function") { _config.registerTypes(rt); }',
          'launcher.js (registerTypes)'
        );
        return { contents: content, loader: 'js' };
      });

      // 2. interpreter.js: allow non-generator o(->) handlers in PostfixExpression_MemberPointerAccess
      build.onLoad({ filter: /JSCPP\/lib\/interpreter\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        content = mustReplace(
          content,
          'ret = yield* rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [])(rt, ret);',
          'const _ptrRet = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [])(rt, ret);\n                    ret = isGenerator(_ptrRet) ? yield* _ptrRet : _ptrRet;',
          'interpreter.js (member pointer ->)'
        );
        content = mustReplace(
          content,
          'ret = yield* rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [member.t])(rt, ret);',
          'const _ptrRet2 = rt.getFunc(ret.t, rt.makeOperatorFuncName("->"), [member.t])(rt, ret);\n                    ret = isGenerator(_ptrRet2) ? yield* _ptrRet2 : _ptrRet2;',
          'interpreter.js (member pointer -> overloaded)'
        );
        return { contents: content, loader: 'js' };
      });

      // 3. rt.js: getCompatibleFunc arity check, sizeof(class/struct/union), class cCast/cCastable/cClone, NULL/0 pointer conversions, array offset string read
      build.onLoad({ filter: /JSCPP\/lib\/rt\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        content = mustReplace(
          content,
          `                        const { optionalArgs } = regArgInfo;\n                        if ((dts[dts.length - 1] === "?") && ((dts.length - 1) <= ts.length)) {\n                            newTs = ts.slice(0, dts.length - 1);\n                            newDts = dts.slice(0, -1);\n                        }\n                        else {\n                            newTs = ts;\n                            newDts = dts;\n                        }\n                        if (newDts.length <= newTs.length) {`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `                        const optionalArgs = regArgInfo.optionalArgs || [];\n                        const isVariadic = dts[dts.length - 1] === "?";\n                        if (isVariadic && ((dts.length - 1) <= ts.length)) {\n                            newTs = ts.slice(0, dts.length - 1);\n                            newDts = dts.slice(0, -1);\n                        }\n                        else {\n                            newTs = ts;\n                            newDts = dts;\n                        }\n                        if (newDts.length <= newTs.length && (isVariadic || newTs.length <= newDts.length + optionalArgs.length)) {`,
          'rt.js (getCompatibleFunc arity)'
        );
        content = mustReplace(
          content,
          `        else if (this.isPrimitiveType(t)) {\r\n            return this.config.limits[t.name].bytes;\r\n        }\r\n        else {\r\n            this.raiseException("not implemented");\r\n        }`.replace(/\r\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `        else if (this.isPrimitiveType(t)) {\n            return this.config.limits[t.name].bytes;\n        }\n        else if (this.isClassType(t)) {\n            const def = this.types[this.getTypeSignature(t)];\n            if (def && typeof def.sizeBytes === "number") return def.sizeBytes;\n            if (def && Array.isArray(def.members)) {\n                let total = 0;\n                for (const m of def.members) {\n                    try {\n                        const dv = m.initialize ? m.initialize(this, { t, v: { members: {} }, left: false }) : this.defaultValue(m.type, true);\n                        total += this.getSize(dv);\n                    } catch (_) {\n                        total += this.getSizeByType(m.type);\n                    }\n                }\n                return Math.max(1, total);\n            }\n            return 1;\n        }\n        else {\n            this.raiseException("not implemented");\n        }`,
          'rt.js (getSizeByType)'
        );
        content = mustReplace(
          content,
          `        else if (this.isClassType(type1) || this.isClassType(type2)) {\n            this.raiseException("not implemented");\n        }`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `        else if (this.isClassType(type2)) {\n            const def = this.types[this.getTypeSignature(type2)];\n            if (def && typeof def.cCastable === "function") return def.cCastable(this, type1);\n            return false;\n        }\n        else if (this.isClassType(type1)) {\n            const def = this.types[this.getTypeSignature(type1)];\n            return Boolean(def && def.handlers && def.handlers[this.makeOperatorFuncName(this.makeTypeString(type2))]);\n        }`,
          'rt.js (castable)'
        );
        content = mustReplace(
          content,
          `                    if (this.isNormalPointerType(value)) {\n                        if (this.isTypeEqualTo(type.targetType, value.t.targetType)) {\n                            return value;\n                        }\n                        else {\n                            this.raiseException(this.makeTypeString(type.targetType) + " is not equal to " + this.makeTypeString(value.t.targetType));\n                        }\n                    }\n                    else {\n                        this.raiseException(this.makeTypeString(value.t) + " is not a normal porinter");\n                    }`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `                    if (this.isNormalPointerType(value)) {\n                        if (this.isTypeEqualTo(type.targetType, value.t.targetType)) {\n                            return value;\n                        }\n                        else if (this.isVoidType(value.t.targetType) && value.v && value.v.target === null) {\n                            return this.val(type, this.makeNormalPointerValue(null));\n                        }\n                        else if (this.isVoidType(type.targetType)) {\n                            return value;\n                        }\n                        else {\n                            this.raiseException(this.makeTypeString(type.targetType) + " is not equal to " + this.makeTypeString(value.t.targetType));\n                        }\n                    }\n                    else if (this.isIntegerType(value) && value.v === 0) {\n                        return this.val(type, this.makeNormalPointerValue(null));\n                    }\n                    else {\n                        this.raiseException(this.makeTypeString(value.t) + " is not a normal porinter");\n                    }`,
          'rt.js (cast pointer NULL/0)'
        );
        content = mustReplace(
          content,
          `        else if (this.isClassType(type)) {\n            this.raiseException("not implemented");\n        }`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `        else if (this.isClassType(type)) {\n            const def = this.types[this.getTypeSignature(type)];\n            if (def && typeof def.cCast === "function") {\n                return def.cCast(this, value);\n            }\n            this.raiseException("cannot cast " + this.makeTypeString(value.t) + " to " + this.makeTypeString(type));\n        }`,
          'rt.js (cast class)'
        );
        content = mustReplace(
          content,
          `    clone(v, isInitializing) {\n        return this.val(v.t, v.v, false, isInitializing);\n    }`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `    clone(v, isInitializing) {\n        if (v && v.t && this.isClassType(v.t)) {\n            const def = this.types[this.getTypeSignature(v.t)];\n            if (def && typeof def.cClone === "function") {\n                return def.cClone(this, v, isInitializing);\n            }\n        }\n        return this.val(v.t, v.v, false, isInitializing);\n    }`,
          'rt.js (clone class)'
        );
        content = mustReplace(
          content,
          `            const { target } = element.v;\n            let result = "";\n            let i = 0;`.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'),
          `            const { target } = element.v;\n            let result = "";\n            let i = element.v.position || 0;`,
          'rt.js (getStringFromCharArray offset)'
        );
        return { contents: content, loader: 'js' };
      });

      // 4. defaults.js: literal/char + string, pointer != bug, pointer +=/-= bug, pointer == 0
      build.onLoad({ filter: /JSCPP\/lib\/defaults\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        const nl = content.includes('\r\n') ? '\r\n' : '\n';
        content = mustReplace(
          content,
          `                    if (rt.isArrayType(r)) {`,
          `                    if (rt.isClassType(r.t) && r.t.name === "string" && rt.isPrimitiveType(l)) {\n                        const st = rt.simpleType("string");\n                        const prefix = rt.isCharType(l.t) ? String.fromCharCode(l.v) : String(l.v);\n                        const rhs = r.v && Array.isArray(r.v._chars) ? r.v._chars.map(c => String.fromCharCode(c.v)).join("") : (r.v._raw || "");\n                        return rt.val(st, { _raw: prefix + rhs, _chars: null, members: {} }, false);\n                    }\n                    else if (rt.isArrayType(r)) {`,
          'defaults.js (char + string)'
        );
        content = mustReplace(
          content,
          `                if (rt.isPointerType(l) && rt.isPointerType(r)) {\n                    if (rt.isTypeEqualTo(l.t, r.t)) {\n                        if (rt.isArrayType(l) && rt.isArrayType(r)) {\n                            ret = (l.v.target === r.v.target) && ((l.v.target === null) || (l.v.position === r.v.position));\n                        }\n                        else {\n                            ret = l.v.target === r.v.target;\n                        }\n                    }\n                    const rett = rt.boolTypeLiteral;\n                    return rt.val(rett, ret);\n                }`.replace(/\n/g, nl),
          `                if (rt.isPointerType(l) && rt.isIntegerType(r) && r.v === 0) {\n                    return rt.val(rt.boolTypeLiteral, l.v.target === null ? 1 : 0);\n                }\n                else if (rt.isPointerType(l) && rt.isPointerType(r)) {\n                    if (rt.isTypeEqualTo(l.t, r.t) || (rt.isVoidType(r.t.targetType) && r.v.target === null) || (rt.isVoidType(l.t.targetType) && l.v.target === null)) {\n                        if (rt.isArrayType(l) && rt.isArrayType(r)) {\n                            ret = (l.v.target === r.v.target) && ((l.v.target === null) || (l.v.position === r.v.position));\n                        }\n                        else {\n                            ret = l.v.target === r.v.target;\n                        }\n                    }\n                    const rett = rt.boolTypeLiteral;\n                    return rt.val(rett, ret ? 1 : 0);\n                }`,
          'defaults.js (pointer ==)'
        );
        content = mustReplace(
          content,
          `        "o(!=)": {\n            default(rt, l, r) {\n                return !rt.types["pointer"].handlers["=="].default(rt, l, r);\n            }\n        },`.replace(/\n/g, nl),
          `        "o(!=)": {\n            default(rt, l, r) {\n                const eq = rt.types["pointer"].handlers["o(==)"].default(rt, l, r);\n                return rt.val(rt.boolTypeLiteral, eq.v ? 0 : 1);\n            }\n        },`,
          'defaults.js (pointer !=)'
        );
        content = mustReplace(
          content,
          `                if (rt.isArrayType(l) && rt.isNumericType(r)) {\n                    const i = rt.cast(rt.intTypeLiteral, r).v;\n                    return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position + i));\n                }\n                else {\n                    rt.raiseException("cannot add non-numeric to an array pointer");\n                }`.replace(/\n/g, nl),
          `                if (rt.isStringType(l) && rt.isClassType(r.t) && r.t.name === "string") {\n                    const st = rt.simpleType("string");\n                    const rhs = r.v && Array.isArray(r.v._chars) ? r.v._chars.map(c => String.fromCharCode(c.v)).join("") : (r.v._raw || "");\n                    return rt.val(st, { _raw: rt.getStringFromCharArray(l) + rhs, _chars: null, members: {} }, false);\n                }\n                else if (rt.isArrayType(l) && rt.isNumericType(r)) {\n                    const i = rt.cast(rt.intTypeLiteral, r).v;\n                    return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position + i));\n                }\n                else {\n                    rt.raiseException("cannot add non-numeric to an array pointer");\n                }`,
          'defaults.js (char[] + string)'
        );
        content = content.replaceAll(
          'return rt.types["pointer"].handlers["="].default(rt, l, r);',
          'return rt.types["pointer"].handlers["o(=)"].default(rt, l, r);'
        );
        return { contents: content, loader: 'js' };
      });

      // 5. iostream.js: dynamic interactive drain() across >> / getline / get / ignore, cin >> string, cout << string & ptr addr
      build.onLoad({ filter: /JSCPP\/lib\/includes\/iostream\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        const nl = content.includes('\r\n') ? '\r\n' : '\n';

        content = mustReplace(content, 'buf: stdio.drain(),', 'buf: "",', 'iostream.js (empty init buf)');

        // Helper for simulated memory address formatting on cout << ptr
        const addrHelper = `
const _getSimAddr = function (rt, ptrVal) {
    if (!ptrVal || !ptrVal.v || ptrVal.v.target === null) return "0";
    if (!rt._ptrAddrs) { rt._ptrAddrs = new WeakMap(); rt._nextAddr = 0x7fff5fbff000; }
    const tgt = ptrVal.v.target;
    let base = rt._ptrAddrs.get(tgt);
    if (base === undefined) {
        base = rt._nextAddr;
        rt._nextAddr -= 64;
        rt._ptrAddrs.set(tgt, base);
    }
    const pos = ptrVal.v.position || 0;
    let elemSize = 4;
    if (rt.isArrayType(ptrVal.t)) {
        try { elemSize = rt.getSizeByType(ptrVal.t.eleType) || 4; } catch (_) {}
    }
    return "0x" + (base + pos * elemSize).toString(16);
};
const _ensureCinToken = function (_cin) {
    let b = _cin.v.buf || "";
    while (_skipSpace(b).length === 0 && _cin.v.istream && typeof _cin.v.istream.drain === "function") {
        const nextChunk = _cin.v.istream.drain();
        if (nextChunk == null || nextChunk === "") break;
        b = _cin.v.buf = b + nextChunk;
    }
    return b;
};
const _ensureCinData = function (_cin) {
    let b = _cin.v.buf || "";
    if (b.length === 0 && _cin.v.istream && typeof _cin.v.istream.drain === "function") {
        b = _cin.v.buf = _cin.v.istream.drain() || "";
    }
    return b;
};
`;
        content = addrHelper + content;

        // Handle std::string inside o(>>) before primitive check
        content = mustReplace(
          content,
          `                        if (!rt.isPrimitiveType(t.t)) {\n                            rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));\n                        }\n                        let b = _cin.v.buf;`.replace(/\n/g, nl),
          `                        if (rt.isClassType(t.t) && t.t.name === "string") {\n                            let sb = _ensureCinToken(_cin);\n                            _cin.v.eofbit = sb.length === 0;\n                            sb = _skipSpace(sb);\n                            const sr = _read(rt, /^\\S*/, sb, t.t)[0];\n                            _cin.v.failbit = sr.length === 0;\n                            _cin.v.buf = sb.substring(sr.length);\n                            if (!t.v) t.v = { members: {} };\n                            t.v._raw = sr;\n                            t.v._chars = null;\n                            return _cin;\n                        }\n                        if (!rt.isPrimitiveType(t.t)) {\n                            rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));\n                        }\n                        let b = _ensureCinToken(_cin);`,
          'iostream.js (o(>>) drain + string)'
        );

        // Dynamic drain on _cinString (char[]), _getline, _get
        content = mustReplace(
          content,
          `            let b = _cin.v.buf;\n            _cin.v.eofbit = b.length === 0;`.replace(/\n/g, nl),
          `            let b = _ensureCinToken(_cin);\n            _cin.v.eofbit = b.length === 0;`,
          'iostream.js (_cinString drain)'
        );
        content = mustReplace(
          content,
          `            const b = _cin.v.buf;\n            _cin.v.eofbit = b.length === 0;\n            let r = _read`.replace(/\n/g, nl),
          `            const b = _ensureCinData(_cin);\n            _cin.v.eofbit = b.length === 0;\n            let r = _read`,
          'iostream.js (_getline drain)'
        );
        content = mustReplace(
          content,
          `            const b = _cin.v.buf;\n            _cin.v.eofbit = b.length === 0;\n            if (_cin.v.eofbit) {`.replace(/\n/g, nl),
          `            const b = _ensureCinData(_cin);\n            _cin.v.eofbit = b.length === 0;\n            if (_cin.v.eofbit) {`,
          'iostream.js (_get drain)'
        );

        // Add cin.ignore(), cin.eof(), cin.fail(), cin.clear()
        const cinExtras = `
        rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral);
        const _ignore = function (rt, _cin, countV, delimV) {
            let count = countV != null ? countV.v : 1;
            const delim = delimV != null ? String.fromCharCode(delimV.v) : "\\n";
            let b = _ensureCinData(_cin);
            let idx = 0;
            while (idx < b.length && idx < count) {
                const ch = b.charAt(idx);
                idx++;
                if (ch === delim) break;
            }
            _cin.v.buf = b.substring(idx);
            return _cin;
        };
        rt.regFunc(_ignore, cin.t, "ignore", [], cin.t);
        rt.regFunc(_ignore, cin.t, "ignore", [rt.intTypeLiteral], cin.t);
        rt.regFunc(_ignore, cin.t, "ignore", [rt.intTypeLiteral, rt.charTypeLiteral], cin.t);
        rt.regFunc((rt, _cin) => { _cin.v.failbit = false; _cin.v.eofbit = false; return rt.val(rt.voidTypeLiteral, undefined); }, cin.t, "clear", [], rt.voidTypeLiteral);
        rt.regFunc((rt, _cin) => rt.val(rt.boolTypeLiteral, _cin.v.eofbit ? 1 : 0), cin.t, "eof", [], rt.boolTypeLiteral);
        rt.regFunc((rt, _cin) => rt.val(rt.boolTypeLiteral, _cin.v.failbit ? 1 : 0), cin.t, "fail", [], rt.boolTypeLiteral);
`;
        content = mustReplace(
          content,
          '        rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral);',
          cinExtras,
          'iostream.js (cin.ignore/clear/eof/fail)'
        );

        // Support std::string and pointers in cout <<
        content = mustReplace(
          content,
          `                        else if (rt.isStringType(t)) {\n                            r = rt.getStringFromCharArray(t);\n                        }\n                        else {\n                            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(t.t));\n                        }`.replace(/\n/g, nl),
          `                        else if (rt.isStringType(t)) {\n                            r = rt.getStringFromCharArray(t);\n                        }\n                        else if (rt.isClassType(t.t) && t.t.name === "string") {\n                            if (t.v && Array.isArray(t.v._chars)) {\n                                t.v._raw = t.v._chars.map(c => String.fromCharCode(c.v)).join("");\n                            }\n                            r = t.v && typeof t.v._raw === "string" ? t.v._raw : "";\n                        }\n                        else if (rt.isPointerType(t.t) && !rt.isFunctionType(t.t)) {\n                            r = _getSimAddr(rt, t);\n                        }\n                        else {\n                            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(t.t));\n                        }`,
          'iostream.js (cout << string & pointer)'
        );

        // Auto-load C++ std::string when <iostream> is included (even if #include <string> was omitted)
        content = mustReplace(
          content,
          '        rt.scope[0].variables["endl"] = endl;',
          `        rt.scope[0].variables["endl"] = endl;\n        if (rt.config.includes && rt.config.includes.string && !rt.config.loadedLibraries.includes("string")) {\n            rt.include("string");\n        }`,
          'iostream.js (auto-load string)'
        );

        return { contents: content, loader: 'js' };
      });

      // 6. iomanip.js: support std::string in setw(...)
      build.onLoad({ filter: /JSCPP\/lib\/includes\/iomanip\.js$/ }, async args => {
        let content = await fsPromises.readFile(args.path, 'utf8');
        const nl = content.includes('\r\n') ? '\r\n' : '\n';
        content = mustReplace(
          content,
          `                                        : rt.isStringType(o) ?\n                                            rt.getStringFromCharArray(o)\n                                            :\n                                                rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(o.t));`.replace(/\n/g, nl),
          `                                        : rt.isStringType(o) ?\n                                            rt.getStringFromCharArray(o)\n                                        : (rt.isClassType(o.t) && o.t.name === "string") ?\n                                            (o.v && Array.isArray(o.v._chars) ? o.v._chars.map(c => String.fromCharCode(c.v)).join("") : (o.v._raw || ""))\n                                            :\n                                                rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(o.t));`,
          'iomanip.js (setw string)'
        );
        return { contents: content, loader: 'js' };
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
    plugins: [jscppPatchPlugin],
    define: { 'process.env.NODE_ENV': '"production"' }
  });

  const jscppStandalone = `// JSCPP runtime wrapped for ThinkCode Lab offline C++ execution (unified STL, OOP, pointer & interactive stdin support)
(function(global) {
${res.outputFiles[0].text}
  global.JSCPP = JSCPP_EXPORT.default;
})(typeof self !== "undefined" ? self : globalThis);
`;
  writeFileSync('public/jscpp/jscpp.js', jscppStandalone);
}

console.log('Offline runtimes ready in public/');
