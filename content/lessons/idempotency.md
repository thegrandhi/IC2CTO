# Idempotency and Safe Retries

```meta
category: apis
summary: Making retries safe with idempotency keys, so a timeout never charges a card twice.
minutes: 4
order: 15
```

Networks fail in the worst possible way: **the request succeeded, but the response was lost**. The client can't tell "the server never got it" apart from "it worked but the reply vanished", so it retries. Without protection, you've now **charged the card twice**.

An operation is **idempotent** if doing it several times has the same effect as doing it once. `GET`, `PUT` and `DELETE` are idempotent by design. `POST` ("create a payment") is not, unless you make it so.

### Idempotency keys
1. The client generates a unique key (a UUID) per *logical* operation and sends it: `Idempotency-Key: 7f3c…`.
2. The server stores `key → result` when it first processes the request, ideally in the **same transaction** as the work itself.
3. A retry with the same key returns the **stored result** instead of doing the work again.
4. A concurrent duplicate (same key while the first is still in progress) gets `409 Conflict` or waits.
5. Keys expire after a sensible window, such as 24 hours.

Stripe's API popularized this pattern, and it's expected in any payments or ordering design.

### Retry etiquette
- Retry only on **transient** errors (timeouts, `503`, `429`), never on `400`.
- Use **exponential backoff with jitter**: `sleep = random(0, base × 2^attempt)`. Without jitter, clients that failed together retry together, creating a **retry storm**.
- Cap the attempts, and use **timeouts** on every network call.
- Pair retries with **circuit breakers**, so you stop hammering a service that's down.

### Idempotency elsewhere
- **Message consumers** (at-least-once delivery) need the same protection: dedupe on the message ID.
- **Unique constraints** turn "create order #123 twice" into a clean conflict instead of a duplicate row.

## Key takeaways
- Retries are inevitable; lost responses make duplicates inevitable too.
- Idempotency keys store the first result and replay it for retries.
- Retry only transient failures, with exponential backoff, jitter, and caps.

## Go deeper
- [Designing robust APIs with idempotency (Stripe)](https://stripe.com/blog/idempotency)
- [Timeouts, retries and backoff with jitter (Amazon Builders' Library)](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
