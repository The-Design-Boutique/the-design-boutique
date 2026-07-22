import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { PAGE_BY_SLUG_QUERY } from '@/sanity/lib/queries'

// Walking-skeleton page renderer: fetch a page by slug and render it with SEO
// metadata built from the shared seoFields. Nested routing and the full block
// builder arrive in Phase 1/2.

type PageParams = { params: Promise<{ slug: string }> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPage(slug: string): Promise<any> {
  return client.fetch(PAGE_BY_SLUG_QUERY, { slug })
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}

  const title: string = page.seo?.title || page.title
  const description: string | undefined = page.seo?.metaDescription

  return {
    title,
    description,
    alternates: page.seo?.canonicalUrl ? { canonical: page.seo.canonicalUrl } : undefined,
    openGraph: {
      title: page.seo?.ogTitle || title,
      description: page.seo?.ogDescription || description,
    },
    // Staging-wide noindex is set in the root layout and intentionally kept here.
  }
}

export default async function Page({ params }: PageParams) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  return (
    <main style={{ maxWidth: '48rem', margin: '0 auto', padding: '4rem var(--gutter)' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>{page.title}</h1>
      {page.body ? (
        <div style={{ marginTop: '1.5rem', color: 'var(--tdb-offwhite)' }}>
          <PortableText value={page.body} />
        </div>
      ) : null}
    </main>
  )
}
