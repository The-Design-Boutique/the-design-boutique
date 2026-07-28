'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { useDocumentOperation } from 'sanity'

/**
 * The optional Suggest control (ruleset 05, rules 20 and 21).
 *
 * Three rules shape everything here.
 *
 * It appears only when the server says a key is configured, so an editor is
 * never shown a button that would fail, and the Studio never learns the key: it
 * asks a yes-or-no question and gets a yes-or-no answer.
 *
 * Nothing is written automatically. A suggestion is shown, and it stays a
 * suggestion until somebody presses Use this. Drafting copy into a client's
 * page without being asked is the behaviour this rule exists to prevent.
 *
 * And every press costs the account holder money, which is why the draft is
 * shown once and reused rather than re-requested when someone changes their
 * mind about accepting it.
 */

interface Availability {
  available: boolean
  provider?: string
  model?: string
  reason?: string
}

type Task = 'title' | 'description'

/**
 * Where an accepted suggestion is written.
 *
 * The description field is `metaDescription`, not `description`. Getting this
 * wrong does not throw: the patch succeeds against a field nothing reads, so the
 * suggestion appears to save and then silently fails to appear anywhere. Checked
 * against the schema and the documents themselves rather than assumed.
 */
const FIELD_FOR_TASK: Record<Task, string> = {
  title: 'seo.title',
  description: 'seo.metaDescription',
}

const LABEL_FOR_TASK: Record<Task, string> = {
  title: 'search title',
  description: 'meta description',
}

export function SuggestControls({
  documentId,
  documentType,
  title,
  keyword,
  prose,
}: {
  documentId: string
  documentType: string
  title?: string
  keyword?: string
  prose?: string
}) {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [busy, setBusy] = useState<Task | null>(null)
  const [draft, setDraft] = useState<{ task: Task; text: string } | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // The published id, because that is what the operation expects; Sanity routes
  // the patch to the draft itself.
  const publishedId = documentId.replace(/^drafts\./, '')
  const { patch } = useDocumentOperation(publishedId, documentType)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seo/suggest')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setAvailability(d)
      })
      .catch(() => {
        // Silence rather than a wrong explanation. The feature simply does not
        // appear, which is its default state anyway.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const ask = useCallback(
    async (task: Task) => {
      setBusy(task)
      setNote(null)
      setDraft(null)
      try {
        const res = await fetch('/api/seo/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, title, keyword, prose }),
        })
        const body = await res.json().catch(() => null)
        if (body?.ok && body.suggestion) setDraft({ task, text: body.suggestion })
        else setNote(body?.reason || 'The suggestion could not be produced.')
      } catch {
        setNote('Could not reach the server.')
      } finally {
        setBusy(null)
      }
    },
    [title, keyword, prose],
  )

  const accept = useCallback(() => {
    if (!draft) return
    patch.execute([{ set: { [FIELD_FOR_TASK[draft.task]]: draft.text } }])
    setNote(`Put into the ${LABEL_FOR_TASK[draft.task]} field. It is a draft until you publish.`)
    setDraft(null)
  }, [draft, patch])

  // Rule 20: the control does not exist unless a key does.
  if (!availability?.available) return null

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">Suggest a title or description</Text>
          <Text size={0} muted>
            Drafts copy from what is already on this page, using {availability.model}. Nothing is
            written until you press Use this, and each suggestion costs the account holding the API
            key a fraction of a cent.
          </Text>
        </Stack>

        <Flex gap={2} wrap="wrap">
          <Button
            text={busy === 'title' ? 'Writing' : 'Suggest a title'}
            mode="ghost"
            fontSize={1}
            disabled={Boolean(busy)}
            onClick={() => ask('title')}
          />
          <Button
            text={busy === 'description' ? 'Writing' : 'Suggest a description'}
            mode="ghost"
            fontSize={1}
            disabled={Boolean(busy)}
            onClick={() => ask('description')}
          />
        </Flex>

        {draft ? (
          <Card padding={3} radius={2} tone="primary" border>
            <Stack space={3}>
              <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suggested {LABEL_FOR_TASK[draft.task]} &middot; {draft.text.length} characters
              </Text>
              <Text size={1}>{draft.text}</Text>
              <Flex gap={2}>
                <Button text="Use this" tone="primary" fontSize={1} onClick={accept} />
                <Button text="Discard" mode="ghost" fontSize={1} onClick={() => setDraft(null)} />
              </Flex>
            </Stack>
          </Card>
        ) : null}

        {note ? <Text size={0} muted>{note}</Text> : null}
      </Stack>
    </Card>
  )
}
