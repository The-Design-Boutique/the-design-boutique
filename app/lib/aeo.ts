import { extractContent, type ExtractedContent } from './seo/extract.ts'

/**
 * AEO: whether this page is ready to be used in an AI answer.
 *
 * Readiness, not results, and the distinction is the whole honesty of this
 * feature. Google publishes an API that reports impressions and position, which
 * is why the Search tab can show real numbers. ChatGPT, Perplexity, Claude and
 * Google's AI Overviews publish nothing equivalent: nobody can tell you whether
 * an assistant cited a page, and any tool claiming to measure it is guessing.
 *
 * So these checks describe the things that are known to make a page usable as a
 * source, all of which can be verified from the page itself at no cost:
 *
 *   an answer near the top, because that is the part that gets retrieved
 *   headings shaped like the questions people actually ask
 *   structure, so a section can be lifted out and still make sense
 *   enough substance to be worth citing
 *   attribution, which is what a careful assistant looks for before trusting a
 *     page enough to name it
 *
 * None of it guarantees anything. It is the difference between being quotable
 * and not, which is the part anybody can control.
 */

export type AeoStatus = 'pass' | 'warn' | 'fail' | 'skipped'

export interface AeoCheck {
  id: string
  label: string
  status: AeoStatus
  detail: string
  weight: number
  earned: number
}

export interface AeoAnalysis {
  score: number
  band: 'good' | 'needs work' | 'poor'
  checks: AeoCheck[]
  content: ExtractedContent
}

/** Openers that signal a heading is phrased as a question somebody would ask. */
const QUESTION_STARTERS = /^(what|how|why|when|where|who|which|can|do|does|is|are|should|will)\b/i

/** Words that describe a page rather than answering anything. */
const FILLER_OPENERS = /^(welcome|hello|hi\b|greetings|at [a-z]+,? we)/i

const WORDS_PER_SECTION_LIMIT = 350
const MIN_SUBSTANTIVE_WORDS = 300

