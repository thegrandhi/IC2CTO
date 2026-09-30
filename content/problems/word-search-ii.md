# Word Search II

```meta
difficulty: Hard
topic: Tries
tags: trie, backtracking, grid
lc: 212
signature: findWords(board: char[][], words: string[]) -> string[]
compare: unordered
time: O(cells · 4 · 3^(L-1))
space: O(total word length)
```

Given an `m x n` grid of letters and a list of `words`, return every word that can be traced on the board, in any order.

A word is traced through **adjacent** cells (up, down, left, right). The same cell may not be used twice in one word.

**Constraints**
- `1 <= m, n <= 12`
- `1 <= words.length <= 3 * 10^4`; `1 <= words[i].length <= 10`; words are unique.

## Hints
- Running Word Search once per word repeats a lot of work.
- Put all the words in a **trie**. Then one DFS from each cell can follow the trie and find every word at once.
- Prune: once a word is found, clear its end marker, and delete trie branches that are exhausted.

## Solution
Build a trie of all words, storing the complete word at its end node. From every cell, DFS while following the trie: step into a neighbouring cell only if its letter is a child of the current trie node. Mark cells as visited during the DFS, and unmark them when backtracking. When you reach a node holding a word, record it and clear it so it isn't reported twice. Removing leaf nodes after use keeps later searches from revisiting dead branches.

```python
class Solution:
    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:
        root = {}
        for w in words:
            node = root
            for ch in w:
                node = node.setdefault(ch, {})
            node["$"] = w
        rows, cols = len(board), len(board[0])
        found = []

        def dfs(r, c, parent):
            ch = board[r][c]
            node = parent[ch]
            if "$" in node:
                found.append(node.pop("$"))
            board[r][c] = "#"
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] in node:
                    dfs(nr, nc, node)
            board[r][c] = ch
            if not node:
                parent.pop(ch)

        for r in range(rows):
            for c in range(cols):
                if board[r][c] in root:
                    dfs(r, c, root)
        return found
```

```javascript
function findWords(board, words) {
  const root = {};
  for (const w of words) {
    let node = root;
    for (const ch of w) node = node[ch] ??= {};
    node.$ = w;
  }
  const rows = board.length;
  const cols = board[0].length;
  const found = [];
  const dfs = (r, c, parent) => {
    const ch = board[r][c];
    const node = parent[ch];
    if (node.$ !== undefined) {
      found.push(node.$);
      delete node.$;
    }
    board[r][c] = '#';
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && node[board[nr][nc]]) dfs(nr, nc, node);
    }
    board[r][c] = ch;
    if (Object.keys(node).length === 0) delete parent[ch];
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (root[board[r][c]]) dfs(r, c, root);
    }
  }
  return found;
}
```

## Tests
```jsonl
{"in": [[["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], ["oath", "pea", "eat", "rain"]], "out": ["eat", "oath"]}
{"in": [[["a", "b"], ["c", "d"]], ["abcb"]], "out": []}
{"in": [[["a"]], ["a", "b"]], "out": ["a"]}
{"in": [[["a", "b"], ["c", "d"]], ["ab", "cb", "ad", "bd", "ac", "ca", "da", "bc", "db", "adcb", "dabc", "abb", "acb"]], "out": ["ac", "ab", "bd", "ca", "db"]}
{"in": [[["a", "a"]], ["aaa", "aa"]], "out": ["aa"]}
{"in": [[["c", "a", "t"], ["x", "r", "s"], ["d", "o", "g"]], ["cat", "cats", "car", "cars", "dog", "rod", "art", "xyz"]], "out": ["car", "cars", "cat", "cats", "rod", "dog"]}
```
