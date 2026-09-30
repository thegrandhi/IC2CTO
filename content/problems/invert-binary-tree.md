# Invert Binary Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs, bfs
lc: 226
signature: invertTree(root: TreeNode) -> TreeNode
time: O(n)
space: O(h)
```

Given the `root` of a binary tree, mirror it: swap the left and right child of **every** node. Return the root.

Trees are written in level order, with `null` marking a missing child.

**Constraints**
- The number of nodes is in the range `[0, 100]`.
- `-100 <= Node.val <= 100`

## Hints
- What does inverting a tree mean for its root? For its two subtrees?
- Swap the children at the current node, then recurse into both.

## Solution
Inverting a tree means swapping the root's two children and inverting each subtree, so the recursion falls straight out of the definition. A BFS or explicit stack that swaps the children of every visited node works just as well.

```python
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root:
            root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
```

```javascript
function invertTree(root) {
  if (root) {
    [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  }
  return root;
}
```

## Tests
```jsonl
{"in": [[4, 2, 7, 1, 3, 6, 9]], "out": [4, 7, 2, 9, 6, 3, 1]}
{"in": [[2, 1, 3]], "out": [2, 3, 1]}
{"in": [[]], "out": []}
{"in": [[1, 2]], "out": [1, null, 2]}
{"in": [[1, null, 2, null, 3]], "out": [1, 2, null, 3]}
{"in": [[5, 3, 8, 1, 4, 7, 9, null, 2]], "out": [5, 8, 3, 9, 7, 4, 1, null, null, null, null, null, null, 2]}
```
