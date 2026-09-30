# Load Balancing

```meta
category: infrastructure
summary: Spreading traffic across servers, L4 vs L7, algorithms, and health checks.
minutes: 4
order: 4
```

A load balancer sits in front of a pool of servers and spreads requests across them. It gives you **horizontal scaling** (add more servers) and **high availability** (route around dead ones).

### Layer 4 vs Layer 7
- **L4 (transport)** balances TCP/UDP connections by IP and port without reading the request. It's very fast and protocol-agnostic.
- **L7 (application)** understands HTTP. It can route by path (`/api` vs `/static`), header, or cookie, terminate TLS, rewrite requests, and do retries. It costs more CPU, but it's far more flexible. Most web systems use L7 at the edge.

### Algorithms
- **Round robin**: take turns. Simple, and fine when requests cost roughly the same.
- **Least connections / least outstanding requests**: send the next request to the least busy server. Better when request cost varies.
- **Weighted** variants for servers of different sizes.
- **Hashing** (by client IP or a key) keeps a client or key on the same server. Useful for caches, via *consistent hashing*.
- **Power of two choices**: pick two servers at random and use the less loaded one. It performs close to optimal with almost no coordination.

### Health checks
The load balancer probes each server (for example `GET /health`) and stops sending traffic to failing ones. Distinguish **liveness** (the process is up) from **readiness** (it can serve right now, with dependencies connected and warmed up).

### Sticky sessions
Session affinity pins a user to one server, usually because session state lives in that server's memory. It works, but it hurts load distribution and failover. Prefer **stateless servers** with session state in a shared store (Redis) or in signed tokens.

### Avoiding a single point of failure
The load balancer itself must be redundant: run an active-passive pair with a floating IP, use DNS with multiple load balancers, or use a managed cloud load balancer. Across regions, **GeoDNS / anycast** sends users to the nearest healthy region.

## Key takeaways
- L4 is fast and simple; L7 is HTTP-aware and can route, terminate TLS and retry.
- Least-outstanding-requests beats round robin when request costs vary.
- Keep app servers stateless, so any server can handle any request.
- Health checks plus a redundant load balancer make the tier highly available.

## Go deeper
- [What is load balancing? (Cloudflare)](https://www.cloudflare.com/learning/performance/what-is-load-balancing/)
