# Longest Common Subsequence

```meta
difficulty: Medium
topic: 2-D DP
tags: string dp
lc: 1143
signature: longestCommonSubsequence(text1: string, text2: string) -> int
time: O(m · n)
space: O(min(m, n))
```

Given two strings, return the length of their **longest common subsequence**: the longest sequence of characters that appears in both, in order but not necessarily contiguously. Return `0` if there's none.

**Constraints**
- `1 <= text1.length, text2.length <= 1000`; lowercase English letters.

## Hints
- Compare the last characters. If they match, they can both end the LCS. If not, drop one of them.
- `dp[i][j] = dp[i-1][j-1] + 1` if `a[i-1] == b[j-1]`, else `max(dp[i-1][j], dp[i][j-1])`.

## Solution
Let `dp[i][j]` be the LCS length of the prefixes `text1[:i]` and `text2[:j]`. Matching last characters extend the diagonal. Otherwise take the better of dropping a character from either string. Each row depends only on the previous row, so two rows suffice.

```python
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        prev = [0] * (len(text2) + 1)
        for a in text1:
            cur = [0]
            for j, b in enumerate(text2):
                cur.append(prev[j] + 1 if a == b else max(prev[j + 1], cur[j]))
            prev = cur
        return prev[-1]
```

```javascript
function longestCommonSubsequence(text1, text2) {
  let prev = new Array(text2.length + 1).fill(0);
  for (const a of text1) {
    const cur = [0];
    for (let j = 0; j < text2.length; j++) {
      cur.push(a === text2[j] ? prev[j] + 1 : Math.max(prev[j + 1], cur[j]));
    }
    prev = cur;
  }
  return prev[text2.length];
}
```

## Tests
```jsonl
{"in": ["abcde", "ace"], "out": 3}
{"in": ["abc", "abc"], "out": 3}
{"in": ["abc", "def"], "out": 0}
{"in": ["a", "a"], "out": 1}
{"in": ["bsbininm", "jmjkbkjkv"], "out": 1}
{"in": ["oxcpqrsvwf", "shmtulqrypy"], "out": 2}
{"in": ["abcba", "abcbcba"], "out": 5}
```
