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

export type SuggestTask = 'description' | 'title' | 'alt' | 'faq' | 'tighten'

/** One drafted question and its answer, for the FAQ task. */
export interface DraftedFaq {
  question: string
  answer: string
}

export interface PageContext {
  /** The document's own title, which is usually the page's h1. */
  title?: string
  /** The focus keyword, when the editor has set one. */
  keyword?: string
  /** The visible prose, already extracted from the blocks. */
  prose?: string
  /** For the alt task: the image to look at. */
  imageUrl?: string
  /** For the tighten task: the paragraph to shorten. */
  paragraph?: string
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

  if (task === 'alt') {
    return {
      system: [
        'You write alternative text for images on a website.',
        'Describe what is actually in the picture, plainly, in one sentence, as you would to somebody who cannot see it.',
        'Do not begin with "image of" or "photo of": a screen reader already says it is an image.',
        'Do not editorialise, do not speculate about mood, and do not repeat the page title.',
        'If the image is a logo or a piece of text, say whose logo it is or what the text says.',
        'Under 125 characters. Return only the sentence.',
      ].join(' '),
      user: [
        'Write alternative text for this image.',
        page.title ? `It appears on a page about: ${page.title}` : '',
        'Describe the image itself, not the page.',
      ]
        .filter(Boolean)
        .join('\n'),
    }
  }

  if (task === 'tighten') {
    return {
      system: shared,
      user: [
        'Rewrite this paragraph so it says the same thing in fewer words.',
        'Keep every fact and the meaning. Cut hedging, repetition and filler. Do not make it a list.',
        'Aim for roughly two thirds of the original length. Return only the rewritten paragraph.',
        '',
        page.paragraph || '',
      ].join('\n'),
    }
  }

  if (task === 'faq') {
    return {
      system: [
        shared,
        'Return a JSON array and nothing else. Each item is an object with exactly two string keys: "question" and "answer".',
        'No markdown, no code fence, no commentary.',
      ].join(' '),
      user: [
        'Write four frequently asked questions and answers for this page.',
        'They must be questions a real customer would type or say out loud, phrased the way they would phrase them, not the way the business would.',
        'Answer each in two or three sentences, from what the page actually says. Do not invent prices, timescales, guarantees or credentials.',
        'If the page does not contain enough to answer a question honestly, leave that question out and return fewer.',
        keywordLine,
        '',
        `Page heading: ${page.title || '(none)'}`,
        '',
        'Page content:',
        (page.prose || '').slice(0, 6000) || '(the page has no body copy yet)',
      ].join('\n'),
    }
  }

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

async function askAnthropic(
  settings: AiSettings,
  prompt: { system: string; user: string },
  imageUrl?: string,
): Promise<string> {
  const client = new Anthropic({ apiKey: settings.apiKey })

  // Alt text is the one task that cannot be done from the page's words: the
  // model has to see the picture. Sanity serves every asset from a public CDN,
  // so the URL is handed over rather than the bytes.
  const content: Anthropic.ContentBlockParam[] = imageUrl
    ? [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: prompt.user },
      ]
    : [{ type: 'text', text: prompt.user }]

  const message = await client.messages.create({
    model: settings.model,
    max_tokens: MAX_TOKENS,
    system: prompt.system,
    messages: [{ role: 'user', content }],
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

/**
 * The ceiling a field is marked down for exceeding, where one exists.
 *
 * Only the two that feed a length-checked field are capped. Alt text has a
 * conventional limit rather than an enforced one, and a tightened paragraph is
 * as long as the paragraph needs; capping either would mean truncating meaning
 * to satisfy a number.
 */
const MAX_CHARS: Partial<Record<SuggestTask, number>> = {
  title: TITLE_CHARS.warnAbove,
  description: DESCRIPTION_CHARS.warnAbove,
  alt: 125,
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
    settings.provider === 'openai'
      ? askOpenAi(settings, p)
      : askAnthropic(settings, p, task === 'alt' ? page.imageUrl : undefined)

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
    if (max && cleaned.length > max) {
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

/**
 * Draft a set of questions and answers for a page.
 *
 * Separate from suggest() because this one returns structure rather than a
 * sentence, and because a malformed answer has to fail cleanly: the Studio
 * turns the result into real FAQ blocks on the page, so half-parsed output is
 * worse than none.
 *
 * The prompt asks for bare JSON, and models mostly comply, but "mostly" is not
 * a contract. A fenced code block is the usual deviation and is stripped rather
 * than treated as a failure.
 */
export async function suggestFaq(
  page: PageContext,
): Promise<{ ok: true; faqs: DraftedFaq[] } | { ok: false; reason: string }> {
  const raw = await suggest('faq', page)
  if (!raw.ok) return raw

  const text = raw.suggestion
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'The questions came back in a form we could not read. Try again.' }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, reason: 'The questions came back in a form we could not read. Try again.' }
  }

  const faqs = parsed
    .filter(
      (f): f is DraftedFaq =>
        Boolean(f) &&
        typeof (f as DraftedFaq).question === 'string' &&
        typeof (f as DraftedFaq).answer === 'string' &&
        (f as DraftedFaq).question.trim().length > 0 &&
        (f as DraftedFaq).answer.trim().length > 0,
    )
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))

  if (!faqs.length) {
    return {
      ok: false,
      reason:
        'No questions could be drafted from this page. That usually means there is not enough on it yet to answer anything honestly.',
    }
  }

  return { ok: true, faqs }
}
