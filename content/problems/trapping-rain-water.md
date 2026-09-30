# Trapping Rain Water

```meta
difficulty: Hard
topic: Two Pointers
tags: prefix max, monotonic stack
lc: 42
signature: trap(height: int[]) -> int
time: O(n)
space: O(1)
```

Given `n` non-negative integers describing an elevation map where each bar has width `1`, compute how much rain water is trapped between the bars after it rains.

**Constraints**
- `1 <= n <= 2 * 10^4`
- `0 <= height[i] <= 10^5`

## Hints
- How much water sits above bar `i`? It depends on the tallest bar to its left and the tallest bar to its right.
- `water[i] = min(maxLeft[i], maxRight[i]) - height[i]`. Prefix/suffix max arrays give O(n) time and O(n) space.
- For O(1) space, use two pointers: the side with the smaller running max is the one whose water level you already know.

## Solution
The water above index `i` is `min(maxLeft, maxRight) - height[i]`. With two pointers, keep `leftMax` and `rightMax`. If `leftMax < rightMax`, the left bar's water level is decided by `leftMax`, because something at least as tall exists on the right. So add `leftMax - height[lo]` and move `lo`. Otherwise do the symmetric thing on the right.

```python
class Solution:
    def trap(self, height: List[int]) -> int:
        lo, hi = 0, len(height) - 1
        left_max = right_max = 0
        water = 0
        while lo < hi:
            left_max = max(left_max, height[lo])
            right_max = max(right_max, height[hi])
            if left_max < right_max:
                water += left_max - height[lo]
                lo += 1
            else:
                water += right_max - height[hi]
                hi -= 1
        return water
```

```javascript
function trap(height) {
  let lo = 0;
  let hi = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (lo < hi) {
    leftMax = Math.max(leftMax, height[lo]);
    rightMax = Math.max(rightMax, height[hi]);
    if (leftMax < rightMax) {
      water += leftMax - height[lo];
      lo++;
    } else {
      water += rightMax - height[hi];
      hi--;
    }
  }
  return water;
}
```

## Tests
```jsonl
{"in": [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], "out": 6}
{"in": [[4, 2, 0, 3, 2, 5]], "out": 9}
{"in": [[1]], "out": 0}
{"in": [[3, 0, 3]], "out": 3}
{"in": [[1, 2, 3, 4, 5]], "out": 0}
{"in": [[5, 4, 1, 2]], "out": 1}
{"in": [[5, 2, 1, 2, 1, 5]], "out": 14}
{"in": [[0, 7, 1, 4, 6, 0, 2, 9, 1, 3]], "out": 24}
```
