# Code Drills

```meta
description: Fill-in-the-blank and order-the-lines drills for the core coding patterns. No keyboard needed.
```

::: blank cd-two-sum-lookup
problem: two-sum
Complete the one-pass hash map solution to **Two Sum**.

```python
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, x in enumerate(nums):
        if {{target - x}} in seen:
            return [seen[target - x], i]
        {{seen[x] = i}}
```
- extra: x - target | seen[i] = x | target + x
???
For each `x`, the partner you need is `target - x`. Look it up **before** storing `x`, so an element can never pair with itself. Then record `x → i` for later elements to find. One pass, O(n) time and space.
:::

::: lines cd-reverse-list-order
problem: reverse-linked-list
Put the iterative **reverse a linked list** loop in order.

```python
prev, cur = None, head
while cur:
    nxt = cur.next
    cur.next = prev
    prev = cur
    cur = nxt
return prev
```
???
Save `cur.next` **first**, because the next line overwrites it. Then flip the pointer and advance both `prev` and `cur`. When `cur` runs off the end, `prev` is the new head.
:::

::: blank cd-binary-search-bounds
Fill in the classic **binary search** on a sorted array (returns the index or -1).

```python
lo, hi = 0, len(nums) - 1
while {{lo <= hi}}:
    mid = (lo + hi) // 2
    if nums[mid] == target:
        return mid
    if nums[mid] < target:
        lo = {{mid + 1}}
    else:
        hi = {{mid - 1}}
return -1
```
- extra: lo < hi | mid | mid - 1 | mid + 1
???
With a **closed** interval `[lo, hi]`, the loop runs while `lo <= hi`; the range still holds one candidate when they're equal. Because `mid` has already been checked, the next range excludes it: `lo = mid + 1` or `hi = mid - 1`. Mixing conventions (like `lo < hi` with `hi = mid - 1`) is the most common source of off-by-one bugs.
:::

::: blank cd-sliding-window-shrink
problem: longest-substring-without-repeating-characters
Complete the **sliding window** for the longest substring without repeating characters.

```python
last = {}  # char -> last index seen
left = best = 0
for right, ch in enumerate(s):
    if ch in last and last[ch] >= {{left}}:
        left = {{last[ch] + 1}}
    last[ch] = right
    best = max(best, {{right - left + 1}})
```
- extra: right | last[ch] | right - left
???
The window `[left, right]` has no repeats. When `ch` was last seen **inside** the window (`last[ch] >= left`), jump `left` just past that earlier occurrence. The window length is `right - left + 1`.
:::

::: lines cd-bfs-order
Order the lines of a **BFS** over a graph given as an adjacency list.

```python
seen = {start}
queue = deque([start])
while queue:
    node = queue.popleft()
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt)
            queue.append(nxt)
```
???
Mark nodes as seen **when you enqueue them**, not when you pop them. Otherwise the same node can be enqueued many times, and on dense graphs that is far more work.
:::

::: blank cd-js-map-counter
problem: valid-anagram
Count characters with a JavaScript `Map`.

```javascript
const counts = new Map();
for (const ch of s) {
  counts.set(ch, ({{counts.get(ch)}} ?? 0) + 1);
}
```
- extra: counts[ch] | counts.has(ch) | ch.count
???
`Map.get` returns `undefined` for a missing key, so `?? 0` supplies the default before adding one. `counts[ch]` would read a plain object property, not a Map entry.
:::

::: blank cd-valid-parens
problem: valid-parentheses
Complete the stack-based bracket matcher.

```python
pairs = {")": "(", "]": "[", "}": "{"}
stack = []
for ch in s:
    if ch in pairs:
        if not stack or {{stack.pop()}} != pairs[ch]:
            return False
    else:
        stack.{{append(ch)}}
return {{not stack}}
```
- extra: stack[0] | stack.pop(0) | len(stack) > 0 | push(ch)
???
Closers must match the **most recent** unmatched opener, which is the top of the stack (`stack.pop()`). At the end, any leftover opener means the string is invalid, so return `not stack`. `stack.pop(0)` would take the *oldest* opener instead.
:::

::: lines cd-kadane-order
problem: maximum-subarray
Order Kadane's algorithm for the maximum subarray sum.

```python
best = cur = nums[0]
for x in nums[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)
return best
```
???
`cur` is the best sum of a subarray **ending here**: extend the previous run or restart at `x`. Update `best` after updating `cur`. Initializing with `nums[0]` (not 0) makes all-negative arrays work.
:::

::: blank cd-heap-topk
problem: kth-largest-element-in-an-array
Keep the k largest values with a **min-heap**.

```python
heap = []
for x in nums:
    heappush(heap, x)
    if len(heap) > {{k}}:
        {{heappop(heap)}}
return {{heap[0]}}
```
- extra: heap[-1] | k - 1 | heap.pop() | max(heap)
???
The heap never holds more than `k` items. Popping the **smallest** whenever it overflows leaves the k largest, and the smallest of those (`heap[0]`, the root of a min-heap) is the k-th largest. `heap.pop()` would remove an arbitrary last element, not the minimum.
:::

