# Decode Ways

```meta
difficulty: Medium
topic: 1-D DP
tags: counting
lc: 91
signature: numDecodings(s: string) -> int
time: O(n)
space: O(1)
```

Letters are encoded as numbers: `A → "1"`, `B → "2"`, …, `Z → "26"`. Given a string `s` of digits, return how many ways it can be **decoded** back into letters.

Codes with a leading zero, like `"06"`, are invalid. If `s` can't be decoded at all, return `0`.

**Constraints**
- `1 <= s.length <= 100`; `s` contains only digits.

## Hints
- The last letter uses either the last digit alone (if it's not `0`) or the last two digits (if they form `10`–`26`).
- `ways(i) = [s[i-1] != '0'] · ways(i-1) + [10 <= s[i-2..i-1] <= 26] · ways(i-2)`.

## Solution
Let `dp[i]` be the number of ways to decode the first `i` characters, with `dp[0] = 1`. A single digit `1`–`9` extends every decoding of `i - 1` characters. A two-digit code `10`–`26` extends every decoding of `i - 2` characters. Only two previous values are needed. Zeros are the trap: `0` alone is invalid, and `"30"` can't be paired either.

```python
class Solution:
    def numDecodings(self, s: str) -> int:
        prev2, prev = 1, 1 if s[0] != "0" else 0
        for i in range(2, len(s) + 1):
            cur = 0
            if s[i - 1] != "0":
                cur += prev
            if 10 <= int(s[i - 2:i]) <= 26:
                cur += prev2
            prev2, prev = prev, cur
        return prev
```

```javascript
function numDecodings(s) {
  let prev2 = 1;
  let prev = s[0] !== '0' ? 1 : 0;
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += prev;
    const two = Number(s.slice(i - 2, i));
    if (two >= 10 && two <= 26) cur += prev2;
    [prev2, prev] = [prev, cur];
  }
  return prev;
}
```

## Tests
```jsonl
{"in": ["12"], "out": 2, "why": "\"AB\" (1 2) or \"L\" (12)."}
{"in": ["226"], "out": 3}
{"in": ["06"], "out": 0}
{"in": ["0"], "out": 0}
{"in": ["10"], "out": 1}
{"in": ["100"], "out": 0}
{"in": ["27"], "out": 1}
{"in": ["11106"], "out": 2}
{"in": ["111111111111111111111111111111111111111111111"], "out": 1836311903}
```
