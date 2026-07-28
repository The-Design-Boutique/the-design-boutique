import Anthropic from '@anthropic-ai/sdk'
import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import { decryptKey } from '@/app/lib/seo/aiSecret.server'
import { TITLE_CHARS, DESCRIPTION_CHARS } from '@/app/lib/seo/thresholds'

/**
 * The optional writing assistant (SOW 2.5 section 7, ruleset 05 rules 19 to 21).
 *
 * SERVER ONLY. The key is decrypted here and used here; it never travels to a
 * browser, which is the whole reason this is a route rather than a fetch from
 * the Studio.
 *
 * Everything about this feature is deliberately off by default. It is the one
 * part of 2.5 that costs money per use, and rule 21 records whose money: the key
 * and the budget are Laney's. It stays dark until she supplies a key and turns
 * it on. Nothing here runs, and nothing is billed, in any other state.
 *
 * The deterministic checks, the score, readability and heading hints, are
 * unaffected by all of this and keep working whether the assistant is on or off.
 */

const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

export type SuggestTask = 'description' | 'title'

export interface PageContext {
  /** The document's own title, which is usually the page's h1. */
  title?: string
  /** The focus keyword, when the editor has set one. */
  keyword?: string
  /** The visible prose, already extracted from the blocks. */
  prose?: string
}

export interface AiSettings {
  enabled: boolean
  provider: 'anthropic' | 'openai'
  model: string
  apiKey: string
}

export type AiAvailability =
  | { available: true; provider: string; model: string }
  | { available: false; reason: string }

interface StoredAi {
  enabled?: boolean
  provider?: 'anthropic' | 'openai'
  model?: string
  ciphertext?: string
}

async function readSettings(): Promise<AiSettings | { error: string }> {
  let stored: StoredAi | null = null
  try {
    stored = await sanity.fetch<StoredAi | null>(
      `*[_id == "siteSettings"][0].aiAssist{enabled, provider, model, "ciphertext": key.ciphertext}`,
    )
  } catch {
    return { error: 'Could not read the writing assistant settings.' }
  }

  if (!stored?.enabled) {
    return { error: 'The writing assistant is switched off in Site Settings.' }
  }
  if (!stored.ciphertext) {
    return { error: 'No API key has been saved, so there is nothing to send the request with.' }
  }

  let apiKey: string
  try {
    apiKey = decryptKey(stored.ciphertext)
  } catch {
    return { error: 'The saved API key could not be read. Enter it again in Site Settings.' }
  }

  return {
    enabled: true,
    provider: stored.provider || 'anthropic',
    model: stored.model || 'claude-opus-5',
    apiKey,
  }
}

/**
 * Whether the Suggest control should appear at all (rule 20).
 *
 * Returns no key and never will. The Studio only needs to know whether to show
 * a button, and a reason to display if somebody asks why it is missing.
 */
export async function aiAvailability(): Promise<AiAvailability> {
  const settings = await readSettings()
  if ('error' in settings) return { available: false, reason: settings.error }
  return { available: true, provider: settings.provider, model: settings.model }
}

/** What we ask for, kept to the limits the panel already enforces. */
function buildPrompt(task: SuggestTask, page: PageContext): { system: string; user: string } {
  const keywordLine = page.keyword
    ? `The page should be found by people searching for "${page.keyword}". Use that phrasing naturally if it fits; do not force it.`
    : 'No focus keyword has been set, so write for whatever the page is genuinely about.'

  const shared = [
    'You write short website copy for The Design Boutique, a branding and web design studio in San Francisco.',
    'Write plainly and specifically. No marketing throat-clearing, no "unlock", "elevate", "empower", "in today\'s world".',
    'Never use em dashes.',
    'Return only the finished text. No preamble, no quotation marks, no alternatives, no explanation.',
  ].join(' ')

  if (task === 'title') {
    return {
      system: shared,
      user: [
        `Write a search-result title for this page. Between ${TITLE_CHARS.min} and ${TITLE_CHARS.warnAbove} characters, and never above ${TITLE_CHARS.warnAbove}.`,
        'It is what somebody sees in Google before they have seen the page, so it has to say what the page is, not what the company feels about it.',
        keywordLine,
        '',
        `Page heading: ${page.title || '(none)'}`,
        '',
        'Page content:',
        (page.prose || '').slice(0, 4000) || '(the page has no body copy yet)',
      ].join('\n'),
    }
  }

  return {
    system: shared,
    user: [
      `Write a meta description for this page. Between ${DESCRIPTION_CHARS.min} and ${DESCRIPTION_CHARS.warnAbove} characters, and never above ${DESCRIPTION_CHARS.warnAbove}.`,
      'It appears under the title in Google. Its job is to make the right person click and the wrong person not bother, so be concrete about what is on the page.',
      keywordLine,
      '',
      `Page heading: ${page.title || '(none)'}`,
      '',
      'Page content:',
      (page.prose || '').slice(0, 4000) || '(the page has no body copy yet)',
    ].join('\n'),
  }
}

