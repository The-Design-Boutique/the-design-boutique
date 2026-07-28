'use client'

import { Flex, Text } from '@sanity/ui'

/**
 * The Design Boutique's mark in the Studio's top-left corner.
 *
 * Small thing, real effect: an editor logging in should see whose site this is
 * rather than a generic tool. It is the same mark the site uses, served from the
 * same place, so it cannot fall out of step with the site's own header.
 *
 * The wordmark is set in the Studio's own typeface rather than the brand's,
 * which is deliberate. Loading Signika only for a 20-pixel logo would mean a
 * webfont request on every Studio load, and the mark carries the brand
 * perfectly well on its own.
 */

const LOGO_URL =
  'https://cdn.sanity.io/images/inapmf9l/production/6b9d91cd73b9951a4ba1b6c4930d8362895e4dcf-253x252.png?h=48&fit=max&auto=format'

export function StudioLogo() {
  return (
    <Flex align="center" gap={2}>
      <img
        src={LOGO_URL}
        alt=""
        // Decorative: the title beside it already says the name, so a screen
        // reader announcing the logo as well would just repeat it.
        aria-hidden="true"
        width={24}
        height={24}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      <Text size={1} weight="semibold">
        The Design Boutique
      </Text>
    </Flex>
  )
}
