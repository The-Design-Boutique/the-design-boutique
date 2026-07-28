import imageUrlBuilder from '@sanity/image-url'
import { dataset, projectId } from '../env'

const builder = imageUrlBuilder({ projectId, dataset })

// Derive the source type from the builder so this stays correct across
// @sanity/image-url versions regardless of where the type is exported.
/**
 * Build a Sanity image URL.
 *
 * `auto('format')` is applied to everything: Sanity then serves WebP or AVIF to
 * browsers that accept them and the original format to those that do not. The
 * homepage was shipping a 1.1MB PNG that becomes a fraction of that as WebP,
 * for no visible difference. Callers can still override it.
 */
export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source).auto('format')
}
