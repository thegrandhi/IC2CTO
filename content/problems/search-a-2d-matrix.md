# Search a 2D Matrix

```meta
difficulty: Medium
topic: Binary Search
tags: matrix
lc: 74
signature: searchMatrix(matrix: int[][], target: int) -> bool
time: O(log(m·n))
space: O(1)
```

You're given an `m x n` integer matrix where each row is sorted ascending, and the first value of each row is greater than the last value of the previous row. Return `true` if `target` is in the matrix.

Aim for **O(log(m · n))** time.

**Constraints**
- `1 <= m, n <= 100`

## Hints
- Read row by row, the matrix is one long sorted array.
- Map a flat index `k` to `(k // n, k % n)` and binary search over `0 … m·n − 1`.

## Solution
Treat the matrix as a sorted array of length `m · n` and binary search it, converting each flat index `k` to `matrix[k // n][k % n]`. No extra memory is needed.

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        m, n = len(matrix), len(matrix[0])
        lo, hi = 0, m * n - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            value = matrix[mid // n][mid % n]
            if value == target:
                return True
            if value < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return False
```

```javascript
function searchMatrix(matrix, target) {
  const m = matrix.length;
  const n = matrix[0].length;
  let lo = 0;
  let hi = m * n - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const value = matrix[Math.floor(mid / n)][mid % n];
    if (value === target) return true;
    if (value < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}
```

## Tests
```jsonl
{"in": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], "out": true}
{"in": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], "out": false}
{"in": [[[1]], 1], "out": true}
{"in": [[[1], [3]], 2], "out": false}
{"in": [[[1, 3, 5]], 5], "out": true}
{"in": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 60], "out": true}
{"in": [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 0], "out": false}
```
