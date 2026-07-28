import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'

/**
 * Daily collection of the Google-sourced half of the SEO Health panel
 * (SOW 2.3, ruleset 03 rule 7).
 *
 * Lighthouse and Search Console are fetched here, server side, and cached as
 * `seoAudit` documents. The Studio reads those documents, so opening the panel
 * is instant, costs nothing, and no API key is ever near a browser.
 *
 * URLs are audited in rotation rather than all at once. Lighthouse takes the
 * better part of a minute per page and the function budget is sixty seconds, so
 * each run takes the pages that have gone longest without a look. The whole site
 * is covered over a few days, which is well inside how often any of this data
 * actually changes.
 *
 * Search Console is optional. With no credentials configured the run still does
 * the Lighthouse half and records that Search Console was skipped, rather than
 * failing outright.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * How long to keep auditing before wrapping up, in milliseconds.
 *
 * A fixed page count does not work here. A page Google has not seen before
 * takes the better part of a minute; one it has cached comes back in under a
 * second. A fixed count either times out on cold pages or wastes most of the
 * budget on warm ones, and at five a run this site would take twenty five days
 * to cover. Working to a clock adapts to whichever it gets.
 */
const TIME_BUDGET_MS = 40_000
/** Never start another batch with less than this left, or it will be cut off. */
const RESERVE_MS = 22_000
/**
 * Pages to audit at once. A cold Lighthouse run spends its twenty seconds
 * waiting on Google rather than doing work here, so running them together costs
 * almost nothing and is the difference between covering this site in under a
 * week and taking two months. Well inside the 25,000 requests a day allowed.
 */
const BATCH_SIZE = 10

const PSI = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const GSC = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const GSC_ANALYTICS = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_WRITE_TOKEN })

const SITE = process.env.SEO_AUDIT_ORIGIN || process.env.CWV_LAB_URL || 'https://the-design-boutique.vercel.app'
/** The Search Console property, which is the live site rather than staging. */
const GSC_SITE = process.env.GSC_SITE_URL || 'https://thedesignboutique.com/'

/* ------------------------------------------------------------------ */

/**
 * Exchange the stored refresh token for a short-lived access token.
 * Returns null when Search Console has not been set up, which is a supported
 * state rather than an error.
 */
async function googleAccessToken(): Promise<string | null> {
  const clientId = process.env.GSC_CLIENT_ID
  const clientSecret = process.env.GSC_CLIENT_SECRET
  const refreshToken = process.env.GSC_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) return null

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.access_token || null
  } catch {
    return null
  }
}

interface LighthouseResult {
  seo: number | null
  accessibility: number | null
  bestPractices: number | null
  performance: number | null
  failures: Array<{ id: string; title: string; description: string; category: string }>
  error?: string
}

async function runLighthouse(url: string, key: string): Promise<LighthouseResult> {
  const empty: LighthouseResult = { seo: null, accessibility: null, bestPractices: null, performance: null, failures: [] }
  const qs = new URLSearchParams({ url, strategy: 'desktop', key })
  for (const c of ['seo', 'accessibility', 'best-practices', 'performance']) qs.append('category', c)

  try {
    const res = await fetch(`${PSI}?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(45_000) })
    if (!res.ok) return { ...empty, error: `PageSpeed returned ${res.status}` }
    const json = await res.json()
    const lh = json?.lighthouseResult
    const score = (id: string) => {
      const v = lh?.categories?.[id]?.score
      return v === undefined || v === null ? null : Math.round(Number(v) * 100)
    }

    // Collect the audits that actually failed, with the category they came from,
    // so the panel can say why something is being raised.
    const failures: LighthouseResult['failures'] = []
    for (const category of ['seo', 'accessibility', 'best-practices']) {
      for (const ref of lh?.categories?.[category]?.auditRefs || []) {
        const audit = lh?.audits?.[ref.id]
        if (!audit) continue
        if (audit.score === null || audit.score === undefined) continue
        if (Number(audit.score) >= 1) continue
        failures.push({
          id: String(ref.id),
          title: String(audit.title || ref.id),
          description: String(audit.description || '').split('[Learn')[0].trim(),
          category,
        })
      }
    }
    return {
      seo: score('seo'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      performance: score('performance'),
      failures,
    }
  } catch (error) {
    // Report what actually happened. Calling every failure a timeout hides
    // parse errors and bad requests behind a cause that was never established.
    const reason =
      error instanceof Error
        ? error.name === 'TimeoutError' || error.name === 'AbortError'
          ? 'PageSpeed did not respond in time'
          : `PageSpeed call failed: ${error.message}`
        : 'PageSpeed call failed'
    return { ...empty, error: reason }
  }
}

interface SearchResult {
  indexVerdict?: string
  indexStatus?: string
  robotsState?: string
  canonicalGoogle?: string
  lastCrawledAt?: string
  clicks?: number
  impressions?: number
  position?: number
  topQueries?: Array<{ query: string; clicks: number; impressions: number; position: number }>
  error?: string
}

async function runSearchConsole(url: string, token: string): Promise<SearchResult> {
  const out: SearchResult = {}

  // Indexing status for this exact URL.
  try {
    const res = await fetch(GSC, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: GSC_SITE }),
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) {
      const json = await res.json()
      const idx = json?.inspectionResult?.indexStatusResult
      out.indexVerdict = idx?.verdict
      out.indexStatus = idx?.coverageState
      out.robotsState = idx?.robotsTxtState
      out.canonicalGoogle = idx?.googleCanonical
      out.lastCrawledAt = idx?.lastCrawlTime
    } else {
      out.error = `URL inspection returned ${res.status}`
    }
  } catch {
    out.error = 'URL inspection did not respond'
  }

  // How the page performs in search, over the last 28 days.
  try {
    const end = new Date()
    const start = new Date(end.getTime() - 28 * 86_400_000)
    const iso = (d: Date) => d.toISOString().slice(0, 10)
    const res = await fetch(`${GSC_ANALYTICS}/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: iso(start),
        endDate: iso(end),
        dimensions: ['query'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: url }] }],
        rowLimit: 10,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) {
      const json = await res.json()
      const rows = json?.rows || []
      out.topQueries = rows.map((r: any) => ({
        query: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        position: r.position || 0,
      }))
      out.clicks = rows.reduce((s: number, r: any) => s + (r.clicks || 0), 0)
      out.impressions = rows.reduce((s: number, r: any) => s + (r.impressions || 0), 0)
      const withPos = rows.filter((r: any) => r.position)
      out.position = withPos.length
        ? withPos.reduce((s: number, r: any) => s + r.position, 0) / withPos.length
        : undefined
    }
  } catch {
    // Search performance is a nicety next to indexing status.
  }

  return out
}

