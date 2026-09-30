# Two Sum II - Sorted Input

```meta
difficulty: Medium
topic: Two Pointers
tags: sorted array
lc: 167
signature: twoSum(numbers: int[], target: int) -> int[]
time: O(n)
space: O(1)
```

You're given a **1-indexed** array `numbers` sorted in non-decreasing order. Find two numbers that add up to `target` and return their indices `[index1, index2]` with `1 <= index1 < index2`.

There is exactly one solution, and you may not use the same element twice. Use only **constant extra space**.

**Constraints**
- `2 <= numbers.length <= 3 * 10^4`
- `-1000 <= numbers[i] <= 1000`, sorted ascending
- Exactly one solution exists.

## Hints
- The array is sorted. If the sum of the two ends is too big, which end should move?
- Start with pointers at both ends and move one inward based on how the sum compares to the target.

## Solution
Start with `lo` at the smallest value and `hi` at the largest. If their sum is too small, the only way to grow it is to move `lo` right. If it's too large, move `hi` left. The pointers can never skip past the answer, so this finds it in one pass with O(1) space. Remember the 1-based output.

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        lo, hi = 0, len(numbers) - 1
        while lo < hi:
            total = numbers[lo] + numbers[hi]
            if total == target:
                return [lo + 1, hi + 1]
            if total < target:
                lo += 1
            else:
                hi -= 1
        return []
```

```javascript
function twoSum(numbers, target) {
  let lo = 0;
  let hi = numbers.length - 1;
  while (lo < hi) {
    const total = numbers[lo] + numbers[hi];
    if (total === target) return [lo + 1, hi + 1];
    if (total < target) lo++;
    else hi--;
  }
  return [];
}
```

## Tests
```jsonl
{"in": [[2, 7, 11, 15], 9], "out": [1, 2]}
{"in": [[2, 3, 4], 6], "out": [1, 3]}
{"in": [[-1, 0], -1], "out": [1, 2]}
{"in": [[1, 2, 3, 4, 4, 9, 56, 90], 8], "out": [4, 5]}
{"in": [[-10, -5, 0, 3, 8, 12], 7], "out": [2, 6]}
{"in": [[5, 25, 75], 100], "out": [2, 3]}
{"in": [[1, 3, 5, 7, 9, 11, 13, 15], 28], "out": [7, 8]}
```
