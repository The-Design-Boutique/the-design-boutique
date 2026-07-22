# Build Plan: thedesignboutique.com on Sanity + Next.js

Written July 21, 2026 from three inputs: the signed SOW (kept privately), a full audit of the WordPress import at `~/Sites/tdb`, and the house block architecture in `~/sanity-headless/ultimate-mortgage-studio`. Status: awaiting Angelo's review. Assumptions are collected in the final section; nothing here is built yet.

---

## 0. Legacy-site security note

A security finding on the legacy WordPress site was identified during the migration audit and disclosed to the client privately. The details are documented outside this repository. It does not affect the rebuild (no legacy PHP is carried forward), and per the SOW the live site is not touched.

## 1. What we are rebuilding (inventory)

- 30 published pages: Home, About (+5 children incl. two case studies and the saliXus process page), Solutions (+10 service children: SEO, GEO, AI Search Optimization, CRO, Content Marketing, Email Marketing, Website Design, Brand Naming, Brand Identity, Ad Campaign), Programs, Video Packages, Work, Testimonials x2, Gold, Trusted, Contact (+Thank You), ADA, Privacy, and the blog page branded "Laney Said".
- 53 published blog posts, 14 portfolio items (CPT labeled "Clients", taxonomy client-category), 18 Gold Events (video/talk series, one custom field: presenter).
- Current stack: Elementor Pro on a blank theme, ACF for the CPTs, Rank Math Pro, Gravity Forms + Elementor forms, MailChimp, Google Site Kit. No WooCommerce.
- Design tokens (from Elementor's Default Kit): dark theme, near-black `#070707` background, dark gray `#202020`, white text, orange accent `#F26722`, gray `#363636`, off-white `#E3E3E3`; one typeface, Signika (Google Fonts), 700 for headings, 400 body; square buttons (radius 0); full-bleed containers with 50px side gutters. Signature elements: the forest/leaf brand motif, the "Laney Said" spinning play-video ring, and a first-class Joe Montana endorsement.
- Nav: header menu with dropdowns (About, Solutions, Programs, Work, Testimonials, Blog, Contact) plus "Hire Us!" CTA to /contact; three flat footer menus. Nested URL structure (`/about/team/`, `/solutions/seo-services/`) to be preserved.

## 2. Content model

### 2.1 Documents

| Type | WordPress analog | Notes |
|---|---|---|
| `page` | Pages | Block builder (section 2.2) + `seoFields`. Supports parent reference for nested URLs. |
| `post` | Posts ("Laney Said") | Portable Text body, featured image, category, author, `seoFields`. |
| `client` | Portfolio CPT ("Clients") | Work/case-study items; `clientCategory` reference; builder for the detail layout. |
| `goldEvent` | Gold CPT | Title, video, presenter, date, `seoFields`. |
| `testimonial` | testimonial widgets/CPT | Quote, name, role/company, image, video url, featured flag (Joe Montana = featured). |
| `category`, `clientCategory` | taxonomies | Flat reference documents. |
| `navigation` | Menus | Singleton; header tree (two levels) + three footer lists + CTA button. Lifted from the complete-sites studio pattern. |
| `siteSettings` | Customizer/options | Singleton: logo, contact info, social URLs, default share image, GTM id, MailChimp audience pointer. |
| `redirect`, `notFoundEntry` | Rank Math redirections | Per ruleset 05. |
| `officeLocation` | n/a | Per ruleset 05 (LocalBusiness schema). |
| Operational: `cwvSnapshot`, `seoAudit`, `formSubmission` | n/a | Per rulesets 02/03; form submissions stored + emailed. |

### 2.2 Blocks (the heart of the build)

Conventions copied from `ultimate-mortgage-studio`: one file per block in `schemaTypes/blocks/`, `type: 'object'`, registered in the flat schema array, listed explicitly in the page's `pageBuilder` array, page-level defaults that blocks may override, enum-string fields for variants resolved to styles in the frontend, `preview` on every block.

Extensions beyond the reference (it is intentionally lean; TDB needs more): images with required alt inside blocks, two shared objects (`link` internal/external, `sectionSettings` for background variant including the forest motif, spacing, and anchor id), an icon per block type so the insert menu reads like Elementor's widget panel, and Portable Text instead of markdown for prose (WordPress editors expect a visual rich-text editor, not markdown).

The 61 saved Elementor "TDB -" sections distill to ~21 blocks:

| Block | Rebuilds |
|---|---|
| `heroHome` | Home hero with video ring / forest motif |
| `subpageBanner` | "TDB - Subpage Banner" |
| `richText` | text-editor content, Portable Text |
| `servicesGrid` | "TDB - Services Grid" |
| `iconGrid` | "TDB - Icon Grid (+ Box)" |
| `solutionsRow` | "TDB - Solutions" Block/Box/Row variants (media side, video, tall) as one block with layout enum |
| `logoWall` | solutions logos, "Trusted" logos |
| `portfolioMosaic` | "TDB - Portfolio Row" mosaic |
| `portfolioLoop` | "TDB - Portfolio Loop" (auto-feeds from `client` docs) |
| `clientInfo` | "TDB - Client Info" detail header |
| `clientSolution` | "TDB - Client Solution" |
| `testimonialCarousel` | testimonial-carousel widget (feeds from `testimonial` docs) |
| `testimonialSingle` | Joe Montana / single quote feature |
| `statsCounters` | counter widget rows |
| `faqAccordion` | nested-accordion (pairs with FAQPage schema type from ruleset 04) |
| `videoEmbed` | video widget / Gold event embeds |
| `ctaBand` | "Are you ready to win? Let's talk!", Contact CTA |
| `contactForm` | Gravity/Elementor forms replacement (section 5) |
| `newsletterSignup` | MailChimp signup + disclaimer |
| `imageGallery` | gallery widget |
| `flipBoxGrid` | flip-box features |
| `htmlEmbed` | escape hatch, mirrors `lpHtml` |

Rule: no page-specific one-off blocks. If a layout appears once, it is still built as a configurable block; if a need cannot be met, the `htmlEmbed` escape hatch covers it until a proper block is added.

## 3. WordPress-familiarity ruleset (the editors' experience)

TDB staff and their clients live in WordPress. Every Studio decision optimizes for "feels like WP admin":

1. Desk structure mirrors WP admin's left nav, in this order: Dashboard (the CWV view from ruleset 02), Pages, Laney Said (posts, using their brand name), Clients, Gold Events, Testimonials, Navigation, Site Settings, SEO Tools (redirects, 404 log, SEO Health panel entry point). WP terminology throughout: "Pages", not "page documents".
2. The block insert menu is the Elementor widget panel analog: every block has an icon, a human title, and blocks are grouped (Content, Media, Marketing, Advanced). Insert menu uses grid view with icons.
3. Editing prose is visual: Portable Text with a WP-like toolbar (headings, bold/italic, lists, links, blockquote, image). No markdown anywhere editors touch.
4. Preview is one click: the Presentation tool (visual editing) wired to the Next.js frontend, so "Preview" behaves like WP's preview button, with live editing overlays as a strict upgrade.
5. Drafts and publishing match WP mental models: draft until Publish is pressed; scheduled publishing available; revision history surfaced (Sanity has it natively).
6. Featured image, excerpt, categories on posts appear in the same conceptual slots WP puts them.
7. Every field has a plain-English description written for Laney's team. No developer jargon in titles or descriptions.
8. Slug fields display the full resulting path (with parent prefix) so editors see the URL exactly as WP shows permalinks.

## 4. Frontend

- Next.js App Router, TypeScript, per `01-architecture.md`. Studio embedded at `/studio` so one Vercel deploy carries both.
- Catch-all route resolves nested page paths from the `page` parent chain, preserving current URL structure exactly (`/solutions/seo-services/` etc.), so an eventual go-live needs no redirect map for pages. Blog at `/blog/{slug}` mirroring current permalinks (verify WP permalink base for posts during migration; add redirects if they differ).
- One `BlockRenderer` mapping `_type` to a React component per block; components in `components/blocks/`. This does not exist in the reference workspace and is built fresh.
- Design system from the extracted tokens: dark theme, Signika via `next/font`, orange accent, square buttons, full-bleed sections with the 50px gutter rhythm. The forest motif and video-ring are built as reusable presentational components. Bootstrap/jQuery are not carried over; plain CSS (or Tailwind mapped to the tokens) replaces them.
- Globally noindex during staging; sitemap, redirects, canonical/OG fallbacks per rulesets 04/05.
- ADA: the current site has an ADA Compliance page; the rebuild targets WCAG 2.1 AA (semantic landmarks, contrast checked against the dark palette, keyboard nav, reduced-motion respect for the ring/motion elements).

## 5. Integrations

- Forms: `contactForm` block posts to a Next.js route; submissions stored as `formSubmission` documents and emailed to the address in Site Settings. Replaces Gravity Forms with a spam honeypot + rate limit. (Assumption 5 below.)
- Newsletter: `newsletterSignup` posts to MailChimp's API using their existing audience.
- SEO tooling: rulesets 02 through 05 (CWV dashboard, SEO Health panel, SEO fields, Rank Math-style toolset) integrate as specified in those docs. Note for the walkthrough: the team already uses Rank Math Pro, so our toolset mirrors what they know by design. Semrush is intentionally not integrated (see ruleset 03).
- Analytics: GTM id in Site Settings (they currently use Site Kit; GA4 + Search Console remain Google-side).

## 6. Migration

1. Media: upload only referenced assets (about 420 tracked attachments of the 4,600 files; skip WP-generated size variants), preserving alt text from the DB.
2. Posts (53): scripted. WP DB post_content (Elementor-free posts) converts HTML to Portable Text; featured images, categories, dates, authors carried over. The ~15 hand-written Rank Math titles/descriptions migrate; everything else gets template-generated meta per ruleset 04 fallbacks.
3. Clients (14) and Gold Events (18): scripted skeletons (title, slug, media, presenter, category), then hand-finished with blocks where the detail pages need layout.
4. Pages (30): rebuilt by hand in the block builder. Elementor JSON is not worth machine-translating at this volume; hand-rebuilding is faster and is also the QA pass. Copy comes from the live content per SOW 2.1 (existing copy where it applies).
5. Encoding hygiene: decode HTML entities (`&amp;`) on all migrated strings.

## 7. Sequence (SOW weeks)

- Week 1: repo scaffold (Next.js + embedded Studio v6 [assumption 2], git init), design tokens + base layout, shared objects, `page`/`post`/`client`/`goldEvent`/`testimonial`/`navigation`/`siteSettings` schemas, the ~21 blocks with previews and icons, desk structure, seoFields (ruleset 04), post/media migration scripts running.
- Week 2: BlockRenderer + all block components, nested routing, nav/footer, home + service page templates assembled, SEO score/readability components, sitemap, redirect manager + 404 monitor, canonical/OG fallbacks.
- Week 3: CWV dashboard + snapshot cron (ruleset 02), SEO Health panel (Google Search Console + Lighthouse audit collection + in-CMS check suite, ruleset 03), remaining pages rebuilt, Gold + Testimonials + Work sections complete, content assist (hybrid).
- Week 4: full content parity pass against the live site, cross-browser QA, accessibility pass, performance pass (image formats, font loading, Core Web Vitals on staging), walkthrough prep and the training session (SOW 2.6).

## 8. Assumptions and open questions for Angelo's review

1. **Blocks reference**: the studio you pointed to (`complete-sites-marketing--studio`) contains no blocks; it is a markdown blog CMS. The real block architecture lives in its sibling `ultimate-mortgage-studio` (8 `lp*` blocks + pageBuilder array), and this plan copies that pattern with the extensions in section 2.2. Confirm that sibling is the pattern you meant.
2. **Studio version**: reference is Sanity v5; the plan assumes we scaffold current v6 (same schema/config surface, per the July verification). Say the word if you want to pin v5 to match the reference exactly.
3. **Portable Text over markdown**: deviates from the reference deliberately, for WP-familiar editors. Confirm.
4. **Design direction**: plan assumes we rebuild the current brand identity (dark/Signika/orange, forest motif, video ring) modernized, not a redesign. SOW says design direction is confirmed with you before build; this is that question, and presumably Laney's.
5. **Forms**: native form block + stored submissions + email notification, replacing Gravity Forms. Email delivery provider for notifications needs a decision (client's own SMTP/provider vs a transactional service on their account).
6. **Legacy-site security finding** (section 0): client disclosure handled separately (private).
7. **Draft content**: 27 draft posts, 4 draft clients, 2 draft pages exist in WP. Plan migrates published only; drafts on request.
8. **Gold Events + video testimonials**: modeled as documents (not pages) rendering into the Gold template; the disabled `video-testimonial` CPT is treated as dead. Confirm.

## 9. Verification (definition of done for the build)

- Content parity: every published page, post, client, and gold event from the inventory exists on staging with matching URL path; automated crawl compares the two sitemaps.
- Editor acceptance: a TDB-staff-shaped test run: create a page from blocks, edit a post, reorder sections, preview, publish, add a redirect, read the CWV dashboard, resolve an SEO Health issue. Each flow works without developer help.
- Rulesets 02 through 05 definitions of done all met (each doc carries its own).
- Verification greps: no emdashes, no agency branding, staging noindex header present on every route.
