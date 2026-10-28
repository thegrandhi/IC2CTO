## Requirements

::: ask clarify
Building a database is a big topic. What do you want to clarify first?
- [key] What consistency do clients need: strong, eventual, or chosen per request? => Tunable per request. Most reads can be eventually consistent, but some callers need to read their own latest write.
- [key] What should happen during a network partition: stay available or refuse writes? => Stay available for writes. Losing writes is worse than a short period of inconsistency.
- [key] How big are values, and is it only lookups by key or range queries too? => Values up to about 1 MB. Only point lookups by key.
- [key] What scale: data size and operations per second? => About 100 TB of data and a million operations a second.
- [ok] Single region or several? => One region with several availability zones for now.
- [weak] What should the admin dashboard show? => Out of scope.
- [weak] Which client languages need SDKs? => Doesn't matter for the design.
???
Consistency and partition behaviour decide replication and quorums (where you sit on CAP). Point lookups only means hash partitioning works. Data size and throughput give you the node count.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] put, get and delete by key => The core API.
- [x] Consistency chosen per request => The interviewer asked for it.
- [x] Nodes joining, leaving and failing without downtime => Essential for hundreds of nodes.
- [x] Optional expiry (TTL) on values => Cheap to support, and common.
- [ ] SQL queries with joins => It's a key-value store.
- [ ] Transactions across many keys => Much harder, and not asked for.
- [ ] Range scans over keys => The interviewer said point lookups only.
???
A key-value store's hard problems are distribution and failure handling, not query features. Keep the API tiny and spend the time on partitioning, replication and recovery.
:::

::: choice priority
Which requirement shapes this design the most?
- [x] Staying available and scaling out across hundreds of nodes, with tunable consistency => Right. That's the Dynamo/Cassandra design point.
- [ ] Strong consistency for every operation => The interviewer said tunable, and availability during partitions comes first.
- [ ] Rich query support => Point lookups only.
- [ ] Running on a single big server => 100 TB and a million ops a second need many nodes.
???
Availability plus horizontal scale plus per-request consistency leads to leaderless replication, quorums and consistent hashing.
:::

## Estimation

::: choice nodes
100 TB of data, stored 3 times for safety. Each node has about 2 TB of usable disk. How many nodes, before headroom?
- [ ] About 50 => That ignores replication: 3 copies means 300 TB.
- [x] About 150 => Right. 100 TB × 3 = 300 TB ÷ 2 TB per node = 150 nodes, more with headroom.
- [ ] About 1,500 => 10× too many.
- [ ] About 3 => 2 TB per node can't hold 300 TB on 3 machines.
???
100 TB × 3 replicas = 300 TB. ÷ 2 TB per node ≈ 150 nodes, plus spare capacity for compaction and growth. At a million ops a second, that's only ~7k ops/s per node, which is easy.
:::

## API

::: choice delete
How does `delete(key)` work in a replicated store?
- [ ] Remove the key from each replica immediately => A replica that missed the delete still has the old value, and repair will copy it back: the deleted value comes back to life.
- [x] Write a tombstone marker that's kept for a while before being cleaned up => Right. Replicas that missed the delete learn about it, and the value can't come back.
- [ ] Set the value to an empty string => Indistinguishable from a real empty value.
- [ ] Deletes aren't supported => The interviewer asked for them.
???
A delete is a write of a tombstone. Compaction drops tombstones only after a grace period long enough for every replica to have seen them.
:::

## Data model

::: choice partitioning
How do you decide which nodes store a key?
- [ ] `hash(key) % number_of_nodes` => Adding one node changes almost every key's location, so nearly all data moves.
- [ ] Split keys alphabetically by first letter => Some letters are far more common, so nodes end up very uneven.
- [x] Consistent hashing with virtual nodes => Right. Adding a node moves only about 1/N of the data, spread evenly across many nodes.
- [ ] A central directory service that maps every key => It becomes a bottleneck and a single point of failure.
???
Hash keys onto a ring. Each physical node owns many small virtual nodes, so load is even and bigger machines can take more. A key lives on the next N distinct nodes clockwise.
:::

::: choice engine
Which storage engine do you use on each node for a write-heavy workload?
- [ ] A B-tree updated in place => Fine for reads, but random writes in place are slower on heavy write loads.
- [ ] One file per key => Millions of tiny files are slow and wasteful.
- [ ] Keep everything in memory only => 2 TB per node doesn't fit in RAM, and a restart would lose it.
- [x] A log-structured merge tree (LSM) => Right. Writes go to a log and a memory table, then flush to sorted files that are merged in the background.
???
LSM: write-ahead log + memtable → sorted SSTables on disk → background compaction. Bloom filters per SSTable let reads skip files that can't contain the key.
:::

