import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getLesson, getQuizCategory } from '../lib/content';
import { haptic } from '../lib/haptics';
import { seededShuffle, type BlankPart, type BlankQuestion, type MatchQuestion, type McqQuestion, type QuizQuestion } from '../lib/shared';
import { mono, radius, useColors, type Palette } from '../lib/theme';
import { Icon } from './Icon';
import { InlineMd, Markdown } from './Markdown';
import { Button, Pill, T, type } from './ui';

const TYPE_LABEL = {
  mcq: 'Multiple choice',
  order: 'Put in order',
  match: 'Match the pairs',
  lines: 'Order the code',
  blank: 'Fill in the code',
} as const;

interface Props {
  q: QuizQuestion;
  /** Called once when the user checks their answer. */
  onAnswer: (correct: boolean) => void;
  /** Rendered after the explanation (e.g. a "Next" button). */
  footer?: ReactNode;
  /** Show the question already answered (e.g. revisiting today's daily question). */
  reveal?: boolean;
  onOpenLesson?: (id: string) => void;
}

export function QuizCard({ q, onAnswer, footer, reveal = false, onOpenLesson }: Props) {
  const c = useColors();
  const [checked, setChecked] = useState<null | boolean>(null);
  const cat = getQuizCategory(q.category);
  const lesson = q.lesson ? getLesson(q.lesson) : undefined;
  const check = (correct: boolean) => {
    if (checked !== null) return;
    if (correct) haptic.success();
    else haptic.error();
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
        ? 'Use the arrows to reorder.'
        : q.type === 'blank'
          ? 'Tap a token to fill the highlighted gap. Tap a filled gap to clear it.'
          : 'Tap an item on the left, then its partner on the right.';

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {cat && <Pill color={c.cat[cat.color]}>{cat.title}</Pill>}
        <Pill>{TYPE_LABEL[q.type]}</Pill>
      </View>
      <Markdown text={q.prompt} base={type.title3} />
      {!showAnswer && (
        <T v="footnote" tone="secondary" style={{ marginTop: -6 }}>
          {hint}
        </T>
      )}
      {q.type === 'mcq' && <Mcq q={q} onCheck={check} revealed={showAnswer} />}
      {q.type === 'order' && <Reorder items={q.items} seed={q.id} onCheck={check} revealed={showAnswer} />}
      {q.type === 'lines' && <Reorder items={q.items} seed={q.id} code onCheck={check} revealed={showAnswer} />}
      {q.type === 'blank' && <Blank q={q} onCheck={check} revealed={showAnswer} />}
      {q.type === 'match' && <Match q={q} onCheck={check} revealed={showAnswer} />}
      {showAnswer && (
        <View style={{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: 16, gap: 12 }}>
          {checked !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={checked ? 'done' : 'x'} size={20} color={checked ? c.pass : c.fail} />
              <T v="headline" tone={checked ? 'pass' : 'fail'}>
                {checked ? 'Correct' : 'Not quite'}
              </T>
            </View>
          )}
          <Markdown text={q.explanation} base={type.callout} />
          {lesson && onOpenLesson && (
            <Pressable onPress={() => onOpenLesson(lesson.id)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="book" size={15} color={c.accent} />
              <T v="subhead" tone="accent" style={{ flex: 1 }}>
                Go deeper: {lesson.title} ({lesson.minutes} min)
              </T>
            </Pressable>
          )}
        </View>
      )}
      {showAnswer && footer}
    </View>
  );
}

// ------------------------------------------------------------------ shared option row

type State = 'idle' | 'selected' | 'correct' | 'wrong';

function stateColors(c: Palette, s: State) {
  switch (s) {
    case 'selected':
      return { bg: c.accentSoft, border: c.accent };
    case 'correct':
      return { bg: c.passSoft, border: c.pass };
    case 'wrong':
      return { bg: c.failSoft, border: c.fail };
    default:
      return { bg: c.card, border: 'transparent' };
  }
}

export function Option({ state, onPress, disabled, lead, children }: { state: State; onPress?: () => void; disabled?: boolean; lead?: ReactNode; children: ReactNode }) {
  const c = useColors();
  const col = stateColors(c, state);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected', disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.row,
        borderCurve: 'continuous',
        borderWidth: 1.5,
        borderColor: col.border,
        backgroundColor: pressed && !disabled ? c.fill : col.bg,
      })}
    >
      {lead}
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

