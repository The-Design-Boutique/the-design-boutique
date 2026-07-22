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
