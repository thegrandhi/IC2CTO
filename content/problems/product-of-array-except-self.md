# Product of Array Except Self

```meta
difficulty: Medium
topic: Arrays & Hashing
tags: prefix product
lc: 238
signature: productExceptSelf(nums: int[]) -> int[]
time: O(n)
space: O(1) extra
```

Given an integer array `nums`, return an array `answer` where `answer[i]` is the product of every element of `nums` **except** `nums[i]`.

Solve it in **O(n)** time **without using division**.

**Constraints**
- `2 <= nums.length <= 10^5`
- `-30 <= nums[i] <= 30`
- Every prefix and suffix product fits in a 32-bit integer.

**Follow-up:** can you use O(1) extra space (the output array doesn't count)?

## Hints
- `answer[i]` = (product of everything left of `i`) × (product of everything right of `i`).
- Fill the output with prefix products in a forward pass, then multiply in suffix products on a backward pass.

## Solution
Split the product at `i` into a **prefix** (everything to the left) and a **suffix** (everything to the right). A forward pass writes the prefix products into the output. A backward pass keeps a running suffix product and multiplies it in. No division means zeros need no special case.

```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        answer = [1] * n
        prefix = 1
        for i in range(n):
            answer[i] = prefix
            prefix *= nums[i]
        suffix = 1
        for i in range(n - 1, -1, -1):
            answer[i] *= suffix
            suffix *= nums[i]
        return answer
```

```javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const answer = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= suffix;
    suffix *= nums[i];
  }
  return answer.map((x) => x + 0); // normalize -0 to 0
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4]], "out": [24, 12, 8, 6]}
{"in": [[-1, 1, 0, -3, 3]], "out": [0, 0, 9, 0, 0]}
{"in": [[2, 3]], "out": [3, 2]}
{"in": [[0, 0]], "out": [0, 0]}
{"in": [[5, 0, 2]], "out": [0, 10, 0]}
{"in": [[1, 1, 1, 1, 1]], "out": [1, 1, 1, 1, 1]}
{"in": [[-2, -3, 4, -1]], "out": [12, 8, -6, 24]}
{"in": [[10, 3, 5, 6, 2]], "out": [180, 600, 360, 300, 900]}
```
