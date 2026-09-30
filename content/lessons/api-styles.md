# API Styles: REST, gRPC, GraphQL

```meta
category: apis
summary: Choosing an API style and designing resources, versions and errors.
minutes: 4
order: 13
```

### REST
Resources are named with nouns (`/users/42/orders`) and manipulated with HTTP verbs:

| Verb | Meaning | Idempotent? |
|---|---|---|
| `GET` | read | yes (and safe) |
| `PUT` | replace / create at a known URL | yes |
| `DELETE` | remove | yes |
| `POST` | create / perform an action | **no** |
| `PATCH` | partial update | not necessarily |

Use status codes precisely: `201 Created`, `204 No Content`, `400` bad input, `401` not authenticated, `403` not allowed, `404`, `409 Conflict`, `429 Too Many Requests`, `5xx` server errors. REST is simple, cache-friendly (GET plus HTTP caching and CDNs), and universally supported, which makes it the default for public APIs.

### gRPC
Contract-first RPC over HTTP/2 with **Protocol Buffers**: compact binary messages, generated clients, deadlines, and **streaming** (client, server, or bidirectional). Great for **internal service-to-service** calls where performance and strict schemas matter. Browsers need a proxy (gRPC-Web).

### GraphQL
Clients send a query describing exactly the fields they need, and one endpoint returns exactly that shape. It solves over-fetching and under-fetching for varied clients (mobile vs web). The costs: caching is harder than GET-by-URL, you have to guard against expensive queries (depth and complexity limits), and resolvers can suffer the N+1 problem (fix it with batching loaders).

### Design details interviewers like
- **Versioning**: `/v1/…` in the path, or a header. Additive changes shouldn't need a new version.
- **Pagination** for every list endpoint (see *Pagination*).
- **Idempotency keys** on `POST` requests that create things or move money (see *Idempotency*).
- **Consistent error bodies** with a machine-readable code and a human message.
- **Auth**: OAuth2 / OIDC for users, short-lived tokens, and mTLS or signed tokens between services.

## Key takeaways
- REST is the default for public APIs: resource nouns, HTTP verbs, precise status codes, cacheable GETs.
- gRPC suits internal, high-performance, strongly typed calls and streaming.
- GraphQL suits varied clients needing flexible shapes, if you guard query cost.
- Always paginate lists and make POSTs retry-safe.

## Go deeper
- [Introduction to gRPC](https://grpc.io/docs/what-is-grpc/introduction/)
