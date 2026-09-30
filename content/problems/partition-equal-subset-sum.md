# Partition Equal Subset Sum

```meta
difficulty: Medium
topic: 1-D DP
tags: 0/1 knapsack, subset sum
lc: 416
signature: canPartition(nums: int[]) -> bool
time: O(n · sum)
space: O(sum)
```

Given an array of positive integers `nums`, return `true` if it can be split into **two subsets with equal sums**.

**Constraints**
- `1 <= nums.length <= 200`; `1 <= nums[i] <= 100`

## Hints
- If the total is odd, it's impossible. Otherwise you need a subset summing to `total / 2`.
- Subset sum: track every reachable sum as you consider each number once.

## Solution
With `target = total / 2`, keep the set of sums reachable using the numbers seen so far (a boolean array or a set). Each number `x` adds `s + x` for every reachable `s`. When updating a boolean array in place, iterate sums **downward** so `x` is used at most once. Return whether `target` becomes reachable.

```python
class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        total = sum(nums)
        if total % 2:
            return False
        target = total // 2
        reachable = {0}
        for x in nums:
            reachable |= {s + x for s in reachable if s + x <= target}
            if target in reachable:
                return True
        return False
```

```javascript
function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) {
    for (let s = target; s >= x; s--) if (dp[s - x]) dp[s] = true;
  }
  return dp[target];
}
```

## Tests
```jsonl
{"in": [[1, 5, 11, 5]], "out": true, "why": "[1, 5, 5] and [11]."}
{"in": [[1, 2, 3, 5]], "out": false}
{"in": [[1]], "out": false}
{"in": [[2, 2]], "out": true}
{"in": [[1, 2, 5]], "out": false}
{"in": [[3, 3, 3, 4, 5]], "out": true}
{"in": [[100, 100, 100, 100, 100, 100, 100, 100, 99, 97]], "out": false}
```
