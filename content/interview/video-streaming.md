## Requirements

::: ask clarify
Video platforms are huge. What do you want to clarify first?
- [key] What scale: daily viewers and watch time, plus uploads per day? => About a billion daily viewers watching 30 minutes each, and around 500 hours of video uploaded every minute.
- [key] Which devices and qualities do we support? => Phones to TVs, from 240p up to 4K, on networks from 3G to fibre.
- [key] Only uploaded videos, or live streaming too? => Uploaded videos only. Live is a different system.
- [key] How quickly must an upload be watchable? => Within a few minutes, even for long videos.
- [ok] Are comments and likes in scope? => Yes, but keep them simple.
- [weak] What should the video player's buttons look like? => A client concern.
- [weak] Should we support video filters for creators? => Out of scope.
???
Scale tells you bandwidth is the defining cost. Devices and networks mean multiple renditions and adaptive streaming. On-demand only keeps it to one pipeline, and the processing deadline means parallel transcoding.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Uploading videos, resumable for big files => Core.
- [x] Processing uploads into formats any device can play => Core.
- [x] Smooth playback that adapts to the viewer's connection => Core.
- [x] Video metadata: titles, view counts, likes and basic search => Asked for.
- [ ] Recommendations => Out of scope unless there's time.
- [ ] Live streaming => The interviewer ruled it out.
- [ ] Ads and creator payouts => A separate system.
???
Upload, process, play, plus the metadata around it. Recommendations, live and monetisation are separate systems.
:::

::: choice priority
What's the most important non-functional requirement?
- [ ] Every view count exactly right in real time => Approximate counts a few seconds behind are fine.
- [x] Fast-starting, smooth playback worldwide, at a sustainable bandwidth cost => Right. Viewers leave if a video buffers, and bandwidth is the biggest bill.
- [ ] Uploads finishing in under a second => Uploads take as long as the network allows. Processing should take minutes.
- [ ] Strong consistency for comments => Comments can be eventually consistent.
???
Playback quality and egress cost drive the architecture: CDNs, adaptive bitrate and efficient codecs.
:::

## Estimation

::: choice egress
A billion viewers watch 30 minutes a day at about 2 Mbps. That's roughly 450 MB per viewer. How much data goes out per day?
- [ ] About 450 terabytes => 1,000× too low.
- [x] About 450 petabytes => Right. 10⁹ × 450 MB = 450 PB a day. No single data centre can serve that. You need a CDN.
- [ ] About 450 gigabytes => A million times too low.
- [ ] About 450 exabytes => 1,000× too high.
???
2 Mbps × 1,800 s = 3,600 Mb ≈ 450 MB per viewer. × 1B ≈ 450 PB a day. Bandwidth, not storage or compute, is the defining number.
:::

::: choice uploads
500 hours of video are uploaded every minute. How many hours a day is that?
- [ ] About 72,000 => 10× too low.
- [x] About 720,000 => Right. 500 × 1,440 minutes ≈ 720k hours a day, which becomes petabytes of new storage across all the renditions.
- [ ] About 7.2 million => 10× too high.
- [ ] About 500 => That's per minute.
???
500 × 60 × 24 = 720,000 hours a day. Each hour is stored as many renditions (240p to 4K, several codecs), so new storage is in the petabytes per day.
:::

## API

::: choice upload
A creator uploads a 20 GB video from a laptop on hotel Wi-Fi. How should the upload work?
- [ ] One big POST to your API servers => One dropped connection restarts all 20 GB, and your API servers carry the bytes.
- [x] Presigned multipart uploads straight to blob storage, with retries per part and resume after a disconnect => Right. Parts upload in parallel, failures retry only one part, and your servers never touch the bytes.
- [ ] Email the file => Not an option for 20 GB.
- [ ] Stream it through a WebSocket to the API => Still routes huge bytes through your app servers.
???
`POST /uploads` returns presigned part URLs. The client uploads parts directly to blob storage, then calls `/complete` with title and description, which kicks off processing.
:::

## Data model

::: choice media-vs-meta
Where do videos and their metadata live?
- [ ] Videos and metadata both in a relational database => Video files are huge blobs. Databases aren't built to stream petabytes.
- [x] Video files (originals, renditions, segments) in blob storage. Metadata (title, status, renditions) in a database, with a search index beside it => Right. Each store does what it's good at.
- [ ] Everything in the CDN => A CDN is a cache, not durable storage.
- [ ] Metadata inside the video file => You can't search or update it efficiently.
???
`videos(id, owner, title, status, duration, renditions…)` in a sharded database. Files at `/videos/{id}/{quality}/segment-N.ts` with manifests. A search index is fed from metadata changes.
:::

