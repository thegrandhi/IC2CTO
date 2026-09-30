// JavaScript test harness. Runs inside the JS Web Worker in the browser and
// directly under Node in the content verification tests.
import type { DesignTest, ExecReport, FunctionTest, RawResult, RunSpec, TestCase, TypeName } from '../types';

const MAX_NODES = 200_000;
const MAX_STDOUT = 20_000;

export class ListNode {
  val: unknown;
  next: ListNode | null;
  constructor(val: unknown = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

export class TreeNode {
  val: unknown;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val: unknown = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/** Graph node (Clone Graph etc.). */
export class Node {
  val: unknown;
  neighbors: Node[];
  constructor(val: unknown = 0, neighbors?: Node[]) {
    this.val = val;
    this.neighbors = neighbors ?? [];
  }
}

class HarnessError extends Error {}

interface Ctx {
  root?: TreeNode | null;
  graphNodes?: Set<Node>;
}

// ------------------------------------------------------------------ builders

function buildList(values: unknown[]): ListNode | null {
  const dummy = new ListNode();
  let cur = dummy;
  for (const v of values) {
    cur.next = new ListNode(v);
    cur = cur.next;
  }
  return dummy.next;
}

function buildCycleList([values, pos]: [unknown[], number]): ListNode | null {
  const head = buildList(values);
  if (head && pos >= 0) {
    const nodes: ListNode[] = [];
    for (let n: ListNode | null = head; n; n = n.next) nodes.push(n);
    nodes[nodes.length - 1].next = nodes[pos];
  }
  return head;
}

function buildTree(values: unknown[]): TreeNode | null {
  if (!values.length || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue: TreeNode[] = [root];
  let qi = 0;
  let i = 1;
  while (qi < queue.length && i < values.length) {
    const node = queue[qi++];
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]);
      queue.push(node.left);
    }
    i++;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

function buildGraph(adj: number[][], ctx: Ctx): Node | null {
  if (!adj.length) {
    ctx.graphNodes = new Set();
    return null;
  }
  const nodes = adj.map((_, i) => new Node(i + 1));
  adj.forEach((nbrs, i) => (nodes[i].neighbors = nbrs.map((j) => nodes[j - 1])));
  ctx.graphNodes = new Set(nodes);
  return nodes[0];
}

function findTreeNode(root: TreeNode | null | undefined, val: unknown): TreeNode {
  const stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.val === val) return node;
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  throw new HarnessError(`Test setup: no node with value ${JSON.stringify(val)} in the tree`);
}

// ------------------------------------------------------------------ serializers

function isListNode(v: unknown): v is ListNode {
  return v instanceof ListNode || (typeof v === 'object' && v !== null && 'val' in v && 'next' in v);
}

function isTreeNode(v: unknown): v is TreeNode {
  return v instanceof TreeNode || (typeof v === 'object' && v !== null && 'val' in v && 'left' in v && 'right' in v);
}

export function plain(v: unknown, depth = 0): unknown {
  if (depth > 1000) throw new HarnessError('The returned value is nested too deeply');
  if (v === undefined || v === null) return null;
  switch (typeof v) {
    case 'number':
      if (Number.isNaN(v)) return 'nan';
      if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
      return Object.is(v, -0) ? 0 : v;
    case 'string':
    case 'boolean':
      return v;
    case 'bigint':
      return Number.isSafeInteger(Number(v)) ? Number(v) : v.toString();
    case 'function':
      return `[Function ${(v as { name?: string }).name || 'anonymous'}]`;
    case 'symbol':
      return v.toString();
  }
  if (Array.isArray(v)) return Array.from(v, (x) => plain(x, depth + 1));
  if (ArrayBuffer.isView(v)) return Array.from(v as unknown as ArrayLike<number>, (x) => plain(x, depth + 1));
  if (v instanceof Set) return Array.from(v, (x) => plain(x, depth + 1));
  if (v instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, x] of v) obj[String(k)] = plain(x, depth + 1);
    return obj;
  }
  if (isListNode(v)) return serList(v);
  if (isTreeNode(v)) return serTree(v);
  const obj: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as object)) obj[k] = plain(x, depth + 1);
  return obj;
}

function serList(head: unknown): unknown[] {
  const out: unknown[] = [];
  const seen = new Set<unknown>();
  let node = head;
  while (node !== null && node !== undefined) {
    if (!isListNode(node)) throw new HarnessError(`Expected a ListNode but found ${describe(node)}`);
    if (seen.has(node)) throw new HarnessError('The returned linked list contains a cycle');
    seen.add(node);
    out.push(plain(node.val));
    if (out.length > MAX_NODES) throw new HarnessError('The returned linked list is too long');
    node = node.next;
  }
  return out;
}

