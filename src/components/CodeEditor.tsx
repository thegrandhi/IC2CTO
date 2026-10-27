import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { indentUnit, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState, RangeSetBuilder, type Extension } from '@codemirror/state';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { Decoration, EditorView, ViewPlugin, keymap, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { Lang } from '../lib/types';
import { useResolvedTheme } from '../theme';

function languageExt(lang: Lang): Extension {
  return lang === 'python' ? [python(), indentUnit.of('    ')] : [javascript(), indentUnit.of('  ')];
}

function themeExt(dark: boolean, fontSize: number, fill: boolean): Extension {
  return [
    EditorView.theme(
      {
        '&': { backgroundColor: 'var(--panel)', color: 'var(--text)', fontSize: `${fontSize}px`, height: fill ? '100%' : 'auto' },
        '.cm-content': { caretColor: 'var(--accent)' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
          backgroundColor: dark ? '#2b3a4f !important' : '#cfe0f7 !important',
        },
        '.cm-gutters': { backgroundColor: 'var(--panel)', color: 'var(--faint)', border: 'none' },
        '.cm-activeLine': { backgroundColor: dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)' },
        '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--muted)' },
        '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
        '.cm-matchingBracket': { backgroundColor: dark ? 'rgba(163,230,53,0.18)' : 'rgba(77,124,15,0.15)', outline: 'none' },
        '.cm-tooltip': { backgroundColor: 'var(--panel-2)', border: '1px solid var(--border-strong)', color: 'var(--text)' },
        '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: 'var(--accent-soft)', color: 'var(--text)' },
        '.cm-panels': { backgroundColor: 'var(--panel-2)', color: 'var(--text)' },
        '.cm-foldPlaceholder': { backgroundColor: 'var(--panel-3)', border: 'none', color: 'var(--muted)' },
      },
      { dark },
    ),
    dark ? syntaxHighlighting(oneDarkHighlightStyle) : [],
  ];
}

// ------------------------------------------------------------------ line wrapping on phones

/** Same breakpoint as the compact editor toolbar in styles.css. */
const PHONE = '(max-width: 560px)';

function useIsPhone(): boolean {
  return useSyncExternalStore(
    (fn) => {
      const m = window.matchMedia(PHONE);
      m.addEventListener('change', fn);
      return () => m.removeEventListener('change', fn);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

const indentDecos = new Map<number, Decoration>();

/** Gives each line a hanging indent, so a wrapped line continues 2ch past its own indentation. */
function hangingIndents(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const tab = ' '.repeat(view.state.tabSize);
  let last = -1;
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      pos = line.to + 1;
      if (line.from === last) continue;
      last = line.from;
      const cols = /^[ \t]*/.exec(line.text)![0].replace(/\t/g, tab).length + 2;
      let deco = indentDecos.get(cols);
      if (!deco) {
        deco = Decoration.line({ attributes: { style: `padding-left: calc(${cols}ch + 6px); text-indent: -${cols}ch` } });
        indentDecos.set(cols, deco);
      }
      builder.add(line.from, line.from, deco);
    }
  }
  return builder.finish();
}

const hangingIndent = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = hangingIndents(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = hangingIndents(u.view);
    }
  },
  { decorations: (p) => p.decorations },
);

const wrapExt = (wrap: boolean): Extension => (wrap ? [EditorView.lineWrapping, hangingIndent] : []);

interface Props {
  value: string;
  onChange?: (value: string) => void;
  lang: Lang;
  fontSize?: number;
  readOnly?: boolean;
  /** Fill the parent's height (editor) instead of sizing to content (code view). */
  fill?: boolean;
  onRun?: () => void;
  onSubmit?: () => void;
  ariaLabel?: string;
}

export function CodeEditor({ value, onChange, lang, fontSize = 14, readOnly = false, fill = true, onRun, onSubmit, ariaLabel }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const themeComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());
  const callbacks = useRef({ onChange, onRun, onSubmit });
  callbacks.current = { onChange, onRun, onSubmit };
  const dark = useResolvedTheme() === 'dark';
  // Phones wrap long lines instead of scrolling sideways.
  const wrap = useIsPhone();

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          keymap.of([
            { key: 'Mod-Enter', run: () => (callbacks.current.onRun?.(), true) },
            { key: 'Mod-Shift-Enter', run: () => (callbacks.current.onSubmit?.(), true) },
            { key: "Mod-'", run: () => (callbacks.current.onRun?.(), true) },
          ]),
          basicSetup,
          keymap.of([indentWithTab]),
          EditorState.tabSize.of(4),
          langComp.current.of(languageExt(lang)),
          themeComp.current.of(themeExt(dark, fontSize, fill)),
          wrapComp.current.of(wrapExt(wrap)),
          readOnly ? [EditorState.readOnly.of(true), EditorView.editable.of(false)] : [],
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? 'Code editor', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) callbacks.current.onChange?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once; props below are applied through compartments/effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: langComp.current.reconfigure(languageExt(lang)) });
  }, [lang]);

  useEffect(() => {
    view.current?.dispatch({ effects: themeComp.current.reconfigure(themeExt(dark, fontSize, fill)) });
  }, [dark, fontSize, fill]);

  useEffect(() => {
    view.current?.dispatch({ effects: wrapComp.current.reconfigure(wrapExt(wrap)) });
  }, [wrap]);

  return <div ref={host} className={fill ? 'editor-host fill' : 'editor-host'} style={fill ? { height: '100%' } : undefined} />;
}

/** Read-only, syntax-highlighted code block. */
export function CodeView({ code, lang, fontSize = 13 }: { code: string; lang: Lang; fontSize?: number }) {
  return (
    <div className="code-view">
      <CodeEditor value={code} lang={lang} readOnly fill={false} fontSize={fontSize} ariaLabel="Solution code" />
    </div>
  );
}
