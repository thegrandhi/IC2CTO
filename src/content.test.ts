// Verifies every problem: parses, has both reference solutions, and both
// solutions pass every test through the same harnesses the app uses.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allProblems } from './lib/content';
import { judge } from './lib/runner/compare';
import { prepareJs } from './lib/runner/jsHarness';
import type { Problem, RawResult } from './lib/types';

const problems = allProblems();

function hasPython(): boolean {
  return spawnSync('python3', ['--version']).status === 0;
}

interface PyJobResult {
  id: string;
  compileError: string | null;
  results: RawResult[];
}

function runPython(jobs: { id: string; code: string; problem: Problem }[]): Map<string, PyJobResult> {
  const proc = spawnSync('python3', [join(__dirname, '..', 'scripts', 'py_runner.py')], {
    input: JSON.stringify(jobs.map((j) => ({ id: j.id, code: j.code, spec: j.problem.spec, tests: j.problem.tests }))),
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  if (proc.status !== 0) throw new Error(proc.stderr);
  return new Map((JSON.parse(proc.stdout) as PyJobResult[]).map((r) => [r.id, r]));
}

describe('problem content', () => {
  it('has problems with unique ids and titles', () => {
    expect(problems.length).toBeGreaterThan(0);
    expect(new Set(problems.map((p) => p.title)).size).toBe(problems.length);
  });

  for (const p of problems) {
    describe(p.id, () => {
      it('is complete', () => {
        expect(p.description.length).toBeGreaterThan(40);
        expect(p.hints.length).toBeGreaterThan(0);
        expect(p.explanation.length).toBeGreaterThan(40);
        expect(p.solutions.python).toBeTruthy();
        expect(p.solutions.javascript).toBeTruthy();
        expect(p.tests.length).toBeGreaterThanOrEqual(4);
        expect(p.examples).toBeGreaterThan(0);
        for (const t of p.tests) expect(t.out, `missing "out" in ${JSON.stringify(t)}`).not.toBeUndefined();
      });

      it('JavaScript reference passes every test', () => {
        const prepared = prepareJs(p.solutions.javascript!, p.spec);
        expect(prepared.error).toBeUndefined();
        p.tests.forEach((t, i) => {
          const outcome = judge(prepared.runOne(t), t, p.compare);
          expect(outcome, `test ${i + 1}: ${JSON.stringify(t.out)} vs ${JSON.stringify(outcome.output)}`).toMatchObject({ status: 'pass' });
        });
      });

      it('JavaScript starter code loads but does not pass', () => {
        const prepared = prepareJs(p.starter.javascript, p.spec);
        expect(prepared.error).toBeUndefined();
        const outcomes = p.tests.map((t) => judge(prepared.runOne(t), t, p.compare));
        expect(outcomes.some((o) => o.status !== 'pass')).toBe(true);
      });
    });
  }
});

describe.skipIf(!hasPython())('python references', () => {
  const jobs = problems.flatMap((p) => [
    { id: `${p.id}:solution`, code: p.solutions.python ?? '', problem: p },
    { id: `${p.id}:starter`, code: p.starter.python, problem: p },
  ]);
  const results = runPython(jobs);

  for (const p of problems) {
    it(`${p.id}: Python reference passes every test`, () => {
      const r = results.get(`${p.id}:solution`)!;
      expect(r.compileError).toBeNull();
      p.tests.forEach((t, i) => {
        const outcome = judge(r.results[i], t, p.compare);
        expect(outcome, `test ${i + 1}: ${JSON.stringify(t.out)} vs ${JSON.stringify(outcome.output)} ${outcome.error ?? ''}`).toMatchObject({
          status: 'pass',
        });
      });
    });

    it(`${p.id}: Python starter loads but does not pass`, () => {
      const r = results.get(`${p.id}:starter`)!;
      expect(r.compileError).toBeNull();
      expect(p.tests.some((t, i) => judge(r.results[i], t, p.compare).status !== 'pass')).toBe(true);
    });
  }
});
