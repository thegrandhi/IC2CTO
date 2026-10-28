## Requirements

::: ask clarify
File sync hides a lot of decisions. What do you want to know?
- [key] How large can files get? => Up to several gigabytes. Most are small, but videos and disk images are common.
- [key] Is this file-level sync, or real-time co-editing like Google Docs? => File-level sync. Co-editing is a different product.
- [key] Can users edit offline, and what happens when two devices edit the same file? => Yes, offline edits must sync later. If two edits conflict, don't lose either one.
- [key] Can users share folders with other people? => Yes, with view or edit permission.
- [ok] What's the scale? => About 500 million users, 100 million active daily, each changing around 20 files a day.
- [ok] How long do we keep old versions? => 30 days of version history.
- [weak] What colour is the sync icon? => Not a backend question.
- [weak] Which operating systems do we support first? => All of them eventually. It doesn't change the backend.
???
File size forces chunking. File-level sync (not co-editing) keeps conflict handling simple. Offline edits and conflicts define the sync protocol, and sharing adds namespaces and permissions.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Uploading and downloading files and folders => Core.
- [x] Syncing changes to a user's other devices => The point of the product.
- [x] Detecting conflicting edits => The interviewer asked for it.
- [x] Sharing folders with permissions => Asked for.
- [ ] Real-time collaborative editing inside documents => A different system (operational transforms or CRDTs).
- [ ] Previews and thumbnails for every file type => A nice extension.
- [ ] Full-text search inside documents => A separate indexing system.
???
Storage, sync, conflicts and sharing are the system. Co-editing, previews and search can be mentioned as extensions.
:::

