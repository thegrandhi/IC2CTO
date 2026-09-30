# Real-Time Delivery: Polling, SSE, WebSockets, Webhooks

```meta
category: apis
summary: How servers push updates to clients, and what each option costs.
minutes: 4
order: 17
```

HTTP is request-response: the client asks, the server answers. Chat, live scores, notifications and collaborative editing need the **server to push**.

### Options
- **Short polling**: the client asks "anything new?" every few seconds. Trivial to build, but wasteful (mostly empty responses) and laggy (up to one polling interval).
- **Long polling**: the server holds the request open until there's data or a timeout, then the client immediately re-requests. Near-real-time over plain HTTP, but reconnecting constantly adds overhead.
- **Server-Sent Events (SSE)**: one long-lived HTTP response streams events **server → client**. Browsers reconnect automatically and resume with `Last-Event-ID`. Simple and proxy-friendly, but one-directional.
- **WebSockets**: a persistent, full-duplex connection upgraded from HTTP. Low latency in both directions: the standard for chat, multiplayer and collaboration.
- **Webhooks**: *server-to-server* push. Your system calls a customer's URL when something happens. Sign payloads (HMAC), retry with backoff, and expect receivers to dedupe.

### Scaling persistent connections
- Each open WebSocket holds memory on a specific server. A connection-gateway fleet can hold hundreds of thousands to millions of connections.
- **Routing**: to deliver to user X, you need to know which gateway holds X's connection. Keep a **presence/session registry** (for example `user → gateway` in Redis), or have gateways subscribe to a **pub/sub** channel per user or room.
- **Load balancers** need to support the WebSocket upgrade and long idle timeouts. Use heartbeats (ping/pong) to detect dead connections.
- **Offline users**: persist messages first, deliver when they reconnect, and fall back to mobile **push notifications** (APNs/FCM).

### Choosing
| Need | Pick |
|---|---|
| Occasional updates, simplest possible | polling |
| Server → client stream (feeds, progress, notifications) | SSE |
| Bidirectional, low latency (chat, games, editors) | WebSockets |
| Notify another company's server | webhooks |

## Key takeaways
- Polling is simple but wasteful; long polling is near-real-time over HTTP.
- SSE streams server → client with automatic reconnects; WebSockets are full duplex.
- Scaling WebSockets means routing through a connection registry or pub/sub, with persistence for offline users.

## Go deeper
- [Server-sent events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [The WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
