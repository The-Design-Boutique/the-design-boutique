# Progress Board

The always-current view of what is done, in progress, and left. Git log says what changed; this says where we are. Updated on every task. Read top to bottom for status.

Last updated: July 28, 2026.
Current phase: **Phase 4 (SEO tooling) IN PROGRESS.** Phases 0 to 3 are complete: the full site is
rebuilt on staging, all content is migrated, and category archives are live.

Phase 4 at a glance: 2.2 and 2.4 are delivered and documented. 2.5 is code-complete apart from the
AI suggest route, which ships dark by rule 21. **2.3 is the only SOW deliverable not started, and it is
now unblocked**: Search Console access was granted and verified July 28, 2026, returning real query
data for thedesignboutique.com.

Phase 3 status:
- **All 30 top-level pages built and live on staging.** The full site map (from the live WP sitemaps) is rebuilt: home, about (+ Vision & Values, saliXus Process Advantage, Team, Case Study Oro, Case Study Argenti), solutions (parent) + all 10 service pages, Work, Programs, Video Content Expansion Packages, Gold, Trusted, Testimonials, More Testimonials, Contact (+ Thank You), Blog (hero), Privacy Policy, ADA Compliance. A live tracking sheet (Page Title / Staging URL / Live URL / Status) is maintained in TDB's Google Drive.
- Block library grew to 27 types: two new blocks added this phase for pages with no reuse fit: `teamGrid` (photo + name + role cards, for /about/team) and `videoGrid` (click-to-play video thumbnail grid, for /testimonials). Everything else was built by reusing existing blocks + optional field variants.
- Known QC / follow-up items (pages are up; these are refinements): Programs tier cards show positioning taglines, not the full feature matrices (want a dedicated pricing-card block); Vision & Values renders the 6 values as a 3-col grid; Gold lists the 18 episodes as text (wants event cards + thumbnails + individual /gold/{slug} pages); ADA body is the live site's placeholder lorem ipsum, migrated verbatim, pending real copy.
- Content migration DONE: 53 blog posts (root-level URLs + index grid), 14 clients (/portfolio/{slug}), 18 gold events (/gold/{slug}). Testimonials created by hand as pages needed them: Joe Montana, Michelle Hoover, Red Hale, Virg C, Bimo O, Emit O, David L, Dr. Lilah B, SG.
- **Remaining Phase 3 gap: post categories.** Live has 8 category archives in its sitemap (Branding 52 posts, Content Marketing 47, SEO 46, Mindset 19, Blog 7, Golden Hour 7, Client Love 4, Full Width Scenic 2). Sanity has 0 categories and no post is categorised; `post.category` is a single reference but live posts carry several, so it needs to become an array. `/category/{slug}` archives are not built.
- URL parity vs the live sitemap: **81 of 90 live URLs resolve on staging.** The 9 that do not are the 8 category archives plus `/locations.kml` (a Rank Math local-SEO artifact, superseded by the 2.5 local-schema work).

CI still pending Angelo's workflow-scope auth. Sequencing: strictly linear by phase (Angelo's call).

## Status at a glance

- Docs and management system: in place.
- Git repo: PUBLIC at github.com/The-Design-Boutique/the-design-boutique, default branch `main`. Working via `phaseN/*` branches and draft PRs at review gates.
- Sanity: project `inapmf9l` ("the-design-boutique"), dataset `production` (public). Access via an Editor API token in `.env.local` (gitignored). Note: the claude.ai Sanity connector is stale (cannot manage this project), so project-admin actions (CORS, etc.) need Angelo via the UI or an admin-scoped token.
- Not blocked. `SEO_AI_SECRET` is set on Vercel, rule 21 is decided (Laney's key, Laney's budget;
  Angelo demos with his own), and Search Console access was granted and verified July 28, 2026,
  which unblocks 2.3.
- Blocked on Laney for: real ADA Compliance copy (she has it, promised before production). 2.3 SEO Health panel is SIGNED OFF as of July 27, 2026.

## Needed from Angelo to unblock (you provide access)

