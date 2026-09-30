# Product Design

```meta
description: Interview framework, feeds and fan-out, reliability, and product-level tradeoffs.
```

::: order pd-interview-steps
lesson: design-framework
Order the steps of a system design interview.

1. Clarify functional and non-functional requirements
2. Estimate scale (QPS, storage)
3. Define the API
4. Sketch the data model
5. Draw the high-level design
6. Deep-dive into the hardest components
7. Wrap up with bottlenecks and next steps
???
Requirements keep you from designing the wrong system. Estimation tells you whether scale matters. The API and data model pin down what the system does. Only then draw boxes, deep-dive where the risk is, and close with tradeoffs, failure modes and follow-ups.
:::

::: mcq pd-first-move
lesson: design-framework
The interviewer says "Design Instagram." What should you do first?

- [ ] Draw the load balancers and databases
- [ ] Pick Cassandra for scale
- [x] Ask which features are in scope and what scale and latency matter
- [ ] Start estimating storage for all photos ever uploaded
???
"Instagram" could mean uploads, feeds, stories, DMs, search, ads… Scoping to 3–5 core features (upload, follow, home feed) and agreeing on the non-functional requirements (DAU, latency, consistency) turns an impossible question into a tractable one, and it's part of the evaluation.
:::

::: mcq pd-celebrity
lesson: fanout
A feed uses fan-out-on-write. A celebrity with 80 million followers posts. What's the problem, and a common fix?

- [ ] No problem; the queue absorbs it instantly
- [x] 80M feed writes per post; don't fan out celebrities, merge their posts at read time instead
- [ ] The post is too big; compress it
- [ ] Followers' feeds are locked; use optimistic locking
???
This is the **celebrity problem**: write amplification scales with follower count. The **hybrid** approach pushes posts from normal users into followers' precomputed feeds, but **pulls** celebrity posts at read time and merges them. Only active users' feeds are precomputed at all.
:::

::: match pd-fanout-tradeoffs
lesson: fanout
Match each feed strategy to its property.

- Fan-out on write (push) => Fast feed reads, expensive posting for big accounts
- Fan-out on read (pull) => Cheap posting, expensive feed reads
- Hybrid => Push for most accounts, pull for celebrities
???
Push precomputes feeds when posts are written, so reads are just a list lookup. Pull assembles the feed at read time from everyone you follow. Real systems mix them to avoid both the celebrity write storm and the slow merge for heavy readers.
:::

::: mcq pd-feed-storage
lesson: fanout
What does a precomputed home feed usually store per user?

- [ ] Full copies of every post, including images
- [x] A capped list of recent post IDs; post content is fetched (and cached) separately
- [ ] Only the IDs of followed users
- [ ] A SQL view recomputed on every request
???
Storing **IDs** keeps each feed small (say the last few hundred entries, in Redis) and avoids duplicating content across millions of feeds. Feed reads fetch the IDs, then **hydrate** posts in batches from a post cache or store. Media stays in blob storage behind a CDN.
:::

::: mcq pd-slo
lesson: observability-reliability
A service has a **99.9% availability SLO** over 30 days. About how much downtime is allowed?

- [ ] ~4 minutes
- [x] ~43 minutes
- [ ] ~7 hours
- [ ] ~3 days
???
0.1% of 30 days = 0.001 × 43,200 minutes ≈ **43 minutes**. That's the **error budget**. 99.99% allows about 4.3 minutes, and each extra nine costs dramatically more engineering effort.
:::

::: mcq pd-p99
lesson: observability-reliability
Why track **p99 latency** instead of just the average?

- [ ] Averages are harder to compute
- [x] Averages hide the slow tail that real users hit, and one page often makes many calls
- [ ] p99 is always lower than the average
- [ ] SLOs can only be written in percentiles for legal reasons
???
An average of 50 ms can hide 1% of requests taking 3 s. If one page makes 20 backend calls, most page loads include at least one slow call. Percentiles (p50, p95, p99) show what users actually experience.
:::

::: mcq pd-circuit-breaker
lesson: observability-reliability
A downstream recommendation service starts timing out. What does a **circuit breaker** do?

