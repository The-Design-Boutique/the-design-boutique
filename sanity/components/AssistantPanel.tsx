'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import type { UserViewComponent } from 'sanity/structure'
import { analyseSeo } from '../../app/lib/seo'
import { analyseAeo } from '../../app/lib/aeo'
import { Section, useDebounced } from './seoShared'
import { SuggestControls } from './SuggestControls'
import { FaqDrafter } from './FaqDrafter'

/**
 * Everything the writing assistant can do, in one place.
 *
 * These controls used to sit where the thing they fix is measured: the title
 * and description drafters under the SEO checks, the question and answer
 * drafter under the AEO checks. That was tidy reasoning and it was wrong in
 * practice. Both ended up several screens down a panel people scroll to the top
 * of and stop, so the feature was reported missing while it was working
 * perfectly, which is the most expensive kind of bug to have.
 *
 * So they are gathered here under their own tab. The cost is that a suggestion
 * is now one tab away from the check that prompted it. That is a smaller loss
 * than not being found at all.
 *
 * When no key is configured the tab does not disappear. Every other control in
 * this Studio renders nothing at all without a key, on the principle that an
 * offer you cannot accept is worse than no offer. A whole tab is different: a
 * tab that vanishes teaches nobody that the feature exists, so this one stays
 * and explains itself instead.
 */

interface Availability {
  available: boolean
  provider?: string
  model?: string
  reason?: string
}

/** What the assistant can do, shown whether or not it is switched on. */
const CAPABILITIES: Array<{ name: string; detail: string }> = [
  {
    name: 'A search title and description',
    detail:
      'Drafts the two lines that appear in Google, from what the page already says. Nothing is written into the page until you press Use this.',
  },
  {
    name: 'Image descriptions',
    detail:
      'Looks at the picture itself and describes it, for people using a screen reader and for search engines. This one lives on the image, not here: open any image and the button is beside the description field.',
  },
  {
    name: 'A question and answer section',
    detail:
      'Drafts four questions a customer would actually ask, answered from what the page says. It is told never to invent prices, timescales or guarantees, and returns fewer questions rather than confident inventions.',
  },
  {
    name: 'Shortening a paragraph',
    detail:
      'Takes the longest paragraph and says the same thing in fewer words. It deliberately does not write into the page: it copies, and you paste it in, because body copy is yours.',
  },
]

export const AssistantPanel: UserViewComponent = function AssistantPanel({
  document,
  documentId,
  schemaType,
}) {
  const doc = useDebounced(document?.displayed, 400) as any
  const [availability, setAvailability] = useState<Availability | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seo/suggest')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setAvailability(d)
      })
      .catch(() => {
        // Leave it unknown. The explanation below is the safe thing to show
        // when we cannot tell, since it is true either way.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const seo = useMemo(() => {
    try {
      return analyseSeo(doc)
    } catch {
      return null
    }
  }, [doc])

  const hasFaq = useMemo(() => {
    try {
      const blocks: Array<{ _type?: string }> = doc?.pageBuilder || []
      const aeo = analyseAeo(doc, {
        documentType: schemaType?.name,
        hasFaqBlock: blocks.some((b) => b?._type === 'faqAccordion'),
      })
      return aeo.checks.find((c) => c.id === 'faq')?.status === 'pass'
    } catch {
      return false
    }
  }, [doc, schemaType?.name])

  const on = availability?.available === true
  // Distinct from "off". Until the answer arrives we do not know, and telling
  // somebody their assistant is switched off when it is merely still loading is
  // how a working feature gets reported as missing.
  const stillChecking = availability === null

  return (
    <Container width={1} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Text size={2} weight="semibold">
            Writing assistant
          </Text>
          <Text size={1} muted>
            Optional help with the writing nobody gets round to. It only ever drafts: nothing reaches
            this page without you pressing a button, and the SEO score, the readability checks and
            everything else in the Studio work exactly the same whether this is on or off.
          </Text>
        </Stack>

        {stillChecking ? (
          <Card padding={3} radius={2} tone="transparent" border>
            <Text size={1} muted>
              Checking whether the assistant is switched on.
            </Text>
          </Card>
        ) : on ? (
          <Card padding={3} radius={2} tone="positive" border>
            <Text size={1}>
              Switched on, drafting with {availability?.model || 'the configured model'}. Each
              suggestion costs the account holding the API key a fraction of a cent.
            </Text>
          </Card>
        ) : (
          <Card padding={4} radius={2} tone="caution" border>
            <Stack space={4}>
              <Stack space={2}>
                <Text size={1} weight="semibold">
                  Not switched on
                </Text>
                <Text size={1}>
                  {availability?.reason ||
                    'No API key is saved, so nothing can be drafted and nothing is being billed to anybody.'}
                </Text>
              </Stack>

              <Stack space={3}>
                <Text size={1} weight="semibold">
                  To turn it on
                </Text>
                <Stack space={2}>
                  <Text size={1}>
                    1. Open <strong>Site Settings</strong> at the bottom of the menu on the left, then
                    the <strong>Writing assistant</strong> tab.
                  </Text>
                  <Text size={1}>
                    2. Turn on <strong>Turn the Suggest button on</strong>.
                  </Text>
                  <Text size={1}>
                    3. Choose a provider and paste in an API key from that account. The key is stored
                    encrypted and only its first few characters are ever shown again.
                  </Text>
                  <Text size={1}>4. Publish Site Settings, then come back to this tab.</Text>
                </Stack>
              </Stack>

              <Text size={1} muted>
                The key belongs to whoever creates it, and that account is billed. There is no charge
                from us and no charge at all until somebody presses one of these buttons.
              </Text>
            </Stack>
          </Card>
        )}

        <Section title="What it can do">
          <Stack space={2}>
            {CAPABILITIES.map((c) => (
              <Card key={c.name} padding={3} radius={2} tone="transparent" border>
                <Flex gap={3} align="flex-start">
                  <Box flex={1}>
                    <Stack space={2}>
                      <Text size={1} weight="semibold">
                        {c.name}
                      </Text>
                      <Text size={1} muted>
                        {c.detail}
                      </Text>
                    </Stack>
                  </Box>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Section>

        {on ? (
          <Section title="Draft something for this page">
            <Stack space={4}>
              {seo ? (
                <SuggestControls
                  documentId={documentId}
                  documentType={schemaType?.name || ''}
                  title={doc?.title}
                  keyword={doc?.seo?.focusKeyword}
                  prose={seo.content.text}
                  paragraphs={seo.content.paragraphs}
                />
              ) : (
                <Card padding={3} radius={2} tone="transparent" border>
                  <Text size={1} muted>
                    There is not enough on this page yet to draft from. Add some content and these
                    appear.
                  </Text>
                </Card>
              )}

              <FaqDrafter
                documentId={documentId}
                documentType={schemaType?.name || ''}
                title={doc?.title}
                keyword={doc?.seo?.focusKeyword}
                prose={seo?.content.text}
                hasFaq={hasFaq}
              />
            </Stack>
          </Section>
        ) : null}
      </Stack>
    </Container>
  )
}
