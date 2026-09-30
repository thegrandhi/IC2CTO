# Find Median from Data Stream

```meta
difficulty: Hard
topic: Heap / Priority Queue
tags: two heaps, design
lc: 295
class: MedianFinder()
method: addNum(num: int) -> void
method: findMedian() -> float
compare: float
time: O(log n) add, O(1) median
space: O(n)
examples: 1
```

The **median** is the middle value of a sorted list, or the mean of the two middle values when the list has even length. Design a structure that supports:

- `MedianFinder()` initializes it.
- `addNum(num)` adds a number from the stream.
- `findMedian()` returns the median of all numbers so far.

**Constraints**
- `-10^5 <= num <= 10^5`
- `findMedian` is called only after at least one number was added; at most `5 * 10^4` calls in total.

## Hints
- Keep the smaller half and the larger half of the numbers separately.
- A **max-heap** for the lower half and a **min-heap** for the upper half expose the two middle candidates at their roots.
- Rebalance so the sizes differ by at most one.

## Solution
Keep a **max-heap** `low` (the smaller half) and a **min-heap** `high` (the larger half), with `len(low) == len(high)` or `len(low) == len(high) + 1`. To add, push onto `low`, move `low`'s maximum to `high`, and if `high` got bigger, move its minimum back. The median is `low`'s root for an odd count, otherwise the average of both roots. The JS version keeps a sorted array with binary-search insertion, which is simpler to write and fine for these limits (O(n) per insert).

```python
class MedianFinder:

    def __init__(self):
        self.low = []   # max-heap (negated)
        self.high = []  # min-heap

    def addNum(self, num: int) -> None:
        heappush(self.low, -num)
        heappush(self.high, -heappop(self.low))
        if len(self.high) > len(self.low):
            heappush(self.low, -heappop(self.high))

    def findMedian(self) -> float:
        if len(self.low) > len(self.high):
            return float(-self.low[0])
        return (-self.low[0] + self.high[0]) / 2
```

```javascript
class MedianFinder {
  constructor() {
    this.sorted = [];
  }

  addNum(num) {
    const a = this.sorted;
    let lo = 0;
    let hi = a.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (a[mid] < num) lo = mid + 1;
      else hi = mid;
    }
    a.splice(lo, 0, num);
  }

  findMedian() {
    const a = this.sorted;
    const m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
}
```

## Tests
```jsonl
{"ops": ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"], "args": [[], [1], [2], [], [3], []], "out": [null, null, null, 1.5, null, 2.0]}
{"ops": ["MedianFinder", "addNum", "findMedian"], "args": [[], [-7], []], "out": [null, null, -7]}
{"ops": ["MedianFinder", "addNum", "addNum", "addNum", "addNum", "findMedian", "addNum", "findMedian"], "args": [[], [5], [15], [1], [3], [], [8], []], "out": [null, null, null, null, null, 4, null, 5]}
{"ops": ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "addNum", "findMedian"], "args": [[], [-1], [-2], [], [-3], [-4], []], "out": [null, null, null, -1.5, null, null, -2.5]}
{"ops": ["MedianFinder", "addNum", "addNum", "addNum", "findMedian"], "args": [[], [6], [10], [2], []], "out": [null, null, null, null, 6]}
```
