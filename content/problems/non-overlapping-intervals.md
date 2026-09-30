# Non-overlapping Intervals

```meta
difficulty: Medium
topic: Intervals
tags: greedy, sort by end
lc: 435
signature: eraseOverlapIntervals(intervals: int[][]) -> int
time: O(n log n)
space: O(1)
```

Given intervals `[start, end]`, return the **minimum number of intervals to remove** so that the rest don't overlap. Intervals that only touch, like `[1, 2]` and `[2, 3]`, don't overlap.

**Constraints**
- `1 <= intervals.length <= 10^5`

## Hints
- Flip the question: keep the **maximum** number of non-overlapping intervals.
- Greedy: always keep the interval that **ends earliest**, since it leaves the most room for the rest.

## Solution
Sort by end time. Keep an interval if it starts at or after the end of the last kept one; otherwise it overlaps and gets removed. Choosing the earliest-ending compatible interval is the classic activity-selection greedy. An exchange argument shows it's optimal.

```python
class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        removed = 0
        prev_end = -inf
        for start, end in sorted(intervals, key=lambda iv: iv[1]):
            if start >= prev_end:
                prev_end = end
            else:
                removed += 1
        return removed
```

```javascript
function eraseOverlapIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let removed = 0;
  let prevEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start >= prevEnd) prevEnd = end;
    else removed++;
  }
  return removed;
}
```

## Tests
```jsonl
{"in": [[[1, 2], [2, 3], [3, 4], [1, 3]]], "out": 1}
{"in": [[[1, 2], [1, 2], [1, 2]]], "out": 2}
{"in": [[[1, 2], [2, 3]]], "out": 0}
{"in": [[[1, 100], [11, 22], [1, 11], [2, 12]]], "out": 2}
{"in": [[[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]], "out": 2}
{"in": [[[-52, 31], [-73, -26], [82, 97], [-65, -11], [-62, -49], [95, 99], [58, 95], [-31, 49], [66, 98], [-63, 2], [30, 47], [-40, -26]]], "out": 7}
```
