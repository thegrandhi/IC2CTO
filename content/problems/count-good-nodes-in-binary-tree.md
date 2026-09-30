# Count Good Nodes in Binary Tree

```meta
difficulty: Medium
topic: Trees
tags: dfs, path state
lc: 1448
signature: goodNodes(root: TreeNode) -> int
time: O(n)
space: O(h)
```

A node `X` is **good** if no node on the path from the root to `X` has a value greater than `X`. Return the number of good nodes in the tree. The root is always good.

**Constraints**
- The number of nodes is in `[1, 10^5]`.

## Hints
- What do you need to know about the path above a node? Just its maximum value.
- Pass the running maximum down in your DFS.

## Solution
DFS while carrying `pathMax`, the largest value from the root down to the current node's parent. The node is good when `node.val >= pathMax`. Pass `max(pathMax, node.val)` to the children. An explicit stack avoids recursion depth limits on skewed trees.

```python
class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        count = 0
        stack = [(root, root.val)]
        while stack:
            node, path_max = stack.pop()
            if node.val >= path_max:
                count += 1
            path_max = max(path_max, node.val)
            for child in (node.left, node.right):
                if child:
                    stack.append((child, path_max))
        return count
```

```javascript
function goodNodes(root) {
  const dfs = (node, pathMax) => {
    if (!node) return 0;
    const good = node.val >= pathMax ? 1 : 0;
    const next = Math.max(pathMax, node.val);
    return good + dfs(node.left, next) + dfs(node.right, next);
  };
  return dfs(root, root.val);
}
```

## Tests
```jsonl
{"in": [[3, 1, 4, 3, null, 1, 5]], "out": 4}
{"in": [[3, 3, null, 4, 2]], "out": 3}
{"in": [[1]], "out": 1}
{"in": [[9, null, 3, 6]], "out": 1}
{"in": [[2, null, 4, 10, 8, null, null, 4]], "out": 4}
{"in": [[-1, 5, -2, 4, 4, 2, -2, null, null, -4, null, -2, 3, null, -2, 0, null, -1, null, -3, null, -4, -3, 3, null, null, null, null, null, null, null, 3, -3]], "out": 5}
```
