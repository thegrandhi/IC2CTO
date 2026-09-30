# Group Anagrams

```meta
difficulty: Medium
topic: Arrays & Hashing
tags: hash map, sorting
lc: 49
signature: groupAnagrams(strs: string[]) -> string[][]
compare: unorderedDeep
time: O(n · k log k)
space: O(n · k)
```

Given an array of strings `strs`, group the **anagrams** together. Two strings are anagrams if one is a rearrangement of the other's letters.

Return the groups in **any order**; the strings inside each group can also be in any order.

**Constraints**
- `1 <= strs.length <= 10^4`
- `0 <= strs[i].length <= 100`
- `strs[i]` contains only lowercase English letters.

## Hints
- Anagrams share a *canonical form*. What single key would be identical for `"eat"`, `"tea"` and `"ate"`?
- Sorting the letters gives such a key. A 26-slot letter count works too and avoids the sort.

## Solution
Map each word to a canonical key and bucket the words by key in a hash map. The sorted letters make a good key (`"aet"` for `eat`/`tea`/`ate`). For words of length k, a tuple of 26 letter counts gives an O(k) key instead of O(k log k).

```python
class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        groups = defaultdict(list)
        for word in strs:
            groups["".join(sorted(word))].append(word)
        return list(groups.values())
```

```javascript
function groupAnagrams(strs) {
  const groups = new Map();
  for (const word of strs) {
    const key = [...word].sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}
```

## Tests
```jsonl
{"in": [["eat", "tea", "tan", "ate", "nat", "bat"]], "out": [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]}
{"in": [[""]], "out": [[""]]}
{"in": [["a"]], "out": [["a"]]}
{"in": [["", "", "b", "b"]], "out": [["", ""], ["b", "b"]]}
{"in": [["abc", "bca", "cab", "xyz", "zyx", "yxz", "abcd"]], "out": [["abc", "bca", "cab"], ["xyz", "zyx", "yxz"], ["abcd"]]}
{"in": [["ab", "ba", "aab", "aba", "baa", "bba"]], "out": [["ab", "ba"], ["aab", "aba", "baa"], ["bba"]]}
{"in": [["stop", "pots", "tops", "opts", "post", "spot", "stops"]], "out": [["stop", "pots", "tops", "opts", "post", "spot"], ["stops"]]}
```
