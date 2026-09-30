"""Code Gym Python test harness.

Loaded into Pyodide by the browser worker, and imported by the local
verification scripts (scripts/py_runner.py). Keep it compatible with
CPython 3.10+ and free of third-party imports.

Protocol (all values are JSON strings):
  gym_prepare(code, spec)  -> {"error": str|None, "stdout": str}
  gym_run_one(test)        -> {"ok": bool, "output": any, "error": str, "stdout": str, "ms": float}
  gym_exec(code)           -> {"error": str|None, "stdout": str, "ms": float}
"""

import collections
import contextlib
import io
import json
import linecache
import math
import sys
import time
import traceback

FILENAME = "solution.py"
MAX_NODES = 200_000
MAX_STDOUT = 20_000

PRELUDE = """
from typing import *
import collections, heapq, math, bisect, itertools, functools, string, re, random, operator, sys
from collections import defaultdict, Counter, deque, OrderedDict
from heapq import heappush, heappop, heapify, heappushpop, heapreplace, nlargest, nsmallest
from functools import lru_cache, cache, reduce, cmp_to_key
from itertools import accumulate, combinations, permutations, product, chain, groupby, zip_longest, pairwise
from bisect import bisect_left, bisect_right, insort
from math import inf, gcd, sqrt, ceil, floor, log2, comb
"""


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        vals, node, n = [], self, 0
        while node is not None and n < 20:
            vals.append(repr(node.val))
            node, n = node.next, n + 1
        return "ListNode(" + " -> ".join(vals) + (" -> ..." if node is not None else "") + ")"


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return "TreeNode(%r)" % (self.val,)


class Node:
    """Graph node (used by graph problems such as Clone Graph)."""

    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

    def __repr__(self):
        return "Node(%r)" % (self.val,)


class HarnessError(Exception):
    """A problem with the shape of the user's answer (not a crash in their code)."""


# ------------------------------------------------------------------ builders


def build_list(values):
    dummy = ListNode()
    cur = dummy
    for v in values:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next


def build_cycle_list(value):
    values, pos = value
    head = build_list(values)
    if head is not None and pos is not None and pos >= 0:
        nodes = []
        node = head
        while node is not None:
            nodes.append(node)
            node = node.next
        nodes[-1].next = nodes[pos]
    return head