::: blank cd-bfs-levels
problem: binary-tree-level-order-traversal
Complete the level-by-level BFS.

```python
queue = deque([root])
while queue:
    level = []
    for _ in range({{len(queue)}}):
        node = queue.{{popleft()}}
        level.append(node.val)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    result.append(level)
```
- extra: len(level) | pop() | len(result)
???
At the start of each round the queue holds exactly one level, so process `len(queue)` nodes (evaluated once, before children are added). `popleft()` makes it FIFO; `pop()` would turn it into a stack (DFS order).
:::

::: blank cd-dfs-grid
problem: number-of-islands
Complete the flood fill that sinks an island.

```python
def sink(r, c):
    if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
        return
    grid[r][c] = {{"0"}}
    sink(r + 1, c)
    sink(r - 1, c)
    sink(r, {{c + 1}})
    sink(r, {{c - 1}})
```
- extra: "1" | r + 1 | c
???
Marking the cell as water **before** recursing stops infinite loops, because neighbours won't revisit it. The four calls cover down, up, right and left.
:::

::: blank cd-js-binary-search
Complete this JavaScript **lower bound**: the first index with `nums[i] >= target`.

```javascript
let lo = 0;
let hi = nums.length;
while ({{lo < hi}}) {
  const mid = (lo + hi) >> 1;
  if (nums[mid] < target) lo = {{mid + 1}};
  else hi = {{mid}};
}
return lo;
```
- extra: lo <= hi | mid - 1 | hi - 1
???
This is the **half-open** convention `[lo, hi)`: the answer could be `nums.length`, so `hi` starts there and the loop runs while `lo < hi`. When `nums[mid] < target`, the answer is to the right of `mid`. Otherwise `mid` itself might be the answer, so keep it with `hi = mid`.
:::

::: lines cd-topo-sort
problem: course-schedule
Order Kahn's algorithm (topological sort by in-degree).

```python
queue = deque(i for i in range(n) if indegree[i] == 0)
taken = 0
while queue:
    node = queue.popleft()
    taken += 1
    for nxt in graph[node]:
        indegree[nxt] -= 1
        if indegree[nxt] == 0:
            queue.append(nxt)
return taken == n
```
???
Start with every course that has no prerequisites. Taking a course removes its outgoing edges; any course whose in-degree drops to zero becomes available. If some courses are never taken, they're stuck in a cycle.
:::

::: blank cd-union-find
problem: redundant-connection
Complete **find** with path compression and the cycle check in **union**.

```python
def find(x):
    while parent[x] != x:
        parent[x] = {{parent[parent[x]]}}
        x = parent[x]
    return x

for a, b in edges:
    ra, rb = find(a), find(b)
    if {{ra == rb}}:
        return [a, b]
    parent[ra] = {{rb}}
```
- extra: parent[x] | a == b | ra | x
???
Path halving (`parent[x] = parent[parent[x]]`) flattens the tree as you walk it. If both endpoints already have the same root, they're already connected, so this edge closes a cycle. Otherwise link one root under the other. Compare **roots**, not the raw nodes `a` and `b`.
:::

::: blank cd-dp-climb
problem: climbing-stairs
Complete the O(1)-space DP for Climbing Stairs.

```python
a, b = 1, 1   # ways to reach step i-1 and step i
for _ in range(n - 1):
    a, b = {{b}}, {{a + b}}
return b
```
- extra: a | a * b | b + 1
???
`ways(i) = ways(i-1) + ways(i-2)`. Tuple assignment evaluates the right side first, so the new `a` is the old `b` and the new `b` is the old `a + b`: Fibonacci, one step at a time.
:::

::: blank cd-coin-change
problem: coin-change
Complete the bottom-up Coin Change DP (fewest coins).

```python
dp = [0] + [inf] * amount
for a in range(1, amount + 1):
    for c in coins:
        if c <= a:
            dp[a] = min(dp[a], {{dp[a - c] + 1}})
return dp[amount] if dp[amount] != {{inf}} else -1
```
- extra: dp[a - 1] + c | dp[c] + 1 | 0
???
To make amount `a` with coin `c` last, you need the best way to make `a - c`, plus this one coin. Amounts that stay at `inf` are unreachable, so return `-1` for them.
:::

::: lines cd-backtrack-subsets
problem: subsets
Order the include/exclude backtracking for Subsets.

```python
def backtrack(i):
    if i == len(nums):
        result.append(path[:])
        return
    path.append(nums[i])
    backtrack(i + 1)
    path.pop()
    backtrack(i + 1)
```
???
At each index, branch twice: **include** `nums[i]` (append, recurse, then undo with `pop`), then **exclude** it (just recurse). Record a **copy** (`path[:]`) at the leaves, because `path` keeps changing.
:::

::: blank cd-two-pointer-sorted
problem: two-sum-ii
Complete the two-pointer pair search on a sorted array.

