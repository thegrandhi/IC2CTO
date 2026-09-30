# Course Schedule

```meta
difficulty: Medium
topic: Graphs
tags: topological sort, cycle detection
lc: 207
signature: canFinish(numCourses: int, prerequisites: int[][]) -> bool
time: O(V + E)
space: O(V + E)
```

There are `numCourses` courses labeled `0` to `numCourses - 1`. Each pair `[a, b]` in `prerequisites` means you must take course `b` before course `a`.

Return `true` if you can finish all courses, meaning the prerequisites contain no cycle.

**Constraints**
- `1 <= numCourses <= 2000`; `0 <= prerequisites.length <= 5000`; all pairs are unique.

## Hints
- Model courses as nodes and prerequisites as directed edges `b → a`. When is finishing impossible?
- **Kahn's algorithm:** repeatedly take a course with no remaining prerequisites (in-degree 0). If you can take them all, there's no cycle.

## Solution
Build the graph and in-degree counts. Start a queue with every course that has in-degree 0. Pop a course, count it as taken, and decrement its dependents' in-degrees, enqueuing any that reach 0. If the number taken equals `numCourses`, the graph is acyclic. Any course in a cycle never reaches in-degree 0. DFS with three colours (unvisited / in progress / done) also detects cycles.

```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        graph = [[] for _ in range(numCourses)]
        indegree = [0] * numCourses
        for course, pre in prerequisites:
            graph[pre].append(course)
            indegree[course] += 1
        queue = deque(i for i in range(numCourses) if indegree[i] == 0)
        taken = 0
        while queue:
            node = queue.popleft()
            taken += 1
            for nxt in graph[node]:
                indegree[nxt] -= 1
                if indegree[nxt] == 0:
                    queue.append(nxt)
        return taken == numCourses
```

```javascript
function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [course, pre] of prerequisites) graph[pre].push(course);
  const state = new Array(numCourses).fill(0); // 0 new, 1 visiting, 2 done
  const hasCycle = (node) => {
    if (state[node] === 1) return true;
    if (state[node] === 2) return false;
    state[node] = 1;
    for (const nxt of graph[node]) if (hasCycle(nxt)) return true;
    state[node] = 2;
    return false;
  };
  for (let i = 0; i < numCourses; i++) if (hasCycle(i)) return false;
  return true;
}
```

## Tests
```jsonl
{"in": [2, [[1, 0]]], "out": true}
{"in": [2, [[1, 0], [0, 1]]], "out": false}
{"in": [1, []], "out": true}
{"in": [3, [[1, 0], [2, 1], [0, 2]]], "out": false}
{"in": [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], "out": true}
{"in": [5, [[1, 4], [2, 4], [3, 1], [3, 2]]], "out": true}
{"in": [3, [[0, 1], [0, 2], [1, 2], [2, 2]]], "out": false}
```
