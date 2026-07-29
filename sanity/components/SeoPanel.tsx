'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { analyseSeo, type CheckResult, type SeoAnalysis } from '../../app/lib/seo'
import { buildIssueList } from '../../app/lib/seoIssues'
import { timeAgo } from '../../app/lib/timeAgo'
import { IssueRow, Section, pathForDoc, useSeoAudit } from './seoShared'
import { SuggestControls } from './SuggestControls'
import { SerpPreview } from './SerpPreview'
import { BAND_VAR, useBandVars } from '../lib/bandColors'

/**
 * The domain a search result would show. The staging build is hidden from
 * Google, so the address anybody would ever see for this page is the live one.
 */
const LIVE_HOST = 'thedesignboutique.com'
const SITE_NAME = 'The Design Boutique'

type Tone = 'default' | 'primary' | 'positive' | 'caution' | 'critical'

const BAND_TONE: Record<string, Tone> = {
  good: 'positive',
  'needs work': 'caution',
  poor: 'critical',
  ok: 'caution',
}

const STATUS_MARK: Record<CheckResult['status'], string> = {
  pass: '✓',
  warn: '!',
  fail: '✕',
  skipped: '–',
}

const STATUS_TONE: Record<CheckResult['status'], Tone> = {
  pass: 'positive',
  warn: 'caution',
  fail: 'critical',
  skipped: 'default',
}