function Key({ children, state }: { children: ReactNode; state: State }) {
  const c = useColors();
  const bg = state === 'selected' ? c.accent : state === 'correct' ? c.pass : state === 'wrong' ? c.fail : c.fill;
  const fg = state === 'idle' ? c.secondary : state === 'selected' ? c.onAccent : '#FFFFFF';
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[type.footnote, { color: fg, fontWeight: '700', fontVariant: ['tabular-nums'] }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// ------------------------------------------------------------------ multiple choice

function Mcq({ q, onCheck, revealed }: { q: McqQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const order = useMemo(() => seededShuffle(q.options.map((_, i) => i), q.id), [q]);
  const multi = q.correct.length > 1;
  const [sel, setSel] = useState<number[]>([]);

  const toggle = (i: number) => {
    haptic.select();
    setSel((s) => (multi ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : [i]));
  };

  return (
    <View style={{ gap: 10 }}>
      {order.map((i, pos) => {
        const isSel = sel.includes(i);
        const isCorrect = q.correct.includes(i);
        const state: State = revealed ? (isCorrect ? 'correct' : isSel ? 'wrong' : 'idle') : isSel ? 'selected' : 'idle';
        return (
          <Option
            key={i}
            state={state}
            disabled={revealed}
            onPress={() => toggle(i)}
            lead={
              <Key state={state}>
                {revealed && isCorrect ? <Icon name="check" size={13} color="#FFFFFF" /> : revealed && isSel ? <Icon name="x" size={13} color="#FFFFFF" /> : pos + 1}
              </Key>
            }
          >
            <InlineMd text={q.options[i]} base={type.callout} />
          </Option>
        );
      })}
      {!revealed && (
        <Button
          title="Check"
          disabled={!sel.length}
          onPress={() => onCheck(sel.length === q.correct.length && sel.every((i) => q.correct.includes(i)))}
          style={{ marginTop: 6 }}
        />
      )}
    </View>
  );
}

// ------------------------------------------------------------------ ordering (text items or code lines)

const indentOf = (line: string) => line.length - line.trimStart().length;

function Reorder({ items, seed, code, onCheck, revealed }: { items: string[]; seed: string; code?: boolean; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const c = useColors();
  // Work with indices so repeated lines (e.g. two `return` statements) stay distinct.
  const [order, setOrder] = useState(() => seededShuffle(items.map((_, i) => i), seed));
  const correctAt = (pos: number) => items[order[pos]] === items[pos];
  const allCorrect = order.every((_, pos) => correctAt(pos));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    haptic.select();
    setOrder((list) => {
      const next = [...list];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  };

  const arrow = (dir: 'up' | 'down', i: number) => {
    const to = dir === 'up' ? i - 1 : i + 1;
    const off = to < 0 || to >= order.length;
    return (
      <Pressable
        onPress={() => move(i, to)}
        disabled={off}
        hitSlop={4}
        accessibilityLabel={dir === 'up' ? 'Move up' : 'Move down'}
        style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.fillStrong : c.fill, opacity: off ? 0.3 : 1 })}
      >
        <Icon name={dir} size={14} color={c.label} />
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 8 }}>
      {order.map((itemIdx, i) => {
        const text = items[itemIdx];
        const state: State = revealed ? (correctAt(i) ? 'correct' : 'wrong') : 'idle';
        return (
          <Option key={itemIdx} state={state} disabled lead={code ? undefined : <Key state={revealed ? state : 'idle'}>{i + 1}</Key>}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                {code ? (
                  <Text style={{ fontFamily: mono, fontSize: 13, lineHeight: 19, color: c.label, paddingLeft: indentOf(text) * 4 }}>{text.trimStart()}</Text>
                ) : (
                  <InlineMd text={text} base={type.callout} />
                )}
              </View>
              {!revealed && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {arrow('up', i)}
                  {arrow('down', i)}
                </View>
              )}
            </View>
          </Option>
        );
      })}
      {revealed && !allCorrect && (
        <View style={{ gap: 6, marginTop: 4 }}>
          <Label>Correct order</Label>
          {code ? (
            <IndentedCode lines={items.map((line) => ({ indent: indentOf(line), content: line.trimStart() }))} />
          ) : (
            items.map((x, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <T v="callout" tone="secondary" style={{ minWidth: 20, fontVariant: ['tabular-nums'] }}>
                  {i + 1}.
                </T>
                <View style={{ flex: 1 }}>
                  <InlineMd text={x} base={type.callout} />
                </View>
              </View>
            ))
          )}
        </View>
      )}
      {!revealed && <Button title="Check" onPress={() => onCheck(allCorrect)} style={{ marginTop: 6 }} />}
    </View>
  );
}

