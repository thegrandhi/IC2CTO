# Design a Notification System

```meta
difficulty: Medium
minutes: 45
tags: queues, fan-out, retries, third-party providers
```

Design a service that other teams use to send notifications through **push** (iOS/Android), **email** and **SMS**. Examples: "your order shipped", "someone liked your photo", marketing campaigns to millions of users. Users can set preferences (channels, quiet hours, opt-outs).

## Clarifying questions
- Which channels, and which third-party providers (APNs, FCM, SES/SendGrid, Twilio)?
- **Transactional** (must arrive, e.g. OTP codes) vs **marketing** (bulk, lower priority)?
- Scale: notifications per day, and the largest single campaign?
- Is **delivery tracking** (sent, delivered, opened) needed?
- Templates and localization? Rate limits per user (don't spam)?

## Requirements
**Functional**
- API for services to send a notification to a user (or segment) on one or more channels, using templates.
- Respect user preferences, opt-outs and quiet hours; deduplicate.
- Track status; retry failures; support scheduled sends.

**Non-functional**
- **Reliable**: transactional messages are never silently dropped (at-least-once, with dedupe).
- **Prioritized**: an OTP must not wait behind a 50M-user marketing blast.
- Scalable to bursts; decoupled from slow or failing providers.

## Estimation
- 1B notifications/day ≈ **12k/s** average; campaigns spike to ~100k/s.
- Providers impose their own rate limits (for example SMS throughput per sender number), so we must **throttle outbound traffic**.
- Status events: ~3 per notification → 3B rows/day. Store them in a time-partitioned or TTL'd store, not the main database.

## API
```
POST /v1/notifications
{
  "idempotencyKey": "order-123-shipped",
  "userId": "u42" | "segmentId": "s7",
  "template": "order_shipped",
  "params": { "orderId": "123" },
  "channels": ["push", "email"],
  "priority": "high" | "normal" | "bulk",
  "sendAt"?: "2026-10-01T09:00:00Z"
}
→ 202 { "notificationId": "n_abc" }

GET /v1/notifications/{id} → status per channel
PUT /v1/users/{id}/preferences
```
Return `202 Accepted`: delivery is asynchronous.

## Data model
- `notifications`: id, idempotency key (unique), user, template, params, priority, created_at.
- `deliveries`: notification_id, channel, status (queued/sent/delivered/failed), attempts, provider message id.
- `preferences`: user → per-channel opt-in, quiet hours, frequency caps (cached heavily).
- `devices`: user → push tokens (APNs/FCM), email, phone. Remove tokens the provider reports as invalid.
- `templates`: versioned, localized.

## High-level design
```
Services ─► Notification API ─► validate + dedupe (idempotency key)
                                   │
                                   ▼
                       Router: preferences, quiet hours, rate caps, render template
                                   │
            ┌──────────────┬───────┴───────┬──────────────┐
            ▼              ▼               ▼              ▼
     queue:push-high  queue:email    queue:sms       queue:bulk-*   (per channel × priority)
            │              │               │
      push workers    email workers    sms workers  ─► providers (APNs/FCM, SES, Twilio)
            │
     status events ─► tracking store / analytics; failures ─► retry with backoff ─► DLQ
Scheduler: holds sendAt / quiet-hours messages and releases them on time
Campaigns: segment expansion job streams users into bulk queues
```

## Deep dives
**1. Reliability**
- Persist the notification (with its idempotency key) before returning 202. Queue consumers are at-least-once; dedupe per `(notification, channel)` before calling the provider.
- Retry transient provider errors with exponential backoff and jitter; send to a **DLQ** after N attempts; alert on DLQ growth.

**2. Priority and isolation**
- Separate queues (and worker pools) per channel **and** priority, so a marketing blast can't starve OTPs. Each provider gets its own pool, so an SMS outage doesn't block email.

**3. Throttling**
- Token buckets per provider account (their rate limits) and per user (frequency caps: "at most 3 marketing pushes a day").
- Campaign sends are paced (for example over an hour) to protect providers and our own downstream systems (a push → app opens → API load spike).

**4. Campaign fan-out**
- Don't enqueue 50M messages in one request. A segment-expansion job pages through the users in batches, applying preferences, and streams them into the bulk queues.

**5. Tracking**
- Providers report delivery and bounces via callbacks/webhooks → update `deliveries`. Opens and clicks come via tracking pixels and redirect links. Invalid tokens and bounced addresses are removed.

## Wrap-up
- Bottlenecks: provider rate limits (pacing), preference lookups (cache), status write volume (time-partitioned storage).
- Failure: a provider outage → its queue grows and the others are unaffected; optionally fail over to a secondary provider (for example a second SMS vendor).
- Extensions: in-app notification inbox, digesting (batch 10 likes into one push), A/B tests on templates.

## Rubric
- Separated transactional from marketing traffic and prioritized them with separate queues/workers
- Defined an async API (202) with idempotency keys and templates
- Applied user preferences, opt-outs, quiet hours and frequency caps before sending
- Used queues per channel/priority with at-least-once delivery plus dedupe
- Retried transient failures with backoff and jitter, with a dead-letter queue
- Throttled to respect provider rate limits and paced large campaigns
- Expanded campaign segments in batches rather than one giant enqueue
- Tracked delivery status via provider callbacks and cleaned up invalid tokens/addresses
- Isolated provider failures and considered provider failover
