import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { PAGE_BY_SLUG_QUERY, POST_BY_SLUG_QUERY, BLOG_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { BlockRenderer } from '@/app/components/BlockRenderer'
import { PostTemplate } from '@/app/components/PostTemplate'
import { buildMetadata } from '@/app/lib/pageMeta'

export const dynamic = 'force-dynamic'

type PageParams = { params: Promise<{ slug: string[] }> }

/** Resolves a page by its full path slug (e.g. "solutions/seo-services"). */
async function getPage(slugParts: string[]) {
  const slug = (slugParts || []).join('/')
  return client.fetch(PAGE_BY_SLUG_QUERY, { slug })
}

/**
 * Blog posts sit at the site root on the live site (e.g. /5-mistakes), so a
 * single-segment path that matches no page is looked up as a post.
 */
async function getPost(slugParts: string[]) {
  if (!slugParts || slugParts.length !== 1) return null
  return client.fetch(POST_BY_SLUG_QUERY, { slug: slugParts[0] })
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (page) return buildMetadata(page)
  return buildMetadata(await getPost(slug))
}

export default async function Page({ params }: PageParams) {
  const { slug } = await params
  const page = await getPage(slug)
  if (page) return <BlockRenderer blocks={page.pageBuilder} />

  const post = await getPost(slug)
  if (!post) notFound()
  const settings = await client.fetch(BLOG_SETTINGS_QUERY)
  return <PostTemplate post={post} settings={settings} />
}
