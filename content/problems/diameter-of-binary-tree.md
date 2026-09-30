# Diameter of Binary Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs, height
lc: 543
signature: diameterOfBinaryTree(root: TreeNode) -> int
time: O(n)
space: O(h)
```

Return the **diameter** of a binary tree: the number of **edges** on the longest path between any two nodes. The path may or may not pass through the root.

**Constraints**
- The number of nodes is in `[1, 10^4]`.

## Hints
- The longest path through a node goes down its left subtree and down its right subtree: `height(left) + height(right)`.
- Compute heights bottom-up and track the best `left + right` seen at any node.

## Solution
One post-order DFS returns each subtree's height (in nodes). At every node, the longest path that bends there has `leftHeight + rightHeight` edges. Record the maximum, then return `1 + max(leftHeight, rightHeight)` to the parent. Each node is visited once.

```python
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        best = 0

        def height(node):
            nonlocal best
            if not node:
                return 0
            left, right = height(node.left), height(node.right)
            best = max(best, left + right)
            return 1 + max(left, right)

        height(root)
        return best
```

```javascript
function diameterOfBinaryTree(root) {
  let best = 0;
  const height = (node) => {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };
  height(root);
  return best;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4, 5]], "out": 3, "why": "The path 4 → 2 → 1 → 3 has 3 edges."}
{"in": [[1, 2]], "out": 1}
{"in": [[1]], "out": 0}
{"in": [[1, 2, null, 3, 4, 5, null, null, 6, 7, null, null, 8]], "out": 6}
{"in": [[4, 2, 7, 1, 3, 6, 9]], "out": 4}
{"in": [[1, null, 2, null, 3, null, 4]], "out": 3}
```
