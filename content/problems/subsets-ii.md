# Subsets II

```meta
difficulty: Medium
topic: Backtracking
tags: duplicates, sorting
lc: 90
signature: subsetsWithDup(nums: int[]) -> int[][]
compare: unorderedDeep
time: O(n · 2^n)
space: O(n) recursion
```

Given an integer array `nums` that **may contain duplicates**, return all possible subsets. The result must not contain duplicate subsets; return them in any order.

**Constraints**
- `1 <= nums.length <= 10`

## Hints
- Sort first so equal values sit next to each other.
- When looping over choices at one recursion level, skip a value equal to the previous choice **at that same level**.

## Solution
Sort, then build subsets by choosing the next element to add from index `start` onward. Every node of the recursion is a subset, so record the path on entry. At a given level, if `nums[i] == nums[i-1]` and `i > start`, choosing `nums[i]` would recreate subsets you already produced with `nums[i-1]`, so skip it.

```python
class Solution:
    def subsetsWithDup(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        result = []
        path = []

        def backtrack(start):
            result.append(path[:])
            for i in range(start, len(nums)):
                if i > start and nums[i] == nums[i - 1]:
                    continue
                path.append(nums[i])
                backtrack(i + 1)
                path.pop()

        backtrack(0)
        return result
```

```javascript
function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  const path = [];
  const backtrack = (start) => {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  };
  backtrack(0);
  return result;
}
```

## Tests
```jsonl
{"in": [[1, 2, 2]], "out": [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]}
{"in": [[0]], "out": [[], [0]]}
{"in": [[4, 4, 4, 1, 4]], "out": [[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]]}
{"in": [[1, 1]], "out": [[], [1], [1, 1]]}
{"in": [[3, 1, 2, 1]], "out": [[], [1], [1, 1], [1, 1, 2], [1, 1, 2, 3], [1, 1, 3], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]}
```
