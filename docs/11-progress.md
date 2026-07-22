# Progress Board

The always-current view of what is done, in progress, and left. Git log says what changed; this says where we are. Updated on every task. Read top to bottom for status.

Last updated: July 22, 2026.
Current phase: Phase 0 (Foundations). Sequencing: strictly linear by phase (Angelo's call).

## Status at a glance

- Docs and management system: in place.
- Git repo: live at github.com/The-Design-Boutique/the-design-boutique, default branch `main`, foundations pushed. Working via `phaseN/*` branches and draft PRs at review gates from here.
- Blocked on Angelo for: Sanity org access + Vercel link (see "Needed from Angelo"). Both block the code scaffold and walking skeleton.
- Blocked on Laney for: sign-off on the free 2.3 SEO Health panel (does not block Phases 0 to 2).

## Needed from Angelo to unblock (you provide access)

1. Sanity (blocking): my connected Sanity tool is logged in as `angelo.marasa@kaleidico.com`, which currently sees only the Kaleidico org, not the new "The Design Boutique" org. Invite `angelo.marasa@kaleidico.com` to the TDB org as Administrator (manage.sanity.io -> the org -> Members -> Invite). Once invited, I can create the project in that org myself. Confirm dataset name `production`.
2. Vercel (blocking for deploy): connect the GitHub repo to a Vercel project via Git integration in the TDB Vercel account (no secret needed; every push deploys). Alternative if CLI deploys are preferred: a Vercel access token in the environment.
3. GitHub: DONE. Repo live, `main` default, foundations pushed.
4. Google Search Console: confirm the `gsc-tdb` connection covers the thedesignboutique.com property (likely already does).
5. Content/media: the local WP import at `~/Sites/tdb` covers this; no action needed unless a fresh export is wanted.

## Phase 0 — Foundations & walking skeleton

- [x] Management system: SOW compliance matrix, engineering standards, progress board
- [x] Git repository initialized (local)
- [ ] Design reference captured: screenshots of every page at 3 breakpoints into `design-reference/`
- [ ] Design tokens as code (colors, Signika, spacing, breakpoints, button style)
- [ ] Repo scaffold: Next.js (App Router, TS) + embedded Sanity Studio v6 [needs Sanity project]
- [ ] Shared schema objects (`seoFields`, `link`, `sectionSettings`, image+alt)
- [ ] CI: build + type-check + lint on push
- [ ] Walking skeleton: one content type end to end (schema -> block -> frontend render -> SEO fields -> live preview -> deployed to staging) [needs Sanity + Vercel]
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
