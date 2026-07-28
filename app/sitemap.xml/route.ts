import { NextResponse } from 'next/server'
import { SITEMAP_SECTIONS, SECTION_LABELS, rowsForSection, sitemapIndexXml, XML_HEADERS } from '@/app/lib/sitemapBuilder'

/**
 * The sitemap index: the one address to give Search Console.
 *
 * It lists the per-section files rather than the pages themselves. A section
 * with nothing in it is left out, because pointing a crawler at an empty file
 * is a wasted request and reads as a mistake.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const sections = await Promise.all(
    SITEMAP_SECTIONS.map(async (section) => {
      const rows = await rowsForSection(section)
      if (!rows.length) return null
      // The index advertises when a section last changed, which is how a crawler
      // decides whether to bother re-reading it.
      const newest = rows.reduce((latest, r) => (r.updatedAt > latest ? r.updatedAt : latest), rows[0].updatedAt)
      return { file: SECTION_LABELS[section].file, lastmod: newest }
    }),
  )

  return new NextResponse(sitemapIndexXml(sections.filter(Boolean) as Array<{ file: string; lastmod: string }>), {
    headers: XML_HEADERS,
  })
}
