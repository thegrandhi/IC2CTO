# Design a Ticket Booking System

```meta
difficulty: Medium
minutes: 45
tags: inventory, concurrency, reservations, queues
```

Design a system like Ticketmaster for concerts. Users browse events, view a seat map, pick seats, hold them briefly while paying, and receive tickets. Popular events sell out in minutes, with millions of fans trying at once.

## Clarifying questions
- Assigned seats or general admission (a count)?
- How long can a user hold seats before paying? (For example 10 minutes.)
- Peak traffic for a hot on-sale? Bots and scalpers?
- Payment through an external provider?
- Is a waiting room / virtual queue acceptable?

## Requirements
**Functional**
- Browse and search events; view seat availability; hold seats; pay; issue tickets; release holds on expiry or cancellation.

**Non-functional**
- **Never double-sell a seat** (strong consistency on inventory).
- Survive flash crowds (millions of users in minutes) without collapsing.
- Browsing can be eventually consistent; booking must be correct.
- Fairness: first come, first served as far as practical.

## Estimation
- A hot on-sale: 5M users arriving within 10 minutes for 50k seats → **~10k+ requests/s** on the booking path if uncontrolled, and orders of magnitude more for page refreshes.
- Normal browsing: moderate, and highly cacheable.
- Inventory is small (50k seats per event), so the difficulty is **contention**, not data volume.

## API
```
GET  /v1/events?q=&city=&date=
GET  /v1/events/{id}/seats         → availability map (cached, a few seconds stale)
POST /v1/holds  { eventId, seatIds[] } → 201 { holdId, expiresAt } | 409 seats taken
POST /v1/orders { holdId, paymentToken, idempotencyKey } → 201 { orderId, tickets[] }
DELETE /v1/holds/{id}
```

## Data model
Relational DB (transactions and constraints matter):
- `events(id, venue, start_time, on_sale_at)`
- `seats(event_id, seat_id, status: available | held | sold, hold_id, hold_expires_at, order_id, version)`. A unique `(event_id, seat_id)` row per seat.
- `holds(id, user_id, event_id, expires_at, status)`
- `orders(id, user_id, hold_id, amount, payment_status, idempotency_key UNIQUE)`
- `tickets(id, order_id, seat_id, barcode)`

## High-level design
```
Users ─► CDN (event pages, seat maps) ─► Waiting room / virtual queue (for hot events)
                                              │ admits users at a controlled rate
                                              ▼
                              Booking API ─► Inventory service ─► Seats DB (per-event partition)
                                              │                   (+ Redis for hold TTLs, optional)
                                              └─► Payment service (external provider, idempotent)
Hold expiry worker ─► releases expired holds
Ticket issuing ─► email / wallet passes (async)
```

## Deep dives
**1. Preventing double-booking**
- Hold seats with a **conditional atomic update** in one transaction:
  `UPDATE seats SET status='held', hold_id=?, hold_expires_at=now()+10min WHERE event_id=? AND seat_id IN (...) AND status='available'`. If the updated row count is less than the requested count, roll back and return 409.
- Alternatives: `SELECT … FOR UPDATE`, or optimistic concurrency with a version column. Either way the **database** enforces correctness, not the application's memory.

**2. Hold expiry**
- Holds carry `expires_at`. A worker releases expired holds, and the booking path also treats expired holds as available (lazy expiry), so a stuck worker can't lock seats forever.
- Payment must complete before expiry. If the payment succeeds but the hold just expired, the order commit re-checks the hold atomically and refunds if the seats were lost.

**3. Flash crowds**
- A **virtual waiting room** admits users to the booking flow at a rate the inventory service can handle (token-based admission). This protects the database and makes the order fair and visible ("you're #4,213").
- Cache event pages and seat maps at the CDN, with seat maps a few seconds stale. The hold call is the only strongly consistent step.
- Partition inventory by event, so one hot event can't slow down others.

**4. Payments**
- Idempotency keys on order creation and payment calls; a payment provider callback confirms asynchronously; the order state machine goes pending → paid → ticketed (or failed → release the seats).

**5. Bots**
- Rate limits per account/IP/device, CAPTCHAs at admission, per-account purchase limits, and verified-fan pre-registration.

## Wrap-up
- The hard problem is **contention on a small inventory**, solved by atomic conditional updates plus admission control, not by more servers.
- Failure: holds expire automatically; payments are idempotent; the waiting room degrades gracefully.
- Extensions: general-admission counters (atomic decrement), resale marketplace, dynamic pricing.

## Rubric
- Clarified seat model, hold duration, peak on-sale traffic and bot concerns
- Identified contention (not data size) as the core challenge
- Prevented double-booking with atomic conditional updates / row locks / optimistic versions in the DB
- Implemented temporary holds with expiry (active worker + lazy expiry)
- Used a virtual waiting room / admission control for flash crowds
- Cached browsing and seat maps while keeping booking strongly consistent
- Made payment and order creation idempotent with a clear order state machine
- Handled the payment vs hold-expiry race
- Addressed bots and per-user purchase limits
