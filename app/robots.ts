import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/app/lib/pageMeta'

/**
 * robots.txt: who is allowed to read the site, and where the sitemap is.
 *
 * While the rebuild is on staging the entire site is disallowed, matching the
 * site-wide noindex. That single rule outranks everything else in this file and
 * must stay until go live, because the live thedesignboutique.com is the site
 * that should be in Google, and two identical sites competing is the one
 * outcome nobody wants.
 *
 * Set NEXT_PUBLIC_ALLOW_INDEXING to "true" at go live and the rules below take
 * effect.
 */

const STAGING = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true'

/**
 * Crawlers that read pages in order to answer questions, and cite what they use.
 *
 * These decide whether this site is mentioned when somebody asks ChatGPT or
 * Perplexity for a branding agency in San Francisco. Blocking them removes the
 * site from those answers entirely, which is why they are named explicitly
 * rather than left to the catch-all: an explicit Allow is a decision somebody
 * made, and a decision is easier to find and revisit than an omission.
 */
const ANSWER_ENGINES = [
  'OAI-SearchBot', // ChatGPT's search index
  'ChatGPT-User', // fetched when somebody asks ChatGPT about a specific page
  'Claude-SearchBot', // Claude's search index
  'Claude-User', // fetched when somebody asks Claude about a specific page
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended', // whether Google may use pages in AI Overviews and Gemini
  'Applebot-Extended',
]

/**
 * Crawlers that collect pages to train future models.
 *
 * A different question from the one above, and a business decision rather than
 * a technical one: allowing these means the site's words may end up inside a
 * model with no citation and no visit back. They are allowed because being known
 * to a model is part of being findable through one, but this is the list to
 * change if that judgment ever changes.
 */
const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'CCBot', 'meta-externalagent', 'Bytespider']

/** Paths no crawler has any business in. */
const PRIVATE_PATHS = [
  '/studio', // the CMS itself
  '/api/', // endpoints, none of which are pages
]

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, '')

  if (STAGING) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      // Declared so it can be checked during the walkthrough. Nothing should be
      // submitted anywhere while the whole site is disallowed.
      sitemap: `${base}/sitemap.xml`,
    }
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      ...ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
      ...TRAINING_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}

/** Exported so the Studio can explain this file without re-deriving it. */
export const ROBOTS_EXPLAINED = {
  staging: STAGING,
  answerEngines: ANSWER_ENGINES,
  trainingCrawlers: TRAINING_CRAWLERS,
  privatePaths: PRIVATE_PATHS,
}
