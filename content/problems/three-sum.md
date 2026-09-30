# 3Sum

```meta
difficulty: Medium
topic: Two Pointers
tags: sorting
lc: 15
signature: threeSum(nums: int[]) -> int[][]
compare: unorderedDeep
time: O(n²)
space: O(1) extra (ignoring sort)
```

Given an integer array `nums`, return all **unique** triplets `[a, b, c]` taken from three different positions such that `a + b + c == 0`.

The result must not contain duplicate triplets. Triplets and the numbers inside them can be in any order.

**Constraints**
- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`

## Hints
- Fix the first number `a`. Then you need two numbers summing to `-a`, which is Two Sum.
- If the array is sorted, the "two sum" part can be done with two pointers.
- To avoid duplicates, skip over equal neighbours, both for the fixed number and after finding a match.

## Solution
Sort the array. For each index `i`, run the sorted two-pointer search on the rest of the array for pairs that sum to `-nums[i]`. Skip `i` when `nums[i] == nums[i-1]`. After a match, advance `lo` past repeated values. Once `nums[i] > 0` no triplet can sum to zero, so stop. The total is O(n²).

```python
class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        result = []
        for i in range(len(nums) - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            lo, hi = i + 1, len(nums) - 1
            while lo < hi:
                total = nums[i] + nums[lo] + nums[hi]
                if total < 0:
                    lo += 1
                elif total > 0:
                    hi -= 1
                else:
                    result.append([nums[i], nums[lo], nums[hi]])
                    lo += 1
                    while lo < hi and nums[lo] == nums[lo - 1]:
                        lo += 1
                    hi -= 1
        return result
```

```javascript
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let lo = i + 1;
    let hi = nums.length - 1;
    while (lo < hi) {
      const total = nums[i] + nums[lo] + nums[hi];
      if (total < 0) lo++;
      else if (total > 0) hi--;
      else {
        result.push([nums[i], nums[lo], nums[hi]]);
        lo++;
        while (lo < hi && nums[lo] === nums[lo - 1]) lo++;
        hi--;
      }
    }
  }
  return result;
}
```

## Tests
```jsonl
{"in": [[-1, 0, 1, 2, -1, -4]], "out": [[-1, -1, 2], [-1, 0, 1]]}
{"in": [[0, 1, 1]], "out": []}
{"in": [[0, 0, 0]], "out": [[0, 0, 0]]}
{"in": [[0, 0, 0, 0]], "out": [[0, 0, 0]]}
{"in": [[-2, 0, 1, 1, 2]], "out": [[-2, 0, 2], [-2, 1, 1]]}
{"in": [[3, 0, -2, -1, 1, 2]], "out": [[-2, -1, 3], [-2, 0, 2], [-1, 0, 1]]}
{"in": [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], "out": [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]]}
{"in": [[1, 2, 3]], "out": []}
```
