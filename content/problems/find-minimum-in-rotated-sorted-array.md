# Find Minimum in Rotated Sorted Array

```meta
difficulty: Medium
topic: Binary Search
tags: rotated array
lc: 153
signature: findMin(nums: int[]) -> int
time: O(log n)
space: O(1)
```

An ascending array of **distinct** integers was rotated some number of times; `[0,1,2,4,5,6,7]` might become `[4,5,6,7,0,1,2]`. Given the rotated array, return its **minimum** element in **O(log n)** time.

**Constraints**
- `1 <= nums.length <= 5000`
- All values are distinct.

## Hints
- Compare the middle element with the **last** element. What does that tell you about where the rotation point is?
- If `nums[mid] > nums[hi]`, the minimum is strictly right of `mid`. Otherwise it's at `mid` or to its left.

## Solution
The minimum is the only point where the order "drops". Keep `[lo, hi]` around it. If `nums[mid] > nums[hi]`, the drop is to the right of `mid`, so `lo = mid + 1`. Otherwise `mid..hi` is sorted, so the minimum is at `mid` or before it, and `hi = mid`. When `lo == hi`, that's the minimum.

```python
class Solution:
    def findMin(self, nums: List[int]) -> int:
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] > nums[hi]:
                lo = mid + 1
            else:
                hi = mid
        return nums[lo]
```

```javascript
function findMin(nums) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}
```

## Tests
```jsonl
{"in": [[3, 4, 5, 1, 2]], "out": 1}
{"in": [[4, 5, 6, 7, 0, 1, 2]], "out": 0}
{"in": [[11, 13, 15, 17]], "out": 11}
{"in": [[1]], "out": 1}
{"in": [[2, 1]], "out": 1}
{"in": [[5, 1, 2, 3, 4]], "out": 1}
{"in": [[2, 3, 4, 5, 1]], "out": 1}
{"in": [[-3, -2, -1, -10, -9]], "out": -10}
```
