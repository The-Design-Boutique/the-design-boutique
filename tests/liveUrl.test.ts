import assert from 'node:assert/strict'
import { test } from 'node:test'

import { liveUrlCandidates, liveSearchUrl, isUnknownToGoogle } from '../app/lib/seo/liveUrl.ts'

const SITE = 'https://thedesignboutique.com/'

test('prefers the trailing slash the live site actually publishes', () => {
  // Verified against the Search Console API: all 25 pages carrying search data
  // end in a slash. Getting this backwards returns HTTP 200 with "URL is
  // unknown to Google", which reads as a de-indexed site rather than a bug.
  assert.equal(liveSearchUrl(SITE, '/about'), 'https://thedesignboutique.com/about/')
})

test('offers the slashless form as a fallback, exactly once', () => {
  assert.deepEqual(liveUrlCandidates(SITE, '/about'), [
    'https://thedesignboutique.com/about/',
    'https://thedesignboutique.com/about',
  ])
})

test('the site root has only one possible form', () => {
  // "https://thedesignboutique.com" with no path is not a page URL, so there is
  // nothing to fall back to and no second call worth spending.
  assert.deepEqual(liveUrlCandidates(SITE, '/'), ['https://thedesignboutique.com/'])
})

test('does not care how the site URL was configured', () => {
  for (const site of ['https://thedesignboutique.com', 'https://thedesignboutique.com/', 'https://thedesignboutique.com///']) {
    assert.equal(liveSearchUrl(site, '/work'), 'https://thedesignboutique.com/work/')
  }
})

test('tolerates the ways a path can arrive', () => {
  for (const path of ['/work', 'work', '//work', '/work/']) {
    assert.equal(liveSearchUrl(SITE, path), 'https://thedesignboutique.com/work/')
  }
})

test('handles nested paths', () => {
  assert.equal(liveSearchUrl(SITE, '/about/team'), 'https://thedesignboutique.com/about/team/')
})

test('never appends a slash to a file', () => {
  // "/sitemap.xml/" is a directory that does not exist. Asking about it would
  // report the sitemap as missing.
  assert.deepEqual(liveUrlCandidates(SITE, '/sitemap.xml'), ['https://thedesignboutique.com/sitemap.xml'])
  assert.deepEqual(liveUrlCandidates(SITE, '/brochure.pdf'), ['https://thedesignboutique.com/brochure.pdf'])
})

test('a long final segment with a dot is still a page', () => {
  // Guards the file test against eating real slugs. ".compliance" is not an
  // extension anyone serves.
  assert.equal(liveSearchUrl(SITE, '/ada.compliance-guide'), 'https://thedesignboutique.com/ada.compliance-guide/')
})

test('only an unknown URL triggers the second attempt', () => {
  assert.equal(isUnknownToGoogle('URL is unknown to Google'), true)

  // These are real answers Laney needs to see, not reasons to retry.
  assert.equal(isUnknownToGoogle('Submitted and indexed'), false)
  assert.equal(isUnknownToGoogle('Crawled - currently not indexed'), false)
  assert.equal(isUnknownToGoogle('Excluded by ‘noindex’ tag'), false)
  assert.equal(isUnknownToGoogle(undefined), false)
})
