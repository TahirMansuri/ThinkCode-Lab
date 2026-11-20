// C# (.NET) Worker: 100% offline C# runtime supporting C# OOP, List<T>, Windows Forms GUI emulation,
// interactive in-console stdin, Exception handling, and ADO.NET database operations.

let base = '', queue = [];
let status = null, dataLen = null, dataBuf = null;
let nativeStdin = false;
const dec = new TextDecoder();
const post = (t, s, extra = {}) => postMessage({ t, s, ...extra });

function readNativeStdinSync() {
  post('need_input');
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', base + '__native_stdin?ts=' + Date.now(), false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send('{}');
    if (xhr.status === 200 && xhr.responseText) {
      const res = JSON.parse(xhr.responseText);
      if (!res.cancelled) return String(res.text ?? '');
    }
  } catch (_) {}
  return null;
}

function requestInputFromConsole() {
  // Priority 1: Interactive in-console stdin via SharedArrayBuffer
  if (status) {
    post('need_input');
    Atomics.store(status, 0, 1); // 1 = WAITING_FOR_INPUT
    Atomics.wait(status, 0, 1);
    if (Atomics.load(status, 0) === 2) { // 2 = INPUT_READY
      const len = Atomics.load(dataLen, 0);
      const copy = new Uint8Array(len);
      copy.set(dataBuf.subarray(0, len));
      const text = dec.decode(copy) + '\n';
      Atomics.store(status, 0, 0);
      return text;
    }
    Atomics.store(status, 0, 0);
    return '\n';
  }
  // Priority 2: Android WebView Native Stdin Bridge
  if (nativeStdin) {
    const val = readNativeStdinSync();
    return val === null ? '\n' : val + '\n';
  }
  // Fallback: Pre-buffered input queue
  if (queue.length > 0) {
    return queue.shift() + '\n';
  }
  return '\n';
}

function findMatching(str, startIdx, openChar = '{', closeChar = '}') {
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function stripTypes(paramStr) {
  if (!paramStr || !paramStr.trim()) return '';
  return paramStr.split(',').map(p => {
    let s = p.trim().replace(/\b(?:params|ref|out|in)\s+/g, '');
    const parts = s.split(/\s+/);
    return parts[parts.length - 1].replace(/\[.*\]$/, '');
  }).filter(Boolean).join(', ');
}

// ==========================================
// In-Memory ADO.NET Relational DB Emulation
// ==========================================
class SimpleDb {
  constructor() {
    this.tables = {};
  }
  execute(sql) {
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    if (stmts.length === 0) return { affected: 0, rows: [] };
    let totalAffected = 0;
    let lastRows = [];
    for (const stmt of stmts) {
      const res = this.executeSingle(stmt);
      totalAffected += res.affected;
      if (res.rows && res.rows.length > 0) lastRows = res.rows;
    }
    return { affected: totalAffected, rows: lastRows };
  }
  executeSingle(clean) {
    // CREATE TABLE
    const createMatch = clean.match(/^CREATE\s+TABLE\s+(\w+)\s*\((.+)\)$/is);
    if (createMatch) {
      const tableName = createMatch[1];
      const colDefs = createMatch[2].split(',').map(c => c.trim().split(/\s+/)[0]);
      this.tables[tableName] = { cols: colDefs, rows: [] };
      return { affected: 0, rows: [] };
    }
    // INSERT INTO
    const insertMatch = clean.match(/^INSERT\s+INTO\s+(\w+)(?:\s*\(([^)]+)\))?\s+VALUES\s*\((.+)\)$/is);
    if (insertMatch) {
      const tableName = insertMatch[1];
      if (!this.tables[tableName]) this.tables[tableName] = { cols: [], rows: [] };
      const rawVals = insertMatch[3].split(',').map(v => {
        let s = v.trim();
        if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1);
        if (!isNaN(Number(s))) return Number(s);
        return s;
      });
      const table = this.tables[tableName];
      let rowObj = {};
      if (insertMatch[2]) {
        const cols = insertMatch[2].split(',').map(c => c.trim());
        cols.forEach((c, idx) => { rowObj[c] = rawVals[idx]; });
      } else {
        table.cols.forEach((c, idx) => { rowObj[c] = rawVals[idx]; });
      }
      table.rows.push(rowObj);
      return { affected: 1, rows: [] };
    }
    // UPDATE
    const updateMatch = clean.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/is);
    if (updateMatch) {
      const tableName = updateMatch[1];
      const table = this.tables[tableName];
      if (!table) return { affected: 0, rows: [] };
      const setParts = updateMatch[2].split(',').map(p => p.trim().split('=').map(s => s.trim()));
      let count = 0;
      for (const row of table.rows) {
        let matches = true;
        if (updateMatch[3]) {
          const [wCol, wVal] = updateMatch[3].split('=').map(s => s.trim().replace(/^'|'$/g, ''));
          matches = String(row[wCol]) == String(wVal);
        }
        if (matches) {
          for (const [col, val] of setParts) {
            const cleanVal = val.replace(/^'|'$/g, '');
            row[col] = isNaN(Number(cleanVal)) ? cleanVal : Number(cleanVal);
          }
          count++;
        }
      }
      return { affected: count, rows: [] };
    }
    // DELETE
    const deleteMatch = clean.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/is);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const table = this.tables[tableName];
      if (!table) return { affected: 0, rows: [] };
      const prevCount = table.rows.length;
      if (deleteMatch[2]) {
        const [wCol, wVal] = deleteMatch[2].split('=').map(s => s.trim().replace(/^'|'$/g, ''));
        table.rows = table.rows.filter(r => String(r[wCol]) != String(wVal));
      } else {
        table.rows = [];
      }
      return { affected: prevCount - table.rows.length, rows: [] };
    }
    // SELECT
    const selectMatch = clean.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+([A-Za-z0-9_]+)(?:\s+(ASC|DESC))?)?$/is);
    if (selectMatch) {
      const tableName = selectMatch[2];
      const table = this.tables[tableName];
      if (!table) return { affected: 0, rows: [] };
      let filtered = table.rows;
      if (selectMatch[3]) {
        const [wCol, wVal] = selectMatch[3].split('=').map(s => s.trim().replace(/^'|'$/g, ''));
        filtered = filtered.filter(r => String(r[wCol]) == String(wVal));
      }
      if (selectMatch[4]) {
        const oCol = selectMatch[4].trim();
        const isDesc = String(selectMatch[5] || '').toUpperCase() === 'DESC';
        filtered = [...filtered].sort((a, b) => {
          const valA = a[oCol];
          const valB = b[oCol];
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
        });
      }
      return { affected: filtered.length, rows: filtered.map(r => ({ ...r })) };
    }
    return { affected: 0, rows: [] };
  }
}

