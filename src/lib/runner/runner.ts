import type { ExecReport, Lang, Problem, RunReport, TestOutcome } from '../types';
import { judge } from './compare';
import { WorkerHost } from './workerHost';

const pyodideUrl = () => new URL('pyodide/', document.baseURI).href;

export const runners: Record<Lang, WorkerHost> = {
  python: new WorkerHost(() => new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' }), {
    stepTimeoutMs: 8000,
    initTimeoutMs: 90_000,
    initData: () => ({ pyodideUrl: pyodideUrl() }),
  }),
  javascript: new WorkerHost(() => new Worker(new URL('./jsWorker.ts', import.meta.url), { type: 'module' }), {
    stepTimeoutMs: 5000,
    initTimeoutMs: 15_000,
  }),
};

const EXEC_TIMEOUT: Record<Lang, number> = { python: 15_000, javascript: 8_000 };

export function timeLimitMessage(lang: Lang): string {
  const secs = lang === 'python' ? 8 : 5;
  return `Time Limit Exceeded: no result after ${secs}s. Look for an infinite loop or an algorithm that is too slow for this input.`;
}

/**
 * Runs `code` against the selected tests of `problem` and judges the results.
 * `onProgress` receives the partial outcomes as each test finishes.
 */
export async function runProblem(
  problem: Problem,
  lang: Lang,
  code: string,
  testIndices: number[],
  onProgress?: (outcomes: (TestOutcome | undefined)[]) => void,
): Promise<RunReport> {
  const tests = testIndices.map((i) => problem.tests[i]);
  const outcomes: (TestOutcome | undefined)[] = new Array(tests.length).fill(undefined);
  const raw = await runners[lang].run(code, problem.spec, tests, (index, result) => {
    outcomes[index] = judge(result, tests[index], problem.compare);
    onProgress?.([...outcomes]);
  });
  if (raw.compileError) return { compileError: raw.compileError, stdout: raw.stdout, results: [] };
  const results: TestOutcome[] = tests.map((test, i) => {
    const r = raw.results[i];
    if (r) return judge(r, test, problem.compare);
    if (raw.timedOutAt === i) return { status: 'timeout', error: timeLimitMessage(lang), stdout: '', ms: 0 };
    if (raw.crashed && i === raw.results.length) return { status: 'error', error: raw.crashed, stdout: '', ms: 0 };
    return { status: 'skipped', stdout: '', ms: 0 };
  });
  return { stdout: raw.stdout, results };
}

export function execCode(lang: Lang, code: string): Promise<ExecReport> {
  return runners[lang].exec(code, EXEC_TIMEOUT[lang]);
}
