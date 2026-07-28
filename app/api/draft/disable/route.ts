import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Leaves preview and returns to the published site.
 *
 * Reached from the "Stop previewing" link in the banner. Without it, preview
 * outlasts the task: someone previews a draft, carries on browsing, and spends
 * the afternoon looking at unpublished pages wondering why the site looks
 * wrong.
 */

export async function GET(request: Request) {
  const draft = await draftMode()
  draft.disable()

  // Return to whichever page the banner was shown on, but only within this
  // site. An open redirect would let someone send a convincing link that
  // appears to come from thedesignboutique.com and lands somewhere else.
  const requested = new URL(request.url).searchParams.get('return') || '/'
  const safe = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
  redirect(safe)
}
