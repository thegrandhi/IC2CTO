# Missing Number

```meta
difficulty: Easy
topic: Bit Manipulation
tags: xor, math
lc: 268
signature: missingNumber(nums: int[]) -> int
time: O(n)
space: O(1)
```

`nums` contains `n` **distinct** numbers taken from the range `[0, n]`. Exactly one number in that range is missing. Return it.

**Constraints**
- `1 <= n <= 10^4`

## Hints
- The sum of `0..n` is `n(n+1)/2`. What's left after subtracting the array's sum?
- Or XOR every index and every value together with `n`: everything cancels except the missing number.

## Solution
XOR `n` with every index `i` and every value `nums[i]`. Each number present appears twice (once as an index or `n`, once as a value) and cancels, leaving the missing one. The sum formula works equally well, and can't overflow in Python.

```python
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        n = len(nums)
        return n * (n + 1) // 2 - sum(nums)
```

```javascript
function missingNumber(nums) {
  let x = nums.length;
  nums.forEach((v, i) => {
    x ^= i ^ v;
  });
  return x;
}
```

## Tests
```jsonl
{"in": [[3, 0, 1]], "out": 2}
{"in": [[0, 1]], "out": 2}
{"in": [[9, 6, 4, 2, 3, 5, 7, 0, 1]], "out": 8}
{"in": [[0]], "out": 1}
{"in": [[1]], "out": 0}
{"in": [[1, 2, 3, 4, 5]], "out": 0}
```
