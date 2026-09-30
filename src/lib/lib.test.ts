import { describe, expect, it } from 'vitest';
import { extractFences, parseBullets, splitDoc } from './content/markdown';
import { parseQuizFile } from './content/quiz';
import { parseSignature, pythonStarter, javascriptStarter } from './content/signature';
import { outputsMatch } from './runner/compare';
import { prepareJs } from './runner/jsHarness';
import { addDays, schedule } from './srs';

describe('markdown helpers', () => {
  it('splits sections but ignores headings inside code fences', () => {
    const doc = splitDoc('# Title\n\nintro\n\n## A\n```py\n## not a heading\n```\n## B\nb text');
    expect(doc.title).toBe('Title');
    expect(doc.preamble).toBe('intro');
    expect([...doc.sections.keys()]).toEqual(['a', 'b']);
    expect(doc.sections.get('a')).toContain('## not a heading');
  });

  it('extracts fences', () => {
    const { fences, rest } = extractFences('text\n```python\nx = 1\n```\nmore');
    expect(fences).toEqual([{ lang: 'python', info: 'python', code: 'x = 1' }]);
    expect(rest).toBe('text\nmore');
  });

  it('parses bullets with continuation lines', () => {
    expect(parseBullets('- one\n  two\n- three')).toEqual(['one two', 'three']);
  });
});

describe('signatures and starters', () => {
  it('parses a signature', () => {
    expect(parseSignature('twoSum(nums: int[], target: int) -> int[]')).toEqual({
      name: 'twoSum',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' },
      ],
      returns: 'int[]',
    });
    expect(() => parseSignature('f(x: banana)')).toThrow();
  });

  it('generates starters', () => {
    const spec = { kind: 'function' as const, fn: parseSignature('f(head: ListNode) -> ListNode'), methods: [], mutates: null };
    expect(pythonStarter(spec)).toContain('def f(self, head: Optional[ListNode]) -> Optional[ListNode]:');
    expect(javascriptStarter(spec)).toContain('function f(head) {');
  });
});

describe('compare', () => {
  it('handles order-insensitive and float modes', () => {
    expect(outputsMatch([[1, 2], [3]], [[3], [2, 1]], 'unorderedDeep')).toBe(true);
    expect(outputsMatch([[1, 2], [3]], [[3], [2, 1]], 'unordered')).toBe(false);
    expect(outputsMatch([2, 1], [1, 2], 'unordered')).toBe(true);
    expect(outputsMatch(0.1 + 0.2, 0.3, 'float')).toBe(true);
    expect(outputsMatch(0.1 + 0.2, 0.3, 'exact')).toBe(false);
    expect(outputsMatch([1, [2]], [1, [2]], 'exact')).toBe(true);
    expect(outputsMatch(true, 1, 'exact')).toBe(false);
  });
});

describe('js harness', () => {
  const spec = { kind: 'function' as const, fn: parseSignature('f(x: int) -> int'), methods: [], mutates: null };

  it('captures console output and reports line numbers', () => {
    const p = prepareJs('function f(x) {\n  console.log("x is", x);\n  return x.nope.boom;\n}', spec);
    const r = p.runOne({ in: [3] });
    expect(r.ok).toBe(false);
    expect(r.stdout).toBe('x is 3\n');
    expect(r.error).toMatch(/TypeError.*\(line 3\)/);
  });

  it('reports a missing function', () => {
    expect(prepareJs('function g() {}', spec).error).toMatch(/function named f/);
  });

  it('reports syntax errors', () => {
    expect(prepareJs('function f( {', spec).error).toMatch(/SyntaxError/);
  });
});

describe('quiz parsing', () => {
  const md = `# Code

::: blank b1
problem: two-sum
Fill it.

\`\`\`python
x = {{a + b}}
y = {{c}}
\`\`\`
- extra: a - b | c | d
???
Because reasons, explained at length here.
:::

::: lines l1
Order it.

\`\`\`python
a = 1
if a:
    return a
\`\`\`
???
Explanation text goes here, long enough.
:::
`;
  it('parses blank and lines questions', () => {
    const { questions } = parseQuizFile('code', md);
    const [b, l] = questions;
    expect(b).toMatchObject({ type: 'blank', problem: 'two-sum', answers: ['a + b', 'c'], distractors: ['a - b', 'd'] });
    expect(b.type === 'blank' && b.parts).toEqual(['x = ', { blank: 0 }, '\ny = ', { blank: 1 }]);
    expect(l).toMatchObject({ type: 'lines', items: ['a = 1', 'if a:', '    return a'] });
  });
});

describe('srs', () => {
  it('grows intervals on success and resets on failure', () => {
    const a = schedule(undefined, 'good', '2026-01-01', 'problem');
    expect(a.interval).toBe(7);
    expect(a.due).toBe('2026-01-08');
    const b = schedule(a, 'good', a.due, 'problem');
    expect(b.interval).toBeGreaterThan(a.interval);
    const c = schedule(b, 'again', b.due, 'problem');
    expect(c.interval).toBe(1);
    expect(c.lapses).toBe(1);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});
