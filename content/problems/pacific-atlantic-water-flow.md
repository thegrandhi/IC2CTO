# Pacific Atlantic Water Flow

```meta
difficulty: Medium
topic: Graphs
tags: reverse bfs, grid
lc: 417
signature: pacificAtlantic(heights: int[][]) -> int[][]
compare: unordered
time: O(m · n)
space: O(m · n)
```

An `m x n` island's heights are given as a matrix. The **Pacific** ocean touches the top and left edges; the **Atlantic** touches the bottom and right edges. Rain flows from a cell to a 4-directional neighbour whose height is **less than or equal to** its own, and flows off the island into any ocean the cell borders.

Return the coordinates `[r, c]` of every cell from which water can reach **both** oceans, in any order.

**Constraints**
- `1 <= m, n <= 200`; `0 <= heights[r][c] <= 10^5`

## Hints
- Checking each cell by simulating the flow is expensive.
- Reverse the flow: start **from each ocean's border** and climb to neighbours that are at least as high. Those cells can drain into that ocean.
- The answer is the intersection of the two reachable sets.

## Solution
Run a BFS/DFS from all Pacific-border cells, moving only to neighbours with height `>=` the current one (water flows downhill, so the search climbs uphill). Do the same from the Atlantic border. Cells reached by both searches can drain into both oceans. Each search visits every cell at most once.

```python
class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        rows, cols = len(heights), len(heights[0])

        def reach(starts):
            seen = set(starts)
            stack = list(starts)
            while stack:
                r, c = stack.pop()
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if (0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen
                            and heights[nr][nc] >= heights[r][c]):
                        seen.add((nr, nc))
                        stack.append((nr, nc))
            return seen

        pacific = reach([(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)])
        atlantic = reach([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)])
        return [[r, c] for r, c in pacific & atlantic]
```

```javascript
function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = heights[0].length;
  const reach = (starts) => {
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const stack = [...starts];
    for (const [r, c] of starts) seen[r][c] = true;
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && !seen[nr][nc] && heights[nr][nc] >= heights[r][c]) {
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }
    return seen;
  };
  const pac = [];
  const atl = [];
  for (let c = 0; c < cols; c++) {
    pac.push([0, c]);
    atl.push([rows - 1, c]);
  }
  for (let r = 0; r < rows; r++) {
    pac.push([r, 0]);
    atl.push([r, cols - 1]);
  }
  const p = reach(pac);
  const a = reach(atl);
  const result = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (p[r][c] && a[r][c]) result.push([r, c]);
  return result;
}
```

## Tests
```jsonl
{"in": [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]], "out": [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]}
{"in": [[[1]]], "out": [[0, 0]]}
{"in": [[[1, 1], [1, 1]]], "out": [[1, 0], [0, 1], [1, 1], [0, 0]]}
{"in": [[[3, 3, 3], [3, 1, 3], [0, 2, 4]]], "out": [[0, 1], [1, 2], [2, 1], [0, 0], [2, 0], [0, 2], [2, 2], [1, 0]]}
{"in": [[[10, 10, 10], [10, 1, 10], [10, 10, 10]]], "out": [[0, 1], [1, 2], [2, 1], [0, 0], [2, 0], [0, 2], [2, 2], [1, 0]]}
{"in": [[[1, 2, 3], [8, 9, 4], [7, 6, 5]]], "out": [[1, 2], [2, 1], [1, 1], [2, 0], [0, 2], [2, 2], [1, 0]]}
```
