import type { CompareMode, RawResult, TestCase, TestOutcome } from '../types';

const FLOAT_TOL = 1e-5;

/** JSON with sorted object keys, used as a canonical sort key. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

function sortDeep(v: unknown): unknown {
  if (!Array.isArray(v)) return v;
  return v.map(sortDeep).sort((a, b) => {
    const ka = canonical(a);
    const kb = canonical(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

function sortTop(v: unknown): unknown {
  if (!Array.isArray(v)) return v;
  return [...v].sort((a, b) => {
    const ka = canonical(a);
    const kb = canonical(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

function deepEqual(a: unknown, b: unknown, floatTol: boolean): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return true;
    return floatTol && Math.abs(a - b) <= FLOAT_TOL * Math.max(1, Math.abs(b));
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i], floatTol));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], floatTol));
  }
  return a === b;
}

export function outputsMatch(actual: unknown, expected: unknown, mode: CompareMode): boolean {
  switch (mode) {
    case 'unordered':
      return deepEqual(sortTop(actual), sortTop(expected), false);
    case 'unorderedDeep':
      return deepEqual(sortDeep(actual), sortDeep(expected), false);
    case 'float':
      return deepEqual(actual, expected, true);
    default:
      return deepEqual(actual, expected, false);
  }
}

/** Turns raw harness results into pass/fail outcomes. */
export function judge(raw: RawResult, test: TestCase, mode: CompareMode): TestOutcome {
  if (!raw.ok) return { status: 'error', error: raw.error, stdout: raw.stdout, ms: raw.ms };
  const pass = outputsMatch(raw.output, test.out, mode);
  return { status: pass ? 'pass' : 'fail', output: raw.output, stdout: raw.stdout, ms: raw.ms };
}
