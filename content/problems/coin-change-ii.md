# Coin Change II

```meta
difficulty: Medium
topic: 2-D DP
tags: unbounded knapsack, counting
lc: 518
signature: change(amount: int, coins: int[]) -> int
time: O(amount · coins)
space: O(amount)
```

Given an `amount` and coin denominations `coins` (unlimited supply of each), return the number of **combinations** that make up the amount. Order doesn't matter: `1+2` and `2+1` are the same combination. If the amount can't be made, return `0`.

**Constraints**
- `1 <= coins.length <= 300`; `1 <= coins[i] <= 5000`; all coins are distinct.
- `0 <= amount <= 5000`

## Hints
- Counting **combinations** (not permutations) means the order you add coin types matters in the loops.
- Loop over coins in the **outer** loop and amounts in the inner loop. Each combination is then built in a fixed coin order and counted once.

## Solution
`ways[a]` counts combinations making `a` using the coins processed so far, starting from `ways[0] = 1`. For each coin `c`, sweep `a` upward: `ways[a] += ways[a - c]`. The upward sweep allows reusing `c`. Processing coins one type at a time prevents counting different orderings separately. Swapping the loops would count permutations instead.

```python
class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        ways = [1] + [0] * amount
        for c in coins:
            for a in range(c, amount + 1):
                ways[a] += ways[a - c]
        return ways[amount]
```

```javascript
function change(amount, coins) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (const c of coins) for (let a = c; a <= amount; a++) ways[a] += ways[a - c];
  return ways[amount];
}
```

## Tests
```jsonl
{"in": [5, [1, 2, 5]], "out": 4}
{"in": [3, [2]], "out": 0}
{"in": [10, [10]], "out": 1}
{"in": [0, [7]], "out": 1}
{"in": [12, [2, 3, 5]], "out": 5}
{"in": [100, [1, 5, 10, 25]], "out": 242}
```
