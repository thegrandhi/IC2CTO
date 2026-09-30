# Kth Largest Element in an Array

```meta
difficulty: Medium
topic: Heap / Priority Queue
tags: min-heap, quickselect
lc: 215
signature: findKthLargest(nums: int[], k: int) -> int
time: O(n log k) (heap) or O(n) average (quickselect)
space: O(k)
```

Given an integer array `nums` and an integer `k`, return the `k`-th largest element in sorted order (not the k-th distinct element).

Can you do better than sorting?

**Constraints**
- `1 <= k <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`

## Hints
- A min-heap of size `k` keeps the `k` largest values; its root is the answer.
- **Quickselect**: partition around a pivot like quicksort, but recurse into only the side that contains the answer.

## Solution
**Heap:** push each value into a min-heap and pop whenever it exceeds size `k`. The root is the answer, in O(n log k).

**Quickselect** (JS version): partition around a random pivot into greater / equal / smaller groups. Recurse only into the group that contains the k-th largest. This averages O(n). Three-way partitioning keeps arrays with many duplicates fast.

```python
class Solution:
    def findKthLargest(self, nums: List[int], k: int) -> int:
        heap = []
        for x in nums:
            heappush(heap, x)
            if len(heap) > k:
                heappop(heap)
        return heap[0]
```

```javascript
function findKthLargest(nums, k) {
  let arr = nums;
  for (;;) {
    const pivot = arr[Math.floor(Math.random() * arr.length)];
    const greater = arr.filter((x) => x > pivot);
    const equal = arr.length - greater.length - arr.filter((x) => x < pivot).length;
    if (k <= greater.length) arr = greater;
    else if (k <= greater.length + equal) return pivot;
    else {
      k -= greater.length + equal;
      arr = arr.filter((x) => x < pivot);
    }
  }
}
```

## Tests
```jsonl
{"in": [[3, 2, 1, 5, 6, 4], 2], "out": 5}
{"in": [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], "out": 4}
{"in": [[1], 1], "out": 1}
{"in": [[2, 1], 2], "out": 1}
{"in": [[7, 7, 7, 7], 3], "out": 7}
{"in": [[-1, -5, 3, 0, 2], 5], "out": -5}
{"in": [[10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 7], "out": 4}
```
