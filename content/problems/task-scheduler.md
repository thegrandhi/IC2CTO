# Task Scheduler

```meta
difficulty: Medium
topic: Heap / Priority Queue
tags: greedy, counting
lc: 621
signature: leastInterval(tasks: char[], n: int) -> int
time: O(t)
space: O(26)
```

A CPU must run a list of tasks, each labeled by a letter. Every task takes one time unit. In each unit the CPU either runs one task or sits **idle**. Two runs of the **same** task must be separated by at least `n` units.

Return the minimum number of units needed to finish all tasks.

**Constraints**
- `1 <= tasks.length <= 10^4`; tasks are uppercase letters.
- `0 <= n <= 100`

## Hints
- The most frequent task dictates the shape: it needs `n` gaps between each of its runs.
- With `maxCount` as the highest frequency, lay out `maxCount - 1` blocks of length `n + 1`, plus a final block holding every task that has that max frequency.
- If there are more tasks than slots, no idling is needed at all.

## Solution
Let `maxCount` be the largest task frequency and `numMax` the number of tasks that reach it. The most frequent tasks form a frame of `maxCount - 1` full cycles of length `n + 1`, followed by one final partial cycle of `numMax` tasks: `(maxCount - 1) * (n + 1) + numMax` units. Every other task fits into the idle slots of that frame. If there are more tasks than slots, the schedule needs no idles and takes `len(tasks)`. The answer is the larger of the two. A max-heap simulation also works but is slower.

```python
class Solution:
    def leastInterval(self, tasks: List[str], n: int) -> int:
        counts = Counter(tasks).values()
        max_count = max(counts)
        num_max = sum(1 for c in counts if c == max_count)
        return max(len(tasks), (max_count - 1) * (n + 1) + num_max)
```

```javascript
function leastInterval(tasks, n) {
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  let numMax = 0;
  for (const c of counts.values()) if (c === maxCount) numMax++;
  return Math.max(tasks.length, (maxCount - 1) * (n + 1) + numMax);
}
```

## Tests
```jsonl
{"in": [["A", "A", "A", "B", "B", "B"], 2], "out": 8, "why": "A → B → idle → A → B → idle → A → B"}
{"in": [["A", "C", "A", "B", "D", "B"], 1], "out": 6}
{"in": [["A", "A", "A", "B", "B", "B"], 3], "out": 10}
{"in": [["A", "A", "A", "B", "B", "B"], 0], "out": 6}
{"in": [["A"], 5], "out": 1}
{"in": [["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"], 2], "out": 16}
{"in": [["A", "B", "C", "D", "A", "B", "V"], 3], "out": 7}
```
