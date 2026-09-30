# Quorums, Consensus, and Leader Election

```meta
category: theory
summary: How replicas agree: W + R > N, majorities, Raft, and fencing tokens.
minutes: 5
order: 20
```

### Quorums
With `N` replicas, write to `W` of them and read from `R` of them. If **`W + R > N`**, every read set overlaps every write set in at least one replica, so reads can see the latest write, using version numbers to pick the newest value.

Common settings for `N = 3`:
- `W = 2, R = 2`: balanced, and tolerates one node down for both reads and writes.
- `W = 3, R = 1`: fast reads, but writes fail if any replica is down.
- `W = 1, R = 1`: fastest, but **no** overlap guarantee, so reads are eventually consistent.

### Consensus
**Consensus** means getting nodes to agree on a value, or a sequence of values (a replicated log), despite failures. Algorithms such as **Raft** and **Paxos** need a **majority** (`⌊N/2⌋ + 1`) to make progress:
- 3 nodes tolerate 1 failure; 5 nodes tolerate 2.
- Any two majorities overlap, so two conflicting decisions can't both be made, even across a network partition.
- Use an **odd** number of nodes. A 4th node adds cost without tolerating an extra failure.

Raft in one breath: nodes elect a **leader** by majority vote for a numbered **term**. The leader appends commands to its log and replicates them. An entry is **committed** once a majority has stored it. If the leader dies, a new election starts, and only a candidate with an up-to-date log can win.

You rarely implement this yourself. You use **etcd, ZooKeeper or Consul** for leader election, configuration, service discovery and distributed locks.

### Distributed locks and fencing
A lock service can hand a lock to client A, which then stalls (a GC pause), the lock expires, and client B takes it. Now both think they hold it. The fix is **fencing tokens**: every lock grant carries an increasing number, and the storage layer rejects writes carrying an older token.

## Key takeaways
- `W + R > N` makes read and write quorums overlap.
- Consensus (Raft/Paxos) needs a majority: 2f + 1 nodes tolerate f failures.
- Use etcd or ZooKeeper for elections and locks rather than rolling your own.
- Locks with expiry need fencing tokens to be safe.

## Go deeper
- [The Raft consensus algorithm](https://raft.github.io/)
- [How to do distributed locking (Martin Kleppmann)](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
