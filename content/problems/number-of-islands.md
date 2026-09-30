# Number of Islands

```meta
difficulty: Medium
topic: Graphs
tags: grid, dfs, bfs, union find
lc: 200
signature: numIslands(grid: char[][]) -> int
time: O(m · n)
space: O(m · n)
```

Given an `m x n` grid of `"1"` (land) and `"0"` (water), return the number of **islands**. An island is a group of land cells connected horizontally or vertically. The grid is surrounded by water.

**Constraints**
- `1 <= m, n <= 300`

## Hints
- Each time you find an unvisited land cell, you've found a new island.
- Flood-fill it (DFS or BFS) to mark the whole island as visited, so you never count it again.

## Solution
Scan every cell. On unvisited land, increment the count and flood-fill the island, marking cells visited (here by overwriting them with `"0"`). Each cell is processed a constant number of times, O(m·n). Use an explicit stack or queue to avoid recursion depth limits on huge islands. Union-Find is an alternative that also handles streaming updates.

```python
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows, cols = len(grid), len(grid[0])
        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != "1":
                    continue
                count += 1
                grid[r][c] = "0"
                stack = [(r, c)]
                while stack:
                    i, j = stack.pop()
                    for ni, nj in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                        if 0 <= ni < rows and 0 <= nj < cols and grid[ni][nj] == "1":
                            grid[ni][nj] = "0"
                            stack.append((ni, nj))
        return count
```

```javascript
function numIslands(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const sink = (r, c) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  };
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        sink(r, c);
      }
    }
  }
  return count;
}
```

## Tests
```jsonl
{"in": [[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]], "out": 1}
{"in": [[["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]]], "out": 3}
{"in": [[["0"]]], "out": 0}
{"in": [[["1"]]], "out": 1}
{"in": [[["1", "0", "1", "0", "1"], ["0", "1", "0", "1", "0"], ["1", "0", "1", "0", "1"]]], "out": 8}
{"in": [[["1", "1", "1"], ["0", "1", "0"], ["1", "1", "1"]]], "out": 1}
{"in": [[["1", "0", "0", "1"], ["1", "0", "0", "1"], ["1", "1", "1", "1"]]], "out": 1}
```
