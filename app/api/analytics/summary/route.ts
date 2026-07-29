import { NextResponse } from 'next/server'
import { analyticsSummary } from '@/app/lib/ga4.server'

/**
 * Everything the Analytics tab shows, in one request.
 *
 * Server side so no Google credential is near a browser, and read only: this
 * can report what happened and cannot change a property, create an event or
 * mark a conversion.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const days = Number(new URL(request.url).searchParams.get('days')) || 28
  // Bounded so a mistyped URL cannot ask Google for ten years of daily rows.
  const safeDays = Math.min(Math.max(days, 7), 365)

  try {
    return NextResponse.json({ ok: true, data: await analyticsSummary(safeDays) })
  } catch (error) {
    // The reason is usually actionable: not configured, or no access to the
    // property. Both are better said than hidden behind a 500.
    return NextResponse.json(
      { ok: false, reason: error instanceof Error ? error.message : 'Could not read Analytics.' },
      { status: 400 },
    )
  }
}
