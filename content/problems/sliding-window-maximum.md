# Sliding Window Maximum

```meta
difficulty: Hard
topic: Sliding Window
tags: monotonic deque
lc: 239
signature: maxSlidingWindow(nums: int[], k: int) -> int[]
time: O(n)
space: O(k)
```

A window of size `k` slides from the left of `nums` to the right, one position at a time. Return an array containing the **maximum** of each window.

**Constraints**
- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <= nums.length`

## Hints
- Recomputing each window's max is O(nk). A heap gives O(n log n). Can you get O(n)?
- If a newer element is larger than an older one, the older one can never be the maximum again. Throw it away.
- Keep a deque of indices whose values are decreasing from front to back.

## Solution
Maintain a **monotonic deque** of indices whose values decrease from front to back. For each new index `i`: pop from the back while the back's value is `<= nums[i]`, since those are dominated forever. Push `i`. Pop the front if it has left the window (`<= i - k`). The front is always the current window's maximum. Every index is pushed and popped at most once, giving O(n).

```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        dq = deque()
        result = []
        for i, x in enumerate(nums):
            while dq and nums[dq[-1]] <= x:
                dq.pop()
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()
            if i >= k - 1:
                result.append(nums[dq[0]])
        return result
```

```javascript
function maxSlidingWindow(nums, k) {
  const dq = []; // indices; values decreasing
  let head = 0;
  const result = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) result.push(nums[dq[head]]);
  }
  return result;
}
```

## Tests
```jsonl
{"in": [[1, 3, -1, -3, 5, 3, 6, 7], 3], "out": [3, 3, 5, 5, 6, 7]}
{"in": [[1], 1], "out": [1]}
{"in": [[1, -1], 1], "out": [1, -1]}
{"in": [[9, 8, 7, 6, 5], 2], "out": [9, 8, 7, 6]}
{"in": [[1, 2, 3, 4, 5], 5], "out": [5]}
{"in": [[4, 4, 4, 2, 4], 2], "out": [4, 4, 4, 4]}
{"in": [[7, 2, 4], 2], "out": [7, 4]}
{"in": [[-7, -8, 7, 5, 7, 1, 6, 0], 4], "out": [7, 7, 7, 7, 7]}
```
