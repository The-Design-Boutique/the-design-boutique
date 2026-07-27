/**
 * Core Web Vitals thresholds and banding.
 *
 * Values are assessed at the 75th percentile, which is what the Chrome UX
 * Report publishes and what Google's thresholds are defined against.
 *
 * FID is deliberately absent: it was retired in 2024 and replaced by INP.
 * See docs/02-ruleset-cwv-dashboard.md.
 */

export type Band = 'good' | 'needs-improvement' | 'poor'
export type MetricKey = 'lcp' | 'inp' | 'cls'

export const METRICS: {
  key: MetricKey
  label: string
  crux: string
  unit: 'ms' | 'score'
  good: number
  poor: number
  blurb: string
}[] = [
  {
    key: 'lcp', label: 'Largest Contentful Paint', crux: 'largest_contentful_paint', unit: 'ms',
    good: 2500, poor: 4000,
    blurb: 'How long the main content takes to appear.',
  },
  {
    key: 'inp', label: 'Interaction to Next Paint', crux: 'interaction_to_next_paint', unit: 'ms',
    good: 200, poor: 500,
    blurb: 'How quickly the page responds when someone taps or clicks.',
  },
  {
    key: 'cls', label: 'Cumulative Layout Shift', crux: 'cumulative_layout_shift', unit: 'score',
    good: 0.1, poor: 0.25,
    blurb: 'How much the page jumps around while it loads.',
  },
]

export function bandFor(key: MetricKey, value: number | null | undefined): Band | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  const m = METRICS.find((x) => x.key === key)
  if (!m) return null
  if (value <= m.good) return 'good'
  if (value <= m.poor) return 'needs-improvement'
  return 'poor'
}

/** "2.4 s" / "180 ms" / "0.05" — the way Google presents each metric. */
export function formatMetric(key: MetricKey, value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'No data'
  if (key === 'cls') return value.toFixed(2)
  if (key === 'lcp') return `${(value / 1000).toFixed(1)} s`
  return `${Math.round(value)} ms`
}

export const BAND_LABEL: Record<Band, string> = {
  good: 'Good',
  'needs-improvement': 'Needs improvement',
  poor: 'Poor',
}

/** Snapshots older than this show a staleness warning on the dashboard. */
export const STALE_AFTER_DAYS = 3

export function daysSince(iso?: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((Date.now() - then) / 86_400_000)
}
