# Database Indexes

```meta
category: databases
summary: How B-tree and other indexes speed up reads, and what they cost.
minutes: 5
order: 7
```

Without an index, finding rows means scanning the whole table: O(n). An **index** is a separate data structure that maps column values to row locations, so lookups are O(log n).

### B-tree indexes (the default)
A **B-tree** (in practice a B+tree) keeps keys sorted in wide, shallow pages. Three or four levels can index billions of rows. Because the keys are sorted, one index supports:
- equality lookups (`WHERE email = ?`)
- range scans (`WHERE created_at > ?`)
- `ORDER BY` and `MIN/MAX` without a separate sort.

### Composite indexes and the leftmost-prefix rule
An index on `(user_id, created_at)` is sorted by `user_id`, then by `created_at` within each user. It serves:
- `WHERE user_id = ?`
- `WHERE user_id = ? AND created_at > ?` ← perfect for "this user's recent posts"
- but **not** `WHERE created_at > ?` alone, because the leading column is missing.

Put the equality columns first and the range or sort column last.

### Covering indexes
If an index contains every column the query needs, the database answers from the index alone, an **index-only scan** that never touches the table.

### Other index types
- **Hash indexes**: O(1) equality lookups, but no ranges.
- **LSM trees** (RocksDB, Cassandra): writes go to an in-memory buffer and are flushed as sorted files that are later merged. Great write throughput, with somewhat costlier reads.
- **Inverted indexes** (Elasticsearch): map each word to the documents containing it, for full-text search.
- **Geospatial indexes** (geohash, R-tree, quadtree) for "near me" queries.

### The cost
Every index must be updated on every insert, update and delete. More indexes mean **slower writes** and more storage. Index for your actual query patterns, not for every column.

## Key takeaways
- B-tree indexes give O(log n) lookups, range scans and sorted output.
- Composite indexes follow the leftmost-prefix rule: equality columns first, then range.
- Covering indexes skip the table entirely.
- Each index slows writes, so index for real access patterns.

## Go deeper
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [PostgreSQL: indexes](https://www.postgresql.org/docs/current/indexes.html)
