# Min Stack

```meta
difficulty: Medium
topic: Stack
tags: design
lc: 155
class: MinStack()
method: push(val: int) -> void
method: pop() -> void
method: top() -> int
method: getMin() -> int
time: O(1) per operation
space: O(n)
examples: 1
```

Design a stack that supports `push`, `pop`, `top`, and retrieving the **minimum** element, all in **O(1)** time.

- `MinStack()` initializes the stack.
- `push(val)` pushes `val`.
- `pop()` removes the top element.
- `top()` returns the top element.
- `getMin()` returns the smallest element currently in the stack.

`pop`, `top` and `getMin` are only called on a non-empty stack.

**Constraints**
- `-2^31 <= val <= 2^31 - 1`
- At most `3 * 10^4` calls in total.

## Hints
- A single "current min" variable breaks when you pop the minimum. What was the min before it was pushed?
- Store, alongside each element, the minimum of the stack at the moment it was pushed.

## Solution
Keep a second stack where entry `i` is the minimum of the first `i + 1` elements. Pushing `val` pushes `min(val, currentMin)`. Popping pops both stacks. `getMin` reads the top of the min-stack. Every operation is O(1).

```python
class MinStack:

    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        self.mins.append(min(val, self.mins[-1]) if self.mins else val)

    def pop(self) -> None:
        self.stack.pop()
        self.mins.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.mins[-1]
```

```javascript
class MinStack {
  constructor() {
    this.stack = [];
    this.mins = [];
  }

  push(val) {
    this.stack.push(val);
    this.mins.push(this.mins.length ? Math.min(val, this.mins[this.mins.length - 1]) : val);
  }

  pop() {
    this.stack.pop();
    this.mins.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.mins[this.mins.length - 1];
  }
}
```

## Tests
```jsonl
{"ops": ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"], "args": [[], [-2], [0], [-3], [], [], [], []], "out": [null, null, null, null, -3, null, 0, -2]}
{"ops": ["MinStack", "push", "getMin", "top"], "args": [[], [5], [], []], "out": [null, null, 5, 5]}
{"ops": ["MinStack", "push", "push", "push", "getMin", "pop", "getMin", "pop", "getMin"], "args": [[], [2], [2], [1], [], [], [], [], []], "out": [null, null, null, null, 1, null, 2, null, 2]}
{"ops": ["MinStack", "push", "push", "getMin", "pop", "getMin", "push", "getMin"], "args": [[], [1], [1], [], [], [], [0], []], "out": [null, null, null, 1, null, 1, null, 0]}
{"ops": ["MinStack", "push", "push", "push", "push", "getMin", "pop", "pop", "getMin", "top"], "args": [[], [3], [5], [2], [4], [], [], [], [], []], "out": [null, null, null, null, null, 2, null, null, 3, 5]}
```
