import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'

/**
 * Keeps the 404 log to a workable size (SOW 2.5, ruleset 05 section 4, rule 14).
 *
 * The cap is on distinct paths, not documents: a site that has been probed by
 * scanners for years would otherwise accumulate a log nobody can read, which
 * defeats the point of having one. When the cap is exceeded, the paths with the
 * fewest hits and the oldest last-seen date go first, because those are the
 * ones least likely to be a real visitor hitting a real dead link.
 *
 * Paths that already have a redirect are dropped first regardless: they have
 * been dealt with, and keeping them only crowds the list.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Distinct paths retained (ruleset 05, rule 14). */
const MAX_PATHS = 1_000

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

interface Entry {
  _id: string
  path: string
  count: number
  lastSeenAt?: string
  resolved?: boolean
}

export async function GET(request: Request) {
  // Vercel signs its cron requests; reject anything else when the secret is set.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({ error: 'No write token configured.' }, { status: 503 })
  }

  try {
    const entries = await client.fetch<Entry[]>(
      `*[_type == "notFoundEntry"]{_id, path, count, lastSeenAt, resolved}`,
    )

    // Roll the per-day documents up to one record per path.
    const byPath = new Map<string, { hits: number; lastSeenAt: string; resolved: boolean; ids: string[] }>()
    for (const e of entries) {
      const key = e.path || ''
      if (!key) continue
      const row = byPath.get(key) || { hits: 0, lastSeenAt: '', resolved: false, ids: [] }
      row.hits += Number(e.count || 0)
      row.resolved = row.resolved || Boolean(e.resolved)
      row.ids.push(e._id)
      if (e.lastSeenAt && e.lastSeenAt > row.lastSeenAt) row.lastSeenAt = e.lastSeenAt
      byPath.set(key, row)
    }

    if (byPath.size <= MAX_PATHS) {
      return NextResponse.json({
        ok: true,
        distinctPaths: byPath.size,
        cap: MAX_PATHS,
        pruned: 0,
        message: 'Under the cap, nothing pruned.',
      })
    }

    // Least valuable first: already redirected, then fewest hits, then stalest.
    const ranked = [...byPath.entries()].sort((a, b) => {
      if (a[1].resolved !== b[1].resolved) return a[1].resolved ? -1 : 1
      if (a[1].hits !== b[1].hits) return a[1].hits - b[1].hits
      return (a[1].lastSeenAt || '').localeCompare(b[1].lastSeenAt || '')
    })

    const dropCount = byPath.size - MAX_PATHS
    const doomed = ranked.slice(0, dropCount)
    const ids = doomed.flatMap(([, row]) => row.ids)

    // Delete in batches so one oversized transaction cannot fail the whole run.
    let deleted = 0
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100)
      let tx = client.transaction()
      for (const id of batch) tx = tx.delete(id)
      await tx.commit()
      deleted += batch.length
    }

    return NextResponse.json({
      ok: true,
      distinctPaths: byPath.size,
      cap: MAX_PATHS,
      prunedPaths: dropCount,
      deletedDocuments: deleted,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prune failed.' },
      { status: 500 },
    )
  }
}
