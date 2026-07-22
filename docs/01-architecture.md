# Architecture

Internal build doc. A client-facing feasibility summary is kept privately.

## Stack

- Next.js (App Router, TypeScript) frontend, hosted on Vercel as staging. Globally noindex (robots header + meta) until a go-live SOW exists.
- Sanity CMS, Studio v6, embedded in the repo (`/studio` route or separate workspace folder, decide at scaffold time; embedded route preferred so one Vercel deploy carries both).
- One Sanity project, dataset `production` for content plus operational documents (CWV snapshots, SEO audit results, redirects, 404 log). Operational document types are hidden from the main content structure and surfaced only through their tools/panels.

## Where each SOW feature lives

| Feature | Mechanism | Runs where |
|---|---|---|
| 2.2 CWV dashboard | Custom Studio tool via `defineConfig` `tools` array, first tool in the list so it is the landing view | Studio (React), reads cached snapshot docs |
| 2.2 data collection | Scheduled route handler fetching CrUX API, writes snapshot documents | Next.js route + Vercel cron |
| 2.3 SEO Health panel | Custom document view via Structure Builder `S.view.component()` on page-type documents, plus inline callouts above related fields via `form.components` | Studio (React) |
| 2.3 audit collection | Scheduled route handler fetching Google Search Console + Lighthouse per URL, writes `seoAudit` documents | Next.js route + Vercel cron |
| 2.3 re-check | On-demand route handler running instant in-CMS page checks (free) | Next.js route, invoked from Studio |
| 2.4 SEO fields | Shared `seoFields` object type imported by every page schema; custom inputs via `form.components` | Studio schema |
| 2.5 SEO score + readability | Custom form component subscribed to document value, computes checks client-side | Studio (React) |
| 2.5 sitemap | `app/sitemap.ts` generated from published Sanity documents | Next.js |
| 2.5 redirects | `redirect` document type + Next.js middleware lookup; document action creates a redirect on slug change | Studio + Next.js middleware |
| 2.5 404 monitor | not-found handler logs to a capped Sanity log; reviewed in a Studio tool alongside redirects | Next.js + Studio |
| 2.5 canonical/OG fallback | Pure functions in the frontend metadata layer; single precedence order (see ruleset 05) | Next.js |
| 2.5 local SEO schema | `officeLocation` settings document rendered as LocalBusiness JSON-LD | Studio + Next.js |
| 2.5 content assist | Rule-based checks in the score component; optional AI suggest button rendered only when the server reports a configured key | Studio + Next.js route |
| 2.5 CWV trending | Same snapshot documents as 2.2, seeded once from CrUX History API | Studio tool charts |

## Data flow principles

1. Third-party data (CrUX, Google Search Console, Lighthouse) is always fetched server-side on a schedule, cached as Sanity documents, and read by the Studio from Sanity. The Studio never calls Google directly; no third-party keys ever reach the browser.
2. Every external fetch has a stored `fetchedAt` and the UI always displays data age. Stale or missing data renders as an explicit empty state, never as zeros.
3. Secrets (Google API keys for CrUX/PSI/Search Console, optional AI key) live in Vercel environment variables only. Nothing in Sanity documents, nothing in the repo.
4. Operational documents are append-limited: caps and pruning rules are defined per type in the rulesets so the dataset cannot grow unbounded.

## Content schema (SOW 2.1, for context)

Page types per the SOW: home, service pages, about, contact, blog/insights, plus whatever the confirmed final page list adds. Every page type imports `seoFields`. Portable Text for body content. Final list is confirmed with Laney before schema build starts; do not invent page types.
