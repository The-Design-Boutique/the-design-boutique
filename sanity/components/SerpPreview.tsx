'use client'

import { useState } from 'react'
import { Box, Card, Flex, Stack, Text } from '@sanity/ui'

/**
 * What this page would look like as a Google search result.
 *
 * The title and description fields are the only part of a page most people will
 * ever see, and they are written in two small boxes with no sense of how they
 * sit together. This shows them assembled, updating as they are typed, which is
 * the point at which "60 characters" stops being an abstract limit.
 *
 * On the styling: this deliberately ignores the Studio's light and dark themes
 * and always renders as Google does, on white, in Arial. Everywhere else in this
 * Studio follows Sanity's tokens; here the whole value is that it looks like the
 * thing it is imitating, in the same way an image preview shows the image rather
 * than a themed version of it. It is a picture of somewhere else.
 *
 * Truncation is done by the browser with line clamping at Google's real widths
 * rather than by counting characters, because a capital W and a lowercase l do
 * not take the same space and a character count is only ever a guess.
 */

/** Google's own colours, which is the point. Not Sanity tokens. */
const GOOGLE = {
  paper: '#ffffff',
  title: '#1a0dab',
  siteName: '#202124',
  url: '#4d5156',
  description: '#4d5156',
  faviconRing: '#dadce0',
} as const

type Device = 'desktop' | 'mobile'

/** Google shows the path as breadcrumbs, not as a raw address. */
function breadcrumb(host: string, path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts.length ? `${host} › ${parts.join(' › ')}` : host
}

export function SerpPreview({
  host,
  path,
  title,
  description,
  siteName,
}: {
  host: string
  path: string
  title: string
  description: string
  siteName: string
}) {
  const [device, setDevice] = useState<Device>('desktop')
  const isMobile = device === 'mobile'

  return (
    <Stack space={3}>
      <Flex align="center" gap={2}>
        <Text size={1} weight="semibold">How this looks in Google</Text>
        <Box flex={1} />
        {(['desktop', 'mobile'] as Device[]).map((d) => (
          <Card
            key={d}
            padding={2}
            radius={2}
            tone={device === d ? 'primary' : 'transparent'}
            border
            onClick={() => setDevice(d)}
            style={{ cursor: 'pointer' }}
          >
            <Text size={0} weight={device === d ? 'semibold' : undefined}>
              {d === 'desktop' ? 'Desktop' : 'Phone'}
            </Text>
          </Card>
        ))}
      </Flex>

      <Card padding={4} radius={2} style={{ background: GOOGLE.paper }}>
        <div
          style={{
            // Google's result column is about 600px on a desktop and the full
            // width of a phone. The width is what decides where the text is cut,
            // so it is the width that has to be right.
            maxWidth: isMobile ? 400 : 600,
            fontFamily: 'arial, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: `1px solid ${GOOGLE.faviconRing}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: GOOGLE.siteName,
                flexShrink: 0,
              }}
            >
              {siteName.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: '18px', color: GOOGLE.siteName }}>{siteName}</div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: '18px',
                  color: GOOGLE.url,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {breadcrumb(host, path)}
              </div>
            </div>
          </div>

          <div
            style={{
              color: GOOGLE.title,
              fontSize: isMobile ? 18 : 20,
              lineHeight: isMobile ? '24px' : '26px',
              // Google wraps a title onto a second line on a phone and cuts it
              // on one line on a desktop.
              display: '-webkit-box',
              WebkitLineClamp: isMobile ? 2 : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 3,
            }}
          >
            {title || 'This page has no title yet'}
          </div>

          <div
            style={{
              color: GOOGLE.description,
              fontSize: 14,
              lineHeight: '22px',
              display: '-webkit-box',
              WebkitLineClamp: isMobile ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description || 'No description written. Google will take a sentence from the page instead.'}
          </div>
        </div>
      </Card>

      <Text size={0} muted>
        A close approximation, not a promise. Google rewrites the title on well over half of all
        results, and writes its own description whenever it thinks a different sentence answers the
        search better. What you write here is the strongest signal you can give it, not an
        instruction.
      </Text>
    </Stack>
  )
}
