# Graph Valid Tree

```meta
difficulty: Medium
topic: Graphs
tags: union find, cycle detection
lc: 261
signature: validTree(n: int, edges: int[][]) -> bool
time: O(n · α(n))
space: O(n)
```

You're given `n` nodes labeled `0` to `n - 1` and a list of **undirected** edges. Return `true` if these edges form a valid **tree**: connected, with no cycles.

**Constraints**
- `1 <= n <= 2000`; `0 <= edges.length <= 5000`; no duplicate edges or self-loops.

## Hints
- A tree with `n` nodes has exactly `n - 1` edges. Check that first.
- With exactly `n - 1` edges, the graph is a tree if and only if it has no cycle (equivalently, it's connected).
- Union-Find: if an edge joins two nodes that are already connected, it creates a cycle.

## Solution
First, a tree needs exactly `n - 1` edges. Then union the endpoints of each edge with **Union-Find**. If both ends already share a root, the edge closes a cycle, so return `false`. With `n - 1` edges and no cycle, the graph must be connected. Path compression makes each operation nearly O(1).

```python
class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        if len(edges) != n - 1:
            return False
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return False
            parent[ra] = rb
        return True
```

```javascript
function validTree(n, edges) {
  if (edges.length !== n - 1) return false;
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const node = stack.pop();
    for (const nb of graph[node]) {
      if (!seen.has(nb)) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  return seen.size === n;
}
```

## Tests
```jsonl
{"in": [5, [[0, 1], [0, 2], [0, 3], [1, 4]]], "out": true}
{"in": [5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]], "out": false}
{"in": [1, []], "out": true}
{"in": [2, []], "out": false}
{"in": [4, [[0, 1], [2, 3], [1, 2]]], "out": true}
{"in": [4, [[0, 1], [1, 2], [2, 0]]], "out": false}
{"in": [6, [[0, 1], [0, 2], [2, 3], [2, 4]]], "out": false}
```
