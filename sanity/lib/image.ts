import imageUrlBuilder from '@sanity/image-url'
import { dataset, projectId } from '../env'

const builder = imageUrlBuilder({ projectId, dataset })

// Derive the source type from the builder so this stays correct across
// @sanity/image-url versions regardless of where the type is exported.
export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}
