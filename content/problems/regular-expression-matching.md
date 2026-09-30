# Regular Expression Matching

```meta
difficulty: Hard
topic: 2-D DP
tags: string dp, memoization
lc: 10
signature: isMatch(s: string, p: string) -> bool
time: O(m · n)
space: O(m · n)
```

Implement regular expression matching with support for:

- `.` matches any single character.
- `*` matches **zero or more** of the element right before it.

The match must cover the **entire** string `s`, not just part of it.

**Constraints**
- `1 <= s.length <= 20`; `1 <= p.length <= 20`
- `s` has lowercase letters; `p` has lowercase letters, `.` and `*`. Every `*` follows a valid character.

## Hints
- Define `match(i, j)` = does `s[i:]` match `p[j:]`?
- If `p[j+1] == '*'`, either skip `p[j]*` entirely (`match(i, j + 2)`), or use it once when the current characters match (`match(i + 1, j)`).
- Memoize: there are only `(m + 1)(n + 1)` states.

## Solution
Top-down DP over `(i, j)`. Let `first = i < len(s) and p[j] in (s[i], '.')`. If the next pattern character is `*`, the result is `match(i, j + 2)` (zero copies) or `first and match(i + 1, j)` (one more copy, staying on the same pattern element). Otherwise it's `first and match(i + 1, j + 1)`. The base case: the pattern is used up, and the match succeeds only if the string is too. Memoization bounds the work to O(m·n).

```python
class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        @lru_cache(maxsize=None)
        def match(i, j):
            if j == len(p):
                return i == len(s)
            first = i < len(s) and p[j] in (s[i], ".")
            if j + 1 < len(p) and p[j + 1] == "*":
                return match(i, j + 2) or (first and match(i + 1, j))
            return first and match(i + 1, j + 1)

        return match(0, 0)
```

```javascript
function isMatch(s, p) {
  const m = s.length;
  const n = p.length;
  // dp[i][j]: does s[i:] match p[j:]?
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[m][n] = true;
  for (let i = m; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const first = i < m && (p[j] === s[i] || p[j] === '.');
      if (j + 1 < n && p[j + 1] === '*') dp[i][j] = dp[i][j + 2] || (first && dp[i + 1][j]);
      else dp[i][j] = first && dp[i + 1][j + 1];
    }
  }
  return dp[0][0];
}
```

## Tests
```jsonl
{"in": ["aa", "a"], "out": false}
{"in": ["aa", "a*"], "out": true}
{"in": ["ab", ".*"], "out": true}
{"in": ["aab", "c*a*b"], "out": true}
{"in": ["mississippi", "mis*is*p*."], "out": false}
{"in": ["mississippi", "mis*is*ip*."], "out": true}
{"in": ["ab", ".*c"], "out": false}
{"in": ["a", "ab*"], "out": true}
{"in": ["aaa", "a*a"], "out": true}
{"in": ["abcd", "d*"], "out": false}
```