## High-level design

::: path write-path
Build the path of a `put` on one replica, from the client until the replica can acknowledge it.
1. Client
2. Coordinator node
3. Write-ahead log
4. Memtable
- extra: SSTable on disk => The memtable is flushed to SSTables later, in the background. The write is already safe in the log.
- extra: Central master => There's no master. Any node can coordinate a request.
- extra: Merkle tree => Used by background anti-entropy repair, not on a write.
???
The coordinator hashes the key, finds its N replicas and sends the write to all of them. Each replica appends to its write-ahead log (for durability) and updates its in-memory table, then acks. The coordinator answers the client after W acks.
:::

::: path read-path
Now the path of a `get` on one replica.
1. Client
2. Coordinator node
3. Memtable
4. Bloom filters
5. SSTables on disk
- extra: Write-ahead log => Only read when recovering after a crash.
- extra: Hinted handoff store => Holds writes for nodes that are down. Not part of a normal read.
- extra: Gossip protocol => Shares membership and failure information in the background.
???
Check the memtable first (newest data), then the SSTables from newest to oldest. Bloom filters say "definitely not here" for most files, so the replica touches very few files on disk.
:::

## Deep dives

::: choice quorum
You keep N = 3 replicas. Which write (W) and read (R) quorum guarantees a read sees the latest successful write?
- [ ] W = 1, R = 1 => Fastest, but a read can hit a replica that hasn't seen the write.
- [x] W = 2, R = 2 => Right. W + R = 4 > 3, so every read set overlaps every write set in at least one replica.
- [ ] W = 1, R = 2 => W + R = 3, which isn't more than N, so the sets might not overlap.
- [ ] W = 3, R = 3 => It works, but one slow or failed replica blocks every request.
???
The rule is `W + R > N`. With N = 3, W = 2 and R = 2 is the usual balance. Clients that want speed over freshness use W = 1 or R = 1 for that request.
:::

::: choice replica-down
One of a key's three replicas is down during a write with W = 2. What keeps writes available, and how does the replica catch up?
- [ ] The write fails until the replica is back => With W = 2, two healthy replicas are enough to accept it.
- [x] Another node stores the write with a hint and forwards it when the replica returns => Right. That's hinted handoff.
- [ ] The coordinator retries forever => Clients would hang.
- [ ] Copy the whole node's data back when it returns => Far more data movement than needed for a short outage.
???
Hinted handoff covers short outages. Read repair fixes stale values when they're read, and Merkle-tree anti-entropy finds anything else that drifted, by comparing hashes of key ranges.
:::

::: choice conflicts
During a network partition, two clients write different values to the same key on different replicas. How do you resolve it afterwards?
- [ ] Keep whichever value arrived first at each replica => Replicas would disagree forever.
- [ ] Reject both writes => The interviewer wants writes to stay available.
- [ ] Ask an administrator to pick => It can't scale to millions of keys.
- [x] Last-write-wins by timestamp, or vector clocks to detect conflicts and let the client merge => Right. LWW is simple but can silently drop a write. Vector clocks keep both versions so nothing is lost.
???
LWW is the common default (Cassandra), but clock skew means a write can be lost. Vector clocks (Dynamo) detect concurrent versions and return them for the application to merge. CRDT types like counters and sets merge automatically.
:::

::: choice membership
How do 150 nodes learn which nodes are alive and who owns which keys?
- [ ] A single coordinator node that all others ask => A single point of failure, and a bottleneck.
- [x] A gossip protocol: nodes periodically share what they know with a few random peers => Right. Information spreads to everyone in a few rounds with no central coordinator.
- [ ] Each node pings every other node every second => 150 × 150 pings a second, and it gets worse as you grow.
- [ ] Clients report which nodes seem down => Clients see too little to judge.
???
Gossip spreads membership and failure suspicion in O(log N) rounds. A phi-accrual failure detector adapts to network jitter, so a slow network doesn't trigger false alarms.
:::

## Wrap-up

::: choice hot-key
Final question: one key gets 50,000 reads a second. What helps most?
- [ ] Add more nodes => The key still lives on the same 3 replicas.
- [ ] Increase the replication factor for the whole cluster => Triples storage for every key to fix one.
- [x] Cache that key in front of the store, or spread reads across all its replicas with R = 1 => Right. A cache absorbs the reads, and R = 1 reads can use any of the replicas.
- [ ] Rename the key regularly => It moves the hot spot around without removing it.
???
Watch for hot keys, compaction I/O and cross-zone latency. For very hot keys, cache them, or split them into several keys and combine on read.
:::
