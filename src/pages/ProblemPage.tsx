import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CodeEditor, CodeView } from '../components/CodeEditor';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { DifficultyPill, formatClock, formatDuration, Modal, useStopwatch } from '../components/ui';
import { allProblems, getProblem } from '../lib/content';
import { runners, runProblem } from '../lib/runner/runner';
import { dueLabel, RATINGS, schedule, todayStr, type Rating } from '../lib/srs';
import { draftKey, rateProblem, recordAttempt, setProblemField, storage, updateSettings, useAppState } from '../lib/store';
import { isDesignTest, LANG_LABEL, LANGS, type Lang, type Problem, type TestCase, type TestOutcome } from '../lib/types';
import { navigate } from '../router';

const TARGET_MIN = { Easy: 20, Medium: 35, Hard: 50 } as const;

const fmt = (v: unknown) => JSON.stringify(v) ?? 'undefined';

function formatInput(p: Problem, t: TestCase): string {
  if (isDesignTest(t)) return `${fmt(t.ops)}\n${fmt(t.args)}`;
  return p.spec.fn.params.map((param, i) => `${param.name} = ${fmt(t.in[i])}`).join('\n');
}

function Example({ p, t, n }: { p: Problem; t: TestCase; n: number }) {
  return (
    <div>
      <div className="small" style={{ fontWeight: 700, margin: '14px 0 6px' }}>
        Example {n}
      </div>
      <div className="example">
        <b>Input: </b>
        {isDesignTest(t) ? '\n' : ''}
        {formatInput(p, t).split('\n').join(isDesignTest(t) ? '\n' : ', ')}
        {'\n'}
        <b>Output: </b>
        {fmt(t.out)}
        {t.why && (
          <>
            {'\n'}
            <b>Explanation: </b>
            {t.why}
          </>
        )}
      </div>
    </div>
  );
}

type LeftTab = 'description' | 'hints' | 'solution' | 'notes' | 'history';

interface Results {
  kind: 'run' | 'submit';
  indices: number[];
  outcomes: (TestOutcome | undefined)[];
  compileError?: string;
  stdout?: string;
  running: boolean;
}

function loadCode(p: Problem, lang: Lang, fresh: boolean): string {
  if (fresh) return p.starter[lang];
  return storage.get(draftKey(p.id, lang)) ?? p.starter[lang];
}

export function ProblemPage({ id, mode }: { id: string; mode: string | null }) {
  const p = getProblem(id);
  if (!p) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Problem not found</h2>
          <a href="#/problems">All problems</a>
        </div>
      </div>
    );
  }
  return <Workspace p={p} mode={mode === 'review' || mode === 'mock' ? mode : 'practice'} />;
}

