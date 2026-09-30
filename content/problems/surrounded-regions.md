# Surrounded Regions

```meta
difficulty: Medium
topic: Graphs
tags: grid, border dfs
lc: 130
signature: solve(board: char[][]) -> void
mutates: board
time: O(m · n)
space: O(m · n)
```

Given an `m x n` board of `"X"` and `"O"`, **capture** every region of `"O"` that is completely surrounded by `"X"`: flip all its cells to `"X"`.

A region is a group of 4-directionally connected `"O"` cells. A region that touches the border of the board is **not** surrounded and must stay. Modify `board` in place.

**Constraints**
- `1 <= m, n <= 200`

## Hints
- It's hard to tell directly whether a region is surrounded. Which regions definitely survive?
- Start from every `"O"` on the border and mark everything connected to it as safe. Flip everything else.

## Solution
Flood-fill from each border `"O"`, temporarily marking reachable cells as `"S"` (safe). Then sweep the board: remaining `"O"` cells are surrounded, so flip them to `"X"`, and turn `"S"` back into `"O"`. Each cell is touched a constant number of times.

```python
class Solution:
    def solve(self, board: List[List[str]]) -> None:
        rows, cols = len(board), len(board[0])
        stack = [(r, c) for r in range(rows) for c in (0, cols - 1)]
        stack += [(r, c) for r in (0, rows - 1) for c in range(cols)]
        while stack:
            r, c = stack.pop()
            if 0 <= r < rows and 0 <= c < cols and board[r][c] == "O":
                board[r][c] = "S"
                stack.extend(((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)))
        for r in range(rows):
            for c in range(cols):
                board[r][c] = "O" if board[r][c] == "S" else "X"
```

```javascript
function solve(board) {
  const rows = board.length;
  const cols = board[0].length;
  const mark = (r, c) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== 'O') return;
    board[r][c] = 'S';
    mark(r + 1, c);
    mark(r - 1, c);
    mark(r, c + 1);
    mark(r, c - 1);
  };
  for (let r = 0; r < rows; r++) {
    mark(r, 0);
    mark(r, cols - 1);
  }
  for (let c = 0; c < cols; c++) {
    mark(0, c);
    mark(rows - 1, c);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) board[r][c] = board[r][c] === 'S' ? 'O' : 'X';
  }
}
```

## Tests
```jsonl
{"in": [[["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]]], "out": [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]]}
{"in": [[["X"]]], "out": [["X"]]}
{"in": [[["O", "O"], ["O", "O"]]], "out": [["O", "O"], ["O", "O"]]}
{"in": [[["X", "O", "X"], ["O", "X", "O"], ["X", "O", "X"]]], "out": [["X", "O", "X"], ["O", "X", "O"], ["X", "O", "X"]]}
{"in": [[["X", "X", "X", "X", "X"], ["X", "O", "O", "O", "X"], ["X", "O", "X", "O", "X"], ["X", "O", "O", "O", "X"], ["X", "X", "X", "X", "X"]]], "out": [["X", "X", "X", "X", "X"], ["X", "X", "X", "X", "X"], ["X", "X", "X", "X", "X"], ["X", "X", "X", "X", "X"], ["X", "X", "X", "X", "X"]]}
{"in": [[["O", "X", "X", "O", "X"], ["X", "O", "O", "X", "O"], ["X", "O", "X", "O", "X"], ["O", "X", "O", "O", "O"], ["X", "X", "O", "X", "O"]]], "out": [["O", "X", "X", "O", "X"], ["X", "X", "X", "X", "O"], ["X", "X", "X", "O", "X"], ["O", "X", "O", "O", "O"], ["X", "X", "O", "X", "O"]]}
```
