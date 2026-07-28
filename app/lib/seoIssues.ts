/**
 * One issue list for the SEO Health panel (SOW 2.3, ruleset 03 rules 4 and 5).
 *
 * Three very different sources have to end up looking the same to an editor:
 * our own instant checks, Lighthouse, and Search Console. This module turns all
 * three into one shape, groups them, and holds the single table that says which
 * editor field each issue belongs to.
 *
 * Deliberately free of imports so it can be unit tested directly, and free of
 * anything Google-specific beyond the field names in the payloads it is handed.
 */

export type IssueSource = 'cms' | 'lighthouse' | 'search'
export type IssueGroup = 'content' | 'technical' | 'search'
export type IssueSeverity = 'error' | 'warning' | 'notice'

export interface SeoIssue {
  id: string
  title: string
  detail: string
  group: IssueGroup
  source: IssueSource
  severity: IssueSeverity
  /** The editor field this belongs to, if any. Unmapped issues show in the panel only. */
  field?: string
}

/**
 * Which editor field each issue points at (ruleset 03, rule 5).
 *
 * One table, here. If an issue is not listed it simply has no inline home and
 * appears in the panel only, which is the documented behaviour rather than a
 * gap.
 */
export const ISSUE_FIELD_MAP: Record<string, string> = {
  // Our own checks already carry a field; these cover the Google-sourced ones.
  'lh-meta-description': 'seo.metaDescription',
  'lh-document-title': 'seo.title',
  'lh-http-status-code': 'slug',
  'lh-is-crawlable': 'seo.robots.index',
  'lh-robots-txt': 'seo.robots.index',
  'lh-canonical': 'seo.canonicalUrl',
  'lh-image-alt': 'pageBuilder',
  'lh-link-text': 'pageBuilder',
  'lh-hreflang': 'seo.canonicalUrl',
  'search-not-indexed': 'seo.robots.index',
  'search-excluded-noindex': 'seo.robots.index',
  'search-canonical-mismatch': 'seo.canonicalUrl',
  'search-never-crawled': 'slug',
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, notice: 2 }

/** Most serious first, then by group, so the top of the list is the thing to do next. */
export function sortIssues(issues: SeoIssue[]): SeoIssue[] {
  const groupOrder: Record<IssueGroup, number> = { content: 0, technical: 1, search: 2 }
  return [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || groupOrder[a.group] - groupOrder[b.group],
  )
}

/* ------------------------------------------------------------------ */
/* In-CMS checks                                                        */
/* ------------------------------------------------------------------ */

interface CheckLike {
  id: string
  label: string
  detail: string
  status: string
  severity: string
  field?: string
}

/**
 * Turn failing on-page checks into issues.
 *
 * Only failures and warnings become issues. A passing check is not news, and a
 * skipped one is explicitly not a problem (ruleset 05, rule 4).
 */
export function issuesFromChecks(checks: CheckLike[]): SeoIssue[] {
  return checks
    .filter((c) => c.status === 'fail' || c.status === 'warn')
    .map((c) => ({
      id: `cms-${c.id}`,
      title: c.label,
      detail: c.detail,
      group: 'content' as const,
      source: 'cms' as const,
      severity: (['error', 'warning', 'notice'].includes(c.severity) ? c.severity : 'notice') as IssueSeverity,
      field: c.field,
    }))
}

/* ------------------------------------------------------------------ */
/* Lighthouse                                                           */
/* ------------------------------------------------------------------ */

interface LighthouseFailure {
  id?: string
  title?: string
  description?: string
  category?: string
}

/**
 * Audits we deliberately do not raise, with the reason.
 *
 * `is-crawlable` fails on every page while the staging site is hidden from
 * search engines, which is the SOW's own instruction. Reporting it as a problem
 * on every page would train editors to ignore the panel.
 */
const SUPPRESSED_WHILE_STAGING = new Set(['is-crawlable', 'robots-txt'])

