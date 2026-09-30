# Subsets

```meta
difficulty: Medium
topic: Backtracking
tags: power set, recursion
lc: 78
signature: subsets(nums: int[]) -> int[][]
compare: unorderedDeep
time: O(n · 2^n)
space: O(n) recursion
```

Given an array of **unique** integers, return all possible **subsets** (the power set). The result must not contain duplicate subsets. Subsets can be returned in any order.

**Constraints**
- `1 <= nums.length <= 10`; all values are unique.

## Hints
- Every element is either in a subset or not: 2 choices each, 2ⁿ subsets.
- Backtrack: at index `i`, first include `nums[i]` and recurse, then exclude it and recurse.
- Iteratively: start with `[[]]` and for each number add it to a copy of every existing subset.

## Solution
Make an include/exclude decision per element. The recursion reaches index `n` once per subset and records a copy of the current path. The iterative version is just as short: each new number doubles the list by appending itself to every subset built so far.

```python
class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        result = []
        path = []

        def backtrack(i):
            if i == len(nums):
                result.append(path[:])
                return
            path.append(nums[i])
            backtrack(i + 1)
            path.pop()
            backtrack(i + 1)

        backtrack(0)
        return result
```

```javascript
function subsets(nums) {
  let result = [[]];
  for (const x of nums) result = result.concat(result.map((s) => [...s, x]));
  return result;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3]], "out": [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]}
{"in": [[0]], "out": [[], [0]]}
{"in": [[5, -1]], "out": [[5, -1], [5], [-1], []]}
{"in": [[1, 2, 3, 4]], "out": [[1, 2, 3, 4], [1, 2, 3], [1, 2, 4], [1, 2], [1, 3, 4], [1, 3], [1, 4], [1], [2, 3, 4], [2, 3], [2, 4], [2], [3, 4], [3], [4], []]}
{"in": [[9, 0, 3, 5, 7]], "out": [[9, 0, 3, 5, 7], [9, 0, 3, 5], [9, 0, 3, 7], [9, 0, 3], [9, 0, 5, 7], [9, 0, 5], [9, 0, 7], [9, 0], [9, 3, 5, 7], [9, 3, 5], [9, 3, 7], [9, 3], [9, 5, 7], [9, 5], [9, 7], [9], [0, 3, 5, 7], [0, 3, 5], [0, 3, 7], [0, 3], [0, 5, 7], [0, 5], [0, 7], [0], [3, 5, 7], [3, 5], [3, 7], [3], [5, 7], [5], [7], []]}
```
