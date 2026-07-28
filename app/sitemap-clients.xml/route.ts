import { NextResponse } from 'next/server'
import { rowsForSection, urlSetXml, XML_HEADERS } from '@/app/lib/sitemapBuilder'

/** One section of the sitemap. See app/lib/sitemapBuilder.ts for why it is split. */

export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse(urlSetXml(await rowsForSection('clients')), { headers: XML_HEADERS })
}
