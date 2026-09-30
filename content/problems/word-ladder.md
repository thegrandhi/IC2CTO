# Word Ladder

```meta
difficulty: Hard
topic: Graphs
tags: bfs, implicit graph
lc: 127
signature: ladderLength(beginWord: string, endWord: string, wordList: string[]) -> int
time: O(N · L · 26)
space: O(N · L)
```

A **transformation sequence** from `beginWord` to `endWord` changes one letter at a time, and every intermediate word (and `endWord`) must be in `wordList`. `beginWord` itself doesn't need to be in the list.

Return the **number of words** in the shortest such sequence, including both ends, or `0` if no sequence exists.

**Constraints**
- `1 <= beginWord.length <= 10`; all words have the same length and are lowercase.
- `1 <= wordList.length <= 5000`; words in the list are unique.

## Hints
- Words are nodes; two words are connected if they differ in exactly one letter. You want the shortest path, which calls for BFS.
- Generating neighbours by trying all 26 letters at each position is fast when the dictionary is a set.

## Solution
BFS from `beginWord`, level by level. For each word, generate every one-letter variation. A variation that's in the dictionary and unvisited joins the next level; remove it from the set so it's never enqueued twice. The level at which you pop `endWord` is the answer. Bidirectional BFS from both ends can cut the work substantially.

```python
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        words = set(wordList)
        if endWord not in words:
            return 0
        queue = deque([(beginWord, 1)])
        words.discard(beginWord)
        while queue:
            word, steps = queue.popleft()
            if word == endWord:
                return steps
            for i in range(len(word)):
                for ch in string.ascii_lowercase:
                    nxt = word[:i] + ch + word[i + 1:]
                    if nxt in words:
                        words.remove(nxt)
                        queue.append((nxt, steps + 1))
        return 0
```

```javascript
function ladderLength(beginWord, endWord, wordList) {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  let level = [beginWord];
  words.delete(beginWord);
  let steps = 1;
  while (level.length) {
    const next = [];
    for (const word of level) {
      if (word === endWord) return steps;
      for (let i = 0; i < word.length; i++) {
        for (let c = 97; c <= 122; c++) {
          const cand = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
          if (words.has(cand)) {
            words.delete(cand);
            next.push(cand);
          }
        }
      }
    }
    level = next;
    steps++;
  }
  return 0;
}
```

## Tests
```jsonl
{"in": ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], "out": 5, "why": "hit → hot → dot → dog → cog"}
{"in": ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], "out": 0, "why": "cog is not in the word list."}
{"in": ["a", "c", ["a", "b", "c"]], "out": 2}
{"in": ["hot", "dog", ["hot", "dog"]], "out": 0}
{"in": ["lost", "cost", ["most", "fist", "lost", "cost", "fish"]], "out": 2}
{"in": ["cold", "warm", ["cord", "card", "ward", "warm", "word", "worm", "wore", "core"]], "out": 5}
```
