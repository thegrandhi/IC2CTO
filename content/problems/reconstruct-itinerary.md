# Reconstruct Itinerary

```meta
difficulty: Hard
topic: Advanced Graphs
tags: eulerian path, hierholzer
lc: 332
signature: findItinerary(tickets: string[][]) -> string[]
time: O(E log E)
space: O(E)
```

You're given airline `tickets` as `[from, to]` pairs. Reconstruct the itinerary in order. It starts at `"JFK"` and must use **every ticket exactly once**.

If several valid itineraries exist, return the one that is **smallest in lexical order** when read as a sequence of airport codes. At least one valid itinerary is guaranteed.

**Constraints**
- `1 <= tickets.length <= 300`; airport codes are 3 uppercase letters.

## Hints
- Using every edge exactly once is an **Eulerian path**.
- Greedily taking the smallest destination can hit a dead end too early. **Hierholzer's algorithm** handles it: DFS, and append an airport to the route only once it has no unused outgoing tickets. Then reverse.

## Solution
Sort each airport's destinations so the smallest is tried first. Run Hierholzer's algorithm with a stack: while the top airport still has tickets, pop its smallest destination and push it. When the top has none left, it's finished, so move it to the route. Dead ends get finished first and end up at the *end* of the route, which is why reversing the finished order gives the correct, lexically smallest itinerary.

```python
class Solution:
    def findItinerary(self, tickets: List[List[str]]) -> List[str]:
        graph = defaultdict(list)
        for a, b in sorted(tickets, reverse=True):
            graph[a].append(b)  # reverse-sorted so pop() yields the smallest
        route = []
        stack = ["JFK"]
        while stack:
            while graph[stack[-1]]:
                stack.append(graph[stack[-1]].pop())
            route.append(stack.pop())
        return route[::-1]
```

```javascript
function findItinerary(tickets) {
  const graph = new Map();
  for (const [a, b] of [...tickets].sort().reverse()) {
    if (!graph.has(a)) graph.set(a, []);
    graph.get(a).push(b);
  }
  const route = [];
  const stack = ['JFK'];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const dests = graph.get(top);
    if (dests && dests.length) stack.push(dests.pop());
    else route.push(stack.pop());
  }
  return route.reverse();
}
```

## Tests
```jsonl
{"in": [[["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]]], "out": ["JFK", "MUC", "LHR", "SFO", "SJC"]}
{"in": [[["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]]], "out": ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"]}
{"in": [[["JFK", "KUL"], ["JFK", "NRT"], ["NRT", "JFK"]]], "out": ["JFK", "NRT", "JFK", "KUL"], "why": "Taking KUL first would strand the other tickets."}
{"in": [[["JFK", "AAA"]]], "out": ["JFK", "AAA"]}
{"in": [[["JFK", "BBB"], ["BBB", "JFK"], ["JFK", "AAA"], ["AAA", "JFK"]]], "out": ["JFK", "AAA", "JFK", "BBB", "JFK"]}
{"in": [[["EZE", "AXA"], ["TIA", "ANU"], ["ANU", "JFK"], ["JFK", "ANU"], ["ANU", "EZE"], ["TIA", "ANU"], ["AXA", "TIA"], ["TIA", "JFK"], ["ANU", "TIA"], ["JFK", "TIA"]]], "out": ["JFK", "ANU", "EZE", "AXA", "TIA", "ANU", "JFK", "TIA", "ANU", "TIA", "JFK"]}
```
