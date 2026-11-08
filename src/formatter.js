/**
 * ThinkCode Lab — Multi-Language Code Formatter & Beautifier
 * 100% offline client-side code formatting with universal 2-space indentation.
 * Supports: C, C++, Java, Python, PHP, SQL (Oracle dialect), JavaScript, HTML/Web, and Shell.
 */

/**
 * Universal Formatter Entrypoint
 * @param {string} code - Source code to format
 * @param {string} lang - Target language ('c', 'cpp', 'java', 'python', 'php', 'sql', 'js', 'web', 'shell')
 * @returns {string} Formatted source code
 */
export function formatCode(code, lang = 'c') {
  if (!code || typeof code !== 'string') return code;

  switch (lang) {
    case 'sql':
      return formatSql(code);
    case 'python':
      return formatPython(code);
    case 'web':
    case 'html':
      return formatHtml(code);
    case 'shell':
    case 'bash':
      return formatShell(code);
    case 'c':
    case 'cpp':
    case 'java':
    case 'php':
    case 'js':
    case 'javascript':
    default:
      return formatCStyle(code, lang);
  }
}

/**
 * Formats C-style curly brace languages: C, C++, Java, PHP, JavaScript
 */
function formatCStyle(code, lang) {
  const lines = code.split('\n');
  let indent = 0;
  const formatted = [];
  let inBlockComment = false;
  let prevBlank = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      if (!prevBlank && formatted.length > 0) {
        formatted.push('');
        prevBlank = true;
      }
      continue;
    }
    prevBlank = false;

    // Handle multi-line comments
    if (inBlockComment) {
      formatted.push('  '.repeat(Math.max(0, indent)) + line);
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      formatted.push('  '.repeat(Math.max(0, indent)) + line);
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }

    // Preprocessor directives in C/C++ (#include, #define, etc.) stay at column 0
    if ((lang === 'c' || lang === 'cpp') && line.startsWith('#')) {
      formatted.push(line);
      continue;
    }

    // Count braces outside of strings and comments
    let openCount = 0;
    let closeCount = 0;
    let inStr = false;
    let strChar = '';

    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (inStr) {
        if (ch === strChar && line[i - 1] !== '\\') inStr = false;
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inStr = true;
          strChar = ch;
        } else if (ch === '/' && line[i + 1] === '/') {
          // Line comment begins, ignore rest of line for brace count
          break;
        } else if (ch === '{') {
          openCount++;
        } else if (ch === '}') {
          closeCount++;
        }
      }
    }

    // Check if line starts with closing brace or label
    let startsWithClose = line.startsWith('}') || line.startsWith(') {') || line.startsWith(']{');
    let isLabel = /^(public|private|protected|case\s+.*|default)\s*:/.test(line);

    let curIndent = indent;
    if (startsWithClose || closeCount > openCount) {
      curIndent = Math.max(0, indent - (closeCount - openCount));
    } else if (isLabel) {
      curIndent = Math.max(0, indent - 1);
    }

    // Clean spacing around control keywords: if, for, while, switch, catch
    let cleaned = line
      .replace(/\b(if|for|while|switch|catch)\s*\(/g, '$1 (')
      .replace(/\s*;\s*$/g, ';');

    formatted.push('  '.repeat(curIndent) + cleaned);
    indent = Math.max(0, indent + openCount - closeCount);
  }

  return formatted.join('\n');
}

/**
 * Formats Python source code with 2-space indentation
 */
function formatPython(code) {
  const lines = code.split('\n');
  const result = [];
  let prevBlank = false;

  for (let rawLine of lines) {
    let line = rawLine.trimEnd();
    let trimmed = line.trim();
    if (!trimmed) {
      if (!prevBlank && result.length > 0) {
        result.push('');
        prevBlank = true;
      }
      continue;
    }
    prevBlank = false;

    // Normalize spacing after commas outside quotes
    let inStr = false;
    let strChar = '';
    const chars = [];
    for (let i = 0; i < line.length; i++) {
      let ch = line[i];
      if (inStr) {
        chars.push(ch);
        if (ch === strChar && line[i - 1] !== '\\') inStr = false;
      } else {
        if (ch === '"' || ch === "'") {
          inStr = true;
          strChar = ch;
          chars.push(ch);
        } else if (ch === ',') {
          chars.push(',');
          if (line[i + 1] !== ' ' && i + 1 < line.length) chars.push(' ');
        } else {
          chars.push(ch);
        }
      }
    }
    result.push(chars.join(''));
  }
  return result.join('\n');
}

