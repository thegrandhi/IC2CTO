# Infrastructure

```meta
description: Caching, load balancing, CDNs, queues, consistent hashing, and blob storage.
```

::: mcq inf-cache-aside
lesson: caching
In the **cache-aside** pattern, what happens on a cache miss?

- [ ] The cache fetches from the database by itself and returns the value
- [x] The application reads from the database, then writes the result into the cache
- [ ] The request fails and the client retries
- [ ] The database pushes the value into the cache on its next write
???
In cache-aside (lazy loading), the **application** owns the logic: check the cache, fall back to the database on a miss, then populate the cache. Only data that's actually requested gets cached, and if the cache goes down the app still works, just more slowly. (When the cache itself loads from the database, that's *read-through*.)
:::

::: mcq inf-invalidate-delete
lesson: caching
When a user updates their profile, what's the safest way to keep the cached profile correct?

- [ ] Update the cache first, then the database
- [ ] Update the database and write the new value into the cache
- [x] Update the database, then **delete** the cache key so the next read repopulates it
- [ ] Never cache profiles
???
Deleting (invalidating) avoids races where two concurrent writers leave an **older** value in the cache after writing it back in the wrong order. The next read fetches the fresh value from the database. A short TTL is a good safety net in case a delete is lost.
:::

::: mcq inf-stampede
lesson: caching
A viral post's cache entry expires, and 20,000 requests hit the database at once for the same row. What is this, and what's a good fix?

- [ ] Cache penetration: use a Bloom filter
- [x] Cache stampede: let one request rebuild the value while the others wait or get the stale value
- [ ] Split brain: add consensus
- [ ] Hot shard: re-shard the database
???
A **stampede** (thundering herd) happens when a hot key expires and every concurrent miss goes to the database. Fixes: **request coalescing** or a rebuild lock (one loader, the others wait), serving slightly stale data while one request refreshes, or **early probabilistic refresh** before expiry.
:::

::: mcq inf-penetration
lesson: caching
Attackers request millions of **non-existent** product IDs, so every request misses the cache and hits the database. What helps most?

- [ ] Increasing the cache size
- [x] Caching "not found" results briefly, or checking a Bloom filter of valid IDs first
- [ ] Switching the cache eviction policy to LFU
- [ ] Adding read replicas only
???
**Cache penetration**: keys that don't exist can never be cached, so every lookup falls through. Cache **negative results** with a short TTL, or keep a **Bloom filter** of existing IDs so impossible keys are rejected before reaching the database. Rate limiting helps too.
:::

::: match inf-write-strategies
lesson: caching
Match each caching write strategy to its behaviour.

- Write-through => Write the cache and the database synchronously
- Write-back => Write the cache now, flush to the database later
- Write-around => Write only the database; reads populate the cache
???
**Write-through** keeps the cache fresh but makes writes slower. **Write-back** makes writes fast but risks losing data if the cache dies before flushing. **Write-around** avoids filling the cache with data nobody reads back.
:::

::: mcq inf-lru
lesson: caching
Which eviction policy is the most common default for an application cache?

- [ ] FIFO
- [x] LRU (least recently used)
- [ ] Random
- [ ] MRU (most recently used)
???
**LRU** evicts the entry that hasn't been used for the longest time, a good fit for the temporal locality of most workloads. It's cheap to implement (a hash map plus a doubly linked list, O(1) per operation) and is the default in Memcached and one of Redis's eviction options.
:::

::: mcq inf-l4-l7
lesson: load-balancing
You need to route `/api/*` to one service and `/images/*` to another, and terminate TLS at the edge. Which load balancer?

- [ ] Layer 4 (TCP)
- [x] Layer 7 (HTTP)
- [ ] DNS round robin
- [ ] Either works the same way
???
Routing by **URL path** requires understanding HTTP, which is Layer 7. An L7 load balancer can also terminate TLS, inspect headers and cookies, and retry requests. L4 balances TCP connections without reading them. It's faster, but it can't route by path.
:::

::: mcq inf-least-connections
lesson: load-balancing
Some requests take 5 ms and others take 3 seconds. Which algorithm spreads load best?

