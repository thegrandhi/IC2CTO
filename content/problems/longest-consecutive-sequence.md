# Longest Consecutive Sequence

```meta
difficulty: Medium
topic: Arrays & Hashing
tags: hash set
lc: 128
signature: longestConsecutive(nums: int[]) -> int
time: O(n)
space: O(n)
```

Given an unsorted array of integers `nums`, return the length of the longest run of **consecutive integers** (like `4, 5, 6, 7`) whose values all appear in `nums`. The values can be anywhere in the array.

Your algorithm must run in **O(n)** time.

**Constraints**
- `0 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## Hints
- Sorting gives O(n log n). What does a hash set let you ask in O(1)?
- A number starts a sequence only if `x - 1` is **not** in the set. Count upward only from those starts.

## Solution
Put every number in a set. For each `x` that starts a sequence (`x - 1` is absent), count how far `x + 1, x + 2, …` continues. Each number is visited by at most one of these upward walks, so the total work is O(n) despite the nested loop.

```python
class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        values = set(nums)
        best = 0
        for x in values:
            if x - 1 not in values:
                length = 1
                while x + length in values:
                    length += 1
                best = max(best, length)
        return best
```

```javascript
function longestConsecutive(nums) {
  const values = new Set(nums);
  let best = 0;
  for (const x of values) {
    if (!values.has(x - 1)) {
      let length = 1;
      while (values.has(x + length)) length++;
      best = Math.max(best, length);
    }
  }
  return best;
}
```

## Tests
```jsonl
{"in": [[100, 4, 200, 1, 3, 2]], "out": 4, "why": "The run is 1, 2, 3, 4."}
{"in": [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], "out": 9}
{"in": [[]], "out": 0}
{"in": [[1, 0, 1, 2]], "out": 3}
{"in": [[5]], "out": 1}
{"in": [[-3, -2, -1, 10, 11]], "out": 3}
{"in": [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], "out": 7}
{"in": [[1000000000, -1000000000]], "out": 1}
```
