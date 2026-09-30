# Longest Increasing Subsequence

```meta
difficulty: Medium
topic: 1-D DP
tags: patience sorting, binary search
lc: 300
signature: lengthOfLIS(nums: int[]) -> int
time: O(n log n)
space: O(n)
```

Given an integer array `nums`, return the length of the longest **strictly increasing subsequence**. A subsequence keeps the original order but may skip elements.

**Constraints**
- `1 <= nums.length <= 2500`; `-10^4 <= nums[i] <= 10^4`

**Follow-up:** O(n log n).

## Hints
- O(n²) DP: `lis[i] = 1 + max(lis[j])` over `j < i` with `nums[j] < nums[i]`.
- For O(n log n), keep `tails[k]` = the smallest possible tail of an increasing subsequence of length `k + 1`. It's always sorted.

## Solution
Maintain `tails`, where `tails[k]` is the smallest ending value of any increasing subsequence of length `k + 1`. For each `x`, binary search for the first tail `>= x`. Replace it with `x`, since a smaller tail is always better, or append `x` if it's larger than every tail. The length of `tails` is the answer. `tails` isn't itself an LIS, but its length is correct.

```python
class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        tails = []
        for x in nums:
            i = bisect_left(tails, x)
            if i == len(tails):
                tails.append(x)
            else:
                tails[i] = x
        return len(tails)
```

```javascript
function lengthOfLIS(nums) {
  const lis = new Array(nums.length).fill(1);
  let best = 1;
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) if (nums[j] < nums[i]) lis[i] = Math.max(lis[i], lis[j] + 1);
    best = Math.max(best, lis[i]);
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[10, 9, 2, 5, 3, 7, 101, 18]], "out": 4, "why": "For example 2, 3, 7, 101."}
{"in": [[0, 1, 0, 3, 2, 3]], "out": 4}
{"in": [[7, 7, 7, 7, 7, 7, 7]], "out": 1}
{"in": [[1]], "out": 1}
{"in": [[5, 4, 3, 2, 1]], "out": 1}
{"in": [[1, 3, 6, 7, 9, 4, 10, 5, 6]], "out": 6}
{"in": [[4, 10, 4, 3, 8, 9]], "out": 3}
```
