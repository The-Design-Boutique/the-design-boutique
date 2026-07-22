import { type SchemaTypeDefinition } from 'sanity'

// Documents
import { page } from './documents/page'

// Shared objects
import { seoFields } from './objects/seoFields'
import { link } from './objects/link'
import { sectionSettings } from './objects/sectionSettings'
import { imageWithAlt } from './objects/imageWithAlt'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    page,
    // shared objects
    seoFields,
    link,
    sectionSettings,
    imageWithAlt,
  ],
}