0. **Search Console credentials for the deployed cron.** The panel's search section
   is built but dark. It needs `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET` and
   `GSC_REFRESH_TOKEN` in the environment. Recommendation: use a Google service
   account added as a Search Console user, not a personal OAuth token. All tooling
   becomes the client's property on final payment, and an integration resting on
   Angelo's personal Google account breaks the day he stops maintaining it.

1. Sanity CORS: MOSTLY RESOLVED. `http://localhost:3333` is already an allowed origin, so run the
   dev server on that port (`PORT=3333 npm run dev`) and the Studio connects. Other ports do not.
   Adding new origins still needs Angelo: the Editor token lacks the CORS grant and the connector
   is stale.
2. Vercel (blocking for deploy): import the (now public) GitHub repo into the TDB Vercel account. Add `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and the Sanity token as Vercel env vars (I will give the exact values). Add the resulting Vercel URL to Sanity CORS.
3. GitHub: DONE. Repo public, `main` default.
4. Sanity project + token: DONE (project inapmf9l, Editor token stored locally).
5. **Google Search Console access for thedesignboutique.com — STILL BLOCKING 2.3.** Re-verified
   July 28, 2026: the property now *appears* for our account, as `siteUnverifiedUser`, which is
   progress on the July 27 position where it did not appear at all. But it is listed, not granted:
   an actual data request returns HTTP 403, "user does not have sufficient permission". Being able
   to see a property is not the same as being able to read it. The SEO Health panel needs the site's
   own Search Console data.
   Laney (or whoever owns the property) needs to add our Google account as a user at
   search.google.com/search-console → Settings → Users and permissions. Full or Restricted both work
   for reading. This is SOW section 7 access.

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

- [x] 30 pages rebuilt in the block builder, each matched to reference
- [x] Migrate 53 posts (blog template, root-level URLs, index grid). 8 posts are
      hand-built HTML and keep their own markup with scoped CSS; the other 45 are
      Portable Text. Verified against live for text, tables, rows, list items,
      images and headings.
- [x] Migrate 14 clients (portfolio case studies at /portfolio/{slug}: Industry /
      Services rail, cover image revealing the client site on hover, masonry gallery)
- [x] Migrate 18 gold events (event pages at /gold/{slug}: presenter, video,
      share row, promo sidebar, More from Gold Events)
- [x] Redirect map for the live URLs that redirect (4):
      `/connect` → `/contact`, `/vision-values` → `/about/vision-values`,
      `/solutions/geo-ai-services` → `/solutions/geo-services`,
      `/solutions/content-marekting-services` → `/solutions/content-marketing-services`
      (the last is a live typo that resolves). Mirrored as 308s in next.config.ts.
- [ ] Content parity crawl vs live (URLs + visual)
- [ ] Phase 3 QC + review gate

### Internal link crawl (84 pages / 116 links)

Zero broken. The 32 detail pages resolve (18 gold, 14 portfolio) and the four
live redirects return 308 to a 200. Re-run
`python3 linkcheck.py` after any content change; treat 3xx to a live target as a pass.

## Phase 4 — SEO tooling

### Client documentation is part of Done for every 2.x deliverable

**Every one of 2.2, 2.3, 2.4 and 2.5 ships with its own PDF guide. A feature is not
done until its PDF exists.** Angelo hands these to the client, so they are written
for content and SEO people, not developers.

Rules for these guides:
- Plain language. No jargon, no code, no API names, no file paths. If a technical
  term is unavoidable, explain it in one short sentence the first time it appears.
- Explain **what it does, why it matters, and how to use it**, in that order.
- **Include screenshots** of the actual panel wherever a step is easier to see than
  to describe. Annotate them if it helps.
- Written so the client can follow it with no one sitting next to them.
- No emdashes. No mention of the tooling used to build it.

Output location and naming (fixed, do not change):

```
~/Desktop/TDB SEO Tooling/
    2.2 Core Web Vitals Dashboard.pdf
    2.3 SEO Health Panel.pdf
    2.4 SEO Fields.pdf
    2.5 SEO Toolset.pdf
    Forms.pdf
