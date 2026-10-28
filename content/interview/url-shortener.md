## Requirements

::: ask clarify
Before you design anything, what do you want to know? You only have time for a few questions, so pick the ones that change the design.
- [key] What scale should we plan for: new links per day, and redirects per day? => About 100 million new links a day. Each link gets clicked around 100 times on average, so redirects dominate.
- [key] Can users choose a custom alias, and do links expire? => Custom aliases are optional. Users can set an expiry date, and links without one live forever.
- [key] Do we need click analytics? => A click count per link would be nice, but redirects are what matters. Don't slow them down for analytics.
- [key] Do short codes need to be hard to guess? => Not strictly, but we'd rather people couldn't walk through every link in order.
- [ok] Can users delete or edit a link? => Delete, yes. Changing the destination isn't needed.
- [weak] Which programming language should we use? => Whatever you're comfortable with. It won't change the design.
- [weak] What should the homepage look like? => Out of scope. Let's stay on the backend.
???
Scale and the read/write ratio (about 100:1) drive almost every later choice: cache size, store type, code length. Aliases, expiry and guessability decide how you generate codes. Analytics tells you there's a second, asynchronous data flow. Language and UI questions use up time without changing the architecture.
:::

::: pick scope
Good. What will you commit to building in the next 40 minutes? Pick everything that's in scope.
- [x] Create a short link for a long URL => The core write path.
- [x] Redirect a short code to its long URL => The core read path, and the hottest one.
- [x] Optional custom alias and expiry => The interviewer said yes to both.
- [x] A basic click count per link => Asked for, as long as it stays off the redirect path.
- [ ] A real-time analytics dashboard with charts => Beyond what was asked. A count per link is enough.
- [ ] Social login and user profiles => Not needed to design the core system.
- [ ] Generating link previews with page thumbnails => A nice extra, but not part of the core problem.
???
Commit to the core flows plus what the interviewer explicitly asked for, and say out loud what you're leaving out. Over-scoping is a common way to run out of time before the interesting parts.
:::

::: choice priority
Which non-functional requirement matters most here?
- [ ] Strong consistency on every read => Links almost never change after creation, so there's nothing to keep consistent.
- [x] Fast, highly available redirects => Right. A broken redirect breaks someone else's website or campaign, and reads outnumber writes 100 to 1.
- [ ] Very fast link creation => Creating a link can take a few hundred milliseconds and nobody minds.
- [ ] Low storage cost => Storage is cheap here: a few hundred bytes per link.
???
The redirect path is read-heavy, latency-sensitive and must stay up. That points to caching, replication and keeping anything slow (like analytics) off that path.
:::

## Estimation

Let's put some numbers on it.

::: choice write-qps
About 100 million new links a day. Roughly how many writes per second is that, on average?
- [ ] About 100 => That would be 10 million a day. Remember a day is about 10⁵ seconds.
- [x] About 1,000 => Right. 100M ÷ 10⁵ seconds ≈ 1,000/s, with peaks maybe 3× higher.
- [ ] About 10,000 => That's 10× too high: 10,000/s would be about a billion links a day.
- [ ] About 100,000 => That's closer to the redirect rate, not the creation rate.
???
A day has 86,400 seconds; round it to 10⁵. 100M / 10⁵ = 1,000 writes/s on average, maybe 3,000/s at peak. Easy for any store.
:::

::: choice read-qps
Each link is clicked about 100 times. What's the redirect rate?
- [ ] About 1,000 per second => That's the write rate. Reads are 100× more.
- [ ] About 10,000 per second => Still 10× too low.
- [x] About 100,000 per second => Right. 100 × 1,000 writes/s ≈ 100k reads/s on average, maybe 300k at peak.
- [ ] About 10 million per second => Far too high. That would be a trillion redirects a day.
???
10 billion redirects a day ≈ 100k/s, with peaks around 300k/s. Tiny lookups, so this is a caching problem more than a database one.
:::

::: choice code-length
How many base62 characters (a–z, A–Z, 0–9) do the short codes need to last many years?
- [ ] 4 characters => 62⁴ ≈ 15 million codes, used up in a few hours.
- [ ] 5 characters => 62⁵ ≈ 900 million codes, gone in under 10 days.
- [x] 7 characters => Right. 62⁷ ≈ 3.5 trillion codes. At about 36 billion a year, that lasts roughly 100 years.
- [ ] 12 characters => It works, but short links should be short. 7 is plenty.
???
100M links/day ≈ 36.5B a year. 62⁶ ≈ 57 billion would last less than two years. 62⁷ ≈ 3.5 trillion lasts about a century.
:::

## API

::: choice redirect-status
The redirect endpoint is `GET /{code}`. You want to count every click. Which response do you return?
- [ ] 200 with an HTML page that redirects => Slow and clunky. Browsers and bots expect a proper HTTP redirect.
- [ ] 301 Moved Permanently => Fast, but browsers cache a 301 and skip your server next time, so you lose those clicks.
- [x] 302 Found (or 301 with a short cache lifetime) => Right. The browser comes back each time, so every click can be counted.
- [ ] 404 when the link is expired => Wrong question: that's the error case. And 410 Gone is the clearer code for an expired link.
???
A 301 is cached by the browser, which is cheapest but hides repeat clicks. A 302 (or `Cache-Control: private, max-age=…`) keeps clicks visible. Unknown codes return 404, expired ones 410.
:::

