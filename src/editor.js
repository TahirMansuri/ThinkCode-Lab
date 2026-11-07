import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, StreamLanguage, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql, PLSQL } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { c, cpp, java } from '@codemirror/legacy-modes/mode/clike';
import { php } from '@codemirror/lang-php';

const LANG = {
  python: () => python(), js: () => javascript(), sql: () => sql({ dialect: PLSQL }),
  php: () => php(), web: () => html(), shell: () => StreamLanguage.define(shell),
  c: () => StreamLanguage.define(c), cpp: () => StreamLanguage.define(cpp),
  java: () => StreamLanguage.define(java)
};

const style = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.modifier], color: 'var(--syn-kw)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-str)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--syn-num)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.tagName], color: 'var(--syn-fn)' },
  { tag: [t.typeName, t.className, t.attributeName], color: 'var(--syn-type)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-com)', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--syn-op)' }
]);

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--text)' },
  '.cm-scroller': { fontFamily: 'var(--mono)', fontSize: 'var(--editor-font-size, 13.5px)', lineHeight: '1.6', overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--ember)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--mute)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'var(--active-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--select) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--ember)', borderLeftWidth: '2px' },
  '&.cm-focused': { outline: 'none' }
});

export function createEditor(parent, { doc, lang, onChange, onRun }) {
  const langC = new Compartment();
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        EditorState.tabSize.of(2),
        indentUnit.of("  "),
        lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(), drawSelection(), history(),
        indentOnInput(), bracketMatching(), closeBrackets(), syntaxHighlighting(style), theme, EditorView.lineWrapping,
        langC.of(LANG[lang] ? LANG[lang]() : []),
        keymap.of([{ key: 'Mod-Enter', run: () => (onRun(), true) }, indentWithTab, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of(u => u.docChanged && onChange(u.state.doc.toString()))
      ]
    })
  });
  return {
    get: () => view.state.doc.toString(),
    set(text, l) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, effects: langC.reconfigure(LANG[l] ? LANG[l]() : []) });
    }
  };
}
