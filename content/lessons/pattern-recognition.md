# Recognizing the Pattern

```meta
category: algorithms
summary: The clues in a problem statement that point to the right technique.
minutes: 5
order: 27
```

Most interview problems are variations on about 15 patterns. The fastest way to a solution is to recognize which one you're facing.

| If the problem says… | Think… |
|---|---|
| "pair/triplet that sums to…", sorted array | **Two pointers** (or a hash map if unsorted) |
| "longest/shortest **contiguous** subarray/substring with…" | **Sliding window** |
| "have I seen this before?", counts, grouping, O(1) lookup | **Hash map / set** |
| sorted input, "minimum X such that…", monotonic yes/no | **Binary search** (possibly on the answer) |
| "next greater/smaller element", histogram, span | **Monotonic stack** |
| matching brackets, undo, nested structure | **Stack** |
| "k largest/smallest", "k closest", streaming median, merge k lists | **Heap** |
| tree: height, paths, "for every node…" | **DFS (recursion)**, returning info from children |
| tree: "level by level", "right side view" | **BFS** |
| shortest path, unweighted | **BFS** |
| shortest path, weighted non-negative | **Dijkstra** |
| dependencies, "order of courses", detect cycle in directed graph | **Topological sort** |
| connected components, "are these connected?", redundant edge | **Union-Find** or DFS |
| grid of cells, islands, flood | **DFS/BFS on grid** |
| "all combinations/permutations/subsets", constraint placement | **Backtracking** |
| "number of ways", "min/max cost", overlapping subproblems | **Dynamic programming** |
| two strings, edit/match/common subsequence | **2-D DP** |
| intervals: merge, overlap, rooms | **Sort by start (or end)** + sweep |
| prefix lookups, word dictionary | **Trie** |
| "appears once, others twice", bit tricks | **XOR / bit manipulation** |
| linked list cycle, middle, duplicate in 1..n | **Fast & slow pointers** |
| range sums, "subarray sums to k" | **Prefix sums** (+ hash map) |

### A routine for any new problem
1. Restate the input, output and constraints. Note n. It hints at the target complexity.
2. Work through a small example by hand. Then an edge case: empty input, one element, duplicates, negatives.
3. Say the brute force and its complexity out loud.
4. Look for the bottleneck in the brute force. Which pattern removes it?
5. Code it, then **test with your example** by tracing the code line by line.

## Key takeaways
- Contiguous plus longest/shortest points to a sliding window; sorted plus a pair points to two pointers.
- "Number of ways" or "min cost" with overlapping choices points to DP.
- Shortest path: BFS if unweighted, Dijkstra if weighted.
- Always state the brute force first, then remove its bottleneck.

## Go deeper
- [Tech Interview Handbook: algorithms study cheatsheet](https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/)
