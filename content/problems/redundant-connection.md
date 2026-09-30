# Redundant Connection

```meta
difficulty: Medium
topic: Graphs
tags: union find
lc: 684
signature: findRedundantConnection(edges: int[][]) -> int[]
time: O(n · α(n))
space: O(n)
```

A tree with `n` nodes (labeled `1` to `n`) had **one extra edge** added, creating exactly one cycle. The graph is given as a list of `n` undirected edges.

Return an edge whose removal leaves a tree. If there are several candidates, return the one that appears **last** in the input.

**Constraints**
- `3 <= n <= 1000`; the graph is connected and has no repeated edges.

## Hints
- Process edges in order. The first edge whose endpoints are **already connected** is the one that closes the cycle.
- Union-Find answers "already connected?" in near-constant time.

## Solution
Union edges one by one. The first edge `[a, b]` where `find(a) == find(b)` creates the cycle. Every edge of the cycle is a candidate, and this one comes last among them in input order (the cycle only appears once its final edge is added). So return it.

```python
class Solution:
    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:
        parent = list(range(len(edges) + 1))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return [a, b]
            parent[ra] = rb
        return []
```

```javascript
function findRedundantConnection(edges) {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const [a, b] of edges) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return [a, b];
    parent[ra] = rb;
  }
  return [];
}
```

## Tests
```jsonl
{"in": [[[1, 2], [1, 3], [2, 3]]], "out": [2, 3]}
{"in": [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], "out": [1, 4]}
{"in": [[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], "out": [1, 3]}
{"in": [[[2, 3], [5, 2], [1, 5], [4, 2], [4, 1]]], "out": [4, 1]}
{"in": [[[1, 2], [2, 3], [3, 1], [3, 4]]], "out": [3, 1]}
```
