# Design a Web Crawler

```meta
difficulty: Medium
minutes: 45
tags: bfs, url frontier, politeness, deduplication
```

Design a crawler that downloads billions of web pages to build a search index. It should discover new pages by following links, revisit pages to keep content fresh, and be polite to the websites it crawls.

## Clarifying questions
- Purpose: search indexing, archiving, or monitoring specific sites?
- Scale: how many pages, and how often should they be refreshed?
- Content types: HTML only, or PDFs and images too?
- Must we respect `robots.txt` and crawl-delay? (Yes, always.)
- Is JavaScript rendering needed?

## Requirements
**Functional**
- Start from seed URLs, fetch pages, extract links, and add new URLs to the crawl.
- Store the raw content (plus metadata) for the indexing pipeline.
- Re-crawl pages based on how often they change.

**Non-functional**
- **Scalable**: billions of pages; horizontally scalable fetchers.
- **Polite**: never overload a single host; obey robots.txt.
- **Robust**: survive malformed HTML, slow servers and crawler traps.
- Efficient: avoid refetching duplicates.

## Estimation
- 1B pages/month ≈ 1B / (30 × 10⁵ s) ≈ **400 pages/s** (plan for 1,000+).
- Average page ~100 KB → ~100 TB/month raw (compressible to ~20–30 TB).
- URL frontier: tens of billions of URLs seen × ~100 bytes → several TB for the "seen" set, so it needs a disk-backed store or Bloom filters.

## API
Mostly internal. Useful interfaces:
- `addUrls(urls, priority)` into the frontier.
- The fetcher pulls `nextBatch(workerId)` → URLs grouped by host.
- Output: `(url, fetchedAt, status, contentHash, blobKey, outLinks[])` events to the indexing pipeline.

## Data model
- **URL frontier**: priority queues + per-host queues (see below), persisted (for example in Kafka topics or a KV store).
- **Seen-URL set**: normalized URL → last-crawled time, next-crawl time. A Bloom filter in front for fast "definitely new" checks.
- **Content store**: blob storage keyed by content hash; a metadata table maps URL → hash, status, headers, change history.
- **Host metadata**: robots.txt rules (cached with a TTL), crawl delay, DNS cache.

## High-level design
```
Seeds ─► URL frontier ──► Fetchers (many) ──► DNS cache
          ▲   (priority + per-host queues)  │
          │                                 ▼
          │                        robots.txt check → HTTP fetch
          │                                 │
          │                     Content store (blob) + metadata
          │                                 │
          └── URL filter + dedupe ◄── Link extractor/parser ──► Indexing pipeline
                (normalize, seen?, traps)
```

## Deep dives
**1. The URL frontier: priority and politeness**
- **Front queues** by priority (PageRank-ish importance, change frequency, freshness).
- **Back queues**, one per host (or group of hosts), each served by **one** fetcher thread with a delay between requests to that host. A heap keyed by "next allowed fetch time" chooses the next host.
- This is essentially a BFS with priorities, never hammering any single site.

**2. Deduplication**
- **URL normalization**: lowercase the host, remove fragments and default ports, sort query parameters, strip tracking parameters.
- **Seen check**: Bloom filter (no false negatives; occasional false positives skip a new URL, which is acceptable) backed by the authoritative store.
- **Content dedupe**: exact hash (SHA-256) and near-duplicate detection (SimHash/MinHash) to avoid storing mirrors and boilerplate variants.

**3. Robustness and traps**
- Timeouts, max page size, max redirects, content-type checks.
- Traps: infinite calendars and session-ID URLs. Cap depth per host, cap URLs per host, and detect repeating path patterns.
- Handle failures with retries and backoff; mark hosts that keep failing.

**4. Freshness**
- Estimate each page's change rate from its history (content hash changes). Revisit frequently changing pages more often. Use conditional requests (`If-Modified-Since` / `ETag`) to save bandwidth.

**5. Scaling fetchers**
- Partition hosts across fetcher nodes (consistent hashing by host), so politeness state is local. Use async I/O, since fetchers are network-bound. A local DNS cache avoids resolver bottlenecks.

## Wrap-up
- Bottlenecks: DNS, per-host politeness limits (need many hosts in parallel), and frontier storage.
- Failure: fetchers are stateless apart from their assigned hosts; the frontier is persisted, so work resumes after a crash.
- Extensions: a headless-browser rendering tier for JS-heavy sites, a focused crawler for specific topics.

## Rubric
- Clarified purpose, scale, refresh expectations and robots.txt/politeness
- Estimated pages per second and storage
- Designed a URL frontier with prioritization AND per-host queues for politeness
- Normalized URLs and deduplicated with a seen-set / Bloom filter
- Detected duplicate content (hashing, near-duplicate detection)
- Handled crawler traps, timeouts, size limits and failures
- Planned re-crawl scheduling based on change frequency (conditional GETs)
- Scaled fetchers horizontally (partition by host), with DNS caching and async I/O
- Stored content in blob storage and emitted events to an indexing pipeline
