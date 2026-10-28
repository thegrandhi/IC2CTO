## Requirements

::: ask clarify
Autocomplete looks simple. What do you want to know before designing it?
- [key] How do we rank suggestions: overall popularity, or personalised? => Overall popularity. Personalisation is a stretch goal.
- [key] How fresh must suggestions be? => New trends should show up within about an hour.
- [key] What scale: searches a day, and suggestion requests per search? => 5 billion searches a day. With debouncing, about 6 suggestion requests per search.
- [key] How fast must suggestions appear? => They must feel instant: under 50 ms end to end.
- [ok] Do we filter offensive suggestions? => Yes, with a blocklist.
- [weak] Should suggestions be bold or regular text? => A UI choice.
- [weak] What's the maximum query length? => Long queries are rare. It doesn't change the design.
???
Ranking defines what you precompute. Freshness of about an hour means batch or stream aggregation is fine. Scale and latency mean everything is served from memory and caches.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Returning the top 10 completions for a typed prefix => The core.
- [x] Updating suggestions as searches trend => The interviewer asked for hourly freshness.
- [x] Filtering offensive or blocked suggestions => Asked for.
- [ ] The search results page itself => A separate system. You only suggest queries.
- [ ] Spelling correction for full queries => A related feature, but separate.
- [ ] Voice search => Out of scope.
???
Serving top-k completions fast, keeping them fresh, and filtering them. Search itself and spelling correction are separate systems.
:::

::: choice priority
Which requirement shapes the design most?
- [ ] Perfectly accurate counts for every query => Approximate popularity is fine.
- [ ] Showing a new trending query within one second => An hour was the requirement.
- [x] Answering in a few milliseconds at very high request rates => Right. Every keystroke is a request, so the serving path must be tiny and in memory.
- [ ] Storing every query forever => The log is for aggregation, not for serving.
???
Latency and read volume push all the expensive work offline: precompute the answers so serving is a lookup.
:::

## Estimation

::: choice qps
5 billion searches a day, about 6 suggestion requests each. Roughly how many suggestion requests per second?
- [ ] About 35,000 => 10× too low.
- [x] About 350,000 => Right. 30 billion a day ÷ ~86,400 s ≈ 350k/s, maybe a million at peak.
- [ ] About 3.5 million => 10× too high on average.
- [ ] About 58,000 => That's the search rate, without the 6 keystroke requests per search.
???
5B × 6 = 30B requests a day ≈ 350,000/s on average, around 1M/s at peak. That's why caching at the edge and in the browser matters so much.
:::

## API

::: pick client
The client calls `GET /v1/suggest?q=…`. What should it do to cut the request volume? Pick all that apply.
- [x] Debounce: wait about 100 ms after the last keystroke before asking => Fast typists don't send a request for every letter.
- [x] Cache recent responses locally => Backspacing to a previous prefix needs no request.
- [ ] Download the entire suggestion database to the phone => Tens of gigabytes.
- [x] Let the CDN cache responses for common prefixes => Short prefixes like "how" are asked millions of times.
- [ ] Send a request for every keystroke, immediately => That's what drives the volume up.
???
Most of the 350k requests a second never need to reach your servers: debouncing, browser caches and edge caches absorb them.
:::

## Data model

::: choice trie
How do you store suggestions so a lookup is fast?
- [ ] A SQL table of queries, searched with `LIKE 'prefix%'` and sorted by count => Scanning and sorting millions of rows per keystroke is far too slow.
- [ ] A plain trie: walk to the prefix node, then search everything below it for the top 10 => For a prefix like "h", that's millions of descendants per request.
- [x] A trie where every node stores its precomputed top 10 completions => Right. A lookup just walks the prefix and returns the stored list.
- [ ] A hash map from each full query to its count => Great for counting, but it can't answer prefix queries.
???
Precomputing top-k at every node costs memory and makes updates heavier, but updates are batched offline, so serving stays O(prefix length). The trie lives in memory, sharded and replicated.
:::

## High-level design

