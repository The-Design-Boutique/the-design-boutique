/**
 * Readability analysis (SOW 2.5, ruleset 05 section 2).
 *
 * Deliberately advisory. Rule 6 accepts imperfect detection: the point is to
 * show an editor the specific sentence that runs long, not to compute a
 * defensible linguistic score. Every flag carries the text it refers to so the
 * panel can quote it back rather than leaving the editor to hunt.
 */

import { READABILITY, READABILITY_BANDS } from './thresholds'
import type { ExtractedContent } from './extract'

export type ReadabilityBand = 'good' | 'ok' | 'needs work'

export type ReadabilityFlagType =
  | 'long-sentence'
  | 'long-paragraph'
  | 'repeated-opener'
  | 'passive-voice'

export interface ReadabilityFlag {
  type: ReadabilityFlagType
  /** The sentence or opening the editor should look at. */
  text: string
  /** Plain-language explanation, shown as-is in the Studio. */
  detail: string
}

export interface ReadabilityResult {
  band: ReadabilityBand
  /** 0 to 100. Advisory, and always explained by the flags. */
  score: number
  flags: ReadabilityFlag[]
  sentenceCount: number
  /** Share of sentences over the long-sentence limit, 0 to 1. */
  longSentenceShare: number
  passiveShare: number
}

/** Common irregular past participles the "-ed" test misses. */
const IRREGULAR_PARTICIPLES = new Set([
  'been', 'begun', 'brought', 'built', 'bought', 'chosen', 'done', 'driven', 'drawn', 'eaten',
  'fallen', 'felt', 'found', 'given', 'gone', 'grown', 'held', 'kept', 'known', 'laid', 'led',
  'left', 'lost', 'made', 'meant', 'met', 'paid', 'put', 'read', 'run', 'said', 'seen', 'sent',
  'set', 'shown', 'sold', 'spent', 'taken', 'taught', 'told', 'thought', 'understood', 'won',
  'written', 'broken', 'spoken', 'hidden', 'forgotten', 'kept',
])

const AUXILIARIES = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'get', 'gets', 'got'])

/** Words that sit between auxiliary and participle without breaking the pattern. */
const INTERVENING = /^(not|also|already|being|just|now|then|often|always|never|still|only|recently|currently|generally|typically|widely|well)$/i

/**
 * Split prose into sentences.
 *
 * Terminator followed by whitespace, with common abbreviations protected so
 * "Inc. of San Francisco" does not become two sentences.
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return []
  // Hide periods that do not end a sentence, split, then put them back.
  const DOT = '\u0001'
  const guarded = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Inc|Ltd|Co|Corp|vs|etc|approx|Ave|Blvd)\./gi, `$1${DOT}`)
    .replace(/\b(e|i)\.(g|e)\./gi, `$1${DOT}$2${DOT}`)
    .replace(/\b([A-Z])\./g, `$1${DOT}`)

  return guarded
    .split(/(?<=[.!?])["'’”)]*\s+/)
    .map((s) => s.split(DOT).join('.').trim())
    .filter(Boolean)
}

function words(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9'-]+/)
    .filter(Boolean)
}

function looksPassive(sentence: string): boolean {
  const w = words(sentence)
  for (let i = 0; i < w.length - 1; i++) {
    if (!AUXILIARIES.has(w[i])) continue
    // Allow a couple of adverbs between the auxiliary and the participle.
    for (let j = i + 1; j < Math.min(i + 4, w.length); j++) {
      const candidate = w[j]
      if (INTERVENING.test(candidate)) continue
      const isParticiple =
        IRREGULAR_PARTICIPLES.has(candidate) || (candidate.length > 4 && candidate.endsWith('ed'))
      if (isParticiple) return true
      break
    }
  }
  return false
}

function truncate(s: string, n = 120): string {
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`
}

export function analyseReadability(content: ExtractedContent): ReadabilityResult {
  const flags: ReadabilityFlag[] = []
  const sentences: string[] = []

  for (const paragraph of content.paragraphs) {
    const paragraphSentences = splitSentences(paragraph)
    sentences.push(...paragraphSentences)

    const paragraphWords = words(paragraph).length
    if (paragraphWords > READABILITY.longParagraphWords) {
      flags.push({
        type: 'long-paragraph',
        text: truncate(paragraph),
        detail: `This paragraph runs to ${paragraphWords} words. Splitting it around ${READABILITY.longParagraphWords} makes it far easier to scan.`,
      })
    }

    // Three or more consecutive sentences opening with the same word.
    let runStart = 0
    for (let i = 1; i <= paragraphSentences.length; i++) {
      const prevOpener = words(paragraphSentences[i - 1])[0]
      const opener = i < paragraphSentences.length ? words(paragraphSentences[i])[0] : undefined
      if (opener && prevOpener && opener === prevOpener) continue
      const run = i - runStart
      if (run >= READABILITY.repeatedOpenerRun && prevOpener) {
        flags.push({
          type: 'repeated-opener',
          text: truncate(paragraphSentences.slice(runStart, i).join(' ')),
          detail: `${run} sentences in a row start with "${prevOpener}". Varying the opening keeps the copy from reading as a list.`,
        })
      }
      runStart = i
    }
  }

  let passiveCount = 0
  let longCount = 0
  for (const sentence of sentences) {
    const count = words(sentence).length
    if (count > READABILITY.longSentenceWords) {
      longCount++
      flags.push({
        type: 'long-sentence',
        text: truncate(sentence),
        detail: `${count} words. Sentences over ${READABILITY.longSentenceWords} are harder to follow; consider splitting it.`,
      })
    }
    if (looksPassive(sentence)) {
      passiveCount++
      flags.push({
        type: 'passive-voice',
        text: truncate(sentence),
        detail: 'This reads as passive voice. Active voice is usually more direct, though passive is sometimes the right choice.',
      })
    }
  }

  const sentenceCount = sentences.length
  const longSentenceShare = sentenceCount ? longCount / sentenceCount : 0
  const passiveShare = sentenceCount ? passiveCount / sentenceCount : 0
  const longParagraphs = flags.filter((f) => f.type === 'long-paragraph').length
  const repeatedOpeners = flags.filter((f) => f.type === 'repeated-opener').length

  // Penalties are capped so that one bad habit cannot alone drive the score to
  // zero, and stated here rather than tuned invisibly.
  const penalty =
    Math.min(30, (longSentenceShare / 0.3) * 30) +
    Math.min(20, (passiveShare / 0.2) * 20) +
    Math.min(24, longParagraphs * 8) +
    Math.min(18, repeatedOpeners * 6)

  const score = sentenceCount === 0 ? 0 : Math.max(0, Math.round(100 - penalty))
  const band: ReadabilityBand =
    score >= READABILITY_BANDS.good ? 'good' : score >= READABILITY_BANDS.ok ? 'ok' : 'needs work'

  return { band, score, flags, sentenceCount, longSentenceShare, passiveShare }
}
