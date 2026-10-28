## Requirements

::: ask clarify
Notifications can mean a lot of things. What do you want to know?
- [key] Which channels: push, email, SMS? => All three: iOS and Android push, email and SMS.
- [key] Are some notifications urgent, like login codes, while others are bulk marketing? => Both. Login codes and order updates must arrive fast. Marketing campaigns go to millions and can be slower.
- [key] What scale: notifications per day, and the biggest single campaign? => About a billion a day, with campaigns of up to 50 million users.
- [key] Do users control what they receive? => Yes: per-channel opt-outs, quiet hours, and no spamming.
- [ok] Do we need to track delivery and opens? => Yes, per channel: sent, delivered, failed, and opened where possible.
- [weak] Which email font should we use? => That's the template designer's choice.
- [weak] Should notifications have emojis? => Content is up to the teams sending them.
???
Channels decide the providers you integrate with. Urgent vs bulk is the key insight: they need separate lanes. Scale and campaign size drive queueing and pacing, and preferences add a filtering step before anything is sent.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] An API other teams call to send notifications, using templates => Core.
- [x] Respecting opt-outs, quiet hours and frequency caps => Asked for.
- [x] Retrying failed sends and tracking status => Asked for.
- [x] Marketing campaigns sent to large segments of users => Asked for.
- [ ] Building our own SMS network => You use providers like Twilio.
- [ ] An editor for marketing teams to design emails => A separate tool that just produces templates.
- [ ] Choosing which users a campaign should target => That's the marketing team's segmentation tool. You receive the segment.
???
You're building the delivery platform: intake, filtering, routing, sending, retrying and tracking. Content creation and audience selection sit upstream.
:::

::: choice priority
Which requirement shapes the design most?
- [ ] Sending everything in under a second => Marketing can take an hour. Only urgent messages need to be fast.
- [x] Urgent messages are never delayed by bulk ones, and are never silently dropped => Right. A login code stuck behind a 50-million-user campaign is a broken product.
- [ ] Exactly-once delivery on every channel => Providers can't guarantee it. Aim for at-least-once plus deduplication.
- [ ] Storing every notification forever => Status data is huge and loses value quickly.
???
Reliability for transactional messages plus isolation between priorities: those two drive the queue layout, worker pools and retry design.
:::

## Estimation

::: choice rate
A billion notifications a day. What's the average rate?
- [ ] About 1,200 a second => 10× too low.
- [x] About 12,000 a second => Right. 10⁹ ÷ ~86,400 s ≈ 12k/s, with campaigns spiking to ~100k/s.
- [ ] About 120,000 a second on average => That's closer to a campaign peak.
- [ ] About a billion a second => That's the daily total.
???
1B ÷ 86,400 ≈ 12k/s on average. Campaigns cause spikes many times higher, and providers have their own rate limits, so you'll need to pace sends.
:::

::: choice status-volume
Each notification produces about 3 status events (sent, delivered, opened). Where do 3 billion status rows a day go?
- [ ] The main transactional database, forever => It would grow by billions of rows a day and slow everything down.
- [x] A time-partitioned store with a retention period, separate from the main database => Right. Recent status stays queryable and old partitions drop off cheaply.
- [ ] Nowhere: don't track status => Tracking was asked for.
- [ ] In the user's profile record => One hot, ever-growing record per user.
???
3B rows a day needs a store built for append-heavy, time-ordered data (a wide-column store or time-partitioned tables) with a TTL. Aggregate it into analytics separately.
:::

## API

::: pick send-api
What should `POST /v1/notifications` include? Pick all that apply.
- [x] An idempotency key from the caller => Retries from the calling service won't send the same message twice.
- [x] A template name and parameters, not raw text => Templates keep wording consistent and allow translations.
- [x] A priority: high, normal or bulk => Lets the router pick the right lane.
- [ ] Return 200 only after the message is delivered => Delivery can take minutes or fail and retry. Return 202 Accepted straight away.
- [ ] The user's push tokens and phone number => The platform looks those up itself, so callers can't send to the wrong place.
???
Return `202 Accepted` with a notification ID once it's stored. Delivery is asynchronous, and callers can check status with `GET /v1/notifications/{id}`.
:::

## Data model

