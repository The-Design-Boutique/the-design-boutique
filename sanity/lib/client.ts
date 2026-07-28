import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

// Server-side content client. Reads use a token so they work regardless of the
// dataset's public/private state, and the token (not NEXT_PUBLIC) never reaches
// the browser. useCdn is false because authenticated reads bypass the CDN;
// caching/revalidation is added in a later phase.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

/**
 * The same client, showing unpublished edits.
 *
 * Used only when preview has been switched on from the Studio. Everything a
 * visitor sees comes from the client above, which returns published documents
 * because that is the default for this API version. This is opt in on purpose:
 * a preview client used by mistake publishes someone's half finished draft to
 * the world.
 */
export const draftClient = client.withConfig({ perspective: 'drafts' })
