/**
 * Reading Google Analytics, server side.
 *
 * SERVER ONLY. The credentials are the same ones Search Console uses: that
 * grant already carried analytics.readonly, so this adds no new secret to the
 * deployment and nothing extra to revoke at handover.
 *
 * Everything is read only. This can report what happened and cannot change a
 * property, create an event or mark a conversion, which is the right ceiling
 * for something a content editor opens.
 *
 * The Studio never talks to Google directly. It asks this, which means no
 * credential is ever near a browser and the shape of what comes back is ours
 * rather than Google's.
 */

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta'

export interface Metric {
  label: string
  value: number
  /** The same figure for the preceding period of equal length. */
  previous: number
  /** How to render it. Percentages and durations are not counts. */
  format?: 'number' | 'percent' | 'duration'
  /** Whether going up is good. Not always: bounce rate is better going down. */
  betterWhen?: 'higher' | 'lower'
}

export interface Row {
  label: string
  value: number
  /** Optional second column, such as sessions beside users. */
  secondary?: number
}

export interface AnalyticsSummary {
  propertyId: string
  range: { start: string; end: string; days: number }
  metrics: Metric[]
  /** One point per day, for the trend line. */
  daily: Array<{ date: string; sessions: number }>
  channels: Row[]
  topPages: Row[]
  devices: Row[]
  /** Populated only once something is marked as a key event in GA4. */
  keyEvents: Row[]
}

async function accessToken(): Promise<string> {
  const clientId = process.env.GSC_CLIENT_ID
  const clientSecret = process.env.GSC_CLIENT_SECRET
  const refreshToken = process.env.GSC_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Analytics is not configured on the server.')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error('Could not sign in to Google Analytics.')
  return (await res.json()).access_token
}

interface ReportRequest {
  dimensions?: Array<{ name: string }>
  metrics: Array<{ name: string }>
  dateRanges: Array<{ startDate: string; endDate: string }>
  orderBys?: unknown[]
  limit?: number
}

type ReportResult = {
  rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>
}

/** Google refuses a batch of more than five, so they go in chunks of five. */
const BATCH_LIMIT = 5

async function runReports(propertyId: string, requests: ReportRequest[]): Promise<ReportResult[]> {
  const token = await accessToken()

  const chunks: ReportRequest[][] = []
  for (let i = 0; i < requests.length; i += BATCH_LIMIT) {
    chunks.push(requests.slice(i, i + BATCH_LIMIT))
  }

  // The chunks are independent, so they go together rather than one after the
  // other: the panel should open in one round trip's worth of waiting.
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const res = await fetch(`${DATA_API}/properties/${propertyId}:batchRunReports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: chunk }),
        signal: AbortSignal.timeout(25_000),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Google Analytics returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
      }
      return (await res.json()).reports as ReportResult[]
    }),
  )

  return results.flat()
}

const num = (v?: string) => (v ? Number(v) || 0 : 0)

/** A tidy label for a path, since "/" reads badly in a list. */
function pageLabel(path: string): string {
  if (!path || path === '/') return 'Home'
  return path.replace(/\/$/, '')
}

export async function analyticsSummary(days = 28): Promise<AnalyticsSummary> {
  const propertyId = process.env.GA_PROPERTY_ID
  if (!propertyId) throw new Error('No Google Analytics property is configured.')

  const current = { startDate: `${days}daysAgo`, endDate: 'yesterday' }
  // The period immediately before, so every headline number has something to be
  // compared against. A number with no comparison is very hard to act on.
  const previous = { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }

  const [totals, daily, channels, pages, devices, events] = await runReports(propertyId, [
    {
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'keyEvents' },
      ],
      dateRanges: [current, previous],
    },
    {
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }],
      dateRanges: [current],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 400,
    },
    {
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      dateRanges: [current],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
    {
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      dateRanges: [current],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
    {
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
      dateRanges: [current],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    },
    {
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'keyEvents' }],
      dateRanges: [current],
      orderBys: [{ metric: { metricName: 'keyEvents' }, desc: true }],
      limit: 10,
    },
  ])

  // The totals report returns one row per date range, in the order requested.
  const now = totals.rows?.[0]?.metricValues || []
  const before = totals.rows?.[1]?.metricValues || []
  const metric = (i: number, label: string, format?: Metric['format']): Metric => ({
    label,
    value: num(now[i]?.value),
    previous: num(before[i]?.value),
    format,
    betterWhen: 'higher',
  })

  return {
    propertyId,
    range: { start: current.startDate, end: current.endDate, days },
    metrics: [
      metric(0, 'People'),
      metric(1, 'Visits'),
      metric(2, 'Engaged visits', 'percent'),
      metric(3, 'Average visit', 'duration'),
      metric(4, 'Key events'),
    ],
    daily: (daily.rows || []).map((r) => ({
      date: r.dimensionValues[0]?.value || '',
      sessions: num(r.metricValues[0]?.value),
    })),
    channels: (channels.rows || []).map((r) => ({
      label: r.dimensionValues[0]?.value || 'Unknown',
      value: num(r.metricValues[0]?.value),
      secondary: num(r.metricValues[1]?.value),
    })),
    topPages: (pages.rows || []).map((r) => ({
      label: pageLabel(r.dimensionValues[0]?.value || ''),
      value: num(r.metricValues[0]?.value),
      secondary: num(r.metricValues[1]?.value),
    })),
    devices: (devices.rows || []).map((r) => ({
      label: r.dimensionValues[0]?.value || 'Unknown',
      value: num(r.metricValues[0]?.value),
    })),
    keyEvents: (events.rows || [])
      .map((r) => ({ label: r.dimensionValues[0]?.value || '', value: num(r.metricValues[0]?.value) }))
      .filter((r) => r.value > 0),
  }
}
