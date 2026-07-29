import type { Metadata } from 'next'
import { urlFor } from '@/sanity/lib/image'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Turns a document's shared `seoFields` into page metadata (SOW 2.4).
 *
 * Fallback order is deliberate and documented in ruleset 05:
 *   title        SEO title -> document title
 *   description  meta description -> excerpt
 *   share title  share title -> SEO title -> document title
 *   share text   share description -> meta description
 *   share image  share image -> the document's own image -> site default
 *   X/Twitter    its own value -> the share (Open Graph) value
 *
 * The site is noindex-wide while on staging (set in the root layout); the
 * per-page robots values below still record the intended production setting.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'https://thedesignboutique.com'

function imageUrl(source: any, width = 1200, height = 630): string | undefined {
  if (!source?.asset) return undefined
  try {
    return urlFor(source).width(width).height(height).fit('crop').url()
  } catch {
    return undefined
  }
}

/**
 * Absolute URL for a document path, which social platforms require.
 * An empty path is the homepage, not a missing value.
 */
export function absoluteUrl(path?: string): string | undefined {
  if (path === undefined || path === null) return undefined
  const base = SITE_URL.replace(/\/$/, '')
  const clean = path.replace(/^\//, '')
  if (!clean) return base
  if (clean.startsWith('http')) return clean
  return `${base}/${clean}`
}

export function buildMetadata(doc: any, opts: { path?: string; siteDefaults?: any } = {}): Metadata {
  if (!doc) return {}
  const seo = doc.seo || {}
  const { path, siteDefaults } = opts

  const title: string = seo.title || doc.title
  const description: string | undefined = seo.metaDescription || doc.excerpt || undefined

  const shareTitle = seo.ogTitle || title
  const shareDescription = seo.ogDescription || description
  const shareImage =
    imageUrl(seo.ogImage) ||
    imageUrl(doc.featuredImage) ||
    imageUrl(doc.coverImage) ||
    imageUrl(siteDefaults?.defaultShareImage)

  const twitterImage = imageUrl(seo.twitterImage) || shareImage

  // Empty canonical means "this page is its own canonical", the normal case.
  const canonical = seo.canonicalUrl || absoluteUrl(path)

  // Only present when this page overrides the site default.
  //
  // The key has to be absent, not undefined. Next merges metadata by key, and a
  // key that exists with the value undefined replaces the parent's value rather
  // than inheriting it. Returning `robots: undefined` here therefore deleted the
  // root layout's site-wide noindex from every page that uses this function,
  // which was every content page: /studio still carried noindex and nothing else
  // did. robots.txt was the only thing left holding staging out of search, and
  // that stops crawling without stopping a URL being indexed from a link.
  const pageRobots =
    seo.robots && (seo.robots.index === false || seo.robots.follow === false)
      ? { index: seo.robots.index !== false, follow: seo.robots.follow !== false }
      : null

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    ...(pageRobots ? { robots: pageRobots } : {}),
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url: canonical,
      siteName: siteDefaults?.siteName || 'The Design Boutique',
      type: seo.schemaType === 'Article' ? 'article' : 'website',
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: (seo.twitterCardType as any) || 'summary_large_image',
      title: seo.twitterTitle || shareTitle,
      description: seo.twitterDescription || shareDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  }
}

/**
 * Builds the JSON-LD block for a document, based on its structured data type.
 * Returning null means the page emits nothing rather than an empty shell.
 */
export function buildJsonLd(
  doc: any,
  opts: { path?: string; siteDefaults?: any; office?: any } = {},
): object | null {
  if (!doc) return null
  const seo = doc.seo || {}
  const { path, siteDefaults, office } = opts
  const url = seo.canonicalUrl || absoluteUrl(path)
  const name = seo.title || doc.title
  const description = seo.metaDescription || doc.excerpt || undefined
  const image =
    imageUrl(seo.ogImage) || imageUrl(doc.featuredImage) || imageUrl(doc.coverImage) || undefined
  const org = siteDefaults?.siteName || 'The Design Boutique'

  const base = { '@context': 'https://schema.org', url, name, description }

  switch (seo.schemaType) {
    case 'Article':
      return {
        ...base,
        '@type': 'Article',
        headline: name,
        image: image ? [image] : undefined,
        datePublished: doc.publishedAt || doc.date || undefined,
        author: doc.authorName ? { '@type': 'Person', name: doc.authorName } : undefined,
        publisher: { '@type': 'Organization', name: org },
      }

    case 'FAQPage': {
      const faqs: any[] = Array.isArray(seo.faqs) ? seo.faqs : []
      // No questions means no FAQ markup: an empty FAQPage is worse than none.
      if (!faqs.length) return null
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    }

    case 'LocalBusiness': {
      // Assembled from the Office & Local SEO settings so it can never drift
      // from what the site itself displays.
      const o = office || {}
      const address = o.streetAddress || o.addressLocality
        ? {
            '@type': 'PostalAddress',
            streetAddress: o.streetAddress || undefined,
            addressLocality: o.addressLocality || undefined,
            addressRegion: o.addressRegion || undefined,
            postalCode: o.postalCode || undefined,
            addressCountry: o.addressCountry || undefined,
          }
        : siteDefaults?.address
          ? { '@type': 'PostalAddress', streetAddress: siteDefaults.address }
          : undefined
      const hours = Array.isArray(o.openingHours)
        ? o.openingHours
            .filter((h: any) => h?.opens && h?.closes && Array.isArray(h.days) && h.days.length)
            .map((h: any) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: h.days,
              opens: h.opens,
              closes: h.closes,
            }))
        : []
      return {
        ...base,
        '@type': 'LocalBusiness',
        name: o.name || org,
        telephone: o.phone || siteDefaults?.phone || undefined,
        email: o.email || siteDefaults?.email || undefined,
        priceRange: o.priceRange || undefined,
        address,
        geo:
          typeof o.latitude === 'number' && typeof o.longitude === 'number'
            ? { '@type': 'GeoCoordinates', latitude: o.latitude, longitude: o.longitude }
            : undefined,
        openingHoursSpecification: hours.length ? hours : undefined,
        sameAs: Array.isArray(o.sameAs) && o.sameAs.length ? o.sameAs : undefined,
        image: image ? [image] : undefined,
      }
    }

    case 'Organization':
      return {
        ...base,
        '@type': 'Organization',
        name: org,
        telephone: siteDefaults?.phone || undefined,
        email: siteDefaults?.email || undefined,
      }

    case 'Service':
      return {
        ...base,
        '@type': 'Service',
        serviceType: name,
        provider: { '@type': 'Organization', name: org },
      }

    case 'WebPage':
    default:
      return { ...base, '@type': 'WebPage' }
  }
}

/** Strips undefined values so the emitted JSON-LD has no empty keys. */
export function jsonLdString(data: object | null): string | null {
  if (!data) return null
  return JSON.stringify(data, (_k, v) => (v === undefined ? undefined : v))
}
