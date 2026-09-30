# Design Add and Search Words Data Structure

```meta
difficulty: Medium
topic: Tries
tags: design, trie, dfs
lc: 211
class: WordDictionary()
method: addWord(word: string) -> void
method: search(word: string) -> bool
time: O(L) add, up to O(26^dots · L) search
space: O(total characters)
examples: 1
```

Design a word dictionary that supports adding words and searching with **wildcards**.

- `WordDictionary()` initializes the structure.
- `addWord(word)` adds `word`.
- `search(word)` returns `true` if some added word matches `word`, where `.` matches **any single letter**.

**Constraints**
- `1 <= word.length <= 25`; lowercase letters (and `.` in searches, at most 2 per query).
- At most `10^4` calls in total.

## Hints
- Store the words in a trie.
- For a normal letter, follow one child. For `.`, try **every** child: that's a DFS.

## Solution
Insert words into a trie with end-of-word flags. Search with a DFS over `(node, index)`. A letter follows its single child. A `.` branches into every child. At the end of the pattern, succeed only if the node marks the end of a word. With few dots, the branching stays small.

```python
class WordDictionary:

    def __init__(self):
        self.root = {}

    def addWord(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            ch = word[i]
            if ch == ".":
                return any(dfs(child, i + 1) for key, child in node.items() if key != "$")
            return ch in node and dfs(node[ch], i + 1)

        return dfs(self.root, 0)
```

```javascript
class WordDictionary {
  constructor() {
    this.root = { children: {}, end: false };
  }

  addWord(word) {
    let node = this.root;
    for (const ch of word) node = node.children[ch] ??= { children: {}, end: false };
    node.end = true;
  }

  search(word) {
    const dfs = (node, i) => {
      if (i === word.length) return node.end;
      const ch = word[i];
      if (ch === '.') return Object.values(node.children).some((child) => dfs(child, i + 1));
      const next = node.children[ch];
      return !!next && dfs(next, i + 1);
    };
    return dfs(this.root, 0);
  }
}
```

## Tests
```jsonl
{"ops": ["WordDictionary", "addWord", "addWord", "addWord", "search", "search", "search", "search"], "args": [[], ["bad"], ["dad"], ["mad"], ["pad"], ["bad"], [".ad"], ["b.."]], "out": [null, null, null, null, false, true, true, true]}
{"ops": ["WordDictionary", "search", "addWord", "search", "search"], "args": [[], ["."], ["a"], ["."], [".."]], "out": [null, false, null, true, false]}
{"ops": ["WordDictionary", "addWord", "addWord", "search", "search", "search", "search"], "args": [[], ["at"], ["and"], ["a"], [".at"], ["an."], ["a.d."]], "out": [null, null, null, false, false, true, false]}
{"ops": ["WordDictionary", "addWord", "addWord", "search", "search", "search"], "args": [[], ["ab"], ["abc"], ["a."], ["a.."], ["..c"]], "out": [null, null, null, true, true, true]}
```
