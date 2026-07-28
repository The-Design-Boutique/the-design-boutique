/**
 * The on-page SEO check library (SOW 2.5, ruleset 05 sections 1, 2 and 7).
 *
 * One library, two consumers, as required by ruleset 05 rule 5 and ruleset 03
 * rule 7: the on-page score in the document editor, and the SEO Health panel.
 * Building it twice is how the two end up disagreeing about the same page.
 *
 * Everything here is a pure function of the document value. No network, no
 * keys, no cost (ruleset 05, rule 1). The optional AI layer sits on top of
 * these results; it never replaces them.
 */

import {
  DESCRIPTION_CHARS,
  INTRO_SHARE,
  KEYWORD_DENSITY,
  SCORE_BANDS,
  THIN_CONTENT_WORDS,
  TITLE_CHARS,
} from './thresholds'
import { extractContent, type ExtractedContent } from './extract'
import { analyseReadability, type ReadabilityResult } from './readability'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skipped'
export type Severity = 'error' | 'warning' | 'notice'
export type ScoreBand = 'good' | 'needs work' | 'poor'

export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  /** Points this check contributes to the score. 0 means advisory only. */
  weight: number
  /** Points earned, between 0 and `weight`. */
  earned: number
  severity: Severity
  /** The editor field this maps to (ruleset 03, rule 5). */
  field?: string
  /** Plain-language result, written to be shown to a non-technical editor. */
  detail: string
}

export interface SeoAnalysis {
  /** 0 to 100, computed over the checks that applied. */
  score: number
  band: ScoreBand
  checks: CheckResult[]
  readability: ReadabilityResult
  content: ExtractedContent
  /** Advisory heading-structure notes (ruleset 05, rule 19). */
  headingHints: string[]
}

export interface SiblingDoc {
  id: string
  title?: string
  description?: string
}

export interface AnalyseOptions {
  /** Other documents, for duplicate title and description detection. */
  siblings?: SiblingDoc[]
}

const pass = (o: Omit<CheckResult, 'status' | 'earned'>): CheckResult => ({
  ...o,
  status: 'pass',
  earned: o.weight,
})
const fail = (o: Omit<CheckResult, 'status' | 'earned'>): CheckResult => ({
  ...o,
  status: 'fail',
  earned: 0,
})
/** A partial credit result: the thing exists but is not ideal. */
const warn = (o: Omit<CheckResult, 'status' | 'earned'>, earned = Math.round(o.weight / 2)): CheckResult => ({
  ...o,
  status: 'warn',
  earned,
})
const skip = (o: Omit<CheckResult, 'status' | 'earned'>): CheckResult => ({
  ...o,
  status: 'skipped',
  earned: 0,
})

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Whole-phrase, case-insensitive occurrence count. */
function countOccurrences(haystack: string, phrase: string): number {
  const h = normalise(haystack)
  const p = normalise(phrase)
  if (!h || !p) return 0
  let count = 0
  let from = 0
  for (;;) {
    const at = h.indexOf(p, from)
    if (at === -1) break
    const before = at === 0 ? ' ' : h[at - 1]
    const after = at + p.length >= h.length ? ' ' : h[at + p.length]
    if (/[\s-]/.test(before) && /[\s-]/.test(after)) count++
    from = at + p.length
  }
  return count
}

const contains = (haystack: string, phrase: string): boolean => countOccurrences(haystack, phrase) > 0

/** Slugs are hyphenated, so compare on the hyphenated form of the keyword. */
function slugContains(slug: string, keyword: string): boolean {
  const s = slug.toLowerCase()
  const k = normalise(keyword).replace(/\s+/g, '-')
  return Boolean(k) && s.includes(k)
}

export function bandForScore(score: number): ScoreBand {
  if (score >= SCORE_BANDS.good) return 'good'
  if (score >= SCORE_BANDS.needsWork) return 'needs work'
  return 'poor'
}

