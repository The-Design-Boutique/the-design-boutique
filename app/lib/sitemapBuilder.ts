import { client } from '@/sanity/lib/client'
import { SITE_URL } from '@/app/lib/pageMeta'

/**
 * The sitemap, split into one file per kind of content (SOW 2.5, section 3).
 *
 * Named sitemapBuilder rather than sitemap because "sitemap.ts" is a reserved
 * filename anywhere under app/: Next treats it as a metadata route and tries to
 * serve it, which fails with an unhelpful message about a missing default
 * export. Worth knowing before renaming this back.
 *
 * Splitting is not about size. This site has around 120 addresses and Google's
 * limit is 50,000, so one file would be perfectly legal. It is about diagnosis:
 * Search Console reports coverage per sitemap, so separate files turn "89 of 115
 * pages are indexed" into "every page is indexed, and none of the case studies
 * are", which is the difference between a number and a thing to go and fix.
 *
 * Everything here excludes documents whose SEO tab sets indexing to off. A page
 * that asks not to be indexed should not then be advertised in a sitemap; saying
 * both is a contradiction search engines are entitled to resolve either way.
 */

export const SITEMAP_SECTIONS = ['pages', 'posts', 'clients', 'events', 'categories'] as const
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number]

/** What each file is called, and what a human should understand it to hold. */
export const SECTION_LABELS: Record<SitemapSection, { file: string; title: string; description: string }> = {
  pages: {
    file: 'sitemap-pages.xml',
    title: 'Pages',
    description: 'The main site: home, about, every service page, contact and so on.',
  },
  posts: {
    file: 'sitemap-posts.xml',
    title: 'Laney Said (blog)',
    description: 'Every published blog post.',
  },
  clients: {
    file: 'sitemap-clients.xml',
    title: 'Client work',
    description: 'The portfolio case studies.',
  },
  events: {
    file: 'sitemap-events.xml',
    title: 'Gold events',
    description: 'The Gold event pages.',
  },
  categories: {
    file: 'sitemap-categories.xml',
    title: 'Blog categories',
    description: 'The category archive pages that list posts by subject.',
  },
}

export interface SitemapRow {
  path: string
  updatedAt: string
}

const SECTION_QUERIES: Record<SitemapSection, string> = {
  pages: `*[_type == "page" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }`,
  posts: `*[_type == "post" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }`,
  clients: `*[_type == "client" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }`,
  events: `*[_type == "goldEvent" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }`,
  categories: `*[_type == "category" && defined(slug.current) && seo.robots.index != false]{ "slug": slug.current, _updatedAt }`,
}

/** Where each kind of document lives, mirroring the catch-all route. */
function pathFor(section: SitemapSection, slug: string): string {
  switch (section) {
    case 'events':
      return `gold/${slug}`
    case 'clients':
      return `portfolio/${slug}`
    case 'categories':
      return `category/${slug}`
    default:
      // The home page is served from the root, not /home.
      return slug === 'home' ? '' : slug
  }
}

export function siteBase(): string {
  return SITE_URL.replace(/\/$/, '')
}

export async function rowsForSection(section: SitemapSection): Promise<SitemapRow[]> {
  const docs = await client.fetch<Array<{ slug: string; _updatedAt: string }>>(SECTION_QUERIES[section])

  const seen = new Set<string>()
  const rows: SitemapRow[] = []
  for (const d of docs) {
    const path = pathFor(section, d.slug)
    // A duplicate address in a sitemap is not fatal, but it is a signal that two
    // documents claim the same page, which is worth not advertising.
    if (seen.has(path)) continue
    seen.add(path)
    rows.push({ path, updatedAt: d._updatedAt })
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path))
}

/** XML needs its five special characters escaped, or the file will not parse. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function urlSetXml(rows: SitemapRow[]): string {
  const base = siteBase()
  const entries = rows
    .map((r) => {
      const loc = xmlEscape(`${base}/${r.path}`.replace(/\/$/, '') || base)
      const lastmod = new Date(r.updatedAt).toISOString()
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

export function sitemapIndexXml(sections: Array<{ file: string; lastmod?: string }>): string {
  const base = siteBase()
  const entries = sections
    .map((s) => {
      const loc = xmlEscape(`${base}/${s.file}`)
      const lastmod = s.lastmod ? `\n    <lastmod>${new Date(s.lastmod).toISOString()}</lastmod>` : ''
      return `  <sitemap>\n    <loc>${loc}</loc>${lastmod}\n  </sitemap>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`
}

/** The headers every sitemap response shares. */
export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  // An hour is short enough that a publish appears the same day and long enough
  // that a crawler hammering the index does not hit Sanity every time.
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
} as const
