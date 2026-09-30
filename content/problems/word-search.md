# Word Search

```meta
difficulty: Medium
topic: Backtracking
tags: grid, dfs
lc: 79
signature: exist(board: char[][], word: string) -> bool
time: O(m · n · 4^L)
space: O(L) recursion
```

Given an `m x n` grid of letters and a string `word`, return `true` if `word` can be traced through **sequentially adjacent** cells (horizontally or vertically). The same cell may not be used twice.

**Constraints**
- `1 <= m, n <= 6`; `1 <= word.length <= 15`

**Follow-up:** how would you prune the search on large boards?

## Hints
- Try every cell as a starting point and DFS from it, matching one character per step.
- Mark a cell as used while it's on the current path, then restore it when you backtrack.

## Solution
From each cell, DFS with index `k`. The cell must equal `word[k]`. Mark it visited by temporarily overwriting it, recurse into the four neighbours with `k + 1`, then restore it. Reaching `k == len(word)` means success. One cheap pruning step: if the board doesn't contain enough of each letter the word needs, return early.

```python
class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        rows, cols = len(board), len(board[0])
        need = Counter(word)
        have = Counter(ch for row in board for ch in row)
        if any(have[ch] < cnt for ch, cnt in need.items()):
            return False

        def dfs(r, c, k):
            if k == len(word):
                return True
            if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[k]:
                return False
            ch, board[r][c] = board[r][c], "#"
            found = dfs(r + 1, c, k + 1) or dfs(r - 1, c, k + 1) or dfs(r, c + 1, k + 1) or dfs(r, c - 1, k + 1)
            board[r][c] = ch
            return found

        return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```

```javascript
function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const dfs = (r, c, k) => {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[k]) return false;
    const ch = board[r][c];
    board[r][c] = '#';
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = ch;
    return found;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  return false;
}
```

## Tests
```jsonl
{"in": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED"], "out": true}
{"in": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE"], "out": true}
{"in": [[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB"], "out": false, "why": "The B cell can't be used twice."}
{"in": [[["a"]], "a"], "out": true}
{"in": [[["a", "b"], ["c", "d"]], "abdc"], "out": true}
{"in": [[["a", "b"], ["c", "d"]], "abcd"], "out": false}
{"in": [[["C", "A", "A"], ["A", "A", "A"], ["B", "C", "D"]], "AAB"], "out": true}
{"in": [[["a", "a", "a"], ["a", "a", "a"]], "aaaaaaa"], "out": false}
```
