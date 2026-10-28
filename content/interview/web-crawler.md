## Requirements

::: ask clarify
Crawlers vary a lot depending on why they exist. What do you want to know?
- [key] What's the crawl for: a search index, an archive, or watching specific sites? => To build a general web search index.
- [key] How many pages, and how often should they be refreshed? => About a billion pages a month, with frequently changing pages revisited more often.
- [key] Do we have to respect robots.txt and avoid overloading sites? => Always. Being polite is mandatory.
- [key] HTML only, or other content types too? => HTML only for now.
- [ok] Do we need to run JavaScript to render pages? => Not in the first version.
- [weak] What should the crawler's user-agent string say? => Pick something sensible. It doesn't change the design.
- [weak] Which programming language should the fetchers use? => Your choice.
???
Purpose sets priorities (search wants broad, fresh, important pages). Scale and refresh give you the fetch rate. Politeness shapes the frontier design. HTML-only and no JS rendering keep the fetchers simple.
:::

::: pick scope
What will you design? Pick everything in scope.
- [x] Fetching pages from seed URLs and following links => The core loop.
- [x] Storing page content for the indexing pipeline => The crawler's output.
- [x] Re-crawling pages based on how often they change => Asked for.
- [x] Respecting robots.txt and per-site rate limits => Mandatory.
- [ ] Ranking search results => That's the search engine, downstream.
- [ ] Building the search index itself => The indexer consumes your output.
- [ ] Rendering JavaScript-heavy pages => Ruled out for the first version.
???
Discover, fetch, store and re-crawl, politely. Indexing and ranking happen downstream.
:::

::: choice priority
Which requirement shapes the design most?
- [ ] Fetching each page as fast as possible => Speed per page doesn't matter. Total throughput across many sites does.
- [x] Crawling billions of pages while never overloading any single website => Right. Massive parallelism across hosts, strict limits per host.
- [ ] Storing pages in their original order => Order doesn't matter to the indexer.
- [ ] Fetching every page on the web => Impossible, and much of it is junk. Prioritise.
???
Scale and politeness pull in opposite directions: you need thousands of fetches a second, but only a slow trickle to each site. The frontier design resolves that tension.
:::

## Estimation

::: choice fetch-rate
A billion pages a month. Roughly how many fetches per second?
- [ ] About 40 => 10× too low.
- [x] About 400 => Right. 10⁹ ÷ (30 × 86,400 s) ≈ 400 a second. Plan for 1,000+ with retries and re-crawls.
- [ ] About 4,000 => 10× too high on average.
- [ ] About 33 million => That's per day.
???
A month is about 2.6 million seconds. 1B ÷ 2.6M ≈ 400 pages a second. Fetches are network-bound, so a modest number of machines with async I/O can do it.
:::

::: choice storage
Pages average 100 KB. How much raw content per month?
- [ ] About 100 GB => 1,000× too low.
- [ ] About 100 PB => 1,000× too high.
- [x] About 100 TB, or roughly 20–30 TB compressed => Right. 10⁹ × 100 KB = 10¹⁴ bytes = 100 TB.
- [ ] About 1 TB => 100× too low.
???
1B × 100 KB = 100 TB a month raw. HTML compresses well, so expect 20–30 TB stored, in blob storage keyed by content hash.
:::

## API

::: choice output
How does the crawler hand pages to the indexing team?
- [ ] The indexer queries the crawler's database directly => Couples the two systems tightly.
- [x] Store content in blob storage and publish an event per page (URL, content hash, storage key, outgoing links) => Right. The indexer consumes the stream at its own pace.
- [ ] Email each page to the indexing team => Not at 400 pages a second.
- [ ] The crawler builds the index itself => A separate concern and team.
???
A stream of fetch events decouples crawling from indexing. Either side can scale, pause or replay independently.
:::

## Data model

::: choice seen
Before adding a discovered URL to the queue, you must check whether you've already seen it, across tens of billions of URLs. How?
- [ ] Keep every URL in a Python set in memory => Tens of billions of URLs at ~100 bytes each is terabytes, too much for one machine's memory.
- [x] Normalise the URL, check a Bloom filter for a fast "definitely new", and fall back to a persistent store => Right. The Bloom filter answers most checks in memory, and the store is the authority.
- [ ] Query a SQL table with a `LIKE` match => Far too slow at thousands of checks a second.
- [ ] Don't check: fetching duplicates is harmless => It wastes bandwidth, annoys sites, and duplicates your index.
???
Normalise first (lowercase the host, drop fragments and default ports, sort parameters, strip tracking parameters). A Bloom filter never misses a URL it has seen; its occasional false positive just skips a new URL, which is acceptable.
:::

