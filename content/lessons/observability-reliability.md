# Reliability and Observability

```meta
category: product
summary: SLOs, timeouts, retries, circuit breakers, graceful degradation, and the three pillars of observability.
minutes: 5
order: 23
```

### Define "reliable" with numbers
- **SLI** (indicator): what you measure, such as the percentage of requests that succeed in under 300 ms.
- **SLO** (objective): the target for it, such as 99.9% over 30 days.
- **Error budget**: `100% − SLO`. 99.9% allows about 43 minutes of failure per month. Spend it on shipping fast; freeze risky changes when it's used up.
- Each extra "nine" costs roughly 10× more effort. Don't promise 99.999% for a photo-sharing app.

### Stop failures from spreading
- **Timeouts** on every network call. A hung dependency otherwise ties up your threads.
- **Retries with exponential backoff and jitter**, only for idempotent operations, with a cap.
- **Circuit breakers**: after repeated failures, fail fast for a while instead of piling more load on a struggling service, then let a trial request probe for recovery.
- **Bulkheads**: separate pools of connections and threads per dependency, so one slow dependency can't exhaust everything.
- **Load shedding**: when overloaded, reject low-priority work early with `503`, so high-priority work still succeeds.

### Degrade gracefully
Serve a *worse but working* experience when something breaks: a stale cached feed, recommendations switched off, "likes" counts hidden. Decide these fallbacks in advance.

### Redundancy
- No single points of failure: multiple instances behind load balancers, replicated databases with automated failover, spread across **availability zones**.
- **Multi-region** for disaster recovery, and know your **RPO** (how much data you can lose) and **RTO** (how long recovery takes).

### Observability: the three pillars
- **Metrics**: cheap, aggregated time series for dashboards and alerts. The **RED** method for services: **R**ate, **E**rrors, **D**uration (latency percentiles such as p50/p99, never just averages).
- **Logs**: detailed per-event records, structured as JSON, with a request ID.
- **Traces**: follow one request across services (OpenTelemetry) to see where the time goes.

Alert on **symptoms users feel** (error rate, latency SLO burn), not on every CPU spike.

## Key takeaways
- SLIs, SLOs and error budgets turn "reliable" into numbers you can plan around.
- Timeouts, backoff with jitter, circuit breakers, bulkheads and load shedding stop cascades.
- Plan degraded modes; remove single points of failure across availability zones.
- Metrics + logs + traces; watch p99, not averages; alert on user-facing symptoms.

## Go deeper
- [Google SRE book](https://sre.google/sre-book/table-of-contents/)
