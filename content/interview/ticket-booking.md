## Requirements

::: ask clarify
Before you design anything, what do you need to know about these on-sales?
- [key] Are seats assigned, or is it general admission? => Assigned seats. Users pick exact seats on a map.
- [key] How long can someone hold seats while paying? => 10 minutes. After that, the seats go back on sale.
- [key] How big is the rush for a popular event? => Around 5 million fans arrive within 10 minutes for 50,000 seats.
- [key] Do we need to deal with bots and scalpers? => Yes, they're a real problem.
- [ok] Do we handle payments ourselves? => No, an external provider handles cards.
- [weak] What should the seat map look like? => A front-end concern. Let's stay on the backend.
- [weak] Do we support refunds for cancelled shows? => Not in this interview.
???
Assigned seats and hold time define the inventory model. Rush size tells you the real problem is contention and flash crowds, not data volume. Bots add admission control and purchase limits.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Browsing events and seeing seat availability => Needed before anyone books.
- [x] Holding seats for 10 minutes while paying => Asked for.
- [x] Taking payment and issuing tickets => The end of the flow.
- [x] Surviving the rush for hot events => The interviewer stressed it.
- [ ] A resale marketplace for fans => An extension.
- [ ] Venue management tools for organisers => A separate back-office product.
- [ ] Dynamic pricing => An extension.
???
Browse, hold, pay, issue, and survive the flash crowd. Resale, venue tools and pricing can wait.
:::

::: choice priority
Which requirement matters most?
- [x] Never selling the same seat twice => Right. Double-selling means two people at the venue with the same seat. Inventory must be strongly consistent.
- [ ] The seat map is accurate to the millisecond => A few seconds stale is fine, as long as the hold step is correct.
- [ ] Booking takes less than 100 ms => Correctness and fairness beat raw speed.
- [ ] Storing years of event history => Easy, and not what makes this hard.
???
Booking must be correct, and browsing can be eventually consistent. Your design spends its strong consistency on exactly one step: holding seats.
:::

## Estimation

::: choice rush
5 million fans arrive within 10 minutes. Roughly how many requests per second hit the booking path if nothing controls them?
- [ ] About 800 => That's 5M spread evenly over almost two hours.
- [x] About 10,000 or more, before counting page refreshes => Right. 5M ÷ 600 s ≈ 8,000/s, and frantic refreshes multiply it.
- [ ] About 500,000 => That would be everyone arriving within 10 seconds, not 10 minutes.
- [ ] About 50 => Far too low.
???
5,000,000 ÷ 600 s ≈ 8,300 requests a second at minimum, all fighting over 50,000 seats. The data is tiny. The challenge is contention.
:::

::: choice data-size
An event has 50,000 seats. What's the main scaling problem?
- [ ] Storing the seats: there's too much data => 50,000 rows is tiny.
- [ ] Network bandwidth for seat maps => Seat maps can be cached at the CDN.
- [x] Many users fighting over the same few rows at the same moment => Right. Contention on a small inventory is what you design around.
- [ ] Generating ticket barcodes => Cheap and done after payment.
???
More servers don't fix contention. You need atomic updates on the inventory and admission control in front of it.
:::

## API

::: choice hold-api
A user picks four seats and taps "Continue". What does the API do?
- [ ] Create the order and charge the card immediately => The user hasn't entered payment details yet.
- [ ] Nothing until they pay. Seats stay available meanwhile => Someone else could buy them while this user is typing card details.
- [ ] Mark the seats sold => They haven't paid. If they abandon, the seats are stuck.
- [x] `POST /holds` with the seat IDs: return a hold ID and expiry time, or 409 if any seat is taken => Right. The seats are reserved for 10 minutes while they pay.
???
Hold, then pay: `POST /v1/holds {eventId, seatIds}` → `{holdId, expiresAt}` or `409`. Then `POST /v1/orders {holdId, paymentToken, idempotencyKey}`.
:::

## Data model

::: choice inventory-store
Where does seat inventory live?
- [ ] An eventually consistent NoSQL store => Two writers could both "win" the same seat.
- [ ] In the booking servers' memory => Several servers, each with their own copy: double-selling guaranteed.
- [x] A relational database with one row per seat, partitioned by event => Right. Transactions and conditional updates make the database enforce "one buyer per seat".
- [ ] A spreadsheet the venue maintains => Not under load.
???
`seats(event_id, seat_id, status, hold_id, hold_expires_at, order_id)`. The database, not application code, guarantees correctness. Partition by event so one hot event can't slow the others.
:::

## High-level design

