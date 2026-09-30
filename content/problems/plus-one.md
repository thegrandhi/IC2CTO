# Plus One

```meta
difficulty: Easy
topic: Math & Geometry
tags: carry
lc: 66
signature: plusOne(digits: int[]) -> int[]
time: O(n)
space: O(1)
```

A large non-negative integer is given as an array of digits, most significant first, with no leading zeros. Add one to it and return the resulting digits.

**Constraints**
- `1 <= digits.length <= 100`; `0 <= digits[i] <= 9`

## Hints
- Add from the right. A `9` becomes `0` and carries; anything else just increments and you're done.
- If every digit was `9`, the result has one more digit.

## Solution
Walk from the last digit. A digit less than 9 is incremented and the array returned. A 9 turns into 0 and the carry moves left. If the loop finishes, all digits were 9, so prepend a 1.

```python
class Solution:
    def plusOne(self, digits: List[int]) -> List[int]:
        for i in range(len(digits) - 1, -1, -1):
            if digits[i] < 9:
                digits[i] += 1
                return digits
            digits[i] = 0
        return [1] + digits
```

```javascript
function plusOne(digits) {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;
      return digits;
    }
    digits[i] = 0;
  }
  return [1, ...digits];
}
```

## Tests
```jsonl
{"in": [[1, 2, 3]], "out": [1, 2, 4]}
{"in": [[4, 3, 2, 1]], "out": [4, 3, 2, 2]}
{"in": [[9]], "out": [1, 0]}
{"in": [[0]], "out": [1]}
{"in": [[9, 9, 9]], "out": [1, 0, 0, 0]}
{"in": [[1, 9, 9]], "out": [2, 0, 0]}
{"in": [[8, 9, 9, 9]], "out": [9, 0, 0, 0]}
```
