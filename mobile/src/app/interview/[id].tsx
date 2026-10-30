import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState, Pressable, ScrollView, Text, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';
import { Icon } from '../../components/Icon';
import { InlineMd, Markdown } from '../../components/Markdown';
import { Label, Option } from '../../components/QuizCard';
import { Button, Empty, ProgressBar, T, type } from '../../components/ui';
import { getDesign, getInterview } from '../../lib/content';
import { haptic } from '../../lib/haptics';
import {
  checkPath,
  DESIGN_STEPS,
  isDone,
  scoreItem,
  seededShuffle,
  type AskItem,
  type ChoiceItem,
  type DesignPrompt,
  type InterviewAnswer,
  type InterviewItem,
  type PathItem,
  type PickItem,
} from '../../lib/shared';
import { attemptScore, getState, interviewDraftKey, recordDesign, storage } from '../../lib/store';
import { radius, space, useColors } from '../../lib/theme';

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
const tone = (score: number): 'pass' | 'warn' | 'fail' => (score >= 1 ? 'pass' : score >= 0.5 ? 'warn' : 'fail');

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

export default function InterviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const design = getDesign(id);
  const items = getInterview(id);
  if (!design || !items) return <Empty icon="chat" title="No guided interview" body="This prompt doesn’t have a guided interview yet." />;
  return <Interview design={design} items={items} />;
}

type Register = (key: string, e: LayoutChangeEvent) => void;

