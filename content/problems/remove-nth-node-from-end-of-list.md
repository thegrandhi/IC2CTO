# Remove Nth Node From End of List

```meta
difficulty: Medium
topic: Linked List
tags: two pointers, dummy node
lc: 19
signature: removeNthFromEnd(head: ListNode, n: int) -> ListNode
time: O(length)
space: O(1)
```

Given the `head` of a linked list, remove the `n`-th node **from the end** and return the head.

**Constraints**
- The list has `sz` nodes, `1 <= sz <= 30`.
- `1 <= n <= sz`

**Follow-up:** do it in one pass.

## Hints
- Two pointers `n` nodes apart: when the leading one reaches the end, where is the trailing one?
- Start both at a dummy node before `head` so removing the head itself isn't a special case.

## Solution
Put a dummy node before `head`. Advance `fast` `n + 1` steps from the dummy, then move `fast` and `slow` together until `fast` falls off the end. Now `slow` sits just before the node to delete, so splice it out with `slow.next = slow.next.next`. Return `dummy.next`, which handles deleting the head.

```python
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        slow = fast = dummy
        for _ in range(n + 1):
            fast = fast.next
        while fast:
            slow, fast = slow.next, fast.next
        slow.next = slow.next.next
        return dummy.next
```

```javascript
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let slow = dummy;
  let fast = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) {
    slow = slow.next;
    fast = fast.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4, 5], 2], "out": [1, 2, 3, 5]}
{"in": [[1], 1], "out": []}
{"in": [[1, 2], 1], "out": [1]}
{"in": [[1, 2], 2], "out": [2]}
{"in": [[1, 2, 3, 4, 5], 5], "out": [2, 3, 4, 5]}
{"in": [[1, 2, 3, 4, 5], 1], "out": [1, 2, 3, 4]}
{"in": [[9, 8, 7, 6], 3], "out": [9, 7, 6]}
```
