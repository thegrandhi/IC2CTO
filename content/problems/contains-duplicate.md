# Contains Duplicate

```meta
difficulty: Easy
topic: Arrays & Hashing
tags: hash set
lc: 217
signature: containsDuplicate(nums: int[]) -> bool
time: O(n)
space: O(n)
```

Given an integer array `nums`, return `true` if any value appears **at least twice**, and `false` if every element is distinct.

**Constraints**
- `1 <= nums.length <= 10^5`
- `-10^9 <= nums[i] <= 10^9`

## Hints
- Comparing every pair is O(n²). Can you remember what you've already seen?
- A hash set answers "have I seen this value?" in O(1).

## Solution
Walk the array and keep a set of values seen so far. The moment you meet a value that's already in the set, you've found a duplicate. Sorting first and comparing neighbours also works, in O(n log n) time and O(1) extra space.

```python
class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        seen = set()
        for x in nums:
            if x in seen:
                return True
            seen.add(x)
        return False
```

```javascript
function containsDuplicate(nums) {
  const seen = new Set();
  for (const x of nums) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 1]], "out": true}
{"in": [[1, 2, 3, 4]], "out": false}
{"in": [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], "out": true}
{"in": [[7]], "out": false}
{"in": [[-1, 1]], "out": false}
{"in": [[0, 0]], "out": true}
{"in": [[1000000000, -1000000000, 999999999, 1000000000]], "out": true}
{"in": [[5, 4, 3, 2, 1, 0, -1, -2, -3]], "out": false}
```
