/**
 * Historical Core Web Vitals trending (SOW 2.5, ruleset 05 section 9).
 *
 * Deliberately free of imports so it can be unit tested directly. Thresholds
 * are passed in by the caller from the single METRICS table in `cwv.ts`, rather
 * than duplicated here.
 *
 * For all three metrics a lower number is better, which is why the direction
 * logic can treat them identically.
 */

export interface TrendPoint {
  /** ISO date (YYYY-MM-DD) this reading covers. */
  date: string
  value: number
  /** True for the weekly points backfilled from the CrUX History API. */
  seeded: boolean
}

export type TrendDirection = 'improving' | 'stable' | 'degrading'

export interface TrendSummary {
  direction: TrendDirection
  /** Signed change as a fraction: negative means the metric got faster. */
  change: number
  /** A sentence to show the editor, which is the part they will actually read. */
  sentence: string
}

export type RangeKey = 30 | 90 | 'all'

/**
 * A reading is only usable if it actually has a number. Snapshots recorded on
 * days when Google had no data are kept in the dataset (they are evidence the
 * check ran) but must never be plotted as though they were zero.
 */
export function buildSeries(
  snapshots: Array<{ [key: string]: unknown }>,
  metric: string,
): TrendPoint[] {
  const points: TrendPoint[] = []
  for (const s of snapshots) {
    if (s.hasData === false) continue
    const raw = s[metric]
    if (typeof raw !== 'number' || Number.isNaN(raw)) continue
    const date = String(s.periodEnd || s.fetchedAt || '').slice(0, 10)
    if (!date) continue
    points.push({ date, value: raw, seeded: s.seeded === true })
  }
  // Oldest first, which is the order a chart reads in.
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

export function filterRange(points: TrendPoint[], range: RangeKey, now: Date = new Date()): TrendPoint[] {
  if (range === 'all') return points
  const cutoff = new Date(now.getTime() - range * 86_400_000).toISOString().slice(0, 10)
  return points.filter((p) => p.date >= cutoff)
}

function median(values: number[]): number {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Compare the start of the range with the end.
 *
 * Medians of each half, rather than means or single endpoints, because lab
 * readings are noisy: two runs of the same page ten minutes apart have been
 * observed on this site differing by more than a factor of two. A single
 * outlier must not be allowed to announce a trend that is not there.
 *
 * Halves rather than thirds specifically: with six readings a third is two
 * points, and the median of two points is their mean, which one wild reading
 * dominates. Halves keep a genuine middle value to fall back on.
 *
 * `noiseFloor` is the fraction of change below which we say nothing has
 * happened. Ten percent is deliberately conservative; claiming an improvement
 * that is really measurement noise is worse than saying "about the same".
 */
export function trendDirection(
  points: TrendPoint[],
  options: { noiseFloor?: number; label?: string; format?: (v: number) => string } = {},
): TrendSummary | null {
  const { noiseFloor = 0.1, label = 'This metric', format } = options
  // Fewer than four readings is not a trend, it is a couple of numbers.
  if (points.length < 4) return null

  const half = Math.max(2, Math.floor(points.length / 2))
  const first = median(points.slice(0, half).map((p) => p.value))
  const last = median(points.slice(-half).map((p) => p.value))
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null

  const show = format || ((v: number) => String(Math.round(v)))

  // A starting value of zero is not an error case: CLS is legitimately 0 on a
  // page that never shifts, which is the best possible result. Percentage
  // change is undefined from zero, so these are worded without one rather than
  // reported as "no trend available", which would read as a broken tool
  // precisely when the news is good.
  if (first === 0) {
    if (last === 0) {
      return {
        direction: 'stable',
        change: 0,
        sentence: `${label} has stayed at ${show(0)} throughout, which is as good as it gets.`,
      }
    }
    return {
      direction: 'degrading',
      change: Infinity,
      sentence: `${label} has got worse over this period (${show(first)} to ${show(last)}). Lower is better.`,
    }
  }

  const change = (last - first) / first

  if (Math.abs(change) < noiseFloor) {
    return {
      direction: 'stable',
      change,
      sentence: `${label} has stayed about the same over this period (${show(first)} to ${show(last)}).`,
    }
  }

  const pct = Math.abs(Math.round(change * 100))
  if (change < 0) {
    return {
      direction: 'improving',
      change,
      sentence: `${label} has improved by about ${pct}% over this period (${show(first)} to ${show(last)}). Lower is better.`,
    }
  }
  return {
    direction: 'degrading',
    change,
    sentence: `${label} has got worse by about ${pct}% over this period (${show(first)} to ${show(last)}). Lower is better.`,
  }
}

/**
 * Whether backfilled weekly points and daily points both appear in the range.
 *
 * Rule 24 is explicit that this must be labelled rather than smoothed over: a
 * chart that silently mixes one-per-week and one-per-day readings looks like
 * activity increased when only the sampling rate did.
 */
export function hasGranularityShift(points: TrendPoint[]): boolean {
  return points.some((p) => p.seeded) && points.some((p) => !p.seeded)
}

/** Where the seeded run ends, so a chart can mark the handover. */
export function seededBoundary(points: TrendPoint[]): string | null {
  const seeded = points.filter((p) => p.seeded)
  if (!seeded.length || seeded.length === points.length) return null
  return seeded[seeded.length - 1].date
}
