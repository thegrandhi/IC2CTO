# Combination Sum II

```meta
difficulty: Medium
topic: Backtracking
tags: duplicates, sorting
lc: 40
signature: combinationSum2(candidates: int[], target: int) -> int[][]
compare: unorderedDeep
time: O(2^n)
space: O(n) recursion
```

Given a collection of candidate numbers (which **may contain duplicates**) and a `target`, find all unique combinations that sum to `target`. Each candidate may be used **at most once**. The result must not contain duplicate combinations.

**Constraints**
- `1 <= candidates.length <= 100`; `1 <= candidates[i] <= 50`
- `1 <= target <= 30`

## Hints
- This is Combination Sum with two twists: no reuse (recurse with `i + 1`) and duplicate inputs.
- Sort, and skip a candidate equal to the previous one at the same recursion level.

## Solution
Sort, then backtrack from index `start`. At each level, skip `candidates[i]` if it equals `candidates[i-1]` and `i > start`, since that branch was already explored. Recurse with `i + 1` because each element is used once. Break early when a candidate exceeds the remaining sum.

```python
class Solution:
    def combinationSum2(self, candidates: List[int], target: int) -> List[List[int]]:
        candidates.sort()
        result = []
        path = []

        def backtrack(start, remaining):
            if remaining == 0:
                result.append(path[:])
                return
            for i in range(start, len(candidates)):
                c = candidates[i]
                if c > remaining:
                    break
                if i > start and c == candidates[i - 1]:
                    continue
                path.append(c)
                backtrack(i + 1, remaining - c)
                path.pop()

        backtrack(0, target)
        return result
```

```javascript
function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const result = [];
  const path = [];
  const backtrack = (start, remaining) => {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length && candidates[i] <= remaining; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      path.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]);
      path.pop();
    }
  };
  backtrack(0, target);
  return result;
}
```

## Tests
```jsonl
{"in": [[10, 1, 2, 7, 6, 1, 5], 8], "out": [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]}
{"in": [[2, 5, 2, 1, 2], 5], "out": [[1, 2, 2], [5]]}
{"in": [[1], 2], "out": []}
{"in": [[1, 1, 1, 1, 1], 3], "out": [[1, 1, 1]]}
{"in": [[3, 1, 3, 5, 1, 1], 8], "out": [[1, 1, 1, 5], [1, 1, 3, 3], [3, 5]]}
{"in": [[4, 4, 2, 1, 4, 2, 2, 1, 3], 6], "out": [[1, 1, 2, 2], [1, 1, 4], [1, 2, 3], [2, 2, 2], [2, 4]]}
```
