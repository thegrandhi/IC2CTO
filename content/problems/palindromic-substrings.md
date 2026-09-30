# Palindromic Substrings

```meta
difficulty: Medium
topic: 1-D DP
tags: expand around center
lc: 647
signature: countSubstrings(s: string) -> int
time: O(n²)
space: O(1)
```

Given a string `s`, return the number of **palindromic substrings** in it. Substrings at different positions count separately, even if they contain the same characters.

**Constraints**
- `1 <= s.length <= 1000`; lowercase English letters.

## Hints
- Same trick as Longest Palindromic Substring: expand around all `2n - 1` centers.
- Every successful expansion step is one more palindrome.

## Solution
For each of the `2n - 1` centers, expand outward while the characters match, counting one palindrome per successful step. O(n²) time, O(1) space. A DP table `pal[i][j]` gives the same count with O(n²) space.

```python
class Solution:
    def countSubstrings(self, s: str) -> int:
        count = 0
        for center in range(2 * len(s) - 1):
            lo, hi = center // 2, center // 2 + center % 2
            while lo >= 0 and hi < len(s) and s[lo] == s[hi]:
                count += 1
                lo -= 1
                hi += 1
        return count
```

```javascript
function countSubstrings(s) {
  let count = 0;
  for (let center = 0; center < 2 * s.length - 1; center++) {
    let lo = center >> 1;
    let hi = lo + (center % 2);
    while (lo >= 0 && hi < s.length && s[lo] === s[hi]) {
      count++;
      lo--;
      hi++;
    }
  }
  return count;
}
```

## Tests
```jsonl
{"in": ["abc"], "out": 3}
{"in": ["aaa"], "out": 6, "why": "a, a, a, aa, aa, aaa"}
{"in": ["a"], "out": 1}
{"in": ["abba"], "out": 6}
{"in": ["racecar"], "out": 10}
{"in": ["abcdcbaxyz"], "out": 13}
```
