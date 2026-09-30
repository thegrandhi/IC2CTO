# Kth Largest Element in a Stream

```meta
difficulty: Easy
topic: Heap / Priority Queue
tags: min-heap, design
lc: 703
class: KthLargest(k: int, nums: int[])
method: add(val: int) -> int
time: O(log k) per add
space: O(k)
examples: 1
```

Design a class that tracks the **k-th largest** value in a stream of numbers (the k-th largest in sorted order, not the k-th distinct).

- `KthLargest(k, nums)` initializes with `k` and an initial list of numbers.
- `add(val)` appends `val` to the stream and returns the current k-th largest element.

**Constraints**
- `1 <= k <= 10^4`; `0 <= nums.length <= 10^4`
- Whenever `add` returns, the stream holds at least `k` numbers.

## Hints
- You only care about the `k` largest numbers seen so far.
- A **min-heap** of size `k` keeps exactly those, and its root is the k-th largest.

## Solution
Maintain a min-heap containing the `k` largest values seen so far. On `add`, push the value and pop the smallest if the heap grows beyond `k`. The heap's root is the k-th largest. Each add is O(log k). The JavaScript version includes a small binary heap, since JS has no built-in one. Being able to write one quickly pays off in interviews.

```python
class KthLargest:

    def __init__(self, k: int, nums: List[int]):
        self.k = k
        self.heap = []
        for x in nums:
            self.add(x)

    def add(self, val: int) -> int:
        heappush(self.heap, val)
        if len(self.heap) > self.k:
            heappop(self.heap)
        return self.heap[0]
```

```javascript
class MinHeap {
  constructor() {
    this.a = [];
  }
  get size() {
    return this.a.length;
  }
  peek() {
    return this.a[0];
  }
  push(x) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new MinHeap();
    for (const x of nums) this.add(x);
  }

  add(val) {
    this.heap.push(val);
    if (this.heap.size > this.k) this.heap.pop();
    return this.heap.peek();
  }
}
```

## Tests
```jsonl
{"ops": ["KthLargest", "add", "add", "add", "add", "add"], "args": [[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]], "out": [null, 4, 5, 5, 8, 8]}
{"ops": ["KthLargest", "add", "add", "add", "add"], "args": [[4, [7, 7, 7, 7, 8, 3]], [2], [10], [9], [9]], "out": [null, 7, 7, 7, 8]}
{"ops": ["KthLargest", "add", "add", "add"], "args": [[1, []], [-3], [-2], [-4]], "out": [null, -3, -2, -2]}
{"ops": ["KthLargest", "add", "add", "add", "add"], "args": [[2, [0]], [-1], [1], [-2], [3]], "out": [null, -1, 0, 0, 1]}
```
