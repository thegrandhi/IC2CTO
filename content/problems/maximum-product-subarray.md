# Maximum Product Subarray

```meta
difficulty: Medium
topic: 1-D DP
tags: track min and max
lc: 152
signature: maxProduct(nums: int[]) -> int
time: O(n)
space: O(1)
```

Given an integer array `nums`, return the largest **product** of any non-empty contiguous subarray.

**Constraints**
- `1 <= nums.length <= 2 * 10^4`; `-10 <= nums[i] <= 10`
- Every prefix or suffix product fits in a 32-bit integer.

## Hints
- A negative number turns the smallest product into the largest.
- Track both the **maximum** and the **minimum** product of subarrays ending at each index.

## Solution
Carry `hi` and `lo`, the largest and smallest products of a subarray ending at the current element. For `x`, the candidates are `x`, `hi·x` and `lo·x`. The new `hi` is their max and the new `lo` their min (a negative `x` swaps their roles). Zeros naturally reset both to 0, and the answer is the best `hi` seen.

```python
class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        best = hi = lo = nums[0]
        for x in nums[1:]:
            candidates = (x, hi * x, lo * x)
            hi, lo = max(candidates), min(candidates)
            best = max(best, hi)
        return best
```

```javascript
function maxProduct(nums) {
  let best = nums[0];
  let hi = nums[0];
  let lo = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    const a = hi * x;
    const b = lo * x;
    hi = Math.max(x, a, b);
    lo = Math.min(x, a, b);
    best = Math.max(best, hi);
  }
  return best + 0;
}
```

## Tests
```jsonl
{"in": [[2, 3, -2, 4]], "out": 6}
{"in": [[-2, 0, -1]], "out": 0}
{"in": [[-2]], "out": -2}
{"in": [[-2, 3, -4]], "out": 24}
{"in": [[0, 2]], "out": 2}
{"in": [[-1, -3, -10, 0, 60]], "out": 60}
{"in": [[2, -5, -2, -4, 3]], "out": 24}
{"in": [[-2, -3, 7, -2, 0, -1, -8]], "out": 42}
```
