# Databases

```meta
description: Indexes, replication, sharding, transactions, and picking the right datastore.
```

::: mcq db-read-replicas
lesson: replication
Your app's primary database sits at 90% CPU, almost all of it from `SELECT` queries; writes are light. What's the most direct fix?

- [ ] Shard the database by user ID
- [x] Add read replicas and route read queries to them
- [ ] Switch to a NoSQL database
- [ ] Add more application servers
???
The bottleneck is **read** load on a single node. Read replicas receive the primary's changes asynchronously and serve reads, so read capacity grows with each replica. Sharding is for when *writes* or *data size* outgrow one node, and it's far more complex. More app servers would just send more queries to the same overloaded database.

The catch: replicas lag slightly, so a user might not see their own write straight away. Route those reads to the primary.
:::

::: mcq db-read-your-writes
lesson: replication
A user edits their bio, the page reloads, and the **old bio** appears. A second reload shows the new one. Reads go to async replicas. What's the most targeted fix?

- [ ] Make all replication synchronous
- [x] Read the user's own profile from the primary for a short time after they write it
- [ ] Add a CDN in front of the API
- [ ] Increase the replicas' TTL
???
This is a **read-your-writes** violation caused by replication lag. The cheapest fix routes *that user's* reads of data they just changed to the primary (for a few seconds, or until the replica catches up to a version token). Making all replication synchronous slows every write and hurts availability just to fix one user-visible case.
:::

::: mcq db-composite-index
lesson: indexes
You have an index on `(user_id, created_at)`. Which query **can't** use it efficiently?

- [ ] `WHERE user_id = 7`
- [ ] `WHERE user_id = 7 AND created_at > '2026-01-01'`
- [ ] `WHERE user_id = 7 ORDER BY created_at DESC LIMIT 20`
- [x] `WHERE created_at > '2026-01-01'`
???
A composite B-tree index is sorted by its **leftmost column first** (`user_id`), then by `created_at` *within* each user. Queries must constrain a **leftmost prefix** of the columns. Filtering only on `created_at` skips the leading column, so the index can't narrow the search; you'd need a separate index on `created_at`.
:::

::: mcq db-index-cost
lesson: indexes
A write-heavy events table has **eleven** indexes and inserts are getting slow. What's the most likely reason?

- [ ] Indexes make each row larger on disk
- [x] Every insert must also update all eleven index structures
- [ ] Indexes force full table locks during writes
- [ ] The query planner re-plans every insert
???
Each index is a separate data structure (usually a B-tree) that must be updated on every insert, update and delete. Eleven indexes means roughly twelve writes per insert. Drop indexes that no query uses, and index for the real access patterns.
:::

::: mcq db-covering-index
lesson: indexes
What makes a **covering index** fast?

- [ ] It's stored entirely in memory
- [x] It contains every column the query needs, so the table itself is never read
- [ ] It covers every row, including NULLs
- [ ] It's automatically created for foreign keys
???
When all selected and filtered columns are in the index, the database can answer from the index alone (an **index-only scan**), skipping the extra lookup into the table for each matching row. That's often a big win for hot queries.
:::

::: mcq db-shard-key
lesson: sharding
You're sharding a chat app's messages table. Which shard key is best?

- [ ] `message_id` (random UUID)
- [x] `conversation_id`
- [ ] `created_at` date
- [ ] `sender_country`
???
The dominant query is "latest messages in conversation X". Sharding by `conversation_id` puts each conversation's messages on **one shard**, so that query hits a single node while conversations spread evenly. Random `message_id` spreads load but scatters every conversation across all shards. `created_at` sends all new writes to the newest shard (a hot spot). Country is low-cardinality and heavily skewed.
:::

::: mcq db-hot-partition
lesson: sharding
After range-sharding a table by `created_at`, one shard takes nearly all the writes. Why?

- [ ] Range sharding doesn't support indexes
- [x] New rows always have the latest timestamps, so they all land in the newest range
- [ ] The newest shard has less RAM
- [ ] Range sharding requires a leader for every shard
???
Monotonically increasing keys (timestamps, auto-increment IDs) always fall at the **end** of the key range, so one shard absorbs every insert. Hash the key, or prefix it with something high-cardinality (for example `hash(user_id) + timestamp`), to spread the writes.
:::

::: mcq db-when-to-shard
lesson: sharding
Which situation **most** justifies sharding a PostgreSQL database?

- [ ] Reads are slow on a table without indexes
- [ ] The database has 50 GB of data
- [x] Write throughput exceeds what the primary can sustain even after tuning
- [ ] You want to try microservices
???
Sharding spreads **writes and data** across machines. Slow reads without indexes need indexes. 50 GB fits comfortably on one server. Sharding adds major complexity (cross-shard queries, resharding, transactions), so reach for it only when one primary really can't keep up.
:::

::: match db-store-fit
lesson: sql-vs-nosql
Match each workload to the store that fits it best.

- Account balances and transfers => Relational database with ACID transactions
- User session lookups by token => Key-value store
- Billions of chat messages read per conversation, newest first => Wide-column store
- "Friends of friends who like jazz" => Graph database
???
Money needs **transactions and invariants** (relational). Sessions are pure **single-key lookups** (KV). Chat is **massive write volume, partitioned by conversation and sorted by time**, which is the wide-column sweet spot (Cassandra, for example). Multi-hop relationship traversal is what **graph** databases are built for.
:::

::: mcq db-nosql-justification
lesson: sql-vs-nosql
In an interview you say "I'll use MongoDB because it scales better." What's the strongest follow-up improvement?

