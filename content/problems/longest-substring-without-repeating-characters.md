# Longest Substring Without Repeating Characters

```meta
difficulty: Medium
topic: Sliding Window
tags: hash map, two pointers
lc: 3
signature: lengthOfLongestSubstring(s: string) -> int
time: O(n)
space: O(min(n, alphabet))
```

Given a string `s`, return the length of the longest **substring** (a contiguous block) that contains no repeated characters.

**Constraints**
- `0 <= s.length <= 5 * 10^4`
- `s` contains English letters, digits, symbols and spaces.

## Hints
- Keep a window `[left, right]` that never contains a repeat. Grow it one character at a time on the right.
- When the new character already appears inside the window, where must `left` jump to?
- Remember the last index where each character appeared.

## Solution
Slide a window over the string. For each `right`, if `s[right]` was last seen at an index `>= left`, move `left` to just after that occurrence. Record the character's latest index and update the best window length. Each index enters and leaves the window at most once, so the whole scan is O(n).

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        left = best = 0
        for right, ch in enumerate(s):
            if ch in last and last[ch] >= left:
                left = last[ch] + 1
            last[ch] = right
            best = max(best, right - left + 1)
        return best
```

```javascript
function lengthOfLongestSubstring(s) {
  const last = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (last.has(ch) && last.get(ch) >= left) left = last.get(ch) + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

## Tests
```jsonl
{"in": ["abcabcbb"], "out": 3, "why": "\"abc\" is the longest run without repeats."}
{"in": ["bbbbb"], "out": 1}
{"in": ["pwwkew"], "out": 3, "why": "\"wke\"; note \"pwke\" is a subsequence, not a substring."}
{"in": [""], "out": 0}
{"in": [" "], "out": 1}
{"in": ["dvdf"], "out": 3}
{"in": ["abba"], "out": 2}
{"in": ["tmmzuxt"], "out": 5}
{"in": ["abcdefghijklmnopqrstuvwxyz0123456789"], "out": 36}
```
