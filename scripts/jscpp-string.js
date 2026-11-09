"use strict";

function getStr(val) {
  if (!val || !val.v) return "";
  if (Array.isArray(val.v._chars)) {
    val.v._raw = val.v._chars.map(c => String.fromCharCode(c.v)).join("");
  }
  return typeof val.v._raw === "string" ? val.v._raw : "";
}

function setStr(val, s) {
  if (!val.v) val.v = { members: {} };
  val.v._raw = String(s);
  val.v._chars = null;
}

function isStdString(rt, typeOrVal) {
  const t = typeOrVal && "t" in typeOrVal ? typeOrVal.t : typeOrVal;
  return Boolean(t && t.type === "class" && t.name === "string");
}

function isCharSeq(rt, val) {
  if (!val || !val.t) return false;
  if (rt.isStringType(val.t)) return true;
  return rt.isPointerType(val.t) && rt.isCharType(val.t.targetType || val.t.eleType);
}

function isCharSeqType(rt, t) {
  if (!t) return false;
  if (rt.isStringType(t)) return true;
  return rt.isPointerType(t) && rt.isCharType(t.targetType || t.eleType);
}

function anyToJsStr(rt, x) {
  if (isStdString(rt, x)) return getStr(x);
  if (isCharSeq(rt, x)) return rt.getStringFromCharArray(x);
  if (rt.isPrimitiveType(x) && rt.isCharType(x.t)) return String.fromCharCode(x.v);
  rt.raiseException("cannot convert " + rt.makeTypeString(x.t) + " to string");
  return "";
}

