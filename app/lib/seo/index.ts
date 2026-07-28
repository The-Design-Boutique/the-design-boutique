/**
 * The shared SEO check library (SOW 2.5 sections 1, 2 and 7; SOW 2.3 in-CMS checks).
 *
 * Import from here rather than from the individual modules, so there is one
 * public surface to keep stable for the client's future developers.
 */

export { analyseSeo, bandForScore } from './checks'
export type {
  AnalyseOptions,
  CheckResult,
  CheckStatus,
  ScoreBand,
  SeoAnalysis,
  Severity,
  SiblingDoc,
} from './checks'

export { analyseReadability, splitSentences } from './readability'
export type { ReadabilityBand, ReadabilityFlag, ReadabilityFlagType, ReadabilityResult } from './readability'

export { extractContent } from './extract'
export type { ExtractedContent, ExtractedHeading, ExtractedImage, ExtractedLink, HeadingLevel } from './extract'

export { liveUrlCandidates, liveSearchUrl, isUnknownToGoogle } from './liveUrl'

export * from './thresholds'
