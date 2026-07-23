# Progress Board

The always-current view of what is done, in progress, and left. Git log says what changed; this says where we are. Updated on every task. Read top to bottom for status.

Last updated: July 22, 2026.
Current phase: Phase 1 COMPLETE (content model + 22 blocks). Next: Phase 2 (frontend rendering & design system). Phase 0 live on staging; CI pending Angelo's workflow-scope auth. Sequencing: strictly linear by phase (Angelo's call).

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
- [x] Repo scaffold: Next.js 16 (App Router, TS) + embedded Sanity Studio v6. Verified end to end: clean production build; home renders on-brand; Studio embeds AND connects to project inapmf9l (CORS added for localhost:3009; login screen shows the project).
- [x] Shared schema objects: `seoFields` (full SOW 2.4 stack + char/pixel counter inputs), `link`, `sectionSettings`, `imageWithAlt`. Verified: clean build; `page` type using them created + read back via the API.
- [~] CI: workflow written and build-verified, but pushing `.github/workflows/` is blocked until Angelo runs `gh auth refresh -h github.com -s workflow` (the GitHub token lacks the `workflow` scope). Add the moment that's granted.
- [x] Walking skeleton: complete end to end. `/[slug]` route renders a page from Sanity (title + Portable Text body) with SEO metadata (title/description/canonical/OG) from the shared `seoFields`. Verified locally at `/home` from the seed page; deployed to staging.
- SEO editor UX: flattened the SEO tab (no nested collapsibles; only "Advanced" tucked away) per Angelo's feedback. Full Rank-Math-style SERP-preview panel is Phase 4 (SOW 2.5).

Known items to revisit:
- [ ] Deferred to Phase 1: desk icons (`@sanity/icons` export not resolvable under Turbopack yet; solve with the WP-familiar desk).
- [ ] Frontend reads use the write token server-side (works, secure). Later: create a dedicated read-only token, and sort out true public reads for CDN caching (dataset shows `public` but unauthenticated reads return nothing, a newer Sanity access setting). Add revalidation.
- [ ] Phase 0 QC + Angelo review gate

## Phase 1 — Content model & blocks

- [x] Content document types: `page`, `post` (Laney Said), `client`, `goldEvent`, `testimonial`, plus taxonomies `author`, `category`, `clientCategory`, and singletons `siteSettings`, `navigation`. All routable types carry the shared SEO stack. (Operational docs, `officeLocation`, `redirect`, `notFoundEntry`, `cwvSnapshot`, `seoAudit`, are built with their Phase 4/5 features.)
- [x] WP-familiar desk structure (`sanity/structure.ts`, emoji icons): Pages, Laney Said, Clients, Gold Events, Testimonials, a grouped Taxonomies section, then pinned Navigation + Site Settings. Singletons cannot be created/duplicated/deleted (WP-settings behavior).
- [x] Page-builder blocks: 22 block types built (hero, subpage banner, rich text, services grid, icon grid, solutions row, stats/counters, FAQ accordion, image gallery, flip boxes, logo wall, portfolio mosaic, portfolio loop, client info, client solution, testimonial carousel, testimonial single, video, CTA band, contact form, newsletter, HTML embed). Each with a preview and shared `sectionSettings`. Registered and wired into the page `pageBuilder` with a grid insert menu (WP-widget feel). Verified: clean build + type-check.
- [x] Phase 1 QC: build + type-check green; schema loads. (Visual/editor QC happens when rendering lands in Phase 2.)

Note: the page's simple `body` was replaced by `pageBuilder`. The `/[slug]` route still renders the seed page's legacy body, so `/home` keeps showing content; block rendering (BlockRenderer) is Phase 2, at which point the seed page migrates to blocks.

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