function pass(id: string, label: string, weight: number, detail: string): AeoCheck {
  return { id, label, status: 'pass', weight, earned: weight, detail }
}
function warn(id: string, label: string, weight: number, detail: string): AeoCheck {
  return { id, label, status: 'warn', weight, earned: Math.round(weight / 2), detail }
}
function fail(id: string, label: string, weight: number, detail: string): AeoCheck {
  return { id, label, status: 'fail', weight, earned: 0, detail }
}
function skip(id: string, label: string, detail: string): AeoCheck {
  return { id, label, status: 'skipped', weight: 0, earned: 0, detail }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export interface AeoOptions {
  /** Document type, so checks that only make sense for articles can be skipped. */
  documentType?: string
  /** Whether the document has an author set, for attribution. */
  hasAuthor?: boolean
  /** Whether the document has a publish date. */
  hasDate?: boolean
  /** The structured-data type chosen on the SEO tab. */
  schemaType?: string
  /** Whether any block on the page is a FAQ. */
  hasFaqBlock?: boolean
}

export function analyseAeo(doc: unknown, options: AeoOptions = {}): AeoAnalysis {
  const content = extractContent(doc)
  const checks: AeoCheck[] = []

  // 1. An answer near the top.
  //
  // Retrieval systems pull the opening of a page far more often than the
  // middle, so a first paragraph that says what this is beats one that clears
  // its throat. Both failure modes are real: too short says nothing, too long
  // buries the answer inside it.
  const first = content.paragraphs[0] || ''
  const firstWords = countWords(first)
  if (!first) {
    checks.push(
      fail('answer-up-front', 'Answers up front', 20, 'This page opens with no paragraph of text, so there is nothing for an assistant to quote.'),
    )
  } else if (FILLER_OPENERS.test(first.trim())) {
    checks.push(
      warn('answer-up-front', 'Answers up front', 20, 'The opening line is a greeting rather than an answer. Say what this page is about in the first sentence.'),
    )
  } else if (firstWords < 20) {
    checks.push(
      warn('answer-up-front', 'Answers up front', 20, `The opening paragraph is only ${firstWords} words, which is rarely enough to answer anything on its own.`),
    )
  } else if (firstWords > 120) {
    checks.push(
      warn('answer-up-front', 'Answers up front', 20, `The opening paragraph runs to ${firstWords} words. The answer is probably in there, but it is easier to lift out if the first paragraph is shorter.`),
    )
  } else {
    checks.push(
      pass('answer-up-front', 'Answers up front', 20, `Opens with ${firstWords} words that can stand alone as an answer.`),
    )
  }

  // 2. Headings shaped like questions.
  const questionHeadings = content.headings.filter(
    (h) => h.text.trim().endsWith('?') || QUESTION_STARTERS.test(h.text.trim()),
  )
  if (questionHeadings.length >= 2) {
    checks.push(
      pass('question-headings', 'Headings match how people ask', 15, `${questionHeadings.length} headings are phrased as questions.`),
    )
  } else if (questionHeadings.length === 1) {
    checks.push(
      warn('question-headings', 'Headings match how people ask', 15, 'One heading is phrased as a question. Assistants match questions to headings, so a couple more would help.'),
    )
  } else {
    checks.push(
      fail('question-headings', 'Headings match how people ask', 15, 'No heading is phrased as a question. People ask assistants things like "how much does branding cost"; a heading in those words is what gets matched.'),
    )
  }

  // 3. A FAQ, which is the most directly quotable thing a page can carry.
  if (options.hasFaqBlock || options.schemaType === 'FAQPage') {
    checks.push(pass('faq', 'Has a question and answer section', 15, 'This page carries a FAQ, which is the format assistants quote most readily.'))
  } else {
    checks.push(
      fail('faq', 'Has a question and answer section', 15, 'No FAQ on this page. A few real questions with short answers is the single most reusable thing you can add.'),
    )
  }

  // 4. Structure: can a section be lifted out and still make sense.
  const sectionCount = content.headings.length
  const wordsPerSection = sectionCount > 0 ? Math.round(content.wordCount / sectionCount) : content.wordCount
  if (sectionCount >= 3 && wordsPerSection <= WORDS_PER_SECTION_LIMIT) {
    checks.push(
      pass('chunked', 'Broken into sections', 15, `${sectionCount} headings, averaging ${wordsPerSection} words each. Any one section can be quoted on its own.`),
    )
  } else if (sectionCount >= 3) {
    checks.push(
      warn('chunked', 'Broken into sections', 15, `Sections average ${wordsPerSection} words, which is long enough that an assistant has to summarise rather than quote.`),
    )
  } else {
    checks.push(
      fail('chunked', 'Broken into sections', 15, `Only ${sectionCount} heading${sectionCount === 1 ? '' : 's'}. Long unbroken copy has no natural place to quote from.`),
    )
  }

  // 5. Enough substance to be worth citing.
  if (content.wordCount >= MIN_SUBSTANTIVE_WORDS) {
    checks.push(pass('substance', 'Enough to be worth quoting', 15, `${content.wordCount} words.`))
  } else {
    checks.push(
      fail('substance', 'Enough to be worth quoting', 15, `${content.wordCount} words. Thin pages are rarely chosen as a source when a fuller page answers the same question.`),
    )
  }

  // 6. Attribution, which is what a careful assistant looks for before naming a
  // source. Only meaningful where a page claims to be written by somebody.
  if (options.documentType === 'post') {
    if (options.hasAuthor && options.hasDate) {
      checks.push(pass('attribution', 'Says who wrote it and when', 10, 'Author and date are both set.'))
    } else {
      const missing = [!options.hasAuthor && 'an author', !options.hasDate && 'a date'].filter(Boolean).join(' and ')
      checks.push(fail('attribution', 'Says who wrote it and when', 10, `This post has no ${missing}. Assistants weigh who wrote something and how recent it is.`))
    }
  } else {
    checks.push(skip('attribution', 'Says who wrote it and when', 'Only applies to blog posts.'))
  }

  // 7. A specific structured-data type. WebPage says only "this is a page".
  const schemaType = options.schemaType
  if (schemaType && schemaType !== 'WebPage') {
    checks.push(pass('schema-specific', 'Describes itself specifically', 10, `Marked up as ${schemaType}, which tells a machine what kind of thing this is.`))
  } else {
    checks.push(
      warn('schema-specific', 'Describes itself specifically', 10, 'Marked up as a generic web page. Choosing a more specific type on the SEO tab, such as Service, Article or FAQPage, describes what this actually is.'),
    )
  }

  const applicable = checks.filter((c) => c.status !== 'skipped')
  const totalWeight = applicable.reduce((sum, c) => sum + c.weight, 0)
  const earned = applicable.reduce((sum, c) => sum + c.earned, 0)
  const score = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100)

  return {
    score,
    band: score >= 80 ? 'good' : score >= 50 ? 'needs work' : 'poor',
    checks,
    content,
  }
}
