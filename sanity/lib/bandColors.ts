import type { CSSProperties } from 'react'
import { useColorSchemeValue } from 'sanity'

/**
 * The good / needs-improvement / poor colours, in a form that survives a theme
 * change.
 *
 * Google publishes one set of band colours and they are used verbatim across
 * its own tools, which is why they are worth keeping: an editor who has seen a
 * PageSpeed report recognises them without reading the label. The catch is that
 * they were picked for a white or near-black background, and this Studio is
 * neither by default.
 *
 * Measured against the warm paper background, the published colours give
 * contrast ratios of 1.84 (green), 1.75 (amber) and 2.88 (red). Text needs 4.5.
 * They were legible while the Studio was dark and became close to invisible the
 * day it was not, which is the sort of fault nobody reports and everybody works
 * around.
 *
 * So the hue is kept and the lightness is not. Each scheme gets the darkest or
 * lightest version of the same colour that clears 4.5 against that scheme's own
 * background, checked against the sunk card shade rather than the plain one
 * because that is the worse of the two.
 *
 * They are delivered as CSS custom properties rather than as values. Half of
 * these colours are used inside SVG and nested components, and threading a
 * palette down by prop would mean every one of those components takes an
 * argument it does not otherwise need. A custom property set once at the top of
 * a panel reaches all of them and keeps the call sites readable.
 */

/** The published Google values. Used as-is wherever the ground is dark. */
const DARK = { good: '#0cce6b', needs: '#ffa400', poor: '#ff4e42' }

/**
 * The same three hues, deepened until each clears 4.5 against paper. Ratios on
 * the sunk card shade, which is the darker of the two grounds: green 5.34,
 * amber 4.69, red 5.35.
 */
const LIGHT = { good: '#0a6b3f', needs: '#8f5a00', poor: '#b3241a' }

/**
 * How to refer to a band colour. Deliberately not the raw hex: the value
 * depends on a theme the component cannot see.
 *
 * Each carries the light value as a fallback, so a component rendered somewhere
 * that never set the properties still shows a readable colour rather than
 * falling back to black. The Studio opens on the light theme, so that is the
 * safer of the two to guess.
 */
export const BAND_VAR = {
  good: `var(--tdb-band-good, ${LIGHT.good})`,
  'needs-improvement': `var(--tdb-band-needs, ${LIGHT.needs})`,
  poor: `var(--tdb-band-poor, ${LIGHT.poor})`,
} as const

/**
 * The band custom properties for the scheme currently in force.
 *
 * Spread onto the style of a panel's outermost element. Everything inside it,
 * including SVG fills and strokes, then resolves BAND_VAR correctly, and the
 * values follow the editor if they switch the Studio between light and dark.
 */
export function useBandVars(): CSSProperties {
  const scheme = useColorSchemeValue()
  const band = scheme === 'dark' ? DARK : LIGHT

  // Cast because CSSProperties has no index signature for custom properties.
  return {
    '--tdb-band-good': band.good,
    '--tdb-band-needs': band.needs,
    '--tdb-band-poor': band.poor,
  } as CSSProperties
}
