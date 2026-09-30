# How to Run a System Design Interview

```meta
category: product
summary: A repeatable 45-minute structure, so you never stare at a blank whiteboard.
minutes: 4
order: 1
```

System design interviews are open-ended on purpose. The interviewer wants to see how you **structure ambiguity**, **make tradeoffs** and **communicate**. A clean final diagram matters less. A fixed framework frees your attention for the actual problem.

### 1. Requirements (≈5 min)
Ask before you draw. Split them into:

- **Functional**: the 3–5 core features. "Users can shorten a URL; visiting the short URL redirects." Say explicitly what's *out of scope* (analytics, custom domains…).
- **Non-functional**: scale (daily active users, requests per second), latency targets, availability vs consistency, durability, and read/write ratio.

### 2. Estimation (≈5 min)
Only numbers that change decisions: peak QPS, storage per year, and whether the hot set fits in memory. Round aggressively. (See *Back-of-the-Envelope Estimation*.)

### 3. API (≈5 min)
Write the endpoints with inputs and outputs. The API pins down what the system actually does, and it often exposes missing requirements such as pagination or idempotency.

### 4. Data model (≈5 min)
Entities, key fields, and access patterns. Pick a store for each and say **why** ("key-value lookups by short code, no joins → a KV store").

### 5. High-level design (≈10 min)
Boxes and arrows: client → load balancer → services → cache / database / queue / blob storage / CDN. Walk the **read path** and the **write path** end to end.

### 6. Deep dives (≈10–15 min)
Pick the 2–3 hardest parts: the hot spot, the consistency problem, the fan-out. For each, present **options → tradeoffs → decision**. The interviewer will often steer you here, so follow their lead.

### 7. Wrap-up (≈3 min)
Bottlenecks, single points of failure, monitoring, and what you'd do next.

### Habits that score points
- **Think out loud.** Silence reads as being stuck.
- **State assumptions** ("I'll assume 100M DAU; tell me if that's off").
- **Name the tradeoff** every time you choose something.
- **Start simple, then scale.** A single server that works beats a distributed design that doesn't.

## Key takeaways
- Requirements first: functional, non-functional, and explicit non-goals.
- Estimate only what drives a decision.
- Walk the read and write paths end to end on your diagram.
- Every choice comes with a tradeoff. Say it out loud.

## Go deeper
- [The System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer)
