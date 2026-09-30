# Replication

```meta
category: databases
summary: Keeping copies of data on several machines for availability and read scaling.
minutes: 5
order: 6
```

**Replication** keeps copies of the same data on multiple nodes. It serves three goals: **availability** (survive a node failure), **read scaling** (serve reads from many copies), and **latency** (put copies near users).

### Leader–follower (primary–replica)
One **leader** accepts writes and streams its change log to **followers**, which serve reads. This is the default for PostgreSQL, MySQL, and MongoDB replica sets.

- **Synchronous replication**: the leader waits for a follower to confirm before acknowledging the write. No acknowledged write is lost if the leader dies, but writes are slower and stall if that follower is down.
- **Asynchronous replication**: the leader acknowledges immediately. Writes are fast, but followers **lag**, and a failover can lose the last few writes.
- **Semi-synchronous** is a common middle ground: one follower is synchronous, the rest asynchronous.

### Replication lag and its symptoms
With async replicas, reads can return stale data:
- **Read-your-writes**: a user updates their profile, refreshes, and sees the old version because the read hit a lagging replica. Fix: read from the leader for a short time after a write, or route that user's reads to the leader.
- **Monotonic reads**: two reads hit different replicas and data appears to go "back in time". Fix: pin a user to one replica.

### Failover
When the leader dies, a follower is promoted. The dangers are **split brain** (two nodes both think they're the leader and both accept writes) and lost writes from async lag. Proper failover uses consensus or fencing tokens so that only one leader can win.

### Multi-leader and leaderless
- **Multi-leader**: each region accepts writes locally, which gives low write latency globally. Concurrent writes to the same data **conflict** and need resolution: last-write-wins, merge functions, or CRDTs.
- **Leaderless** (Dynamo, Cassandra): clients write to and read from several replicas. **Quorums** (`W + R > N`) ensure reads overlap with the latest write.

## Key takeaways
- Leader–follower is the default: writes go to one leader, reads can scale out.
- Async replication brings lag: plan for read-your-writes and monotonic reads.
- Failover risks split brain and lost writes; fencing and consensus prevent it.
- Multi-leader and leaderless designs trade conflict handling for write availability.

## Go deeper
- [PostgreSQL: high availability and replication](https://www.postgresql.org/docs/current/high-availability.html)
