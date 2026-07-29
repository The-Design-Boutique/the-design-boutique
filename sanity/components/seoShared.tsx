'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Card, Flex, Stack, Text } from '@sanity/ui'
import { useClient } from 'sanity'
import { type SeoIssue } from '../../app/lib/seoIssues'

/**
 * Recompute on a short delay so typing stays smooth (ruleset 05, rule 1).
 *
 * Shared because all three panels beside the editor recompute from the open
 * document as it is typed into, and three copies of the same four lines is
 * three places to fix when the delay turns out to be wrong.
 */
export function useDebounced<T>(value: T, ms: number): T {
  const [held, setHeld] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setHeld(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return held
}


/**
 * The pieces shared by the SEO tab and the Search tab.
 *
 * Both read the same stored audit record, so the fetching, the "checked
 * recently?" state and the re-check button live here once. Two copies of this
 * would drift, and the drift would be silent: one tab would show yesterday's
 * numbers while the other showed today's.
 */

export type Tone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

export interface AuditDoc {
  fetchedAt?: string
  lighthouseSeoScore?: number
  lighthouseAccessibilityScore?: number
  lighthouseBestPracticesScore?: number
  lighthouseFailures?: Array<{ id: string; title: string; description: string; category: string }>
  lighthouseError?: string
  indexVerdict?: string
  indexStatus?: string
  robotsState?: string
  canonicalGoogle?: string
  lastCrawledAt?: string
  clicks?: number
  impressions?: number
  position?: number
  topQueries?: Array<{ query: string; clicks: number; impressions: number; position: number }>
  searchConsoleError?: string
}

/**
 * Where a document of each type lives, mirroring the catch-all route.
 *
 * Posts and pages both sit at the root: /{slug}, matching the live WordPress
 * site. Not /blog/{slug}, which 404s here and redirects on the live site.
 */
const PATH_PREFIX: Record<string, string> = { page: '', post: '', goldEvent: 'gold/', client: 'portfolio/' }

export function pathForDoc(type: string, slug?: string): string | null {
  if (!slug) return null
  const prefix = PATH_PREFIX[type]
  if (prefix === undefined) return null
  return slug === 'home' ? '/' : `/${prefix}${slug}`
}

const AUDIT_QUERY = `*[_type == "seoAudit" && path == $path][0]{
  fetchedAt, lighthouseSeoScore, lighthouseAccessibilityScore, lighthouseBestPracticesScore,
  lighthouseFailures, lighthouseError, indexVerdict, indexStatus, robotsState, canonicalGoogle,
  lastCrawledAt, clicks, impressions, position, topQueries, searchConsoleError
}`

export interface SeoAuditState {
  audit: AuditDoc | null
  auditLoaded: boolean
  rechecking: boolean
  recheckNote: string | null
  recheck: () => void
  /** True once we know this page has never been looked at, as opposed to still loading. */
  neverChecked: boolean
}

export function useSeoAudit(path: string | null): SeoAuditState {
  const client = useClient({ apiVersion: '2025-02-19' })
  const [audit, setAudit] = useState<AuditDoc | null>(null)
  const [auditLoaded, setAuditLoaded] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [recheckNote, setRecheckNote] = useState<string | null>(null)

  const loadAudit = useCallback(async () => {
    if (!path) {
      setAuditLoaded(true)
      return
    }
    try {
      setAudit((await client.fetch<AuditDoc | null>(AUDIT_QUERY, { path })) || null)
    } catch {
      setAudit(null)
    } finally {
      setAuditLoaded(true)
    }
  }, [client, path])

  useEffect(() => {
    loadAudit()
  }, [loadAudit])

  /**
   * Ask the server to look at this one page now.
   *
   * The server allows this without the cron secret for a single page, and
   * throttles it. A refusal for having checked too recently is not a failure and
   * says so, because "could not reach Google" would be a lie that sends someone
   * looking for a problem that is not there.
   */
  const recheck = useCallback(async () => {
    if (!path) return
    setRechecking(true)
    setRecheckNote(null)
    try {
      const res = await fetch(`/api/cron/seo-audit?path=${encodeURIComponent(path)}`)
      const body = await res.json().catch(() => null)
      if (res.ok) {
        await loadAudit()
        setRecheckNote('Updated.')
      } else if (body?.error) {
        setRecheckNote(body.error)
      } else {
        setRecheckNote('Could not reach Google just now. Everything computed from the page itself is still up to date.')
      }
    } catch {
      setRecheckNote('Could not reach the server. Everything computed from the page itself is still up to date.')
    } finally {
      setRechecking(false)
    }
  }, [path, loadAudit])

  return {
    audit,
    auditLoaded,
    rechecking,
    recheckNote,
    recheck,
    neverChecked: auditLoaded && !audit,
  }
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <Stack space={3}>
      <Stack space={2}>
        <Text size={2} weight="semibold">
          {title}
        </Text>
        {subtitle ? (
          <Text size={1} muted>
            {subtitle}
          </Text>
        ) : null}
      </Stack>
      {children}
    </Stack>
  )
}

export function IssueRow({ issue }: { issue: SeoIssue }) {
  const tone: Tone = issue.severity === 'error' ? 'critical' : issue.severity === 'warning' ? 'caution' : 'default'
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Badge tone={tone} fontSize={0} mode="outline">
            {issue.severity === 'error' ? 'Fix' : issue.severity === 'warning' ? 'Check' : 'Note'}
          </Badge>
          <Text size={1} weight="semibold">{issue.title}</Text>
        </Flex>
        {issue.detail ? <Text size={1} muted>{issue.detail}</Text> : null}
      </Stack>
    </Card>
  )
}
