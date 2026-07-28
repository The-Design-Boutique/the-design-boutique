import { NextResponse } from 'next/server'
import { readVerificationKey } from '@/app/lib/verifyKeys.server'

/**
 * Checks whether a phone number is a real, reachable number, using NumVerify.
 * Optional in exactly the same way as the email check, and equally advisory.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { phone } = await request.json().catch(() => ({ phone: '' }))
  const cleaned = String(phone || '').replace(/[^\d]/g, '')
  if (!cleaned) return NextResponse.json({ configured: false, valid: null })

  const key = await readVerificationKey('numverify')
  if (!key) return NextResponse.json({ configured: false, valid: null })

  try {
    const url = `https://apilayer.net/api/validate?access_key=${encodeURIComponent(key)}&number=${encodeURIComponent(cleaned)}&country_code=US`
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return NextResponse.json({ configured: true, valid: null })
    const data = await res.json()
    if (data?.success === false) return NextResponse.json({ configured: true, valid: null })
    const valid = typeof data?.valid === 'boolean' ? data.valid : null
    return NextResponse.json({
      configured: true,
      valid,
      message: valid === false ? 'That does not look like a working phone number. Please double check it.' : undefined,
    })
  } catch {
    return NextResponse.json({ configured: true, valid: null })
  }
}
