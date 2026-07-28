import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { flattenChains, isExternalTarget, normalisePath, type RedirectRecord } from '@/app/lib/redirects'

/**
 * Runtime redirects (SOW 2.5, ruleset 05 section 4, rules 12 and 13).
 *
 * This is Next.js 16's `proxy` convention, which replaced `middleware`.
 *
 * Editors add redirects in the Studio and they take effect without a deploy,
 * so this has to consult Sanity at request time. Three things keep that cheap
 * and safe:
 *
 *   The map is cached in memory for a minute, so a burst of traffic costs one
 *   lookup rather than one per request.
 *
 *   Reads go to Sanity's CDN with no token. The dataset is public, so there is
 *   no credential to leak into the edge runtime.
 *
 *   It fails open. If Sanity is slow or unreachable the request continues
 *   normally. A broken redirect lookup must never take the site down.
 *
 * Chains are flattened before matching, so a visitor never takes two hops.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-19'

/**
 * Resolve a page reference to the path it actually lives at. These prefixes
 * mirror the routing in the catch-all route; if that changes, change this.
 */
const REDIRECT_QUERY = `*[_type == "redirect" && enabled == true && defined(fromPath)]{
  _id, fromPath, statusCode, enabled,
  "toPath": select(
    targetType == "page" => select(
      toPage->_type == "goldEvent" => "/gold/" + toPage->slug.current,
      toPage->_type == "client" => "/portfolio/" + toPage->slug.current,
      "/" + toPage->slug.current
    ),
    toPath
  )
}`

const CACHE_MS = 60_000

let cache: { at: number; map: Map<string, RedirectRecord> } | null = null
let inFlight: Promise<Map<string, RedirectRecord>> | null = null

async function fetchRedirects(): Promise<Map<string, RedirectRecord>> {
  if (!projectId || !dataset) return new Map()
  const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(REDIRECT_QUERY)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(2_500) })
  if (!res.ok) throw new Error(`redirect lookup failed: ${res.status}`)
  const body = (await res.json()) as { result?: RedirectRecord[] }
  return flattenChains(body.result || [])
}

async function getRedirects(): Promise<Map<string, RedirectRecord>> {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_MS) return cache.map
  // Collapse concurrent misses into a single request.
  if (!inFlight) {
    inFlight = fetchRedirects()
      .then((map) => {
        cache = { at: Date.now(), map }
        return map
      })
      .finally(() => {
        inFlight = null
      })
  }
  try {
    return await inFlight
  } catch {
    // Serve a stale map rather than nothing when the lookup fails.
    return cache?.map ?? new Map()
  }
}

/**
 * Hit counting, coalesced per path so a bot hammering one dead URL does not
 * produce one write per request. Counts are advisory, and undercounting after
 * an instance is recycled is an acceptable trade for not writing on every hit.
 */
const FLUSH_MS = 60_000
const pending = new Map<string, { id: string; count: number; since: number }>()

async function recordHit(record: RedirectRecord): Promise<void> {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token || !projectId || !dataset) return

  const entry = pending.get(record.fromPath) || { id: record._id, count: 0, since: Date.now() }
  entry.count += 1
  pending.set(record.fromPath, entry)

  if (Date.now() - entry.since < FLUSH_MS) return
  pending.delete(record.fromPath)

  try {
    await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        mutations: [
          {
            patch: {
              id: entry.id,
              setIfMissing: { hitCount: 0 },
              inc: { hitCount: entry.count },
              set: { lastHitAt: new Date().toISOString() },
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(3_000),
    })
  } catch {
    // Counting is a nicety. Never let it affect the visitor.
  }
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const path = normalisePath(request.nextUrl.pathname)

  let redirects: Map<string, RedirectRecord>
  try {
    redirects = await getRedirects()
  } catch {
    return NextResponse.next()
  }

  const match = redirects.get(path)
  if (!match) return NextResponse.next()

  const destination = isExternalTarget(match.toPath)
    ? new URL(match.toPath)
    : new URL(`${match.toPath}${request.nextUrl.search}`, request.url)

  // Never redirect to where we already are.
  if (!isExternalTarget(match.toPath) && normalisePath(destination.pathname) === path) {
    return NextResponse.next()
  }

  event.waitUntil(recordHit(match))
  return NextResponse.redirect(destination, match.statusCode === 302 ? 302 : 301)
}

export const config = {
  /**
   * Skip everything that can never be a redirect target: the Studio, API
   * routes, Next's own assets, and files with an extension.
   */
  matcher: ['/((?!api|studio|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
}
