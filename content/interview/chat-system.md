## Requirements

::: ask clarify
A chat app is a big space. What do you want to pin down first?
- [key] One-to-one only, or group chats too? How big can a group get? => Both. Groups go up to 500 members.
- [key] Is message history kept, and does it sync to a user's new devices? => Yes. History is kept, and every device a user signs in on sees the same conversations.
- [key] What scale are we talking about? => About 500 million daily users, each sending around 40 messages a day.
- [key] What delivery guarantees do we need? => Never lose a message, and keep messages in order within a conversation.
- [ok] Do we need end-to-end encryption? => Not for this interview. Mention where it would change things.
- [ok] Text only, or images and video too? => Media too, but it can go through a separate upload path.
- [weak] What should the chat bubbles look like? => That's a client design question. Let's stay on the backend.
- [weak] Do we support animated stickers? => Treat them like any other media. Not worth the time now.
???
Group size decides how you fan out. History and multi-device sync decide what you store and how clients catch up. Scale sizes the connection layer, and the delivery guarantee (no loss, ordered per conversation) shapes the whole write path.
:::

::: pick scope
What will you design in the next 40 minutes? Pick everything in scope.
- [x] Real-time 1:1 and group messaging => The core.
- [x] Delivery and read receipts, plus online presence => Asked for in the prompt.
- [x] Push notifications for offline users => Offline users still need to know a message arrived.
- [x] Syncing history across a user's devices => The interviewer confirmed it.
- [ ] Voice and video calls => A different system (WebRTC, media servers). Out of scope.
- [ ] Full-text search across all messages => A nice extension, not the core problem.
- [ ] Message translation => Out of scope.
???
Messaging, receipts, presence, offline push and sync are the product. Calls and search are separate systems you can mention as extensions.
:::

::: choice priority
Which requirement shapes the design the most?
- [ ] Strong consistency across all users' views at every instant => Users only need a consistent order within each conversation, not a global one.
- [ ] Minimising storage cost => Text is cheap. Storage matters, but it doesn't drive the architecture.
- [x] Low-latency delivery with no lost messages, in order per conversation => Right. Real-time delivery, durability and per-chat ordering decide the connection layer, the write path and the sync protocol.
- [ ] Supporting every possible client platform => Clients matter, but they all speak the same protocol.
???
The hard constraints are: deliver in well under a second when both people are online, never lose a message, and keep each conversation in order. Everything else hangs off those.
:::

## Estimation

::: choice msg-rate
500 million daily users send 40 messages each. Roughly how many messages per second on average?
- [ ] About 23,000 => Too low by 10×. 20 billion a day ÷ 10⁵ seconds is about 200,000.
- [x] About 230,000 => Right. 20B messages a day ÷ 86,400 s ≈ 230k/s, maybe 700k/s at peak.
- [ ] About 2.3 million => 10× too high. That would be 200 billion messages a day.
- [ ] About 20 billion => That's the daily total, not the per-second rate.
???
500M × 40 = 20B messages a day. Divide by ~86,400 seconds: about 230,000 per second on average. Plan for roughly 3× that at peak.
:::

::: choice gateways
About 100 million users are connected at once. One gateway server can hold about 100,000 open connections. How many gateway servers?
- [ ] About 10 => That would be 10 million connections per box. No single server holds that.
- [ ] About 100 => Still 1 million connections per server, 10× more than one box handles.
- [x] About 1,000 => Right. 100M ÷ 100k ≈ 1,000 gateways, plus headroom for failures and deploys.
- [ ] About 100,000 => That's one server per thousand users. Far more than needed.
???
Concurrent connections, not messages per second, usually size the gateway fleet. 100M ÷ 100k per box ≈ 1,000 servers before headroom.
:::

## API

::: choice transport
How do clients send and receive messages in real time?
- [ ] Clients poll a REST endpoint every second => Polling adds up to a second of delay and wastes huge amounts of traffic at this scale.
- [x] A persistent WebSocket per device, plus REST for history => Right. The server can push messages the moment they arrive, and REST is fine for paging old history.
- [ ] Email-style store-and-forward over SMTP => Far too slow for chat.
- [ ] A new HTTP request per message, with the server holding it until a reply arrives => Long polling works as a fallback, but it's heavier than a WebSocket for constant two-way traffic.
???
Chat is two-way and constant, so keep a persistent connection open: WebSockets (or MQTT on mobile). Use plain REST for loading history and for account setup.
:::

::: pick send-api
What should the send message carry, so that retries and ordering work? Pick all that apply.
- [x] A client-generated message ID => Lets the server drop duplicates when a flaky connection makes the client resend.
- [x] The conversation ID => The server needs to know where the message goes.
- [ ] A client timestamp that decides the order => Phone clocks drift. The server assigns the order.
- [x] An ack back from the server with the message's sequence number => The client only marks a message "sent" once it's stored.
- [ ] The full member list of the group => The server already knows the members. Don't trust the client with that.
???
A client message ID makes sends idempotent. The server persists, assigns a per-conversation sequence number, and acks. Only then does the sender's UI show the tick.
:::

## Data model

