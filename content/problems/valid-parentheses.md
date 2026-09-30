# Valid Parentheses

```meta
difficulty: Easy
topic: Stack
tags: matching brackets
lc: 20
signature: isValid(s: string) -> bool
time: O(n)
space: O(n)
```

Given a string `s` made of the characters `()[]{}`, decide whether it is **valid**:

1. Every opening bracket is closed by the same type of bracket.
2. Brackets close in the correct order.
3. Every closing bracket has a matching opening bracket.

**Constraints**
- `1 <= s.length <= 10^4`

## Hints
- The most recently opened bracket must be the first one closed. Which data structure is last-in, first-out?
- Push openers. On a closer, the top of the stack must be its partner.

## Solution
Push every opening bracket onto a stack. For a closing bracket, the stack must be non-empty and its top must be the matching opener; pop it. At the end the stack must be empty, since leftover openers were never closed.

```python
class Solution:
    def isValid(self, s: str) -> bool:
        pairs = {")": "(", "]": "[", "}": "{"}
        stack = []
        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]:
                    return False
            else:
                stack.append(ch)
        return not stack
```

```javascript
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}
```

## Tests
```jsonl
{"in": ["()"], "out": true}
{"in": ["()[]{}"], "out": true}
{"in": ["(]"], "out": false}
{"in": ["([])"], "out": true}
{"in": ["([)]"], "out": false}
{"in": ["{[]}"], "out": true}
{"in": ["("], "out": false}
{"in": ["]"], "out": false}
{"in": ["(((((((())))))))"], "out": true}
{"in": ["(){}}{"], "out": false}
```
