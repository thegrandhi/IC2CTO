import { extractFences, parseMeta, splitDoc } from './markdown';

export interface QuizCategory {
  id: string;
  title: string;
  description: string;
  /** CSS color token name used for the category chip. */
  color: string;
}

interface QuizBase {
  id: string;
  category: string;
  prompt: string;
  explanation: string;
  lesson?: string;
  /** Related coding problem id. */
  problem?: string;
}

export interface McqQuestion extends QuizBase {
  type: 'mcq';
  options: string[];
  /** Indices of the correct options; more than one makes it "select all that apply". */
  correct: number[];
}

export interface OrderQuestion extends QuizBase {
  type: 'order';
  /** Items in the correct order. */
  items: string[];
}

/** "Parsons problem": reorder the shuffled lines of a code snippet. */
export interface LinesQuestion extends QuizBase {
  type: 'lines';
  lang: string;
  /** Code lines (indentation preserved) in the correct order. */
  items: string[];
}

export type BlankPart = string | { blank: number };

/** Fill-in-the-blank code: tap tokens from a word bank to fill `{{…}}` gaps. */
export interface BlankQuestion extends QuizBase {
  type: 'blank';
  lang: string;
  parts: BlankPart[];
  answers: string[];
  distractors: string[];
}

export interface MatchQuestion extends QuizBase {
  type: 'match';
  pairs: [string, string][];
}

export type QuizQuestion = McqQuestion | OrderQuestion | MatchQuestion | LinesQuestion | BlankQuestion;

export const QUIZ_CATEGORY_ORDER = ['databases', 'infrastructure', 'apis', 'theory', 'product', 'algorithms', 'code'];

/** Categories that are about coding rather than system design. */
export const CODING_CATEGORIES = ['algorithms', 'code'];

const COLORS: Record<string, string> = {
  databases: 'c1',
  infrastructure: 'c2',
  apis: 'c3',
  theory: 'c4',
  product: 'c5',
  algorithms: 'c6',
  code: 'c7',
};

/**
 * Parses a quiz file. Questions are blocks like:
 *
 *     ::: mcq some-id
 *     lesson: caching
 *     Prompt markdown…
 *     - [ ] wrong
 *     - [x] right
 *     ???
 *     Explanation markdown…
 *     :::
 *
 * `order` blocks list `1. item` lines in the correct order; `match` blocks
 * list `- left => right` pairs. `lines` blocks hold a code fence whose lines
 * get shuffled. `blank` blocks hold a code fence with `{{answer}}` gaps and an
 * optional `- extra: a | b` line of distractor tokens.
 */
export function parseQuizFile(categoryId: string, md: string): { category: QuizCategory; questions: QuizQuestion[] } {
  const file = `quiz/${categoryId}.md`;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const headerLines: string[] = [];
  const questions: QuizQuestion[] = [];

  let i = 0;
  while (i < lines.length && !lines[i].startsWith('::: ')) headerLines.push(lines[i++]);

  const doc = splitDoc(headerLines.join('\n'));
  const { fences, rest } = extractFences(doc.preamble);
  const meta = parseMeta(fences.find((f) => f.lang === 'meta')?.code ?? '');
  const category: QuizCategory = {
    id: categoryId,
    title: doc.title || categoryId,
    description: meta.get('description')?.[0] ?? rest,
    color: COLORS[categoryId] ?? 'c1',
  };

  while (i < lines.length) {
    const header = /^::: (mcq|order|match|lines|blank) ([a-z0-9-]+)\s*$/.exec(lines[i]);
    if (!header) {
      if (lines[i].trim()) throw new Error(`${file}:${i + 1}: expected "::: <type> <id>", got "${lines[i]}"`);
      i++;
      continue;
    }
    const startLine = i + 1;
    const body: string[] = [];
    i++;
    while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
    if (i >= lines.length) throw new Error(`${file}:${startLine}: unterminated question block`);
    i++;
    questions.push(parseQuestion(header[1] as QuizQuestion['type'], header[2], categoryId, body, `${file}:${startLine}`));
  }

  return { category, questions };
}

