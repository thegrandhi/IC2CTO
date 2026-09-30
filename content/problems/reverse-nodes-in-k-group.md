# Reverse Nodes in k-Group

```meta
difficulty: Hard
topic: Linked List
tags: reverse, dummy node
lc: 25
signature: reverseKGroup(head: ListNode, k: int) -> ListNode
time: O(n)
space: O(1)
```

Given the head of a linked list, reverse the nodes **`k` at a time** and return the modified list. If the number of remaining nodes at the end is less than `k`, leave them as they are.

Rearrange the nodes themselves; don't just swap values.

**Constraints**
- The number of nodes is `n`, `1 <= k <= n <= 5000`.

## Hints
- Before reversing a group, check that `k` nodes remain.
- Keep a pointer to the node **before** the group. After reversing, it must point to the group's new first node, and the group's old first node (now last) must point onward.

## Solution
Use a dummy node and a `groupPrev` pointer. For each group, walk `k` steps to find the group's `kth` node; stop if there aren't enough. Reverse the group in place, starting the "previous" pointer at `kth.next` so the reversed group already links to the rest. Then connect `groupPrev.next` to `kth` and move `groupPrev` to the old first node.

```python
class Solution:
    def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        dummy = ListNode(0, head)
        group_prev = dummy
        while True:
            kth = group_prev
            for _ in range(k):
                kth = kth.next
                if not kth:
                    return dummy.next
            group_next = kth.next
            prev, cur = group_next, group_prev.next
            while cur is not group_next:
                cur.next, prev, cur = prev, cur, cur.next
            first = group_prev.next
            group_prev.next = kth
            group_prev = first
```

```javascript
function reverseKGroup(head, k) {
  const dummy = new ListNode(0, head);
  let groupPrev = dummy;
  for (;;) {
    let kth = groupPrev;
    for (let i = 0; i < k; i++) {
      kth = kth.next;
      if (!kth) return dummy.next;
    }
    const groupNext = kth.next;
    let prev = groupNext;
    let cur = groupPrev.next;
    while (cur !== groupNext) {
      const next = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    const first = groupPrev.next;
    groupPrev.next = kth;
    groupPrev = first;
  }
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 4, 5], 2], "out": [2, 1, 4, 3, 5]}
{"in": [[1, 2, 3, 4, 5], 3], "out": [3, 2, 1, 4, 5]}
{"in": [[1], 1], "out": [1]}
{"in": [[1, 2, 3, 4], 4], "out": [4, 3, 2, 1]}
{"in": [[1, 2, 3, 4, 5, 6], 3], "out": [3, 2, 1, 6, 5, 4]}
{"in": [[1, 2, 3, 4, 5, 6, 7], 1], "out": [1, 2, 3, 4, 5, 6, 7]}
{"in": [[1, 2, 3, 4, 5, 6, 7, 8], 3], "out": [3, 2, 1, 6, 5, 4, 7, 8]}
```
