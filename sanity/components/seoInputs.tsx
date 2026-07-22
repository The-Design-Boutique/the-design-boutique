'use client'

import { useMemo } from 'react'
import { Badge, Flex, Stack, Text } from '@sanity/ui'
import type { StringInputProps, TextInputProps } from 'sanity'

type Tone = 'default' | 'positive' | 'caution' | 'critical'

function lengthTone(len: number, warnAbove: number, criticalAbove: number): Tone {
  if (len === 0) return 'default'
  if (len > criticalAbove) return 'critical'
  if (len > warnAbove) return 'caution'
  return 'positive'
}

// Approximate the rendered width of a search-result title (Google renders
// titles at roughly 20px Arial; the SERP truncates around 580px).
function measurePixels(text: string): number {
  if (typeof document === 'undefined') return 0
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0
  ctx.font = '20px Arial'
  return Math.round(ctx.measureText(text).width)
}

/** SEO title input: character count plus an approximate SERP pixel width. */
export function SeoTitleInput(props: StringInputProps) {
  const value = props.value || ''
  const pixels = useMemo(() => measurePixels(value), [value])
  const charTone = lengthTone(value.length, 60, 70)
  const pixelTone: Tone =
    value.length === 0 ? 'default' : pixels > 580 ? 'critical' : pixels > 560 ? 'caution' : 'positive'

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Flex gap={2} align="center" wrap="wrap">
        <Badge tone={charTone} mode="outline" fontSize={0}>
          {value.length} chars
        </Badge>
        <Badge tone={pixelTone} mode="outline" fontSize={0}>
          {pixels}px / 580px
        </Badge>
        <Text size={1} muted>
          Aim for under ~60 characters so it does not get cut off in search results.
        </Text>
      </Flex>
    </Stack>
  )
}

/** Meta description input: character count against the recommended 50-160 range. */
export function MetaDescriptionInput(props: TextInputProps) {
  const value = props.value || ''
  const tooShort = value.length > 0 && value.length < 50
  const charTone: Tone = tooShort ? 'caution' : lengthTone(value.length, 160, 180)

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Flex gap={2} align="center" wrap="wrap">
        <Badge tone={charTone} mode="outline" fontSize={0}>
          {value.length} chars
        </Badge>
        <Text size={1} muted>
          Aim for 50 to 160 characters.
        </Text>
      </Flex>
    </Stack>
  )
}
