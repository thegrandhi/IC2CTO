# Cheapest Flights Within K Stops

```meta
difficulty: Medium
topic: Advanced Graphs
tags: bellman-ford, constrained shortest path
lc: 787
signature: findCheapestPrice(n: int, flights: int[][], src: int, dst: int, k: int) -> int
time: O(k · E)
space: O(n)
```

There are `n` cities and a list of directed `flights[i] = [from, to, price]`. Return the cheapest price from `src` to `dst` using **at most `k` stops** (so at most `k + 1` flights), or `-1` if no such route exists.

**Constraints**
- `1 <= n <= 100`; `0 <= flights.length <= n·(n-1)/2`; no duplicate flights.
- `0 <= src, dst, k < n`; `src != dst`

## Hints
- Plain Dijkstra optimizes price, but the cheapest route may use too many stops.
- **Bellman-Ford** limited to `k + 1` rounds: round `i` finds the cheapest prices using at most `i` flights.
- Relax from a **copy** of the previous round's prices, so one round can't chain several flights.

## Solution
Run `k + 1` rounds of Bellman-Ford. Each round computes new prices from the *previous* round's snapshot. Relaxing edges against the live array could chain several flights within one round and break the stop limit. After the rounds, `prices[dst]` is the cheapest price using at most `k + 1` flights.

```python
class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        prices = [inf] * n
        prices[src] = 0
        for _ in range(k + 1):
            nxt = prices[:]
            for u, v, w in flights:
                if prices[u] + w < nxt[v]:
                    nxt[v] = prices[u] + w
            prices = nxt
        return prices[dst] if prices[dst] < inf else -1
```

```javascript
function findCheapestPrice(n, flights, src, dst, k) {
  let prices = new Array(n).fill(Infinity);
  prices[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = [...prices];
    for (const [u, v, w] of flights) {
      if (prices[u] + w < next[v]) next[v] = prices[u] + w;
    }
    prices = next;
  }
  return prices[dst] === Infinity ? -1 : prices[dst];
}
```

## Tests
```jsonl
{"in": [4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1], "out": 700, "why": "0 → 1 → 3 costs 700; the cheaper 0 → 1 → 2 → 3 needs 2 stops."}
{"in": [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1], "out": 200}
{"in": [3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0], "out": 500}
{"in": [3, [[0, 1, 100]], 0, 2, 2], "out": -1}
{"in": [4, [[0, 1, 1], [0, 2, 5], [1, 2, 1], [2, 3, 1]], 0, 3, 1], "out": 6}
{"in": [5, [[0, 1, 5], [1, 2, 5], [0, 3, 2], [3, 1, 2], [1, 4, 1], [4, 2, 1]], 0, 2, 2], "out": 7}
```
