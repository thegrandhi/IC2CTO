# Multiply Strings

```meta
difficulty: Medium
topic: Math & Geometry
tags: grade-school multiplication
lc: 43
signature: multiply(num1: string, num2: string) -> string
time: O(m · n)
space: O(m + n)
```

Given two non-negative integers as strings, return their product as a string. Don't convert the inputs to integers directly or use a big-integer library.

**Constraints**
- `1 <= num1.length, num2.length <= 200`; digits only; no leading zeros except `"0"` itself.

## Hints
- The product has at most `m + n` digits.
- Digit `num1[i] × num2[j]` contributes to positions `i + j` and `i + j + 1` of the result.

## Solution
Allocate `m + n` result slots. For every digit pair, add `d1 × d2` into slot `i + j + 1`, then move the carry into slot `i + j`. Iterating from the rightmost digits keeps carries flowing left. Strip leading zeros at the end, keeping `"0"` if the product is zero.

```python
class Solution:
    def multiply(self, num1: str, num2: str) -> str:
        m, n = len(num1), len(num2)
        slots = [0] * (m + n)
        for i in range(m - 1, -1, -1):
            for j in range(n - 1, -1, -1):
                total = (ord(num1[i]) - 48) * (ord(num2[j]) - 48) + slots[i + j + 1]
                slots[i + j + 1] = total % 10
                slots[i + j] += total // 10
        result = "".join(map(str, slots)).lstrip("0")
        return result or "0"
```

```javascript
function multiply(num1, num2) {
  const m = num1.length;
  const n = num2.length;
  const slots = new Array(m + n).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const total = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48) + slots[i + j + 1];
      slots[i + j + 1] = total % 10;
      slots[i + j] += Math.floor(total / 10);
    }
  }
  const result = slots.join('').replace(/^0+/, '');
  return result || '0';
}
```

## Tests
```jsonl
{"in": ["2", "3"], "out": "6"}
{"in": ["123", "456"], "out": "56088"}
{"in": ["0", "52"], "out": "0"}
{"in": ["9", "9"], "out": "81"}
{"in": ["999", "999"], "out": "998001"}
{"in": ["123456789", "987654321"], "out": "121932631112635269"}
{"in": ["99999999999999999999", "99999999999999999999"], "out": "9999999999999999999800000000000000000001"}
```
