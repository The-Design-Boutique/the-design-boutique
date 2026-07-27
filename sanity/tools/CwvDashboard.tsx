'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import {
  METRICS, BAND_LABEL, STALE_AFTER_DAYS,
  bandFor, formatMetric, daysSince,
  type Band, type MetricKey,
} from '../../app/lib/cwv'

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
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const rows = await client.fetch(
      `*[_type == "cwvSnapshot" && formFactor == $ff && scope == "origin"]
        | order(coalesce(periodEnd, fetchedAt) desc)[0...60]{
          lcp, inp, cls, periodEnd, fetchedAt, hasData, error, target, seeded
        }`,
      { ff: formFactor },
    )
    setSnaps(rows)
  }, [client, formFactor])

  useEffect(() => { load() }, [load])

  const latest = snaps?.[0]
  const history = useMemo(() => (snaps ? [...snaps].filter((s) => s.hasData).reverse() : []), [snaps])
  const age = daysSince(latest?.fetchedAt)

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
      <h1 style={S.h1}>Core Web Vitals</h1>
      <p style={S.sub}>
        How real visitors experience the site, measured by Google over the last 28 days.
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
    </div>
  )
}

export default CwvDashboard
