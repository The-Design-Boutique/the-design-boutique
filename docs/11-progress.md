# Progress Board

The always-current view of what is done, in progress, and left. Git log says what changed; this says where we are. Updated on every task. Read top to bottom for status.

Last updated: July 24, 2026.
Current phase: **Phase 3 (pages & migration) IN PROGRESS.** Phases 0, 1 and 2 are complete: the homepage matches the live site section by section at desktop and mobile, and nested routing is live.

Phase 3 status:
- **All 30 top-level pages built and live on staging.** The full site map (from the live WP sitemaps) is rebuilt: home, about (+ Vision & Values, saliXus Process Advantage, Team, Case Study Oro, Case Study Argenti), solutions (parent) + all 10 service pages, Work, Programs, Video Content Expansion Packages, Gold, Trusted, Testimonials, More Testimonials, Contact (+ Thank You), Blog (hero), Privacy Policy, ADA Compliance. A live tracking sheet (Page Title / Staging URL / Live URL / Status) is maintained in TDB's Google Drive.
- Block library grew to 27 types: two new blocks added this phase for pages with no reuse fit: `teamGrid` (photo + name + role cards, for /about/team) and `videoGrid` (click-to-play video thumbnail grid, for /testimonials). Everything else was built by reusing existing blocks + optional field variants.
- Known QC / follow-up items (pages are up; these are refinements): Programs tier cards show positioning taglines, not the full feature matrices (want a dedicated pricing-card block); Vision & Values renders the 6 values as a 3-col grid; Gold lists the 18 episodes as text (wants event cards + thumbnails + individual /gold/{slug} pages); ADA body is the live site's placeholder lorem ipsum, migrated verbatim, pending real copy.
- Content migration still pending (collections, separate from the page shells above): 0 of 53 blog posts (Blog listing is a hero shell until these land), 0 of 14 clients, 0 of 18 gold event detail pages. Testimonials created by hand as pages needed them: Joe Montana, Michelle Hoover, Red Hale, Virg C, Bimo O, Emit O, David L, Dr. Lilah B, SG.

CI still pending Angelo's workflow-scope auth. Sequencing: strictly linear by phase (Angelo's call).

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

- [x] Design-system CSS (containers, sections + background variants incl. forest, grids, buttons, cards, prose) on top of the tokens.
- [x] BlockRenderer (`_type` -> component).
- [x] Block components: all 22 built and wired into the BlockRenderer (hero, subpage banner, rich text, services grid, icon grid, solutions row, CTA band, stats, FAQ, logo wall, video, testimonial single + carousel, portfolio mosaic + auto loop, client info + solution, image gallery, flip boxes, contact form, newsletter, HTML). Flip boxes and mobile nav respect prefers-reduced-motion / responsive.
- [x] Global header (logo, menu, "Hire Us!" CTA, responsive mobile toggle) + footer, driven by the navigation singleton. Studio kept chrome-free via an `app/(site)` route group.
- [x] Home page renders end to end from the CMS via `pageBuilder`; verified against the reference design (dark/Signika/orange, services grid, forest CTA, stat counters, Joe Montana testimonial, FAQ, contact form, footer).
- [x] Functional contact form: client form -> `/api/contact` -> stored as `formSubmission` docs (visible in the WP-style desk). Email notification is a later add.
- [~] Media migration (started, per Angelo's feedback that the render lacked imagery): migrated the key homepage assets from the live site into Sanity (logo, hero background IMG_2104, Big-Leafe + tree-cutout forest artwork, Laney preview). Wired the logo into the header and the hero background + Laney video into the home hero. More media (client logos, section imagery) to follow.
- [x] Signature "Laney Said" video ring: real Laney YouTube video in a circular frame with the spinning "PLAY VIDEO" text ring, matched to the live hero (verified desktop + mobile).
- [x] Full homepage exact-match against the live site, section by section, iterated with Angelo: hero (real sunset bg + rectangular video + Laney play badge), services grid (real line-art icons, outlined cards, photo hover, redwood leaf), About (tree-cutout composite, Vision/Mission + squiggle), logo wall (real client logos, single row), forest CTA (Madron Canyon), Industries (two-column stats + cards, corrected 58/93/8.5B/68), Work (portrait boxes + overlaid labels), testimonial (quote-mark layout + squiggle), FAQ (leaf + filled bars, white/orange hover), algorithms + contact (two-column, orange-placeholder form). New blocks: `aboutSection`, `industriesSection`, `workShowcase`.
- [x] Header rebuilt: dual logo (The Design Boutique + TDB Digital), Programs/Blog nav, "Hire Us! +", phone, transparent over hero + solid on scroll.
- [x] Footer rebuilt: logo + social icons (real Google-reviews SVG), Solutions two-column links, About/Vision groups, "We can't wait to connect", "Stay in the know." newsletter, legal bar. Per-column link weights match live.
- [x] Back-to-top button matching the live `#scroll-to-top` styling.
- [x] Media migration completed for the homepage: all real assets pulled from the live site into Sanity (hero images, icons, client logos, portfolio images, forest/leaf artwork, logos, Google badge).
- [x] Mobile responsive pass: hamburger menu, all sections stack, no horizontal overflow at 390 (phone) / 768 (tablet); hero clears the fixed header.
- [x] Nested routing: catch-all `app/(site)/[...slug]` resolves pages by full-path slug (e.g. `solutions/seo-services`). Verified: a 2-segment nested page returns 200 and renders; unknown paths 404. Interior pages set `slug.current` to the full path.
- [ ] next/image optimization (still using plain `<img>`) — deferred to Phase 5 (performance).

Phase 2 is functionally complete: the homepage matches live at all breakpoints and nested routing is in place. Moving to Phase 3.

Reset on approach (Angelo feedback): the earlier homepage was a media-less approximation. Rebuilt reference-driven with real migrated media, verified against the live site section by section at desktop AND mobile.

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
