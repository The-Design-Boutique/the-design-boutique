'use client'

import { useCallback, useState } from 'react'
import { Box, Card, Checkbox, Code, Flex, Stack, Text } from '@sanity/ui'
import { useClient, useCurrentUser, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import { normalisePath } from '../../app/lib/redirects'

/**
 * Offers to create a 301 when a published page's address changes
 * (SOW 2.5, ruleset 05 section 4, rule 12).
 *
 * Changing the slug of a page that is already live breaks every existing link
 * to it, including the ones in Google's index. Catching that at the moment of
 * publishing is the only reliable time: afterwards, nobody remembers what the
 * old address was.
 *
 * Creating the redirect is the default and takes no extra clicks. Skipping it
 * is possible but has to be chosen deliberately, which is the way round the
 * ruleset asks for.
 */

/** Where each document type lives, mirroring the catch-all route. */
const PATH_PREFIX: Record<string, string> = {
  page: '',
  post: '',
  goldEvent: 'gold/',
  client: 'portfolio/',
}

function pathFor(type: string, slug: string): string | null {
  const prefix = PATH_PREFIX[type]
  if (prefix === undefined || !slug) return null
  // The home page is served from the root and must never be redirected away.
  if (type === 'page' && slug === 'home') return null
  return normalisePath(`/${prefix}${slug}`)
}

export function withRedirectPrompt(Original: DocumentActionComponent): DocumentActionComponent {
  const Wrapped: DocumentActionComponent = (props: DocumentActionProps) => {
    const original = Original(props)
    const client = useClient({ apiVersion: '2025-02-19' })
    const user = useCurrentUser()

    const [open, setOpen] = useState(false)
    const [makeRedirect, setMakeRedirect] = useState(true)
    const [working, setWorking] = useState(false)

    const published = props.published as { slug?: { current?: string } } | null
    const draft = props.draft as { slug?: { current?: string } } | null

    const oldSlug = published?.slug?.current
    const newSlug = draft?.slug?.current

    const oldPath = oldSlug ? pathFor(props.type, oldSlug) : null
    const newPath = newSlug ? pathFor(props.type, newSlug) : null
    const addressChanged = Boolean(oldPath && newPath && oldPath !== newPath)

    const confirm = useCallback(async () => {
      setWorking(true)
      try {
        if (makeRedirect && oldPath && newPath) {
          // Do not stack a second redirect on a path that already has one.
          const existing = await client.fetch<string | null>(
            `*[_type == "redirect" && fromPath == $from][0]._id`,
            { from: oldPath },
          )
          if (existing) {
            await client.patch(existing).set({ toPath: newPath, enabled: true, statusCode: 301 }).commit()
          } else {
            await client.create({
              _type: 'redirect',
              fromPath: oldPath,
              targetType: 'path',
              toPath: newPath,
              statusCode: 301,
              enabled: true,
              createdBy: user?.name || user?.email || 'a slug change',
              notes: `Created automatically when this page moved from ${oldPath} to ${newPath}.`,
              hitCount: 0,
            })
          }

          // Anything that used to point at the old path should now point at the
          // new one, so visitors never take two hops (rule 12, chain flattening).
          const inbound = await client.fetch<Array<{ _id: string }>>(
            `*[_type == "redirect" && toPath == $old && fromPath != $new]{_id}`,
            { old: oldPath, new: newPath },
          )
          if (inbound.length) {
            let tx = client.transaction()
            for (const r of inbound) tx = tx.patch(r._id, (p) => p.set({ toPath: newPath }))
            await tx.commit()
          }
        }
      } catch {
        // A failed redirect must not block publishing. The editor can add it by
        // hand, and the 404 monitor will surface the old path either way.
      } finally {
        setWorking(false)
        setOpen(false)
        original?.onHandle?.()
      }
    }, [client, makeRedirect, oldPath, newPath, user, original])

    if (!original || !addressChanged) return original

    return {
      ...original,
      onHandle: () => setOpen(true),
      dialog: open
        ? {
            type: 'confirm',
            tone: makeRedirect ? 'primary' : 'caution',
            confirmButtonText: working
              ? 'Publishing'
              : makeRedirect
                ? 'Create redirect and publish'
                : 'Publish anyway',
            cancelButtonText: 'Cancel',
            onConfirm: confirm,
            onCancel: () => setOpen(false),
            message: (
              <Stack space={4}>
                <Text size={1}>
                  Anyone who has bookmarked or linked to the old address will get a “page not found”
                  unless we send them on to the new one.
                </Text>

                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={3}>
                    <Box>
                      <Text size={0} muted>
                        Old address
                      </Text>
                      <Code size={1}>{oldPath}</Code>
                    </Box>
                    <Box>
                      <Text size={0} muted>
                        New address
                      </Text>
                      <Code size={1}>{newPath}</Code>
                    </Box>
                  </Stack>
                </Card>

                <Flex align="center" gap={3}>
                  <Checkbox
                    id="make-redirect"
                    checked={makeRedirect}
                    disabled={working}
                    onChange={(e) => setMakeRedirect(e.currentTarget.checked)}
                  />
                  <Text size={1} as="label" htmlFor="make-redirect">
                    Send visitors from the old address to the new one
                  </Text>
                </Flex>

                {!makeRedirect ? (
                  <Card padding={3} radius={2} tone="caution" border>
                    <Text size={1}>
                      Without this, the old address will show a “page not found” and any ranking it
                      had in Google will be lost. Only skip it if the old address was never public.
                    </Text>
                  </Card>
                ) : null}
              </Stack>
            ),
          }
        : undefined,
    }
  }

  Wrapped.action = Original.action
  Wrapped.displayName = 'PublishWithRedirect'
  return Wrapped
}
