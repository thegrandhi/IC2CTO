# Minimum Interval to Include Each Query

```meta
difficulty: Hard
topic: Intervals
tags: sorting, min-heap, offline queries
lc: 1851
signature: minInterval(intervals: int[][], queries: int[]) -> int[]
time: O((n + q) log n)
space: O(n + q)
```

You're given intervals `[left, right]` (inclusive; size `right - left + 1`) and a list of `queries`. For each query `q`, find the **smallest interval** that contains `q`, meaning `left <= q <= right`, and return its size, or `-1` if no interval contains `q`.

Return the answers in the **original query order**.

**Constraints**
- `1 <= intervals.length, queries.length <= 10^5`

## Hints
- Answer the queries **offline**, in sorted order, and remember their original positions.
- As the query value grows, add intervals whose `left <= q` to a min-heap keyed by size. Then discard heap tops whose `right < q`.

## Solution
Sort intervals by `left` and process queries in increasing order. For each query, push every interval with `left <= q` onto a min-heap of `(size, right)`. Then pop tops whose `right < q`: they can't cover this query or any later, larger query. The heap top, if any, is the smallest covering interval. Write each answer at its query's original index.

```python
class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        intervals.sort()
        answer = [-1] * len(queries)
        heap = []
        i = 0
        for q, idx in sorted((q, idx) for idx, q in enumerate(queries)):
            while i < len(intervals) and intervals[i][0] <= q:
                left, right = intervals[i]
                heappush(heap, (right - left + 1, right))
                i += 1
            while heap and heap[0][1] < q:
                heappop(heap)
            if heap:
                answer[idx] = heap[0][0]
        return answer
```

```javascript
function minInterval(intervals, queries) {
  // Simple O(n · q) scan: fine for small inputs, but know the heap version for interviews.
  return queries.map((q) => {
    let best = -1;
    for (const [l, r] of intervals) {
      if (l <= q && q <= r && (best < 0 || r - l + 1 < best)) best = r - l + 1;
    }
    return best;
  });
}
```

## Tests
```jsonl
{"in": [[[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]], "out": [3, 3, 1, 4]}
{"in": [[[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22]], "out": [2, -1, 4, 6]}
{"in": [[[1, 1]], [1, 2]], "out": [1, -1]}
{"in": [[[5, 10], [1, 20]], [7, 7, 15, 0]], "out": [6, 6, 20, -1]}
{"in": [[[4, 5], [5, 8], [1, 9], [8, 10], [1, 6]], [7, 9, 3, 9, 3]], "out": [4, 3, 6, 3, 6]}
```
