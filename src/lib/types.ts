export type Lang = 'python' | 'javascript';
export const ALL_LANGS: Lang[] = ['python', 'javascript'];
/** A build can leave out the Python runtime (VITE_PYTHON=off) for hosts that can't serve it; JavaScript always runs. */
export const PYTHON_AVAILABLE = import.meta.env.VITE_PYTHON !== 'off';
/** Languages the user can run code in. */
export const LANGS: Lang[] = PYTHON_AVAILABLE ? ALL_LANGS : ['javascript'];
export const LANG_LABEL: Record<Lang, string> = { python: 'Python', javascript: 'JavaScript' };

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

/** A value type in a problem signature, e.g. `int`, `int[][]`, `ListNode`, `TreeNode`. */
export type TypeName = string;

export interface Param {
  name: string;
  type: TypeName;
}

export interface Method {
  name: string;
  params: Param[];
  returns: TypeName;
}

/**
 * How the runner calls user code. For `function` problems `fn` is the method
 * on `class Solution` (Python) or a top-level function (JavaScript). For
 * `design` problems `fn` is the class constructor and `methods` its API.
 */
export interface RunSpec {
  kind: 'function' | 'design';
  fn: Method;
  methods: Method[];
  /** Index of a parameter that is modified in place and should be judged instead of the return value. */
  mutates: number | null;
}

export type CompareMode = 'exact' | 'unordered' | 'unorderedDeep' | 'float';

export interface FunctionTest {
  in: unknown[];
  out?: unknown;
  why?: string;
}

export interface DesignTest {
  ops: string[];
  args: unknown[][];
  out?: unknown[];
  why?: string;
}

export type TestCase = FunctionTest | DesignTest;

export function isDesignTest(t: TestCase): t is DesignTest {
  return (t as DesignTest).ops !== undefined;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  tags: string[];
  lc?: number;
  spec: RunSpec;
  compare: CompareMode;
  description: string;
  hints: string[];
  explanation: string;
  solutions: Partial<Record<Lang, string>>;
  starter: Record<Lang, string>;
  time?: string;
  space?: string;
  tests: TestCase[];
  /** The first `examples` tests are shown in the statement and used by "Run". */
  examples: number;
}

/** What a language harness reports for a single test, before judging. */
export interface RawResult {
  ok: boolean;
  output?: unknown;
  error?: string;
  stdout: string;
  ms: number;
}

export type TestStatus = 'pass' | 'fail' | 'error' | 'timeout' | 'skipped';

export interface TestOutcome {
  status: TestStatus;
  output?: unknown;
  error?: string;
  stdout: string;
  ms: number;
}

export interface RunReport {
  compileError?: string;
  stdout?: string;
  results: TestOutcome[];
}

export interface ExecReport {
  stdout: string;
  error?: string;
  ms: number;
}
