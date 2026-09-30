# Design a URL Shortener

```meta
difficulty: Medium
minutes: 45
tags: key-value store, id generation, caching, redirects
```

Design a service like bit.ly. Users submit a long URL and get a short link such as `https://sho.rt/Ab3xK9q`. Anyone visiting the short link is redirected to the original URL. Assume a large consumer product.

## Clarifying questions
- Can users pick **custom aliases**? Do links **expire**?
- What's the expected **scale**: new links per day, and redirects per day?
- Do we need **analytics** (click counts, referrers, geography)?
- Must links be **unguessable**, or is sequential OK?
- Can a link be **edited or deleted** after creation?

## Requirements
**Functional**
- Create a short link for a long URL (optional custom alias, optional expiry).
- Redirect `GET /{code}` to the long URL.
- (Stretch) Basic click analytics per link.

**Non-functional**
- Very **read-heavy**: around 100:1 redirects to creations.
- Redirects must be **fast** (p99 < 50 ms from the edge) and **highly available**: a broken redirect breaks someone else's website.
- Short codes must be **unique**. Links must be **durable** for years.
- Creation can tolerate slightly higher latency.

## Estimation
- 100M new links/day ≈ 100M / 10⁵ s ≈ **1,000 writes/s** (peak ~3k).
- 100:1 read ratio → 10B redirects/day ≈ **100k reads/s** (peak ~300k).
- Storage: ~500 bytes per link × 100M/day ≈ 50 GB/day ≈ **18 TB/year** before replication.
- Code length: 62⁷ ≈ 3.5 trillion codes. At 36.5B per year, that lasts about 100 years, so **7 base62 characters** are enough.
- Hot set: 20% of links get most traffic. Caching even ~1% of the recent working set in Redis (tens of GB) absorbs most reads.

## API
```
POST /v1/links
  body: { "url": "https://…", "alias"?: "my-talk", "expiresAt"?: "2027-01-01" }
  → 201 { "code": "Ab3xK9q", "shortUrl": "https://sho.rt/Ab3xK9q" }
  (idempotency key header recommended; 409 if alias taken)

GET /{code}
  → 301/302 Location: <long url>     (404 if unknown, 410 if expired)

GET /v1/links/{code}/stats   → { clicks, byDay: [...] }   (stretch)
```
**301 vs 302**: a 301 is cached by browsers, so it's fast and cheap but hides repeat clicks from analytics. Use a 302 (or `Cache-Control: private, max-age=…`) if you need every click counted.

## Data model
`links` table in a **key-value / wide-column store**, keyed by `code`:
| field | notes |
|---|---|
| `code` (PK) | 7-char base62 |
| `long_url` | up to ~2 KB |
| `owner_id` | optional |
| `created_at`, `expires_at` | |

Access is almost always a **point lookup by code**, with no joins, so a KV store (DynamoDB, Cassandra) or a sharded relational table works. Partition by `code`. Keep a secondary index `owner_id → codes` if users can list their links.

Analytics go to a separate **append-only event stream** (Kafka → OLAP store), never to the hot redirect path.

## High-level design
```
Client ──► CDN / edge cache ──► LB ──► Redirect service ──► Redis cache ──► KV store
                                         │ (async click event)
                                         └──► Kafka ──► analytics consumers ──► OLAP

Client ──► LB ──► Link service ──► ID generator (range allocator)
                         └──► KV store (write)
```
- **Write path**: validate the URL → get a unique ID → base62-encode it → store `code → url` (a conditional put so it never overwrites) → return.
- **Read path**: edge cache → Redis → KV store. Return a 301/302. Emit the click event asynchronously.

## Deep dives
**1. Generating unique codes**
- *Hash the URL* (MD5/SHA → take 7 chars): the same URL gets the same code, but truncation **collides**, so you need a check-and-retry.
- *Random 7 chars*: simple, but needs a uniqueness check (a conditional insert) and gets more retries as the space fills.
- *Counter + base62*: no collisions. Use a **range allocator**: each app server leases blocks of 1M IDs from a coordinator (etcd or a DB row), so there's no per-request coordination. Codes are sequential and guessable. If that matters, apply a reversible permutation (for example a Feistel cipher) before encoding.
- **Decision**: range-allocated counter + base62 (+ optional scramble); custom aliases use a conditional insert.

**2. Scaling reads**
- 300k QPS of tiny, immutable lookups is ideal for caching: CDN/edge for the hottest links, then a Redis cluster (LRU, TTL), then the KV store.
- Links are immutable (or rarely edited), so invalidation is trivial: delete the cache key on edit or delete.

**3. Expiry and deletion**
- Store `expires_at` and check it on read (return `410`). A background job or the store's native TTL purges old rows. Don't reuse expired codes for a long time, since old links might still be shared.

**4. Abuse**
- Rate-limit creation per user and IP, scan URLs against malware and phishing lists, and let people report bad links.

## Wrap-up
- **Bottlenecks**: the cache hit rate on redirects, and ID allocation (make leased blocks large enough).
- **Failure modes**: if Redis dies, the KV store must absorb the load, so add replicas and keep the store's capacity headroom. Losing the ID coordinator only blocks new blocks, not redirects.
- **Next steps**: custom domains, link previews, QR codes, per-link analytics dashboards.

## Rubric
- Clarified read/write ratio, scale, custom aliases, expiry and analytics before designing
- Estimated QPS and storage, and justified the short-code length (e.g. 7 base62 chars ≈ 3.5T codes)
- Defined create and redirect APIs, including 301 vs 302 and error codes
- Chose a key-value style store keyed by code and explained why
- Compared code-generation strategies (hash vs random vs counter) and handled collisions
- Put caching (CDN + Redis) on the redirect path and discussed hit rate
- Kept analytics off the critical path (async events)
- Covered expiry/deletion and abuse prevention (rate limits, malicious URLs)
- Identified single points of failure (ID allocator, cache) and mitigations
