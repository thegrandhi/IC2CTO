# Time Based Key-Value Store

```meta
difficulty: Medium
topic: Binary Search
tags: design, hash map
lc: 981
class: TimeMap()
method: set(key: string, value: string, timestamp: int) -> void
method: get(key: string, timestamp: int) -> string
time: O(1) set, O(log n) get
space: O(n)
examples: 1
```

Design a key-value store that keeps **multiple values per key, each stamped with a time**, and can answer "what was the value at time `t`?".

- `TimeMap()` initializes the store.
- `set(key, value, timestamp)` stores `value` for `key` at `timestamp`.
- `get(key, timestamp)` returns the value set for `key` at the **largest timestamp `<= timestamp`**, or `""` if there is none.

For each key, `set` is called with **strictly increasing** timestamps.

**Constraints**
- At most `2 * 10^5` calls in total.
- `1 <= timestamp <= 10^7`

## Hints
- Since timestamps arrive in increasing order, each key's history is already a sorted list.
- `get` is "find the last timestamp `<= t`": a binary search for the upper bound.

## Solution
Map each key to a list of `(timestamp, value)` pairs. They're appended in increasing time order, so the list stays sorted with no extra work. For `get`, binary search for the first timestamp `> t`; the entry just before it is the answer. The Python version keeps timestamps and values in parallel lists so `bisect_right` can search the timestamps directly.

```python
class TimeMap:

    def __init__(self):
        self.times = defaultdict(list)
        self.values = defaultdict(list)

    def set(self, key: str, value: str, timestamp: int) -> None:
        self.times[key].append(timestamp)
        self.values[key].append(value)

    def get(self, key: str, timestamp: int) -> str:
        i = bisect_right(self.times[key], timestamp)
        return self.values[key][i - 1] if i else ""
```

```javascript
class TimeMap {
  constructor() {
    this.store = new Map(); // key -> [[timestamp, value], ...]
  }

  set(key, value, timestamp) {
    if (!this.store.has(key)) this.store.set(key, []);
    this.store.get(key).push([timestamp, value]);
  }

  get(key, timestamp) {
    const list = this.store.get(key) ?? [];
    let lo = 0;
    let hi = list.length; // first index with time > timestamp
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] <= timestamp) lo = mid + 1;
      else hi = mid;
    }
    return lo ? list[lo - 1][1] : '';
  }
}
```

## Tests
```jsonl
{"ops": ["TimeMap", "set", "get", "get", "set", "get", "get"], "args": [[], ["foo", "bar", 1], ["foo", 1], ["foo", 3], ["foo", "bar2", 4], ["foo", 4], ["foo", 5]], "out": [null, null, "bar", "bar", null, "bar2", "bar2"]}
{"ops": ["TimeMap", "get", "set", "get", "get"], "args": [[], ["a", 1], ["a", "x", 5], ["a", 4], ["a", 5]], "out": [null, "", null, "", "x"]}
{"ops": ["TimeMap", "set", "set", "set", "get", "get", "get", "get"], "args": [[], ["k", "v1", 10], ["k", "v2", 20], ["j", "w", 15], ["k", 15], ["k", 25], ["j", 14], ["j", 100]], "out": [null, null, null, null, "v1", "v2", "", "w"]}
{"ops": ["TimeMap", "set", "set", "get", "get", "get", "get", "get"], "args": [[], ["love", "high", 10], ["love", "low", 20], ["love", 5], ["love", 10], ["love", 15], ["love", 20], ["love", 25]], "out": [null, null, null, "", "high", "high", "low", "low"]}
```
