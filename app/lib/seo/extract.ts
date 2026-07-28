/**
 * Turns a document value into the things the SEO checks need to look at:
 * prose, a heading outline, images and links.
 *
 * The checks run in the editor with no network round-trip (ruleset 05, rule 1),
 * so this has to work out what the rendered page *would* show using the raw
 * document alone. Three kinds of content carry that information:
 *
 *   Portable Text states its own structure: block styles give heading levels,
 *   markDefs give links, and image members sit inline.
 *
 *   Custom HTML sections (a handful of imported posts) carry real markup, so
 *   headings, images and links are read straight out of it.
 *
 *   Page-builder blocks carry structure by convention. This site renders
 *   `heroHome.headline` and `subpageBanner.title` as the page h1, and every
 *   other block's `heading` field as an h2 section heading. That holds across
 *   all 34 block components today. A new block that breaks the convention
 *   should be added to H1_FIELDS or H2_FIELDS here, not worked around in the
 *   checks themselves.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface ExtractedHeading {
  level: HeadingLevel
  text: string
}

export interface ExtractedImage {
  /** Empty string means the image has no alt text. */
  alt: string
  /** Where it came from, so the panel can tell the editor where to look. */
  origin: 'block' | 'richText' | 'html'
}

export interface ExtractedLink {
  kind: 'internal' | 'external'
  /** For internal references this is the referenced document id, not a path. */
  href: string
  label: string
}

export interface ExtractedContent {
  /** Visible paragraphs in document order. Headings are not included. */
  paragraphs: string[]
  headings: ExtractedHeading[]
  images: ExtractedImage[]
  links: ExtractedLink[]
  /** All visible prose including heading text, space joined. */
  text: string
  /** Lowercased words of `text`, punctuation stripped. */
  words: string[]
  wordCount: number
}

/** Block fields rendered as the page h1. */
const H1_FIELDS: Record<string, string> = {
  heroHome: 'headline',
  subpageBanner: 'title',
}

/** The field every other block renders as its h2 section heading. */
const H2_FIELD = 'heading'

/**
 * Document-level keys that are never page content: metadata, routing and
 * relationships. Everything else in the document is walked.
 */
const SKIP_KEYS = new Set([
  'seo',
  'slug',
  '_id',
  '_type',
  '_rev',
  '_key',
  '_createdAt',
  '_updatedAt',
  'categories',
  'author',
  'publishedAt',
])

const HEADING_STYLES: Record<string, HeadingLevel> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
}

function isPortableTextBlock(node: any): boolean {
  return node && node._type === 'block' && Array.isArray(node.children)
}

function isImageNode(node: any): boolean {
  return Boolean(node && node.asset && typeof node._type === 'string' && /image/i.test(node._type))
}

function blockText(node: any): string {
  return (node.children || [])
    .map((child: any) => (typeof child?.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

/** Decode the handful of entities that actually show up in imported markup. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&#8217;|&rsquo;/gi, '’')
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function attr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return m ? decodeEntities(m[2] ?? m[3] ?? '') : ''
}

/** Pull structure out of a custom HTML section. */
function readHtml(html: string, out: ExtractedContent): void {
  for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = stripTags(m[2])
    if (text) out.headings.push({ level: Number(m[1]) as HeadingLevel, text })
  }

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    out.images.push({ alt: attr(m[0], 'alt'), origin: 'html' })
  }

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(`<a ${m[1]}>`, 'href')
    if (!href) continue
    out.links.push({ kind: linkKind(href), href, label: stripTags(m[2]) })
  }

  // Body copy, with headings removed so they are not counted twice.
  const body = stripTags(html.replace(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi, ' '))
  if (body) out.paragraphs.push(body)
}

function linkKind(href: string): 'internal' | 'external' {
  if (/^(https?:)?\/\//i.test(href)) {
    return /thedesignboutique\.com/i.test(href) ? 'internal' : 'external'
  }
  if (/^(mailto:|tel:)/i.test(href)) return 'external'
  // Relative paths and anchors are on this site.
  return 'internal'
}

function readLinkObject(node: any, out: ExtractedContent): void {
  const label = typeof node.label === 'string' ? node.label : ''
  if (node.type === 'internal' || node.internal) {
    const ref = node.internal?._ref
    if (ref) out.links.push({ kind: 'internal', href: ref, label })
    return
  }
  if (typeof node.href === 'string' && node.href) {
    out.links.push({ kind: linkKind(node.href), href: node.href, label })
  }
}

