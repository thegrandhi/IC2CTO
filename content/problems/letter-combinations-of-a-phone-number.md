# Letter Combinations of a Phone Number

```meta
difficulty: Medium
topic: Backtracking
tags: cartesian product
lc: 17
signature: letterCombinations(digits: string) -> string[]
compare: unordered
time: O(4^n · n)
space: O(n) recursion
```

Given a string of digits `2`–`9`, return every letter combination the number could spell on a phone keypad (`2 → abc`, `3 → def`, `4 → ghi`, `5 → jkl`, `6 → mno`, `7 → pqrs`, `8 → tuv`, `9 → wxyz`). Return them in any order. An empty input gives an empty list.

**Constraints**
- `0 <= digits.length <= 4`

## Hints
- Each digit chooses one of its letters independently: it's a Cartesian product.
- Backtrack one digit at a time, or build the list iteratively.

## Solution
Start with `[""]`, and for each digit extend every partial string with each of that digit's letters. The recursive version appends one letter per level and records strings of full length. Remember the special case: empty input returns `[]`, not `[""]`.

```python
class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        if not digits:
            return []
        keys = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
        combos = [""]
        for d in digits:
            combos = [c + letter for c in combos for letter in keys[d]]
        return combos
```

```javascript
function letterCombinations(digits) {
  if (!digits) return [];
  const keys = { 2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl', 6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz' };
  const result = [];
  const backtrack = (i, cur) => {
    if (i === digits.length) {
      result.push(cur);
      return;
    }
    for (const letter of keys[digits[i]]) backtrack(i + 1, cur + letter);
  };
  backtrack(0, '');
  return result;
}
```

## Tests
```jsonl
{"in": ["23"], "out": ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]}
{"in": [""], "out": []}
{"in": ["2"], "out": ["a", "b", "c"]}
{"in": ["79"], "out": ["pw", "px", "py", "pz", "qw", "qx", "qy", "qz", "rw", "rx", "ry", "rz", "sw", "sx", "sy", "sz"]}
{"in": ["234"], "out": ["adg", "adh", "adi", "aeg", "aeh", "aei", "afg", "afh", "afi", "bdg", "bdh", "bdi", "beg", "beh", "bei", "bfg", "bfh", "bfi", "cdg", "cdh", "cdi", "ceg", "ceh", "cei", "cfg", "cfh", "cfi"]}
```
