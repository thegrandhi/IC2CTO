# Pow(x, n)

```meta
difficulty: Medium
topic: Math & Geometry
tags: fast exponentiation
lc: 50
signature: myPow(x: float, n: int) -> float
compare: float
time: O(log n)
space: O(1)
```

Implement `pow(x, n)`, which computes `x` raised to the integer power `n`. Don't use the built-in power operator.

**Constraints**
- `-100.0 < x < 100.0`; `-2^31 <= n <= 2^31 - 1`
- Either `x` is not zero or `n > 0`; results are within `[-10^4, 10^4]`.

## Hints
- Multiplying `n` times is too slow when `n` is two billion.
- `x^n = (x²)^(n/2)` when `n` is even. That's **exponentiation by squaring**.
- Negative `n`: compute `(1/x)^(-n)`.

## Solution
**Binary exponentiation.** Process `n` bit by bit: when the lowest bit is set, multiply the result by the current base, then square the base and shift `n` right. That's O(log n) multiplications. Handle a negative exponent by inverting `x` and negating `n`. In fixed-width languages, `-2^31` can't be negated, so widen it first.

```python
class Solution:
    def myPow(self, x: float, n: int) -> float:
        if n < 0:
            x, n = 1 / x, -n
        result = 1.0
        while n:
            if n & 1:
                result *= x
            x *= x
            n >>= 1
        return result
```

```javascript
function myPow(x, n) {
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }
  let result = 1;
  while (n > 0) {
    if (n % 2 === 1) result *= x;
    x *= x;
    n = Math.floor(n / 2);
  }
  return result;
}
```

## Tests
```jsonl
{"in": [2.0, 10], "out": 1024.0}
{"in": [2.1, 3], "out": 9.261}
{"in": [2.0, -2], "out": 0.25}
{"in": [1, 2147483647], "out": 1}
{"in": [-2, 3], "out": -8}
{"in": [0.5, -3], "out": 8}
{"in": [3, 0], "out": 1}
{"in": [1.0000001, 100000], "out": 1.0100501665844765}
```
