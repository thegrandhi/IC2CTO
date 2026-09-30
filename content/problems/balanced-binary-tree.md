# Balanced Binary Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs, height
lc: 110
signature: isBalanced(root: TreeNode) -> bool
time: O(n)
space: O(h)
```

A binary tree is **height-balanced** if, at every node, the heights of the left and right subtrees differ by at most one. Return whether the given tree is balanced.

**Constraints**
- The number of nodes is in `[0, 5000]`.

## Hints
- Checking the height difference at every node with a separate height call is O(n²) on skewed trees.
- Compute height bottom-up and signal "unbalanced" with a sentinel such as `-1`.

## Solution
A single post-order pass returns each subtree's height, or `-1` as soon as any subtree is unbalanced. That `-1` propagates straight up, so the whole check is O(n).

```python
class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        def height(node):
            if not node:
                return 0
            left = height(node.left)
            right = height(node.right)
            if left < 0 or right < 0 or abs(left - right) > 1:
                return -1
            return 1 + max(left, right)

        return height(root) >= 0
```

```javascript
function isBalanced(root) {
  const height = (node) => {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    if (left < 0 || right < 0 || Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  };
  return height(root) >= 0;
}
```

## Tests
```jsonl
{"in": [[3, 9, 20, null, null, 15, 7]], "out": true}
{"in": [[1, 2, 2, 3, 3, null, null, 4, 4]], "out": false}
{"in": [[]], "out": true}
{"in": [[1, 2, 2, 3, null, null, 3, 4, null, null, 4]], "out": false}
{"in": [[1, null, 2, null, 3]], "out": false}
{"in": [[1, 2, 3, 4, 5, 6, null, 8]], "out": true}
```
