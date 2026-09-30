# Hand of Straights

```meta
difficulty: Medium
topic: Greedy
tags: counting, sorting
lc: 846
signature: isNStraightHand(hand: int[], groupSize: int) -> bool
time: O(n log n)
space: O(n)
```

Alice wants to rearrange her cards into groups of `groupSize` cards where each group is a run of **consecutive** values. Given the card values `hand`, return `true` if that's possible.

**Constraints**
- `1 <= hand.length <= 10^4`; `0 <= hand[i] <= 10^9`; `1 <= groupSize <= hand.length`

## Hints
- The smallest remaining card must be the **start** of some group; nothing smaller can precede it.
- Count the cards. Repeatedly take the smallest value and try to consume `groupSize` consecutive values.

## Solution
Count each value. Process values in increasing order. If value `v` still has `c` copies left, those `c` copies must each start a group `v, v+1, …, v+groupSize-1`, so subtract `c` from each of those counts, failing if any would go negative. The length check `len(hand) % groupSize == 0` is a quick early exit.

```python
class Solution:
    def isNStraightHand(self, hand: List[int], groupSize: int) -> bool:
        if len(hand) % groupSize:
            return False
        counts = Counter(hand)
        for v in sorted(counts):
            c = counts[v]
            if c == 0:
                continue
            for w in range(v, v + groupSize):
                if counts[w] < c:
                    return False
                counts[w] -= c
        return True
```

```javascript
function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize) return false;
  const counts = new Map();
  for (const v of hand) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const v of [...counts.keys()].sort((a, b) => a - b)) {
    const c = counts.get(v);
    if (!c) continue;
    for (let w = v; w < v + groupSize; w++) {
      if ((counts.get(w) ?? 0) < c) return false;
      counts.set(w, counts.get(w) - c);
    }
  }
  return true;
}
```

## Tests
```jsonl
{"in": [[1, 2, 3, 6, 2, 3, 4, 7, 8], 3], "out": true, "why": "[1,2,3], [2,3,4], [6,7,8]"}
{"in": [[1, 2, 3, 4, 5], 4], "out": false}
{"in": [[1], 1], "out": true}
{"in": [[1, 1, 2, 2, 3, 3], 3], "out": true}
{"in": [[1, 2, 4, 5, 6, 7], 3], "out": false}
{"in": [[8, 10, 12], 3], "out": false}
{"in": [[5, 6, 7, 5, 6, 7, 5, 6, 7], 3], "out": true}
```
