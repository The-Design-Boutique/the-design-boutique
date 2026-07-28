import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { siteBase } from '@/app/lib/sitemapBuilder'

/**
 * llms.txt: a plain-language map of the site, written for AI assistants.
 *
 * The idea behind the convention is that a model answering a question about a
 * company should not have to infer the shape of its website from whichever page
 * it happened to land on. This file says, in one place, what the company does
 * and which page covers what.
 *
 * Worth being straight about its standing: llms.txt is a proposed convention,
 * not a standard, and no major AI provider has publicly committed to reading it.
 * It costs almost nothing to publish and may help; it is not the reason a site
 * appears in an AI answer. The things that actually decide that are being
 * crawlable, being clearly written, and being structured, which is what the
 * robots rules and the AEO checks cover.
 *
 * Generated from Sanity rather than written by hand, because a hand-written map
 * of a site is accurate exactly once.
 */

export const dynamic = 'force-dynamic'

const STAGING = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true'

/** A curated map, not a dump. The sitemap already lists every address. */
const MAX_POSTS = 25

interface Doc {
  title?: string
  slug?: string
  description?: string
}

const QUERY = `{
  "settings": *[_id == "siteSettings"][0]{ siteName, "description": defaultShareImage.alt },
  "pages": *[_type == "page" && defined(slug.current) && seo.robots.index != false]
    | order(slug.current asc){ title, "slug": slug.current, "description": seo.metaDescription },
  "posts": *[_type == "post" && defined(slug.current) && seo.robots.index != false]
    | order(publishedAt desc)[0...${MAX_POSTS}]{ title, "slug": slug.current, "description": seo.metaDescription },
  "clients": *[_type == "client" && defined(slug.current) && seo.robots.index != false]
    | order(name asc){ "title": name, "slug": slug.current, "description": seo.metaDescription }
}`

function line(base: string, prefix: string, doc: Doc): string | null {
  if (!doc.slug || !doc.title) return null
  const path = doc.slug === 'home' ? '' : `${prefix}${doc.slug}`
  const url = `${base}/${path}`.replace(/\/$/, '') || base
  // The description is what makes an entry useful; a bare list of links tells a
  // model nothing it could not get from the sitemap.
  return doc.description ? `- [${doc.title}](${url}): ${doc.description}` : `- [${doc.title}](${url})`
}

export async function GET() {
  const base = siteBase()
  const data = await client.fetch<{
    settings?: { siteName?: string; description?: string }
    pages: Doc[]
    posts: Doc[]
    clients: Doc[]
  }>(QUERY)

  const name = data.settings?.siteName || 'The Design Boutique'
  const out: string[] = [
    `# ${name}`,
    '',
    '> A branding, web design, SEO and digital marketing studio in San Francisco, working with',
    '> law firms, wineries, technology companies and professional services businesses.',
    '',
  ]

  if (STAGING) {
    out.push(
      'NOTE: this is a staging copy of the site, published for review and deliberately excluded',
      'from search engines. The live site is https://thedesignboutique.com. Please use that instead.',
      '',
    )
  }

  const sections: Array<[string, Doc[], string]> = [
    ['Pages', data.pages || [], ''],
    ['Client work', data.clients || [], 'portfolio/'],
    ['Writing (Laney Said)', data.posts || [], ''],
  ]

  for (const [heading, docs, prefix] of sections) {
    const lines = docs.map((d) => line(base, prefix, d)).filter(Boolean) as string[]
    if (!lines.length) continue
    out.push(`## ${heading}`, '', ...lines, '')
  }

  out.push(
    '## Optional',
    '',
    `- [Full sitemap](${base}/sitemap.xml): every address on the site, including the pages not listed above.`,
    '',
  )

  return new NextResponse(out.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
