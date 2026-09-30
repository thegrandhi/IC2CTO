# Happy Number

```meta
difficulty: Easy
topic: Math & Geometry
tags: cycle detection, digits
lc: 202
signature: isHappy(n: int) -> bool
time: O(log n)
space: O(1)
```

Starting with a positive integer `n`, repeatedly replace it with the **sum of the squares of its digits**. If this process reaches `1`, the number is **happy**. Otherwise it loops forever in a cycle that doesn't include 1.

Return `true` if `n` is happy.

**Constraints**
- `1 <= n <= 2^31 - 1`

## Hints
- The sequence must eventually repeat. How do you detect a repeat?
- A set of seen values works. Floyd's slow/fast pointers use O(1) space.

## Solution
Generate the sequence and detect the cycle. With **Floyd's algorithm**, `slow` takes one step and `fast` two. If `fast` reaches 1, the number is happy. If they meet anywhere else, it's stuck in a cycle. Every number quickly drops below 243 (the digit-square sum of 999), so this runs fast.

```python
class Solution:
    def isHappy(self, n: int) -> bool:
        def step(x):
            return sum(int(d) ** 2 for d in str(x))

        slow, fast = n, step(n)
        while fast != 1 and slow != fast:
            slow = step(slow)
            fast = step(step(fast))
        return fast == 1
```

```javascript
function isHappy(n) {
  const step = (x) => {
    let s = 0;
    for (; x > 0; x = Math.floor(x / 10)) s += (x % 10) ** 2;
    return s;
  };
  const seen = new Set();
  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = step(n);
  }
  return n === 1;
}
```

## Tests
```jsonl
{"in": [19], "out": true, "why": "1² + 9² = 82 → 68 → 100 → 1"}
{"in": [2], "out": false}
{"in": [1], "out": true}
{"in": [7], "out": true}
{"in": [4], "out": false}
{"in": [2147483647], "out": false}
{"in": [100], "out": true}
```
