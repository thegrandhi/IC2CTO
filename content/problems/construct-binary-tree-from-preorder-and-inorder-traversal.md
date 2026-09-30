# Construct Binary Tree from Preorder and Inorder Traversal

```meta
difficulty: Medium
topic: Trees
tags: recursion, hash map
lc: 105
signature: buildTree(preorder: int[], inorder: int[]) -> TreeNode
time: O(n)
space: O(n)
```

Given the **preorder** and **inorder** traversals of a binary tree with **unique** values, reconstruct the tree and return its root.

**Constraints**
- `1 <= preorder.length <= 3000`
- `inorder.length == preorder.length`; all values are unique.

## Hints
- The first element of the preorder list is the root.
- Find the root in the inorder list: everything to its left forms the left subtree, everything to its right the right subtree.
- A hash map from value to inorder index avoids searching each time.

## Solution
Preorder gives roots in the order you need to create them. Keep a pointer into `preorder`, and recursively build the subtree covering the inorder range `[lo, hi]`. Take the next preorder value as the root, split the inorder range at that value's position (looked up in a map), then build the left range first and the right range second. That's the same order preorder lists them in.

```python
class Solution:
    def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        index = {v: i for i, v in enumerate(inorder)}
        it = iter(preorder)

        def build(lo, hi):
            if lo > hi:
                return None
            val = next(it)
            node = TreeNode(val)
            mid = index[val]
            node.left = build(lo, mid - 1)
            node.right = build(mid + 1, hi)
            return node

        return build(0, len(inorder) - 1)
```

```javascript
function buildTree(preorder, inorder) {
  const index = new Map(inorder.map((v, i) => [v, i]));
  let p = 0;
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const val = preorder[p++];
    const node = new TreeNode(val);
    const mid = index.get(val);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, inorder.length - 1);
}
```

## Tests
```jsonl
{"in": [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], "out": [3, 9, 20, null, null, 15, 7]}
{"in": [[-1], [-1]], "out": [-1]}
{"in": [[1, 2], [2, 1]], "out": [1, 2]}
{"in": [[1, 2], [1, 2]], "out": [1, null, 2]}
{"in": [[1, 2, 4, 5, 3, 6, 7], [4, 2, 5, 1, 6, 3, 7]], "out": [1, 2, 3, 4, 5, 6, 7]}
{"in": [[1, 2, 3, 4], [4, 3, 2, 1]], "out": [1, 2, null, 3, null, 4]}
```
