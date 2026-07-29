'use client'

import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Flex, Stack, Text } from '@sanity/ui'
import { set, useFormValue, type StringInputProps } from 'sanity'

/**
 * The alternative text field, with a button that looks at the picture.
 *
 * This is the one suggestion that cannot be drafted from the page's words. The
 * model is sent the image itself, so what comes back describes what is actually
 * in the photograph rather than what the surrounding copy implies.
 *
 * It exists because of a number: the content audit found 78 images across 18
 * pages with no alternative text at all. Writing 78 descriptions by hand is the
 * sort of job that never reaches the top of anybody's list, and every one of
 * them is a person using a screen reader getting nothing, and a search engine
 * seeing a blank.
 *
 * As everywhere else, nothing is written until somebody presses the button, and
 * what lands in the field is editable text like any other.
 */

interface Availability {
  available: boolean
}

export function AltTextInput(props: StringInputProps) {
  const { onChange, value, path } = props

  // The alt field sits inside the image object, so the parent holds the asset.
  const parentPath = path.slice(0, -1)
  const parent = useFormValue(parentPath) as { asset?: { _ref?: string } } | undefined
  const docTitle = useFormValue(['title']) as string | undefined

  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/seo/suggest')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Availability | null) => {
        if (!cancelled && d) setAvailable(Boolean(d.available))
      })
      .catch(() => {
        // Quiet. The button simply does not appear, which is its default state.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const describe = useCallback(async () => {
    const ref = parent?.asset?._ref
    if (!ref) {
      setNote('Upload an image first.')
      return
    }
    setBusy(true)
    setNote(null)
    try {
      // Turn the asset reference into the public URL the model can fetch.
      // image-<id>-<dimensions>-<format> is Sanity's documented asset id shape.
      const [, id, size, format] = ref.split('-')
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
      const imageUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${size}.${format}?w=900&fit=max&auto=format`

      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'alt', title: docTitle, imageUrl }),
      })
      const body = await res.json()
      if (body?.ok && body.suggestion) {
        onChange(set(body.suggestion))
        setNote('Written in. Edit it if it is not quite right.')
      } else {
        setNote(body?.reason || 'Could not describe this image.')
      }
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }, [parent, docTitle, onChange])

  return (
    <Stack space={3}>
      <Box>{props.renderDefault(props)}</Box>
      {available ? (
        <Flex align="center" gap={3} wrap="wrap">
          <Button
            text={busy ? 'Looking at the image' : value ? 'Suggest a different description' : 'Describe this image'}
            mode="ghost"
            fontSize={1}
            disabled={busy}
            onClick={describe}
          />
          {note ? (
            <Text size={0} muted>
              {note}
            </Text>
          ) : null}
        </Flex>
      ) : null}
    </Stack>
  )
}
