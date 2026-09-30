# Maximum Depth of Binary Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs, bfs
lc: 104
signature: maxDepth(root: TreeNode) -> int
time: O(n)
space: O(h)
```

Return the **maximum depth** of a binary tree: the number of nodes on the longest path from the root down to a leaf. An empty tree has depth 0.

**Constraints**
- The number of nodes is in `[0, 10^4]`.

## Hints
- The depth of a tree is 1 plus the depth of its deeper subtree.
- Alternatively, BFS level by level and count the levels.

## Solution
Recursively, `depth(node) = 1 + max(depth(left), depth(right))` with `depth(None) = 0`. An iterative BFS that counts levels avoids recursion limits on very deep (skewed) trees.

```python
class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        depth = 0
        level = [root] if root else []
        while level:
            depth += 1
            level = [c for n in level for c in (n.left, n.right) if c]
        return depth
```

```javascript
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

## Tests
```jsonl
{"in": [[3, 9, 20, null, null, 15, 7]], "out": 3}
{"in": [[1, null, 2]], "out": 2}
{"in": [[]], "out": 0}
{"in": [[0]], "out": 1}
{"in": [[1, 2, 3, 4, null, null, 5, 6]], "out": 4}
{"in": [[1, 2, null, 3, null, 4, null, 5]], "out": 5}
```
