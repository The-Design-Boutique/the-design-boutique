import { NextResponse } from 'next/server'
import { ROBOTS_EXPLAINED } from '@/app/robots'
import { SITEMAP_SECTIONS, SECTION_LABELS, rowsForSection, siteBase } from '@/app/lib/sitemapBuilder'

/**
 * Everything the "For Search Engines" tool needs, in one request.
 *
 * The Studio could fetch robots.txt, llms.txt and six sitemaps itself, but that
 * is eight requests to render one screen, and the counts would have to be
 * derived by parsing XML in a browser. Summarising here keeps the panel simple
 * and means the numbers come from the same code that writes the files.
 */

export const dynamic = 'force-dynamic'

async function textOf(origin: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`${origin}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  const [robotsText, llmsText] = await Promise.all([textOf(origin, '/robots.txt'), textOf(origin, '/llms.txt')])

  const sections = await Promise.all(
    SITEMAP_SECTIONS.map(async (section) => {
      const rows = await rowsForSection(section)
      return {
        key: section,
        ...SECTION_LABELS[section],
        count: rows.length,
        url: `${siteBase()}/${SECTION_LABELS[section].file}`,
      }
    }),
  )

  return NextResponse.json({
    // The live address these files describe, which is not this origin while the
    // rebuild is on staging.
    site: siteBase(),
    origin,
    robots: {
      text: robotsText,
      ...ROBOTS_EXPLAINED,
    },
    llms: {
      text: llmsText,
      // Deliberately reported rather than assumed: a file that exists and a file
      // anybody reads are different things.
      lines: llmsText ? llmsText.split('\n').filter((l) => l.startsWith('- ')).length : 0,
    },
    sitemap: {
      indexUrl: `${siteBase()}/sitemap.xml`,
      sections,
      total: sections.reduce((sum, s) => sum + s.count, 0),
    },
  })
}