- [ ] Round robin
- [x] Least outstanding requests (least connections)
- [ ] Hash by client IP
- [ ] Always the first healthy server
???
Round robin assumes requests cost about the same, so it can pile slow requests onto one unlucky server. **Least outstanding requests** sends new work to whichever server currently has the least in flight, adapting to uneven request costs.
:::

::: mcq inf-sticky-sessions
lesson: load-balancing
Why are **stateless** app servers preferred over sticky sessions?

- [ ] Stateless servers use less CPU
- [x] Any server can handle any request, so load spreads evenly and failover is painless
- [ ] Sticky sessions don't work with HTTPS
- [ ] Load balancers can't do sticky sessions
???
With sticky sessions, a user's session lives in one server's memory. Load gets lumpy, and if that server dies, the session is lost. Keeping session state in a shared store (Redis) or a signed token makes servers interchangeable, so you can scale, deploy and fail over freely.
:::

::: mcq inf-health-check
lesson: load-balancing
A new instance starts and the load balancer sends it traffic immediately, but it still has cold caches and no database connections, so requests fail. What's missing?

- [ ] A liveness probe
- [x] A readiness check that only passes once the instance can actually serve
- [ ] A bigger instance
- [ ] Sticky sessions
???
**Liveness** asks "is the process up?"; **readiness** asks "can it serve right now?". The load balancer should send traffic only to *ready* instances, once warm-up is done and dependencies are connected.
:::

::: mcq inf-cdn-hashing
lesson: cdn
How can static JS/CSS files be cached "forever" at the CDN and in browsers, yet still update instantly on deploy?

- [ ] Purge the CDN after every deploy
- [x] Put a content hash in each filename (`app.3f9c2.js`) and change the referencing HTML
- [ ] Set `Cache-Control: no-cache` on everything
- [ ] Serve them from the origin only
???
With **content-hashed filenames**, any change produces a new URL, so the old file can be cached with `max-age=31536000, immutable`. The HTML (short-cached) references the new name after a deploy. No purges are needed, and users never get a mismatched mix of old and new files.
:::

::: mcq inf-cdn-private
lesson: cdn
Paid videos must be served through the CDN but only to users who bought them. How?

- [ ] Make the videos public but with obscure URLs
- [x] Issue short-lived **signed URLs** (or cookies) that the CDN verifies
- [ ] Stream every video through the application servers
- [ ] Use a separate CDN per user
???
Your backend checks authorization, then signs a URL that expires soon. The CDN validates the signature at the edge, so you keep CDN performance *and* access control. An obscure URL is still public once it leaks.
:::

::: mcq inf-queue-decouple
lesson: message-queues
After a user signs up, you send a welcome email, create analytics records and warm recommendations. The signup API is slow because it does all of this inline. Best fix?

- [ ] Use a faster email provider
- [x] Publish a "user signed up" event to a queue and let workers do the side effects asynchronously
- [ ] Run the three tasks in parallel threads inside the request
- [ ] Cache the signup response
???
Only the essential write belongs in the request path. Publishing an event **decouples** the side effects: signup returns quickly, workers retry failures independently, and new consumers can subscribe later without touching the signup code.
:::

::: mcq inf-kafka-ordering
lesson: message-queues
You need all events for the same order to be processed **in order** in Kafka. What do you do?

- [ ] Use a single partition for the whole topic
- [x] Use `order_id` as the message key so all of an order's events land in the same partition
- [ ] Add timestamps and sort in the consumer
- [ ] Enable exactly-once delivery
???
Kafka guarantees order **within a partition**. Keying by `order_id` routes all of an order's events to one partition, preserving their order, while different orders still spread across partitions in parallel. A single partition would work but destroys scalability.
:::

::: mcq inf-at-least-once
lesson: message-queues
Your consumer acknowledges messages **after** processing. It crashes right after charging a card but before acknowledging. What happens, and what protects you?

- [ ] The message is lost; nothing protects you
- [x] The message is redelivered; an idempotent consumer (dedupe on message ID) prevents a double charge
- [ ] The broker detects the charge and skips it
- [ ] Nothing, because exactly-once is the default
???
Acknowledge-after-processing gives **at-least-once** delivery, so duplicates happen after crashes. Make the handler **idempotent**: record processed message IDs (ideally in the same transaction as the effect), or use an idempotency key with the payment provider.
:::

