# Design a Distributed Rate Limiter

```meta
difficulty: Medium
minutes: 45
tags: token bucket, redis, api gateway
```

Design a rate-limiting service for a public API platform. Each API key has limits such as "100 requests per second" and "10,000 per day", and different endpoints may have different limits. The limiter runs in front of dozens of backend services and handles millions of requests per second.

## Clarifying questions
- Limit **per what**: API key, user, IP, endpoint, or a combination?
- **Hard** limits (reject) or **soft** limits (throttle or queue)?
- How precise must it be? Is a small overshoot acceptable?
- What happens when the limiter itself fails: **fail open or closed**?
- Where does it run: an API gateway, a sidecar, or a library in each service?
- Do limits change at runtime, per customer plan?

## Requirements
**Functional**
- Enforce configurable limits per key (and per endpoint), with multiple windows (per second, per day).
- Reject with `429` plus `Retry-After` and `X-RateLimit-*` headers.
- Update limits without redeploying.

**Non-functional**
- **Low latency**: < 1–2 ms added per request.
- **Highly available**: limiter failure must not take the API down.
- Scales to millions of checks per second across many gateway nodes.
- **Approximately accurate**: small, bounded overshoot is acceptable.

## Estimation
- 2M requests/s across 50 gateway nodes ≈ 40k/s per node.
- Each check costs 1 round trip to the counter store if centralized, so 2M store operations/s means a sharded Redis cluster (~100k+ ops/s per shard → 20+ shards, more for headroom).
- State: 10M active keys × a few counters × ~50 bytes ≈ a few GB, which fits in memory.

## API
Internal check API (or an in-process library call):
```
allow(key="apikey:123", rule="default", cost=1)
  → { allowed: true, remaining: 57, resetAt: 1767225600 }
```
Admin API: `PUT /v1/limits/{plan}` with `{ "rules": [ { "window": "1s", "limit": 100 }, { "window": "1d", "limit": 10000 } ] }`.

## Data model
- **Rules** (small, rarely changing): plan → list of `(scope, window, limit)`, kept in a config DB and cached in every gateway, refreshed by a push or a poll.
- **Counters** (hot, ephemeral): in Redis, keyed by `rl:{key}:{rule}:{windowId}` for window counters, or `rl:{key}:{rule}` → `{tokens, lastRefill}` for token buckets. Every counter has a TTL, so idle keys disappear.

## High-level design
```
Client ──► Edge / API gateway ──► [rate limiter check] ──► backend services
                     │
                     ├── local rules cache (config pushed from control plane)
                     └── Redis cluster (sharded by key) for counters
```
- The limiter lives **in the gateway** (a library or sidecar), so rejected requests never reach the backends.
- The check is one atomic Redis operation: a **Lua script** that refills the token bucket and consumes a token in one round trip, with no race conditions.

## Deep dives
**1. Algorithm choice**
- *Token bucket*: allows bursts up to capacity and enforces the average rate. Two numbers per key. **Default choice.**
- *Fixed window*: cheapest, but allows 2× bursts at window edges.
- *Sliding window log*: exact, but stores every timestamp, which is too much memory at this scale.
- *Sliding window counter*: `current + previous × overlap fraction`. Nearly exact with two counters, and good for per-day style limits.

**2. Atomicity and races**
- A read-then-write from gateways races (two gateways both see 99 < 100). Use `INCR` + `EXPIRE`, or a Lua script that computes the refill and consumption **atomically** on the Redis shard that owns the key.

**3. Latency and scale**
- Shard counters by key (consistent hashing / Redis Cluster slots).
- For very hot keys or extreme QPS: **local token buckets** in each gateway, with a global budget split across nodes (each node gets limit/N, rebalanced periodically). Accuracy drops, latency is zero.
- Batch: take tokens in chunks of 10 locally, then sync with Redis.

**4. Failure behaviour**
- Redis shard down → **fail open** with a conservative local limit, and alert. Security-sensitive endpoints (login) can fail closed.
- Keep limiter calls under a tight timeout (~5 ms). A slow limiter is worse than none.

**5. Multi-region**
- Per-region counters with limits divided by region (simple), or asynchronously replicated counters with a known, bounded overshoot. A truly global strict limit needs cross-region coordination, which is usually not worth the latency.

## Wrap-up
- Bottleneck: the counter store. Shard it, keep operations to one round trip, and use local pre-allocation for hot keys.
- Observability: rejection rate per key and endpoint, limiter latency, and Redis health.
- Extensions: priority tiers, cost-based limits (expensive endpoints cost more tokens), and an adaptive concurrency limiter for load shedding.

## Rubric
- Clarified the limiting dimensions (key/user/IP/endpoint), precision, and fail-open vs fail-closed
- Compared algorithms (token bucket, fixed window, sliding window) with tradeoffs
- Placed the limiter at the gateway/edge so rejected traffic never reaches the backends
- Used a shared, sharded counter store with atomic operations (Lua / INCR+EXPIRE)
- Addressed latency (single round trip, timeouts) and hot keys (local buckets / pre-allocation)
- Returned 429 with Retry-After and rate-limit headers
- Handled rules/config distribution without redeploys
- Discussed limiter failure behaviour explicitly
- Considered multi-region consistency vs latency
