# Reverse Linked List

```meta
difficulty: Easy
topic: Linked List
tags: pointers, recursion
lc: 206
signature: reverseList(head: ListNode) -> ListNode
time: O(n)
space: O(1)
```

Given the `head` of a singly linked list, reverse the list and return the new head.

**Constraints**
- The number of nodes is in the range `[0, 5000]`.
- `-5000 <= Node.val <= 5000`

**Follow-up:** can you do it both iteratively and recursively?

## Hints
- Walk the list once. For each node you need to know three things: the previous node, the current node, and the next node.
- Save `next` before you overwrite `cur.next = prev`, or you'll lose the rest of the list.

## Solution
Iterate with two pointers. `prev` starts as `null`, and each step flips `cur.next` to point backwards. When `cur` falls off the end, `prev` is the new head. The recursive version reverses the rest of the list and then hooks the current node onto its tail, using O(n) stack space.

```python
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        cur = head
        while cur:
            nxt = cur.next
            cur.next = prev
            prev, cur = cur, nxt
        return prev
```

```javascript
function reverseList(head) {
  let prev = null;
  let cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4, 5]], "out": [5, 4, 3, 2, 1]}
{"in": [[1, 2]], "out": [2, 1]}
{"in": [[]], "out": []}
{"in": [[7]], "out": [7]}
{"in": [[-5000, 0, 5000]], "out": [5000, 0, -5000]}
{"in": [[1, 1, 2, 2, 3, 3]], "out": [3, 3, 2, 2, 1, 1]}
```
