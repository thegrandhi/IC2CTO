# Coin Change

```meta
difficulty: Medium
topic: 1-D DP
tags: unbounded knapsack
lc: 322
signature: coinChange(coins: int[], amount: int) -> int
time: O(amount · coins)
space: O(amount)
```

Given coin denominations `coins` (with an unlimited supply of each) and a target `amount`, return the **fewest coins** that add up to `amount`, or `-1` if it can't be done.

**Constraints**
- `1 <= coins.length <= 12`; `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`

## Hints
- Greedy (always take the largest coin) fails: with coins `[1, 3, 4]` and amount `6`, greedy uses 3 coins, but `3 + 3` uses 2.
- `dp[a] = 1 + min(dp[a - c])` over coins `c <= a`.

## Solution
Bottom-up DP over amounts: `dp[0] = 0`, and for each amount `a`, try every coin as the last one: `dp[a] = min(dp[a], dp[a - c] + 1)`. Unreachable amounts stay at ∞. BFS over amounts, where each level adds one coin, is an equivalent view.

```python
class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [0] + [inf] * amount
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a and dp[a - c] + 1 < dp[a]:
                    dp[a] = dp[a - c] + 1
        return dp[amount] if dp[amount] != inf else -1
```

```javascript
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

## Tests
```jsonl
{"in": [[1, 2, 5], 11], "out": 3, "why": "5 + 5 + 1"}
{"in": [[2], 3], "out": -1}
{"in": [[1], 0], "out": 0}
{"in": [[1, 3, 4], 6], "out": 2}
{"in": [[186, 419, 83, 408], 6249], "out": 20}
{"in": [[2, 5, 10, 1], 27], "out": 4}
{"in": [[7, 3], 5], "out": -1}
{"in": [[2147483647], 2], "out": -1}
```
