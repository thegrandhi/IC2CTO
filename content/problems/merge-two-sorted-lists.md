# Merge Two Sorted Lists

```meta
difficulty: Easy
topic: Linked List
tags: two pointers, dummy node
lc: 21
signature: mergeTwoLists(list1: ListNode, list2: ListNode) -> ListNode
time: O(m + n)
space: O(1)
```

You're given the heads of two sorted linked lists. Merge them into **one sorted list** by splicing together their nodes, and return the head of the merged list.

**Constraints**
- Each list has `0` to `50` nodes.
- `-100 <= Node.val <= 100`; both lists are sorted in non-decreasing order.

## Hints
- A **dummy** head node removes the special case of choosing the first node.
- Repeatedly attach the smaller of the two current nodes, then attach whatever remains.

## Solution
Create a dummy node and a `tail` pointer. While both lists have nodes, attach the smaller one to `tail` and advance that list. When one runs out, attach the rest of the other in one step, since it's already sorted. Return `dummy.next`. No new value nodes are allocated.

```python
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next, list1 = list1, list1.next
            else:
                tail.next, list2 = list2, list2.next
            tail = tail.next
        tail.next = list1 or list2
        return dummy.next
```

```javascript
function mergeTwoLists(list1, list2) {
  const dummy = new ListNode();
  let tail = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }
    tail = tail.next;
  }
  tail.next = list1 ?? list2;
  return dummy.next;
}
```

## Tests
```jsonl
{"in": [[1, 2, 4], [1, 3, 4]], "out": [1, 1, 2, 3, 4, 4]}
{"in": [[], []], "out": []}
{"in": [[], [0]], "out": [0]}
{"in": [[5], [1, 2, 3]], "out": [1, 2, 3, 5]}
{"in": [[1, 2, 3], [4, 5, 6]], "out": [1, 2, 3, 4, 5, 6]}
{"in": [[-10, -5, 0, 5], [-7, -6, 10]], "out": [-10, -7, -6, -5, 0, 5, 10]}
{"in": [[2, 2, 2], [2, 2]], "out": [2, 2, 2, 2, 2]}
```