function serTree(root: unknown): unknown[] {
  if (root === null || root === undefined) return [];
  if (!isTreeNode(root)) throw new HarnessError(`Expected a TreeNode but found ${describe(root)}`);
  const out: unknown[] = [];
  const seen = new Set<unknown>();
  const queue: (TreeNode | null)[] = [root];
  for (let qi = 0; qi < queue.length; qi++) {
    const node = queue[qi];
    if (!node) {
      out.push(null);
      continue;
    }
    if (seen.has(node)) throw new HarnessError('The returned tree contains a cycle');
    seen.add(node);
    if (seen.size > MAX_NODES) throw new HarnessError('The returned tree is too large');
    out.push(plain(node.val));
    queue.push(node.left ?? null, node.right ?? null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function serGraph(node: unknown, inputNodes: Set<Node> | undefined): unknown[] {
  if (node === null || node === undefined) return [];
  const byVal = new Map<number, number[]>();
  const seen = new Set<Node>([node as Node]);
  const queue: Node[] = [node as Node];
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi];
    if (inputNodes?.has(cur)) throw new HarnessError('The returned graph reuses nodes from the input; return a deep copy');
    const nbrs = cur.neighbors ?? [];
    byVal.set(cur.val as number, nbrs.map((n) => n.val as number));
    for (const n of nbrs) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  const max = Math.max(...byVal.keys());
  return Array.from({ length: max }, (_, i) => byVal.get(i + 1) ?? []);
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v === 'object' ? (v.constructor?.name ?? 'object') : typeof v;
}

// ------------------------------------------------------------------ conversion by declared type

function toJs(value: unknown, type: TypeName, ctx: Ctx): unknown {
  switch (type) {
    case 'ListNode':
      return buildList(value as unknown[]);
    case 'ListNode[]':
      return (value as unknown[][]).map(buildList);
    case 'ListNodeCycle':
      return buildCycleList(value as [unknown[], number]);
    case 'TreeNode': {
      const tree = buildTree(value as unknown[]);
      if (!('root' in ctx)) ctx.root = tree;
      return tree;
    }
    case 'TreeNodeRef':
      return findTreeNode(ctx.root, value);
    case 'GraphNode':
      return buildGraph(value as number[][], ctx);
    default:
      return structuredClone(value);
  }
}

function fromJs(value: unknown, type: TypeName, ctx: Ctx): unknown {
  switch (type) {
    case 'void':
      return null;
    case 'ListNode':
    case 'ListNodeCycle':
      return value === null || value === undefined || isListNode(value) ? serList(value) : plain(value);
    case 'ListNode[]':
      return (value as unknown[]).map(serList);
    case 'TreeNode':
      return value === null || value === undefined || isTreeNode(value) ? serTree(value) : plain(value);
    case 'TreeNodeRef':
      return isTreeNode(value) ? plain(value.val) : plain(value);
    case 'GraphNode':
      return serGraph(value, ctx.graphNodes);
    case 'bool':
      if (value === 0 || value === 1) return value === 1;
      return plain(value);
    default:
      return plain(value);
  }
}

// ------------------------------------------------------------------ console capture

export function formatValue(v: unknown, top = true, seen = new Set<unknown>()): string {
  if (typeof v === 'string') return top ? v : JSON.stringify(v);
  if (v === undefined) return 'undefined';
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'function') return `[Function: ${v.name || 'anonymous'}]`;
    if (typeof v === 'bigint') return `${v}n`;
    return String(v);
  }
  if (seen.has(v)) return '[Circular]';
  seen.add(v);
  try {
    if (Array.isArray(v)) return `[${v.map((x) => formatValue(x, false, seen)).join(', ')}]`;
    if (v instanceof Map)
      return `Map(${v.size}) {${[...v].map(([k, x]) => `${formatValue(k, false, seen)} => ${formatValue(x, false, seen)}`).join(', ')}}`;
    if (v instanceof Set) return `Set(${v.size}) {${[...v].map((x) => formatValue(x, false, seen)).join(', ')}}`;
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof ListNode) {
      const vals: string[] = [];
      let n: ListNode | null = v;
      const guard = new Set<ListNode>();
      while (n && vals.length < 20 && !guard.has(n)) {
        guard.add(n);
        vals.push(formatValue(n.val, false));
        n = n.next;
      }
      return `ListNode(${vals.join(' -> ')}${n ? ' -> ...' : ''})`;
    }
    if (v instanceof TreeNode) return `TreeNode(${formatValue(v.val, false)})`;
    const name = v.constructor && v.constructor !== Object ? v.constructor.name + ' ' : '';
    return `${name}{${Object.entries(v)
      .map(([k, x]) => `${k}: ${formatValue(x, false, seen)}`)
      .join(', ')}}`;
  } finally {
    seen.delete(v);
  }
}

interface OutputBuffer {
  text: string;
}

function makeConsole(buf: OutputBuffer) {
  const write = (...args: unknown[]) => {
    if (buf.text.length >= MAX_STDOUT) return;
    buf.text += args.map((a) => formatValue(a)).join(' ') + '\n';
  };
  return { log: write, info: write, warn: write, error: write, debug: write, table: write, dir: write };
}

function takeOutput(buf: OutputBuffer): string {
  const text = buf.text.length >= MAX_STDOUT ? buf.text.slice(0, MAX_STDOUT) + '\n... output truncated ...' : buf.text;
  buf.text = '';
  return text;
}

