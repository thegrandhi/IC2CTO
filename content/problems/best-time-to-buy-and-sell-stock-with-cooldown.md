# Best Time to Buy and Sell Stock with Cooldown

```meta
difficulty: Medium
topic: 2-D DP
tags: state machine
lc: 309
signature: maxProfit(prices: int[]) -> int
time: O(n)
space: O(1)
```

`prices[i]` is a stock's price on day `i`. You may complete as many buy/sell transactions as you like, holding at most one share at a time. After you **sell**, you must wait one day (a cooldown) before buying again.

Return the maximum profit.

**Constraints**
- `1 <= prices.length <= 5000`; `0 <= prices[i] <= 1000`

## Hints
- Each day you're in one of three states: **holding** a share, just **sold** (cooling down), or **resting** (free to buy).
- Write down how each state can be reached from yesterday's states.

## Solution
A three-state machine, updated daily:
- `hold = max(hold, rest - price)`: keep holding, or buy today (only allowed from `rest`).
- `sold = hold + price`: sell today.
- `rest = max(rest, sold)`: stay idle, or finish yesterday's cooldown.

Use yesterday's values on the right-hand side. The answer is `max(sold, rest)`, since ending while holding is never optimal.

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        hold, sold, rest = -inf, 0, 0
        for p in prices:
            hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
        return max(sold, rest)
```

```javascript
function maxProfit(prices) {
  let hold = -Infinity;
  let sold = 0;
  let rest = 0;
  for (const p of prices) {
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
  }
  return Math.max(sold, rest);
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 0, 2]], "out": 3, "why": "buy, sell, cooldown, buy, sell"}
{"in": [[1]], "out": 0}
{"in": [[2, 1]], "out": 0}
{"in": [[1, 2, 4]], "out": 3}
{"in": [[6, 1, 3, 2, 4, 7]], "out": 6}
{"in": [[1, 4, 2, 7, 5, 8, 3, 9]], "out": 12}
```
