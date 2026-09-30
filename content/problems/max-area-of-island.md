# Max Area of Island

```meta
difficulty: Medium
topic: Graphs
tags: grid, dfs
lc: 695
signature: maxAreaOfIsland(grid: int[][]) -> int
time: O(m · n)
space: O(m · n)
```

Given an `m x n` binary grid where `1` is land and `0` is water, return the **area** (number of cells) of the largest island, where islands are 4-directionally connected land. If there's no land, return `0`.

**Constraints**
- `1 <= m, n <= 50`

## Hints
- This is Number of Islands, except the flood fill returns the size of the island.

## Solution
Flood-fill each unvisited island and count its cells, keeping the maximum. Marking cells as visited (set them to 0) guarantees each cell is counted once.

```python
class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        best = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != 1:
                    continue
                grid[r][c] = 0
                stack = [(r, c)]
                area = 0
                while stack:
                    i, j = stack.pop()
                    area += 1
                    for ni, nj in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                        if 0 <= ni < rows and 0 <= nj < cols and grid[ni][nj] == 1:
                            grid[ni][nj] = 0
                            stack.append((ni, nj))
                best = max(best, area)
        return best
```

```javascript
function maxAreaOfIsland(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const area = (r, c) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== 1) return 0;
    grid[r][c] = 0;
    return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1);
  };
  let best = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) best = Math.max(best, area(r, c));
  return best;
}
```

## Tests
```jsonl
{"in": [[[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]]], "out": 6}
{"in": [[[0, 0, 0, 0, 0, 0, 0, 0]]], "out": 0}
{"in": [[[1]]], "out": 1}
{"in": [[[1, 1], [1, 0]]], "out": 3}
{"in": [[[1, 0, 1], [0, 1, 0], [1, 0, 1]]], "out": 1}
{"in": [[[1, 1, 0, 1, 1], [1, 0, 0, 0, 1], [1, 1, 0, 1, 1]]], "out": 5}
```