def build_tree(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = collections.deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            queue.append(node.right)
        i += 1
    return root


def build_graph(adj):
    if not adj:
        return None, set()
    nodes = [Node(i + 1) for i in range(len(adj))]
    for i, nbrs in enumerate(adj):
        nodes[i].neighbors = [nodes[j - 1] for j in nbrs]
    return nodes[0], {id(n) for n in nodes}


def find_tree_node(root, val):
    stack = [root] if root is not None else []
    while stack:
        node = stack.pop()
        if node.val == val:
            return node
        if node.right is not None:
            stack.append(node.right)
        if node.left is not None:
            stack.append(node.left)
    raise HarnessError("Test setup: no node with value %r in the tree" % (val,))


# ------------------------------------------------------------------ serializers


def plain(v):
    """Converts a Python value into something JSON-serializable."""
    if v is None or isinstance(v, (bool, int, str)):
        return v
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return str(v)
        return v
    if isinstance(v, (list, tuple, collections.deque)):
        return [plain(x) for x in v]
    if isinstance(v, (set, frozenset)):
        items = [plain(x) for x in v]
        try:
            return sorted(items)
        except TypeError:
            return sorted(items, key=lambda x: json.dumps(x, sort_keys=True))
    if isinstance(v, dict):
        return {str(k): plain(x) for k, x in v.items()}
    if isinstance(v, ListNode):
        return ser_list(v)
    if isinstance(v, TreeNode):
        return ser_tree(v)
    return repr(v)


def ser_list(head):
    out = []
    seen = set()
    node = head
    while node is not None:
        if not isinstance(node, ListNode):
            raise HarnessError("Expected a ListNode but found %s" % type(node).__name__)
        if id(node) in seen:
            raise HarnessError("The returned linked list contains a cycle")
        seen.add(id(node))
        out.append(plain(node.val))
        if len(out) > MAX_NODES:
            raise HarnessError("The returned linked list is too long")
        node = node.next
    return out


def ser_tree(root):
    if root is None:
        return []
    if not isinstance(root, TreeNode):
        raise HarnessError("Expected a TreeNode but found %s" % type(root).__name__)
    out = []
    seen = set()
    queue = collections.deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        if id(node) in seen:
            raise HarnessError("The returned tree contains a cycle")
        seen.add(id(node))
        if len(seen) > MAX_NODES:
            raise HarnessError("The returned tree is too large")
        out.append(plain(node.val))
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out


def ser_graph(node, input_ids):
    if node is None:
        return []
    by_val = {}
    queue = collections.deque([node])
    seen = {id(node)}
    while queue:
        cur = queue.popleft()
        if id(cur) in input_ids:
            raise HarnessError("The returned graph reuses nodes from the input; return a deep copy")
        by_val[cur.val] = [n.val for n in cur.neighbors]
        for n in cur.neighbors:
            if id(n) not in seen:
                seen.add(id(n))
                queue.append(n)
    return [by_val.get(i, []) for i in range(1, max(by_val) + 1)]


# ------------------------------------------------------------------ conversion by declared type


def to_py(value, typ, ctx):
    if typ == "ListNode":
        return build_list(value)
    if typ == "ListNode[]":
        return [build_list(v) for v in value]
    if typ == "ListNodeCycle":
        return build_cycle_list(value)
    if typ == "TreeNode":
        tree = build_tree(value)
        ctx.setdefault("root", tree)
        return tree
    if typ == "TreeNodeRef":
        return find_tree_node(ctx.get("root"), value)
    if typ == "GraphNode":
        graph, ids = build_graph(value)
        ctx["graph_ids"] = ids
        return graph
    return value


def from_py(value, typ, ctx):
    if typ == "void":
        return None
    if typ in ("ListNode", "ListNodeCycle"):
        return ser_list(value) if value is None or isinstance(value, ListNode) else plain(value)
    if typ == "ListNode[]":
        return [ser_list(v) for v in value]
    if typ == "TreeNode":
        return ser_tree(value) if value is None or isinstance(value, TreeNode) else plain(value)
    if typ == "TreeNodeRef":
        return value.val if isinstance(value, TreeNode) else plain(value)
    if typ == "GraphNode":
        return ser_graph(value, ctx.get("graph_ids", set()))
    if typ == "bool" and type(value) is int and value in (0, 1):
        return bool(value)
    if typ == "float" and isinstance(value, int) and not isinstance(value, bool):
        return float(value)
    return plain(value)


# ------------------------------------------------------------------ errors


def format_user_error(exc):
    """Formats an exception, keeping only frames from the user's code."""
    if isinstance(exc, HarnessError):
        return str(exc)
    if isinstance(exc, SyntaxError):
        return "".join(traceback.format_exception_only(type(exc), exc)).rstrip()
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == FILENAME]
    lines = []
    if frames:
        lines.append("Traceback (most recent call last):\n")
        lines.extend(traceback.format_list(frames))
    lines.extend(traceback.format_exception_only(type(exc), exc))
    return "".join(lines).rstrip()


class _Capture(io.StringIO):
    def write(self, s):
        if self.tell() < MAX_STDOUT:
            return super().write(s)
        return len(s)

    def text(self):
        value = self.getvalue()
        if len(value) >= MAX_STDOUT:
            value = value[:MAX_STDOUT] + "\n... output truncated ..."
        return value


# ------------------------------------------------------------------ entry points

_state = {}


def _fresh_namespace(code):
    linecache.cache[FILENAME] = (len(code), None, code.splitlines(True), FILENAME)
    ns = {"__name__": "__main__", "__builtins__": __builtins__}
    exec(PRELUDE, ns)
    ns.update(ListNode=ListNode, TreeNode=TreeNode, Node=Node)
    return ns


