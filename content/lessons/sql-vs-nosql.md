# Choosing a Datastore

```meta
category: databases
summary: Relational, key-value, document, wide-column, graph, time-series and search: when each fits.
minutes: 5
order: 10
```

There's no "SQL vs NoSQL" winner. Choose by **data shape**, **access patterns**, **consistency needs** and **scale**. Many real systems use several stores ("polyglot persistence").

| Store | Model | Great for | Examples |
|---|---|---|---|
| **Relational** | Tables, joins, ACID transactions | Money, orders, anything with invariants and relationships | PostgreSQL, MySQL |
| **Key-value** | `key → blob`, O(1) access | Sessions, caches, feature flags, short-URL lookups | Redis, DynamoDB |
| **Document** | JSON-like documents | Flexible, nested records read as a whole (profiles, catalogs) | MongoDB, Firestore |
| **Wide-column** | Partition key + sorted clustering columns | Huge write volumes, time-ordered data per key (messages, events) | Cassandra, ScyllaDB, Bigtable |
| **Graph** | Nodes and edges | Multi-hop relationship queries (friends of friends) | Neo4j |
| **Time-series** | Timestamped points, downsampling | Metrics, IoT, monitoring | Prometheus, InfluxDB, TimescaleDB |
| **Search** | Inverted index | Full-text search, faceting, typo-tolerant search | Elasticsearch, OpenSearch |
| **Blob / object** | Immutable files by key | Images, video, backups, logs | S3, GCS |

### Questions that decide it
1. **Do you need multi-row transactions or strong invariants?** (balances, inventory) → relational.
2. **Is access almost always by one key?** → key-value.
3. **Is the write volume enormous, with reads by partition + time?** → wide-column.
4. **Are relationships the core of the queries?** → graph.
5. **Is it text search?** → a search index, fed *from* your primary database.

### Relational databases scale further than people think
A single PostgreSQL primary with read replicas and good indexes handles a lot. Reaching for NoSQL "because scale" without numbers is a red flag in interviews. Justify it with write volume, data size, or access pattern.

### NoSQL tradeoffs to name
- Usually **no joins**: denormalize and design tables around the queries.
- Often **eventual consistency** by default (tunable in Cassandra/DynamoDB).
- **Schema flexibility** cuts both ways: the schema still exists, it just lives in application code.

## Key takeaways
- Pick stores by data shape, access pattern, consistency and scale.
- Relational for transactions and invariants; KV for single-key lookups; wide-column for massive partitioned writes.
- Search indexes and caches are *derived* stores fed from the source of truth.

## Go deeper
- [Designing Data-Intensive Applications (Kleppmann), chapters 2–3](https://dataintensive.net/)