export function Label({ children }: { children: string }) {
  return (
    <T v="caption" tone="secondary" style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {children}
    </T>
  );
}

// ------------------------------------------------------------------ fill in the blank

/** Groups drill code into lines, moving each line's leading spaces into `indent`. */
function splitLines(parts: BlankPart[]): { indent: number; parts: BlankPart[] }[] {
  const lines: BlankPart[][] = [[]];
  for (const part of parts) {
    if (typeof part !== 'string') {
      lines[lines.length - 1].push(part);
      continue;
    }
    part.split('\n').forEach((text, i) => {
      if (i > 0) lines.push([]);
      if (text) lines[lines.length - 1].push(text);
    });
  }
  return lines.map((line) => {
    const first = line[0];
    if (typeof first !== 'string') return { indent: 0, parts: line };
    return { indent: indentOf(first), parts: [first.trimStart(), ...line.slice(1)].filter((p) => p !== '') };
  });
}

/** Code with one row per line, so a wrapped line stays under its own indent. */
function IndentedCode({ lines }: { lines: { indent: number; content: ReactNode }[] }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.code, borderRadius: radius.chip, borderCurve: 'continuous', padding: 12, gap: 2 }}>
      {lines.map((line, i) => (
        <Text key={i} style={{ fontFamily: mono, fontSize: 13, lineHeight: 24, color: c.label, paddingLeft: line.indent * 6 }}>
          {line.content === '' ? ' ' : line.content}
        </Text>
      ))}
    </View>
  );
}

