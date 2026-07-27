import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import { METRICS, bandFor, type MetricKey } from '@/app/lib/cwv'

/**
 * Daily Core Web Vitals collection.
 *
 * Queries the Chrome UX Report for the live origin (phone and desktop) and
 * writes one immutable snapshot per target and form factor. The dashboard only
 * ever reads these documents; it never calls Google from the browser.
 *
 * Triggered by the Vercel cron in vercel.json, or manually from the Studio
 * dashboard (rate limited there to one run per 10 minutes).
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRUX = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord'

/** The live origin is the only place with enough real users to have CrUX data. */
const ORIGIN = process.env.CWV_ORIGIN || 'https://thedesignboutique.com'
const FORM_FACTORS = ['PHONE', 'DESKTOP'] as const

const writeClient = createClient({
  projectId, dataset, apiVersion,
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

type CruxResult =
  | { ok: true; metrics: Record<string, number | null>; periodStart?: string; periodEnd?: string }
  | { ok: false; noData: true }
  | { ok: false; error: string }

async function queryCrux(key: string, target: string, formFactor: string, isUrl: boolean): Promise<CruxResult> {
  const body = JSON.stringify({ [isUrl ? 'url' : 'origin']: target, formFactor })
  const run = () =>
    fetch(`${CRUX}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    })

  let res = await run()
  // Rate limited: one retry, then record the failure rather than looping.
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000))
    res = await run()
  }

  if (res.status === 404) return { ok: false, noData: true }
  if (!res.ok) return { ok: false, error: `CrUX ${res.status}` }

  const json = await res.json()
  const record = json?.record
  const metrics: Record<string, number | null> = {}
  for (const m of METRICS) {
    // p75 is the value Google's thresholds are defined against.
    const p75 = record?.metrics?.[m.crux]?.percentiles?.p75
    metrics[m.key] = p75 === undefined || p75 === null ? null : Number(p75)
  }
  const p = record?.collectionPeriod
  const asDate = (d: any) =>
    d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : undefined
  return { ok: true, metrics, periodStart: asDate(p?.firstDate), periodEnd: asDate(p?.lastDate) }
}

export async function GET(request: Request) {
  // Vercel signs cron calls; a shared secret covers manual runs from the Studio.
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
  if (secret && !isVercelCron && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.CRUX_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'CRUX_API_KEY is not set. Add it in the environment to start collecting.' },
      { status: 503 },
    )
  }

  const fetchedAt = new Date().toISOString()
  const written: string[] = []
  const problems: string[] = []

  for (const formFactor of FORM_FACTORS) {
    const result = await queryCrux(key, ORIGIN, formFactor, false)
    const base = {
      _type: 'cwvSnapshot' as const,
      target: ORIGIN,
      scope: 'origin' as const,
      formFactor,
      fetchedAt,
    }

    let doc: Record<string, unknown>
    if (result.ok) {
      const m = result.metrics
      doc = {
        ...base,
        lcp: m.lcp, inp: m.inp, cls: m.cls,
        lcpBand: bandFor('lcp', m.lcp), inpBand: bandFor('inp', m.inp), clsBand: bandFor('cls', m.cls),
        periodStart: result.periodStart, periodEnd: result.periodEnd,
        hasData: true,
      }
    } else if ('noData' in result) {
      // Not enough real-user data yet. Record it honestly rather than as zeros.
      doc = { ...base, hasData: false }
      problems.push(`${formFactor}: no CrUX data`)
    } else {
      doc = { ...base, hasData: false, error: result.error }
      problems.push(`${formFactor}: ${result.error}`)
    }

    // One snapshot per target, form factor and collection period: a repeat run
    // on the same day updates in place rather than duplicating.
    const idSuffix = (doc.periodEnd as string) || fetchedAt.slice(0, 10)
    const _id = `cwvSnapshot.${ORIGIN.replace(/[^a-z0-9]+/gi, '-')}.${formFactor}.${idSuffix}`
    await writeClient.createOrReplace({ _id, ...doc } as never)
    written.push(_id)
  }

  return NextResponse.json({ ok: true, fetchedAt, written: written.length, problems })
}
