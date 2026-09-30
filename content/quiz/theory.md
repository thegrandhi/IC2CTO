# Distributed Systems Theory

```meta
description: CAP and PACELC, consistency models, quorums, consensus, and estimation.
```

::: mcq th-cap-partition
lesson: cap-pacelc
According to CAP, what must a distributed database choose **during a network partition**?

- [ ] Between consistency and partition tolerance
- [x] Between consistency (refuse some requests) and availability (answer, possibly with stale data)
- [ ] Between availability and durability
- [ ] Nothing, because modern databases avoid partitions
???
Partitions happen whether you like it or not, so "P" isn't optional. While nodes can't talk to each other, each side either **rejects** requests it can't serve consistently (CP), or **keeps serving** and reconciles later (AP).
:::

::: mcq th-cap-c
lesson: cap-pacelc
The "C" in CAP means the same thing as the "C" in ACID.

- [ ] True
- [x] False
???
CAP's **C is linearizability**: every read sees the most recent write, as if there were one copy of the data. ACID's **C** means transactions keep the database in a valid state (constraints, invariants). They're different ideas that happen to share a letter.
:::

::: match th-cp-ap
lesson: cap-pacelc
Match each use case to the side of CAP it should favour.

- Bank account balance => CP: refuse writes rather than risk double-spending
- Shopping cart contents => AP: accept adds on both sides, merge later
- Distributed lock / leader election => CP: grant only with a majority's agreement
- Social media like counts => AP: serve a slightly stale count
???
If a stale or conflicting answer causes real harm (double-spending, two leaders), refuse to answer during a partition: **CP**. If a slightly stale or later-merged answer is fine (a cart can union items, a like count can lag), stay available: **AP**. Good designs choose **per feature**.
:::

::: mcq th-pacelc
lesson: cap-pacelc
What does the "ELC" part of **PACELC** add to CAP?

- [ ] Encryption, Logging, Compression
- [x] Else (no partition), systems still trade Latency against Consistency
- [ ] Every Leader Commits
- [ ] Eventual consistency Leads to Correctness
???
Even when the network is healthy, waiting for replicas in other zones or regions before acknowledging (for strong consistency) adds latency to **every** request. PACELC names this everyday tradeoff: Cassandra defaults to low latency (EL), Spanner to consistency (EC).
:::

::: mcq th-linearizable
lesson: consistency-models
Which feature most clearly **requires** linearizable (strong) consistency?

- [ ] Showing a view count on a video
- [x] Guaranteeing that two people can't register the same username
- [ ] Displaying a news feed
- [ ] Recommending products
???
Uniqueness is a "check then act" on the latest state: if two replicas both answer "available", both users get the name. That requires a single, up-to-date view of the data (a linearizable register, or a unique constraint on one leader). Counts, feeds and recommendations tolerate staleness.
:::

::: mcq th-monotonic-reads
lesson: consistency-models
A user refreshes and sees 5 comments, refreshes again and sees 3, then 5 again. Which guarantee is being violated?

- [ ] Read-your-writes
- [x] Monotonic reads
- [ ] Durability
- [ ] Atomicity
???
Successive reads hit replicas with different lag, so time appears to **go backwards**. Monotonic reads guarantee you never see older data after newer data, usually by pinning a user's session to one replica or tracking a minimum version.
:::

::: mcq th-causal
lesson: consistency-models
Which model guarantees that a reply is never shown before the comment it replies to, while allowing unrelated posts to appear in different orders to different users?

- [ ] Eventual consistency
- [x] Causal consistency
- [ ] Linearizability
- [ ] Read committed
???
**Causal consistency** preserves cause → effect ordering, and nothing more. It's cheaper than a global total order (linearizability) and removes the confusing anomalies, which is why it's a sweet spot for collaborative and social features.
:::

::: mcq th-lww
lesson: consistency-models
What's the main downside of **last-write-wins** conflict resolution?

- [ ] It needs consensus for every write
- [x] Concurrent writes are silently discarded, and clock skew can drop even the "later" write
- [ ] It only works with integers
- [ ] It makes reads slower
???
LWW keeps whichever write has the higher timestamp and **throws the other away without telling anyone**. Clocks drift, so the "last" one may not truly be last. For data where losing updates matters, use version vectors to detect conflicts, or **CRDTs** that merge automatically.
:::

::: mcq th-quorum
lesson: consensus-quorums
With `N = 3` replicas, which setting guarantees that every read sees the latest acknowledged write?

- [ ] `W = 1, R = 1`
- [ ] `W = 1, R = 2`
- [x] `W = 2, R = 2`
- [ ] `W = 2, R = 1`
???
Reads are guaranteed to overlap the latest write when **`W + R > N`**. Here `2 + 2 = 4 > 3`, so any 2 replicas you read include at least one of the 2 that took the write. `W = 1, R = 2` is only 3, not greater than 3, so there's no guaranteed overlap.
:::

