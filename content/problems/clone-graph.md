# Clone Graph

```meta
difficulty: Medium
topic: Graphs
tags: hash map, dfs, bfs
lc: 133
signature: cloneGraph(node: GraphNode) -> GraphNode
time: O(V + E)
space: O(V)
```

Given a reference to a node in a **connected undirected graph**, return a **deep copy** of the graph. Each node has a `val` and a list of `neighbors`.

In the tests, the graph is an adjacency list: node `i` (1-indexed) has value `i`, and `adj[i-1]` lists its neighbours. The given node is node 1. Returning any original node instead of a copy fails the test.

**Constraints**
- `0` to `100` nodes; values are unique; no self-loops or repeated edges.

## Hints
- Graphs can have cycles, so you need to remember which nodes you've already copied.
- Keep a map `original → clone`. Create a clone the first time you see a node, and look it up after that.

## Solution
DFS or BFS with a hash map from original nodes to their clones. When visiting a node, create its clone if needed, then for each neighbour, ensure a clone exists and link it into the current clone's `neighbors`. The map both prevents infinite loops on cycles and ensures each node is copied exactly once.

```python
class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        if not node:
            return None
        clones = {node: Node(node.val)}
        queue = deque([node])
        while queue:
            cur = queue.popleft()
            for nb in cur.neighbors:
                if nb not in clones:
                    clones[nb] = Node(nb.val)
                    queue.append(nb)
                clones[cur].neighbors.append(clones[nb])
        return clones[node]
```

```javascript
function cloneGraph(node) {
  const clones = new Map();
  const dfs = (n) => {
    if (!n) return null;
    if (clones.has(n)) return clones.get(n);
    const copy = new Node(n.val);
    clones.set(n, copy);
    for (const nb of n.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  };
  return dfs(node);
}
```

## Tests
```jsonl
{"in": [[[2, 4], [1, 3], [2, 4], [1, 3]]], "out": [[2, 4], [1, 3], [2, 4], [1, 3]]}
{"in": [[[]]], "out": [[]]}
{"in": [[]], "out": []}
{"in": [[[2], [1]]], "out": [[2], [1]]}
{"in": [[[2, 3], [1, 3], [1, 2]]], "out": [[2, 3], [1, 3], [1, 2]]}
{"in": [[[2, 3, 4], [1], [1], [1, 5], [4]]], "out": [[2, 3, 4], [1], [1], [1, 5], [4]]}
```
