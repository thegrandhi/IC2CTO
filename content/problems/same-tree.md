# Same Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs
lc: 100
signature: isSameTree(p: TreeNode, q: TreeNode) -> bool
time: O(n)
space: O(h)
```

Given the roots of two binary trees `p` and `q`, return `true` if they are **identical**: the same shape, with equal values in corresponding nodes.

**Constraints**
- Each tree has `0` to `100` nodes.

## Hints
- Two trees are the same if their roots match and their left subtrees are the same and their right subtrees are the same.
- Handle the base cases first: both empty, or exactly one empty.

## Solution
Recurse on both trees together. Two empty trees are equal. If exactly one is empty, or the values differ, they aren't. Otherwise both subtree pairs must be equal.

```python
class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if not p or not q:
            return p is q
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)
```

```javascript
function isSameTree(p, q) {
  if (!p || !q) return p === q;
  return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

## Tests
```jsonl
{"in": [[1, 2, 3], [1, 2, 3]], "out": true}
{"in": [[1, 2], [1, null, 2]], "out": false}
{"in": [[1, 2, 1], [1, 1, 2]], "out": false}
{"in": [[], []], "out": true}
{"in": [[1], []], "out": false}
{"in": [[5, 4, 8, 11, null, 13, 4], [5, 4, 8, 11, null, 13, 4]], "out": true}
{"in": [[5, 4, 8, 11, null, 13, 4], [5, 4, 8, 11, null, 13, 5]], "out": false}
```
