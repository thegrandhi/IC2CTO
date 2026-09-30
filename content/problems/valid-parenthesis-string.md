# Valid Parenthesis String

```meta
difficulty: Medium
topic: Greedy
tags: range of balances
lc: 678
signature: checkValidString(s: string) -> bool
time: O(n)
space: O(1)
```

Given a string of `(`, `)` and `*`, return `true` if it's **valid**. Each `*` can act as `(`, as `)`, or as an empty string. A valid string closes every `(` with a later `)` and never closes more than it has opened.

**Constraints**
- `1 <= s.length <= 100`

## Hints
- Instead of trying every choice for each `*`, track the **range** of possible open-bracket counts.
- `(` raises both bounds; `)` lowers both; `*` lowers the low bound and raises the high bound.

## Solution
Keep `lo` and `hi`, the minimum and maximum number of unmatched `(` achievable so far. `(`: both +1. `)`: both −1. `*`: `lo − 1`, `hi + 1`. If `hi` drops below 0, there are too many `)` even using every `*` as `(`, so fail. Clamp `lo` at 0, since a negative count means we'd pick a different option for some `*`. At the end, the string is valid if `lo == 0`.

```python
class Solution:
    def checkValidString(self, s: str) -> bool:
        lo = hi = 0
        for ch in s:
            if ch == "(":
                lo, hi = lo + 1, hi + 1
            elif ch == ")":
                lo, hi = lo - 1, hi - 1
            else:
                lo, hi = lo - 1, hi + 1
            if hi < 0:
                return False
            lo = max(lo, 0)
        return lo == 0
```

```javascript
function checkValidString(s) {
  let lo = 0;
  let hi = 0;
  for (const ch of s) {
    lo += ch === '(' ? 1 : -1;
    hi += ch === ')' ? -1 : 1;
    if (hi < 0) return false;
    lo = Math.max(lo, 0);
  }
  return lo === 0;
}
```

## Tests
```jsonl
{"in": ["()"], "out": true}
{"in": ["(*)"], "out": true}
{"in": ["(*))"], "out": true}
{"in": [")("], "out": false}
{"in": ["(((*)"], "out": false}
{"in": ["*)"], "out": true}
{"in": ["((*)"], "out": true}
{"in": ["(*()"], "out": true}
{"in": ["((((()(()()()*()(((((*)()*(**(())))))(())()())(((())())())))))))(((((())*)))()))(()((*()*(*)))(*)()"], "out": true}
```
