import { NextResponse } from 'next/server'
import { readVerificationKey } from '@/app/lib/verifyKeys.server'

/**
 * Checks whether an email address actually exists, using MailVerify.
 *
 * Optional. With no key saved this returns `configured: false` and the form
 * falls back to checking the address merely looks right, which is what happens
 * by default.
 *
 * This never blocks a submission on its own: the form treats a negative result
 * as a warning to the visitor, because verification services do return false
 * negatives and losing a real enquiry is worse than receiving a junk one.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: '' }))
  const address = String(email || '').trim()
  if (!address) return NextResponse.json({ configured: false, valid: null })

  const key = await readVerificationKey('mailverify')
  if (!key) return NextResponse.json({ configured: false, valid: null })

  try {
    const res = await fetch('https://api.mailverify.ai/api/v1/verify/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ email: address }),
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return NextResponse.json({ configured: true, valid: null })
    const data = await res.json()
    const status = String(data?.status || data?.result || '').toLowerCase()
    const valid = status ? ['valid', 'deliverable', 'ok'].includes(status) : null
    return NextResponse.json({
      configured: true,
      valid,
      message: valid === false ? 'We could not find that email address. Please double check it.' : undefined,
    })
  } catch {
    // A service that is slow or down must not stop somebody enquiring.
    return NextResponse.json({ configured: true, valid: null })
  }
}
