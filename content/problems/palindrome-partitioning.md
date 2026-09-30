# Palindrome Partitioning

```meta
difficulty: Medium
topic: Backtracking
tags: strings, recursion
lc: 131
signature: partition(s: string) -> string[][]
compare: unordered
time: O(n · 2^n)
space: O(n)
```

Given a string `s`, split it so that **every piece is a palindrome**. Return every possible way to do so, in any order.

**Constraints**
- `1 <= s.length <= 16`; lowercase English letters.

## Hints
- Choose the first piece: try every prefix `s[start:end]` that is a palindrome, then partition the rest.
- Precomputing which substrings are palindromes (a DP table) avoids re-checking them.

## Solution
Backtrack on `start`. For every `end > start`, if `s[start:end]` is a palindrome, add it to the path and recurse on `end`. When `start == len(s)`, the path is a complete partition. A table `pal[i][j]`, filled so that `pal[i][j] = s[i] == s[j] and pal[i+1][j-1]`, makes each palindrome check O(1).

```python
class Solution:
    def partition(self, s: str) -> List[List[str]]:
        n = len(s)
        pal = [[False] * n for _ in range(n)]
        for i in range(n - 1, -1, -1):
            for j in range(i, n):
                pal[i][j] = s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1])
        result = []
        path = []

        def backtrack(start):
            if start == n:
                result.append(path[:])
                return
            for end in range(start, n):
                if pal[start][end]:
                    path.append(s[start:end + 1])
                    backtrack(end + 1)
                    path.pop()

        backtrack(0)
        return result
```

```javascript
function partition(s) {
  const isPal = (i, j) => {
    while (i < j) if (s[i++] !== s[j--]) return false;
    return true;
  };
  const result = [];
  const path = [];
  const backtrack = (start) => {
    if (start === s.length) {
      result.push([...path]);
      return;
    }
    for (let end = start; end < s.length; end++) {
      if (isPal(start, end)) {
        path.push(s.slice(start, end + 1));
        backtrack(end + 1);
        path.pop();
      }
    }
  };
  backtrack(0);
  return result;
}
```

## Tests
```jsonl
{"in": ["aab"], "out": [["a", "a", "b"], ["aa", "b"]]}
{"in": ["a"], "out": [["a"]]}
{"in": ["abba"], "out": [["a", "b", "b", "a"], ["a", "bb", "a"], ["abba"]]}
{"in": ["racecar"], "out": [["r", "a", "c", "e", "c", "a", "r"], ["r", "a", "cec", "a", "r"], ["r", "aceca", "r"], ["racecar"]]}
{"in": ["abc"], "out": [["a", "b", "c"]]}
{"in": ["aaaa"], "out": [["a", "a", "a", "a"], ["a", "a", "aa"], ["a", "aa", "a"], ["a", "aaa"], ["aa", "a", "a"], ["aa", "aa"], ["aaa", "a"], ["aaaa"]]}
```
