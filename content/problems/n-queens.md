# N-Queens

```meta
difficulty: Hard
topic: Backtracking
tags: constraint search
lc: 51
signature: solveNQueens(n: int) -> string[][]
compare: unordered
time: O(n!)
space: O(n)
```

Place `n` queens on an `n x n` chessboard so that no two queens attack each other: no two may share a row, column or diagonal.

Return **all** distinct solutions, in any order. Each solution is a list of `n` strings, one per row, where `Q` is a queen and `.` an empty square.

**Constraints**
- `1 <= n <= 9`

## Hints
- Each row holds exactly one queen, so place them row by row.
- A square `(r, c)` is attacked if its column, its `r - c` diagonal, or its `r + c` anti-diagonal already has a queen. Keep three sets.

## Solution
Backtrack row by row. For each column `c` in row `r`, skip it if `c`, `r - c` or `r + c` is already in use. Otherwise place a queen, add to the three sets, recurse to the next row, then remove it. When `r == n`, render the board. The set checks make each placement O(1), and pruning keeps the search far below n^n.

```python
class Solution:
    def solveNQueens(self, n: int) -> List[List[str]]:
        cols, diag, anti = set(), set(), set()
        queens = []
        result = []

        def backtrack(r):
            if r == n:
                result.append(["." * c + "Q" + "." * (n - c - 1) for c in queens])
                return
            for c in range(n):
                if c in cols or r - c in diag or r + c in anti:
                    continue
                cols.add(c)
                diag.add(r - c)
                anti.add(r + c)
                queens.append(c)
                backtrack(r + 1)
                queens.pop()
                cols.remove(c)
                diag.remove(r - c)
                anti.remove(r + c)

        backtrack(0)
        return result
```

```javascript
function solveNQueens(n) {
  const cols = new Set();
  const diag = new Set();
  const anti = new Set();
  const queens = [];
  const result = [];
  const backtrack = (r) => {
    if (r === n) {
      result.push(queens.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
      cols.add(c);
      diag.add(r - c);
      anti.add(r + c);
      queens.push(c);
      backtrack(r + 1);
      queens.pop();
      cols.delete(c);
      diag.delete(r - c);
      anti.delete(r + c);
    }
  };
  backtrack(0);
  return result;
}
```

## Tests
```jsonl
{"in": [4], "out": [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]}
{"in": [1], "out": [["Q"]]}
{"in": [2], "out": []}
{"in": [3], "out": []}
{"in": [5], "out": [["Q....", "..Q..", "....Q", ".Q...", "...Q."], ["Q....", "...Q.", ".Q...", "....Q", "..Q.."], [".Q...", "...Q.", "Q....", "..Q..", "....Q"], [".Q...", "....Q", "..Q..", "Q....", "...Q."], ["..Q..", "Q....", "...Q.", ".Q...", "....Q"], ["..Q..", "....Q", ".Q...", "...Q.", "Q...."], ["...Q.", "Q....", "..Q..", "....Q", ".Q..."], ["...Q.", ".Q...", "....Q", "..Q..", "Q...."], ["....Q", ".Q...", "...Q.", "Q....", "..Q.."], ["....Q", "..Q..", "Q....", "...Q.", ".Q..."]]}
{"in": [6], "out": [[".Q....", "...Q..", ".....Q", "Q.....", "..Q...", "....Q."], ["..Q...", ".....Q", ".Q....", "....Q.", "Q.....", "...Q.."], ["...Q..", "Q.....", "....Q.", ".Q....", ".....Q", "..Q..."], ["....Q.", "..Q...", "Q.....", ".....Q", "...Q..", ".Q...."]]}
```
