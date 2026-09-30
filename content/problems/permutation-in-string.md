# Permutation in String

```meta
difficulty: Medium
topic: Sliding Window
tags: fixed window, counting
lc: 567
signature: checkInclusion(s1: string, s2: string) -> bool
time: O(n)
space: O(26)
```

Given two strings `s1` and `s2`, return `true` if `s2` contains a **permutation** of `s1` as a contiguous substring. In other words, some window of `s2` is an anagram of `s1`.

**Constraints**
- `1 <= s1.length, s2.length <= 10^4`
- Both strings contain only lowercase English letters.

## Hints
- A permutation of `s1` has exactly `len(s1)` characters, so only windows of that length matter.
- Compare letter counts. When the window slides, update the counts for one character leaving and one entering.

## Solution
Use a fixed-size window of length `len(s1)` over `s2`, with 26-letter counts for both. Sliding the window by one changes two counts. To avoid comparing 26 counts every step, track `matches`, the number of letters whose counts agree, and update it as counts change. When `matches == 26`, the window is a permutation. The Python version below simply compares the two count arrays, which is O(26) per step and still linear overall.

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        n = len(s1)
        if n > len(s2):
            return False
        need = [0] * 26
        have = [0] * 26
        for i in range(n):
            need[ord(s1[i]) - 97] += 1
            have[ord(s2[i]) - 97] += 1
        if need == have:
            return True
        for i in range(n, len(s2)):
            have[ord(s2[i]) - 97] += 1
            have[ord(s2[i - n]) - 97] -= 1
            if need == have:
                return True
        return False
```

```javascript
function checkInclusion(s1, s2) {
  const n = s1.length;
  if (n > s2.length) return false;
  const need = new Array(26).fill(0);
  const have = new Array(26).fill(0);
  for (let i = 0; i < n; i++) {
    need[s1.charCodeAt(i) - 97]++;
    have[s2.charCodeAt(i) - 97]++;
  }
  let matches = 0;
  for (let c = 0; c < 26; c++) if (need[c] === have[c]) matches++;
  for (let i = n; i < s2.length; i++) {
    if (matches === 26) return true;
    const add = s2.charCodeAt(i) - 97;
    const drop = s2.charCodeAt(i - n) - 97;
    if (have[add] === need[add]) matches--;
    have[add]++;
    if (have[add] === need[add]) matches++;
    if (have[drop] === need[drop]) matches--;
    have[drop]--;
    if (have[drop] === need[drop]) matches++;
  }
  return matches === 26;
}
```

## Tests
```jsonl
{"in": ["ab", "eidbaooo"], "out": true, "why": "\"ba\" is a permutation of \"ab\"."}
{"in": ["ab", "eidboaoo"], "out": false}
{"in": ["adc", "dcda"], "out": true}
{"in": ["a", "a"], "out": true}
{"in": ["abc", "ab"], "out": false}
{"in": ["hello", "ooolleoooleh"], "out": false}
{"in": ["aab", "abbaab"], "out": true}
{"in": ["xyz", "zzzyyyxxx"], "out": false}
```
