# Implement Trie (Prefix Tree)

```meta
difficulty: Medium
topic: Tries
tags: design, prefix tree
lc: 208
class: Trie()
method: insert(word: string) -> void
method: search(word: string) -> bool
method: startsWith(prefix: string) -> bool
time: O(length) per operation
space: O(total characters)
examples: 1
```

A **trie** (prefix tree) stores strings so that lookups by prefix are fast. Implement:

- `Trie()` initializes an empty trie.
- `insert(word)` adds `word`.
- `search(word)` returns `true` if `word` was inserted before.
- `startsWith(prefix)` returns `true` if any inserted word starts with `prefix`.

**Constraints**
- `1 <= word.length, prefix.length <= 2000`; lowercase English letters.
- At most `3 * 10^4` calls in total.

## Hints
- Each node maps a character to a child node.
- `search` and `startsWith` walk the same path. The only difference is whether the final node must mark the **end** of a word.

## Solution
Each node holds a `children` map and an `end` flag. `insert` walks down character by character, creating nodes as needed, then sets `end` on the last node. `startsWith` succeeds if the walk doesn't fall off the trie. `search` also requires the final node's `end` flag. Every operation costs O(length of the word).

```python
class Trie:

    def __init__(self):
        self.root = {}

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and "$" in node

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None
```

```javascript
class Trie {
  constructor() {
    this.root = { children: new Map(), end: false };
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }

  walk(s) {
    let node = this.root;
    for (const ch of s) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }

  search(word) {
    const node = this.walk(word);
    return !!node && node.end;
  }

  startsWith(prefix) {
    return this.walk(prefix) !== null;
  }
}
```

## Tests
```jsonl
{"ops": ["Trie", "insert", "search", "search", "startsWith", "insert", "search"], "args": [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]], "out": [null, null, true, false, true, null, true]}
{"ops": ["Trie", "search", "startsWith", "insert", "search", "startsWith"], "args": [[], ["a"], ["a"], ["a"], ["a"], ["a"]], "out": [null, false, false, null, true, true]}
{"ops": ["Trie", "insert", "insert", "search", "search", "startsWith", "startsWith", "search"], "args": [[], ["car"], ["card"], ["car"], ["ca"], ["ca"], ["cards"], ["card"]], "out": [null, null, null, true, false, true, false, true]}
{"ops": ["Trie", "insert", "startsWith", "search", "insert", "search", "startsWith"], "args": [[], ["hello"], ["hell"], ["hell"], ["hell"], ["hell"], ["helloo"]], "out": [null, null, true, false, null, true, false]}
```