// ==========================================
// C# Runtime Environment Factory
// ==========================================
function buildCSharpEnv(postOut, postErr, postTable, postGui) {
  let stdinBuffer = '';

  const Console = {
    WriteLine: (...args) => {
      const msg = args.map(a => (a === null ? 'null' : (typeof a === 'object' && a.toString && a.toString !== Object.prototype.toString ? a.toString() : (typeof a === 'object' ? JSON.stringify(a) : String(a))))).join(' ');
      postOut(msg + '\n');
    },
    Write: (...args) => {
      const msg = args.map(a => (a === null ? 'null' : (typeof a === 'object' && a.toString && a.toString !== Object.prototype.toString ? a.toString() : (typeof a === 'object' ? JSON.stringify(a) : String(a))))).join(' ');
      postOut(msg);
    },
    ReadLine: () => {
      if (stdinBuffer.length === 0) {
        stdinBuffer = requestInputFromConsole();
      }
      const nl = stdinBuffer.indexOf('\n');
      if (nl !== -1) {
        const line = stdinBuffer.slice(0, nl);
        stdinBuffer = stdinBuffer.slice(nl + 1);
        return line.replace(/\r$/, '');
      }
      const res = stdinBuffer.replace(/\r$/, '');
      stdinBuffer = '';
      return res;
    },
    Clear: () => post('clear')
  };

  const Convert = {
    ToInt32: v => {
      const n = parseInt(v, 10);
      if (isNaN(n)) throw new FormatException(`Input string was not in a correct format.`);
      return n;
    },
    ToInt64: v => {
      const n = parseInt(v, 10);
      if (isNaN(n)) throw new FormatException(`Input string was not in a correct format.`);
      return n;
    },
    ToDouble: v => {
      const n = parseFloat(v);
      if (isNaN(n)) throw new FormatException(`Input string was not in a correct format.`);
      return n;
    },
    ToSingle: v => {
      const n = parseFloat(v);
      if (isNaN(n)) throw new FormatException(`Input string was not in a correct format.`);
      return n;
    },
    ToBoolean: v => Boolean(v && String(v).toLowerCase() !== 'false' && v !== '0'),
    ToString: v => String(v ?? ''),
    ToChar: v => String(v ?? '').charAt(0)
  };

  const int = {
    Parse: s => Convert.ToInt32(s),
    TryParse: (s, out) => {
      const n = parseInt(s, 10);
      return !isNaN(n);
    }
  };

  const double = {
    Parse: s => Convert.ToDouble(s),
    TryParse: (s, out) => {
      const n = parseFloat(s);
      return !isNaN(n);
    }
  };

  const float = {
    Parse: s => Convert.ToSingle(s)
  };

  const long = {
    Parse: s => Convert.ToInt64(s)
  };

  const bool = {
    Parse: s => Convert.ToBoolean(s)
  };

  // C# Generic List<T>
  class List extends Array {
    constructor(...items) {
      super(...items);
    }
    Add(item) {
      this.push(item);
    }
    AddRange(items) {
      if (Array.isArray(items)) {
        for (const it of items) this.push(it);
      }
    }
    Remove(item) {
      const idx = this.indexOf(item);
      if (idx !== -1) {
        this.splice(idx, 1);
        return true;
      }
      return false;
    }
    RemoveAt(index) {
      if (index >= 0 && index < this.length) {
        this.splice(index, 1);
      }
    }
    Contains(item) {
      return this.indexOf(item) !== -1;
    }
    Clear() {
      this.length = 0;
    }
    Find(predicate) {
      for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) return this[i];
      }
      return null;
    }
    FindAll(predicate) {
      const res = new List();
      for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) res.Add(this[i]);
      }
      return res;
    }
    get Count() {
      return this.length;
    }
    ToArray() {
      return Array.from(this);
    }
  }

  // C# Exception Classes
  class Exception extends Error {
    constructor(message = 'A C# runtime exception occurred.') {
      super(message);
      this.name = 'Exception';
    }
    get Message() { return this.message; }
  }

  class DivideByZeroException extends Exception {
    constructor(message = 'Attempted to divide by zero.') {
      super(message);
      this.name = 'DivideByZeroException';
    }
  }

  class FormatException extends Exception {
    constructor(message = 'Input string was not in a correct format.') {
      super(message);
      this.name = 'FormatException';
    }
  }

  class NullReferenceException extends Exception {
    constructor(message = 'Object reference not set to an instance of an object.') {
      super(message);
      this.name = 'NullReferenceException';
    }
  }

  class IndexOutOfRangeException extends Exception {
    constructor(message = 'Index was outside the bounds of the array.') {
      super(message);
      this.name = 'IndexOutOfRangeException';
    }
  }

  class ArgumentException extends Exception {
    constructor(message = 'Value does not fall within the expected range.') {
      super(message);
      this.name = 'ArgumentException';
    }
  }

  class InvalidOperationException extends Exception {
    constructor(message = 'Operation is not valid due to the current state of the object.') {
      super(message);
      this.name = 'InvalidOperationException';
    }
  }

  // Windows Forms Emulation
  class Control {
    constructor() {
      this.Text = '';
      this.Name = '';
      this.Width = 120;
      this.Height = 28;
      this.Visible = true;
      this.Enabled = true;
      this._clickHandlers = [];
    }
    set Click(fn) {
      if (typeof fn === 'function') this._clickHandlers.push(fn);
    }
    add_Click(fn) {
      if (typeof fn === 'function') this._clickHandlers.push(fn);
    }
  }

  class Label extends Control {
    constructor(text = '') {
      super();
      this.componentType = 'Label';
      this.Text = text;
    }
  }

  class TextBox extends Control {
    constructor(text = '') {
      super();
      this.componentType = 'TextBox';
      this.Text = text;
    }
  }

  class Button extends Control {
    constructor(text = '') {
      super();
      this.componentType = 'Button';
      this.Text = text;
    }
  }

  class RadioButton extends Control {
    constructor(text = '') {
      super();
      this.componentType = 'RadioButton';
      this.Text = text;
      this.Checked = false;
    }
  }

  class CheckBox extends Control {
    constructor(text = '') {
      super();
      this.componentType = 'CheckBox';
      this.Text = text;
      this.Checked = false;
    }
  }

  class ComboBox extends Control {
    constructor() {
      super();
      this.componentType = 'ComboBox';
      this.Items = new List();
      this.SelectedIndex = -1;
      this.SelectedItem = null;
    }
  }

  class ControlCollection extends Array {
    Add(ctrl) {
      if (ctrl) this.push(ctrl);
    }
    Clear() {
      this.length = 0;
    }
  }

  class Form extends Control {
    constructor() {
      super();
      this.componentType = 'Form';
      this.Text = 'Form1';
      this.Width = 420;
      this.Height = 360;
      this.Controls = new ControlCollection();
    }
    Show() {
      Application.Run(this);
    }
    ShowDialog() {
      this.Show();
    }
  }

  const MessageBox = {
    Show: (text, caption = 'Message') => {
      postOut(`\n┌─── [MessageBox: ${caption}] ───\n│ ${text}\n└──────────────────────────────\n`);
      post('prompt_modal', String(text), { defaultVal: caption, isAlert: true });
    }
  };

  const Application = {
    Run: (form) => {
      if (!form) return;
      postOut(`\n[Windows Forms] Form launched: "${form.Text || 'Form1'}"\n`);
      postOut(`Controls loaded: ${form.Controls.length} items.\n`);

      const serializeCtrl = c => {
        if (!c) return null;
        return {
          type: c.componentType || 'Control',
          text: c.Text || '',
          name: c.Name || '',
          checked: Boolean(c.Checked),
          items: c.Items ? Array.from(c.Items) : []
        };
      };

      const winData = {
        title: form.Text || 'Windows Form Application',
        width: form.Width || 420,
        height: form.Height || 360,
        layout: { type: 'GridLayout', cols: 2 },
        components: form.Controls.map(serializeCtrl).filter(Boolean)
      };

      postGui(winData);
    }
  };

  // ADO.NET SQL Server Emulation
  const sharedDb = new SimpleDb();

  class SqlConnection {
    constructor(connStr = '') {
      this.ConnectionString = connStr;
      this.State = 'Closed';
    }
    Open() {
      this.State = 'Open';
    }
    Close() {
      this.State = 'Closed';
    }
    Dispose() {
      this.Close();
    }
  }

  class SqlDataReader {
    constructor(rows = []) {
      this._rows = rows;
      this._curr = -1;
    }
    Read() {
      this._curr++;
      return this._curr < this._rows.length;
    }
    Close() {
      this._curr = this._rows.length;
    }
    get(colName) {
      if (this._curr >= 0 && this._curr < this._rows.length) {
        return this._rows[this._curr][colName];
      }
      return null;
    }
    GetString(i) {
      const keys = Object.keys(this._rows[this._curr] || {});
      return String(this._rows[this._curr]?.[keys[i]] ?? '');
    }
    GetInt32(i) {
      const keys = Object.keys(this._rows[this._curr] || {});
      return Number(this._rows[this._curr]?.[keys[i]] ?? 0);
    }
    GetDouble(i) {
      const keys = Object.keys(this._rows[this._curr] || {});
      return Number(this._rows[this._curr]?.[keys[i]] ?? 0.0);
    }
    GetBoolean(i) {
      const keys = Object.keys(this._rows[this._curr] || {});
      return Boolean(this._rows[this._curr]?.[keys[i]]);
    }
    get FieldCount() {
      if (this._rows.length > 0) return Object.keys(this._rows[0]).length;
      return 0;
    }
  }

  class SqlParameterCollection {
    constructor() {
      this._params = {};
    }
    AddWithValue(paramName, val) {
      this._params[paramName] = val;
    }
  }

  class SqlCommand {
    constructor(cmdText = '', connection = null) {
      this.CommandText = cmdText;
      this.Connection = connection;
      this.Parameters = new SqlParameterCollection();
    }
    ExecuteNonQuery() {
      let sql = this.CommandText;
      for (const [p, val] of Object.entries(this.Parameters._params)) {
        const repr = typeof val === 'string' ? `'${val}'` : val;
        sql = sql.replaceAll(p, repr);
      }
      const res = sharedDb.execute(sql);
      return res.affected;
    }
    ExecuteReader() {
      let sql = this.CommandText;
      for (const [p, val] of Object.entries(this.Parameters._params)) {
        const repr = typeof val === 'string' ? `'${val}'` : val;
        sql = sql.replaceAll(p, repr);
      }
      const res = sharedDb.execute(sql);
      return new Proxy(new SqlDataReader(res.rows), {
        get(target, prop) {
          if (prop in target) return target[prop];
          return target.get(prop);
        }
      });
    }
    ExecuteScalar() {
      const reader = this.ExecuteReader();
      if (reader.Read()) {
        const row = reader._rows[reader._curr];
        const keys = Object.keys(row || {});
        return keys.length ? row[keys[0]] : null;
      }
      return null;
    }
  }

  class DataTable {
    constructor(name = '') {
      this.TableName = name;
      this.Rows = new List();
      this.Columns = new List();
    }
  }

  function __div(a, b) {
    if (b === 0 || b === 0.0) throw new DivideByZeroException('Attempted to divide by zero.');
    return (Number.isInteger(a) && Number.isInteger(b)) ? Math.trunc(a / b) : a / b;
  }

  return {
    Console,
    Convert,
    int,
    double,
    float,
    long,
    bool,
    List,
    Exception,
    DivideByZeroException,
    FormatException,
    NullReferenceException,
    IndexOutOfRangeException,
    ArgumentException,
    InvalidOperationException,
    Control,
    Label,
    TextBox,
    Button,
    RadioButton,
    CheckBox,
    ComboBox,
    Form,
    MessageBox,
    Application,
    SqlConnection,
    SqlCommand,
    SqlDataReader,
    DataTable,
    Math,
    __div
  };
}

