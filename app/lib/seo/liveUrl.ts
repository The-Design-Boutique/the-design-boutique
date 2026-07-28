/**
 * Turning a page's path into the URL Search Console knows it by.
 *
 * Search Console answers questions about one exact URL string. It does not
 * normalise, and it does not follow redirects on your behalf. Ask about
 * "https://thedesignboutique.com/about" when the site actually publishes
 * "https://thedesignboutique.com/about/" and you do not get an error. You get a
 * confident, wrong answer: HTTP 200, verdict NEUTRAL, "URL is unknown to
 * Google", and zero search queries. Every page looks as though it has fallen
 * out of the index.
 *
 * The live WordPress site publishes every URL with a trailing slash. That was
 * confirmed against the Search Console API rather than assumed: all twenty five
 * pages carrying search data end in a slash. So the slashed form is tried
 * first.
 *
 * The second candidate exists because this will outlive the WordPress site.
 * When the rebuild goes live the URLs may well drop the trailing slash, and
 * nobody should have to remember that this file is why the panel emptied out.
 * Asking for the other form only when the first is unknown to Google costs one
 * extra call on pages that have no data anyway, and means the panel repairs
 * itself the day the convention changes.
 */

/** Paths ending in something like ".xml" or ".pdf" are files, not pages. */
const FILE_EXTENSION = /\.[a-z0-9]{2,5}$/i

/**
 * The candidate URLs for a path, in the order they should be tried.
 *
 * Always at least one, never more than two, and never the same URL twice.
 */
export function liveUrlCandidates(site: string, path: string): string[] {
  const origin = site.replace(/\/+$/, '')

  // Collapse repeated slashes and guarantee a single leading one, so that a
  // path stored as "about", "/about" or "//about" all reach the same place.
  const cleaned = '/' + String(path || '').replace(/^\/+/, '').replace(/\/{2,}/g, '/')

  // The site root is only ever "https://example.com/". There is no slashless
  // form of it to fall back to.
  if (cleaned === '/') return [`${origin}/`]

  const withoutSlash = origin + cleaned.replace(/\/+$/, '')

  // A file is requested by its exact name. Appending a slash would ask about a
  // directory that does not exist.
  if (FILE_EXTENSION.test(withoutSlash)) return [withoutSlash]

  return [`${withoutSlash}/`, withoutSlash]
}

/**
 * The single most likely live URL for a path, when there is no opportunity to
 * try a second one.
 */
export function liveSearchUrl(site: string, path: string): string {
  return liveUrlCandidates(site, path)[0]
}

/**
 * Whether a URL Inspection response means "Google has never heard of this URL".
 *
 * This is the signal to try the other URL form. It is deliberately narrow:
 * a page that Google knows about but has chosen not to index is a real finding
 * that Laney needs to see, not a reason to go looking for a different URL.
 */
export function isUnknownToGoogle(coverageState?: string): boolean {
  return /unknown to google/i.test(coverageState || '')
}
