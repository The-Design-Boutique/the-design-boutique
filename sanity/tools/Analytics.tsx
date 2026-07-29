'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Box, Button, Card, Container, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui'

/**
 * What is actually happening on the site, without leaving the editor.
 *
 * Built because the team already lives in Looker Studio, and the useful half of
 * a Looker Studio report is a handful of numbers that fit on one screen. Putting
 * them here means the person editing a page can see how that page is doing
 * without a second login and a dashboard that takes a minute to load.
 *
 * Deliberately not a rebuild of Google Analytics. It answers five questions:
 * how many people, are they staying, where did they come from, what did they
 * read, and what did they do. Anything beyond that is better answered in
 * Analytics itself, and there is a link.
 *
 * Every figure carries the same period immediately before it. A number with no
 * comparison is nearly impossible to act on: 899 visits means nothing until you
 * know last month was 676.
 */

interface Metric {
  label: string
  value: number
  previous: number
  format?: 'number' | 'percent' | 'duration'
}
interface Row {
  label: string
  value: number
  secondary?: number
}
interface Summary {
  propertyId: string
  range: { days: number }
  metrics: Metric[]
  daily: Array<{ date: string; sessions: number }>
  channels: Row[]
  topPages: Row[]
  devices: Row[]
  keyEvents: Row[]
}

const RANGES = [7, 28, 90] as const

function formatValue(m: Metric): string {
  if (m.format === 'percent') return `${Math.round(m.value * 100)}%`
  if (m.format === 'duration') {
    const mins = Math.floor(m.value / 60)
    const secs = Math.round(m.value % 60)
    return mins ? `${mins}m ${secs}s` : `${secs}s`
  }
  return Math.round(m.value).toLocaleString()
}

/** The change as a sentence fragment, or nothing when there is no baseline. */
function change(m: Metric): { text: string; tone: 'positive' | 'critical' | 'default' } | null {
  if (!m.previous) return null
  const pct = (m.value / m.previous - 1) * 100
  if (Math.abs(pct) < 1) return { text: 'about the same', tone: 'default' }
  return {
    text: `${pct > 0 ? '+' : ''}${Math.round(pct)}%`,
    tone: pct > 0 ? 'positive' : 'critical',
  }
}

function MetricCard({ metric }: { metric: Metric }) {
  const delta = change(metric)
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={2}>
        <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {metric.label}
        </Text>
        <Text size={4} weight="semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatValue(metric)}
        </Text>
        {delta ? (
          <Flex align="center" gap={2}>
            <Badge tone={delta.tone} fontSize={0} mode="outline">{delta.text}</Badge>
            <Text size={0} muted>vs the period before</Text>
          </Flex>
        ) : (
          <Text size={0} muted>no earlier period to compare</Text>
        )}
      </Stack>
    </Card>
  )
}

/**
 * Visits per day.
 *
 * Drawn with plain elements rather than a charting library: it is one series of
 * about thirty values, and a dependency the client's developers have to carry
 * forever is a high price for a row of rectangles.
 */
function DailyChart({ daily }: { daily: Summary['daily'] }) {
  if (!daily.length) return null
  const peak = Math.max(...daily.map((d) => d.sessions), 1)
  const readable = (d: string) => `${d.slice(6, 8)}/${d.slice(4, 6)}`

  return (
    <Stack space={3}>
      <Flex align="flex-end" gap={1} style={{ height: 120 }}>
        {daily.map((d) => (
          <Box
            key={d.date}
            flex={1}
            title={`${readable(d.date)}: ${d.sessions} visits`}
            style={{
              height: `${Math.max((d.sessions / peak) * 100, 2)}%`,
              background: 'var(--card-accent-fg-color, currentColor)',
              opacity: 0.75,
              borderRadius: 2,
              minWidth: 2,
            }}
          />
        ))}
      </Flex>
      <Flex justify="space-between">
        <Text size={0} muted>{readable(daily[0].date)}</Text>
        <Text size={0} muted>busiest day: {peak} visits</Text>
        <Text size={0} muted>{readable(daily[daily.length - 1].date)}</Text>
      </Flex>
    </Stack>
  )
}

