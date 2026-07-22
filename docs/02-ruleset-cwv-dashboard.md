# Ruleset: Core Web Vitals Dashboard (SOW 2.2)

## Metrics

1. The dashboard shows LCP, INP, and CLS. FID is retired (replaced by INP in 2024) and must not appear anywhere. Note the substitution to Laney once during walkthrough; the SOW listed "LCP, INP/FID, CLS".
2. Status bands use Google's published thresholds, assessed at the 75th percentile (which is what CrUX reports):
   - LCP: good <= 2.5s, needs improvement <= 4.0s, poor > 4.0s
   - INP: good <= 200ms, needs improvement <= 500ms, poor > 500ms
   - CLS: good <= 0.10, needs improvement <= 0.25, poor > 0.25
3. Each metric renders its value plus a three-state indicator (pass / needs improvement / poor) per the SOW. Do not invent a composite score.

## Data source

4. Field data comes from the CrUX API only. Rationale, verified July 2026: Search Console has no CWV API (its report is UI-only and itself CrUX-powered), and Google is winding down field data inside PageSpeed Insights responses. Do not build against either for field data.
5. PageSpeed Insights API may be used for optional lab diagnostics (Lighthouse) but never as the source of the pass/fail status.
6. Query CrUX at origin level for thedesignboutique.com, phone and desktop form factors, both stored. The dashboard defaults to phone (Google's primary lens).
7. URL-level CrUX queries are allowed for key pages, but low-traffic URLs will return no data; when URL-level data is absent, fall back to origin-level and label it as such. Never present origin data as page data.

## Refresh and storage

8. A Vercel cron hits a collection route once daily. Each run writes one `cwvSnapshot` document per (origin/URL, form factor) with: metric values, band, collection period, `fetchedAt`. Snapshots are immutable once written.
9. These same snapshots are the data for historical trending (SOW 2.5). Before first launch, seed history from the CrUX History API (about 40 weeks of weekly points) as backdated snapshot documents flagged `seeded: true`.
10. The dashboard reads only from snapshot documents. It never calls Google APIs from the browser.
11. A manual "refresh now" button may trigger the collection route on demand, rate-limited to one run per 10 minutes. Explain in the UI that CrUX itself updates daily, so refreshing more often cannot produce newer data.
12. Rate limits are generous for our volume (CrUX: 150 queries/minute; we make a handful per day) but the collection route still handles 429s with a single retry then records a failed run.

## Failure and empty states

13. If CrUX returns no data (404 for the record), show "not enough real-user data yet" with the last successful snapshot date if one exists. Never show zeros or fabricate values.
14. If the daily run fails, the dashboard shows the newest available snapshot with its age prominently displayed. Data older than 3 days renders a stale warning.

## Definition of done

- Team logs into the Studio and the first screen is the CWV view: three metrics, values, band indicators, form factor toggle, data age, trend sparkline (full trending detail in ruleset 05).
- Daily cron proven by two consecutive days of snapshots in the dataset.
- Empty, stale, and error states all reachable and rendered as specified.