export function issuesFromLighthouse(
  failures: LighthouseFailure[] | undefined,
  options: { indexingAllowed?: boolean } = {},
): SeoIssue[] {
  const { indexingAllowed = false } = options
  return (failures || [])
    .filter((f) => f.id)
    .filter((f) => indexingAllowed || !SUPPRESSED_WHILE_STAGING.has(f.id!))
    .map((f) => {
      const id = `lh-${f.id}`
      return {
        id,
        title: f.title || f.id!,
        detail: f.description || '',
        group: 'technical' as const,
        source: 'lighthouse' as const,
        // Lighthouse does not rank its own audits, and treating every one as an
        // error would drown the genuine problems. SEO audits are warnings;
        // accessibility and best practices are notices.
        severity: (f.category === 'seo' ? 'warning' : 'notice') as IssueSeverity,
        field: ISSUE_FIELD_MAP[id],
      }
    })
}

/* ------------------------------------------------------------------ */
/* Search Console                                                       */
/* ------------------------------------------------------------------ */

interface SearchData {
  indexVerdict?: string
  indexStatus?: string
  robotsState?: string
  canonicalGoogle?: string
  lastCrawledAt?: string
  clicks?: number
  impressions?: number
  position?: number
}

/**
 * Turn what Google reports about a URL into issues.
 *
 * Only things an editor can act on. "Not indexed" matters; a low click count
 * does not, because that is a content and competition question rather than a
 * fault, and presenting it as one would be misleading.
 */
export function issuesFromSearch(data: SearchData | null | undefined, canonicalUrl?: string): SeoIssue[] {
  if (!data) return []
  const issues: SeoIssue[] = []
  const verdict = (data.indexVerdict || '').toUpperCase()

  if (verdict && verdict !== 'PASS') {
    issues.push({
      id: 'search-not-indexed',
      title: 'Google has not indexed this page',
      detail:
        data.indexStatus ||
        'Google knows about this page but is not showing it in search results. On a staging site this is expected.',
      group: 'search',
      source: 'search',
      severity: 'warning',
      field: ISSUE_FIELD_MAP['search-not-indexed'],
    })
  }

  if ((data.robotsState || '').toUpperCase().includes('DISALLOWED')) {
    issues.push({
      id: 'search-excluded-noindex',
      title: 'This page asks Google not to index it',
      detail: 'Deliberate on a thank you page. A problem anywhere else.',
      group: 'search',
      source: 'search',
      severity: 'warning',
      field: ISSUE_FIELD_MAP['search-excluded-noindex'],
    })
  }

  // Google picking a different canonical usually means duplicate content.
  if (data.canonicalGoogle && canonicalUrl) {
    const strip = (u: string) => u.replace(/\/+$/, '').toLowerCase()
    if (strip(data.canonicalGoogle) !== strip(canonicalUrl)) {
      issues.push({
        id: 'search-canonical-mismatch',
        title: 'Google is treating a different address as the real one',
        detail: `Google has chosen ${data.canonicalGoogle}. That usually means it has found the same content in two places.`,
        group: 'search',
        source: 'search',
        severity: 'warning',
        field: ISSUE_FIELD_MAP['search-canonical-mismatch'],
      })
    }
  }

  if (!data.lastCrawledAt && verdict) {
    issues.push({
      id: 'search-never-crawled',
      title: 'Google has never visited this page',
      detail: 'New pages can take days or weeks to be crawled. Nothing to do unless it stays this way.',
      group: 'search',
      source: 'search',
      severity: 'notice',
      field: ISSUE_FIELD_MAP['search-never-crawled'],
    })
  }

  return issues
}

/** Everything, in one list, most serious first. */
export function buildIssueList(input: {
  checks?: CheckLike[]
  lighthouseFailures?: LighthouseFailure[]
  search?: SearchData | null
  canonicalUrl?: string
  indexingAllowed?: boolean
}): SeoIssue[] {
  return sortIssues([
    ...issuesFromChecks(input.checks || []),
    ...issuesFromLighthouse(input.lighthouseFailures, { indexingAllowed: input.indexingAllowed }),
    ...issuesFromSearch(input.search, input.canonicalUrl),
  ])
}

/** Issues that belong beside a given field, for the inline callouts (rule 5). */
export function issuesForField(issues: SeoIssue[], field: string): SeoIssue[] {
  return issues.filter((i) => i.field === field)
}

export function countBySeverity(issues: SeoIssue[]): Record<IssueSeverity, number> {
  const out: Record<IssueSeverity, number> = { error: 0, warning: 0, notice: 0 }
  for (const i of issues) out[i.severity]++
  return out
}
