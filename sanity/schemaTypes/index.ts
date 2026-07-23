import { type SchemaTypeDefinition } from 'sanity'

// Documents
import { page } from './documents/page'
import { post } from './documents/post'
import { client } from './documents/client'
import { goldEvent } from './documents/goldEvent'
import { testimonial } from './documents/testimonial'
import { author } from './documents/author'
import { category } from './documents/category'
import { clientCategory } from './documents/clientCategory'

// Singletons
import { siteSettings } from './singletons/siteSettings'
import { navigation } from './singletons/navigation'

// Shared objects
import { seoFields } from './objects/seoFields'
import { link } from './objects/link'
import { sectionSettings } from './objects/sectionSettings'
import { imageWithAlt } from './objects/imageWithAlt'

// Page-builder blocks
import { blocks } from './blocks'

/** Document type names that are singletons (one instance, pinned in the desk). */
export const SINGLETONS = ['siteSettings', 'navigation'] as const

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // content documents
    page,
    post,
    client,
    goldEvent,
    testimonial,
    // taxonomies
    author,
    category,
    clientCategory,
    // singletons
    siteSettings,
    navigation,
    // shared objects
    seoFields,
    link,
    sectionSettings,
    imageWithAlt,
    // page-builder blocks
    ...blocks,
  ],
}
