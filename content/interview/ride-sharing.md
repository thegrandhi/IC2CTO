## Requirements

::: ask clarify
Ride-sharing has a lot of moving parts. What do you want to know first?
- [key] How many drivers are online at peak, and how many rides a day? => About 5 million drivers online at peak, and 20 million rides a day.
- [key] How often do drivers send their location? => Every 4 seconds while they're online.
- [key] Do we match the nearest driver, or something smarter? => The driver who can reach the rider fastest is fine for now.
- [key] How fast should matching be? => Within a few seconds of the request.
- [ok] Are payments in scope? => Treat payments as an existing service you call when the trip ends.
- [ok] Is surge pricing in scope? => Mention it if you have time.
- [weak] What colour are the cars on the map? => A client detail. Let's stay on the backend.
- [weak] Should drivers be able to rate riders? => A nice feature, but it doesn't change the core design.
???
Driver count × update frequency is the dominant load in this system. Matching strategy and speed shape the matching service, and scoping out payments keeps the interview on the hard parts.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Drivers going online and streaming their location => It powers everything else.
- [x] Riders requesting a ride and being matched to a nearby driver => The core.
- [x] Live location for both sides during pickup and the trip => Asked for.
- [x] The trip's states, from requested to completed or cancelled => Needed to get money and assignments right.
- [ ] Building our own maps and routing engine => Use an existing maps provider.
- [ ] Driver onboarding and background checks => A separate back-office system.
- [ ] Food delivery => A different product.
???
Location, matching, live tracking and the trip state machine are the system. Maps, onboarding and other products sit around it.
:::

::: choice priority
Which requirement needs the strongest guarantee?
- [ ] Every rider's map of nearby cars is exactly up to date => A car icon a few seconds stale is fine.
- [x] A driver is never assigned to two rides at once => Right. Double-assigning a driver strands a rider, so assignment must be strongly consistent.
- [ ] Location history is kept forever => Useful for analytics, but not on the critical path.
- [ ] Every request is matched in under 100 ms => A few seconds is fine.
???
Mix consistency levels: strong for driver assignment and ride state (money and people depend on it), eventual for the map of nearby cars.
:::

## Estimation

::: choice location-writes
5 million drivers each send their location every 4 seconds. How many location updates per second?
- [ ] About 125,000 => 10× too low.
- [ ] About 12.5 million => 10× too high.
- [x] About 1.25 million => Right. 5M ÷ 4 s = 1.25M updates a second, by far the biggest load in the system.
- [ ] About 20 million => That's the number of rides per day.
???
5,000,000 ÷ 4 = 1,250,000 writes a second. Ride requests are only a few hundred a second on average. Location ingestion is what you design around.
:::

::: choice ride-rate
20 million rides a day. Roughly how many ride requests per second on average?
- [x] About 230 => Right. 20M ÷ ~86,400 s ≈ 230 a second, with peaks of a few thousand.
- [ ] About 2,300 => 10× too high for the average.
- [ ] About 23 => 10× too low.
- [ ] About 1.25 million => That's the location update rate.
???
20M ÷ 86,400 ≈ 230/s. Matching volume is modest. The challenge is doing it correctly and fast against a constantly moving index.
:::

## API

::: choice location-api
How should driver apps send their location every 4 seconds?
- [ ] A full REST request with a new connection each time => A new TLS connection every 4 seconds for 5 million phones is very wasteful.
- [x] Over a persistent connection, like a WebSocket, that's also used to push ride offers => Right. One connection carries location up and offers down.
- [ ] Batch an hour of locations and send them together => Matching needs the location now.
- [ ] SMS => Slow and expensive.
???
Drivers keep a WebSocket open: location goes up every few seconds, ride offers and updates come down instantly. Riders use REST to request rides, plus push or a socket for live updates.
:::

## Data model

::: choice geo-index
Where do live driver locations live for "find available drivers near this rider"?
- [ ] A SQL table with latitude and longitude columns, queried with a bounding box => 1.25 million updates a second would crush a disk-based index.
- [ ] Scan every driver's location for each request => Millions of drivers per request: far too slow.
- [x] An in-memory index of map cells (geohash, H3 or S2), sharded by region, with a TTL on each driver => Right. Fast updates, fast nearby lookups, and silent drivers drop out.
- [ ] The rides database => Rides are durable records. Live location is ephemeral and changes constantly.
???
Divide the map into cells. Each cell holds the IDs of available drivers. A driver only moves between cells when crossing a boundary. Location history goes to a stream (Kafka) for analytics, separate from the live index.
:::

