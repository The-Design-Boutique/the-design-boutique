import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { PAGE_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import { BlockRenderer } from '@/app/components/BlockRenderer'
import { buildMetadata } from '@/app/lib/pageMeta'

// Always reflect the latest CMS content. Proper ISR / tag revalidation is a
// Phase 4/5 performance task.
export const dynamic = 'force-dynamic'

async function getHome() {
  return client.fetch(PAGE_BY_SLUG_QUERY, { slug: 'home' })
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getHome())
}

export default async function HomePage() {
  const page = await getHome()
  if (!page) return null
  return <BlockRenderer blocks={page.pageBuilder} />
}
