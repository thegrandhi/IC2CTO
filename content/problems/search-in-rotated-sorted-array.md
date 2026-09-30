# Search in Rotated Sorted Array

```meta
difficulty: Medium
topic: Binary Search
tags: rotated array
lc: 33
signature: search(nums: int[], target: int) -> int
time: O(log n)
space: O(1)
```

An ascending array of **distinct** integers has been rotated at an unknown pivot (for example `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`). Return the index of `target`, or `-1` if it's absent, in **O(log n)** time.

**Constraints**
- `1 <= nums.length <= 5000`
- All values are distinct.

## Hints
- Split at `mid`: at least one of the halves `[lo, mid]` or `[mid, hi]` is sorted.
- Check whether the target lies inside the sorted half's range. If yes, search there; otherwise search the other half.

## Solution
At each step, one side of `mid` is in sorted order. If `nums[lo] <= nums[mid]`, the left half is sorted: when `nums[lo] <= target < nums[mid]` go left, otherwise go right. If instead the right half is sorted: when `nums[mid] < target <= nums[hi]` go right, otherwise go left. Every step discards half the range.

```python
class Solution:
    def search(self, nums: List[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1
                else:
                    lo = mid + 1
            else:
                if nums[mid] < target <= nums[hi]:
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
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
```

## Tests
```jsonl
{"in": [[4, 5, 6, 7, 0, 1, 2], 0], "out": 4}
{"in": [[4, 5, 6, 7, 0, 1, 2], 3], "out": -1}
{"in": [[1], 0], "out": -1}
{"in": [[1], 1], "out": 0}
{"in": [[3, 1], 1], "out": 1}
{"in": [[5, 1, 3], 5], "out": 0}
{"in": [[6, 7, 1, 2, 3, 4, 5], 7], "out": 1}
{"in": [[1, 2, 3, 4, 5, 6], 4], "out": 3}
{"in": [[8, 9, 2, 3, 4], 9], "out": 1}
```
