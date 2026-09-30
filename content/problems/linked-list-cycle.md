# Linked List Cycle

```meta
difficulty: Easy
topic: Linked List
tags: fast and slow pointers
lc: 141
signature: hasCycle(head: ListNodeCycle) -> bool
time: O(n)
space: O(1)
```

Given the `head` of a linked list, return `true` if the list contains a **cycle**: some node can be reached again by following `next` pointers.

In the tests, the input is written as `[values, pos]`, where `pos` is the index of the node that the tail points back to (`-1` means no cycle). `pos` is only used to build the list; your function receives just `head`.

**Constraints**
- The number of nodes is in `[0, 10^4]`.

**Follow-up:** can you solve it with O(1) memory?

## Hints
- A set of visited nodes works but uses O(n) memory.
- Two runners on a circular track: if one moves twice as fast, will they meet?

## Solution
**Floyd's tortoise and hare.** Move `slow` one step and `fast` two steps at a time. Without a cycle, `fast` reaches the end. With a cycle, `fast` enters the loop and gains one node on `slow` each step, so they must meet. O(1) space.

```python
class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False
```

```javascript
function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

## Tests
```jsonl
{"in": [[[3, 2, 0, -4], 1]], "out": true, "why": "The tail connects back to the node at index 1."}
{"in": [[[1, 2], 0]], "out": true}
{"in": [[[1], -1]], "out": false}
{"in": [[[], -1]], "out": false}
{"in": [[[1], 0]], "out": true}
{"in": [[[1, 2, 3, 4, 5, 6], -1]], "out": false}
{"in": [[[1, 2, 3, 4, 5, 6], 5]], "out": true}
{"in": [[[1, 2, 3, 4, 5, 6], 2]], "out": true}
```
