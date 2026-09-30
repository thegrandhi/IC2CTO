# Generating Unique IDs

```meta
category: databases
summary: Auto-increment, UUIDs, Snowflake IDs, and short codes, with their tradeoffs.
minutes: 3
order: 24
```

Nearly every design needs IDs: for posts, orders, short URLs, and messages. At scale, "just use auto-increment" stops being enough.

### Options
- **Database auto-increment**: simple and compact, but a single writer becomes a bottleneck and a single point of failure, and sharded databases collide unless each shard gets its own range or step.
- **UUID v4** (random, 128 bits): generated anywhere with no coordination and practically collision-free. But it's large, and random keys scatter B-tree inserts, which hurts index locality.
- **UUID v7 / ULID**: a timestamp prefix plus randomness, so IDs are **time-sortable**, which keeps B-tree inserts efficient while still needing no coordination.
- **Snowflake-style IDs** (64 bits): `timestamp | machine id | per-machine sequence`. Compact, roughly time-ordered, and generated locally at high rates. Watch out for clock skew and machine-ID assignment.
- **Ticket server / range allocation**: a central service hands out *blocks* of IDs (say 1,000 at a time) that each server uses locally. Cheap coordination, and the IDs stay compact.

### Short codes (URL shorteners)
Encode a numeric ID in **base62** (`[0-9a-zA-Z]`): 7 characters give 62⁷ ≈ 3.5 trillion codes.
- A counter or range allocation gives no collisions, but codes are predictable (enumerable). Scramble them with a reversible bijection if that matters.
- Hashing the long URL (then truncating) can collide. Detect collisions and retry with a salt.
- Random codes need a uniqueness check on insert (a unique index) and a retry on collision.

## Key takeaways
- Auto-increment doesn't scale across writers; UUIDs need no coordination but hurt index locality.
- Time-sortable IDs (UUIDv7, ULID, Snowflake) get the best of both.
- Short codes: base62 of a unique number; 7 characters ≈ 3.5 trillion values.

## Go deeper
- [RFC 9562: UUIDs (including v7)](https://www.rfc-editor.org/rfc/rfc9562)
