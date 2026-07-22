# Progress Board

The always-current view of what is done, in progress, and left. Git log says what changed; this says where we are. Updated on every task. Read top to bottom for status.

Last updated: July 22, 2026.
Current phase: Phase 0 (Foundations). Sequencing: strictly linear by phase (Angelo's call).

## Status at a glance

- Docs and management system: in place.
- Git repo: PUBLIC at github.com/The-Design-Boutique/the-design-boutique, default branch `main`. Working via `phaseN/*` branches and draft PRs at review gates.
- Sanity: project `inapmf9l` ("the-design-boutique"), dataset `production` (public). Access via an Editor API token in `.env.local` (gitignored). Note: the claude.ai Sanity connector is stale (cannot manage this project), so project-admin actions (CORS, etc.) need Angelo via the UI or an admin-scoped token.
- Blocked on Angelo for: add CORS origins to the Sanity project (localhost + Vercel URLs); Vercel link. See "Needed from Angelo".
- Blocked on Laney for: sign-off on the free 2.3 SEO Health panel (does not block Phases 0 to 2).

## Needed from Angelo to unblock (you provide access)

1. Sanity CORS (blocking full Studio connect): the Editor token cannot manage CORS, and my connector is stale. Add `http://localhost:3009` (dev) and the Vercel URLs (once known) as CORS origins with credentials allowed, at manage.sanity.io -> project inapmf9l -> API -> CORS Origins. OR send an Admin-permission token and I will self-serve all project config from here.
2. Vercel (blocking for deploy): import the (now public) GitHub repo into the TDB Vercel account. Add `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and the Sanity token as Vercel env vars (I will give the exact values). Add the resulting Vercel URL to Sanity CORS.
3. GitHub: DONE. Repo public, `main` default.
4. Sanity project + token: DONE (project inapmf9l, Editor token stored locally).
5. Google Search Console: confirm the `gsc-tdb` connection covers the thedesignboutique.com property (likely already does).

## Phase 0 — Foundations & walking skeleton

- [x] Management system: SOW compliance matrix, engineering standards, progress board
- [x] Git repository (public, main default)
- [~] Design reference captured: homepage done (desktop + mobile); remaining pages/breakpoints to follow
- [x] Design tokens as code (colors, Signika via next/font, spacing, breakpoints, square buttons) in `app/globals.css`
- [x] Repo scaffold: Next.js 16 (App Router, TS) + embedded Sanity Studio v6. Verified: clean production build; home renders on-brand; Studio embeds and correctly targets project inapmf9l. Full connect pending CORS.
- [ ] Shared schema objects (`seoFields`, `link`, `sectionSettings`, image+alt)
- [ ] CI: build + type-check + lint on push
- [ ] Walking skeleton: one content type end to end (schema -> block -> frontend render -> SEO fields -> live preview -> deployed to staging) [needs CORS + Vercel]
- [ ] Phase 0 QC + Angelo review gate

## Phase 1 — Content model & blocks

- [ ] Document types: page, post, client, goldEvent, testimonial, category, clientCategory, navigation, siteSettings, officeLocation, redirect, notFoundEntry, operational docs
- [ ] The ~21 blocks with fields, previews, icons, initial values
- [ ] WP-familiar desk structure (mirrors WP admin nav)
- [ ] Phase 1 QC + review gate

## Phase 2 — Frontend & design system

- [ ] BlockRenderer (_type -> component)
- [ ] Every block component, exact-matched to reference
- [ ] Nested routing (parent-chain URLs preserved)
- [ ] Global header (with "Hire Us!" CTA) + footers
- [ ] Signature elements: forest motif, "Laney Said" video ring
- [ ] Phase 2 QC + review gate

## Phase 3 — Pages & migration

- [ ] 30 pages rebuilt in the block builder, each matched to reference
- [ ] Migrate 53 posts, 14 clients, 18 gold events, referenced media
- [ ] Content parity crawl vs live (URLs + visual)
- [ ] Phase 3 QC + review gate

## Phase 4 — SEO tooling

- [ ] 2.2 CWV dashboard + snapshot cron
- [ ] 2.3 SEO Health panel (GSC + Lighthouse + in-CMS checks) [pending Laney sign-off]
- [ ] 2.4 SEO field stack verified across all content types
- [ ] 2.5 score, readability, sitemap, redirects/404, fallbacks, local schema, content assist, CWV trending
- [ ] Phase 4 QC + review gate

## Phase 5 — Parity, accessibility, performance QA

- [ ] Full visual diff pass, all pages/breakpoints
- [ ] WCAG 2.1 AA audit + fixes
- [ ] Core Web Vitals / Lighthouse pass on staging
- [ ] Phase 5 QC + review gate

## Phase 6 — Training & handoff (SOW 2.6)

- [ ] Editor guide written (WP-to-Sanity oriented)
- [ ] Walkthrough session with Laney + team
- [ ] Ownership transfer + admin access to client
- [ ] Phase 6 QC + review gate

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Signature motion (video ring, forest motif) hard to match exactly | Design fidelity | Build as isolated components early; diff against reference; flag any true blockers |
| 700MB / 4,600 image library hurts performance | Core Web Vitals | Migrate only referenced assets; next/image, modern formats; measure on staging |
| WP editors resist Sanity | Adoption / trial outcome | WP-familiarity ruleset enforced per DoD; editor guide; test with a WP lens |
| Laney declines the free 2.3 panel or wants paid Semrush | Scope | Panel UI is source-agnostic; decision isolated to ruleset 03; rest of build unaffected |
| Fixed-fee trial vs large scope | Time | Strictly linear phases with review gates; record effort as the reusable estimate for future client builds |
| Legacy-site security finding (tracked privately) | Client security, not our build | Disclosed to client; we reuse media only, never legacy PHP; staging is a clean room |
