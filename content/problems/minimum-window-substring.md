# Minimum Window Substring

```meta
difficulty: Hard
topic: Sliding Window
tags: hash map, two pointers
lc: 76
signature: minWindow(s: string, t: string) -> string
time: O(|s| + |t|)
space: O(alphabet)
```

Given strings `s` and `t`, return the **shortest substring** of `s` that contains every character of `t`, including duplicates. If no such window exists, return `""`.

If several shortest windows exist, return the one that starts **leftmost**.

**Constraints**
- `1 <= s.length, t.length <= 10^5`
- `s` and `t` contain uppercase and lowercase English letters.

## Hints
- Expand `right` until the window covers `t`, then shrink `left` as far as possible while it still covers `t`.
- Track how many distinct characters currently meet their required count (`formed`) instead of comparing whole maps.

## Solution
Count what `t` needs. Expand the window to the right. When a character's count in the window reaches its requirement, increment `formed`. While `formed` equals the number of distinct required characters, the window is valid: record it if it's shorter, then remove `s[left]` and advance. Each pointer moves at most `|s|` times.

```python
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        need = Counter(t)
        have = Counter()
        formed = 0
        best = (float("inf"), 0, 0)
        left = 0
        for right, ch in enumerate(s):
            have[ch] += 1
            if ch in need and have[ch] == need[ch]:
                formed += 1
            while formed == len(need):
                if right - left + 1 < best[0]:
                    best = (right - left + 1, left, right + 1)
                out = s[left]
                have[out] -= 1
                if out in need and have[out] < need[out]:
                    formed -= 1
                left += 1
        return s[best[1]:best[2]] if best[0] != float("inf") else ""
```

```javascript
function minWindow(s, t) {
  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  const have = new Map();
  let formed = 0;
  let bestLen = Infinity;
  let bestStart = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    have.set(ch, (have.get(ch) ?? 0) + 1);
    if (need.has(ch) && have.get(ch) === need.get(ch)) formed++;
    while (formed === need.size) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestStart = left;
      }
      const out = s[left];
      have.set(out, have.get(out) - 1);
      if (need.has(out) && have.get(out) < need.get(out)) formed--;
      left++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestStart, bestStart + bestLen);
}
```

## Tests
```jsonl
{"in": ["ADOBECODEBANC", "ABC"], "out": "BANC"}
{"in": ["a", "a"], "out": "a"}
{"in": ["a", "aa"], "out": "", "why": "t needs two a's but s has only one."}
{"in": ["ab", "b"], "out": "b"}
{"in": ["aaflslflsldkalskaaa", "aaa"], "out": "aaa"}
{"in": ["cabwefgewcwaefgcf", "cae"], "out": "cwae"}
{"in": ["abcdef", "xyz"], "out": ""}
{"in": ["bba", "ab"], "out": "ba"}
{"in": ["acbbaca", "aba"], "out": "baca"}
```
