# Design a Distributed Key-Value Store

```meta
difficulty: Hard
minutes: 45
tags: partitioning, replication, quorums, consistency
```

Design a distributed key-value store like DynamoDB or Cassandra: `put(key, value)` and `get(key)`, spread across hundreds of nodes, highly available, with tunable consistency and support for nodes joining, leaving and failing.

## Clarifying questions
- Value size limits? Read/write ratio?
- Consistency requirements: strong, eventual, or tunable per request?
- Availability target, and behaviour during network partitions?
- Single region or multi-region?
- Range queries needed, or only point lookups?

## Requirements
**Functional**
- `put(key, value)`, `get(key)`, `delete(key)`; values up to ~1 MB; optional TTL.

**Non-functional**
- **Horizontally scalable** to petabytes and millions of ops/s.
- **Highly available** (writes accepted even when some nodes are down).
- **Tunable consistency** per request.
- Low latency (single-digit ms) and automatic failure handling.

## Estimation
- 1M ops/s; 100 TB of data. With ~2 TB of usable SSD per node and 3× replication → ~150+ nodes.
- Per node: ~7k ops/s, comfortable for SSD-backed LSM storage.

## API
```
put(key, value, ttl?, consistency=QUORUM) → ok
get(key, consistency=QUORUM) → value | not found
delete(key)  (writes a tombstone)
```

## Data model
- Partition key → hashed onto a **consistent-hashing ring** (with virtual nodes).
- Each key stored on **N replicas**: the next N distinct physical nodes clockwise (the preference list), spread across racks/zones.
- On each node: an **LSM-tree** storage engine (write-ahead log → memtable → sorted SSTables → compaction), with Bloom filters per SSTable to skip disk reads.
- Each value carries a version (a timestamp, or a vector clock for conflict detection).

## High-level design
```
Client ─► any node (coordinator) ─► hash(key) → preference list [A, B, C]
                                     ├─ write to N replicas, wait for W acks
                                     └─ read from R replicas, return newest, repair stale ones
Membership & failure detection: gossip protocol
Anti-entropy: Merkle trees compare replicas in the background
Temporary failures: hinted handoff; permanent: re-replication after the ring changes
```

## Deep dives
**1. Partitioning**
- Consistent hashing with virtual nodes: adding a node moves about 1/N of the data, spread across many nodes. Bigger machines get more virtual nodes.

**2. Replication and quorums**
- N = 3 replicas across availability zones. With `W + R > N` (e.g. W = 2, R = 2) reads overlap the latest write. Lower W/R for latency (eventual consistency), higher for strength. It's tunable per request.

**3. Handling failures**
- **Hinted handoff**: if a replica is down, another node stores the write with a "hint" and forwards it when the replica returns, so writes stay available.
- **Read repair**: during reads, stale replicas are updated with the newest version.
- **Anti-entropy with Merkle trees**: replicas compare hash trees of key ranges to find and sync differences efficiently.
- **Gossip** spreads membership and failure suspicion without a central coordinator; a phi-accrual detector adapts to network jitter.

**4. Conflicts**
- Concurrent writes to the same key on different replicas (especially during partitions): **last-write-wins** by timestamp (simple, can lose writes), or **vector clocks** that detect concurrency and return siblings for the client to merge. CRDT value types (counters, sets) merge automatically.

**5. Storage engine**
- LSM trees give fast sequential writes. Reads check the memtable, then SSTables (newest first), with Bloom filters avoiding needless disk seeks. Compaction merges SSTables and drops tombstones after a grace period (so deletes don't "resurrect" on a lagging replica).

**6. CAP stance**
- An AP-leaning default (sloppy quorums, hinted handoff) keeps writes available during partitions; clients who need stronger guarantees use QUORUM or ALL.

## Wrap-up
- Bottlenecks: hot keys (cache them, or split the key), compaction I/O, cross-zone replication latency.
- Operations: rolling upgrades, adding nodes with streaming rebalance, backups via snapshots.
- Extensions: secondary indexes, range queries (ordered partitioning), multi-region replication.

## Rubric
- Clarified consistency needs, partition behaviour, value sizes and access pattern
- Partitioned with consistent hashing and virtual nodes
- Replicated to N nodes across zones and explained quorum math (W + R > N)
- Made consistency tunable per request and discussed the CAP/PACELC stance
- Handled temporary failures (hinted handoff) and divergence (read repair, Merkle-tree anti-entropy)
- Used gossip for membership/failure detection (no single coordinator)
- Resolved conflicting writes (LWW vs vector clocks/CRDTs)
- Described an LSM-based storage engine with Bloom filters, compaction and tombstones
- Estimated node count from data size, replication and throughput
