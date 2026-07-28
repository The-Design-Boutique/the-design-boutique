'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Container, Flex, Grid, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { buildIssueList } from '../../app/lib/seoIssues'
import { timeAgo } from '../../app/lib/timeAgo'
import { IssueRow, Section, pathForDoc, useSeoAudit, type Tone } from './seoShared'
import { liveSearchUrl } from '../../app/lib/seo/liveUrl'
import { INDEXNOW_ENGINES as INDEXNOW_ENGINE_NAMES } from '../../app/lib/indexNow'

/**
 * The live site, which is what Search Console reports on.
 *
 * The staging build is hidden from Google by design and has no search presence
 * of its own, so every link and figure on this tab refers to the published
 * WordPress site. At go live this becomes the same address as the site itself
 * and this constant can go.
 */
const LIVE_SITE = 'https://thedesignboutique.com/'

/**
 * A deep link into Google's own URL inspection screen for one page.
 *
 * There is deliberately no "submit for indexing" button here, because Google
 * does not offer one. The Search Console API is read only for inspection: its
 * published method list has no way to request indexing. The separate Indexing
 * API can do it, but Google restricts that to pages carrying JobPosting or
 * BroadcastEvent data, which none of these are, so using it would be outside
 * its terms (ruleset 03: never claim a capability the API does not have).
 *
 * What is left is removing the friction honestly. This opens Google's own
 * screen for this exact URL, where Request Indexing is one press.
 */
function inspectInSearchConsole(path: string): string {
  const url = liveSearchUrl(LIVE_SITE, path)
  return `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(LIVE_SITE)}&id=${encodeURIComponent(url)}`
}

/** Roughly where a position lands, in the terms people actually think in. */
function positionBand(position: number): { tone: Tone; label: string; page: number } {
  const page = Math.max(1, Math.ceil(position / 10))
  if (position <= 3) return { tone: 'positive', label: 'Top 3', page }
  if (position <= 10) return { tone: 'positive', label: 'Page 1', page }
  if (position <= 20) return { tone: 'caution', label: 'Page 2', page }
  return { tone: 'critical', label: `Page ${page}`, page }
}

/**
 * One headline number.
 *
 * The label sits above the figure rather than beside it, so four of these can be
 * scanned down a column of values without the eye hunting for where each number
 * begins.
 */
