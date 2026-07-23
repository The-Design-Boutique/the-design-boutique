import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { PAGE_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import { BlockRenderer } from '@/app/components/BlockRenderer'
import { buildMetadata } from '@/app/lib/pageMeta'

export const dynamic = 'force-dynamic'

type PageParams = { params: Promise<{ slug: string }> }

async function getPage(slug: string) {
  return client.fetch(PAGE_BY_SLUG_QUERY, { slug })
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  return buildMetadata(await getPage(slug))
}

export default async function Page({ params }: PageParams) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  return <BlockRenderer blocks={page.pageBuilder} />
}
