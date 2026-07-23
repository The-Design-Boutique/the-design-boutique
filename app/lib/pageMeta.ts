import type { Metadata } from 'next'

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Builds Next metadata from a page's shared seoFields, with fallbacks. */
export function buildMetadata(page: any): Metadata {
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
    // Staging-wide noindex stays (set in the root layout).
  }
}
