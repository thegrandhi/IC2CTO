# CAP and PACELC

```meta
category: theory
summary: What the CAP theorem actually says, and the everyday latency/consistency tradeoff.
minutes: 4
order: 18
```

### CAP
In a distributed data store, when a **network partition** (P) splits the nodes, each side must choose between:
- **Consistency (C)**: every read sees the latest write, so some requests are refused or blocked until the partition heals.
- **Availability (A)**: every request gets a non-error response, possibly with stale data.

Partitions *will* happen, so "pick two of three" is misleading. The real choice is **what to do during a partition**:
- **CP systems** refuse writes, or reads, on the minority side. Examples: ZooKeeper, etcd, HBase, and relational databases with synchronous failover.
- **AP systems** keep serving on both sides and reconcile later. Examples: Cassandra and DynamoDB at default settings, DNS, and shopping carts that merge.

The **C** in CAP means *linearizability*, which is stronger than the C in ACID. They're different concepts that happen to share a letter.

### PACELC: the everyday tradeoff
Partitions are rare. **PACELC** adds: **E**lse (normal operation), choose between **L**atency and **C**onsistency. Waiting for replicas in other zones or regions before acknowledging makes every request slower.
- **PA/EL** (Cassandra, DynamoDB defaults): available during partitions, low latency normally.
- **PC/EC** (Spanner, relational databases with synchronous replication): consistent always, and you pay in latency.

### Choosing per feature, not per system
Interviews reward nuance: *"Likes and view counts can be eventually consistent. Account balances and inventory can't."* Many databases let you tune this per request (Cassandra's consistency levels, DynamoDB's strongly consistent reads).

## Key takeaways
- During a partition you choose: refuse requests (CP) or serve possibly stale data (AP).
- CAP's "C" is linearizability, not ACID's "C".
- PACELC: even without partitions, stronger consistency costs latency.
- Choose consistency per feature: money is strong, counters are eventual.

## Go deeper
- [Consistency models (Jepsen)](https://jepsen.io/consistency)
