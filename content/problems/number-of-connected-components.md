# Number of Connected Components in an Undirected Graph

```meta
difficulty: Medium
topic: Graphs
tags: union find, dfs
lc: 323
signature: countComponents(n: int, edges: int[][]) -> int
time: O(n + e · α(n))
space: O(n)
```

You're given `n` nodes labeled `0` to `n - 1` and a list of undirected `edges`. Return the number of **connected components**.

**Constraints**
- `1 <= n <= 2000`; `0 <= edges.length <= 5000`; no duplicate edges.

## Hints
- Every node starts as its own component. Each edge that joins two different components reduces the count by one.
- Union-Find does exactly that. DFS from each unvisited node works too.

## Solution
Start with `components = n`. For each edge, union its endpoints. When they were in different sets, the union merges two components, so decrement the count. Union by size with path compression keeps the trees shallow.

```python
class Solution:
    def countComponents(self, n: int, edges: List[List[int]]) -> int:
        parent = list(range(n))
        size = [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        components = n
        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra != rb:
                if size[ra] < size[rb]:
                    ra, rb = rb, ra
                parent[rb] = ra
                size[ra] += size[rb]
                components -= 1
        return components
```

```javascript
function countComponents(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    count++;
    const stack = [i];
    seen[i] = true;
    while (stack.length) {
      for (const nb of graph[stack.pop()]) {
        if (!seen[nb]) {
          seen[nb] = true;
          stack.push(nb);
        }
      }
    }
  }
  return count;
}
```

## Tests
```jsonl
{"in": [5, [[0, 1], [1, 2], [3, 4]]], "out": 2}
{"in": [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], "out": 1}
{"in": [1, []], "out": 1}
{"in": [4, []], "out": 4}
{"in": [6, [[0, 1], [2, 3], [4, 5], [1, 2]]], "out": 2}
{"in": [7, [[0, 1], [1, 2], [2, 0], [4, 5]]], "out": 4}
```
