/**
 * Every numeric limit the SEO tooling judges content against, in one place.
 *
 * The field inputs (character counters), the on-page score and the SEO Health
 * panel all read from here, so a page can never be called "too long" by one
 * part of the Studio and "fine" by another.
 */

/** SEO title, in characters. Google truncates on width, not length, so these are guidance. */
export const TITLE_CHARS = { min: 30, warnAbove: 60, criticalAbove: 70 } as const

/** Approximate rendered width of a search-result title, in pixels at 20px Arial. */
export const TITLE_PIXELS = { warnAbove: 560, criticalAbove: 580 } as const

/** Meta description, in characters. */
export const DESCRIPTION_CHARS = { min: 50, warnAbove: 160, criticalAbove: 180 } as const

/** Focus keyword occurrences as a share of total words. */
export const KEYWORD_DENSITY = { min: 0.005, max: 0.025 } as const

/** The keyword should appear in roughly this share of the body, measured from the top. */
export const INTRO_SHARE = 0.1

/** Below this word count a page is thin (ruleset 03, rule 6). */
export const THIN_CONTENT_WORDS = 300

/** Readability limits (ruleset 05, rule 6). */
export const READABILITY = {
  longSentenceWords: 25,
  longParagraphWords: 150,
  /** Consecutive sentences opening with the same word before it is flagged. */
  repeatedOpenerRun: 3,
} as const

/** Readability score bands (ruleset 05, rule 7). */
export const READABILITY_BANDS = { good: 75, ok: 50 } as const

/** On-page score bands (ruleset 05, rule 3). */
export const SCORE_BANDS = { good: 80, needsWork: 50 } as const
