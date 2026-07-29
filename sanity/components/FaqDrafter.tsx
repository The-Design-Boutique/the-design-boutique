'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { useDocumentOperation } from 'sanity'

/**
 * Drafts a set of questions and answers, and can put them on the page.
 *
 * This sits on the AEO tab because a question and answer section is the single
 * most quotable thing a page can carry, and "no FAQ" is the most commonly failed
 * check on this site. It is also the check that is hardest to act on, because
 * the work is not a setting, it is writing four questions from a blank start.
 *
 * The questions are drafted from what the page already says, and the prompt
 * forbids inventing prices, timescales or guarantees. Anything the page cannot
 * honestly answer is left out, so a thin page returns fewer questions rather
 * than four confident inventions.
 *
 * Nothing reaches the page until somebody presses Add to the page, and what
 * lands there is an ordinary FAQ block: editable, reorderable, deletable, with
 * no trace of how it was written.
 */

interface Faq {
  question: string
  answer: string
}

/** Sanity stores rich text as blocks, so a plain sentence has to be wrapped. */
function toPortableText(text: string, key: string) {
  return [
    {
      _type: 'block',
      _key: `${key}b`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
    },
  ]
}

export function FaqDrafter({
  documentId,
  documentType,
  title,
  keyword,
  prose,
  hasFaq,
}: {
  documentId: string
  documentType: string
  title?: string
  keyword?: string
  prose?: string
  hasFaq: boolean
}) {
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [faqs, setFaqs] = useState<Faq[] | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const publishedId = documentId.replace(/^drafts\./, '')
  const { patch } = useDocumentOperation(publishedId, documentType)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seo/suggest')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setAvailable(Boolean(d.available))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const draft = useCallback(async () => {
    setBusy(true)
    setNote(null)
    setFaqs(null)
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'faq', title, keyword, prose }),
      })
      const body = await res.json()
      if (body?.ok && body.faqs?.length) setFaqs(body.faqs)
      else setNote(body?.reason || 'No questions could be drafted.')
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }, [title, keyword, prose])

  const addToPage = useCallback(() => {
    if (!faqs?.length) return
    const stamp = Math.random().toString(36).slice(2, 8)
    patch.execute([
      {
        // Appended rather than inserted at a position, because where a FAQ
        // belongs on a page is a judgement call and dragging a block is easier
        // than undoing one that landed in the middle of something.
        insert: {
          after: 'pageBuilder[-1]',
          items: [
            {
              _type: 'faqAccordion',
              _key: `faq${stamp}`,
              heading: 'Frequently asked questions',
              faqs: faqs.map((f, i) => ({
                _type: 'faq',
                _key: `${stamp}q${i}`,
                question: f.question,
                answer: toPortableText(f.answer, `${stamp}a${i}`),
              })),
            },
          ],
        },
      },
    ])
    setNote('Added to the bottom of the page. It is a draft until you publish.')
    setFaqs(null)
  }, [faqs, patch])

  if (!available) return null

  return (
    <Card padding={3} radius={2} tone="transparent" border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            {hasFaq ? 'Draft more questions' : 'Draft a question and answer section'}
          </Text>
          <Text size={0} muted>
            Written from what this page already says. Anything the page cannot answer honestly is left
            out, so a thin page returns fewer questions rather than invented ones.
          </Text>
        </Stack>

        <Box>
          <Button
            text={busy ? 'Writing questions' : 'Draft questions'}
            mode="ghost"
            fontSize={1}
            disabled={busy}
            onClick={draft}
          />
        </Box>

        {faqs?.length ? (
          <Card padding={3} radius={2} tone="primary" border>
            <Stack space={3}>
              <Text size={0} muted style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {faqs.length} question{faqs.length === 1 ? '' : 's'} drafted
              </Text>
              {faqs.map((f, i) => (
                <Stack key={i} space={2}>
                  <Text size={1} weight="semibold">{f.question}</Text>
                  <Text size={1} muted>{f.answer}</Text>
                </Stack>
              ))}
              <Flex gap={2}>
                <Button text="Add to the page" tone="primary" fontSize={1} onClick={addToPage} />
                <Button text="Discard" mode="ghost" fontSize={1} onClick={() => setFaqs(null)} />
              </Flex>
            </Stack>
          </Card>
        ) : null}

        {note ? <Text size={0} muted>{note}</Text> : null}
      </Stack>
    </Card>
  )
}
