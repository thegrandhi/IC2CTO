# Find the Duplicate Number

```meta
difficulty: Medium
topic: Linked List
tags: fast and slow pointers, cycle detection
lc: 287
signature: findDuplicate(nums: int[]) -> int
time: O(n)
space: O(1)
```

`nums` holds `n + 1` integers, each in the range `[1, n]`. Exactly one value is repeated (possibly more than twice). Return that value.

You must **not modify** the array and may use only **O(1) extra space**.

**Constraints**
- `1 <= n <= 10^5`

## Hints
- Treat the array as a function: index `i` points to `nums[i]`. Since every value is a valid index, following the pointers from 0 must eventually loop.
- The duplicate value is where two arrows point to the same node: the **entrance** of the cycle.
- Floyd's algorithm finds a cycle's entrance: after slow and fast meet, restart one pointer from the start and move both one step at a time.

## Solution
View `i → nums[i]` as a linked list. Two indices point to the duplicate value, so the list forms a cycle whose entrance is the answer. **Floyd's algorithm:** move `slow = nums[slow]` and `fast = nums[nums[fast]]` until they meet inside the cycle. Then reset `slow` to 0 and advance both one step at a time. They meet at the entrance. The array is never modified and the extra space is O(1).

```python
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        slow = fast = 0
        while True:
            slow = nums[slow]
            fast = nums[nums[fast]]
            if slow == fast:
                break
        slow = 0
        while slow != fast:
            slow = nums[slow]
            fast = nums[fast]
        return slow
```

```javascript
function findDuplicate(nums) {
  let slow = 0;
  let fast = 0;
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}
```

## Tests
```jsonl
{"in": [[1, 3, 4, 2, 2]], "out": 2}
{"in": [[3, 1, 3, 4, 2]], "out": 3}
{"in": [[3, 3, 3, 3, 3]], "out": 3}
{"in": [[1, 1]], "out": 1}
{"in": [[1, 1, 2]], "out": 1}
{"in": [[2, 5, 9, 6, 9, 3, 8, 9, 7, 1]], "out": 9}
{"in": [[4, 3, 1, 4, 2]], "out": 4}
```
