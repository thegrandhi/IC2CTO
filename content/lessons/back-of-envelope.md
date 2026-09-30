# Back-of-the-Envelope Estimation

```meta
category: theory
summary: Latency numbers, powers of two, and turning DAU into QPS and storage.
minutes: 5
order: 2
```

Estimation shows you can reason about scale, and it drives real decisions: *does this fit on one machine? in memory? do we need sharding?* Precision doesn't matter. Being within an order of magnitude does.

### Numbers worth memorizing
| Operation | Rough latency |
|---|---|
| L1 cache reference | 1 ns |
| Main memory reference | 100 ns |
| Read 1 MB sequentially from memory | 5–10 µs |
| SSD random read | 16–100 µs |
| Round trip within a datacenter | 0.5 ms |
| Read 1 MB sequentially from SSD | ~50 µs to 1 ms |
| Disk seek (HDD) | 5–10 ms |
| Round trip US ↔ Europe | ~100–150 ms |

Memory is about 100× faster than SSD, which is about 100× faster than a network hop across the world.

### Powers of two and ten
- 2¹⁰ ≈ 1 thousand (KB), 2²⁰ ≈ 1 million (MB), 2³⁰ ≈ 1 billion (GB), 2⁴⁰ ≈ 1 trillion (TB).
- **1 day ≈ 86,400 s ≈ 10⁵ s.** This one conversion does most of the work.

### From users to QPS
```
QPS (average) = DAU × actions per user per day / 86,400
Peak QPS      ≈ 2–3 × average   (more for spiky products)
```
Example: 100M DAU × 10 reads/day = 10⁹ reads/day ÷ 10⁵ s ≈ **10,000 read QPS**, with a peak of ~30,000.

### From writes to storage
```
Storage per year = writes/day × bytes per record × 365
```
Example: 10M new posts/day × 1 KB ≈ 10 GB/day ≈ **3.6 TB/year** before replication. With 3× replication, about 11 TB.

### Rules of thumb
- A single well-tuned relational database handles roughly **thousands to tens of thousands** of simple QPS.
- A single Redis node handles roughly **100k+** simple operations per second.
- A server has tens to hundreds of GB of RAM, so a hot set of 50 GB fits in one cache node, and a hot set of 5 TB does not.
- Media (images, video) dominates bandwidth and storage. Put it in blob storage behind a CDN.

## Key takeaways
- 1 day ≈ 10⁵ seconds; peak ≈ 2–3× average.
- Memory ≈ 100 ns, SSD ≈ 100 µs, datacenter round trip ≈ 0.5 ms, cross-continent ≈ 100+ ms.
- Estimate QPS, storage per year, and hot-set size, then let those numbers drive the design.

## Go deeper
- [Interactive latency numbers](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
