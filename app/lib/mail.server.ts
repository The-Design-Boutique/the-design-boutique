import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import { decryptKey } from '@/app/lib/seo/aiSecret.server'

/**
 * Where the site gets permission to send email, and what to say when it cannot.
 *
 * SERVER ONLY. The key is stored encrypted in Site Settings because this
 * dataset is readable from outside the Studio, so a key saved in plain text
 * would be a published key. It is decrypted here, at the moment of use, and
 * never returned to a browser.
 *
 * Site Settings is the only source. There is deliberately no environment
 * variable fallback: during development this file found a RESEND_API_KEY that
 * happened to be exported in the developer's shell and belonged to an entirely
 * different account. Sending a client's enquiries through a stray key is not a
 * convenience, and the failure is invisible until someone checks whose domain
 * the mail actually came from. Laney can also change the key herself this way,
 * without anyone redeploying the site.
 *
 * Every "not configured" path returns a sentence written for whoever has to
 * read it later, because that sentence is stored on the submission and shown
 * in the Studio. "Email is not configured on the server" tells a content editor
 * nothing they can act on.
 */

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

export interface MailConfig {
  apiKey: string
  from: string
  replyTo?: string
}

export type MailConfigResult = { config: MailConfig } | { config: null; reason: string }

interface StoredDelivery {
  ciphertext?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

/** Combines a display name and an address into what an inbox will show. */
function formatFrom(address: string, name?: string): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return address
  // A name containing a comma or quote has to be quoted or the whole header is
  // read as two separate recipients.
  return `${JSON.stringify(trimmed)} <${address}>`
}

export async function readMailConfig(): Promise<MailConfigResult> {
  let stored: StoredDelivery | null = null

  try {
    stored = await client.fetch<StoredDelivery | null>(
      `*[_id == "siteSettings"][0].emailDelivery{
         "ciphertext": key.ciphertext, fromEmail, fromName, replyTo
       }`,
    )
  } catch {
    // Treated as "not configured yet", which is what the editor is told. The
    // alternative is throwing, which would fail the whole submission and lose
    // an enquiry over a settings lookup.
    stored = null
  }

  let apiKey: string | undefined
  if (stored?.ciphertext) {
    try {
      apiKey = decryptKey(stored.ciphertext)
    } catch {
      return {
        config: null,
        reason:
          'The saved Resend key could not be read. Open Site Settings, Forms, and enter the key again.',
      }
    }
  }
  const address = stored?.fromEmail

  if (!apiKey && !address) {
    return {
      config: null,
      reason:
        'No Resend API key or sending address has been set up, so no email could be sent. This submission was saved. Add both in Site Settings under Forms.',
    }
  }
  if (!apiKey) {
    return {
      config: null,
      reason:
        'No Resend API key has been set up, so no email could be sent. This submission was saved. Add the key in Site Settings under Forms.',
    }
  }
  if (!address) {
    return {
      config: null,
      reason:
        'No sending address has been set up, so no email could be sent. This submission was saved. Add "Send notifications from" in Site Settings under Forms.',
    }
  }

  return {
    config: {
      apiKey,
      from: formatFrom(address, stored?.fromName),
      replyTo: stored?.replyTo || undefined,
    },
  }
}

/**
 * Whether email is ready to send, for the Studio's benefit.
 *
 * Deliberately returns only a boolean and a sentence. The Studio has no reason
 * to know the key, and this answer travels to a browser.
 */
export async function mailStatus(): Promise<{ ready: boolean; reason?: string }> {
  const result = await readMailConfig()
  return result.config ? { ready: true } : { ready: false, reason: result.reason }
}