/**
 * Formats Oracle-compatible SQL queries with capitalized keywords and clause alignment
 */
function formatSql(sql) {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL',
    'DEFAULT', 'CHECK', 'UNIQUE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
    'CROSS JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'AND', 'OR',
    'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'AS', 'DESC', 'ASC',
    'UNION ALL', 'UNION', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'NVL', 'DECODE', 'ROWNUM', 'SYSDATE',
    'VARCHAR2', 'VARCHAR', 'NUMBER', 'DATE', 'INTEGER', 'INT', 'CHAR', 'FLOAT', 'DOUBLE'
  ];

  // Uppercase keywords outside single quotes
  let parts = sql.split(/('[^']*')/g);
  for (let i = 0; i < parts.length; i += 2) {
    for (let kw of keywords) {
      const re = new RegExp('\\b' + kw.replace(/\s+/g, '\\s+') + '\\b', 'gi');
      parts[i] = parts[i].replace(re, kw);
    }
  }
  let transformed = parts.join('');

  // Break major clauses onto new lines
  const majorClauses = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'SET', 'VALUES', 'LIMIT'];
  let lines = transformed.split('\n');
  let result = [];

  for (let line of lines) {
    let t = line.trim();
    if (!t) {
      result.push('');
      continue;
    }

    for (let mc of majorClauses) {
      const re = new RegExp('\\s+(' + mc + ')\\b', 'g');
      t = t.replace(re, '\n$1');
    }

    let subLines = t.split('\n');
    for (let sl of subLines) {
      let trimmed = sl.trim();
      if (!trimmed) continue;
      if (/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|SET|VALUES)\b/i.test(trimmed)) {
        result.push(trimmed);
      } else if (/^SELECT\b/i.test(trimmed)) {
        result.push(trimmed);
      } else {
        result.push('  ' + trimmed);
      }
    }
  }

  return result.join('\n');
}

/**
 * Formats HTML / Web documents with 2-space indentation
 */
function formatHtml(html) {
  let indent = 0;
  let result = [];
  const lines = html.split('\n');

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      result.push('');
      continue;
    }

    // Check if line closes tag at start
    if (/^<\/[a-zA-Z0-9_-]+>/.test(line)) {
      indent = Math.max(0, indent - 1);
    }

    result.push('  '.repeat(indent) + line);

    // If line opens a tag that is not self-closing and doesn't close on the same line
    const opens = (line.match(/<[a-zA-Z0-9_-]+(?:\s+[^>]*)?>/g) || []).filter(tag => {
      const name = tag.match(/<([a-zA-Z0-9_-]+)/)[1].toLowerCase();
      const isVoid = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(name);
      return !isVoid && !tag.endsWith('/>');
    });

    const closes = (line.match(/<\/[a-zA-Z0-9_-]+>/g) || []).length;
    const net = opens.length - closes;
    if (net > 0 && !/^<\/[a-zA-Z0-9_-]+>/.test(line)) {
      indent += net;
    }
  }

  return result.join('\n');
}

/**
 * Formats Linux Bash shell scripts with 2-space indentation
 */
function formatShell(code) {
  const lines = code.split('\n');
  let indent = 0;
  const formatted = [];
  let prevBlank = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      if (!prevBlank && formatted.length > 0) {
        formatted.push('');
        prevBlank = true;
      }
      continue;
    }
    prevBlank = false;

    if (line.startsWith('#!')) {
      formatted.push(line);
      continue;
    }

    if (/^(fi|done|esac|\})\b/.test(line)) {
      indent = Math.max(0, indent - 1);
    }

    let curIndent = indent;
    if (/^(else|elif)\b/.test(line)) {
      curIndent = Math.max(0, indent - 1);
    }

    formatted.push('  '.repeat(curIndent) + line);

    if (/\b(then|do|\{)\s*$/.test(line) || /^case\b/.test(line)) {
      indent++;
    }
  }

  return formatted.join('\n');
}