/**
 * Room for the model to think before it writes.
 *
 * The answer here is one or two sentences, so this looks absurdly generous. It
 * is not: current models reason before answering, and those tokens count
 * against the same budget as the reply. At 400 this silently produced nothing
 * on a thin page, because the reasoning used the whole allowance and the reply
 * never got written. The response came back well formed, with a thinking block
 * and no text block, which reads exactly like the model refusing.
 *
 * A ceiling is not a cost. Only what is actually generated is billed, and the
 * replies are short, so the headroom is free insurance against a silent empty
 * answer.
 */
const MAX_TOKENS = 2000

async function askAnthropic(settings: AiSettings, prompt: { system: string; user: string }): Promise<string> {
  const client = new Anthropic({ apiKey: settings.apiKey })
  const message = await client.messages.create({
    model: settings.model,
    max_tokens: MAX_TOKENS,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  })

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  // Say which of the two silences this was, rather than reporting both as
  // "returned nothing" and leaving somebody to guess.
  if (!text && message.stop_reason === 'max_tokens') {
    throw new Error('The model ran out of room before it finished writing. Try again.')
  }
  return text
}

/**
 * OpenAI is reached over plain HTTP rather than with a second SDK.
 *
 * It is the alternative provider, offered because the client may already have an
 * account there, and one short request does not justify another dependency for
 * the client's developers to carry.
 */
async function askOpenAi(settings: AiSettings, prompt: { system: string; user: string }): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.model,
      max_completion_tokens: 400,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OpenAI returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }
  const json = await res.json()
  return String(json?.choices?.[0]?.message?.content || '').trim()
}

/** The ceiling the SEO panel will mark a field down for exceeding. */
const MAX_CHARS: Record<SuggestTask, number> = {
  title: TITLE_CHARS.warnAbove,
  description: DESCRIPTION_CHARS.warnAbove,
}

function tidy(text: string): string {
  // Models occasionally wrap short copy in quotes despite being asked not to.
  // Stripping them here is kinder than showing the editor something they have
  // to tidy by hand every time.
  return text.replace(/^["'“”]+|["'“”]+$/g, '').trim()
}

export async function suggest(
  task: SuggestTask,
  page: PageContext,
): Promise<{ ok: true; suggestion: string } | { ok: false; reason: string }> {
  const settings = await readSettings()
  if ('error' in settings) return { ok: false, reason: settings.error }

  const prompt = buildPrompt(task, page)
  const ask = (p: { system: string; user: string }) =>
    settings.provider === 'openai' ? askOpenAi(settings, p) : askAnthropic(settings, p)

  try {
    let cleaned = tidy(await ask(prompt))
    if (!cleaned) return { ok: false, reason: 'The provider returned nothing.' }

    // Asking for a limit does not guarantee one. Observed in testing: a
    // description came back at 171 characters against a stated ceiling of 160,
    // which the panel would then have marked down. Handing an editor copy that
    // our own scorer penalises is worse than taking one more turn to fix it.
    //
    // The retry states the actual overage rather than repeating the limit,
    // because the first attempt already had the limit and missed it. One retry
    // only, and the long version is returned rather than discarded if it misses
    // again: a slightly long draft an editor can trim beats no draft at all.
    const max = MAX_CHARS[task]
    if (cleaned.length > max) {
      const over = cleaned.length - max
      const retry = await ask({
        system: prompt.system,
        user: [
          prompt.user,
          '',
          `Your previous attempt was ${cleaned.length} characters, which is ${over} too many. It must be ${max} characters or fewer. Shorten it by cutting words, not by adding abbreviations. Return only the shortened text.`,
          '',
          `Previous attempt: ${cleaned}`,
        ].join('\n'),
      })
      const shortened = tidy(retry)
      if (shortened && shortened.length <= max) cleaned = shortened
    }

    return { ok: true, suggestion: cleaned }
  } catch (error) {
    // The provider's own message is usually the whole answer: a revoked key, no
    // credit, a model name that does not exist on that account.
    const detail = error instanceof Error ? error.message : ''
    return { ok: false, reason: detail || 'The request to the provider failed.' }
  }
}
