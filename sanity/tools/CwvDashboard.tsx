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

/* eslint-disable @typescript-eslint/no-explicit-any */

const BAND_COLOR: Record<Band, string> = {
  good: '#0cce6b',
  'needs-improvement': '#ffa400',
  poor: '#ff4e42',
}

const S: Record<string, any> = {
  wrap: { padding: '28px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' },
  h1: { fontSize: 24, fontWeight: 700, margin: '0 0 4px' },
  sub: { color: '#8a8a8a', fontSize: 14, margin: '0 0 22px' },
  h2: { fontSize: 17, fontWeight: 700, margin: '0 0 4px' },
  sectionNote: { color: '#8a8a8a', fontSize: 13, margin: '0 0 16px', maxWidth: 760, lineHeight: 1.55 },
  bar: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  toggle: { display: 'inline-flex', border: '1px solid #333', borderRadius: 4, overflow: 'hidden' },
  tab: (on: boolean): CSSProperties => ({
    padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 0,
    background: on ? '#f26722' : 'transparent', color: on ? '#fff' : '#bbb',
  }),
  btn: {
    padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'transparent', color: '#ddd', border: '1px solid #333', borderRadius: 4,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 },
  card: { border: '1px solid #2a2a2a', borderRadius: 6, padding: '18px 20px', background: '#151515' },
  metricLabel: { fontSize: 13, color: '#9a9a9a', margin: '0 0 2px' },
  metricName: { fontSize: 15, fontWeight: 700, margin: '0 0 10px' },
  value: { fontSize: 34, fontWeight: 700, lineHeight: 1.1, margin: '0 0 10px' },
  pill: (c: string): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, color: c, border: `1px solid ${c}`,
    borderRadius: 999, padding: '3px 10px',
  }),
  dot: (c: string): CSSProperties => ({ width: 8, height: 8, borderRadius: 999, background: c }),
  blurb: { fontSize: 12.5, color: '#8a8a8a', margin: '12px 0 0', lineHeight: 1.5 },
  notice: (tone: 'warn' | 'info' | 'error'): CSSProperties => ({
    border: `1px solid ${tone === 'error' ? '#5a2020' : tone === 'warn' ? '#5a4620' : '#2a2a2a'}`,
    background: tone === 'error' ? '#241313' : tone === 'warn' ? '#241f13' : '#151515',
    borderRadius: 6, padding: '13px 16px', marginBottom: 18, fontSize: 13.5, lineHeight: 1.55,
  }),
  spark: { display: 'block', marginTop: 14 },
}

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#666'
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
  const color = band ? BAND_COLOR[band] : '#666'
  return (
    <svg style={S.spark} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend over recent weeks">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function CwvDashboard() {
  const client = useClient({ apiVersion: '2025-02-19' })
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
        | order(fetchedAt desc)[0]{ performanceScore, lcp, cls, tbt, target, fetchedAt, hasData, error }`,
      { ff: formFactor },
    )
    setLab(labRow || null)
    // Everything with a reading, for the trend charts. Ordered oldest first so
    // the seeded weekly points lead into the daily ones.
    const everything = await client.fetch(
      `*[_type == "cwvSnapshot" && formFactor == $ff && hasData == true]
        | order(coalesce(periodEnd, fetchedAt) asc)[0...500]{
          source, lcp, inp, cls, periodEnd, fetchedAt, hasData, seeded
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
  const fieldSnaps = useMemo(() => (allSnaps || []).filter((r) => r.source !== 'lab'), [allSnaps])
  const labSnaps = useMemo(() => (allSnaps || []).filter((r) => r.source === 'lab'), [allSnaps])
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
    const last = Number(window.localStorage.getItem('cwvLastRefresh') || 0)
    const mins = (Date.now() - last) / 60000
    if (mins < 10) {
      setMsg(`Already refreshed ${Math.round(mins)} minute${Math.round(mins) === 1 ? '' : 's'} ago. Google updates this data once a day, so checking again now will not show anything newer.`)
      return
    }
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/cron/cwv')
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'Could not refresh just now.')
      } else {
        window.localStorage.setItem('cwvLastRefresh', String(Date.now()))
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
    <div style={S.wrap}>
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
          <span style={{ fontSize: 12.5, color: '#8a8a8a' }}>
            Last checked {age === 0 ? 'today' : age === 1 ? 'yesterday' : `${age} days ago`}
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
        <p style={{ color: '#8a8a8a' }}>Loading…</p>
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
                const color = band ? BAND_COLOR[band] : '#666'
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
        <p style={{ color: '#8a8a8a' }}>Loading&#8230;</p>
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
                    : '#9a9a9a'
              return (
                <div key={m.key} style={S.card}>
                  <p style={S.metricLabel}>{m.key.toUpperCase()}</p>
                  <p style={S.metricName}>{m.label}</p>
                  {points.length < 2 ? (
                    <p style={{ color: '#8a8a8a', fontSize: 13, margin: 0 }}>
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
                {lab.performanceScore ?? '—'}<span style={{ fontSize: 18, color: '#8a8a8a' }}> / 100</span>
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
              <p style={{ ...S.value, color: lab.tbt == null ? '#666' : lab.tbt <= 200 ? BAND_COLOR.good : lab.tbt <= 600 ? BAND_COLOR['needs-improvement'] : BAND_COLOR.poor }}>
                {lab.tbt == null ? 'No data' : `${Math.round(lab.tbt)} ms`}
              </p>
              <p style={S.blurb}>How long the page was busy and unable to respond. A lab stand-in for responsiveness.</p>
            </div>
          </div>
          <p style={{ ...S.sub, marginTop: 14, marginBottom: 0 }}>
            Tested: {lab.target}
          </p>
        </>
      )}
    </div>
  )
}

export default CwvDashboard
