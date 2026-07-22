# Engineering Standards

How this project is built and judged. These standards are not negotiable and apply to every task. If a task cannot meet them, it is not done.

## Definition of Done

A task is done only when every box is true. No exceptions, no "come back to it later", no placeholders, no TODOs left in shipped code.

- [ ] Functionally complete: does exactly what the task specified, with real data, no stubs or dummy content.
- [ ] Visually exact: matches the design reference (`design-reference/`) at all three breakpoints (mobile <=575, tablet <=991, desktop). Verified by side-by-side comparison, not by memory.
- [ ] Responsive: no horizontal scroll, no overflow, no broken layout at any width in range.
- [ ] Accessible: WCAG 2.1 AA for the touched surface (semantic markup, contrast against the dark palette, keyboard operable, focus visible, reduced-motion respected, images have alt).
- [ ] SEO cross-check: if the task adds or touches a content type or page, the full SEO field stack (2.4) is present and correct on it, and it is added to the sitemap logic.
- [ ] Clean build: `next build` and type-check pass with zero errors; zero console errors/warnings at runtime.
- [ ] Tested: logic has unit tests; editor/user flows have an E2E check where applicable (see Testing).
- [ ] SOW cross-referenced: the matching row(s) in `09-sow-compliance.md` are updated to Built, then Verified after QC.
- [ ] Committed: one logical commit with a clear message; progress board updated.

QC is done in depth, visually and functionally, before a task is marked Verified. "It probably works" is not Verified.

## Cross-cutting requirements (the anti-forgetting rule)

These are never "finished once." Every new content type, page, or block re-verifies all of them in its own Definition of Done:

1. Exact design match to the live site (flag improvements, never apply without approval).
2. Full SEO field stack (2.4) present and correct.
3. SEO Health panel (2.3) and CWV coverage (2.2) apply to the content type.
4. WordPress-friendly editing experience.
5. Accessibility AA.
6. Nested-URL correctness.

Concretely: the blog is not done when the blog renders. The blog is done when the blog renders AND has the SEO field stack AND is in the sitemap AND matches the reference AND is keyboard-accessible AND its editing screen is WP-familiar. Same bar for every page type after it.

## Design fidelity

- The current live site is the design spec. Exact match is the target.
- Reference screenshots live in `design-reference/`, captured per page and per breakpoint, and are the thing we diff against.
- If something on the live site is broken, inconsistent, or worth improving, it goes in `design-reference/improvements.md` for Angelo's approval. Nothing changes from the current design without a yes.
- Design tokens (dark theme, Signika, orange `#F26722`, square buttons, full-bleed + 50px gutters) are defined once in code and never hard-coded per component.

## Git conventions

- One logical change per commit. Small, reviewable commits over large ones.
- Message format: `phaseN: <area>: <imperative summary>` (e.g. `phase0: tokens: add color and type scale`). Body when useful, listing what and why.
- The git log is a project record: it must always read as an honest account of what was done. No squashing away history.
- No co-authors, no AI/tool mentions in any commit (global rule).
- Branching: `main` is the running build. Feature work on `phaseN/<slug>` branches, merged when Verified. Never force-push, never rewrite shared history.
- Author identity: personal (git email `lpangm03@yahoo.com`). No agency branding anywhere.

## Testing strategy

- Unit tests: the SEO/readability/score logic and any pure functions (canonical/OG fallback, slug/redirect logic). These rules must be provably correct because they run on every page.
- E2E tests (Playwright): the editor flows that matter to Laney's team (create a page from blocks, reorder blocks, fill SEO fields, preview, publish; add a redirect; read the dashboards).
- Visual: reference-diff per page/breakpoint before a page is Verified.
- Performance/accessibility: Lighthouse run on key templates; Core Web Vitals checked on staging before handoff.

## No-placeholder policy

Shipped code contains no lorem ipsum, no "TODO", no commented-out stubs, no fake data left in. If real content or a real asset is not yet available, the task is Blocked (and named as such on the progress board), not quietly shipped with a placeholder.