::: pick create-api
For `POST /v1/links`, which of these belong in the design?
- [x] An idempotency key header, so retries don't create duplicate links => Clients retry on timeouts, and this makes retries safe.
- [x] 409 Conflict when a custom alias is already taken => The client needs to know to pick another alias.
- [x] Rate limits per user and IP => Link shorteners are a favourite tool for spammers.
- [ ] Returning the full click history in the response => That's a separate stats endpoint, and it's empty for a new link anyway.
- [ ] A required user account for every link => Anonymous creation was never ruled out, and it isn't needed for the design.
???
Retries, conflicts and abuse are the three things that go wrong on the write path, so the API should handle all three explicitly.
:::

## Data model

::: choice store
Every redirect is a lookup by code: no joins, no range scans. Which store fits best?
- [x] A key-value or wide-column store, keyed by code => Right. Point lookups by key scale out easily: DynamoDB, Cassandra, or a sharded table.
- [ ] A single relational database with foreign keys => It works at small scale, but there are no relationships to enforce, and 18 TB a year needs sharding anyway.
- [ ] A search index like Elasticsearch => Built for full-text search, not as a primary store for exact lookups.
- [ ] A graph database => There are no relationships to traverse.
???
Store `code → {long_url, owner_id, created_at, expires_at}` and partition by `code`. If users can list their links, add a secondary index on `owner_id`. Click events go to a separate append-only stream.
:::

## High-level design

Now draw it. Walk me through the two main flows.

::: path write-path
Build the **create path**: tap the components a "shorten this URL" request passes through, in order.
1. Client
2. Load balancer
3. Link service
4. ID generator
5. Key-value store
- extra: CDN => A CDN caches responses to reads. Creating a link is a write that must reach the service.
- extra: Redis cache => Nothing to read yet. You can warm the cache after the write, but it isn't on the path.
- extra: Kafka => Nothing needs to happen asynchronously when a link is created.
???
The link service validates the URL, gets a unique ID from the generator (a range allocator), base62-encodes it, and writes `code → url` with a conditional put so it never overwrites an existing code.
:::

::: path read-path
Now the **redirect path**: from a click on the short link to finding the long URL.
1. Client
2. CDN / edge cache (optional)
3. Load balancer
4. Redirect service
5. Redis cache
6. Key-value store
- extra: ID generator => Only needed to create links, never to read them.
- extra: Kafka => Click events go to Kafka asynchronously, off to the side. A redirect never waits for it.
- extra: SQL primary => The data lives in the key-value store, and reads should never hit a write primary anyway.
???
Check the edge cache, then Redis, then the store. Each layer absorbs most of the traffic before the next. The redirect service also emits a click event to Kafka in the background, so analytics never slows a redirect.
:::

## Deep dives

Let's go deeper on the hard parts.

::: choice codes
How do you generate unique short codes at 3,000 creations a second across many servers?
- [ ] Hash the long URL and take the first 7 characters => Truncated hashes collide, so you still need a check-and-retry, and the same URL always gets the same code.
- [ ] Generate 7 random characters and hope => Collisions get more likely as the space fills, and "hope" needs a uniqueness check to be safe.
- [x] A counter handed out in ranges, base62-encoded => Right. Each server leases a block of a million IDs, so there's no coordination per request and no collisions.
- [ ] One auto-increment column in a single database => It works, but every creation hits one database row: a bottleneck and a single point of failure.
???
Range allocation: servers lease blocks from a coordinator (a DB row or etcd) and hand out IDs locally. Sequential codes are guessable, so apply a reversible scramble (for example a Feistel permutation) before encoding if that matters. Custom aliases use a conditional insert.
:::

::: choice viral
A celebrity tweets one of your links. That single code gets a million clicks a minute. What protects you?
- [x] The CDN and Redis serve it from cache. Hot keys are exactly what caching is for => Right. One immutable key is the easiest thing in the world to cache. The store barely notices.
- [ ] Add more key-value store nodes => The load is on one key, which lives on one partition. More nodes don't help a single hot key.
- [ ] Rate-limit clicks on that link => You'd be breaking your own product at its most visible moment.
- [ ] Switch that link to a 301 permanently => It sheds some repeat traffic, but you lose the click counts, and the first click per browser still arrives.
???
Short links are immutable, so they can be cached aggressively at the edge with almost no invalidation. For extreme keys, Redis can also replicate a hot key across nodes or keep a tiny in-process cache in the redirect service.
:::

::: choice redis-down
The Redis cluster goes down at peak. What happens?
- [ ] Redirects fail until Redis is back => Only if Redis was a hard dependency. A cache miss should fall through to the store.
- [x] Reads fall through to the store, so it must have the headroom to absorb them => Right. Size the store and its replicas for a cache outage, and protect it with load shedding.
- [ ] Nothing changes: the CDN serves everything => The CDN absorbs the hottest links, but the long tail of links still misses.
- [ ] Data is lost, because Redis was the source of truth => Redis is only a cache. The store holds the data.
???
A cache should make things faster, not be the only thing keeping the system up. Plan capacity for the miss storm, and use replicas and circuit breakers so a cold cache doesn't take down the store.
:::

## Wrap-up

::: choice spof
Last question: what's the most likely single point of failure in this design?
- [x] The ID range coordinator => Right, though only for creations: redirects keep working, and servers can run on their leased blocks for a while. Replicate it (etcd or a replicated DB row).
- [ ] The CDN => CDNs are distributed by design, and misses fall through to your servers.
- [ ] The key-value store => It's partitioned and replicated, so losing one node doesn't stop it.
- [ ] The load balancer => Usually run as a redundant pair or a managed service.
???
Always name your single points of failure and their blast radius. Here, losing the coordinator only blocks new ID blocks, so lease blocks big enough to ride out an outage.
:::
