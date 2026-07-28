import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSeries,
  filterRange,
  hasGranularityShift,
  seededBoundary,
  trendDirection,
  type TrendPoint,
} from '../app/lib/cwvTrend.ts'

/**
 * Tests for Core Web Vitals trending (SOW 2.5, ruleset 05 section 9).
 *
 * The risk this guards against is stating a trend that is not real. Lab
 * readings for this site have been observed differing by more than a factor of
 * two between runs ten minutes apart, so "improving" has to mean something.
 */

const p = (date: string, value: number, seeded = false): TrendPoint => ({ date, value, seeded })

describe('buildSeries', () => {
  test('skips snapshots that recorded no data rather than plotting them as zero', () => {
    const series = buildSeries(
      [
        { lcp: 2000, hasData: true, periodEnd: '2026-07-01' },
        { lcp: null, hasData: false, periodEnd: '2026-07-02' },
        { hasData: true, periodEnd: '2026-07-03' },
      ],
      'lcp',
    )
    assert.equal(series.length, 1)
    assert.equal(series[0].value, 2000)
  })

  test('sorts oldest first, the order a chart reads in', () => {
    const series = buildSeries(
      [
        { lcp: 3, hasData: true, periodEnd: '2026-07-03' },
        { lcp: 1, hasData: true, periodEnd: '2026-07-01' },
        { lcp: 2, hasData: true, periodEnd: '2026-07-02' },
      ],
      'lcp',
    )
    assert.deepEqual(series.map((s) => s.value), [1, 2, 3])
  })

  test('falls back to fetchedAt when there is no collection period', () => {
    const series = buildSeries([{ lcp: 5, hasData: true, fetchedAt: '2026-07-05T10:00:00Z' }], 'lcp')
    assert.equal(series[0].date, '2026-07-05')
  })

  test('carries the seeded flag through', () => {
    const series = buildSeries([{ lcp: 5, hasData: true, periodEnd: '2026-07-05', seeded: true }], 'lcp')
    assert.equal(series[0].seeded, true)
  })
})

describe('filterRange', () => {
  const now = new Date('2026-07-28T00:00:00Z')
  const points = [p('2026-01-01', 1), p('2026-06-01', 2), p('2026-07-20', 3)]

  test('30 days keeps only recent readings', () => {
    assert.deepEqual(filterRange(points, 30, now).map((x) => x.value), [3])
  })

  test('90 days reaches further back', () => {
    assert.deepEqual(filterRange(points, 90, now).map((x) => x.value), [2, 3])
  })

  test('all keeps everything', () => {
    assert.equal(filterRange(points, 'all', now).length, 3)
  })
})

describe('trendDirection', () => {
  test('says nothing with fewer than four readings', () => {
    assert.equal(trendDirection([p('2026-07-01', 100), p('2026-07-02', 50)]), null)
  })

  test('reports a genuine improvement, and says lower is better', () => {
    const points = [3000, 2900, 2800, 1500, 1400, 1300].map((v, i) => p(`2026-07-0${i + 1}`, v))
    const summary = trendDirection(points)
    assert.equal(summary?.direction, 'improving')
    assert.match(summary!.sentence, /improved/)
    assert.match(summary!.sentence, /Lower is better/)
  })

  test('reports a genuine degradation', () => {
    const points = [1000, 1100, 1200, 3000, 3100, 3200].map((v, i) => p(`2026-07-0${i + 1}`, v))
    assert.equal(trendDirection(points)?.direction, 'degrading')
  })

  test('calls small movement stable rather than inventing a trend', () => {
    const points = [2000, 2010, 1990, 2020, 1995, 2005].map((v, i) => p(`2026-07-0${i + 1}`, v))
    assert.equal(trendDirection(points)?.direction, 'stable')
  })

  test('a single wild outlier does not create a trend', () => {
    // One absurd reading at the end, of the kind a noisy lab run produces.
    const points = [2000, 2000, 2000, 2000, 2000, 20000].map((v, i) => p(`2026-07-0${i + 1}`, v))
    assert.equal(trendDirection(points)?.direction, 'stable')
  })

  test('respects a higher noise floor for noisy sources', () => {
    // A 12% move: a trend at the default floor, noise at the lab floor.
    const points = [2000, 2000, 2000, 1760, 1760, 1760].map((v, i) => p(`2026-07-0${i + 1}`, v))
    assert.equal(trendDirection(points, { noiseFloor: 0.1 })?.direction, 'improving')
    assert.equal(trendDirection(points, { noiseFloor: 0.15 })?.direction, 'stable')
  })

  test('a metric that is zero throughout is stable, not unreportable', () => {
    // CLS is legitimately 0 on a page that never shifts. Reporting "no trend
    // available" for the best possible result would read as a broken tool.
    const points = [0, 0, 0, 0, 0, 0].map((v, i) => p(`2026-07-0${i + 1}`, v))
    const summary = trendDirection(points, { format: (v) => v.toFixed(2) })
    assert.equal(summary?.direction, 'stable')
    assert.match(summary!.sentence, /as good as it gets/)
  })

  test('moving off zero is reported as degrading, without a percentage', () => {
    const points = [0, 0, 0, 0.3, 0.3, 0.3].map((v, i) => p(`2026-07-0${i + 1}`, v))
    const summary = trendDirection(points, { format: (v) => v.toFixed(2) })
    assert.equal(summary?.direction, 'degrading')
    assert.doesNotMatch(summary!.sentence, /%/)
  })

  test('uses the caller formatter so the sentence reads in real units', () => {
    const points = [3000, 3000, 3000, 1000, 1000, 1000].map((v, i) => p(`2026-07-0${i + 1}`, v))
    const summary = trendDirection(points, {
      label: 'Largest Contentful Paint',
      format: (v) => `${(v / 1000).toFixed(1)} s`,
    })
    assert.match(summary!.sentence, /3\.0 s/)
    assert.match(summary!.sentence, /1\.0 s/)
  })
})

describe('granularity shift', () => {
  test('is detected when backfilled and daily points coexist', () => {
    assert.equal(hasGranularityShift([p('2026-01-01', 1, true), p('2026-07-01', 2, false)]), true)
  })

  test('is not claimed when every point is the same kind', () => {
    assert.equal(hasGranularityShift([p('2026-01-01', 1, true), p('2026-01-08', 2, true)]), false)
    assert.equal(hasGranularityShift([p('2026-07-01', 1), p('2026-07-02', 2)]), false)
  })

  test('boundary is the last backfilled reading', () => {
    const points = [p('2026-01-01', 1, true), p('2026-01-08', 2, true), p('2026-07-01', 3)]
    assert.equal(seededBoundary(points), '2026-01-08')
  })

  test('boundary is null when there is nothing to hand over', () => {
    assert.equal(seededBoundary([p('2026-07-01', 1), p('2026-07-02', 2)]), null)
  })
})
