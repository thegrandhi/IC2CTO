# Permutations

```meta
difficulty: Medium
topic: Backtracking
tags: recursion
lc: 46
signature: permute(nums: int[]) -> int[][]
compare: unordered
time: O(n · n!)
space: O(n) recursion
```

Given an array of **distinct** integers, return all possible **permutations**, in any order.

**Constraints**
- `1 <= nums.length <= 6`; all values are unique.

## Hints
- Build a permutation position by position; at each position try every unused number.
- Track which numbers are used with a boolean array, or swap elements into place.

## Solution
Backtrack over positions. For the next slot, try each number not yet used: mark it, recurse, then unmark. When the path has `n` numbers, record a copy. There are `n!` permutations and copying each costs `n`.

```python
class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        result = []
        path = []
        used = [False] * len(nums)

        def backtrack():
            if len(path) == len(nums):
                result.append(path[:])
                return
            for i, x in enumerate(nums):
                if not used[i]:
                    used[i] = True
                    path.append(x)
                    backtrack()
                    path.pop()
                    used[i] = False

        backtrack()
        return result
```

```javascript
function permute(nums) {
  const result = [];
  const backtrack = (start) => {
    if (start === nums.length) {
      result.push([...nums]);
      return;
    }
    for (let i = start; i < nums.length; i++) {
      [nums[start], nums[i]] = [nums[i], nums[start]];
      backtrack(start + 1);
      [nums[start], nums[i]] = [nums[i], nums[start]];
    }
  };
  backtrack(0);
  return result;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3]], "out": [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]}
{"in": [[0, 1]], "out": [[0, 1], [1, 0]]}
{"in": [[1]], "out": [[1]]}
{"in": [[5, 6, 7, 8]], "out": [[5, 6, 7, 8], [5, 6, 8, 7], [5, 7, 6, 8], [5, 7, 8, 6], [5, 8, 6, 7], [5, 8, 7, 6], [6, 5, 7, 8], [6, 5, 8, 7], [6, 7, 5, 8], [6, 7, 8, 5], [6, 8, 5, 7], [6, 8, 7, 5], [7, 5, 6, 8], [7, 5, 8, 6], [7, 6, 5, 8], [7, 6, 8, 5], [7, 8, 5, 6], [7, 8, 6, 5], [8, 5, 6, 7], [8, 5, 7, 6], [8, 6, 5, 7], [8, 6, 7, 5], [8, 7, 5, 6], [8, 7, 6, 5]]}
{"in": [[-1, 0, 1]], "out": [[-1, 0, 1], [-1, 1, 0], [0, -1, 1], [0, 1, -1], [1, -1, 0], [1, 0, -1]]}
```
