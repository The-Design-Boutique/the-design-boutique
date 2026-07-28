import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getClient } from '@/app/lib/sanityFetch'
import {
  PAGE_BY_SLUG_QUERY,
  POST_BY_SLUG_QUERY,
  GOLD_EVENT_BY_SLUG_QUERY,
  CLIENT_BY_SLUG_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  BLOG_SETTINGS_QUERY,
  SITE_DEFAULTS_QUERY,
} from '@/sanity/lib/queries'
import { BlockRenderer } from '@/app/components/BlockRenderer'
import { PostTemplate } from '@/app/components/PostTemplate'
import { GoldEventTemplate } from '@/app/components/GoldEventTemplate'
import { ClientTemplate } from '@/app/components/ClientTemplate'
import { CategoryTemplate } from '@/app/components/CategoryTemplate'
import { buildMetadata, buildJsonLd, jsonLdString } from '@/app/lib/pageMeta'
import { recordNotFound } from '@/app/lib/notFoundLog'

export const dynamic = 'force-dynamic'

type PageParams = { params: Promise<{ slug: string[] }> }

/** Resolves a page by its full path slug (e.g. "solutions/seo-services"). */
async function getPage(slugParts: string[]) {
  const slug = (slugParts || []).join('/')
  return (await getClient()).fetch(PAGE_BY_SLUG_QUERY, { slug })
}

/**
 * Resolves the document types that live outside the page builder:
 *   /{slug}            -> blog post (root-level, as on the live site)
 *   /gold/{slug}       -> gold event
 *   /portfolio/{slug}  -> client case study
 *   /category/{slug}   -> blog category archive
 */
async function getDocument(parts: string[]) {
  if (!parts?.length) return null
  if (parts.length === 1) {
    const post = await (await getClient()).fetch(POST_BY_SLUG_QUERY, { slug: parts[0] })
    return post ? { kind: 'post' as const, doc: post } : null
  }
  if (parts.length === 2 && parts[0] === 'gold') {
    const event = await (await getClient()).fetch(GOLD_EVENT_BY_SLUG_QUERY, { slug: parts[1] })
    return event ? { kind: 'gold' as const, doc: event } : null
  }
  if (parts.length === 2 && parts[0] === 'portfolio') {
    const c = await (await getClient()).fetch(CLIENT_BY_SLUG_QUERY, { slug: parts[1] })
    return c ? { kind: 'client' as const, doc: c } : null
  }
  if (parts.length === 2 && parts[0] === 'category') {
    const cat = await (await getClient()).fetch(CATEGORY_BY_SLUG_QUERY, { slug: parts[1] })
    return cat ? { kind: 'category' as const, doc: cat } : null
  }
  return null
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  const path = (slug || []).join('/')
  const defaults = await (await getClient()).fetch(SITE_DEFAULTS_QUERY)
  const siteDefaults = defaults?.settings
  const page = await getPage(slug)
  if (page) return buildMetadata(page, { path, siteDefaults })
  const found = await getDocument(slug)
  return buildMetadata(found?.doc ?? null, { path, siteDefaults })
}

/** Structured data, emitted per page from the SEO tab's chosen type. */
function JsonLd({ data }: { data: object | null }) {
  const json = jsonLdString(data)
  if (!json) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

export default async function Page({ params }: PageParams) {
  const { slug } = await params
  const path = (slug || []).join('/')
  const defaults = await (await getClient()).fetch(SITE_DEFAULTS_QUERY)
  const siteDefaults = defaults?.settings
  const office = defaults?.office

  const page = await getPage(slug)
  if (page) {
    return (
      <>
        <JsonLd data={buildJsonLd(page, { path, siteDefaults, office })} />
        <BlockRenderer blocks={page.pageBuilder} />
      </>
    )
  }

  const found = await getDocument(slug)
  if (!found) {
    // Log the dead URL before giving up, so the 404 monitor can surface it
    // with a one-click redirect (ruleset 05, rules 14 and 15).
    const referrer = (await headers()).get('referer')
    await recordNotFound(`/${path}`, referrer)
    notFound()
  }

  const ld = <JsonLd data={buildJsonLd(found.doc, { path, siteDefaults, office })} />

  if (found.kind === 'client') return <>{ld}<ClientTemplate client={found.doc} /></>

  const settings = await (await getClient()).fetch(BLOG_SETTINGS_QUERY)
  if (found.kind === 'category') {
    return <>{ld}<CategoryTemplate category={found.doc} posts={found.doc.posts || []} settings={settings} /></>
  }
  if (found.kind === 'gold') return <>{ld}<GoldEventTemplate event={found.doc} settings={settings} /></>
  return <>{ld}<PostTemplate post={found.doc} settings={settings} /></>
}
