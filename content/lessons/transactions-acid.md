# Transactions and Isolation

```meta
category: databases
summary: ACID, isolation levels, and the anomalies each level prevents.
minutes: 5
order: 11
```

A **transaction** groups several reads and writes into one unit that either fully happens or doesn't happen at all.

### ACID
- **Atomicity**: all or nothing. A crash midway rolls everything back.
- **Consistency**: the database moves from one valid state to another (constraints, foreign keys, your own invariants).
- **Isolation**: concurrent transactions don't interfere, as if they ran one at a time, to a degree set by the **isolation level**.
- **Durability**: once committed, data survives crashes, thanks to the write-ahead log (WAL).

### Anomalies
- **Dirty read**: seeing another transaction's *uncommitted* changes.
- **Non-repeatable read**: reading the same row twice and getting different values, because someone committed in between.
- **Phantom read**: re-running a query returns *new rows* that another transaction inserted.
- **Lost update**: two transactions read-modify-write the same value and one overwrites the other (two clicks each add 1, but the counter only rises by 1).
- **Write skew**: two transactions read the same data, make decisions, and write *different* rows, breaking an invariant together. Example: two doctors both go off call because each saw the other still on call.

### Isolation levels (weakest → strongest)
| Level | Prevents |
|---|---|
| Read uncommitted | (almost nothing) |
| Read committed | dirty reads (the PostgreSQL default) |
| Repeatable read / snapshot | + non-repeatable reads (the MySQL InnoDB default) |
| Serializable | + phantoms, write skew: behaves like one-at-a-time |

Stronger isolation costs throughput: more locking, or more aborted transactions that must be retried.

### Practical tools
- **Atomic updates**: `UPDATE accounts SET balance = balance - 10 WHERE id = ? AND balance >= 10`. There's no read-modify-write race at all.
- **Row locks**: `SELECT … FOR UPDATE` before modifying.
- **Optimistic concurrency**: a `version` column; update `WHERE version = ?` and retry if 0 rows changed.
- **Constraints** (unique indexes) as a last line of defence, for example against double-booking.

### Across services
Distributed transactions (**two-phase commit**) are slow and fragile. Microservices usually use **sagas**: a sequence of local transactions with compensating actions ("refund the payment if booking fails"), often driven by events.

## Key takeaways
- ACID means all-or-nothing, valid states, isolation from others, and durability.
- Know the anomalies: dirty read, non-repeatable read, phantom, lost update, write skew.
- Prefer atomic conditional updates or optimistic versioning over read-modify-write.
- Across services, use sagas with compensations rather than 2PC.

## Go deeper
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
