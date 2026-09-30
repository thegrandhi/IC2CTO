# Insert Interval

```meta
difficulty: Medium
topic: Intervals
tags: merge
lc: 57
signature: insert(intervals: int[][], newInterval: int[]) -> int[][]
time: O(n)
space: O(n)
```

You're given non-overlapping intervals sorted by start, and a `newInterval`. Insert it, merging any overlapping intervals, and return the result, still sorted and non-overlapping.

**Constraints**
- `0 <= intervals.length <= 10^4`; intervals are `[start, end]` with `start <= end`.

## Hints
- The intervals split into three groups: those entirely before the new one, those that overlap it, and those entirely after.
- Overlapping intervals merge into one: take the min of the starts and the max of the ends.

## Solution
One pass in three phases. Copy intervals that end before `newInterval` starts. Then merge every interval that starts at or before `newInterval` ends by widening `newInterval`, and append it. Copy the rest. Touching intervals like `[1,2]` and `[2,3]` count as overlapping.

```python
class Solution:
    def insert(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        result = []
        start, end = newInterval
        i, n = 0, len(intervals)
        while i < n and intervals[i][1] < start:
            result.append(intervals[i])
            i += 1
        while i < n and intervals[i][0] <= end:
            start = min(start, intervals[i][0])
            end = max(end, intervals[i][1])
            i += 1
        result.append([start, end])
        result.extend(intervals[i:])
        return result
```

```javascript
function insert(intervals, newInterval) {
  const result = [];
  let [start, end] = newInterval;
  let i = 0;
  while (i < intervals.length && intervals[i][1] < start) result.push(intervals[i++]);
  while (i < intervals.length && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  result.push([start, end]);
  return result.concat(intervals.slice(i));
}
```

## Tests
```jsonl
{"in": [[[1, 3], [6, 9]], [2, 5]], "out": [[1, 5], [6, 9]]}
{"in": [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], "out": [[1, 2], [3, 10], [12, 16]]}
{"in": [[], [5, 7]], "out": [[5, 7]]}
{"in": [[[1, 5]], [6, 8]], "out": [[1, 5], [6, 8]]}
{"in": [[[3, 5]], [1, 2]], "out": [[1, 2], [3, 5]]}
{"in": [[[1, 5]], [2, 3]], "out": [[1, 5]]}
{"in": [[[1, 2], [5, 6]], [2, 5]], "out": [[1, 6]]}
```