function parseQuestion(type: QuizQuestion['type'], id: string, category: string, body: string[], where: string): QuizQuestion {
  const attrs: Record<string, string> = {};
  let k = 0;
  for (;;) {
    while (k < body.length && !body[k].trim()) k++;
    const attr = /^(lesson|problem):\s*([a-z0-9-]+)\s*$/.exec(body[k] ?? '');
    if (!attr) break;
    attrs[attr[1]] = attr[2];
    k++;
  }
  const sep = body.findIndex((l) => l.trim() === '???');
  if (sep < 0) throw new Error(`${where}: missing "???" before the explanation`);
  const main = body.slice(k, sep);
  const explanation = body
    .slice(sep + 1)
    .join('\n')
    .trim();
  if (!explanation) throw new Error(`${where}: empty explanation`);
  const base = { id, category, explanation, lesson: attrs.lesson, problem: attrs.problem };

  if (type === 'lines' || type === 'blank') return parseCodeQuestion(type, base, main, where);

  const itemRe = type === 'mcq' ? /^- \[( |x)\] (.+)$/ : type === 'order' ? /^\d+\. (.+)$/ : /^- (.+?) => (.+)$/;
  const firstItem = main.findIndex((l) => itemRe.test(l));
  if (firstItem < 0) throw new Error(`${where}: no answer lines found`);
  const prompt = main.slice(0, firstItem).join('\n').trim();
  if (!prompt) throw new Error(`${where}: empty prompt`);
  const items = main
    .slice(firstItem)
    .filter((l) => l.trim())
    .map((l) => {
      const m = itemRe.exec(l);
      if (!m) throw new Error(`${where}: unexpected line after answers: "${l}"`);
      return m;
    });

  if (type === 'mcq') {
    const correct = items.map((m, idx) => (m[1] === 'x' ? idx : -1)).filter((idx) => idx >= 0);
    if (items.length < 2 || !correct.length) throw new Error(`${where}: mcq needs 2+ options and a [x] answer`);
    return { ...base, prompt, type, options: items.map((m) => m[2].trim()), correct };
  }
  if (type === 'order') {
    if (items.length < 3) throw new Error(`${where}: order needs 3+ items`);
    return { ...base, prompt, type, items: items.map((m) => m[1].trim()) };
  }
  if (items.length < 3) throw new Error(`${where}: match needs 3+ pairs`);
  return { ...base, prompt, type: 'match', pairs: items.map((m) => [m[1].trim(), m[2].trim()] as [string, string]) };
}

type Base = Omit<QuizBase, 'prompt'>;

function parseCodeQuestion(type: 'lines' | 'blank', base: Base, main: string[], where: string): QuizQuestion {
  const open = main.findIndex((l) => /^```\w*/.test(l));
  if (open < 0) throw new Error(`${where}: ${type} questions need a fenced code block`);
  const close = main.findIndex((l, i) => i > open && l.trim() === '```');
  if (close < 0) throw new Error(`${where}: unterminated code block`);
  const lang = main[open].slice(3).trim() || 'python';
  const prompt = main.slice(0, open).join('\n').trim();
  if (!prompt) throw new Error(`${where}: empty prompt`);
  const code = main.slice(open + 1, close);
  const after = main.slice(close + 1).filter((l) => l.trim());

  if (type === 'lines') {
    const items = code.filter((l) => l.trim()).map((l) => l.replace(/\s+$/, ''));
    if (items.length < 3) throw new Error(`${where}: lines needs 3+ code lines`);
    if (after.length) throw new Error(`${where}: unexpected text after the code block`);
    return { ...base, prompt, type, lang, items };
  }

  const parts: BlankPart[] = [];
  const answers: string[] = [];
  const src = code.join('\n');
  const re = /\{\{(.+?)\}\}/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    parts.push({ blank: answers.length });
    answers.push(m[1]);
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push(src.slice(last));
  if (!answers.length) throw new Error(`${where}: blank needs at least one {{gap}}`);
  let distractors: string[] = [];
  for (const l of after) {
    const m = /^- extra:\s*(.+)$/.exec(l);
    if (!m) throw new Error(`${where}: unexpected line after the code: "${l}"`);
    distractors = [...new Set(m[1].split('|').map((x) => x.trim()))].filter((x) => x && !answers.includes(x));
  }
  return { ...base, prompt, type, lang, parts, answers, distractors };
}

/** Deterministic shuffle so a question looks the same on every render. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Never present an ordering question already solved.
  if (out.length > 1 && out.every((x, i) => x === items[i])) [out[0], out[1]] = [out[1], out[0]];
  return out;
}
