# Search and Geospatial Indexing

```meta
category: databases
summary: Inverted indexes for text search, and geohash/quadtree indexes for "near me" queries.
minutes: 4
order: 25
```

### Full-text search
`WHERE body LIKE '%pizza%'` scans every row. Search engines (Elasticsearch, OpenSearch, Lucene) build an **inverted index**: for each term, the list of documents containing it.

```
"pizza" → [doc 3, doc 17, doc 42]
"cheap" → [doc 17, doc 99]
```

A query intersects or unions these lists and **ranks** the results (BM25 relevance, plus signals like popularity). Text passes through an **analyzer** first: tokenizing, lower-casing, stemming ("running" → "run"), and removing stop words.

**Architecture pattern**: the primary database stays the source of truth, and changes stream into the search index through change data capture or a queue. The index is *eventually consistent* with the database, and you can rebuild it from scratch.

**Typeahead / autocomplete** uses a **trie** of prefixes (or edge n-grams in a search engine), with the top-k popular completions precomputed at each prefix node, so lookups are O(prefix length).

### Geospatial: "find drivers near me"
Plain latitude/longitude columns can't answer "within 2 km" efficiently. Options:
- **Geohash**: encode (lat, lng) into a string where a **shared prefix means nearby**. Search your cell plus its 8 neighbours. It works with any key-value store or B-tree.
- **Quadtree**: recursively split space into four quadrants until each cell holds at most K points. It adapts to density (a dense downtown gets smaller cells).
- **S2 / H3**: cell hierarchies on a sphere, used by Google and Uber.
- **R-trees**, via PostGIS, for polygons and complex queries.

For fast-moving points (drivers updating every few seconds), keep locations **in memory**, for example Redis geo sets partitioned by city, rather than rewriting a disk-based index constantly.

## Key takeaways
- Inverted index: term → documents; analyzers normalize text; BM25 ranks.
- Keep search as a derived, rebuildable index fed from the source of truth.
- Autocomplete: a prefix trie with precomputed top-k.
- Geo queries: geohash or quadtree cells plus neighbours; keep moving points in memory.

## Go deeper
- [Inverted index (Wikipedia)](https://en.wikipedia.org/wiki/Inverted_index)
- [Geohash (Wikipedia)](https://en.wikipedia.org/wiki/Geohash)
