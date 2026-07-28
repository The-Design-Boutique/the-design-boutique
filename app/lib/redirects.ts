/**
 * Redirect and 404 path handling (SOW 2.5, ruleset 05 section 4).
 *
 * The schema validation, the middleware that performs redirects and the 404
 * monitor all have to agree on what a path *is*, or a redirect an editor can
 * see in the Studio will quietly fail to fire. That agreement lives here.
 */

/** A redirect as stored, reduced to what the matching logic needs. */
export interface RedirectRecord {
  _id: string
  fromPath: string
  toPath: string
  statusCode: number
  enabled: boolean
}

/**
 * Reduce a path to its canonical, comparable form.
 *
 * Drops the origin, the query string and the fragment; forces a single leading
 * slash; removes the trailing slash except at the root; and lowercases, because
 * the WordPress site treated `/About` and `/about` as the same page and editors
 * will reasonably expect a redirect typed either way to work.
 */
export function normalisePath(input: string): string {
  if (!input) return '/'
  let path = input.trim()

  // Accept a full URL pasted from a browser bar.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      // Fall through and treat it as a path.
    }
  }

  path = path.split('#')[0].split('?')[0]
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/{2,}/g, '/')
  if (path.length > 1) path = path.replace(/\/+$/, '')
  return path.toLowerCase() || '/'
}

/** True when the target is somewhere else entirely rather than a path on this site. */
export function isExternalTarget(target: string): boolean {
  return /^(https?:)?\/\//i.test(target.trim()) || /^mailto:|^tel:/i.test(target.trim())
}

/**
 * Requests that are noise rather than a real person hitting a dead page
 * (ruleset 05, rule 14). Logging these buries the handful of 404s that
 * actually matter under thousands that never will.
 */
const IGNORED_404_PATTERNS: RegExp[] = [
  /^\/favicon\.[a-z0-9]+$/i,
  /^\/apple-touch-icon/i,
  /^\/\.well-known\//i,
  /^\/robots\.txt$/i,
  /^\/sitemap.*\.xml$/i,
  /^\/_next\//i,
  /^\/static\//i,
  // WordPress probing, which this site attracts constantly having been on WP.
  /^\/wp-/i,
  /^\/xmlrpc\.php$/i,
  /\.php$/i,
  /^\/wordpress\//i,
  /^\/administrator\//i,
  // Common vulnerability scanners.
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/cgi-bin\//i,
  /^\/vendor\//i,
  // Asset requests: a missing image is a content bug, not a redirect candidate.
  /\.(png|jpe?g|gif|svg|webp|avif|ico|css|js|map|woff2?|ttf|eot|txt|json)$/i,
]

export function shouldLogNotFound(path: string): boolean {
  const p = normalisePath(path)
  if (p === '/') return false
  return !IGNORED_404_PATTERNS.some((re) => re.test(p))
}

/**
 * Resolve chains so every redirect points at its final destination
 * (ruleset 05, rule 12).
 *
 * If A points at B and B later moves to C, A is rewritten to point at C rather
 * than making a visitor take two hops. Cycles are detected and the offending
 * redirect is left pointing where it did, so a bad pair degrades to one
 * useless redirect instead of an infinite loop.
 */
export function flattenChains(redirects: RedirectRecord[]): Map<string, RedirectRecord> {
  const byFrom = new Map<string, RedirectRecord>()
  for (const r of redirects) {
    if (!r.enabled) continue
    const from = normalisePath(r.fromPath)
    if (!r.toPath) continue
    byFrom.set(from, { ...r, fromPath: from, toPath: isExternalTarget(r.toPath) ? r.toPath.trim() : normalisePath(r.toPath) })
  }

  const resolved = new Map<string, RedirectRecord>()
  for (const [from, record] of byFrom) {
    const seen = new Set<string>([from])
    let target = record.toPath
    // Follow the chain to its end, stopping if it doubles back on itself.
    while (!isExternalTarget(target) && byFrom.has(target) && !seen.has(target)) {
      seen.add(target)
      target = byFrom.get(target)!.toPath
    }
    // A cycle: leave the original single hop rather than pointing into the loop.
    const looped = !isExternalTarget(target) && seen.has(target) && target !== record.toPath
    resolved.set(from, { ...record, toPath: looped ? record.toPath : target })
  }

  // Drop anything that ends up pointing at itself; it would loop forever.
  for (const [from, record] of resolved) {
    if (!isExternalTarget(record.toPath) && normalisePath(record.toPath) === from) resolved.delete(from)
  }

  return resolved
}

/**
 * Whether a proposed redirect is safe to save (ruleset 05, rule 13).
 * Loops are prevented when they are written rather than detected when a
 * visitor is already stuck in one.
 */
export function validateRedirect(
  fromPath: string,
  toPath: string,
  existing: RedirectRecord[],
  selfId?: string,
): { ok: true } | { ok: false; reason: string } {
  const from = normalisePath(fromPath)
  const to = isExternalTarget(toPath) ? toPath.trim() : normalisePath(toPath)

  if (!from || from === '/') return { ok: false, reason: 'The site root cannot be redirected.' }
  if (!to) return { ok: false, reason: 'A redirect needs somewhere to point.' }
  if (!isExternalTarget(to) && to === from) {
    return { ok: false, reason: 'This redirect points at itself, which would loop forever.' }
  }

  const others = existing.filter((r) => r._id !== selfId)

  if (others.some((r) => r.enabled && normalisePath(r.fromPath) === from)) {
    return { ok: false, reason: `Another redirect already handles ${from}.` }
  }

  if (!isExternalTarget(to)) {
    // Walk forward from the target: if we arrive back at this path, it loops.
    const map = flattenChains(others)
    const seen = new Set<string>([from])
    let cursor = to
    while (map.has(cursor)) {
      if (seen.has(cursor)) {
        return { ok: false, reason: `This would create a loop: ${from} eventually points back at itself.` }
      }
      seen.add(cursor)
      const next = map.get(cursor)!.toPath
      if (isExternalTarget(next)) break
      cursor = next
    }
    if (cursor === from) {
      return { ok: false, reason: `This would create a loop: ${from} eventually points back at itself.` }
    }
  }

  return { ok: true }
}

/** The day key used to aggregate 404s (ruleset 05, rule 14). */
export function dayKey(when: Date = new Date()): string {
  return when.toISOString().slice(0, 10)
}

/**
 * Deterministic id so repeat hits on the same path on the same day increment
 * one document instead of creating thousands.
 */
export function notFoundId(path: string, day: string = dayKey()): string {
  const slug = normalisePath(path)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `notFound.${day}.${slug || 'root'}`
}
