import { NextResponse } from 'next/server'
import { aiAvailability, suggest, suggestFaq, type SuggestTask } from '@/app/lib/aiAssist.server'

/**
 * The writing assistant's one route (ruleset 05, rule 20).
 *
 * Everything happens server-side so the API key never reaches a browser. GET
 * reports whether the feature is configured, which is how the Studio decides
 * whether to show any of the Suggest controls at all; it returns a boolean and
 * a reason, never a key.
 *
 * POST returns a draft and nothing else. It never writes to the document: rule
 * 20 requires a suggestion to be inserted only by an explicit editor action, so
 * the Studio shows the draft and waits for somebody to accept it. That holds for
 * all five tasks, including the FAQ, which becomes real blocks on the page only
 * when an editor presses the button.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TASKS: SuggestTask[] = ['description', 'title', 'alt', 'faq', 'tighten']

export async function GET() {
  return NextResponse.json(await aiAvailability())
}

export async function POST(request: Request) {
  let body: {
    task?: string
    title?: string
    keyword?: string
    prose?: string
    imageUrl?: string
    paragraph?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'Expected a JSON body.' }, { status: 400 })
  }

  const task = TASKS.find((t) => t === body.task)
  if (!task) {
    return NextResponse.json(
      { ok: false, reason: `Unknown task. Expected one of: ${TASKS.join(', ')}.` },
      { status: 400 },
    )
  }

  // Checked here rather than left to the provider, so a missing input comes
  // back as a sentence instead of an unhelpful answer about a blank image.
  if (task === 'alt' && !body.imageUrl) {
    return NextResponse.json({ ok: false, reason: 'No image was given to describe.' }, { status: 400 })
  }
  if (task === 'tighten' && !body.paragraph?.trim()) {
    return NextResponse.json({ ok: false, reason: 'No paragraph was given to shorten.' }, { status: 400 })
  }

  const page = {
    title: body.title,
    keyword: body.keyword,
    prose: body.prose,
    imageUrl: body.imageUrl,
    paragraph: body.paragraph,
  }

  const result = task === 'faq' ? await suggestFaq(page) : await suggest(task, page)

  // A refusal here is nearly always a configuration problem or a thin page, both
  // of which an editor can act on, so it travels as a readable sentence rather
  // than a bare 500 the Studio would render as "something went wrong".
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
