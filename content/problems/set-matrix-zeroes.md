# Set Matrix Zeroes

```meta
difficulty: Medium
topic: Math & Geometry
tags: matrix, in place markers
lc: 73
signature: setZeroes(matrix: int[][]) -> void
mutates: matrix
time: O(m · n)
space: O(1)
```

Given an `m x n` integer matrix, if an element is `0`, set its **entire row and column** to `0`. Do it **in place**.

**Constraints**
- `1 <= m, n <= 200`

**Follow-up:** O(m + n) extra space is easy. Can you use O(1)?

## Hints
- Setting zeros while scanning corrupts the information you still need. Record first, write second.
- For O(1) space, use the first row and first column as the markers, and remember separately whether they themselves need clearing.

## Solution
Use the first row and first column as flag storage. First, note whether row 0 or column 0 contains a zero. Then, for every other zero at `(r, c)`, set `matrix[r][0] = matrix[0][c] = 0`. Next, zero every inner cell whose row or column flag is 0. Finally, clear row 0 and column 0 if they originally had zeros. The Python version below uses two sets (O(m + n) space), which is simpler to get right under pressure.

```python
class Solution:
    def setZeroes(self, matrix: List[List[int]]) -> None:
        rows, cols = set(), set()
        for r, row in enumerate(matrix):
            for c, v in enumerate(row):
                if v == 0:
                    rows.add(r)
                    cols.add(c)
        for r, row in enumerate(matrix):
            for c in range(len(row)):
                if r in rows or c in cols:
                    row[c] = 0
```

```javascript
function setZeroes(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;
  const firstRow = matrix[0].some((v) => v === 0);
  const firstCol = matrix.some((row) => row[0] === 0);
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;
  }
  if (firstRow) matrix[0].fill(0);
  if (firstCol) for (const row of matrix) row[0] = 0;
}
```

## Tests
```jsonl
{"in": [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], "out": [[1, 0, 1], [0, 0, 0], [1, 0, 1]]}
{"in": [[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]], "out": [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]}
{"in": [[[1]]], "out": [[1]]}
{"in": [[[0]]], "out": [[0]]}
{"in": [[[1, 0]]], "out": [[0, 0]]}
{"in": [[[1, 2, 3], [4, 5, 6], [7, 8, 0]]], "out": [[1, 2, 0], [4, 5, 0], [0, 0, 0]]}
{"in": [[[1, 2, 3, 4], [5, 0, 7, 8], [0, 10, 11, 12], [13, 14, 15, 0]]], "out": [[0, 0, 3, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]}
```
