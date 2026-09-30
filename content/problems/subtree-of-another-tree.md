# Subtree of Another Tree

```meta
difficulty: Easy
topic: Trees
tags: dfs, tree comparison
lc: 572
signature: isSubtree(root: TreeNode, subRoot: TreeNode) -> bool
time: O(m · n)
space: O(h)
```

Given two binary trees `root` and `subRoot`, return `true` if `root` contains a subtree with **exactly** the same structure and values as `subRoot`.

A subtree consists of a node and **all** of its descendants.

**Constraints**
- `root` has `1` to `2000` nodes; `subRoot` has `1` to `1000` nodes.

## Hints
- Reuse "Same Tree": is `subRoot` the same as the tree rooted at *some* node of `root`?
- Try every node of `root` as a candidate starting point.

## Solution
For each node in `root`, check whether the tree starting there is identical to `subRoot`, using the Same Tree check. That's O(m·n) in the worst case. For linear time, serialize both trees with null markers and run a substring search such as KMP. Delimiters matter there, so that `2` doesn't match inside `12`.

```python
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def same(a, b):
            if not a or not b:
                return a is b
            return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

        stack = [root]
        while stack:
            node = stack.pop()
            if node:
                if same(node, subRoot):
                    return True
                stack.extend((node.left, node.right))
        return False
```

```javascript
function isSubtree(root, subRoot) {
  const same = (a, b) => {
    if (!a || !b) return a === b;
    return a.val === b.val && same(a.left, b.left) && same(a.right, b.right);
  };
  if (!root) return false;
  return same(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
```

## Tests
```jsonl
{"in": [[3, 4, 5, 1, 2], [4, 1, 2]], "out": true}
{"in": [[3, 4, 5, 1, 2, null, null, null, null, 0], [4, 1, 2]], "out": false, "why": "The node 4 in root has an extra descendant 0."}
{"in": [[1], [1]], "out": true}
{"in": [[1, 1], [1]], "out": true}
{"in": [[12], [2]], "out": false}
{"in": [[1, 2, 3], [2, 3]], "out": false}
{"in": [[3, 4, 5, 1, 2, 4, null, null, null, null, null, 1, 2], [4, 1, 2]], "out": true}
```