::: path serve-path
Build the path of a suggestion request from the search box.
1. Browser
2. CDN / edge cache (optional)
3. Load balancer
4. Suggest service
5. In-memory trie
- extra: Query log => The log records submitted searches for aggregation. It's never read while serving.
- extra: Trie builder => It builds new tries offline.
- extra: SQL database => Nothing on this path touches a database: it's all memory.
???
Requests that miss the edge cache go to a suggest server holding a trie shard in memory. It returns the stored top 10 for the prefix in a few milliseconds.
:::

::: path update-path
Now build the path that makes a newly trending search show up in suggestions.
1. Submitted search
2. Query log
3. Aggregation job
4. Trie builder
5. Suggest servers
- extra: CDN => It caches answers but doesn't build them.
- extra: Browser cache => Holds the user's own recent responses only.
- extra: Load balancer => It routes requests. It isn't part of building the data.
???
Searches stream into a log (Kafka). An aggregation job keeps windowed counts with decay. Every 15–60 minutes the builder produces a new trie snapshot, which servers swap in atomically.
:::

## Deep dives

::: choice freshness
A news event makes a brand-new query explode in popularity. How does it surface within an hour without old favourites dominating forever?
- [ ] Rebuild the trie from all-time counts once a day => Too slow, and all-time counts bury new trends.
- [x] Count queries in time windows with exponential decay, and rebuild the trie every 15–60 minutes => Right. Recent searches weigh more, so trends rise fast and fade naturally.
- [ ] Update the live trie on every single search => Updating the top-k lists all the way up the prefix path, a million times a second, would swamp the servers.
- [ ] Let editors add trending queries by hand => Doesn't scale.
???
Windowed, decayed counts make "popular right now" the ranking signal. Snapshot rebuilds keep the serving path read-only and simple.
:::

::: choice sharding
The trie is tens of gigabytes, and it gets a million requests a second at peak. How do you split it?
- [ ] One copy on one big server => Not enough memory or throughput, and a single point of failure.
- [ ] Split alphabetically by first letter, one shard per letter => Letters aren't equally popular: the "s" shard would be overloaded and the "x" shard idle.
- [x] Split by prefix ranges sized to balance the load, splitting hot ranges further, and replicate every shard => Right. Even load, and replicas add read throughput and availability.
- [ ] Give each user their own trie => Enormous duplication.
???
Shard by prefix range (or by a hash of the first 2–3 characters), tuned from real traffic. Replicate each shard several times, since this is a read-only workload.
:::

::: choice offensive
An offensive query suddenly trends and appears in suggestions. What's your defence?
- [ ] Wait for the next daily rebuild => It stays visible all day.
- [ ] Remove the query from the log => The log isn't what's being served.
- [x] Filter blocked terms when building the trie and again at serve time, so new blocks apply instantly => Right. The build-time filter keeps the trie clean, and the serve-time check handles emergencies.
- [ ] Turn off autocomplete => Far too drastic.
???
A blocklist checked in both places gives you a clean index and an immediate kill switch.
:::

::: choice build-fails
The hourly trie build fails. What should the suggest servers do?
- [x] Keep serving the last good trie, and alert => Right. Suggestions an hour or two old are fine. An empty box is not.
- [ ] Return no suggestions until the build is fixed => Breaks the feature for everyone.
- [ ] Load the half-built trie => It may be incomplete or corrupt.
- [ ] Query the raw log directly => Far too slow.
???
Snapshots make failure safe: servers only swap in a trie after it's fully built and validated. Stale data beats no data here.
:::

## Wrap-up

::: choice cache-win
Where does most of the request volume get absorbed?
- [ ] In the trie builder => It's offline.
- [ ] In the query log => The log records searches. It doesn't serve suggestions.
- [x] In client-side debouncing and caches, plus edge caching of popular prefixes => Right. Most requests never reach the suggest servers.
- [ ] In the database => There isn't one on the serving path.
???
Short prefixes are both the hottest and the most cacheable. Debounce on the client, cache in the browser and at the edge, and the in-memory trie handles the long tail.
:::
