# Jump Game II

```meta
difficulty: Medium
topic: Greedy
tags: bfs levels
lc: 45
signature: jump(nums: int[]) -> int
time: O(n)
space: O(1)
```

You start at index `0`; from index `i` you can jump forward up to `nums[i]` positions. The last index is always reachable. Return the **minimum number of jumps** to reach it.

**Constraints**
- `1 <= nums.length <= 10^4`; `0 <= nums[i] <= 1000`

## Hints
- Think in "levels": every index reachable with `j` jumps forms a contiguous window.
- The next window extends to the farthest index reachable from anywhere in the current window.

## Solution
An implicit BFS. Keep the current window's right edge `end` and the farthest index reachable from within it, `farthest`. When you reach `end`, you must jump: increment the count and set `end = farthest`. Stop before the last index, since you're already there.

```python
class Solution:
    def jump(self, nums: List[int]) -> int:
        jumps = end = farthest = 0
        for i in range(len(nums) - 1):
            farthest = max(farthest, i + nums[i])
            if i == end:
                jumps += 1
                end = farthest
        return jumps
```

```javascript
function jump(nums) {
  let jumps = 0;
  let end = 0;
  let farthest = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);
    if (i === end) {
      jumps++;
      end = farthest;
    }
  }
  return jumps;
}
```

## Tests
```jsonl
{"in": [[2, 3, 1, 1, 4]], "out": 2}
{"in": [[2, 3, 0, 1, 4]], "out": 2}
{"in": [[0]], "out": 0}
{"in": [[1, 2]], "out": 1}
{"in": [[1, 1, 1, 1]], "out": 3}
{"in": [[10, 1, 1, 1, 1]], "out": 1}
{"in": [[1, 2, 1, 1, 1]], "out": 3}
```
