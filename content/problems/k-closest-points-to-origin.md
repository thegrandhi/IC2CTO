# K Closest Points to Origin

```meta
difficulty: Medium
topic: Heap / Priority Queue
tags: max-heap, quickselect
lc: 973
signature: kClosest(points: int[][], k: int) -> int[][]
compare: unordered
time: O(n log k)
space: O(k)
```

Given an array of points `[x, y]` on a plane and an integer `k`, return the `k` points **closest to the origin** `(0, 0)` by Euclidean distance. Return them in any order.

The answer is guaranteed to be unique: there's never a tie for the k-th place.

**Constraints**
- `1 <= k <= points.length <= 10^4`
- `-10^4 <= x, y <= 10^4`

## Hints
- Compare squared distances `x² + y²`. There's no need for square roots.
- Keep a **max-heap** of size `k`. If a new point is closer than the farthest point in the heap, swap them.
- Quickselect gives average O(n).

## Solution
Scan the points while keeping a max-heap (keyed by squared distance) of the best `k` so far. Push each point; if the heap exceeds `k`, pop the farthest. What remains are the `k` closest, in O(n log k). Sorting all points by distance is O(n log n) and also fine for these limits; the JS version does that.

```python
class Solution:
    def kClosest(self, points: List[List[int]], k: int) -> List[List[int]]:
        heap = []
        for x, y in points:
            heappush(heap, (-(x * x + y * y), x, y))
            if len(heap) > k:
                heappop(heap)
        return [[x, y] for _, x, y in heap]
```

```javascript
function kClosest(points, k) {
  const dist = ([x, y]) => x * x + y * y;
  return [...points].sort((a, b) => dist(a) - dist(b)).slice(0, k);
}
```

## Tests
```jsonl
{"in": [[[1, 3], [-2, 2]], 1], "out": [[-2, 2]]}
{"in": [[[3, 3], [5, -1], [-2, 4]], 2], "out": [[3, 3], [-2, 4]]}
{"in": [[[0, 1], [1, 0]], 2], "out": [[0, 1], [1, 0]]}
{"in": [[[1, 1], [2, 2], [3, 3], [-1, -2]], 1], "out": [[1, 1]]}
{"in": [[[6, 10], [-3, 3], [-2, 5], [0, 2]], 3], "out": [[-2, 5], [-3, 3], [0, 2]]}
{"in": [[[10, 0], [0, 9], [8, 0], [0, 7], [1, 1]], 2], "out": [[0, 7], [1, 1]]}
```
