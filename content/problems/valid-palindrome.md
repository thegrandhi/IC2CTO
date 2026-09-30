# Valid Palindrome

```meta
difficulty: Easy
topic: Two Pointers
tags: string
lc: 125
signature: isPalindrome(s: string) -> bool
time: O(n)
space: O(1)
```

A phrase is a **palindrome** if, after lower-casing all letters and removing every non-alphanumeric character, it reads the same forwards and backwards.

Given a string `s`, return `true` if it is a palindrome and `false` otherwise.

**Constraints**
- `1 <= s.length <= 2 * 10^5`
- `s` consists of printable ASCII characters.

## Hints
- Building a cleaned copy of the string works but uses O(n) space.
- Use two pointers from both ends, skipping characters that aren't letters or digits.

## Solution
Put one pointer at each end. Advance each pointer past non-alphanumeric characters, then compare the lower-cased characters. Any mismatch means it's not a palindrome. When the pointers meet, it is.

```python
class Solution:
    def isPalindrome(self, s: str) -> bool:
        i, j = 0, len(s) - 1
        while i < j:
            if not s[i].isalnum():
                i += 1
            elif not s[j].isalnum():
                j -= 1
            elif s[i].lower() != s[j].lower():
                return False
            else:
                i += 1
                j -= 1
        return True
```

```javascript
function isPalindrome(s) {
  const ok = (c) => /[a-z0-9]/i.test(c);
  let i = 0;
  let j = s.length - 1;
  while (i < j) {
    if (!ok(s[i])) i++;
    else if (!ok(s[j])) j--;
    else if (s[i].toLowerCase() !== s[j].toLowerCase()) return false;
    else {
      i++;
      j--;
    }
  }
  return true;
}
```

## Tests
```jsonl
{"in": ["A man, a plan, a canal: Panama"], "out": true}
{"in": ["race a car"], "out": false}
{"in": [" "], "out": true, "why": "After cleaning, the string is empty, which reads the same both ways."}
{"in": ["0P"], "out": false}
{"in": ["ab_a"], "out": true}
{"in": ["Was it a car or a cat I saw?"], "out": true}
{"in": ["No 'x' in Nixon"], "out": true}
{"in": ["abcdba"], "out": false}
```
