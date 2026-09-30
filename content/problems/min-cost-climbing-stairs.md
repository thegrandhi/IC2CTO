# Min Cost Climbing Stairs

```meta
difficulty: Easy
topic: 1-D DP
tags: dp
lc: 746
signature: minCostClimbingStairs(cost: int[]) -> int
time: O(n)
space: O(1)
```

`cost[i]` is the price of stepping on stair `i`. Once you pay, you may climb one or two stairs. You can start on stair `0` or stair `1`.

Return the minimum cost to reach the **top**, which is one step past the last stair.

**Constraints**
- `2 <= cost.length <= 1000`; `0 <= cost[i] <= 999`

## Hints
- Let `dp[i]` be the cheapest cost to *stand on* position `i` without having paid for it yet.
- `dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])`. The top is position `n`.

## Solution
`dp[i]` is the minimum cost to arrive at position `i`. You arrive from `i - 1` (paying `cost[i-1]`) or from `i - 2` (paying `cost[i-2]`). Starting on stair 0 or 1 is free, so `dp[0] = dp[1] = 0`, and the answer is `dp[n]`. Only the last two values are needed.

```python
class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        a = b = 0  # cost to reach i-2 and i-1
        for i in range(2, len(cost) + 1):
            a, b = b, min(b + cost[i - 1], a + cost[i - 2])
        return b
```

```javascript
function minCostClimbingStairs(cost) {
  let a = 0;
  let b = 0;
  for (let i = 2; i <= cost.length; i++) [a, b] = [b, Math.min(b + cost[i - 1], a + cost[i - 2])];
  return b;
}
```

## Tests
```jsonl
{"in": [[10, 15, 20]], "out": 15, "why": "Start on stair 1, pay 15, climb two steps to the top."}
{"in": [[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]], "out": 6}
{"in": [[0, 0]], "out": 0}
{"in": [[5, 10]], "out": 5}
{"in": [[0, 1, 2, 2]], "out": 2}
{"in": [[3, 2, 4, 1, 5, 2, 7]], "out": 5}
```
