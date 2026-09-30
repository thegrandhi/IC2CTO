# Min Cost to Connect All Points

```meta
difficulty: Medium
topic: Advanced Graphs
tags: minimum spanning tree, prim
lc: 1584
signature: minCostConnectPoints(points: int[][]) -> int
time: O(n²)
space: O(n)
```

You're given points on a 2D plane. Connecting points `[x1, y1]` and `[x2, y2]` costs their **Manhattan distance** `|x1 - x2| + |y1 - y2|`.

Return the minimum total cost to connect all points, so that there is exactly one path between any two of them.

**Constraints**
- `1 <= points.length <= 1000`; all points are distinct.

## Hints
- "Connect everything with minimum total edge weight" is a **minimum spanning tree**.
- The graph is complete (every pair is an edge), so an O(n²) Prim's without a heap is ideal.

## Solution
**Prim's algorithm** on the implicit complete graph. Keep `best[i]`, the cheapest edge from the growing tree to point `i`. Repeatedly add the unvisited point with the smallest `best` to the tree, add that cost to the total, and use the new point to lower the other points' `best` values. With n² edges, this array version, O(n²), beats Kruskal's O(n² log n).

```python
class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        n = len(points)
        best = [inf] * n
        best[0] = 0
        used = [False] * n
        total = 0
        for _ in range(n):
            i = min((b, j) for j, b in enumerate(best) if not used[j])[1]
            used[i] = True
            total += best[i]
            xi, yi = points[i]
            for j in range(n):
                if not used[j]:
                    d = abs(xi - points[j][0]) + abs(yi - points[j][1])
                    if d < best[j]:
                        best[j] = d
        return total
```

```javascript
function minCostConnectPoints(points) {
  const n = points.length;
  const best = new Array(n).fill(Infinity);
  const used = new Array(n).fill(false);
  best[0] = 0;
  let total = 0;
  for (let step = 0; step < n; step++) {
    let i = -1;
    for (let j = 0; j < n; j++) if (!used[j] && (i < 0 || best[j] < best[i])) i = j;
    used[i] = true;
    total += best[i];
    for (let j = 0; j < n; j++) {
      if (used[j]) continue;
      const d = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
      if (d < best[j]) best[j] = d;
    }
  }
  return total;
}
```

## Tests
```jsonl
{"in": [[[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]], "out": 20}
{"in": [[[3, 12], [-2, 5], [-4, 1]]], "out": 18}
{"in": [[[0, 0]]], "out": 0}
{"in": [[[0, 0], [1, 1], [1, 0], [-1, 1]]], "out": 4}
{"in": [[[-1000000, -1000000], [1000000, 1000000]]], "out": 4000000}
{"in": [[[2, -3], [-17, -8], [13, 8], [-17, -15]]], "out": 53}
```
