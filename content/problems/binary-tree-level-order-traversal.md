# Binary Tree Level Order Traversal

```meta
difficulty: Medium
topic: Trees
tags: bfs
lc: 102
signature: levelOrder(root: TreeNode) -> int[][]
time: O(n)
space: O(n)
```

Return the **level order traversal** of a binary tree's values: each level from left to right, one list per level, top to bottom.

**Constraints**
- The number of nodes is in `[0, 2000]`.

## Hints
- Breadth-first search with a queue visits nodes level by level.
- To know where one level ends, process exactly `len(queue)` nodes per round.

## Solution
Run BFS. At the start of each round the queue holds exactly one level. Pop that many nodes, collect their values, and enqueue their children for the next round.

```python
class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        result = []
        queue = deque([root] if root else [])
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            result.append(level)
        return result
```

```javascript
function levelOrder(root) {
  const result = [];
  let level = root ? [root] : [];
  while (level.length) {
    result.push(level.map((n) => n.val));
    level = level.flatMap((n) => [n.left, n.right]).filter(Boolean);
  }
  return result;
}
```

## Tests
```jsonl
{"in": [[3, 9, 20, null, null, 15, 7]], "out": [[3], [9, 20], [15, 7]]}
{"in": [[1]], "out": [[1]]}
{"in": [[]], "out": []}
{"in": [[1, 2, 3, 4, null, null, 5]], "out": [[1], [2, 3], [4, 5]]}
{"in": [[1, 2, null, 3, null, 4]], "out": [[1], [2], [3], [4]]}
{"in": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]], "out": [[1], [2, 3], [4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15]]}
```
