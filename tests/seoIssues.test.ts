import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildIssueList,
  countBySeverity,
  issuesForField,
  issuesFromChecks,
  issuesFromLighthouse,
  issuesFromSearch,
  sortIssues,
} from '../app/lib/seoIssues.ts'

/**
 * Tests for the SEO Health panel's issue model (SOW 2.3).
 *
 * The risk here is a panel that cries wolf. Staging is deliberately hidden from
 * search engines, so the audits that fail purely because of that must not be
 * reported on every page, or editors learn to ignore the whole thing.
 */

describe('issuesFromChecks', () => {
  const checks = [
    { id: 'a', label: 'A', detail: 'd', status: 'pass', severity: 'error' },
    { id: 'b', label: 'B', detail: 'd', status: 'fail', severity: 'error', field: 'seo.title' },
    { id: 'c', label: 'C', detail: 'd', status: 'warn', severity: 'warning' },
    { id: 'd', label: 'D', detail: 'd', status: 'skipped', severity: 'notice' },
  ]

  test('only failures and warnings become issues', () => {
    const issues = issuesFromChecks(checks)
    assert.deepEqual(issues.map((i) => i.id), ['cms-b', 'cms-c'])
  })

  test('a skipped check is never an issue', () => {
    // Skipped means the check did not apply, which is not a problem.
    assert.equal(issuesFromChecks(checks).some((i) => i.id === 'cms-d'), false)
  })

  test('the field mapping is carried through', () => {
    assert.equal(issuesFromChecks(checks)[0].field, 'seo.title')
  })
})

describe('issuesFromLighthouse', () => {
  const failures = [
    { id: 'meta-description', title: 'No meta description', description: 'x', category: 'seo' },
    { id: 'is-crawlable', title: 'Page is blocked from indexing', description: 'x', category: 'seo' },
    { id: 'color-contrast', title: 'Contrast is too low', description: 'x', category: 'accessibility' },
  ]

  test('suppresses the audits that only fail because staging is hidden', () => {
    const ids = issuesFromLighthouse(failures, { indexingAllowed: false }).map((i) => i.id)
    assert.equal(ids.includes('lh-is-crawlable'), false)
    assert.equal(ids.includes('lh-meta-description'), true)
  })

  test('reports them once the site is allowed to be indexed', () => {
    const ids = issuesFromLighthouse(failures, { indexingAllowed: true }).map((i) => i.id)
    assert.equal(ids.includes('lh-is-crawlable'), true)
  })

  test('SEO audits outrank accessibility and best practice notes', () => {
    const issues = issuesFromLighthouse(failures, { indexingAllowed: true })
    assert.equal(issues.find((i) => i.id === 'lh-meta-description')!.severity, 'warning')
    assert.equal(issues.find((i) => i.id === 'lh-color-contrast')!.severity, 'notice')
  })

  test('maps to a field where one is known', () => {
    const issue = issuesFromLighthouse(failures, { indexingAllowed: true }).find((i) => i.id === 'lh-meta-description')
    assert.equal(issue!.field, 'seo.metaDescription')
  })

  test('handles no data without throwing', () => {
    assert.deepEqual(issuesFromLighthouse(undefined), [])
  })
})

describe('issuesFromSearch', () => {
  test('raises a page Google has not indexed', () => {
    const issues = issuesFromSearch({ indexVerdict: 'NEUTRAL', indexStatus: 'Discovered, not indexed' })
    assert.equal(issues.some((i) => i.id === 'search-not-indexed'), true)
  })

  test('says nothing when Google is happy', () => {
    const issues = issuesFromSearch({ indexVerdict: 'PASS', lastCrawledAt: '2026-07-01T00:00:00Z' })
    assert.deepEqual(issues, [])
  })

  test('flags Google choosing a different canonical', () => {
    const issues = issuesFromSearch(
      { indexVerdict: 'PASS', lastCrawledAt: 'x', canonicalGoogle: 'https://example.com/other' },
      'https://example.com/this',
    )
    assert.equal(issues.some((i) => i.id === 'search-canonical-mismatch'), true)
  })

  test('a trailing slash is not a canonical mismatch', () => {
    const issues = issuesFromSearch(
      { indexVerdict: 'PASS', lastCrawledAt: 'x', canonicalGoogle: 'https://example.com/this/' },
      'https://example.com/this',
    )
    assert.equal(issues.some((i) => i.id === 'search-canonical-mismatch'), false)
  })

  test('does not treat low traffic as a fault', () => {
    // Few clicks is a content and competition question, not something to fix.
    const issues = issuesFromSearch({ indexVerdict: 'PASS', lastCrawledAt: 'x', clicks: 0, impressions: 2 })
    assert.deepEqual(issues, [])
  })

  test('handles missing data', () => {
    assert.deepEqual(issuesFromSearch(null), [])
    assert.deepEqual(issuesFromSearch(undefined), [])
  })
})

describe('assembling the list', () => {
  test('most serious first', () => {
    const sorted = sortIssues([
      { id: '1', title: 'a', detail: '', group: 'content', source: 'cms', severity: 'notice' },
      { id: '2', title: 'b', detail: '', group: 'content', source: 'cms', severity: 'error' },
      { id: '3', title: 'c', detail: '', group: 'content', source: 'cms', severity: 'warning' },
    ])
    assert.deepEqual(sorted.map((i) => i.id), ['2', '3', '1'])
  })

  test('combines all three sources', () => {
    const issues = buildIssueList({
      checks: [{ id: 'x', label: 'X', detail: '', status: 'fail', severity: 'error' }],
      lighthouseFailures: [{ id: 'meta-description', title: 'T', description: '', category: 'seo' }],
      search: { indexVerdict: 'NEUTRAL' },
      indexingAllowed: true,
    })
    assert.deepEqual([...new Set(issues.map((i) => i.group))].sort(), ['content', 'search', 'technical'])
  })

  test('issues can be looked up by the field they belong to', () => {
    const issues = buildIssueList({
      checks: [{ id: 'x', label: 'X', detail: '', status: 'fail', severity: 'error', field: 'seo.title' }],
    })
    assert.equal(issuesForField(issues, 'seo.title').length, 1)
    assert.equal(issuesForField(issues, 'seo.metaDescription').length, 0)
  })

  test('counts by severity', () => {
    const counts = countBySeverity([
      { id: '1', title: '', detail: '', group: 'content', source: 'cms', severity: 'error' },
      { id: '2', title: '', detail: '', group: 'content', source: 'cms', severity: 'error' },
      { id: '3', title: '', detail: '', group: 'content', source: 'cms', severity: 'notice' },
    ])
    assert.deepEqual(counts, { error: 2, warning: 0, notice: 1 })
  })
})