function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: Tone
}) {
  return (
    <Card padding={3} radius={2} tone={tone === 'default' ? 'transparent' : tone} border>
      <Stack space={2}>
        <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Text>
        <Text size={4} weight="semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Text>
        {hint ? (
          <Text size={0} muted>
            {hint}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

/**
 * How far from page one this page sits, as three segments.
 *
 * Built from toned cards rather than a drawn bar because a bar needs real colour
 * values, and hardcoding those is what breaks a panel the first time somebody
 * switches the Studio to light mode. Three segments carry the same meaning:
 * average position is a number nobody pictures, "page 4" is immediate.
 */
function PositionScale({ position }: { position: number }) {
  const { page } = positionBand(position)
  const segments: Array<{ label: string; active: boolean; tone: Tone }> = [
    { label: 'Page 1', active: page === 1, tone: 'positive' },
    { label: 'Page 2', active: page === 2, tone: 'caution' },
    { label: 'Page 3+', active: page >= 3, tone: 'critical' },
  ]
  return (
    <Stack space={2}>
      <Flex gap={1}>
        {segments.map((s) => (
          <Box key={s.label} flex={1}>
            <Card padding={2} radius={1} tone={s.active ? s.tone : 'transparent'} border={!s.active}>
              <Text size={0} align="center" weight={s.active ? 'semibold' : undefined} muted={!s.active}>
                {s.label}
              </Text>
            </Card>
          </Box>
        ))}
      </Flex>
      <Text size={0} muted>
        On average this page appears on page {page} of Google&rsquo;s results. Almost nobody looks past
        page one.
      </Text>
    </Stack>
  )
}

/** One search term, with its standing shown rather than described. */
function QueryRow({
  query,
  clicks,
  position,
}: {
  query: string
  clicks: number
  position: number
}) {
  const band = positionBand(position)
  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {query}
          </Text>
        </Box>
        {clicks > 0 ? (
          <Text size={0} muted style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {clicks} click{clicks === 1 ? '' : 's'}
          </Text>
        ) : null}
        <Badge tone={band.tone} fontSize={0} mode="outline" style={{ whiteSpace: 'nowrap' }}>
          {position.toFixed(1)}
        </Badge>
      </Flex>
    </Card>
  )
}

/**
 * What you can actually do about a page Google is not showing.
 *
 * Two routes, and they are not equivalent, so they are not presented as though
 * they are. Google is the one that matters and it is manual: Google publishes
 * no way for another program to request indexing, so the honest offering is a
 * link to their own screen plus the three steps to follow once there.
 *
 * IndexNow is genuinely automatic but reaches Bing, Yandex, Naver, Seznam, Yep
 * and Amazon, never Google. It is also only permitted for addresses on the host
 * that serves the key file, so while these figures describe the live WordPress
 * site it cannot be used at all. Rather than show a button that always fails,
 * the panel explains why it is unavailable and shows it once it works.
 */
function RequestIndexing({ path }: { path: string }) {
  const liveUrl = liveSearchUrl(LIVE_SITE, path)
  const [indexNow, setIndexNow] = useState<{
    ready: boolean
    host?: string
    engines?: readonly string[]
    reason?: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/indexnow')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setIndexNow(d)
      })
      .catch(() => {
        // Nothing said rather than a wrong explanation.
      })
    return () => {
      cancelled = true
    }
  }, [])

  let liveHost = ''
  try {
    liveHost = new URL(liveUrl).host
  } catch {
    liveHost = ''
  }
  const indexNowUsable = Boolean(indexNow?.ready && indexNow.host && indexNow.host === liveHost)

  const submit = useCallback(async () => {
    setSubmitting(true)
    setNote(null)
    try {
      const res = await fetch('/api/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [liveUrl] }),
      })
      const body = await res.json().catch(() => null)
      setNote(
        res.ok && body?.ok
          ? `Sent to ${(body.engines || []).join(', ')}. Google is not among them.`
          : body?.reason || 'The submission was not accepted.',
      )
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setSubmitting(false)
    }
  }, [liveUrl])

  const engines = (indexNow?.engines || INDEXNOW_ENGINE_NAMES).join(', ')

  // Why the button cannot be pressed, in the words of somebody who has to read
  // it. Null means it can. A disabled control with no explanation is the most
  // annoying thing an interface can do, so there is always a reason beside it.
  const disabledReason: string | null = !indexNow
    ? 'Checking whether this is available.'
    : !indexNow.ready
      ? 'This site has not been given an IndexNow key yet, so it cannot identify itself to the search engines.'
      : !indexNowUsable
        ? `The figures on this tab describe ${liveHost || 'the live site'}, but this preview lives at a different address (${indexNow.host}). IndexNow only accepts addresses belonging to the site doing the asking, which is how it knows the request is genuine. When this build becomes ${liveHost || 'the live site'}, this turns on by itself.`
        : null

  return (
    <Stack space={4}>
      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={3}>
          <Text size={1} weight="semibold">Ask Google to look at this page</Text>
          <Text size={1} muted>
            Google finds new and changed pages by revisiting sites on its own schedule, which can take
            days or weeks. You can jump the queue by asking directly, and it is worth doing for a page
            like this one that Google has never picked up.
          </Text>
          <Text size={0} muted>
            There is no button here that can do it for you. Google deliberately offers no way for other
            software to make this request, so it has to be three presses in their own tool.
          </Text>
          <Box>
            <Button
              as="a"
              href={inspectInSearchConsole(path)}
              target="_blank"
              rel="noreferrer"
              text="Open this page in Search Console"
              mode="ghost"
              fontSize={1}
            />
          </Box>
          <Stack space={2}>
            <Text size={0} muted>
              <strong>1.</strong> The link opens Google Search Console at this exact address. Sign in
              with a Google account that has been given access to the site.
            </Text>
            <Text size={0} muted>
              <strong>2.</strong> Wait a few seconds while it says &ldquo;Retrieving data from Google
              index&rdquo;, then press <strong>Request Indexing</strong>.
            </Text>
            <Text size={0} muted>
              <strong>3.</strong> That is all. Close the tab. It is a request rather than a guarantee,
              it usually takes a few days, and asking repeatedly does not make it faster.
            </Text>
          </Stack>
        </Stack>
      </Card>

      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={3}>
          <Text size={1} weight="semibold">Tell the other search engines straight away</Text>
          <Text size={1} muted>
            IndexNow is a way of telling search engines the moment a page appears or changes, instead of
            waiting for them to come and look. Publish a page, and they hear about it in seconds rather
            than days.
          </Text>
          <Text size={1} muted>
            It does not include Google. Google chose not to take part, so this changes nothing about the
            figures above. It reaches {engines}.
          </Text>
          <Box>
            <Button
              text={submitting ? 'Sending' : 'Submit to IndexNow'}
              mode="ghost"
              fontSize={1}
              disabled={submitting || Boolean(disabledReason)}
              onClick={submit}
            />
          </Box>
          {disabledReason ? (
            <Text size={0} muted>
              <strong>Not available yet.</strong> {disabledReason}
            </Text>
          ) : null}
          {note ? <Text size={0} muted>{note}</Text> : null}
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * What Google reports about this page, on its own tab.
 *
 * Separated from the SEO tab because the two answer different questions and are
 * read at different moments. The SEO tab is a checklist you work through while
 * writing, and it recomputes as you type. This is a report on how the published
 * page is actually doing in search, which changes once a day and cannot be
 * affected by anything you do in the next five minutes.
 *
 * Everything here describes the live thedesignboutique.com. The staging build is
 * deliberately hidden from Google, so it has no search presence of its own.
 *
 * On the styling: every colour comes from Sanity's own tone system rather than a
 * hex value, so the panel follows the Studio into light or dark mode without a
 * second palette to maintain. Tones carry meaning only, never decoration, so
 * that a splash of amber always means the same thing.
 */
export const SearchPanel: UserViewComponent = function SearchPanel({ document, schemaType }) {
  const doc = document?.displayed as any
  const path = pathForDoc(schemaType?.name || '', doc?.slug?.current)
  const { audit, auditLoaded, rechecking, recheckNote, recheck, neverChecked } = useSeoAudit(path)

  const searchIssues = useMemo(
    () =>
      buildIssueList({
        lighthouseFailures: audit?.lighthouseFailures,
        search: audit || null,
        canonicalUrl: doc?.seo?.canonicalUrl,
        // The staging site is hidden from search engines on purpose, so audits
        // that fail only for that reason are noise on every page. Flip at go live.
        indexingAllowed: false,
      }).filter((i) => i.group === 'search'),
    [audit, doc?.seo?.canonicalUrl],
  )

  const clicks = audit?.clicks ?? 0
  const impressions = audit?.impressions ?? 0
  // The rate is the story on most pages here: plenty of impressions, no clicks,
  // which says the page is being shown and passed over. Neither raw number says
  // that on its own.
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : null
  const indexed = audit?.indexVerdict === 'PASS'

  return (
    <Container width={1} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Section
          title="Search presence"
          subtitle="What Google reports about this page on the live thedesignboutique.com, over the last 28 days. Refreshed once a day."
        >
          {!path ? (
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1} muted>Give this page an address and Google can start checking it.</Text>
            </Card>
          ) : !auditLoaded ? (
            <Text size={1} muted>Loading</Text>
          ) : neverChecked ? (
            // Distinct from "Search Console is not set up". Saying the latter
            // when a page is simply waiting its turn sends people to fix
            // something that is not broken.
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1} muted>
                This page has not been checked yet. Every page is picked up automatically within a few
                days, or press Check with Google below to do it now.
              </Text>
            </Card>
          ) : !audit?.indexVerdict && !audit?.searchConsoleError ? (
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1} muted>
                This page has been checked, but Search Console is not connected, so there are no
                search figures. Everything on the SEO tab works without it.
              </Text>
            </Card>
          ) : audit.searchConsoleError ? (
            <Card padding={3} radius={2} tone="caution" border>
              <Text size={1}>Google could not be reached for this page: {audit.searchConsoleError}</Text>
            </Card>
          ) : (
            <Stack space={4}>
              {/* The one thing to know, before any numbers. */}
              <Card padding={3} radius={2} tone={indexed ? 'positive' : 'caution'} border>
                <Flex align="center" gap={3} wrap="wrap">
                  <Badge tone={indexed ? 'positive' : 'caution'} fontSize={0} mode="outline">
                    {indexed ? 'In Google' : 'Not in Google'}
                  </Badge>
                  <Box flex={1}>
                    <Text size={1}>
                      {audit.indexStatus ||
                        (indexed ? 'This page is in Google.' : 'Google is not showing this page.')}
                    </Text>
                  </Box>
                  {audit.lastCrawledAt ? (
                    <Text size={0} muted style={{ whiteSpace: 'nowrap' }}>
                      Last visited {timeAgo(audit.lastCrawledAt)}
                    </Text>
                  ) : null}
                </Flex>
              </Card>

              {/* Sits beside the status rather than inside it: these are two
                  bordered cards of their own, and nesting them in the toned
                  status card made the whole thing read as one heavy block. */}
              {!indexed && path ? <RequestIndexing path={path} /> : null}

              <Grid columns={[2, 2, 4]} gap={2}>
                <Stat label="Clicks" value={String(clicks)} hint="Visits from a search" />
                <Stat label="Impressions" value={String(impressions)} hint="Times it was shown" />
                <Stat
                  label="Click rate"
                  value={ctr === null ? 'n/a' : `${ctr.toFixed(1)}%`}
                  hint={ctr === null ? 'Nothing shown yet' : 'Shown, then clicked'}
                  tone={ctr !== null && impressions >= 50 && ctr < 1 ? 'caution' : 'default'}
                />
                <Stat
                  label="Avg position"
                  value={audit.position ? audit.position.toFixed(1) : 'n/a'}
                  hint={audit.position ? positionBand(audit.position).label : undefined}
                  tone={audit.position ? positionBand(audit.position).tone : 'default'}
                />
              </Grid>

              {audit.position ? <PositionScale position={audit.position} /> : null}

              {searchIssues.map((i) => (
                <IssueRow key={i.id} issue={i} />
              ))}

              {audit.topQueries?.length ? (
                <Stack space={3}>
                  <Stack space={1}>
                    <Text size={1} weight="semibold">What people searched to find this page</Text>
                    <Text size={0} muted>
                      The badge is the average position for that search.
                    </Text>
                  </Stack>
                  <Stack space={2}>
                    {audit.topQueries.slice(0, 5).map((q, n) => (
                      <QueryRow key={n} query={q.query} clicks={q.clicks} position={q.position} />
                    ))}
                  </Stack>
                  <Text size={0} muted>
                    These will not add up to the totals above. Google keeps rare searches private, so it
                    counts them in the totals but will not say what was typed.
                  </Text>
                </Stack>
              ) : (
                <Text size={1} muted>
                  No search terms to show. Either nobody has found this page through a search in the
                  last 28 days, or the few who did typed something Google keeps private.
                </Text>
              )}
            </Stack>
          )}
        </Section>

        <Box>
          <Flex align="center" gap={3} wrap="wrap">
            <Button
              text={rechecking ? 'Checking' : 'Check with Google'}
              mode="ghost"
              disabled={rechecking || !path}
              onClick={recheck}
            />
            {audit?.fetchedAt ? <Text size={0} muted>Last checked {timeAgo(audit.fetchedAt)}</Text> : null}
            {recheckNote ? <Text size={0} muted>{recheckNote}</Text> : null}
          </Flex>
        </Box>
      </Stack>
    </Container>
  )
}
