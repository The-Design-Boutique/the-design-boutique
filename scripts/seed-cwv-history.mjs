/**
 * Backfill Core Web Vitals history.
 *
 * The CrUX History API returns roughly 40 weekly data points. Running this once
 * gives the dashboard a real trend line from day one instead of it filling in
 * slowly over ten months. Seeded points are flagged so they can be told apart
 * from the daily collection.
 *
 *   CRUX_API_KEY=... node scripts/seed-cwv-history.mjs
 */
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const g = (k) => (env.match(new RegExp(k + '=(.*)')) || [])[1]?.trim() || process.env[k] || ''
const pid = g('NEXT_PUBLIC_SANITY_PROJECT_ID')
const ds = g('NEXT_PUBLIC_SANITY_DATASET')
const tok = g('SANITY_API_WRITE_TOKEN')
const ver = g('NEXT_PUBLIC_SANITY_API_VERSION') || '2025-02-19'
const key = process.env.CRUX_API_KEY || g('CRUX_API_KEY')
const ORIGIN = process.env.CWV_ORIGIN || 'https://thedesignboutique.com'

if (!key) {
  console.error('CRUX_API_KEY is required. Set it in .env.local or pass it inline.')
  process.exit(1)
}

const METRICS = [
  ['lcp', 'largest_contentful_paint'],
  ['inp', 'interaction_to_next_paint'],
  ['cls', 'cumulative_layout_shift'],
]
const BANDS = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25] }
const band = (k, v) =>
  v === null || v === undefined ? null : v <= BANDS[k][0] ? 'good' : v <= BANDS[k][1] ? 'needs-improvement' : 'poor'
const asDate = (d) => (d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : undefined)

const mutations = []

for (const formFactor of ['PHONE', 'DESKTOP']) {
  const res = await fetch(
    `https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: ORIGIN, formFactor }),
    },
  )
  if (!res.ok) {
    console.error(`${formFactor}: CrUX History ${res.status} ${(await res.text()).slice(0, 160)}`)
    continue
  }
  const json = await res.json()
  const rec = json.record
  const periods = rec?.collectionPeriods || []
  console.error(`${formFactor}: ${periods.length} weekly points`)

  periods.forEach((p, i) => {
    const doc = {
      _type: 'cwvSnapshot',
      target: ORIGIN,
      scope: 'origin',
      formFactor,
      periodStart: asDate(p.firstDate),
      periodEnd: asDate(p.lastDate),
      fetchedAt: new Date().toISOString(),
      hasData: true,
      seeded: true,
    }
    let any = false
    for (const [k, cruxKey] of METRICS) {
      const v = rec.metrics?.[cruxKey]?.percentilesTimeseries?.p75s?.[i]
      const num = v === null || v === undefined ? null : Number(v)
      doc[k] = num
      doc[`${k}Band`] = band(k, num)
      if (num !== null) any = true
    }
    if (!any) doc.hasData = false
    const _id = `cwvSnapshot.${ORIGIN.replace(/[^a-z0-9]+/gi, '-')}.${formFactor}.${doc.periodEnd}`
    mutations.push({ createOrReplace: { _id, ...doc } })
  })
}

if (!mutations.length) {
  console.error('nothing to write')
  process.exit(1)
}

for (let i = 0; i < mutations.length; i += 40) {
  const batch = mutations.slice(i, i + 40)
  const r = await fetch(`https://${pid}.api.sanity.io/v${ver}/data/mutate/${ds}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations: batch }),
  })
  const out = await r.json()
  console.error(`wrote ${batch.length} (${out.transactionId ? 'ok' : JSON.stringify(out).slice(0, 120)})`)
}
console.log(`seeded ${mutations.length} historical snapshots`)
