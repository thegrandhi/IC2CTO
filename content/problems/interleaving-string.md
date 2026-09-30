# Interleaving String

```meta
difficulty: Medium
topic: 2-D DP
tags: string dp
lc: 97
signature: isInterleave(s1: string, s2: string, s3: string) -> bool
time: O(m · n)
space: O(n)
```

Return `true` if `s3` is an **interleaving** of `s1` and `s2`: all characters of `s1` and `s2` merged together, with each string's characters kept in their original order.

**Constraints**
- `0 <= s1.length, s2.length <= 100`; `0 <= s3.length <= 200`

## Hints
- If the lengths don't add up, return `false` immediately.
- `dp[i][j]` = "can the first `i` characters of `s1` and the first `j` of `s2` form the first `i + j` of `s3`?"

## Solution
`dp[i][j]` is true when `s3[:i+j]` can be built from `s1[:i]` and `s2[:j]`. The last character of that prefix came from `s1` (need `dp[i-1][j]` and `s1[i-1] == s3[i+j-1]`) or from `s2` (need `dp[i][j-1]` and `s2[j-1] == s3[i+j-1]`). One rolling row is enough.

```python
class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        m, n = len(s1), len(s2)
        if m + n != len(s3):
            return False
        dp = [False] * (n + 1)
        for i in range(m + 1):
            for j in range(n + 1):
                if i == 0 and j == 0:
                    dp[j] = True
                    continue
                from_s1 = i > 0 and dp[j] and s1[i - 1] == s3[i + j - 1]
                from_s2 = j > 0 and dp[j - 1] and s2[j - 1] == s3[i + j - 1]
                dp[j] = from_s1 or from_s2
        return dp[n]
```

```javascript
function isInterleave(s1, s2, s3) {
  const m = s1.length;
  const n = s2.length;
  if (m + n !== s3.length) return false;
  const memo = new Map();
  const can = (i, j) => {
    if (i === m && j === n) return true;
    const key = i * (n + 1) + j;
    if (memo.has(key)) return memo.get(key);
    const k = i + j;
    const result = (i < m && s1[i] === s3[k] && can(i + 1, j)) || (j < n && s2[j] === s3[k] && can(i, j + 1));
    memo.set(key, result);
    return result;
  };
  return can(0, 0);
}
```

## Tests
```jsonl
{"in": ["aabcc", "dbbca", "aadbbcbcac"], "out": true}
{"in": ["aabcc", "dbbca", "aadbbbaccc"], "out": false}
{"in": ["", "", ""], "out": true}
{"in": ["a", "", "a"], "out": true}
{"in": ["abc", "def", "adbecf"], "out": true}
{"in": ["abc", "def", "abdcfe"], "out": false}
{"in": ["aa", "ab", "aaba"], "out": true}
```
