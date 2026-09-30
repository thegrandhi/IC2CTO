# Two Sum

```meta
difficulty: Easy
topic: Arrays & Hashing
tags: hash map
lc: 1
signature: twoSum(nums: int[], target: int) -> int[]
time: O(n)
space: O(n)
```

Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

Each input has exactly one solution, and you may not use the same element twice. Return the two indices in increasing order.

**Constraints**
- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i], target <= 10^9`
- Exactly one valid answer exists.

## Hints
- The brute force checks every pair in O(n²). For a given `x`, which single value are you looking for?
- If you could look up "have I seen `target - x` before, and where?" in O(1), one pass would be enough.

## Solution
Scan the array once, remembering the index of every value seen so far in a hash map. For each `x`, the partner we need is `target - x`; if it's already in the map, we're done. Checking before inserting guarantees we never pair an element with itself.

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}  # value -> index
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return []
```

```javascript
function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
```

## Tests
```jsonl
{"in": [[2, 7, 11, 15], 9], "out": [0, 1], "why": "nums[0] + nums[1] == 9"}
{"in": [[3, 2, 4], 6], "out": [1, 2]}
{"in": [[3, 3], 6], "out": [0, 1]}
{"in": [[-1, -2, -3, -4, -5], -8], "out": [2, 4]}
{"in": [[0, 4, 3, 0], 0], "out": [0, 3]}
{"in": [[1, 5, 1000000000, -999999995], 5], "out": [2, 3]}
{"in": [[5, 75, 25], 100], "out": [1, 2]}
{"in": [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 19], "out": [8, 9]}
```