/**
 * Run every check against a document value.
 *
 * `doc` is the whole document, as held by the Studio form or fetched from the
 * API. Fields that are absent are treated as empty, never as failures of a
 * different check.
 */
export function analyseSeo(doc: any, options: AnalyseOptions = {}): SeoAnalysis {
  const seo = doc?.seo || {}
  const content = extractContent(doc)
  const readability = analyseReadability(content)

  const keyword: string = (seo.focusKeyword || '').trim()
  const hasKeyword = keyword.length > 0
  const seoTitle: string = (seo.title || '').trim()
  const effectiveTitle = seoTitle || (doc?.title || '').trim()
  const description: string = (seo.metaDescription || '').trim()
  const slug: string = doc?.slug?.current || ''

  const checks: CheckResult[] = []

  /* --- Focus keyword checks (skipped, never zeroed, when unset: rule 4) --- */

  const keywordSkipDetail = 'No focus keyword is set, so this check is skipped rather than counted against the page.'

  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-in-title', label: 'Focus keyword in the SEO title', weight: 15, severity: 'notice', field: 'seo.title', detail: keywordSkipDetail })
      : contains(effectiveTitle, keyword)
        ? pass({ id: 'keyword-in-title', label: 'Focus keyword in the SEO title', weight: 15, severity: 'error', field: 'seo.title', detail: `"${keyword}" appears in the SEO title.` })
        : fail({ id: 'keyword-in-title', label: 'Focus keyword in the SEO title', weight: 15, severity: 'error', field: 'seo.title', detail: `The SEO title does not contain "${keyword}". This is the single strongest on-page signal.` }),
  )

  // The opening of the page: the first 10% of the body, but never less than
  // the first 100 words, so short pages are not judged on a 20-word window.
  const introWindow = Math.max(Math.round(content.wordCount * INTRO_SHARE), 100)
  const intro = content.words.slice(0, introWindow).join(' ')
  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-in-intro', label: 'Focus keyword near the top of the page', weight: 10, severity: 'notice', detail: keywordSkipDetail })
      : contains(intro, keyword)
        ? pass({ id: 'keyword-in-intro', label: 'Focus keyword near the top of the page', weight: 10, severity: 'warning', detail: `"${keyword}" appears in the opening of the page.` })
        : fail({ id: 'keyword-in-intro', label: 'Focus keyword near the top of the page', weight: 10, severity: 'warning', detail: `"${keyword}" does not appear in the first part of the page. Working it into the opening tells readers and Google what the page is about straight away.` }),
  )

  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-in-description', label: 'Focus keyword in the meta description', weight: 10, severity: 'notice', field: 'seo.metaDescription', detail: keywordSkipDetail })
      : contains(description, keyword)
        ? pass({ id: 'keyword-in-description', label: 'Focus keyword in the meta description', weight: 10, severity: 'warning', field: 'seo.metaDescription', detail: `"${keyword}" appears in the meta description.` })
        : fail({ id: 'keyword-in-description', label: 'Focus keyword in the meta description', weight: 10, severity: 'warning', field: 'seo.metaDescription', detail: `The meta description does not mention "${keyword}". Google bolds matching words in search results, which draws the eye.` }),
  )

  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-in-slug', label: 'Focus keyword in the URL', weight: 5, severity: 'notice', field: 'slug', detail: keywordSkipDetail })
      : !slug
        ? fail({ id: 'keyword-in-slug', label: 'Focus keyword in the URL', weight: 5, severity: 'warning', field: 'slug', detail: 'This page has no URL slug yet.' })
        : slugContains(slug, keyword)
          ? pass({ id: 'keyword-in-slug', label: 'Focus keyword in the URL', weight: 5, severity: 'notice', field: 'slug', detail: `The URL contains "${keyword}".` })
          : fail({ id: 'keyword-in-slug', label: 'Focus keyword in the URL', weight: 5, severity: 'notice', field: 'slug', detail: `The URL does not contain "${keyword}". Only worth changing on a new page: changing a live URL costs more than it gains.` }),
  )

  const subheadings = content.headings.filter((h) => h.level === 2 || h.level === 3)
  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-in-subheading', label: 'Focus keyword in a subheading', weight: 5, severity: 'notice', detail: keywordSkipDetail })
      : subheadings.some((h) => contains(h.text, keyword))
        ? pass({ id: 'keyword-in-subheading', label: 'Focus keyword in a subheading', weight: 5, severity: 'notice', detail: `"${keyword}" appears in a section heading.` })
        : fail({ id: 'keyword-in-subheading', label: 'Focus keyword in a subheading', weight: 5, severity: 'notice', detail: subheadings.length ? `None of the ${subheadings.length} section headings mention "${keyword}".` : 'This page has no section headings to check.' }),
  )

  const occurrences = hasKeyword ? countOccurrences(content.text, keyword) : 0
  const density = content.wordCount ? occurrences / content.wordCount : 0
  // Two decimals: at one, a value just under the 0.5% floor renders as "0.5%"
  // and the advice reads as "0.5%, aim for at least 0.5%".
  const densityPct = (density * 100).toFixed(2)
  // Say what to actually do, rather than leaving the editor to do the algebra.
  const minOccurrences = Math.ceil(content.wordCount * KEYWORD_DENSITY.min)
  const maxOccurrences = Math.floor(content.wordCount * KEYWORD_DENSITY.max)
  checks.push(
    !hasKeyword
      ? skip({ id: 'keyword-density', label: 'Focus keyword used often enough, but not too often', weight: 10, severity: 'notice', detail: keywordSkipDetail })
      : content.wordCount === 0
        ? fail({ id: 'keyword-density', label: 'Focus keyword used often enough, but not too often', weight: 10, severity: 'warning', detail: 'This page has no body content yet.' })
        : density >= KEYWORD_DENSITY.min && density <= KEYWORD_DENSITY.max
          ? pass({ id: 'keyword-density', label: 'Focus keyword used often enough, but not too often', weight: 10, severity: 'warning', detail: `"${keyword}" appears ${occurrences} times in ${content.wordCount} words (${densityPct}%), which is in the healthy range.` })
          : density < KEYWORD_DENSITY.min
            ? fail({ id: 'keyword-density', label: 'Focus keyword used often enough, but not too often', weight: 10, severity: 'warning', detail: `"${keyword}" appears ${occurrences} time${occurrences === 1 ? '' : 's'} in ${content.wordCount} words (${densityPct}%). Use it about ${minOccurrences} time${minOccurrences === 1 ? '' : 's'} to reach the ${(KEYWORD_DENSITY.min * 100).toFixed(1)}% guideline.` })
            : fail({ id: 'keyword-density', label: 'Focus keyword used often enough, but not too often', weight: 10, severity: 'warning', detail: `"${keyword}" appears ${occurrences} times (${densityPct}%), above the ${(KEYWORD_DENSITY.max * 100).toFixed(1)}% guideline. Around ${maxOccurrences} would be the ceiling for this length. Overusing a phrase reads badly and can work against you.` }),
  )

  /* --- Title and description --- */

  const titleLen = effectiveTitle.length
  checks.push(
    !titleLen
      ? fail({ id: 'title-length', label: 'SEO title length', weight: 10, severity: 'error', field: 'seo.title', detail: 'This page has no title at all.' })
      : titleLen > TITLE_CHARS.criticalAbove
        ? warn({ id: 'title-length', label: 'SEO title length', weight: 10, severity: 'warning', field: 'seo.title', detail: `${titleLen} characters. Over ${TITLE_CHARS.criticalAbove} will almost certainly be cut off in search results.` }, 3)
        : titleLen > TITLE_CHARS.warnAbove
          ? warn({ id: 'title-length', label: 'SEO title length', weight: 10, severity: 'notice', field: 'seo.title', detail: `${titleLen} characters. Slightly over the ~${TITLE_CHARS.warnAbove} guideline; the end may be trimmed.` }, 7)
          : titleLen < TITLE_CHARS.min
            ? warn({ id: 'title-length', label: 'SEO title length', weight: 10, severity: 'notice', field: 'seo.title', detail: `${titleLen} characters. Short titles leave room on the table; aim for at least ${TITLE_CHARS.min}.` })
            : pass({ id: 'title-length', label: 'SEO title length', weight: 10, severity: 'notice', field: 'seo.title', detail: `${titleLen} characters, comfortably within the guideline.` }),
  )

  const descLen = description.length
  checks.push(
    !descLen
      ? fail({ id: 'description-length', label: 'Meta description length', weight: 10, severity: 'error', field: 'seo.metaDescription', detail: 'This page has no meta description. Google will invent one from the page copy, which is rarely the sentence you would choose.' })
      : descLen > DESCRIPTION_CHARS.criticalAbove
        ? warn({ id: 'description-length', label: 'Meta description length', weight: 10, severity: 'warning', field: 'seo.metaDescription', detail: `${descLen} characters. Well over the ~${DESCRIPTION_CHARS.warnAbove} guideline, so the end will be cut off.` }, 3)
        : descLen > DESCRIPTION_CHARS.warnAbove
          ? warn({ id: 'description-length', label: 'Meta description length', weight: 10, severity: 'notice', field: 'seo.metaDescription', detail: `${descLen} characters. A little over ~${DESCRIPTION_CHARS.warnAbove}; the tail may be trimmed.` }, 7)
          : descLen < DESCRIPTION_CHARS.min
            ? warn({ id: 'description-length', label: 'Meta description length', weight: 10, severity: 'notice', field: 'seo.metaDescription', detail: `${descLen} characters. Under ${DESCRIPTION_CHARS.min} is usually too thin to persuade anyone to click.` })
            : pass({ id: 'description-length', label: 'Meta description length', weight: 10, severity: 'notice', field: 'seo.metaDescription', detail: `${descLen} characters, within the ${DESCRIPTION_CHARS.min} to ${DESCRIPTION_CHARS.warnAbove} range.` }),
  )

  /* --- Images and links --- */

  const missingAlt = content.images.filter((i) => !i.alt.trim()).length
  checks.push(
    content.images.length === 0
      ? skip({ id: 'image-alt', label: 'Every image has alt text', weight: 10, severity: 'notice', detail: 'This page has no images, so there is nothing to check.' })
      : missingAlt === 0
        ? pass({ id: 'image-alt', label: 'Every image has alt text', weight: 10, severity: 'warning', detail: `All ${content.images.length} images have alt text.` })
        : fail({ id: 'image-alt', label: 'Every image has alt text', weight: 10, severity: 'warning', detail: `${missingAlt} of ${content.images.length} images have no alt text. Alt text is what screen readers announce, and it is how Google reads an image.` }),
  )

  const internalLinks = content.links.filter((l) => l.kind === 'internal').length
  checks.push(
    internalLinks > 0
      ? pass({ id: 'internal-link', label: 'Links to at least one other page on the site', weight: 10, severity: 'notice', detail: `${internalLinks} internal link${internalLinks === 1 ? '' : 's'}.` })
      : fail({ id: 'internal-link', label: 'Links to at least one other page on the site', weight: 10, severity: 'notice', detail: 'This page does not link anywhere else on the site. Internal links help visitors keep moving and help Google understand how pages relate.' }),
  )

  /* --- Readability, as a scored check (rule 2) --- */

  checks.push(
    readability.sentenceCount === 0
      ? skip({ id: 'readability', label: 'Readability', weight: 5, severity: 'notice', detail: 'Not enough body copy to assess.' })
      : readability.band === 'needs work'
        ? fail({ id: 'readability', label: 'Readability', weight: 5, severity: 'notice', detail: `Readability is "needs work" (${readability.score}/100). See the readability panel for the specific sentences.` })
        : readability.band === 'ok'
          ? warn({ id: 'readability', label: 'Readability', weight: 5, severity: 'notice', detail: `Readability is "ok" (${readability.score}/100).` }, 4)
          : pass({ id: 'readability', label: 'Readability', weight: 5, severity: 'notice', detail: `Readability is good (${readability.score}/100).` }),
  )

  /* --- Advisory checks: no weight, but shown in the health panel --- */

  if (!hasKeyword) {
    checks.push(
      fail({ id: 'focus-keyword-set', label: 'Focus keyword set', weight: 0, severity: 'notice', field: 'seo.focusKeyword', detail: 'Set a focus keyword to turn on the keyword checks. It changes nothing on the page itself; it tells this panel what to measure against.' }),
    )
  }

  const h1s = content.headings.filter((h) => h.level === 1)
  checks.push(
    h1s.length === 1
      ? pass({ id: 'h1-count', label: 'Exactly one main heading', weight: 0, severity: 'warning', detail: 'This page has a single h1, which is what search engines expect.' })
      : h1s.length === 0
        ? fail({ id: 'h1-count', label: 'Exactly one main heading', weight: 0, severity: 'warning', detail: 'This page has no main heading (h1).' })
        : fail({ id: 'h1-count', label: 'Exactly one main heading', weight: 0, severity: 'warning', detail: `This page has ${h1s.length} main headings (h1). Only one should be the page title; the rest should be section headings.` }),
  )

  const headingHints = buildHeadingHints(content, keyword)
  checks.push(
    headingHints.length === 0
      ? pass({ id: 'heading-structure', label: 'Heading structure', weight: 0, severity: 'notice', detail: 'Headings run in order with no levels skipped.' })
      : fail({ id: 'heading-structure', label: 'Heading structure', weight: 0, severity: 'notice', detail: headingHints.join(' ') }),
  )

  checks.push(
    content.wordCount >= THIN_CONTENT_WORDS
      ? pass({ id: 'thin-content', label: 'Enough content on the page', weight: 0, severity: 'notice', detail: `${content.wordCount} words.` })
      : fail({ id: 'thin-content', label: 'Enough content on the page', weight: 0, severity: 'notice', detail: `${content.wordCount} words, under the ${THIN_CONTENT_WORDS} guideline. Thin pages struggle to rank for anything competitive. Some pages (contact, thank you) are meant to be short; ignore this on those.` }),
  )

  const indexable = seo?.robots?.index !== false
  checks.push(
    indexable
      ? pass({ id: 'noindex', label: 'Page is allowed in search results', weight: 0, severity: 'error', field: 'seo.robots.index', detail: 'Indexing is allowed for this page.' })
      : fail({ id: 'noindex', label: 'Page is allowed in search results', weight: 0, severity: 'error', field: 'seo.robots.index', detail: 'Indexing is switched off, so this page asks Google to keep it out of search results entirely. Deliberate on a thank-you page; a serious problem anywhere else.' }),
  )

  const canonical: string = (seo.canonicalUrl || '').trim()
  checks.push(
    !canonical
      ? pass({ id: 'canonical', label: 'Canonical URL', weight: 0, severity: 'notice', field: 'seo.canonicalUrl', detail: 'Empty, so the page is its own canonical. That is correct for almost every page.' })
      : /^https?:\/\//i.test(canonical)
        ? pass({ id: 'canonical', label: 'Canonical URL', weight: 0, severity: 'notice', field: 'seo.canonicalUrl', detail: `Points at ${canonical}.` })
        : fail({ id: 'canonical', label: 'Canonical URL', weight: 0, severity: 'error', field: 'seo.canonicalUrl', detail: 'A canonical URL must be a full address starting with https://.' }),
  )

  const ogTitle = (seo.ogTitle || '').trim() || effectiveTitle
  const ogDescription = (seo.ogDescription || '').trim() || description
  const missingOg = [!ogTitle && 'a share title', !ogDescription && 'a share description'].filter(Boolean)
  checks.push(
    missingOg.length === 0
      ? pass({ id: 'og-complete', label: 'Social sharing card is complete', weight: 0, severity: 'notice', field: 'seo.ogTitle', detail: 'The share card resolves a title and description. The image falls back to the page image, then the site default.' })
      : fail({ id: 'og-complete', label: 'Social sharing card is complete', weight: 0, severity: 'notice', field: 'seo.ogTitle', detail: `The share card is missing ${missingOg.join(' and ')}. Filling in the SEO title and meta description fixes this too.` }),
  )

  const brokenLinks = content.links.filter((l) => l.kind === 'external' && !/^(https?:\/\/|mailto:|tel:)/i.test(l.href))
  if (content.links.length) {
    checks.push(
      brokenLinks.length === 0
        ? pass({ id: 'link-validity', label: 'Links are well formed', weight: 0, severity: 'notice', detail: `${content.links.length} link${content.links.length === 1 ? '' : 's'} checked.` })
        : fail({ id: 'link-validity', label: 'Links are well formed', weight: 0, severity: 'warning', detail: `${brokenLinks.length} link${brokenLinks.length === 1 ? ' does' : 's do'} not look like a valid address.` }),
    )
  }

  /* --- Duplicates, when the caller supplied other documents to compare --- */

  if (options.siblings?.length) {
    const dupTitle = effectiveTitle
      ? options.siblings.filter((s) => s.id !== doc?._id && normalise(s.title || '') === normalise(effectiveTitle))
      : []
    checks.push(
      dupTitle.length === 0
        ? pass({ id: 'duplicate-title', label: 'Title is unique across the site', weight: 0, severity: 'warning', field: 'seo.title', detail: 'No other page uses this title.' })
        : fail({ id: 'duplicate-title', label: 'Title is unique across the site', weight: 0, severity: 'warning', field: 'seo.title', detail: `${dupTitle.length} other page${dupTitle.length === 1 ? '' : 's'} use the same title. Google has to choose between them, and may pick the wrong one.` }),
    )

    const dupDesc = description
      ? options.siblings.filter((s) => s.id !== doc?._id && normalise(s.description || '') === normalise(description))
      : []
    checks.push(
      dupDesc.length === 0
        ? pass({ id: 'duplicate-description', label: 'Meta description is unique across the site', weight: 0, severity: 'notice', field: 'seo.metaDescription', detail: 'No other page uses this description.' })
        : fail({ id: 'duplicate-description', label: 'Meta description is unique across the site', weight: 0, severity: 'notice', field: 'seo.metaDescription', detail: `${dupDesc.length} other page${dupDesc.length === 1 ? '' : 's'} use the same description.` }),
    )
  }

  /* --- Score over the checks that actually applied (rule 4) --- */

  const scored = checks.filter((c) => c.weight > 0 && c.status !== 'skipped')
  const available = scored.reduce((sum, c) => sum + c.weight, 0)
  const earned = scored.reduce((sum, c) => sum + c.earned, 0)
  const score = available === 0 ? 0 : Math.round((earned / available) * 100)

  return { score, band: bandForScore(score), checks, readability, content, headingHints }
}

/** Heading-structure hints for the assist panel (ruleset 05, rule 19). */
function buildHeadingHints(content: ExtractedContent, keyword: string): string[] {
  const hints: string[] = []
  const { headings } = content

  const h2s = headings.filter((h) => h.level === 2)
  if (content.wordCount > THIN_CONTENT_WORDS && h2s.length === 0) {
    hints.push('This page has no section headings. Long pages without headings are hard to scan.')
  }

  // A level may not jump by more than one going down the page.
  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level
    if (jump > 1) {
      hints.push(`Heading levels jump from h${headings[i - 1].level} to h${headings[i].level} at "${headings[i].text}". Levels should step down one at a time.`)
      break
    }
  }

  if (keyword && h2s.length > 0 && !h2s.some((h) => contains(h.text, keyword))) {
    hints.push(`None of the section headings mention "${keyword}".`)
  }

  return hints
}
