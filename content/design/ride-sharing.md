# Design a Ride-Sharing Service

```meta
difficulty: Hard
minutes: 45
tags: geospatial index, matching, real-time location, state machine
```

Design the core of Uber or Lyft: riders request a ride, nearby drivers get matched, both see each other's location in real time during the trip, and the trip is priced and paid at the end.

## Clarifying questions
- Scale: cities, concurrent drivers, rides per day?
- How often do drivers send location updates? (Every ~4 s.)
- Matching: nearest driver, or an optimized assignment? Surge pricing in scope?
- Payments in scope, or treated as a separate service?
- Ride types (pool, XL)?

## Requirements
**Functional**
- Drivers go online and stream their location.
- Riders see nearby cars, request a ride, and get matched to a driver who accepts.
- Live location during pickup and trip; trip state (requested → matched → arrived → in progress → completed/cancelled); fare calculation.

**Non-functional**
- Matching within seconds; location updates propagate in about 1–2 s.
- **No double-assignment** of a driver.
- Highly available: a regional outage shouldn't strand riders mid-trip.

## Estimation
- 5M active drivers at peak, updating every 4 s → **~1.25M location writes/s**. This is the dominant load.
- Rides: 20M/day ≈ 230 ride requests/s average, peaks of several thousand/s in busy hours.
- Location data is **ephemeral**: only the latest position matters for matching (history goes to cold storage for analytics).

## API
```
Driver (WebSocket or frequent POST):  location { lat, lng, heading, ts }, status { online | offline }
Rider:  POST /v1/rides { pickup, dropoff, type } → { rideId, status: "matching" }
        GET  /v1/rides/{id} (plus push/WebSocket updates)
Driver: POST /v1/rides/{id}/accept | /arrived | /start | /complete
        GET  /v1/nearby-drivers?lat&lng (rider map, coarse)
```

## Data model
- **Live driver locations**: in memory, e.g. Redis geo sets or a custom geo-index service keyed by **geohash/H3 cell**, partitioned by city/region. TTL removes drivers who go silent.
- **Driver state**: available / offered / on_trip (in memory + durable).
- **Rides**: relational DB (strong consistency for money and state transitions): id, rider, driver, status, pickup/dropoff, fare, timestamps.
- **Location history**: append to a stream (Kafka) → cold storage for ETA models and dispute resolution.

## High-level design
```
Drivers ─► Location gateways (WebSocket) ─► Location service ─► geo index (in-memory, sharded by region/cell)
                                                     └─► Kafka (history, ETA, analytics)
Riders ─► API ─► Ride service ─► Matching service ─► geo index query (nearby available drivers)
                     │                 └─► offer to driver (push) ─► accept (atomic claim)
                     └─► Rides DB (state machine) ─► Pricing / Payments (async on completion)
Trip updates: driver location ─► pub/sub on rideId ─► rider app
```

## Deep dives
**1. Geospatial index**
- Divide the map into cells (geohash, H3 hexagons, or S2). Each cell holds the IDs of available drivers. A nearby query checks the rider's cell plus its neighbours, then sorts candidates by **ETA** (road network), not straight-line distance.
- Keep it **in memory** and sharded by region: 1M+ updates/s would crush a disk-based index. A driver's update moves them between cells only when they cross a boundary.

**2. Matching and avoiding double-booking**
- Candidate drivers ranked by ETA → offer to one driver (or a few, sequentially) with a timeout.
- Claiming a driver must be **atomic**: a compare-and-set on the driver's state (`available → offered(rideId)`) in a single authoritative store (Redis with Lua, or a DB row with a conditional update). Only one ride can win.
- The batch-matching alternative: collect requests for a couple of seconds per area and solve an assignment problem, which gives better global efficiency.

**3. Trip state machine**
- Model ride states explicitly, and make transitions conditional updates (`UPDATE rides SET status='started' WHERE id=? AND status='arrived'`) with idempotent client retries. This guards against duplicated or out-of-order events from flaky mobile networks.

**4. Real-time updates to riders**
- The driver's location is published to a channel for the active `rideId`; the rider's connection gateway subscribes. Fall back to polling if the socket drops.

**5. Surge pricing (if asked)**
- A stream processor computes supply/demand per cell every minute → a multiplier stored per cell, used by quotes. The price is locked into the ride when the rider requests it.

**6. Regional isolation**
- Rides are local, so partition the whole stack by region/city. An outage in one region doesn't affect others. Keep a trip's state replicated so drivers can complete trips during partial failures.

## Wrap-up
- Bottleneck: location ingestion (partition by region, in-memory, and drop out-of-date updates).
- Consistency: strong for ride state and driver assignment; eventual for the map of nearby cars.
- Extensions: pooling (multi-rider routing), ETA prediction models, fraud detection, driver dispatch fairness.

## Rubric
- Clarified update frequency, scale, matching strategy and payment scope
- Identified location updates as the dominant write load and estimated it
- Used an in-memory geospatial index (geohash/H3/quadtree cells) partitioned by region
- Queried the cell plus neighbours and ranked candidates by ETA
- Prevented double-assignment with an atomic claim/compare-and-set on driver state
- Modelled the trip as a state machine with conditional, idempotent transitions
- Streamed live location to riders via pub/sub keyed by ride
- Kept rides/payments strongly consistent while the nearby-driver view is eventually consistent
- Partitioned by region for scale and fault isolation
