'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { analyseSeo, type CheckResult, type SeoAnalysis } from '../../app/lib/seo'

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

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

/**
 * The SEO panel shown beside every page, post, client and event.
 *
 * Everything here is computed from the document in front of you. Nothing is
 * fetched, nothing is sent anywhere, and it costs nothing to run, so it can
 * update as you type.
 */
export const SeoPanel: UserViewComponent = function SeoPanel({ document }) {
  const doc = useDebounced(document?.displayed, 400)

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
  const needsAttention = checks.filter((c) => c.status === 'fail' || c.status === 'warn')
  const passing = checks.filter((c) => c.status === 'pass')
  const skipped = checks.filter((c) => c.status === 'skipped')

  return (
    <Container width={1} paddingX={4} paddingY={5}>
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