- [ ] Retries every request until it succeeds
- [x] After repeated failures, fails fast for a cool-down period, then lets a trial request probe for recovery
- [ ] Restarts the downstream service
- [ ] Moves traffic to another region permanently
???
Without a breaker, every request waits for a timeout, tying up threads and piling load onto a struggling service, so the failure **cascades** upstream. An open breaker returns immediately (usually with a fallback, such as hiding recommendations), then half-opens to test for recovery.
:::

::: mcq pd-degrade
lesson: observability-reliability
Your product catalog search cluster is down. What's the best **graceful degradation**?

- [ ] Return 500 for the whole product page
- [x] Keep the page working: hide or simplify search and serve cached or popular results
- [ ] Put the site into maintenance mode
- [ ] Retry search forever
???
Decide **in advance** which features are optional. A worse but working experience (cached results, a disabled widget, a stale feed) beats a total outage. Isolate optional dependencies with timeouts and circuit breakers so they can't take down critical paths.
:::

::: match pd-observability
lesson: observability-reliability
Match each tool to the question it answers best.

- Metrics dashboard => Is the error rate or p99 latency rising right now?
- Structured logs => What exactly happened in request 7f3c?
- Distributed trace => Which service in the call chain made this request slow?
???
**Metrics** are cheap aggregates, good for alerts and trends. **Logs** are detailed per-event records, good for forensics when tagged with a request ID. **Traces** follow one request across services to show where time went. You need all three.
:::

::: mcq pd-alerting
lesson: observability-reliability
Which alert is the best one to page an engineer at 3 a.m.?

- [ ] CPU above 80% on one host
- [ ] Disk usage at 60%
- [x] Checkout error rate is burning the SLO's error budget quickly
- [ ] A deploy finished
???
Page on **symptoms users feel**, tied to SLOs. A single host's CPU is often harmless (autoscaling or the load balancer handle it). Cause-based signals belong on dashboards or in low-urgency tickets.
:::

::: mcq pd-single-point
lesson: observability-reliability
Which component is most often forgotten as a **single point of failure**?

- [ ] The application servers behind a load balancer
- [x] The load balancer itself, or a single-instance cache or database
- [ ] The CDN
- [ ] The client app
???
Teams often scale the app tier but leave one load balancer, one Redis, or one database primary without automated failover. Redundancy (across availability zones) is needed at **every** layer, including DNS, load balancers, caches and data stores.
:::

::: mcq pd-rpo-rto
lesson: observability-reliability
"We can lose at most 5 minutes of data, and must be back up within 1 hour." Which terms are these?

- [ ] SLI = 5 min, SLO = 1 h
- [x] RPO = 5 min (acceptable data loss), RTO = 1 h (acceptable recovery time)
- [ ] RTO = 5 min, RPO = 1 h
- [ ] p99 = 5 min, p50 = 1 h
???
**RPO** (recovery point objective) bounds data loss, which drives replication and backup frequency. **RTO** (recovery time objective) bounds downtime, which drives failover automation and runbooks. Tighter targets cost more, so set them per system.
:::

::: mcq pd-counter-hot
lesson: caching
A live event shows a view counter that 2 million viewers increment every second. The database row becomes a hot spot. What helps most?

- [ ] Put a unique index on the counter
- [x] Aggregate increments in memory or in sharded counters, and flush periodically
- [ ] Use serializable isolation
- [ ] Store the counter in blob storage
???
Millions of writes to **one row** serialize on its lock. Split the counter into N shards (increment a random one, sum them to read), or buffer increments in memory or a stream and write aggregates every second. Viewers don't need an exact, real-time number.
:::

::: mcq pd-typeahead
lesson: search-and-geo
For search **autocomplete** that must respond in under 50 ms, what's the classic structure?

- [ ] A SQL `LIKE 'prefix%'` query on every keystroke
- [x] A trie (or prefix index) with the top-k completions precomputed at each node, served from memory
- [ ] A full-text search over all documents per keystroke
- [ ] A queue of recent searches
???
Precomputing the top-k suggestions for each prefix makes a lookup O(length of the prefix). The data is rebuilt offline from query logs, sharded by prefix, and cached at the edge and on the client. Debounce keystrokes to cut requests.
:::