::: choice preferences
Preferences are checked for every single notification. Where do you read them from?
- [ ] Ask each user's device at send time => Devices are often offline.
- [ ] Read the main database every time => 12k reads a second on average and far more during campaigns: needlessly heavy for data that rarely changes.
- [x] A cache in front of the preferences table => Right. Preferences change rarely and are read constantly, so cache them heavily.
- [ ] Hard-code them in the notification service => Then users can't change them.
???
Preferences (opt-ins per channel, quiet hours, frequency caps) are tiny and read-mostly: perfect for caching. Device tokens and contact details live alongside, and you remove tokens providers report as invalid.
:::

## High-level design

::: path send-path
Build the path of an urgent push notification, from the calling service to the user's phone.
1. Calling service
2. Notification API
3. Router
4. High-priority push queue
5. Push workers
6. APNs / FCM
- extra: Bulk queue => Bulk is for marketing. Urgent messages get their own queue so they never wait.
- extra: Twilio => That's the SMS provider. This is a push notification.
- extra: Dead-letter queue => Only for messages that keep failing after several retries.
???
The API stores the request (with its idempotency key) and returns 202. The router applies preferences, quiet hours and caps, renders the template, and drops it into the queue for its channel and priority. Workers send through the provider and record the status.
:::

## Deep dives

::: choice isolation
Marketing starts a 50-million-user campaign. A second later, a user requests a login code by SMS. How do you keep the code fast?
- [ ] Process everything in arrival order => The login code waits behind 50 million messages.
- [ ] Give login codes a higher priority field on the same queue => Most queues don't reorder by priority, and the workers are still busy with the campaign.
- [x] Separate queues and worker pools per channel and priority => Right. The campaign fills the bulk lanes, and urgent lanes stay empty and fast.
- [ ] Pause campaigns whenever an urgent message arrives => Campaigns would never finish.
???
Isolate by channel and priority: `push-high`, `push-bulk`, `sms-high`, `email-bulk` and so on, each with its own workers and rate limits. An SMS provider outage then can't slow email either.
:::

::: choice retries
The email provider starts returning errors for a few minutes. What do your workers do?
- [ ] Drop the failed emails => Transactional emails must not be silently lost.
- [ ] Retry immediately in a tight loop => You'd hammer a provider that's already struggling.
- [x] Retry with exponential backoff and jitter, then move to a dead-letter queue after several failures, and alert => Right. Short outages heal themselves, and persistent failures become visible.
- [ ] Switch every email to SMS => Users didn't ask for SMS, and it costs money.
???
Backoff with jitter spreads retries out. A dead-letter queue holds messages that still fail, for inspection or replay. Optionally fail over to a second provider for critical channels.
:::

::: choice campaign
How do you send a campaign to a segment of 50 million users?
- [ ] One API call with 50 million user IDs in the body => A single huge request is fragile and can't be retried halfway.
- [ ] Enqueue all 50 million messages instantly => You'd swamp the queues and blow through provider rate limits.
- [x] A job pages through the segment in batches, applies preferences, and feeds the bulk queue at a controlled pace => Right. It's resumable and respects rate limits.
- [ ] Ask the marketing team to split it into 5,000 campaigns => The platform should handle this.
???
Segment expansion streams users in batches. Pace the send (say, over an hour) to respect provider limits and to avoid every recipient opening the app at the same moment.
:::

::: choice dedupe
A worker sends a push, then crashes before marking it done. The queue redelivers it. How do you avoid a duplicate?
- [x] Before sending, check a record keyed by notification and channel, and skip if it's already marked sent => Right. At-least-once delivery plus deduplication behaves like exactly-once for the user.
- [ ] Use a queue that guarantees exactly-once delivery => The crash happens after the provider call, which no queue can undo.
- [ ] Never redeliver messages => Then a crash before sending loses the notification.
- [ ] Let duplicates through, since they're harmless => Two login codes or two "order shipped" emails confuse users.
???
Record `(notification_id, channel)` as sent right after the provider accepts it, and check it before sending. Providers' own idempotency keys help where they exist.
:::

## Wrap-up

::: choice provider-outage
The SMS provider goes down completely for an hour. What's the impact on the rest of the system?
- [ ] Every channel stops => Only if channels share queues and workers.
- [x] Only SMS backs up. Push and email carry on, and SMS can fail over to a second provider => Right. Isolation keeps the blast radius to one channel.
- [ ] Notifications are lost => They wait in the queue and retry.
- [ ] Users stop getting login codes forever => Failover to a backup provider, or fall back to email or push for codes.
???
Separate queues per channel mean one provider's outage only grows its own backlog. Watch queue depth and dead-letter volume per channel, and keep a secondary provider for critical channels.
:::
