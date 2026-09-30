# Last Stone Weight

```meta
difficulty: Easy
topic: Heap / Priority Queue
tags: max-heap, simulation
lc: 1046
signature: lastStoneWeight(stones: int[]) -> int
time: O(n log n)
space: O(n)
```

You have a collection of stones with positive integer weights. Each turn, take the **two heaviest** stones `x <= y` and smash them together:

- If `x == y`, both are destroyed.
- Otherwise `x` is destroyed and `y` becomes `y - x`.

Repeat until at most one stone remains. Return its weight, or `0` if none remain.

**Constraints**
- `1 <= stones.length <= 30`; `1 <= stones[i] <= 1000`

## Hints
- You repeatedly need the two largest values. Which structure gives the maximum quickly?
- Python's `heapq` is a min-heap. Store negated weights to get a max-heap.

## Solution
Simulate with a **max-heap**. Pop the two heaviest; if they differ, push back the difference. When fewer than two stones remain, return the last one (or 0). Each smash costs O(log n).

```python
class Solution:
    def lastStoneWeight(self, stones: List[int]) -> int:
        heap = [-s for s in stones]
        heapify(heap)
        while len(heap) > 1:
            y = -heappop(heap)
            x = -heappop(heap)
            if y > x:
                heappush(heap, -(y - x))
        return -heap[0] if heap else 0
```

```javascript
function lastStoneWeight(stones) {
  // n <= 30, so keeping the array sorted is simple and fast enough.
  const s = [...stones].sort((a, b) => a - b);
  while (s.length > 1) {
    const y = s.pop();
    const x = s.pop();
    if (y > x) {
      const d = y - x;
      let i = s.findIndex((v) => v >= d);
      if (i < 0) i = s.length;
      s.splice(i, 0, d);
    }
  }
  return s.length ? s[0] : 0;
}
```

## Tests
```jsonl
{"in": [[2, 7, 4, 1, 8, 1]], "out": 1}
{"in": [[1]], "out": 1}
{"in": [[2, 2]], "out": 0}
{"in": [[10, 4, 2, 10]], "out": 2}
{"in": [[3, 7, 2]], "out": 2}
{"in": [[9, 3, 2, 10]], "out": 0}
{"in": [[1, 1, 1, 1, 1]], "out": 1}
```
