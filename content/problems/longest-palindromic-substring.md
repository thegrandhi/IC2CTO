# Longest Palindromic Substring

```meta
difficulty: Medium
topic: 1-D DP
tags: expand around center
lc: 5
signature: longestPalindrome(s: string) -> string
time: O(n²)
space: O(1)
```

Given a string `s`, return its longest **palindromic substring**. If several have the maximum length, return the one that **starts first**.

**Constraints**
- `1 <= s.length <= 1000`; digits and English letters.

## Hints
- Every palindrome mirrors around a center. There are `2n - 1` possible centers: each character, and each gap between two characters.
- Expand outward from each center while the ends match.

## Solution
**Expand around each center.** For every index, expand an odd-length palindrome centered on it and an even-length one centered between it and the next character. Keep the longest seen, and update only when strictly longer so the earliest start wins ties. Each expansion is O(n), for O(n²) overall with O(1) space. (Manacher's algorithm is O(n) but rarely expected.)

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        best_start, best_len = 0, 1

        def expand(lo, hi):
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                lo -= 1
                hi += 1
            return lo + 1, hi - lo - 1

        for i in range(len(s)):
            for lo, hi in ((i, i), (i, i + 1)):
                start, length = expand(lo, hi)
                if length > best_len:
                    best_start, best_len = start, length
        return s[best_start:best_start + best_len]
```

```javascript
function longestPalindrome(s) {
  let bestStart = 0;
  let bestLen = 1;
  const expand = (lo, hi) => {
    while (lo >= 0 && hi < s.length && s[lo] === s[hi]) {
      lo--;
      hi++;
    }
    return [lo + 1, hi - lo - 1];
  };
  for (let i = 0; i < s.length; i++) {
    for (const [lo, hi] of [[i, i], [i, i + 1]]) {
      const [start, len] = expand(lo, hi);
      if (len > bestLen) {
        bestStart = start;
        bestLen = len;
      }
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}
```

## Tests
```jsonl
{"in": ["babad"], "out": "bab", "why": "\"aba\" is also length 3, but \"bab\" starts first."}
{"in": ["cbbd"], "out": "bb"}
{"in": ["a"], "out": "a"}
{"in": ["ac"], "out": "a"}
{"in": ["racecar"], "out": "racecar"}
{"in": ["forgeeksskeegfor"], "out": "geeksskeeg"}
{"in": ["abacdfgdcaba"], "out": "aba"}
{"in": ["aaaa"], "out": "aaaa"}
```
