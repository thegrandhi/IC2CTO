# Reorder List

```meta
difficulty: Medium
topic: Linked List
tags: fast and slow pointers, reverse
lc: 143
signature: reorderList(head: ListNode) -> void
mutates: head
time: O(n)
space: O(1)
```

Given a singly linked list `L0 → L1 → … → Ln-1 → Ln`, reorder it **in place** to:

`L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …`

Change the links between nodes, not the values. The function returns nothing; the list starting at `head` is checked.

**Constraints**
- The number of nodes is in `[1, 5 * 10^4]`.

## Hints
- The result interleaves the first half with the **reversed** second half.
- Find the middle with slow/fast pointers, reverse the second half, then merge the two halves alternately.

## Solution
Three classic moves. (1) Find the middle with slow/fast pointers and cut the list there. (2) Reverse the second half. (3) Weave the halves together: first-half node, second-half node, and so on. Each step is linear and uses only pointers.

```python
class Solution:
    def reorderList(self, head: Optional[ListNode]) -> None:
        slow = fast = head
        while fast.next and fast.next.next:
            slow = slow.next
            fast = fast.next.next
        second = slow.next
        slow.next = None
        prev = None
        while second:
            second.next, prev, second = prev, second, second.next
        first, second = head, prev
        while second:
            first.next, first = second, first.next
            second.next, second = first, second.next
```

```javascript
function reorderList(head) {
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second) {
    const next = second.next;
    second.next = prev;
    prev = second;
    second = next;
  }
  let first = head;
  second = prev;
  while (second) {
    const n1 = first.next;
    const n2 = second.next;
    first.next = second;
    second.next = n1;
    first = n1;
    second = n2;
  }
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4]], "out": [1, 4, 2, 3]}
{"in": [[1, 2, 3, 4, 5]], "out": [1, 5, 2, 4, 3]}
{"in": [[1]], "out": [1]}
{"in": [[1, 2]], "out": [1, 2]}
{"in": [[1, 2, 3]], "out": [1, 3, 2]}
{"in": [[10, 20, 30, 40, 50, 60, 70, 80]], "out": [10, 80, 20, 70, 30, 60, 40, 50]}
```
