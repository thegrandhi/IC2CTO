import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { ConfirmButton, ProgressBar } from '../components/ui';
import { DESIGN_STEPS, type DesignPrompt } from '../lib/content/designs';
import {
  checkPath,
  isDone,
  scoreItem,
  type AskItem,
  type ChoiceItem,
  type InterviewAnswer,
  type InterviewItem,
  type PathItem,
  type PickItem,
} from '../lib/content/interview';
import { seededShuffle } from '../lib/content/quiz';
import { attemptScore, interviewDraftKey, recordDesign, storage, useAppState } from '../lib/store';

interface Draft {
  answers: Record<string, InterviewAnswer>;
  /** Index of the item in play. Everything before it is answered. Equal to the item count when finished. */
  current: number;
  /** Active seconds spent, for the session history. */
  seconds: number;
}

const newDraft = (): Draft => ({ answers: {}, current: 0, seconds: 0 });

function loadDraft(id: string): Draft | null {
  const raw = storage.get(interviewDraftKey(id));
  if (!raw) return null;
  try {
    return { ...newDraft(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

const stepTitle = (key: string) => DESIGN_STEPS.find((s) => s.key === key)?.title ?? key;
const pct = (x: number) => Math.round(x * 100);

function tone(score: number): 'pass' | 'warn' | 'fail' {
  return score >= 1 ? 'pass' : score >= 0.5 ? 'warn' : 'fail';
}

function verdict(item: InterviewItem, score: number): string {
  if (item.type === 'ask') return score >= 1 ? 'Great questions' : score >= 0.5 ? 'Good start' : 'You missed the important ones';
  return score >= 1 ? 'Strong answer' : score >= 0.5 ? 'Partly there' : 'Not quite';
}

/** A short label for an item on the scorecard: its question, or else its first clause. */
function summary(text: string): string {
  const plain = text.replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim();
  const sentences = plain.match(/[^.?!]+[.?!]?/g)?.map((x) => x.trim()) ?? [plain];
  const label = sentences.find((x) => x.endsWith('?')) ?? sentences[0].split(':')[0];
  return label.length > 90 ? `${label.slice(0, 88)}…` : label;
}

export function DesignInterview({ design, items }: { design: DesignPrompt; items: InterviewItem[] }) {
  const s = useAppState();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(design.id) ?? newDraft());
  const [focus, setFocus] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; best: number | null } | null>(null);
  const seconds = useRef(draft.seconds);
  const finished = draft.current >= items.length;
  const active = finished ? undefined : items[draft.current];

  // Count active time while the interview is open and visible.
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') seconds.current++;
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  useEffect(() => {
    // Only save once something is answered, so opening a prompt doesn't mark it "in progress".
    if (finished || (!draft.current && !Object.keys(draft.answers).length)) return;
    storage.set(interviewDraftKey(design.id), JSON.stringify({ ...draft, seconds: seconds.current }));
  }, [draft, finished, design.id]);

  useEffect(() => {
    if (!focus) return;
    document.querySelector(`[data-focus="${focus}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focus]);

  const answer = (item: InterviewItem, a: InterviewAnswer) => {
    setDraft((d) => ({ ...d, answers: { ...d.answers, [item.id]: a } }));
    setFocus(isDone(a) ? `${item.id}:feedback` : `${item.id}:last`);
  };

  const next = () => {
    const current = draft.current + 1;
    setDraft((d) => ({ ...d, current }));
    if (current < items.length) {
      setFocus(`${items[current].id}:start`);
      return;
    }
    // Finished: record the session once and drop the draft.
    const scores = items.map((it) => scoreItem(it, draft.answers[it.id]));
    const score = scores.reduce((a, b) => a + b, 0) / items.length;
    const past = s.designs[design.id] ?? [];
    setResult({ score, best: past.length ? Math.max(...past.map(attemptScore)) : null });
    recordDesign(design.id, {
      at: new Date().toISOString(),
      checked: scores.flatMap((x, i) => (x >= 1 ? [i] : [])),
      total: items.length,
      minutes: Math.max(1, Math.round(seconds.current / 60)),
      mode: 'guided',
      score,
    });
    storage.remove(interviewDraftKey(design.id));
    setFocus('scorecard');
  };

  const restart = () => {
    storage.remove(interviewDraftKey(design.id));
    seconds.current = 0;
    setResult(null);
    setDraft(newDraft());
    window.scrollTo(0, 0);
  };

  const doneCount = items.filter((it) => isDone(draft.answers[it.id])).length;
  const shown = items.slice(0, Math.min(draft.current + 1, items.length));

  return (
    <>
      <div className="interview-bar">
        <div className="row">
          <strong>{finished ? 'Interview complete' : stepTitle(active!.step)}</strong>
          <span className="small faint">
            {doneCount}/{items.length}
          </span>
          <div className="spacer" />
          <ConfirmButton className="btn ghost small" onConfirm={restart} title="Start over" confirmLabel="Start over?">
            <Icon name="reset" size={16} />
          </ConfirmButton>
        </div>
        <ProgressBar value={doneCount} max={items.length} />
      </div>

      <div className="chat">
        <Bubble>
          <p>
            <strong>Interviewer:</strong> Thanks for joining. Today: <strong>{design.title.replace(/^Design an? /, '')}</strong>.
          </p>
          <Markdown text={design.prompt} />
        </Bubble>

        {shown.map((item, i) => (
          <Fragment key={item.id}>
            {(i === 0 || items[i - 1].step !== item.step) && (
              <div className="chat-step">
                <span>
                  {DESIGN_STEPS.findIndex((st) => st.key === item.step) + 1}. {stepTitle(item.step)}
                </span>
              </div>
            )}
            <div data-focus={`${item.id}:start`} className="focus-anchor" />
            {item.intro && (
              <Bubble>
                <Markdown text={item.intro} />
              </Bubble>
            )}
            <Bubble>
              <Markdown text={item.prompt} />
            </Bubble>
            <Exchange
              item={item}
              answer={draft.answers[item.id]}
              active={item === active}
              seed={`${design.id}:${item.id}`}
              onAnswer={(a) => answer(item, a)}
            />
          </Fragment>
        ))}

        {active && isDone(draft.answers[active.id]) && (
          <div className="chat-actions">
            <button className="btn primary big" onClick={next}>
              {draft.current === items.length - 1 ? 'Finish interview' : 'Continue'} <Icon name="right" />
            </button>
          </div>
        )}

        {finished && (
          <>
            <Bubble>That's time. Thanks, this was a good conversation. Here's how you did.</Bubble>
            <Scorecard design={design} items={items} answers={draft.answers} result={result} onRestart={restart} />
          </>
        )}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ chat pieces

function Bubble({ me, tone: t, children, focus }: { me?: boolean; tone?: string; children: ReactNode; focus?: string }) {
  return (
    <div className={`msg ${me ? 'me' : 'them'}`} data-focus={focus}>
      {!me && (
        <span className="avatar" aria-hidden="true">
          <Icon name="design" size={16} />
        </span>
      )}
      <div className={`bubble ${t ?? ''}`}>{children}</div>
    </div>
  );
}

function Feedback({ item, score, children }: { item: InterviewItem; score: number; children: ReactNode }) {
  return (
    <Bubble tone={tone(score)} focus={`${item.id}:feedback`}>
      <div className={`verdict ${tone(score)}`}>{verdict(item, score)}</div>
      {children}
      <div className="why">
        <Markdown text={item.explanation} />
      </div>
    </Bubble>
  );
}

interface ExchangeProps<T extends InterviewItem> {
  item: T;
  answer: InterviewAnswer | undefined;
  active: boolean;
  seed: string;
  onAnswer: (a: InterviewAnswer) => void;
}

function Exchange(props: ExchangeProps<InterviewItem>) {
  const { item } = props;
  if (item.type === 'ask') return <AskExchange {...(props as ExchangeProps<AskItem>)} />;
  if (item.type === 'pick') return <PickExchange {...(props as ExchangeProps<PickItem>)} />;
  if (item.type === 'choice') return <ChoiceExchange {...(props as ExchangeProps<ChoiceItem>)} />;
  return <PathExchange {...(props as ExchangeProps<PathItem>)} />;
}

// ------------------------------------------------------------------ clarifying questions

function AskExchange({ item, answer, active, seed, onAnswer }: ExchangeProps<AskItem>) {
  const a = answer?.type === 'ask' ? answer : { type: 'ask' as const, asked: [] as number[], done: false };
  const order = useMemo(() => seededShuffle(item.questions.map((_, i) => i), seed), [item, seed]);
  const left = item.budget - a.asked.length;
  const ask = (q: number) => {
    const asked = [...a.asked, q];
    onAnswer({ type: 'ask', asked, done: asked.length >= item.budget });
  };
  const score = scoreItem(item, a);
  const missed = item.questions.filter((q, i) => q.weight === 'key' && !a.asked.includes(i));
  const weak = a.asked.map((i) => item.questions[i]).filter((q) => q.weight === 'weak');

  return (
    <>
      {a.asked.map((qi, n) => (
        <Fragment key={qi}>
          <Bubble me>{item.questions[qi].text}</Bubble>
          <Bubble focus={n === a.asked.length - 1 ? `${item.id}:last` : undefined}>
            <Markdown inline text={item.questions[qi].answer} />
          </Bubble>
        </Fragment>
      ))}
      {active && !a.done && (
        <div className="chat-input">
          <div className="small faint">
            {left} question{left === 1 ? '' : 's'} left. Tap one to ask it.
          </div>
          <div className="options">
            {order
              .filter((i) => !a.asked.includes(i))
              .map((i) => (
                <button key={i} className="option" onClick={() => ask(i)}>
                  <Icon name="send" size={16} />
                  <span>{item.questions[i].text}</span>
                </button>
              ))}
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn" onClick={() => onAnswer({ ...a, done: true })}>
              {a.asked.length ? "That's all my questions" : 'Skip questions'}
            </button>
          </div>
        </div>
      )}
      {a.done && (
        <Feedback item={item} score={score}>
          <p>
            You asked {item.questions.filter((q, i) => q.weight === 'key' && a.asked.includes(i)).length} of {item.questions.filter((q) => q.weight === 'key').length}{' '}
            key questions.
          </p>
          {missed.length > 0 && (
            <>
              <div className="io-label">Worth asking</div>
              <ul className="note-list">
                {missed.map((q) => (
                  <li key={q.text}>
                    <strong>{q.text}</strong>
                    <div className="muted">
                      <Markdown inline text={q.answer} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {weak.length > 0 && (
            <>
              <div className="io-label">Didn't change the design</div>
              <ul className="note-list">
                {weak.map((q) => (
                  <li key={q.text}>{q.text}</li>
                ))}
              </ul>
            </>
          )}
        </Feedback>
      )}
    </>
  );
}

// ------------------------------------------------------------------ select all that apply

function PickExchange({ item, answer, active, seed, onAnswer }: ExchangeProps<PickItem>) {
  const order = useMemo(() => seededShuffle(item.options.map((_, i) => i), seed), [item, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const a = answer?.type === 'pick' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <div className="chat-input">
        <div className="small faint">Select all that apply.</div>
        <div className="options">
          {order.map((i) => {
            const on = picked.includes(i);
            return (
              <button
                key={i}
                className={`option ${on ? 'selected' : ''}`}
                aria-pressed={on}
                onClick={() => setPicked(on ? picked.filter((x) => x !== i) : [...picked, i])}
              >
                <span className="key">{on && <Icon name="check" size={14} />}</span>
                <Markdown inline text={item.options[i].text} />
              </button>
            );
          })}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn primary" disabled={!picked.length} onClick={() => onAnswer({ type: 'pick', picked })}>
            Answer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Bubble me>
        <ul className="me-list">
          {order
            .filter((i) => a.picked.includes(i))
            .map((i) => (
              <li key={i}>
                <Markdown inline text={item.options[i].text} />
              </li>
            ))}
        </ul>
      </Bubble>
      <Feedback item={item} score={scoreItem(item, a)}>
        <ul className="marks">
          {order.map((i) => {
            const o = item.options[i];
            const picked = a.picked.includes(i);
            const right = o.correct === picked;
            const label = right ? (picked ? 'You picked it' : 'You left it out') : o.correct ? 'Should be picked' : "Shouldn't be picked";
            return (
              <li key={i} className={right ? 'right' : 'wrong'}>
                <Icon name={right ? 'check' : 'x'} size={16} />
                <div>
                  <Markdown inline text={o.text} /> <span className="mark-label">{label}</span>
                  <div className="muted small">
                    <Markdown inline text={o.note} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Feedback>
    </>
  );
}

// ------------------------------------------------------------------ one right answer

function ChoiceExchange({ item, answer, active, onAnswer }: ExchangeProps<ChoiceItem>) {
  const [choice, setChoice] = useState<number | null>(null);
  const a = answer?.type === 'choice' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <div className="chat-input">
        <div className="options">
          {item.options.map((o, i) => (
            <button key={i} className={`option ${choice === i ? 'selected' : ''}`} aria-pressed={choice === i} onClick={() => setChoice(i)}>
              <span className="key">{String.fromCharCode(65 + i)}</span>
              <Markdown inline text={o.text} />
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn primary" disabled={choice === null} onClick={() => onAnswer({ type: 'choice', choice: choice! })}>
            Answer
          </button>
        </div>
      </div>
    );
  }

  const chosen = item.options[a.choice];
  const best = item.options.find((o) => o.correct)!;
  const score = scoreItem(item, a);
  return (
    <>
      <Bubble me>
        <Markdown inline text={chosen.text} />
      </Bubble>
      <Feedback item={item} score={score}>
        <p>
          <Markdown inline text={chosen.note} />
        </p>
        {!chosen.correct && (
          <div className="better">
            <div className="io-label">Better answer</div>
            <strong>
              <Markdown inline text={best.text} />
            </strong>
            <div className="muted">
              <Markdown inline text={best.note} />
            </div>
          </div>
        )}
      </Feedback>
    </>
  );
}

// ------------------------------------------------------------------ build a request path

function PathExchange({ item, answer, active, seed, onAnswer }: ExchangeProps<PathItem>) {
  const palette = useMemo(() => seededShuffle([...item.steps.map((st) => st.text), ...item.extras.map((x) => x.text)], seed), [item, seed]);
  const [path, setPath] = useState<string[]>([]);
  const a = answer?.type === 'path' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <div className="chat-input">
        <div className="path-chain" aria-label="Your path">
          {path.length ? (
            path.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && <Icon name="right" size={14} />}
                <button className="path-node" onClick={() => setPath(path.filter((x) => x !== p))} aria-label={`Remove ${p}`}>
                  {p}
                  <Icon name="x" size={12} />
                </button>
              </Fragment>
            ))
          ) : (
            <span className="faint small">Tap components below, in order. Tap one up here to remove it.</span>
          )}
        </div>
        <div className="chips">
          {palette
            .filter((p) => !path.includes(p))
            .map((p) => (
              <button key={p} className="chip comp" onClick={() => setPath([...path, p])}>
                {p}
              </button>
            ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn ghost" disabled={!path.length} onClick={() => setPath(path.slice(0, -1))}>
            Undo
          </button>
          <div className="spacer" />
          <button className="btn primary" disabled={path.length < 2} onClick={() => onAnswer({ type: 'path', path })}>
            Answer
          </button>
        </div>
      </div>
    );
  }

  const check = checkPath(item, a.path);
  return (
    <>
      <Bubble me>
        <span className="path-text">{a.path.join(' → ')}</span>
      </Bubble>
      <Feedback item={item} score={scoreItem(item, a)}>
        {check.misordered && !check.missing.length && !check.wrong.length && <p>Right components, wrong order.</p>}
        <div className="io-label">Reference path</div>
        <div className="path-chain ref">
          {item.steps.map((st, i) => {
            const had = a.path.includes(st.text);
            return (
              <Fragment key={st.text}>
                {i > 0 && <Icon name="right" size={14} />}
                <span className={`path-node ${had ? 'had' : st.optional ? 'optional' : 'missing'}`}>
                  {st.text}
                  {st.optional && <em> optional</em>}
                </span>
              </Fragment>
            );
          })}
        </div>
        {check.missing.length > 0 && (
          <p className="small">
            <strong>Missing:</strong> {check.missing.join(', ')}.
          </p>
        )}
        {check.wrong.length > 0 && (
          <>
            <div className="io-label">Not on this path</div>
            <ul className="note-list">
              {check.wrong.map((w) => (
                <li key={w}>
                  <strong>{w}</strong>
                  <div className="muted">
                    <Markdown inline text={item.extras.find((x) => x.text === w)?.note ?? ''} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Feedback>
    </>
  );
}

// ------------------------------------------------------------------ results

function Scorecard({
  design,
  items,
  answers,
  result,
  onRestart,
}: {
  design: DesignPrompt;
  items: InterviewItem[];
  answers: Record<string, InterviewAnswer>;
  result: { score: number; best: number | null } | null;
  onRestart: () => void;
}) {
  const scores = items.map((it) => (answers[it.id] ? scoreItem(it, answers[it.id]) : 0));
  const total = result?.score ?? scores.reduce((a, b) => a + b, 0) / items.length;
  const steps = DESIGN_STEPS.map((st) => {
    const idx = items.flatMap((it, i) => (it.step === st.key ? [i] : []));
    return { step: st, count: idx.length, score: idx.length ? idx.reduce((a, i) => a + scores[i], 0) / idx.length : 0 };
  }).filter((x) => x.count);
  const review = items.filter((_, i) => scores[i] < 1);

  return (
    <div className="card interview-score" data-focus="scorecard">
      <div className="small faint">{design.title}</div>
      <div className="score-big">{pct(total)}%</div>
      <p className="muted" style={{ marginTop: 0 }}>
        {scores.filter((x) => x >= 1).length} of {items.length} answers fully right.
        {result?.best != null && ` Your previous best was ${pct(result.best)}%.`}
      </p>

      {steps.map(({ step, score }) => (
        <div key={step.key} className="topic-row">
          <span>{step.title}</span>
          <ProgressBar value={pct(score)} max={100} color={`var(--${tone(score)})`} />
          <span className="count">{pct(score)}%</span>
        </div>
      ))}

      {review.length > 0 && (
        <>
          <div className="io-label" style={{ marginTop: 16 }}>
            Worth another look
          </div>
          <ul className="review-links">
            {review.map((it) => (
              <li key={it.id}>
                <button
                  className="linkish"
                  onClick={() => document.querySelector(`[data-focus="${it.id}:start"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  {stepTitle(it.step)}: {summary(it.prompt)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="io-label" style={{ marginTop: 16 }}>
        Reference answer
      </div>
      {DESIGN_STEPS.map((st) => (
        <details key={st.key} className="ref-section">
          <summary>{st.title}</summary>
          <Markdown text={design.reference[st.key]} />
        </details>
      ))}

      <div className="row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={onRestart}>
          <Icon name="reset" /> Try again
        </button>
        <a className="btn" href={`#/design/${design.id}?mode=whiteboard`}>
          <Icon name="design" /> Whiteboard version
        </a>
        <a className="btn ghost" href="#/design">
          All prompts
        </a>
      </div>
    </div>
  );
}
