# Gas Station

```meta
difficulty: Medium
topic: Greedy
tags: circular array
lc: 134
signature: canCompleteCircuit(gas: int[], cost: int[]) -> int
time: O(n)
space: O(1)
```

There are `n` gas stations on a circular route. Station `i` provides `gas[i]` fuel, and driving from station `i` to station `i + 1` costs `cost[i]` fuel. You start with an empty tank.

Return the index of the starting station from which you can drive around the circuit once, or `-1` if it's impossible. If a solution exists, it is **unique**.

**Constraints**
- `1 <= n <= 10^5`; `0 <= gas[i], cost[i] <= 10^4`

## Hints
- If total gas < total cost, no start works.
- If you start at `s` and run dry before reaching station `j`, then no station between `s` and `j` can be the start either.

## Solution
If `sum(gas) < sum(cost)`, return `-1`. Otherwise scan once with a running `tank`. Whenever it goes negative at station `i`, none of the stations from the current start through `i` can work (each would arrive at `i` with even less fuel), so reset the start to `i + 1` and empty the tank. The final start is the answer. The total-sum check guarantees it completes the loop.

```python
class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        if sum(gas) < sum(cost):
            return -1
        start = tank = 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:
                start, tank = i + 1, 0
        return start
```

```javascript
function canCompleteCircuit(gas, cost) {
  let total = 0;
  let tank = 0;
  let start = 0;
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) {
      start = i + 1;
      tank = 0;
    }
  }
  return total < 0 ? -1 : start;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], "out": 3}
{"in": [[2, 3, 4], [3, 4, 3]], "out": -1}
{"in": [[5], [4]], "out": 0}
{"in": [[3, 1, 1], [1, 2, 2]], "out": 0}
{"in": [[5, 1, 2, 3, 4], [4, 4, 1, 5, 1]], "out": 4}
{"in": [[1, 1, 1, 10], [2, 2, 2, 1]], "out": 3}
```
