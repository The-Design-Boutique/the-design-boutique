# Ruleset: SEO Health Panel (SOW 2.3)

Replaces the originally-scoped Semrush audit panel. Decision (July 22, 2026): Semrush is kept entirely separate from this project. The client stays on their existing Semrush plan for backlink and competitor work; the CMS integrates none of it, no API, no exports, no keys. This panel delivers the same editor experience (SEO issues shown next to the fields they relate to) from free sources: our own in-CMS checks plus Google's own free APIs. The client-facing rationale for this decision is documented privately.

## Data sources (all free)

1. In-CMS on-page checks. Run against the document value and the rendered staging page. No external cost, no keys, instant. This is the same check library as the on-page score in ruleset 05, rule 5: build once, use in both places.
2. Google PageSpeed Insights / Lighthouse API. Free, 25,000 requests/day with an API key. Provides Lighthouse's SEO audit category and performance data per URL. Used for technical/SEO audits; performance data also feeds the CWV dashboard (ruleset 02).
3. Google Search Console API. Free. Per-URL indexing status (via URL Inspection API, about 2,000 calls/day) and search performance (Search Analytics API): is the page indexed, coverage problems, top queries, clicks, impressions, average position.

Optional fourth source, also free: our own scheduled crawl of the site (we own the whole stack) for site-wide issues, rule 8.

## What the panel shows, per page

4. Page-level issues grouped into: content/SEO (from in-CMS checks), technical (from Lighthouse), and search presence (from GSC). Each issue has a severity (error/warning/notice) and maps to the field it relates to.
5. Placement per the SOW intent: a document view (`S.view.component()`) on each page type listing that page's issues, plus inline callouts above the specific fields an issue maps to (e.g., "no meta description" above the SEO fields, "not indexed by Google" near the publish/robots area). Maintain one issue-to-field mapping table in code; unmapped issues appear in the document view only.
6. The in-CMS checks cover: title presence/length, meta description presence/length, duplicate title/description against other Sanity documents, H1 count and heading structure, thin content (word count under threshold), image alt presence, canonical presence/validity, internal/external link validity, noindex flag, focus-keyword usage, readability band, Open Graph completeness.

## Refresh and storage

7. Google-sourced data (Lighthouse, GSC) is fetched server-side on a daily cron, cached as Sanity documents (`seoAudit` per URL with `fetchedAt`), and read by the Studio from Sanity. The Studio never calls Google directly; no keys reach the browser. In-CMS checks run live in the editor and need no storage.
8. Site-wide crawl (optional source): a scheduled route crawls the published site and records cross-page issues (broken links, duplicate meta across pages, orphan pages, sitemap and redirect health) into the same `seoAudit` store, scoped as site-level.
9. Every stored result shows its data age. Google quotas are generous for our volume (PSI 25k/day, GSC URL inspection ~2k/day); the cron handles 429s with a single retry then records a failed run.

## "Re-check" button

10. Because the in-CMS checks are free and instant, the re-check button runs them immediately on the current page and returns results with no wait and no cost. For Google-sourced signals (indexing, Lighthouse), the button may trigger an on-demand fetch for that single URL, still free within quota.
11. Results render immediately, labeled by source (in-CMS check vs Google), so editors know what is live versus what refreshes daily.

## Definition of done

- Editor opens a page document, sees its SEO issues above the related fields and in the document view, fixes one, clicks re-check, and sees the result update instantly.
- Daily cron proven by two consecutive days of `seoAudit` documents (Lighthouse + GSC) in the dataset.
- Empty and stale states render honestly (a page with no GSC data yet shows "not enough Google data yet", never fabricated values).
- Zero Semrush anywhere: no Semrush API calls, no Semrush keys, no Semrush import path. Covers thedesignboutique.com only.