function Interview({ design, items }: { design: DesignPrompt; items: InterviewItem[] }) {
  const c = useColors();
  const [draft, setDraft] = useState<Draft>(() => loadDraft(design.id) ?? newDraft());
  const [result, setResult] = useState<{ score: number; best: number | null } | null>(null);
  const seconds = useRef(draft.seconds);
  const scroll = useRef<ScrollViewInstance>(null);
  const anchors = useRef<Record<string, number>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const finished = draft.current >= items.length;
  const active = finished ? undefined : items[draft.current];

  // Count active time while the app is in the foreground.
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      if (AppState.currentState === 'active') seconds.current++;
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  useEffect(() => {
    // Only save once something is answered, so opening a prompt doesn't mark it "in progress".
    if (finished || (!draft.current && !Object.keys(draft.answers).length)) return;
    storage.set(interviewDraftKey(design.id), JSON.stringify({ ...draft, seconds: seconds.current }));
  }, [draft, finished, design.id]);

  // Chat elements are direct children of the scroll content, so their layout y is a scroll offset.
  const register: Register = (key, e) => {
    anchors.current[key] = e.nativeEvent.layout.y;
    if (key === focus) {
      scroll.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
      setFocus(null);
    }
  };

  const answer = (item: InterviewItem, a: InterviewAnswer) => {
    setDraft((d) => ({ ...d, answers: { ...d.answers, [item.id]: a } }));
    if (isDone(a)) setFocus(`${item.id}:feedback`);
    else scroll.current?.scrollToEnd({ animated: true });
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
    const past = getState().designs[design.id] ?? [];
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
    haptic.success();
    setFocus('scorecard');
  };

  const restart = () => {
    storage.remove(interviewDraftKey(design.id));
    seconds.current = 0;
    setResult(null);
    setDraft(newDraft());
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const confirmRestart = () =>
    Alert.alert('Start over?', 'Your answers in this interview will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start over', style: 'destructive', onPress: restart },
    ]);

  const doneCount = items.filter((it) => isDone(draft.answers[it.id])).length;
  const shown = items.slice(0, Math.min(draft.current + 1, items.length));

  return (
    <>
      <Stack.Screen
        options={{
          title: finished ? 'Interview complete' : stepTitle(active!.step),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
              <T tone="accent" style={{ fontWeight: '600' }}>
                Close
              </T>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={confirmRestart} hitSlop={10} accessibilityLabel="Start over">
              <Icon name="reset" size={18} color={c.accent} />
            </Pressable>
          ),
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space, paddingVertical: 8, backgroundColor: c.bg }}>
        <ProgressBar value={doneCount} max={items.length} />
        <T v="footnote" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
          {doneCount}/{items.length}
        </T>
      </View>
      <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space, paddingBottom: 64, gap: 10 }}>
        <Bubble>
          <T v="callout">
            <Text style={{ fontWeight: '700' }}>Interviewer: </Text>Thanks for joining. Today: <Text style={{ fontWeight: '700' }}>{design.title.replace(/^Design an? /, '')}</Text>.
          </T>
          <Markdown text={design.prompt} base={type.callout} />
        </Bubble>

        {shown.map((item, i) => (
          <Fragment key={item.id}>
            {(i === 0 || items[i - 1].step !== item.step) && (
              <View onLayout={(e) => register(`${item.id}:start`, e)} style={{ alignItems: 'center', paddingVertical: 10 }}>
                <T v="caption" tone="secondary" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  {DESIGN_STEPS.findIndex((st) => st.key === item.step) + 1}. {stepTitle(item.step)}
                </T>
              </View>
            )}
            {i > 0 && items[i - 1].step === item.step && <View onLayout={(e) => register(`${item.id}:start`, e)} />}
            {item.intro && (
              <Bubble>
                <Markdown text={item.intro} base={type.callout} />
              </Bubble>
            )}
            <Bubble>
              <Markdown text={item.prompt} base={type.callout} />
            </Bubble>
            <Exchange item={item} answer={draft.answers[item.id]} active={item === active} seed={`${design.id}:${item.id}`} onAnswer={(a) => answer(item, a)} register={register} />
          </Fragment>
        ))}

        {active && isDone(draft.answers[active.id]) && (
          <Button title={draft.current === items.length - 1 ? 'Finish interview' : 'Continue'} icon="arrow" onPress={next} style={{ marginTop: 8 }} />
        )}

        {finished && (
          <>
            <Bubble>
              <T v="callout">That’s time. Thanks, this was a good conversation. Here’s how you did.</T>
            </Bubble>
            <Scorecard
              design={design}
              items={items}
              answers={draft.answers}
              result={result}
              onRestart={restart}
              onJump={(key) => {
                const y = anchors.current[key];
                if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
              }}
              onLayout={(e) => register('scorecard', e)}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

// ------------------------------------------------------------------ chat pieces

function Bubble({ me, tone: t, children, onLayout }: { me?: boolean; tone?: 'pass' | 'warn' | 'fail'; children: ReactNode; onLayout?: (e: LayoutChangeEvent) => void }) {
  const c = useColors();
  const bg = me ? c.accent : t === 'pass' ? c.passSoft : t === 'warn' ? c.warnSoft : t === 'fail' ? c.failSoft : c.card;
  return (
    <View onLayout={onLayout} style={{ flexDirection: 'row', justifyContent: me ? 'flex-end' : 'flex-start', paddingLeft: me ? 40 : 0, paddingRight: me ? 0 : 24 }}>
      <View style={{ backgroundColor: bg, borderRadius: 20, borderCurve: 'continuous', borderBottomLeftRadius: me ? 20 : 6, borderBottomRightRadius: me ? 6 : 20, paddingHorizontal: 14, paddingVertical: 10, gap: 10, maxWidth: '100%' }}>
        {children}
      </View>
    </View>
  );
}

function MeText({ text }: { text: string }) {
  const c = useColors();
  return <InlineMd text={text} base={type.callout} color={c.onAccent} />;
}

function Feedback({ item, score, children, onLayout }: { item: InterviewItem; score: number; children: ReactNode; onLayout: (e: LayoutChangeEvent) => void }) {
  const t = tone(score);
  return (
    <Bubble tone={t} onLayout={onLayout}>
      <T v="headline" tone={t}>
        {verdict(item, score)}
      </T>
      {children}
      <Markdown text={item.explanation} base={type.subhead} />
    </Bubble>
  );
}

interface ExchangeProps<T extends InterviewItem> {
  item: T;
  answer: InterviewAnswer | undefined;
  active: boolean;
  seed: string;
  onAnswer: (a: InterviewAnswer) => void;
  register: Register;
}

function Exchange(props: ExchangeProps<InterviewItem>) {
  const { item } = props;
  if (item.type === 'ask') return <AskExchange {...(props as ExchangeProps<AskItem>)} />;
  if (item.type === 'pick') return <PickExchange {...(props as ExchangeProps<PickItem>)} />;
  if (item.type === 'choice') return <ChoiceExchange {...(props as ExchangeProps<ChoiceItem>)} />;
  return <PathExchange {...(props as ExchangeProps<PathItem>)} />;
}

function Input({ children }: { children: ReactNode }) {
  return <View style={{ gap: 8, marginTop: 4 }}>{children}</View>;
}

// ------------------------------------------------------------------ clarifying questions

function AskExchange({ item, answer, active, seed, onAnswer, register }: ExchangeProps<AskItem>) {
  const c = useColors();
  const a = answer?.type === 'ask' ? answer : { type: 'ask' as const, asked: [] as number[], done: false };
  const order = useMemo(() => seededShuffle(item.questions.map((_, i) => i), seed), [item, seed]);
  const left = item.budget - a.asked.length;
  const ask = (q: number) => {
    haptic.select();
    const asked = [...a.asked, q];
    onAnswer({ type: 'ask', asked, done: asked.length >= item.budget });
  };
  const score = scoreItem(item, a);
  const keys = item.questions.filter((q) => q.weight === 'key');
  const missed = item.questions.filter((q, i) => q.weight === 'key' && !a.asked.includes(i));
  const weak = a.asked.map((i) => item.questions[i]).filter((q) => q.weight === 'weak');

  return (
    <>
      {a.asked.map((qi) => (
        <Fragment key={qi}>
          <Bubble me>
            <MeText text={item.questions[qi].text} />
          </Bubble>
          <Bubble>
            <InlineMd text={item.questions[qi].answer} base={type.callout} />
          </Bubble>
        </Fragment>
      ))}
      {active && !a.done && (
        <Input>
          <T v="footnote" tone="secondary">
            {left} question{left === 1 ? '' : 's'} left. Tap one to ask it.
          </T>
          {order
            .filter((i) => !a.asked.includes(i))
            .map((i) => (
              <Option key={i} state="idle" onPress={() => ask(i)} lead={<Icon name="chat" size={15} color={c.accent} />}>
                <T v="callout">{item.questions[i].text}</T>
              </Option>
            ))}
          <Button kind="secondary" title={a.asked.length ? 'That’s all my questions' : 'Skip questions'} onPress={() => onAnswer({ ...a, done: true })} />
        </Input>
      )}
      {a.done && (
        <Feedback item={item} score={score} onLayout={(e) => register(`${item.id}:feedback`, e)}>
          <T v="callout">
            You asked {keys.length - missed.length} of {keys.length} key questions.
          </T>
          {missed.length > 0 && (
            <View style={{ gap: 8 }}>
              <Label>Worth asking</Label>
              {missed.map((q) => (
                <View key={q.text} style={{ gap: 2 }}>
                  <T v="subhead" style={{ fontWeight: '600' }}>
                    {q.text}
                  </T>
                  <InlineMd text={q.answer} base={type.subhead} color={c.secondary} />
                </View>
              ))}
            </View>
          )}
          {weak.length > 0 && (
            <View style={{ gap: 4 }}>
              <Label>Didn’t change the design</Label>
              {weak.map((q) => (
                <T key={q.text} v="subhead" tone="secondary">
                  • {q.text}
                </T>
              ))}
            </View>
          )}
        </Feedback>
      )}
    </>
  );
}

// ------------------------------------------------------------------ select all that apply

function PickExchange({ item, answer, active, seed, onAnswer, register }: ExchangeProps<PickItem>) {
  const c = useColors();
  const order = useMemo(() => seededShuffle(item.options.map((_, i) => i), seed), [item, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const a = answer?.type === 'pick' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <Input>
        <T v="footnote" tone="secondary">
          Select all that apply.
        </T>
        {order.map((i) => {
          const on = picked.includes(i);
          return (
            <Option
              key={i}
              state={on ? 'selected' : 'idle'}
              onPress={() => {
                haptic.select();
                setPicked(on ? picked.filter((x) => x !== i) : [...picked, i]);
              }}
              lead={<Icon name={on ? 'done' : 'circle'} size={20} color={on ? c.accent : c.tertiary} weight="regular" />}
            >
              <InlineMd text={item.options[i].text} base={type.callout} />
            </Option>
          );
        })}
        <Button title="Answer" disabled={!picked.length} onPress={() => onAnswer({ type: 'pick', picked })} />
      </Input>
    );
  }

  return (
    <>
      <Bubble me>
        {order
          .filter((i) => a.picked.includes(i))
          .map((i) => (
            <MeText key={i} text={`• ${item.options[i].text}`} />
          ))}
      </Bubble>
      <Feedback item={item} score={scoreItem(item, a)} onLayout={(e) => register(`${item.id}:feedback`, e)}>
        {order.map((i) => {
          const o = item.options[i];
          const was = a.picked.includes(i);
          const right = o.correct === was;
          const label = right ? (was ? 'You picked it' : 'You left it out') : o.correct ? 'Should be picked' : 'Shouldn’t be picked';
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ marginTop: 3 }}>
                <Icon name={right ? 'check' : 'x'} size={13} color={right ? c.pass : c.fail} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <InlineMd text={o.text} base={{ ...type.subhead, fontWeight: '600' }} />
                <T v="caption" tone={right ? 'pass' : 'fail'} style={{ fontWeight: '600' }}>
                  {label}
                </T>
                <InlineMd text={o.note} base={type.footnote} color={c.secondary} />
              </View>
            </View>
          );
        })}
      </Feedback>
    </>
  );
}

