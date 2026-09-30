# Content Delivery Networks

```meta
category: infrastructure
summary: Serving static and media content from the edge, close to users.
minutes: 3
order: 5
```

A **CDN** is a globally distributed set of edge servers that cache content close to users. A user in Tokyo gets an image from a Tokyo edge instead of your origin in Virginia. That's lower latency for the user and far less load and bandwidth on your origin.

### What goes on a CDN
- Static assets: JavaScript, CSS, fonts, images.
- Media: video segments (HLS/DASH), audio, downloads.
- Increasingly, cacheable API responses and even edge compute, with small functions running at the edge.

### Pull vs push
- **Pull (origin pull)**: on a cache miss, the edge fetches from your origin and caches the result. This is the most common model and needs no upload step.
- **Push**: you upload content to the CDN ahead of time. This is useful for large files, or content you know will be hot, such as a new release.

### Controlling freshness
- `Cache-Control` headers (`max-age`, `s-maxage`, `stale-while-revalidate`) tell edges how long to keep content.
- **Content-hashed filenames** (`app.3f9c2.js`) let you cache "forever" (`immutable`). A new deploy gets a new URL, so invalidation is never needed.
- **Purges** force edges to drop content early. They're slower and cost more, so design so you rarely need them.

### Private content
Signed URLs or signed cookies let a CDN serve private media (a paid video, a user's photo) without exposing it publicly. The origin signs a short-lived URL; the edge verifies the signature.

### Interview tip
Whenever a design serves images or video, say "media goes to blob storage and is served through a CDN". It takes the heaviest bandwidth off your application servers entirely.

## Key takeaways
- CDNs cut latency and origin load by caching at the edge.
- Use content-hashed filenames plus long cache lifetimes for static assets.
- Media belongs in blob storage behind a CDN, with signed URLs for private content.

## Go deeper
- [What is a CDN? (Cloudflare)](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [HTTP caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
