'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { analyseAeo, type AeoCheck } from '../../app/lib/aeo'
import { Section, type Tone } from './seoShared'
import { FaqDrafter } from './FaqDrafter'

/**
 * AEO: whether this page is ready to be used in an AI answer.
 *
 * The framing at the top of this panel is not decoration, it is the honest
 * limit of the feature. Google publishes an API reporting impressions and
 * position, which is why the Search tab shows real numbers. ChatGPT, Perplexity,
 * Claude and Google's AI Overviews publish nothing equivalent: nobody can tell
 * you whether an assistant cited a page. Any product claiming to measure that is
 * guessing, and the SOW forbids us claiming a capability the sources do not
 * have.
 *
 * So this reports readiness, computed entirely from the page in front of you at
 * no cost and with no network call, and says plainly that it is readiness.
 */

const BAND_TONE: Record<string, Tone> = {
  good: 'positive',
  'needs work': 'caution',
  poor: 'critical',
}

const STATUS_TONE: Record<AeoCheck['status'], Tone> = {
  pass: 'positive',
  warn: 'caution',
  fail: 'critical',
  skipped: 'default',
}

const STATUS_MARK: Record<AeoCheck['status'], string> = {
  pass: '✓',
  warn: '!',
  fail: '✕',
  skipped: '–',
}

/** Further reading, written for people who are not developers. */
const EXPLAINER_URL = 'https://angelomarasa.com/blog/seo-aeo-geo-how-people-find-you-now'

function useDebounced<T>(value: T, ms: number): T {
  const [held, setHeld] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setHeld(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return held
}

function CheckRow({ check }: { check: AeoCheck }) {
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Flex gap={3} align="flex-start">
        <Badge tone={STATUS_TONE[check.status]} fontSize={0} mode="outline">
          {STATUS_MARK[check.status]}
        </Badge>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">{check.label}</Text>
            {check.weight > 0 && check.status !== 'skipped' ? (
              <Text size={0} muted>{check.earned}/{check.weight}</Text>
            ) : null}
          </Flex>
          <Text size={1} muted>{check.detail}</Text>
        </Stack>
      </Flex>
    </Card>
  )
}

export const AeoPanel: UserViewComponent = function AeoPanel({ document, documentId, schemaType }) {
  const doc = useDebounced(document?.displayed, 400) as any

  const analysis = useMemo(() => {
    try {
      const blocks: Array<{ _type?: string }> = doc?.pageBuilder || []
      return analyseAeo(doc, {
        documentType: schemaType?.name,
        hasAuthor: Boolean(doc?.author),
        hasDate: Boolean(doc?.publishedAt),
        schemaType: doc?.seo?.schemaType,
        hasFaqBlock: blocks.some((b) => b?._type === 'faqAccordion'),
      })
    } catch {
      return null
    }
  }, [doc, schemaType?.name])

  if (!analysis) {
    return (
      <Container width={1} paddingX={4} paddingY={5}>
        <Card padding={4} radius={2} tone="caution" border>
          <Text size={1}>This page could not be analysed yet. Add some content and it will appear.</Text>
        </Card>
      </Container>
    )
  }

  const failing = analysis.checks.filter((c) => c.status === 'fail' || c.status === 'warn')
  const passing = analysis.checks.filter((c) => c.status === 'pass')
  const skipped = analysis.checks.filter((c) => c.status === 'skipped')

  return (
    <Container width={1} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Card padding={4} radius={2} tone={BAND_TONE[analysis.band]} border>
          <Stack space={3}>
            <Flex align="center" gap={3}>
              <Text size={4} weight="bold">{analysis.score}</Text>
              <Stack space={2}>
                <Text size={1} weight="semibold" style={{ textTransform: 'capitalize' }}>
                  {analysis.band}
                </Text>
                <Text size={0} muted>ready to be quoted</Text>
              </Stack>
            </Flex>
          </Stack>
        </Card>

        <Card padding={3} radius={2} tone="transparent" border>
          <Stack space={3}>
            <Text size={1} weight="semibold">What this is, and what it is not</Text>
            <Text size={1} muted>
              People increasingly ask ChatGPT, Perplexity or Google&rsquo;s AI answers for a
              recommendation instead of scrolling a list of links. Those assistants read pages and
              quote from them, and a page that is easy to quote gets used more than one that is not.
            </Text>
            <Text size={1} muted>
              This score measures how quotable this page is. It cannot measure whether it was actually
              quoted, and neither can anything else: none of the assistants publish that information,
              the way Google publishes search figures on the Search tab. Anyone selling you a report
              on your AI visibility is estimating it.
            </Text>
            <Text size={0} muted>
              Further reading:{' '}
              <a href={EXPLAINER_URL} target="_blank" rel="noreferrer">
                SEO, AEO and GEO: how people find you now
              </a>
              , a plain-English explanation of the three and how they differ.
            </Text>
          </Stack>
        </Card>

        {failing.length > 0 ? (
          <Section title="Worth fixing" subtitle="Ordered by how much difference each one makes.">
            <Stack space={2}>
              {failing.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : (
          <Card padding={4} radius={2} tone="positive" border>
            <Text size={1}>Every check passes. This page is as quotable as we can make it from here.</Text>
          </Card>
        )}

        {/* Renders nothing unless the assistant is switched on. Sits here
            because the FAQ check is usually the first thing in the list above,
            and it is the hardest one to act on from a blank start. */}
        <FaqDrafter
          documentId={documentId}
          documentType={schemaType?.name || ''}
          title={doc?.title}
          keyword={doc?.seo?.focusKeyword}
          prose={analysis.content.text}
          hasFaq={analysis.checks.find((c) => c.id === 'faq')?.status === 'pass'}
        />

        {passing.length > 0 ? (
          <Section title={`Already good (${passing.length})`}>
            <Stack space={2}>
              {passing.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : null}

        {skipped.length > 0 ? (
          <Section title={`Does not apply (${skipped.length})`} subtitle="Left out of the score rather than counted against it.">
            <Stack space={2}>
              {skipped.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </Stack>
          </Section>
        ) : null}

        <Card padding={3} radius={2} tone="transparent" border>
          <Stack space={2}>
            <Text size={1} weight="semibold">One thing this page cannot control</Text>
            <Text size={1} muted>
              None of the above matters if the assistants are not allowed to read the site at all.
              That is set once for the whole site, and you can see exactly which ones are permitted
              under <strong>For Search Engines</strong> in the top menu.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
