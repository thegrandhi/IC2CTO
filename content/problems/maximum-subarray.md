# Maximum Subarray

```meta
difficulty: Medium
topic: Greedy
tags: kadane
lc: 53
signature: maxSubArray(nums: int[]) -> int
time: O(n)
space: O(1)
```

Given an integer array `nums`, return the largest sum of any non-empty **contiguous** subarray.

**Constraints**
- `1 <= nums.length <= 10^5`; `-10^4 <= nums[i] <= 10^4`

**Follow-up:** try a divide-and-conquer solution too.

## Hints
- If the running sum of the current subarray goes negative, it can only hurt what comes next.
- At each element: extend the current subarray, or start fresh here?

## Solution
**Kadane's algorithm.** Track `cur`, the best sum of a subarray ending at the current index: `cur = max(x, cur + x)`. A negative prefix is dropped and the sum restarts at `x`. The answer is the best `cur` ever seen. Initialize with `nums[0]` so all-negative arrays work.

```python
class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        best = cur = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best
```

```javascript
function maxSubArray(nums) {
  let best = nums[0];
  let cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], "out": 6, "why": "[4, -1, 2, 1] sums to 6."}
{"in": [[1]], "out": 1}
{"in": [[5, 4, -1, 7, 8]], "out": 23}
{"in": [[-3, -2, -5]], "out": -2}
{"in": [[-1, 2]], "out": 2}
{"in": [[8, -19, 5, -4, 20]], "out": 21}
{"in": [[3, -2, 5, -1]], "out": 6}
```
