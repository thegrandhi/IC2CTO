# Container With Most Water

```meta
difficulty: Medium
topic: Two Pointers
tags: greedy
lc: 11
signature: maxArea(height: int[]) -> int
time: O(n)
space: O(1)
```

You're given `n` vertical lines; line `i` stands at x-coordinate `i` with height `height[i]`. Pick two lines that, together with the x-axis, form a container, and return the **maximum amount of water** it can hold.

The water level is limited by the shorter line, so a container between `i` and `j` holds `min(height[i], height[j]) * (j - i)`.

**Constraints**
- `2 <= n <= 10^5`
- `0 <= height[i] <= 10^4`

## Hints
- Start with the widest container: the two outermost lines.
- Moving the taller line inward can never help: the width shrinks and the height stays capped by the shorter line. Which pointer should move?

## Solution
Start with pointers at both ends. At each step, record the area, then move the pointer at the **shorter** line inward. Any container that keeps that shorter line and is narrower is at most as tall, so it can't beat the current one, and it's safe to discard. That gives one O(n) pass.

```python
class Solution:
    def maxArea(self, height: List[int]) -> int:
        lo, hi = 0, len(height) - 1
        best = 0
        while lo < hi:
            best = max(best, min(height[lo], height[hi]) * (hi - lo))
            if height[lo] < height[hi]:
                lo += 1
            else:
                hi -= 1
        return best
```

```javascript
function maxArea(height) {
  let lo = 0;
  let hi = height.length - 1;
  let best = 0;
  while (lo < hi) {
    best = Math.max(best, Math.min(height[lo], height[hi]) * (hi - lo));
    if (height[lo] < height[hi]) lo++;
    else hi--;
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[1, 8, 6, 2, 5, 4, 8, 3, 7]], "out": 49, "why": "Lines at x=1 (height 8) and x=8 (height 7): min(8, 7) * 7 = 49."}
{"in": [[1, 1]], "out": 1}
{"in": [[4, 3, 2, 1, 4]], "out": 16}
{"in": [[1, 2, 1]], "out": 2}
{"in": [[0, 0, 0, 0]], "out": 0}
{"in": [[2, 3, 10, 5, 7, 8, 9]], "out": 36}
{"in": [[1, 3, 2, 5, 25, 24, 5]], "out": 24}
```
