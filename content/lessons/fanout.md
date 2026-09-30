# Feeds and Fan-out

```meta
category: product
summary: Fan-out on write vs on read, the celebrity problem, and the hybrid that real feeds use.
minutes: 4
order: 21
```

A **home feed** (Twitter/X, Instagram, LinkedIn) shows recent posts from everyone you follow. The core question: **when** do you assemble each user's feed?

### Fan-out on read (pull)
When a user opens their feed, fetch recent posts from each account they follow and merge them.
- ✅ Writes are cheap: posting is one insert.
- ❌ Reads are expensive: following 500 accounts means 500 lookups and a merge, on every refresh.

### Fan-out on write (push)
When someone posts, push the post ID into the **precomputed feed** of every follower (often a list in Redis).
- ✅ Reads are fast: the feed is ready, just read the list.
- ❌ Writes amplify: a user with 50M followers generates 50M writes per post. That's the **celebrity problem**.
- ❌ Work is wasted on followers who never log in.

### The hybrid
- Normal accounts: **push** to followers' feeds.
- Celebrities (above some follower threshold): **don't** push. At read time, fetch their recent posts and merge them into the precomputed feed.
- Only push to **active** users; rebuild an inactive user's feed on demand when they return.

### Storage sketch
- `posts` table: the source of truth, keyed by `post_id`, with media in blob storage behind a CDN.
- `feed:{user_id}`: a capped list of recent post IDs (for example the last 800), stored in a cache.
- Feed read: get the IDs → hydrate the post objects (batched, cached) → merge in celebrity posts → rank → paginate with a cursor.
- Fan-out runs **asynchronously** through a queue, so posting stays fast.

### Ranking
Chronological feeds are easy. Ranked feeds score candidates on engagement predictions, recency and relationship strength. In interviews, separate **candidate generation** (fan-out) from **ranking** (a scoring service), and say so.

## Key takeaways
- Pull = cheap writes, expensive reads; push = cheap reads, expensive writes.
- The celebrity problem breaks pure push. Hybrid: push for most, pull for celebrities.
- Store feeds as capped lists of IDs, hydrate from a cache, and paginate with cursors.
- Run fan-out asynchronously through a queue.

## Go deeper
- [Designing Data-Intensive Applications, chapter 1 (the Twitter example)](https://dataintensive.net/)
