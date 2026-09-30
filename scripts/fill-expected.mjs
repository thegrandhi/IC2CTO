// Fills in missing "out" values in content/problems/*.md test lines by running
// the Python reference solution, cross-checked against the JavaScript one.
//
//   node scripts/fill-expected.mjs            # all problems
//   node scripts/fill-expected.mjs two-sum    # just one
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'content', 'problems');
const only = process.argv.slice(2);

const { module: problemsMod } = await runnerImport(join(root, 'src/lib/content/problems.ts'));
const { module: jsHarness } = await runnerImport(join(root, 'src/lib/runner/jsHarness.ts'));
const { module: compare } = await runnerImport(join(root, 'src/lib/runner/compare.ts'));

/** JSON formatted like Python's json.dumps: `{"a": [1, 2]}`. */
function pyJson(v) {
  if (Array.isArray(v)) return `[${v.map(pyJson).join(', ')}]`;
  if (v && typeof v === 'object') return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${pyJson(x)}`).join(', ')}}`;
  return JSON.stringify(v);
}

function orderKeys(t) {
  const keys = ['in', 'ops', 'args', 'out', 'why'];
  const o = {};
  for (const k of keys) if (k in t) o[k] = t[k];
  for (const k of Object.keys(t)) if (!(k in o)) o[k] = t[k];
  return o;
}

const files = readdirSync(dir).filter((f) => f.endsWith('.md') && (!only.length || only.includes(f.replace(/\.md$/, ''))));
const jobs = [];
const problems = new Map();
for (const f of files) {
  const id = f.replace(/\.md$/, '');
  const src = readFileSync(join(dir, f), 'utf8');
  const p = problemsMod.parseProblem(id, src);
  problems.set(id, { p, src });
  const missing = p.tests.map((t, i) => (t.out === undefined ? i : -1)).filter((i) => i >= 0);
  if (!missing.length) continue;
  if (!p.solutions.python) throw new Error(`${id}: no Python reference solution`);
  jobs.push({ id, code: p.solutions.python, spec: p.spec, tests: missing.map((i) => p.tests[i]), missing });
}

if (!jobs.length) {
  console.log('Nothing to fill.');
  process.exit(0);
}

const proc = spawnSync('python3', [join(root, 'scripts', 'py_runner.py')], {
  input: JSON.stringify(jobs.map(({ missing, ...j }) => j)),
  encoding: 'utf8',
  maxBuffer: 1 << 28,
});
if (proc.status !== 0) {
  console.error(proc.stderr);
  process.exit(1);
}
const results = JSON.parse(proc.stdout);

let failed = false;
for (const [k, job] of jobs.entries()) {
  const { p, src } = problems.get(job.id);
  const res = results[k];
  if (res.compileError) {
    console.error(`${job.id}: Python reference failed to load:\n${res.compileError}`);
    failed = true;
    continue;
  }
  const js = p.solutions.javascript ? jsHarness.prepareJs(p.solutions.javascript, p.spec) : null;
  if (js?.error) {
    console.error(`${job.id}: JS reference failed to load: ${js.error}`);
    failed = true;
    continue;
  }
  const filled = new Map();
  job.missing.forEach((testIndex, j) => {
    const r = res.results[j];
    const test = p.tests[testIndex];
    if (!r.ok) {
      console.error(`${job.id}: test ${testIndex + 1} errored in Python reference:\n${r.error}`);
      failed = true;
      return;
    }
    if (js) {
      const jr = js.runOne(test);
      if (!jr.ok || !compare.outputsMatch(jr.output, r.output, p.compare)) {
        console.error(`${job.id}: test ${testIndex + 1}: JS reference disagrees.\n  py: ${pyJson(r.output)}\n  js: ${jr.ok ? pyJson(jr.output) : jr.error}`);
        failed = true;
        return;
      }
    }
    filled.set(testIndex, r.output);
  });
  if (!filled.size) continue;

  // Rewrite the test lines inside the "## Tests" fence.
  const lines = src.split('\n');
  const start = lines.findIndex((l) => /^## Tests\s*$/.test(l));
  let testIdx = -1;
  let inFence = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      if (inFence) break;
      inFence = true;
      continue;
    }
    if (!inFence || !line.trim() || line.trim().startsWith('//')) continue;
    testIdx++;
    if (filled.has(testIdx)) {
      const t = JSON.parse(line);
      t.out = filled.get(testIdx);
      lines[i] = pyJson(orderKeys(t));
    }
  }
  writeFileSync(join(dir, `${job.id}.md`), lines.join('\n'));
  console.log(`${job.id}: filled ${filled.size} expected output(s)`);
}
process.exit(failed ? 1 : 0);