// ==========================================
// C# Code Parser and Transpiler
// ==========================================
function validateCSharpCode(code) {
  const errors = [];
  const lines = code.split('\n');

  // Check 1: Main method or Form/Application existence
  const hasMain = /\b(?:public|private|protected|internal)?\s*(?:static\s+)?(?:void|int|async\s+Task)\s+Main\s*\(/.test(code);
  const hasTopLevelCode = /(?:Console\.(?:WriteLine|Write)|Application\.Run)\s*\(/.test(code);
  if (!hasMain && !hasTopLevelCode) {
    return ["Program.cs: error CS5001: Program does not contain a static 'Main' method suitable for an entry point\n"];
  }

  // Check 2: Balanced braces
  let braceDepth = 0;
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l].replace(/\/\/.*$/, '');
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '{') braceDepth++;
      else if (line[c] === '}') {
        braceDepth--;
        if (braceDepth < 0) {
          errors.push(`Program.cs:${l + 1}:${c + 1}: error CS1513: } expected\n`);
          braceDepth = 0;
        }
      }
    }
  }
  if (braceDepth > 0) {
    errors.push(`Program.cs:${lines.length}: error CS1513: } expected at end of file\n`);
  }

  return errors;
}

function extractStrings(src) {
  let res = '';
  const literals = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === '@' && src[i + 1] === '"') {
      let start = i;
      i += 2;
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') { i += 2; continue; }
          else { i++; break; }
        }
        i++;
      }
      literals.push(src.substring(start, i));
      res += `__STR_${literals.length - 1}__`;
    } else if (src[i] === '$' && src[i + 1] === '"') {
      let start = i;
      i += 2;
      let braceDepth = 0;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '{') {
          if (src[i + 1] === '{') { i += 2; continue; }
          braceDepth++;
          i++;
          continue;
        }
        if (src[i] === '}') {
          if (src[i + 1] === '}') { i += 2; continue; }
          if (braceDepth > 0) braceDepth--;
          i++;
          continue;
        }
        if (src[i] === '"' && braceDepth === 0) {
          i++;
          break;
        }
        i++;
      }
      literals.push(src.substring(start, i));
      res += `__STR_${literals.length - 1}__`;
    } else if (src[i] === '"') {
      let start = i;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '"') { i++; break; }
        i++;
      }
      literals.push(src.substring(start, i));
      res += `__STR_${literals.length - 1}__`;
    } else if (src[i] === "'") {
      let start = i;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === "'") { i++; break; }
        i++;
      }
      literals.push(src.substring(start, i));
      res += `__STR_${literals.length - 1}__`;
    } else {
      res += src[i];
      i++;
    }
  }
  return { code: res, literals };
}

