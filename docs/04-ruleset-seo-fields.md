# Ruleset: SEO Field Stack (SOW 2.4)

## The one rule that governs everything

1. There is exactly one `seoFields` object type. Every page document type includes it as its `seo` field. No page type ever redefines, omits, or partially copies these fields. New page types added later inherit the full stack by construction.

## Fields

All fields live under the `seo` object, grouped in the Studio under an "SEO" tab/group so they do not crowd the content fields.

| Field | Type | Validation / behavior |
|---|---|---|
| `title` | string | SEO title tag. Custom input showing character count and estimated pixel width. Warn (not block) beyond 60 chars or ~580px. Falls back to page title when empty (precedence in ruleset 05). |
| `metaDescription` | text | Custom input with character count. Warn under 50 or over 160 chars. |
| `canonicalUrl` | url | Optional. Validated absolute URL. Empty means self-canonical (rule in 05). |
| `slug` | slug | Required on all routable pages. Source: page title. Changing a published slug triggers the redirect prompt (ruleset 05). Kebab-case, no trailing slash. |
| `focusKeyword` | string | Optional. Drives the on-page score checks in ruleset 05. |
| `robots` | object: `index` boolean (default true), `follow` boolean (default true) | Rendered as index/noindex, follow/nofollow. NOTE: while staging, the site-wide noindex overrides this at render; the field still stores the intended production value. |
| `ogTitle`, `ogDescription`, `ogImage` | string, text, image | Open Graph. All optional; fallbacks per ruleset 05. Image hotspot enabled, recommend 1200x630 in the field description. |
| `twitterTitle`, `twitterDescription`, `twitterImage`, `twitterCardType` | string, text, image, list | Card type list: `summary_large_image` (default), `summary`. All optional; falls back to OG values then page values. |
| `schemaType` | list | Page-level JSON-LD type: `Organization`, `Service`, `FAQPage`, `Article`, `LocalBusiness`, `WebPage` (default). Selecting FAQPage reveals a Q/A array; Article auto-fills from post metadata. |
| `breadcrumbTitle` | string | Optional short label for breadcrumb trails; falls back to page title. |

## Behavior rules

2. Warnings, not walls: validation on advisory limits (title length, description length) uses Sanity `warning()` level so editors can consciously exceed guidance. Hard `error()` only for structurally broken values: invalid canonical URL, missing slug on a routable page.
3. Every custom input keeps the underlying value a plain string/object; custom components change presentation only, never the stored shape.
4. Field descriptions are written for Laney's team, not for developers: each field says what it does and what happens if left empty.
5. Blog posts and any date-stamped content default `schemaType` to `Article`; service pages to `Service`; contact/about may use `Organization` or `LocalBusiness`; everything else `WebPage`. Defaults are set per page type at the include site (the one permitted per-type variation: initial values, never structure).

## Definition of done

- Every page type in the schema shows the identical SEO group.
- Title and description inputs live-update counts; pixel estimate within ~5% of real SERP rendering for common cases.
- All values render into the frontend metadata layer (verified in page source on staging), with fallback behavior per ruleset 05.
- An editor can fill the entire stack without leaving the document.
