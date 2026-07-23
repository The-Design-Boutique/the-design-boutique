import { type SchemaTypeDefinition } from 'sanity'

// Documents
import { page } from './documents/page'

// Singletons
import { siteSettings } from './singletons/siteSettings'
import { navigation } from './singletons/navigation'

// Shared objects
import { seoFields } from './objects/seoFields'
import { link } from './objects/link'
import { sectionSettings } from './objects/sectionSettings'
import { imageWithAlt } from './objects/imageWithAlt'

/** Document type names that are singletons (one instance, pinned in the desk). */
export const SINGLETONS = ['siteSettings', 'navigation'] as const

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    page,
    // singletons
    siteSettings,
    navigation,
    // shared objects
    seoFields,
    link,
    sectionSettings,
    imageWithAlt,
  ],
}