```

Status of the folder as of July 28, 2026: 2.2, 2.4, 2.5 and Forms are all present.
2.5 now carries real Studio screenshots. 2.3 follows its build. Note that this
sandbox can create new files in that folder but cannot overwrite existing ones,
so updated versions of 2.2 and 2.4 have to be handed over and dropped in by hand.

- [x] 2.2 CWV dashboard + snapshot cron  →  PDF: `2.2 Core Web Vitals Dashboard.pdf` DONE
      Live in production, daily cron at 06:00 UTC, both field and lab collecting.
      Note: the live origin has **no CrUX data** (below Google's publishing threshold,
      verified across every origin variant and at page level). The field panel shows the
      honest empty state and will populate on its own if traffic grows. A lab section via
      PageSpeed Insights (permitted by rule 5, never sets the pass/fail bands) gives the
      client something actionable today. The lab test measures whatever the deployment
      serves, so it needs no config change at go-live.
- [x] 2.3 SEO Health panel (GSC + Lighthouse + in-CMS checks) BUILT  →  PDF: `2.3 SEO Health Panel.pdf` still to write
      All three sources land in one issue list on the SEO tab, grouped as content
      (our instant checks), technical (Lighthouse) and search presence (Search
      Console), each with a severity and a field it maps to. Google data is fetched
      by a daily cron and cached as `seoAudit` documents, so the Studio never calls
      Google and no key is near a browser.
      Two things worth recording. Audits run in concurrent batches against a clock
      rather than a fixed page count: a page Google has not cached takes about
      twenty seconds and one it has takes under a second, so a fixed count either
      times out or wastes the budget. Ten at a time covers this site in under a
      fortnight on the first pass and minutes thereafter. And the Lighthouse audit
      "page is blocked from indexing" is suppressed while staging is noindex, since
      it fails on every page by design and would train editors to ignore the panel.
      Search Console is wired but not connected: it needs credentials the server can
      hold. See the note below, because whose credentials matters.
- [x] 2.4 SEO field stack verified across all content types  →  PDF: `2.4 SEO Fields.pdf` DONE
      The stack existed but most of it never reached the page. Now renders canonical,
      robots, full Open Graph with image, the complete X/Twitter card, and per-type
      JSON-LD on every route. Category archives gained the SEO group. Added a live
      preview of the structured data output (Laney's request).
      Migration note: 122 documents had no SEO title or description because the
      original import brought page bodies but not the Rank Math metadata; migrated
      from live. Description coverage 111/115, the rest have none on live either.
      Also removed an orphaned `seo.metaTitle` field my import scripts had written
      to 114 documents; the schema field is `seo.title`.
- [ ] 2.5 score, readability, sitemap, redirects/404, fallbacks, local schema, content assist, CWV trending  →  PDF: `2.5 SEO Toolset.pdf`
    - [x] §3 XML sitemap + robots (123 URLs, staging noindex holds)
    - [x] §5 canonical / OG fallbacks (delivered with 2.4)
    - [x] §6 local SEO: `officeLocation` singleton, LocalBusiness JSON-LD on Contact
    - [x] §1 on-page score, §2 readability, §7 deterministic assist (heading hints).
      One shared check library in `app/lib/seo/`, as rulesets 05§5 and 03§7 require,
      surfaced as an SEO tab on page/post/client/goldEvent. Verified against all 83
      real pages and posts: every document resolves exactly one h1 and a non-zero
      word count, and the score discriminates (keyword genuinely the topic 85,
      merely present 75, absent 45). Two bugs found by that run and fixed rather
      than shipped: the document title was counted twice in the word total, and the
      density advice rounded to "0.5%, aim for at least 0.5%".
    - [x] §7 AI layer settings: provider + model + API key in Site Settings.
      The key is encrypted (AES-256-GCM against `SEO_AI_SECRET`) because the
      `production` dataset is **public**: an unauthenticated API request returns
      documents, so a raw key in a document would be a published key. Only
      ciphertext plus a masked hint are stored. Ships dark per rule 21.
    - [ ] §7 the AI suggest route itself. Needs `SEO_AI_SECRET` on Vercel, and
      rule 21's "whose key and whose budget" recorded in ruleset 05 before enabling.
    - [x] §4 redirect manager + 404 monitor. `redirect` and `notFoundEntry` types,
      runtime redirects in `proxy.ts` (Next 16's replacement for middleware) reading
      a 60s-cached, authenticated map from Sanity and failing open, a Dead Links tool that
      turns a 404 into a redirect in one click, publish-time prompt to leave a 301
      when a live page changes address, and a daily prune holding the log to 1,000
      distinct paths. Chain flattening and loop prevention are covered by 25 tests
      (`npm test`), which now runs something real instead of exiting 1.
    - [x] §9 CWV trending charts. Per metric, per device, with Google's thresholds
      shaded behind the line, 30/90/all-time ranges, and a plain-English trend
      sentence. Backfilled weekly points and daily ones are visually distinguished
      and the handover labelled, per rule 24. Seeding route added for the CrUX
      History API. Two facts worth recording: the History API returns 25 weekly
      periods, not the ~40 rule 23 assumes; and it returns 404 for
      thedesignboutique.com, so there is no field history to seed until the site
      gets more traffic. The charts fall back to the daily lab readings, clearly
      labelled as not counting towards rankings. Seeding and chart logic were
      verified end to end against a control origin with real history.
    - Worth knowing: the dataset ACL reads as "public", but only `siteSettings`,
      `navigation`, `officeLocation` and the asset types are actually readable
      without a token. `page`, `post`, `client`, `goldEvent`, `redirect` and
      `notFoundEntry` are not, and an unauthenticated query returns an empty set
      rather than an error. Anything reading content outside the Studio needs the
      token. The AI key still has to be encrypted, because `siteSettings` is one
      of the types that IS world readable, and that is where the key lives.
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

## Backlog — suggestions to raise with Laney

- **Dynamic Google reviews on /more-testimonials.** Researched and documented July 27, 2026;
  written up for Laney as `Google-Reviews-Integration-Options.pdf`. Summary:
  - The Places API is the wrong tool: capped at 5 reviews, and Google's terms forbid storing
    review text at all (Maps ToS 3.2.3(a); the only Places caching allowance is lat/lng for 30 days).
    So no scheduled sync into Sanity via that route.
  - **Recommended: Google Business Profile API.** Returns every review, allows replies, is free, and
    uniquely permits caching review content for up to 30 days. Needs a verified profile 60+ days old,
    manager access granted to an account we control, and an access request submitted by an owner or
    manager. Google's published review time is 14 days and is the long pole, so file early.
  - Fallback needing nothing from the client: **Places UI Kit** web component, $1 per 1,000 with
    10,000 free per month, but only 5 reviews and Google-controlled markup.
  - Staying on TrustIndex costs $65 to $349/yr; the free tier withholds review schema and lazy
    loading, both of which matter to this project's SEO and CWV scope.
  - Either way Google requires reviewer attribution, a link to the original review, disclosure of any
    ordering or filtering, the Maps logo, and verbatim review text.

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Signature motion (video ring, forest motif) hard to match exactly | Design fidelity | Build as isolated components early; diff against reference; flag any true blockers |
| 700MB / 4,600 image library hurts performance | Core Web Vitals | Migrate only referenced assets; next/image, modern formats; measure on staging |
| WP editors resist Sanity | Adoption / trial outcome | WP-familiarity ruleset enforced per DoD; editor guide; test with a WP lens |
| Laney declines the free 2.3 panel or wants paid Semrush | Scope | Panel UI is source-agnostic; decision isolated to ruleset 03; rest of build unaffected |
| Fixed-fee trial vs large scope | Time | Strictly linear phases with review gates; record effort as the reusable estimate for future client builds |
| Legacy-site security finding (tracked privately) | Client security, not our build | Disclosed to client; we reuse media only, never legacy PHP; staging is a clean room |
