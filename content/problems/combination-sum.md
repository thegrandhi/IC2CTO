# Combination Sum

```meta
difficulty: Medium
topic: Backtracking
tags: unbounded choice
lc: 39
signature: combinationSum(candidates: int[], target: int) -> int[][]
compare: unorderedDeep
time: O(n^(target/min))
space: O(target/min) recursion
```

Given an array of **distinct** positive integers `candidates` and a `target`, return all **unique combinations** of candidates that sum to `target`. Each number may be used **any number of times**. Two combinations are the same if they use each number the same number of times.

Return combinations in any order.

**Constraints**
- `1 <= candidates.length <= 30`; `2 <= candidates[i] <= 40`
- `1 <= target <= 40`

## Hints
- To avoid duplicates like `[2,3]` and `[3,2]`, only choose candidates at or after the current index.
- Since reuse is allowed, recurse with the same index after choosing a number.
- If candidates are sorted, you can stop as soon as one exceeds the remaining target.

## Solution
Sort the candidates and backtrack with `(start, remaining)`. Try each candidate `c` from `start` onward. If it exceeds `remaining`, stop, since later ones are larger. Otherwise add it and recurse with the **same** index, because it can be reused. When `remaining` hits 0, record the path. Starting from `start` keeps each combination in non-decreasing order, so duplicates never appear.

```python
class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
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
                path.append(c)
                backtrack(i, remaining - c)
                path.pop()

        backtrack(0, target)
        return result
```

```javascript
function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);
  const result = [];
  const path = [];
  const backtrack = (start, remaining) => {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length && candidates[i] <= remaining; i++) {
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]);
      path.pop();
    }
  };
  backtrack(0, target);
  return result;
}
```

## Tests
```jsonl
{"in": [[2, 3, 6, 7], 7], "out": [[2, 2, 3], [7]]}
{"in": [[2, 3, 5], 8], "out": [[2, 2, 2, 2], [2, 3, 3], [3, 5]]}
{"in": [[2], 1], "out": []}
{"in": [[7, 3, 2], 18], "out": [[2, 2, 2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 3, 3], [2, 2, 2, 2, 3, 7], [2, 2, 2, 3, 3, 3, 3], [2, 2, 7, 7], [2, 3, 3, 3, 7], [3, 3, 3, 3, 3, 3]]}
{"in": [[3, 4, 5], 12], "out": [[3, 3, 3, 3], [3, 4, 5], [4, 4, 4]]}
{"in": [[8, 7, 4, 3], 11], "out": [[3, 4, 4], [3, 8], [4, 7]]}
```
