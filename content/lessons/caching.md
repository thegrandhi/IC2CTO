# Caching

```meta
category: infrastructure
summary: Where caches sit, read/write strategies, eviction, invalidation, and stampedes.
minutes: 5
order: 3
```

A cache stores the results of expensive work (database queries, rendered pages, API calls) in fast memory, so repeated requests are cheap. Caches exist at every layer: browser, CDN, reverse proxy, application (Redis/Memcached), and inside the database itself.

### Read strategies
- **Cache-aside (lazy loading)**: the app checks the cache. On a miss it reads the database and populates the cache. This is the most common pattern: only requested data gets cached, and a cache failure degrades to slower reads rather than errors.
- **Read-through**: the cache itself loads from the database on a miss. It behaves the same way, with the logic living in the cache layer.

### Write strategies
- **Write-through**: write to the cache and the database synchronously. The cache is always fresh, but writes are slower.
- **Write-back (write-behind)**: write to the cache and flush to the database later. Writes are fast, but you risk losing data if the cache dies before flushing.
- **Write-around**: write only to the database and let reads populate the cache. This avoids filling the cache with data that's rarely read.

### Eviction
Memory is finite. **LRU** (least recently used) is the default choice. LFU favours items that stay popular. **TTLs** bound staleness: every entry expires after N seconds.

### Invalidation: the hard part
When the source data changes, cached copies go stale. Common approaches:
- **Delete the key on write** (not update), so the next read repopulates it. Deleting avoids races where two concurrent writers leave an old value in the cache.
- **Short TTLs** as a safety net.
- **Versioned keys** (`user:42:v7`), so old entries become unreachable.

### Failure modes to name in interviews
- **Cache stampede (thundering herd)**: a hot key expires and thousands of requests hit the database at once. Fixes: request coalescing (one loader, the rest wait), probabilistic early refresh, or a lock around the rebuild.
- **Hot keys**: one key gets extreme traffic. Replicate it, or add a small local in-process cache in front.
- **Cache penetration**: requests for keys that don't exist always miss. Cache the negative result ("not found") briefly, or use a Bloom filter.

### What to say about hit rate
If 90% of reads hit the cache, the database only sees 10% of read traffic. That can be the difference between one database and a sharded fleet. Always tie caching back to the load it removes.

## Key takeaways
- Cache-aside is the default: check the cache, fall back to the database, populate on a miss.
- Invalidate by **deleting** keys on writes, and keep TTLs as a backstop.
- LRU eviction with TTLs covers most cases.
- Plan for stampedes, hot keys and penetration.

## Go deeper
- [Caching challenges and strategies (Amazon Builders' Library)](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)
- [Redis documentation](https://redis.io/docs/latest/)
