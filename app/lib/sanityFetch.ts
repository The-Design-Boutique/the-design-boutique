import { draftMode } from 'next/headers'
import { client, draftClient } from '@/sanity/lib/client'

/**
 * The content client for this request, showing drafts only while previewing.
 *
 * Every page and block reads through this rather than importing a client
 * directly, so "am I previewing?" is decided in one place. Getting it wrong in
 * either direction is expensive: leak drafts and unfinished work goes public,
 * miss them and the Preview button shows the published page and looks broken.
 *
 * This returns the client rather than wrapping fetch, so that the result types
 * generated from the queries in sanity/lib/queries.ts survive. A wrapper would
 * have flattened every result to unknown and quietly cost us type safety across
 * the whole site.
 *
 * Preview is a signed cookie set by the Studio, so nobody can switch it on by
 * guessing a URL.
 */
export async function getClient() {
  const { isEnabled } = await draftMode()
  return isEnabled ? draftClient : client
}
