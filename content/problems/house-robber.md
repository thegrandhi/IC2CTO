# House Robber

```meta
difficulty: Medium
topic: 1-D DP
tags: take or skip
lc: 198
signature: rob(nums: int[]) -> int
time: O(n)
space: O(1)
```

Houses along a street hold `nums[i]` money each. You can't rob **two adjacent** houses (the alarms are linked). Return the maximum amount you can rob.

**Constraints**
- `1 <= nums.length <= 100`; `0 <= nums[i] <= 400`

## Hints
- For each house, either rob it (then skip the previous one) or skip it.
- `best(i) = max(best(i-1), best(i-2) + nums[i])`.

## Solution
Scan the houses keeping two numbers: the best total up to the previous house (`prev`) and up to the one before it (`prev2`). For the current house, `max(prev, prev2 + nums[i])` chooses between skipping it and robbing it. O(n) time, O(1) space.

```python
class Solution:
    def rob(self, nums: List[int]) -> int:
        prev2 = prev = 0
        for x in nums:
            prev2, prev = prev, max(prev, prev2 + x)
        return prev
```

```javascript
function rob(nums) {
  let prev2 = 0;
  let prev = 0;
  for (const x of nums) [prev2, prev] = [prev, Math.max(prev, prev2 + x)];
  return prev;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 1]], "out": 4, "why": "Rob houses 0 and 2: 1 + 3."}
{"in": [[2, 7, 9, 3, 1]], "out": 12}
{"in": [[5]], "out": 5}
{"in": [[2, 1, 1, 2]], "out": 4}
{"in": [[0, 0, 0]], "out": 0}
{"in": [[10, 1, 1, 10, 1, 1, 10]], "out": 30}
{"in": [[4, 1, 2, 7, 5, 3, 1]], "out": 14}
```
