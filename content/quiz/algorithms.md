# Algorithms

```meta
description: Complexity, data structure costs, and recognizing which pattern a problem needs.
```

::: mcq al-constraint-hint
lesson: complexity-cheatsheet
A problem says `1 <= n <= 10^5`. Which complexity should you aim for?

- [ ] O(2ⁿ)
- [ ] O(n³)
- [ ] O(n²)
- [x] O(n log n) or better
???
At about 10⁸ simple operations per second, n² = 10¹⁰ is far too slow, while n log n ≈ 1.7 × 10⁶ is instant. Constraints usually tell you the intended complexity: n ≤ 20 hints at exponential, n ≤ 10³ allows n², and n ≤ 10⁵ needs n log n.
:::

::: mcq al-heapify
lesson: complexity-cheatsheet
What's the time complexity of building a binary heap from n unsorted items with `heapify`?

- [x] O(n)
- [ ] O(n log n)
- [ ] O(log n)
- [ ] O(n²)
???
Bottom-up heapify sifts down from the last internal node. Most nodes sit near the bottom and move only a little, and the sum converges to **O(n)**. Pushing n items one at a time is O(n log n).
:::

::: mcq al-list-pop0
lesson: complexity-cheatsheet
A BFS in Python uses `queue.pop(0)` on a list. What's wrong?

- [ ] Nothing, pop(0) is O(1)
- [x] `pop(0)` shifts every element, making it O(n); use `collections.deque.popleft()`
- [ ] Lists can't hold tuples
- [ ] BFS must use recursion
???
Python lists are dynamic arrays: removing from the front shifts the rest, which is O(n), so a BFS turns O(V²). `deque` gives O(1) at both ends. In JavaScript, `array.shift()` has the same issue. Use a head index, or a proper queue.
:::

::: match al-structure-costs
lesson: complexity-cheatsheet
Match each operation to its typical time complexity.

- Hash map lookup (average) => O(1)
- Binary heap push or pop => O(log n)
- Search in an unsorted array => O(n)
- Comparison-based sort => O(n log n)
???
These four costs come up constantly. Hash maps trade memory for O(1) average lookups (with O(n) worst-case collisions). Heaps keep only the min or max accessible, so every push and pop is O(log n). No comparison sort can beat O(n log n) in general.
:::

::: mcq al-recursion-space
lesson: complexity-cheatsheet
What's the extra space of a recursive DFS on a binary tree with n nodes?

- [ ] O(1)
- [ ] O(log n) always
- [x] O(h), where h is the height: O(log n) if balanced, O(n) if skewed
- [ ] O(n²)
???
Each recursive call adds a stack frame, and the stack holds at most one path from the root, so the space is O(height). Degenerate (linked-list shaped) trees make that O(n), and can even overflow the recursion limit. That's when an iterative approach helps.
:::

::: match al-pattern-clues
lesson: pattern-recognition
Match each problem clue to the pattern it suggests.

- "Longest substring with at most k distinct characters" => Sliding window
- "Next warmer day for each day" => Monotonic stack
- "k closest points to the origin" => Heap
- "Can you finish all courses given prerequisites?" => Topological sort
???
A **contiguous** range with a longest/shortest condition means a sliding window. "Next greater/smaller element" means a monotonic stack. "Top k / k closest" means a heap of size k. Dependencies and cycle detection in a directed graph mean a topological sort.
:::

::: mcq al-shortest-unweighted
lesson: pattern-recognition
You need the **fewest moves** from start to goal in a grid where every move costs the same. Which algorithm?

- [ ] DFS
- [x] BFS
- [ ] Dijkstra with a heap
- [ ] Bellman-Ford
???
BFS explores in order of distance, so the first time it reaches a node, that's the shortest path when all edges have equal weight. DFS finds *a* path, not the shortest. Dijkstra works too, but its heap adds needless overhead for unweighted graphs.
:::

::: mcq al-weighted
lesson: pattern-recognition
Shortest paths with **non-negative** weights, like road travel times, call for:

- [ ] BFS
- [x] Dijkstra's algorithm
- [ ] Topological sort
- [ ] Union-Find
???
Dijkstra repeatedly finalizes the closest unvisited node using a min-heap, in O((V + E) log V). Negative edges break its greedy assumption; use Bellman-Ford then, which also detects negative cycles.
:::

::: mcq al-dp-signal
lesson: pattern-recognition
Which phrasing most strongly suggests **dynamic programming**?

- [ ] "Return any valid path"
- [x] "Return the number of ways…" or "the minimum cost to…", where choices overlap
- [ ] "Find the k-th largest element"
- [ ] "Check if the string is a palindrome"
???
Counting ways and optimizing a cost across a sequence of decisions, where the same sub-states recur, is the hallmark of DP. Define the state, write the recurrence, then memoize (top-down) or tabulate (bottom-up).
:::

