# Counting Bits

```meta
difficulty: Easy
topic: Bit Manipulation
tags: dp on bits
lc: 338
signature: countBits(n: int) -> int[]
time: O(n)
space: O(1) extra
```

Given `n`, return an array `ans` of length `n + 1` where `ans[i]` is the number of `1` bits in the binary representation of `i`.

**Constraints**
- `0 <= n <= 10^5`

**Follow-up:** do it in one pass, O(n), without a popcount built-in.

## Hints
- `i >> 1` is `i` with its last bit dropped, and you've already computed its answer.
- `ans[i] = ans[i >> 1] + (i & 1)`.

## Solution
Reuse earlier answers. Shifting `i` right drops its lowest bit, so `bits(i) = bits(i >> 1) + (i & 1)`. Since `i >> 1 < i`, that value is already known. The alternative recurrence `bits(i) = bits(i & (i - 1)) + 1` works too.

```python
class Solution:
    def countBits(self, n: int) -> List[int]:
        ans = [0] * (n + 1)
        for i in range(1, n + 1):
            ans[i] = ans[i >> 1] + (i & 1)
        return ans
```

```javascript
function countBits(n) {
  const ans = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) ans[i] = ans[i & (i - 1)] + 1;
  return ans;
}
```

## Tests
```jsonl
{"in": [2], "out": [0, 1, 1]}
{"in": [5], "out": [0, 1, 1, 2, 1, 2]}
{"in": [0], "out": [0]}
{"in": [1], "out": [0, 1]}
{"in": [16], "out": [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4, 1]}
{"in": [31], "out": [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4, 1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5]}
```
