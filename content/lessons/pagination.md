# Pagination

```meta
category: apis
summary: Offset vs cursor (keyset) pagination, and why feeds use cursors.
minutes: 3
order: 14
```

Any endpoint that returns a list needs pagination. Otherwise a single response can grow without bound.

### Offset pagination
`GET /posts?limit=20&offset=40` → `ORDER BY id LIMIT 20 OFFSET 40`.
- ✅ Simple, and supports "jump to page 7".
- ❌ **Slow for deep pages**: the database still reads and discards all `offset` rows.
- ❌ **Unstable under writes**: if a new item is inserted at the top while you're paging, everything shifts, so you'll see duplicates or miss items.

### Cursor (keyset) pagination
`GET /posts?limit=20&after=<cursor>`, where the cursor encodes the last item's sort key:
```sql
SELECT * FROM posts
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```
- ✅ **Fast at any depth**: an index seek, then 20 rows.
- ✅ **Stable** under inserts and deletes: you continue from a fixed point.
- ❌ No random access to "page 7". Just next and previous.

Include a **tiebreaker** (like `id`) in the sort key so the ordering is total. Return the cursor as an opaque string (base64 of the key values) so clients can't depend on its internals.

### Which to use
- Infinite scroll, feeds, timelines, activity logs, large tables → **cursor**.
- Small admin tables where users jump between pages → offset is fine.

## Key takeaways
- Offset pagination is simple but slow for deep pages and unstable under writes.
- Cursor (keyset) pagination seeks by index: fast and stable. Feeds use it.
- Make the sort key unique with a tiebreaker, and keep cursors opaque.

## Go deeper
- [Paging through results (Use The Index, Luke)](https://use-the-index-luke.com/no-offset)
