# Number of 1 Bits

```meta
difficulty: Easy
topic: Bit Manipulation
tags: popcount
lc: 191
signature: hammingWeight(n: int) -> int
time: O(number of set bits)
space: O(1)
```

Given a non-negative integer `n` (up to 32 bits), return the number of `1` bits in its binary representation, also known as its **Hamming weight**.

**Constraints**
- `0 <= n <= 2^32 - 1`

## Hints
- Check the lowest bit with `n & 1`, then shift right.
- `n & (n - 1)` clears the lowest set bit. How many times can you do that before `n` becomes 0?

## Solution
**Brian Kernighan's trick:** `n & (n - 1)` removes the lowest set bit, so count how many times you can apply it before reaching 0. The loop runs once per set bit. In JavaScript, bitwise operators work on signed 32-bit integers, so values of 2³¹ and above need care. Arithmetic (`% 2`, division by 2) avoids the problem.

```python
class Solution:
    def hammingWeight(self, n: int) -> int:
        count = 0
        while n:
            n &= n - 1
            count += 1
        return count
```

```javascript
function hammingWeight(n) {
  let count = 0;
  while (n > 0) {
    count += n % 2;
    n = Math.floor(n / 2);
  }
  return count;
}
```

## Tests
```jsonl
{"in": [11], "out": 3, "why": "11 is 1011 in binary."}
{"in": [128], "out": 1}
{"in": [4294967293], "out": 31}
{"in": [0], "out": 0}
{"in": [4294967295], "out": 32}
{"in": [2147483648], "out": 1}
{"in": [255], "out": 8}
```
