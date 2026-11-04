// Classic Web Worker: PHP 8.2 (php-wasm) running 100% offline with CGI Form Bridge.
self.window = self;
self.document = self.document || {
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

let php = null, base = '';
let inBytes = [];
let outBuf = [], errBuf = [];
const post = (t, s) => postMessage({ t, s });
const enc = new TextEncoder();
const dec = new TextDecoder();

function prepareCode(code) {
  const trimmed = (code || '').trimStart();
  if (/^<\?php(?=[ \t\r\n]|$)/i.test(trimmed)) {
    const idx = code.indexOf('<?php');
    return code.slice(0, idx) + '     ' + code.slice(idx + 5);
  }
  if (/<\?php/i.test(code) || /^<!DOCTYPE|<html|<head|<body|<form|<div|<p|<h\d/i.test(trimmed)) {
    return '?>' + code;
  }
  return code;
}

onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    post('status', 'Loading PHP 8.2 runtime…');
    try {
      importScripts(base + 'php/php.js');
      const Module = {
        locateFile: (path) => path.endsWith('.wasm') ? base + 'php/php.wasm' : base + 'php/' + path,
        stdin: () => (inBytes.length ? inBytes.shift() : null),
        stdout: (byte) => { outBuf.push(byte); },
        stderr: (byte) => { errBuf.push(byte); }
      };
      php = await PHP(Module);
      await php.ccall('pib_storage_init', 'number', [], [], { async: true });
      await php.ccall('pib_init', 'number', ['string'], ['embed'], { async: true });
      // Define standard streams (STDIN, STDOUT, STDERR) for user scripts
      await php.ccall('pib_run', 'number', ['string'], [
        'if (!defined("STDIN")) define("STDIN", fopen("php://stdin", "r")); ' +
        'if (!defined("STDOUT")) define("STDOUT", fopen("php://stdout", "w")); ' +
        'if (!defined("STDERR")) define("STDERR", fopen("php://stderr", "w"));'
      ], { async: true });
      outBuf = [];
      errBuf = [];
      post('ready');
    } catch (e) {
      post('fatal', 'PHP runtime failed to load: ' + (e.message || e));
    }
    return;
  }

  if (data.type === 'run') {
    if (!php) {
      post('err', 'PHP runtime is not initialized.\n');
      post('done');
      return;
    }

    const inputStr = data.stdin ? (data.stdin.endsWith('\n') ? data.stdin : data.stdin + '\n') : '';
    inBytes = Array.from(enc.encode(inputStr));
    outBuf = [];
    errBuf = [];

    // Form submission & CGI environment simulation ($_SERVER, $_POST, $_GET, $_REQUEST)
    const opts = data.opts || {};
    const method = (opts.method || 'GET').toUpperCase();
    const formData = opts.data || {};
    const jsonStr = JSON.stringify(formData).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const envInit = `
      $_SERVER['REQUEST_METHOD'] = '${method}';
      $_POST = ${method === 'POST' ? `json_decode('${jsonStr}', true) ?: []` : '[]'};
      $_GET = ${method === 'GET' ? `json_decode('${jsonStr}', true) ?: []` : '[]'};
      $_REQUEST = array_merge($_GET, $_POST);
    `;

    try {
      await php.ccall('pib_run', 'number', ['string'], [envInit], { async: true });
    } catch (_) {}

    let code = data.code || '';
    const src = prepareCode(code);

    try {
      await php.ccall('pib_run', 'number', ['string'], [src], { async: true });
    } catch (e) {
      post('err', String(e.message || e) + '\n');
    }

    const fullOut = dec.decode(new Uint8Array(outBuf));
    const fullErr = dec.decode(new Uint8Array(errBuf));
    outBuf = [];
    errBuf = [];

    if (fullOut) {
      post('out', fullOut);
      // Route to live preview tab if it was an HTTP form submission OR if HTML markup is present
      if (opts.method || /<(?:!doctype|html|head|body|form|div|p|h\d|table|button|input|span|section|main|article)[^>]*>/i.test(fullOut)) {
        post('preview', fullOut);
      }
    }
    if (fullErr) {
      post('err', fullErr);
    }
    post('done');
  }
};
