# Design a Social News Feed

```meta
difficulty: Hard
minutes: 45
tags: fan-out, caching, ranking, pagination
```

Design the home timeline for a Twitter/X-like service. Users post short text posts (with optional images), follow other users, and see a feed of recent posts from people they follow. Some accounts have tens of millions of followers.

## Clarifying questions
- Chronological or **ranked** feed?
- Scale: DAU, posts per day, average and maximum follower counts?
- Feed freshness: how quickly must a new post appear in followers' feeds?
- Media support? Likes, replies, reposts in scope?
- Pagination and infinite scroll?

## Requirements
**Functional**
- Create posts; follow/unfollow; view the home feed (newest first, or ranked) with infinite scroll.

**Non-functional**
- Feed loads fast: **p99 < 200 ms**.
- Read-heavy (feed reads ≫ posts).
- Eventual consistency is fine: a post can take a few seconds to show up.
- Highly available; handles celebrities with 50M+ followers.

## Estimation
- 300M DAU; each opens the feed ~10×/day → 3B feed reads/day ≈ **35k reads/s** (peak ~100k).
- 50M posts/day ≈ **600 writes/s**.
- Average 200 followers → push fan-out ≈ 10B feed inserts/day ≈ 120k/s, which is heavy but doable. Celebrities make it spiky: one post → 50M inserts.
- A feed cache of 800 post IDs × 8 bytes ≈ 6.4 KB per user × 300M ≈ **2 TB** of Redis, which is fine across a cluster.

## API
```
POST /v1/posts            { text, mediaIds? } → 201 { postId }
POST /v1/follow/{userId}  / DELETE /v1/follow/{userId}
GET  /v1/feed?cursor=<opaque>&limit=20
  → { posts: [ { id, author, text, media, createdAt, counts } ], nextCursor }
```
Use cursor pagination: the feed changes constantly, so offsets would skip or duplicate posts.

## Data model
- `posts`: `post_id` (time-sortable, e.g. Snowflake), `author_id`, text, media keys, `created_at`. Partitioned by `post_id`, with a secondary `author_id → recent post_ids` list.
- `follows`: two tables, `followers(user_id → follower_ids)` and `following(user_id → followee_ids)`, since both directions are queried. Partitioned by `user_id`.
- `feed:{user_id}`: a Redis list of the latest ~800 post IDs (the precomputed timeline).
- Post and user objects cached by ID for hydration.

## High-level design
```
Post:  Client ─► Post service ─► posts DB ─► queue ─► Fan-out workers ─► feed cache (per follower)
                                                        │ (skip if author is a celebrity)
Read:  Client ─► Feed service ─► feed cache (post IDs) ─┬► merge celebrity posts (pull)
                                                        ├► hydrate posts/users (cache → DB)
                                                        └► rank ─► paginate ─► response
Media: blob storage + CDN
```

## Deep dives
**1. Fan-out strategy**
- *Push (fan-out on write)*: fast reads, expensive writes for big accounts, and wasted work for inactive users.
- *Pull (fan-out on read)*: cheap writes, slow reads for users following many accounts.
- **Hybrid (decision)**: push for normal authors, and only to **active** followers. Authors above a threshold (for example 1M followers) are **pulled** at read time and merged. Inactive users' feeds are rebuilt on their next visit.

**2. Feed read path**
- Get IDs from `feed:{user}` → fetch recent posts from the ~dozens of followed celebrities → merge by time (or score) → hydrate in batches from the post cache → return 20 plus a cursor.
- The cursor encodes `(score or time, post_id)`.

**3. Ranking (if ranked)**
- **Candidate generation** (the fan-out above, maybe a few thousand candidates) → **ranking service** scoring predicted engagement, recency and relationship strength → light re-ranking for diversity. Cache the ranked page for a short time.

**4. Hot content and caching**
- A viral post is read by millions: cache post objects and like counts aggressively; update counts asynchronously with sharded counters.

**5. Consistency edge cases**
- Unfollow: filter at read time (check the following set) and lazily clean the feed.
- Deleted posts: tombstone, and filter during hydration.

## Wrap-up
- Bottlenecks: the fan-out queue during celebrity spikes (hybrid fixes it), feed cache memory (cap the list length, skip inactive users), and hydration fan-in (batch and cache).
- Failure: the feed cache is **derived**, so it can be rebuilt from `following` + `posts` if lost, just more slowly.
- Extensions: notifications, search, trends, ads insertion.

## Rubric
- Clarified ranked vs chronological, scale, follower distribution, and freshness requirements
- Estimated read/write QPS and fan-out volume, and noticed the celebrity problem
- Compared fan-out on write vs on read, and proposed the hybrid
- Stored feeds as capped lists of post IDs and hydrated from a cache
- Used cursor-based pagination for the feed
- Made fan-out asynchronous via a queue, and skipped inactive users
- Separated candidate generation from ranking (if ranked)
- Handled media via blob storage + CDN and hot counters via sharding/async aggregation
- Covered unfollow/delete consistency and rebuilding the derived feed cache
