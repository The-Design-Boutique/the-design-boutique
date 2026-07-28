import { buildLegacyTheme } from 'sanity'

/**
 * A warm, quiet theme for the Studio.
 *
 * The first attempt used the website's own palette: a stark near-black with a
 * bright orange. That is right for the site, where it sits behind photography
 * and large type, and wrong for an editor, where it is the background to hours
 * of reading and every panel edge reads as a hard line.
 *
 * These are warm neutrals instead, from angelomarasa.com: paper rather than
 * white, ink rather than black. The difference is small in hex and large on
 * screen, because a warm grey recedes where a pure one glares. The orange is
 * within a few degrees of the brand's own, so it still reads as the same
 * family.
 *
 * Restrained on purpose. Everything that carries meaning is left alone: green
 * still means success, amber still means caution, red still means something is
 * wrong. Recolouring those to fit a palette would make a warning look like
 * decoration, which is the one thing an editor must not do.
 *
 * Built with buildLegacyTheme because it is the documented, supported surface.
 * The client's developers inherit this, and a hand-rolled theme is the kind of
 * thing that breaks quietly on an upgrade.
 */

const paper = {
  /** Warm off-white, the main surface. */
  base: '#f4f0e8',
  /** One step down, for panels and wells. */
  sunk: '#ece7dc',
} as const

const ink = {
  /** Warm near-black. Never pure black: it glares against paper. */
  base: '#17140f',
  soft: '#35302b',
  muted: '#5f584c',
} as const

/**
 * The neutral that Sanity derives every hairline from.
 *
 * Chosen by measurement rather than eye. Sanity's own default puts its borders
 * at 1.27 contrast against the page, which is the reference for how a clean
 * interface should feel: present, not drawn on. Using the muted ink here gave
 * 1.84, which reads as boxy, every panel outlined. This lands at 1.29.
 *
 * It costs nothing in legibility: this token drives chrome, not text, and body
 * copy stays at 11.5 against the page either way, comfortably past the 4.5 the
 * guidelines ask for and slightly better than Sanity's default.
 */
const hairline = '#b5ae9f'

/** Molten orange, a little deeper than the site's, which suits a dense UI. */
const accent = '#e4471b'

/**
 * Signal colours, kept conventional and taken from the same palette so they sit
 * beside the neutrals rather than shouting over them.
 */
const signal = {
  ok: '#2f6b3d',
  warn: '#b07d18',
  bad: '#b3241a',
} as const

export const tdbTheme = buildLegacyTheme({
  '--black': ink.base,
  '--white': paper.base,

  '--gray': hairline,
  '--gray-base': hairline,

  // The lighter paper, not the sunk one. This value drives the main surface,
  // and setting it to the darker tone flattened the page and its panels into a
  // single shade with no edge between them. Sanity derives the panel shading
  // from here, so it wants the brightest surface, not the second brightest.
  '--component-bg': paper.base,
  '--component-text-color': ink.soft,

  // The accent, used for the things you are meant to press.
  '--brand-primary': accent,

  '--default-button-color': ink.muted,
  '--default-button-primary-color': accent,
  '--default-button-success-color': signal.ok,
  '--default-button-warning-color': signal.warn,
  '--default-button-danger-color': signal.bad,

  '--state-info-color': accent,
  '--state-success-color': signal.ok,
  '--state-warning-color': signal.warn,
  '--state-danger-color': signal.bad,

  // The top bar carries the logo and the workspace name, so it stays ink on
  // paper rather than becoming a slab of brand colour.
  '--main-navigation-color': ink.base,
  '--main-navigation-color--inverted': paper.base,

  '--focus-color': accent,
})