## High-level design

::: path processing-path
Build the path of an uploaded video until it's ready to watch.
1. Creator's client
2. Blob storage (original)
3. Processing queue
4. Transcode workers
5. Blob storage (renditions)
6. Metadata DB marks it ready
- extra: CDN => It serves finished videos to viewers, after processing.
- extra: Search index => Updated from metadata, not part of transcoding.
- extra: Viewer's player => Viewers come after the video is ready.
???
The upload-complete event goes onto a queue. Workers split the video into chunks, transcode them in parallel into every rendition, package segments and manifests, and store them. Then the video's status flips to ready.
:::

::: path watch-path
Now build the path of a viewer pressing play, for the video bytes.
1. Viewer's player
2. Manifest from the API
3. CDN edge
4. Regional cache (optional)
5. Origin blob storage
- extra: Transcode workers => They finished long ago. Playback reads stored segments.
- extra: Processing queue => Only for new uploads.
- extra: Metadata database => The API reads it to return the manifest URL, but the video bytes never come from it.
???
The player gets the manifest URL from the API, then fetches segments from the nearest CDN edge. On a miss, the edge pulls from a regional cache or the origin. Nearly all bytes come from edges.
:::

## Deep dives

::: choice transcode
A creator uploads a 2-hour 4K video. Transcoding it start to finish on one machine takes hours. How do you get it ready in minutes?
- [ ] Use a bigger machine => It helps a little, but one machine is still far too slow.
- [ ] Skip transcoding and serve the original => Most phones can't play a 4K original on mobile data.
- [ ] Only produce one quality => Viewers on slow networks would buffer constantly.
- [x] Split it into chunks and transcode them in parallel across many workers, then stitch the results => Right. A 2-hour video becomes hundreds of small jobs that run at once.
???
Model processing as a DAG: split → transcode each chunk into each rendition → package segments and manifests → thumbnails and checks. Tasks are idempotent and retry per chunk.
:::

::: choice abr
A viewer's connection drops from fibre speed to a weak 4G signal mid-video. How does playback avoid freezing?
- [ ] The server notices and sends a lower quality => The server can't see the viewer's network well. The player can.
- [x] The video is cut into short segments in several qualities, and the player picks the quality for each segment based on measured bandwidth => Right. That's adaptive bitrate streaming (HLS or DASH).
- [ ] The viewer picks a lower quality manually => A fallback, but most viewers never touch it.
- [ ] Buffer the whole video first => Slow to start and wasteful if they stop watching.
???
Each rendition is split into 2–6 second segments listed in a manifest. The player measures throughput and buffer health and switches quality segment by segment.
:::

::: choice cdn
A hugely popular creator premieres a video in an hour. Millions will press play at once. What do you do?
- [x] Pre-warm the CDN edges with the video's segments before the premiere => Right. The first viewers in each region hit a warm cache instead of all missing to the origin at once.
- [ ] Nothing: the CDN caches it after the first request => Millions of simultaneous misses would stampede the origin.
- [ ] Serve the premiere from your own servers => Far too much bandwidth.
- [ ] Limit how many people can watch => You'd be throttling your best moment.
???
For predictable spikes, push content to the edges ahead of time. Use request coalescing at the edges so a miss only fetches each segment from the origin once.
:::

::: choice views
Popular videos get thousands of views a second. How do you count them?
- [ ] Increment one database row on every view => Thousands of writes a second to one row is a hot spot.
- [ ] Don't count views => Creators and ranking depend on them.
- [x] Batch view events from players, aggregate them in a stream processor, and update sharded counters => Right. Counts arrive a few seconds late but scale indefinitely.
- [ ] Count views by parsing CDN logs once a month => Far too slow to show a count.
???
Views are high-volume and only need to be approximately right in real time. Batch on the client, aggregate in a stream, write sharded counters, and filter out obvious bots.
:::

## Wrap-up

::: choice cost
What's the biggest cost lever for this platform?
- [ ] The metadata database => Small compared to the media.
- [ ] Transcoding CPU for new uploads => Real, but much smaller than delivery.
- [x] Bandwidth and storage: CDN cache efficiency, efficient codecs for popular videos, and cheaper storage tiers for rarely watched ones => Right. Egress dominates the bill.
- [ ] The comment system => A tiny workload in comparison.
???
Spend expensive encoding (like AV1) on popular videos, where bandwidth savings repay the CPU. Move rarely watched renditions to cold storage, or drop high resolutions nobody watches.
:::
