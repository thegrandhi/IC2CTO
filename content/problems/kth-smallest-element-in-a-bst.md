# Kth Smallest Element in a BST

```meta
difficulty: Medium
topic: Trees
tags: bst, inorder
lc: 230
signature: kthSmallest(root: TreeNode, k: int) -> int
time: O(h + k)
space: O(h)
```

Given the root of a binary search tree and an integer `k`, return the `k`-th smallest value (1-indexed) among all node values.

**Constraints**
- The tree has `n` nodes, `1 <= k <= n <= 10^4`.

**Follow-up:** if the BST is modified often and you query k-th smallest frequently, how would you optimize?

## Hints
- In-order traversal of a BST visits values in sorted order.
- Stop as soon as you've visited `k` nodes. An iterative in-order walk with a stack makes early exit easy.

## Solution
Do an iterative in-order traversal: push left children onto a stack, pop a node, count it, then move to its right subtree. The `k`-th popped node is the answer, so only `O(h + k)` nodes are touched. For the follow-up, store each node's subtree size; then you can steer straight to the k-th node in O(h).

```python
class Solution:
    def kthSmallest(self, root: Optional[TreeNode], k: int) -> int:
        stack = []
        node = root
        while True:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            k -= 1
            if k == 0:
                return node.val
            node = node.right
```

```javascript
function kthSmallest(root, k) {
  const stack = [];
  let node = root;
  for (;;) {
    while (node) {
      stack.push(node);
      node = node.left;
    }
    node = stack.pop();
    if (--k === 0) return node.val;
    node = node.right;
  }
}
```

## Tests
```jsonl
{"in": [[3, 1, 4, null, 2], 1], "out": 1}
{"in": [[5, 3, 6, 2, 4, null, null, 1], 3], "out": 3}
{"in": [[1], 1], "out": 1}
{"in": [[2, 1, 3], 3], "out": 3}
{"in": [[10, 5, 15, 2, 7, 12, 20], 4], "out": 10}
{"in": [[10, 5, 15, 2, 7, 12, 20], 7], "out": 20}
```