// ------------------------------------------------------------------ one right answer

function ChoiceExchange({ item, answer, active, onAnswer, register }: ExchangeProps<ChoiceItem>) {
  const c = useColors();
  const [choice, setChoice] = useState<number | null>(null);
  const a = answer?.type === 'choice' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <Input>
        {item.options.map((o, i) => (
          <Option
            key={i}
            state={choice === i ? 'selected' : 'idle'}
            onPress={() => {
              haptic.select();
              setChoice(i);
            }}
            lead={
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: choice === i ? c.accent : c.fill }}>
                <Text style={[type.footnote, { fontWeight: '700', color: choice === i ? c.onAccent : c.secondary }]}>{String.fromCharCode(65 + i)}</Text>
              </View>
            }
          >
            <InlineMd text={o.text} base={type.callout} />
          </Option>
        ))}
        <Button title="Answer" disabled={choice === null} onPress={() => onAnswer({ type: 'choice', choice: choice! })} />
      </Input>
    );
  }

  const chosen = item.options[a.choice];
  const best = item.options.find((o) => o.correct)!;
  return (
    <>
      <Bubble me>
        <MeText text={chosen.text} />
      </Bubble>
      <Feedback item={item} score={scoreItem(item, a)} onLayout={(e) => register(`${item.id}:feedback`, e)}>
        <InlineMd text={chosen.note} base={type.callout} />
        {!chosen.correct && (
          <View style={{ gap: 4 }}>
            <Label>Better answer</Label>
            <InlineMd text={best.text} base={{ ...type.subhead, fontWeight: '600' }} />
            <InlineMd text={best.note} base={type.subhead} color={c.secondary} />
          </View>
        )}
      </Feedback>
    </>
  );
}

