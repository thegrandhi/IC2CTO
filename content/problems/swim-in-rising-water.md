# Swim in Rising Water

```meta
difficulty: Hard
topic: Advanced Graphs
tags: dijkstra, minimax path
lc: 778
signature: swimInWater(grid: int[][]) -> int
time: O(n² log n)
space: O(n²)
```

You're given an `n x n` grid where `grid[i][j]` is the elevation at that cell; all elevations are distinct and range from `0` to `n² - 1`. At time `t` the water level everywhere is `t`. You can swim between 4-directionally adjacent cells only if **both** have elevation `<= t`, and swimming takes no time.

Starting at the top-left cell, return the earliest time you can reach the bottom-right cell.

**Constraints**
- `1 <= n <= 50`

## Hints
- The time needed for a path is the **maximum** elevation along it. You want the path that minimizes that maximum.
- Dijkstra works with "cost = max so far" instead of "cost = sum so far".

## Solution
Run a Dijkstra-like search where a path's cost is the highest elevation on it. Pop the cell with the lowest cost so far, and push each neighbour with cost `max(cost, elevation)`. The first time the target is popped, its cost is optimal. Binary searching on `t` with a BFS feasibility check is an equally good alternative.

```python
class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        n = len(grid)
        heap = [(grid[0][0], 0, 0)]
        seen = {(0, 0)}
        while heap:
            t, r, c = heappop(heap)
            if r == c == n - 1:
                return t
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    heappush(heap, (max(t, grid[nr][nc]), nr, nc))
        return -1
```

```javascript
function swimInWater(grid) {
  const n = grid.length;
  const canReach = (t) => {
    if (grid[0][0] > t) return false;
    const seen = Array.from({ length: n }, () => new Array(n).fill(false));
    const stack = [[0, 0]];
    seen[0][0] = true;
    while (stack.length) {
      const [r, c] = stack.pop();
      if (r === n - 1 && c === n - 1) return true;
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr >= 0 && nc >= 0 && nr < n && nc < n && !seen[nr][nc] && grid[nr][nc] <= t) {
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }
    return false;
  };
  let lo = 0;
  let hi = n * n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canReach(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
```

## Tests
```jsonl
{"in": [[[0, 2], [1, 3]]], "out": 3}
{"in": [[[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]]], "out": 16}
{"in": [[[0]]], "out": 0}
{"in": [[[3, 2], [0, 1]]], "out": 3}
{"in": [[[0, 5, 6], [1, 4, 7], [2, 3, 8]]], "out": 8}
{"in": [[[7, 1, 2], [0, 8, 3], [6, 5, 4]]], "out": 7}
```
