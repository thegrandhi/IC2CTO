// Guided mock interviews: a scripted interviewer walks through a design prompt and
// reacts to each decision. Content lives in /content/interview/<design-id>.md.
//
//   ## Requirements                 ← a DESIGN_STEPS title; text under it is the interviewer's lead-in
//   ::: ask scope                   ← clarifying questions: spend a small budget, the interviewer answers
//   - [key] Question? => Answer.    ← [key] counts toward the score, [ok] is fine, [weak] wastes a turn
//   ???
//   Why these questions matter.
//   :::
//   ::: pick features               ← select all that apply; every option gets a note
//   - [x] In scope => note
//   - [ ] Out of scope => note
//   ::: choice write-qps            ← exactly one right answer; every option gets a note
//   ::: path read-path              ← tap components in order to build a request path
//   1. Client
//   2. CDN (optional)               ← may be included or skipped
//   - extra: Kafka => why it isn't on this path
import { DESIGN_STEPS } from './designs';

interface ItemBase {
  id: string;
  /** DESIGN_STEPS key this item belongs to. */
  step: string;
  /** Interviewer lead-in shown before the first item of a step. */
  intro?: string;
  prompt: string;
  explanation: string;
}

export interface AskQuestion {
  text: string;
  answer: string;
  weight: 'key' | 'ok' | 'weak';
}

export interface AskItem extends ItemBase {
  type: 'ask';
  questions: AskQuestion[];
  /** How many questions the candidate may ask: one more than the key questions. */
  budget: number;
}

export interface Option {
  text: string;
  note: string;
  correct: boolean;
}

export interface PickItem extends ItemBase {
  type: 'pick';
  options: Option[];
}

export interface ChoiceItem extends ItemBase {
  type: 'choice';
  options: Option[];
}

export interface PathStep {
  text: string;
  optional: boolean;
}

export interface PathItem extends ItemBase {
  type: 'path';
  steps: PathStep[];
  extras: { text: string; note: string }[];
}

export type InterviewItem = AskItem | PickItem | ChoiceItem | PathItem;

export function parseInterview(id: string, md: string): InterviewItem[] {
  const file = `interview/${id}.md`;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const items: InterviewItem[] = [];
  let step: string | null = null;
  let intro: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      const found = DESIGN_STEPS.find((s) => s.title.toLowerCase() === heading[1].trim().toLowerCase());
      if (!found) throw new Error(`${file}:${i + 1}: unknown step "${heading[1]}"`);
      step = found.key;
      intro = [];
      continue;
    }
    const header = /^::: (ask|pick|choice|path) ([a-z0-9-]+)\s*$/.exec(line);
    if (!header) {
      if (step) intro.push(line);
      else if (line.trim()) throw new Error(`${file}:${i + 1}: text before the first "## Step" heading`);
      continue;
    }
    if (!step) throw new Error(`${file}:${i + 1}: block before the first "## Step" heading`);
    const start = i + 1;
    const body: string[] = [];
    for (i++; i < lines.length && lines[i].trim() !== ':::'; i++) body.push(lines[i]);
    if (i >= lines.length) throw new Error(`${file}:${start}: unterminated block`);
    const lead = intro.join('\n').trim();
    intro = [];
    const item = parseItem(header[1] as InterviewItem['type'], header[2], step, body, `${file}:${start}`);
    if (lead) item.intro = lead;
    if (items.some((x) => x.id === item.id)) throw new Error(`${file}:${start}: duplicate id "${item.id}"`);
    items.push(item);
  }
  if (!items.length) throw new Error(`${file}: no interview items`);
  return items;
}

