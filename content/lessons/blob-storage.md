# Blob Storage and Media Uploads

```meta
category: infrastructure
summary: Object storage for files, presigned uploads, multipart, and processing pipelines.
minutes: 4
order: 22
```

Images, videos, documents and backups don't belong in your database. Put them in **object (blob) storage** (S3, GCS, Azure Blob): it's cheap, extremely durable (replicated across devices and zones), and effectively unlimited. Store only the **object key and metadata** in your database.

### Uploading without choking your servers
Streaming a 2 GB video *through* your application servers wastes their bandwidth and memory. Instead:
1. The client asks your API for an upload URL.
2. The API returns a **presigned URL**: a short-lived, signed URL that allows exactly one PUT to one key.
3. The client uploads **directly to blob storage**.
4. Storage emits an event, or the client calls back, and your system records the upload and starts processing.

For large files, use **multipart uploads**: the file is split into chunks uploaded in parallel, a failed chunk is retried on its own, and uploads can resume after a disconnect.

### Processing pipeline
Upload events go onto a **queue**. Workers then:
- generate thumbnails and multiple resolutions,
- transcode video into adaptive-bitrate segments (HLS/DASH) at several qualities,
- scan for malware and moderate content,
- extract metadata.

Workers write their outputs back to blob storage, and a CDN serves them.

### Downloads
Serve through a **CDN**. For private content, use **signed URLs** or cookies with short expiry.

### Deduplication and cost
- **Content hashing** (for example SHA-256 of the chunks) lets you store identical files or chunks once. Dropbox-style sync relies on this.
- **Storage classes / lifecycle rules** move cold data to cheaper tiers automatically.

## Key takeaways
- Files go to blob storage; the database stores keys and metadata.
- Presigned URLs let clients upload directly; multipart makes big uploads parallel and resumable.
- Process media asynchronously with queue-driven workers, and serve it through a CDN.

## Go deeper
- [Amazon S3 user guide: uploading objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html)
