# Generate Parentheses

```meta
difficulty: Medium
topic: Stack
tags: backtracking, recursion
lc: 22
signature: generateParenthesis(n: int) -> string[]
compare: unordered
time: O(4^n / √n)
space: O(n) recursion
```

Given `n` pairs of parentheses, generate **all** combinations of well-formed parentheses. Return them in any order.

**Constraints**
- `1 <= n <= 8`

## Hints
- Build the string one character at a time. When may you add `(`? When may you add `)`?
- Add `(` while fewer than `n` have been opened. Add `)` only while there are more opens than closes.

## Solution
Backtrack with two counters. Add an opening bracket if `open < n`. Add a closing bracket if `close < open`, so the prefix never has more closers than openers. When the string reaches length `2n`, it's valid. This generates only well-formed strings, one per leaf; there are Catalan(n) of them.

```python
class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        result = []

        def build(cur, opened, closed):
            if len(cur) == 2 * n:
                result.append(cur)
                return
            if opened < n:
                build(cur + "(", opened + 1, closed)
            if closed < opened:
                build(cur + ")", opened, closed + 1)

        build("", 0, 0)
        return result
```

```javascript
function generateParenthesis(n) {
  const result = [];
  const build = (cur, opened, closed) => {
    if (cur.length === 2 * n) {
      result.push(cur);
      return;
    }
    if (opened < n) build(cur + '(', opened + 1, closed);
    if (closed < opened) build(cur + ')', opened, closed + 1);
  };
  build('', 0, 0);
  return result;
}
```

## Tests
```jsonl
{"in": [3], "out": ["((()))", "(()())", "(())()", "()(())", "()()()"]}
{"in": [1], "out": ["()"]}
{"in": [2], "out": ["(())", "()()"]}
{"in": [4], "out": ["(((())))", "((()()))", "((())())", "((()))()", "(()(()))", "(()()())", "(()())()", "(())(())", "(())()()", "()((()))", "()(()())", "()(())()", "()()(())", "()()()()"]}
{"in": [5], "out": ["((((()))))", "(((()())))", "(((())()))", "(((()))())", "(((())))()", "((()(())))", "((()()()))", "((()())())", "((()()))()", "((())(()))", "((())()())", "((())())()", "((()))(())", "((()))()()", "(()((())))", "(()(()()))", "(()(())())", "(()(()))()", "(()()(()))", "(()()()())", "(()()())()", "(()())(())", "(()())()()", "(())((()))", "(())(()())", "(())(())()", "(())()(())", "(())()()()", "()(((())))", "()((()()))", "()((())())", "()((()))()", "()(()(()))", "()(()()())", "()(()())()", "()(())(())", "()(())()()", "()()((()))", "()()(()())", "()()(())()", "()()()(())", "()()()()()"]}
```
