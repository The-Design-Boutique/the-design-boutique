'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Container, Flex, Heading, Spinner, Stack, Text, TextInput } from '@sanity/ui'
import { useClient, useCurrentUser } from 'sanity'
import { normalisePath, validateRedirect, type RedirectRecord } from '../../app/lib/redirects'

/**
 * The 404 monitor (SOW 2.5, ruleset 05 section 4, rule 15).
 *
 * Lists dead URLs by how often they are hit, with a box to type where each one
 * should go and a button to create the redirect. That is the whole loop: see
 * the 404, fix it in place, without leaving for another part of the Studio.
 */

interface NotFoundRow {
  path: string
  hits: number
  lastSeenAt?: string
  referrer?: string
  resolved: boolean
  ids: string[]
}

const ENTRIES_QUERY = `*[_type == "notFoundEntry"]{_id, path, count, day, referrer, lastSeenAt, resolved}`
const REDIRECTS_QUERY = `*[_type == "redirect"]{_id, fromPath, toPath, statusCode, enabled}`

function relative(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'in the last hour'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function NotFoundMonitor() {
  const client = useClient({ apiVersion: '2025-02-19' })
  const user = useCurrentUser()

  const [rows, setRows] = useState<NotFoundRow[] | null>(null)
  const [redirects, setRedirects] = useState<RedirectRecord[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showResolved, setShowResolved] = useState(false)

  const load = useCallback(async () => {
    const [entries, reds] = await Promise.all([
      client.fetch<Array<Record<string, unknown>>>(ENTRIES_QUERY),
      client.fetch<RedirectRecord[]>(REDIRECTS_QUERY),
    ])

    // Entries are stored per path per day; the monitor cares about the path.
    const byPath = new Map<string, NotFoundRow>()
    for (const e of entries) {
      const path = normalisePath(String(e.path || ''))
      if (!path || path === '/') continue
      const existing = byPath.get(path) || { path, hits: 0, resolved: false, ids: [] }
      existing.hits += Number(e.count || 0)
      existing.ids.push(String(e._id))
      existing.resolved = existing.resolved || Boolean(e.resolved)
      const seen = e.lastSeenAt ? String(e.lastSeenAt) : undefined
      if (seen && (!existing.lastSeenAt || seen > existing.lastSeenAt)) {
        existing.lastSeenAt = seen
        if (e.referrer) existing.referrer = String(e.referrer)
      }
      byPath.set(path, existing)
    }

    setRedirects(reds || [])
    setRows([...byPath.values()].sort((a, b) => b.hits - a.hits))
  }, [client])

  useEffect(() => {
    load().catch(() => setRows([]))
  }, [load])

  const create = useCallback(
    async (row: NotFoundRow) => {
      const target = (drafts[row.path] || '').trim()
      if (!target) return

      const check = validateRedirect(row.path, target, redirects)
      if (!check.ok) {
        setErrors((e) => ({ ...e, [row.path]: check.reason }))
        return
      }

      setBusy(row.path)
      setErrors((e) => ({ ...e, [row.path]: '' }))
      try {
        await client.create({
          _type: 'redirect',
          fromPath: row.path,
          targetType: 'path',
          toPath: /^https?:\/\//i.test(target) ? target : normalisePath(target),
          statusCode: 301,
          enabled: true,
          createdBy: user?.name || user?.email || 'the 404 monitor',
          notes: `Created from the 404 monitor after ${row.hits} hit${row.hits === 1 ? '' : 's'}.`,
          hitCount: 0,
        })
        // Mark every day's entry for this path as dealt with.
        let tx = client.transaction()
        for (const id of row.ids) tx = tx.patch(id, (p) => p.set({ resolved: true }))
        await tx.commit()
        setDrafts((d) => ({ ...d, [row.path]: '' }))
        await load()
      } catch (err) {
        setErrors((e) => ({ ...e, [row.path]: err instanceof Error ? err.message : 'Could not create the redirect.' }))
      } finally {
        setBusy(null)
      }
    },
    [client, drafts, redirects, user, load],
  )

  const visible = useMemo(() => (rows || []).filter((r) => showResolved || !r.resolved), [rows, showResolved])
  const unresolvedCount = (rows || []).filter((r) => !r.resolved).length

  if (rows === null) {
    return (
      <Container width={2} paddingX={4} paddingY={5}>
        <Flex align="center" gap={3}>
          <Spinner />
          <Text size={1} muted>
            Loading dead URLs
          </Text>
        </Flex>
      </Container>
    )
  }

  return (
    <Container width={2} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={2}>Dead links</Heading>
          <Text size={1} muted>
            Addresses people tried to reach that do not exist. The ones at the top are worth fixing
            first: each hit is a real visitor who hit a dead end. Type where the page should go and
            press Create redirect.
          </Text>
          <Text size={0} muted>
            Requests from bots and scanners are filtered out before they reach this list, so what you
            see here is worth reading.
          </Text>
        </Stack>

        {rows.length === 0 ? (
          <Card padding={4} radius={2} tone="positive" border>
            <Text size={1}>
              No dead links recorded. This fills in as visitors hit addresses that do not exist.
            </Text>
          </Card>
        ) : (
          <>
            <Flex align="center" gap={3}>
              <Badge tone={unresolvedCount ? 'caution' : 'positive'} fontSize={1}>
                {unresolvedCount} to fix
              </Badge>
              <Button
                mode="bleed"
                fontSize={1}
                text={showResolved ? 'Hide the ones already redirected' : 'Show the ones already redirected'}
                onClick={() => setShowResolved((v) => !v)}
              />
              <Button mode="bleed" fontSize={1} text="Refresh" onClick={() => load()} />
            </Flex>

            <Stack space={3}>
              {visible.map((row) => (
                <Card key={row.path} padding={4} radius={2} border tone={row.resolved ? 'transparent' : 'default'}>
                  <Stack space={3}>
                    <Flex align="center" gap={3} wrap="wrap">
                      <Badge tone={row.resolved ? 'positive' : row.hits > 20 ? 'critical' : 'caution'} fontSize={1}>
                        {row.hits} hit{row.hits === 1 ? '' : 's'}
                      </Badge>
                      <Text size={1} weight="semibold">
                        {row.path}
                      </Text>
                      {row.resolved ? (
                        <Badge tone="positive" mode="outline" fontSize={0}>
                          redirected
                        </Badge>
                      ) : null}
                    </Flex>

                    <Flex gap={3} wrap="wrap">
                      {row.lastSeenAt ? (
                        <Text size={0} muted>
                          Last tried {relative(row.lastSeenAt)}
                        </Text>
                      ) : null}
                      {row.referrer ? (
                        <Text size={0} muted>
                          Came from {row.referrer}
                        </Text>
                      ) : null}
                    </Flex>

                    {!row.resolved ? (
                      <Flex gap={2}>
                        <Box flex={1}>
                          <TextInput
                            placeholder="Where should this go? For example /services"
                            value={drafts[row.path] || ''}
                            disabled={busy === row.path}
                            onChange={(e) => setDrafts((d) => ({ ...d, [row.path]: e.currentTarget.value }))}
                          />
                        </Box>
                        <Button
                          text={busy === row.path ? 'Creating' : 'Create redirect'}
                          tone="primary"
                          disabled={!(drafts[row.path] || '').trim() || busy === row.path}
                          onClick={() => create(row)}
                        />
                      </Flex>
                    ) : null}

                    {errors[row.path] ? (
                      <Card padding={3} radius={2} tone="critical" border>
                        <Text size={1}>{errors[row.path]}</Text>
                      </Card>
                    ) : null}
                  </Stack>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  )
}
