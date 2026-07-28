import { NextResponse } from 'next/server'
import { mailStatus } from '@/app/lib/mail.server'

/**
 * Whether the site can currently send email.
 *
 * Used by the Studio to warn an editor who is filling in notification
 * recipients that nobody will actually be emailed yet. It returns a boolean and
 * a sentence and nothing else: the key itself never leaves the server, and this
 * response is read by a browser.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await mailStatus())
}
