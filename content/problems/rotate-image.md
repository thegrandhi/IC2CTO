# Rotate Image

```meta
difficulty: Medium
topic: Math & Geometry
tags: matrix, in place
lc: 48
signature: rotate(matrix: int[][]) -> void
mutates: matrix
time: O(n²)
space: O(1)
```

Rotate an `n x n` matrix by **90 degrees clockwise**, **in place**. Don't allocate another matrix.

**Constraints**
- `1 <= n <= 20`

## Hints
- A clockwise rotation equals a **transpose** (swap across the main diagonal) followed by **reversing each row**.
- Or rotate four cells at a time, layer by layer.

## Solution
Transpose the matrix by swapping `matrix[i][j]` with `matrix[j][i]` for `j > i`, then reverse every row. The two reflections compose into a 90° clockwise rotation. Everything happens in place, in O(n²). For counter-clockwise, reverse the rows first and then transpose.

```python
class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()
```

```javascript
function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
  }
  for (const row of matrix) row.reverse();
}
```

## Tests
```jsonl
{"in": [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], "out": [[7, 4, 1], [8, 5, 2], [9, 6, 3]]}
{"in": [[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], "out": [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]]}
{"in": [[[1]]], "out": [[1]]}
{"in": [[[1, 2], [3, 4]]], "out": [[3, 1], [4, 2]]}
{"in": [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]]], "out": [[21, 16, 11, 6, 1], [22, 17, 12, 7, 2], [23, 18, 13, 8, 3], [24, 19, 14, 9, 4], [25, 20, 15, 10, 5]]}
```
