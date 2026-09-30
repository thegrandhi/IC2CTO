# Binary Tree Maximum Path Sum

```meta
difficulty: Hard
topic: Trees
tags: dfs, tree dp
lc: 124
signature: maxPathSum(root: TreeNode) -> int
time: O(n)
space: O(h)
```

A **path** in a binary tree is a sequence of nodes where each adjacent pair is connected by an edge, and no node appears twice. The path doesn't need to pass through the root. Its **sum** is the total of its node values.

Return the maximum path sum over all non-empty paths.

**Constraints**
- The number of nodes is in `[1, 3 * 10^4]`.
- `-1000 <= Node.val <= 1000`

## Hints
- Every path has a highest node where it "bends". At that node, the path is `left branch + node + right branch`.
- A parent can only extend **one** branch of a child's path downward. Return that single best branch.
- A branch with a negative sum is never worth taking. Use `max(0, branch)`.

## Solution
Post-order DFS returns the best **downward** path sum starting at each node: `node.val + max(0, leftGain, rightGain)`. While visiting a node, also consider the path that bends there, `node.val + max(0, leftGain) + max(0, rightGain)`, and update the global best. Initialize the best to `-∞`, since all values may be negative.

```python
class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        best = -inf

        def gain(node):
            nonlocal best
            if not node:
                return 0
            left = max(0, gain(node.left))
            right = max(0, gain(node.right))
            best = max(best, node.val + left + right)
            return node.val + max(left, right)

        gain(root)
        return best
```

```javascript
function maxPathSum(root) {
  let best = -Infinity;
  const gain = (node) => {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  };
  gain(root);
  return best;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3]], "out": 6}
{"in": [[-10, 9, 20, null, null, 15, 7]], "out": 42, "why": "15 → 20 → 7 sums to 42."}
{"in": [[-3]], "out": -3}
{"in": [[2, -1]], "out": 2}
{"in": [[-2, -1]], "out": -1}
{"in": [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], "out": 48}
{"in": [[1, -2, -3, 1, 3, -2, null, -1]], "out": 3}
```
