# Design Search Autocomplete

```meta
difficulty: Medium
minutes: 45
tags: trie, top-k, caching, offline aggregation
```

Design the autocomplete service behind a search box. As the user types, show the top 10 most popular queries that start with the typed prefix. It must feel instant and reflect trending searches within about an hour.

## Clarifying questions
- Rank by what: popularity only, or personalized, location-aware, with typo tolerance?
- How fresh must suggestions be? Minutes, or daily?
- Scale: searches per day, and keystrokes (suggestion requests) per search?
- Languages and character sets? Filtering of offensive suggestions?

## Requirements
**Functional**
- Given a prefix, return the top 10 completions by popularity.
- Suggestions reflect new trends within about an hour.
- Filter blocked or offensive terms.

**Non-functional**
- **Very low latency**: < 50 ms end to end, ideally < 10 ms server time.
- Highly available; very high read QPS; eventual consistency is fine.

## Estimation
- 5B searches/day; ~6 suggestion requests per search (with debouncing) → 30B/day ≈ **350k QPS** average, ~1M at peak.
- Unique queries worth suggesting: ~100M. Trie with top-k lists at each node: several tens of GB, so it's sharded and replicated, in memory.

## API
```
GET /v1/suggest?q=how%20to%20m&limit=10&lang=en
→ { "suggestions": ["how to make pancakes", "how to meditate", ...] }
```
Clients **debounce** keystrokes (~100 ms) and cache responses locally. Responses are cacheable at the CDN for common prefixes.

## Data model
- **Query log** (append-only, huge) → aggregated **query counts** per time window.
- **Serving trie**: node per prefix, each storing its **precomputed top-k** completions (query + score). Built offline and loaded into memory.
- Blocklist of terms.

## High-level design
```
Typing ─► CDN/edge cache ─► Suggest service (in-memory trie shards) ─► response
Search submitted ─► query log (Kafka) ─► stream/batch aggregation (counts, decay)
                                         └─► trie builder ─► new trie snapshot ─► suggest servers (hot swap)
```

## Deep dives
**1. Why precompute top-k per node**
- A naive trie would, for prefix "h", traverse millions of descendants to find the top 10. Storing the top-k list **at every node** makes a lookup O(length of the prefix) plus returning k items.
- Cost: memory, and updates must propagate up the prefix path. That's fine because updates are batched offline.

**2. Freshness pipeline**
- Stream the query log into windowed counts (for example hourly), with exponential decay so trends rise quickly and fade.
- Rebuild the trie (or apply deltas) every 15–60 minutes, and swap snapshots atomically on the servers.

**3. Sharding**
- Shard by prefix range (a–f, g–m, …), with finer splits for hot letters, or by a hash of the first 2–3 characters. Replicate each shard for read throughput and availability.

**4. Caching**
- The top ~10k prefixes cover a large share of traffic. Cache them at the CDN/edge and in the browser (short TTL). Short prefixes (1–2 characters) are the hottest and the most cacheable.

**5. Personalization and quality**
- Blend global suggestions with the user's recent searches (client-side or a small per-user store).
- Apply the blocklist at build time **and** at serve time (for emergencies).
- Typo tolerance: fuzzy matching (edit distance ≤ 1) on short prefixes, or a separate spelling-correction model.

## Wrap-up
- Bottlenecks: read QPS (served from caches and in-memory replicas), trie memory (sharding), rebuild time (incremental updates).
- Failure: a stale snapshot is fine, so keep serving the last good trie if a build fails.
- Extensions: multilingual tries, entity suggestions (people, places), ads.

## Rubric
- Clarified ranking, freshness, scale and filtering needs
- Estimated suggestion QPS (keystrokes × searches) and trie memory
- Used a trie with precomputed top-k per node for O(prefix) lookups
- Separated the offline/stream aggregation pipeline from the online serving path
- Explained freshness via windowed counts/decay and periodic snapshot swaps
- Sharded and replicated the in-memory index
- Added caching (CDN/edge, browser) and client-side debouncing
- Handled offensive-term filtering and considered personalization/typos
- Discussed serving stale data safely if the pipeline fails
