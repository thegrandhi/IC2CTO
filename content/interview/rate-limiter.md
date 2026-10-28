## Requirements

::: ask clarify
Rate limiting means different things to different teams. What do you need to know?
- [key] What do we limit by: API key, user, IP address, endpoint? => Per API key, with different limits per endpoint for some plans.
- [key] When a client is over the limit, do we reject or slow them down? => Reject with an error. No queueing.
- [key] How exact must it be? Is a small overshoot OK? => A small, bounded overshoot is fine. We care about protecting the backends, not about counting to the exact request.
- [key] If the limiter itself breaks, should requests be allowed or blocked? => Keep the API up. A broken limiter shouldn't take down the whole platform.
- [ok] Do limits change per customer plan at runtime? => Yes. Sales changes plans often, and that shouldn't need a deploy.
- [weak] What should the error page look like? => It's an API. A JSON error body is enough.
- [weak] Which programming language are the backends written in? => A mix. It doesn't matter for the limiter.
???
The limiting key and windows define the counters. Hard rejects mean a synchronous check. Tolerating a small overshoot lets you trade exactness for speed, and the fail-open answer tells you how to handle limiter outages.
:::

::: pick scope
What's in scope? Pick everything you'd build.
- [x] Per-key limits with several windows, like per second and per day => The core.
- [x] Rejecting with 429, a Retry-After header and remaining-quota headers => Clients need to know when to retry.
- [x] Changing limits without a redeploy => The interviewer said plans change often.
- [ ] Network-level DDoS protection => That happens before traffic reaches you, at the network or CDN layer. Different problem.
- [ ] Billing customers for extra usage => A separate system that can read the same counters later.
- [ ] A dashboard of every customer's traffic => Useful, but it's an analytics product, not the limiter.
???
Enforcement, clear responses and runtime configuration are the limiter. DDoS protection and billing are neighbouring systems.
:::

::: choice priority
Which non-functional requirement drives the design?
- [ ] Counting every request exactly => The interviewer said a small overshoot is fine.
- [x] Adding almost no latency and never taking the API down => Right. The limiter sits on every request, so it must be very fast (1–2 ms) and fail safely.
- [ ] Keeping a permanent record of every request => That's logging or analytics, not limiting.
- [ ] Strong consistency across regions => Usually not worth the cross-region latency on every request.
???
The limiter runs on every single API call. If it's slow, the whole API is slow; if it's down, the whole API is down. Speed and availability beat precision here.
:::

## Estimation

::: choice per-node
The platform handles 2 million requests a second across 50 gateway nodes. How many checks per second does each node make?
- [ ] About 4,000 => 10× too low.
- [x] About 40,000 => Right. 2M ÷ 50 = 40,000 checks per second per node.
- [ ] About 400,000 => 10× too high.
- [ ] About 2 million => That's the whole platform, not one node.
???
2,000,000 ÷ 50 = 40,000 per node. That's fine for an in-process check, but if every check is a network round trip, the counter store sees the full 2 million per second.
:::

::: choice shards
Every check is one operation on a shared Redis store, so that's 2 million operations a second. One Redis shard handles roughly 100,000 operations a second. How many shards?
- [ ] 1 shard, since Redis is fast => One shard tops out around 100k ops/s, 20× short.
- [ ] About 5 shards => Still 4× short of 2 million a second.
- [x] 20 or more shards, plus headroom => Right. 2M ÷ 100k = 20, so plan for more like 30–40.
- [ ] About 2,000 shards => Way more than needed.
???
2,000,000 ÷ 100,000 = 20 shards at full load. Add headroom for peaks and failures, and shard by key so each key's counters live on exactly one shard.
:::

## API

::: choice reject
A client goes over its limit. What does the API return?
- [ ] 200 with an error message in the body => Clients and proxies will treat it as success.
- [ ] 503 Service Unavailable => That says the server is broken, and clients will retry immediately.
- [x] 429 Too Many Requests, with Retry-After and rate-limit headers => Right. It tells the client exactly what happened and when to try again.
- [ ] 403 Forbidden => That means "you're not allowed", not "slow down", and clients won't retry.
???
`429 Too Many Requests` with `Retry-After` and `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` lets well-behaved clients back off on their own.
:::

## Data model

