# Target Sum

```meta
difficulty: Medium
topic: 2-D DP
tags: subset sum, counting
lc: 494
signature: findTargetSumWays(nums: int[], target: int) -> int
time: O(n · sum)
space: O(sum)
```

You're given an integer array `nums` and an integer `target`. Put a `+` or `-` sign in front of every number and add everything up. Return the number of sign assignments whose total equals `target`.

**Constraints**
- `1 <= nums.length <= 20`; `0 <= nums[i] <= 1000`; `sum(nums) <= 1000`
- `-1000 <= target <= 1000`

## Hints
- Brute force tries 2ⁿ sign patterns, which is fine for n ≤ 20 but misses the DP idea.
- Track a map from "running total" to "number of ways to reach it" as you process each number.
- Algebra: if `P` is the sum of the positive numbers, then `P = (sum + target) / 2`, which turns this into counting subsets that sum to `P`.

## Solution
Keep a dictionary `ways` from each reachable running total to its count, starting at `{0: 1}`. For each number `x`, every total `t` branches into `t + x` and `t - x`, and counts add up. After all numbers, `ways[target]` is the answer. The subset-sum reformulation `P = (sum + target) / 2` (it must be a non-negative integer) gives a compact 1-D array DP.

```python
class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        ways = Counter({0: 1})
        for x in nums:
            nxt = Counter()
            for total, count in ways.items():
                nxt[total + x] += count
                nxt[total - x] += count
            ways = nxt
        return ways[target]
```

```javascript
function findTargetSumWays(nums, target) {
  const total = nums.reduce((a, b) => a + b, 0);
  if ((total + target) % 2 !== 0 || Math.abs(target) > total) return 0;
  const p = (total + target) / 2;
  const dp = new Array(p + 1).fill(0);
  dp[0] = 1;
  for (const x of nums) for (let s = p; s >= x; s--) dp[s] += dp[s - x];
  return dp[p];
}
```

## Tests
```jsonl
{"in": [[1, 1, 1, 1, 1], 3], "out": 5}
{"in": [[1], 1], "out": 1}
{"in": [[1], 2], "out": 0}
{"in": [[0, 0, 1], 1], "out": 4}
{"in": [[2, 3, 5, 7], 3], "out": 2}
{"in": [[1, 2, 1], 0], "out": 2}
{"in": [[5, 5, 5, 5], -20], "out": 1}
```
