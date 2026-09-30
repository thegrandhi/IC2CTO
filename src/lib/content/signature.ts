import type { Lang, Method, Param, RunSpec, TypeName } from '../types';

const BASE_TYPES = new Set([
  'int',
  'float',
  'bool',
  'string',
  'char',
  'void',
  'ListNode',
  'ListNodeCycle',
  'TreeNode',
  'TreeNodeRef',
  'GraphNode',
]);

export function baseType(t: TypeName): { base: string; depth: number } {
  let depth = 0;
  let base = t;
  while (base.endsWith('[]')) {
    base = base.slice(0, -2);
    depth++;
  }
  return { base, depth };
}

function checkType(t: string, where: string): TypeName {
  const { base } = baseType(t);
  if (!BASE_TYPES.has(base)) throw new Error(`Unknown type "${t}" in ${where}`);
  return t;
}

/** Parses `name(a: int[], b: string) -> bool`. The return type defaults to `void`. */
export function parseSignature(src: string): Method {
  const m = /^\s*([A-Za-z_]\w*)\s*\((.*)\)\s*(?:->\s*(\S+))?\s*$/.exec(src);
  if (!m) throw new Error(`Bad signature: ${src}`);
  const [, name, paramSrc, returns = 'void'] = m;
  const params: Param[] = paramSrc.trim()
    ? paramSrc.split(',').map((p) => {
        const pm = /^\s*([A-Za-z_]\w*)\s*:\s*(\S+)\s*$/.exec(p);
        if (!pm) throw new Error(`Bad parameter "${p}" in ${src}`);
        return { name: pm[1], type: checkType(pm[2], src) };
      })
    : [];
  return { name, params, returns: checkType(returns, src) };
}

function usedBases(spec: RunSpec): Set<string> {
  const used = new Set<string>();
  for (const m of [spec.fn, ...spec.methods]) {
    for (const t of [...m.params.map((p) => p.type), m.returns]) used.add(baseType(t).base);
  }
  return used;
}

// ---------------------------------------------------------------- Python

function pyType(t: TypeName): string {
  const { base, depth } = baseType(t);
  let inner: string;
  switch (base) {
    case 'int':
    case 'float':
    case 'bool':
      inner = base;
      break;
    case 'string':
    case 'char':
      inner = 'str';
      break;
    case 'void':
      inner = 'None';
      break;
    case 'ListNode':
    case 'ListNodeCycle':
      inner = 'Optional[ListNode]';
      break;
    case 'TreeNode':
      inner = 'Optional[TreeNode]';
      break;
    case 'TreeNodeRef':
      inner = "'TreeNode'";
      break;
    case 'GraphNode':
      inner = "Optional['Node']";
      break;
    default:
      inner = base;
  }
  for (let i = 0; i < depth; i++) inner = `List[${inner}]`;
  return inner;
}

const PY_DEFS: Record<string, string> = {
  ListNode: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next`,
  TreeNode: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right`,
  GraphNode: `# Definition for a graph node.
# class Node:
#     def __init__(self, val=0, neighbors=None):
#         self.val = val
#         self.neighbors = neighbors if neighbors is not None else []`,
};

function defsFor(spec: RunSpec, defs: Record<string, string>): string {
  const used = usedBases(spec);
  const out: string[] = [];
  if (used.has('ListNode') || used.has('ListNodeCycle')) out.push(defs.ListNode);
  if (used.has('TreeNode') || used.has('TreeNodeRef')) out.push(defs.TreeNode);
  if (used.has('GraphNode')) out.push(defs.GraphNode);
  return out.length ? out.join('\n\n') + '\n\n' : '';
}

function pyMethod(m: Method, isCtor: boolean): string {
  const params = ['self', ...m.params.map((p) => `${p.name}: ${pyType(p.type)}`)].join(', ');
  const name = isCtor ? '__init__' : m.name;
  const ret = isCtor ? '' : ` -> ${pyType(m.returns)}`;
  return `    def ${name}(${params})${ret}:\n        pass\n`;
}

export function pythonStarter(spec: RunSpec): string {
  const defs = defsFor(spec, PY_DEFS);
  if (spec.kind === 'function') {
    return `${defs}class Solution:\n${pyMethod(spec.fn, false)}`;
  }
  const body = [pyMethod(spec.fn, true), ...spec.methods.map((m) => pyMethod(m, false))].join('\n');
  return `${defs}class ${spec.fn.name}:\n\n${body}`;
}

// ---------------------------------------------------------------- JavaScript

function jsType(t: TypeName): string {
  const { base, depth } = baseType(t);
  let inner: string;
  switch (base) {
    case 'int':
    case 'float':
      inner = 'number';
      break;
    case 'bool':
      inner = 'boolean';
      break;
    case 'string':
      inner = 'string';
      break;
    case 'char':
      inner = 'character';
      break;
    case 'void':
      inner = 'void';
      break;
    case 'ListNode':
    case 'ListNodeCycle':
      inner = 'ListNode';
      break;
    case 'TreeNode':
    case 'TreeNodeRef':
      inner = 'TreeNode';
      break;
    case 'GraphNode':
      inner = 'Node';
      break;
    default:
      inner = base;
  }
  return inner + '[]'.repeat(depth);
}

const JS_DEFS: Record<string, string> = {
  ListNode: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */`,
  TreeNode: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */`,
  GraphNode: `/**
 * Definition for a graph node.
 * function Node(val, neighbors) {
 *    this.val = val === undefined ? 0 : val;
 *    this.neighbors = neighbors === undefined ? [] : neighbors;
 * }
 */`,
};

function jsDoc(m: Method, indent: string, isCtor: boolean): string {
  const lines = m.params.map((p) => `${indent} * @param {${jsType(p.type)}} ${p.name}`);
  if (!isCtor) lines.push(`${indent} * @return {${jsType(m.returns)}}`);
  if (!lines.length) return '';
  return `${indent}/**\n${lines.join('\n')}\n${indent} */\n`;
}

export function javascriptStarter(spec: RunSpec): string {
  const defs = defsFor(spec, JS_DEFS);
  const args = (m: Method) => m.params.map((p) => p.name).join(', ');
  if (spec.kind === 'function') {
    const fn = spec.fn;
    return `${defs}${jsDoc(fn, '', false)}function ${fn.name}(${args(fn)}) {\n  \n}\n`;
  }
  const ctor = `${jsDoc(spec.fn, '  ', true)}  constructor(${args(spec.fn)}) {\n    \n  }\n`;
  const methods = spec.methods.map((m) => `${jsDoc(m, '  ', false)}  ${m.name}(${args(m)}) {\n    \n  }\n`);
  return `${defs}class ${spec.fn.name} {\n${[ctor, ...methods].join('\n')}}\n`;
}

export function starterFor(spec: RunSpec, lang: Lang): string {
  return lang === 'python' ? pythonStarter(spec) : javascriptStarter(spec);
}