module.exports = {
  getStr,
  setStr,
  isStdString,
  load(rt) {
    const existingSig = rt.getTypeSignature({ type: "class", name: "string" });
    if (existingSig in rt.types) {
      return;
    }

    const stringType = rt.newClass("string", []);
    const sig = rt.getTypeSignature(stringType);
    const pchar = rt.normalPointerType(rt.charTypeLiteral);

    const makeStrVal = (text, left = false) => ({
      t: stringType,
      v: {
        _raw: String(text),
        _chars: null,
        members: {}
      },
      left
    });

    const def = rt.types[sig];
    def.sizeBytes = 32;
    def.cConstructor = function (_rt, _this) {
      _this.v._raw = "";
      _this.v._chars = null;
      _this.v.members = {};
    };
    def.cClone = function (_rt, v) {
      return makeStrVal(getStr(v), false);
    };
    def.cCastable = function (_rt, fromType) {
      if (isStdString(_rt, fromType)) return true;
      if (isCharSeqType(_rt, fromType)) return true;
      if (fromType && fromType.type === "primitive" && _rt.isCharType(fromType)) return true;
      return false;
    };
    def.cCast = function (_rt, val) {
      return makeStrVal(anyToJsStr(_rt, val), false);
    };

    const handlers = def.handlers;

    handlers["o(=)"] = {
      default(_rt, l, r) {
        if (!l.left) _rt.raiseException(_rt.makeValString(l) + " is not a left value");
        setStr(l, anyToJsStr(_rt, r));
        return l;
      }
    };

    handlers["o(+=)"] = {
      default(_rt, l, r) {
        if (!l.left) _rt.raiseException(_rt.makeValString(l) + " is not a left value");
        setStr(l, getStr(l) + anyToJsStr(_rt, r));
        return l;
      }
    };

    handlers["o(+)"] = {
      default(_rt, l, r) {
        return makeStrVal(getStr(l) + anyToJsStr(_rt, r), false);
      }
    };

    handlers["o(==)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) === anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(!=)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) !== anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(<)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) < anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(<=)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) <= anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(>)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) > anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(>=)"] = {
      default(_rt, l, r) {
        return _rt.val(_rt.boolTypeLiteral, getStr(l) >= anyToJsStr(_rt, r) ? 1 : 0);
      }
    };

    handlers["o(&)"] = {
      default(_rt, l) {
        if ("array" in l) {
          return _rt.val(_rt.arrayPointerType(l.t, l.array.length), _rt.makeArrayPointerValue(l.array, l.arrayIndex));
        }
        return _rt.val(_rt.normalPointerType(l.t), _rt.makeNormalPointerValue(l));
      }
    };

    handlers["o([])"] = {
      default(_rt, l, idx) {
        const s = getStr(l);
        const i = _rt.cast(_rt.intTypeLiteral, idx).v;
        if (i < 0 || i >= s.length) {
          _rt.raiseException(`string index out of range: ${i} (length ${s.length})`);
        }
        if (!Array.isArray(l.v._chars)) {
          l.v._chars = s.split("").map(ch => _rt.val(_rt.charTypeLiteral, ch.charCodeAt(0), true));
        }
        return l.v._chars[i];
      }
    };

    const lenFn = (_rt, _this) => _rt.val(_rt.intTypeLiteral, getStr(_this).length);
    rt.regFunc(lenFn, stringType, "length", [], rt.intTypeLiteral);
    rt.regFunc(lenFn, stringType, "size", [], rt.intTypeLiteral);

    const emptyFn = (_rt, _this) => _rt.val(_rt.boolTypeLiteral, getStr(_this).length === 0 ? 1 : 0);
    rt.regFunc(emptyFn, stringType, "empty", [], rt.boolTypeLiteral);

    const clearFn = (_rt, _this) => {
      setStr(_this, "");
      return _rt.val(_rt.voidTypeLiteral, undefined);
    };
    rt.regFunc(clearFn, stringType, "clear", [], rt.voidTypeLiteral);

    const pushBackFn = (_rt, _this, ch) => {
      const c = String.fromCharCode(_rt.cast(_rt.charTypeLiteral, ch).v);
      setStr(_this, getStr(_this) + c);
      return _rt.val(_rt.voidTypeLiteral, undefined);
    };
    rt.regFunc(pushBackFn, stringType, "push_back", [rt.charTypeLiteral], rt.voidTypeLiteral);

    const popBackFn = (_rt, _this) => {
      const s = getStr(_this);
      if (s.length > 0) setStr(_this, s.slice(0, -1));
      return _rt.val(_rt.voidTypeLiteral, undefined);
    };
    rt.regFunc(popBackFn, stringType, "pop_back", [], rt.voidTypeLiteral);

    const atFn = (_rt, _this, idx) => {
      const s = getStr(_this);
      const i = _rt.cast(_rt.intTypeLiteral, idx).v;
      if (i < 0 || i >= s.length) {
        _rt.raiseException(`string::at index out of range: ${i}`);
      }
      return _rt.val(_rt.charTypeLiteral, s.charCodeAt(i));
    };
    rt.regFunc(atFn, stringType, "at", [rt.intTypeLiteral], rt.charTypeLiteral);

    const substr1Fn = (_rt, _this, pos) => {
      const s = getStr(_this);
      const p = _rt.cast(_rt.intTypeLiteral, pos).v;
      if (p < 0 || p > s.length) _rt.raiseException(`string::substr out of range: ${p}`);
      return makeStrVal(s.slice(p), false);
    };
    const substr2Fn = (_rt, _this, pos, len) => {
      const s = getStr(_this);
      const p = _rt.cast(_rt.intTypeLiteral, pos).v;
      const n = _rt.cast(_rt.intTypeLiteral, len).v;
      if (p < 0 || p > s.length) _rt.raiseException(`string::substr out of range: ${p}`);
      return makeStrVal(n < 0 ? s.slice(p) : s.slice(p, p + n), false);
    };
    rt.regFunc(substr1Fn, stringType, "substr", [rt.intTypeLiteral], stringType);
    rt.regFunc(substr2Fn, stringType, "substr", [rt.intTypeLiteral, rt.intTypeLiteral], stringType);

    const appendFn = (_rt, _this, other) => {
      setStr(_this, getStr(_this) + anyToJsStr(_rt, other));
      return _this;
    };
    rt.regFunc(appendFn, stringType, "append", [stringType], stringType);
    rt.regFunc(appendFn, stringType, "append", [pchar], stringType);

    const find1Fn = (_rt, _this, needle) => {
      const s = getStr(_this);
      const n = anyToJsStr(_rt, needle);
      return _rt.val(_rt.intTypeLiteral, s.indexOf(n));
    };
    const find2Fn = (_rt, _this, needle, pos) => {
      const s = getStr(_this);
      const n = anyToJsStr(_rt, needle);
      const p = Math.max(0, _rt.cast(_rt.intTypeLiteral, pos).v);
      return _rt.val(_rt.intTypeLiteral, s.indexOf(n, p));
    };
    rt.regFunc(find1Fn, stringType, "find", [stringType], rt.intTypeLiteral);
    rt.regFunc(find1Fn, stringType, "find", [pchar], rt.intTypeLiteral);
    rt.regFunc(find1Fn, stringType, "find", [rt.charTypeLiteral], rt.intTypeLiteral);
    rt.regFunc(find2Fn, stringType, "find", [stringType, rt.intTypeLiteral], rt.intTypeLiteral);
    rt.regFunc(find2Fn, stringType, "find", [pchar, rt.intTypeLiteral], rt.intTypeLiteral);
    rt.regFunc(find2Fn, stringType, "find", [rt.charTypeLiteral, rt.intTypeLiteral], rt.intTypeLiteral);

    const compareFn = (_rt, _this, other) => {
      const a = getStr(_this);
      const b = anyToJsStr(_rt, other);
      return _rt.val(_rt.intTypeLiteral, a === b ? 0 : (a < b ? -1 : 1));
    };
    rt.regFunc(compareFn, stringType, "compare", [stringType], rt.intTypeLiteral);
    rt.regFunc(compareFn, stringType, "compare", [pchar], rt.intTypeLiteral);

    const cstrFn = (_rt, _this) => _rt.makeCharArrayFromString(getStr(_this));
    rt.regFunc(cstrFn, stringType, "c_str", [], pchar);

    const frontFn = (_rt, _this) => {
      const s = getStr(_this);
      if (!s.length) _rt.raiseException("string::front on empty string");
      return _rt.val(_rt.charTypeLiteral, s.charCodeAt(0));
    };
    const backFn = (_rt, _this) => {
      const s = getStr(_this);
      if (!s.length) _rt.raiseException("string::back on empty string");
      return _rt.val(_rt.charTypeLiteral, s.charCodeAt(s.length - 1));
    };
    rt.regFunc(frontFn, stringType, "front", [], rt.charTypeLiteral);
    rt.regFunc(backFn, stringType, "back", [], rt.charTypeLiteral);

    const erase1Fn = (_rt, _this, pos) => {
      const s = getStr(_this);
      const p = Math.max(0, Math.min(s.length, _rt.cast(_rt.intTypeLiteral, pos).v));
      setStr(_this, s.slice(0, p));
      return _this;
    };
    const erase2Fn = (_rt, _this, pos, len) => {
      const s = getStr(_this);
      const p = Math.max(0, Math.min(s.length, _rt.cast(_rt.intTypeLiteral, pos).v));
      const n = Math.max(0, _rt.cast(_rt.intTypeLiteral, len).v);
      setStr(_this, s.slice(0, p) + s.slice(p + n));
      return _this;
    };
    rt.regFunc(erase1Fn, stringType, "erase", [rt.intTypeLiteral], stringType);
    rt.regFunc(erase2Fn, stringType, "erase", [rt.intTypeLiteral, rt.intTypeLiteral], stringType);

    const insertFn = (_rt, _this, pos, ins) => {
      const s = getStr(_this);
      const p = Math.max(0, Math.min(s.length, _rt.cast(_rt.intTypeLiteral, pos).v));
      const sub = anyToJsStr(_rt, ins);
      setStr(_this, s.slice(0, p) + sub + s.slice(p));
      return _this;
    };
    rt.regFunc(insertFn, stringType, "insert", [rt.intTypeLiteral, stringType], stringType);
    rt.regFunc(insertFn, stringType, "insert", [rt.intTypeLiteral, pchar], stringType);

    const replaceFn = (_rt, _this, pos, len, rep) => {
      const s = getStr(_this);
      const p = Math.max(0, Math.min(s.length, _rt.cast(_rt.intTypeLiteral, pos).v));
      const n = Math.max(0, _rt.cast(_rt.intTypeLiteral, len).v);
      const sub = anyToJsStr(_rt, rep);
      setStr(_this, s.slice(0, p) + sub + s.slice(p + n));
      return _this;
    };
    rt.regFunc(replaceFn, stringType, "replace", [rt.intTypeLiteral, rt.intTypeLiteral, stringType], stringType);
    rt.regFunc(replaceFn, stringType, "replace", [rt.intTypeLiteral, rt.intTypeLiteral, pchar], stringType);

    // Global helper functions: to_string, stoi, stod, stof, getline
    const toStrNum = (_rt, _this, x) => makeStrVal(String(x.v), false);
    rt.regFunc(toStrNum, "global", "to_string", [rt.intTypeLiteral], stringType);
    rt.regFunc(toStrNum, "global", "to_string", [rt.longTypeLiteral], stringType);
    rt.regFunc(toStrNum, "global", "to_string", [rt.floatTypeLiteral], stringType);
    rt.regFunc(toStrNum, "global", "to_string", [rt.doubleTypeLiteral], stringType);

    rt.regFunc((_rt, _this, s) => {
      const n = parseInt(getStr(s), 10);
      if (Number.isNaN(n)) _rt.raiseException("stoi: invalid argument");
      return _rt.val(_rt.intTypeLiteral, n);
    }, "global", "stoi", [stringType], rt.intTypeLiteral);

    rt.regFunc((_rt, _this, s) => {
      const n = parseFloat(getStr(s));
      if (Number.isNaN(n)) _rt.raiseException("stod: invalid argument");
      return _rt.val(_rt.doubleTypeLiteral, n);
    }, "global", "stod", [stringType], rt.doubleTypeLiteral);

    rt.regFunc((_rt, _this, s) => {
      const n = parseFloat(getStr(s));
      if (Number.isNaN(n)) _rt.raiseException("stof: invalid argument");
      return _rt.val(_rt.floatTypeLiteral, n);
    }, "global", "stof", [stringType], rt.floatTypeLiteral);

    // Global getline(cin, str[, delim]) if istream is present
    const istreamSig = rt.getTypeSignature({ type: "class", name: "istream" });
    if (istreamSig in rt.types) {
      const istreamType = { type: "class", name: "istream" };
      const getlineStr = (_rt, _this, _cin, outStr, delimV) => {
        const delim = delimV != null ? String.fromCharCode(delimV.v) : "\n";
        let b = _cin.v.buf || "";
        if (b.length === 0 && _cin.v.istream && typeof _cin.v.istream.drain === "function") {
          b = _cin.v.buf = _cin.v.istream.drain() || "";
        }
        _cin.v.eofbit = b.length === 0;
        const idx = b.indexOf(delim);
        let line;
        if (idx === -1) {
          line = b;
          _cin.v.buf = "";
          _cin.v.failbit = line.length === 0;
        } else {
          line = b.slice(0, idx);
          _cin.v.buf = b.slice(idx + 1);
          _cin.v.failbit = false;
        }
        setStr(outStr, line);
        return _cin;
      };
      rt.regFunc(getlineStr, "global", "getline", [istreamType, stringType], istreamType);
      rt.regFunc(getlineStr, "global", "getline", [istreamType, stringType, rt.charTypeLiteral], istreamType);
    }
  }
};

