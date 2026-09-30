# Longest Increasing Path in a Matrix

```meta
difficulty: Hard
topic: 2-D DP
tags: dfs, memoization, dag
lc: 329
signature: longestIncreasingPath(matrix: int[][]) -> int
time: O(m · n)
space: O(m · n)
```

Given an `m x n` integer matrix, return the length of the longest **strictly increasing** path. From each cell you may move up, down, left or right, but not diagonally and not off the grid.

**Constraints**
- `1 <= m, n <= 200`; `0 <= matrix[i][j] <= 2^31 - 1`

## Hints
- Strictly increasing paths can't loop back on themselves, so "move to a larger neighbour" forms a DAG. No visited set is needed.
- The longest path starting at a cell depends only on its larger neighbours. Memoize it.

## Solution
`longest(r, c) = 1 + max(longest(nr, nc))` over neighbours with larger values. Because edges always go to strictly larger values, there are no cycles, and memoizing each cell's result makes the total work O(m·n). A topological, peeling-by-outdegree BFS avoids deep recursion; the Python version uses that approach.

```python
class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        rows, cols = len(matrix), len(matrix[0])
        dirs = ((1, 0), (-1, 0), (0, 1), (0, -1))
        outdeg = [[0] * cols for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                for dr, dc in dirs:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > matrix[r][c]:
                        outdeg[r][c] += 1
        # Peel "peaks" (no larger neighbour) layer by layer; the number of layers is the answer.
        layer = [(r, c) for r in range(rows) for c in range(cols) if outdeg[r][c] == 0]
        length = 0
        while layer:
            length += 1
            nxt = []
            for r, c in layer:
                for dr, dc in dirs:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] < matrix[r][c]:
                        outdeg[nr][nc] -= 1
                        if outdeg[nr][nc] == 0:
                            nxt.append((nr, nc))
            layer = nxt
        return length
```

```javascript
function longestIncreasingPath(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const memo = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const longest = (r, c) => {
    if (memo[r][c]) return memo[r][c];
    let best = 1;
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && matrix[nr][nc] > matrix[r][c]) {
        best = Math.max(best, 1 + longest(nr, nc));
      }
    }
    return (memo[r][c] = best);
  };
  let answer = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) answer = Math.max(answer, longest(r, c));
  return answer;
}
```

## Tests
```jsonl
{"in": [[[9, 9, 4], [6, 6, 8], [2, 1, 1]]], "out": 4, "why": "1 → 2 → 6 → 9"}
{"in": [[[3, 4, 5], [3, 2, 6], [2, 2, 1]]], "out": 4}
{"in": [[[1]]], "out": 1}
{"in": [[[1, 2], [4, 3]]], "out": 4}
{"in": [[[7, 7, 7], [7, 7, 7]]], "out": 1}
{"in": [[[1, 2, 3, 4, 5], [16, 17, 18, 19, 6], [15, 24, 25, 20, 7], [14, 23, 22, 21, 8], [13, 12, 11, 10, 9]]], "out": 25}
```
