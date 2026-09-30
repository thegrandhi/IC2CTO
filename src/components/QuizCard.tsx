import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { getLesson, getProblem, getQuizCategory } from '../lib/content';
import { seededShuffle, type BlankQuestion, type MatchQuestion, type McqQuestion, type QuizQuestion } from '../lib/content/quiz';
import { Icon } from './Icon';
import { Markdown } from './Markdown';
import { CategoryPill } from './ui';

interface Props {
  q: QuizQuestion;
  /** Called once when the user checks their answer. */
  onAnswer: (correct: boolean) => void;
  /** Rendered after the explanation (e.g. a "Next" button). */
  footer?: ReactNode;
  /** Show the question already answered (e.g. revisiting today's daily question). */
  reveal?: boolean;
}

const TYPE_LABEL = {
  mcq: 'Multiple choice',
  order: 'Put in order',
  match: 'Match the pairs',
  lines: 'Order the code',
  blank: 'Fill in the code',
} as const;

export function QuizCard({ q, onAnswer, footer, reveal = false }: Props) {
  const [checked, setChecked] = useState<null | boolean>(null);
  const cat = getQuizCategory(q.category);
  const lesson = q.lesson ? getLesson(q.lesson) : undefined;
  const problem = q.problem ? getProblem(q.problem) : undefined;
  const check = (correct: boolean) => {
    if (checked !== null) return;
    setChecked(correct);
    onAnswer(correct);
  };
  const showAnswer = checked !== null || reveal;
  const hint =
    q.type === 'mcq'
      ? q.correct.length > 1
        ? 'Select all that apply.'
        : 'Pick one.'
      : q.type === 'order' || q.type === 'lines'
        ? 'Drag, or use the arrows, to reorder.'
        : q.type === 'blank'
          ? 'Tap a token to fill the highlighted gap. Tap a filled gap to clear it.'
          : 'Tap an item on the left, then its partner on the right.';

  return (
    <div className="quiz-card">
      <div className="row">
        {cat && <CategoryPill color={cat.color}>{cat.title}</CategoryPill>}
        <span className="pill">{TYPE_LABEL[q.type]}</span>
      </div>
      <Markdown className="quiz-prompt" text={q.prompt} />
      {!showAnswer && <p className="small faint" style={{ marginTop: -8 }}>{hint}</p>}
      {q.type === 'mcq' && <Mcq q={q} onCheck={check} revealed={showAnswer} />}
      {q.type === 'order' && <Reorder items={q.items} seed={q.id} onCheck={check} revealed={showAnswer} />}
      {q.type === 'lines' && <Reorder items={q.items} seed={q.id} code onCheck={check} revealed={showAnswer} />}
      {q.type === 'blank' && <Blank q={q} onCheck={check} revealed={showAnswer} />}
      {q.type === 'match' && <Match q={q} onCheck={check} revealed={showAnswer} />}
      {showAnswer && (
        <div className="explain">
          {checked !== null && <div className={`verdict ${checked ? 'pass' : 'fail'}`}>{checked ? 'Correct' : 'Not quite'}</div>}
          <Markdown text={q.explanation} />
          {lesson && (
            <a className="row small" style={{ marginTop: 12, gap: 6 }} href={`#/learn/${lesson.id}`}>
              <Icon name="learn" size={15} /> Go deeper: {lesson.title} ({lesson.minutes} min)
            </a>
          )}
          {problem && (
            <a className="row small" style={{ marginTop: 12, gap: 6 }} href={`#/problems/${problem.id}`}>
              <Icon name="code" size={15} /> Practice it: {problem.title}
            </a>
          )}
        </div>
      )}
      {showAnswer && footer && <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>{footer}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ multiple choice

function Mcq({ q, onCheck, revealed }: { q: McqQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const order = useMemo(() => seededShuffle(q.options.map((_, i) => i), q.id), [q]);
  const multi = q.correct.length > 1;
  const [sel, setSel] = useState<number[]>([]);

  const toggle = (i: number) => {
    if (revealed) return;
    setSel((s) => (multi ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : [i]));
  };
  const submit = () => {
    if (!sel.length || revealed) return;
    const ok = sel.length === q.correct.length && sel.every((i) => q.correct.includes(i));
    onCheck(ok);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (revealed || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) toggle(order[n - 1]);
      if (e.key === 'Enter' && sel.length) submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="options">
        {order.map((i, pos) => {
          const isSel = sel.includes(i);
          const isCorrect = q.correct.includes(i);
          const cls = revealed ? (isCorrect ? 'correct' : isSel ? 'wrong' : '') : isSel ? 'selected' : '';
          return (
            <button key={i} className={`option ${cls}`} onClick={() => toggle(i)} disabled={revealed} aria-pressed={isSel}>
              <span className="key">{revealed ? isCorrect ? <Icon name="check" size={14} /> : isSel ? <Icon name="x" size={14} /> : pos + 1 : pos + 1}</span>
              <Markdown inline text={q.options[i]} />
            </button>
          );
        })}
      </div>
      {!revealed && (
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn primary" disabled={!sel.length} onClick={submit}>
            Check
          </button>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ ordering (text items or code lines)

function Reorder({
  items,
  seed,
  code,
  onCheck,
  revealed,
}: {
  items: string[];
  seed: string;
  code?: boolean;
  onCheck: (ok: boolean) => void;
  revealed: boolean;
}) {
  // Work with indices so repeated lines (e.g. two `return` statements) stay distinct.
  const [order, setOrder] = useState(() => seededShuffle(items.map((_, i) => i), seed));
  const [drag, setDrag] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const correctAt = (pos: number) => items[order[pos]] === items[pos];
  const allCorrect = order.every((_, pos) => correctAt(pos));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    setOrder((list) => {
      const next = [...list];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };

  const onPointerDown = (e: ReactPointerEvent, index: number) => {
    if (revealed) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(index);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (drag === null || !listRef.current) return;
    const rows = Array.from(listRef.current.children) as HTMLElement[];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom && i !== drag) {
        move(drag, i);
        setDrag(i);
        break;
      }
    }
  };
  const onPointerUp = () => setDrag(null);

  const render = (text: string) => (code ? <code className="line">{text}</code> : <Markdown inline text={text} />);

  return (
    <>
      <div className={`options ${code ? 'code-lines' : ''}`} ref={listRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {order.map((itemIdx, i) => {
          const cls = revealed ? (correctAt(i) ? 'correct' : 'wrong') : drag === i ? 'dragging' : '';
          return (
            <div key={itemIdx} className={`order-item ${cls}`}>
              {!revealed && (
                <span className="grip" onPointerDown={(e) => onPointerDown(e, i)} aria-hidden="true">
                  <Icon name="grip" size={18} />
                </span>
              )}
              {!code && <span className="num">{i + 1}</span>}
              <span className="text">{render(items[itemIdx])}</span>
              {!revealed && (
                <span className="moves">
                  <button className="icon-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                    <Icon name="up" />
                  </button>
                  <button className="icon-btn" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label="Move down">
                    <Icon name="down" />
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {revealed && !allCorrect && (
        <div style={{ marginTop: 12 }}>
          <div className="io-label">Correct order</div>
          {code ? (
            <pre className="blank-code">{items.join('\n')}</pre>
          ) : (
            <ol style={{ margin: 0, paddingLeft: 22 }}>
              {items.map((x, i) => (
                <li key={i}>
                  <Markdown inline text={x} />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {!revealed && (
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => onCheck(allCorrect)}>
            Check
          </button>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ fill in the blank

function Blank({ q, onCheck, revealed }: { q: BlankQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const bank = useMemo(() => seededShuffle([...q.answers, ...q.distractors], q.id), [q]);
  // filled[blank] = index into bank
  const [filled, setFilled] = useState<(number | null)[]>(() => q.answers.map(() => null));
  const [active, setActive] = useState(0);
  const used = new Set(filled.filter((x): x is number => x !== null));
  const complete = filled.every((x) => x !== null);

  const nextEmpty = (list: (number | null)[], from: number) => {
    for (let k = 0; k < list.length; k++) {
      const i = (from + k) % list.length;
      if (list[i] === null) return i;
    }
    return from;
  };

  const pick = (chip: number) => {
    if (revealed || used.has(chip)) return;
    const next = [...filled];
    next[active] = chip;
    setFilled(next);
    setActive(nextEmpty(next, active + 1));
  };

  const tapBlank = (b: number) => {
    if (revealed) return;
    if (filled[b] !== null) {
      const next = [...filled];
      next[b] = null;
      setFilled(next);
    }
    setActive(b);
  };

  const isRight = (b: number) => filled[b] !== null && bank[filled[b]!] === q.answers[b];

  return (
    <>
      <pre className="blank-code">
        {q.parts.map((part, i) => {
          if (typeof part === 'string') return <span key={i}>{part}</span>;
          const b = part.blank;
          const value = filled[b] !== null ? bank[filled[b]!] : null;
          const cls = revealed ? (isRight(b) ? 'correct' : 'wrong') : b === active ? 'active' : value ? 'filled' : '';
          return (
            <button
              key={i}
              className={`gap ${cls}`}
              style={{ minWidth: `${Math.max(3, q.answers[b].length) + 1}ch` }}
              onClick={() => tapBlank(b)}
              disabled={revealed}
              aria-label={`Blank ${b + 1}${value ? `: ${value}` : ''}`}
            >
              {revealed && !isRight(b) ? (
                <>
                  {value && <s>{value}</s>} {q.answers[b]}
                </>
              ) : (
                (value ?? '\u00a0')
              )}
            </button>
          );
        })}
      </pre>
      {!revealed && (
        <>
          <div className="chips" role="group" aria-label="Word bank">
            {bank.map((token, i) => (
              <button key={i} className={`chip ${used.has(i) ? 'used' : ''}`} onClick={() => pick(i)} disabled={used.has(i)}>
                {token}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <span className="small faint">
              {filled.filter((x) => x !== null).length}/{q.answers.length} filled
            </span>
            <div className="spacer" />
            {filled.some((x) => x !== null) && (
              <button
                className="btn ghost"
                onClick={() => {
                  setFilled(q.answers.map(() => null));
                  setActive(0);
                }}
              >
                Clear
              </button>
            )}
            <button className="btn primary" disabled={!complete} onClick={() => onCheck(q.answers.every((_, b) => isRight(b)))}>
              Check
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ matching

const PAIR_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--medium)', 'var(--hard)'];

function Match({ q, onCheck, revealed }: { q: MatchQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const rights = useMemo(() => seededShuffle(q.pairs.map((_, i) => i), q.id), [q]);
  // pairs[leftIndex] = rightIndex (index into q.pairs)
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [active, setActive] = useState<number | null>(null);

  const leftOf = (r: number) => {
    const entry = Object.entries(pairs).find(([, v]) => v === r);
    return entry ? Number(entry[0]) : null;
  };

  const pickLeft = (l: number) => {
    if (revealed) return;
    setActive(active === l ? null : l);
  };
  const pickRight = (r: number) => {
    if (revealed) return;
    const target = active ?? q.pairs.findIndex((_, l) => pairs[l] === undefined);
    if (target < 0) return;
    setPairs((p) => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (next[Number(k)] === r) delete next[Number(k)];
      next[target] = r;
      return next;
    });
    setActive(null);
  };

  const complete = q.pairs.every((_, l) => pairs[l] !== undefined);
  const tag = (l: number) => (
    <span className="tag" style={{ background: PAIR_COLORS[l % PAIR_COLORS.length] }}>
      {String.fromCharCode(65 + l)}
    </span>
  );

  return (
    <>
      <div className="match-grid">
        <div className="match-col">
          {q.pairs.map(([left], l) => {
            const cls = revealed ? (pairs[l] === l ? 'correct' : 'wrong') : active === l ? 'active' : pairs[l] !== undefined ? 'paired' : '';
            return (
              <button key={l} className={`match-item ${cls}`} onClick={() => pickLeft(l)} disabled={revealed}>
                {tag(l)}
                <Markdown inline text={left} />
              </button>
            );
          })}
        </div>
        <div className="match-col">
          {rights.map((r) => {
            const l = leftOf(r);
            const cls = revealed ? (l === r ? 'correct' : l === null ? '' : 'wrong') : l !== null ? 'paired' : '';
            return (
              <button key={r} className={`match-item ${cls}`} onClick={() => pickRight(r)} disabled={revealed}>
                {revealed ? tag(r) : l !== null ? tag(l) : <span className="tag" style={{ border: '1px dashed var(--border-strong)' }} />}
                <Markdown inline text={q.pairs[r][1]} />
              </button>
            );
          })}
        </div>
      </div>
      {revealed && <p className="small faint">Letters on the right show the correct pairing.</p>}
      {!revealed && (
        <div className="row" style={{ marginTop: 16 }}>
          <span className="small faint">
            {Object.keys(pairs).length}/{q.pairs.length} paired
          </span>
          <div className="spacer" />
          {Object.keys(pairs).length > 0 && (
            <button className="btn ghost" onClick={() => setPairs({})}>
              Clear
            </button>
          )}
          <button className="btn primary" disabled={!complete} onClick={() => onCheck(q.pairs.every((_, l) => pairs[l] === l))}>
            Check
          </button>
        </div>
      )}
    </>
  );
}