::: match inf-queue-vs-log
lesson: message-queues
Match each need to the better fit.

- Distribute video-encoding jobs to a pool of workers => Task queue (e.g. SQS, RabbitMQ)
- Let several teams independently consume every order event, and replay last week's events => Replicated log (e.g. Kafka)
- Park messages that failed processing five times => Dead-letter queue
???
Task queues hand each message to **one** worker and delete it after acknowledgement. Logs **retain** events so many consumer groups can read everything at their own pace, including **replaying** history. DLQs quarantine poison messages instead of retrying them forever.
:::

::: mcq inf-outbox
lesson: message-queues
You save an order to the database, then publish an `OrderCreated` event. Occasionally the service crashes between the two steps and the event is never sent. What pattern fixes this?

- [ ] Publish first, then save
- [x] Transactional outbox: write the event to an outbox table in the same DB transaction; a relay publishes it
- [ ] Retry the publish in a `finally` block
- [ ] Use a bigger message broker
???
The **outbox** makes "save + publish" atomic by putting both in **one** local transaction. A separate relay (or change data capture) reads the outbox and publishes, retrying until it succeeds. Consumers must still be idempotent, since the relay may publish twice.
:::

::: mcq inf-consistent-hashing
lesson: consistent-hashing
With 10 cache nodes and `node = hash(key) % N`, you add an 11th node. Roughly what fraction of keys now map to a different node? And with consistent hashing?

- [ ] ~10% and ~10%
- [x] ~90% with modulo, and only ~1/11 with consistent hashing
- [ ] ~50% with modulo, and ~50% with consistent hashing
- [ ] 0% with both
???
Changing the modulus reshuffles almost everything: a key keeps its node only if `hash % 10 == hash % 11`, which is rare. On a consistent-hashing ring, the new node takes over only the arc before it, **about 1/N of the keys**, so the cache stays mostly warm.
:::

::: mcq inf-virtual-nodes
lesson: consistent-hashing
Why do consistent-hashing rings use **virtual nodes**?

- [ ] To encrypt keys
- [x] To spread load evenly and scatter a failed node's keys across many survivors
- [ ] To reduce memory usage
- [ ] To guarantee strong consistency
???
With few physical nodes, random ring positions leave some nodes owning huge arcs. Giving each physical node many positions (virtual nodes) averages that out. When a node fails, its many small arcs go to many different neighbours instead of doubling one neighbour's load. It also lets bigger machines take a bigger share.
:::

::: mcq inf-presigned-upload
lesson: blob-storage
Users upload videos of up to 5 GB. What's the best upload path?

- [ ] Upload to the API server, which writes the file into the database
- [ ] Upload to the API server, which streams to blob storage
- [x] The API returns a presigned URL; the client uploads directly to blob storage (multipart for large files)
- [ ] Email the files to a processing inbox
???
**Presigned URLs** let clients upload straight to object storage, without passing gigabytes through your servers. **Multipart** uploads split the file into parts that upload in parallel and can be retried individually, so a dropped connection doesn't restart a 5 GB upload.
:::

::: order inf-video-pipeline
lesson: blob-storage
Order the steps of a typical video upload pipeline.

1. Client requests an upload URL from the API
2. Client uploads the file directly to blob storage
3. Storage event enqueues a processing job
4. Workers transcode into multiple resolutions
5. CDN serves the processed video segments to viewers
???
Uploads bypass your servers (presigned URL). Completion triggers **asynchronous** processing through a queue. Transcoding produces adaptive-bitrate renditions, and a **CDN** serves them from the edge. Each stage scales independently.
:::

::: mcq inf-cdn-purpose
lesson: cdn
What's the **main** benefit of a CDN for a global photo-sharing app?

- [ ] It stores the primary copy of every photo
- [x] It caches photos at edge locations near users, cutting latency and origin bandwidth
- [ ] It replaces the need for a database
- [ ] It encrypts photos at rest
???
Edges close to users serve cached copies, so a user in Sydney doesn't fetch from Virginia. That improves latency and offloads most of the bandwidth from your origin. Blob storage remains the source of truth.
:::