function parseItem(type: InterviewItem['type'], id: string, step: string, body: string[], where: string): InterviewItem {
  const sep = body.findIndex((l) => l.trim() === '???');
  if (sep < 0) throw new Error(`${where}: missing "???" before the explanation`);
  const explanation = body
    .slice(sep + 1)
    .join('\n')
    .trim();
  if (!explanation) throw new Error(`${where}: empty explanation`);
  const main = body.slice(0, sep);
  const lineRe = type === 'path' ? /^(\d+\.|- extra:) / : /^- \[/;
  const first = main.findIndex((l) => lineRe.test(l));
  if (first < 0) throw new Error(`${where}: no answer lines found`);
  const prompt = main.slice(0, first).join('\n').trim();
  if (!prompt) throw new Error(`${where}: empty prompt`);
  const rows = main.slice(first).filter((l) => l.trim());
  const base = { id, step, prompt, explanation };

  const split = (text: string, row: string) => {
    const at = text.indexOf(' => ');
    if (at < 0) throw new Error(`${where}: expected "text => note" in "${row}"`);
    return [text.slice(0, at).trim(), text.slice(at + 4).trim()] as const;
  };

  if (type === 'ask') {
    const questions = rows.map((row): AskQuestion => {
      const m = /^- \[(key|ok|weak)\] (.+)$/.exec(row);
      if (!m) throw new Error(`${where}: expected "- [key|ok|weak] question => answer", got "${row}"`);
      const [text, answer] = split(m[2], row);
      return { text, answer, weight: m[1] as AskQuestion['weight'] };
    });
    const keys = questions.filter((q) => q.weight === 'key').length;
    if (keys < 2) throw new Error(`${where}: ask needs at least 2 [key] questions`);
    if (!questions.some((q) => q.weight === 'weak')) throw new Error(`${where}: ask needs a [weak] question`);
    return { ...base, type, questions, budget: keys + 1 };
  }

  if (type === 'pick' || type === 'choice') {
    const options = rows.map((row): Option => {
      const m = /^- \[( |x)\] (.+)$/.exec(row);
      if (!m) throw new Error(`${where}: expected "- [x] option => note", got "${row}"`);
      const [text, note] = split(m[2], row);
      return { text, note, correct: m[1] === 'x' };
    });
    const right = options.filter((o) => o.correct).length;
    if (type === 'choice' && (right !== 1 || options.length < 3)) throw new Error(`${where}: choice needs 3+ options and exactly one [x]`);
    if (type === 'pick' && (!right || right === options.length)) throw new Error(`${where}: pick needs both right and wrong options`);
    return { ...base, type, options };
  }

  const steps: PathStep[] = [];
  const extras: { text: string; note: string }[] = [];
  for (const row of rows) {
    const s = /^\d+\. (.+?)( \(optional\))?$/.exec(row);
    const x = /^- extra: (.+)$/.exec(row);
    if (s) steps.push({ text: s[1].trim(), optional: !!s[2] });
    else if (x) {
      const [text, note] = split(x[1], row);
      extras.push({ text, note });
    } else throw new Error(`${where}: expected "1. component" or "- extra: component => note", got "${row}"`);
  }
  if (steps.filter((s) => !s.optional).length < 3) throw new Error(`${where}: path needs 3+ required steps`);
  if (extras.length < 2) throw new Error(`${where}: path needs 2+ extras`);
  const names = [...steps.map((s) => s.text), ...extras.map((x) => x.text)];
  if (new Set(names).size !== names.length) throw new Error(`${where}: path components must be unique`);
  return { ...base, type: 'path', steps, extras };
}

// ------------------------------------------------------------------ answers and scoring

export type InterviewAnswer =
  | { type: 'ask'; asked: number[]; done: boolean }
  | { type: 'pick'; picked: number[] }
  | { type: 'choice'; choice: number }
  | { type: 'path'; path: string[] };

export function isDone(answer: InterviewAnswer | undefined): boolean {
  return !!answer && (answer.type !== 'ask' || answer.done);
}

/** 0–1 credit for one answered item. */
export function scoreItem(item: InterviewItem, answer: InterviewAnswer): number {
  if (item.type === 'ask' && answer.type === 'ask') {
    const keys = item.questions.flatMap((q, i) => (q.weight === 'key' ? [i] : []));
    return keys.filter((k) => answer.asked.includes(k)).length / keys.length;
  }
  if (item.type === 'pick' && answer.type === 'pick') {
    return item.options.filter((o, i) => o.correct === answer.picked.includes(i)).length / item.options.length;
  }
  if (item.type === 'choice' && answer.type === 'choice') {
    return item.options[answer.choice]?.correct ? 1 : 0;
  }
  if (item.type === 'path' && answer.type === 'path') {
    const check = checkPath(item, answer.path);
    return check.correct ? 1 : check.missing.length === 0 && check.wrong.length === 0 ? 0.5 : 0;
  }
  return 0;
}

export interface PathCheck {
  correct: boolean;
  /** Required steps the candidate left out. */
  missing: string[];
  /** Components that don't belong on this path. */
  wrong: string[];
  /** All the right components, but in the wrong order. */
  misordered: boolean;
}

/** A path is right when it has every required step, no extras, and follows the reference order. */
export function checkPath(item: PathItem, path: string[]): PathCheck {
  const names = item.steps.map((s) => s.text);
  const missing = item.steps.filter((s) => !s.optional && !path.includes(s.text)).map((s) => s.text);
  const wrong = path.filter((p) => !names.includes(p));
  const expected = names.filter((n) => path.includes(n));
  const misordered = path.filter((p) => names.includes(p)).some((p, i) => p !== expected[i]);
  return { correct: !missing.length && !wrong.length && !misordered, missing, wrong, misordered };
}
