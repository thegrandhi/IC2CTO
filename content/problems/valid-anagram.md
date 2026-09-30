# Valid Anagram

```meta
difficulty: Easy
topic: Arrays & Hashing
tags: counting, hash map
lc: 242
signature: isAnagram(s: string, t: string) -> bool
time: O(n)
space: O(1) (26 letters)
```

Given two strings `s` and `t`, return `true` if `t` is an **anagram** of `s`, meaning it uses exactly the same letters the same number of times, and `false` otherwise.

**Constraints**
- `1 <= s.length, t.length <= 5 * 10^4`
- `s` and `t` contain only lowercase English letters.

**Follow-up:** what changes if the inputs can contain any Unicode characters?

## Hints
- Two strings of different lengths can never be anagrams.
- Count each letter in `s`, then "uncount" each letter of `t`. What must every count be at the end?

## Solution
Count characters. Increment a counter for every character of `s`, decrement for every character of `t`, and check that all counts are zero. With a fixed 26-letter alphabet the counter is O(1) space. A hash map handles arbitrary Unicode. Sorting both strings and comparing also works in O(n log n).

```python
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        counts = Counter(s)
        for ch in t:
            counts[ch] -= 1
            if counts[ch] < 0:
                return False
        return True
```

```javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    counts[s.charCodeAt(i) - 97]++;
    counts[t.charCodeAt(i) - 97]--;
  }
  return counts.every((c) => c === 0);
}
```

## Tests
```jsonl
{"in": ["anagram", "nagaram"], "out": true}
{"in": ["rat", "car"], "out": false}
{"in": ["a", "a"], "out": true}
{"in": ["ab", "a"], "out": false}
{"in": ["aacc", "ccac"], "out": false}
{"in": ["listen", "silent"], "out": true}
{"in": ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"], "out": true}
{"in": ["aabbcc", "abcabd"], "out": false}
```
