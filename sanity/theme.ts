import { buildLegacyTheme } from 'sanity'

/**
 * The Studio in The Design Boutique's colours.
 *
 * The brand is a near-black ground, an off-white for text and a single orange
 * accent, taken from app/globals.css so the editor and the site it edits cannot
 * drift apart. Those values are the source of truth; if the site's palette
 * changes, change it there and mirror it here.
 *
 * Deliberately restrained. Everything that carries meaning in the Studio is left
 * alone: green still means success, amber still means caution, red still means
 * something is wrong. Only the neutrals and the brand accent are ours. Recolouring
 * the state colours to fit a palette would make a warning look like decoration,
 * which is the one thing an editor interface must not do.
 *
 * Built with buildLegacyTheme rather than a hand-rolled theme because it is the
 * documented, supported surface. The client's developers inherit this, and a
 * bespoke theme is something that breaks quietly on a Sanity upgrade.
 */

const tdb = {
  black: '#070707',
  dark: '#202020',
  gray: '#363636',
  offwhite: '#e3e3e3',
  white: '#ffffff',
  accent: '#f26722',
} as const

export const tdbTheme = buildLegacyTheme({
  '--black': tdb.black,
  '--white': tdb.white,

  '--gray': tdb.gray,
  '--gray-base': tdb.gray,

  '--component-bg': tdb.dark,
  '--component-text-color': tdb.offwhite,

  // The accent, used for the things you are meant to press.
  '--brand-primary': tdb.accent,

  '--default-button-color': tdb.gray,
  '--default-button-primary-color': tdb.accent,
  // Left as their conventional meanings on purpose. See the note above.
  '--default-button-success-color': '#3fa66a',
  '--default-button-warning-color': '#e0a13a',
  '--default-button-danger-color': '#d64a3d',

  '--state-info-color': tdb.accent,
  '--state-success-color': '#3fa66a',
  '--state-warning-color': '#e0a13a',
  '--state-danger-color': '#d64a3d',

  '--main-navigation-color': tdb.black,
  '--main-navigation-color--inverted': tdb.white,

  '--focus-color': tdb.accent,
})
