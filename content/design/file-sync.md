# Design a File Sync Service

```meta
difficulty: Hard
minutes: 45
tags: chunking, deduplication, metadata, sync protocol, conflicts
```

Design Dropbox/Google Drive: users store files in the cloud, and edits on one device appear on their other devices. Files can be large (GBs), and users can share folders with others.

## Clarifying questions
- Max file size? Total storage per user?
- Real-time collaborative editing (like Google Docs), or file-level sync?
- Offline edits? How should conflicting edits be handled?
- Sharing and permissions model? Version history retention?
- Scale: users, files, daily changes?

## Requirements
**Functional**
- Upload/download files and folders; sync changes across devices; version history; share folders with permissions.
- Work offline, then sync; detect conflicts.

**Non-functional**
- **Durability** above all: never lose a file.
- Efficient: don't re-upload a whole 2 GB file when 1 MB changes; dedupe identical content.
- Sync latency of seconds; scales to billions of files.

## Estimation
- 500M users, 100M daily active; each changes ~20 files/day → 2B file changes/day ≈ **23k/s**.
- Storage: 500M × ~10 GB average ≈ **5 EB** logical. Deduplication and compression reduce it substantially.
- Metadata: tens of billions of file and version records → a sharded metadata store.

## API
```
GET  /v1/changes?cursor=<c>        → { entries: [ {path, fileId, rev, blocks[] | deleted} ], cursor, hasMore }
     (long-poll or push notification that changes exist)
POST /v1/blocks/check  { hashes[] } → { missing[] }
PUT  /v1/blocks/{hash}              (upload a chunk, presigned to blob storage)
POST /v1/files/commit  { path, parentRev, blocks[] } → { rev } | 409 conflict
GET  /v1/blocks/{hash}              (download, via CDN)
POST /v1/shares { folderId, userId, role }
```

## Data model
- **Blocks**: files are split into chunks (~4 MB, or content-defined chunking) identified by **SHA-256**. Blob storage keyed by hash, stored **once** globally (with care for encryption and privacy).
- **Metadata DB** (sharded by namespace/user): `files(file_id, namespace_id, path, latest_rev)`, `revisions(file_id, rev, block_hashes[], size, modified_by, ts)`, `namespaces` (a user's root or a shared folder), `acl`.
- **Journal per namespace**: an append-only, ordered list of changes (`seq`) that clients read from their cursor. This is the heart of sync.

## High-level design
```
Client (watcher + local DB of synced state + chunker)
   │ 1. detect change → chunk + hash
   │ 2. POST blocks/check → upload only missing blocks ─► Block service ─► Blob storage (+CDN for reads)
   │ 3. commit(parentRev, block list) ─► Metadata service ─► Metadata DB + namespace journal
   ▼
Notification service (long-poll/WebSocket) ─► other devices: "namespace X changed"
   └─► they call /changes?cursor → download missing blocks → reassemble file
```

## Deep dives
**1. Chunking and deduplication**
- Fixed-size chunks are simple, but inserting a byte shifts every later chunk. **Content-defined chunking** (rolling hash boundaries) keeps most chunks identical after local edits, so only the changed chunks upload.
- Hash-based dedupe skips uploading blocks the server already has, saving bandwidth and storage across versions and users.

**2. Sync protocol**
- Each namespace has a monotonically increasing journal. Clients store a **cursor** and fetch changes since it; commits append to the journal atomically with the metadata update.
- Notifications are just a hint ("something changed"). The journal is the source of truth, so missed notifications don't lose data.

**3. Conflicts**
- A commit includes the `parentRev` it was based on. If the server's latest revision differs, the commit is rejected with a **conflict**: keep both, saving the loser as "file (conflicted copy from laptop)". File-level sync doesn't auto-merge. Real-time co-editing needs OT/CRDTs, which is a different system.

**4. Durability and consistency**
- Metadata needs strong consistency per namespace (serializable commits); blocks are immutable and content-addressed, so they're trivially cacheable and replicated (erasure coding across zones).
- Commit order: upload blocks **first**, then commit metadata, so a revision never references a missing block. Garbage-collect unreferenced blocks later.

**5. Sharing and permissions**
- Shared folders are separate namespaces mounted into several users' trees; ACLs are checked on every metadata and block request; block downloads use short-lived signed URLs.

## Wrap-up
- Bottlenecks: metadata DB write throughput (shard by namespace), notification fan-out for widely shared folders.
- Failure: interrupted uploads resume (blocks are idempotent); a lost notification is recovered on the next journal poll.
- Extensions: LAN sync between devices, selective sync, trash and retention policies, encryption with user-managed keys.

## Rubric
- Clarified file sizes, offline edits, conflict handling, sharing and version history
- Split files into chunks identified by content hash, and uploaded only missing chunks
- Mentioned content-defined chunking or otherwise addressed shifting edits
- Separated immutable block storage from strongly consistent metadata
- Designed a per-namespace change journal with client cursors (notifications as hints)
- Detected conflicts via parent revision and created conflicted copies
- Ordered operations for durability (blocks before metadata commit) plus garbage collection
- Handled sharing via namespaces/ACLs and signed download URLs
- Estimated storage/metadata scale and discussed dedupe savings
