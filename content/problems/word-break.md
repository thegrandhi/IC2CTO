# Word Break

```meta
difficulty: Medium
topic: 1-D DP
tags: dp over prefixes
lc: 139
signature: wordBreak(s: string, wordDict: string[]) -> bool
time: O(n · L)
space: O(n)
```

Given a string `s` and a dictionary `wordDict`, return `true` if `s` can be split into a sequence of one or more dictionary words. Words may be reused.

**Constraints**
- `1 <= s.length <= 300`; `1 <= wordDict.length <= 1000`; `1 <= wordDict[i].length <= 20`

## Hints
- `ok[i]` = "the first `i` characters can be split". `ok[0]` is true.
- `ok[i]` is true if some word `w` ends at position `i` and `ok[i - len(w)]` is true.

## Solution
Fill `ok[0..n]`, where `ok[i]` means the prefix `s[:i]` can be segmented. For each `i`, try every dictionary word that could end there: if `s[i-len(w):i] == w` and `ok[i-len(w)]`, then `ok[i] = True`. Checking only the dictionary words (at most 20 characters long) avoids trying every split point.

```python
class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        ok = [True] + [False] * len(s)
        for i in range(1, len(s) + 1):
            for w in wordDict:
                if len(w) <= i and ok[i - len(w)] and s[i - len(w):i] == w:
                    ok[i] = True
                    break
        return ok[len(s)]
```

```javascript
function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const maxLen = Math.max(...wordDict.map((w) => w.length));
  const ok = new Array(s.length + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = Math.max(0, i - maxLen); j < i && !ok[i]; j++) {
      if (ok[j] && words.has(s.slice(j, i))) ok[i] = true;
    }
  }
  return ok[s.length];
}
```

## Tests
```jsonl
{"in": ["leetcode", ["leet", "code"]], "out": true}
{"in": ["applepenapple", ["apple", "pen"]], "out": true}
{"in": ["catsandog", ["cats", "dog", "sand", "and", "cat"]], "out": false}
{"in": ["a", ["b"]], "out": false}
{"in": ["aaaaaaa", ["aaaa", "aaa"]], "out": true}
{"in": ["cars", ["car", "ca", "rs"]], "out": true}
{"in": ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", ["a", "aa", "aaa", "aaaa", "aaaaa"]], "out": false}
```