// ------------------------------------------------------------------ errors

let lineOffset: number | null = null;

/** Line number of the first body line inside `new Function(...)` code, as reported by stack traces. */
function getLineOffset(): number {
  if (lineOffset === null) {
    lineOffset = 2;
    try {
      new Function('a', 'b', 'c', 'd', 'throw new Error("probe")')();
    } catch (e) {
      const m = /(?:<anonymous>|Function):(\d+):\d+/.exec(String((e as Error).stack));
      if (m) lineOffset = Number(m[1]) - 1;
    }
  }
  return lineOffset;
}

function formatError(e: unknown): string {
  if (e instanceof HarnessError) return e.message;
  if (!(e instanceof Error)) return `Uncaught ${formatValue(e, false)}`;
  let msg = `${e.name}: ${e.message}`;
  const m = /(?:<anonymous>|Function):(\d+):(\d+)/.exec(String(e.stack));
  if (m) msg += ` (line ${Number(m[1]) - getLineOffset()})`;
  return msg;
}

// ------------------------------------------------------------------ entry points

export interface PreparedJs {
  error?: string;
  stdout: string;
  runOne(test: TestCase): RawResult;
}

function compile(code: string, exportName: string | null, buf: OutputBuffer): unknown {
  getLineOffset();
  const tail = exportName ? `\n;return typeof ${exportName} === 'undefined' ? undefined : ${exportName};` : '';
  const factory = new Function('ListNode', 'TreeNode', 'Node', 'console', code + tail);
  return factory(ListNode, TreeNode, Node, makeConsole(buf));
}

export function prepareJs(code: string, spec: RunSpec): PreparedJs {
  const buf: OutputBuffer = { text: '' };
  let target: unknown;
  try {
    target = compile(code, spec.fn.name, buf);
  } catch (e) {
    return { error: formatError(e), stdout: takeOutput(buf), runOne: () => ({ ok: false, stdout: '', ms: 0 }) };
  }
  const stdout = takeOutput(buf);
  if (typeof target !== 'function') {
    const what = spec.kind === 'design' ? `a class named ${spec.fn.name}` : `a function named ${spec.fn.name}`;
    return { error: `Couldn't find ${what} in your code.`, stdout, runOne: () => ({ ok: false, stdout: '', ms: 0 }) };
  }

  const runFunction = (test: FunctionTest, ctx: Ctx) => {
    const params = spec.fn.params;
    const args = test.in.map((v, i) => toJs(v, params[i].type, ctx));
    const start = performance.now();
    const result = (target as (...a: unknown[]) => unknown)(...args);
    const ms = performance.now() - start;
    if (result instanceof Promise) throw new HarnessError('Your function returned a Promise; return the value directly.');
    const output =
      spec.mutates !== null ? fromJs(args[spec.mutates], params[spec.mutates].type, ctx) : fromJs(result, spec.fn.returns, ctx);
    return { output, ms };
  };

  const runDesign = (test: DesignTest, ctx: Ctx) => {
    const Cls = target as new (...a: unknown[]) => Record<string, unknown>;
    const methods = new Map(spec.methods.map((m) => [m.name, m]));
    const outputs: unknown[] = [];
    let obj: Record<string, unknown> | null = null;
    let ms = 0;
    test.ops.forEach((op, i) => {
      const m = i === 0 ? spec.fn : methods.get(op);
      if (!m) throw new HarnessError(`Test setup: unknown operation ${op}`);
      const rawArgs = test.args[i];
      try {
        const args = rawArgs.map((v, j) => toJs(v, m.params[j].type, ctx));
        const start = performance.now();
        let result: unknown = null;
        if (i === 0) obj = new Cls(...args);
        else {
          const method = obj![op];
          if (typeof method !== 'function') throw new HarnessError(`${spec.fn.name} has no method ${op}()`);
          result = (method as (...a: unknown[]) => unknown).apply(obj, args);
        }
        ms += performance.now() - start;
        outputs.push(i === 0 ? null : fromJs(result, m.returns, ctx));
      } catch (e) {
        const call = `${op}(${rawArgs.map((a) => JSON.stringify(a)).join(', ')})`;
        throw new HarnessError(`Operation #${i + 1} ${call} failed:\n${formatError(e)}`);
      }
    });
    return { output: outputs, ms };
  };

  return {
    stdout,
    runOne(test: TestCase): RawResult {
      const ctx: Ctx = {};
      try {
        const { output, ms } = 'ops' in test ? runDesign(test, ctx) : runFunction(test, ctx);
        return { ok: true, output, stdout: takeOutput(buf), ms };
      } catch (e) {
        return { ok: false, error: formatError(e), stdout: takeOutput(buf), ms: 0 };
      }
    },
  };
}

export function execJs(code: string): ExecReport {
  const buf: OutputBuffer = { text: '' };
  const start = performance.now();
  let error: string | undefined;
  try {
    const result = compile(code, null, buf);
    if (result instanceof Promise) result.catch(() => undefined);
  } catch (e) {
    error = formatError(e);
  }
  return { stdout: takeOutput(buf), error, ms: performance.now() - start };
}
