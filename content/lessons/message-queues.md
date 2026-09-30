# Message Queues and Event Streams

```meta
category: infrastructure
summary: Decoupling services with queues and logs; delivery guarantees and idempotent consumers.
minutes: 5
order: 12
```

A **queue** lets a producer hand off work without waiting for it to finish. It's the standard tool for **decoupling** services, **smoothing traffic spikes**, and making slow work (emails, video encoding, fan-out) **asynchronous**.

### Two flavours
- **Message queues** (RabbitMQ, SQS): each message goes to one consumer, which acknowledges it; acknowledged messages are deleted. Ideal for **task distribution** (a pool of workers encoding videos).
- **Logs / event streams** (Kafka, Kinesis, Pulsar): messages are appended to a **partitioned, retained log**. Consumers track their own offset, several independent consumer groups can each read everything, and you can **replay** history. Ideal for event-driven architectures, analytics pipelines and change data capture.

### Ordering
Kafka guarantees order **within a partition**. Choose the partition key so that events needing order share a key: all events for `order_id=42` go to the same partition. There's no global ordering across partitions.

### Delivery guarantees
- **At-most-once**: acknowledge before processing. A crash loses the message.
- **At-least-once**: acknowledge after processing. A crash causes a **redelivery**, so duplicates happen. This is the usual default.
- **Exactly-once** is achievable only within narrow boundaries (Kafka transactions). End to end, you get it from at-least-once delivery plus **idempotent consumers**.

### Idempotent consumers
Design handlers so that processing the same message twice has the same effect as processing it once:
- Keep a table of processed message IDs (with a unique constraint).
- Use natural idempotency: "set status to shipped" rather than "increment count".
- Use conditional writes with version numbers.

### Operational patterns
- **Dead-letter queue (DLQ)**: after N failed attempts, park the message for inspection instead of retrying forever.
- **Backpressure**: when consumers fall behind, the queue grows, but the producers stay fast. Monitor **consumer lag** and autoscale the workers.
- **Transactional outbox**: to update the database *and* publish an event reliably, write the event into an outbox table in the same database transaction; a relay then publishes it. This avoids the "saved but never published" gap.

## Key takeaways
- Queues decouple services, absorb spikes, and make slow work asynchronous.
- Task queues delete on acknowledgement; logs (Kafka) retain and replay, with ordering per partition.
- At-least-once delivery plus idempotent consumers is the practical path to "exactly once".
- Use DLQs, monitor lag, and use the outbox pattern for reliable publishing.

## Go deeper
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