/** A ranked list with a bar, which reads faster than a column of numbers. */
function RankedList({
  rows,
  secondaryLabel,
}: {
  rows: Row[]
  secondaryLabel?: string
}) {
  if (!rows.length) return <Text size={1} muted>Nothing recorded in this period.</Text>
  const peak = Math.max(...rows.map((r) => r.value), 1)

  return (
    <Stack space={2}>
      {rows.map((r) => (
        <Box key={r.label}>
          <Flex align="center" gap={3}>
            <Box flex={1} style={{ minWidth: 0 }}>
              <Text size={1} textOverflow="ellipsis">{r.label}</Text>
            </Box>
            <Text size={1} weight="semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {r.value.toLocaleString()}
            </Text>
            {r.secondary !== undefined ? (
              <Text size={0} muted style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {r.secondary.toLocaleString()} {secondaryLabel}
              </Text>
            ) : null}
          </Flex>
          <Box
            marginTop={1}
            style={{
              height: 3,
              width: `${(r.value / peak) * 100}%`,
              background: 'currentColor',
              opacity: 0.25,
              borderRadius: 2,
            }}
          />
        </Box>
      ))}
    </Stack>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Stack space={3}>
      <Stack space={2}>
        <Heading size={1}>{title}</Heading>
        {subtitle ? <Text size={1} muted>{subtitle}</Text> : null}
      </Stack>
      {children}
    </Stack>
  )
}

export function Analytics() {
  const [days, setDays] = useState<number>(28)
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (range: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/summary?days=${range}`)
      const body = await res.json()
      if (body?.ok) setData(body.data)
      else setError(body?.reason || 'Could not read Analytics.')
    } catch {
      setError('Could not reach the server. If the Studio is running on its own there is nothing behind it to ask.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(days)
  }, [load, days])

  return (
    <Container width={2} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Flex align="flex-start" gap={3} wrap="wrap">
          <Stack space={3} flex={1}>
            <Heading size={2}>Analytics</Heading>
            <Text size={1} muted>
              The numbers worth looking at regularly, from Google Analytics. Every figure is compared
              with the same length of time immediately before it.
            </Text>
          </Stack>
          <Flex gap={1}>
            {RANGES.map((r) => (
              <Card
                key={r}
                padding={2}
                radius={2}
                tone={days === r ? 'primary' : 'transparent'}
                border
                onClick={() => setDays(r)}
                style={{ cursor: 'pointer' }}
              >
                <Text size={0} weight={days === r ? 'semibold' : undefined}>{r} days</Text>
              </Card>
            ))}
          </Flex>
        </Flex>

        {error ? (
          <Card padding={4} radius={2} tone="caution" border>
            <Text size={1}>{error}</Text>
          </Card>
        ) : null}

        {loading && !data ? (
          <Flex align="center" gap={3}>
            <Spinner muted />
            <Text size={1} muted>Reading Analytics</Text>
          </Flex>
        ) : null}

        {data ? (
          <>
            <Flex gap={2} wrap="wrap">
              {data.metrics.map((m) => (
                <Box key={m.label} flex={1} style={{ minWidth: 150 }}>
                  <MetricCard metric={m} />
                </Box>
              ))}
            </Flex>

            <Section title="Visits per day">
              <DailyChart daily={data.daily} />
            </Section>

            <Section
              title="Where people came from"
              subtitle="Direct means they typed the address or followed a bookmark. Organic Search means Google."
            >
              <RankedList rows={data.channels} secondaryLabel="people" />
            </Section>

            <Section title="Most read pages">
              <RankedList rows={data.topPages} secondaryLabel="people" />
            </Section>

            <Section title="What they used">
              <RankedList rows={data.devices} />
            </Section>

            <Section
              title="Things people did"
              subtitle="Actions marked as worth counting, such as sending an enquiry."
            >
              {data.keyEvents.length ? (
                <RankedList rows={data.keyEvents} />
              ) : (
                <Card padding={3} radius={2} tone="caution" border>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">Nothing is being counted as an action yet</Text>
                    <Text size={1}>
                      The site now tells Analytics when somebody sends a form or taps the phone number,
                      but no action has been marked as one that matters. Until that is done, this can
                      report how many people visited and not how many got in touch, which is usually
                      the number anybody actually wants.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Section>

            <Flex align="center" gap={3} wrap="wrap">
              <Button text={loading ? 'Refreshing' : 'Refresh'} mode="ghost" fontSize={1} disabled={loading} onClick={() => load(days)} />
              <Text size={0}>
                <a
                  href={`https://analytics.google.com/analytics/web/#/p${data.propertyId}/reports/intelligenthome`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google Analytics ↗
                </a>
              </Text>
              <Text size={0} muted>
                Analytics finishes counting a day a few hours after it ends, so today is never shown.
              </Text>
            </Flex>
          </>
        ) : null}
      </Stack>
    </Container>
  )
}