```python
lo, hi = 0, len(nums) - 1
while lo < hi:
    total = nums[lo] + nums[hi]
    if total == target:
        return [lo, hi]
    if total < target:
        {{lo += 1}}
    else:
        {{hi -= 1}}
```
- extra: lo -= 1 | hi += 1 | lo = hi
???
A sum that's too small can only grow by moving `lo` right; one that's too large can only shrink by moving `hi` left. Each move safely discards one element.
:::

::: blank cd-js-dijkstra
problem: network-delay-time
Complete the relaxation step of Dijkstra (JavaScript, with a min-heap `pq` of `[dist, node]`).

```javascript
while (pq.size) {
  const [d, node] = pq.pop();
  if (d > dist[node]) continue;
  for (const [next, w] of graph[node]) {
    if ({{d + w < dist[next]}}) {
      dist[next] = {{d + w}};
      pq.push([{{dist[next]}}, next]);
    }
  }
}
```
- extra: d < dist[next] | w | dist[node] + 1
???
Pop the closest node and skip **stale** heap entries (`d > dist[node]`). Relaxing an edge means: if going through `node` is shorter than the best known distance to `next`, update it and push the new distance. With non-negative weights, each node's first pop is final.
:::

::: lines cd-merge-intervals
problem: merge-intervals
Order the lines of Merge Intervals.

```python
merged = []
for start, end in sorted(intervals):
    if merged and start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])
return merged
```
???
After sorting by start, an interval overlaps the previous merged block exactly when it starts before that block ends. Extend the end with `max` (the new interval might be fully contained); otherwise start a new block.
:::

::: blank cd-reverse-js
problem: reverse-linked-list
Complete the JavaScript iterative list reversal.

```javascript
let prev = null;
let cur = head;
while (cur) {
  const next = {{cur.next}};
  cur.next = {{prev}};
  prev = {{cur}};
  cur = next;
}
return prev;
```
- extra: prev.next | next | head
???
Save `cur.next` first (you're about to overwrite it), point `cur` backwards at `prev`, then advance both pointers. When `cur` falls off the end, `prev` is the new head.
:::

::: blank cd-sliding-min-window
problem: minimum-window-substring
In Minimum Window Substring, when is the window valid, and what do you do then?

```python
while {{formed == len(need)}}:
    if right - left + 1 < best_len:
        best_len, best_start = right - left + 1, left
    out = s[left]
    have[out] -= 1
    if out in need and have[out] < need[out]:
        formed -= 1
    {{left += 1}}
```
- extra: formed > 0 | right += 1 | left -= 1
???
`formed` counts how many distinct required characters currently meet their required count. When all are satisfied, the window covers `t`, so record it, then **shrink from the left** until it stops being valid. Each pointer only moves forward, so the scan is O(n).
:::

::: blank cd-memo-lru
Add memoization to a recursive Python function with one decorator.

```python
from functools import {{lru_cache}}

@lru_cache(maxsize={{None}})
def ways(i):
    if i <= 1:
        return 1
    return ways(i - 1) + ways(i - 2)
```
- extra: cache_all | 0 | reduce
???
`functools.lru_cache(maxsize=None)` (or `functools.cache` in Python 3.9+) stores results by argument, turning exponential recursion into linear time. `maxsize=0` would disable caching entirely. Arguments must be hashable, so pass tuples rather than lists.
:::

::: lines cd-prefix-sum-count
Order the lines that count subarrays summing to `k` using prefix sums.

```python
count = 0
prefix = 0
seen = Counter({0: 1})
for x in nums:
    prefix += x
    count += seen[prefix - k]
    seen[prefix] += 1
return count
```
???
A subarray ending here sums to `k` when some earlier prefix equals `prefix - k`. Look it up **before** recording the current prefix, so a subarray can't be empty. `seen` starts with `{0: 1}` so subarrays starting at index 0 are counted.
:::

::: blank cd-js-heap-sift
Complete **sift up** for a JavaScript binary min-heap stored in array `a`.

```javascript
let i = a.length - 1;
while (i > 0) {
  const parent = {{(i - 1) >> 1}};
  if (a[parent] <= a[i]) break;
  [a[parent], a[i]] = [a[i], a[parent]];
  i = {{parent}};
}
```
- extra: i >> 1 | 2 * i + 1 | i - 1
???
In a 0-indexed array heap, the parent of `i` is `(i - 1) >> 1` (integer division by 2), and the children of `i` are `2i + 1` and `2i + 2`. Swap upward while the new element is smaller than its parent.
:::

::: blank cd-trie-insert
problem: implement-trie
Complete trie insertion using nested dicts.

```python
node = self.root
for ch in word:
    node = node.{{setdefault(ch, {})}}
node[{{"$"}}] = True
```
- extra: get(ch) | ch | word
???
`setdefault(ch, {})` returns the child, creating it if missing, in one step. The `"$"` key marks the end of a word, so `search("app")` can tell that the word itself was inserted, not just used as a prefix of "apple".
:::