/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    if (!isVercelCron && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const key = process.env.CRUX_API_KEY || process.env.PSI_API_KEY
  if (!key) return NextResponse.json({ error: 'No Google API key configured.' }, { status: 503 })
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'No Sanity write token configured.' }, { status: 503 })
  }

  // One explicit path wins, otherwise take whatever has gone longest unchecked.
  const requested = new URL(request.url).searchParams.get('path')

  let paths: string[]
  if (requested) {
    paths = [requested.startsWith('/') ? requested : `/${requested}`]
  } else {
    const routable = await client.fetch<Array<{ path: string }>>(
      `*[_type in ["page","post","client","goldEvent"] && defined(slug.current) && seo.robots.index != false]{
         "path": select(
           _type == "goldEvent" => "/gold/" + slug.current,
           _type == "client" => "/portfolio/" + slug.current,
           slug.current == "home" => "/",
           "/" + slug.current
         )
       }`,
    )
    const audited = await client.fetch<Array<{ path: string; fetchedAt: string }>>(
      `*[_type == "seoAudit" && scope == "page"]{path, fetchedAt}`,
    )
    const lastSeen = new Map(audited.map((a) => [a.path, a.fetchedAt]))
    paths = routable
      .map((r) => r.path)
      .sort((a, b) => (lastSeen.get(a) || '').localeCompare(lastSeen.get(b) || ''))
      .slice(0, 40)
  }

  const token = await googleAccessToken()
  const startedAt = Date.now()
  const audited: unknown[] = []
  const skipped: string[] = []

  const auditOne = async (path: string) => {
    const fetchedAt = new Date().toISOString()
    try {
      const url = `${SITE.replace(/\/$/, '')}${path}`
      const [lighthouse, search] = await Promise.all([
        runLighthouse(url, key),
        token ? runSearchConsole(`${GSC_SITE.replace(/\/$/, '')}${path}`, token) : Promise.resolve(null),
      ])

      await client.createOrReplace({
        _id: `seoAudit.${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'}`,
        _type: 'seoAudit',
        url,
        path,
        scope: 'page',
        // fetchedAt records a successful look. A page whose audit failed keeps
        // its old value so it stays near the front of the rotation instead of
        // waiting a full cycle for another try.
        fetchedAt: lighthouse.error ? undefined : fetchedAt,
        lastAttemptAt: fetchedAt,
        lighthouseSeoScore: lighthouse.seo,
        lighthouseAccessibilityScore: lighthouse.accessibility,
        lighthouseBestPracticesScore: lighthouse.bestPractices,
        lighthousePerformanceScore: lighthouse.performance,
        lighthouseFailures: lighthouse.failures.map((f, i) => ({ _key: `a${i}`, _type: 'audit', ...f })),
        lighthouseError: lighthouse.error,
        indexVerdict: search?.indexVerdict,
        indexStatus: search?.indexStatus,
        robotsState: search?.robotsState,
        canonicalGoogle: search?.canonicalGoogle,
        lastCrawledAt: search?.lastCrawledAt,
        clicks: search?.clicks,
        impressions: search?.impressions,
        position: search?.position,
        topQueries: (search?.topQueries || []).map((q, i) => ({ _key: `q${i}`, _type: 'query', ...q })),
        searchConsoleError: search?.error,
      } as never)

      audited.push({ path, seo: lighthouse.seo, indexed: search?.indexVerdict, failures: lighthouse.failures.length, error: lighthouse.error })
    } catch (error) {
      audited.push({ path, error: error instanceof Error ? error.message : 'failed' })
    }
  }

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    if (Date.now() - startedAt > TIME_BUDGET_MS - RESERVE_MS) {
      skipped.push(...paths.slice(i))
      break
    }
    await Promise.allSettled(paths.slice(i, i + BATCH_SIZE).map(auditOne))
  }

  // The 404 log prune rides along here. It is a handful of queries, and the
  // hosting plan allows only two scheduled jobs, so it does not get its own.
  let pruned: unknown = 'skipped'
  try {
    const origin = new URL(request.url).origin
    const res = await fetch(`${origin}/api/cron/prune-404s`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      signal: AbortSignal.timeout(10_000),
    })
    pruned = res.ok ? await res.json() : `prune returned ${res.status}`
  } catch {
    pruned = 'prune did not run'
  }

  return NextResponse.json({
    ok: true,
    startedAt: new Date(startedAt).toISOString(),
    tookMs: Date.now() - startedAt,
    pruned,
    searchConsole: token ? 'connected' : 'not configured, Lighthouse only',
    audited,
    // Anything the clock ran out on is simply first in line next time.
    ranOutOfTimeFor: skipped.length ? skipped : undefined,
  })
}
