import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { PAGE_BY_SLUG_QUERY, SITE_DEFAULTS_QUERY } from '@/sanity/lib/queries'
import { BlockRenderer } from '@/app/components/BlockRenderer'
import { buildMetadata, buildJsonLd, jsonLdString } from '@/app/lib/pageMeta'

// Always reflect the latest CMS content. Proper ISR / tag revalidation is a
// Phase 4/5 performance task.
export const dynamic = 'force-dynamic'

async function getHome() {
  return client.fetch(PAGE_BY_SLUG_QUERY, { slug: 'home' })
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, siteDefaults] = await Promise.all([getHome(), client.fetch(SITE_DEFAULTS_QUERY)])
  return buildMetadata(page, { path: '', siteDefaults })
}

export default async function HomePage() {
  const [page, siteDefaults] = await Promise.all([getHome(), client.fetch(SITE_DEFAULTS_QUERY)])
  if (!page) return null
  const json = jsonLdString(buildJsonLd(page, { path: '', siteDefaults }))
  return (
    <>
      {json ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} /> : null}
      <BlockRenderer blocks={page.pageBuilder} />
    </>
  )
}