::: choice counters
Where do the counters live?
- [ ] A relational database, one row per key, updated on every request => 2 million row updates a second with locking is far too slow for a 1–2 ms budget.
- [ ] Only in each gateway's memory => Fast, but each node only sees its own share of traffic, so a client spread across 50 nodes gets 50× its limit.
- [x] An in-memory store like Redis, sharded by key, with a TTL on every counter => Right. Shared across gateways, fast, and idle keys expire on their own.
- [ ] A log of every request with its timestamp => Exact, but storing every timestamp for millions of requests a second uses far too much memory.
???
Counters are hot and short-lived: keep them in Redis, keyed like `rl:{key}:{rule}`, with a TTL so idle keys disappear. The rules (plan → limits) are small and change rarely, so cache them in every gateway.
:::

## High-level design

::: path request-path
Build the path of an API request that's under its limit, from the client to the code that serves it.
1. Client
2. Load balancer (optional)
3. API gateway
4. Rate limiter check
5. Backend service
- extra: Config database => Limits are cached in each gateway and pushed when they change. The config database is never on the request path.
- extra: Message queue => Over-limit requests are rejected, not queued, and allowed ones go straight through.
- extra: Analytics pipeline => Rejection metrics are emitted asynchronously, off the request path.
???
Put the check in the gateway (as a library or sidecar) so rejected requests never reach the backends. The check itself is a single round trip to the Redis shard that owns the key.
:::

## Deep dives

::: choice algorithm
Which algorithm do you use by default?
- [x] Token bucket: refill at the allowed rate, spend a token per request => Right. It allows short bursts but enforces the average, and needs just two numbers per key.
- [ ] Fixed window: count requests per calendar minute => Cheapest, but a client can send double the limit across a window boundary.
- [ ] Sliding window log: store every request's timestamp => Exact, but the memory cost is huge at millions of requests a second.
- [ ] Leaky bucket queue: hold requests and release them steadily => That queues requests, and the interviewer wants rejects.
???
Token bucket is the usual default: two values per key (tokens, last refill time). A sliding window counter (current + previous window × overlap) is a good choice for per-day limits.
:::

::: choice race
Two gateways check the same key at the same instant. Both read "99 of 100 used" and both allow the request. How do you fix it?
- [ ] Add a distributed lock around every check => Correct, but a lock round trip on every request blows the latency budget.
- [x] Do the read, refill and decrement in one atomic operation on Redis, like a Lua script => Right. Redis runs the script on the shard that owns the key with nothing in between.
- [ ] Accept it, since it's only one extra request => Under heavy concurrency it's far more than one, and it's unbounded.
- [ ] Route each key to a single gateway => Possible, but it makes load balancing much harder. Atomic operations solve it more simply.
???
Read-then-write from separate machines always races. Make the whole check one atomic server-side operation: `INCR` + `EXPIRE` for window counters, or a Lua script for token buckets.
:::

::: choice redis-down
A Redis shard goes down. What does the limiter do for keys on that shard?
- [ ] Reject every request until it's back => You'd take down the API for those customers. The interviewer said to keep it up.
- [x] Fail open with a conservative local limit in each gateway, and alert => Right. The API stays up, with rough protection until the shard recovers.
- [ ] Wait for Redis with no timeout => A hung limiter is worse than none: every request stalls.
- [ ] Switch to counting in a SQL database => Far too slow for this traffic, and it would likely fall over too.
???
Keep limiter calls under a tight timeout (around 5 ms). On failure, fail open but fall back to a local per-node bucket, so a misbehaving client still can't flood the backends. Security-sensitive endpoints like login can fail closed instead.
:::

::: choice hot-key
One huge customer sends 300,000 requests a second on a single key, all landing on one Redis shard. What helps?
- [ ] Add more Redis shards => The traffic is on one key, which lives on one shard. More shards don't split a single key.
- [ ] Give that customer a separate Redis instance => It moves the problem, but one key is still one hot spot.
- [ ] Ask the customer to slow down => You'd rather your design handled your biggest customers.
- [x] Let each gateway take tokens in batches (say 100 at a time) and spend them locally => Right. Redis sees 100× fewer calls for that key, at the cost of a little precision.
???
Local pre-allocation trades a bounded amount of accuracy for far fewer round trips. You can also split a global budget across nodes (limit ÷ N per node) and rebalance periodically.
:::

## Wrap-up

::: choice bottleneck
What's the main bottleneck to watch as traffic grows?
- [ ] The backend services => The limiter protects them. That's its job.
- [ ] The rules config database => Rules are cached in every gateway, so it's barely touched.
- [x] The shared counter store => Right. Every request touches it. Shard by key, keep each check to one round trip, and batch tokens for hot keys.
- [ ] The client SDKs => They just read the 429 headers.
???
Track limiter latency, Redis load per shard and rejection rates per key. When a shard runs hot, add shards or move hot keys to local token batches.
:::
