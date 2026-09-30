# Edit Distance

```meta
difficulty: Medium
topic: 2-D DP
tags: string dp, levenshtein
lc: 72
signature: minDistance(word1: string, word2: string) -> int
time: O(m · n)
space: O(n)
```

Return the minimum number of operations needed to turn `word1` into `word2`. Each operation **inserts**, **deletes** or **replaces** a single character.

**Constraints**
- `0 <= word1.length, word2.length <= 500`; lowercase English letters.

## Hints
- Compare the last characters. If equal, no operation is needed for them.
- Otherwise, the last operation was an insert, a delete or a replace, each leading to a smaller subproblem.

## Solution
`dp[i][j]` is the edit distance between `word1[:i]` and `word2[:j]`. Base cases: `dp[i][0] = i` (delete everything) and `dp[0][j] = j` (insert everything). If `word1[i-1] == word2[j-1]`, then `dp[i][j] = dp[i-1][j-1]`. Otherwise it's `1 + min(dp[i-1][j] (delete), dp[i][j-1] (insert), dp[i-1][j-1] (replace))`. Rolling rows give O(n) space.

```python
class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        prev = list(range(len(word2) + 1))
        for i, a in enumerate(word1, 1):
            cur = [i]
            for j, b in enumerate(word2, 1):
                if a == b:
                    cur.append(prev[j - 1])
                else:
                    cur.append(1 + min(prev[j], cur[j - 1], prev[j - 1]))
            prev = cur
        return prev[-1]
```

```javascript
function minDistance(word1, word2) {
  let prev = Array.from({ length: word2.length + 1 }, (_, j) => j);
  for (let i = 1; i <= word1.length; i++) {
    const cur = [i];
    for (let j = 1; j <= word2.length; j++) {
      cur.push(word1[i - 1] === word2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]));
    }
    prev = cur;
  }
  return prev[word2.length];
}
```

## Tests
```jsonl
{"in": ["horse", "ros"], "out": 3, "why": "horse → rorse (replace h) → rose (delete r) → ros (delete e)"}
{"in": ["intention", "execution"], "out": 5}
{"in": ["", ""], "out": 0}
{"in": ["", "abc"], "out": 3}
{"in": ["abc", ""], "out": 3}
{"in": ["kitten", "sitting"], "out": 3}
{"in": ["sunday", "saturday"], "out": 3}
{"in": ["abcdef", "abcdef"], "out": 0}
```