## High-level design

::: path crawl-loop
Build the crawl loop for one URL, from the frontier back to the frontier.
1. URL frontier
2. Fetcher
3. DNS cache (optional)
4. robots.txt check
5. HTTP fetch
6. Link extractor
7. URL filter and dedupe
- extra: Search ranking => Downstream of the index, not part of crawling.
- extra: Load balancer => Fetchers make outgoing requests. Nothing is load-balanced here.
- extra: User accounts database => A crawler has no users.
???
The fetcher takes a URL from the frontier, resolves DNS (cached), checks robots.txt, fetches, stores the content, extracts links, then normalises and dedupes them before adding new ones back to the frontier.
:::

## Deep dives

::: choice politeness
How do you crawl thousands of pages a second without ever hammering one website?
- [ ] One global first-in, first-out queue of URLs => A site with millions of linked pages would get hit thousands of times in a row.
- [ ] Add a one-second sleep after every fetch => Throttles your whole crawler instead of each site.
- [x] Priority queues feeding one queue per host, each host fetched by one worker with a delay between requests => Right. Lots of sites in parallel, and each site gets a gentle trickle.
- [ ] Only crawl small websites => You'd miss most of the important web.
???
Front queues order URLs by importance and freshness. Back queues hold one host each. A heap keyed by "next allowed fetch time" picks the next host that's ready.
:::

::: choice trap
A site generates an endless calendar: every page links to "next month", forever. How do you avoid crawling it for eternity?
- [ ] Follow links until the site runs out => It never does.
- [x] Cap depth and URL counts per host, and detect repeating URL patterns => Right. Traps can't consume unlimited crawl budget.
- [ ] Block the site entirely => It may have real content too.
- [ ] Only crawl the first page of every site => You'd miss nearly everything.
???
Crawler traps (infinite calendars, session IDs in URLs) are common. Per-host budgets, maximum depth, URL length limits and pattern detection keep them contained.
:::

::: choice duplicates
Thousands of sites mirror the same documentation pages with slightly different headers and footers. How do you avoid storing and indexing them all?
- [ ] Compare each new page to every stored page byte by byte => Impossibly slow.
- [ ] An exact hash of the page => Catches identical copies, but the slightly different footers give each mirror a new hash.
- [x] Near-duplicate detection like SimHash or MinHash, plus an exact hash => Right. Similar pages get similar fingerprints, so mirrors are caught even when they differ slightly.
- [ ] Keep them all. Storage is cheap => It bloats the index and the results.
???
An exact SHA-256 catches identical content. SimHash or MinHash fingerprints catch near-duplicates by comparing a few bits instead of whole pages.
:::

::: choice freshness
Some pages change every hour, others haven't changed in years. How often do you re-crawl?
- [ ] Re-crawl everything once a month => News pages go stale for weeks, and you waste fetches on pages that never change.
- [ ] Re-crawl everything every hour => Far too many fetches.
- [ ] Only crawl each page once => The index would go stale.
- [x] Estimate each page's change rate from its history, revisit fast-changing pages more often, and use conditional requests => Right. `If-Modified-Since` and ETags save bandwidth when nothing changed.
???
Track whether the content hash changed on each visit, and schedule the next crawl from that. A 304 Not Modified response costs almost nothing.
:::

## Wrap-up

::: choice scale-fetchers
How do you scale out the fetchers while keeping per-host politeness?
- [ ] Any fetcher can fetch any URL => Then two machines could both hit the same site at once.
- [x] Assign each host to one fetcher node with consistent hashing, and use async I/O => Right. Politeness state stays local to one node, and adding nodes moves only a few hosts.
- [ ] One very large fetcher machine => A single point of failure, and it runs out of network capacity.
- [ ] Let websites tell you how fast to crawl => robots.txt helps, but you still need to enforce it.
???
Partition by host, keep a local DNS cache (DNS is a classic bottleneck), and persist the frontier so a crashed fetcher's hosts move to another node and carry on.
:::