::: choice store
You store 20 billion messages a day, and the main read is "the latest 50 messages in this conversation". Which store and key?
- [ ] One relational table, indexed by message ID => Write volume of hundreds of thousands per second will swamp a single database, and the read needs messages grouped by conversation.
- [ ] A document per user, holding all their messages => Every group message would be copied into 500 documents, and documents grow without bound.
- [ ] A search index => Built for full-text queries, not as the source of truth for a write-heavy log.
- [x] A wide-column store, partitioned by conversation and sorted by sequence number => Right. "Latest 50" is one partition read, writes spread across partitions, and it scales by adding nodes.
???
Cassandra, Scylla or HBase: partition key `conversation_id`, clustering key `seq` descending. Huge or old conversations can split into time buckets. Conversation membership and per-device cursors live in smaller tables beside it.
:::

## High-level design

::: path send-path
Build the steps a message goes through when both users are **online**, from sender to recipient.
1. Sender
2. Sender's WebSocket gateway
3. Chat service
4. Messages database
5. Session registry
6. Recipient's WebSocket gateway
7. Recipient
- extra: Push notification service => Only for recipients who are offline. Online users get it over their open connection.
- extra: CDN => Used for media downloads, not for delivering chat messages.
- extra: Blob storage => Holds images and video. Text messages go in the messages database.
???
The chat service assigns a sequence number and **persists before acking** the sender. Then it looks up which gateway holds the recipient's connection in the session registry and pushes the message there. The recipient sends a "delivered" receipt back the same way.
:::

::: path offline-path
Now the recipient is **offline**. Build the path that gets them notified.
1. Chat service
2. Message queue
3. Push notification service
4. APNs / FCM
5. Recipient's phone
- extra: Recipient's WebSocket gateway => They're offline, so there's no open connection to push to.
- extra: Session registry => Already checked: it says the user has no live connection, which is why we're here.
- extra: Load balancer => Push goes out through Apple's and Google's services, not through your load balancer.
???
Offline delivery is asynchronous: the chat service drops a job on a queue, and the push service sends it through APNs (Apple) or FCM (Google). When the user opens the app, it reconnects and syncs everything after its last sequence number.
:::

## Deep dives

::: choice ordering
Two people in a group send messages at almost the same moment. How do you make every member see them in the same order?
- [x] A per-conversation sequence number assigned by the server => Right. One counter per conversation gives a single order everyone agrees on, and it doubles as a sync cursor.
- [ ] Sort by the sender's phone timestamp => Phone clocks drift by seconds, so members would see different orders.
- [ ] Sort by the time each recipient received it => Then every member sees a different order.
- [ ] A single global counter for all messages => It works, but it's a bottleneck for 700k messages a second. You only need order within a conversation.
???
Order only matters within a conversation, so assign `seq` per conversation (a sequencer per conversation partition, or the database). Clients also use `seq` to sync: "give me everything after 1042".
:::

::: choice fanout
A message is sent to a 500-member group. How do you store and deliver it?
- [ ] Copy the message into each member's inbox, 500 writes => 500× the storage and write load for every group message.
- [x] Store it once under the conversation, then push to each online member's gateway and queue push notifications for the rest => Right. One write, many deliveries.
- [ ] Members poll the group every few seconds => Slow, and wasteful at this scale.
- [ ] Only deliver to members who are online, and drop the rest => You'd lose messages, which breaks the core requirement.
???
Store once, keyed by conversation. Fan out the *delivery*: look up each member in the session registry and push, or queue a notification. Offline members catch up by sequence number when they reconnect. Very large broadcast channels switch to members pulling.
:::

::: choice reconnect
A phone loses signal in a tunnel for two minutes and then reconnects. How does it get the messages it missed?
- [ ] The server resends everything from the last hour => Wasteful, and still could miss messages from longer outages.
- [ ] It can't. Messages pushed while it was offline are lost => That breaks the "never lose a message" requirement.
- [x] The client sends its last sequence number per conversation, and the server returns everything after it => Right. The same cursor works after two minutes or two weeks.
- [ ] The client downloads the full history again => Far too much data on a mobile connection.
???
Live pushes are best-effort. The sequence number is the source of truth: each device keeps a cursor per conversation and asks for everything after it. That's also how a brand-new device syncs history.
:::

::: choice presence
Presence: a user with 300 contacts comes online. Telling all 300 instantly causes a storm of updates at scale. What's better?
- [x] Only send presence to users who currently have a chat with them open, and let others read it lazily => Right. Most contacts aren't looking, so don't push to them.
- [ ] Broadcast every presence change to all contacts => That's the storm. At 100M online users, this dwarfs actual messages.
- [ ] Store presence in the messages database => Presence changes constantly and expires. It belongs in a fast store with TTLs, like Redis.
- [ ] Drop presence entirely => The product asked for it.
???
Gateways write `last_seen` to Redis with a short TTL on each heartbeat. Clients subscribe to presence only for the chats they have open.
:::

## Wrap-up

::: choice gateway-dies
Last one: a gateway server holding 100,000 connections crashes. What happens?
- [ ] Those users lose any messages sent to them in the meantime => Not if messages are persisted before delivery and synced by sequence number.
- [x] Clients reconnect to another gateway, re-register in the session registry and sync from their last sequence number => Right. Nothing is lost, there's just a short blip.
- [ ] Everything stops until the server is replaced => Gateways are stateless apart from connections, so others take over immediately.
- [ ] The messages database must fail over too => The database is separate and unaffected.
???
Because the database is the source of truth and every client keeps a sequence cursor, losing a gateway only costs a reconnect. Spread gateways across zones and add jittered reconnect backoff so 100k clients don't all reconnect at the same instant.
:::
