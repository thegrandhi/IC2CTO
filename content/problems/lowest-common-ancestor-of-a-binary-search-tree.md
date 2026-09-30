# Lowest Common Ancestor of a BST

```meta
difficulty: Medium
topic: Trees
tags: bst
lc: 235
signature: lowestCommonAncestor(root: TreeNode, p: TreeNodeRef, q: TreeNodeRef) -> TreeNodeRef
time: O(h)
space: O(1)
```

Given a **binary search tree** and two of its nodes `p` and `q`, return their **lowest common ancestor**: the deepest node that has both `p` and `q` as descendants. A node counts as a descendant of itself.

In the tests, `p` and `q` are given by value, and the answer is shown as the ancestor's value. Your function receives and returns actual nodes.

**Constraints**
- `2` to `10^5` nodes with unique values; `p` and `q` both exist and differ.

## Hints
- In a BST, if both values are smaller than the current node, where must their common ancestor be?
- The LCA is the first node where `p` and `q` split into different sides, or where the node equals one of them.

## Solution
Start at the root. If both `p` and `q` are smaller, the LCA is in the left subtree. If both are larger, it's in the right subtree. Otherwise they split here (or one of them *is* this node), so this node is the LCA. That's one walk down, O(h), with no extra space.

```python
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        node = root
        while node:
            if p.val < node.val and q.val < node.val:
                node = node.left
            elif p.val > node.val and q.val > node.val:
                node = node.right
            else:
                return node
        return None
```

```javascript
function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p.val < node.val && q.val < node.val) node = node.left;
    else if (p.val > node.val && q.val > node.val) node = node.right;
    else return node;
  }
  return null;
}
```

## Tests
```jsonl
{"in": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], "out": 6}
{"in": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], "out": 2, "why": "A node is a descendant of itself."}
{"in": [[2, 1], 2, 1], "out": 2}
{"in": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], "out": 4}
{"in": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 0, 5], "out": 2}
{"in": [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 7, 9], "out": 8}
{"in": [[5, 3, 6, 2, 4, null, null, 1], 1, 4], "out": 3}
```
