# Partition Labels

```meta
difficulty: Medium
topic: Greedy
tags: last occurrence
lc: 763
signature: partitionLabels(s: string) -> int[]
time: O(n)
space: O(26)
```

Split string `s` into as many parts as possible so that **each letter appears in at most one part**. The parts, concatenated in order, must equal `s`.

Return the sizes of the parts.

**Constraints**
- `1 <= s.length <= 500`; lowercase English letters.

## Hints
- A part containing letter `c` must extend at least to the **last** occurrence of `c`.
- Record each letter's last index, then grow the current part's end as you scan.

## Solution
First record `last[c]`, each letter's final index. Scan with a running `end = max(end, last[s[i]])`. When `i == end`, every letter inside the current part has its last occurrence inside it, so close the part and start a new one. Cutting at the earliest possible point gives the maximum number of parts.

```python
class Solution:
    def partitionLabels(self, s: str) -> List[int]:
        last = {ch: i for i, ch in enumerate(s)}
        sizes = []
        start = end = 0
        for i, ch in enumerate(s):
            end = max(end, last[ch])
            if i == end:
                sizes.append(end - start + 1)
                start = i + 1
        return sizes
```

```javascript
function partitionLabels(s) {
  const last = {};
  for (let i = 0; i < s.length; i++) last[s[i]] = i;
  const sizes = [];
  let start = 0;
  let end = 0;
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last[s[i]]);
    if (i === end) {
      sizes.push(end - start + 1);
      start = i + 1;
    }
  }
  return sizes;
}
```

## Tests
```jsonl
{"in": ["ababcbacadefegdehijhklij"], "out": [9, 7, 8]}
{"in": ["eccbbbbdec"], "out": [10]}
{"in": ["a"], "out": [1]}
{"in": ["abc"], "out": [1, 1, 1]}
{"in": ["abca"], "out": [4]}
{"in": ["caedbdedda"], "out": [1, 9]}
```
