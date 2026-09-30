# APIs

```meta
description: REST and gRPC, pagination, idempotency, rate limiting, and real-time delivery.
```

::: mcq api-idempotent-verbs
lesson: api-styles
Which HTTP method is **not** idempotent by definition?

- [ ] `GET`
- [ ] `PUT`
- [ ] `DELETE`
- [x] `POST`
???
Calling `PUT /users/42` (replace) or `DELETE /users/42` twice leaves the same final state as calling it once, so both are idempotent. `POST /payments` typically **creates** something new each time. That's why POSTs that create resources or move money need **idempotency keys** to be retry-safe.
:::

::: match api-status-codes
lesson: api-styles
Match each situation to the right HTTP status code.

- A new order was created => 201 Created
- The request body is missing a required field => 400 Bad Request
- Logged in, but not allowed to view this resource => 403 Forbidden
- The client exceeded its rate limit => 429 Too Many Requests
???
`201` signals creation (often with a `Location` header). `400` means the client sent something invalid. `401` means "who are you?" (not authenticated) while **`403`** means "I know who you are, and you can't do this". `429` tells clients to back off, ideally with a `Retry-After` header.
:::

::: mcq api-grpc-fit
lesson: api-styles
Where does **gRPC** fit best?

- [ ] Public APIs consumed directly by browsers
- [x] Internal service-to-service calls needing strict schemas, low overhead and streaming
- [ ] Serving static files
- [ ] Replacing the database
???
gRPC uses HTTP/2 and Protocol Buffers: compact binary messages, generated clients, deadlines, and bidirectional streaming. That's excellent inside a microservice fleet. Browsers can't speak it natively (they need gRPC-Web), so public web APIs usually stay REST (or GraphQL).
:::

::: mcq api-graphql-risk
lesson: api-styles
What's a key operational risk of exposing a **GraphQL** API publicly?

- [ ] It can't return nested data
- [x] Clients can craft very expensive deeply nested queries, so you need depth/complexity limits
- [ ] It requires WebSockets
- [ ] It can't be versioned
???
GraphQL's flexibility lets a client ask for friends of friends of friends in one request. Protect the server with **query depth and complexity limits**, timeouts, persisted (allow-listed) queries, and batching (DataLoader) to avoid N+1 database queries.
:::

::: mcq api-offset-problem
lesson: pagination
A feed uses `?offset=100&limit=20`. New posts keep arriving at the top. What goes wrong as a user scrolls?

- [ ] Nothing, offset pagination is stable
- [x] Items shift down, so the user sees duplicates or skips posts, and deep offsets get slow
- [ ] The API returns 404 after page 5
- [ ] The database locks the table
???
Offsets count rows from the **current** top. Every insert shifts everything, so page boundaries move under the user. The database also has to read and discard `offset` rows on every request. **Cursor (keyset) pagination** continues from the last item's sort key: stable and fast at any depth.
:::

::: mcq api-cursor-tiebreak
lesson: pagination
Cursor pagination on `created_at` alone sometimes skips posts. Why, and what's the fix?

- [ ] Cursors expire; make them longer-lived
- [x] Several posts can share the same timestamp; sort and filter by `(created_at, id)` so the order is total
- [ ] Timestamps aren't indexed; add an index
- [ ] Use offsets for the first page
???
If two posts share `created_at` and the page boundary falls between them, `WHERE created_at < :last` drops the second one. Adding a unique **tiebreaker** (`id`) makes every position unique: `WHERE (created_at, id) < (:c, :id)`.
:::

::: mcq api-idempotency-key
lesson: idempotency
A mobile client sends `POST /payments`, times out, and retries. How does the server avoid charging twice?

- [ ] It can't; the client should never retry payments
- [ ] Check whether a payment with the same amount was made in the last minute
- [x] The client sends a unique `Idempotency-Key`; the server stores the result for that key and returns it on retries
- [ ] Use `PUT` instead of `POST`
???
The server records `key → result` when it first processes the payment (in the same transaction as the charge). A retry with the same key returns the **stored response** instead of charging again. Matching by amount is fragile: two legitimate payments can have the same amount.
:::

::: mcq api-backoff-jitter
lesson: idempotency
Why add **jitter** to exponential backoff?

- [ ] To make retries faster
- [x] So clients that failed at the same moment don't all retry at the same moment, causing a retry storm
- [ ] To encrypt retry timing
- [ ] Jitter is only for UDP
???
Without jitter, a thousand clients that failed together retry together (at 1 s, 2 s, 4 s…), hammering the recovering service in synchronized waves. Randomizing the delay spreads retries out, so recovery actually succeeds.
:::

::: mcq api-retry-which
lesson: idempotency
Which failure should a client **not** retry automatically?

- [ ] Request timeout
- [ ] `503 Service Unavailable`
- [ ] `429 Too Many Requests` (after the `Retry-After` delay)
- [x] `400 Bad Request`
???
A `400` means the request itself is wrong, and retrying the same bytes will fail the same way. Timeouts, `503` and `429` are **transient**, so retry them with backoff (and idempotency keys for non-idempotent operations).
:::

::: mcq api-token-bucket
lesson: rate-limiting
A token bucket has capacity 10 and refills 1 token per second. A client has been idle for a minute, then sends 15 requests at once. How many succeed immediately?

