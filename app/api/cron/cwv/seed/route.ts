import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import { METRICS, bandFor } from '@/app/lib/cwv'

/**
 * One-off backfill of Core Web Vitals history (SOW 2.5, ruleset 05 rule 23).
 *
 * The Chrome UX Report History API returns weekly readings going back roughly
 * six months, which gives the trend charts something to show on day one rather
 * than starting from a single point. Each week is written as a backdated
 * snapshot flagged `seeded: true`, so the charts can distinguish backfilled
 * weekly points from the daily ones collected since (rule 24).
 *
 * Safe to run more than once: ids are derived from the collection period, so a
 * second run overwrites rather than duplicates.
 *
 * Note for whoever runs this: thedesignboutique.com currently has no data in
 * the Chrome UX Report at all, at origin or page level. The API returns a 404
 * for it, which is not a failure of this route but a statement that the site
 * does not yet get enough traffic for Google to report on. This route says so
 * plainly rather than writing empty rows.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HISTORY = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord'
const ORIGIN = process.env.CWV_ORIGIN || 'https://thedesignboutique.com'
const FORM_FACTORS = ['PHONE', 'DESKTOP'] as const

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

interface CruxDate {
  year: number
  month: number
  day: number
}

function isoDate(d: CruxDate | undefined): string | null {
  if (!d) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.CRUX_API_KEY || process.env.PSI_API_KEY
  if (!key) return NextResponse.json({ error: 'No Google API key configured.' }, { status: 503 })
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'No Sanity write token configured.' }, { status: 503 })
  }

  const report: Record<string, unknown> = { origin: ORIGIN, formFactors: {} }
  let written = 0

  for (const formFactor of FORM_FACTORS) {
    try {
      const res = await fetch(`${HISTORY}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: ORIGIN, formFactor }),
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      })

      if (res.status === 404) {
        // Not an error. Google simply has no readings for this origin.
        ;(report.formFactors as Record<string, unknown>)[formFactor] = {
          seeded: 0,
          note: 'The Chrome UX Report has no history for this origin. That means too few real visitors for Google to report on, not a failure of this run.',
        }
        continue
      }

      if (!res.ok) {
        ;(report.formFactors as Record<string, unknown>)[formFactor] = {
          seeded: 0,
          error: `History API returned ${res.status}`,
        }
        continue
      }

      const body = await res.json()
      const record = body?.record || {}
      const periods: Array<{ firstDate: CruxDate; lastDate: CruxDate }> = record.collectionPeriods || []
      const metrics = record.metrics || {}

      const mutations: unknown[] = []
      for (let i = 0; i < periods.length; i++) {
        const periodEnd = isoDate(periods[i]?.lastDate)
        const periodStart = isoDate(periods[i]?.firstDate)
        if (!periodEnd) continue

        const values: Record<string, number | null> = {}
        for (const m of METRICS) {
          const series = metrics?.[m.crux]?.percentilesTimeseries?.p75s
          const raw = Array.isArray(series) ? series[i] : undefined
          values[m.key] = raw === undefined || raw === null ? null : Number(raw)
        }

        // A period with nothing in it is not worth a document.
        if (METRICS.every((m) => values[m.key] === null)) continue

        mutations.push({
          createOrReplace: {
            _id: `cwvSnapshot.seed.${formFactor.toLowerCase()}.${periodEnd}`,
            _type: 'cwvSnapshot',
            source: 'field',
            scope: 'origin',
            target: ORIGIN,
            formFactor,
            seeded: true,
            hasData: true,
            periodStart,
            periodEnd,
            fetchedAt: new Date().toISOString(),
            lcp: values.lcp,
            inp: values.inp,
            cls: values.cls,
            lcpBand: bandFor('lcp', values.lcp),
            inpBand: bandFor('inp', values.inp),
            clsBand: bandFor('cls', values.cls),
          },
        })
      }

      for (let i = 0; i < mutations.length; i += 50) {
        let tx = client.transaction()
        for (const m of mutations.slice(i, i + 50)) {
          tx = tx.createOrReplace((m as { createOrReplace: Record<string, unknown> }).createOrReplace as never)
        }
        await tx.commit()
      }

      written += mutations.length
      ;(report.formFactors as Record<string, unknown>)[formFactor] = {
        seeded: mutations.length,
        weeksReturned: periods.length,
      }
    } catch (error) {
      ;(report.formFactors as Record<string, unknown>)[formFactor] = {
        seeded: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  return NextResponse.json({
    ok: true,
    written,
    ...report,
    note:
      written === 0
        ? 'Nothing was seeded. If every form factor reports no history, this origin has no Chrome UX Report data yet, and the trend charts will fill in from the daily lab checks instead.'
        : undefined,
  })
}
