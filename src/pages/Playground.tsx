import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { Icon } from '../components/Icon';
import { ConfirmButton } from '../components/ui';
import { execCode, runners } from '../lib/runner/runner';
import { STORAGE_PREFIX, storage, updateSettings, useAppState } from '../lib/store';
import { LANG_LABEL, LANGS, type ExecReport, type Lang } from '../lib/types';

const SAMPLES: Record<Lang, string> = {
  python: `# Scratchpad: anything goes. print() output appears below.
from collections import Counter
import heapq

words = "the quick brown fox jumps over the lazy dog the end".split()
print(Counter(words).most_common(2))

nums = [5, 1, 8, 3, 9, 2]
print(heapq.nsmallest(3, nums))
`,
  javascript: `// Scratchpad: anything goes. console.log output appears below.
const words = "the quick brown fox jumps over the lazy dog the end".split(" ");
const counts = new Map();
for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
console.log([...counts].sort((a, b) => b[1] - a[1]).slice(0, 2));

const nums = [5, 1, 8, 3, 9, 2];
console.log([...nums].sort((a, b) => a - b).slice(0, 3));
`,
};

const key = (lang: Lang) => `${STORAGE_PREFIX}playground:${lang}`;

export function Playground() {
  const s = useAppState();
  const lang = s.settings.lang;
  const [code, setCode] = useState(() => storage.get(key(lang)) ?? SAMPLES[lang]);
  const [out, setOut] = useState<ExecReport | null>(null);
  const [running, setRunning] = useState(false);
  const runner = useSyncExternalStore(runners[lang].subscribe, runners[lang].getState);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setCode(storage.get(key(lang)) ?? SAMPLES[lang]);
    setOut(null);
    runners[lang].start().catch(() => undefined);
  }, [lang]);

  const onChange = (v: string) => {
    setCode(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => storage.set(key(lang), v), 400);
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    storage.set(key(lang), code);
    setOut(await execCode(lang, code));
    setRunning(false);
  };

  return (
    <div className="playground">
      <div className="ws-head">
        <strong>Playground</strong>
        <select className="select" value={lang} onChange={(e) => updateSettings({ lang: e.target.value as Lang })} aria-label="Language">
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {LANG_LABEL[l]}
            </option>
          ))}
        </select>
        <span className="small faint">{runner.status === 'loading' ? runner.message : runner.version}</span>
        <div className="spacer" />
        <ConfirmButton className="btn ghost small" onConfirm={() => onChange(SAMPLES[lang])} title="Replace the scratchpad with sample code" confirmLabel="Replace code?">
          <Icon name="reset" /> Sample
        </ConfirmButton>
        {running ? (
          <button className="btn" onClick={() => runners[lang].cancel()}>
            <Icon name="stop" /> Stop
          </button>
        ) : (
          <button className="btn primary" onClick={run} title="Ctrl/⌘ + Enter">
            <Icon name="play" /> Run
          </button>
        )}
      </div>
      <div className="editor-wrap">
        <CodeEditor value={code} onChange={onChange} lang={lang} fontSize={s.settings.fontSize} onRun={run} onSubmit={run} />
      </div>
      <div className="output" aria-live="polite">
        {running && !out && <span className="faint">Running…</span>}
        {!running && !out && <span className="faint">Output appears here. Ctrl/⌘ + Enter runs.</span>}
        {out && (
          <>
            {out.stdout}
            {out.error && <div className="error-box">{out.error}</div>}
            <div className="faint small" style={{ marginTop: 8 }}>
              Finished in {out.ms < 1 ? '<1' : Math.round(out.ms)} ms
            </div>
          </>
        )}
      </div>
    </div>
  );
}
