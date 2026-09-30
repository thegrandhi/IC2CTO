# Validate Binary Search Tree

```meta
difficulty: Medium
topic: Trees
tags: bst, dfs, bounds
lc: 98
signature: isValidBST(root: TreeNode) -> bool
time: O(n)
space: O(h)
```

Determine whether a binary tree is a valid **binary search tree**:

- Every node in a node's left subtree has a value **strictly less** than the node's value.
- Every node in the right subtree has a value **strictly greater**.
- Both subtrees are themselves BSTs.

**Constraints**
- The number of nodes is in `[1, 10^4]`.
- `-2^31 <= Node.val <= 2^31 - 1`

## Hints
- Comparing each node only with its direct children is not enough. Try `[5, 4, 6, null, null, 3, 7]`.
- Each node must lie within an allowed `(low, high)` range inherited from its ancestors.
- Equivalently, an in-order traversal of a BST is strictly increasing.

## Solution
Pass down valid bounds. The root may be anything, `(-∞, ∞)`. Going left tightens the upper bound to the parent's value, and going right tightens the lower bound. A node outside its `(low, high)` range breaks the BST property. Use real infinities rather than 32-bit limits, since the values can equal those limits.

```python
class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        stack = [(root, -inf, inf)]
        while stack:
            node, low, high = stack.pop()
            if not node:
                continue
            if not (low < node.val < high):
                return False
            stack.append((node.left, low, node.val))
            stack.append((node.right, node.val, high))
        return True
```

```javascript
function isValidBST(root) {
  const check = (node, low, high) => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return check(node.left, low, node.val) && check(node.right, node.val, high);
  };
  return check(root, -Infinity, Infinity);
}
```

## Tests
```jsonl
{"in": [[2, 1, 3]], "out": true}
{"in": [[5, 1, 4, null, null, 3, 6]], "out": false, "why": "4 is in the right subtree of 5 but smaller than 5."}
{"in": [[5, 4, 6, null, null, 3, 7]], "out": false, "why": "3 is in the right subtree of 5."}
{"in": [[1]], "out": true}
{"in": [[2, 2, 2]], "out": false}
{"in": [[2147483647]], "out": true}
{"in": [[10, 5, 15, 2, 7, 12, 20, 1, 3, 6, 8]], "out": true}
{"in": [[3, 1, 5, 0, 2, 4, 6, null, null, null, 3]], "out": false}
```
