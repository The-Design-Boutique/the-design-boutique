'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import {
  METRICS, BAND_LABEL, STALE_AFTER_DAYS,
  bandFor, formatMetric, daysSince,
  type Band, type MetricKey,
} from '../../app/lib/cwv'
import {
  buildSeries, filterRange, hasGranularityShift, trendDirection,
  type RangeKey,
} from '../../app/lib/cwvTrend'
import { CwvTrendChart } from '../components/CwvTrendChart'
import { timeAgo } from '../../app/lib/timeAgo'
import { BAND_VAR, useBandVars } from '../lib/bandColors'

/* eslint-disable @typescript-eslint/no-explicit-any */

const BAND_COLOR: Record<Band, string> = BAND_VAR

/**
 * Every colour here comes from the Studio's own theme rather than a literal.
 *
 * This panel was written against a dark theme and used near-black cards with
 * pale grey text. When the Studio was rethemed to warm paper, all of it became
 * dark-on-light and effectively unreadable: the text was still there, and
 * nobody could see it.
 *
 * The variables below are set by Sanity on every Card, so they follow light and
 * dark automatically and will keep following any future retheme. The rule for
 * anything added here is simply not to write a hex value: if a colour is needed
 * that is not in this list, it probably wants a Sanity UI component instead.
 *
 * The performance bands are the one thing not taken from Sanity, because green,
 * amber and red are what the numbers mean rather than decoration. They still do
 * not appear here as hex values: Google's published colours are unreadable on a
 * light background, so each scheme gets its own shade of the same hue. See
 * bandColors.
 */
const S: Record<string, any> = {
  wrap: { padding: '28px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' },
  h1: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--card-fg-color)' },
  sub: { color: 'var(--card-muted-fg-color)', fontSize: 14, margin: '0 0 22px' },
  h2: { fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'var(--card-fg-color)' },
  sectionNote: {
    color: 'var(--card-muted-fg-color)', fontSize: 13, margin: '0 0 16px',
    maxWidth: 760, lineHeight: 1.55,
  },
  bar: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  toggle: {
    display: 'inline-flex', border: '1px solid var(--card-border-color)',
    borderRadius: 4, overflow: 'hidden',
  },
  tab: (on: boolean): CSSProperties => ({
    padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 0,
    // Selected reverses the card's own colours, which stays legible in either
    // theme without naming a colour.
    background: on ? 'var(--card-accent-fg-color)' : 'transparent',
    color: on ? 'var(--card-bg-color)' : 'var(--card-fg-color)',
  }),
  btn: {
    padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'transparent', color: 'var(--card-fg-color)',
    border: '1px solid var(--card-border-color)', borderRadius: 4,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  card: {
    border: '1px solid var(--card-border-color)', borderRadius: 6,
    padding: '18px 20px', background: 'var(--card-bg-color)',
    color: 'var(--card-fg-color)',
  },
  metricLabel: { fontSize: 13, color: 'var(--card-muted-fg-color)', margin: '0 0 2px' },
  metricName: { fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--card-fg-color)' },
  value: { fontSize: 34, fontWeight: 700, lineHeight: 1.1, margin: '0 0 10px' },
  pill: (c: string): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: c, border: `1px solid ${c}`,
    borderRadius: 999, padding: '3px 10px',
  }),
  dot: (c: string): CSSProperties => ({ width: 8, height: 8, borderRadius: 999, background: c }),
  blurb: { fontSize: 12.5, color: 'var(--card-muted-fg-color)', margin: '12px 0 0', lineHeight: 1.5 },
  notice: (tone: 'warn' | 'info' | 'error'): CSSProperties => ({
    // Tinted from the band colours so a warning still reads as a warning, but
    // over the card's own background rather than a hardcoded dark one.
    border: `1px solid ${
      tone === 'error' ? BAND_COLOR.poor : tone === 'warn' ? BAND_COLOR['needs-improvement'] : 'var(--card-border-color)'
    }`,
    background: 'var(--card-bg-color)',
    color: 'var(--card-fg-color)',
    borderRadius: 6, padding: '13px 16px', marginBottom: 18, fontSize: 13.5, lineHeight: 1.55,
  }),
  spark: { display: 'block', marginTop: 14 },
}

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--card-muted-fg-color)'
  if (score >= 90) return BAND_COLOR.good
  if (score >= 50) return BAND_COLOR['needs-improvement']
  return BAND_COLOR.poor
}

