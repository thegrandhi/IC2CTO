# Binary Search

```meta
difficulty: Easy
topic: Binary Search
tags: sorted array
lc: 704
signature: search(nums: int[], target: int) -> int
time: O(log n)
space: O(1)
```

Given a sorted (ascending) array of **distinct** integers `nums` and a `target`, return the index of `target`, or `-1` if it isn't present.

Your algorithm must run in **O(log n)** time.

**Constraints**
- `1 <= nums.length <= 10^4`
- All values are distinct and sorted ascending.

## Hints
- Compare the target with the middle element. Which half can you discard?
- Decide on an interval convention (closed `[lo, hi]` or half-open `[lo, hi)`) and stick to it.

## Solution
Keep a closed interval `[lo, hi]` that must contain the target if it exists. Check the middle. If it's too small, the answer lies in `[mid + 1, hi]`; if too big, in `[lo, mid - 1]`. The interval halves each step. In languages with fixed-width integers, compute `mid = lo + (hi - lo) // 2` to avoid overflow.

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1
```

```javascript
function search(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```

## Tests
```jsonl
{"in": [[-1, 0, 3, 5, 9, 12], 9], "out": 4}
{"in": [[-1, 0, 3, 5, 9, 12], 2], "out": -1}
{"in": [[5], 5], "out": 0}
{"in": [[5], -5], "out": -1}
{"in": [[1, 3], 3], "out": 1}
{"in": [[1, 3, 5, 7, 9, 11, 13], 1], "out": 0}
{"in": [[1, 3, 5, 7, 9, 11, 13], 13], "out": 6}
{"in": [[1, 3, 5, 7, 9, 11, 13], 14], "out": -1}
```
