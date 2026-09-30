# Daily Temperatures

```meta
difficulty: Medium
topic: Stack
tags: monotonic stack
lc: 739
signature: dailyTemperatures(temperatures: int[]) -> int[]
time: O(n)
space: O(n)
```

Given daily temperatures, return an array `answer` where `answer[i]` is the number of days you have to wait after day `i` to get a **warmer** temperature. If no warmer day follows, `answer[i] = 0`.

**Constraints**
- `1 <= temperatures.length <= 10^5`
- `30 <= temperatures[i] <= 100`

## Hints
- Scanning forward from every day is O(n²).
- Keep the days that are still waiting for a warmer day on a stack. A new temperature resolves every waiting day that is colder.

## Solution
Use a **monotonic decreasing stack** of indices still waiting for a warmer day. For each day `i`, pop every index whose temperature is lower than today's; each of those waited `i - j` days. Then push `i`. Every index is pushed and popped once, so the total is O(n). Indices left on the stack keep their default answer of 0.

```python
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        answer = [0] * len(temperatures)
        stack = []
        for i, t in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < t:
                j = stack.pop()
                answer[j] = i - j
            stack.append(i)
        return answer
```

```javascript
function dailyTemperatures(temperatures) {
  const answer = new Array(temperatures.length).fill(0);
  const stack = [];
  temperatures.forEach((t, i) => {
    while (stack.length && temperatures[stack[stack.length - 1]] < t) {
      const j = stack.pop();
      answer[j] = i - j;
    }
    stack.push(i);
  });
  return answer;
}
```

## Tests
```jsonl
{"in": [[73, 74, 75, 71, 69, 72, 76, 73]], "out": [1, 1, 4, 2, 1, 1, 0, 0]}
{"in": [[30, 40, 50, 60]], "out": [1, 1, 1, 0]}
{"in": [[30, 60, 90]], "out": [1, 1, 0]}
{"in": [[90, 80, 70]], "out": [0, 0, 0]}
{"in": [[50]], "out": [0]}
{"in": [[50, 50, 51]], "out": [2, 1, 0]}
{"in": [[55, 38, 53, 81, 61, 93, 97, 32, 43, 78]], "out": [3, 1, 1, 2, 1, 1, 0, 1, 1, 0]}
```
