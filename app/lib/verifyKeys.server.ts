import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import { decryptKey } from '@/app/lib/seo/aiSecret.server'

/**
 * Reads an optional verification key out of Site Settings and decrypts it.
 *
 * SERVER ONLY. Returns null whenever the service is not set up, which is the
 * normal case: these checks are optional and a form works without them.
 */

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

export type VerifyService = 'mailverify' | 'numverify'

export async function readVerificationKey(service: VerifyService): Promise<string | null> {
  try {
    const ciphertext = await client.fetch<string | null>(
      `*[_id == "siteSettings"][0].formVerification[$service].ciphertext`,
      { service },
    )
    if (!ciphertext) return null
    return decryptKey(ciphertext)
  } catch {
    // A key we cannot read is the same as no key: skip the check rather than
    // blocking a visitor from submitting a form.
    return null
  }
}
