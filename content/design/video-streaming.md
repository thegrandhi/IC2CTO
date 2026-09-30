# Design a Video Streaming Platform

```meta
difficulty: Hard
minutes: 45
tags: blob storage, transcoding, cdn, adaptive bitrate
```

Design a platform like YouTube. Creators upload videos, which become available to watch on any device and network speed, worldwide. Include video metadata (titles, views, likes) and basic search. Recommendations are out of scope unless time allows.

## Clarifying questions
- Scale: DAU, uploads per day, average video length and size?
- Supported devices and resolutions (up to 4K)?
- Live streaming, or only uploaded video on demand?
- How quickly must an upload be watchable? Minutes?
- Any monetization or copyright checks in scope?

## Requirements
**Functional**
- Upload videos (resumable); process them into streamable formats; watch with adaptive quality; view counts, likes, comments; search by title.

**Non-functional**
- Smooth playback: fast start (< 2 s), minimal buffering, adapting to bandwidth.
- Massive read (streaming) bandwidth; global reach.
- Durable storage of originals; highly available playback.

## Estimation
- 1B DAU watching 30 min/day. At ~2 Mbps average that's ~450 MB per user per day → **~450 PB/day** of egress. This makes the case for a CDN on its own.
- 500 hours of video uploaded per minute ≈ 720k hours/day. At ~1 GB per hour per rendition set, that's **petabytes per day** of new storage (multiple renditions).
- Metadata reads (page loads) are ~tens of thousands to hundreds of thousands per second, a normal web-scale workload.

## API
```
POST /v1/uploads            → { uploadId, presigned multipart URLs }
POST /v1/uploads/{id}/complete  { title, description, tags }
GET  /v1/videos/{id}        → metadata + manifest URL (HLS/DASH)
GET  /v1/videos/{id}/manifest.m3u8   (served via CDN)
POST /v1/videos/{id}/views  (batched from client) / likes / comments
GET  /v1/search?q=...
```

## Data model
- `videos`: id, owner, title, description, status (uploading / processing / ready / failed), duration, renditions, created_at. A relational or document store, sharded by id.
- **Originals and renditions** in blob storage: `/videos/{id}/original`, `/videos/{id}/{1080p,720p,…}/segment-00042.ts` + manifests.
- `view_counts`: sharded counters, aggregated asynchronously.
- Comments: a separate store partitioned by video_id, paginated by cursor.
- Search index (for example Elasticsearch) fed from video metadata changes.

## High-level design
```
Upload: Client ─► presigned multipart ─► Blob storage (original)
                       │ upload complete event
                       ▼
              Processing queue ─► Transcode workers (split into chunks, parallel)
                       │           ├─ renditions: 240p … 4K, codecs (H.264/VP9/AV1)
                       │           ├─ segments (2–6 s) + HLS/DASH manifests, thumbnails
                       │           └─ content checks
                       ▼
              Blob storage (renditions) ─► status=ready ─► notify creator/subscribers

Watch:  Client ─► API (metadata) ─► manifest URL ─► CDN edge ─► (miss) ─► origin blob storage
        player switches renditions per segment based on measured bandwidth (ABR)
```

## Deep dives
**1. Transcoding pipeline**
- Split the original into chunks (GOP-aligned) and transcode the chunks **in parallel** across many workers (a DAG: split → transcode per rendition → merge/package → thumbnails). A 2-hour video is ready in minutes.
- Idempotent tasks with retries; progress is tracked per video; the queue absorbs upload bursts.
- Codec choice trades CPU (AV1 is expensive) against bandwidth savings. Popular videos get the more efficient codecs.

**2. Adaptive bitrate streaming**
- Each rendition is cut into short segments listed in a manifest (HLS `.m3u8` or DASH `.mpd`). The player measures throughput and buffer health and picks the quality **per segment**, so it adapts to changing networks without stalling.

**3. CDN strategy**
- Nearly all bytes are served from CDN edges. Popular videos stay cached at the edge; long-tail content is fetched from the origin (or regional mid-tier caches) on a miss.
- Pre-warm the edges for anticipated hits (a big creator's premiere). Use signed URLs for private or paid content.

**4. View counts and metadata scale**
- Views are write-heavy and approximate: batch from clients, aggregate in a stream processor, and write sharded counters. Deduplicate obvious bots.
- Metadata is cached heavily; the watch page is mostly cacheable.

**5. Resumable uploads**
- Multipart uploads with per-part retries; the client can resume after a disconnect using the uploadId.

## Wrap-up
- Cost is dominated by egress and storage: CDN caching efficiency, codec efficiency, and tiering cold renditions to cheaper storage (or deleting unwatched high resolutions).
- Failure: transcoding failures retry per chunk; playback survives origin issues while the edges have the content cached.
- Extensions: live streaming (low-latency HLS, ingest via RTMP/SRT), recommendations, copyright fingerprinting.

## Rubric
- Clarified scale, devices/resolutions, VOD vs live, and processing latency
- Estimated egress bandwidth and storage, and concluded a CDN is essential
- Used presigned, resumable multipart uploads directly to blob storage
- Designed an asynchronous, parallel (chunked) transcoding pipeline driven by a queue
- Produced multiple renditions and segments with HLS/DASH manifests for adaptive bitrate
- Served video through a CDN with origin fallback, and signed URLs for private content
- Stored metadata separately from media, with caching and a search index
- Handled view counts via batching/aggregation and sharded counters
- Discussed cost levers (codecs, storage tiering) and failure handling
