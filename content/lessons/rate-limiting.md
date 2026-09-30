# Rate Limiting

```meta
category: apis
summary: Token bucket, leaky bucket, and window counters, and where to enforce them.
minutes: 5
order: 16
```

A **rate limiter** caps how many requests a client (user, API key or IP) can make in a time period. It protects services from abuse and overload, enforces pricing tiers, and keeps one noisy tenant from starving the others. Rejected requests get `429 Too Many Requests`, ideally with a `Retry-After` header.

### Algorithms
- **Token bucket**: a bucket holds up to `B` tokens and refills at `r` tokens per second. Each request spends a token; an empty bucket means rejection. Allows **bursts** up to `B` while enforcing the average rate `r`. It's the most common choice (used by AWS and Stripe).
- **Leaky bucket**: requests enter a queue that drains at a fixed rate. It smooths output to a constant rate, which suits traffic shaping more than API limits.
- **Fixed window counter**: count requests per calendar minute. Very cheap, but allows **2× bursts** at window boundaries (100 requests at 12:00:59 and another 100 at 12:01:00).
- **Sliding window log**: store every request timestamp. Exact, but memory-heavy.
- **Sliding window counter**: a weighted mix of the current and previous fixed windows. Nearly exact at the cost of two counters. A great practical default.

### Where to enforce
- At the **API gateway / edge**, before traffic reaches your services.
- Per service, as a second line of defence.
- Also on the client, which should back off politely.

### Distributed rate limiting
With many gateway instances, the counters must be shared, typically in **Redis**:
- Use atomic operations (`INCR` + `EXPIRE`, or a Lua script for token bucket math) to avoid race conditions.
- Redis adds a network hop to each request. Options: keep local counters and sync them periodically (approximate), or shard limits by key.
- Decide **fail-open vs fail-closed**. If Redis is down, do you allow traffic (availability) or block it (protection)? Most APIs fail open.

### Details that show depth
- Different limits per endpoint (login attempts are far stricter than reads).
- Return `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers.
- Rate limiting differs from **load shedding**: shedding drops work when the *server* is overloaded, regardless of who's asking.

## Key takeaways
- Token bucket allows bursts and enforces an average rate; it's the usual default.
- Fixed windows allow 2× bursts at the edges; sliding window counters fix that cheaply.
- Enforce at the gateway with shared counters (Redis, atomic ops), and choose fail-open or fail-closed deliberately.

## Go deeper
- [Scaling your API with rate limiters (Stripe)](https://stripe.com/blog/rate-limiters)