- [ ] Say "and it's schemaless"
- [x] Justify the choice with the access pattern and numbers, and name what you give up (joins, multi-document transactions)
- [ ] Add Redis in front to be safe
- [ ] Switch to Cassandra, since it scales even better
???
"Scales better" without numbers is a red flag: a single relational primary with replicas handles a lot. Strong answers tie the store to the **data shape and access pattern** ("documents read as a whole by ID; flexible attributes"), cite the scale that matters, and state the tradeoffs.
:::

::: mcq db-lost-update
lesson: transactions-acid
Two requests each run `SELECT likes`, add 1 in application code, then `UPDATE posts SET likes = <new>`. Sometimes one like disappears. What's the cleanest fix?

- [ ] Put a cache in front of the database
- [x] Use an atomic update: `UPDATE posts SET likes = likes + 1 WHERE id = ?`
- [ ] Retry the update three times
- [ ] Read from the primary instead of a replica
???
This is a **lost update**: two read-modify-write cycles interleave and one overwrites the other. An atomic increment lets the database apply both changes correctly. Alternatives are `SELECT … FOR UPDATE` or optimistic concurrency with a version column, but the atomic update is simplest.
:::

::: order db-isolation-levels
lesson: transactions-acid
Order these isolation levels from **weakest** to **strongest**.

1. Read uncommitted
2. Read committed
3. Repeatable read (snapshot)
4. Serializable
???
Each level prevents more anomalies: read committed stops **dirty reads**; repeatable read stops **non-repeatable reads**; serializable also stops **phantoms and write skew**, behaving as if transactions ran one at a time. Stronger isolation costs more locking or more aborted retries.
:::

::: mcq db-write-skew
lesson: transactions-acid
Two on-call doctors each check "is someone else on call?" (yes), then both go off call, leaving nobody. Which anomaly is this?

- [ ] Dirty read
- [ ] Lost update
- [x] Write skew
- [ ] Phantom read only
???
**Write skew**: two transactions read overlapping data, make a decision from it, then write *different* rows, jointly breaking an invariant. Snapshot isolation doesn't prevent it. You need **serializable** isolation, or explicit locking of the rows the decision depends on (`SELECT … FOR UPDATE`).
:::

::: mcq db-saga
lesson: transactions-acid
An order flow spans three services: payments, inventory and shipping. How do you keep them consistent without a distributed lock across services?

- [ ] Two-phase commit across all three databases
- [x] A saga: a sequence of local transactions with compensating actions on failure
- [ ] Share one database between the services
- [ ] Retry until every call succeeds
???
**Sagas** break a distributed transaction into local steps (reserve inventory → charge card → create shipment). If a step fails, earlier steps are undone by **compensations** (release inventory, refund). 2PC blocks when a coordinator fails and couples service availability together.
:::

::: mcq db-failover-risk
lesson: replication
With **asynchronous** replication, what can happen when the leader crashes and a follower is promoted?

- [ ] Nothing, because async replication is lossless
- [x] Writes acknowledged by the old leader but not yet replicated are lost
- [ ] The follower refuses to become leader
- [ ] All replicas must be rebuilt from backup
???
With async replication the leader acknowledges writes **before** followers have them. If it dies, the promoted follower may be missing the last few writes. Synchronous (or semi-synchronous) replication closes that window at the cost of write latency.
:::

::: mcq db-split-brain
lesson: consensus-quorums
What is **split brain**?

- [ ] A table partitioned across two shards
- [x] Two nodes each believe they are the leader and both accept writes
- [ ] A query that joins two databases
- [ ] A cache that disagrees with the database
???
After a network partition or a botched failover, two leaders can accept conflicting writes that later can't be reconciled. Prevent it with **consensus-based leader election** (majority votes) and **fencing tokens**, so a stale leader's writes are rejected.
:::

::: mcq db-uuid-index
lesson: unique-ids
Why can random UUIDv4 primary keys slow down inserts in a B-tree index compared with time-ordered IDs?

- [ ] UUIDs can't be indexed
- [x] Random keys land all over the index, touching many pages instead of appending to the end
- [ ] UUIDs collide frequently
- [ ] B-trees only support integers
???
Sequential keys append to the **rightmost** page of the index, which stays hot in memory. Random keys scatter inserts across the whole tree, causing more page reads, splits and cache misses. Time-sortable IDs (**UUIDv7, ULID, Snowflake**) keep coordination-free generation *and* index locality.
:::

::: mcq db-base62
lesson: unique-ids
How many distinct short codes do **7 base62 characters** allow, roughly?

- [ ] 62 million
- [ ] 35 billion
- [x] 3.5 trillion
- [ ] 1 quadrillion
???
62⁷ ≈ 3.52 × 10¹² (3.5 trillion). At 100 million new URLs per day, that's about 96 years' worth, which is why 7 characters is a common choice for URL shorteners.
:::

::: mcq db-denormalize
lesson: sql-vs-nosql
In a wide-column or document store without joins, how do you usually serve a page that needs data from several entities?

- [ ] Run joins in the application for every request
- [x] Denormalize: design tables around queries, duplicating data so each query reads one partition
- [ ] Store everything in one giant row
- [ ] Add a relational database just for joins
???
NoSQL modelling is **query-first**: model each access pattern as a table or document that can be read with one lookup, duplicating fields as needed. The cost is keeping the copies in sync on writes, usually via events or batch jobs.
:::

::: mcq db-geohash
lesson: search-and-geo
How does a **geohash** help answer "find restaurants within 1 km"?

- [ ] It encrypts coordinates for privacy
- [x] Nearby points share a common prefix, so you query your cell and its neighbours by prefix
- [ ] It sorts points by distance from the equator
- [ ] It stores polygons for every city
???
Geohash interleaves latitude and longitude bits into a string where **a longer shared prefix means closer together** (mostly). Look up the target cell plus its 8 neighbours, then filter by exact distance. Neighbours matter because nearby points can sit on opposite sides of a cell border.
:::
