# Design a Chat System

```meta
difficulty: Hard
minutes: 45
tags: websockets, message storage, presence, fan-out
```

Design a messaging app like WhatsApp or Messenger. It supports one-to-one and group chats (up to 500 members), delivery and read receipts, online presence, and push notifications for offline users. Messages sync across a user's devices.

## Clarifying questions
- 1:1 only, or groups too? What's the max group size?
- Media messages (images, video) or text only?
- **Message history**: stored forever, and synced to new devices?
- Delivery guarantees: "at least once, in order per conversation"?
- End-to-end encryption?
- Scale: DAU, messages per day?

## Requirements
**Functional**
- Send and receive messages in 1:1 and group chats, in real time.
- Delivery and read receipts; online/last-seen presence.
- Offline users get push notifications and receive the backlog when they come online.
- Multi-device sync and history.

**Non-functional**
- **Low latency** delivery (< 200 ms when both users are online).
- **No message loss**; **ordered** within a conversation.
- Highly available; scales to hundreds of millions of connected users.

## Estimation
- 500M DAU, 40 messages/day each → 20B messages/day ≈ **230k messages/s** average, ~700k at peak.
- Concurrent connections: maybe 100M. At ~100k connections per gateway box, that's **~1,000 gateway servers**.
- Storage: 20B × ~200 bytes ≈ 4 TB/day of text, **~1.5 PB/year** (media is separate, in blob storage).

## API
Over a persistent **WebSocket** (plus REST for history and setup):
```
→ send    { clientMsgId, conversationId, body }
← ack     { clientMsgId, messageId, seq, serverTs }        // persisted
← message { conversationId, messageId, seq, sender, body }
→ receipt { conversationId, upToSeq, type: "delivered" | "read" }
GET /v1/conversations/{id}/messages?before=<seq>&limit=50   // history
```
`clientMsgId` makes retries **idempotent**, so a resend after a flaky connection doesn't duplicate the message.

## Data model
- `messages` in a **wide-column store** (Cassandra/Scylla/HBase): partition key `conversation_id`, clustering key `seq` (descending). "Latest 50 in conversation X" is then a single partition read. Very large or old conversations can use time-bucketed partitions.
- `conversations` and `members`: a relational or KV store (`conversation_id → members`, `user_id → conversation list` with the last message and unread counts).
- `seq`: a per-conversation, monotonically increasing number for ordering and sync ("give me everything after seq 1042").
- `device_cursors`: `(user, device, conversation) → last delivered seq`.
- Presence: ephemeral, in Redis with TTL heartbeats.

## High-level design
```
Clients ⇄ WebSocket gateways ──► Chat service ──► Messages DB (wide-column)
                ▲                     │
                │                     ├──► per-conversation sequencer
      session registry (Redis)        ├──► pub/sub / routing to gateways
      user → gateway                  └──► queue ──► push notification service (APNs/FCM)
```
**Send path**: client → its gateway → chat service assigns `seq` and **persists** → ack to the sender → look up the recipients' gateways in the session registry → deliver → recipients send "delivered" receipts. Recipients who are offline get a push notification from the queue.

## Deep dives
**1. Connection management and routing**
- Gateways hold the WebSockets; a registry maps `user/device → gateway`. Delivery publishes to the gateway(s) holding the recipients' connections.
- Heartbeats detect dead connections. On reconnect, a client syncs from its last `seq` per conversation, so nothing is lost even if a live push was dropped.

**2. Ordering and exactly-once display**
- A per-conversation sequence number (a single sequencer per conversation partition, or DB-assigned) gives a total order within each chat, which is all users need.
- At-least-once delivery + client dedupe by `messageId` → each message is shown once.

**3. Group fan-out**
- Groups of ≤ 500: **fan-out on write** to each member's gateway (online) or notification queue (offline). The message is stored **once**, keyed by conversation, and not copied per member.
- Very large channels (broadcast): members pull instead.

**4. Receipts and presence**
- Receipts are just messages with an `upToSeq`, batched to save traffic. Group receipts aggregate per message.
- Presence: gateways update `last_seen` with a TTL. Only publish presence changes to users who have the chat open (subscribe on open) to avoid a presence storm.

**5. Media**
- Upload to blob storage with a presigned URL; the message carries the media key and a thumbnail; delivery goes through a CDN with signed URLs.

**6. Encryption (if asked)**
- End-to-end (Signal protocol): the server stores ciphertext only, and key exchange happens between devices. Server-side search becomes impossible.

## Wrap-up
- Bottlenecks: gateway connection counts (scale horizontally), hot group conversations (partitioning), and write throughput (wide-column scales linearly).
- Failure: a gateway dies → clients reconnect elsewhere and resync by `seq`. The messages DB is replicated across availability zones.
- Extensions: search (client-side if E2E), message edits and deletes (tombstones), disappearing messages (TTL).

## Rubric
- Clarified group size, history/sync, media, receipts, presence and encryption scope
- Estimated message rate, concurrent connections (→ gateway count) and storage
- Used persistent connections (WebSockets) and a registry/pub-sub to route messages to the right gateway
- Persisted before acknowledging, with idempotent sends (client message IDs)
- Ordered messages per conversation with sequence numbers, and synced via "everything after seq N"
- Modelled messages partitioned by conversation in a write-scalable store
- Handled offline users with push notifications and backlog sync on reconnect
- Designed group fan-out (store once, deliver to many) and receipts/presence efficiently
- Addressed media via blob storage + CDN, and failure/reconnect behaviour
