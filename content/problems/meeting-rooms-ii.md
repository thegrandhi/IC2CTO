# Meeting Rooms II

```meta
difficulty: Medium
topic: Intervals
tags: sweep line, min-heap
lc: 253
signature: minMeetingRooms(intervals: int[][]) -> int
time: O(n log n)
space: O(n)
```

Given meeting time intervals `[start, end]`, return the **minimum number of conference rooms** needed. A room freed at time `t` can host a meeting starting at `t`.

**Constraints**
- `1 <= intervals.length <= 10^4`; `0 <= start < end <= 10^6`

## Hints
- The answer is the maximum number of meetings happening at the same moment.
- **Sweep line:** sort all starts and all ends separately and walk through them in time order.
- Or: sort by start and keep a min-heap of end times for the rooms in use.

## Solution
Sort the start times and the end times separately. Walk through the starts. Each start needs a room, unless the earliest-ending meeting has already ended (`end <= start`), in which case its room is reused and the end pointer advances. The number of rooms ever allocated is the answer. The min-heap version is equivalent: pop the room that frees up earliest if it's free by the time the next meeting starts.

```python
class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        starts = sorted(s for s, _ in intervals)
        ends = sorted(e for _, e in intervals)
        rooms = j = 0
        for s in starts:
            if ends[j] <= s:
                j += 1
            else:
                rooms += 1
        return rooms
```

```javascript
function minMeetingRooms(intervals) {
  const events = [];
  for (const [s, e] of intervals) events.push([s, 1], [e, -1]);
  // Ends sort before starts at the same time, so a freed room can be reused.
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0;
  let best = 0;
  for (const [, delta] of events) {
    cur += delta;
    best = Math.max(best, cur);
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[[0, 30], [5, 10], [15, 20]]], "out": 2}
{"in": [[[7, 10], [2, 4]]], "out": 1}
{"in": [[[1, 5], [5, 10]]], "out": 1}
{"in": [[[1, 10], [2, 9], [3, 8], [4, 7]]], "out": 4}
{"in": [[[9, 10], [4, 9], [4, 17]]], "out": 2}
{"in": [[[1, 3], [2, 4], [3, 5], [4, 6], [5, 7]]], "out": 2}
```
