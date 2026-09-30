# Longest Repeating Character Replacement

```meta
difficulty: Medium
topic: Sliding Window
tags: counting
lc: 424
signature: characterReplacement(s: string, k: int) -> int
time: O(n)
space: O(26)
```

You're given a string `s` of uppercase English letters and an integer `k`. You may change **at most `k`** characters to any other uppercase letter.

Return the length of the longest substring that can be made of one repeated letter.

**Constraints**
- `1 <= s.length <= 10^5`
- `0 <= k <= s.length`

## Hints
- In a window, how many characters would you need to change? Everything except the most common letter.
- A window is valid when `windowLength - maxCount <= k`.
- When the window becomes invalid, slide `left` forward by one. You never need to shrink it below the best size found.

## Solution
Keep letter counts for the window `[left, right]` and the highest count `maxCount` seen so far. If `window - maxCount > k`, move `left` forward by one, which keeps the window size unchanged. The window only grows when a strictly better answer appears. `maxCount` may be stale (too high), but that can only stop the window from growing, never produce a wrong larger answer. So the final window length is the answer.

```python
class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        counts = Counter()
        left = max_count = 0
        for right, ch in enumerate(s):
            counts[ch] += 1
            max_count = max(max_count, counts[ch])
            if right - left + 1 - max_count > k:
                counts[s[left]] -= 1
                left += 1
        return len(s) - left
```

```javascript
function characterReplacement(s, k) {
  const counts = new Array(26).fill(0);
  let left = 0;
  let maxCount = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s.charCodeAt(right) - 65;
    counts[c]++;
    maxCount = Math.max(maxCount, counts[c]);
    if (right - left + 1 - maxCount > k) {
      counts[s.charCodeAt(left) - 65]--;
      left++;
    }
  }
  return s.length - left;
}
```

## Tests
```jsonl
{"in": ["ABAB", 2], "out": 4}
{"in": ["AABABBA", 1], "out": 4}
{"in": ["A", 0], "out": 1}
{"in": ["AAAA", 0], "out": 4}
{"in": ["ABCDE", 1], "out": 2}
{"in": ["ABBB", 2], "out": 4}
{"in": ["BAAAB", 2], "out": 5}
{"in": ["ABCABCABC", 3], "out": 5}
{"in": ["KRSCDCSONAJNHLBMDQGIFCPEKPOHQIHLTDIQGEKLRLCQNBOHNDQGHJPNDQPERNFSSSRDEQLFPCCCARFMDLHADJADAGNNSBNCJQOF", 4], "out": 7}
```
