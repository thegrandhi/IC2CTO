# Median of Two Sorted Arrays

```meta
difficulty: Hard
topic: Binary Search
tags: partition
lc: 4
signature: findMedianSortedArrays(nums1: int[], nums2: int[]) -> float
compare: float
time: O(log(min(m, n)))
space: O(1)
```

Given two sorted arrays `nums1` (size `m`) and `nums2` (size `n`), return the **median** of the combined sorted data.

The target complexity is **O(log(m + n))**.

**Constraints**
- `0 <= m, n <= 1000`, `1 <= m + n`
- `-10^6 <= nums1[i], nums2[i] <= 10^6`

## Hints
- Merging takes O(m + n). To go faster, don't merge; find a *partition*.
- Cut `nums1` at `i` and `nums2` at `j = (m + n + 1) // 2 - i` so the left side holds half the elements.
- The cut is correct when every left element is `<=` every right element: `A[i-1] <= B[j]` and `B[j-1] <= A[i]`. Binary search `i` over the shorter array.

## Solution
Binary search the cut position `i` in the shorter array `A`. The cut in `B` is then forced, `j = half - i`. If `A[i-1] > B[j]`, the cut in `A` is too far right; if `B[j-1] > A[i]`, it's too far left. Use ±∞ for out-of-range neighbours. At the right cut, the median is the largest left value (odd total) or the average of the largest left and smallest right values (even total).

```python
class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        a, b = nums1, nums2
        if len(a) > len(b):
            a, b = b, a
        m, n = len(a), len(b)
        half = (m + n + 1) // 2
        lo, hi = 0, m
        while lo <= hi:
            i = (lo + hi) // 2
            j = half - i
            a_left = a[i - 1] if i > 0 else -inf
            a_right = a[i] if i < m else inf
            b_left = b[j - 1] if j > 0 else -inf
            b_right = b[j] if j < n else inf
            if a_left <= b_right and b_left <= a_right:
                if (m + n) % 2:
                    return float(max(a_left, b_left))
                return (max(a_left, b_left) + min(a_right, b_right)) / 2
            if a_left > b_right:
                hi = i - 1
            else:
                lo = i + 1
        return 0.0
```

```javascript
function findMedianSortedArrays(nums1, nums2) {
  let [a, b] = nums1.length <= nums2.length ? [nums1, nums2] : [nums2, nums1];
  const m = a.length;
  const n = b.length;
  const half = Math.floor((m + n + 1) / 2);
  let lo = 0;
  let hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1;
    const j = half - i;
    const aLeft = i > 0 ? a[i - 1] : -Infinity;
    const aRight = i < m ? a[i] : Infinity;
    const bLeft = j > 0 ? b[j - 1] : -Infinity;
    const bRight = j < n ? b[j] : Infinity;
    if (aLeft <= bRight && bLeft <= aRight) {
      if ((m + n) % 2) return Math.max(aLeft, bLeft);
      return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
    }
    if (aLeft > bRight) hi = i - 1;
    else lo = i + 1;
  }
  return 0;
}
```

## Tests
```jsonl
{"in": [[1, 3], [2]], "out": 2.0}
{"in": [[1, 2], [3, 4]], "out": 2.5}
{"in": [[], [1]], "out": 1}
{"in": [[2], []], "out": 2}
{"in": [[0, 0], [0, 0]], "out": 0}
{"in": [[1, 3, 8, 9, 15], [7, 11, 18, 19, 21, 25]], "out": 11}
{"in": [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]], "out": 5.5}
{"in": [[-5, 3, 6, 12, 15], [-12, -10, -6, -3, 4, 10]], "out": 3}
{"in": [[100], [1, 2, 3, 4]], "out": 3}
```