::: choice priority
Which requirement matters most?
- [ ] The lowest possible sync latency => Seconds is fine. Nobody expects a file to appear on another device in milliseconds.
- [ ] Minimising server cost at any price => Cost matters, but not more than keeping files.
- [ ] Strong consistency between all devices at every instant => Devices may lag briefly. They just must converge.
- [x] Durability: never lose a file => Right. Losing someone's files is the one unforgivable failure.
???
Durability first, then efficiency (don't re-upload whole files, dedupe identical content), then sync speed in seconds.
:::

## Estimation

::: choice change-rate
100 million daily users each change about 20 files. Roughly how many file changes per second?
- [ ] About 2,300 => 10× too low.
- [ ] About 230,000 => 10× too high.
- [ ] About 2 billion => That's the daily total.
- [x] About 23,000 => Right. 2 billion a day ÷ ~86,400 seconds ≈ 23k changes a second.
???
100M × 20 = 2B changes a day ≈ 23,000/s. Each one is a metadata commit plus some block uploads, so the metadata store needs to handle tens of thousands of writes a second.
:::

::: choice storage
500 million users store about 10 GB each on average. Roughly how much data is that before deduplication?
- [ ] About 5 terabytes => Off by a factor of a million.
- [ ] About 5 petabytes => Still 1,000× too low.
- [x] About 5 exabytes => Right. 500M × 10 GB = 5 × 10⁹ GB = 5 EB. Deduplication and compression cut that down a lot.
- [ ] About 5 zettabytes => 1,000× too high.
???
500M × 10 GB = 5 billion GB = 5 EB. At that size, deduplication, compression and erasure coding (instead of three full copies) are worth real money.
:::

## API

::: choice upload
A user edits 1 MB in the middle of a 2 GB file. How does the client upload the change?
- [ ] Upload the whole 2 GB file again => Wastes bandwidth and time for a tiny change.
- [x] Split files into chunks identified by their hash, ask the server which hashes it's missing, and upload only those => Right. Only the changed chunks travel.
- [ ] Upload a diff of the bytes that changed => Diffs depend on the server having the exact old version, and they're hard to resume or dedupe.
- [ ] Email the file to the server => Not an API.
???
`POST /blocks/check {hashes}` → missing hashes; `PUT /blocks/{hash}` for each one; then `POST /files/commit {path, parentRev, blocks}`. Interrupted uploads simply resume: blocks are idempotent.
:::

## Data model

::: choice split-storage
Where do file contents and file metadata live?
- [ ] Both in one relational database => Exabytes of file contents don't belong in a database.
- [ ] Both in blob storage => Metadata needs transactions and fast lookups, which blob storage can't give you.
- [x] Content as immutable chunks in blob storage, keyed by hash. Metadata (paths, revisions, chunk lists) in a sharded, strongly consistent database => Right. Each store does what it's good at.
- [ ] Metadata on each client only => Then the server can't tell devices what changed.
???
Blocks are immutable and content-addressed, so they're easy to cache, replicate and dedupe. Metadata is small but must be consistent: `files`, `revisions` (with block lists), `namespaces` and ACLs, sharded by namespace.
:::

## High-level design

::: path upload-path
Build the path of saving an edited file, from the user's device until other devices can see it.
1. Client chunker
2. Block service
3. Blob storage
4. Metadata service
5. Change journal
- extra: CDN => It speeds up downloads, but uploads go to blob storage.
- extra: Search index => Not part of syncing a file.
- extra: Email service => Nobody needs an email for every save.
???
Upload missing blocks **first**, then commit the metadata, which appends an entry to the namespace's change journal. A revision can then never point at a block that isn't stored yet.
:::

::: path sync-path
Now another device picks up the change. Build its path.
1. Notification service
2. Other device
3. Change journal
4. Blob storage
- extra: Client chunker => Chunking happens on the device that made the edit.
- extra: Block service upload API => Downloads read blocks, they don't upload them.
- extra: Search index => Not part of sync.
???
The notification is only a hint ("namespace X changed"). The device reads the journal from its saved cursor, sees which blocks the new revision needs, downloads only the ones it doesn't have, and reassembles the file.
:::

## Deep dives

::: choice chunking
You split files into fixed 4 MB chunks. A user inserts one byte at the start of a large file. What happens, and what's better?
- [ ] Nothing changes: only the first chunk is new => Every byte after the insert shifts, so every chunk boundary moves and every chunk's hash changes.
- [x] Every chunk changes. Content-defined chunking fixes it by placing boundaries where the content matches a pattern => Right. Boundaries move with the content, so only the chunks around the edit change.
- [ ] Use bigger chunks => The shift still changes every chunk.
- [ ] Use smaller chunks => Same problem, just more chunks to re-upload.
???
Content-defined chunking (a rolling hash, like Rabin fingerprints) cuts where the content says, not at fixed offsets. An insert only changes the chunk or two around it.
:::

::: choice conflict
A laptop edits a file offline. Meanwhile the phone saves a different edit to the same file. The laptop comes back online. What happens?
- [ ] The laptop's version overwrites the phone's => You silently lose the phone's edit.
- [ ] The server merges the two files line by line => File-level sync can't merge arbitrary files like images or spreadsheets.
- [ ] The laptop's edit is rejected and thrown away => You lose the laptop's edit instead.
- [x] The commit names the revision it was based on. The server sees it's stale, and the client keeps both, saving a "conflicted copy" => Right. Nothing is lost, and the user decides.
???
Every commit carries `parentRev`. If the server's latest revision is different, it returns 409 Conflict, and the client saves its version as "report (conflicted copy from laptop)".
:::

::: choice missed-notification
A device misses a push notification while its connection drops. Does it miss the change?
- [ ] Yes, until the user edits the file again => That would be a sync bug.
- [x] No: notifications are only hints. The device reads the journal from its cursor when it reconnects, so it catches every change => Right. The journal is the source of truth.
- [ ] Yes, so the server must retry notifications forever => Unnecessary once the journal handles it.
- [ ] No, because the server sends every file again on reconnect => Far too much data.
???
Design so that losing a notification costs a little delay, never data. Clients also poll the journal occasionally as a safety net.
:::

::: choice gc
A user deletes a 2 GB video. Its chunks are shared with another user's identical copy. When can you delete the chunks from blob storage?
- [ ] Immediately, when the file is deleted => The other user's copy still references the same chunks.
- [ ] Never: storage is cheap => At exabyte scale, garbage adds up to real money.
- [x] Only when no file revision references them any more, after the version-history window has passed => Right. Garbage-collect unreferenced blocks in the background.
- [ ] After 24 hours => Time alone doesn't tell you whether another file still uses the chunk.
???
Content-addressed storage needs reference tracking (or a periodic mark-and-sweep). Wait out the 30-day version history before collecting, so restores still work.
:::

## Wrap-up

::: choice bottleneck
What's the hardest part to scale?
- [ ] Blob storage => It's designed for exabytes and scales out easily.
- [x] The metadata database: tens of thousands of commits a second, each needing strong consistency => Right. Shard by namespace so each user's or shared folder's commits stay on one shard.
- [ ] The CDN => It's built for this.
- [ ] The client chunker => It runs on users' devices.
???
Metadata is small but transactional and constantly written. Shard by namespace, keep commits short, and watch notification fan-out for very widely shared folders.
:::
