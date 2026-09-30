# Evaluate Reverse Polish Notation

```meta
difficulty: Medium
topic: Stack
tags: expression evaluation
lc: 150
signature: evalRPN(tokens: string[]) -> int
time: O(n)
space: O(n)
```

Evaluate an arithmetic expression written in **Reverse Polish Notation** (postfix), where each operator follows its two operands.

- Valid operators are `+`, `-`, `*` and `/`.
- Operands are integers (possibly negative).
- Division between two integers **truncates toward zero**.
- The expression is always valid, and every intermediate result fits in a 32-bit integer.

**Constraints**
- `1 <= tokens.length <= 10^4`

## Hints
- Numbers wait until an operator arrives. What structure holds "the most recent operands"?
- On an operator, pop two values. Watch the order: the first pop is the **right** operand.
- Python's `//` floors (rounds toward −∞), so for truncation use `int(a / b)`.

## Solution
Scan tokens with a stack. Push numbers. For an operator, pop `b` then `a` and push `a op b`. The final stack holds the answer. The classic trap is division: truncate toward zero with `int(a / b)` in Python or `Math.trunc(a / b)` in JavaScript.

```python
class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []
        for tok in tokens:
            if tok in "+-*/" and len(tok) == 1:
                b = stack.pop()
                a = stack.pop()
                if tok == "+":
                    stack.append(a + b)
                elif tok == "-":
                    stack.append(a - b)
                elif tok == "*":
                    stack.append(a * b)
                else:
                    stack.append(int(a / b))
            else:
                stack.append(int(tok))
        return stack[-1]
```

```javascript
function evalRPN(tokens) {
  const stack = [];
  const ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => Math.trunc(a / b),
  };
  for (const tok of tokens) {
    if (tok in ops) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(ops[tok](a, b));
    } else {
      stack.push(Number(tok));
    }
  }
  return stack[stack.length - 1] + 0;
}
```

## Tests
```jsonl
{"in": [["2", "1", "+", "3", "*"]], "out": 9, "why": "((2 + 1) * 3) = 9"}
{"in": [["4", "13", "5", "/", "+"]], "out": 6, "why": "(4 + (13 / 5)) = 4 + 2 = 6"}
{"in": [["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]], "out": 22}
{"in": [["42"]], "out": 42}
{"in": [["7", "-2", "/"]], "out": -3}
{"in": [["-7", "2", "/"]], "out": -3}
{"in": [["3", "4", "-"]], "out": -1}
{"in": [["2", "3", "4", "*", "+", "5", "-"]], "out": 9}
```
