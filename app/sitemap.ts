import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { SITE_URL } from '@/app/lib/pageMeta'

/**
 * XML sitemap (SOW 2.5, section 3).
 *
 * Built from published, routable documents. Excluded: anything set to "no
 * indexing" in its SEO tab, and any document type that is not routable.
 *
 * While the site is on staging the whole site is noindex, so this builds and is
 * verifiable but must not be submitted anywhere.
 */

export const dynamic = 'force-dynamic'

/** Split into an index if a single sitemap would exceed this. */
const MAX_URLS_PER_SITEMAP = 5000

type Row = { path: string; updatedAt: string }

const ROUTABLE_QUERY = `{
  "pages":      *[_type == "page"      && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt },
  "posts":      *[_type == "post"      && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt },
  "goldEvents": *[_type == "goldEvent" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt },
  "clients":    *[_type == "client"    && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt },
  "categories": *[_type == "category"  && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }
}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await client.fetch<{
    pages: { slug: string; _updatedAt: string }[]
    posts: { slug: string; _updatedAt: string }[]
    goldEvents: { slug: string; _updatedAt: string }[]
    clients: { slug: string; _updatedAt: string }[]
    categories: { slug: string; _updatedAt: string }[]
  }>(ROUTABLE_QUERY)

  const rows: Row[] = [
    // The home page is served from the root, not /home.
    ...data.pages.map((p) => ({ path: p.slug === 'home' ? '' : p.slug, updatedAt: p._updatedAt })),
    ...data.posts.map((p) => ({ path: p.slug, updatedAt: p._updatedAt })),
    ...data.goldEvents.map((p) => ({ path: `gold/${p.slug}`, updatedAt: p._updatedAt })),
    ...data.clients.map((p) => ({ path: `portfolio/${p.slug}`, updatedAt: p._updatedAt })),
    ...data.categories.map((p) => ({ path: `category/${p.slug}`, updatedAt: p._updatedAt })),
  ]

  // Guard rather than silently truncate: this site is far below the limit, but
  // a future one might not be.
  if (rows.length > MAX_URLS_PER_SITEMAP) {
    console.warn(
      `[sitemap] ${rows.length} URLs exceeds ${MAX_URLS_PER_SITEMAP}; a sitemap index is needed.`,
    )
  }

  const base = SITE_URL.replace(/\/$/, '')
  const seen = new Set<string>()
  return rows
    .filter((r) => {
      if (seen.has(r.path)) return false
      seen.add(r.path)
      return true
    })
    .map((r) => ({
      url: r.path ? `${base}/${r.path}` : base,
      lastModified: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }))
}
