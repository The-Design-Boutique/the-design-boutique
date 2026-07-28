import { NextResponse } from 'next/server'
import { canStoreKey, encryptKey, looksLikeKey, maskKey, MissingSecretError } from '@/app/lib/seo/aiSecret.server'

/**
 * Encrypts any third-party API key so the Studio can store it safely.
 *
 * Same reasoning as the writing assistant's key: documents in this dataset are
 * readable outside the Studio, so a key saved in plain text would be a
 * published key. The Studio sends the key here, gets back ciphertext and a
 * masked hint, and stores only those. Decryption happens server side, at the
 * moment the key is used.
 *
 * This route encrypts and nothing else. It never writes to Sanity and never
 * returns a stored key; the Studio performs the write with its own
 * authenticated client.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ canStoreKey: canStoreKey() })
}

export async function POST(request: Request) {
  let body: { service?: string; key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  const service = (body.service || '').trim()
  const key = (body.key || '').trim()
  if (!service || !key) return NextResponse.json({ error: 'A service and a key are both required.' }, { status: 400 })

  const shape = looksLikeKey(service, key)
  if (!shape.ok) return NextResponse.json({ error: shape.reason }, { status: 400 })

  try {
    return NextResponse.json({ ciphertext: encryptKey(key), hint: maskKey(key) })
  } catch (error) {
    if (error instanceof MissingSecretError) return NextResponse.json({ error: error.message }, { status: 503 })
    return NextResponse.json({ error: 'Could not encrypt the key.' }, { status: 500 })
  }
}
