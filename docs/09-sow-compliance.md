# SOW Requirements Traceability Matrix

The master checklist. Every requirement in Laney's SOW is a row here. No requirement is "done" until its status reads Verified, meaning built, QC'd against the Definition of Done (`10-engineering-standards.md`), and cross-checked to the SOW wording. Updated on every task completion. This is the single answer to "have we met her requirements."

Status legend: Planned -> In progress -> Built -> Verified. A row can also be Blocked (with the blocker named).

Last updated: July 22, 2026 (project kickoff, nothing built yet).

## 2.1 New site build

| # | Requirement (SOW wording) | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.1a | New thedesignboutique.com built from scratch on Sanity CMS | repo + Sanity project | Planned | |
| 2.1b | Built and hosted on Vercel as staging, not connected to live domain/DNS | Vercel project | Planned | Live stays on WP Engine, untouched |
| 2.1c | Live site stays up and unchanged throughout | n/a (hands off) | Verified | We never touch it; enforced in CLAUDE.md |
| 2.1d | Content schema for the site's page types (home, service, about, contact, blog/insights, etc.) | `schemaTypes/` | Planned | Final page list from audit: 30 pages |
| 2.1e | Existing copy and media brought into the new content model where it applies | migration scripts | Planned | Media reused from import; never theme/plugin PHP |

## 2.2 Core Web Vitals dashboard on the Studio home page

| # | Requirement | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.2a | First screen on Studio login shows CWV (LCP, INP, CLS) at a glance | Studio tool (ruleset 02) | Planned | INP replaces retired FID |
| 2.2b | Data from CrUX API (source/refresh confirmed with Angelo) | Next.js cron + `cwvSnapshot` | Planned | CrUX only; GSC has no CWV API |
| 2.2c | Pass / needs-improvement / poor indicator per metric | Studio tool | Planned | Google threshold bands |

## 2.3 SEO Health panel (revised from Semrush; pending Laney sign-off)

| # | Requirement | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.3a | Panel in Studio showing each page's SEO/site-health issues next to the fields they relate to | Studio doc view (ruleset 03) | Blocked | Scope change from "Semrush panel"; needs Laney's yes |
| 2.3b | Issues positioned above the related field ("here's what to fix" in context) | `form.components` callouts | Blocked | |
| 2.3c | Re-check button so the editor can confirm a fix | in-CMS check route | Blocked | Instant, free |
| 2.3d | Covers thedesignboutique.com only | scoped | Blocked | |

## 2.4 SEO field stack on EVERY page type (cross-cutting)

| # | Requirement | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.4a | SEO title (char + pixel-width guidance) | `seoFields` object | Planned | Cross-cutting: verified on every content type |
| 2.4b | Meta description (char guidance) | `seoFields` | Planned | |
| 2.4c | Canonical URL | `seoFields` | Planned | |
| 2.4d | URL slug | `seoFields` | Planned | |
| 2.4e | Focus / target keyword | `seoFields` | Planned | |
| 2.4f | Robots directives (index/noindex, follow/nofollow) | `seoFields` | Planned | |
| 2.4g | Open Graph fields (title, description, image) | `seoFields` | Planned | |
| 2.4h | Twitter/X card fields | `seoFields` | Planned | |
| 2.4i | JSON-LD schema markup, page-level type selectable | `seoFields` | Planned | Org, Service, FAQ, Article, LocalBusiness, WebPage |
| 2.4j | Breadcrumb title | `seoFields` | Planned | |

## 2.5 Rank Math Pro-style toolset

| # | Requirement | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.5a | On-page SEO score / checklist as content is edited | Studio component (ruleset 05) | Planned | |
| 2.5b | Readability analysis (sentence/paragraph length, passive voice) | Studio component | Planned | |
| 2.5c | XML sitemap generated from Sanity content | `app/sitemap.ts` | Planned | Excludes noindex |
| 2.5d | Redirect manager (301s on slug changes) + 404 monitor + redirect log | `redirect`/`notFoundEntry` + middleware | Planned | |
| 2.5e | Automatic canonical & OG fallback logic | frontend metadata layer | Planned | |
| 2.5f | Local SEO / location schema (SF office) | `officeLocation` + JSON-LD | Planned | |
| 2.5g | Content writing assistance in editor (hybrid) | Studio component + optional AI route | Planned | Heuristics always on; AI only if key configured |
| 2.5h | SEO Health sync where supported (was Semrush) | ruleset 03 panel | Blocked | Delivered via free panel, pending 2.3 sign-off |
| 2.5i | Historical CWV trending | `cwvSnapshot` + CrUX History | Planned | ~40 weeks seed + daily |

## 2.6 Training & handoff

| # | Requirement | Where implemented | Status | Notes |
|---|---|---|---|---|
| 2.6a | One live walkthrough covering Studio, SEO fields, CWV dashboard, SEO panel | session + `docs/editor-guide` | Planned | |
| 2.6b | Reasonable follow-up questions covered first 2 weeks | support window | Planned | |

## Cross-cutting requirements (verified on EVERY page/content type as built)

| # | Requirement | Source | Status | Notes |
|---|---|---|---|---|
| Xa | Exact match to current live design (improvements flagged, not applied) | Angelo mandate | Planned | Visual diff vs reference per page |
| Xb | SEO field stack present and correct (all of 2.4) | SOW 2.4 | Planned | Re-checked per content type |
| Xc | Studio is WordPress-friendly (WP-familiarity ruleset) | Angelo mandate | Planned | |
| Xd | Accessibility WCAG 2.1 AA | ADA page exists on live site | Planned | |
| Xe | Staging globally noindex until go-live SOW | plan section | Planned | |
| Xf | Nested URLs preserved (`/solutions/seo-services/`) | WP audit | Planned | |
| Xg | Ownership transfer + admin access to Laney on completion | SOW section 7/8 | Planned | |
