import { NextResponse } from 'next/server'
import { canSubmit, submitToIndexNow, INDEXNOW_ENGINES } from '@/app/lib/indexNow'

/**
 * Tells the IndexNow search engines that a page has changed.
 *
 * Not Google. Google has never joined IndexNow, so nothing here affects it;
 * getting a page into Google is a manual press in Search Console, because
 * Google offers no API for it. The Studio says so beside the button rather than
 * letting anyone infer otherwise.
 *
 * GET reports whether this is usable and why not, so the Studio can explain the
 * situation without anybody pressing anything first.
 */

export const dynamic = 'force-dynamic'

/** Where this deployment serves its key file, which is also its proof of ownership. */
function keyDetails(request: Request) {
  const key = process.env.INDEXNOW_KEY
  const selfHost = new URL(request.url).host
  const origin = new URL(request.url).origin
  return { key, selfHost, keyLocation: key ? `${origin}/${key}.txt` : null }
}

export async function GET(request: Request) {
  const { key, selfHost, keyLocation } = keyDetails(request)
  if (!key || !keyLocation) {
    return NextResponse.json({
      ready: false,
      reason: 'No IndexNow key is configured for this deployment.',
      engines: INDEXNOW_ENGINES,
    })
  }
  return NextResponse.json({ ready: true, host: selfHost, keyLocation, engines: INDEXNOW_ENGINES })
}

export async function POST(request: Request) {
  const { key, selfHost, keyLocation } = keyDetails(request)
  if (!key || !keyLocation) {
    return NextResponse.json(
      { ok: false, reason: 'No IndexNow key is configured for this deployment.' },
      { status: 503 },
    )
  }

  let body: { urls?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'Expected a JSON body.' }, { status: 400 })
  }

  const urls = (body.urls || []).filter(Boolean)

  // Checked here as well as inside submitToIndexNow so a mismatch comes back as
  // 400 with an explanation rather than travelling to a third party to be
  // refused with a bare 422.
  const allowed = canSubmit(urls, selfHost)
  if (!allowed.ok) {
    return NextResponse.json({ ok: false, reason: allowed.reason }, { status: 400 })
  }

  const result = await submitToIndexNow(urls, { key, selfHost, keyLocation })
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
