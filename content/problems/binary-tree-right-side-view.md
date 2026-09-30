# Binary Tree Right Side View

```meta
difficulty: Medium
topic: Trees
tags: bfs, dfs
lc: 199
signature: rightSideView(root: TreeNode) -> int[]
time: O(n)
space: O(n)
```

Imagine standing on the **right side** of a binary tree. Return the values of the nodes you can see, ordered from top to bottom.

**Constraints**
- The number of nodes is in `[0, 100]`.

## Hints
- You see exactly one node per level. Which one?
- BFS level by level and take the last node of each level. Or DFS visiting right before left, recording the first node seen at each new depth.

## Solution
Level-order traversal: the visible node on each level is the **rightmost** one. With a right-first DFS, the first node reached at each depth is the visible one, and that version needs only O(h) extra space besides the output.

```python
class Solution:
    def rightSideView(self, root: Optional[TreeNode]) -> List[int]:
        view = []

        def dfs(node, depth):
            if not node:
                return
            if depth == len(view):
                view.append(node.val)
            dfs(node.right, depth + 1)
            dfs(node.left, depth + 1)

        dfs(root, 0)
        return view
```

```javascript
function rightSideView(root) {
  const view = [];
  let level = root ? [root] : [];
  while (level.length) {
    view.push(level[level.length - 1].val);
    level = level.flatMap((n) => [n.left, n.right]).filter(Boolean);
  }
  return view;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, null, 5, null, 4]], "out": [1, 3, 4]}
{"in": [[1, 2, 3, 4, null, null, null, 5]], "out": [1, 3, 4, 5], "why": "Node 5 hangs deep on the left, but nothing blocks it."}
{"in": [[1, null, 3]], "out": [1, 3]}
{"in": [[]], "out": []}
{"in": [[1, 2]], "out": [1, 2]}
{"in": [[1, 2, 3, 4, 5, 6, 7]], "out": [1, 3, 7]}
```