function Workspace({ p, mode }: { p: Problem; mode: 'practice' | 'review' | 'mock' }) {
  const s = useAppState();
  const prog = s.problems[p.id];
  const lang = s.settings.lang;
  const fresh = mode !== 'practice';
  const [codes, setCodes] = useState<Record<Lang, string>>(() => ({
    python: loadCode(p, 'python', fresh),
    javascript: loadCode(p, 'javascript', fresh),
  }));
  const code = codes[lang];
  const [tab, setTab] = useState<LeftTab>('description');
  const [mobile, setMobile] = useState<'problem' | 'code'>('problem');
  const [results, setResults] = useState<Results | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [caseIdx, setCaseIdx] = useState(0);
  const [assisted, setAssisted] = useState(false);
  const [solvedNow, setSolvedNow] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [elapsed] = useStopwatch(!solvedNow);
  const runner = useSyncExternalStore(runners[lang].subscribe, runners[lang].getState);
  const target = TARGET_MIN[p.difficulty] * 60;
  const locked = mode === 'mock' && !solvedNow && elapsed < target;

  useEffect(() => {
    runners[lang].start().catch(() => undefined);
  }, [lang]);

  // Persist drafts (debounced).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onChange = useCallback(
    (value: string) => {
      setCodes((c) => ({ ...c, [lang]: value }));
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => storage.set(draftKey(p.id, lang), value), 400);
    },
    [lang, p.id],
  );
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const execute = useCallback(
    async (kind: 'run' | 'submit') => {
      if (results?.running) return;
      storage.set(draftKey(p.id, lang), code);
      const indices = kind === 'run' ? p.tests.slice(0, p.examples).map((_, i) => i) : p.tests.map((_, i) => i);
      setResults({ kind, indices, outcomes: [], running: true });
      setConsoleOpen(true);
      setCaseIdx(0);
      setMobile('code');
      const report = await runProblem(p, lang, code, indices, (outcomes) =>
        setResults((r) => (r && r.running ? { ...r, outcomes } : r)),
      );
      setResults({ kind, indices, outcomes: report.results, compileError: report.compileError, stdout: report.stdout, running: false });
      const firstBad = report.results.findIndex((o) => o.status !== 'pass');
      setCaseIdx(firstBad >= 0 ? firstBad : 0);
      if (kind === 'submit') {
        const passed = report.results.filter((o) => o.status === 'pass').length;
        const total = p.tests.length;
        recordAttempt(p.id, {
          at: new Date().toISOString(),
          lang,
          passed: report.compileError ? 0 : passed,
          total,
          sec: elapsed,
          assisted,
          mode,
        });
        if (!report.compileError && passed === total && !solvedNow) {
          setSolvedNow(true);
          setRateOpen(true);
        }
      }
    },
    [results?.running, p, lang, code, elapsed, assisted, mode, solvedNow],
  );

  const setLang = (l: Lang) => updateSettings({ lang: l });

  const resetCode = () => {
    if (!confirm('Replace your code with the starter template?')) return;
    setCodes((c) => ({ ...c, [lang]: p.starter[lang] }));
    storage.remove(draftKey(p.id, lang));
  };

  const reveal = (what: 'hint' | 'solution') => {
    if (!solvedNow && !assisted) setAssisted(true);
    if (what === 'hint') setHintsShown((n) => Math.min(p.hints.length, n + 1));
  };

  const problems = allProblems();
  const idx = problems.findIndex((x) => x.id === p.id);
  const prev = problems[idx - 1];
  const next = problems[idx + 1];

  return (
    <div className="workspace" data-mobile={mobile}>
      <section className="ws-pane ws-left">
        <div className="ws-head">
          <div className="tabs" role="tablist">
            {(
              [
                ['description', 'Description'],
                ['hints', `Hints${p.hints.length ? ` (${p.hints.length})` : ''}`],
                ['solution', 'Solution'],
                ['notes', 'Notes'],
                ['history', 'History'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="spacer" />
          <div className="tabs mobile-tabs">
            <button className="on" onClick={() => setMobile('code')}>
              Code <Icon name="right" size={14} />
            </button>
          </div>
        </div>
        <div className="ws-body">
          {tab === 'description' && (
            <>
              <div className="row" style={{ marginBottom: 6 }}>
                <a href="#/problems" className="small muted">
                  ← Problems
                </a>
                <div className="spacer" />
                <button className="icon-btn" disabled={!prev} onClick={() => prev && navigate(`/problems/${prev.id}`)} aria-label="Previous problem">
                  <Icon name="left" />
                </button>
                <button className="icon-btn" disabled={!next} onClick={() => next && navigate(`/problems/${next.id}`)} aria-label="Next problem">
                  <Icon name="right" />
                </button>
              </div>
              <h1 className="ws-title">{p.title}</h1>
              <div className="row" style={{ marginBottom: 16 }}>
                <DifficultyPill d={p.difficulty} />
                <a className="pill" href={`#/problems?topic=${encodeURIComponent(p.topic)}`}>
                  {p.topic}
                </a>
                {p.tags.map((t) => (
                  <span key={t} className="pill">
                    {t}
                  </span>
                ))}
                {prog?.status === 'solved' && <span className="pill accent">Solved</span>}
                {mode === 'review' && <span className="pill accent">Review</span>}
                {mode === 'mock' && <span className="pill accent">Mock interview</span>}
                <button
                  className={`icon-btn ${prog?.starred ? '' : 'faint'}`}
                  style={prog?.starred ? { color: 'var(--medium)' } : undefined}
                  onClick={() => setProblemField(p.id, { starred: !prog?.starred })}
                  aria-label={prog?.starred ? 'Unstar' : 'Star'}
                  title="Star for later"
                >
                  <Icon name="star" />
                </button>
              </div>
              {mode === 'review' && (
                <div className="callout" style={{ marginBottom: 14 }}>
                  Solve it again from a blank editor. When you pass, rate how it felt; that sets the next review date.
                </div>
              )}
              {mode === 'mock' && (
                <div className="callout" style={{ marginBottom: 14 }}>
                  Mock interview: you have {TARGET_MIN[p.difficulty]} minutes. Hints and the solution unlock when time runs out. Talk
                  through your approach out loud before coding.
                </div>
              )}
              <Markdown text={p.description} />
              {p.tests.slice(0, p.examples).map((t, i) => (
                <Example key={i} p={p} t={t} n={i + 1} />
              ))}
            </>
          )}

          {tab === 'hints' &&
            (locked ? (
              <div className="empty">Hints unlock in {formatClock(target - elapsed)}.</div>
            ) : (
              <div>
                {p.hints.slice(0, hintsShown).map((h, i) => (
                  <div key={i} className="hint">
                    <details open>
                      <summary>Hint {i + 1}</summary>
                      <Markdown text={h} />
                    </details>
                  </div>
                ))}
                {hintsShown < p.hints.length ? (
                  <button className="btn" onClick={() => reveal('hint')}>
                    <Icon name="bulb" /> Show hint {hintsShown + 1} of {p.hints.length}
                  </button>
                ) : (
                  <p className="muted small">That's every hint. Still stuck? Check the Solution tab.</p>
                )}
              </div>
            ))}

          {tab === 'solution' && (
            <SolutionTab p={p} lang={lang} locked={locked} lockedFor={target - elapsed} solved={solvedNow || prog?.status === 'solved'} onReveal={() => reveal('solution')} />
          )}

          {tab === 'notes' && (
            <div className="stack">
              <p className="muted small" style={{ margin: 0 }}>
                Private notes: key insight, the mistake you made, the pattern to remember. Saved on this device.
              </p>
              <textarea
                className="textarea"
                rows={14}
                defaultValue={prog?.notes ?? ''}
                placeholder="e.g. Complement lookup in a hash map. Check before inserting, so an element never pairs with itself."
                onBlur={(e) => setProblemField(p.id, { notes: e.target.value })}
                aria-label="Notes"
              />
            </div>
          )}

          {tab === 'history' && <History p={p} />}
        </div>
      </section>

      <section className="ws-pane ws-right">
        <div className="ws-head">
          <div className="tabs mobile-tabs">
            <button onClick={() => setMobile('problem')} aria-label="Back to the problem">
              <Icon name="left" size={14} /> <span className="btn-label">Problem</span>
            </button>
          </div>
          <select className="select" value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label="Language">
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </select>
          <span
            className={`timer ${elapsed > target ? 'over' : ''}`}
            title={mode === 'mock' ? 'Time remaining' : `Target: ${TARGET_MIN[p.difficulty]} min`}
          >
            {mode === 'mock' ? formatClock(target - elapsed) : formatClock(elapsed)}
          </span>
          <div className="spacer" />
          {runner.status === 'loading' && <span className="small faint runner-msg">{runner.message || 'Starting…'}</span>}
          {runner.status === 'error' && (
            <span className="small runner-msg" style={{ color: 'var(--fail)' }}>
              {runner.message}
            </span>
          )}
          <button className="btn ghost small" onClick={resetCode} title="Reset to starter code">
            <Icon name="reset" />
          </button>
          {results?.running ? (
            <button className="btn" onClick={() => runners[lang].cancel()} aria-label="Stop">
              <Icon name="stop" /> <span className="btn-label">Stop</span>
            </button>
          ) : (
            <button className="btn" onClick={() => execute('run')} title="Run the examples (Ctrl/⌘ + Enter)" aria-label="Run">
              <Icon name="play" /> <span className="btn-label">Run</span>
            </button>
          )}
          <button
            className="btn primary"
            onClick={() => execute('submit')}
            disabled={results?.running}
            title="Run all tests (Ctrl/⌘ + Shift + Enter)"
            aria-label="Submit"
          >
            <Icon name="send" /> <span className="btn-label">Submit</span>
          </button>
        </div>
        <div className="editor-wrap">
          <CodeEditor
            value={code}
            onChange={onChange}
            lang={lang}
            fontSize={s.settings.fontSize}
            onRun={() => execute('run')}
            onSubmit={() => execute('submit')}
          />
        </div>
        <ResultsPanel
          p={p}
          results={results}
          open={consoleOpen}
          setOpen={setConsoleOpen}
          caseIdx={caseIdx}
          setCaseIdx={setCaseIdx}
          solved={solvedNow}
          elapsed={elapsed}
          onRate={() => setRateOpen(true)}
          rated={!!prog?.attempts.at(-1)?.rating && solvedNow}
        />
      </section>

      {rateOpen && <RateModal p={p} elapsed={elapsed} assisted={assisted} onDone={() => setRateOpen(false)} isReview={mode === 'review'} />}
    </div>
  );
}

function SolutionTab({
  p,
  lang,
  locked,
  lockedFor,
  solved,
  onReveal,
}: {
  p: Problem;
  lang: Lang;
  locked: boolean;
  lockedFor: number;
  solved: boolean;
  onReveal: () => void;
}) {
  const [shown, setShown] = useState(solved);
  const [solLang, setSolLang] = useState<Lang>(lang);
  if (locked) return <div className="empty">The solution unlocks in {formatClock(lockedFor)}.</div>;
  if (!shown)
    return (
      <div className="empty">
        <p>Struggle a little first: a hint is often enough.</p>
        <p className="small">Revealing the solution before you pass marks this attempt as assisted.</p>
        <button
          className="btn"
          onClick={() => {
            onReveal();
            setShown(true);
          }}
        >
          <Icon name="eye" /> Reveal solution
        </button>
      </div>
    );
  return (
    <div>
      <Markdown text={p.explanation} />
      {(p.time || p.space) && (
        <div className="row small" style={{ margin: '12px 0' }}>
          {p.time && (
            <span className="pill">
              Time&nbsp;<b>{p.time}</b>
            </span>
          )}
          {p.space && (
            <span className="pill">
              Space&nbsp;<b>{p.space}</b>
            </span>
          )}
        </div>
      )}
      <div className="seg" style={{ marginTop: 8 }}>
        {LANGS.filter((l) => p.solutions[l]).map((l) => (
          <button key={l} className={solLang === l ? 'on' : ''} onClick={() => setSolLang(l)}>
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>
      {p.solutions[solLang] && <CodeView code={p.solutions[solLang]!} lang={solLang} />}
    </div>
  );
}

function History({ p }: { p: Problem }) {
  const s = useAppState();
  const prog = s.problems[p.id];
  const today = todayStr();
  if (!prog?.attempts.length) return <div className="empty">No submissions yet.</div>;
  return (
    <div className="stack">
      {prog.srs && (
        <div className="callout">
          Next review <b>{dueLabel(prog.srs, today)}</b> (every {prog.srs.interval} day{prog.srs.interval === 1 ? '' : 's'} right now).
          {prog.bestSec ? ` Best unassisted time: ${formatDuration(prog.bestSec)}.` : ''}
        </div>
      )}
      <div className="plist">
        {[...prog.attempts].reverse().map((a, i) => (
          <div key={i} className="plist-row" style={{ gridTemplateColumns: '26px minmax(0,1fr) auto' }}>
            <span className={`status-icon ${a.passed === a.total ? 'solved' : ''}`} style={a.passed === a.total ? undefined : { color: 'var(--fail)' }}>
              <Icon name={a.passed === a.total ? 'check' : 'x'} />
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                {a.passed === a.total ? 'Accepted' : `${a.passed}/${a.total} tests passed`}
                {a.rating && <span className="pill" style={{ marginLeft: 8 }}>{a.rating}</span>}
                {a.assisted && <span className="pill" style={{ marginLeft: 6 }}>assisted</span>}
              </div>
              <div className="small faint">
                {new Date(a.at).toLocaleString()} · {LANG_LABEL[a.lang]} · {formatDuration(a.sec)}
                {a.mode && a.mode !== 'practice' ? ` · ${a.mode}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsPanel({
  p,
  results,
  open,
  setOpen,
  caseIdx,
  setCaseIdx,
  solved,
  elapsed,
  onRate,
  rated,
}: {
  p: Problem;
  results: Results | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  caseIdx: number;
  setCaseIdx: (i: number) => void;
  solved: boolean;
  elapsed: number;
  onRate: () => void;
  rated: boolean;
}) {
  const header = (
    <div className="ws-head" style={{ minHeight: 40, padding: '4px 12px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <strong className="small">Test results</strong>
      <span className="small faint kbd-hint">
        Run: examples · Submit: all {p.tests.length} tests · <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd> runs
      </span>
      <div className="spacer" />
      <Icon name={open ? 'down' : 'up'} size={16} />
    </div>
  );
  if (!open) return <div className="console collapsed">{header}</div>;

  let body;
  if (!results) {
    body = <div className="muted small">Press Run to try the examples, or Submit to run every test.</div>;
  } else if (results.compileError) {
    body = (
      <>
        <div className="verdict fail">{results.compileError.includes('SyntaxError') ? 'Syntax error' : 'Error'}</div>
        <div className="error-box">{results.compileError}</div>
        {results.stdout && (
          <>
            <div className="io-label">Stdout</div>
            <div className="io">{results.stdout}</div>
          </>
        )}
      </>
    );
  } else {
    const outs = results.outcomes;
    const done = outs.filter(Boolean) as TestOutcome[];
    const passed = done.filter((o) => o.status === 'pass').length;
    const total = results.indices.length;
    const firstBad = done.find((o) => o.status !== 'pass');
    const allPass = !results.running && passed === total;
    const cur = outs[caseIdx];
    const test = p.tests[results.indices[caseIdx]];
    const hidden = results.kind === 'submit' && results.indices[caseIdx] >= p.examples;
    const totalMs = done.reduce((a, o) => a + o.ms, 0);

    body = (
      <>
        <div className="row">
          {results.running ? (
            <div className="verdict">
              Running… {done.length}/{total}
            </div>
          ) : allPass ? (
            <div className="verdict pass">{results.kind === 'submit' ? 'Accepted' : 'Examples pass'}</div>
          ) : (
            <div className="verdict fail">
              {firstBad?.status === 'timeout'
                ? 'Time Limit Exceeded'
                : firstBad?.status === 'error'
                  ? 'Runtime Error'
                  : firstBad?.status === 'skipped'
                    ? 'Stopped'
                    : 'Wrong Answer'}
            </div>
          )}
          <span className="muted small">
            {passed}/{total} passed{done.length ? ` · ${totalMs < 1 ? '<1' : Math.round(totalMs)} ms` : ''}
          </span>
          <div className="spacer" />
          {allPass && results.kind === 'run' && <span className="small muted">Now Submit to run the full test set.</span>}
          {allPass && results.kind === 'submit' && solved && (
            <>
              <span className="small muted">Solved in {formatDuration(elapsed)}</span>
              {!rated && (
                <button className="btn primary small" onClick={onRate}>
                  Rate &amp; schedule review
                </button>
              )}
            </>
          )}
        </div>
        <div className="case-tabs">
          {results.indices.map((ti, i) => {
            const o = outs[i];
            return (
              <button key={ti} className={`case-tab ${o?.status ?? ''} ${i === caseIdx ? 'on' : ''}`} onClick={() => setCaseIdx(i)}>
                <span className="dot" />
                {results.kind === 'submit' && ti >= p.examples ? `Test ${ti + 1}` : `Case ${ti + 1}`}
              </button>
            );
          })}
        </div>
        {cur && (
          <div>
            {hidden && cur.status === 'pass' ? null : (
              <>
                <div className="io-label">Input</div>
                <div className="io">{formatInput(p, test)}</div>
              </>
            )}
            {(cur.status === 'error' || cur.status === 'timeout') && <div className="error-box">{cur.error}</div>}
            {cur.status === 'skipped' && <div className="muted small">Not run.</div>}
            {(cur.status === 'pass' || cur.status === 'fail') && (
              <div className="grid cols-2" style={{ gap: 10 }}>
                <div>
                  <div className="io-label">Output</div>
                  <div className={`io ${cur.status === 'fail' ? 'bad' : 'good'}`}>{fmt(cur.output)}</div>
                </div>
                <div>
                  <div className="io-label">Expected</div>
                  <div className="io">{fmt(test.out)}</div>
                </div>
              </div>
            )}
            {cur.status === 'fail' && p.compare !== 'exact' && (
              <div className="small faint" style={{ marginTop: 6 }}>
                {p.compare === 'float' ? 'Answers within 1e-5 are accepted.' : 'Any order is accepted.'}
              </div>
            )}
            {cur.stdout && (
              <>
                <div className="io-label">Stdout</div>
                <div className="io">{cur.stdout}</div>
              </>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="console">
      {header}
      <div className="console-body">{body}</div>
    </div>
  );
}

const RATING_LABEL: Record<Rating, [string, string]> = {
  again: ['Again', 'Needed the solution'],
  hard: ['Hard', 'Struggled'],
  good: ['Good', 'Some thinking'],
  easy: ['Easy', 'Instant'],
};

function RateModal({ p, elapsed, assisted, onDone, isReview }: { p: Problem; elapsed: number; assisted: boolean; onDone: () => void; isReview: boolean }) {
  const s = useAppState();
  const prog = s.problems[p.id];
  const today = todayStr();
  const preview = useMemo(() => Object.fromEntries(RATINGS.map((r) => [r, schedule(prog?.srs, r, today, 'problem').interval])), [prog?.srs, today]);
  const choose = (r: Rating) => {
    rateProblem(p.id, r, isReview);
    onDone();
  };
  return (
    <Modal label="Rate this problem" onClose={onDone}>
      <h2 style={{ marginBottom: 4 }}>Accepted in {formatDuration(elapsed)}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        How did {p.title} feel? Your answer decides when it comes back for review.
        {assisted ? ' You used hints or the solution, so "Again" or "Hard" is probably honest.' : ''}
      </p>
      <div className="rating-grid">
        {RATINGS.map((r) => (
          <button key={r} onClick={() => choose(r)}>
            {RATING_LABEL[r][0]}
            <small>{RATING_LABEL[r][1]}</small>
            <small>
              in {preview[r]} day{preview[r] === 1 ? '' : 's'}
            </small>
          </button>
        ))}
      </div>
    </Modal>
  );
}
