# Rotting Oranges

```meta
difficulty: Medium
topic: Graphs
tags: multi-source bfs, grid
lc: 994
signature: orangesRotting(grid: int[][]) -> int
time: O(m · n)
space: O(m · n)
```

In a grid, `0` is an empty cell, `1` a fresh orange and `2` a rotten orange. Every minute, each fresh orange next to (4-directionally) a rotten orange becomes rotten.

Return the minimum number of minutes until no fresh orange remains, or `-1` if that never happens.

**Constraints**
- `1 <= m, n <= 10`

## Hints
- All rotten oranges spread at the same time. That's a BFS with **many starting points**.
- Process the queue minute by minute (level by level) and count the fresh oranges left.

## Solution
**Multi-source BFS.** Put every rotten orange in the queue and count the fresh ones. Each BFS level is one minute: rot the fresh neighbours of the current layer and enqueue them. When the queue empties, return the minutes elapsed if no fresh oranges remain, otherwise `-1` (some orange was unreachable).

```python
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        queue = deque()
        fresh = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c))
                elif grid[r][c] == 1:
                    fresh += 1
        minutes = 0
        while queue and fresh:
            minutes += 1
            for _ in range(len(queue)):
                r, c = queue.popleft()
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 2
                        fresh -= 1
                        queue.append((nr, nc))
        return minutes if fresh == 0 else -1
```

```javascript
function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let layer = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) layer.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  while (layer.length && fresh) {
    minutes++;
    const next = [];
    for (const [r, c] of layer) {
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 1) {
          grid[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
        }
      }
    }
    layer = next;
  }
  return fresh === 0 ? minutes : -1;
}
```

## Tests
```jsonl
{"in": [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], "out": 4}
{"in": [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], "out": -1, "why": "The orange in the bottom-left corner is never reached."}
{"in": [[[0, 2]]], "out": 0}
{"in": [[[0]]], "out": 0}
{"in": [[[1]]], "out": -1}
{"in": [[[2, 2], [1, 1], [0, 0], [2, 0]]], "out": 1}
{"in": [[[2, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 2]]], "out": 3}
```
