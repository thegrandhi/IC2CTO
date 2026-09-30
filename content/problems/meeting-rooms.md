# Meeting Rooms

```meta
difficulty: Easy
topic: Intervals
tags: sorting
lc: 252
signature: canAttendMeetings(intervals: int[][]) -> bool
time: O(n log n)
space: O(1)
```

Given meeting times `[start, end]`, determine whether one person could attend **all** of them. A meeting ending at time `t` doesn't conflict with one starting at `t`.

**Constraints**
- `0 <= intervals.length <= 10^4`

## Hints
- Sort by start time. Any conflict must then be between two neighbouring meetings.

## Solution
Sort by start, then check each consecutive pair: if a meeting starts before the previous one ends, there's a conflict.

```python
class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        intervals.sort()
        return all(intervals[i][0] >= intervals[i - 1][1] for i in range(1, len(intervals)))
```

```javascript
function canAttendMeetings(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) if (sorted[i][0] < sorted[i - 1][1]) return false;
  return true;
}
```

## Tests
```jsonl
{"in": [[[0, 30], [5, 10], [15, 20]]], "out": false}
{"in": [[[7, 10], [2, 4]]], "out": true}
{"in": [[]], "out": true}
{"in": [[[1, 5], [5, 10]]], "out": true}
{"in": [[[9, 12], [1, 3], [3, 9]]], "out": true}
{"in": [[[1, 2], [2, 3], [2, 4]]], "out": false}
```
