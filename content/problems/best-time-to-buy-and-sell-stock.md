# Best Time to Buy and Sell Stock

```meta
difficulty: Easy
topic: Sliding Window
tags: running minimum
lc: 121
signature: maxProfit(prices: int[]) -> int
time: O(n)
space: O(1)
```

`prices[i]` is a stock's price on day `i`. You may buy on one day and sell on a **later** day. Return the maximum profit you can make, or `0` if no profitable trade exists.

**Constraints**
- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`

## Hints
- For each day, if you sold today, which buy day would be best?
- Track the lowest price seen so far as you scan.

## Solution
Scan the days while keeping the cheapest price seen so far. Selling today earns `price - cheapest`, so keep the best of those. The window is "buy at the running minimum, sell today". One pass, constant space.

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        cheapest = prices[0]
        best = 0
        for p in prices:
            cheapest = min(cheapest, p)
            best = max(best, p - cheapest)
        return best
```

```javascript
function maxProfit(prices) {
  let cheapest = prices[0];
  let best = 0;
  for (const p of prices) {
    cheapest = Math.min(cheapest, p);
    best = Math.max(best, p - cheapest);
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[7, 1, 5, 3, 6, 4]], "out": 5, "why": "Buy at 1 (day 1), sell at 6 (day 4)."}
{"in": [[7, 6, 4, 3, 1]], "out": 0}
{"in": [[1]], "out": 0}
{"in": [[2, 4, 1]], "out": 2}
{"in": [[3, 2, 6, 5, 0, 3]], "out": 4}
{"in": [[1, 2, 3, 4, 5]], "out": 4}
{"in": [[2, 1, 2, 1, 0, 1, 2]], "out": 2}
{"in": [[9, 11, 8, 5, 7, 10]], "out": 5}
```
