# Big-O Cheat Sheet

```meta
category: algorithms
summary: The time and space costs you should quote without thinking.
minutes: 4
order: 26
```

### Input size → acceptable complexity
In an interview (roughly 10⁸ simple operations per second):

| n up to | Target |
|---|---|
| 10–12 | O(n!), O(2ⁿ · n) |
| 20–25 | O(2ⁿ) |
| 100–500 | O(n³) |
| 10³–10⁴ | O(n²) |
| 10⁵–10⁶ | O(n log n) |
| 10⁷+ | O(n) or O(log n) |

The constraints often **tell you the intended algorithm**.

### Data structures
| Structure | Access | Search | Insert | Delete |
|---|---|---|---|---|
| Array (dynamic) | O(1) | O(n) | O(1) amortized at end, O(n) middle | O(n) |
| Hash map / set | n/a | O(1) avg | O(1) avg | O(1) avg |
| Balanced BST / sorted map | O(log n) | O(log n) | O(log n) | O(log n) |
| Binary heap | peek O(1) | O(n) | O(log n) | pop O(log n) |
| Linked list | O(n) | O(n) | O(1) given node | O(1) given node |
| Trie | n/a | O(L) | O(L) | O(L) |

- Building a heap from n items with `heapify` is **O(n)**, not O(n log n).
- Python's `list.pop(0)` and `insert(0, x)` are O(n); use `collections.deque`. In JS, `array.shift()` is O(n) too.

### Algorithms
| Algorithm | Time | Space |
|---|---|---|
| Sorting (comparison) | O(n log n) | O(n) or O(log n) |
| Binary search | O(log n) | O(1) |
| BFS / DFS | O(V + E) | O(V) |
| Dijkstra (binary heap) | O((V + E) log V) | O(V) |
| Topological sort | O(V + E) | O(V) |
| Union-Find (with path compression + rank) | ≈ O(α(n)) per op | O(n) |
| Subsets / permutations | O(2ⁿ · n) / O(n! · n) | O(n) |

### Space gotchas
- Recursion uses O(depth) stack: O(h) for trees, and O(n) for skewed trees.
- Slicing (`s[1:]`, `arr.slice()`) copies. In a loop, that quietly adds a factor of n.
- String concatenation in a loop can be O(n²); build a list and join it.

## Key takeaways
- Read the constraints: n ≤ 20 suggests exponential, n ≤ 10⁵ suggests O(n log n) or better.
- Hash maps are O(1) average; heaps O(log n); heapify is O(n).
- Recursion depth and hidden copies count toward space and time.

## Go deeper
- [Big-O cheat sheet](https://www.bigocheatsheet.com/)
