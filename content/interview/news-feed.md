## Requirements

::: ask clarify
Before we start: what do you want to know about this feed?
- [key] Is the feed chronological, or ranked by what's most interesting? => Start with newest-first, but design it so a ranking step can plug in later.
- [key] What's the scale: daily users, posts per day, typical follower counts? => 300 million daily users, each opening the feed about 10 times a day. 50 million posts a day. Users have about 200 followers on average.
- [key] What's the largest follower count? => Some celebrities have over 50 million followers.
- [key] How quickly must a new post show up in followers' feeds? => A few seconds is fine.
- [ok] Are likes, replies and reposts in scope? => Show the counts on each post, but don't design those features in depth.
- [weak] Should the app support dark mode? => That's a client question. Let's stay on the backend.
- [weak] What should we call a post? => Call it whatever you like.
???
Ranked vs chronological changes the read path. Scale and especially the **follower distribution** decide the fan-out strategy: celebrities break the naive approach. Freshness tells you asynchronous fan-out is acceptable.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Creating posts, with optional images => Core write path.
- [x] Following and unfollowing users => The feed is built from it.
- [x] The home feed with infinite scroll => The core read path.
- [ ] Direct messages => A separate chat system.
- [ ] Trending topics => An extension built on the same posts.
- [ ] Full-text search over posts => A separate search system.
???
Posting, following and reading the feed are the system. DMs, trends and search are neighbours you can mention at the end.
:::

::: choice priority
Which non-functional requirement matters most?
- [ ] Every follower sees a post at exactly the same moment => The interviewer said a few seconds of delay is fine.
- [x] Loading the feed fast (p99 under 200 ms), even though it's assembled from many authors => Right. Feed reads vastly outnumber posts, and a slow feed is the product failing.
- [ ] Never showing a post from someone you just unfollowed => Nice, but a brief lag is acceptable.
- [ ] Making posting as fast as possible => Posting can take a bit longer, and fan-out can happen in the background.
???
This is read-heavy and latency-sensitive, with relaxed consistency. That points to precomputing feeds and doing the heavy lifting at write time, in the background.
:::

## Estimation

::: choice feed-reads
300 million users open the feed 10 times a day. Roughly how many feed reads per second?
- [x] About 35,000 => Right. 3 billion reads a day ÷ ~86,400 s ≈ 35k/s, maybe 100k at peak.
- [ ] About 3,500 => 10× too low.
- [ ] About 350,000 => 10× too high.
- [ ] About 3 billion => That's the daily total.
???
300M × 10 = 3B feed loads a day ≈ 35,000/s on average, roughly 3× that at peak. Each read assembles 20 posts, so the real work is the fan-in.
:::

::: choice fanout-volume
50 million posts a day, each pushed to about 200 followers' feeds. How many feed inserts is that?
- [ ] About 50 million a day => That ignores the followers.
- [ ] About 1 billion a day => Too low: 50M × 200 is 10 billion.
- [x] About 10 billion a day, or 120,000 a second => Right. Heavy, but a distributed cache and a pool of workers can handle it.
- [ ] About 10 trillion a day => Far too high.
???
50M × 200 = 10B inserts a day ≈ 120k/s. Manageable on average. The problem is the spikes: a single celebrity post means 50 million inserts at once.
:::

## API

::: choice pagination
How does the feed endpoint paginate as the user scrolls?
- [ ] Page numbers: `?page=2` => New posts arrive constantly, so pages shift and the user sees duplicates or misses posts.
- [ ] Offsets: `?offset=40&limit=20` => Same problem as page numbers, plus deep offsets get slow.
- [x] An opaque cursor that encodes where the last page ended => Right. "Give me 20 posts older than this one" is stable even as new posts arrive.
- [ ] Return the whole feed at once => Far too much data, and slow.
???
`GET /v1/feed?cursor=…&limit=20` returns posts plus `nextCursor`. The cursor encodes the last position, like `(timestamp or score, post_id)`.
:::

## Data model

::: choice feed-store
You precompute each user's feed. What exactly do you store per user?
- [ ] A full copy of every post in the feed => 800 full posts per user × 300M users is enormous, and edits or deletes would need millions of updates.
- [x] A capped list of the latest ~800 post IDs in Redis => Right. About 6 KB per user, ~2 TB in total across a cluster. Posts are fetched by ID from a post cache.
- [ ] Nothing: query the posts table on every read => That's pure fan-out on read: slow for users who follow hundreds of accounts.
- [ ] A SQL row per user with a JSON array of posts => Hot rows, rewritten on every insert. Too slow at 120k inserts a second.
???
Store IDs, not posts: `feed:{user_id}` → the latest ~800 post IDs. Then hydrate the 20 you need from a post cache in one batch. Post IDs are time-sortable (like Snowflake IDs), so they order themselves.
:::

