# Consistent Hashing

```meta
category: infrastructure
summary: Mapping keys to nodes so that adding or removing a node moves only a few keys.
minutes: 4
order: 9
```

With naive hashing, `node = hash(key) mod N`. When `N` changes from 4 to 5, **most keys map to a different node**. For a cache that means a flood of misses; for a database, a massive data migration.

### The ring
Consistent hashing places both **nodes** and **keys** on the same circular hash space (say 0 to 2³²). Each key belongs to the **first node clockwise** from its position.

```
          node A
        /        \
   key3            key1 → B
      |    ring    |
   node C        node B
        \        /
          key2 → C
```

- **Adding a node** takes over only the keys between it and its predecessor, about 1/N of the total.
- **Removing a node** hands its keys to its successor; no other keys move.

### Virtual nodes
With only a few physical nodes, positions on the ring are uneven and one node might own 40% of the space. The fix is **virtual nodes**: each physical node appears at many points on the ring (say 100–200). Load evens out, and a failed node's keys scatter across *many* survivors instead of piling onto one neighbour. Giving bigger machines more virtual nodes weights the load.

### Where it's used
- Distributed caches (Memcached client libraries, Redis Cluster's hash slots are a related idea).
- Dynamo-style databases (Cassandra, DynamoDB) for partitioning and replica placement: a key's replicas are the next *N* distinct nodes clockwise.
- Load balancers that need a key to stick to the same server.

### Alternatives worth knowing
- **Rendezvous (highest random weight) hashing**: for each key, score every node with `hash(key, node)` and pick the highest. It's simple and moves just as few keys, at O(N) per lookup.
- **Fixed hash slots** (Redis Cluster uses 16,384): keys map to slots, and slots are assigned to nodes, so rebalancing moves whole slots.

## Key takeaways
- `hash mod N` remaps almost everything when N changes; consistent hashing moves about 1/N of the keys.
- Keys go to the next node clockwise on the ring.
- Virtual nodes smooth out the load and spread a failed node's keys around.

## Go deeper
- [Dynamo: Amazon's highly available key-value store (paper)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