::: mcq al-binary-search-answer
lesson: pattern-recognition
"Find the minimum eating speed that finishes all bananas within h hours" is best solved by:

- [ ] Greedy sorting
- [x] Binary search on the answer, because feasibility is monotonic in the speed
- [ ] Dynamic programming over piles
- [ ] BFS over speeds
???
If speed k works, every faster speed works too. That monotonic yes/no lets you binary search the smallest feasible k, checking each guess in O(n). Watch for "minimum X such that…" or "maximum X such that…" phrasing.
:::

::: mcq al-union-find
lesson: pattern-recognition
Edges arrive one at a time and after each you must answer "are u and v connected?". Which structure?

- [ ] BFS from u after every edge
- [x] Union-Find (disjoint set union)
- [ ] A min-heap
- [ ] A trie
???
Union-Find merges components and answers connectivity queries in nearly O(1) amortized time (with path compression and union by rank). Re-running BFS after every edge would be O(V + E) per query.
:::

::: mcq al-two-pointers-sorted
lesson: pattern-recognition
In a **sorted** array, finding a pair that sums to a target in O(1) extra space uses:

- [ ] A hash map
- [x] Two pointers from both ends, moving based on the current sum
- [ ] Binary search for every element, O(n log n) time
- [ ] Backtracking
???
If the sum is too small, move the left pointer right; if too large, move the right pointer left. Each step discards an element that can't be part of a solution: O(n) time, O(1) space. A hash map also works (O(n) time) but needs O(n) space.
:::

::: mcq al-xor
lesson: pattern-recognition
Every number appears twice except one. Which trick finds it in O(n) time and O(1) space?

- [ ] Sort and scan
- [ ] Hash set of seen values
- [x] XOR all the numbers together
- [ ] Sum all the numbers
???
`a ^ a = 0` and `a ^ 0 = a`, and XOR is order-independent, so pairs cancel and the single value remains. Sorting costs O(n log n), and a hash set costs O(n) space.
:::

::: mcq al-cycle
lesson: pattern-recognition
Detecting a cycle in a linked list with O(1) extra memory uses:

- [ ] A hash set of visited nodes
- [x] Fast and slow pointers (Floyd's algorithm)
- [ ] Reversing the list
- [ ] Recursion
???
The fast pointer moves two steps for each step of the slow pointer. With a cycle, fast gains one node per step inside the loop and must meet slow. Without one, fast reaches the end. Floyd's algorithm can also find where the cycle starts.
:::

::: order al-problem-routine
lesson: pattern-recognition
Order the steps for tackling an unfamiliar coding problem in an interview.

1. Restate the problem, inputs, outputs and constraints
2. Work through a small example and edge cases by hand
3. State a brute-force approach and its complexity
4. Find the bottleneck and choose a better pattern
5. Code the solution
6. Trace your code on the example and test edge cases
???
Clarifying first prevents solving the wrong problem. Examples surface edge cases early. A brute force shows you can solve it at all and gives a baseline. Optimizing from the bottleneck is how most pattern insights arise. Tracing your own code catches bugs before the interviewer does.
:::

::: mcq al-prefix-sum
lesson: pattern-recognition
"Count subarrays whose sum equals k" (with negative numbers allowed) is solved in O(n) by:

- [ ] A sliding window
- [x] Prefix sums with a hash map counting earlier prefix sums
- [ ] Sorting then two pointers
- [ ] A heap
???
A subarray sum is `prefix[j] - prefix[i]`. For each j, count earlier prefixes equal to `prefix[j] - k` using a hash map. A sliding window fails here because with negative numbers, growing or shrinking the window doesn't change the sum monotonically.
:::

::: mcq al-backtracking-cost
lesson: complexity-cheatsheet
How many subsets does a set of n elements have?

- [ ] n²
- [ ] n!
- [x] 2ⁿ
- [ ] n log n
???
Each element is either in or out: 2 choices per element, 2ⁿ subsets. Generating them all costs O(n · 2ⁿ) when you copy each subset. That's why subset-style backtracking only works for n up to about 20.
:::

::: mcq al-amortized
lesson: complexity-cheatsheet
Appending to a dynamic array (Python list, JS array) is O(1) **amortized**. What does amortized mean here?

- [ ] Every single append takes constant time
- [x] Occasional resizes cost O(n), but averaged over many appends each costs O(1)
- [ ] Appends are free until the array is full
- [ ] It's O(1) only for small arrays
???
When capacity runs out, the array allocates about 2× the space and copies everything, which is O(n) for that one append. Doubling means those copies happen rarely enough that the total cost of n appends is O(n), so O(1) per append on average.
:::