function Blank({ q, onCheck, revealed }: { q: BlankQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const c = useColors();
  const bank = useMemo(() => seededShuffle([...q.answers, ...q.distractors], q.id), [q]);
  const [filled, setFilled] = useState<(number | null)[]>(() => q.answers.map(() => null));
  const [active, setActive] = useState(0);
  const used = new Set(filled.filter((x): x is number => x !== null));
  const complete = filled.every((x) => x !== null);
  const lines = useMemo(() => splitLines(q.parts), [q]);

  const nextEmpty = (list: (number | null)[], from: number) => {
    for (let k = 0; k < list.length; k++) {
      const i = (from + k) % list.length;
      if (list[i] === null) return i;
    }
    return from;
  };

  const pick = (chip: number) => {
    if (revealed || used.has(chip)) return;
    haptic.select();
    const next = [...filled];
    next[active] = chip;
    setFilled(next);
    setActive(nextEmpty(next, active + 1));
  };

  const tapBlank = (b: number) => {
    if (revealed) return;
    haptic.select();
    if (filled[b] !== null) {
      const next = [...filled];
      next[b] = null;
      setFilled(next);
    }
    setActive(b);
  };

  const isRight = (b: number) => filled[b] !== null && bank[filled[b]!] === q.answers[b];

  const renderPart = (part: BlankPart, i: number) => {
    if (typeof part === 'string') return <Text key={i}>{part}</Text>;
    const b = part.blank;
    const value = filled[b] !== null ? bank[filled[b]!] : null;
    const right = isRight(b);
    const bg = revealed ? (right ? c.passSoft : c.failSoft) : b === active ? c.accentSoft : c.fillStrong;
    const fg = revealed ? (right ? c.pass : c.fail) : b === active ? c.accent : c.label;
    const blank = ' '.repeat(Math.max(3, q.answers[b].length));
    return (
      <Text key={i} onPress={() => tapBlank(b)} accessibilityRole="button" accessibilityLabel={`Blank ${b + 1}${value ? `: ${value}` : ''}`} style={{ backgroundColor: bg, color: fg, fontWeight: '700' }}>
        {revealed && !right ? (
          <>
            {value && <Text style={{ textDecorationLine: 'line-through' }}>{value}</Text>}
            {value ? ' ' : ''}
            {q.answers[b]}
          </>
        ) : (
          ` ${value ?? blank} `
        )}
      </Text>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <IndentedCode lines={lines.map((line) => ({ indent: line.indent, content: line.parts.map(renderPart) }))} />
      {!revealed && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityLabel="Word bank">
            {bank.map((token, i) => (
              <Pressable
                key={i}
                onPress={() => pick(i)}
                disabled={used.has(i)}
                accessibilityRole="button"
                accessibilityState={{ disabled: used.has(i) }}
                style={({ pressed }) => ({
                  minHeight: 40,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  borderRadius: radius.chip,
                  borderCurve: 'continuous',
                  backgroundColor: pressed ? c.fillStrong : c.card,
                  opacity: used.has(i) ? 0.3 : 1,
                })}
              >
                <Text style={{ fontFamily: mono, fontSize: 14, color: c.label }}>{token}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T v="footnote" tone="secondary" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>
              {filled.filter((x) => x !== null).length}/{q.answers.length} filled
            </T>
            {filled.some((x) => x !== null) && (
              <Button
                small
                kind="plain"
                title="Clear"
                onPress={() => {
                  setFilled(q.answers.map(() => null));
                  setActive(0);
                }}
              />
            )}
          </View>
          <Button title="Check" disabled={!complete} onPress={() => onCheck(q.answers.every((_, b) => isRight(b)))} />
        </>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ matching

const LETTERS = 'ABCDEFGHIJ';

function Match({ q, onCheck, revealed }: { q: MatchQuestion; onCheck: (ok: boolean) => void; revealed: boolean }) {
  const c = useColors();
  const rights = useMemo(() => seededShuffle(q.pairs.map((_, i) => i), q.id), [q]);
  // pairs[leftIndex] = rightIndex (index into q.pairs)
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [active, setActive] = useState<number | null>(null);
  const tagColors = Object.values(c.cat);

  const leftOf = (r: number) => {
    const entry = Object.entries(pairs).find(([, v]) => v === r);
    return entry ? Number(entry[0]) : null;
  };

  const pickRight = (r: number) => {
    const target = active ?? q.pairs.findIndex((_, l) => pairs[l] === undefined);
    if (target < 0) return;
    haptic.select();
    setPairs((p) => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (next[Number(k)] === r) delete next[Number(k)];
      next[target] = r;
      return next;
    });
    setActive(null);
  };

  const tag = (l: number | null) => (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: l === null ? 'transparent' : tagColors[l % tagColors.length],
        borderWidth: l === null ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: c.tertiary,
      }}
    >
      {l !== null && <Text style={[type.caption, { color: '#FFFFFF', fontWeight: '800' }]}>{LETTERS[l]}</Text>}
    </View>
  );

  const complete = q.pairs.every((_, l) => pairs[l] !== undefined);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        {q.pairs.map(([left], l) => {
          const state: State = revealed ? (pairs[l] === l ? 'correct' : 'wrong') : active === l ? 'selected' : 'idle';
          return (
            <Option
              key={l}
              state={state}
              disabled={revealed}
              onPress={() => {
                haptic.select();
                setActive(active === l ? null : l);
              }}
              lead={tag(l)}
            >
              <InlineMd text={left} base={type.subhead} />
            </Option>
          );
        })}
      </View>
      <View style={{ height: 1, backgroundColor: c.separator, marginHorizontal: 8 }} />
      <View style={{ gap: 8 }}>
        {rights.map((r) => {
          const l = leftOf(r);
          const state: State = revealed ? (l === r ? 'correct' : l === null ? 'idle' : 'wrong') : 'idle';
          return (
            <Option key={r} state={state} disabled={revealed} onPress={() => pickRight(r)} lead={tag(revealed ? r : l)}>
              <InlineMd text={q.pairs[r][1]} base={type.subhead} />
            </Option>
          );
        })}
      </View>
      {revealed && (
        <T v="footnote" tone="secondary">
          Letters on the bottom list show the correct pairing.
        </T>
      )}
      {!revealed && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T v="footnote" tone="secondary" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>
              {Object.keys(pairs).length}/{q.pairs.length} paired
            </T>
            {Object.keys(pairs).length > 0 && <Button small kind="plain" title="Clear" onPress={() => setPairs({})} />}
          </View>
          <Button title="Check" disabled={!complete} onPress={() => onCheck(q.pairs.every((_, l) => pairs[l] === l))} />
        </>
      )}
    </View>
  );
}
