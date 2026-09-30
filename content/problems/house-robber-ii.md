# House Robber II

```meta
difficulty: Medium
topic: 1-D DP
tags: circular array
lc: 213
signature: rob(nums: int[]) -> int
time: O(n)
space: O(1)
```

Same as House Robber, but the houses are arranged in a **circle**: the first and last houses are neighbours. Return the maximum amount you can rob without robbing two adjacent houses.

**Constraints**
- `1 <= nums.length <= 100`; `0 <= nums[i] <= 1000`

## Hints
- The only new conflict is between the first and last house. You can never rob both.
- So solve the straight-line problem twice: without the last house, and without the first.

## Solution
Break the circle: the answer is the better of robbing `nums[0..n-2]` (excluding the last house) and `nums[1..n-1]` (excluding the first), each solved with the linear House Robber DP. A single house is a special case: take it.

```python
class Solution:
    def rob(self, nums: List[int]) -> int:
        def line(houses):
            prev2 = prev = 0
            for x in houses:
                prev2, prev = prev, max(prev, prev2 + x)
            return prev

        if len(nums) == 1:
            return nums[0]
        return max(line(nums[:-1]), line(nums[1:]))
```

```javascript
function rob(nums) {
  const line = (houses) => {
    let prev2 = 0;
    let prev = 0;
    for (const x of houses) [prev2, prev] = [prev, Math.max(prev, prev2 + x)];
    return prev;
  };
  if (nums.length === 1) return nums[0];
  return Math.max(line(nums.slice(0, -1)), line(nums.slice(1)));
}
```

## Tests
```jsonl
{"in": [[2, 3, 2]], "out": 3}
{"in": [[1, 2, 3, 1]], "out": 4}
{"in": [[1, 2, 3]], "out": 3}
{"in": [[7]], "out": 7}
{"in": [[5, 1]], "out": 5}
{"in": [[200, 3, 140, 20, 10]], "out": 340}
{"in": [[4, 1, 2, 7, 5, 3, 1]], "out": 14}
```