/** Recompute on a short delay so typing stays smooth (ruleset 05, rule 1). */
function useDebounced<T>(value: T, ms: number): T {
  const [held, setHeld] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setHeld(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return held
}

function ScoreHeader({ analysis }: { analysis: SeoAnalysis }) {
  const skipped = analysis.checks.filter((c) => c.status === 'skipped' && c.weight > 0)
  const skippedPoints = skipped.reduce((sum, c) => sum + c.weight, 0)

  return (
    <Card padding={4} radius={2} tone={BAND_TONE[analysis.band]} border>
      <Stack space={3}>
        <Flex align="center" gap={3}>
          <Text size={4} weight="bold">
            {analysis.score}
          </Text>
          <Stack space={2}>
            <Text size={1} weight="semibold" style={{ textTransform: 'capitalize' }}>
              {analysis.band}
            </Text>
            <Text size={0} muted>
              out of 100
            </Text>
          </Stack>
        </Flex>
        {skippedPoints > 0 ? (
          <Text size={1}>
            {skippedPoints} points worth of checks did not apply to this page and were left out of the
            score rather than counted against it.
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Flex gap={3} align="flex-start">
        <Badge tone={STATUS_TONE[check.status]} fontSize={0} mode="outline">
          {STATUS_MARK[check.status]}
        </Badge>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              {check.label}
            </Text>
            {check.weight > 0 && check.status !== 'skipped' ? (
              <Text size={0} muted>
                {check.earned}/{check.weight}
              </Text>
            ) : null}
          </Flex>
          <Text size={1} muted>
            {check.detail}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

/**
 * The SEO panel shown beside every page, post, client and event.
 *
 * Two halves. The on-page checks are computed from the document in front of you
 * and recompute as you type: nothing is fetched and nothing costs anything. The
 * Technical section comes from Google, collected once a day by a scheduled job
 * and cached, so opening this panel never waits on Google and no API key is
 * ever near the browser (ruleset 03, rule 7).
 *
 * How the published page performs in search lives on its own Search tab. It
 * reads the same cached record through useSeoAudit, but it answers a different
 * question: this panel is a checklist you act on while writing, that one is a
 * report on results you cannot change today.
 */
export const SeoPanel: UserViewComponent = function SeoPanel({ document, documentId, schemaType }) {
  const doc = useDebounced(document?.displayed, 400)
  const bandVars = useBandVars()

  const path = pathForDoc(schemaType?.name || '', (doc as any)?.slug?.current)

  // Shared with the Search tab, which reads the same stored record. The on-page
  // checks below need none of this: they recompute from the document as you
  // type and never wait on anything (ruleset 03, rules 10 and 11). The button
  // exists for the Google-sourced Technical section.
  const { audit, auditLoaded, rechecking, recheckNote, recheck } = useSeoAudit(path)

  const analysis = useMemo(() => {
    try {
      return analyseSeo(doc)
    } catch {
      return null
    }
  }, [doc])

  if (!analysis) {
    return (
      <Container width={1} paddingX={4} paddingY={5}>
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>This page could not be analysed yet. Add some content and it will appear.</Text>
        </Card>
      </Container>
    )
  }

  const { checks, readability, content, headingHints } = analysis

  // One issue list from all three sources (ruleset 03, rule 4). The staging
  // site is deliberately hidden from search engines, so the audits that fail
  // purely because of that are suppressed rather than repeated on every page.
  // indexingAllowed stays false: the whole staging site is hidden from search
  // engines by design until go live, so the audits that fail only because of
  // that are noise on every page. Flip this at go live.
  const allIssues = buildIssueList({
    lighthouseFailures: audit?.lighthouseFailures,
    search: audit || null,
    canonicalUrl: (doc as any)?.seo?.canonicalUrl,
    indexingAllowed: false,
  })
  const technicalIssues = allIssues.filter((i) => i.group === 'technical')
  // Search-group issues are shown on the Search tab, not here.
  const needsAttention = checks.filter((c) => c.status === 'fail' || c.status === 'warn')
  const passing = checks.filter((c) => c.status === 'pass')
  const skipped = checks.filter((c) => c.status === 'skipped')

  return (
    // Band colours defined at the top so the scores below resolve them.
    <Container width={1} paddingX={4} paddingY={5} style={bandVars}>
      <Stack space={5}>
        <ScoreHeader analysis={analysis} />

        <Card padding={3} radius={2} tone="transparent" border>
          <Flex gap={4} wrap="wrap">
            <Text size={1} muted>
              {content.wordCount} words
            </Text>
            <Text size={1} muted>
              {content.headings.length} headings
            </Text>
            <Text size={1} muted>
              {content.images.length} images
            </Text>
            <Text size={1} muted>
              {content.links.length} links
            </Text>
          </Flex>
        </Card>

        {/* The same fallbacks the page itself uses (app/lib/pageMeta.ts), so this
            shows what would actually appear rather than what is typed into the
            two boxes. A preview that ignored the fallbacks would show an empty
            title on every page that relies on its heading. */}
        <SerpPreview
          host={LIVE_HOST}
          path={path || '/'}
          siteName={SITE_NAME}
          title={(doc as any)?.seo?.title || (doc as any)?.title || ''}
          description={(doc as any)?.seo?.metaDescription || (doc as any)?.excerpt || ''}
        />

        {needsAttention.length > 0 ? (
          <Section
            title="Worth fixing"
            subtitle="Ordered roughly by how much difference each one makes."
          >
            <Stack space={2}>
              {needsAttention.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : (
          <Card padding={4} radius={2} tone="positive" border>
            <Text size={1}>Every check on this page passes. Nothing needs attention.</Text>
          </Card>
        )}

        <Section
          title="Readability"
          subtitle="Advisory. These are habits that make copy harder to read, not rules."
        >
          <Stack space={3}>
            <Card padding={3} radius={2} tone={BAND_TONE[readability.band] || 'default'} border>
              <Flex align="center" gap={3}>
                <Text size={2} weight="bold">
                  {readability.score}
                </Text>
                <Text size={1} weight="semibold" style={{ textTransform: 'capitalize' }}>
                  {readability.band}
                </Text>
                <Text size={0} muted>
                  {readability.sentenceCount} sentences
                </Text>
              </Flex>
            </Card>

            {readability.flags.length === 0 ? (
              <Text size={1} muted>
                Nothing flagged.
              </Text>
            ) : (
              <Stack space={2}>
                {readability.flags.slice(0, 12).map((f, i) => (
                  <Card key={`${f.type}-${i}`} padding={3} radius={2} tone="transparent" border>
                    <Stack space={2}>
                      <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {f.type.replace(/-/g, ' ')}
                      </Text>
                      <Text size={1}>{f.detail}</Text>
                      <Box>
                        <Text size={1} muted style={{ fontStyle: 'italic' }}>
                          “{f.text}”
                        </Text>
                      </Box>
                    </Stack>
                  </Card>
                ))}
                {readability.flags.length > 12 ? (
                  <Text size={0} muted>
                    and {readability.flags.length - 12} more.
                  </Text>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Section>

        {headingHints.length > 0 ? (
          <Section title="Headings">
            <Stack space={2}>
              {headingHints.map((h) => (
                <Card key={h} padding={3} radius={2} tone="caution" border>
                  <Text size={1}>{h}</Text>
                </Card>
              ))}
            </Stack>
          </Section>
        ) : null}

        {/* Renders nothing unless a key is configured (ruleset 05, rule 20). */}
        <SuggestControls
          documentId={documentId}
          documentType={schemaType?.name || ''}
          title={(doc as any)?.title}
          keyword={(doc as any)?.seo?.focusKeyword}
          prose={analysis.content.text}
          paragraphs={analysis.content.paragraphs}
        />

        <Section
          title="Technical"
          subtitle="From Google's own page test, refreshed once a day. These are things about how the page is built rather than what it says."
        >
          {!path ? (
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1} muted>Give this page an address and Google can start checking it.</Text>
            </Card>
          ) : !auditLoaded ? (
            <Text size={1} muted>Loading</Text>
          ) : !audit ? (
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1} muted>
                Google has not checked this page yet. It is picked up automatically within a few days,
                or press Check with Google below.
              </Text>
            </Card>
          ) : (
            <Stack space={3}>
              <Flex gap={4} wrap="wrap">
                {[
                  ['SEO', audit.lighthouseSeoScore],
                  ['Accessibility', audit.lighthouseAccessibilityScore],
                  ['Best practices', audit.lighthouseBestPracticesScore],
                ].map(([label, value]) => (
                  <Text key={String(label)} size={1} muted>
                    {label}:{' '}
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          value == null
                            ? undefined
                            : Number(value) >= 90
                              ? BAND_VAR.good
                              : Number(value) >= 50
                                ? BAND_VAR['needs-improvement']
                                : BAND_VAR.poor,
                      }}
                    >
                      {value == null ? 'no data' : `${value}/100`}
                    </span>
                  </Text>
                ))}
              </Flex>
              {technicalIssues.length === 0 ? (
                <Card padding={3} radius={2} tone="positive" border>
                  <Text size={1}>Nothing technical is failing on this page.</Text>
                </Card>
              ) : (
                <Stack space={2}>
                  {technicalIssues.map((i) => (
                    <IssueRow key={i.id} issue={i} />
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Section>

        <Flex align="center" gap={3}>
          <Button
            text={rechecking ? 'Checking' : 'Check with Google'}
            mode="ghost"
            disabled={rechecking || !path}
            onClick={recheck}
          />
          {audit?.fetchedAt ? (
            <Text size={0} muted>Last checked {timeAgo(audit.fetchedAt)}</Text>
          ) : null}
          {recheckNote ? <Text size={0} muted>{recheckNote}</Text> : null}
        </Flex>

        {passing.length > 0 ? (
          <Section title={`Passing (${passing.length})`}>
            <Stack space={2}>
              {passing.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : null}

        {skipped.length > 0 ? (
          <Section title={`Not applicable (${skipped.length})`}>
            <Stack space={2}>
              {skipped.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : null}
      </Stack>
    </Container>
  )
}
