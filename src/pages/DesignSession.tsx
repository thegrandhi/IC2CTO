import { useEffect, useRef, useState } from 'react';
import { DiagramEditor, EMPTY_DIAGRAM, type Diagram } from '../components/DiagramEditor';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { ConfirmButton, DifficultyPill, formatClock } from '../components/ui';
import { getDesign } from '../lib/content';
import { DESIGN_STEPS, type DesignPrompt } from '../lib/content/designs';
import { designDraftKey, recordDesign, storage, useAppState } from '../lib/store';

interface Draft {
  notes: Record<string, string>;
  diagram: Diagram;
  elapsed: number;
  phase: 'working' | 'review';
  checked: number[];
  step: string;
}

const newDraft = (): Draft => ({ notes: {}, diagram: EMPTY_DIAGRAM, elapsed: 0, phase: 'working', checked: [], step: DESIGN_STEPS[0].key });

function loadDraft(id: string): Draft | null {
  const raw = storage.get(designDraftKey(id));
  if (!raw) return null;
  try {
    return { ...newDraft(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function DesignSession({ id }: { id: string }) {
  const design = getDesign(id);
  if (!design) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Design prompt not found</h2>
          <a href="#/design">All prompts</a>
        </div>
      </div>
    );
  }
  return <Session design={design} />;
}

function Session({ design }: { design: DesignPrompt }) {
  const s = useAppState();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(design.id) ?? newDraft());
  const [running, setRunning] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [saved, setSaved] = useState(false);
  const total = design.minutes * 60;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => storage.set(designDraftKey(design.id), JSON.stringify(draft)), 500);
    return () => clearTimeout(saveTimer.current);
  }, [draft, design.id]);

  useEffect(() => {
    if (!running || draft.phase !== 'working') return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setDraft((d) => ({ ...d, elapsed: d.elapsed + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [running, draft.phase]);

  // Which step the clock says you should be on.
  const scale = total / (DESIGN_STEPS.reduce((a, st) => a + st.minutes, 0) * 60);
  let acc = 0;
  let clockStep = DESIGN_STEPS[DESIGN_STEPS.length - 1].key;
  for (const st of DESIGN_STEPS) {
    acc += st.minutes * 60 * scale;
    if (draft.elapsed < acc) {
      clockStep = st.key;
      break;
    }
  }

  const step = DESIGN_STEPS.find((st) => st.key === draft.step) ?? DESIGN_STEPS[0];
  const stepIdx = DESIGN_STEPS.indexOf(step);
  const showDiagram = step.key === 'high-level design' || step.key === 'deep dives';
  const review = draft.phase === 'review';
  const score = draft.checked.length;

  const finish = () => {
    setRunning(false);
    patch({ phase: 'review', step: DESIGN_STEPS[0].key });
    window.scrollTo(0, 0);
  };

  const save = () => {
    recordDesign(design.id, { at: new Date().toISOString(), checked: draft.checked, total: design.rubric.length, minutes: Math.round(draft.elapsed / 60) });
    storage.remove(designDraftKey(design.id));
    setSaved(true);
  };

  const restart = () => {
    storage.remove(designDraftKey(design.id));
    setDraft(newDraft());
    setRunning(false);
    setSaved(false);
  };

  const past = s.designs[design.id] ?? [];

  if (saved) {
    return (
      <div className="page narrow">
        <div className="card stack" style={{ padding: 28 }}>
          <div className="small faint">{design.title}</div>
          <h1 style={{ margin: 0 }}>
            Session saved: {Math.round((score / design.rubric.length) * 100)}%
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            You covered {score} of {design.rubric.length} rubric points in {Math.round(draft.elapsed / 60)} minutes.
            {past.length > 1 && ` Previous best: ${Math.max(...past.slice(0, -1).map((a) => Math.round((a.checked.length / a.total) * 100)))}%.`} Try
            this prompt again in a week, from scratch.
          </p>
          <div className="row">
            <a className="btn primary" href="#/design">
              All prompts
            </a>
            <a className="btn" href="#/">
              Today
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <a href="#/design" className="small muted">
          ← System design
        </a>
      </div>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <h1>{design.title}</h1>
          <div className="row" style={{ marginTop: 6 }}>
            <DifficultyPill d={design.difficulty} />
            {design.tags.map((t) => (
              <span key={t} className="pill">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="row">
          {!review ? (
            <>
              <span className={`timer ${draft.elapsed > total ? 'over' : ''}`} style={{ fontSize: '1.1rem' }} onClick={() => setRunning(!running)}>
                {formatClock(total - draft.elapsed)}
              </span>
              <button className="btn" onClick={() => setRunning(!running)}>
                <Icon name={running ? 'stop' : 'play'} /> {running ? 'Pause' : draft.elapsed ? 'Resume' : 'Start clock'}
              </button>
              <button className="btn primary" onClick={finish}>
                <Icon name="check" /> Finish &amp; review
              </button>
            </>
          ) : (
            <>
              <span className="pill accent">
                Score {score}/{design.rubric.length}
              </span>
              <button className="btn primary" onClick={save}>
                Save session
              </button>
            </>
          )}
          <ConfirmButton className="btn ghost" onConfirm={restart} title="Start over" confirmLabel="Discard session?">
            <Icon name="reset" />
          </ConfirmButton>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <Markdown text={design.prompt} />
        {design.clarifying.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button className="btn small ghost" onClick={() => setShowClarify(!showClarify)}>
              <Icon name={showClarify ? 'up' : 'down'} /> Clarifying questions a strong candidate asks
            </button>
            {showClarify && (
              <ul className="small" style={{ marginBottom: 0 }}>
                {design.clarifying.map((c, i) => (
                  <li key={i}>
                    <Markdown inline text={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="design-layout">
        <div className="steps">
          {!review && (
            <div className="phase-bar" title="Time used">
              <span style={{ width: `${Math.min(100, (draft.elapsed / total) * 100)}%` }} />
            </div>
          )}
          {DESIGN_STEPS.map((st, i) => (
            <button
              key={st.key}
              className={`step-btn ${draft.step === st.key ? 'on' : ''} ${draft.notes[st.key]?.trim() ? 'filled' : ''}`}
              onClick={() => patch({ step: st.key })}
            >
              <span className="n">{i + 1}</span>
              <span className="label">{st.title}</span>
              {!review && clockStep === st.key && running ? <span className="mins" style={{ color: 'var(--accent)' }}>now</span> : <span className="mins">{Math.round(st.minutes * scale)}m</span>}
            </button>
          ))}
          {review && (
            <button className={`step-btn ${draft.step === 'rubric' ? 'on' : ''}`} onClick={() => patch({ step: 'rubric' })}>
              <span className="n">✓</span>
              <span className="label">Rubric</span>
            </button>
          )}
        </div>

        <div className="stack" style={{ minWidth: 0 }}>
          {draft.step === 'rubric' && review ? (
            <div className="card">
              <h2>Self-review rubric</h2>
              <p className="muted small">Tick only what you actually covered in your notes or out loud. Be strict with yourself.</p>
              {design.rubric.map((item, i) => (
                <label key={i} className="rubric-item">
                  <input
                    type="checkbox"
                    checked={draft.checked.includes(i)}
                    onChange={(e) => patch({ checked: e.target.checked ? [...draft.checked, i] : draft.checked.filter((x) => x !== i) })}
                  />
                  <Markdown inline text={item} />
                </label>
              ))}
              <div className="row" style={{ marginTop: 12 }}>
                <strong>
                  {score}/{design.rubric.length} · {Math.round((score / design.rubric.length) * 100)}%
                </strong>
                <div className="spacer" />
                <button className="btn primary" onClick={save}>
                  Save session
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="row">
                  <h2 style={{ margin: 0 }}>
                    {stepIdx + 1}. {step.title}
                  </h2>
                  <div className="spacer" />
                  <span className="small faint">~{Math.round(step.minutes * scale)} min</span>
                </div>
                <ul className="small muted" style={{ margin: '8px 0 12px', paddingLeft: 20 }}>
                  {step.guide.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
                <textarea
                  className="textarea"
                  rows={review ? 6 : 12}
                  value={draft.notes[step.key] ?? ''}
                  onChange={(e) => patch({ notes: { ...draft.notes, [step.key]: e.target.value } })}
                  placeholder={review ? 'You left this step empty.' : 'Your notes for this step…'}
                  aria-label={`${step.title} notes`}
                  style={{ fontFamily: 'var(--mono)', fontSize: '0.88rem' }}
                />
              </div>
              {review && (
                <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div className="small faint" style={{ marginBottom: 6, fontWeight: 700 }}>
                    REFERENCE
                  </div>
                  <Markdown text={design.reference[step.key]} />
                </div>
              )}
              {showDiagram && <DiagramEditor value={draft.diagram} onChange={(diagram) => patch({ diagram })} />}
              <div className="row">
                {stepIdx > 0 && (
                  <button className="btn" onClick={() => patch({ step: DESIGN_STEPS[stepIdx - 1].key })}>
                    <Icon name="left" /> {DESIGN_STEPS[stepIdx - 1].title}
                  </button>
                )}
                <div className="spacer" />
                {stepIdx < DESIGN_STEPS.length - 1 ? (
                  <button className="btn" onClick={() => patch({ step: DESIGN_STEPS[stepIdx + 1].key })}>
                    {DESIGN_STEPS[stepIdx + 1].title} <Icon name="right" />
                  </button>
                ) : review ? (
                  <button className="btn primary" onClick={() => patch({ step: 'rubric' })}>
                    Rubric <Icon name="right" />
                  </button>
                ) : (
                  <button className="btn primary" onClick={finish}>
                    Finish &amp; review <Icon name="right" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