// ------------------------------------------------------------------ build a request path

function Node({ text, state, onPress, optional }: { text: string; state: 'mine' | 'had' | 'missing' | 'optional'; onPress?: () => void; optional?: boolean }) {
  const c = useColors();
  const bg = state === 'mine' ? c.accentSoft : state === 'had' ? c.passSoft : state === 'missing' ? c.failSoft : c.fill;
  const fg = state === 'mine' ? c.accent : state === 'had' ? c.pass : state === 'missing' ? c.fail : c.secondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={onPress ? `Remove ${text}` : text}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 32, borderRadius: radius.chip, borderCurve: 'continuous', backgroundColor: bg }}
    >
      <Text style={[type.footnote, { color: fg, fontWeight: '600' }]}>
        {text}
        {optional ? <Text style={{ fontStyle: 'italic', fontWeight: '400' }}> optional</Text> : null}
      </Text>
      {onPress && <Icon name="x" size={10} color={fg} />}
    </Pressable>
  );
}

function Chain({ nodes }: { nodes: ReactNode[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      {nodes.map((n, i) => (
        <Fragment key={i}>
          {i > 0 && <Icon name="arrow" size={11} color={c.tertiary} />}
          {n}
        </Fragment>
      ))}
    </View>
  );
}

function PathExchange({ item, answer, active, seed, onAnswer, register }: ExchangeProps<PathItem>) {
  const c = useColors();
  const palette = useMemo(() => seededShuffle([...item.steps.map((st) => st.text), ...item.extras.map((x) => x.text)], seed), [item, seed]);
  const [path, setPath] = useState<string[]>([]);
  const a = answer?.type === 'path' ? answer : null;

  if (!a) {
    if (!active) return null;
    return (
      <Input>
        <View style={{ backgroundColor: c.card, borderRadius: radius.row, borderCurve: 'continuous', padding: 12, minHeight: 56, justifyContent: 'center' }}>
          {path.length ? (
            <Chain nodes={path.map((p) => <Node key={p} text={p} state="mine" onPress={() => setPath(path.filter((x) => x !== p))} />)} />
          ) : (
            <T v="footnote" tone="secondary">
              Tap components below, in order. Tap one up here to remove it.
            </T>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {palette
            .filter((p) => !path.includes(p))
            .map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  haptic.tap();
                  setPath([...path, p]);
                }}
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.chip, borderCurve: 'continuous', backgroundColor: pressed ? c.fillStrong : c.fill })}
              >
                <T v="subhead">{p}</T>
              </Pressable>
            ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button kind="secondary" title="Undo" icon="undo" disabled={!path.length} onPress={() => setPath(path.slice(0, -1))} style={{ flex: 1 }} />
          <Button title="Answer" disabled={path.length < 2} onPress={() => onAnswer({ type: 'path', path })} style={{ flex: 2 }} />
        </View>
      </Input>
    );
  }

  const check = checkPath(item, a.path);
  return (
    <>
      <Bubble me>
        <MeText text={a.path.join(' → ')} />
      </Bubble>
      <Feedback item={item} score={scoreItem(item, a)} onLayout={(e) => register(`${item.id}:feedback`, e)}>
        {check.misordered && !check.missing.length && !check.wrong.length && <T v="callout">Right components, wrong order.</T>}
        <Label>Reference path</Label>
        <Chain
          nodes={item.steps.map((st) => (
            <Node key={st.text} text={st.text} optional={st.optional} state={a.path.includes(st.text) ? 'had' : st.optional ? 'optional' : 'missing'} />
          ))}
        />
        {check.missing.length > 0 && (
          <T v="subhead">
            <Text style={{ fontWeight: '700' }}>Missing:</Text> {check.missing.join(', ')}.
          </T>
        )}
        {check.wrong.length > 0 && (
          <View style={{ gap: 6 }}>
            <Label>Not on this path</Label>
            {check.wrong.map((w) => (
              <View key={w} style={{ gap: 2 }}>
                <T v="subhead" style={{ fontWeight: '600' }}>
                  {w}
                </T>
                <InlineMd text={item.extras.find((x) => x.text === w)?.note ?? ''} base={type.footnote} color={c.secondary} />
              </View>
            ))}
          </View>
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
  onJump,
  onLayout,
}: {
  design: DesignPrompt;
  items: InterviewItem[];
  answers: Record<string, InterviewAnswer>;
  result: { score: number; best: number | null } | null;
  onRestart: () => void;
  onJump: (key: string) => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const c = useColors();
  const scores = items.map((it) => (answers[it.id] ? scoreItem(it, answers[it.id]) : 0));
  const total = result?.score ?? scores.reduce((a, b) => a + b, 0) / items.length;
  const steps = DESIGN_STEPS.map((st) => {
    const idx = items.flatMap((it, i) => (it.step === st.key ? [i] : []));
    return { step: st, count: idx.length, score: idx.length ? idx.reduce((a, i) => a + scores[i], 0) / idx.length : 0 };
  }).filter((x) => x.count);
  const review = items.filter((_, i) => scores[i] < 1);

  return (
    <View onLayout={onLayout} style={{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: 20, gap: 14, marginTop: 8 }}>
      <T v="footnote" tone="secondary">
        {design.title}
      </T>
      <T style={{ fontSize: 56, lineHeight: 62, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{pct(total)}%</T>
      <T v="callout" tone="secondary" style={{ marginTop: -8 }}>
        {scores.filter((x) => x >= 1).length} of {items.length} answers fully right.
        {result?.best != null && ` Your previous best was ${pct(result.best)}%.`}
      </T>
      {steps.map(({ step, score }) => (
        <View key={step.key} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T v="subhead">{step.title}</T>
            <T v="subhead" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {pct(score)}%
            </T>
          </View>
          <ProgressBar value={pct(score)} max={100} color={c[tone(score)]} />
        </View>
      ))}
      {review.length > 0 && (
        <View style={{ gap: 8, marginTop: 4 }}>
          <Label>Worth another look</Label>
          {review.map((it) => (
            <Pressable key={it.id} onPress={() => onJump(`${it.id}:start`)} hitSlop={4}>
              <T v="subhead" tone="accent">
                {stepTitle(it.step)}: {summary(it.prompt)}
              </T>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ gap: 10, marginTop: 6 }}>
        <Button title="Try again" icon="reset" onPress={onRestart} />
        <Button kind="secondary" title="See the reference answer" onPress={() => router.back()} />
      </View>
    </View>
  );
}