function transformInterpolatedString(lit, classFields = new Set(), staticFields = new Set(), className = '', instanceMethodNames = new Set(), staticMethods = new Set(), isStatic = false, paramNames = new Set()) {
  const content = lit.slice(2, -1);
  let res = '`';
  let i = 0;
  while (i < content.length) {
    if (content[i] === '{' && content[i + 1] === '{') {
      res += '{';
      i += 2;
    } else if (content[i] === '}' && content[i + 1] === '}') {
      res += '}';
      i += 2;
    } else if (content[i] === '{') {
      let start = ++i;
      let depth = 1;
      let inQuotes = false;
      let quoteChar = '';
      while (i < content.length && depth > 0) {
        if (!inQuotes && (content[i] === '"' || content[i] === "'")) {
          inQuotes = true;
          quoteChar = content[i];
        } else if (inQuotes && content[i] === quoteChar && content[i - 1] !== '\\') {
          inQuotes = false;
        } else if (!inQuotes) {
          if (content[i] === '{') depth++;
          else if (content[i] === '}') depth--;
        }
        if (depth === 0) break;
        i++;
      }
      const inner = content.substring(start, i);
      i++;

      let expr = inner.trim();
      let format = null;
      let alignment = null;

      let colonIdx = -1;
      let parenDepth = 0;
      for (let k = expr.length - 1; k >= 0; k--) {
        if (expr[k] === ')' || expr[k] === ']') parenDepth++;
        else if (expr[k] === '(' || expr[k] === '[') parenDepth--;
        else if (parenDepth === 0 && expr[k] === ':') {
          colonIdx = k;
          break;
        }
      }
      if (colonIdx !== -1) {
        format = expr.substring(colonIdx + 1).trim();
        expr = expr.substring(0, colonIdx).trim();
      }

      let commaIdx = -1;
      parenDepth = 0;
      for (let k = expr.length - 1; k >= 0; k--) {
        if (expr[k] === ')' || expr[k] === ']') parenDepth++;
        else if (expr[k] === '(' || expr[k] === '[') parenDepth--;
        else if (parenDepth === 0 && expr[k] === ',') {
          commaIdx = k;
          break;
        }
      }
      if (commaIdx !== -1) {
        alignment = parseInt(expr.substring(commaIdx + 1).trim(), 10);
        expr = expr.substring(0, commaIdx).trim();
      }

      if (!isStatic) {
        for (const cf of classFields) {
          if (paramNames.has(cf)) continue;
          const reg = new RegExp(`(?<![.\\w])${cf}(?![\\w(])`, 'g');
          expr = expr.replace(reg, `this.${cf}`);
        }
        for (const im of instanceMethodNames) {
          const reg = new RegExp(`(?<![.\\w])${im}(?=\\s*\\()`, 'g');
          expr = expr.replace(reg, `this.${im}`);
        }
      }
      for (const sf of staticFields) {
        const reg = new RegExp(`(?<![.\\w])${sf}(?![\\w(])`, 'g');
        expr = expr.replace(reg, `${className}.${sf}`);
      }
      for (const sm of staticMethods) {
        if (sm === 'Main') continue;
        const reg = new RegExp(`(?<![.\\w])${sm}(?=\\s*\\()`, 'g');
        expr = expr.replace(reg, `${className}.${sm}`);
      }

      let evaluated = expr;
      if (format) {
        const fMatch = format.match(/^([FfNn])(\d+)?$/);
        if (fMatch) {
          const type = fMatch[1].toUpperCase();
          const digits = fMatch[2] ? parseInt(fMatch[2], 10) : 2;
          if (type === 'F') {
            evaluated = `Number(${expr}).toFixed(${digits})`;
          } else if (type === 'N') {
            evaluated = `Number(${expr}).toLocaleString("en-US", { minimumFractionDigits: ${digits}, maximumFractionDigits: ${digits} })`;
          }
        }
      }

      if (alignment !== null && !isNaN(alignment)) {
        if (alignment < 0) {
          evaluated = `String(${evaluated}).padEnd(${Math.abs(alignment)})`;
        } else {
          evaluated = `String(${evaluated}).padStart(${alignment})`;
        }
      }

      res += '${' + evaluated + '}';
    } else if (content[i] === '`') {
      res += '\\`';
      i++;
    } else {
      res += content[i];
      i++;
    }
  }
  res += '`';
  return res;
}

