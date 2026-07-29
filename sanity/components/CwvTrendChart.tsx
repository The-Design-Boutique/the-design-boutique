'use client'

import { useId } from 'react'
import type { TrendPoint } from '../../app/lib/cwvTrend'
import { seededBoundary } from '../../app/lib/cwvTrend'
import { BAND_VAR } from '../lib/bandColors'

/**
 * A single metric's history, with Google's thresholds shaded behind the line
 * (SOW 2.5, ruleset 05 rule 24).
 *
 * The bands are the point of the chart. A raw line of numbers tells you the
 * value changed; a line sitting inside a green band tells you whether that
 * matters, which is the question an editor is actually asking.
 */

/**
 * The bands are Google's green, amber and red, taken from the shared band
 * colours rather than written out here. They are not decoration: they are what
 * the numbers mean. Using the shared values keeps a zone in this chart the same
 * colour as the pill sitting beside it, which stopped being true once the
 * published colours had to be deepened to stay readable on a light background.
 *
 * They resolve from custom properties set by the dashboard that renders this
 * chart, which is the only place it appears.
 *
 * Everything else comes from the Studio's theme. The trend line in particular
 * used to be near-white, which was correct on a dark card and invisible the
 * moment the Studio was rethemed to paper. A chart nobody can see is worse than
 * no chart, because the empty space looks like missing data.
 */
const COLOR = {
  good: BAND_VAR.good,
  needsImprovement: BAND_VAR['needs-improvement'],
  poor: BAND_VAR.poor,
  line: 'var(--card-fg-color)',
  seeded: 'var(--card-muted-fg-color)',
  axis: 'var(--card-border-color)',
  text: 'var(--card-muted-fg-color)',
}

interface Props {
  points: TrendPoint[]
  /** Google's "good" ceiling for this metric. */
  good: number
  /** Google's "needs improvement" ceiling; above this is poor. */
  poor: number
  format: (value: number) => string
  height?: number
}

export function CwvTrendChart({ points, good, poor, format, height = 150 }: Props) {
  const clipId = useId()

  if (points.length < 2) {
    return (
      <p style={{ color: COLOR.text, fontSize: 13, margin: '10px 0 0' }}>
        Not enough readings yet to draw a trend. This needs at least two, and fills in as the daily
        check runs.
      </p>
    )
  }

  const w = 640
  const h = height
  const padL = 46
  const padR = 12
  const padT = 10
  const padB = 22
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  const values = points.map((p) => p.value)
  const dataMax = Math.max(...values)
  // Always show the whole "needs improvement" band so the line has context,
  // even when every reading is comfortably good.
  const yMax = Math.max(dataMax * 1.1, poor * 1.15)
  const yFor = (v: number) => padT + plotH - (Math.min(v, yMax) / yMax) * plotH
  const xFor = (i: number) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW)

  // Band rectangles, drawn worst at the back so the good band reads clearly.
  const yGood = yFor(good)
  const yPoor = yFor(poor)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`).join(' ')

  const boundary = seededBoundary(points)
  const boundaryIndex = boundary ? points.findIndex((p) => p.date === boundary) : -1

  const firstDate = points[0].date
  const lastDate = points[points.length - 1].date

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`Trend from ${firstDate} to ${lastDate}`}
      style={{ display: 'block', marginTop: 10 }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={padL} y={padT} width={plotW} height={plotH} />
        </clipPath>
      </defs>

      {/* Threshold bands: poor at the top, then needs improvement, then good. */}
      <rect x={padL} y={padT} width={plotW} height={Math.max(0, yPoor - padT)} fill={COLOR.poor} opacity={0.1} />
      <rect x={padL} y={yPoor} width={plotW} height={Math.max(0, yGood - yPoor)} fill={COLOR.needsImprovement} opacity={0.12} />
      <rect x={padL} y={yGood} width={plotW} height={Math.max(0, padT + plotH - yGood)} fill={COLOR.good} opacity={0.12} />

      {/* Threshold lines with their values, so the bands are readable as numbers. */}
      {[
        { y: yGood, value: good, label: 'good' },
        { y: yPoor, value: poor, label: 'poor above' },
      ].map((t) => (
        <g key={t.label}>
          <line x1={padL} y1={t.y} x2={w - padR} y2={t.y} stroke={COLOR.axis} strokeDasharray="3 3" strokeWidth="1" />
          <text x={padL - 6} y={t.y + 3.5} textAnchor="end" fontSize="10" fill={COLOR.text}>
            {format(t.value)}
          </text>
        </g>
      ))}

      {/* Where the backfilled weekly points hand over to daily ones. */}
      {boundaryIndex > 0 && boundaryIndex < points.length - 1 ? (
        <g>
          <line
            x1={xFor(boundaryIndex)}
            y1={padT}
            x2={xFor(boundaryIndex)}
            y2={padT + plotH}
            stroke={COLOR.seeded}
            strokeDasharray="2 4"
            strokeWidth="1"
          />
          <text x={xFor(boundaryIndex) + 4} y={padT + 10} fontSize="9.5" fill={COLOR.text}>
            daily from here
          </text>
        </g>
      ) : null}

      <path d={line} fill="none" stroke={COLOR.line} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#${clipId})`} />

      {/* Hollow markers for backfilled weekly readings, solid for daily ones. */}
      {points.map((p, i) => (
        <circle
          key={`${p.date}-${i}`}
          cx={xFor(i)}
          cy={yFor(p.value)}
          r={p.seeded ? 2 : 2.8}
          fill={p.seeded ? 'none' : COLOR.line}
          stroke={COLOR.line}
          strokeWidth="1.2"
        >
          <title>{`${p.date}: ${format(p.value)}${p.seeded ? ' (weekly, backfilled)' : ''}`}</title>
        </circle>
      ))}

      <text x={padL} y={h - 6} fontSize="10" fill={COLOR.text}>
        {firstDate}
      </text>
      <text x={w - padR} y={h - 6} fontSize="10" fill={COLOR.text} textAnchor="end">
        {lastDate}
      </text>
    </svg>
  )
}
