# Unique Paths

```meta
difficulty: Medium
topic: 2-D DP
tags: grid dp, combinatorics
lc: 62
signature: uniquePaths(m: int, n: int) -> int
time: O(m · n)
space: O(n)
```

A robot starts at the top-left corner of an `m x n` grid and can move only **right** or **down**. How many distinct paths lead to the bottom-right corner?

**Constraints**
- `1 <= m, n <= 100`; the answer is at most `2 * 10^9`.

## Hints
- The number of ways to reach a cell is the sum of the ways to reach the cell above it and the cell to its left.
- One row of the table is enough: `row[c] += row[c - 1]`.
- Combinatorics: choose which `m - 1` of the `m + n - 2` moves go down.

## Solution
`paths[r][c] = paths[r-1][c] + paths[r][c-1]`, with the first row and first column all 1s. Keeping a single rolling row gives O(n) space. The closed form `C(m + n - 2, m - 1)` is O(min(m, n)) with exact integer arithmetic.

```python
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        row = [1] * n
        for _ in range(1, m):
            for c in range(1, n):
                row[c] += row[c - 1]
        return row[-1]
```

```javascript
function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) row[c] += row[c - 1];
  return row[n - 1];
}
```

## Tests
```jsonl
{"in": [3, 7], "out": 28}
{"in": [3, 2], "out": 3}
{"in": [1, 1], "out": 1}
{"in": [1, 10], "out": 1}
{"in": [7, 3], "out": 28}
{"in": [10, 10], "out": 48620}
{"in": [23, 12], "out": 193536720}
```