function walk(node: any, out: ExtractedContent, depth: number): void {
  if (node == null || depth > 12) return

  if (Array.isArray(node)) {
    for (const item of node) walk(item, out, depth + 1)
    return
  }

  if (typeof node !== 'object') return

  const type = typeof node._type === 'string' ? node._type : ''

  // Portable Text.
  if (isPortableTextBlock(node)) {
    const text = blockText(node)
    if (text) {
      const level = HEADING_STYLES[node.style]
      if (level) out.headings.push({ level, text })
      else out.paragraphs.push(text)
    }
    // Links live on the block's markDefs.
    for (const def of node.markDefs || []) {
      if (def && (def._type === 'link' || typeof def.href === 'string')) readLinkObject(def, out)
    }
    return
  }

  if (isImageNode(node)) {
    out.images.push({
      alt: typeof node.alt === 'string' ? node.alt : '',
      origin: type === 'imageWithAlt' ? 'richText' : 'block',
    })
    // Images can still hold nested fields worth walking (captions, links).
  }

  if (type === 'link') {
    readLinkObject(node, out)
    return
  }

  if (type === 'bodyHtml' && typeof node.html === 'string') {
    readHtml(node.html, out)
    return
  }

  // Page-builder block headings, by the convention documented above.
  const h1Field = H1_FIELDS[type]
  if (h1Field && typeof node[h1Field] === 'string' && node[h1Field].trim()) {
    // Banner titles may carry an explicit line break; it is one heading.
    out.headings.push({ level: 1, text: node[h1Field].replace(/\s*\n\s*/g, ' ').trim() })
  } else if (typeof node[H2_FIELD] === 'string' && node[H2_FIELD].trim()) {
    out.headings.push({ level: 2, text: node[H2_FIELD].trim() })
  }

  for (const [key, value] of Object.entries(node)) {
    if (SKIP_KEYS.has(key)) continue
    if (key === h1Field || key === H2_FIELD) continue
    // The document's own title is the page heading, handled in extractContent.
    // Walking it as prose too would count it twice in the word total.
    if (depth === 0 && key === 'title') continue
    if (typeof value === 'string') {
      // Free-text fields on blocks are body copy. Short identifiers, urls and
      // enum-ish values are not prose and would skew the word count.
      if (isProse(key, value)) out.paragraphs.push(value.trim())
      continue
    }
    walk(value, out, depth + 1)
  }
}

/** Fields that hold sentences a reader sees, as opposed to settings or ids. */
const PROSE_KEYS =
  /^(text|body|copy|description|intro|excerpt|summary|content|blurb|quote|answer|question|title|subtitle|subheading|eyebrow|label|caption|name|role|frontTitle|frontText|backTitle|backText|value)$/i

function isProse(key: string, value: string): boolean {
  if (!PROSE_KEYS.test(key)) return false
  const v = value.trim()
  if (!v) return false
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(v)) return false
  return true
}

function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9'-]+/)
    .filter((w) => w && w !== '-' && w !== "'")
}

/**
 * Extract the visible content of a document.
 *
 * Pass the whole document value; `seo`, routing and relationship fields are
 * skipped so metadata is never mistaken for page copy.
 */
export function extractContent(doc: any): ExtractedContent {
  const out: ExtractedContent = {
    paragraphs: [],
    headings: [],
    images: [],
    links: [],
    text: '',
    words: [],
    wordCount: 0,
  }

  if (!doc || typeof doc !== 'object') return out

  // The document title is the h1 on types that have no banner block (posts,
  // case studies, events all render their own title).
  walk(doc, out, 0)

  if (!out.headings.some((h) => h.level === 1) && typeof doc.title === 'string' && doc.title.trim()) {
    out.headings.unshift({ level: 1, text: doc.title.trim() })
  }

  const all = [...out.headings.map((h) => h.text), ...out.paragraphs].join(' ')
  out.text = all.replace(/\s+/g, ' ').trim()
  out.words = toWords(out.text)
  out.wordCount = out.words.length
  return out
}

export const __testing = { stripTags, linkKind, toWords }