::: path booking-path
Build the path of a fan booking seats for a hot event, from their browser to the seat being held.
1. Client
2. CDN (optional)
3. Waiting room
4. Booking API
5. Inventory service
6. Seats database
- extra: Payment provider => Payment comes after the hold, in a separate step.
- extra: Email service => Tickets are emailed after payment, asynchronously.
- extra: Search index => Used for finding events, not for holding seats.
???
Event pages and seat maps come from the CDN. For hot events, a waiting room admits fans to the booking flow at a controlled rate. The inventory service then holds seats with one atomic update in the seats database.
:::

## Deep dives

::: choice double-sell
Two fans try to hold the same seat at the same instant. How do you make sure only one gets it?
- [ ] Check the seat is available, then update it => Both can pass the check before either writes.
- [ ] Use a lock in the booking server's memory => Other servers don't see that lock.
- [x] One conditional update: `UPDATE seats SET status='held' … WHERE seat_id IN (…) AND status='available'`, and fail if fewer rows changed than requested => Right. The database makes it atomic: exactly one hold wins.
- [ ] Let both through and refund one later => A terrible experience, and it breaks the core requirement.
???
Do it in one transaction: if the updated row count is less than the number of seats requested, roll back and return 409. `SELECT … FOR UPDATE` or optimistic versioning work too. The database enforces correctness.
:::

::: choice expiry
A user holds seats and then closes their laptop. How do the seats come back?
- [ ] Only when an admin releases them => Seats would stay stuck during the busiest minutes.
- [x] Holds carry an expiry time. A worker releases expired holds, and the booking path also treats expired holds as available => Right. Even if the worker stalls, expired holds can't block a sale.
- [ ] Never. The user owns them now => They never paid.
- [ ] When the user's session cookie expires => You can't rely on the client to tell you.
???
Combine an active cleaner (a job releasing expired holds) with lazy expiry (treat `hold_expires_at < now()` as available on the hold path), so correctness never depends on the worker running on time.
:::

::: choice flash-crowd
The on-sale opens and 5 million fans hit "Buy" at once. What protects the system and keeps it fair?
- [ ] Add more database servers on the day => The contention is on the same seat rows, so more servers don't help much.
- [x] A virtual waiting room that admits fans to the booking flow at a controlled rate, with a visible place in line => Right. The database sees a steady flow, and fans see a fair, first-come order.
- [ ] Return errors and let people keep retrying => Retries multiply the load and reward whoever has the fastest script.
- [ ] Hold a random draw instead => Possible as a product choice, but you still need to control the flow.
???
Admission control turns a stampede into a queue: "You're #4,213". Combine it with CDN-cached pages and per-event partitioning, and the inventory database only sees as much traffic as it can handle.
:::

::: choice payment-race
A fan's payment succeeds one second after their 10-minute hold expired, and someone else has already grabbed the seats. What should happen?
- [ ] Issue the tickets anyway => Now two people own the same seats.
- [ ] Charge the card and say nothing => The fan paid for nothing.
- [ ] It can't happen => It can: payment providers are sometimes slow.
- [x] Committing the order re-checks the hold atomically. If the seats are gone, refund the payment and tell the fan => Right. Handle the race explicitly instead of hoping it won't occur.
???
The order commit must verify that the hold is still valid in the same transaction that marks seats sold. Payments use idempotency keys, so retries never double-charge.
:::

::: choice bots
Bots grab most of the seats within seconds. Which measures help? Pick the best answer.
- [ ] Nothing can stop bots => There's plenty you can do.
- [ ] Block every request from cloud providers' IP addresses => Crude, and it blocks real users on VPNs.
- [x] Rate limits per account and device, CAPTCHAs at the waiting room, purchase limits per account, and verified-fan pre-registration => Right. Layered defences raise the cost of botting.
- [ ] Make the website slower for everyone => It hurts real fans more than bots.
???
No single fix stops bots. Combine admission checks, per-account limits and pre-verification, and watch for suspicious patterns.
:::

## Wrap-up

::: choice lesson
What's the key insight in this design?
- [x] The hard part is contention on a small inventory, solved with atomic updates and admission control => Right. More servers don't fix 5 million people wanting the same 50,000 rows.
- [ ] The hard part is storing a huge amount of data => The data is tiny.
- [ ] The hard part is the CDN => Caching browsing traffic is the easy part.
- [ ] The hard part is sending ticket emails => That's asynchronous and simple.
???
Spend strong consistency only where it matters (the hold), cache everything else, and meter the crowd before it reaches the database.
:::
