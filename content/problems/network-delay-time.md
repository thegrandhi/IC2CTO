# Network Delay Time

```meta
difficulty: Medium
topic: Advanced Graphs
tags: dijkstra, shortest path
lc: 743
signature: networkDelayTime(times: int[][], n: int, k: int) -> int
time: O(E log V)
space: O(V + E)
```

A network has `n` nodes labeled `1` to `n`. `times[i] = [u, v, w]` is a **directed** edge: a signal takes `w` time to travel from `u` to `v`.

A signal is sent from node `k`. Return the time it takes for **all** nodes to receive it, or `-1` if some node never does.

**Constraints**
- `1 <= k <= n <= 100`; `1 <= times.length <= 6000`; `0 <= w <= 100`

## Hints
- Every node receives the signal along its shortest path from `k`. The answer is the **largest** of those shortest distances.
- Non-negative weights point to Dijkstra's algorithm.

## Solution
Run **Dijkstra** from `k` with a min-heap of `(distance, node)`. Pop the closest unfinalized node, finalize it, and relax its outgoing edges. Stale heap entries (a larger distance for an already-finalized node) are skipped. If every node is finalized, return the maximum distance; otherwise `-1`.

```python
class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        graph = defaultdict(list)
        for u, v, w in times:
            graph[u].append((v, w))
        dist = {}
        heap = [(0, k)]
        while heap:
            d, node = heappop(heap)
            if node in dist:
                continue
            dist[node] = d
            for nxt, w in graph[node]:
                if nxt not in dist:
                    heappush(heap, (d + w, nxt))
        return max(dist.values()) if len(dist) == n else -1
```

```javascript
function networkDelayTime(times, n, k) {
  // Bellman-Ford style relaxation: simple and fine for n <= 100.
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  for (let round = 1; round < n; round++) {
    let changed = false;
    for (const [u, v, w] of times) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const worst = Math.max(...dist.slice(1));
  return worst === Infinity ? -1 : worst;
}
```

## Tests
```jsonl
{"in": [[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], "out": 2}
{"in": [[[1, 2, 1]], 2, 1], "out": 1}
{"in": [[[1, 2, 1]], 2, 2], "out": -1}
{"in": [[], 1, 1], "out": 0}
{"in": [[[1, 2, 5], [1, 3, 1], [3, 2, 1], [2, 4, 1]], 4, 1], "out": 3}
{"in": [[[1, 2, 0], [2, 3, 0]], 3, 1], "out": 0}
{"in": [[[1, 2, 4], [1, 3, 2], [3, 2, 1], [2, 4, 5], [3, 4, 8], [4, 5, 3]], 5, 1], "out": 11}
```
