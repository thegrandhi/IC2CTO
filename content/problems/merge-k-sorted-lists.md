# Merge k Sorted Lists

```meta
difficulty: Hard
topic: Linked List
tags: heap, divide and conquer
lc: 23
signature: mergeKLists(lists: ListNode[]) -> ListNode
time: O(N log k)
space: O(k)
```

You're given an array of `k` linked lists, each sorted ascending. Merge them all into one sorted linked list and return its head.

**Constraints**
- `0 <= k <= 10^4`
- Each list has at most `500` nodes; the total `N` is at most `10^4`.

## Hints
- Merging lists one after another is O(N·k). Can you always pick the global minimum quickly?
- Keep the current head of each list in a min-heap.
- Or use divide and conquer: merge lists in pairs, then pairs of pairs, and so on.

## Solution
Push the head of every non-empty list into a **min-heap** keyed by value. Repeatedly pop the smallest node, attach it to the result, and push its successor. The heap never holds more than `k` nodes, so each of the `N` pops/pushes costs O(log k). In Python, add a tie-breaker counter to the tuple because `ListNode`s aren't comparable. The JS version uses pairwise divide-and-conquer merging, which has the same O(N log k) bound.

```python
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        heap = []
        for i, node in enumerate(lists):
            if node:
                heappush(heap, (node.val, i, node))
        dummy = tail = ListNode()
        count = len(lists)
        while heap:
            _, _, node = heappop(heap)
            tail.next = tail = node
            if node.next:
                heappush(heap, (node.next.val, count, node.next))
                count += 1
        return dummy.next
```

```javascript
function mergeKLists(lists) {
  const merge2 = (a, b) => {
    const dummy = new ListNode();
    let tail = dummy;
    while (a && b) {
      if (a.val <= b.val) {
        tail.next = a;
        a = a.next;
      } else {
        tail.next = b;
        b = b.next;
      }
      tail = tail.next;
    }
    tail.next = a ?? b;
    return dummy.next;
  };
  if (!lists.length) return null;
  let current = lists;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) next.push(merge2(current[i], current[i + 1] ?? null));
    current = next;
  }
  return current[0];
}
```

## Tests
```jsonl
{"in": [[[1, 4, 5], [1, 3, 4], [2, 6]]], "out": [1, 1, 2, 3, 4, 4, 5, 6]}
{"in": [[]], "out": []}
{"in": [[[]]], "out": []}
{"in": [[[], [1], []]], "out": [1]}
{"in": [[[5, 10], [1, 2, 3], [4], [6, 7, 8, 9]]], "out": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
{"in": [[[-3, 0, 3], [-2, 2], [-1, 1]]], "out": [-3, -2, -1, 0, 1, 2, 3]}
{"in": [[[1, 1, 1], [1, 1]]], "out": [1, 1, 1, 1, 1]}
```
