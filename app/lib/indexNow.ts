/**
 * IndexNow: telling search engines a page has changed, without waiting to be crawled.
 *
 * Worth being precise about what this does and does not do, because the name
 * suggests more than it delivers.
 *
 * It does NOT reach Google. The participating engines are Bing, Yandex, Naver,
 * Seznam, Yep and Amazon. Google has never joined. Anyone hoping this gets a
 * page into Google should use Search Console's Request Indexing instead, which
 * is a manual press because Google offers no API for it.
 *
 * Ownership is proved by hosting a key file on the same host as the URLs being
 * submitted. Submitting a URL whose host does not match the key file is
 * rejected with 422. That is the whole reason this cannot point at the live
 * WordPress site today: proving ownership of thedesignboutique.com would mean
 * putting a file on it, and this project does not touch the live site. At go
 * live, when this application serves that domain, the key file it already
 * serves becomes the proof and this starts working with no further changes.
 *
 * The key is not a secret. The protocol requires it to be publicly readable,
 * which is why it lives in public/ and is committed.
 */

/** The shared endpoint, which forwards to every participating engine. */
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** Engines that will actually receive this. Google is deliberately absent. */
export const INDEXNOW_ENGINES = ['Bing', 'Yandex', 'Naver', 'Seznam', 'Yep', 'Amazon'] as const

export type IndexNowResult =
  | { ok: true; submitted: number; engines: readonly string[] }
  | { ok: false; reason: string }

/** The host a set of URLs belongs to, or null if they disagree. */
export function singleHost(urls: string[]): string | null {
  const hosts = new Set<string>()
  for (const u of urls) {
    try {
      hosts.add(new URL(u).host)
    } catch {
      return null
    }
  }
  return hosts.size === 1 ? [...hosts][0] : null
}

/**
 * Whether these URLs can be submitted with the key file this site serves.
 *
 * Checked before sending rather than after, so the answer is a sentence
 * explaining the situation rather than an unexplained 422 from a third party.
 */
export function canSubmit(urls: string[], selfHost: string): { ok: true; host: string } | { ok: false; reason: string } {
  if (!urls.length) return { ok: false, reason: 'No addresses were given.' }

  const host = singleHost(urls)
  if (!host) {
    return {
      ok: false,
      reason: 'These addresses are not all on the same site, or one of them is not a valid address.',
    }
  }
  if (host !== selfHost) {
    return {
      ok: false,
      reason:
        `IndexNow only accepts addresses on the site that hosts the key file, which is ${selfHost}. ` +
        `These are on ${host}. Until this build takes over that domain, the key file would have to be placed on ${host} itself.`,
    }
  }
  return { ok: true, host }
}

export async function submitToIndexNow(
  urls: string[],
  { key, selfHost, keyLocation }: { key: string; selfHost: string; keyLocation: string },
): Promise<IndexNowResult> {
  const allowed = canSubmit(urls, selfHost)
  if (!allowed.ok) return { ok: false, reason: allowed.reason }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: selfHost, key, keyLocation, urlList: urls }),
      signal: AbortSignal.timeout(15_000),
    })

    // 200 accepted, 202 accepted but the key is still being checked. Both mean
    // the submission was taken.
    if (res.status === 200 || res.status === 202) {
      return { ok: true, submitted: urls.length, engines: INDEXNOW_ENGINES }
    }

    // These are the documented refusals. Reporting the code alone would send
    // somebody to a specification to find out what went wrong.
    const explained: Record<number, string> = {
      400: 'The submission was malformed.',
      403: `The key was refused. Check that ${keyLocation} is reachable and contains exactly the key.`,
      422: 'Those addresses do not belong to the site that hosts the key file.',
      429: 'Too many submissions in a short time. Try again later.',
    }
    return { ok: false, reason: explained[res.status] || `The IndexNow service returned ${res.status}.` }
  } catch {
    return { ok: false, reason: 'Could not reach the IndexNow service.' }
  }
}
