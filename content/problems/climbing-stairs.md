# Climbing Stairs

```meta
difficulty: Easy
topic: 1-D DP
tags: fibonacci
lc: 70
signature: climbStairs(n: int) -> int
time: O(n)
space: O(1)
```

You're climbing a staircase with `n` steps. Each move climbs either **1 or 2** steps. In how many distinct ways can you reach the top?

**Constraints**
- `1 <= n <= 45`

## Hints
- The last move onto step `n` came from step `n - 1` or step `n - 2`.
- `ways(n) = ways(n - 1) + ways(n - 2)`: Fibonacci.

## Solution
Every route to step `n` ends with a 1-step from `n - 1` or a 2-step from `n - 2`, so `ways(n) = ways(n-1) + ways(n-2)`, with `ways(1) = 1` and `ways(2) = 2`. Iterating with two variables gives O(n) time and O(1) space. Naive recursion without memoization is exponential.

```python
class Solution:
    def climbStairs(self, n: int) -> int:
        a, b = 1, 1  # ways to reach step 0 and step 1
        for _ in range(n - 1):
            a, b = b, a + b
        return b
```

```javascript
function climbStairs(n) {
  let a = 1;
  let b = 1;
  for (let i = 1; i < n; i++) [a, b] = [b, a + b];
  return b;
}
```

## Tests
```jsonl
{"in": [2], "out": 2}
{"in": [3], "out": 3}
{"in": [1], "out": 1}
{"in": [5], "out": 8}
{"in": [10], "out": 89}
{"in": [45], "out": 1836311903}
```
