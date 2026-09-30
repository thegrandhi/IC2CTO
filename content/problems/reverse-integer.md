# Reverse Integer

```meta
difficulty: Medium
topic: Bit Manipulation
tags: overflow, digits
lc: 7
signature: reverse(x: int) -> int
time: O(log x)
space: O(1)
```

Given a signed 32-bit integer `x`, return `x` with its digits reversed. If the reversed value falls outside the signed 32-bit range `[-2^31, 2^31 - 1]`, return `0`.

Assume the environment can't store 64-bit integers.

**Constraints**
- `-2^31 <= x <= 2^31 - 1`

## Hints
- Pop the last digit with `% 10` and push it onto the result with `result * 10 + digit`.
- Check for overflow **before** multiplying, by comparing `result` with `INT_MAX // 10`.

## Solution
Work with the absolute value and remember the sign. Pop digits one at a time and push them onto `result`. Before each push, check whether `result > (2^31 - 1) // 10`, or equal to it with the next digit too big. That catches overflow without exceeding 32 bits. Reapply the sign at the end. Trailing zeros of `x` disappear naturally.

```python
class Solution:
    def reverse(self, x: int) -> int:
        limit = 2**31 - 1 if x >= 0 else 2**31
        sign = -1 if x < 0 else 1
        x = abs(x)
        result = 0
        while x:
            digit = x % 10
            x //= 10
            if result > (limit - digit) // 10:
                return 0
            result = result * 10 + digit
        return sign * result
```

```javascript
function reverse(x) {
  const sign = x < 0 ? -1 : 1;
  const reversed = Number(String(Math.abs(x)).split('').reverse().join('')) * sign;
  return reversed > 2 ** 31 - 1 || reversed < -(2 ** 31) ? 0 : reversed + 0;
}
```

## Tests
```jsonl
{"in": [123], "out": 321}
{"in": [-123], "out": -321}
{"in": [120], "out": 21}
{"in": [0], "out": 0}
{"in": [1534236469], "out": 0}
{"in": [-2147483412], "out": -2143847412}
{"in": [-2147483648], "out": 0}
{"in": [1463847412], "out": 2147483641}
```
