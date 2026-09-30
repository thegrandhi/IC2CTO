# Reverse Bits

```meta
difficulty: Easy
topic: Bit Manipulation
tags: bit shifting
lc: 190
signature: reverseBits(n: int) -> int
time: O(32)
space: O(1)
```

Reverse the bits of a **32-bit unsigned** integer `n` and return the result as an unsigned integer. Bit 0 becomes bit 31, bit 1 becomes bit 30, and so on.

**Constraints**
- `0 <= n <= 2^32 - 1`

**Follow-up:** if this function is called many times, how would you optimize it?

## Hints
- Build the result one bit at a time: shift the result left, append `n`'s lowest bit, shift `n` right. Do this exactly 32 times.
- In JavaScript, finish with `>>> 0` to reinterpret the result as unsigned.

## Solution
Loop 32 times: `result = (result << 1) | (n & 1)`, then `n >>= 1`. Exactly 32 iterations ensure leading zeros of `n` become trailing zeros of the result. For the follow-up, cache the reversal of every byte (256 entries) and combine four lookups, or use the divide-and-conquer mask swaps.

```python
class Solution:
    def reverseBits(self, n: int) -> int:
        result = 0
        for _ in range(32):
            result = (result << 1) | (n & 1)
            n >>= 1
        return result
```

```javascript
function reverseBits(n) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = ((result << 1) | (n & 1)) >>> 0;
    n >>>= 1;
  }
  return result;
}
```

## Tests
```jsonl
{"in": [43261596], "out": 964176192, "why": "00000010100101000001111010011100 reversed is 00111001011110000010100101000000."}
{"in": [4294967293], "out": 3221225471}
{"in": [0], "out": 0}
{"in": [1], "out": 2147483648}
{"in": [4294967295], "out": 4294967295}
{"in": [2147483648], "out": 1}
{"in": [305419896], "out": 510274632}
```
