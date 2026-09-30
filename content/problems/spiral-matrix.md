# Spiral Matrix

```meta
difficulty: Medium
topic: Math & Geometry
tags: matrix, simulation
lc: 54
signature: spiralOrder(matrix: int[][]) -> int[]
time: O(m · n)
space: O(1) extra
```

Given an `m x n` matrix, return all of its elements in **spiral order**: clockwise, starting from the top-left corner and moving inward.

**Constraints**
- `1 <= m, n <= 10`

## Hints
- Keep four boundaries: `top`, `bottom`, `left`, `right`. Walk one side, then shrink that boundary.
- Watch single rows and single columns: re-check the boundaries before walking the bottom row and the left column.

## Solution
Walk the outer layer: the top row left to right, the right column top to bottom, the bottom row right to left, and the left column bottom to top. Shrink each boundary after using it. Guard the third and fourth walks with `top <= bottom` and `left <= right`, so a single remaining row or column isn't visited twice.

```python
class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        result = []
        top, bottom, left, right = 0, len(matrix) - 1, 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):
                result.append(matrix[top][c])
            top += 1
            for r in range(top, bottom + 1):
                result.append(matrix[r][right])
            right -= 1
            if top <= bottom:
                for c in range(right, left - 1, -1):
                    result.append(matrix[bottom][c])
                bottom -= 1
            if left <= right:
                for r in range(bottom, top - 1, -1):
                    result.append(matrix[r][left])
                left += 1
        return result
```

```javascript
function spiralOrder(matrix) {
  const result = [];
  const m = matrix.length;
  const n = matrix[0].length;
  const seen = Array.from({ length: m }, () => new Array(n).fill(false));
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  let r = 0;
  let c = 0;
  let d = 0;
  for (let k = 0; k < m * n; k++) {
    result.push(matrix[r][c]);
    seen[r][c] = true;
    const nr = r + dirs[d][0];
    const nc = c + dirs[d][1];
    if (nr < 0 || nc < 0 || nr >= m || nc >= n || seen[nr][nc]) d = (d + 1) % 4;
    r += dirs[d][0];
    c += dirs[d][1];
  }
  return result;
}
```

## Tests
```jsonl
{"in": [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], "out": [1, 2, 3, 6, 9, 8, 7, 4, 5]}
{"in": [[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], "out": [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]}
{"in": [[[1]]], "out": [1]}
{"in": [[[1, 2, 3]]], "out": [1, 2, 3]}
{"in": [[[1], [2], [3]]], "out": [1, 2, 3]}
{"in": [[[1, 2], [3, 4], [5, 6], [7, 8]]], "out": [1, 2, 4, 6, 8, 7, 5, 3]}
```