def gym_prepare(code, spec_json):
    spec = json.loads(spec_json)
    out = _Capture()
    _state.clear()
    try:
        ns = _fresh_namespace(code)
        compiled = compile(code, FILENAME, "exec")
        with contextlib.redirect_stdout(out):
            exec(compiled, ns)
    except BaseException as exc:  # noqa: BLE001 - report anything the user's code raises
        return json.dumps({"error": format_user_error(exc), "stdout": out.text()})

    name = spec["fn"]["name"]
    if spec["kind"] == "design":
        if not isinstance(ns.get(name), type):
            return json.dumps({"error": "Couldn't find class %s in your code." % name, "stdout": out.text()})
        target = ns[name]
    else:
        solution = ns.get("Solution")
        if isinstance(solution, type) and hasattr(solution, name):
            target = None  # a fresh Solution() is created per test
        elif callable(ns.get(name)):
            target = ns[name]
        else:
            return json.dumps(
                {"error": "Couldn't find class Solution with a method %s() in your code." % name, "stdout": out.text()}
            )
    _state.update(spec=spec, ns=ns, target=target)
    return json.dumps({"error": None, "stdout": out.text()})


def _call_function(test, out, ctx):
    spec, ns = _state["spec"], _state["ns"]
    fn = spec["fn"]
    params = fn["params"]
    args = [to_py(v, p["type"], ctx) for v, p in zip(test["in"], params)]
    with contextlib.redirect_stdout(out):
        target = _state["target"] or getattr(ns["Solution"](), fn["name"])
        start = time.perf_counter()
        result = target(*args)
        ms = (time.perf_counter() - start) * 1000
    mutates = spec.get("mutates")
    if mutates is not None:
        return from_py(args[mutates], params[mutates]["type"], ctx), ms
    return from_py(result, fn["returns"], ctx), ms


def _call_design(test, out, ctx):
    spec = _state["spec"]
    cls = _state["target"]
    methods = {m["name"]: m for m in spec["methods"]}
    outputs = []
    obj = None
    total = 0.0
    for i, (op, raw_args) in enumerate(zip(test["ops"], test["args"])):
        m = spec["fn"] if i == 0 else methods.get(op)
        if m is None:
            raise HarnessError("Test setup: unknown operation %r" % (op,))
        args = [to_py(v, p["type"], ctx) for v, p in zip(raw_args, m["params"])]
        try:
            with contextlib.redirect_stdout(out):
                start = time.perf_counter()
                if i == 0:
                    obj = cls(*args)
                    result = None
                else:
                    method = getattr(obj, op, None)
                    if method is None:
                        raise HarnessError("%s has no method %s()" % (spec["fn"]["name"], op))
                    result = method(*args)
                total += (time.perf_counter() - start) * 1000
            outputs.append(None if i == 0 else from_py(result, m["returns"], ctx))
        except BaseException as exc:  # noqa: BLE001
            call = "%s(%s)" % (op, ", ".join(json.dumps(a) for a in raw_args))
            raise _OpError("Operation #%d %s failed:\n%s" % (i + 1, call, format_user_error(exc))) from None
    return outputs, total


class _OpError(Exception):
    pass


def gym_run_one(test_json):
    test = json.loads(test_json)
    out = _Capture()
    ctx = {}
    try:
        if _state["spec"]["kind"] == "design":
            output, ms = _call_design(test, out, ctx)
        else:
            output, ms = _call_function(test, out, ctx)
        return json.dumps({"ok": True, "output": output, "stdout": out.text(), "ms": ms})
    except _OpError as exc:
        return json.dumps({"ok": False, "error": str(exc), "stdout": out.text(), "ms": 0})
    except BaseException as exc:  # noqa: BLE001
        return json.dumps({"ok": False, "error": format_user_error(exc), "stdout": out.text(), "ms": 0})


def gym_exec(code):
    """Runs a free-form snippet (playground)."""
    out = _Capture()
    start = time.perf_counter()
    error = None
    try:
        ns = _fresh_namespace(code)
        compiled = compile(code, FILENAME, "exec")
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            exec(compiled, ns)
    except BaseException as exc:  # noqa: BLE001
        error = format_user_error(exc)
    ms = (time.perf_counter() - start) * 1000
    return json.dumps({"error": error, "stdout": out.text(), "ms": ms})


def gym_version():
    return sys.version.split()[0]