- [ ] 1
- [x] 10
- [ ] 15
- [ ] 60
???
Tokens accumulate only up to the bucket's **capacity** (10), no matter how long the client was idle. The burst spends all 10; the remaining 5 are rejected (or queued) until tokens refill at 1 per second. Token buckets allow **bounded bursts** while enforcing the long-run average rate.
:::

::: mcq api-fixed-window
lesson: rate-limiting
A limit of "100 requests per minute" uses a **fixed window** counter. What's the flaw?

- [ ] It needs too much memory
- [x] A client can send 100 at 12:00:59 and 100 more at 12:01:00, doubling the rate at the boundary
- [ ] It can't be shared across servers
- [ ] It blocks legitimate users forever
???
Fixed windows reset abruptly, so bursts straddling the boundary get 2× the intended rate. A **sliding window counter** (weighting the previous window's count) or a token bucket smooths this out at similar cost.
:::

::: mcq api-distributed-limit
lesson: rate-limiting
Twenty API gateway instances must enforce one shared per-user limit. What's the standard approach?

- [ ] Each gateway enforces the full limit locally
- [x] Keep counters in a shared store like Redis and update them atomically (`INCR`/`EXPIRE` or a Lua script)
- [ ] Use sticky sessions so each user always hits the same gateway
- [ ] Store counters in the relational database with a row lock per request
???
Local-only limits let a user get 20× the quota by spreading requests across gateways. A shared, fast, **atomic** counter store fixes that. Also decide whether to **fail open** (allow traffic if Redis is down) or **fail closed**. Sticky routing is fragile and fails on rebalancing.
:::

::: mcq api-fail-open
lesson: rate-limiting
The Redis cluster backing your rate limiter goes down. For a public read API, what's the usual choice?

- [x] Fail open: allow requests (perhaps with a local fallback limit) and alert
- [ ] Fail closed: reject all requests until Redis recovers
- [ ] Crash the gateway so it restarts
- [ ] Switch every limit to zero
???
Rate limiting protects availability, so taking the whole API down because the *limiter* failed defeats the purpose. Most systems **fail open** with a coarse local limit as a backstop. Security-critical endpoints (like login brute-force protection) may reasonably fail closed.
:::

::: match api-realtime-fit
lesson: realtime-delivery
Match each feature to the best delivery mechanism.

- Two-way chat with typing indicators => WebSockets
- Streaming progress of a long export to the browser => Server-Sent Events
- Notifying a customer's server that a payment settled => Webhooks
- Checking for a new app version once an hour => Polling
???
**WebSockets** are full duplex, which suits interactive chat. **SSE** is a simple server → client stream with auto-reconnect. **Webhooks** push to *other servers*: sign them and retry. Rare, non-urgent checks don't justify persistent connections, so **polling** is fine.
:::

::: mcq api-websocket-routing
lesson: realtime-delivery
Users hold WebSocket connections to 200 gateway servers. A message for user X arrives at a random backend. How does it reach X?

- [ ] Broadcast every message to all 200 gateways
- [x] Look up which gateway holds X's connection (a presence registry) or publish on X's pub/sub channel
- [ ] Ask X's client to poll for messages
- [ ] Route all users to one gateway
???
Persistent connections are pinned to specific servers, so you need **routing**: a registry mapping `user → gateway` (kept in Redis, for example) or a pub/sub channel per user or room that the right gateway subscribes to. Broadcasting to everyone doesn't scale. Messages are persisted first, so offline users get them later (plus a push notification).
:::

::: mcq api-webhook-security
lesson: realtime-delivery
How should a receiver verify that an incoming webhook really came from the provider?

- [ ] Check the sender's IP address only
- [x] Verify an HMAC signature of the payload (and timestamp) using a shared secret
- [ ] Require the webhook URL to be secret
- [ ] Reply with the payload so the sender can confirm it
???
Providers sign each payload (and a timestamp) with a shared secret, and receivers recompute the HMAC and compare. Including the timestamp prevents **replay attacks**. Receivers should also dedupe by event ID, since webhooks are retried.
:::

::: mcq api-versioning
lesson: api-styles
You're adding an **optional** field to a JSON response. Do you need a new API version?

- [ ] Yes, every change needs a new version
- [x] No, additive, backward-compatible changes don't; breaking changes (removing or renaming fields) do
- [ ] Only if the field is a number
- [ ] Only for mobile clients
???
Well-behaved clients ignore unknown fields, so **adding** fields is safe. Version bumps are for **breaking** changes: removing or renaming fields, or changing types or meanings. Keep the old version running while clients migrate.
:::

::: order api-rate-limit-flow
lesson: rate-limiting
Order the steps a gateway takes when enforcing a token-bucket limit on a request.

1. Identify the client (API key, user ID, or IP)
2. Refill the client's bucket for the time elapsed since the last request
3. If a token is available, spend it; otherwise reject with 429
4. Forward the allowed request to the backend service
???
Identify first, so you know whose bucket to use. Refill lazily based on the timestamp (no background timers). Then consume or reject, and only forward allowed traffic. In a distributed setup, steps 2–3 run atomically in the shared store.
:::
