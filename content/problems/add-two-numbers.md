# Add Two Numbers

```meta
difficulty: Medium
topic: Linked List
tags: carry, dummy node
lc: 2
signature: addTwoNumbers(l1: ListNode, l2: ListNode) -> ListNode
time: O(max(m, n))
space: O(max(m, n))
```

Two non-negative integers are stored as linked lists with their digits in **reverse order** (the ones digit first). Add them and return the sum as a linked list in the same format.

Neither number has leading zeros, except the number 0 itself.

**Constraints**
- Each list has `1` to `100` nodes; `0 <= Node.val <= 9`.

## Hints
- This is grade-school addition, column by column, starting from the ones place, which is exactly the list order.
- Keep going while either list has digits **or** there's a carry left.

## Solution
Walk both lists together with a `carry`. At each step, add the two digits (0 if a list has ended) plus the carry. Append `total % 10` and set `carry = total // 10`. The loop condition includes `carry` so a final carry (like `5 + 5 = 10`) produces a new node.

```python
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = tail = ListNode()
        carry = 0
        while l1 or l2 or carry:
            total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next
```

```javascript
function addTwoNumbers(l1, l2) {
  const dummy = new ListNode();
  let tail = dummy;
  let carry = 0;
  while (l1 || l2 || carry) {
    const total = carry + (l1 ? l1.val : 0) + (l2 ? l2.val : 0);
    carry = Math.floor(total / 10);
    tail.next = new ListNode(total % 10);
    tail = tail.next;
    l1 = l1 ? l1.next : null;
    l2 = l2 ? l2.next : null;
  }
  return dummy.next;
}
```

## Tests
```jsonl
{"in": [[2, 4, 3], [5, 6, 4]], "out": [7, 0, 8], "why": "342 + 465 = 807."}
{"in": [[0], [0]], "out": [0]}
{"in": [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], "out": [8, 9, 9, 9, 0, 0, 0, 1]}
{"in": [[5], [5]], "out": [0, 1]}
{"in": [[1, 8], [0]], "out": [1, 8]}
{"in": [[9], [1, 9, 9]], "out": [0, 0, 0, 1]}
{"in": [[3, 2, 1], [6, 5, 4]], "out": [9, 7, 5]}
```
