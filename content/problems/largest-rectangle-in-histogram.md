# Largest Rectangle in Histogram

```meta
difficulty: Hard
topic: Stack
tags: monotonic stack
lc: 84
signature: largestRectangleArea(heights: int[]) -> int
time: O(n)
space: O(n)
```

Given the heights of a histogram's bars (each of width `1`), return the area of the **largest rectangle** that fits entirely inside the histogram.

**Constraints**
- `1 <= heights.length <= 10^5`
- `0 <= heights[i] <= 10^4`

## Hints
- For each bar, the widest rectangle using that bar's full height stretches left and right until it hits a shorter bar.
- Keep a stack of bars with increasing heights. When a shorter bar arrives, the bars it pops have just found their right boundary.

## Solution
Maintain a stack of indices with **increasing** heights. When bar `i` is shorter than the top, pop the top bar `h`. Its rectangle extends from just after the new stack top up to `i - 1`, so `width = i - stack[-1] - 1`, or `i` if the stack is empty. Appending a sentinel bar of height 0 flushes the stack at the end. Each bar is pushed and popped once.

```python
class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        stack = []
        best = 0
        for i, h in enumerate(heights + [0]):
            while stack and heights[stack[-1]] >= h:
                height = heights[stack.pop()]
                width = i - stack[-1] - 1 if stack else i
                best = max(best, height * width)
            stack.append(i)
        return best
```

```javascript
function largestRectangleArea(heights) {
  const stack = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[2, 1, 5, 6, 2, 3]], "out": 10, "why": "Bars 5 and 6 form a 5 × 2 rectangle."}
{"in": [[2, 4]], "out": 4}
{"in": [[1]], "out": 1}
{"in": [[0, 0]], "out": 0}
{"in": [[2, 2, 2, 2]], "out": 8}
{"in": [[6, 2, 5, 4, 5, 1, 6]], "out": 12}
{"in": [[1, 2, 3, 4, 5]], "out": 9}
{"in": [[5, 4, 1, 2]], "out": 8}
```
