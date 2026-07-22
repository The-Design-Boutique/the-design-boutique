# TDB Sanity Rebuild

## Project Owner
personal

Git email: lpangm03@yahoo.com. This is a personal contract engagement between Angelo (contractor) and The Design Boutique, Inc. (Laney Silverman, CCO). Do not reference any agency or company on Angelo's side in commits, docs, or deliverables.

## What This Is

Staging/dev rebuild of thedesignboutique.com from WordPress onto Sanity CMS + Next.js, hosted on Vercel as a staging environment. The live site (WP Engine) stays up and untouched. No go-live under this SOW.

- SOW: fixed-fee, fixed scope, 4 weeks from kickoff. SOW document and commercial terms are kept privately, not in this repo (prepared July 20, 2026).
- This is a paid trial project. Laney is evaluating both the working relationship and Sanity as a platform direction for her agency. Future client rollouts would be separately scoped.
- Change orders only apply if a request is really a different project (other client domains, go-live cutover, WooCommerce work). Reasonable adjustments within the build are included in the flat fee.

## Current Status (July 21, 2026, late)

- Docs phase complete, including the full build plan (`docs/06-build-plan.md`). No code exists yet; awaiting Angelo's morning review of the plan.
- WP import audited at `~/Sites/tdb` (LocalWP, live MySQL `wp_tdb`): 30 pages, 53 posts, 14 clients, 18 gold events, Elementor Pro + ACF + Rank Math Pro. Legacy-site security findings are tracked privately (not in this repo).
- Block architecture reference: `~/sanity-headless/ultimate-mortgage-studio` (NOT complete-sites-marketing--studio, which has no blocks).
- Semrush is out of scope (decision July 22, 2026). SOW 2.3 is delivered as a free SEO Health panel using Google Search Console + Lighthouse + in-CMS checks; see `docs/03-ruleset-seo-health-panel.md`. The client keeps Semrush entirely separate from this project.
- Awaiting from Laney before build starts: sign-off on the free 2.3 panel, final page list, design direction confirmation, Vercel staging environment, Google Search Console access (per SOW sections 2.1 and 7).

## Documentation

Read these before building anything:

- `docs/01-architecture.md` : stack and where each feature lives
- `docs/02-ruleset-cwv-dashboard.md` : SOW 2.2 build rules
- `docs/03-ruleset-seo-health-panel.md` : SOW 2.3 build rules (free SEO Health panel, no Semrush)
- `docs/04-ruleset-seo-fields.md` : SOW 2.4 build rules
- `docs/05-ruleset-seo-toolset.md` : SOW 2.5 build rules
- `docs/06-build-plan.md` : the full build plan (content model, blocks, WP-familiarity ruleset, migration, sequence)
- `docs/09-sow-compliance.md` : SOW requirements traceability matrix
- `docs/10-engineering-standards.md` : Definition of Done, cross-cutting rules, git conventions
- `docs/11-progress.md` : phase/task board and status

Client-facing and commercial docs (feasibility with pricing, the SEO-options rationale, and the legacy-site security note) are kept privately, outside this public repo.

## Hard Rules

1. The live thedesignboutique.com is never touched. No DNS, no WP Engine changes, nothing.
2. The staging build is globally noindex until a future go-live SOW says otherwise.
3. All Sanity schema, Studio config, and tooling become The Design Boutique's property on final payment; write everything as if the client's future developers will read it.
4. Never claim a sync or integration capability the third-party API does not support. The rulesets document exactly what the Google APIs can and cannot do; stay inside those lines.
5. No emdashes in any authored content. No AI tooling references anywhere.