## High-level design

::: path post-path
Build the path of a new post, from the author's app to their followers' feeds.
1. Client
2. Post service
3. Posts database
4. Message queue
5. Fan-out workers
6. Feed cache
- extra: Feed service => That's the read side. Posting doesn't need it.
- extra: Ranking service => Ranking happens when a feed is read, not when a post is written.
- extra: CDN => Images go to blob storage and are served through a CDN, but the post itself doesn't pass through it.
???
Store the post first, then hand the fan-out to a queue so posting returns quickly. Workers look up the author's followers and push the post ID onto each active follower's feed list.
:::

::: path read-path
Now build the path of loading the home feed.
1. Client
2. Load balancer (optional)
3. Feed service
4. Feed cache
5. Post cache
6. Posts database (optional)
- extra: Fan-out workers => They write feeds in the background. Reads never wait for them.
- extra: Message queue => The queue feeds the workers on the write side.
- extra: Blob storage => Images load straight from the CDN by URL, after the feed has loaded.
???
Read the post IDs from the user's feed list, merge in recent posts from any celebrities they follow, then hydrate the 20 posts from the post cache, falling back to the database on a miss.
:::

## Deep dives

::: choice celebrity
A celebrity with 50 million followers posts. Pushing to every follower's feed means 50 million writes for one post. What's the better strategy?
- [ ] Push to everyone anyway, just add more workers => Followers wait minutes for the post, and every celebrity post causes a huge spike.
- [ ] Switch everyone to pull: build each feed at read time => Then every normal user's feed is slow, which breaks the main requirement.
- [x] Hybrid: push for normal accounts, but pull celebrities' posts at read time and merge them in => Right. Writes stay bounded, and reads only merge a handful of celebrity timelines.
- [ ] Limit celebrities to fewer followers => You'd be breaking your own product.
???
Above a threshold (say 1M followers), skip fan-out. At read time, fetch recent posts from the few celebrities a user follows and merge them with their precomputed feed.
:::

::: choice inactive
Most of a typical user's followers haven't opened the app in a month. What do you do with them during fan-out?
- [x] Skip inactive followers, and rebuild their feed when they come back => Right. That saves a large share of fan-out writes and cache memory.
- [ ] Push to them anyway, in case they return => Wasted writes and memory for feeds nobody reads.
- [ ] Delete their accounts => Not your call.
- [ ] Push to them at a lower priority => Still wasted work for feeds that may never be read.
???
The feed cache is derived data. For users who return after a long absence, rebuild it from `following` plus recent posts on their first visit. It's slower once, then fast again.
:::

::: choice cache-lost
The Redis cluster holding the feed lists loses its data. How bad is it?
- [ ] Every user's feed is gone for good => Feeds are derived. Nothing original is lost.
- [ ] Posts are lost => Posts live in the posts database, not the feed cache.
- [x] Feeds get rebuilt from the following lists and recent posts, so reads are slow for a while => Right. It's a performance problem, not data loss. Rebuild lazily on each user's next visit.
- [ ] You restore yesterday's backup => Unnecessary: you can always recompute feeds from the source data.
???
Treat the feed cache as a derived, rebuildable index. Replicate it to avoid the slow path, but the source of truth is always `posts` and `follows`.
:::

::: choice viral-counts
A viral post gets a million likes a minute, and every feed showing it displays the like count. What breaks, and how do you fix it?
- [ ] Nothing. Increment a single counter row on each like => One row taking a million writes a minute becomes a hot spot with heavy lock contention.
- [x] The single counter row. Use sharded counters updated asynchronously, and cache the total => Right. Spread increments across many keys, add them up periodically, and serve the cached total.
- [ ] The feed cache, so stop showing like counts => You don't need to drop the feature.
- [ ] Store likes in each user's feed list => It duplicates data and doesn't solve the hot counter.
???
Hot counters are a classic problem: split them into N shards, increment a random shard, and aggregate in the background. Readers see a count that's a few seconds stale, which nobody notices.
:::

## Wrap-up

::: choice bottleneck
What's the biggest risk to watch in production?
- [ ] The posts database running out of space => Posts are small, and the database is sharded.
- [ ] The load balancer => A redundant pair handles this easily.
- [ ] Image uploads => Blob storage and the CDN scale on their own.
- [x] Fan-out spikes from big accounts backing up the queue => Right. Watch queue lag, tune the celebrity threshold, and skip inactive users.
???
Monitor fan-out queue lag and feed freshness (time from post to feed), feed cache memory, and the read path's p99. The hybrid fan-out keeps the worst spikes bounded.
:::
