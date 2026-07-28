import { dayKey, normalisePath, notFoundId, shouldLogNotFound } from './redirects'

/**
 * Records a dead URL (SOW 2.5, ruleset 05 section 4, rule 14).
 *
 * Aggregated per path per day against a deterministic document id, so a bot
 * hitting the same dead URL a thousand times increments one document rather
 * than creating a thousand. Noise (asset requests, WordPress probes, scanner
 * traffic) is filtered before anything is written, because a monitor nobody
 * can bear to look at is a monitor nobody looks at.
 *
 * Never throws and never blocks the response. A 404 page that fails to render
 * because logging broke would be a worse bug than the missing page.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-19'

export async function recordNotFound(rawPath: string, referrer?: string | null): Promise<void> {
  try {
    const token = process.env.SANITY_API_WRITE_TOKEN
    if (!token || !projectId || !dataset) return

    const path = normalisePath(rawPath)
    if (!shouldLogNotFound(path)) return

    const day = dayKey()
    const id = notFoundId(path, day)
    const now = new Date().toISOString()

    // Create the day's document if this is the first hit, then increment. Both
    // in one transaction so concurrent requests cannot race to create it twice.
    const mutations = [
      {
        createIfNotExists: {
          _id: id,
          _type: 'notFoundEntry',
          path,
          day,
          count: 0,
          firstSeenAt: now,
          resolved: false,
        },
      },
      {
        patch: {
          id,
          inc: { count: 1 },
          set: {
            lastSeenAt: now,
            // Keep the most recent referrer: an internal one means we are
            // linking to a dead page ourselves, which is the actionable case.
            ...(referrer ? { referrer: referrer.slice(0, 500) } : {}),
          },
        },
      },
    ]

    await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mutations }),
      signal: AbortSignal.timeout(3_000),
    })
  } catch {
    // Deliberately silent.
  }
}
