# Consistency Models

```meta
category: theory
summary: From linearizable to eventual: what each guarantee means to a user.
minutes: 4
order: 19
```

A consistency model is a **contract** describing which values a read may return when data is replicated. The strongest models are the easiest to reason about and the most expensive to provide.

### From strongest to weakest (simplified)
- **Linearizability (strong consistency)**: the system behaves like a single copy. Once a write completes, every later read, from anyone, sees it. Needed for locks, leader election, unique usernames, and account balances.
- **Sequential consistency**: all clients see operations in the same order, but that order may lag real time.
- **Causal consistency**: if A caused B (a reply to a comment), everyone sees A before B. Unrelated writes may appear in different orders. It's a sweet spot for social features.
- **Eventual consistency**: if writes stop, all replicas eventually converge. Meanwhile, reads can be stale or out of order.

### Session guarantees (what users actually notice)
These make an eventually consistent system feel sane for each user:
- **Read-your-writes**: after I post, *I* always see my post.
- **Monotonic reads**: once I've seen a value, I never see an older one.
- **Monotonic writes**: my writes are applied in the order I made them.
- **Consistent prefix**: I never see an answer before its question.

Typical implementations: route a user's reads to the leader for a few seconds after a write, pin sessions to one replica, or carry a "last seen version" token that replicas must catch up to before answering.

### Conflict resolution under eventual consistency
When replicas accept concurrent writes, they must converge:
- **Last-write-wins (LWW)**: simple, but silently drops writes (and clocks drift).
- **Version vectors**: detect concurrent writes, then merge them or ask the application.
- **CRDTs**: data types (counters, sets, text) that merge automatically without conflicts. Used by collaborative editors.

## Key takeaways
- Linearizable means "one copy, real-time order"; eventual means "converges when writes stop".
- Causal consistency preserves cause → effect order and suits social features.
- Session guarantees (read-your-writes, monotonic reads) fix most user-visible weirdness.
- Concurrent writes need a merge strategy: LWW, version vectors, or CRDTs.

## Go deeper
- [Eventually consistent (Werner Vogels)](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html)