::: mcq th-majority
lesson: consensus-quorums
How many node failures can a 5-node Raft cluster tolerate while still making progress?

- [ ] 1
- [x] 2
- [ ] 3
- [ ] 4
???
Raft needs a **majority** (3 of 5) to elect a leader and commit entries. It can lose 2 nodes. In general, 2f + 1 nodes tolerate f failures, which is why clusters use odd sizes: a 6th node wouldn't tolerate a 3rd failure.
:::

::: mcq th-even-cluster
lesson: consensus-quorums
Why is a 4-node consensus cluster usually a worse choice than 3 nodes?

- [ ] 4 nodes can't elect a leader
- [x] It still tolerates only 1 failure (majority = 3) but costs more and has more to fail
- [ ] Raft requires a prime number of nodes
- [ ] 4 nodes always split brain
???
A majority of 4 is 3, so losing 2 nodes stops progress. That's the same fault tolerance as 3 nodes (majority 2, tolerates 1), with an extra machine to pay for and more replication traffic. Go from 3 to **5** to tolerate 2 failures.
:::

::: mcq th-fencing
lesson: consensus-quorums
Client A holds a lock with a 10 s lease, then pauses for 15 s in garbage collection. Client B acquires the lock. A wakes up and writes. What prevents corruption?

- [ ] A longer lease
- [x] Fencing tokens: each lock grant carries an increasing number, and storage rejects writes with an older token
- [ ] Retrying A's write later
- [ ] Using Redis instead of ZooKeeper
???
Leases expire while a client is paused, and it can't know. **Fencing** moves the safety check to the resource: B's token is higher, so A's stale write (carrying the older token) is rejected. Longer leases only shrink the window.
:::

::: order th-latency-ladder
lesson: back-of-envelope
Order these from **fastest** to **slowest**.

1. L1 cache reference
2. Main memory reference
3. SSD random read
4. Round trip within the same datacenter
5. HDD disk seek
6. Round trip California ↔ Netherlands
???
Roughly: L1 ≈ 1 ns, RAM ≈ 100 ns, SSD read ≈ 16–100 µs, datacenter round trip ≈ 500 µs, disk seek ≈ 5–10 ms, transatlantic round trip ≈ 150 ms. The takeaway is the orders of magnitude: memory ≪ SSD ≪ network ≪ cross-world.
:::

::: mcq th-qps
lesson: back-of-envelope
100 million daily active users each make 20 requests per day. What's the **average** QPS, roughly?

- [ ] ~2,000
- [x] ~20,000
- [ ] ~200,000
- [ ] ~2,000,000
???
100M × 20 = 2 × 10⁹ requests per day. A day is ≈ 10⁵ seconds (86,400), so 2 × 10⁹ / 10⁵ = **2 × 10⁴ ≈ 20,000 QPS** on average. Plan for peaks of 2–3× that.
:::

::: mcq th-storage
lesson: back-of-envelope
A service stores 10 million new records per day at about 1 KB each. Roughly how much storage per year, **before** replication?

- [ ] ~365 MB
- [ ] ~36 GB
- [x] ~3.6 TB
- [ ] ~365 TB
???
10⁷ × 1 KB = 10 GB/day; × 365 ≈ 3.65 TB/year. With 3× replication, about 11 TB, still modest for modern databases but large enough to plan partitioning and retention.
:::

::: mcq th-seconds-day
lesson: back-of-envelope
What's the handy approximation for the number of seconds in a day?

- [ ] 10³
- [ ] 10⁴
- [x] 10⁵
- [ ] 10⁶
???
86,400 ≈ 10⁵. Dividing daily totals by 10⁵ converts them straight to per-second rates, which is the most-used step in back-of-the-envelope math.
:::

::: mcq th-eventual
lesson: consistency-models
What does **eventual consistency** actually promise?

- [ ] Reads are always at most one second stale
- [x] If writes stop, all replicas eventually converge to the same value
- [ ] Every read returns the latest write
- [ ] Writes are never lost
???
Eventual consistency is a **liveness** promise with no time bound: replicas converge *eventually* once updates stop. It says nothing about how stale a read may be meanwhile, which is why session guarantees (read-your-writes, monotonic reads) are often layered on top.
:::

::: mcq th-2pc
lesson: transactions-acid
What's the main weakness of **two-phase commit** (2PC)?

- [ ] It can't handle more than two participants
- [x] If the coordinator fails after "prepare", participants can be left blocked, holding locks
- [ ] It doesn't guarantee atomicity
- [ ] It only works with NoSQL databases
???
In 2PC, participants that voted "yes" must wait for the coordinator's decision. If the coordinator crashes, they're **stuck in doubt** with locks held. Combined with its latency, that's why microservices usually prefer sagas with compensating actions.
:::
