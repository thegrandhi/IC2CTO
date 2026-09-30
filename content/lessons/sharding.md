# Sharding (Partitioning)

```meta
category: databases
summary: Splitting data across machines when one node can't hold the data or the writes.
minutes: 5
order: 8
```

Replication copies **all** the data to every node, which scales reads but not writes or storage. **Sharding** splits the data into partitions, each owned by a different node, so each node holds and writes only a fraction.

### When to shard
Shard when the data no longer fits on one machine, or write throughput exceeds what one primary can handle. Sharding adds a lot of complexity, so first exhaust vertical scaling, read replicas, caching and archiving old data.

### Choosing a shard key
The shard key determines where each row lives. A good key:
- **spreads load evenly** (high cardinality, no hot values), and
- **keeps related data together**, so common queries hit **one** shard.

For a chat app, `conversation_id` keeps each conversation's messages together. For a multi-tenant SaaS product, `tenant_id` does the same for each customer.

### Strategies
- **Range partitioning** (A–F, G–M, …; or by date): efficient range scans, but prone to hot spots, since new rows all land on the newest range.
- **Hash partitioning** (`hash(key) mod N`): an even spread, but range queries must hit every shard, and changing `N` moves almost every key.
- **Consistent hashing**: a hash ring where adding a node moves only about 1/N of the keys. It's used by Dynamo, Cassandra and many caches.
- **Directory-based**: a lookup service maps key → shard. Maximally flexible, but that directory is one more component that must stay available.

### Problems to anticipate
- **Hot keys / celebrities**: one key (a celebrity user) overwhelms its shard. Split it further (add a suffix like `key#0..9`), cache it, or special-case it.
- **Cross-shard queries**: joins and aggregates across shards are expensive (scatter-gather). Denormalize, or maintain secondary indexes.
- **Cross-shard transactions** need two-phase commit or sagas. Design to avoid them.
- **Resharding**: moving data while serving traffic is hard. Start with many small **logical** shards mapped onto fewer physical machines, so rebalancing means moving whole logical shards.

## Key takeaways
- Shard when data or write volume outgrows one node, after cheaper options.
- Pick a shard key that spreads load and keeps queries on a single shard.
- Hash spreads evenly; range keeps scans cheap but risks hot spots.
- Plan for hot keys, cross-shard queries, and resharding (use many logical shards).

## Go deeper
- [Scaling horizontally (System Design Primer)](https://github.com/donnemartin/system-design-primer#sharding)