## High-level design

::: path location-path
Build the path of a driver's location update.
1. Driver app
2. Location gateway
3. Location service
4. In-memory geo index
- extra: Rides database => Live location doesn't belong in the durable rides store.
- extra: Payment service => Not involved until the trip ends.
- extra: Matching service => It reads the geo index when a ride is requested. Updates don't go through it.
???
The gateway holds the driver's connection, the location service updates the driver's cell in the in-memory index, and it also writes each update to Kafka for history and ETA models, off to the side.
:::

::: path request-path
Now build the path of a ride request, up to the moment a driver receives the offer.
1. Rider app
2. Ride service
3. Matching service
4. In-memory geo index
5. Driver's location gateway
6. Driver app
- extra: Kafka location history => History is for analytics, not for finding drivers right now.
- extra: Payment service => Charged when the trip ends, not at request time.
- extra: CDN => Nothing here is static content.
???
The ride service records the request, the matching service queries nearby cells for available drivers, ranks them by ETA, claims one atomically, and pushes the offer over that driver's open connection.
:::

## Deep dives

::: choice nearby
A rider stands right at the edge of a map cell. How do you find the closest drivers?
- [ ] Only search the rider's own cell => A driver 50 metres away in the next cell would be missed.
- [x] Search the rider's cell plus its neighbours, then rank candidates by driving time => Right. Neighbours fix edge cases, and ETA beats straight-line distance (a driver across a river is "close" but far away).
- [ ] Search the whole city and sort by distance => Too slow at this scale.
- [ ] Pick a random driver in the cell => Riders would wait much longer than necessary.
???
Query a ring of cells around the rider, filter to available drivers, then rank by road-network ETA from a routing service.
:::

::: choice double-book
Two ride requests choose the same driver at the same moment. How do you stop both from getting them?
- [ ] Check the driver is available, then assign => Both requests can pass the check before either assigns.
- [x] Claim the driver with one atomic compare-and-set: available → offered(this ride) => Right. Only one request can win, and the other moves to the next candidate.
- [ ] Let the driver pick one => The rider who loses has already been told a car is coming.
- [ ] Lock the whole city's driver list => Correct, but serialises every match in the city.
???
Do the claim in one authoritative store: a Redis Lua script, or a database row update like `UPDATE drivers SET state='offered', ride=? WHERE id=? AND state='available'`. If no row changed, try the next driver.
:::

::: choice state-machine
Mobile networks are flaky. A driver's "start trip" event arrives twice, and a stale "arrived" event arrives after it. How do you keep the trip state correct?
- [x] Model the trip as a state machine, and only allow transitions from the expected state, e.g. `UPDATE … SET status='started' WHERE status='arrived'` => Right. Duplicates and out-of-order events become no-ops.
- [ ] Apply events in the order they arrive => The stale "arrived" would move the trip backwards.
- [ ] Ignore all repeated events by message text => Retries are legitimate. You need them to be harmless, not ignored.
- [ ] Trust the driver app's local state => Apps crash and lose state.
???
Explicit states (requested → matched → arrived → started → completed or cancelled) with conditional transitions make every event idempotent and every state change auditable.
:::

::: choice live-tracking
How does the rider see their driver moving on the map during pickup?
- [ ] The rider app polls the geo index every 100 ms => Wasteful, and the geo index isn't meant to be queried per ride.
- [ ] The driver's phone sends updates straight to the rider's phone => Phones can't reach each other directly, and you'd lose control of privacy.
- [x] The driver's location updates are published to a channel for that ride, and the rider's connection subscribes to it => Right. Only the one rider who needs it gets the updates.
- [ ] The rider gets an SMS with the location => Far too slow.
???
Publish each location update to a pub/sub channel keyed by `rideId`. The rider's gateway subscribes for the duration of the ride, with polling as a fallback if the socket drops.
:::

## Wrap-up

::: choice region
A whole region's data centre has problems. How do you limit the damage?
- [ ] Run everything in one global cluster => One failure takes down every city.
- [ ] Shut the service down everywhere until it's fixed => Far too drastic.
- [x] Partition the whole stack by region, so each region runs on its own => Right. Rides are local, so an outage in one region doesn't touch the others.
- [ ] Store all locations in one big database => That's a global single point of failure.
???
Rides never cross regions, which makes region partitioning natural for both scale and fault isolation. Keep active trips' state replicated so drivers can finish trips during partial failures.
:::
