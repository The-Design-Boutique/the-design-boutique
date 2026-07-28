import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/app/lib/pageMeta'

/**
 * While the rebuild is on staging the entire site is disallowed, matching the
 * site-wide noindex. The sitemap is still declared so it can be verified during
 * the walkthrough. Flip STAGING to false at go-live.
 */
const STAGING = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true'

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, '')
  return {
    rules: STAGING
      ? [{ userAgent: '*', disallow: '/' }]
      : [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  }
}
