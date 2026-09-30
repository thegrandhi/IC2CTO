import type { CompareMode, Difficulty, Lang, Problem, RunSpec, TestCase } from '../types';
import { extractFences, parseBullets, parseMeta, splitDoc } from './markdown';
import { parseSignature, starterFor } from './signature';

export const TOPICS = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  '1-D DP',
  '2-D DP',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
] as const;

const COMPARE_MODES: CompareMode[] = ['exact', 'unordered', 'unorderedDeep', 'float'];
const LANG_FENCES: Record<string, Lang> = { python: 'python', py: 'python', javascript: 'javascript', js: 'javascript' };

function one(meta: Map<string, string[]>, key: string, file: string, required = true): string | undefined {
  const v = meta.get(key);
  if (!v) {
    if (required) throw new Error(`${file}: missing "${key}" in meta`);
    return undefined;
  }
  if (v.length > 1) throw new Error(`${file}: "${key}" given more than once`);
  return v[0];
}

function parseTests(src: string, file: string): TestCase[] {
  const { fences } = extractFences(src);
  const fence = fences[0];
  if (!fence) throw new Error(`${file}: "## Tests" needs a fenced block with one JSON test per line`);
  return fence.code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'))
    .map((l, i) => {
      try {
        return JSON.parse(l) as TestCase;
      } catch (e) {
        throw new Error(`${file}: test line ${i + 1} is not valid JSON: ${(e as Error).message}`);
      }
    });
}

export function parseProblem(id: string, md: string): Problem {
  const file = `${id}.md`;
  const doc = splitDoc(md);
  if (!doc.title) throw new Error(`${file}: missing "# Title"`);

  const { fences: preFences, rest: description } = extractFences(doc.preamble);
  const metaFence = preFences.find((f) => f.lang === 'meta');
  if (!metaFence) throw new Error(`${file}: missing \`\`\`meta block`);
  const meta = parseMeta(metaFence.code);

  const difficulty = one(meta, 'difficulty', file) as Difficulty;
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) throw new Error(`${file}: bad difficulty ${difficulty}`);
  const topic = one(meta, 'topic', file)!;
  if (!(TOPICS as readonly string[]).includes(topic)) throw new Error(`${file}: unknown topic "${topic}"`);

  let spec: RunSpec;
  const cls = one(meta, 'class', file, false);
  if (cls) {
    spec = {
      kind: 'design',
      fn: parseSignature(cls),
      methods: (meta.get('method') ?? []).map(parseSignature),
      mutates: null,
    };
    if (!spec.methods.length) throw new Error(`${file}: design problems need at least one "method:"`);
  } else {
    const fn = parseSignature(one(meta, 'signature', file)!);
    const mutatesName = one(meta, 'mutates', file, false);
    let mutates: number | null = null;
    if (mutatesName) {
      mutates = fn.params.findIndex((p) => p.name === mutatesName);
      if (mutates < 0) throw new Error(`${file}: mutates "${mutatesName}" is not a parameter`);
    }
    spec = { kind: 'function', fn, methods: [], mutates };
  }

  const compare = (one(meta, 'compare', file, false) ?? 'exact') as CompareMode;
  if (!COMPARE_MODES.includes(compare)) throw new Error(`${file}: bad compare mode ${compare}`);

  const solutionSrc = doc.sections.get('solution') ?? '';
  const { fences: solFences, rest: explanation } = extractFences(solutionSrc);
  const solutions: Partial<Record<Lang, string>> = {};
  for (const f of solFences) {
    const lang = LANG_FENCES[f.lang];
    if (lang) solutions[lang] = f.code.trimEnd() + '\n';
  }

  const starter: Record<Lang, string> = {
    python: starterFor(spec, 'python'),
    javascript: starterFor(spec, 'javascript'),
  };
  const starterSrc = doc.sections.get('starter');
  if (starterSrc) {
    for (const f of extractFences(starterSrc).fences) {
      const lang = LANG_FENCES[f.lang];
      if (lang) starter[lang] = f.code.trimEnd() + '\n';
    }
  }

  const testsSrc = doc.sections.get('tests');
  if (!testsSrc) throw new Error(`${file}: missing "## Tests"`);
  const tests = parseTests(testsSrc, file);
  for (const [i, t] of tests.entries()) {
    if (spec.kind === 'function') {
      const ft = t as { in?: unknown[] };
      if (!Array.isArray(ft.in) || ft.in.length !== spec.fn.params.length) {
        throw new Error(`${file}: test ${i + 1} must have "in" with ${spec.fn.params.length} argument(s)`);
      }
    } else {
      const dt = t as { ops?: string[]; args?: unknown[][] };
      if (!Array.isArray(dt.ops) || !Array.isArray(dt.args) || dt.ops.length !== dt.args.length) {
        throw new Error(`${file}: design test ${i + 1} needs "ops" and "args" of equal length`);
      }
      if (dt.ops[0] !== spec.fn.name) throw new Error(`${file}: design test ${i + 1} must start with ${spec.fn.name}`);
    }
  }

  const lc = one(meta, 'lc', file, false);
  const examples = Number(one(meta, 'examples', file, false) ?? Math.min(3, tests.length));

  return {
    id,
    title: doc.title,
    difficulty,
    topic,
    tags: (one(meta, 'tags', file, false) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    lc: lc ? Number(lc) : undefined,
    spec,
    compare,
    description,
    hints: parseBullets(doc.sections.get('hints') ?? ''),
    explanation,
    solutions,
    starter,
    time: one(meta, 'time', file, false),
    space: one(meta, 'space', file, false),
    tests,
    examples,
  };
}

const DIFF_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function sortProblems(problems: Problem[]): Problem[] {
  const topicIndex = (t: string) => (TOPICS as readonly string[]).indexOf(t);
  return [...problems].sort(
    (a, b) =>
      topicIndex(a.topic) - topicIndex(b.topic) ||
      DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] ||
      a.title.localeCompare(b.title),
  );
}
