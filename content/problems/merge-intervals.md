# Merge Intervals

```meta
difficulty: Medium
topic: Intervals
tags: sorting
lc: 56
signature: merge(intervals: int[][]) -> int[][]
time: O(n log n)
space: O(n)
```

Given an array of intervals `[start, end]`, merge all overlapping intervals and return the non-overlapping intervals that cover the same ranges, **sorted by start**.

**Constraints**
- `1 <= intervals.length <= 10^4`; `0 <= start <= end <= 10^4`

## Hints
- After sorting by start, overlapping intervals end up next to each other.
- Compare each interval with the **last merged** one: overlap means `start <= last.end`.

## Solution
Sort by start. Walk through the intervals. If the current one starts at or before the last merged interval's end, extend that end to `max(end, current end)`. Otherwise start a new merged interval. Sorting dominates, O(n log n).

```python
class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        merged = []
        for start, end in sorted(intervals):
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return merged
```

```javascript
function merge(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
```

## Tests
```jsonl
{"in": [[[1, 3], [2, 6], [8, 10], [15, 18]]], "out": [[1, 6], [8, 10], [15, 18]]}
{"in": [[[1, 4], [4, 5]]], "out": [[1, 5]], "why": "Intervals that touch are merged."}
{"in": [[[4, 7], [1, 4]]], "out": [[1, 7]]}
{"in": [[[1, 4], [2, 3]]], "out": [[1, 4]]}
{"in": [[[1, 1]]], "out": [[1, 1]]}
{"in": [[[5, 6], [1, 2], [3, 4]]], "out": [[1, 2], [3, 4], [5, 6]]}
{"in": [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]], "out": [[1, 10]]}
```
