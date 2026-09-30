# Koko Eating Bananas

```meta
difficulty: Medium
topic: Binary Search
tags: binary search on answer
lc: 875
signature: minEatingSpeed(piles: int[], h: int) -> int
time: O(n log max(piles))
space: O(1)
```

There are `n` piles of bananas; pile `i` has `piles[i]` bananas. Koko has `h` hours. Each hour she picks one pile and eats `k` bananas from it. If the pile has fewer than `k`, she finishes it and waits out the rest of that hour.

Return the **minimum integer speed `k`** that lets her eat every banana within `h` hours.

**Constraints**
- `1 <= piles.length <= 10^4`
- `piles.length <= h <= 10^9`
- `1 <= piles[i] <= 10^9`

## Hints
- At speed `k`, pile `p` takes `ceil(p / k)` hours. Total time is easy to compute for a given `k`.
- If speed `k` works, every faster speed works too. That monotonic yes/no is what binary search needs.
- Search `k` in `[1, max(piles)]`.

## Solution
**Binary search on the answer.** `hours(k) = Σ ceil(p / k)` is non-increasing in `k`, so find the smallest `k` in `[1, max(piles)]` with `hours(k) <= h`. When `k` works, try slower (`hi = k`); otherwise go faster (`lo = k + 1`). Each check is O(n).

```python
class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        lo, hi = 1, max(piles)
        while lo < hi:
            k = (lo + hi) // 2
            hours = sum((p + k - 1) // k for p in piles)
            if hours <= h:
                hi = k
            else:
                lo = k + 1
        return lo
```

```javascript
function minEatingSpeed(piles, h) {
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const k = Math.floor((lo + hi) / 2);
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / k);
    if (hours <= h) hi = k;
    else lo = k + 1;
  }
  return lo;
}
```

## Tests
```jsonl
{"in": [[3, 6, 7, 11], 8], "out": 4}
{"in": [[30, 11, 23, 4, 20], 5], "out": 30}
{"in": [[30, 11, 23, 4, 20], 6], "out": 23}
{"in": [[1], 1], "out": 1}
{"in": [[1000000000], 2], "out": 500000000}
{"in": [[312884470], 312884469], "out": 2}
{"in": [[5, 5, 5, 5], 20], "out": 1}
{"in": [[2, 2], 2], "out": 2}
```
