'use client'

import { useMemo } from 'react'
import { Badge, Box, Card, Code, Flex, Stack, Text } from '@sanity/ui'
import { useFormValue, type StringInputProps } from 'sanity'
import { buildJsonLd } from '../../app/lib/pageMeta'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The structured data dropdown, with a live preview of what the page will
 * actually publish underneath it.
 *
 * Structured data is invisible on the page itself, so without a preview an
 * editor has no way to tell whether their choice produced anything useful.
 * This renders the same output the live page emits, from the document being
 * edited, so it updates as the other SEO fields are filled in.
 */
export function SchemaTypeInput(props: StringInputProps) {
  const doc = useFormValue([]) as any

  const { json, note } = useMemo(() => {
    const chosen = props.value
    if (!chosen) {
      return { json: null, note: 'Choose a type above to see what this page will publish.' }
    }
    // Mirror what the page does, using whatever has been filled in so far.
    // The home page is served from the site root, not /home.
    const rawSlug = doc?.slug?.current
    const slug = rawSlug === 'home' ? '' : rawSlug
    const built = buildJsonLd(
      { ...doc, seo: { ...(doc?.seo || {}), schemaType: chosen } },
      { path: slug, siteDefaults: undefined },
    )
    if (!built) {
      return {
        json: null,
        note:
          chosen === 'FAQPage'
            ? 'Nothing will be published yet. Add at least one question and answer above, and the preview will appear here.'
            : 'Nothing will be published for this type yet.',
      }
    }
    // Drop empty values so the preview matches the published output exactly.
    return { json: JSON.stringify(built, (_k, v) => (v === undefined ? undefined : v), 2), note: null }
  }, [props.value, doc])

  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      <Card padding={3} radius={2} tone="transparent" border>
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <Badge tone="primary" mode="outline" fontSize={0}>
              Preview
            </Badge>
            <Text size={1} weight="semibold">
              What this page tells Google
            </Text>
          </Flex>

          <Text size={1} muted>
            This extra information is sent to search engines behind the scenes. Visitors never see
            it, but it helps Google understand what the page is and can earn richer search results.
          </Text>

          {note ? (
            <Card padding={3} radius={2} tone="caution">
              <Text size={1}>{note}</Text>
            </Card>
          ) : (
            <Box overflow="auto" style={{ maxHeight: 320 }}>
              <Code size={0} language="json">
                {json}
              </Code>
            </Box>
          )}

          <Text size={0} muted>
            Updates as you fill in the fields above. Blank fields are simply left out.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
