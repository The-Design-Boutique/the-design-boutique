/**
 * Relative time, phrased the way a person would say it.
 *
 * Used wherever the Studio shows when something last happened. Deliberately
 * free of imports so it can be unit tested directly.
 *
 * The point of relative time here is that "2 hours ago" answers the question an
 * editor is actually asking, which is "can I trust this number", whereas a
 * timestamp makes them do the arithmetic themselves.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'} ago`
}

/**
 * @param iso  an ISO timestamp, or null/undefined when nothing has happened yet
 * @param now  injectable for testing
 */
export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null

  const diff = now.getTime() - then

  // A clock skew between the server that wrote the timestamp and the browser
  // reading it should not produce "in -3 minutes".
  if (diff < 0) return 'just now'
  if (diff < 45 * 1000) return 'just now'
  if (diff < 90 * 1000) return 'a minute ago'
  if (diff < HOUR) return plural(Math.round(diff / MINUTE), 'minute')
  if (diff < 2 * HOUR) return 'an hour ago'
  if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour')
  if (diff < 2 * DAY) return 'yesterday'
  if (diff < 30 * DAY) return plural(Math.floor(diff / DAY), 'day')

  // Past a month, a date is more useful than a large number of days.
  return `on ${new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

/** Same thing, with a fallback for when there is no timestamp at all. */
export function timeAgoOr(iso: string | null | undefined, fallback: string, now?: Date): string {
  return timeAgo(iso, now) ?? fallback
}
