import { NextResponse } from 'next/server'
import { canStoreKey, encryptKey, looksLikeKey, maskKey, MissingSecretError } from '@/app/lib/seo/aiSecret.server'

/**
 * Encrypts a writing-assistance API key so the Studio can store it safely.
 *
 * This route deliberately does one thing: take a plaintext key, hand back the
 * ciphertext and a masked hint. It does not write to Sanity. The Studio does
 * that itself with its own authenticated client, so Sanity's own permissions
 * decide who may change the setting, rather than this route having to
 * re-implement that check.
 *
 * Nothing here ever returns a stored key. Decryption happens only in the
 * server-side route that calls the AI provider.
 */

export const dynamic = 'force-dynamic'

/** Tells the Studio whether saving a key is possible at all. */
export async function GET() {
  return NextResponse.json({ canStoreKey: canStoreKey() })
}

export async function POST(request: Request) {
  let body: { provider?: string; key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  const provider = (body.provider || '').trim()
  const key = (body.key || '').trim()

  if (!provider || !key) {
    return NextResponse.json({ error: 'Both a provider and a key are required.' }, { status: 400 })
  }

  const shape = looksLikeKey(provider, key)
  if (!shape.ok) {
    return NextResponse.json({ error: shape.reason }, { status: 400 })
  }

  try {
    return NextResponse.json({ ciphertext: encryptKey(key), hint: maskKey(key) })
  } catch (error) {
    if (error instanceof MissingSecretError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not encrypt the key.' }, { status: 500 })
  }
}
