# Jump Game

```meta
difficulty: Medium
topic: Greedy
tags: reachability
lc: 55
signature: canJump(nums: int[]) -> bool
time: O(n)
space: O(1)
```

You start at index `0` of `nums`. From index `i` you may jump forward **up to** `nums[i]` positions. Return `true` if you can reach the last index.

**Constraints**
- `1 <= nums.length <= 10^4`; `0 <= nums[i] <= 10^5`

## Hints
- Track the farthest index reachable so far.
- If you ever stand on an index beyond that farthest reach, you're stuck.

## Solution
Scan left to right, keeping `reach`, the farthest index reachable from anything seen so far. If the current index `i` exceeds `reach`, it can't be reached, so return `false`. Otherwise extend `reach = max(reach, i + nums[i])`. If the scan finishes, the end is reachable.

```python
class Solution:
    def canJump(self, nums: List[int]) -> bool:
        reach = 0
        for i, jump in enumerate(nums):
            if i > reach:
                return False
            reach = max(reach, i + jump)
        return True
```

```javascript
function canJump(nums) {
  // Walk backwards: the leftmost index known to reach the end.
  let goal = nums.length - 1;
  for (let i = nums.length - 2; i >= 0; i--) if (i + nums[i] >= goal) goal = i;
  return goal === 0;
}
```

## Tests
```jsonl
{"in": [[2, 3, 1, 1, 4]], "out": true}
{"in": [[3, 2, 1, 0, 4]], "out": false, "why": "Every path lands on index 3, whose jump length is 0."}
{"in": [[0]], "out": true}
{"in": [[0, 1]], "out": false}
{"in": [[1, 0, 1]], "out": false}
{"in": [[2, 0, 0]], "out": true}
{"in": [[1, 1, 2, 0, 0, 3]], "out": false}
```
