# LRU Cache

```meta
difficulty: Medium
topic: Linked List
tags: hash map, doubly linked list, design
lc: 146
class: LRUCache(capacity: int)
method: get(key: int) -> int
method: put(key: int, value: int) -> void
time: O(1) per operation
space: O(capacity)
examples: 1
```

Design a data structure that behaves like a **Least Recently Used (LRU)** cache.

- `LRUCache(capacity)` creates the cache with a positive capacity.
- `get(key)` returns the value for `key` if present, otherwise `-1`. A successful `get` counts as a use.
- `put(key, value)` inserts or updates the key (also counts as a use). If this pushes the number of keys past `capacity`, evict the **least recently used** key.

Both `get` and `put` must run in **O(1)** average time.

**Constraints**
- `1 <= capacity <= 3000`
- At most `2 * 10^5` calls to `get` and `put`.

## Hints
- A hash map gives O(1) lookup, but it doesn't track recency. What structure lets you move an item to the "most recent" end and remove from the "least recent" end in O(1)?
- A doubly linked list with sentinel head/tail nodes, plus a map from key to list node.
- In Python, `collections.OrderedDict` has `move_to_end` and `popitem(last=False)`. In JavaScript, a `Map` iterates in insertion order: delete and re-insert a key to mark it as recent.

## Solution
Keep a hash map from key to node, and a doubly linked list ordered from least to most recently used. `get` moves the node to the tail. `put` updates or appends at the tail, then evicts from the head when over capacity. Every step is O(1).

Both languages have an ordered hash map that does the linked-list bookkeeping for you. Be ready to build the linked list by hand too, since interviewers often ask for it.

```python
class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key: int, value: int) -> None:
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
```

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // iteration order = recency order
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);
    }
  }
}
```

## Tests
```jsonl
{"ops": ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], "args": [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], "out": [null, null, null, 1, null, -1, null, -1, 3, 4]}
{"ops": ["LRUCache", "put", "get", "put", "get", "get"], "args": [[1], [2, 1], [2], [3, 2], [2], [3]], "out": [null, null, 1, null, -1, 2]}
{"ops": ["LRUCache", "put", "put", "put", "put", "get", "get"], "args": [[2], [2, 1], [1, 1], [2, 3], [4, 1], [1], [2]], "out": [null, null, null, null, null, -1, 3]}
{"ops": ["LRUCache", "get", "put", "get", "put", "put", "get", "get"], "args": [[2], [2], [2, 6], [1], [1, 5], [1, 2], [1], [2]], "out": [null, -1, null, -1, null, null, 2, 6]}
{"ops": ["LRUCache", "put", "put", "get", "put", "put", "get", "get", "get"], "args": [[3], [1, 1], [2, 2], [1], [3, 3], [4, 4], [2], [1], [4]], "out": [null, null, null, 1, null, null, -1, 1, 4]}
```
