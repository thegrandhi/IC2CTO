# Single Number

```meta
difficulty: Easy
topic: Bit Manipulation
tags: xor
lc: 136
signature: singleNumber(nums: int[]) -> int
time: O(n)
space: O(1)
```

Every element of the non-empty array `nums` appears **twice**, except for one element that appears once. Find it, in linear time and constant extra space.

**Constraints**
- `1 <= nums.length <= 3 * 10^4`; `-3 * 10^4 <= nums[i] <= 3 * 10^4`

## Hints
- What is `a ^ a`? What is `a ^ 0`?
- XOR is commutative and associative, so pairs cancel no matter their order.

## Solution
XOR all the numbers together. Each pair cancels (`a ^ a = 0`), and `0 ^ x = x`, so only the unpaired number survives. This works for negative numbers too.

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        result = 0
        for x in nums:
            result ^= x
        return result
```

```javascript
function singleNumber(nums) {
  return nums.reduce((acc, x) => acc ^ x, 0);
}
```

## Tests
```jsonl
{"in": [[2, 2, 1]], "out": 1}
{"in": [[4, 1, 2, 1, 2]], "out": 4}
{"in": [[1]], "out": 1}
{"in": [[-1, -1, -2]], "out": -2}
{"in": [[0, 7, 7]], "out": 0}
{"in": [[30000, -30000, 5, 30000, -30000]], "out": 5}
```