function transformTryCatch(code) {
  let res = '';
  let i = 0;

  while (i < code.length) {
    const tryIdx = code.indexOf('try', i);
    if (tryIdx === -1) {
      res += code.slice(i);
      break;
    }

    const before = tryIdx === 0 ? '' : code[tryIdx - 1];
    const after = code[tryIdx + 3] || '';
    if (/\w/.test(before) || (after !== '' && !/\s|\{/.test(after))) {
      res += code.slice(i, tryIdx + 3);
      i = tryIdx + 3;
      continue;
    }

    res += code.slice(i, tryIdx);

    const tryOpen = code.indexOf('{', tryIdx);
    if (tryOpen === -1) {
      res += code.slice(tryIdx);
      break;
    }
    const tryClose = findMatching(code, tryOpen, '{', '}');
    if (tryClose === -1) {
      res += code.slice(tryIdx);
      break;
    }

    const tryBody = code.slice(tryOpen + 1, tryClose);
    res += `try {${tryBody}}`;

    let curr = tryClose + 1;
    const catchBlocks = [];

    while (curr < code.length) {
      while (curr < code.length && /\s/.test(code[curr])) curr++;
      if (code.startsWith('catch', curr)) {
        const openParen = code.indexOf('(', curr + 5);
        const closeParen = code.indexOf(')', openParen);
        const openBrace = code.indexOf('{', closeParen);
        const closeBrace = findMatching(code, openBrace, '{', '}');
        if (openParen !== -1 && closeParen !== -1 && openBrace !== -1 && closeBrace !== -1) {
          const paramStr = code.slice(openParen + 1, closeParen).trim();
          const catchBody = code.slice(openBrace + 1, closeBrace);

          const parts = paramStr.split(/\s+/);
          const typeName = parts.length > 1 ? parts[0] : 'Exception';
          const varName = parts[parts.length - 1];

          catchBlocks.push({ type: typeName, varName, body: catchBody });
          curr = closeBrace + 1;
          continue;
        }
      }
      break;
    }

    if (catchBlocks.length === 1) {
      const c = catchBlocks[0];
      res += ` catch (${c.varName}) {${c.body}}`;
    } else if (catchBlocks.length > 1) {
      let merged = ` catch (_err) {\n`;
      for (let j = 0; j < catchBlocks.length; j++) {
        const c = catchBlocks[j];
        const isLast = j === catchBlocks.length - 1;
        const cond = (c.type === 'Exception') ? 'true' : `(_err instanceof ${c.type} || _err.name === '${c.type}')`;
        const prefix = j === 0 ? 'if' : (isLast && cond === 'true' ? 'else' : 'else if');
        if (isLast && cond === 'true') {
          merged += `  ${prefix} {\n    let ${c.varName} = _err;\n${c.body}\n  }\n`;
        } else {
          merged += `  ${prefix} (${cond}) {\n    let ${c.varName} = _err;\n${c.body}\n  }\n`;
        }
      }
      merged += `}`;
      res += merged;
    }

    i = curr;
  }

  return res;
}

function transformMethodBody(body, classFields, staticFields, className, paramStr = '', staticMethods = new Set(), instanceMethodNames = new Set(), isStatic = false, stringLiterals = []) {
  let b = transformTryCatch(body);

  const paramNames = new Set(paramStr.split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean));

  // Strip C# typecasts: (int), (double), (float), (long), (bool), (string), (ClassName)
  b = b.replace(/(?<!\b(?:if|while|switch|for|catch)\s*)\(\s*(?:int|double|float|long|bool|string|char|[A-Z][A-Za-z0-9_]*)\s*\)(?=\s*[A-Za-z0-9_(])/g, '');

  // Float / Long / Decimal suffixes: 3.5f -> 3.5, 100L -> 100, 50.0m -> 50.0
  b = b.replace(/\b(\d+(?:\.\d+)?)[fFmM]\b/g, '$1');
  b = b.replace(/\b(\d+)[lL]\b/g, '$1');

  // foreach (Type x in arr) -> for (const x of arr)
  b = b.replace(/foreach\s*\(\s*(?:var|[A-Za-z0-9_<>[\]]+)\s+([A-Za-z_]\w*)\s+in\s+([^)]+)\)/g, 'for (const $1 of $2)');

  // Generic List instantiations: new List<Type>() -> new List()
  b = b.replace(/new\s+List\s*<[^>]+>\s*\(/g, 'new List(');

  // Array instantiations with initializer: new int[] { 1, 2, 3 } -> [ 1, 2, 3 ]
  b = b.replace(/new\s+(?:int|float|double|long|bool|string|[A-Za-z_]\w*)\s*\[\s*\]\s*\{([^}]*)\}/g, '[$1]');

  // Array instantiations: new int[n]
  b = b.replace(/new\s+(?:int|float|double|long|bool|string|[A-Za-z_]\w*)\s*\[([^\]]+)\]/g, 'new Array($1).fill(0)');

  // Integer division with zero-check for C# DivideByZeroException
  b = b.replace(/([a-zA-Z0-9_\)\]]+)\s*\/\s*([a-zA-Z0-9_\(\[]+)/g, '__div($1, $2)');

  // Local variable declarations (including generic types like List<T> list = ...):
  b = b.replace(/\b(?:int|double|float|long|bool|string|char|var|[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?)(?:\[\s*\])*\s+([a-zA-Z_]\w*)\s*=/g, (m, varName) => {
    if (paramNames.has(varName) || classFields.has(varName)) return `${varName} =`;
    return `let ${varName} =`;
  });
  b = b.replace(/\b(?:int|double|float|long|bool|string|char|[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?)(?:\[\s*\])*\s+([a-zA-Z_]\w*)\s*;/g, (m, varName) => {
    if (paramNames.has(varName) || classFields.has(varName)) return `${varName} = null;`;
    return `let ${varName} = null;`;
  });

  // Event handlers: btn.Click += ... -> btn.Click = ...
  b = b.replace(/([A-Za-z0-9_]+)\.Click\s*\+=\s*/g, '$1.Click = ');

  // Prefix bare class fields with this.
  for (const cf of classFields) {
    if (paramNames.has(cf)) continue;
    const reg = new RegExp(`(?<![.\\w])${cf}(?![\\w(])`, 'g');
    b = b.replace(reg, `this.${cf}`);
  }

  // Prefix bare static fields with ClassName.
  for (const sf of staticFields) {
    const reg = new RegExp(`(?<![.\\w])${sf}(?![\\w(])`, 'g');
    b = b.replace(reg, `${className}.${sf}`);
  }

  // Prefix bare static methods with ClassName.
  for (const sm of staticMethods) {
    if (sm === 'Main') continue;
    const reg = new RegExp(`(?<![.\\w])${sm}(?=\\s*\\()`, 'g');
    b = b.replace(reg, `${className}.${sm}`);
  }

  // Prefix bare instance methods with this.
  if (!isStatic) {
    for (const im of instanceMethodNames) {
      const reg = new RegExp(`(?<![.\\w])${im}(?=\\s*\\()`, 'g');
      b = b.replace(reg, `this.${im}`);
    }
  }

  // Restore string literals scoped to this method body
  b = b.replace(/__STR_(\d+)__/g, (match, idxStr) => {
    const s = parseInt(idxStr, 10);
    const lit = stringLiterals[s];
    if (!lit) return match;
    if (lit.startsWith('$')) {
      return transformInterpolatedString(lit, classFields, staticFields, className, instanceMethodNames, staticMethods, isStatic, paramNames);
    }
    if (lit.startsWith('@"')) {
      const raw = lit.slice(2, -1).replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/""/g, '"');
      return '`' + raw + '`';
    }
    return lit;
  });

  return b;
}

function parseAndTranspileCSharp(csharpCode) {
  let code = csharpCode;

  // 1. Hide string literals & character literals
  const { code: unstrCode, literals: stringLiterals } = extractStrings(code);
  code = unstrCode;

  // 2. Strip comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  code = code.replace(/\/\/.*/g, '');

  // 3. Strip preprocessor & using statements
  code = code.replace(/^\s*#\s*\w+.*$/gm, '');
  code = code.replace(/^\s*using\s+[\w\.]+;\s*$/gm, '');

  // 4. Unwrap namespace <Name> { ... }
  code = code.replace(/namespace\s+[\w\.]+\s*\{/g, '/* namespace */ {');

  // 5. Replace interfaces and abstract classes
  code = code.replace(/\binterface\s+([A-Za-z_]\w*)(?:\s*:\s*[^{]+)?\s*\{[\s\S]*?\}/g, (m, name) => `class ${name} {}`);
  code = code.replace(/\babstract\s+class\b/g, 'class');
  code = code.replace(/\babstract\s+(?:void|int|double|float|string|bool|[A-Za-z_]\w*)\s+[A-Za-z_]\w*\s*\([^;)]*\)\s*;/g, '');

  // 6. Find all classes
  const classRe = /\b(?:public\s+|private\s+|protected\s+|internal\s+)?class\s+([A-Za-z_]\w*)(?:\s*:\s*([A-Za-z_]\w*))?\s*\{/g;
  let cm;
  const classes = [];
  while ((cm = classRe.exec(code)) !== null) {
    const name = cm[1];
    const baseClass = cm[2];
    const openIdx = cm.index + cm[0].length - 1;
    const closeIdx = findMatching(code, openIdx, '{', '}');
    if (closeIdx === -1) continue;
    classes.push({
      start: cm.index,
      end: closeIdx + 1,
      name,
      base: baseClass,
      rawBody: code.substring(openIdx + 1, closeIdx)
    });
  }

  // Pre-pass: Collect only class-level declared fields & auto-properties for every class
  const classFieldsMap = new Map();
  const staticFieldsMap = new Map();
  for (const cls of classes) {
    const fields = new Set();
    const statics = new Set();
    const body = cls.rawBody;

    let idx = 0;
    while (idx < body.length) {
      while (idx < body.length && /\s/.test(body[idx])) idx++;
      if (idx >= body.length) break;

      const semiIdx = body.indexOf(';', idx);
      const openBrace = body.indexOf('{', idx);

      // Auto-property: public int Prop { get; set; }
      const remaining = body.substring(idx);
      const autoPropMatch = remaining.match(/^(?:public|private|protected|internal)?\s*(?:[A-Za-z0-9_<>[\]]+)\s+([A-Za-z0-9_]+)\s*\{\s*get\s*;\s*set\s*;\s*\}(?:\s*=\s*([^;]+);)?/);
      if (autoPropMatch) {
        fields.add(autoPropMatch[1]);
        idx += autoPropMatch[0].length;
        continue;
      }

      if (openBrace !== -1 && (semiIdx === -1 || openBrace < semiIdx)) {
        // Skip method or constructor body so local variables are never treated as class fields
        const closeBrace = findMatching(body, openBrace, '{', '}');
        if (closeBrace === -1) break;
        idx = closeBrace + 1;
      } else if (semiIdx !== -1) {
        // Field declaration
        const decl = body.substring(idx, semiIdx).trim();
        const fieldMatch = decl.match(/(?:public|private|protected|internal)?\s*(static\s+)?(?:const\s+)?(?:int|float|double|char|bool|string|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([^;]+)/);
        if (fieldMatch) {
          const isStatic = Boolean(fieldMatch[1]);
          const declList = fieldMatch[2].split(',');
          for (const item of declList) {
            const idMatch = item.trim().match(/^([A-Za-z_]\w*)/);
            if (idMatch) {
              if (isStatic) statics.add(idMatch[1]);
              else fields.add(idMatch[1]);
            }
          }
        }
        idx = semiIdx + 1;
      } else {
        break;
      }
    }
    classFieldsMap.set(cls.name, fields);
    staticFieldsMap.set(cls.name, statics);
  }

  // Inherit ancestor fields
  for (const cls of classes) {
    if (cls.base && classFieldsMap.has(cls.base)) {
      const curFields = classFieldsMap.get(cls.name);
      const baseFields = classFieldsMap.get(cls.base);
      baseFields.forEach(f => curFields.add(f));
    }
  }

  let mainClass = null;
  const outputClasses = [];

  for (const cls of classes) {
    let body = cls.rawBody;
    const classFields = classFieldsMap.get(cls.name) || new Set();
    const staticFields = staticFieldsMap.get(cls.name) || new Set();
    const staticMethods = new Set();
    const instanceMethodNames = new Set();
    const instanceMethods = [];
    const constructors = [];
    const fieldDecls = [];

    let idx = 0;
    while (idx < body.length) {
      while (idx < body.length && /\s/.test(body[idx])) idx++;
      if (idx >= body.length) break;

      const semiIdx = body.indexOf(';', idx);
      const openBrace = body.indexOf('{', idx);

      // Check for auto-property: public Type Prop { get; set; }
      const autoPropRegex = /^(?:public|private|protected|internal)?\s*(?:[A-Za-z0-9_<>[\]]+)\s+([A-Za-z0-9_]+)\s*\{\s*get\s*;\s*set\s*;\s*\}(?:\s*=\s*([^;]+);)?/;
      const remainingBody = body.substring(idx);
      const autoPropMatch = remainingBody.match(autoPropRegex);
      if (autoPropMatch && (openBrace === -1 || remainingBody.indexOf(autoPropMatch[0]) === 0)) {
        const propName = autoPropMatch[1];
        const defVal = autoPropMatch[2] ? autoPropMatch[2].trim() : 'null';
        classFields.add(propName);
        fieldDecls.push(`  ${propName} = ${defVal};`);
        idx += autoPropMatch[0].length;
        continue;
      }

      if (openBrace !== -1 && (semiIdx === -1 || openBrace < semiIdx)) {
        const header = body.substring(idx, openBrace).trim();
        const closeBrace = findMatching(body, openBrace, '{', '}');
        if (closeBrace === -1) break;
        const memberBody = body.substring(openBrace + 1, closeBrace);

        // Check constructor
        const ctorMatch = header.match(new RegExp('(?:public|private|protected|internal)?\\s*\\b' + cls.name + '\\s*\\(([^)]*)\\)(?:\\s*:\\s*base\\s*\\(([^)]*)\\))?'));
        if (ctorMatch) {
          constructors.push({
            params: stripTypes(ctorMatch[1]),
            rawParams: ctorMatch[1],
            baseArgs: ctorMatch[2] || '',
            body: memberBody
          });
        } else {
          // Method
          const methodMatch = header.match(/(?:public|private|protected|internal)?\s*(static\s+)?(?:virtual|override|sealed|async)?\s*(?:void|int|float|double|char|bool|string|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
          if (methodMatch) {
            const isStatic = Boolean(methodMatch[1]);
            const mName = methodMatch[2];
            const params = stripTypes(methodMatch[3]);
            if (isStatic) staticMethods.add(mName);
            else instanceMethodNames.add(mName);
            if (mName === 'Main') {
              mainClass = cls.name;
            }
            instanceMethods.push({
              name: mName,
              isStatic,
              params: mName === 'Main' ? 'args = []' : params,
              rawParams: methodMatch[3],
              body: memberBody
            });
          }
        }
        idx = closeBrace + 1;
      } else if (semiIdx !== -1) {
        const decl = body.substring(idx, semiIdx).trim();
        const fieldMatch = decl.match(/(?:public|private|protected|internal)?\s*(static\s+)?(?:const\s+)?(?:int|float|double|char|bool|string|[A-Za-z_]\w*(?:<[^>]+>)?)(?:\[\s*\])*\s+([^;]+)/);
        if (fieldMatch) {
          const isStatic = Boolean(fieldMatch[1]);
          const declList = fieldMatch[2].split(',');
          for (const d of declList) {
            const trimmed = d.trim();
            const nm = trimmed.match(/^([A-Za-z_]\w*)(?:\s*=\s*(.*))?$/);
            if (nm) {
              const varName = nm[1];
              let initVal = nm[2] ? nm[2].trim() : 'null';
              if (initVal.startsWith('{') && initVal.endsWith('}')) {
                initVal = '[' + initVal.slice(1, -1) + ']';
              }
              if (isStatic) {
                staticFields.add(varName);
                fieldDecls.push(`  static ${varName} = ${initVal};`);
              } else {
                classFields.add(varName);
                fieldDecls.push(`  ${varName} = ${initVal};`);
              }
            }
          }
        }
        idx = semiIdx + 1;
      } else {
        break;
      }
    }

    let classJs = `class ${cls.name}${cls.base ? ' extends ' + cls.base : ''} {\n`;
    if (fieldDecls.length > 0) {
      classJs += fieldDecls.join('\n') + '\n';
    }

    if (constructors.length === 0) {
      if (cls.base) {
        classJs += `  constructor(...args) { super(...args); }\n`;
      }
    } else {
      const c = constructors[0];
      let transBody = transformMethodBody(c.body, classFields, staticFields, cls.name, c.params, staticMethods, instanceMethodNames, false, stringLiterals);
      let superCall = '';
      if (cls.base) {
        if (c.baseArgs) {
          superCall = `    super(${c.baseArgs});\n`;
        } else {
          superCall = `    super();\n`;
        }
      }
      classJs += `  constructor(${c.params}) {\n${superCall}${transBody}\n  }\n`;
    }

    for (const m of instanceMethods) {
      const transBody = transformMethodBody(m.body, classFields, staticFields, cls.name, m.params, staticMethods, instanceMethodNames, m.isStatic, stringLiterals);
      const stat = m.isStatic ? 'static ' : '';
      classJs += `  ${stat}${m.name}(${m.params}) {\n${transBody}\n  }\n`;
    }

    classJs += `}\n`;
    outputClasses.push(classJs);
  }

  // Restore string literals
  let finalJs = outputClasses.join('\n');
  for (let s = stringLiterals.length - 1; s >= 0; s--) {
    let lit = stringLiterals[s];
    if (lit.startsWith('$')) {
      lit = transformInterpolatedString(lit);
    } else if (lit.startsWith('@"')) {
      const raw = lit.slice(2, -1).replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/""/g, '"');
      lit = '`' + raw + '`';
    }
    finalJs = finalJs.replaceAll(`__STR_${s}__`, lit);
  }

  return { js: finalJs, mainClass: mainClass || 'Program' };
}

// ==========================================
// Worker Lifecycle Handlers
// ==========================================
const _self = typeof self !== 'undefined' ? self : globalThis;

_self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    base = data.base;
    nativeStdin = Boolean(data.nativeStdin);
    if (data.sharedCtrl && data.sharedData) {
      status = new Int32Array(data.sharedCtrl, 0, 1);
      dataLen = new Int32Array(data.sharedCtrl, 4, 1);
      dataBuf = new Uint8Array(data.sharedData);
    }
    post('status', 'C# (.NET) offline runtime ready');
    post('ready');
    return;
  }

  if (data.type === 'run') {
    const csharpCode = data.code || '';
    queue = (data.stdin || '').split('\n').filter(Boolean);

    // 1. Syntax & Pre-compilation Validation Layer
    const syntaxErrors = validateCSharpCode(csharpCode);
    if (syntaxErrors.length > 0) {
      for (const err of syntaxErrors) {
        post('err', err);
      }
      post('done');
      return;
    }

    try {
      const { js, mainClass } = parseAndTranspileCSharp(csharpCode);

      const postOut = s => post('out', s);
      const postErr = s => post('err', s);
      const postTable = (cols, rows) => post('table', '', { columns: cols, rows });
      const postGui = winData => post('gui_window', winData);

      const env = buildCSharpEnv(postOut, postErr, postTable, postGui);
      const envKeys = Object.keys(env);
      const envVals = Object.values(env);

      const execScript = `
"use strict";
return (() => {
  ${js}

  if (typeof ${mainClass} !== 'undefined' && typeof ${mainClass}.Main === 'function') {
    ${mainClass}.Main([]);
  } else if (typeof Program !== 'undefined' && typeof Program.Main === 'function') {
    Program.Main([]);
  }
})();
`;

      const fn = new Function(...envKeys, execScript);
      fn(...envVals);
    } catch (e) {
      const msg = String(e?.Message || e?.message || e);
      post('err', `Program.cs: error: ${msg}\n`);
    }

    post('done');
  }
};

export { validateCSharpCode, parseAndTranspileCSharp, buildCSharpEnv };
