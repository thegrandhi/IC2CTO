# Top K Frequent Elements

```meta
difficulty: Medium
topic: Arrays & Hashing
tags: bucket sort, heap, counting
lc: 347
signature: topKFrequent(nums: int[], k: int) -> int[]
compare: unordered
time: O(n)
space: O(n)
```

Given an integer array `nums` and an integer `k`, return the `k` **most frequent** elements. You may return them in any order.

The answer is guaranteed to be unique: there is never a tie for the k-th place.

**Constraints**
- `1 <= nums.length <= 10^5`
- `1 <= k <=` number of distinct elements

**Follow-up:** beat O(n log n).

## Hints
- First count how often each value appears.
- Sorting by count is O(n log n). A heap of size k gives O(n log k).
- For O(n), frequencies are at most n, so bucket values by their frequency and read the buckets from the top.

## Solution
Count frequencies with a hash map, then **bucket sort**: `buckets[f]` holds every value that appears exactly `f` times. Walk the buckets from the highest frequency down, collecting values until you have `k`. Counting and bucketing are both linear.

```python
class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        counts = Counter(nums)
        buckets = [[] for _ in range(len(nums) + 1)]
        for value, freq in counts.items():
            buckets[freq].append(value)
        result = []
        for freq in range(len(buckets) - 1, 0, -1):
            for value in buckets[freq]:
                result.append(value)
                if len(result) == k:
                    return result
        return result
```

```javascript
function topKFrequent(nums, k) {
  const counts = new Map();
  for (const x of nums) counts.set(x, (counts.get(x) ?? 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, freq] of counts) buckets[freq].push(value);
  const result = [];
  for (let f = buckets.length - 1; f > 0 && result.length < k; f--) {
    for (const value of buckets[f]) {
      result.push(value);
      if (result.length === k) break;
    }
  }
  return result;
}
```

## Tests
```jsonl
{"in": [[1, 1, 1, 2, 2, 3], 2], "out": [1, 2]}
{"in": [[1], 1], "out": [1]}
{"in": [[4, 4, 4, 4, 5, 5, 6, 7, 7, 7], 1], "out": [4]}
{"in": [[-1, -1, 2, 2, 2, 3], 2], "out": [2, -1]}
{"in": [[5, 3, 1, 1, 1, 3, 73, 1], 2], "out": [1, 3]}
{"in": [[1, 2, 3, 4, 5, 5, 6, 6, 6], 2], "out": [6, 5]}
{"in": [[9, 9, 8, 8, 8, 7, 7, 7, 7, 6], 3], "out": [7, 8, 9]}
```
