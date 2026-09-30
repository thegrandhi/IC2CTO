# Sum of Two Integers

```meta
difficulty: Medium
topic: Bit Manipulation
tags: xor, carry, two's complement
lc: 371
signature: getSum(a: int, b: int) -> int
time: O(32)
space: O(1)
```

Return the sum of two integers `a` and `b` **without** using the `+` or `-` operators.

**Constraints**
- `-1000 <= a, b <= 1000`

## Hints
- `a ^ b` adds without carrying. `(a & b) << 1` gives the carries.
- Repeat until there's no carry.
- Python integers are unbounded. Mask to 32 bits during the loop, then convert back to a signed value.

## Solution
Binary addition splits into a carry-less sum `a ^ b` and a carry `(a & b) << 1`. Keep combining them until the carry is 0. In JavaScript, bitwise operators already work on 32-bit two's complement, so the loop just works. In Python, mask with `0xFFFFFFFF` to simulate 32 bits, and map results above `0x7FFFFFFF` back to negative numbers.

```python
class Solution:
    def getSum(self, a: int, b: int) -> int:
        mask = 0xFFFFFFFF
        a &= mask
        b &= mask
        while b:
            a, b = (a ^ b) & mask, ((a & b) << 1) & mask
        return a if a <= 0x7FFFFFFF else ~(a ^ mask)
```

```javascript
function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;
    b = carry;
  }
  return a;
}
```

## Tests
```jsonl
{"in": [1, 2], "out": 3}
{"in": [2, 3], "out": 5}
{"in": [-1, 1], "out": 0}
{"in": [-12, -8], "out": -20}
{"in": [1000, -1000], "out": 0}
{"in": [0, 0], "out": 0}
{"in": [-1000, 999], "out": -1}
```