function Sparkline({ points, band }: { points: number[]; band: Band | null }) {
  if (points.length < 2) return null
  const w = 200, h = 34
  const min = Math.min(...points), max = Math.max(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / span) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const color = band ? BAND_COLOR[band] : 'var(--card-muted-fg-color)'
  return (
    <svg style={S.spark} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend over recent weeks">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function CwvDashboard() {
  const client = useClient({ apiVersion: '2025-02-19' })
  const bandVars = useBandVars()
  const [formFactor, setFormFactor] = useState<'PHONE' | 'DESKTOP'>('PHONE')
  const [snaps, setSnaps] = useState<any[] | null>(null)
  const [lab, setLab] = useState<any | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  // Historical trending (ruleset 05 section 9).
  const [range, setRange] = useState<RangeKey>(90)
  const [trendSource, setTrendSource] = useState<'field' | 'lab'>('field')
  const [allSnaps, setAllSnaps] = useState<any[] | null>(null)

  const load = useCallback(async () => {
    const rows = await client.fetch(
      `*[_type == "cwvSnapshot" && formFactor == $ff && scope == "origin"]
        | order(coalesce(periodEnd, fetchedAt) desc)[0...60]{
          lcp, inp, cls, periodEnd, fetchedAt, hasData, error, target, seeded
        }`,
      { ff: formFactor },
    )
    setSnaps(rows)
    const labRow = await client.fetch(
      `*[_type == "cwvSnapshot" && source == "lab" && formFactor == $ff && hasData == true]
        | order(fetchedAt desc)[0]{ performanceScore, seoScore, accessibilityScore, bestPracticesScore, lcp, cls, tbt, target, fetchedAt, hasData, error }`,
      { ff: formFactor },
    )
    setLab(labRow || null)
    // Everything with a reading, for the trend charts. Ordered oldest first so
    // the seeded weekly points lead into the daily ones.
    const everything = await client.fetch(
      `*[_type == "cwvSnapshot" && formFactor == $ff && hasData == true]
        | order(coalesce(periodEnd, fetchedAt) asc)[0...500]{
          source, target, lcp, inp, cls, periodEnd, fetchedAt, hasData, seeded
        }`,
      { ff: formFactor },
    )
    setAllSnaps(everything || [])
  }, [client, formFactor])

  useEffect(() => { load() }, [load])

  const latest = snaps?.[0]
  const history = useMemo(() => (snaps ? [...snaps].filter((s) => s.hasData).reverse() : []), [snaps])
  const age = daysSince(latest?.fetchedAt)

  // --- Historical trending (ruleset 05 section 9) ---
  /**
   * Only ever chart one target at a time.
   *
   * The lab URL has pointed at more than one address over the life of this
   * project, and readings of a different website plotted on the same line would
   * show a step change that looks like the site got faster or slower when all
   * that changed was what was being measured. Keep the most recently measured
   * target and drop the rest.
   */
  const forCurrentTarget = useCallback((rows: any[]) => {
    if (!rows.length) return rows
    const newest = rows[rows.length - 1]?.target
    if (!newest) return rows
    return rows.filter((r) => !r.target || r.target === newest)
  }, [])

  const fieldSnaps = useMemo(
    () => forCurrentTarget((allSnaps || []).filter((r) => r.source !== 'lab')),
    [allSnaps, forCurrentTarget],
  )
  const labSnaps = useMemo(
    () => forCurrentTarget((allSnaps || []).filter((r) => r.source === 'lab')),
    [allSnaps, forCurrentTarget],
  )
  const fieldHasHistory = useMemo(
    () => METRICS.some((m) => buildSeries(fieldSnaps, m.key).length >= 2),
    [fieldSnaps],
  )
  const labHasHistory = useMemo(
    () => METRICS.some((m) => buildSeries(labSnaps, m.key).length >= 2),
    [labSnaps],
  )
  // Land on whichever source actually has something to show.
  useEffect(() => {
    if (allSnaps === null) return
    if (!fieldHasHistory && labHasHistory) setTrendSource('lab')
  }, [allSnaps, fieldHasHistory, labHasHistory])

  const trendSnaps = trendSource === 'lab' ? labSnaps : fieldSnaps

  // "Refresh now" is throttled: CrUX itself only updates once a day, so a
  // faster refresh cannot produce newer numbers.
  const refresh = async () => {
    setBusy(true); setMsg(null)
    try {
      // The server enforces the real throttle and returns 429 with a sentence
      // worth showing, so there is no need to guess at it here.
      const res = await fetch('/api/cron/cwv')
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'Could not refresh just now.')
      } else {
        setMsg('Refreshed.')
        await load()
      }
    } catch {
      setMsg('Could not reach the refresh service.')
    } finally {
      setBusy(false)
    }
  }

  return (
    // The band colours are defined here, at the top, so that everything below
    // them resolves BAND_VAR, including the SVG in the sparklines and the chart.
    <div style={{ ...S.wrap, ...bandVars }}>
      <h1 style={S.h1}>Site Speed</h1>
      <p style={S.sub}>
        Two views: how real visitors experience the site, and a lab test you can run any time.
      </p>

      <div style={S.bar}>
        <div style={S.toggle} role="group" aria-label="Device">
          {(['PHONE', 'DESKTOP'] as const).map((ff) => (
            <button key={ff} type="button" style={S.tab(formFactor === ff)} onClick={() => setFormFactor(ff)}>
              {ff === 'PHONE' ? 'Phone' : 'Desktop'}
            </button>
          ))}
        </div>
        <button type="button" style={S.btn} onClick={refresh} disabled={busy}>
          {busy ? 'Checking…' : 'Refresh now'}
        </button>
        {latest?.fetchedAt ? (
          <span style={{ fontSize: 12.5, color: 'var(--card-muted-fg-color)' }}>
            Last checked {timeAgo(latest.fetchedAt)}
          </span>
        ) : null}
      </div>

      {msg ? <div style={S.notice('info')}>{msg}</div> : null}

      <h2 style={S.h2}>From real visitors</h2>
      <p style={S.sectionNote}>
        Google&rsquo;s measurements of people who actually visited, over the last 28 days.
        These are the numbers that count towards search rankings.
      </p>

      {snaps === null ? (
        <p style={{ color: 'var(--card-muted-fg-color)' }}>Loading…</p>
      ) : !latest ? (
        <div style={S.notice('info')}>
          <strong>No readings yet.</strong>
          <br />
          Once the daily check has run at least once, the results will appear here.
        </div>
      ) : (
        <>
          {latest.error ? (
            <div style={S.notice('error')}>
              <strong>The last check did not complete.</strong>
              <br />
              Showing the most recent successful reading below. This usually fixes itself on the next daily run.
            </div>
          ) : null}

          {age !== null && age > STALE_AFTER_DAYS ? (
            <div style={S.notice('warn')}>
              <strong>This data is {age} days old.</strong>
              <br />
              The daily check may not be running. Worth flagging to whoever maintains the site.
            </div>
          ) : null}

          {latest.hasData === false && !latest.error ? (
            <div style={S.notice('info')}>
              <strong>Not enough real-user data yet.</strong>
              <br />
              Google only reports these numbers once a site has enough visitors on {formFactor === 'PHONE' ? 'phones' : 'desktop'}. Nothing is wrong with the site.
            </div>
          ) : (
            <div style={S.grid}>
              {METRICS.map((m) => {
                const value = latest[m.key] as number | null
                const band = bandFor(m.key as MetricKey, value)
                const color = band ? BAND_COLOR[band] : 'var(--card-muted-fg-color)'
                const series = history.map((h) => h[m.key]).filter((v) => typeof v === 'number') as number[]
                return (
                  <div key={m.key} style={S.card}>
                    <p style={S.metricLabel}>{m.key.toUpperCase()}</p>
                    <p style={S.metricName}>{m.label}</p>
                    <p style={{ ...S.value, color }}>{formatMetric(m.key as MetricKey, value)}</p>
                    {band ? (
                      <span style={S.pill(color)}>
                        <span style={S.dot(color)} aria-hidden="true" />
                        {BAND_LABEL[band]}
                      </span>
                    ) : null}
                    <Sparkline points={series.slice(-20)} band={band} />
                    <p style={S.blurb}>{m.blurb}</p>
                  </div>
                )
              })}
            </div>
          )}

          {latest.periodEnd ? (
            <p style={{ ...S.sub, marginTop: 22, marginBottom: 0 }}>
              Based on visits up to {latest.periodEnd}. Google refreshes this once a day.
            </p>
          ) : null}
        </>
      )}

      <h2 style={{ ...S.h2, marginTop: 38 }}>History</h2>
      <p style={S.sectionNote}>
        How each measurement has moved over time. The coloured bands behind each line are
        Google&rsquo;s own thresholds: inside the green band is good, the amber band needs
        improvement, the red band is poor.
      </p>

      <div style={S.bar}>
        <div style={S.toggle} role="group" aria-label="Period">
          {([30, 90, 'all'] as const).map((r) => (
            <button key={String(r)} type="button" style={S.tab(range === r)} onClick={() => setRange(r)}>
              {r === 'all' ? 'All time' : `${r} days`}
            </button>
          ))}
        </div>
        <div style={S.toggle} role="group" aria-label="Data source">
          {(['field', 'lab'] as const).map((src) => (
            <button
              key={src}
              type="button"
              style={S.tab(trendSource === src)}
              onClick={() => setTrendSource(src)}
            >
              {src === 'field' ? 'Real visitors' : 'Lab test'}
            </button>
          ))}
        </div>
      </div>

      {allSnaps === null ? (
        <p style={{ color: 'var(--card-muted-fg-color)' }}>Loading&#8230;</p>
      ) : trendSource === 'field' && !fieldHasHistory ? (
        <div style={S.notice('info')}>
          <strong>No history from real visitors yet.</strong>
          <br />
          Google has no Chrome UX Report data for this site, so there is nothing to chart here. That
          needs more visitors, not a change to the site.
          {labHasHistory ? ' The lab test does have history: switch to it above.' : ''}
        </div>
      ) : trendSource === 'lab' && !labHasHistory ? (
        <div style={S.notice('info')}>
          <strong>Not enough lab tests yet.</strong>
          <br />
          A chart needs at least two runs. One happens automatically each day.
        </div>
      ) : (
        <>
          {trendSource === 'lab' ? (
            <div style={S.notice('info')}>
              Lab results move around more than real-visitor data, because each run is a fresh test
              on shared equipment. Read the shape over weeks rather than any single point, and
              remember these do not count towards search rankings.
            </div>
          ) : null}

          {trendSnaps.length && trendSnaps[trendSnaps.length - 1]?.target ? (
            <p style={{ ...S.sub, marginTop: 0, marginBottom: 14 }}>
              Measuring {trendSnaps[trendSnaps.length - 1].target}
            </p>
          ) : null}

          <div style={{ display: 'grid', gap: 16 }}>
            {METRICS.map((m) => {
              const all = buildSeries(trendSnaps, m.key)
              const points = filterRange(all, range)
              const fmt = (v: number) => formatMetric(m.key as MetricKey, v)
              const summary = trendDirection(points, {
                label: m.label,
                format: fmt,
                // Lab readings are noisier, so demand a bigger move before
                // calling it a trend.
                noiseFloor: trendSource === 'lab' ? 0.15 : 0.1,
              })
              const mixed = hasGranularityShift(points)
              const trendColor =
                summary?.direction === 'improving'
                  ? BAND_COLOR.good
                  : summary?.direction === 'degrading'
                    ? BAND_COLOR.poor
                    : 'var(--card-muted-fg-color)'
              return (
                <div key={m.key} style={S.card}>
                  <p style={S.metricLabel}>{m.key.toUpperCase()}</p>
                  <p style={S.metricName}>{m.label}</p>
                  {points.length < 2 && trendSource === 'lab' && m.key === 'inp' ? (
                    // Not a gap in the data: INP measures how a page responds to a
                    // real person, and there is nobody in a lab test to do the tapping.
                    <p style={{ color: 'var(--card-muted-fg-color)', fontSize: 13, margin: 0 }}>
                      This one cannot be measured by a lab test. It records how quickly the page
                      responds when somebody taps or clicks, and a lab test has nobody tapping. It
                      appears here once there is enough real visitor data. Total Blocking Time, in
                      the lab section above, is the closest stand-in.
                    </p>
                  ) : points.length < 2 ? (
                    <p style={{ color: 'var(--card-muted-fg-color)', fontSize: 13, margin: 0 }}>
                      No readings in this period. Try a longer range.
                    </p>
                  ) : (
                    <>
                      <CwvTrendChart points={points} good={m.good} poor={m.poor} format={fmt} />
                      <p style={{ ...S.blurb, color: trendColor, fontWeight: 600 }}>
                        {summary
                          ? summary.sentence
                          : `Not enough readings yet to say which way ${m.label} is going.`}
                      </p>
                      {mixed ? (
                        <p style={S.blurb}>
                          The earlier part of this chart is one reading per week, backfilled from
                          Google&rsquo;s history. The later part is one per day. The line gets busier
                          at that point because readings became more frequent, not because the site
                          changed.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <h2 style={{ ...S.h2, marginTop: 38 }}>Lab test</h2>
      <p style={S.sectionNote}>
        A single test run on Google&rsquo;s own equipment. It works even when there are not
        enough visitors yet for the numbers above, and it is the best way to check whether a
        change made the site faster. It does not count towards search rankings.
      </p>

      {!lab ? (
        <div style={S.notice('info')}>No lab test has run yet. It runs with the daily check.</div>
      ) : lab.hasData === false ? (
        <div style={S.notice('warn')}>The last lab test did not complete. It will try again on the next daily run.</div>
      ) : (
        <>
          <div style={S.grid}>
            <div style={S.card}>
              <p style={S.metricLabel}>OVERALL</p>
              <p style={S.metricName}>Performance score</p>
              <p style={{ ...S.value, color: scoreColor(lab.performanceScore) }}>
                {lab.performanceScore ?? <span style={{ fontSize: 18 }}>No data</span>}
                {lab.performanceScore == null ? null : <span style={{ fontSize: 18, color: 'var(--card-muted-fg-color)' }}> / 100</span>}
              </p>
              <p style={S.blurb}>Google&rsquo;s overall speed rating for this page. 90 and above is good, below 50 is poor.</p>
            </div>
            <div style={S.card}>
              <p style={S.metricLabel}>LCP</p>
              <p style={S.metricName}>Largest Contentful Paint</p>
              <p style={{ ...S.value, color: BAND_COLOR[bandFor('lcp', lab.lcp) || 'poor'] }}>
                {formatMetric('lcp', lab.lcp)}
              </p>
              <p style={S.blurb}>How long the main content took to appear in the test.</p>
            </div>
            <div style={S.card}>
              <p style={S.metricLabel}>TBT</p>
              <p style={S.metricName}>Total Blocking Time</p>
              <p style={{ ...S.value, color: lab.tbt == null ? 'var(--card-muted-fg-color)' : lab.tbt <= 200 ? BAND_COLOR.good : lab.tbt <= 600 ? BAND_COLOR['needs-improvement'] : BAND_COLOR.poor }}>
                {lab.tbt == null ? 'No data' : `${Math.round(lab.tbt)} ms`}
              </p>
              <p style={S.blurb}>How long the page was busy and unable to respond. A lab stand-in for responsiveness.</p>
            </div>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '26px 0 4px' }}>Other Lighthouse checks</h3>
          <p style={{ ...S.sectionNote, marginBottom: 14 }}>
            The same test scores three more areas. These are a starting point rather than a verdict,
            and none of them counts towards search rankings directly.
          </p>
          <div style={S.notice('info')}>
            <strong>While the site is in staging, expect the SEO score to sit around 70.</strong>
            <br />
            The staging site is deliberately hidden from search engines until go live, and Lighthouse
            counts that as a failure. It is the only SEO check currently failing, so this score should
            jump close to 100 once the site is live. Nothing needs fixing.
          </div>
          <div style={S.grid}>
            {[
              {
                key: 'seoScore',
                name: 'SEO',
                blurb: 'Technical checks a search engine cares about: a valid canonical, links it can follow, a meta description present. It does not judge your writing.',
              },
              {
                key: 'accessibilityScore',
                name: 'Accessibility',
                blurb: 'Automated checks such as colour contrast, image alt text and form labels. It catches roughly a third of real accessibility problems, so a good score is a floor, not a pass.',
              },
              {
                key: 'bestPracticesScore',
                name: 'Best practices',
                blurb: 'General site health: secure connections, no errors in the browser console, images at their correct dimensions.',
              },
            ].map((c) => {
              const v = lab[c.key] as number | null | undefined
              return (
                <div key={c.key} style={S.card}>
                  <p style={S.metricLabel}>{c.name.toUpperCase()}</p>
                  <p style={S.metricName}>{c.name}</p>
                  <p style={{ ...S.value, color: scoreColor(v) }}>
                    {v ?? <span style={{ fontSize: 18 }}>No data</span>}
                    {v == null ? null : <span style={{ fontSize: 18, color: 'var(--card-muted-fg-color)' }}> / 100</span>}
                  </p>
                  <p style={S.blurb}>{c.blurb}</p>
                </div>
              )
            })}
          </div>

          <p style={{ ...S.sub, marginTop: 14, marginBottom: 0 }}>
            Tested: {lab.target} · {timeAgo(lab.fetchedAt) || 'time unknown'}
          </p>
        </>
      )}
    </div>
  )
}

export default CwvDashboard
