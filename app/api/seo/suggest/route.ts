import { NextResponse } from 'next/server'
import { aiAvailability, suggest, type SuggestTask } from '@/app/lib/aiAssist.server'

/**
 * The writing assistant's one route (ruleset 05, rule 20).
 *
 * Everything happens server-side so the API key never reaches a browser. GET
 * reports whether the feature is configured, which is how the Studio decides
 * whether to show the Suggest control at all; it returns a boolean and a
 * reason, never a key.
 *
 * POST returns a suggestion and nothing else. It does not write to the
 * document: rule 20 requires a suggestion to be inserted only by an explicit
 * editor action, so the Studio shows the draft and waits for someone to press
 * Use this.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  return NextResponse.json(await aiAvailability())
}

export async function POST(request: Request) {
  let body: { task?: string; title?: string; keyword?: string; prose?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'Expected a JSON body.' }, { status: 400 })
  }

  const task = body.task === 'title' ? 'title' : body.task === 'description' ? 'description' : null
  if (!task) {
    return NextResponse.json({ ok: false, reason: 'Ask for either a title or a description.' }, { status: 400 })
  }

  const result = await suggest(task as SuggestTask, {
    title: body.title,
    keyword: body.keyword,
    prose: body.prose,
  })

  // A refusal here is nearly always a configuration problem the editor can act
  // on, so it travels as a readable sentence with a 200-family status rather
  // than a bare 500 the Studio would render as "something went wrong".
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
