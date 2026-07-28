'use client'

import { useMemo } from 'react'
import { Box, Button, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { buildIssueList } from '../../app/lib/seoIssues'
import { timeAgo } from '../../app/lib/timeAgo'
import { IssueRow, Section, pathForDoc, useSeoAudit } from './seoShared'

/**
 * What Google reports about this page, on its own tab.
 *
 * Separated from the SEO tab because the two answer different questions and are
 * read by different people at different times. The SEO tab is a checklist you
 * work through while writing, and it recomputes as you type. This is a report on
 * how the published page is actually doing in search, which changes once a day
 * and cannot be affected by anything you do in the next five minutes.
 *
 * Everything here describes the live thedesignboutique.com. The staging build is
 * deliberately hidden from Google, so it has no search presence of its own and
 * measuring it would return nothing.
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
            <Stack space={3}>
              <Flex gap={4} wrap="wrap">
                <Text size={1} muted>Clicks: <strong>{audit.clicks ?? 0}</strong></Text>
                <Text size={1} muted>Impressions: <strong>{audit.impressions ?? 0}</strong></Text>
                {audit.position ? (
                  <Text size={1} muted>Average position: <strong>{audit.position.toFixed(1)}</strong></Text>
                ) : null}
                {audit.lastCrawledAt ? (
                  <Text size={1} muted>Last visited by Google {timeAgo(audit.lastCrawledAt)}</Text>
                ) : null}
              </Flex>

              {searchIssues.map((i) => (
                <IssueRow key={i.id} issue={i} />
              ))}

              {audit.topQueries?.length ? (
                <Stack space={2}>
                  <Text size={1} weight="semibold">What people searched to find this page</Text>
                  {audit.topQueries.slice(0, 5).map((q, n) => (
                    <Text key={n} size={1} muted>
                      {q.query} ({q.clicks} click{q.clicks === 1 ? '' : 's'}, position {q.position.toFixed(1)})
                    </Text>
                  ))}
                  <Text size={1} muted>
                    These will not add up to the totals above. Google keeps rare searches private, so
                    it counts them in the totals but will not tell anyone the words that were typed.
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
